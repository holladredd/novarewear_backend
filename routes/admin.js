const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUserByAdmin,
  deleteUser,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/adminController");
const { protect, admin } = require("../middleware/auth");

// All these routes are protected and for admins only
router.use(protect, admin);

// User management routes
router.route("/users").get(getAllUsers);
router
  .route("/users/:id")
  .get(getUserById)
  .put(updateUserByAdmin)
  .delete(deleteUser);

// Product management routes
router.route("/products").get(getProducts);
router.route("/products/:id").get(getProductById);
router.route("/products").post(createProduct);
router.route("/products/:id").put(updateProduct).delete(deleteProduct);

module.exports = router;
