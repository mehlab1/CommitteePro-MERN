const mongoose = require("mongoose");
const Wallet = require("../models/Wallet");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");
const generateTransactionId = require("../utils/generateTransactionId");
const { runSuspiciousRules } = require("../utils/suspiciousRules");

const getWallet = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user.userId });
    if (!wallet) {
      return res.status(404).json({ success: false, message: "Wallet not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Wallet fetched successfully",
      data: wallet,
    });
  } catch (error) {
    return next(error);
  }
};

const getWalletSummary = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user.userId });
    if (!wallet) {
      return res.status(404).json({ success: false, message: "Wallet not found" });
    }

    const summary = {
      totalInflow: wallet.totalDeposits + wallet.totalTransfersIn,
      totalOutflow: wallet.totalWithdrawals + wallet.totalTransfersOut,
      netFlow:
        wallet.totalDeposits +
        wallet.totalTransfersIn -
        wallet.totalWithdrawals -
        wallet.totalTransfersOut,
      availableBalance: wallet.balance,
    };

    return res.status(200).json({
      success: true,
      message: "Wallet summary fetched successfully",
      data: {
        wallet,
        summary,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const deposit = async (req, res, next) => {
  try {
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: "Amount must be greater than 0" });
    }

    const wallet = await Wallet.findOne({ userId: req.user.userId });
    if (!wallet) {
      return res.status(404).json({ success: false, message: "Wallet not found" });
    }

    wallet.balance += amount;
    wallet.totalDeposits += amount;
    await wallet.save();

    const transaction = await Transaction.create({
      transactionId: generateTransactionId(),
      receiverId: req.user.userId,
      amount,
      type: "deposit",
      status: "successful",
      description: "Wallet deposit",
    });

    return res.status(200).json({
      success: true,
      message: "Deposit successful",
      data: {
        wallet,
        transaction,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const withdraw = async (req, res, next) => {
  try {
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: "Amount must be greater than 0" });
    }

    const wallet = await Wallet.findOne({ userId: req.user.userId });
    if (!wallet) {
      return res.status(404).json({ success: false, message: "Wallet not found" });
    }

    if (wallet.balance < amount) {
      const failedTransaction = await Transaction.create({
        transactionId: generateTransactionId(),
        senderId: req.user.userId,
        amount,
        type: "withdrawal",
        status: "failed",
        description: "Withdrawal failed due to insufficient balance",
        suspiciousFlag: true,
        suspiciousReasons: ["insufficient_balance"],
      });

      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
        data: { transaction: failedTransaction },
      });
    }

    wallet.balance -= amount;
    wallet.totalWithdrawals += amount;
    await wallet.save();

    const transaction = await Transaction.create({
      transactionId: generateTransactionId(),
      senderId: req.user.userId,
      amount,
      type: "withdrawal",
      status: "successful",
      description: "Wallet withdrawal",
    });

    return res.status(200).json({
      success: true,
      message: "Withdrawal successful",
      data: {
        wallet,
        transaction,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const transfer = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const amount = Number(req.body.amount);
    const receiverInput = req.body.receiverId;

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: "Amount must be greater than 0" });
    }

    if (!receiverInput) {
      return res.status(400).json({ success: false, message: "receiverId is required" });
    }

    let receiverUser;
    if (mongoose.isValidObjectId(receiverInput)) {
      receiverUser = await User.findById(receiverInput);
    } else {
      receiverUser = await User.findOne({ email: String(receiverInput).toLowerCase().trim() });
    }

    if (!receiverUser) {
      return res.status(404).json({ success: false, message: "Receiver not found" });
    }

    if (String(receiverUser._id) === String(req.user.userId)) {
      return res.status(400).json({ success: false, message: "Self transfer is not allowed" });
    }

    if (receiverUser.status !== "active") {
      return res.status(400).json({ success: false, message: "Receiver is not active" });
    }

    let senderWallet;
    let receiverWallet;
    let transferTransaction;

    await session.withTransaction(async () => {
      senderWallet = await Wallet.findOne({ userId: req.user.userId }).session(session);
      receiverWallet = await Wallet.findOne({ userId: receiverUser._id }).session(session);

      if (!senderWallet || !receiverWallet) {
        throw new Error("Wallet not found for transfer");
      }

      if (senderWallet.balance < amount) {
        throw new Error("Insufficient balance");
      }

      senderWallet.balance -= amount;
      senderWallet.totalTransfersOut += amount;

      receiverWallet.balance += amount;
      receiverWallet.totalTransfersIn += amount;

      await senderWallet.save({ session });
      await receiverWallet.save({ session });

      const txId = generateTransactionId();
      transferTransaction = await Transaction.create(
        [
          {
            transactionId: txId,
            senderId: req.user.userId,
            receiverId: receiverUser._id,
            amount,
            type: "transfer",
            status: "successful",
            description: "Wallet transfer",
          },
        ],
        { session }
      );
    });

    let createdTransaction = Array.isArray(transferTransaction)
      ? transferTransaction[0]
      : transferTransaction;

    const suspiciousResult = await runSuspiciousRules(createdTransaction);
    if (suspiciousResult.isSuspicious) {
      createdTransaction = await Transaction.findByIdAndUpdate(
        createdTransaction._id,
        {
          $set: {
            suspiciousFlag: true,
            suspiciousReasons: suspiciousResult.reasons,
            status: "flagged",
          },
        },
        { new: true }
      );

      const adminUsers = await User.find({ role: "admin", status: "active" }).select("_id");
      const adminNotifications = adminUsers
        .filter((admin) => String(admin._id) !== String(req.user.userId))
        .map((admin) => ({
          userId: admin._id,
          title: "Suspicious transaction flagged",
          message: `Transaction ${createdTransaction.transactionId} was flagged for review.`,
          type: "security",
          relatedTransactionId: createdTransaction._id,
        }));

      await Notification.create([
        {
          userId: req.user.userId,
          title: "Your transaction was flagged",
          message: `Transaction ${createdTransaction.transactionId} has been flagged for review.`,
          type: "security",
          relatedTransactionId: createdTransaction._id,
        },
        ...adminNotifications,
      ]);
    }

    return res.status(200).json({
      success: true,
      message: "Transfer successful",
      data: {
        senderWallet,
        receiverWallet,
        transaction: createdTransaction,
      },
    });
  } catch (error) {
    const statusCode = error.message === "Insufficient balance" ? 400 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Transfer failed",
    });
  } finally {
    await session.endSession();
  }
};

module.exports = {
  getWallet,
  getWalletSummary,
  deposit,
  withdraw,
  transfer,
};
