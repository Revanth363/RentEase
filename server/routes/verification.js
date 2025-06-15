const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Direct-to-Cloudinary storage — accepts images and PDFs
const verificationStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'rentease/verifications',
    resource_type: 'auto',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
  },
});

const uploadVerification = multer({
  storage: verificationStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only images and PDF are allowed'));
  },
});

router.get('/status', verificationController.getVerificationStatus);
router.post('/upload', uploadVerification.array('documents', 10), verificationController.uploadDocuments);

module.exports = router;
