import { sql } from "../config/db.js";
import { runMonthlyAutomationForUser } from "../services/monthlyAutomation.js";

function resolveAppDate(req) {
  const rawDate = req.headers["x-app-date"];
  const parsed = rawDate ? new Date(rawDate) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function toDateOnlyString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export async function getTransactionsByUserId(req, res) {
  try {
    const { userId } = req.params;

    const transactions = await sql`
        SELECT * FROM transactions WHERE user_id = ${userId} ORDER BY created_at DESC
      `;

    res.status(200).json(transactions);
  } catch (error) {
    console.log("Error getting the transactions", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createTransaction(req, res) {
  try {
    const { title, amount, category, user_id } = req.body;

    if (!title || !user_id || !category || amount === undefined) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const createdAt = toDateOnlyString(resolveAppDate(req));

    const transaction = await sql`
      INSERT INTO transactions(user_id,title,amount,category,created_at)
      VALUES (${user_id},${title},${amount},${category},${createdAt})
      RETURNING *
    `;

    console.log(transaction);
    res.status(201).json(transaction[0]);
  } catch (error) {
    console.log("Error creating the transaction", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteTransaction(req, res) {
  try {
    const { id } = req.params;

    if (isNaN(parseInt(id))) {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }

    const result = await sql`
      DELETE FROM transactions WHERE id = ${id} RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.log("Error deleting the transaction", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getSummaryByUserId(req, res) {
  try {
    const { userId } = req.params;

    const balanceResult = await sql`
      SELECT COALESCE(SUM(amount), 0) as balance FROM transactions WHERE user_id = ${userId}
    `;

    const incomeResult = await sql`
      SELECT COALESCE(SUM(amount), 0) as income FROM transactions
      WHERE user_id = ${userId} AND amount > 0
    `;

    const expensesResult = await sql`
      SELECT COALESCE(SUM(amount), 0) as expenses FROM transactions
      WHERE user_id = ${userId} AND amount < 0
    `;

    res.status(200).json({
      balance: balanceResult[0].balance,
      income: incomeResult[0].income,
      expenses: expensesResult[0].expenses,
    });
  } catch (error) {
    console.log("Error gettin the summary", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function runMonthlyAutomation(req, res) {
  try {
    const { userId } = req.params;
    const appDate = resolveAppDate(req);
    const presets = Array.isArray(req.body?.presets) ? req.body.presets : [];

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const result = await runMonthlyAutomationForUser(userId, appDate, presets);

    return res.status(200).json({
      message: result.alreadyProcessed ? "Automation already applied for this month" : "Monthly automation applied",
      monthKey: getMonthKey(appDate),
      ...result,
    });
  } catch (error) {
    console.log("Error running monthly automation", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
