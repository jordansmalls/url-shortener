import rateLimit from "express-rate-limit";

const defaultMessage = {
  message: "Too many requests, please try again later.",
};

/**
 * @description general light limiter
 * @route /api/urls (POST, GET)
 * @purpose allows generous usage for non heavy operations
 */
export const lightLimiter = rateLimit({
   // 15 minutes
  windowMs: 15 * 60 * 1000,
   // Limit each IP to 100 requests per 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: defaultMessage,
});

/**
 * @description general medium limiter
 * @route /api/urls/:id (PATCH, GET /buffer)
 * @purpose used for less frequent and medium impact operations
 */
export const mediumLimiter = rateLimit({
   // 15 minutes
  windowMs: 15 * 60 * 1000,
   // Limit each IP to 50 requests per 15 minutes
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: defaultMessage,
});

/**
 * @description slug check limiter
 * @route /api/urls/check-slug/:slug (GET)
 * @purpose heavily limits checks to prevent resource spamming
 */
export const slugCheckLimiter = rateLimit({
  // 20 minutes
  windowMs: 20 * 60 * 1000,
  // Limit each IP to 50 checks per 20 minutes
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Too many slug availability checks. Limit 50 checks per 20 minutes.",
  },
});
