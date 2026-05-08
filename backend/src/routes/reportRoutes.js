const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  getUserDashboard,
  getIncomeExpenseReport,
  getBudgetUsageReport,
} = require("../controllers/reportController");

const router = express.Router();

router.get("/user-dashboard", authMiddleware, getUserDashboard);
router.get("/income-expense", authMiddleware, getIncomeExpenseReport);
router.get("/budget-usage", authMiddleware, getBudgetUsageReport);

module.exports = router;
