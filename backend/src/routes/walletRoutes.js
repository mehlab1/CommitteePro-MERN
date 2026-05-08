const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  validateDeposit,
  validateWithdrawal,
  validateTransfer,
} = require("../middlewares/validationMiddleware");
const {
  getWallet,
  getWalletSummary,
  deposit,
  withdraw,
  transfer,
} = require("../controllers/walletController");

const router = express.Router();

router.get("/", authMiddleware, getWallet);
router.get("/summary", authMiddleware, getWalletSummary);
router.post("/deposit", authMiddleware, validateDeposit, deposit);
router.post("/withdraw", authMiddleware, validateWithdrawal, withdraw);
router.post("/transfer", authMiddleware, validateTransfer, transfer);

module.exports = router;
