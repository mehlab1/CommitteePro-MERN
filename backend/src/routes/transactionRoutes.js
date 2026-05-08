const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  getMyTransactions,
  getTransactionById,
  getTransactionReceipt,
  getMonthlySummary,
} = require("../controllers/transactionController");

const router = express.Router();

router.get("/", authMiddleware, getMyTransactions);
router.get("/summary/monthly", authMiddleware, getMonthlySummary);
router.get("/:id/receipt", authMiddleware, getTransactionReceipt);
router.get("/:id", authMiddleware, getTransactionById);

module.exports = router;
