const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const {
  createCommittee,
  getMyCommittees,
  getCommitteeById,
  generateInvite,
  joinCommittee,
  signAgreement,
} = require("../controllers/committeeController");

const router = express.Router();

router.post("/", authMiddleware, createCommittee);
router.get("/", authMiddleware, getMyCommittees);
router.post("/join/:token", authMiddleware, joinCommittee);
router.get("/:id", authMiddleware, getCommitteeById);
router.post("/:id/invite", authMiddleware, roleMiddleware("admin"), generateInvite);
router.post("/:id/sign-agreement", authMiddleware, signAgreement);

module.exports = router;
