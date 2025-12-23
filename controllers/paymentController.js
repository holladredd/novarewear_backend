const axios = require("axios");
const Order = require("../models/Order");

const paystack = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

// @desc    Initialize Paystack payment
// @route   POST /api/payments/paystack/initialize
exports.initializePaystackPayment = async (req, res) => {
  try {
    const { email, amount, orderId } = req.body;

    if (!email || !amount || !orderId) {
      return res
        .status(400)
        .json({ message: "Email, amount, and orderId are required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const params = {
      email,
      amount: amount * 100, // Paystack expects amount in kobo
      metadata: {
        order_id: orderId,
        user_id: req.user.id,
      },
    };

    const { data } = await paystack.post("/transaction/initialize", params);

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Verify Paystack payment
// @route   GET /api/payments/paystack/verify
exports.verifyPaystackPayment = async (req, res) => {
  try {
    const { reference } = req.query;

    if (!reference) {
      return res.status(400).json({ message: "Payment reference is required" });
    }

    const { data } = await paystack.get(`/transaction/verify/${reference}`);

    if (data.data.status === "success") {
      const orderId = data.data.metadata.order_id;
      const order = await Order.findById(orderId);

      if (order) {
        order.paymentResult = {
          id: data.data.id,
          status: data.data.status,
          reference: data.data.reference,
        };
        order.status = "processing";
        await order.save();

        // Redirect to a success page on the frontend
        return res.redirect(
          `${process.env.CLIENT_URL}/order/${orderId}?payment=success`
        );
      }
    }

    // Redirect to a failure page on the frontend
    res.redirect(`${process.env.CLIENT_URL}/cart?payment=failed`);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
