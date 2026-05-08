const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  validateDeposit,
  validateWithdrawal,
  validateTransfer,
} = require("../middlewares/validationMiddleware");
const { walletLimiter } = require("../middlewares/rateLimitMiddleware");
const { walletOwnershipMiddleware } = require("../middlewares/ownershipMiddleware");
const {
  getWallet,
  getWalletSummary,
  deposit,
  withdraw,
  transfer,
} = require("../controllers/walletController");

const router = express.Router();

router.get("/", authMiddleware, walletOwnershipMiddleware, getWallet);
router.get("/summary", authMiddleware, walletOwnershipMiddleware, getWalletSummary);
router.post("/deposit", authMiddleware, walletOwnershipMiddleware, walletLimiter, validateDeposit, deposit);
router.post(
  "/withdraw",
  authMiddleware,
  walletOwnershipMiddleware,
  walletLimiter,
  validateWithdrawal,
  withdraw
);
router.post("/transfer", authMiddleware, walletOwnershipMiddleware, walletLimiter, validateTransfer, transfer);

module.exports = router;
