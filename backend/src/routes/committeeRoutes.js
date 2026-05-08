const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const {
  createCommittee,
  getMyCommittees,
  getCommitteeById,
  generateInvite,
} = require("../controllers/committeeController");

const router = express.Router();

router.post("/", authMiddleware, createCommittee);
router.get("/", authMiddleware, getMyCommittees);
router.get("/:id", authMiddleware, getCommitteeById);
router.post("/:id/invite", authMiddleware, roleMiddleware("admin"), generateInvite);

module.exports = router;
