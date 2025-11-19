import Url from "../models/url.model.js";

/**
 * Generate a slug if a user does not provide one on creation attempts.
 * The length of slugs are within the range of 1-12 chars.
 */

const VALID_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789-";

/**
 * @return {string}
 */

const generateSlugString = function () {
  let result = "";
  let len = Math.floor(Math.random() * 12) + 1;
  for (let i = 1; i <= len; ++i) {
    let idx = Math.floor(Math.random() * VALID_CHARS.length);
    result += VALID_CHARS[idx];
  }
  return result;
};

/**
 * Func to check if the argued string, slug, already exists in the DB.
 */

/**
 * @param {string} slug
 * @returns {boolean} - returns true if taken, false if available.
 */

const isSlugTaken = async (slug) =>
  (await Url.findOne({ slug })) ? true : false;

/**
 * Func to generate a valid, non-taken slug for users.
 */

/**
 * @return {string}
 */

const generateSlug = async function () {
  let slug;
  let taken = true;
  while (taken) {
    slug = generateSlugString();
    taken = await isSlugTaken(slug);
  }
  return slug;
};

export default generateSlug;
