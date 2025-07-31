const express = require('express');
const router = express.Router();
const adminUserVerificationController = require('../controllers/adminUserVerificationController');
const { adminProtect } = require('../middleware/auth');

/**
 * @swagger
 * /api/adminuserverifications/pending:
 *   get:
 *     summary: Get pending verifications
 *     description: Retrieve all user verifications awaiting admin review and approval
 *     tags:
 *       - Admin - Verifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           example: 20
 *         description: Number of pending verifications to retrieve
 *       - in: query
 *         name: skip
 *         schema:
 *           type: number
 *           example: 0
 *         description: Number of verifications to skip for pagination
 *       - in: query
 *         name: userType
 *         schema:
 *           type: string
 *           enum: [tenant, owner, worker]
 *         description: Filter by user type
 *     responses:
 *       200:
 *         description: Pending verifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   userType:
 *                     type: string
 *                   documents:
 *                     type: array
 *                     items:
 *                       type: object
 *                   submissionDate:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized - admin required
 *       500:
 *         description: Server error
 */
// Only admin can access these routes
router.get('/pending', adminProtect, adminUserVerificationController.getPendingVerifications);

/**
 * @swagger
 * /api/adminuserverifications/all:
 *   get:
 *     summary: Get all verifications
 *     description: Retrieve all user verification records with filtering options (approved, rejected, pending)
 *     tags:
 *       - Admin - Verifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - pending
 *             - approved
 *             - rejected
 *         description: Filter by verification status
 *       - in: query
 *         name: userType
 *         schema:
 *           type: string
 *           enum: [tenant, owner, worker]
 *         description: Filter by user type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           example: 20
 *       - in: query
 *         name: skip
 *         schema:
 *           type: number
 *           example: 0
 *     responses:
 *       200:
 *         description: All verifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   status:
 *                     type: string
 *                   documents:
 *                     type: array
 *                   submissionDate:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized - admin required
 *       500:
 *         description: Server error
 */
router.get('/all', adminProtect, adminUserVerificationController.getAllVerifications);

/**
 * @swagger
 * /api/adminuserverifications/{id}/approve:
 *   post:
 *     summary: Approve user verification
 *     description: Admin approves a user verification after reviewing submitted documents
 *     tags:
 *       - Admin - Verifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Verification ID to approve
 *         example: "5f7a1234567890abcdef1234"
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 example: "Documents verified and authentic"
 *     responses:
 *       200:
 *         description: User verification approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 status:
 *                   type: string
 *                   example: "approved"
 *       401:
 *         description: Unauthorized - admin required
 *       404:
 *         description: Verification not found
 *       500:
 *         description: Server error
 */
router.post('/:id/approve', adminProtect, adminUserVerificationController.approveVerification);

/**
 * @swagger
 * /api/adminuserverifications/{id}/reject:
 *   post:
 *     summary: Reject user verification
 *     description: Admin rejects a user verification with specific reason for rejection
 *     tags:
 *       - Admin - Verifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Verification ID to reject
 *         example: "5f7a1234567890abcdef1234"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "ID document is expired"
 *               feedback:
 *                 type: string
 *                 example: "Please resubmit with a valid ID"
 *     responses:
 *       200:
 *         description: User verification rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 status:
 *                   type: string
 *                   example: "rejected"
 *       401:
 *         description: Unauthorized - admin required
 *       404:
 *         description: Verification not found
 *       500:
 *         description: Server error
 */
router.post('/:id/reject', adminProtect, adminUserVerificationController.rejectVerification);

module.exports = router;
