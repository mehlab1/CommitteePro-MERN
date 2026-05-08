const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true, unique: true, trim: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    committeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Committee" },
    cycleId: { type: mongoose.Schema.Types.ObjectId, ref: "Cycle" },
    amount: { type: Number, required: true, min: 1 },
    type: {
      type: String,
      enum: [
        "deposit",
        "withdrawal",
        "transfer",
        "contribution",
        "payout",
        "discount_credit",
        "penalty",
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "successful", "failed", "flagged"],
      default: "pending",
    },
    category: { type: String, trim: true },
    description: { type: String, trim: true },
    suspiciousFlag: { type: Boolean, default: false },
    suspiciousReasons: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
