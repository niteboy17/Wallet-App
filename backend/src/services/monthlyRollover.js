import { sql } from "../config/db.js";

function toDate(value) {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function formatDateOnly(value) {
  const date = toDate(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

export async function ensureMonthlyRolloverForUser(userId, effectiveDate = new Date(), bankProfitPercent = 20) {
  if (!userId) {
    return null;
  }

  const selectedDate = toDate(effectiveDate);
  const monthKey = getMonthKey(selectedDate);
  const monthStart = getMonthStart(selectedDate);
  const transactionDate = formatDateOnly(selectedDate);

  const previousBalanceResult = await sql`
    SELECT COALESCE(SUM(amount), 0) AS balance
    FROM transactions
    WHERE user_id = ${userId}
      AND created_at < ${monthStart}
  `;

  const previousBalance = Number(previousBalanceResult[0]?.balance ?? 0);
  if (previousBalance <= 0) {
    return null;
  }

  // Bank profit now comes from the saved percentage for the automation card.
  const resolvedPercent = Number(bankProfitPercent);
  if (!Number.isFinite(resolvedPercent) || resolvedPercent <= 0) {
    return null;
  }

  const profitAmount = Number(((previousBalance * resolvedPercent) / 100).toFixed(2));
  if (profitAmount <= 0) {
    return null;
  }

  const createdTransactions = await sql`
    WITH rollover_lock AS (
      INSERT INTO monthly_rollovers(user_id, month_key, balance_before, profit_amount)
      VALUES (${userId}, ${monthKey}, ${previousBalance}, ${profitAmount})
      ON CONFLICT (user_id, month_key) DO NOTHING
      RETURNING month_key
    )
    INSERT INTO transactions(user_id, title, amount, category, created_at)
    SELECT ${userId}, 'Bank Profit Income', ${profitAmount}, 'Bank Profit Income', ${transactionDate}
    WHERE EXISTS (SELECT 1 FROM rollover_lock)
    RETURNING *
  `;

  return createdTransactions[0] ?? null;
}

export async function ensureMonthlyRolloverForAllUsers(effectiveDate = new Date()) {
  const users = await sql`SELECT DISTINCT user_id FROM transactions`;

  for (const row of users) {
    await ensureMonthlyRolloverForUser(row.user_id, effectiveDate);
  }
}