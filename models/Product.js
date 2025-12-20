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
      enum: ["Tees", "Hoodies", "Pants", "Jackets", "Shorts", "Accessories"],
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
    inStock: { type: Number, required: true, default: 0 },
    lookImages: [
      {
        type: String,
      },
    ],
    sizes: {
      type: [String],
      required: true,
      enum: [
        "XS",
        "S",
        "M",
        "L",
        "XL",
        "XXL",
        "One Size",
        "30",
        "32",
        "34",
        "36",
      ],
    },
    lookbookId: { type: Number },
    isFeatured: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);
