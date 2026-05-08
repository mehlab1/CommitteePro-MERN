const mongoose = require("mongoose");

const committeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    contributionAmount: { type: Number, required: true, min: 1 },
    memberCount: { type: Number, required: true, min: 4, max: 20 },
    cycleFrequency: { type: String, enum: ["monthly", "weekly"], required: true },
    payoutModel: { type: String, enum: ["fixed", "bidding"], required: true },
    startDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "active", "paused", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Committee", committeeSchema);
