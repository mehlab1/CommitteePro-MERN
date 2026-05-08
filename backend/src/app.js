const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const loggingMiddleware = require("./middlewares/loggingMiddleware");
const notFoundMiddleware = require("./middlewares/notFoundMiddleware");
const errorMiddleware = require("./middlewares/errorMiddleware");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const walletRoutes = require("./routes/walletRoutes");
const committeeRoutes = require("./routes/committeeRoutes");
const bidRoutes = require("./routes/bidRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(loggingMiddleware);

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    status: "OK",
    timestamp: new Date(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/committees", committeeRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/payments", paymentRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
