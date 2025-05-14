const cloudinary = require("cloudinary").v2;

// This automatically reads CLOUDINARY_URL
cloudinary.config({
  secure: true,
});

module.exports = cloudinary;
