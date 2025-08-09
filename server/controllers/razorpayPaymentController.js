// server/controllers/razorpayPaymentController.js
const Payment = require('../models/payment');
const WorkerPayment = require('../models/workerPayment');
const Tenant = require('../models/tenant');
const Owner = require('../models/owner');
const Worker = require('../models/worker');
const Booking = require('../models/booking');
const Setting = require('../models/setting');
const Notification = require('../models/notification');
const {
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  fetchPaymentDetails,
  calculateCommission,
} = require('../utils/razorpay');
const { getCachedSettings } = require('./superadminsettingsController');

/**
 * Initiate Rent Payment
 * Tenant initiates payment to Owner for rent
 */
exports.initiateRentPayment = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Please log in' });
    }

    const { propertyId, amount, dueDate } = req.body;
    const tenantId = req.user.id;

    console.log('🔍 Payment initiation request:', { tenantId, propertyId, amount });

    // Validation
    if (!propertyId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing or invalid required fields: propertyId, amount',
      });
    }

    // Find property and owner
    console.log('🔍 Looking for Booking with status:', { tenantId, propertyId, status: 'Active' });
    const property = await Booking.findOne({ tenantId, propertyId, status: 'Active' })
      .populate('propertyId')
      .populate('ownerId');

    console.log('🔍 Booking found:', property ? 'YES' : 'NO');

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Active booking not found for this property',
      });
    }

    const propertyData = property.propertyId;
    const ownerId = property.ownerId._id;

    // Get commission from settings
    const settings = await getCachedSettings();
    const commissionPercent = settings?.commission ?? 20;
    const commissionAmount = calculateCommission(amount, commissionPercent);

    // Convert to paise (multiply by 100)
    const amountInPaise = Math.round(amount * 100);

    console.log('💰 Payment details:', { amount, amountInPaise, commissionPercent, commissionAmount });

    // Create Razorpay order - Keep receipt under 40 chars
    const receipt = `RENT_${Math.floor(Date.now() / 1000)}`;
    console.log('📝 Receipt:', receipt, `(${receipt.length} chars)`);
    
    const notes = {
      propertyId,
      tenantId,
      ownerId: ownerId.toString(),
      type: 'rent_payment',
      commissionPercent,
    };

    const razorpayOrder = await createOrder(amountInPaise, 'INR', receipt, notes);
    console.log('✅ Razorpay order created:', razorpayOrder.id);

    // Get tenant details
    const tenant = await Tenant.findById(tenantId);
    console.log('✅ Tenant fetched:', tenant?.firstName, tenant?.lastName);

    // Calculate due date if not provided
    // Default: 30 days from today (typical monthly rent period)
    let calculatedDueDate = dueDate;
    if (!calculatedDueDate) {
      calculatedDueDate = new Date();
      calculatedDueDate.setDate(calculatedDueDate.getDate() + 30); // 30 days from today
      console.log('📅 Due date calculated (not provided):', calculatedDueDate);
    } else {
      console.log('📅 Due date provided:', calculatedDueDate);
    }

    // Create Payment record in DB
    const payment = new Payment({
      tenantId,
      ownerId,
      propertyId,
      amount,
      paymentDate: new Date(),
      dueDate: calculatedDueDate,
      paymentMethod: 'razorpay',
      status: 'Pending',
      commission: commissionAmount,
      commissionPercent,
      orderId: razorpayOrder.id,
      userName: `${tenant?.firstName || ''} ${tenant?.lastName || ''}`,
    });

    await payment.save();
    console.log('✅ Payment saved to DB:', payment._id);

    console.log('Payment initiated:', {
      paymentId: payment._id,
      orderId: razorpayOrder.id,
      amount,
      commission: commissionAmount,
    });

    return res.status(200).json({
      success: true,
      message: 'Rent payment order created successfully',
      payment: {
        _id: payment._id,
        orderId: razorpayOrder.id,
        amount,
        commission: commissionAmount,
        currency: 'INR',
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error('❌ Error initiating rent payment:', {
      message: error.message,
      code: error.code,
      stack: error.stack?.split('\n')[0],
    });
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate payment',
      error: error.message,
    });
  }
};

