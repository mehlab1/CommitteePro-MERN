const User = require("../models/User");
const Wallet = require("../models/Wallet");
const UserProfile = require("../models/UserProfile");

const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select("-passwordHash");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const profile = await UserProfile.findOne({ userId });
    const wallet = await Wallet.findOne({ userId });

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: {
        user,
        profile,
        wallet,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { name, displayName, phone, profilePhotoUrl } = req.body;

    const disallowedFields = ["role", "status", "balance", "passwordHash"];
    const attemptedBlockedField = disallowedFields.find((field) =>
      Object.prototype.hasOwnProperty.call(req.body, field)
    );

    if (attemptedBlockedField) {
      return res.status(400).json({
        success: false,
        message: `Updating ${attemptedBlockedField} is not allowed`,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (name !== undefined) {
      user.name = name;
    }

    if (phone !== undefined) {
      const existingPhone = await User.findOne({ phone, _id: { $ne: userId } });
      if (existingPhone) {
        return res.status(400).json({ success: false, message: "Phone already exists" });
      }
      user.phone = phone;
    }

    await user.save();

    let profile = await UserProfile.findOne({ userId });
    if (!profile) {
      profile = await UserProfile.create({
        userId,
        displayName: displayName || user.name,
        profilePhotoUrl: profilePhotoUrl || "",
      });
    } else {
      if (displayName !== undefined) {
        profile.displayName = displayName;
      }
      if (profilePhotoUrl !== undefined) {
        profile.profilePhotoUrl = profilePhotoUrl;
      }
      await profile.save();
    }

    const wallet = await Wallet.findOne({ userId });
    const updatedUser = await User.findById(userId).select("-passwordHash");

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: updatedUser,
        profile,
        wallet,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
};
