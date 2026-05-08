const mongoose = require("mongoose");

const paymentRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  committeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Committee", required: true },
  cycleId: { type: mongoose.Schema.Types.ObjectId, ref: "Cycle", required: true },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "grace_period", "completed", "failed"],
    default: "pending",
  },
  requestedAt: { type: Date, default: Date.now },
  gracePeriodEndsAt: { type: Date },
  completedAt: { type: Date },
});

paymentRecordSchema.index({ userId: 1, cycleId: 1 }, { unique: true });

module.exports = mongoose.model("PaymentRecord", paymentRecordSchema);