/**
 * Verify Rent Payment
 * Verify payment signature and mark payment as successful
 */
exports.verifyRentPayment = async (req, res) => {
  try {
    console.log('🔍 Verify Rent Payment - Request received:', { userId: req.user?.id, body: req.body });

    if (!req.user || !req.user.id) {
      console.error('❌ Unauthorized: No user');
      return res.status(401).json({ success: false, message: 'Unauthorized: Please log in' });
    }

    const { paymentId, orderId, signature } = req.body;

    console.log('📝 Verification parameters:', { paymentId, orderId, signature: signature ? '✓' : '✗' });

    if (!paymentId || !orderId || !signature) {
      console.error('❌ Missing fields:', { paymentId: !paymentId, orderId: !orderId, signature: !signature });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: paymentId, orderId, signature',
      });
    }

    // Verify signature
    console.log('🔐 Verifying signature...');
    const isSignatureValid = verifyPaymentSignature(orderId, paymentId, signature);

    console.log('🔐 Signature valid:', isSignatureValid);

    if (!isSignatureValid) {
      console.warn('❌ Invalid payment signature:', { orderId, paymentId });
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid signature',
      });
    }

    // Find and update payment
    console.log('🔍 Looking for payment with orderId:', orderId);
    const payment = await Payment.findOne({ orderId });

    console.log('🔍 Payment found:', payment ? 'YES' : 'NO', payment?._id);

    if (!payment) {
      console.error('❌ Payment not found for orderId:', orderId);
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    console.log('✓ Payment tenantId:', payment.tenantId.toString(), 'User id:', req.user.id, 'Match:', payment.tenantId.toString() === req.user.id);

    if (payment.tenantId.toString() !== req.user.id) {
      console.error('❌ Unauthorized: Payment does not belong to this user');
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Payment does not belong to this user',
      });
    }

    // Update payment status
    console.log('💾 Updating payment status to Paid...');
    payment.status = 'Paid';
    payment.transactionId = paymentId;
    payment.razorpayPaymentId = paymentId;
    payment.razorpaySignature = signature;

    await payment.save();
    logger.info('✅ Payment saved with status:', payment.status);

    // Send notification to owner
    if (payment.ownerId) {
      const owner = await Owner.findById(payment.ownerId);
      if (owner) {
        const notification = new Notification({
          recipient: payment.ownerId,
          recipientType: 'Owner',
          type: 'Payment',
          message: `Payment of ₹${payment.amount} received for rent`,
          tenantName: payment.userName,
          transactionId: paymentId,
          createdDate: new Date(),
          status: 'unread',
        });
        await notification.save();
      }
    }

    // Send notification to tenant
    const tenantNotification = new Notification({
      recipient: payment.tenantId,
      recipientType: 'Tenant',
      type: 'Payment',
      message: `Your rent payment of ₹${payment.amount} has been confirmed`,
      transactionId: paymentId,
      createdDate: new Date(),
      status: 'unread',
    });
    await tenantNotification.save();

    return res.status(200).json({
      success: true,
      message: 'Payment verified and confirmed successfully',
      payment: {
        _id: payment._id,
        status: payment.status,
        amount: payment.amount,
        commission: payment.commission,
        transactionId: paymentId,
      },
    });
  } catch (error) {
    console.error('[ERROR] Verifying rent payment:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    return res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message,
    });
  }
};

/**
 * Initiate Worker Payment
 * Tenant initiates payment to Worker for daily wages
 */
