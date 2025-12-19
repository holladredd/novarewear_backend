const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");
const Lookbook = require("../models/Lookbook");
require("dotenv").config();

const products = [
  {
    name: "Oversized Tee Black",
    slug: "oversized-tee-black",
    category: "Tees",
    price: 120,
    description:
      "Premium oversized black t-shirt made from 100% organic cotton. Features dropped shoulders and a relaxed fit.",
    images: ["/products/tee-1.jpg"],
    inStock: 50,
    sizes: ["XS", "S", "M", "L", "XL"],
    lookbookId: 1,
    isFeatured: true,
  },
  {
    name: "Utility Jacket",
    slug: "utility-jacket",
    category: "Hoodies",
    price: 250,
    description:
      "Functional utility jacket with multiple pockets and water-resistant fabric. Perfect for urban exploration.",
    images: ["/products/short-1.jpg"],
    inStock: 30,
    sizes: ["S", "M", "L", "XL"],
    lookbookId: 2,
    isFeatured: true,
  },
  {
    name: "Relaxed Pants",
    slug: "relaxed-pants",
    category: "Pants",
    price: 180,
    description:
      "Comfortable relaxed-fit pants with elastic waistband and tapered leg. Made from breathable fabric.",
    images: ["/products/pants-1.jpg"],
    inStock: 40,
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    lookbookId: 3,
    isFeatured: false,
  },
  {
    name: "Novare Hoodie",
    slug: "novare-hoodie",
    category: "Hoodies",
    price: 220,
    description:
      "Signature Novare hoodie with embroidered logo. Heavyweight fleece for ultimate comfort.",
    images: ["/products/hoodie-1.jpg"],
    inStock: 60,
    sizes: ["S", "M", "L", "XL", "XXL"],
    lookbookId: 4,
    isFeatured: true,
  },
];

const lookbookItems = [
  {
    title: "Nothing Ordinary",
    subtitle: "NOVARE SS25",
    image: "/lookbook/look-1.jpg",
    products: [],
    displayOrder: 1,
  },
  {
    title: "Modern Silence",
    subtitle: "Tailored Minimalism",
    image: "/lookbook/look-2.jpg",
    products: [],
    displayOrder: 2,
  },
  {
    title: "Form & Function",
    subtitle: "Urban Uniform",
    image: "/lookbook/look-3.jpg",
    products: [],
    displayOrder: 3,
  },
  {
    title: "Elevated Basics",
    subtitle: "Designed to Last",
    image: "/lookbook/look-4.jpg",
    products: [],
    displayOrder: 4,
  },
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Clear existing data
    await Product.deleteMany({});
    await Lookbook.deleteMany({});

    // Insert products
    const createdProducts = await Product.insertMany(products);

    // Update lookbook with product references
    for (let i = 0; i < lookbookItems.length; i++) {
      const product = createdProducts.find((p) => p.lookbookId === i + 1);
      if (product) {
        lookbookItems[i].products.push(product._id);
      }
    }

    await Lookbook.insertMany(lookbookItems);

    console.log("Database seeded successfully!");
    process.exit();
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

seedDatabase();
