const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { validationResult } = require("express-validator");
const sendEmail = require("../utils/sendEmail");
const cloudinary = require("cloudinary").v2;

// Generate JWT Access Token
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// Generate JWT Refresh Token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "1d" });
};

// @desc    Register new user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const formattedErrors = errors
        .array()
        .map((err) => ({ field: err.param, message: err.msg }));
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: formattedErrors,
      });
    }

    const { username, email, phoneNumber, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      const errors = [];
      if (userExists.email === email) {
        errors.push({ field: "email", message: "Email is already registered" });
      }
      if (userExists.username === username) {
        errors.push({
          field: "username",
          message: "Username is already taken",
        });
      }
      return res
        .status(400)
        .json({ success: false, message: "User already exists", errors });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      phoneNumber,
      password,
    });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({
      success: false,
      message: "An unexpected server error occurred.",
      error: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { login, password } = req.body;

    // Check for user by email or username
    const user = await User.findOne({
      $or: [{ email: login }, { username: login }],
    }).select("+password");

    // For security, use a generic message for both user not found and wrong password
    if (!user) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Invalid email/username or password",
        });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Invalid email/username or password",
        });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    user.authenticated = true;
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      success: false,
      message: "An unexpected server error occurred.",
      error: error.message,
    });
  }
};

// @desc    Update user profile
// @route   PATCH /api/auth/updateprofile
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Sanitize the user object right after loading to handle legacy avatar strings
    if (!user.avatar || typeof user.avatar !== "object") {
      user.avatar = {
        url: "https://res.cloudinary.com/dwhh0bwl5/image/upload/v1700426301/avatars/default_avatar.png",
        public_id: "avatars/default_avatar",
      };
    }

    // Fields that are not allowed to be updated from this endpoint
    const notAllowedFields = [
      "role",
      "password",
      "googleId",
      "_id",
      "email", // Email changes should have a separate, secure verification process
      "orders",
      "wishlist",
      "cart",
      "balance",
      "authenticated",
      "refreshToken",
      "passwordResetToken",
      "passwordResetExpire",
      "avatar", // Avatar is handled separately via file upload
    ];

    // Dynamically update user fields from request body
    Object.keys(req.body).forEach((key) => {
      if (!notAllowedFields.includes(key)) {
        // Handle nested objects like shippingAddress and billingAddress
        if (
          (key === "shippingAddress" || key === "billingAddress") &&
          typeof req.body[key] === "object" &&
          req.body[key] !== null
        ) {
          Object.keys(req.body[key]).forEach((nestedKey) => {
            if (user[key]) {
              user[key][nestedKey] = req.body[key][nestedKey];
            }
          });
        } else {
          user[key] = req.body[key];
        }
      }
    });

    // Handle avatar upload if a file is provided
    if (req.file) {
      // If there's an existing avatar and it's not the default one, delete it from Cloudinary
      if (
        user.avatar.public_id &&
        user.avatar.public_id !== "avatars/default_avatar"
      ) {
        await cloudinary.uploader.destroy(user.avatar.public_id);
      }

      // Update avatar with new image
      user.avatar.url = req.file.path;
      user.avatar.public_id = req.file.filename;
    }

    const updatedUser = await user.save();

    // Return a sanitized user object
    const sanitizedUser = {
      id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      username: updatedUser.username,
      email: updatedUser.email,
      phoneNumber: updatedUser.phoneNumber,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      shippingAddress: updatedUser.shippingAddress,
      billingAddress: updatedUser.billingAddress,
    };

    res.json({
      success: true,
      user: sanitizedUser,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const formattedErrors = Object.keys(error.errors).map((key) => ({
        field: key,
        message: error.errors[key].message,
      }));
      return res.status(400).json({
        success: false,
        message: "Profile update failed due to validation errors",
        errors: formattedErrors,
      });
    }

    // Handle potential Cloudinary errors
    if (error.http_code) {
      return res
        .status(error.http_code)
        .json({
          success: false,
          message: `Cloudinary error: ${error.message}`,
        });
    }

    res.status(500).json({
      success: false,
      message: "An unexpected server error occurred while updating profile.",
      error: error.message,
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/auth/resetpassword/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password reset token",
        message,
      });

      res.status(200).json({ success: true, data: "Email sent" });
    } catch (err) {
      console.log(err);
      user.passwordResetToken = undefined;
      user.passwordResetExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({ message: "Email could not be sent" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
exports.resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.resettoken)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: resetPasswordToken,
      passwordResetExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save();

    res.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token not found" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const accessToken = generateAccessToken(user._id);
    res.json({ success: true, accessToken });
  } catch (error) {
    res.status(403).json({ message: "Invalid refresh token" });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
exports.logout = async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.sendStatus(204); // No content
  }

  const user = await User.findOne({ refreshToken });
  if (user) {
    user.refreshToken = null;
    user.authenticated = false;
    await user.save();
  }

  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });

  res.json({ success: true, message: "Logged out successfully" });
};

// @desc    Get logged in user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Login with Google
// @route   GET /api/auth/google/callback
// @access  Public
exports.googleCallback = async (req, res, next) => {
  try {
    const accessToken = generateAccessToken(req.user.id);
    const refreshToken = generateRefreshToken(req.user.id);

    // Save refresh token to user
    req.user.refreshToken = refreshToken;
    req.user.authenticated = true;
    await req.user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect to frontend with token and user info
    const userString = JSON.stringify(req.user);
    res.redirect(
      `${
        process.env.CLIENT_URL
      }/auth/google/callback?accessToken=${accessToken}&user=${encodeURIComponent(
        userString
      )}`
    );
  } catch (error) {
    next(error);
  }
};
