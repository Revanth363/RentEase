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

/**
 * @swagger
 * /api/verification/status:
 *   get:
 *     summary: Get verification status
 *     description: Retrieve the current verification status of the authenticated user (pending, verified, rejected)
 *     tags:
 *       - Verification
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [pending, verified, rejected, not_submitted]
 *                   example: "pending"
 *                 submissionDate:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-03-15T10:30:00Z"
 *                 documents:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       documentType:
 *                         type: string
 *                         enum: [id, proof_of_address, photo]
 *                       status:
 *                         type: string
 *                       uploadDate:
 *                         type: string
 *                         format: date-time
 *                 rejectionReason:
 *                   type: string
 *                   example: "ID document is expired"
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Server error
 */
router.get('/status', verificationController.getVerificationStatus);

/**
 * @swagger
 * /api/verification/upload:
 *   post:
 *     summary: Upload verification documents
 *     description: Upload verification documents (ID, address proof, photo) for KYC verification process. Supports JPG, PNG, WebP, and PDF formats
 *     tags:
 *       - Verification
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - documents
 *             properties:
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Up to 10 document files (images or PDFs, max 10MB each)
 *               documentType:
 *                 type: string
 *                 enum: [id, proof_of_address, photo]
 *                 description: Type of document being uploaded
 *                 example: "id"
 *               metadata:
 *                 type: string
 *                 description: Additional metadata about verification
 *                 example: '{"nationality":"India","idNumber":"ABC123456"}'
 *     responses:
 *       201:
 *         description: Documents uploaded successfully for verification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 verificationId:
 *                   type: string
 *                 status:
 *                   type: string
 *                   example: "pending"
 *                 uploadedDocuments:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Invalid file format or file size exceeded
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Server error or Cloudinary upload failed
 */
router.post('/upload', uploadVerification.array('documents', 10), verificationController.uploadDocuments);

module.exports = router;
