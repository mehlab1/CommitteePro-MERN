const { body, param, validationResult } = require("express-validator");
const mongoose = require("mongoose");

const stripHtml = (value) => {
  if (typeof value !== "string") {
    return value;
  }
  return value.replace(/<[^>]*>/g, "").trim();
};

const sanitizeObjectStrings = (target) => {
  if (!target || typeof target !== "object") {
    return;
  }

  Object.keys(target).forEach((key) => {
    const value = target[key];
    if (typeof value === "string") {
      target[key] = stripHtml(value);
    } else if (Array.isArray(value)) {
      target[key] = value.map((item) => {
        if (typeof item === "string") {
          return stripHtml(item);
        }
        if (item && typeof item === "object") {
          sanitizeObjectStrings(item);
        }
        return item;
      });
    } else if (value && typeof value === "object") {
      sanitizeObjectStrings(value);
    }
  });
};

const sanitizeInputStrings = (req, res, next) => {
  sanitizeObjectStrings(req.body);
  sanitizeObjectStrings(req.query);
  sanitizeObjectStrings(req.params);
  return next();
};

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    success: false,
    message: "Validation failed",
    errors: errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    })),
  });
};

const validateRegister = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Valid email is required"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("phone").notEmpty().withMessage("Phone is required"),
  body("cnic").notEmpty().withMessage("CNIC is required"),
  handleValidationErrors,
];

const validateLogin = [
  body("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

const validateDeposit = [
  body("amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isFloat({ min: 1 })
    .withMessage("Amount must be greater than 0"),
  handleValidationErrors,
];

const validateWithdrawal = [
  body("amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isFloat({ min: 1 })
    .withMessage("Amount must be greater than 0"),
  handleValidationErrors,
];

const validateTransfer = [
  body("receiverId")
    .notEmpty()
    .withMessage("Receiver ID is required")
    .isMongoId()
    .withMessage("Receiver ID must be a valid ObjectId"),
  body("amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isFloat({ min: 1 })
    .withMessage("Amount must be greater than 0"),
  handleValidationErrors,
];

const validateObjectId = [
  param("id").isMongoId().withMessage("Invalid ID format"),
  handleValidationErrors,
];

const validateObjectIdParam = (paramName = "id") => {
  return (req, res, next) => {
    const value = req.params[paramName];
    if (!value || !mongoose.Types.ObjectId.isValid(value)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`,
      });
    }
    return next();
  };
};

module.exports = {
  validateRegister,
  validateLogin,
  validateDeposit,
  validateWithdrawal,
  validateTransfer,
  validateObjectId,
  validateObjectIdParam,
  sanitizeInputStrings,
};
