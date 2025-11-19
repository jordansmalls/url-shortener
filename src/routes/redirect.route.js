import { redirectToUrl } from "../controllers/url.controller.js";
import e from "express";
const router = e.Router();

/**
 * @desc    Redirect to target URL
 * @route   GET /:slug
 * @access  PUBLIC
 */

router.get("/:slug", redirectToUrl);

export default router;
