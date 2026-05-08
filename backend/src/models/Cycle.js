const mongoose = require("mongoose");

const cycleSchema = new mongoose.Schema({
  committeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Committee", required: true },
  cycleNumber: { type: Number, required: true },
  potAmount: { type: Number, required: true },
  biddingOpensAt: { type: Date },
  biddingClosesAt: { type: Date },
  payoutDate: { type: Date, required: true },
  winnerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  winningDiscount: { type: Number, default: 0 },
  payoutAmount: { type: Number },
  status: {
    type: String,
    enum: [
      "scheduled",
      "bidding_open",
      "bidding_closed",
      "winner_determined",
      "collecting_payments",
      "disbursed",
      "completed",
    ],
    default: "scheduled",
  },
  disbursedAt: { type: Date },
  raastPayoutReferenceId: { type: String, trim: true },
});

cycleSchema.index({ committeeId: 1, cycleNumber: 1 }, { unique: true });

module.exports = mongoose.model("Cycle", cycleSchema);
