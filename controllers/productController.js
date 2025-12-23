const Product = require("../models/Product");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Helper function to get user from token
const getUserFromToken = async (req) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return await User.findById(decoded.id);
  } catch (error) {
    return null;
  }
};

// @desc    Get all products with advanced filtering and sorting
// @route   GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      sizes,
      price,
      isFeatured,
      sort,
      page = 1,
      limit = 10,
    } = req.query;

    // Build query object
    const query = {};

    // Text search on product name
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    // Category filter
    if (category && category !== "All") {
      query.category = category;
    }

    // Sizes filter (e.g., ?sizes=S,M)
    if (sizes) {
      query.sizes = { $in: sizes.split(",") };
    }

    // Price filter (less than or equal to the provided price)
    if (price && !isNaN(Number(price))) {
      query.price = { $lte: Number(price) };
    }

    // Featured filter
    if (isFeatured) {
      query.isFeatured = isFeatured === "true";
    }

    // Build sort object
    let sortOption = { createdAt: -1 }; // Default sort by latest
    if (sort) {
      switch (sort) {
        case "price_asc":
          sortOption = { price: 1 };
          break;
        case "price_desc":
          sortOption = { price: -1 };
          break;
        case "latest":
          sortOption = { createdAt: -1 };
          break;
        case "name_asc":
          sortOption = { name: 1 };
          break;
        case "name_desc":
          sortOption = { name: -1 };
          break;
      }
    }

    const products = await Product.find(query)
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean(); // Use .lean() for better performance

    const total = await Product.countDocuments(query);

    // Check for user and add isWishlisted flag
    const user = await getUserFromToken(req);
    if (user) {
      const userWishlist = user.wishlist.map((id) => id.toString());
      products.forEach((product) => {
        product.isWishlisted = userWishlist.includes(product._id.toString());
      });
    } else {
      products.forEach((product) => {
        product.isWishlisted = false;
      });
    }

    res.json({
      success: true,
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      totalProducts: total,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:slug
exports.getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).lean(); // Use .lean()
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check for user and add isWishlisted flag
    const user = await getUserFromToken(req);
    if (user) {
      const userWishlist = user.wishlist.map((id) => id.toString());
      product.isWishlisted = userWishlist.includes(product._id.toString());
    } else {
      product.isWishlisted = false;
    }

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get all products that have look images for the lookbook gallery
// @route   GET /api/products/lookbook
// @access  Public
exports.getLookbookProducts = async (req, res) => {
  try {
    const products = await Product.find({
      lookImages: { $exists: true, $ne: [] }, // Find products where lookImages exists and is not empty
    }).select("name slug lookImages");

    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
