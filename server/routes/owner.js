const express = require("express");
const router = express.Router();
const ownerController = require("../controllers/ownerController");
const propertyController = require("../controllers/propertyController");
const { protect } = require("../middleware/auth");

const UnrentRequest = require("../models/unrentRequest");

/**
 * @swagger
 * /api/owner/dashboard:
 *   get:
 *     summary: Get owner dashboard
 *     description: Retrieve comprehensive dashboard data for property owner including properties, bookings, earnings, and maintenance requests
 *     tags:
 *       - Owner
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Owner dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalProperties:
 *                   type: number
 *                   example: 5
 *                 totalEarnings:
 *                   type: number
 *                   example: 15000
 *                 activeBookings:
 *                   type: number
 *                   example: 12
 *                 pendingMaintenanceRequests:
 *                   type: number
 *                   example: 3
 *                 recentBookings:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Server error
 */
// Get owner dashboard data (React API endpoint)
router.get("/dashboard", protect, ownerController.getOwnerDashboard);

/**
 * @swagger
 * /api/owner/maintenance-request/status:
 *   post:
 *     summary: Update maintenance request status
 *     description: Update the status of a maintenance request (e.g., approved, rejected, completed)
 *     tags:
 *       - Owner
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - maintenanceRequestId
 *               - status
 *             properties:
 *               maintenanceRequestId:
 *                 type: string
 *                 example: "5f7a1234567890abcdef1234"
 *               status:
 *                 type: string
 *                 enum:
 *                   - pending
 *                   - approved
 *                   - rejected
 *                   - completed
 *                   - in-progress
 *                 example: "completed"
 *               notes:
 *                 type: string
 *                 example: "Maintenance work completed successfully"
 *     responses:
 *       200:
 *         description: Maintenance request status updated successfully
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Maintenance request not found
 *       500:
 *         description: Server error
 */
// Update maintenance request status
router.post(
  "/maintenance-request/status",
  ownerController.updateMaintenanceRequestStatus
);

/**
 * @swagger
 * /api/owner/delete-account:
 *   delete:
 *     summary: Delete owner account
 *     description: Permanently delete the owner account and all associated data
 *     tags:
 *       - Owner
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "SecurePassword123!"
 *     responses:
 *       200:
 *         description: Owner account deleted successfully
 *       400:
 *         description: Invalid password
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Delete owner account
router.delete("/delete-account", protect, ownerController.deleteOwnerAccount);

/**
 * @swagger
 * /api/owner/update-settings:
 *   post:
 *     summary: Update owner settings
 *     description: Update owner profile information, notification preferences, and account settings
 *     tags:
 *       - Owner
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               address:
 *                 type: string
 *                 example: "123 Main Street, City"
 *               notifications:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: boolean
 *                     example: true
 *                   sms:
 *                     type: boolean
 *                     example: false
 *     responses:
 *       200:
 *         description: Owner settings updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Update owner settings
router.post("/update-settings", protect, ownerController.updateOwnerSettings);

/**
 * @swagger
 * /api/owner/approve-unrent-property:
 *   post:
 *     summary: Approve or reject unrent property request
 *     description: Owner approves or rejects a tenant's request to unrent a property
 *     tags:
 *       - Owner
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - unrentRequestId
 *               - status
 *             properties:
 *               unrentRequestId:
 *                 type: string
 *                 example: "5f7a1234567890abcdef1234"
 *               status:
 *                 type: string
 *                 enum:
 *                   - approved
 *                   - rejected
 *                 example: "approved"
 *               rejectionReason:
 *                 type: string
 *                 example: "Outstanding maintenance issues need to be resolved"
 *     responses:
 *       200:
 *         description: Unrent request decision submitted successfully
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Unrent request not found
 *       500:
 *         description: Server error
 */
// Approve or reject unrent property requests
router.post(
  "/approve-unrent-property",
  protect
,
  ownerController.approveUnrentProperty
);

// Legacy route for backward compatibility (duplicate endpoint removed to avoid duplication)

/**
 * @swagger
 * /api/owner/notifications:
 *   get:
 *     summary: Get owner notifications
 *     description: Retrieve all notifications for the owner including booking updates, maintenance requests, and payments
 *     tags:
 *       - Owner
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           example: 20
 *         description: Number of notifications to retrieve
 *       - in: query
 *         name: skip
 *         schema:
 *           type: number
 *           example: 0
 *         description: Number of notifications to skip for pagination
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum:
 *                           - booking
 *                           - maintenance
 *                           - payment
 *                           - message
 *                       title:
 *                         type: string
 *                       message:
 *                         type: string
 *                       read:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Get notifications
router.get("/notifications", protect, ownerController.getNotifications);

/**
 * @swagger
 * /api/owner/notifications/{notificationId}/read:
 *   post:
 *     summary: Mark notification as read
 *     description: Mark a specific notification as read to update its read status
 *     tags:
 *       - Owner
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the notification to mark as read
 *         example: "5f7a1234567890abcdef1234"
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
 *       400:
 *         description: Invalid notification ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
// Mark notification as read
router.post("/notifications/:notificationId/read", protect, ownerController.markNotificationRead);

module.exports = router;
