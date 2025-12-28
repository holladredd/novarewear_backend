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
exports.createProduct = async (req, res) => {
  try {
    const { body, files } = req;

    // Map uploaded files to the format expected by the schema
    const images = files.images
      ? files.images.map((file) => ({
          url: file.path,
          public_id: file.filename,
        }))
      : [];
    const lookImages = files.lookImages
      ? files.lookImages.map((file) => ({
          url: file.path,
          public_id: file.filename,
        }))
      : [];

    const product = await Product.create({
      ...body,
      images,
      lookImages,
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
exports.updateProduct = asyncHandler(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Update simple text/number/boolean fields
  const simpleFields = [
    "name",
    "description",
    "price",
    "stock",
    "isFeatured",
    "brand",
    "sku",
  ];
  simpleFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  });

  // Update fields that are sent as JSON strings
  const jsonFields = ["category", "tags"];
  jsonFields.forEach((field) => {
    if (req.body[field]) {
      try {
        product[field] = JSON.parse(req.body[field]);
      } catch (e) {
        res.status(400);
        throw new Error(`Invalid JSON for field: ${field}`);
      }
    }
  });

  // Handle 'images' replacement
  if (req.files && req.files.images && req.files.images.length > 0) {
    // Delete all old images from Cloudinary
    if (product.images && product.images.length > 0) {
      await Promise.all(
        product.images.map((img) => cloudinary.uploader.destroy(img.public_id))
      );
    }
    // Replace with new images
    product.images = req.files.images.map((file) => ({
      public_id: file.filename,
      url: file.path,
    }));
  }

  // Handle 'lookImages' replacement
  if (req.files && req.files.lookImages && req.files.lookImages.length > 0) {
    // Delete all old look images from Cloudinary
    if (product.lookImages && product.lookImages.length > 0) {
      await Promise.all(
        product.lookImages.map((img) =>
          cloudinary.uploader.destroy(img.public_id)
        )
      );
    }
    // Replace with new look images
    product.lookImages = req.files.lookImages.map((file) => ({
      public_id: file.filename,
      url: file.path,
    }));
  }

  const updatedProduct = await product.save();

  res.status(200).json(updatedProduct);
});

// @desc    Create product (Admin only)
// @route   POST /api/admin/products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
  try {
    const { body, files } = req;

    // Map uploaded files to the format expected by the schema
    const images = files.images
      ? files.images.map((file) => ({
          url: file.path,
          public_id: file.filename,
        }))
      : [];
    const lookImages = files.lookImages
      ? files.lookImages.map((file) => ({
          url: file.path,
          public_id: file.filename,
        }))
      : [];

    const product = await Product.create({
      ...body,
      images,
      lookImages,
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

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
