const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "novare",
    format: async (req, file) => "webp", // Force format to webp for optimization
    public_id: (req, file) => Date.now().toString(), // Generate a unique public_id using a timestamp
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
