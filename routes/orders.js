const express = require("express");
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/orderController");
const { protect } = require("../middleware/auth");

// User routes
router.post("/", protect, createOrder);
router.get("/myorders", protect, getMyOrders);
router.get("/:id", protect, getOrderById);

// Admin routes (add admin middleware if needed)
router.get("/", protect, getAllOrders);
router.put("/:id/status", protect, updateOrderStatus);

module.exports = router;
