const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { validateObjectIdParam } = require("../middlewares/validationMiddleware");
const {
  initiateContributions,
  processPayout,
} = require("../controllers/paymentController");

const router = express.Router();

router.post("/initiate/:cycleId", authMiddleware, validateObjectIdParam("cycleId"), initiateContributions);
router.post("/payout/:cycleId", authMiddleware, validateObjectIdParam("cycleId"), processPayout);

module.exports = router;
