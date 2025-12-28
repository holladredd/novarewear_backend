const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");
const cloudinary = require("cloudinary").v2;

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

// @desc    Update product (Admin only)
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
  try {
    const { params, body, files } = req;

    const product = await Product.findById(params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // --- Prepare Update Data ---
    const updateData = {};

    // Handle simple string fields from the model
    ["name", "description", "category", "gender"].forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    // Handle numeric fields from the model
    ["price", "inStock"].forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = Number(body[field]);
      }
    });

    // Handle boolean fields from the model
    if (body.isFeatured !== undefined) {
      updateData.isFeatured = body.isFeatured === "true";
    }

    // Handle JSON fields from the model (only 'sizes' in this case)
    if (body.sizes && typeof body.sizes === "string") {
      try {
        updateData.sizes = JSON.parse(body.sizes);
      } catch (e) {
        return res.status(400).json({
          message: `Invalid JSON format for field 'sizes'.`,
        });
      }
    }

    // --- Handle Image Processing ---
    const processImages = (
      imageType // 'images' or 'lookImages'
    ) => {
      let imagesToKeep = [];
      const bodyImages = body[imageType];
      const existingImages = product[imageType].map((img) => img.toObject());

      if (bodyImages && typeof bodyImages === "string") {
        try {
          imagesToKeep = JSON.parse(bodyImages);
        } catch (e) {
          throw new Error(
            `Invalid JSON format for '${imageType}'. Must be a stringified array.`
          );
        }
      } else if (bodyImages === undefined) {
        imagesToKeep = existingImages;
      } else {
        throw new Error(
          `Invalid format for '${imageType}'. Must be a stringified array.`
        );
      }

      const imagesToDelete = existingImages
        .filter(
          (dbImg) =>
            !imagesToKeep.some(
              (keepImg) => keepImg.public_id === dbImg.public_id
            )
        )
        .map((img) => img.public_id);

      const newImages =
        files && files[imageType]
          ? files[imageType].map((file) => ({
              url: file.path,
              public_id: file.filename,
            }))
          : [];

      return {
        finalImages: [...imagesToKeep, ...newImages],
        deletePromises:
          imagesToDelete.length > 0
            ? cloudinary.api.delete_resources(imagesToDelete)
            : Promise.resolve(),
      };
    };

    const { finalImages, deletePromises: deleteImagesPromise } =
      processImages("images");
    const {
      finalImages: finalLookImages,
      deletePromises: deleteLookImagesPromise,
    } = processImages("lookImages");

    await Promise.all([deleteImagesPromise, deleteLookImagesPromise]);

    updateData.images = finalImages;
    updateData.lookImages = finalLookImages;

    // --- Perform Update ---
    const updatedProduct = await Product.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true, runValidators: true, context: "query" }
    );

    res.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error("Update Product Error:", error);
    if (
      error.message.includes("Invalid format") ||
      error.message.includes("Invalid JSON")
    ) {
      return res.status(400).json({ message: error.message });
    }
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
