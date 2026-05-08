const morgan = require("morgan");

const loggingMiddleware =
  process.env.NODE_ENV === "production"
    ? morgan(":method :url :status :date[iso]")
    : morgan("dev");

module.exports = loggingMiddleware;
