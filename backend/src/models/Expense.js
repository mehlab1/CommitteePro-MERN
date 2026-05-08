const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 1 },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    paymentMethod: { type: String, default: "Wallet", trim: true },
    date: { type: Date, required: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", expenseSchema);
