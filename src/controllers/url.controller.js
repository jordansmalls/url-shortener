import Url from "../models/url.model.js";
import mongoose from "mongoose";
import generateSlug from "../utils/generate.slug.js";
import generateQrCodeBuffer from "../utils/generate.qr.js";

/**
 * @desc    Create new short URL
 * @route   POST /api/urls
 * @access  PRIVATE
 */
export const createUrl = async (req, res) => {
  let { redirectUrl, slug } = req.body;
  const id = req.user._id;

  if (!redirectUrl) {
    return res
      .status(400)
      .json({ message: "You must provide a URL to shorten." });
  }

  if (!id) {
    return res
      .status(401)
      .json({ message: "Invalid credentials (ID missing)." });
  }

  if (redirectUrl && !slug) {
    slug = await generateSlug();
  }

  try {
    // only check if slug is taken IF the user manually provided one. if it was auto-generated, the generateSlug function guarantees uniqueness
    if (slug) {
      const slugTaken = await Url.findOne({ slug });

      if (slugTaken) {
        return res
          .status(400)
          .json({ message: "Slug is already taken, please try again." });
      }
    }

    const DOMAIN = process.env.DOMAIN || "http://localhost:8000";
    const shortUrl = `${DOMAIN}/${slug}`;

    const qrCodeBuffer = await generateQrCodeBuffer(shortUrl);

    const URL = await Url.create({
      slug: slug,
      redirectUrl: redirectUrl,
      qrCodeBuffer: qrCodeBuffer,
      timesUsed: 0,
      ref: id,
    });

    if (!URL) {
      console.error(
        "There was a DB error creating a shortened URL: Document not returned.",
      );
      return res
        .status(500)
        .json({ message: "We're having trouble, please try again soon." });
    }

    return res.status(201).json({
      _id: URL._id,
      slug: URL.slug,
      redirectUrl: URL.redirectUrl,
      shortUrl: shortUrl,
      createdAt: URL.createdAt,
    });
  } catch (err) {
    console.error("There was an error creating a shortened URL:", err);
    return res
      .status(500)
      .json({ message: "We're having trouble, please try again." });
  }
};

/**
 * @desc    Create new short URL (free - no auth necessary)
 * @route   POST /api/urls/free
 * @access  PUBLIC
 */

export const createUrlFree = async (req, res) => {
  let { redirectUrl, slug } = req.body;

  if (!redirectUrl) {
    return res
      .status(400)
      .json({ message: "You must provide a URL to shorten." });
  }

  if (redirectUrl && !slug) {
    slug = await generateSlug();
  }

  try {
    if (slug) {
      const slugTaken = await Url.findOne({ slug });

      if (slugTaken) {
        return res
          .status(409)
          .json({ message: "Slug is already taken, please try again." });
      }
    }

    const DOMAIN = process.env.DOMAIN || "http://localhost:8000";
    const shortUrl = `${DOMAIN}/${slug}`;

    const qrCodeBuffer = await generateQrCodeBuffer(shortUrl);

    const URL = await Url.create({
      slug: slug,
      redirectUrl: redirectUrl,
      qrCodeBuffer: qrCodeBuffer,
      timesUsed: 0,
    });

    if (!URL) {
      console.error(
        "There was a DB error creating a shortened URL: Document not returned.",
      );
      return res
        .status(500)
        .json({ message: "We're having trouble, please try again soon." });
    }

    return res.status(201).json({
      _id: URL._id,
      slug: URL.slug,
      redirectUrl: URL.redirectUrl,
      shortUrl: shortUrl,
      createdAt: URL.createdAt,
    });
  } catch (err) {
    console.error("There was an error creating a shortened URL:", err);
    return res
      .status(500)
      .json({ message: "We're having trouble, please try again." });
  }
};

/**
 * @desc    Get URL details by ID
 * @route   GET /api/urls/:id
 * @access  PRIVATE
 */