exports.initiateWorkerPayment = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Please log in' });
    }

    const { workerId, amount, workingDays, dailyRate } = req.body;
    const tenantId = req.user.id;

    // Validation
    if (!workerId || !amount || amount <= 0 || !workingDays || workingDays <= 0 || !dailyRate || dailyRate <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing or invalid required fields: workerId, amount, workingDays, dailyRate',
      });
    }

    // Verify worker exists and fetch details
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found',
      });
    }

    // Verify tenant has hired this worker
    const tenant = await Tenant.findById(tenantId);
    if (!tenant?.domesticWorkerId?.includes(workerId)) {
      return res.status(403).json({
        success: false,
        message: 'Worker not assigned to this tenant',
      });
    }

    // Get commission from settings
    const settings = await getCachedSettings();
    const commissionPercent = settings?.commission ?? 20;
    const commissionAmount = calculateCommission(amount, commissionPercent);

    // Convert to paise
    const amountInPaise = Math.round(amount * 100);

    // Create Razorpay order - Keep receipt under 40 chars
    const receipt = `WORKER_${Math.floor(Date.now() / 1000)}`;
    const notes = {
      workerId,
      tenantId,
      workingDays,
      dailyRate,
      type: 'worker_payment',
      commissionPercent,
    };

    const razorpayOrder = await createOrder(amountInPaise, 'INR', receipt, notes);

    // Create WorkerPayment record in DB
    const workerPayment = new WorkerPayment({
      tenantId,
      workerId,
      amount,
      workingDays,
      dailyRate,
      paymentDate: new Date(),
      paymentMethod: 'razorpay',
      status: 'Pending',
      commission: commissionAmount,
      commissionPercent,
      orderId: razorpayOrder.id,
      userName: `${tenant?.firstName || ''} ${tenant?.lastName || ''}`,
    });

    await workerPayment.save();

    console.log('Worker payment initiated:', {
      paymentId: workerPayment._id,
      orderId: razorpayOrder.id,
      amount,
      commission: commissionAmount,
      workingDays,
    });

    return res.status(200).json({
      success: true,
      message: 'Worker payment order created successfully',
      payment: {
        _id: workerPayment._id,
        orderId: razorpayOrder.id,
        amount,
        commission: commissionAmount,
        workingDays,
        dailyRate,
        currency: 'INR',
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error('Error initiating worker payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initiate worker payment',
      error: error.message,
    });
  }
};

/**
 * Verify Worker Payment
 * Verify payment signature and mark worker payment as successful
 */
exports.verifyWorkerPayment = async (req, res) => {
  try {
    console.log('🔍 Verify Worker Payment - Request received:', { userId: req.user?.id, body: req.body });

    if (!req.user || !req.user.id) {
      console.error('❌ Unauthorized: No user');
      return res.status(401).json({ success: false, message: 'Unauthorized: Please log in' });
    }

    const { paymentId, orderId, signature } = req.body;

    console.log('📝 Verification parameters:', { paymentId, orderId, signature: signature ? '✓' : '✗' });

    if (!paymentId || !orderId || !signature) {
      console.error('❌ Missing fields:', { paymentId: !paymentId, orderId: !orderId, signature: !signature });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: paymentId, orderId, signature',
      });
    }

    // Verify signature
    console.log('🔐 Verifying signature...');
    const isSignatureValid = verifyPaymentSignature(orderId, paymentId, signature);

    console.log('🔐 Signature valid:', isSignatureValid);

    if (!isSignatureValid) {
      console.warn('❌ Invalid worker payment signature:', { orderId, paymentId });
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid signature',
      });
    }

    // Find and update worker payment
    console.log('🔍 Looking for worker payment with orderId:', orderId);
    const workerPayment = await WorkerPayment.findOne({ orderId });

    console.log('🔍 Worker payment found:', workerPayment ? 'YES' : 'NO', workerPayment?._id);

    if (!workerPayment) {
      console.error('❌ Worker payment not found for orderId:', orderId);
      return res.status(404).json({
        success: false,
        message: 'Worker payment not found',
      });
    }

    console.log('✓ Payment tenantId:', workerPayment.tenantId.toString(), 'User id:', req.user.id, 'Match:', workerPayment.tenantId.toString() === req.user.id);

    if (workerPayment.tenantId.toString() !== req.user.id) {
      console.error('❌ Unauthorized: Payment does not belong to this user');
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Payment does not belong to this user',
      });
    }

    // Update worker payment status
    console.log('💾 Updating worker payment status to Paid...');
    workerPayment.status = 'Paid';
    workerPayment.transactionId = paymentId;
    workerPayment.razorpayPaymentId = paymentId;
    workerPayment.razorpaySignature = signature;

    await workerPayment.save();
    console.log('[INFO] Worker payment saved with status:', workerPayment.status);

    // Send notification to worker
    if (workerPayment.workerId) {
      const worker = await Worker.findById(workerPayment.workerId);
      if (worker) {
        const notification = new Notification({
          recipient: workerPayment.workerId,
          recipientType: 'Worker',
          type: 'Payment',
          message: `Payment of ₹${workerPayment.amount} received for ${workerPayment.workingDays} working days`,
          tenantName: workerPayment.userName,
          transactionId: paymentId,
          createdDate: new Date(),
          status: 'unread',
        });
        await notification.save();
      }
    }

    // Send notification to tenant
    const tenantNotification = new Notification({
      recipient: workerPayment.tenantId,
      recipientType: 'Tenant',
      type: 'Payment',
      message: `Your worker payment of ₹${workerPayment.amount} has been confirmed`,
      transactionId: paymentId,
      createdDate: new Date(),
      status: 'unread',
    });
    await tenantNotification.save();

    return res.status(200).json({
      success: true,
      message: 'Worker payment verified and confirmed successfully',
      payment: {
        _id: workerPayment._id,
        status: workerPayment.status,
        amount: workerPayment.amount,
        commission: workerPayment.commission,
        workingDays: workerPayment.workingDays,
        transactionId: paymentId,
      },
    });
  } catch (error) {
    console.error('[ERROR] Verifying worker payment:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    return res.status(500).json({
      success: false,
      message: 'Failed to verify worker payment',
      error: error.message,
    });
  }
};

