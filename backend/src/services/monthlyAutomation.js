import { sql } from "../config/db.js";
import { ensureMonthlyRolloverForUser } from "./monthlyRollover.js";

function toDate(value) {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function getMonthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getMonthStart(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

function getDateOnly(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizePresetAmount(preset) {
  const value = Number(preset?.amount ?? 0);
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return preset.sign > 0 ? Math.abs(value) : -Math.abs(value);
}

export async function runMonthlyAutomationForUser(userId, effectiveDate = new Date(), presets = []) {
  if (!userId) {
    return { alreadyProcessed: false, createdTransactions: [] };
  }

  const selectedDate = toDate(effectiveDate);
  const monthKey = getMonthKey(selectedDate);
  const transactionDate = getDateOnly(selectedDate);

  const automationLock = await sql`
    INSERT INTO monthly_automation_runs(user_id, month_key)
    VALUES (${userId}, ${monthKey})
    ON CONFLICT (user_id, month_key) DO NOTHING
    RETURNING month_key
  `;

  if (automationLock.length === 0) {
    return { alreadyProcessed: true, createdTransactions: [] };
  }

  const createdTransactions = [];

  const bankProfitPreset = presets.find((preset) => preset?.id === "bank_profit");
  const bankProfitPercent = Number(bankProfitPreset?.amount ?? 20);

  await ensureMonthlyRolloverForUser(userId, selectedDate, bankProfitPercent);

  for (const preset of presets) {
    if (!preset || preset.id === "bank_profit") {
      continue;
    }

    const normalizedAmount = normalizePresetAmount(preset);
    if (normalizedAmount === 0) {
      continue;
    }

    const transaction = await sql`
      INSERT INTO transactions(user_id, title, amount, category, created_at)
      VALUES (
        ${userId},
        ${preset.title},
        ${normalizedAmount},
        ${preset.category},
        ${transactionDate}
      )
      RETURNING *
    `;

    if (transaction[0]) {
      createdTransactions.push(transaction[0]);
    }
  }

  return {
    alreadyProcessed: false,
    monthKey,
    createdTransactions,
  };
}