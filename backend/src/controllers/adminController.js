const User = require("../models/User");
const UserProfile = require("../models/UserProfile");
const Committee = require("../models/Committee");
const Membership = require("../models/Membership");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const Category = require("../models/Category");
const AuditLog = require("../models/AuditLog");

const parsePagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.max(Number(query.limit) || 10, 1);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const createAuditLog = async (req, { action, targetType, targetId, details }) => {
  await AuditLog.create({
    actorId: req.user.userId,
    action,
    targetType,
    targetId: String(targetId),
    details,
    ipAddress: req.ip,
  });
};

const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      activeUsers,
      blockedUsers,
      totalCommittees,
      activeCommittees,
      totalTransactions,
      flaggedTransactions,
      volumeAggregate,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: "active" }),
      User.countDocuments({ status: "blocked" }),
      Committee.countDocuments(),
      Committee.countDocuments({ status: "active" }),
      Transaction.countDocuments(),
      Transaction.countDocuments({ suspiciousFlag: true }),
      Transaction.aggregate([{ $group: { _id: null, totalVolume: { $sum: "$amount" } } }]),
    ]);

    return res.status(200).json({
      success: true,
      message: "Admin dashboard stats fetched successfully",
      data: {
        totalUsers,
        activeUsers,
        blockedUsers,
        totalCommittees,
        activeCommittees,
        totalTransactions,
        flaggedTransactions,
        totalVolume: volumeAggregate[0]?.totalVolume || 0,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const { search, status, role } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: String(search).trim(), $options: "i" } },
        { email: { $regex: String(search).trim(), $options: "i" } },
      ];
    }
    if (status) filter.status = status;
    if (role) filter.role = role;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-passwordHash")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: {
        users,
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

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [user, profile, wallet, memberships] = await Promise.all([
      User.findById(id).select("-passwordHash"),
      UserProfile.findOne({ userId: id }),
      Wallet.findOne({ userId: id }),
      Membership.find({ userId: id }).populate("committeeId"),
    ]);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "User details fetched successfully",
      data: {
        user,
        profile,
        wallet,
        committees: memberships.map((membership) => ({
          membershipId: membership._id,
          role: membership.role,
          membershipStatus: membership.status,
          hasSignedAgreement: membership.hasSignedAgreement,
          hasReceivedPayout: membership.hasReceivedPayout,
          committee: membership.committeeId,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const blockUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { $set: { status: "blocked" } }, { new: true }).select(
      "-passwordHash"
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await createAuditLog(req, {
      action: "block_user",
      targetType: "User",
      targetId: id,
      details: { status: "blocked" },
    });

    return res.status(200).json({
      success: true,
      message: "User blocked successfully",
      data: user,
    });
  } catch (error) {
    return next(error);
  }
};

const unblockUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { $set: { status: "active" } }, { new: true }).select(
      "-passwordHash"
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await createAuditLog(req, {
      action: "unblock_user",
      targetType: "User",
      targetId: id,
      details: { status: "active" },
    });

    return res.status(200).json({
      success: true,
      message: "User unblocked successfully",
      data: user,
    });
  } catch (error) {
    return next(error);
  }
};

const getAllWallets = async (req, res, next) => {
  try {
    const wallets = await Wallet.find().populate("userId", "_id name email status role").sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      message: "Wallets fetched successfully",
      data: wallets,
    });
  } catch (error) {
    return next(error);
  }
};

const getAllTransactions = async (req, res, next) => {
  try {
    const { type, status, category, suspiciousFlag, fromDate, toDate } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (suspiciousFlag !== undefined) filter.suspiciousFlag = String(suspiciousFlag) === "true";
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate("senderId", "_id name email")
        .populate("receiverId", "_id name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
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

const getFlaggedTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ suspiciousFlag: true })
      .populate("senderId", "_id name email")
      .populate("receiverId", "_id name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Flagged transactions fetched successfully",
      data: transactions,
    });
  } catch (error) {
    return next(error);
  }
};

const getTransactionVolumeReport = async (req, res, next) => {
  try {
    const groupBy = req.query.groupBy === "month" ? "month" : "day";
    const format = groupBy === "month" ? "%Y-%m" : "%Y-%m-%d";

    const report = await Transaction.aggregate([
      {
        $group: {
          _id: {
            label: {
              $dateToString: { format, date: "$createdAt" },
            },
          },
          totalVolume: { $sum: "$amount" },
          transactionCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.label": 1 } },
      {
        $project: {
          _id: 0,
          label: "$_id.label",
          totalVolume: 1,
          transactionCount: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Transaction volume report fetched successfully",
      data: {
        groupBy,
        report,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getSystemBalanceReport = async (req, res, next) => {
  try {
    const aggregate = await Wallet.aggregate([{ $group: { _id: null, totalBalance: { $sum: "$balance" } } }]);
    return res.status(200).json({
      success: true,
      message: "System balance report fetched successfully",
      data: {
        totalBalance: aggregate[0]?.totalBalance || 0,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, type, description } = req.body;

    if (!name || !type) {
      return res.status(400).json({ success: false, message: "name and type are required" });
    }

    const category = await Category.create({
      name,
      type,
      description,
      createdBy: req.user.userId,
    });

    await createAuditLog(req, {
      action: "create_category",
      targetType: "Category",
      targetId: category._id,
      details: { name, type },
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    return next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, description, isActive } = req.body;

    const update = {};
    if (name !== undefined) update.name = name;
    if (type !== undefined) update.type = type;
    if (description !== undefined) update.description = description;
    if (isActive !== undefined) update.isActive = isActive;

    const category = await Category.findByIdAndUpdate(id, { $set: update }, { new: true });

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    await createAuditLog(req, {
      action: "update_category",
      targetType: "Category",
      targetId: id,
      details: update,
    });

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    return next(error);
  }
};

const disableCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true });

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    await createAuditLog(req, {
      action: "disable_category",
      targetType: "Category",
      targetId: id,
      details: { isActive: false },
    });

    return res.status(200).json({
      success: true,
      message: "Category disabled successfully",
      data: category,
    });
  } catch (error) {
    return next(error);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;
    const logs = await AuditLog.find()
      .populate("actorId", "_id name email role")
      .sort({ createdAt: -1 })
      .limit(Math.max(Number(limit) || 50, 1));

    return res.status(200).json({
      success: true,
      message: "Audit logs fetched successfully",
      data: logs,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getUserById,
  blockUser,
  unblockUser,
  getAllWallets,
  getAllTransactions,
  getFlaggedTransactions,
  getTransactionVolumeReport,
  getSystemBalanceReport,
  createCategory,
  updateCategory,
  disableCategory,
  getAuditLogs,
};
