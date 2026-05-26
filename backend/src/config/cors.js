const normalizeOrigin = (origin) => origin.replace(/\/+$/, "");

const getAllowedOrigins = () => {
  const raw = process.env.CORS_ORIGIN || "";
  return raw
    .split(",")
    .map((origin) => normalizeOrigin(origin.trim()))
    .filter(Boolean);
};

const corsOptions = {
  origin(origin, callback) {
    const allowedOrigins = getAllowedOrigins();

    // Non-browser clients (e.g. Postman) may omit Origin
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = normalizeOrigin(origin);

    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

module.exports = { corsOptions, normalizeOrigin, getAllowedOrigins };
