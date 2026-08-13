import cron from "cron";
import { ensureMonthlyRolloverForAllUsers } from "../services/monthlyRollover.js";

const job = new cron.CronJob("5 0 * * *", async function () {
  try {
    await ensureMonthlyRolloverForAllUsers();
    console.log("Monthly rollover check completed successfully");
  } catch (error) {
    console.error("Error while processing monthly rollover", error);
  }
});

export default job;

// CRON JOB EXPLANATION:
// Cron jobs are scheduled tasks that run periodically at fixed intervals.
// This one checks monthly rollover state shortly after midnight each day.

// How to define a "Schedule"?
// You define a schedule using a cron expression, which consists of 5 fields representing:

//! MINUTE, HOUR, DAY OF THE MONTH, MONTH, DAY OF THE WEEK

//? EXAMPLES && EXPLANATION:
//* 5 0 * * * - Every day at 12:05 AM
//* 0 0 * * 0 - At midnight on every Sunday
//* 30 3 15 * * - At 3:30 AM, on the 15th of every month
//* 0 0 1 1 * - At midnight, on January 1st
//* 0 * * * * - Every hour