export const fetchUrlDetails = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Missing authentication credentials." });
    }

    if (!id) {
      return res
        .status(400)
        .json({ message: "Bad Request: URL ID is missing." });
    }

    const url = await Url.findById(id);

    if (!url) {
      return res.status(404).json({ message: "URL not found." });
    }

    if (!url.ref.equals(userId)) {
      return res
        .status(403)
        .json({ message: "Forbidden: Not authorized to view this URL." });
    }

    return res.status(200).json(url);
  } catch (err) {
    console.error("There was an error fetching a URL's details:", err);
    return res
      .status(500)
      .json({ message: "We're having trouble, please try again later." });
  }
};

/**
 * @desc    Update URL (partial update - redirectUrl, slug, etc.)
 * @route   PATCH /api/urls/:id
 * @access  PRIVATE
 */

export const updateUrl = async (req, res) => {
  const { id } = req.params;
  const { redirectUrl, slug } = req.body;
  const userId = req.user._id;

  // get the base domain (used to form the full short URL)
  const DOMAIN = process.env.DOMAIN;

  const updates = {};
  let shouldUpdateQrCode = false;

  try {
    if (!userId) {
      return res.status(401).json({
        message: "Access denied. Must be authenticated to update URLs.",
      });
    }

    // 1. find existing document
    const existingUrl = await Url.findById(id);

    if (!existingUrl) {
      return res.status(404).json({ message: "URL not found." });
    }

    if (!existingUrl.ref.equals(userId)) {
      return res
        .status(403)
        .json({ message: "Forbidden. You can only update your own URLs." });
    }

    // 2. handle slug update and conflict check
    if (slug) {
      const normalizedSlug = slug.toLowerCase();

      if (normalizedSlug !== existingUrl.slug) {
        // Check if the new slug is already taken by a *different* document
        const slugTaken = await Url.findOne({ slug: normalizedSlug });

        if (slugTaken) {
          return res.status(400).json({
            message: "The new slug is already taken, please try another.",
          });
        }

        updates.slug = normalizedSlug;
        // slug changed, QR code must be updated
        shouldUpdateQrCode = true;
      }
    }

    // 3. handle redirect URL update
    if (redirectUrl && redirectUrl !== existingUrl.redirectUrl) {
      updates.redirectUrl = redirectUrl;
      // redirect URL changed, QR code must be updated
      shouldUpdateQrCode = true;
    }

    // 4. handle QR code regeneration (if necessary)
    // if either the slug or redirectUrl changed, the QR code must be regenerated
    if (shouldUpdateQrCode) {
      // use the potentially new slug and the base domain to form the short URL
      const finalSlug = updates.slug || existingUrl.slug;
      const shortUrl = `${DOMAIN}/${finalSlug}`;

      const newQrCodeBuffer = await generateQrCodeBuffer(shortUrl);
      updates.qrCodeBuffer = newQrCodeBuffer;
    }

    // 5. perform the mongoose update
    if (Object.keys(updates).length === 0) {
      return res.status(200).json({
        message: "No valid changes detected. URL remains unchanged.",
      });
    }

    const updatedUrl = await Url.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true },
    );

    const finalShortUrl = `${DOMAIN}/${updatedUrl.slug}`;

    return res.status(200).json({
      message: "URL updated successfully.",
      url: {
        _id: updatedUrl._id,
        slug: updatedUrl.slug,
        redirectUrl: updatedUrl.redirectUrl,
        shortUrl: finalShortUrl,
        createdAt: updatedUrl.createdAt,
        timesUsed: updatedUrl.timesUsed,
        qrCodeBuffer: updatedUrl.qrCodeBuffer,
      },
    });
  } catch (err) {
    console.error("There was an error updating a URL:", err);
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid URL ID format." });
    }
    return res
      .status(500)
      .json({ message: "We're having trouble, please try again." });
  }
};

/**
 * @desc    Delete URL
 * @route   DELETE /api/urls/:id
 * @access  PRIVATE
 */
