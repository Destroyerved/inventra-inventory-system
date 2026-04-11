import express from "express";
import db from "../db.ts";
import { authenticateToken } from "./auth.ts";

const router = express.Router();

router.get("/summary", authenticateToken, (req, res) => {
  const income = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'income'").get() as { total: number };
  const expense = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'expense'").get() as { total: number };
  const transactions = db.prepare("SELECT * FROM transactions ORDER BY date DESC LIMIT 50").all();

  res.json({
    revenue: income.total || 0,
    expenses: expense.total || 0,
    profit: (income.total || 0) - (expense.total || 0),
    transactions
  });
});

export default router;
