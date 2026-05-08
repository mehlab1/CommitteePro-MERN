const mongoose = require("mongoose");

const agreementSignatureSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  committeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Committee", required: true },
  agreementVersion: { type: String, default: "v1.0" },
  signedAt: { type: Date, default: Date.now },
  ipAddress: { type: String, required: true, trim: true },
  userAgent: { type: String, required: true, trim: true },
});

agreementSignatureSchema.index({ userId: 1, committeeId: 1 }, { unique: true });

module.exports = mongoose.model("AgreementSignature", agreementSignatureSchema);
