const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { validateObjectIdParam } = require("../middlewares/validationMiddleware");
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
router.get("/:id", authMiddleware, validateObjectIdParam("id"), getCommitteeById);
router.post("/:id/invite", authMiddleware, validateObjectIdParam("id"), generateInvite);
router.post("/:id/sign-agreement", authMiddleware, validateObjectIdParam("id"), signAgreement);

module.exports = router;
