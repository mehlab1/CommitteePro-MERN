const mongoose = require("mongoose");
const Bid = require("../models/Bid");
const Cycle = require("../models/Cycle");
const Membership = require("../models/Membership");
const PaymentRecord = require("../models/PaymentRecord");

const BLOCKING_PAYMENT_STATUSES = ["pending", "failed", "grace_period"];

const placeBid = async (req, res, next) => {
  try {
    const { committeeId, cycleId, discountAmount } = req.body;

    if (!committeeId || !cycleId || discountAmount === undefined) {
      return res.status(400).json({
        success: false,
        message: "committeeId, cycleId, and discountAmount are required",
      });
    }

    const parsedDiscountAmount = Number(discountAmount);
    if (!Number.isFinite(parsedDiscountAmount) || parsedDiscountAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "discountAmount must be greater than 0",
      });
    }

    const cycle = await Cycle.findOne({ _id: cycleId, committeeId });
    if (!cycle) {
      return res.status(404).json({ success: false, message: "Cycle not found" });
    }

    if (parsedDiscountAmount >= cycle.potAmount) {
      return res.status(400).json({
        success: false,
        message: "discountAmount must be less than potAmount",
      });
    }

    if (cycle.status !== "bidding_open") {
      return res.status(400).json({
        success: false,
        message: "Bidding is not open for this cycle",
      });
    }

    const membership = await Membership.findOne({
      committeeId,
      userId: req.user.userId,
    });

    if (!membership) {
      return res.status(403).json({ success: false, message: "Forbidden: Not a committee member" });
    }

    if (membership.hasReceivedPayout) {
      return res.status(400).json({
        success: false,
        message: "User has already received payout in this committee",
      });
    }

    const currentAndPreviousCycles = await Cycle.find({
      committeeId,
      cycleNumber: { $lte: cycle.cycleNumber },
    }).select("_id");

    const cycleIdsToCheck = currentAndPreviousCycles.map((item) => item._id);
    const outstandingPayment = await PaymentRecord.findOne({
      committeeId,
      userId: req.user.userId,
      cycleId: { $in: cycleIdsToCheck },
      status: { $in: BLOCKING_PAYMENT_STATUSES },
    });

    if (outstandingPayment) {
      return res.status(400).json({
        success: false,
        message: "Outstanding payments found in current or previous cycles",
      });
    }

    const existingBid = await Bid.findOne({
      cycleId,
      bidderUserId: req.user.userId,
    });

    if (existingBid) {
      return res.status(400).json({
        success: false,
        message: "User has already placed a bid in this cycle",
      });
    }

    const bid = await Bid.create({
      committeeId,
      cycleId,
      bidderUserId: req.user.userId,
      discountAmount: parsedDiscountAmount,
      status: "active",
    });

    return res.status(201).json({
      success: true,
      message: "Bid placed successfully",
      data: bid,
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "User has already placed a bid in this cycle",
      });
    }
    return next(error);
  }
};

const getBidsByCycle = async (req, res, next) => {
  try {
    const { cycleId } = req.params;

    const bids = await Bid.find({ cycleId }).sort({ submittedAt: 1 });
    const anonymizedBids = bids.map((bid) => ({
      discountAmount: bid.discountAmount,
      submittedAt: bid.submittedAt,
    }));

    const currentUserBid = bids.find((bid) => String(bid.bidderUserId) === String(req.user.userId));

    return res.status(200).json({
      success: true,
      message: "Bids fetched successfully",
      data: {
        bids: anonymizedBids,
        myBid: currentUserBid
          ? {
              _id: currentUserBid._id,
              committeeId: currentUserBid.committeeId,
              cycleId: currentUserBid.cycleId,
              bidderUserId: currentUserBid.bidderUserId,
              discountAmount: currentUserBid.discountAmount,
              submittedAt: currentUserBid.submittedAt,
              status: currentUserBid.status,
            }
          : null,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const closeBiddingWindow = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const { cycleId } = req.params;
    const now = new Date();

    let closedCycle;
    let winningBid = null;

    await session.withTransaction(
      async () => {
        const cycle = await Cycle.findOne({
          _id: cycleId,
          biddingClosesAt: { $lte: now },
          status: "bidding_open",
        }).session(session);

        if (!cycle) {
          const error = new Error(
            "No open bidding cycle found for closure (must be bidding_open and past close time)"
          );
          error.statusCode = 404;
          throw error;
        }

        const bids = await Bid.find({ cycleId: cycle._id, status: "active" })
          .sort({ discountAmount: -1, submittedAt: 1 })
          .session(session);

        if (bids.length > 0) {
          winningBid = bids[0];
          const losingBidIds = bids.slice(1).map((bid) => bid._id);

          await Bid.updateOne({ _id: winningBid._id }, { $set: { status: "won" } }, { session });

          if (losingBidIds.length > 0) {
            await Bid.updateMany({ _id: { $in: losingBidIds } }, { $set: { status: "lost" } }, { session });
          }

          cycle.winnerUserId = winningBid.bidderUserId;
          cycle.winningDiscount = winningBid.discountAmount;
          cycle.payoutAmount = cycle.potAmount - winningBid.discountAmount;
        } else {
          cycle.winnerUserId = undefined;
          cycle.winningDiscount = 0;
          cycle.payoutAmount = cycle.potAmount;
        }

        cycle.status = "winner_determined";
        await cycle.save({ session });
        closedCycle = cycle;
      },
      {
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Bidding window closed successfully",
      data: {
        cycle: closedCycle,
        winningBid,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return next(error);
  } finally {
    await session.endSession();
  }
};

module.exports = {
  placeBid,
  getBidsByCycle,
  closeBiddingWindow,
};
