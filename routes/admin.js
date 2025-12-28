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
const upload = require("../config/cloudinary"); // Import the upload middleware

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
router
  .route("/products")
  .get(getProducts)
  .post(
    upload.fields([
      { name: "images", maxCount: 10 },
      { name: "lookImages", maxCount: 10 },
    ]),
    createProduct
  );

router
  .route("/products/:id")
  .get(getProductById)
  .put(
    upload.fields([
      { name: "images", maxCount: 10 },
      { name: "lookImages", maxCount: 10 },
    ]),
    updateProduct
  )
  .delete(deleteProduct);

module.exports = router;
