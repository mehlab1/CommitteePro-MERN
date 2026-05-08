const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const Membership = require("../models/Membership");
const Expense = require("../models/Expense");
const Budget = require("../models/Budget");

const getMonthRange = (year, month) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start, end };
};

const getUserDashboard = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const now = new Date();
    const monthString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const { start, end } = getMonthRange(now.getFullYear(), now.getMonth() + 1);

    const [wallet, recentTransactions, activeCommitteesCount, expenseAggregate, budget] = await Promise.all([
      Wallet.findOne({ userId }),
      Transaction.find({ $or: [{ senderId: userId }, { receiverId: userId }] })
        .sort({ createdAt: -1 })
        .limit(5),
      Membership.countDocuments({ userId, status: "active" }),
      Expense.aggregate([
        { $match: { userId: req.user.userId, date: { $gte: start, $lt: end } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Budget.findOne({ userId, month: monthString }),
    ]);

    return res.status(200).json({
      success: true,
      message: "User dashboard report fetched successfully",
      data: {
        walletBalance: wallet?.balance || 0,
        recentTransactions,
        activeCommitteesCount,
        currentMonthExpenseTotal: expenseAggregate[0]?.total || 0,
        budgetStatus: budget?.status || "no_budget",
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getIncomeExpenseReport = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const year = Number(req.query.year) || new Date().getFullYear();

    const [incomeAgg, expenseTxAgg, expenseAgg] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            receiverId: userId,
            type: { $in: ["deposit", "payout", "discount_credit"] },
            status: { $in: ["successful", "flagged"] },
            createdAt: {
              $gte: new Date(year, 0, 1),
              $lt: new Date(year + 1, 0, 1),
            },
          },
        },
        {
          $group: {
            _id: { month: { $month: "$createdAt" } },
            total: { $sum: "$amount" },
          },
        },
      ]),
      Transaction.aggregate([
        {
          $match: {
            senderId: userId,
            type: { $in: ["withdrawal", "transfer"] },
            status: { $in: ["successful", "flagged"] },
            createdAt: {
              $gte: new Date(year, 0, 1),
              $lt: new Date(year + 1, 0, 1),
            },
          },
        },
        {
          $group: {
            _id: { month: { $month: "$createdAt" } },
            total: { $sum: "$amount" },
          },
        },
      ]),
      Expense.aggregate([
        {
          $match: {
            userId: req.user.userId,
            date: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) },
          },
        },
        {
          $group: {
            _id: { month: { $month: "$date" } },
            total: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    const incomeByMonth = {};
    incomeAgg.forEach((item) => {
      incomeByMonth[item._id.month] = item.total;
    });

    const expenseByMonth = {};
    expenseTxAgg.forEach((item) => {
      expenseByMonth[item._id.month] = (expenseByMonth[item._id.month] || 0) + item.total;
    });
    expenseAgg.forEach((item) => {
      expenseByMonth[item._id.month] = (expenseByMonth[item._id.month] || 0) + item.total;
    });

    const monthly = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      return {
        month,
        income: incomeByMonth[month] || 0,
        expense: expenseByMonth[month] || 0,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Income vs expense report fetched successfully",
      data: {
        year,
        monthly,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getBudgetUsageReport = async (req, res, next) => {
  try {
    const now = new Date();
    const monthString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const budget = await Budget.findOne({ userId: req.user.userId, month: monthString });

    if (!budget) {
      return res.status(404).json({ success: false, message: "Current month budget not found" });
    }

    const { start, end } = getMonthRange(now.getFullYear(), now.getMonth() + 1);
    const expenses = await Expense.aggregate([
      { $match: { userId: req.user.userId, date: { $gte: start, $lt: end } } },
      { $group: { _id: null, spent: { $sum: "$amount" } } },
    ]);
    const spent = expenses[0]?.spent || 0;

    let status = "safe";
    if (spent >= budget.totalLimit) {
      status = "exceeded";
    } else if (spent >= (budget.totalLimit * budget.warningThreshold) / 100) {
      status = "nearLimit";
    }

    budget.spentAmount = spent;
    budget.status = status;
    await budget.save();

    return res.status(200).json({
      success: true,
      message: "Budget usage report fetched successfully",
      data: {
        month: monthString,
        totalLimit: budget.totalLimit,
        spentAmount: spent,
        remaining: Math.max(0, budget.totalLimit - spent),
        status: budget.status,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getUserDashboard,
  getIncomeExpenseReport,
  getBudgetUsageReport,
};
