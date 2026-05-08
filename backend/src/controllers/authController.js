const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const UserProfile = require("../models/UserProfile");

const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "7d" }
  );
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, cnic } = req.body;

    if (!name || !email || !password || !phone || !cnic) {
      return res.status(400).json({
        success: false,
        message: "All fields are required: name, email, password, phone, cnic",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { phone }, { cnic }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ success: false, message: "Email already exists" });
      }
      if (existingUser.phone === phone) {
        return res.status(400).json({ success: false, message: "Phone already exists" });
      }
      if (existingUser.cnic === cnic) {
        return res.status(400).json({ success: false, message: "CNIC already exists" });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      passwordHash,
      phone,
      cnic,
    });

    const wallet = await Wallet.create({
      userId: user._id,
      balance: 0,
    });

    const profile = await UserProfile.create({
      userId: user._id,
      displayName: name,
      trustScore: 60,
    });

    const token = generateToken(user);
    const userObject = user.toObject();
    delete userObject.passwordHash;

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        token,
        user: userObject,
        wallet,
        profile,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (user.status === "blocked") {
      return res.status(403).json({
        success: false,
        message: "Account is blocked",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);
    const userObject = user.toObject();
    delete userObject.passwordHash;

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: userObject,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select("-passwordHash");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const wallet = await Wallet.findOne({ userId });
    const profile = await UserProfile.findOne({ userId });

    return res.status(200).json({
      success: true,
      message: "User profile fetched successfully",
      data: {
        user,
        wallet,
        profile,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logout successful. Please remove token on client side.",
  });
};

module.exports = {
  register,
  login,
  getMe,
  logout,
};
