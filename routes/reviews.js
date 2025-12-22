const express = require("express");
const router = express.Router();
const {
  getReviews,
  createReview,
  updateReview,
  deleteReview,
} = require("../controllers/reviewController");
const { protect } = require("../middleware/auth");

// Public route to get reviews for a product
router.get("/:productId", getReviews);

// Protected route to create a review
router.post("/:productId", protect, createReview);

// Protected route to update a review
router.put("/:id", protect, updateReview);

// Protected route to delete a review
router.delete("/:id", protect, deleteReview);

module.exports = router;