/**
 * Get Payment Details
 */
exports.getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate('tenantId', 'firstName lastName email phone')
      .populate('ownerId', 'firstName lastName email phone')
      .populate('propertyId', 'name location price')
      .lean();

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    return res.status(200).json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error('Error getting payment details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get payment details',
      error: error.message,
    });
  }
};

/**
 * Get Worker Payment Details
 */
exports.getWorkerPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const workerPayment = await WorkerPayment.findById(paymentId)
      .populate('tenantId', 'firstName lastName email phone')
      .populate('workerId', 'firstName lastName email serviceType')
      .lean();

    if (!workerPayment) {
      return res.status(404).json({ success: false, message: 'Worker payment not found' });
    }

    return res.status(200).json({
      success: true,
      payment: workerPayment,
    });
  } catch (error) {
    console.error('Error getting worker payment details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get worker payment details',
      error: error.message,
    });
  }
};

/**
 * Get Tenant Payment History
 */
exports.getTenantPaymentHistory = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const tenantId = req.user.id;
    const { limit = 50, skip = 0, page = 1 } = req.query;
    const pageSize = parseInt(limit);
    const pageNum = parseInt(page);
    const skipAmount = (pageNum - 1) * pageSize;

    // Only show non-pending payments
    const payments = await Payment.find({ tenantId, status: { $ne: 'Pending' } })
      .populate('ownerId', 'firstName lastName')
      .populate('propertyId', 'name')
      .sort({ paymentDate: -1 })
      .limit(pageSize)
      .skip(skipAmount)
      .lean();

    const total = await Payment.countDocuments({ tenantId, status: { $ne: 'Pending' } });
    
    // Calculate summary - count paid and failed items
    const paidCount = await Payment.countDocuments({ tenantId, status: 'Paid' });
    const failedCount = total - paidCount;

    // Calculate sum of paid amounts
    const mongoose = require('mongoose');
    const tenantObjectId = new mongoose.Types.ObjectId(tenantId);
    const paidAmounts = await Payment.aggregate([
      { $match: { tenantId: tenantObjectId, status: 'Paid' } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
    ]);

    const summary = {
      total,
      totalPaid: paidAmounts[0]?.totalAmount || 0,
      paidCount,
      failedCount,
      pending: failedCount,
    };

    return res.status(200).json({
      success: true,
      data: payments,
      summary,
      total,
      page: pageNum,
      limit: pageSize,
    });
  } catch (error) {
    console.error('[ERROR] Getting payment history:', { message: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'Failed to get payment history',
      error: error.message,
    });
  }
};

