const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { validateObjectIdParam } = require("../middlewares/validationMiddleware");
const {
  getMyTransactions,
  getTransactionById,
  getTransactionReceipt,
  getMonthlySummary,
} = require("../controllers/transactionController");

const router = express.Router();

router.get("/", authMiddleware, getMyTransactions);
router.get("/summary/monthly", authMiddleware, getMonthlySummary);
router.get("/:id/receipt", authMiddleware, validateObjectIdParam("id"), getTransactionReceipt);
router.get("/:id", authMiddleware, validateObjectIdParam("id"), getTransactionById);

module.exports = router;
