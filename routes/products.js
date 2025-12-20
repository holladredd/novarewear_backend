const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getLookbookProducts,
} = require("../controllers/productController");
const { protect, admin } = require("../middleware/auth");

// Public routes
router.get("/", getProducts);
router.get("/lookbook", getLookbookProducts);
router.get("/:slug", getProductBySlug);

// Admin only routes
router.post("/", protect, admin, createProduct);
router.put("/:id", protect, admin, updateProduct);
router.delete("/:id", protect, admin, deleteProduct);

module.exports = router;
