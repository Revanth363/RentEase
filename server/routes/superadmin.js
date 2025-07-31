// server/routes/superadmin.js
const express = require('express');
const router = express.Router();

const { protect, superadminProtect } = require('../middleware/auth');

// Import controllers
const superadminCtrl = require('../controllers/superadminController');
const financialCtrl = require('../controllers/superadminfinancialController');
const ownerCtrl = require('../controllers/superadminownerController');
const workerCtrl = require('../controllers/superadminworkerController');
const executivesCtrl = require('../controllers/superadminexecutivesController');
const settingsCtrl = require('../controllers/superadminsettingsController');
const auditCtrl = require('../controllers/superadminauditController');
const tenantPaymentCtrl = require('../controllers/superadmintenantPaymentController');

// Apply protection to ALL superadmin routes
// protect: must be logged in
// superadminProtect: must be superadmin (replaces your broken requireSuperAdmin)
router.use(protect, superadminProtect);

// ─── ROUTES ────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/superadmin/stats:
 *   get:
 *     summary: Get platform statistics
 *     description: Retrieve comprehensive platform-wide statistics including user counts, booking trends, and revenue metrics
 *     tags:
 *       - SuperAdmin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: number
 *                   example: 1500
 *                 activeBookings:
 *                   type: number
 *                   example: 250
 *                 totalEarnings:
 *                   type: number
 *                   example: 500000
 *                 totalProperties:
 *                   type: number
 *                   example: 350
 *                 monthlyTrend:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized - superadmin required
 *       500:
 *         description: Server error
 */
router.get('/stats', superadminCtrl.getPlatformStats);

/**
 * @swagger
 * /api/superadmin/financial-analytics:
 *   get:
 *     summary: Get financial analytics
 *     description: Retrieve detailed financial analytics including revenue breakdown, commission calculations, and payment trends
 *     tags:
 *       - SuperAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-01-01"
 *         description: Start date for analytics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-03-31"
 *         description: End date for analytics
 *     responses:
 *       200:
 *         description: Financial analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalRevenue:
 *                   type: number
 *                 platformCommission:
 *                   type: number
 *                 breakdown:
 *                   type: object
 *       401:
 *         description: Unauthorized - superadmin required
 *       500:
 *         description: Server error
 */
router.get('/financial-analytics', financialCtrl.getFinancialAnalytics);

/**
 * @swagger
 * /api/superadmin/owner-earnings:
 *   get:
 *     summary: Get owner earnings analytics
 *     description: Retrieve earnings breakdown for all property owners including top earners and trends
 *     tags:
 *       - SuperAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           example: 20
 *         description: Number of top earners to retrieve
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum:
 *             - earnings
 *             - activeProperties
 *             - bookings
 *           example: "earnings"
 *         description: Sort order for results
 *     responses:
 *       200:
 *         description: Owner earnings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalOwnerEarnings:
 *                   type: number
 *                 topEarners:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized - superadmin required
 *       500:
 *         description: Server error
 */
router.get('/owner-earnings', ownerCtrl.getOwnerEarnings);

/**
 * @swagger
 * /api/superadmin/worker-earnings:
 *   get:
 *     summary: Get worker earnings analytics
 *     description: Retrieve earnings breakdown for all service workers including commissions and payment status
 *     tags:
 *       - SuperAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           example: 20
 *         description: Number of top earners to retrieve
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - active
 *             - inactive
 *             - all
 *           example: "active"
 *         description: Filter by worker status
 *     responses:
 *       200:
 *         description: Worker earnings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalWorkerEarnings:
 *                   type: number
 *                 topEarners:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized - superadmin required
 *       500:
 *         description: Server error
 */
router.get('/worker-earnings', workerCtrl.getWorkerEarnings);

/**
 * @swagger
 * /api/superadmin/executives:
 *   get:
 *     summary: Get all executives
 *     description: Retrieve list of all platform executives and admin staff with their roles and permissions
 *     tags:
 *       - SuperAdmin - Executives
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - active
 *             - inactive
 *             - suspended
 *         description: Filter by executive status
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
 *         description: Executives retrieved successfully
 *       401:
 *         description: Unauthorized - superadmin required
 *       500:
 *         description: Server error
 */
router.get('/executives', executivesCtrl.getExecutives);

/**
 * @swagger
 * /api/superadmin/executives:
 *   post:
 *     summary: Create new executive
 *     description: SuperAdmin creates a new executive account with specified permissions and role
 *     tags:
 *       - SuperAdmin - Executives
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - firstName
 *               - lastName
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "executive@rentease.com"
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Executive"
 *               role:
 *                 type: string
 *                 enum:
 *                   - admin
 *                   - moderator
 *                   - support
 *                 example: "admin"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "SecurePassword123!"
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["manage_users", "manage_properties", "manage_bookings"]
 *     responses:
 *       201:
 *         description: Executive created successfully
 *       400:
 *         description: Invalid input data or email already exists
 *       401:
 *         description: Unauthorized - superadmin required
 *       500:
 *         description: Server error
 */
