import User from "../models/user.model.js";
import generateToken from "../utils/generate.jwt.js";

/**
 * @desc    Create user account
 * @route   POST /api/auth
 * @access  PUBLIC
 */

export const createUserAccount = async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const usernameTaken = await User.findOne({ username });

    if (usernameTaken) {
      return res.status(409).json({ message: "Username is already in use." });
    }

    // frontend will handle validation - password must be 8 chars, username must be between 3-20 chars, upper/lower chars numbers and underscores

    const user = await User.create({
      username,
      password,
      active: true,
    });

    if (!user) {
      console.error("There was a DB error creating a user account!");
      return res.status(500).json({
        message: "We had some trouble creating your account, please try again.",
      });
    } else {
      // generate JWT -> logging users in on account creation
      generateToken(res, user._id);
      return res.status(201).json({
        _id: user._id,
        username: user.username,
        createdAt: user.createdAt,
      });
    }
  } catch (err) {
    console.error("There was an error creating a user account:", err);
    return res
      .status(500)
      .json({ message: "We're having trouble, please try again." });
  }
};

/**
 * @desc    Checks if a username is available
 * @route   GET /api/auth/:username
 * @access  PUBLIC
 */

export const checkUsernameAvailability = async (req, res) => {
  const { username } = req.params;

  try {
    if (!username || typeof username !== "string" || username.length < 3) {
      return res
        .status(400)
        .json({ message: "Invalid username format or length." });
    }
    const taken = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, "i") },
    });

    if (taken) {
      return res
        .status(200)
        .json({ message: "Username is not available.", taken: true });
    } else {
      // username not found, so it is available.
      return res
        .status(200)
        .json({ message: "Username is available.", taken: false });
    }
  } catch (err) {
    console.error(
      "There was an error checking the availability of a username:",
      err,
    );
    return res
      .status(500)
      .json({ message: "We're having trouble, please try again." });
  }
};

/**
 * @desc    Log in to user account
 * @route   POST /api/auth/login
 * @access  PUBLIC
 */

export const loginUserAccount = async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res
        .status(404)
        .json({ message: "An account with that username does not exist!" });
    }

    if (user && user.active && (await user.matchPassword(password))) {
      // generate JWT and respond with success
      generateToken(res, user._id);
      return res.status(200).json({
        message: "Logged in successfully, welcome back.",
        _id: user._id,
        username: user.username,
        createdAt: user.createdAt,
      });
    } else {
      return res.status(401).json({ message: "Invalid username or password." });
    }
  } catch (err) {
    console.error("There was an error attempting to log in a user:", err);
    return res.status(500).json({
      message: "We're having trouble logging you in, please try again.",
    });
  }
};

/**
 * @desc    Log out of user account
 * @route   POST /api/auth/logout
 * @access  PUBLIC
 */

export const logoutUserAccount = (req, res) => {
  try {
    res.cookie("jwt", "", {
      httpOnly: true,
      expires: new Date(0),
    });
    return res
      .status(200)
      .json({ message: "Logged out successfully. Please come back." });
  } catch (err) {
    console.error("There was an error attempting to log out a user:", err);
    return res.status(500).json({
      message: "We're having trouble logging you out, please try again.",
    });
  }
};

/**
 * @desc    Deactivate user account
 * @route   POST /api/auth/deactivate
 * @access  PRIVATE
 */

export const deactivateUserAccount = async (req, res) => {
  const id = req.user._id;

  try {
    if (!id) {
      return res
        .status(401)
        .json({ message: "Invalid credentials (ID missing)." });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // deactivate the user
    user.active = false;
    const success = await user.save();

    if (success) {
      // destroy cookie (logging user out)
      res.cookie("jwt", "", {
        httpOnly: true,
        expires: new Date(0),
      });

      return res.status(200).json({
        message: "Account successfully deactivated. Please come back soon.",
      });
    } else {
      console.error("Failed to save user (set active=false).");
      return res.status(500).json({
        message:
          "We're having trouble deactivating your account, please try again soon.",
      });
    }
  } catch (err) {
    console.error(
      "There was an error attempting to deactivate a user account:",
      err,
    );
    return res.status(500).json({
      message:
        "We're having trouble deactivating your account, please try again soon.",
    });
  }
};

/**
 * @desc    Fetch user account info
 * @route   GET /api/auth/me
 * @access  PRIVATE
 */

export const fetchUserAccountInfo = async (req, res) => {
  const id = req.user._id;

  try {
    if (!id) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    } else {
      return res.status(200).json({
        _id: user._id,
        username: user.username,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    }
  } catch (err) {
    console.error(
      "There was an error fetching the details of an account:",
      err,
    );
    return res
      .status(500)
      .json({ message: "We're having trouble, please try again." });
  }
};

/**
 * @desc    Change user password
 * @route   PUT /api/auth
 * @access  PRIVATE
 */

export const updateAccountPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const id = req.user._id;

  try {
    if (!id || !currentPassword || !newPassword) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // find user by their authenticated ID
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // check if current password is correct
    const isCurrentPasswordValid = await user.matchPassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({ message: "Incorrect current password." });
    }

    // update user password - hashed by pre save method DB
    user.password = newPassword;
    const success = await user.save();

    if (success) {
      return res
        .status(200)
        .json({ message: "Password updated successfully." });
    } else {
      console.error(
        "There was a DB error while attempting to update a user's password.",
      );
      return res
        .status(500)
        .json({ message: "We're having trouble, please try again." });
    }
  } catch (err) {
    console.error(
      "There was an error attempting to update a user's password:",
      err,
    );
    return res.status(500).json({
      message: "We're having trouble updating your password, please try again.",
    });
  }
};
