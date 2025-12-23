const User = require("../models/User");
const Product = require("../models/Product");

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
exports.getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("wishlist");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      wishlist: user.wishlist,
    });
  } catch (error) {
    console.error("Error in getWishlist:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Add item to wishlist
// @route   POST /api/wishlist
// @access  Private
exports.addToWishlist = async (req, res) => {
  // Defensively extract the productId to handle incorrect frontend request body
  let productId = req.body.productId;
  if (productId && typeof productId === "object" && productId.productId) {
    productId = productId.productId;
  }

  try {
    const user = await User.findById(req.user.id);
    const product = await Product.findById(productId);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const wishlistItemIndex = user.wishlist.findIndex(
      (item) => item.toString() === productId
    );

    if (wishlistItemIndex === -1) {
      user.wishlist.push(productId);
      await user.save();
    }

    const populatedUser = await User.findById(req.user.id).populate("wishlist");

    res.status(200).json({
      success: true,
      wishlist: populatedUser.wishlist,
    });
  } catch (error) {
    console.error("Error in addToWishlist:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Remove item from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
exports.removeFromWishlist = async (req, res) => {
  const { productId } = req.params;

  try {
    const user = await User.findById(req.user.id);

    user.wishlist = user.wishlist.filter(
      (item) => item.toString() !== productId
    );

    await user.save();

    const populatedUser = await User.findById(req.user.id).populate("wishlist");

    res.status(200).json({
      success: true,
      wishlist: populatedUser.wishlist,
    });
  } catch (error) {
    console.error("Error in removeFromWishlist:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
