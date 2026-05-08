const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  createBudget,
  getMyBudgets,
  getCurrentMonthBudget,
  updateBudget,
  deleteBudget,
} = require("../controllers/budgetController");

const router = express.Router();

router.post("/", authMiddleware, createBudget);
router.get("/", authMiddleware, getMyBudgets);
router.get("/current", authMiddleware, getCurrentMonthBudget);
router.put("/:id", authMiddleware, updateBudget);
router.delete("/:id", authMiddleware, deleteBudget);

module.exports = router;