export const deleteUrl = async (req, res) => {
  const id = req.params.id;
  const userId = req.user._id;

  try {
    if (!id || !userId) {
      return res
        .status(400)
        .json({ message: "Access denied. Credentials or URL ID missing." });
    }

    const urlToDelete = await Url.findById(id);

    if (!urlToDelete) {
      return res.status(404).json({ message: "URL not found." });
    }

    if (!urlToDelete.ref.equals(userId)) {
      return res
        .status(403)
        .json({ message: "Forbidden. You can only delete your own URLs." });
    }
    // if authorized, delete URL
    await Url.findByIdAndDelete(id);
    return res.status(204).send();
  } catch (err) {
    console.error("There was an error attempting to delete a URL:", err);
    return res
      .status(500)
      .json({ message: "We're having trouble, please try again." });
  }
};

/**
 * @desc    Redirect to target URL
 * @route   GET /:slug
 * @access  PUBLIC
 */

// `FRONTEND_LINK` if prod, else, `FRONTEND_LINK_DEV`
const FRONTEND_LINK_DEV = process.env.FRONTEND_LINK_DEV;
export const redirectToUrl = async (req, res) => {
  const { slug } = req.params;

  try {

    if(!slug) {
      return res.redirect(FRONTEND_LINK_DEV)
    }

    const url = await Url.findOne({ slug });

    if (!url) {
      // redirects to the homepage, or whatever page you want (link not found, 404, etc), of the frontend when not found
      return res.redirect(FRONTEND_LINK_DEV);
    } else {
      // add a click
      url.timesUsed = url.timesUsed + 1;
      url.save();
      return res.redirect(url.redirectUrl);
    }
  } catch (err) {
    console.error(
      "There was trouble attempting to redirecting a user to a URL:",
      err,
    );
    return res
      .status(500)
      .json({ message: "Oops! We messed up, please try again." });
  }
};

/**
 * @desc    Get URL click statistics
 * @route   GET /api/urls/:id/times-used
 * @access  PRIVATE
 */
export const fetchUrlClicks = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Missing credentials." });
    }

    if (!id) {
      return res.status(400).json({ message: "Bad Request: Missing URL ID." });
    }

    const url = await Url.findById(id);

    if (!url) {
      return res.status(404).json({ message: "URL not found." });
    }

    if (!url.ref.equals(userId)) {
      return res.status(403).json({ message: "Forbidden: Not authorized." });
    }

    const DOMAIN = process.env.DOMAIN || "http://localhost:8000";

    return res
      .status(200)
      .json({ url: `${DOMAIN}/${url.slug}`, timesUsed: url.timesUsed });
  } catch (err) {
    console.error("There was an error fetching a URL's number of clicks:", err);
    return res
      .status(500)
      .json({ message: "We're having trouble, please try again." });
  }
};

/**
 * @desc    Check if slug is available
 * @route   GET /api/urls/check-slug/:slug
 * @access  PUBLIC
 */
export const checkSlug = async (req, res) => {
  const { slug } = req.params;

  try {
    if (!slug) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const slugTaken = await Url.findOne({ slug: slug });

    if (slugTaken) {
      return res
        .status(409)
        .json({ message: "Slug in use, try again.", taken: true });
    } else {
      return res.status(200).json({ message: "Slug available!", taken: false });
    }
  } catch (err) {
    console.error(
      "There was an error checking the availability of a slug:",
      err,
    );
    return res
      .status(500)
      .json({ message: "We're having trouble, please try again." });
  }
};

/**
 * @desc    GET QR code buffer
 * @route   GET /api/urls/:id/buffer
 * @access  PRIVATE
 */
