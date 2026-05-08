const mongoose = require("mongoose");

const categoryLimitSchema = new mongoose.Schema(
  {
    category: { type: String, trim: true },
    limit: { type: Number },
  },
  { _id: false }
);

const budgetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    month: { type: String, required: true, match: /^\d{4}-\d{2}$/ },
    totalLimit: { type: Number, required: true, min: 1 },
    categoryLimits: [categoryLimitSchema],
    spentAmount: { type: Number, default: 0 },
    status: { type: String, enum: ["safe", "nearLimit", "exceeded"], default: "safe" },
    warningThreshold: { type: Number, default: 80 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Budget", budgetSchema);
