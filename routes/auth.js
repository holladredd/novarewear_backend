const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const {
  register,
  login,
  getMe,
  refreshToken,
  googleCallback,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const passport = require("passport");

// @route   POST /api/auth/register
// @desc    Register user
router.post(
  "/register",
  [
    body("name", "Name is required").not().isEmpty(),
    body("email", "Please include a valid email").isEmail(),
    body("password", "Password must be at least 6 characters").isLength({
      min: 6,
    }),
  ],
  register
);

// @route   POST /api/auth/login
// @desc    Login user
router.post(
  "/login",
  [
    body("email", "Please include a valid email").isEmail(),
    body("password", "Password is required").exists(),
  ],
  login
);

// @route   GET /api/auth/google
// @desc    Login with Google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// @route   GET /api/auth/google/callback
// @desc    Google auth callback
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  googleCallback
);

// @route   POST /api/auth/refresh
// @desc    Refresh access token
router.post("/refresh", refreshToken);

// @route   GET /api/auth/me
// @desc    Get current user
router.get("/me", protect, getMe);

module.exports = router;
