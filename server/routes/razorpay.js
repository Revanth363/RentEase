// server/routes/razorpay.js
const express = require('express');
const router = express.Router();
const razorpayPaymentController = require('../controllers/razorpayPaymentController');
const razorpayWebhookController = require('../controllers/razorpayWebhookController');
const { protect } = require('../middleware/auth');

// Logging middleware for all razorpay routes
router.use((req, res, next) => {
  console.log('[RAZORPAY] Route:', req.method, req.path);
  console.log('[RAZORPAY] Auth Cookie:', req.cookies?.accessToken ? '✓' : '✗');
  next();
});

/**
 * @swagger
 * tags:
 *   name: Razorpay Payments
 *   description: Razorpay payment management APIs
 */

/**
 * @swagger
 * /api/razorpay/initiate-rent-payment:
 *   post:
 *     summary: Initiate rent payment
 *     description: Tenant initiates payment to Owner for rent
 *     tags: [Razorpay Payments]
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
 *               - amount
 *             properties:
 *               propertyId:
 *                 type: string
 *               amount:
 *                 type: number
 *               dueDate:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment order created
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/initiate-rent-payment', protect, razorpayPaymentController.initiateRentPayment);

/**
 * @swagger
 * /api/razorpay/verify-rent-payment:
 *   post:
 *     summary: Verify rent payment
 *     description: Verify payment signature and confirm rent payment
 *     tags: [Razorpay Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentId
 *               - orderId
 *               - signature
 *             properties:
 *               paymentId:
 *                 type: string
 *               orderId:
 *                 type: string
 *               signature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Verification failed
 *       500:
 *         description: Server error
 */
router.post('/verify-rent-payment', protect, razorpayPaymentController.verifyRentPayment);

/**
 * @swagger
 * /api/razorpay/initiate-worker-payment:
 *   post:
 *     summary: Initiate worker payment
 *     description: Tenant initiates payment to Worker for daily wages
 *     tags: [Razorpay Payments]
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
 *               - workingDays
 *               - dailyRate
 *             properties:
 *               workerId:
 *                 type: string
 *               amount:
 *                 type: number
 *               workingDays:
 *                 type: number
 *               dailyRate:
 *                 type: number
 *     responses:
 *       200:
 *         description: Payment order created
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/initiate-worker-payment', protect, razorpayPaymentController.initiateWorkerPayment);

/**
 * @swagger
 * /api/razorpay/verify-worker-payment:
 *   post:
 *     summary: Verify worker payment
 *     description: Verify payment signature and confirm worker payment
 *     tags: [Razorpay Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentId
 *               - orderId
 *               - signature
 *             properties:
 *               paymentId:
 *                 type: string
 *               orderId:
 *                 type: string
 *               signature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Verification failed
 *       500:
 *         description: Server error
 */
router.post('/verify-worker-payment', protect, razorpayPaymentController.verifyWorkerPayment);

