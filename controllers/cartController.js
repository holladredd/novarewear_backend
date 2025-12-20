const User = require("../models/User");
const Product = require("../models/Product");

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: "cart.product",
      model: "Product",
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      cart: user.cart,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Add item to cart or update quantity
// @route   POST /api/cart
// @access  Private
exports.addToCart = async (req, res) => {
  const { productId, quantity, size } = req.body;

  if (!size) {
    return res
      .status(400)
      .json({ success: false, message: "Size is required" });
  }

  try {
    const user = await User.findById(req.user.id);
    const product = await Product.findById(productId);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const cartItemIndex = user.cart.findIndex(
      (item) => item.product.toString() === productId && item.size === size
    );

    if (cartItemIndex > -1) {
      // Item with same size exists, update its quantity
      if (quantity) {
        // If quantity is provided, set it directly
        user.cart[cartItemIndex].quantity = quantity;
      } else {
        // If quantity is omitted, increment by 1
        user.cart[cartItemIndex].quantity += 1;
      }
    } else {
      // This is a new item (or new size for an existing product)
      // If quantity is provided, use it. Otherwise, default to 1.
      const newQuantity = quantity ? quantity : 1;
      user.cart.push({ product: productId, quantity: newQuantity, size });
    }

    await user.save();

    const populatedUser = await User.findById(req.user.id).populate({
      path: "cart.product",
      model: "Product",
    });

    res.status(200).json({
      success: true,
      cart: populatedUser.cart,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:cartItemId
// @access  Private
exports.removeFromCart = async (req, res) => {
  const { cartItemId } = req.params;

  try {
    const user = await User.findById(req.user.id);

    user.cart = user.cart.filter((item) => item._id.toString() !== cartItemId);

    await user.save();

    const populatedUser = await User.findById(req.user.id).populate({
      path: "cart.product",
      model: "Product",
    });

    res.status(200).json({
      success: true,
      cart: populatedUser.cart,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Clear the cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.cart = [];
    await user.save();

    res.status(200).json({
      success: true,
      cart: user.cart,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
