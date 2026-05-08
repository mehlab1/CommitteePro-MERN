const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id;
    const user = await User.findById(userId).select("status role");

    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (user.status === "blocked") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    req.user = {
      ...decoded,
      userId,
      role: user.role,
      status: user.status,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
};

module.exports = authMiddleware;
