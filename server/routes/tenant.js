const express = require("express");
const router = express.Router();
const tenantController = require("../controllers/tenantController");
const { protect } = require("../middleware/auth");

/**
 * @swagger
 * /api/tenant/maintenance/update-status:
 *   post:
 *     summary: Update maintenance request status
 *     description: Update the status of a maintenance request (e.g., pending, in-progress, completed)
 *     tags:
 *       - Tenants
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - maintenanceId
 *               - status
 *             properties:
 *               maintenanceId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum:
 *                   - Pending
 *                   - In Progress
 *                   - Completed
 *                   - Cancelled
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Tenant updates maintenance request status
router.post(
  "/maintenance/update-status",
  protect,
  tenantController.updateMaintenanceStatus
);

/**
 * @swagger
 * /api/tenant/maintenance/confirm:
 *   post:
 *     summary: Confirm maintenance is fixed
 *     description: Confirm that a maintenance issue has been resolved
 *     tags:
 *       - Tenants
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - maintenanceId
 *             properties:
 *               maintenanceId:
 *                 type: string
 *               feedback:
 *                 type: string
 *     responses:
 *       200:
 *         description: Maintenance confirmed as fixed
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Tenant confirms maintenance request is fixed
router.post(
  "/maintenance/confirm",
  protect,
  tenantController.confirmMaintenanceFixed
);

/**
 * @swagger
 * /api/tenant/worker-payment:
 *   post:
 *     summary: Submit worker payment
 *     description: Submit payment for worker services
 *     tags:
 *       - Tenants
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workerId
 *               - amount
 *             properties:
 *               workerId:
 *                 type: string
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment submitted successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Worker payment submission
router.post(
  "/worker-payment",
  protect,
  tenantController.submitWorkerPayment
);

/**
 * @swagger
 * /api/tenant/dashboard-data:
 *   get:
 *     summary: Get dashboard data (JSON)
 *     description: Retrieve dashboard statistics and information for React frontend
 *     tags:
 *       - Tenants
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data with statistics
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// New: dashboard JSON data for React frontend
router.get(
  "/dashboard-data",
  protect,
  (req, res, next) => {
    console.log("[ROUTE LOG] /dashboard-data hit at", new Date().toISOString());
    next();
  },
  tenantController.getDashboardData
);

/**
 * @swagger
 * /api/tenant/maintenance:
 *   post:
 *     summary: Submit maintenance request
 *     description: Submit a new maintenance request for property issues
 *     tags:
 *       - Tenants
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - propertyId
 *               - issueType
 *               - description
 *             properties:
 *               propertyId:
 *                 type: string
 *               issueType:
 *                 type: string
 *                 enum:
 *                   - Electrical
 *                   - Plumbing
 *                   - Carpentry
 *                   - Painting
 *                   - Other
 *               description:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               priority:
 *                 type: string
 *                 enum:
 *                   - Low
 *                   - Medium
 *                   - High
 *                   - Urgent
 *     responses:
 *       201:
 *         description: Maintenance request created
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Maintenance request submission
router.post(
  "/maintenance",
  protect,
  tenantController.submitMaintenanceRequest
);

/**
 * @swagger
 * /api/tenant/complaint:
 *   post:
 *     summary: Submit complaint
 *     description: Submit a complaint about property or services
 *     tags:
 *       - Tenants
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - propertyId
 *               - subject
 *               - description
 *             properties:
 *               propertyId:
 *                 type: string
 *               subject:
 *                 type: string
 *               description:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Complaint submitted
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Complaint submission
router.post("/complaint", protect, tenantController.submitComplaint);

/**
 * @swagger
 * /api/tenant/review:
 *   post:
 *     summary: Submit property review
 *     description: Submit a review and rating for a property
 *     tags:
 *       - Tenants
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - propertyId
 *               - rating
 *               - comment
 *             properties:
 *               propertyId:
 *                 type: string
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review submitted
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Property review submission
router.post("/review", protect, tenantController.submitPropertyReview);

/**
 * @swagger
 * /api/tenant/profile:
 *   post:
 *     summary: Update tenant profile
 *     description: Update tenant personal information and profile details
 *     tags:
 *       - Tenants
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
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               location:
 *                 type: string
 *               profilePicture:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Profile update
router.post("/profile", protect, tenantController.updateProfile);

/**
 * @swagger
 * /api/tenant/password:
 *   post:
 *     summary: Change password
 *     description: Change tenant account password
 *     tags:
 *       - Tenants
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Unauthorized/Invalid current password
 *       500:
 *         description: Server error
 */
