const Transaction = require("../models/Transaction");
const User = require("../models/User");
const Membership = require("../models/Membership");
const Bid = require("../models/Bid");
const Cycle = require("../models/Cycle");

const buildResponse = (isSuspicious, reasons) => ({ isSuspicious, reasons });

const ruleHighValueTransfer = async (transaction) => {
  const reasons = [];
  if (transaction.type === "transfer" && Number(transaction.amount) > 100000) {
    reasons.push("Transfer above PKR 100,000 threshold");
  }
  return buildResponse(reasons.length > 0, reasons);
};

const ruleRapidTransfers = async (transaction) => {
  const reasons = [];
  if (transaction.type === "transfer" && transaction.senderId) {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const count = await Transaction.countDocuments({
      senderId: transaction.senderId,
      type: "transfer",
      status: "successful",
      createdAt: { $gte: tenMinutesAgo },
    });
    if (count >= 3) {
      reasons.push("More than 2 transfers within 10 minutes");
    }
  }
  return buildResponse(reasons.length > 0, reasons);
};

const ruleRepeatedSameAmount = async (transaction) => {
  const reasons = [];
  if (transaction.type === "transfer" && transaction.senderId && transaction.receiverId) {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const repeatedTransfers = await Transaction.aggregate([
      {
        $match: {
          senderId: transaction.senderId,
          type: "transfer",
          status: "successful",
          amount: Number(transaction.amount),
          createdAt: { $gte: dayAgo },
        },
      },
      {
        $group: {
          _id: "$senderId",
          uniqueReceivers: { $addToSet: "$receiverId" },
        },
      },
      {
        $project: {
          receiverCount: { $size: "$uniqueReceivers" },
        },
      },
    ]);

    const receiverCount = repeatedTransfers[0]?.receiverCount || 0;
    if (receiverCount >= 3) {
      reasons.push("Repeated same-amount transfers detected");
    }
  }
  return buildResponse(reasons.length > 0, reasons);
};

const ruleFailedWithdrawalPattern = async (transaction) => {
  const reasons = [];
  if (transaction.type === "withdrawal" && transaction.status === "failed" && transaction.senderId) {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const count = await Transaction.countDocuments({
      senderId: transaction.senderId,
      type: "withdrawal",
      status: "failed",
      createdAt: { $gte: dayStart, $lte: now },
    });

    if (count >= 3) {
      reasons.push("More than 2 failed withdrawals today");
    }
  }
  return buildResponse(reasons.length > 0, reasons);
};

const ruleHighValueByNewUser = async (transaction) => {
  const reasons = [];
  const amount = Number(transaction.amount);
  if (amount > 50000) {
    const actorUserId = transaction.senderId || transaction.receiverId;
    if (actorUserId) {
      const user = await User.findById(actorUserId).select("createdAt");
      if (user) {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        if (user.createdAt >= sevenDaysAgo) {
          reasons.push("High-value transaction by newly registered user");
        }
      }
    }
  }
  return buildResponse(reasons.length > 0, reasons);
};

const ruleCommitteeSelfDealing = async (transaction) => {
  const reasons = [];

  if (
    transaction.type === "contribution" &&
    transaction.committeeId &&
    transaction.cycleId &&
    transaction.senderId
  ) {
    const membership = await Membership.findOne({
      committeeId: transaction.committeeId,
      userId: transaction.senderId,
      role: "admin",
    });

    if (membership) {
      const cycle = await Cycle.findById(transaction.cycleId).select("potAmount");
      const bid = await Bid.findOne({
        committeeId: transaction.committeeId,
        cycleId: transaction.cycleId,
        bidderUserId: transaction.senderId,
      }).select("discountAmount");

      if (cycle && bid && Number(bid.discountAmount) > Number(cycle.potAmount) * 0.2) {
        reasons.push("Potential self-dealing: admin bidding with high discount");
      }
    }
  }

  return buildResponse(reasons.length > 0, reasons);
};

const runSuspiciousRules = async (transaction) => {
  const results = await Promise.all([
    ruleHighValueTransfer(transaction),
    ruleRapidTransfers(transaction),
    ruleRepeatedSameAmount(transaction),
    ruleFailedWithdrawalPattern(transaction),
    ruleHighValueByNewUser(transaction),
    ruleCommitteeSelfDealing(transaction),
  ]);

  const reasons = results.flatMap((result) => result.reasons);
  const uniqueReasons = [...new Set(reasons)];
  return buildResponse(uniqueReasons.length > 0, uniqueReasons);
};

module.exports = {
  ruleHighValueTransfer,
  ruleRapidTransfers,
  ruleRepeatedSameAmount,
  ruleFailedWithdrawalPattern,
  ruleHighValueByNewUser,
  ruleCommitteeSelfDealing,
  runSuspiciousRules,
};
