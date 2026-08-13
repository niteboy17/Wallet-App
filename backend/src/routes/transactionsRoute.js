import express from "express";
import {
  createTransaction,
  deleteTransaction,
  getSummaryByUserId,
  getTransactionsByUserId,
  runMonthlyAutomation,
} from "../controllers/transactionsController.js";

const router = express.Router();

router.post("/automation/:userId", runMonthlyAutomation);
router.get("/summary/:userId", getSummaryByUserId);
router.get("/:userId", getTransactionsByUserId);
router.post("/", createTransaction);
router.delete("/:id", deleteTransaction);

export default router;
