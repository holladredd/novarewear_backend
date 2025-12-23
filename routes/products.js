const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProductBySlug,
  getLookbookProducts,
} = require("../controllers/productController");

// Public routes
router.get("/", getProducts);
router.get("/lookbook", getLookbookProducts);
router.get("/:slug", getProductBySlug);

module.exports = router;
