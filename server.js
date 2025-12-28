const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const passport = require("passport");

// Load env vars BEFORE anything else
dotenv.config();

// Now, require the other modules
const connectDB = require("./config/database");
const errorHandler = require("./middleware/error");

const app = express();

// Middleware
app.use(
  cors({
    origin: [process.env.CLIENT_URL, "http://localhost:3000"], // Allow both live and local frontend
    credentials: true,
  })
);
// Body parser - Increase limit to handle larger payloads like file uploads
app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 })
);

// Passport middleware
app.use(passport.initialize());

// Passport config
require("./config/passport");

// Mount routers
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/wishlist", require("./routes/wishlist"));
app.use("/api/payments", require("./routes/payment"));

// Error handling
app.use(errorHandler);

// Database connection
mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
