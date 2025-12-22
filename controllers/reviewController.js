const Review = require("../models/Review");
const Product = require("../models/Product");

// @desc    Get all reviews for a product
// @route   GET /api/reviews/:productId
exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      product: req.params.productId,
    }).populate("user", "username");
    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Create a review for a product
// @route   POST /api/reviews/:productId
exports.createReview = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const review = await Review.create({
      product: req.params.productId,
      user: req.user.id,
      rating: req.body.rating,
      comment: req.body.comment,
    });

    res.status(201).json({ success: true, review });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update a review
// @route   PUT /api/reviews/:id
exports.updateReview = async (req, res) => {
  try {
    let review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Make sure user is the review owner
    if (review.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    review = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Make sure user is the review owner
    if (review.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await review.deleteOne();

    res.json({ success: true, message: "Review removed" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