export const fetchQrCodeBuffer = async (req, res) => {
  const id = req.params;
  const userId = req.user._id;

  if (!userId) {
    return res
      .status(401)
      .json({ message: "Unauthorized: Missing authentication credentials." });
  }

  try {
    const url = await Url.findById(id);

    // 2. check existence before authorization
    if (!url) {
      return res.status(404).json({ message: "URL not found." });
    }

    // 3. check authorization (ownership)
    if (!url.ref.equals(userId)) {
      return res.status(403).json({ message: "Forbidden: Not authorized." });
    }

    // 4. return the Buffer as a raw image response
    res.setHeader("Content-Type", "image/png");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="qr-code-${url.slug}.png"`,
    );
    return res.status(200).send(url.qrCodeBuffer);
  } catch (err) {
    console.error("Error fetching QR code buffer:", err);

    // handle mongoose CastError
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid URL ID format." });
    }
    return res
      .status(500)
      .json({ message: "We're having trouble, please try again." });
  }
};

/**
 * @desc    Check if user has any short URLs
 * @route   GET /api/urls/user/:userId
 * @access  PRIVATE
 */
export const fetchUserHasUrls = async (req, res) => {
  const userId = req.params.userId;

  try {
    if (!userId) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const urls = await Url.find({ ref: userId });

    if (urls.length < 1) {
      return res.status(200).json({
        message: "User has no short URLs.",
        hasUrls: false,
        urls: [],
      });
    } else {
      return res.status(200).json({
        message: `User has ${urls.length} short URL's.`,
        hasUrls: true,
        urls: urls,
      });
    }
  } catch (err) {
    console.error(
      "There was an error checking if a user has any short URLs:",
      err,
    );
    return res
      .status(500)
      .json({ message: "We're having trouble, please try again." });
  }
};

/**
 * @desc    Get all shortened URLs belonging to the user
 * @route   GET /api/urls/me
 * @access  PRIVATE
 */
export const getAllUserUrls = async (req, res) => {
  const userId = req.user._id;

  if (!userId) {
    return res
      .status(401)
      .json({ message: "Unauthorized: Missing authentication credentials." });
  }

  try {
    // find all URLs where the 'ref' field matches the authenticated user's ID
    const urls = await Url.find({ ref: userId })
      .select("-qrCodeBuffer")
      .sort({ createdAt: -1 });

    if (!urls || urls.length === 0) {
      return res.status(200).json([]);
    }

    return res.status(200).json(urls);
  } catch (err) {
    console.error("Error fetching all user URLs:", err);
    return res
      .status(500)
      .json({ message: "We're having trouble retrieving your URLs, please try again soon." });
  }
};

/**
 * @desc    Get total click count across all user's URLs
 * @route   GET /api/urls/analytics/total-clicks
 * @access  PRIVATE
 */
export const getTotalClicksAcrossAllUrls = async (req, res) => {
  const userId = req.user._id;

  if (!userId) {
    return res
      .status(401)
      .json({ message: "Unauthorized: Missing authentication credentials." });
  }

  // ensure userId is a mongoose ObjectId for proper aggregation matching
  const userIdObjectId = new mongoose.Types.ObjectId(userId);

  try {
    const result = await Url.aggregate([
      {
        // 1. filter documents to include only those owned by the user
        $match: {
          ref: userIdObjectId,
        },
      },
      {
        // 2. group all matching documents into a single group and sum 'timesUsed'
        $group: {
          _id: null, // Group all results together
          totalClicks: { $sum: "$timesUsed" },
        },
      },
    ]);

    // if the result array is empty (user has no URLs), the total is 0.
    const totalClicks = result.length > 0 ? result[0].totalClicks : 0;
    return res.status(200).json({ totalClicks: totalClicks });
  } catch (err) {
    console.error("Error fetching total URL clicks:", err);
    return res
      .status(500)
      .json({ message: "We're having trouble calculating your analytics, please try again soon." });
  }
};

/**
 * @desc    Delete ALL shortened URLs for the authenticated user
 * @route   DELETE /api/urls/all
 * @access  PRIVATE
 */
export const deleteAllUserUrls = async (req, res) => {
  const userId = req.user._id;

  if (!userId) {
    return res
      .status(401)
      .json({ message: "Unauthorized: Missing authentication credentials." });
  }

  try {
    const result = await Url.deleteMany({ ref: userId });
    // result.deletedCount will show how many documents were removed
    // return 204 No Content for a successful deletion operation
    return res.status(204).send();
  } catch (err) {
    console.error("Error deleting all user URLs:", err);
    return res
      .status(500)
      .json({ message: "We're having trouble deleting your URLs, please try again soon." });
  }
};
