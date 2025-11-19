import rateLimit from "express-rate-limit";

const defaultMessage = {
  message: "Too many requests. Please try again later.",
};

/**
 * @description strict limiter (login, create sccount, update password)
 * @purpose prevents brute force attacks and creation spam. high security risk
 */
export const strictLimiter = rateLimit({
   // 5 minutes
  windowMs: 5 * 60 * 1000,
  // limit each IP to 10 requests per 5 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Too many login/account creation attempts. Please try again in 5 minutes.",
  },
});

/**
 * @description light limiter (logout, fetch info, deactivate)
 * @purpose low to medium security risk. generous limit for normal user actions
 */
export const lightLimiter = rateLimit({
   // 15 minutes
  windowMs: 15 * 60 * 1000,
  // limit each IP to 100 requests per 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: defaultMessage,
});

/**
 * @description username check limiter (check availability)
 * @purpose prevents spamming of the API to check for existing usernames
 */
export const usernameCheckLimiter = rateLimit({
   // 10 minutes
  windowMs: 10 * 60 * 1000,
   // Limit each IP to 60 checks per 10 minutes (1 check per 10 seconds average)
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Too many username availability checks. Please wait and try again.",
  },
});
