const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema({
  committeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Committee", required: true },
  cycleId: { type: mongoose.Schema.Types.ObjectId, ref: "Cycle", required: true },
  bidderUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  discountAmount: { type: Number, required: true, min: 1 },
  submittedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["active", "won", "lost"], default: "active" },
});

bidSchema.index({ cycleId: 1, bidderUserId: 1 }, { unique: true });

module.exports = mongoose.model("Bid", bidSchema);
