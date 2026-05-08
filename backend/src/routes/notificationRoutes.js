const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { validateObjectIdParam } = require("../middlewares/validationMiddleware");
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} = require("../controllers/notificationController");

const router = express.Router();

router.get("/", authMiddleware, getMyNotifications);
router.patch("/:id/read", authMiddleware, validateObjectIdParam("id"), markAsRead);
router.patch("/read-all", authMiddleware, markAllAsRead);

module.exports = router;
