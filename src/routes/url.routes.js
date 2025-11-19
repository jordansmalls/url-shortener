import e from "express";
const router = e.Router();
import {
  createUrl,
  createUrlFree,
  fetchUrlDetails,
  deleteUrl,
  checkSlug,
  fetchQrCodeBuffer,
  fetchUrlClicks,
  updateUrl,
} from "../controllers/url.controller.js";
import {
  getAllUserUrls,
  getTotalClicksAcrossAllUrls,
  deleteAllUserUrls,
  fetchUserHasUrls,
} from "../controllers/url.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  lightLimiter,
  mediumLimiter,
  slugCheckLimiter,
} from "../utils/url.rate.limit.js";

/**
 * @desc    Create new short URL (free)
 * @route   POST /api/urls/free
 * @access  PUBLIC
 */
router.post("/free", lightLimiter, createUrlFree);

/**
 * @desc    Get all shortened URLs belonging to the user
 * @route   GET /api/urls/me
 * @access  PRIVATE
 */
router.get("/me", protect, getAllUserUrls);

/**
 * @desc    Check if slug is available
 * @route   GET /api/urls/check-slug/:slug
 * @access  PUBLIC
 */
router.get("/check-slug/:slug", slugCheckLimiter, checkSlug);

/**
 * @desc    Get total click count across all user's URLs
 * @route   GET /api/urls/analytics/total-clicks
 * @access  PRIVATE
 */
router.get("/analytics/total-clicks", protect, getTotalClicksAcrossAllUrls);

/**
 * @desc    Delete ALL shortened URLs for the authenticated user
 * @route   DELETE /api/urls/all
 * @access  PRIVATE
 */
router.delete("/all", mediumLimiter, protect, deleteAllUserUrls);

/**
 * @desc    Create new short URL
 * @route   POST /api/urls
 * @access  PRIVATE
 */
router.post("/", lightLimiter, protect, createUrl);

/**
 * @desc    Get URL details by ID
 * @route   GET /api/urls/:id
 * @access  PRIVATE
 */
router.get("/:id", lightLimiter, protect, fetchUrlDetails);

/**
 * @desc    Update URL
 * @route   PATCH /api/urls/:id
 * @access  PRIVATE
 */
router.patch("/:id", mediumLimiter, protect, updateUrl);

/**
 * @desc    Delete URL
 * @route   DELETE /api/urls/:id
 * @access  PRIVATE
 */
router.delete("/:id", protect, deleteUrl);

/**
 * @desc    Get URL click statistics
 * @route   GET /api/urls/:id/times-used
 * @access  PRIVATE
 */
router.get("/:id/times-used", protect, fetchUrlClicks);

/**
 * @desc    Get QR code buffer
 * @route   GET /api/urls/:id/buffer
 * @access  PRIVATE
 */
// router.get("/:id/buffer", mediumLimiter, protect, fetchQrCodeBuffer);

router.get("/:id/buffer", fetchQrCodeBuffer);

/**
 * @desc    Check if user has any short URLs
 * @route   GET /api/urls/user/:userId
 * @access  PRIVATE
 */
router.get("/user/:userId", protect, fetchUserHasUrls);

export default router;
