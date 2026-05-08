const Committee = require("../models/Committee");
const Membership = require("../models/Membership");
const InviteToken = require("../models/InviteToken");
const Cycle = require("../models/Cycle");
const PaymentRecord = require("../models/PaymentRecord");
const UserProfile = require("../models/UserProfile");
const AgreementSignature = require("../models/AgreementSignature");

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

const joinCommittee = async (req, res, next) => {
  try {
    const { token } = req.params;

    const inviteToken = await InviteToken.findOne({ token, isActive: true });
    if (!inviteToken) {
      return res.status(404).json({ success: false, message: "Invite token is invalid" });
    }

    if (inviteToken.expiresAt <= new Date()) {
      return res.status(400).json({ success: false, message: "Invite token has expired" });
    }

    const committee = await Committee.findById(inviteToken.committeeId);
    if (!committee) {
      return res.status(404).json({ success: false, message: "Committee not found" });
    }

    const memberCount = await Membership.countDocuments({ committeeId: committee._id });
    if (memberCount >= committee.memberCount) {
      return res.status(400).json({ success: false, message: "Committee is already full" });
    }

    const existingMembership = await Membership.findOne({
      committeeId: committee._id,
      userId: req.user.userId,
    });
    if (existingMembership) {
      return res.status(400).json({ success: false, message: "User is already a committee member" });
    }

    await Membership.create({
      userId: req.user.userId,
      committeeId: committee._id,
      role: "member",
      status: "pending",
      hasSignedAgreement: false,
    });

    return res.status(200).json({
      success: true,
      message: "Joined committee successfully",
    });
  } catch (error) {
    return next(error);
  }
};

const signAgreement = async (req, res, next) => {
  try {
    const { id: committeeId } = req.params;

    const committee = await Committee.findById(committeeId);
    if (!committee) {
      return res.status(404).json({ success: false, message: "Committee not found" });
    }

    const membership = await Membership.findOne({
      committeeId,
      userId: req.user.userId,
    });

    if (!membership) {
      return res.status(403).json({ success: false, message: "Forbidden: Not a committee member" });
    }

    await AgreementSignature.findOneAndUpdate(
      { userId: req.user.userId, committeeId },
      {
        $set: {
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"] || "unknown",
          signedAt: new Date(),
        },
        $setOnInsert: {
          userId: req.user.userId,
          committeeId,
          agreementVersion: "v1.0",
        },
      },
      { upsert: true, new: true }
    );

    membership.hasSignedAgreement = true;
    await membership.save();

    const totalMemberships = await Membership.countDocuments({ committeeId });
    const signedMemberships = await Membership.countDocuments({ committeeId, hasSignedAgreement: true });
    const allMembersSigned = totalMemberships > 0 && totalMemberships === signedMemberships;
    const startDateReached = committee.startDate <= new Date();

    if (allMembersSigned && startDateReached) {
      committee.status = "active";
      await committee.save();

      const existingFirstCycle = await Cycle.findOne({ committeeId, cycleNumber: 1 });
      if (!existingFirstCycle) {
        await Cycle.create({
          committeeId,
          cycleNumber: 1,
          potAmount: committee.contributionAmount * committee.memberCount,
          payoutDate: committee.startDate,
          status: "scheduled",
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Agreement signed successfully",
      data: {
        allMembersSigned,
        committeeStatus: allMembersSigned && startDateReached ? "active" : committee.status,
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
  joinCommittee,
  signAgreement,
};
