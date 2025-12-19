const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { validationResult } = require("express-validator");
const sendEmail = require("../utils/sendEmail");

// Generate JWT Access Token
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "15m" });
};

// Generate JWT Refresh Token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

// @desc    Register new user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, phoneNumber, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "Email or username already registered" });
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
    res.status(500).json({ message: "Server error", error: error.message });
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
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
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
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update user profile
// @route   PATCH /api/auth/updateprofile
exports.updateProfile = async (req, res) => {
  try {
    const { username, email, phoneNumber } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.username = username || user.username;
    user.email = email || user.email;
    user.phoneNumber = phoneNumber || user.phoneNumber;

    const updatedUser = await user.save();

    res.json({
      success: true,
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
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
