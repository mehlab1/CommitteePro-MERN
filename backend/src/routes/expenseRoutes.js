const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  createExpense,
  getMyExpenses,
  updateExpense,
  deleteExpense,
  getMonthlySummary,
  getCategorySummary,
} = require("../controllers/expenseController");

const router = express.Router();

router.post("/", authMiddleware, createExpense);
router.get("/", authMiddleware, getMyExpenses);
router.get("/summary/monthly", authMiddleware, getMonthlySummary);
router.get("/summary/categories", authMiddleware, getCategorySummary);
router.put("/:id", authMiddleware, updateExpense);
router.delete("/:id", authMiddleware, deleteExpense);

module.exports = router;
