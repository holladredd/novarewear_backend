const express = require("express");
const router = express.Router();
const {
  initializePaystackPayment,
  verifyPaystackPayment,
} = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");

// Paystack routes
router.post("/paystack/initialize", protect, initializePaystackPayment);
router.get("/paystack/verify", verifyPaystackPayment); // This is a public callback URL

module.exports = router;