/**
 * @swagger
 * /api/razorpay/payment-details/{paymentId}:
 *   get:
 *     summary: Get rent payment details
 *     description: Get detailed information about a rent payment
 *     tags: [Razorpay Payments]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment details retrieved
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
router.get('/payment-details/:paymentId', razorpayPaymentController.getPaymentDetails);

/**
 * @swagger
 * /api/razorpay/worker-payment-details/{paymentId}:
 *   get:
 *     summary: Get worker payment details
 *     description: Get detailed information about a worker payment
 *     tags: [Razorpay Payments]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment details retrieved
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
router.get('/worker-payment-details/:paymentId', razorpayPaymentController.getWorkerPaymentDetails);

/**
 * @swagger
 * /api/razorpay/tenant-payment-history:
 *   get:
 *     summary: Get tenant payment history
 *     description: Get all rent payments made by tenant
 *     tags: [Razorpay Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 50
 *       - in: query
 *         name: skip
 *         schema:
 *           type: number
 *           default: 0
 *     responses:
 *       200:
 *         description: Payment history retrieved
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/tenant-payment-history', protect, razorpayPaymentController.getTenantPaymentHistory);

/**
 * @swagger
 * /api/razorpay/tenant-worker-payment-history:
 *   get:
 *     summary: Get tenant worker payment history
 *     description: Get all worker payments made by tenant
 *     tags: [Razorpay Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 50
 *       - in: query
 *         name: skip
 *         schema:
 *           type: number
 *           default: 0
 *     responses:
 *       200:
 *         description: Payment history retrieved
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/tenant-worker-payment-history', protect, razorpayPaymentController.getTenantWorkerPaymentHistory);

/**
 * @swagger
 * /api/razorpay/owner-payment-history:
 *   get:
 *     summary: Get owner payment history
 *     description: Get all payments received by owner
 *     tags: [Razorpay Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 50
 *       - in: query
 *         name: skip
 *         schema:
 *           type: number
 *           default: 0
 *     responses:
 *       200:
 *         description: Payment history retrieved
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/owner-payment-history', protect, razorpayPaymentController.getOwnerPaymentHistory);

/**
 * @swagger
 * /api/razorpay/worker-earnings-history:
 *   get:
 *     summary: Get worker earnings history
 *     description: Get all payments received by worker
 *     tags: [Razorpay Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 50
 *       - in: query
 *         name: skip
 *         schema:
 *           type: number
 *           default: 0
 *     responses:
 *       200:
 *         description: Earnings history retrieved
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/worker-earnings-history', protect, razorpayPaymentController.getWorkerEarningsHistory);

/**
 * @swagger
 * /api/razorpay/all-payments:
 *   get:
 *     summary: Get all payments (Admin)
 *     description: Get all rent and worker payments on the platform (Admin/SuperAdmin only)
 *     tags: [Razorpay Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 50
 *       - in: query
 *         name: skip
 *         schema:
 *           type: number
 *           default: 0
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, Paid, Failed, Refunded]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [rent, worker]
 *     responses:
 *       200:
 *         description: All payments with summary
 *       403:
 *         description: Unauthorized (Admin only)
 *       500:
 *         description: Server error
 */
router.get('/all-payments', protect, razorpayPaymentController.getAllPayments);

/**
 * @swagger
 * /api/razorpay/cancel-rent-payment:
 *   post:
 *     summary: Cancel pending rent payment
 *     description: Tenant cancels a pending rent payment order. Payment marked as Cancelled and auto-deleted after 30 days.
 *     tags: [Razorpay Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: Razorpay order ID to cancel
 *     responses:
 *       200:
 *         description: Payment cancelled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment not found
 *       400:
 *         description: Cannot cancel non-pending payment
 *       500:
 *         description: Server error
 */
router.post('/cancel-rent-payment', protect, razorpayPaymentController.cancelRentPayment);

/**
 * @swagger
 * /api/razorpay/cancel-worker-payment:
 *   post:
 *     summary: Cancel pending worker payment
 *     description: Tenant cancels a pending worker payment order. Payment marked as Cancelled and auto-deleted after 30 days.
 *     tags: [Razorpay Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: Razorpay order ID to cancel
 *     responses:
 *       200:
 *         description: Payment cancelled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment not found
 *       400:
 *         description: Cannot cancel non-pending payment
 *       500:
 *         description: Server error
 */
router.post('/cancel-worker-payment', protect, razorpayPaymentController.cancelWorkerPayment);

/**
 * @swagger
 * /api/razorpay/webhook:
 *   post:
 *     summary: Razorpay webhook handler
 *     description: Handle webhook events from Razorpay
 *     tags: [Razorpay Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed
 *       400:
 *         description: Invalid signature
 *       500:
 *         description: Server error
 */
router.post('/webhook', razorpayWebhookController.handleWebhook);

// Global error handler for this router
router.use((err, req, res, next) => {
  console.error('[RAZORPAY ERROR]', {
    message: err.message,
    path: req.path,
    method: req.method,
    stack: err.stack?.split('\n')[0]
  });
  res.status(500).json({
    success: false,
    message: err.message || 'Server error',
    error: err.message
  });
});

module.exports = router;
