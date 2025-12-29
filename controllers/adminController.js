const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");
const cloudinary = require("cloudinary").v2;
const asyncHandler = require("express-async-handler");

// @desc    Get all users (Admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get user by ID (Admin only)
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update user (Admin only)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUserByAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      // Update fields from request body
      user.firstName = req.body.firstName || user.firstName;
      user.lastName = req.body.lastName || user.lastName;
      user.email = req.body.email || user.email;
      user.role = req.body.role || user.role;
      user.balance = req.body.balance ?? user.balance;

      const updatedUser = await user.save();
      res.json({ success: true, user: updatedUser });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      await user.deleteOne();
      res.json({ success: true, message: "User removed" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ------------------ Product Management ------------------

// @desc    Get all products (Admin only)
// @route   GET /api/admin/products
// @access  Private/Admin
exports.getProducts = async (req, res) => {
  try {
    // A simple fetch for the admin panel. Can be expanded with pagination later.
    const products = await Product.find({});
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get single product by ID (Admin only)
// @route   GET /api/admin/products/:id
// @access  Private/Admin
exports.getProductById = async (req, res) => {
  try {
    // Add a check to validate the ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID format" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Create product (Admin only)
// @route   POST /api/admin/products
// @access  Private/Admin
exports.createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, brand, sku, stock, isFeatured } = req.body;

  // Safely parse JSON fields, providing empty arrays as fallbacks.
  const category = req.body.category ? JSON.parse(req.body.category) : [];
  const tags = req.body.tags ? JSON.parse(req.body.tags) : [];
  const sizes = req.body.sizes ? JSON.parse(req.body.sizes) : [];

  const images = [];
  if (req.files && req.files.images && req.files.images.length > 0) {
    req.files.images.forEach((file) => {
      images.push({ public_id: file.filename, url: file.path });
    });
  }

  const lookImages = [];
  if (req.files && req.files.lookImages && req.files.lookImages.length > 0) {
    req.files.lookImages.forEach((file) => {
      lookImages.push({ public_id: file.filename, url: file.path });
    });
  }

  const product = await Product.create({
    name,
    description,
    price,
    brand,
    sku,
    stock,
    isFeatured,
    category,
    tags,
    sizes,
    images,
    lookImages,
  });

  res.status(201).json({ success: true, product });
});

// @desc    Update a product
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
// controllers/adminController.js
exports.updateProduct = asyncHandler(async (req, res, next) => {
  console.log("=== UPDATE DEBUG ===");
  console.log("Body keys:", Object.keys(req.body));
  console.log("Files present:", !!req.files);
  console.log("Images count:", req.files?.images?.length || 0);

  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // ✅ Update text fields
  const fields = [
    "name",
    "description",
    "price",
    "category",
    "inStock",
    "isFeatured",
  ];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  });

  // ✅ Parse sizes
  if (req.body.sizes) {
    try {
      product.sizes = JSON.parse(req.body.sizes);
    } catch (e) {
      console.warn("Sizes parse error:", e);
    }
  }

  // ✅ Handle images ONLY if files exist
  if (req.files?.images?.length > 0) {
    console.log("Replacing images:", req.files.images.length);

    // Delete old images
    if (product.images?.length > 0) {
      await Promise.all(
        product.images.map((img) =>
          img.public_id
            ? cloudinary.uploader.destroy(img.public_id)
            : Promise.resolve()
        )
      );
    }

    // Add new images
    product.images = req.files.images.map((file) => ({
      url: file.path,
      public_id: file.filename,
    }));
  }

  // ✅ Handle lookImages ONLY if files exist
  if (req.files?.lookImages?.length > 0) {
    console.log("Replacing lookImages:", req.files.lookImages.length);

    // Delete old lookImages
    if (product.lookImages?.length > 0) {
      await Promise.all(
        product.lookImages.map((img) =>
          img.public_id
            ? cloudinary.uploader.destroy(img.public_id)
            : Promise.resolve()
        )
      );
    }

    // Add new lookImages
    product.lookImages = req.files.lookImages.map((file) => ({
      url: file.path,
      public_id: file.filename,
    }));
  }

  const updated = await product.save();
  res.json({ success: true, product: updated });
});
// @desc    Delete product (Admin only)
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Delete all associated images from Cloudinary
    const imageIds = product.images.map((img) => img.public_id);
    if (imageIds.length > 0) {
      await cloudinary.api.delete_resources(imageIds);
    }

    const lookImageIds = product.lookImages.map((img) => img.public_id);
    if (lookImageIds.length > 0) {
      await cloudinary.api.delete_resources(lookImageIds);
    }

    await product.deleteOne();

    res.json({
      success: true,
      message: "Product and associated images deleted",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
