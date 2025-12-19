const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["Tees", "Hoodies", "Pants", "Accessories"],
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    inStock: {
      type: Number,
      default: 0,
    },
    lookbookId: {
      type: Number,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    sizes: [
      {
        type: String,
        enum: ["XS", "S", "M", "L", "XL", "XXL"],
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);
