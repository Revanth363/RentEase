const express = require('express');
const router = express.Router();
const adminUserVerificationController = require('../controllers/adminUserVerificationController');
const { adminProtect } = require('../middleware/auth');

// Only admin can access these routes
router.get('/pending', adminProtect, adminUserVerificationController.getPendingVerifications);
router.get('/all', adminProtect, adminUserVerificationController.getAllVerifications);
router.post('/:id/approve', adminProtect, adminUserVerificationController.approveVerification);
router.post('/:id/reject', adminProtect, adminUserVerificationController.rejectVerification);

module.exports = router;
