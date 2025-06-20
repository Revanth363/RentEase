const multer = require("multer");
const CloudinaryStorage = require("multer-storage-cloudinary").CloudinaryStorage;
const cloudinary = require("../config/cloudinary");

// Configure Cloudinary storage for property images AND proof (supports images + PDF)
const propertyStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isPdf = file.mimetype === "application/pdf";
    return {
      folder: "rentease/properties",
      resource_type: isPdf ? "raw" : "image",
      allowed_formats: ["jpg", "jpeg", "png", "webp", "pdf"],
    };
  },
});

// Configure Cloudinary storage for workers
const workerStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  folder: "rentease/workers",
  allowedFormats: ["jpg", "jpeg", "png", "webp"],
  maxFileSize: 5 * 1024 * 1024, // 5MB
});

// Multer instance for multiple property images with other form fields
const uploadProperties = multer({
  storage: propertyStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file (PDFs can be larger)
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, WEBP, and PDF formats are allowed"));
    }
  },
});

// Multer instance for single worker image with other form fields
const uploadWorker = multer({
  storage: workerStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and WEBP formats are allowed"));
    }
  },
});

module.exports = {
  // Accept up to 5 images and any form fields (.any() allows all fields)
  uploadProperties: uploadProperties.any(),
  // Accept 1 image and any form fields
  uploadWorker: uploadWorker.any(),
};
