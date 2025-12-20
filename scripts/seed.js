const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");
const Lookbook = require("../models/Lookbooks");
require("dotenv").config();

const products = [
  // Tees
  {
    name: "Nova Classic Tee - Black",
    slug: "nova-classic-tee-black",
    category: "Tees",
    price: 15000,
    description:
      "A classic black tee made from 100% premium cotton. Perfect for any occasion.",
    images: [
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800",
    ],
    inStock: 100,
    sizes: ["S", "M", "L", "XL"],
    lookbookId: 1,
    isFeatured: true,
  },
  {
    name: "Nova Classic Tee - White",
    slug: "nova-classic-tee-white",
    category: "Tees",
    price: 15000,
    description:
      "A classic white tee made from 100% premium cotton. A staple for any wardrobe.",
    images: [
      "https://images.unsplash.com/photo-1622470953794-3150725db5b3?w=800",
    ],
    inStock: 120,
    sizes: ["S", "M", "L"],
    lookbookId: 4,
    isFeatured: false,
  },
  {
    name: "Lunar Graphic Tee",
    slug: "lunar-graphic-tee",
    category: "Tees",
    price: 18000,
    description:
      "A tee featuring a stunning lunar graphic. Soft and breathable.",
    images: [
      "https://images.unsplash.com/photo-1503341504253-dff485842510?w=800",
    ],
    inStock: 80,
    sizes: ["S", "M", "L"],
    lookbookId: 1,
    isFeatured: true,
  },
  {
    name: "Gravity Long Sleeve",
    slug: "gravity-long-sleeve",
    category: "Tees",
    price: 22000,
    description: "A stylish long-sleeve shirt with a minimalist design.",
    images: [
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800",
    ],
    inStock: 70,
    sizes: ["M", "L", "XL"],
    lookbookId: 3,
    isFeatured: false,
  },
  // Hoodies
  {
    name: "Orbit Hoodie - Charcoal",
    slug: "orbit-hoodie-charcoal",
    category: "Hoodies",
    price: 32000,
    description:
      "A comfortable and stylish charcoal hoodie. Perfect for cooler weather.",
    images: [
      "https://images.unsplash.com/photo-1532356884227-66d7c0e9e4c2?w=800",
    ],
    inStock: 60,
    sizes: ["S", "M", "L", "XL"],
    lookbookId: 4,
    isFeatured: false,
  },
  {
    name: "Signature Novare Hoodie",
    slug: "signature-novare-hoodie",
    category: "Hoodies",
    price: 35000,
    description:
      "The official Novare hoodie. Made with a soft fleece interior.",
    images: ["https://images.unsplash.com/photo-1556103615-6a233b4cec43?w=800"],
    inStock: 50,
    sizes: ["M", "L", "XL"],
    lookbookId: 2,
    isFeatured: true,
  },
  // Pants
  {
    name: "Astro Cargo Pants - Khaki",
    slug: "astro-cargo-pants-khaki",
    category: "Pants",
    price: 28000,
    description:
      "Durable and functional cargo pants with plenty of pocket space.",
    images: [
      "https://images.unsplash.com/photo-1604176354204-926873782854?w=800",
    ],
    inStock: 45,
    sizes: ["30", "32", "34", "36"],
    lookbookId: 3,
    isFeatured: false,
  },
  {
    name: "Astro Cargo Pants - Black",
    slug: "astro-cargo-pants-black",
    category: "Pants",
    price: 28000,
    description: "Sleek black cargo pants that combine style and utility.",
    images: [
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800",
    ],
    inStock: 55,
    sizes: ["30", "32", "34"],
    lookbookId: 1,
    isFeatured: true,
  },
  {
    name: "Nebula Sweatpants - Grey",
    slug: "nebula-sweatpants-grey",
    category: "Pants",
    price: 25000,
    description:
      "Ultra-soft sweatpants perfect for lounging or a casual day out.",
    images: [
      "https://images.unsplash.com/photo-1624378439575-d87059d70231?w=800",
    ],
    inStock: 75,
    sizes: ["S", "M", "L", "XL"],
    lookbookId: 4,
    isFeatured: false,
  },
  // Jackets
  {
    name: "Starlight Denim Jacket",
    slug: "starlight-denim-jacket",
    category: "Jackets",
    price: 45000,
    description:
      "A timeless denim jacket with a modern fit. Features custom Nova buttons.",
    images: ["https://images.unsplash.com/photo-1543072214-6b525371c861?w=800"],
    inStock: 25,
    sizes: ["M", "L"],
    lookbookId: 2,
    isFeatured: true,
  },
  {
    name: "Eclipse Windbreaker",
    slug: "eclipse-windbreaker",
    category: "Jackets",
    price: 38000,
    description:
      "A lightweight and water-resistant windbreaker for all seasons.",
    images: [
      "https://images.unsplash.com/photo-1591047139829-d919b5ca4d57?w=800",
    ],
    inStock: 0, // Out of stock example
    sizes: ["S", "M", "L", "XL"],
    lookbookId: 3,
    isFeatured: false,
  },
  // Shorts
  {
    name: "Solar Flare Denim Shorts",
    slug: "solar-flare-denim-shorts",
    category: "Shorts",
    price: 20000,
    description: "Stylish denim shorts for the summer season.",
    images: [
      "https://images.unsplash.com/photo-1605518216944-435a7ade2686?w=800",
    ],
    inStock: 40,
    sizes: ["30", "32", "34"],
    lookbookId: 1,
    isFeatured: false,
  },
  // Accessories
  {
    name: "Nova Signature Cap",
    slug: "nova-signature-cap",
    category: "Accessories",
    price: 12000,
    description: "A stylish cap with the embroidered Nova logo.",
    images: [
      "https://images.unsplash.com/photo-1529958030586-3aae4ca485ff?w=800",
    ],
    inStock: 90,
    sizes: ["One Size"],
    lookbookId: 2,
    isFeatured: false,
  },
  {
    name: "Cosmic Socks - 3 Pack",
    slug: "cosmic-socks-3-pack",
    category: "Accessories",
    price: 9000,
    description:
      "A pack of three comfortable socks with cosmic-themed designs.",
    images: [
      "https://images.unsplash.com/photo-1608231387042-66d244642752?w=800",
    ],
    inStock: 150,
    sizes: ["One Size"],
    lookbookId: 4,
    isFeatured: false,
  },
  {
    name: "Meteor Beanie",
    slug: "meteor-beanie",
    category: "Accessories",
    price: 10000,
    description: "A warm and cozy beanie for cold days.",
    images: [
      "https://images.unsplash.com/photo-1575428652377-a3d817367424?w=800",
    ],
    inStock: 65,
    sizes: ["One Size"],
    lookbookId: 3,
    isFeatured: false,
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
