import jwt from "jsonwebtoken";

/**
 * @description generates a JWT, signs it, and sets it as an HTTP only cookie in the response. this is the standard method for establishing a secure, persistent user session.
 * @param {object} res - express response object to attach the cookie to
 * @param {string} userId - the user's mongoDB ID or a unique identifier to be stored in the JWT payload
 * @returns {object} the express response object with the cookie set
 */

const generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  return res.cookie("jwt", token, {
    httpOnly: true,
    // use secure cookies in production
    secure: process.env.NODE_ENV !== "development",
    // prevent CSRF attacks
    sameSite: "strict",
    // 30 days
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

export default generateToken;
