import { neon } from "@neondatabase/serverless";

import "dotenv/config";

// Creates a SQL connection using our DB URL
export const sql = neon(process.env.DATABASE_URL);

export async function initDB() {
  try {
    await sql`CREATE TABLE IF NOT EXISTS transactions(
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      title  VARCHAR(255) NOT NULL,
      amount  DECIMAL(10,2) NOT NULL,
      category VARCHAR(255) NOT NULL,
      created_at DATE NOT NULL DEFAULT CURRENT_DATE
    )`;

    await sql`CREATE TABLE IF NOT EXISTS monthly_rollovers(
      user_id VARCHAR(255) NOT NULL,
      month_key VARCHAR(7) NOT NULL,
      balance_before DECIMAL(10,2) NOT NULL,
      profit_amount DECIMAL(10,2) NOT NULL,
      created_at DATE NOT NULL DEFAULT CURRENT_DATE,
      PRIMARY KEY (user_id, month_key)
    )`;

    await sql`CREATE TABLE IF NOT EXISTS monthly_automation_runs(
      user_id VARCHAR(255) NOT NULL,
      month_key VARCHAR(7) NOT NULL,
      created_at DATE NOT NULL DEFAULT CURRENT_DATE,
      PRIMARY KEY (user_id, month_key)
    )`;

    console.log("Database initialized successfully");
  } catch (error) {
    console.log("Error initializing DB", error);
    process.exit(1); // status code 1 means failure, 0 success
  }
}