// Password change
router.post("/password", protect, tenantController.changePassword);

/**
 * @swagger
 * /api/tenant/saved-property:
 *   post:
 *     summary: Save or remove property bookmark
 *     description: Toggle saved/bookmarked status for a property
 *     tags:
 *       - Tenants
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - propertyId
 *             properties:
 *               propertyId:
 *                 type: string
 *               action:
 *                 type: string
 *                 enum:
 *                   - save
 *                   - remove
 *     responses:
 *       200:
 *         description: Saved property toggled
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Save/Remove Property
router.post("/saved-property", protect, tenantController.toggleSavedProperty);

/**
 * @swagger
 * /api/tenant/notification/read:
 *   post:
 *     summary: Mark notification as read
 *     description: Update notification read status
 *     tags:
 *       - Tenants
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notificationId
 *             properties:
 *               notificationId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  "/notification/read",
  protect,
  tenantController.markNotificationAsRead
);

/**
 * @swagger
 * /api/tenant/payment:
 *   post:
 *     summary: Submit payment
 *     description: Submit rental or other payment
 *     tags:
 *       - Tenants
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - paymentMethod
 *             properties:
 *               propertyId:
 *                 type: string
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *                 enum:
 *                   - Credit Card
 *                   - Debit Card
 *                   - UPI
 *                   - Bank Transfer
 *     responses:
 *       201:
 *         description: Payment submitted
 *       400:
 *         description: Invalid payment details
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/payment", protect, tenantController.submitPayment);

/**
 * @swagger
 * /api/tenant/check-account-status:
 *   post:
 *     summary: Check account status
 *     description: Verify current account status and any issues
 *     tags:
 *       - Tenants
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account status information
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  "/check-account-status",
  protect,
  tenantController.checkAccountStatus
);

/**
 * @swagger
 * /api/tenant/delete-account:
 *   post:
 *     summary: Delete tenant account
 *     description: Permanently delete tenant account and all associated data
 *     tags:
 *       - Tenants
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/delete-account", protect, tenantController.deleteAccount);

/**
 * @swagger
 * /api/tenant/unrent-property:
 *   post:
 *     summary: Request to unrent property
 *     description: Submit request to stop renting current property
 *     tags:
 *       - Tenants
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - propertyId
 *             properties:
 *               propertyId:
 *                 type: string
 *               reason:
 *                 type: string
 *               vacateDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Unrent request submitted
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Unrent property request
router.post(
  "/unrent-property",
  protect,
  tenantController.requestUnrentProperty
);

/**
 * @swagger
 * /api/tenant/work-tracking/history/{workerId}:
 *   get:
 *     summary: Get worker work history
 *     description: Retrieve work history and tracking for a specific worker
 *     tags:
 *       - Tenants
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Worker ID
 *     responses:
 *       200:
 *         description: Worker work history
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Work tracking routes
router.get(
  "/work-tracking/history/:workerId",
  protect,
  tenantController.getWorkerWorkHistory
);

// DEBUG: Check saved listings directly
router.get("/debug/saved-listings", protect, async (req, res) => {
  try {
    const Tenant = require("../models/tenant");
    const tenant = await Tenant.findById(req.user.id).populate("savedListings");
    res.json({
      tenantId: req.user.id,
      savedListingsCount: tenant.savedListings.length,
      savedListings: tenant.savedListings
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
