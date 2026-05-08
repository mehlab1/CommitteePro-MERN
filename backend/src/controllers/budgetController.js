const Budget = require("../models/Budget");
const Expense = require("../models/Expense");

const getMonthRange = (month) => {
  const [year, monthPart] = String(month).split("-").map(Number);
  const start = new Date(year, monthPart - 1, 1);
  const end = new Date(year, monthPart, 1);
  return { start, end };
};

const validateMonthFormat = (month) => /^\d{4}-\d{2}$/.test(String(month || ""));

const calculateBudgetStatus = async (budget) => {
  const { start, end } = getMonthRange(budget.month);

  const expenses = await Expense.find({
    userId: budget.userId,
    date: { $gte: start, $lt: end },
  }).populate("categoryId", "name");

  const spentAmount = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const categorySpentMap = {};

  expenses.forEach((expense) => {
    const categoryName = expense.categoryId?.name || "Uncategorized";
    categorySpentMap[categoryName] = (categorySpentMap[categoryName] || 0) + Number(expense.amount || 0);
  });

  let status = "safe";
  if (spentAmount >= budget.totalLimit) {
    status = "exceeded";
  } else if (spentAmount >= (budget.totalLimit * budget.warningThreshold) / 100) {
    status = "nearLimit";
  }

  budget.spentAmount = spentAmount;
  budget.status = status;
  await budget.save();

  const categoryStatus = (budget.categoryLimits || []).map((limit) => {
    const spent = categorySpentMap[limit.category] || 0;
    let itemStatus = "safe";
    if (spent >= Number(limit.limit || 0)) {
      itemStatus = "exceeded";
    } else if (Number(limit.limit || 0) > 0 && spent >= Number(limit.limit || 0) * 0.8) {
      itemStatus = "nearLimit";
    }
    return {
      category: limit.category,
      limit: limit.limit,
      spent,
      status: itemStatus,
    };
  });

  return {
    budget,
    categoryStatus,
  };
};

const createBudget = async (req, res, next) => {
  try {
    const { month, totalLimit, categoryLimits = [], warningThreshold = 80 } = req.body;

    if (!validateMonthFormat(month)) {
      return res.status(400).json({ success: false, message: "month must be in YYYY-MM format" });
    }

    const parsedLimit = Number(totalLimit);
    if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
      return res.status(400).json({ success: false, message: "totalLimit must be greater than 0" });
    }

    const budget = await Budget.create({
      userId: req.user.userId,
      month,
      totalLimit: parsedLimit,
      categoryLimits,
      warningThreshold: Number(warningThreshold) || 80,
    });

    const statusData = await calculateBudgetStatus(budget);

    return res.status(201).json({
      success: true,
      message: "Budget created successfully",
      data: statusData,
    });
  } catch (error) {
    return next(error);
  }
};

const getMyBudgets = async (req, res, next) => {
  try {
    const budgets = await Budget.find({ userId: req.user.userId }).sort({ month: -1 });
    return res.status(200).json({
      success: true,
      message: "Budgets fetched successfully",
      data: budgets,
    });
  } catch (error) {
    return next(error);
  }
};

const getCurrentMonthBudget = async (req, res, next) => {
  try {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const budget = await Budget.findOne({ userId: req.user.userId, month: currentMonth });
    if (!budget) {
      return res.status(404).json({ success: false, message: "Current month budget not found" });
    }

    const statusData = await calculateBudgetStatus(budget);

    return res.status(200).json({
      success: true,
      message: "Current month budget fetched successfully",
      data: statusData,
    });
  } catch (error) {
    return next(error);
  }
};

const updateBudget = async (req, res, next) => {
  try {
    const { id } = req.params;
    const budget = await Budget.findById(id);

    if (!budget) {
      return res.status(404).json({ success: false, message: "Budget not found" });
    }

    if (budget.userId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Forbidden: Not budget owner" });
    }

    const { month, totalLimit, categoryLimits, warningThreshold } = req.body;

    if (month !== undefined) {
      if (!validateMonthFormat(month)) {
        return res.status(400).json({ success: false, message: "month must be in YYYY-MM format" });
      }
      budget.month = month;
    }

    if (totalLimit !== undefined) {
      const parsedLimit = Number(totalLimit);
      if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
        return res.status(400).json({ success: false, message: "totalLimit must be greater than 0" });
      }
      budget.totalLimit = parsedLimit;
    }

    if (categoryLimits !== undefined) {
      budget.categoryLimits = categoryLimits;
    }

    if (warningThreshold !== undefined) {
      budget.warningThreshold = Number(warningThreshold);
    }

    await budget.save();
    const statusData = await calculateBudgetStatus(budget);

    return res.status(200).json({
      success: true,
      message: "Budget updated successfully",
      data: statusData,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteBudget = async (req, res, next) => {
  try {
    const { id } = req.params;
    const budget = await Budget.findById(id);

    if (!budget) {
      return res.status(404).json({ success: false, message: "Budget not found" });
    }

    if (budget.userId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Forbidden: Not budget owner" });
    }

    await Budget.deleteOne({ _id: id });

    return res.status(200).json({
      success: true,
      message: "Budget deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

const checkBudgetStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const budget = await Budget.findById(id);

    if (!budget) {
      return res.status(404).json({ success: false, message: "Budget not found" });
    }

    if (budget.userId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Forbidden: Not budget owner" });
    }

    const statusData = await calculateBudgetStatus(budget);

    return res.status(200).json({
      success: true,
      message: "Budget status checked successfully",
      data: statusData,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createBudget,
  getMyBudgets,
  getCurrentMonthBudget,
  updateBudget,
  deleteBudget,
  checkBudgetStatus,
};
