const mongoose = require("mongoose");
const Wallet = require("../models/Wallet");
const Expense = require("../models/Expense");
const Budget = require("../models/Budget");

const enforceOwnership = (Model, { paramName = "id", fieldName = "userId", source = "params" } = {}) => {
  return async (req, res, next) => {
    try {
      const resourceId = source === "params" ? req.params[paramName] : req.body[paramName];

      if (resourceId && !mongoose.Types.ObjectId.isValid(resourceId)) {
        return res.status(400).json({ success: false, message: `Invalid ${paramName} format` });
      }

      const query =
        source === "params" ? { _id: resourceId } : { [paramName]: resourceId };

      const resource = await Model.findOne(query).select(fieldName);

      if (!resource) {
        return res.status(404).json({ success: false, message: "Resource not found" });
      }

      const owner = resource[fieldName];
      if (!owner || owner.toString() !== req.user.userId) {
        return res.status(403).json({ success: false, message: "Forbidden: Not resource owner" });
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

const walletOwnershipMiddleware = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user.userId }).select("userId");
    if (!wallet) {
      return res.status(404).json({ success: false, message: "Wallet not found" });
    }
    if (wallet.userId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Forbidden: Not wallet owner" });
    }
    return next();
  } catch (error) {
    return next(error);
  }
};

const expenseOwnershipMiddleware = enforceOwnership(Expense, { paramName: "id", source: "params" });
const budgetOwnershipMiddleware = enforceOwnership(Budget, { paramName: "id", source: "params" });

module.exports = {
  enforceOwnership,
  walletOwnershipMiddleware,
  expenseOwnershipMiddleware,
  budgetOwnershipMiddleware,
};
