const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

const inviteTokenSchema = new mongoose.Schema({
  token: { type: String, unique: true, default: () => randomUUID() },
  committeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Committee", required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  expiresAt: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model("InviteToken", inviteTokenSchema);
