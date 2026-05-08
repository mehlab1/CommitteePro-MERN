const Committee = require("../models/Committee");
const Cycle = require("../models/Cycle");
const Membership = require("../models/Membership");
const PaymentRecord = require("../models/PaymentRecord");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");
const UserProfile = require("../models/UserProfile");
const Wallet = require("../models/Wallet");
const User = require("../models/User");
const generateTransactionId = require("../utils/generateTransactionId");
const { runSuspiciousRules } = require("../utils/suspiciousRules");

const GRACE_PERIOD_HOURS = 24;
const MOCK_RAAST_SUCCESS_RATE = 0.8;

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const addCycleInterval = (date, cycleFrequency) => {
  if (cycleFrequency === "weekly") {
    return addDays(date, 7);
  }
  const next = new Date(date);
  next.setMonth(next.getMonth() + 1);
  return next;
};

const shouldMockRaastSucceed = () => Math.random() < MOCK_RAAST_SUCCESS_RATE;

const recalculateTrustScore = async (committeeId) => {
  const memberships = await Membership.find({ committeeId });

  for (const membership of memberships) {
    const profile = await UserProfile.findOne({ userId: membership.userId });
    if (!profile) {
      continue;
    }

    const paymentHistory = await PaymentRecord.find({
      committeeId,
      userId: membership.userId,
    }).select("status gracePeriodEndsAt");

    let onTimePaymentCount = 0;
    let lateCount = 0;
    let defaultCount = 0;

    paymentHistory.forEach((payment) => {
      if (payment.status === "completed") {
        onTimePaymentCount += 1;
      } else if (payment.status === "grace_period") {
        if (payment.gracePeriodEndsAt && payment.gracePeriodEndsAt < new Date()) {
          defaultCount += 1;
        } else {
          lateCount += 1;
        }
      } else if (payment.status === "failed" || payment.status === "pending") {
        defaultCount += 1;
      }
    });

    profile.onTimePaymentCount = onTimePaymentCount;
    profile.latePaymentCount = lateCount;
    profile.defaultCount = defaultCount;

    const baseScore =
      100 - lateCount * 5 - defaultCount * 20 + (profile.committeesCompleted || 0) * 2;
    const clampedScore = Math.max(0, Math.min(100, baseScore));
    profile.trustScore = clampedScore;

    await profile.save();
  }
};

