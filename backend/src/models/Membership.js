const mongoose = require("mongoose");

const membershipSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  committeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Committee", required: true },
  role: { type: String, enum: ["admin", "member"], default: "member" },
  rotationOrder: { type: Number },
  hasSignedAgreement: { type: Boolean, default: false },
  hasReceivedPayout: { type: Boolean, default: false },
  joinedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["active", "pending", "defaulted", "exited"],
    default: "active",
  },
});

membershipSchema.index({ userId: 1, committeeId: 1 }, { unique: true });

module.exports = mongoose.model("Membership", membershipSchema);
