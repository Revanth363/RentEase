const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.get('/status', verificationController.getVerificationStatus);
router.post('/upload', upload.array('documents'), verificationController.uploadDocuments);

module.exports = router;
