const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ["transaction", "budget", "security", "account", "system", "committee", "bid"],
    required: true,
  },
  readStatus: { type: Boolean, default: false },
  relatedTransactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
  relatedCommitteeId: { type: mongoose.Schema.Types.ObjectId, ref: "Committee" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notification", notificationSchema);
