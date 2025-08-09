// server/utils/razorpay.js
const crypto = require('crypto');

// Initialize Razorpay instance (lazy load to handle missing keys gracefully)
let razorpay = null;

const getRazorpayInstance = () => {
  if (razorpay) return razorpay;
  
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn('Warning: Razorpay credentials not configured. Payment functionality will be limited.');
    // Return a mock instance that won't actually work but won't crash on import
    return {
      orders: { create: () => Promise.reject(new Error('Razorpay not configured')) },
      payments: { 
        fetch: () => Promise.reject(new Error('Razorpay not configured')),
        refund: () => Promise.reject(new Error('Razorpay not configured'))
      }
    };
  }

  const Razorpay = require('razorpay');
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  
  return razorpay;
};

/**
 * Create a Razorpay order
 * @param {number} amount - Amount in paise (multiply by 100 for rupees)
 * @param {string} currency - Currency code (default: INR)
 * @param {string} receipt - Receipt ID (unique identifier)
 * @param {object} notes - Additional notes/metadata
 * @returns {Promise<object>} - Razorpay order object
 */
const createOrder = async (amount, currency = 'INR', receipt = '', notes = {}) => {
  try {
    const razorpayInstance = getRazorpayInstance();
    const options = {
      amount: amount, // amount in paise
      currency: currency,
      receipt: receipt,
      notes: notes,
    };

    const order = await razorpayInstance.orders.create(options);
    console.log('Razorpay order created:', order);
    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
};

/**
 * Verify payment signature from Razorpay
 * @param {string} orderId - Order ID from Razorpay
 * @param {string} paymentId - Payment ID from Razorpay
 * @param {string} signature - Signature from Razorpay webhook
 * @returns {boolean} - True if signature is valid
 */
const verifyPaymentSignature = (orderId, paymentId, signature) => {
  try {
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    return generatedSignature === signature;
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return false;
  }
};

/**
 * Verify webhook signature
 * @param {string} body - Webhook body (stringified)
 * @param {string} signature - Signature from webhook header
 * @returns {boolean} - True if signature is valid
 */
const verifyWebhookSignature = (body, signature) => {
  try {
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    return generatedSignature === signature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
};

/**
 * Fetch payment details from Razorpay
 * @param {string} paymentId - Payment ID
 * @returns {Promise<object>} - Payment details
 */
const fetchPaymentDetails = async (paymentId) => {
  try {
    const razorpayInstance = getRazorpayInstance();
    const payment = await razorpayInstance.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Error fetching payment details:', error);
    throw error;
  }
};

/**
 * Fetch order details from Razorpay
 * @param {string} orderId - Order ID
 * @returns {Promise<object>} - Order details
 */
const fetchOrderDetails = async (orderId) => {
  try {
    const razorpayInstance = getRazorpayInstance();
    const order = await razorpayInstance.orders.fetch(orderId);
    return order;
  } catch (error) {
    console.error('Error fetching order details:', error);
    throw error;
  }
};

/**
 * Refund a payment
 * @param {string} paymentId - Payment ID to refund
 * @param {number} amount - Amount to refund in paise (optional, for partial refund)
 * @param {object} notes - Refund notes
 * @returns {Promise<object>} - Refund details
 */
const refundPayment = async (paymentId, amount = null, notes = {}) => {
  try {
    const razorpayInstance = getRazorpayInstance();
    const options = {
      notes: notes,
    };

    if (amount) {
      options.amount = amount; // in paise
    }

    const refund = await razorpayInstance.payments.refund(paymentId, options);
    return refund;
  } catch (error) {
    console.error('Error refunding payment:', error);
    throw error;
  }
};

/**
 * Calculate commission amount based on percentage
 * @param {number} amount - Original amount
 * @param {number} commissionPercent - Commission percentage
 * @returns {number} - Commission amount (rounded to 2 decimals)
 */
const calculateCommission = (amount, commissionPercent) => {
  return Math.round((commissionPercent / 100) * amount * 100) / 100;
};

module.exports = {
  razorpay: getRazorpayInstance(),
  getRazorpayInstance,
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  fetchPaymentDetails,
  fetchOrderDetails,
  refundPayment,
  calculateCommission,
};