router.post('/executives', executivesCtrl.createExecutive);

/**
 * @swagger
 * /api/superadmin/executives/{id}/status:
 *   patch:
 *     summary: Update executive status
 *     description: SuperAdmin activates, suspends, or deactivates an executive account
 *     tags:
 *       - SuperAdmin - Executives
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Executive ID
 *         example: "5f7a1234567890abcdef1234"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                   - active
 *                   - inactive
 *                   - suspended
 *                 example: "suspended"
 *               reason:
 *                 type: string
 *                 example: "Account security concerns"
 *     responses:
 *       200:
 *         description: Executive status updated successfully
 *       401:
 *         description: Unauthorized - superadmin required
 *       404:
 *         description: Executive not found
 *       500:
 *         description: Server error
 */
// status update (activate/suspend)
router.patch('/executives/:id/status', executivesCtrl.updateExecutiveStatus);

/**
 * @swagger
 * /api/superadmin/executives/{id}:
 *   delete:
 *     summary: Delete executive
 *     description: SuperAdmin permanently deletes an executive account from the platform
 *     tags:
 *       - SuperAdmin - Executives
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Executive ID to delete
 *         example: "5f7a1234567890abcdef1234"
 *     responses:
 *       200:
 *         description: Executive deleted successfully
 *       401:
 *         description: Unauthorized - superadmin required
 *       404:
 *         description: Executive not found
 *       500:
 *         description: Server error
 */
// delete executive
router.delete('/executives/:id', executivesCtrl.deleteExecutive);

/**
 * @swagger
 * /api/superadmin/settings:
 *   get:
 *     summary: Get system settings
 *     description: Retrieve all platform system settings including maintenance mode, commission rates, and feature flags
 *     tags:
 *       - SuperAdmin - Settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 maintenanceMode:
 *                   type: boolean
 *                   example: false
 *                 commissionRate:
 *                   type: number
 *                   example: 10
 *                 features:
 *                   type: object
 *       401:
 *         description: Unauthorized - superadmin required
 *       500:
 *         description: Server error
 */
router.get('/settings', settingsCtrl.getSystemSettings);

/**
 * @swagger
 * /api/superadmin/settings:
 *   post:
 *     summary: Update system settings
 *     description: SuperAdmin updates platform-wide settings including fees, enabling features, and maintenance mode
 *     tags:
 *       - SuperAdmin - Settings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               maintenanceMode:
 *                 type: boolean
 *                 example: false
 *               commissionRate:
 *                 type: number
 *                 example: 10
 *               minBookingPrice:
 *                 type: number
 *                 example: 500
 *               maxBookingPrice:
 *                 type: number
 *                 example: 500000
 *               contactEmail:
 *                 type: string
 *                 format: email
 *                 example: "support@rentease.com"
 *               features:
 *                 type: object
 *                 properties:
 *                   bookings:
 *                     type: boolean
 *                     example: true
 *                   workers:
 *                     type: boolean
 *                     example: true
 *     responses:
 *       200:
 *         description: System settings updated successfully
 *       400:
 *         description: Invalid settings data
 *       401:
 *         description: Unauthorized - superadmin required
 *       500:
 *         description: Server error
 */
router.post('/settings', settingsCtrl.updateSystemSettings);

/**
 * @swagger
 * /api/superadmin/audit-logs:
 *   get:
 *     summary: Get audit logs
 *     description: Retrieve audit logs of all platform activities for compliance and security monitoring
 *     tags:
 *       - SuperAdmin - Audit
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum:
 *             - login
 *             - create
 *             - update
 *             - delete
 *             - approve
 *             - reject
 *         description: Filter by action type
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user who performed action
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for logs
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for logs
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
 *         description: Audit logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   action:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   resource:
 *                     type: string
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized - superadmin required
 *       500:
 *         description: Server error
 */
router.get('/audit-logs', auditCtrl.getAuditLogs);

/**
 * @swagger
 * /api/superadmin/tenant-payments:
 *   get:
 *     summary: Get tenant payments
 *     description: Retrieve all tenant payment transactions for financial reporting and reconciliation
 *     tags:
 *       - SuperAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - pending
 *             - completed
 *             - failed
 *             - refunded
 *         description: Filter by payment status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for payment range
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for payment range
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
 *         description: Tenant payments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   tenantId:
 *                     type: string
 *                   amount:
 *                     type: number
 *                   status:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized - superadmin required
 *       500:
 *         description: Server error
 */
router.get('/tenant-payments', tenantPaymentCtrl.getTenantPayments);

module.exports = router;