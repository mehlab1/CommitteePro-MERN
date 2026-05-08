const Committee = require("../models/Committee");
const Membership = require("../models/Membership");
const InviteToken = require("../models/InviteToken");
const Cycle = require("../models/Cycle");
const PaymentRecord = require("../models/PaymentRecord");
const UserProfile = require("../models/UserProfile");

const MIN_START_OFFSET_DAYS = 3;

const createCommittee = async (req, res, next) => {
  try {
    const {
      name,
      contributionAmount,
      memberCount,
      cycleFrequency,
      payoutModel,
      startDate,
    } = req.body;

    if (
      !name ||
      contributionAmount === undefined ||
      memberCount === undefined ||
      !cycleFrequency ||
      !payoutModel ||
      !startDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All fields are required: name, contributionAmount, memberCount, cycleFrequency, payoutModel, startDate",
      });
    }

    const parsedMemberCount = Number(memberCount);
    if (!Number.isInteger(parsedMemberCount) || parsedMemberCount < 4 || parsedMemberCount > 20) {
      return res.status(400).json({
        success: false,
        message: "memberCount must be an integer between 4 and 20",
      });
    }

    const parsedContributionAmount = Number(contributionAmount);
    if (!Number.isFinite(parsedContributionAmount) || parsedContributionAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "contributionAmount must be a positive number",
      });
    }

    const parsedStartDate = new Date(startDate);
    if (Number.isNaN(parsedStartDate.getTime())) {
      return res.status(400).json({ success: false, message: "startDate is invalid" });
    }

    const minAllowedDate = new Date();
    minAllowedDate.setDate(minAllowedDate.getDate() + MIN_START_OFFSET_DAYS);
    if (parsedStartDate <= minAllowedDate) {
      return res.status(400).json({
        success: false,
        message: "startDate must be in the future and at least 3 days ahead",
      });
    }

    const committee = await Committee.create({
      name,
      createdBy: req.user.userId,
      contributionAmount: parsedContributionAmount,
      memberCount: parsedMemberCount,
      cycleFrequency,
      payoutModel,
      startDate: parsedStartDate,
      status: "pending",
    });

    await Membership.create({
      userId: req.user.userId,
      committeeId: committee._id,
      role: "admin",
      hasSignedAgreement: false,
    });

    return res.status(201).json({
      success: true,
      message: "Committee created successfully",
      data: committee,
    });
  } catch (error) {
    return next(error);
  }
};

const getMyCommittees = async (req, res, next) => {
  try {
    const memberships = await Membership.find({ userId: req.user.userId }).populate("committeeId");

    const adminCommittees = [];
    const memberCommittees = [];

    memberships.forEach((membership) => {
      if (!membership.committeeId) {
        return;
      }

      if (membership.role === "admin") {
        adminCommittees.push(membership.committeeId);
      } else {
        memberCommittees.push(membership.committeeId);
      }
    });

    return res.status(200).json({
      success: true,
      message: "Committees fetched successfully",
      data: {
        adminCommittees,
        memberCommittees,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getCommitteeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const committee = await Committee.findById(id);
    if (!committee) {
      return res.status(404).json({ success: false, message: "Committee not found" });
    }

    const requesterMembership = await Membership.findOne({
      committeeId: id,
      userId: req.user.userId,
    });

    if (!requesterMembership) {
      return res.status(403).json({ success: false, message: "Forbidden: Not a committee member" });
    }

    const memberships = await Membership.find({ committeeId: id }).populate("userId", "_id name");
    const memberUserIds = memberships.map((membership) => membership.userId?._id).filter(Boolean);

    const profiles = await UserProfile.find({ userId: { $in: memberUserIds } }).select(
      "userId displayName trustScore"
    );
    const profileMap = new Map(profiles.map((profile) => [String(profile.userId), profile]));

    let activeCycle = await Cycle.findOne({
      committeeId: id,
      status: { $ne: "completed" },
    }).sort({ cycleNumber: -1 });

    if (!activeCycle) {
      activeCycle = await Cycle.findOne({ committeeId: id }).sort({ cycleNumber: -1 });
    }

    let paymentStatusMap = new Map();
    if (activeCycle) {
      const paymentRecords = await PaymentRecord.find({
        committeeId: id,
        cycleId: activeCycle._id,
      }).select("userId status");
      paymentStatusMap = new Map(
        paymentRecords.map((paymentRecord) => [String(paymentRecord.userId), paymentRecord.status])
      );
    }

    const members = memberships.map((membership) => {
      const user = membership.userId;
      const profile = user ? profileMap.get(String(user._id)) : null;

      return {
        userId: user?._id || null,
        displayName: profile?.displayName || user?.name || null,
        trustScore: profile?.trustScore ?? null,
        paymentStatus: paymentStatusMap.get(String(user?._id)) || "pending",
        role: membership.role,
        hasSignedAgreement: membership.hasSignedAgreement,
        hasReceivedPayout: membership.hasReceivedPayout,
        membershipStatus: membership.status,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Committee fetched successfully",
      data: {
        committee,
        members,
        currentActiveCycle: activeCycle,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const generateInvite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const committee = await Committee.findById(id);

    if (!committee) {
      return res.status(404).json({ success: false, message: "Committee not found" });
    }

    const committeeAdminMembership = await Membership.findOne({
      committeeId: id,
      userId: req.user.userId,
      role: "admin",
    });

    if (!committeeAdminMembership) {
      return res.status(403).json({ success: false, message: "Forbidden: Admin only" });
    }

    await InviteToken.updateMany({ committeeId: id, isActive: true }, { $set: { isActive: false } });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const inviteToken = await InviteToken.create({
      committeeId: id,
      createdBy: req.user.userId,
      expiresAt,
      isActive: true,
    });

    return res.status(200).json({
      success: true,
      message: "Invite generated successfully",
      data: {
        token: inviteToken.token,
        expiresAt: inviteToken.expiresAt,
        inviteLink: `${process.env.FRONTEND_URL}/join/${inviteToken.token}`,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createCommittee,
  getMyCommittees,
  getCommitteeById,
  generateInvite,
};
