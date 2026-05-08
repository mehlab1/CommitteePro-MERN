const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { validateObjectIdParam } = require("../middlewares/validationMiddleware");
const { budgetOwnershipMiddleware } = require("../middlewares/ownershipMiddleware");
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
router.put("/:id", authMiddleware, validateObjectIdParam("id"), budgetOwnershipMiddleware, updateBudget);
router.delete("/:id", authMiddleware, validateObjectIdParam("id"), budgetOwnershipMiddleware, deleteBudget);

module.exports = router;