/**
 * Get Tenant Worker Payment History
 */
exports.getTenantWorkerPaymentHistory = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const tenantId = req.user.id;
    const { limit = 50, skip = 0, page = 1 } = req.query;
    const pageSize = parseInt(limit);
    const pageNum = parseInt(page);
    const skipAmount = (pageNum - 1) * pageSize;

    // Only show non-pending payments
    const workerPayments = await WorkerPayment.find({ tenantId, status: { $ne: 'Pending' } })
      .populate('workerId', 'firstName lastName serviceType')
      .sort({ paymentDate: -1 })
      .limit(pageSize)
      .skip(skipAmount)
      .lean();

    const total = await WorkerPayment.countDocuments({ tenantId, status: { $ne: 'Pending' } });
    
    // Calculate summary - count paid and failed items
    const paidCount = await WorkerPayment.countDocuments({ tenantId, status: 'Paid' });
    const failedCount = total - paidCount;

    // Calculate sum of paid amounts
    const mongoose = require('mongoose');
    const tenantObjectId = new mongoose.Types.ObjectId(tenantId);
    const paidAmounts = await WorkerPayment.aggregate([
      { $match: { tenantId: tenantObjectId, status: 'Paid' } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
    ]);

    const summary = {
      total,
      totalPaid: paidAmounts[0]?.totalAmount || 0,
      paidCount,
      failedCount,
      pending: failedCount,
    };

    return res.status(200).json({
      success: true,
      data: workerPayments,
      summary,
      total,
      page: pageNum,
      limit: pageSize,
    });
  } catch (error) {
    console.error('[ERROR] Getting worker payment history:', { message: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'Failed to get worker payment history',
      error: error.message,
    });
  }
};

/**
 * Get Owner Payment History (all payments received by owner)
 */
exports.getOwnerPaymentHistory = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const ownerId = req.user.id;
    const { limit = 50, skip = 0, page = 1 } = req.query;
    const pageSize = parseInt(limit);
    const pageNum = parseInt(page);
    const skipAmount = (pageNum - 1) * pageSize;

    // Only show non-pending payments
    const payments = await Payment.find({ ownerId, status: { $ne: 'Pending' } })
      .populate('tenantId', 'firstName lastName')
      .populate('propertyId', 'name')
      .sort({ paymentDate: -1 })
      .limit(pageSize)
      .skip(skipAmount)
      .lean();

    const total = await Payment.countDocuments({ ownerId, status: { $ne: 'Pending' } });
    
    // Calculate summary - count paid and failed items
    const paidCount = await Payment.countDocuments({ ownerId, status: 'Paid' });
    const failedCount = total - paidCount;

    // Calculate sum of paid amounts
    const mongoose = require('mongoose');
    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);
    const paidAmounts = await Payment.aggregate([
      { $match: { ownerId: ownerObjectId, status: 'Paid' } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
    ]);

    const summary = {
      total,
      totalPaid: paidAmounts[0]?.totalAmount || 0,
      paidCount,
      failedCount,
      pending: failedCount,
    };

    return res.status(200).json({
      success: true,
      data: payments,
      summary,
      total,
      page: pageNum,
      limit: pageSize,
    });
  } catch (error) {
    console.error('[ERROR] Getting owner payment history:', { message: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'Failed to get owner payment history',
      error: error.message,
    });
  }
};

/**
 * Get Worker Earnings History
 */
