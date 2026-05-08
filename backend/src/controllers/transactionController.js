const Transaction = require("../models/Transaction");

const buildOwnershipFilter = (userId) => ({
  $or: [{ senderId: userId }, { receiverId: userId }],
});

const getMyTransactions = async (req, res, next) => {
  try {
    const { type, status, category, fromDate, toDate, search } = req.query;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const filter = buildOwnershipFilter(req.user.userId);

    if (type) {
      filter.type = type;
    }
    if (status) {
      filter.status = status;
    }
    if (category) {
      filter.category = category;
    }
    if (search) {
      filter.transactionId = { $regex: String(search).trim(), $options: "i" };
    }

    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) {
        filter.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        filter.createdAt.$lte = new Date(toDate);
      }
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("senderId", "_id name email")
        .populate("receiverId", "_id name email"),
      Transaction.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Transactions fetched successfully",
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findById(id)
      .populate("senderId", "_id name email")
      .populate("receiverId", "_id name email")
      .populate("committeeId", "_id name")
      .populate("cycleId", "_id cycleNumber payoutDate");

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    const isOwner =
      String(transaction.senderId?._id || transaction.senderId || "") === String(req.user.userId) ||
      String(transaction.receiverId?._id || transaction.receiverId || "") === String(req.user.userId);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    return res.status(200).json({
      success: true,
      message: "Transaction fetched successfully",
      data: transaction,
    });
  } catch (error) {
    return next(error);
  }
};

const getTransactionReceipt = async (req, res, next) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findById(id)
      .populate("senderId", "_id name email")
      .populate("receiverId", "_id name email")
      .populate("committeeId", "_id name")
      .populate("cycleId", "_id cycleNumber payoutDate");

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    const isOwner =
      String(transaction.senderId?._id || transaction.senderId || "") === String(req.user.userId) ||
      String(transaction.receiverId?._id || transaction.receiverId || "") === String(req.user.userId);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const receipt = {
      receiptNumber: transaction.transactionId,
      transactionDate: transaction.createdAt,
      status: transaction.status,
      type: transaction.type,
      amount: transaction.amount,
      category: transaction.category || null,
      description: transaction.description || null,
      sender: transaction.senderId || null,
      receiver: transaction.receiverId || null,
      committee: transaction.committeeId || null,
      cycle: transaction.cycleId || null,
      suspiciousFlag: transaction.suspiciousFlag,
      suspiciousReasons: transaction.suspiciousReasons || [],
    };

    return res.status(200).json({
      success: true,
      message: "Transaction receipt fetched successfully",
      data: receipt,
    });
  } catch (error) {
    return next(error);
  }
};

const getMonthlySummary = async (req, res, next) => {
  try {
    const now = new Date();
    const queryMonth = Number(req.query.month) || now.getMonth() + 1;
    const queryYear = Number(req.query.year) || now.getFullYear();

    const start = new Date(queryYear, queryMonth - 1, 1);
    const end = new Date(queryYear, queryMonth, 1);

    const userFilter = buildOwnershipFilter(req.user.userId);

    const [aggregates, count] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            ...userFilter,
            createdAt: { $gte: start, $lt: end },
          },
        },
        {
          $group: {
            _id: "$type",
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),
      Transaction.countDocuments({
        ...userFilter,
        createdAt: { $gte: start, $lt: end },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Monthly summary fetched successfully",
      data: {
        month: queryMonth,
        year: queryYear,
        transactionCount: count,
        byType: aggregates,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getMyTransactions,
  getTransactionById,
  getTransactionReceipt,
  getMonthlySummary,
};
