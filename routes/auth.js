const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const {
  register,
  login,
  logout,
  getMe,
  refreshToken,
  googleCallback,
  updateProfile,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const passport = require("passport");
const upload = require("../config/cloudinary");

// @route   POST /api/auth/register
// @desc    Register user
router.post(
  "/register",
  [
    body("username", "Username is required").not().isEmpty(),
    body("email", "Please include a valid email").isEmail(),
    body("phoneNumber", "Phone number is required").not().isEmpty(),
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
    body("login", "Email or username is required").not().isEmpty(),
    body("password", "Password is required").exists(),
  ],
  login
);

// @route   POST /api/auth/logout
// @desc    Logout user
router.post("/logout", logout);

// @route   PATCH /api/auth/updateprofile
// @desc    Update user profile
router.patch("/updateprofile", protect, upload.single("avatar"), updateProfile);

// @route   POST /api/auth/forgotpassword
// @desc    Forgot password
router.post("/forgotpassword", forgotPassword);

// @route   PUT /api/auth/resetpassword/:resettoken
// @desc    Reset password
router.put("/resetpassword/:resettoken", resetPassword);

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
