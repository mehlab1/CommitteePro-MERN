const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const {
  placeBid,
  getBidsByCycle,
  closeBiddingWindow,
} = require("../controllers/bidController");

const router = express.Router();

router.post("/", authMiddleware, placeBid);
router.post("/close/:cycleId", authMiddleware, roleMiddleware("admin"), closeBiddingWindow);
router.get("/:cycleId", authMiddleware, getBidsByCycle);

module.exports = router;
