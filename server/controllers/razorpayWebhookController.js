// server/controllers/razorpayWebhookController.js
const Payment = require('../models/payment');
const WorkerPayment = require('../models/workerPayment');
const Notification = require('../models/notification');
const Owner = require('../models/owner');
const Worker = require('../models/worker');
const Tenant = require('../models/tenant');
const { verifyWebhookSignature, verifyPaymentSignature } = require('../utils/razorpay');

/**
 * Razorpay Webhook Handler
 * Handles various webhook events from Razorpay
 */
exports.handleWebhook = async (req, res) => {
  try {
    const body = JSON.stringify(req.body);
    const signature = req.headers['x-razorpay-signature'];

    console.log('Webhook received, verifying signature...');

    // Verify webhook signature
    const isSignatureValid = verifyWebhookSignature(body, signature);

    if (!isSignatureValid) {
      console.warn('Invalid webhook signature');
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const { event, payload } = req.body;

    console.log('Processing webhook event:', event);

    switch (event) {
      case 'payment.authorized':
        await handlePaymentAuthorized(payload);
        break;

      case 'payment.captured':
        await handlePaymentCaptured(payload);
        break;

      case 'payment.failed':
        await handlePaymentFailed(payload);
        break;

      case 'refund.created':
        await handleRefundCreated(payload);
        break;

      case 'refund.processed':
        await handleRefundProcessed(payload);
        break;

      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    // Always return 200 to acknowledge receipt of webhook
    return res.status(200).json({ success: true, message: 'Webhook received' });
  } catch (error) {
    console.error('Error handling webhook:', error);
    // Return 200 to prevent Razorpay from retrying
    return res.status(200).json({ success: false, message: 'Error processed' });
  }
};

/**
 * Handle payment authorized event
 */
async function handlePaymentAuthorized(payload) {
  try {
    const paymentEntity = payload.payment?.entity;
    if (!paymentEntity) return;

    const orderId = paymentEntity.order_id;
    const paymentId = paymentEntity.id;

    console.log('Payment authorized:', { orderId, paymentId });

    // Try to find in Payment collection (rent payments)
    let paymentDoc = await Payment.findOne({ orderId });

    if (paymentDoc) {
      paymentDoc.razorpayPaymentId = paymentId;
      paymentDoc.status = 'Paid';
      await paymentDoc.save();

      // Send notification
      await sendPaymentNotification(paymentDoc, 'authorized');
      console.log('Rent payment authorized:', paymentDoc._id);
      return;
    }

    // Try to find in WorkerPayment collection
    let workerPaymentDoc = await WorkerPayment.findOne({ orderId });

    if (workerPaymentDoc) {
      workerPaymentDoc.razorpayPaymentId = paymentId;
      workerPaymentDoc.status = 'Paid';
      await workerPaymentDoc.save();

      // Send notification
      await sendWorkerPaymentNotification(workerPaymentDoc, 'authorized');
      console.log('Worker payment authorized:', workerPaymentDoc._id);
    }
  } catch (error) {
    console.error('Error handling payment authorized:', error);
  }
}

/**
 * Handle payment captured event
 */
async function handlePaymentCaptured(payload) {
  try {
    const paymentEntity = payload.payment?.entity;
    if (!paymentEntity) return;

    const orderId = paymentEntity.order_id;
    const paymentId = paymentEntity.id;

    console.log('Payment captured:', { orderId, paymentId });

    // Try to find in Payment collection
    let paymentDoc = await Payment.findOne({ orderId });

    if (paymentDoc) {
      paymentDoc.razorpayPaymentId = paymentId;
      paymentDoc.status = 'Paid';
      paymentDoc.paymentDate = new Date();
      await paymentDoc.save();

      await sendPaymentNotification(paymentDoc, 'captured');
      console.log('Rent payment captured:', paymentDoc._id);
      return;
    }

    // Try to find in WorkerPayment collection
    let workerPaymentDoc = await WorkerPayment.findOne({ orderId });

    if (workerPaymentDoc) {
      workerPaymentDoc.razorpayPaymentId = paymentId;
      workerPaymentDoc.status = 'Paid';
      workerPaymentDoc.paymentDate = new Date();
      await workerPaymentDoc.save();

      await sendWorkerPaymentNotification(workerPaymentDoc, 'captured');
      console.log('Worker payment captured:', workerPaymentDoc._id);
    }
  } catch (error) {
    console.error('Error handling payment captured:', error);
  }
}

/**
 * Handle payment failed event
 */
async function handlePaymentFailed(payload) {
  try {
    const paymentEntity = payload.payment?.entity;
    if (!paymentEntity) return;

    const orderId = paymentEntity.order_id;
    const paymentId = paymentEntity.id;

    console.log('Payment failed:', { orderId, paymentId });

    // Try to find in Payment collection
    let paymentDoc = await Payment.findOne({ orderId });

    if (paymentDoc) {
      paymentDoc.status = 'Failed';
      paymentDoc.razorpayPaymentId = paymentId;
      await paymentDoc.save();

      await sendFailureNotification(paymentDoc, 'Rent payment failed');
      console.log('Rent payment failed:', paymentDoc._id);
      return;
    }

    // Try to find in WorkerPayment collection
    let workerPaymentDoc = await WorkerPayment.findOne({ orderId });

    if (workerPaymentDoc) {
      workerPaymentDoc.status = 'Failed';
      workerPaymentDoc.razorpayPaymentId = paymentId;
      await workerPaymentDoc.save();

      await sendFailureNotification(workerPaymentDoc, 'Worker payment failed');
      console.log('Worker payment failed:', workerPaymentDoc._id);
    }
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

/**
 * Handle refund created event
 */
async function handleRefundCreated(payload) {
  try {
    const refundEntity = payload.refund?.entity;
    if (!refundEntity) return;

    const paymentId = refundEntity.payment_id;
    const refundId = refundEntity.id;
    const refundAmount = refundEntity.amount;

    console.log('Refund created:', { paymentId, refundId, refundAmount });

    // Try to find in Payment collection
    let paymentDoc = await Payment.findOne({ razorpayPaymentId: paymentId });

    if (paymentDoc) {
      paymentDoc.refundId = refundId;
      paymentDoc.refundAmount = refundAmount;
      paymentDoc.refundDate = new Date();
      paymentDoc.status = 'Refunded';
      await paymentDoc.save();

      await sendRefundNotification(paymentDoc, refundAmount);
      console.log('Rent payment refunded:', paymentDoc._id);
      return;
    }

    // Try to find in WorkerPayment collection
    let workerPaymentDoc = await WorkerPayment.findOne({ razorpayPaymentId: paymentId });

    if (workerPaymentDoc) {
      workerPaymentDoc.refundId = refundId;
      workerPaymentDoc.refundAmount = refundAmount;
      workerPaymentDoc.refundDate = new Date();
      workerPaymentDoc.status = 'Refunded';
      await workerPaymentDoc.save();

      await sendRefundNotification(workerPaymentDoc, refundAmount);
      console.log('Worker payment refunded:', workerPaymentDoc._id);
    }
  } catch (error) {
    console.error('Error handling refund created:', error);
  }
}

/**
 * Handle refund processed event
 */
async function handleRefundProcessed(payload) {
  try {
    const refundEntity = payload.refund?.entity;
    if (!refundEntity) return;

    const paymentId = refundEntity.payment_id;
    const refundId = refundEntity.id;

    console.log('Refund processed:', { paymentId, refundId });

    // Try to find in Payment collection
    let paymentDoc = await Payment.findOne({ razorpayPaymentId: paymentId });

    if (paymentDoc) {
      paymentDoc.refundId = refundId;
      paymentDoc.status = 'Refunded';
      await paymentDoc.save();

      console.log('Rent payment refund processed:', paymentDoc._id);
      return;
    }

    // Try to find in WorkerPayment collection
    let workerPaymentDoc = await WorkerPayment.findOne({ razorpayPaymentId: paymentId });

    if (workerPaymentDoc) {
      workerPaymentDoc.refundId = refundId;
      workerPaymentDoc.status = 'Refunded';
      await workerPaymentDoc.save();

      console.log('Worker payment refund processed:', workerPaymentDoc._id);
    }
  } catch (error) {
    console.error('Error handling refund processed:', error);
  }
}

/**
 * Send payment notification to owner and tenant
 */
async function sendPaymentNotification(payment, status) {
  try {
    // Notify owner
    if (payment.ownerId) {
      const notification = new Notification({
        recipient: payment.ownerId,
        recipientType: 'Owner',
        type: 'Payment',
        message: `Payment of ₹${payment.amount} received for rent from ${payment.userName}`,
        tenantName: payment.userName,
        transactionId: payment.razorpayPaymentId,
        createdDate: new Date(),
        status: 'unread',
      });
      await notification.save();
    }

    // Notify tenant
    const tenantNotification = new Notification({
      recipient: payment.tenantId,
      recipientType: 'Tenant',
      type: 'Payment',
      message: `Your rent payment of ₹${payment.amount} has been ${status === 'captured' ? 'confirmed' : 'authorized'}`,
      transactionId: payment.razorpayPaymentId,
      createdDate: new Date(),
      status: 'unread',
    });
    await tenantNotification.save();
  } catch (error) {
    console.error('Error sending payment notification:', error);
  }
}

/**
 * Send worker payment notification
 */
async function sendWorkerPaymentNotification(workerPayment, status) {
  try {
    // Notify worker
    if (workerPayment.workerId) {
      const notification = new Notification({
        recipient: workerPayment.workerId,
        recipientType: 'Worker',
        type: 'Payment',
        message: `Payment of ₹${workerPayment.amount} received for ${workerPayment.workingDays} working days from ${workerPayment.userName}`,
        tenantName: workerPayment.userName,
        transactionId: workerPayment.razorpayPaymentId,
        createdDate: new Date(),
        status: 'unread',
      });
      await notification.save();
    }

    // Notify tenant
    const tenantNotification = new Notification({
      recipient: workerPayment.tenantId,
      recipientType: 'Tenant',
      type: 'Payment',
      message: `Your worker payment of ₹${workerPayment.amount} has been ${status === 'captured' ? 'confirmed' : 'authorized'}`,
      transactionId: workerPayment.razorpayPaymentId,
      createdDate: new Date(),
      status: 'unread',
    });
    await tenantNotification.save();
  } catch (error) {
    console.error('Error sending worker payment notification:', error);
  }
}

/**
 * Send payment failure notification
 */
async function sendFailureNotification(payment, message) {
  try {
    const notification = new Notification({
      recipient: payment.tenantId,
      recipientType: 'Tenant',
      type: 'PaymentFailed',
      message: `${message}. Please try again.`,
      transactionId: payment.razorpayPaymentId || 'unknown',
      createdDate: new Date(),
      status: 'unread',
    });
    await notification.save();
  } catch (error) {
    console.error('Error sending failure notification:', error);
  }
}

/**
 * Send refund notification
 */
async function sendRefundNotification(payment, refundAmount) {
  try {
    const notification = new Notification({
      recipient: payment.tenantId,
      recipientType: 'Tenant',
      type: 'Refund',
      message: `Refund of ₹${(refundAmount / 100).toFixed(2)} has been processed`,
      transactionId: payment.razorpayPaymentId,
      createdDate: new Date(),
      status: 'unread',
    });
    await notification.save();
  } catch (error) {
    console.error('Error sending refund notification:', error);
  }
}
