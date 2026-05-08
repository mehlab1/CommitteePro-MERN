const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { validateObjectIdParam } = require("../middlewares/validationMiddleware");
const {
  placeBid,
  getBidsByCycle,
  closeBiddingWindow,
} = require("../controllers/bidController");

const router = express.Router();

router.post("/", authMiddleware, placeBid);
router.post(
  "/close/:cycleId",
  authMiddleware,
  validateObjectIdParam("cycleId"),
  roleMiddleware("admin"),
  closeBiddingWindow
);
router.get("/:cycleId", authMiddleware, validateObjectIdParam("cycleId"), getBidsByCycle);

module.exports = router;
