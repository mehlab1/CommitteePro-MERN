const errorMiddleware = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    console.error(err);
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: err.message || "Validation error",
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
  }

  if (isProduction) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: "Something went wrong",
    });
  }

  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Server Error",
  });
};

module.exports = errorMiddleware;
