const mongoose = require("mongoose");

const userProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  displayName: { type: String, required: true, trim: true },
  profilePhotoUrl: { type: String, trim: true },
  trustScore: { type: Number, default: 60, min: 0, max: 100 },
  onTimePaymentCount: { type: Number, default: 0 },
  latePaymentCount: { type: Number, default: 0 },
  defaultCount: { type: Number, default: 0 },
  committeesCompleted: { type: Number, default: 0 },
  languagePreference: { type: String, enum: ["en", "ur"], default: "en" },
});

module.exports = mongoose.model("UserProfile", userProfileSchema);
