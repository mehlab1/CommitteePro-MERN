const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const {
  initiateContributions,
  processPayout,
} = require("../controllers/paymentController");

const router = express.Router();

router.post("/initiate/:cycleId", authMiddleware, roleMiddleware("admin"), initiateContributions);
router.post("/payout/:cycleId", authMiddleware, roleMiddleware("admin"), processPayout);

module.exports = router;