exports.getWorkerEarningsHistory = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const workerId = req.user.id;
    const { limit = 50, skip = 0, page = 1 } = req.query;
    const pageSize = parseInt(limit);
    const pageNum = parseInt(page);
    const skipAmount = (pageNum - 1) * pageSize;

    // Only show non-pending payments
    const workerPayments = await WorkerPayment.find({ workerId, status: { $ne: 'Pending' } })
      .populate('tenantId', 'firstName lastName')
      .sort({ paymentDate: -1 })
      .limit(pageSize)
      .skip(skipAmount)
      .lean();

    const total = await WorkerPayment.countDocuments({ workerId, status: { $ne: 'Pending' } });

    // Calculate summary - count paid and failed items
    const paidCount = await WorkerPayment.countDocuments({ workerId, status: 'Paid' });
    const failedCount = total - paidCount;

    // Calculate sum of paid amounts
    const mongoose = require('mongoose');
    const workerObjectId = new mongoose.Types.ObjectId(workerId);
    const paidAmounts = await WorkerPayment.aggregate([
      { $match: { workerId: workerObjectId, status: 'Paid' } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
    ]);

    const summary = {
      total,
      totalEarned: paidAmounts[0]?.totalAmount || 0,
      paidCount,
      failedCount,
      pending: failedCount,
    };

    return res.status(200).json({
      success: true,
      data: workerPayments,
      summary,
      total,
      page: pageNum,
      limit: pageSize,
    });
  } catch (error) {
    console.error('[ERROR] Getting worker earnings history:', { message: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'Failed to get worker earnings history',
      error: error.message,
    });
  }
};

/**
 * Get All Payments (Admin/SuperAdmin)
 */
