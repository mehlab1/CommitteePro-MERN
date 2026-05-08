const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { validateObjectIdParam } = require("../middlewares/validationMiddleware");
const {
  getDashboardStats,
  getAllUsers,
  getUserById,
  blockUser,
  unblockUser,
  getAllWallets,
  getAllTransactions,
  getFlaggedTransactions,
  getTransactionVolumeReport,
  getSystemBalanceReport,
  createCategory,
  updateCategory,
  disableCategory,
  getAuditLogs,
} = require("../controllers/adminController");

const router = express.Router();

router.use(authMiddleware, roleMiddleware("admin"));

router.get("/dashboard", getDashboardStats);
router.get("/users", getAllUsers);
router.get("/users/:id", validateObjectIdParam("id"), getUserById);
router.patch("/users/:id/block", validateObjectIdParam("id"), blockUser);
router.patch("/users/:id/unblock", validateObjectIdParam("id"), unblockUser);
router.get("/wallets", getAllWallets);
router.get("/transactions", getAllTransactions);
router.get("/transactions/flagged", getFlaggedTransactions);
router.get("/reports/transaction-volume", getTransactionVolumeReport);
router.get("/reports/system-balance", getSystemBalanceReport);
router.post("/categories", createCategory);
router.put("/categories/:id", validateObjectIdParam("id"), updateCategory);
router.patch("/categories/:id/disable", validateObjectIdParam("id"), disableCategory);
router.get("/audit-logs", getAuditLogs);

module.exports = router;