const initiateContributions = async (req, res, next) => {
  try {
    const committeeId = req.body.committeeId;
    const cycleId = req.params.cycleId || req.body.cycleId;

    if (!committeeId || !cycleId) {
      return res.status(400).json({
        success: false,
        message: "committeeId and cycleId are required",
      });
    }

    const committee = await Committee.findById(committeeId);
    if (!committee) {
      return res.status(404).json({ success: false, message: "Committee not found" });
    }

    const cycle = await Cycle.findOne({ _id: cycleId, committeeId });
    if (!cycle) {
      return res.status(404).json({ success: false, message: "Cycle not found" });
    }

    const adminMembership = await Membership.findOne({
      committeeId,
      userId: req.user.userId,
      role: "admin",
    });
    const isSystemAdmin = req.user.role === "admin";
    if (!adminMembership && !isSystemAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Admin or system access required",
      });
    }

    const activeMemberships = await Membership.find({ committeeId, status: "active" });
    const graceEndsAt = addDays(new Date(), GRACE_PERIOD_HOURS / 24);
    const paymentRecords = [];

    for (const membership of activeMemberships) {
      const paymentRecord = await PaymentRecord.findOneAndUpdate(
        { userId: membership.userId, committeeId, cycleId },
        {
          $setOnInsert: {
            userId: membership.userId,
            committeeId,
            cycleId,
          },
          $set: {
            amount: committee.contributionAmount,
            status: "pending",
            requestedAt: new Date(),
            gracePeriodEndsAt: undefined,
            completedAt: undefined,
          },
        },
        { new: true, upsert: true }
      );

      if (shouldMockRaastSucceed()) {
        paymentRecord.status = "completed";
        paymentRecord.completedAt = new Date();
        paymentRecord.gracePeriodEndsAt = undefined;
        await paymentRecord.save();

        let contributionTransaction = await Transaction.create({
          transactionId: generateTransactionId(),
          senderId: membership.userId,
          committeeId,
          cycleId,
          amount: committee.contributionAmount,
          type: "contribution",
          status: "successful",
          description: "Cycle contribution collected via mock Raast",
        });

        const suspiciousResult = await runSuspiciousRules(contributionTransaction);
        if (suspiciousResult.isSuspicious) {
          contributionTransaction = await Transaction.findByIdAndUpdate(
            contributionTransaction._id,
            {
              $set: {
                suspiciousFlag: true,
                suspiciousReasons: suspiciousResult.reasons,
                status: "flagged",
              },
            },
            { new: true }
          );

          const [committeeAdmins, systemAdmins] = await Promise.all([
            Membership.find({ committeeId, role: "admin", status: "active" }).select("userId"),
            User.find({ role: "admin", status: "active" }).select("_id"),
          ]);

          const adminUserIdSet = new Set([
            ...committeeAdmins.map((adminMembership) => String(adminMembership.userId)),
            ...systemAdmins.map((admin) => String(admin._id)),
          ]);
          adminUserIdSet.delete(String(membership.userId));

          const adminNotifications = [...adminUserIdSet].map((adminUserId) => ({
            userId: adminUserId,
            title: "Suspicious transaction flagged",
            message: `Transaction ${contributionTransaction.transactionId} was flagged for review.`,
            type: "security",
            relatedTransactionId: contributionTransaction._id,
            relatedCommitteeId: committeeId,
          }));

          await Notification.create([
            {
              userId: membership.userId,
              title: "Your transaction was flagged",
              message: `Transaction ${contributionTransaction.transactionId} has been flagged for review.`,
              type: "security",
              relatedTransactionId: contributionTransaction._id,
              relatedCommitteeId: committeeId,
            },
            ...adminNotifications,
          ]);
        }

        await Notification.create({
          userId: membership.userId,
          title: "Contribution successful",
          message: "Your committee contribution was collected successfully.",
          type: "committee",
          relatedCommitteeId: committeeId,
        });
      } else {
        paymentRecord.status = "grace_period";
        paymentRecord.gracePeriodEndsAt = graceEndsAt;
        paymentRecord.completedAt = undefined;
        await paymentRecord.save();

        await Notification.create({
          userId: membership.userId,
          title: "Contribution pending in grace period",
          message: "Contribution collection failed. You have 24 hours grace period.",
          type: "committee",
          relatedCommitteeId: committeeId,
        });
      }

      paymentRecords.push(paymentRecord);
    }

    cycle.status = "collecting_payments";
    await cycle.save();

    return res.status(200).json({
      success: true,
      message: "Contribution collection initiated",
      data: {
        cycle,
        payments: paymentRecords,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const processPayout = async (req, res, next) => {
  try {
    const committeeId = req.body.committeeId;
    const cycleId = req.params.cycleId || req.body.cycleId;

    if (!committeeId || !cycleId) {
      return res.status(400).json({
        success: false,
        message: "committeeId and cycleId are required",
      });
    }

    const committee = await Committee.findById(committeeId);
    if (!committee) {
      return res.status(404).json({ success: false, message: "Committee not found" });
    }

    const cycle = await Cycle.findOne({ _id: cycleId, committeeId });
    if (!cycle) {
      return res.status(404).json({ success: false, message: "Cycle not found" });
    }

    if (!cycle.winnerUserId) {
      return res.status(400).json({ success: false, message: "Winner is not determined for this cycle" });
    }

    const paymentRecords = await PaymentRecord.find({ committeeId, cycleId });
    const now = new Date();

    const blockingPayments = paymentRecords.filter((payment) => {
      if (payment.status === "pending") {
        return true;
      }
      if (payment.status === "grace_period" && (!payment.gracePeriodEndsAt || payment.gracePeriodEndsAt > now)) {
        return true;
      }
      return false;
    });

    if (blockingPayments.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Payments are still pending collection or active grace period",
      });
    }

    for (const payment of paymentRecords) {
      if (payment.status === "grace_period" && payment.gracePeriodEndsAt && payment.gracePeriodEndsAt <= now) {
        payment.status = "failed";
        await payment.save();

        await Membership.updateOne(
          { committeeId, userId: payment.userId },
          { $set: { status: "defaulted" } }
        );
      }
    }

    const winnerWallet = await Wallet.findOne({ userId: cycle.winnerUserId });
    if (!winnerWallet) {
      return res.status(404).json({ success: false, message: "Winner wallet not found" });
    }

    const payoutAmount = Number(cycle.payoutAmount || cycle.potAmount - (cycle.winningDiscount || 0));
    winnerWallet.balance += payoutAmount;
    await winnerWallet.save();

    const winnerTransaction = await Transaction.create({
      transactionId: generateTransactionId(),
      receiverId: cycle.winnerUserId,
      committeeId,
      cycleId,
      amount: payoutAmount,
      type: "payout",
      status: "successful",
      description: "Cycle payout to winning member",
    });

    const remainingMembers = await Membership.find({
      committeeId,
      userId: { $ne: cycle.winnerUserId },
      status: "active",
    });

    const perMemberDiscountCreditRaw =
      remainingMembers.length > 0 ? Number(cycle.winningDiscount || 0) / remainingMembers.length : 0;
    const perMemberDiscountCredit = Math.round(perMemberDiscountCreditRaw);

    const discountCreditTransactions = [];
    for (const member of remainingMembers) {
      const wallet = await Wallet.findOne({ userId: member.userId });
      if (!wallet) {
        continue;
      }

      wallet.balance += perMemberDiscountCredit;
      await wallet.save();

      const tx = await Transaction.create({
        transactionId: generateTransactionId(),
        receiverId: member.userId,
        committeeId,
        cycleId,
        amount: perMemberDiscountCredit,
        type: "discount_credit",
        status: "successful",
        description: "Discount credit distribution",
      });
      discountCreditTransactions.push(tx);
    }

    await Membership.updateOne(
      { committeeId, userId: cycle.winnerUserId },
      { $set: { hasReceivedPayout: true } }
    );

    cycle.status = "completed";
    cycle.disbursedAt = new Date();
    await cycle.save();

    const nextCycleNumber = cycle.cycleNumber + 1;
    const nextPayoutDate = addCycleInterval(cycle.payoutDate, committee.cycleFrequency);
    const nextBiddingOpensAt = addDays(nextPayoutDate, -2);
    const nextBiddingClosesAt = addDays(nextPayoutDate, -1);

    const nextCycle = await Cycle.create({
      committeeId,
      cycleNumber: nextCycleNumber,
      potAmount: committee.contributionAmount * committee.memberCount,
      biddingOpensAt: nextBiddingOpensAt,
      biddingClosesAt: nextBiddingClosesAt,
      payoutDate: nextPayoutDate,
      status: "scheduled",
    });

    await recalculateTrustScore(committeeId);

    return res.status(200).json({
      success: true,
      message: "Payout processed successfully",
      data: {
        cycle,
        winnerTransaction,
        discountCreditTransactions,
        nextCycle,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  initiateContributions,
  processPayout,
  recalculateTrustScore,
};