exports.getAllPayments = async (req, res) => {
  try {
    // Check if user is admin or superadmin
    if (!req.user || (req.user.userType !== 'Admin' && req.user.userType !== 'SuperAdmin')) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Admin only' });
    }

    const { limit = 50, skip = 0, status, type } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (type === 'rent') {
      filter.$or = [{ bookingId: { $exists: true, $ne: null } }];
    } else if (type === 'worker') {
      filter.$or = [{ workingDays: { $exists: true, $ne: null } }];
    }

    const payments = await Payment.find(filter)
      .populate('tenantId', 'firstName lastName email')
      .populate('ownerId', 'firstName lastName email')
      .populate('propertyId', 'name location')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const workerPayments = await WorkerPayment.find({
      ...(status && { status }),
    })
      .populate('tenantId', 'firstName lastName email')
      .populate('workerId', 'firstName lastName email serviceType')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const total = await Payment.countDocuments(filter) + await WorkerPayment.countDocuments({ ...(status && { status }) });

    // Calculate revenue summary
    const paidPayments = await Payment.aggregate([
      { $match: { status: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$amount' }, commission: { $sum: '$commission' } } }
    ]);

    const paidWorkerPayments = await WorkerPayment.aggregate([
      { $match: { status: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$amount' }, commission: { $sum: '$commission' } } }
    ]);

    const summary = {
      rentRevenue: paidPayments[0]?.total || 0,
      rentCommission: paidPayments[0]?.commission || 0,
      workerRevenue: paidWorkerPayments[0]?.total || 0,
      workerCommission: paidWorkerPayments[0]?.commission || 0,
      totalRevenue: (paidPayments[0]?.total || 0) + (paidWorkerPayments[0]?.total || 0),
      totalCommission: (paidPayments[0]?.commission || 0) + (paidWorkerPayments[0]?.commission || 0),
    };

    return res.status(200).json({
      success: true,
      payments: [...payments, ...workerPayments],
      summary,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
    });
  } catch (error) {
    console.error('Error getting all payments:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get payments',
      error: error.message,
    });
  }
};

/**
 * Cancel Rent Payment
 * Marks payment as Cancelled, auto-deletes after 30 days
 */
exports.cancelRentPayment = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Please log in' });
    }

    const { orderId } = req.body;
    const tenantId = req.user.id;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: orderId',
      });
    }

    console.log('🔍 Cancelling payment:', { tenantId, orderId });

    // Find payment
    const payment = await Payment.findOne({ orderId });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Verify ownership
    if (payment.tenantId.toString() !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Payment does not belong to this user',
      });
    }

    // Only allow cancellation of Pending payments
    if (payment.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel payment with status: ${payment.status}`,
      });
    }

    // Mark as Cancelled
    payment.status = 'Cancelled';
    await payment.save();

    console.log('✅ Payment marked as Cancelled:', {
      paymentId: payment._id,
      orderId,
      cancelledAt: new Date(),
    });

    // Send notification to tenant
    const notification = new Notification({
      recipient: tenantId,
      recipientType: 'Tenant',
      type: 'PaymentCancelled',
      message: `Payment of ₹${payment.amount} has been cancelled. You can initiate a new payment anytime.`,
      transactionId: orderId,
      createdDate: new Date(),
      status: 'unread',
    });
    await notification.save();

    return res.status(200).json({
      success: true,
      message: 'Payment cancelled successfully. Record will be auto-deleted after 30 days.',
      payment: {
        _id: payment._id,
        orderId,
        status: 'Cancelled',
        amount: payment.amount,
        cancelledAt: new Date(),
      },
    });
  } catch (error) {
    console.error('❌ Error cancelling rent payment:', {
      message: error.message,
      stack: error.stack?.split('\n')[0],
    });
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel payment',
      error: error.message,
    });
  }
};

/**
 * Cancel Worker Payment
 * Marks payment as Cancelled, auto-deletes after 30 days
 */
exports.cancelWorkerPayment = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Please log in' });
    }

    const { orderId } = req.body;
    const tenantId = req.user.id;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: orderId',
      });
    }

    console.log('🔍 Cancelling worker payment:', { tenantId, orderId });

    // Find worker payment
    const workerPayment = await WorkerPayment.findOne({ orderId });

    if (!workerPayment) {
      return res.status(404).json({
        success: false,
        message: 'Worker payment not found',
      });
    }

    // Verify ownership
    if (workerPayment.tenantId.toString() !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Payment does not belong to this user',
      });
    }

    // Only allow cancellation of Pending payments
    if (workerPayment.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel payment with status: ${workerPayment.status}`,
      });
    }

    // Mark as Cancelled
    workerPayment.status = 'Cancelled';
    await workerPayment.save();

    console.log('✅ Worker payment marked as Cancelled:', {
      paymentId: workerPayment._id,
      orderId,
      cancelledAt: new Date(),
    });

    // Send notification to tenant
    const worker = await Worker.findById(workerPayment.workerId);
    const notification = new Notification({
      recipient: tenantId,
      recipientType: 'Tenant',
      type: 'PaymentCancelled',
      message: `Payment of ₹${workerPayment.amount} for ${worker?.firstName} ${worker?.lastName} has been cancelled.`,
      transactionId: orderId,
      createdDate: new Date(),
      status: 'unread',
    });
    await notification.save();

    return res.status(200).json({
      success: true,
      message: 'Worker payment cancelled successfully. Record will be auto-deleted after 30 days.',
      payment: {
        _id: workerPayment._id,
        orderId,
        status: 'Cancelled',
        amount: workerPayment.amount,
        cancelledAt: new Date(),
      },
    });
  } catch (error) {
    console.error('❌ Error cancelling worker payment:', {
      message: error.message,
      stack: error.stack?.split('\n')[0],
    });
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel payment',
      error: error.message,
    });
  }
};

/**
 * Auto-cleanup cancelled payments after 30 days
 * This should be called by a cron job periodically
 */
exports.cleanupCancelledPayments = async () => {
  try {
    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Delete cancelled rent payments older than 30 days
    const deletedPayments = await Payment.deleteMany({
      status: 'Cancelled',
      createdAt: { $lt: thirtyDaysAgo },
    });

    // Delete cancelled worker payments older than 30 days
    const deletedWorkerPayments = await WorkerPayment.deleteMany({
      status: 'Cancelled',
      createdAt: { $lt: thirtyDaysAgo },
    });

    return {
      success: true,
      deletedPayments: deletedPayments.deletedCount,
      deletedWorkerPayments: deletedWorkerPayments.deletedCount,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Cleanup failed',
      error: error.message,
    };
  }
};
