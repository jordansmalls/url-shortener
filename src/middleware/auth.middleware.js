import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

/**
 * @description middleware to protect routes by ensuring the user is authenticated via JWT.expects JWT to be stored in an HTTP only cookie named 'jwt'. if successful, it attaches the authenticated user object to the request object as req.user and calls next()
 * @param {object} req - express request object
 * @param {object} res - express response object
 * @param {function} next - express next middleware function
 */

const protect = async (req, res, next) => {
  let token;

  token = req.cookies.jwt;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.userId).select("-password");

      next();
    } catch (err) {
      console.error(err);
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  } else {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
};

export { protect };
