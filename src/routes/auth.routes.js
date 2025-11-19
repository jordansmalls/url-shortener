import e from "express";
const router = e.Router();
import {
  checkUsernameAvailability,
  createUserAccount,
  deactivateUserAccount,
  fetchUserAccountInfo,
  loginUserAccount,
  logoutUserAccount,
  updateAccountPassword,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  strictLimiter,
  lightLimiter,
  usernameCheckLimiter,
} from "../utils/auth.rate.limit.js";

/**
 * @desc    Create user account
 * @route   POST /api/auth
 * @access  PUBLIC
 */
router.post("/", strictLimiter, createUserAccount);

/**
 * @desc    Checks if a username is available
 * @route   GET /api/auth/:username
 * @access  PUBLIC
 */
router.get("/:username", usernameCheckLimiter, checkUsernameAvailability);

/**
 * @desc    Log in to user account
 * @route   POST /api/auth/login
 * @access  PUBLIC
 */
router.post("/login", strictLimiter, loginUserAccount);

/**
 * @desc    Log out of user account
 * @route   POST /api/auth/logout
 * @access  PUBLIC
 */
router.post("/logout", lightLimiter, logoutUserAccount);

/**
 * @desc    Deactivate user account
 * @route   POST /api/auth/deactivate
 * @access  PRIVATE
 */
router.post("/deactivate", lightLimiter, protect, deactivateUserAccount);

/**
 * @desc    Fetch user account info
 * @route   GET /api/auth/me
 * @access  PRIVATE
 */
router.get("/me", lightLimiter, protect, fetchUserAccountInfo);

/**
 * @desc    Change user password
 * @route   PUT /api/auth
 * @access  PRIVATE
 */
router.put("/", strictLimiter, protect, updateAccountPassword);

export default router;
