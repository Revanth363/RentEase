// controllers/adminPaymentController.js
const Payment = require('../models/payment');
const Tenant = require('../models/tenant');
const Booking = require('../models/booking');
const Property = require('../models/property');
const Setting = require('../models/setting');

exports.getPaymentDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id)
      .populate('tenantId', 'firstName lastName email phone location')
      .populate({
        path: 'bookingId',
        populate: { path: 'propertyId', select: 'name' },
      })
      .lean();

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const settings = await Setting.findOne().lean();
    const commissionPercent = settings?.commission ?? 20;

    const paymentData = {
      _id: payment._id.toString(),
      id: payment._id.toString(),
      amount: payment.amount,
      commission: payment.commission,
      commissionPercent: commissionPercent,
      status: payment.status,
      paymentDate: payment.paymentDate,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      dueDate: payment.dueDate,
      receiptUrl: payment.receiptUrl,
      userName: payment.tenantId
        ? `${payment.tenantId.firstName} ${payment.tenantId.lastName}`.trim()
        : payment.userName || '—',
      // tenantId as populated object for clickable link
      tenantId: payment.tenantId
        ? {
            _id: payment.tenantId._id.toString(),
            firstName: payment.tenantId.firstName,
            lastName: payment.tenantId.lastName,
            email: payment.tenantId.email,
            phone: payment.tenantId.phone,
            location: payment.tenantId.location,
          }
        : null,
      // bookingId as object for link
      bookingId: payment.bookingId
        ? {
            _id: payment.bookingId._id.toString(),
            propertyName: payment.bookingId.propertyId?.name,
            startDate: payment.bookingId.startDate,
            endDate: payment.bookingId.endDate,
          }
        : null,
      // propertyId from booking for link
      propertyId: payment.bookingId?.propertyId
        ? {
            _id: payment.bookingId.propertyId._id.toString(),
            name: payment.bookingId.propertyId.name,
          }
        : null,
      propertyName: payment.bookingId?.propertyId?.name || '—',
    };

    res.json(paymentData);
  } catch (error) {
    console.error('Error getting payment details:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.refundPayment = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findByIdAndUpdate(
      id,
      { status: 'Refunded' },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.json({ success: true, message: 'Payment refunded successfully' });
  } catch (error) {
    console.error('refundPayment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.retryPayment = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findByIdAndUpdate(
      id,
      { status: 'Pending' },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.json({ success: true, message: 'Payment retry initiated' });
  } catch (error) {
    console.error('retryPayment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// controllers/adminPaymentController.js

exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('tenantId', 'firstName lastName')
      .populate({
        path: 'bookingId',
        populate: { path: 'propertyId', select: 'name' }
      })
      .sort({ createdAt: -1 })   // newest first
      .limit(10)                  // Only latest 10
      .lean();

    const formattedPayments = payments.map(p => ({
      _id: p._id.toString(),
      id: p._id.toString(), // for frontend compatibility
      userName: p.tenantId
        ? `${p.tenantId.firstName} ${p.tenantId.lastName}`.trim()
        : p.userName || 'Unknown',
      tenantId: p.tenantId?._id?.toString(),
      amount: p.amount,
      status: p.status || 'Pending',
      paymentMethod: p.paymentMethod || 'N/A',
      transactionId: p.transactionId || null,
      paymentDate: p.paymentDate,
      dueDate: p.dueDate,
      receiptUrl: p.receiptUrl,
      propertyName: p.bookingId?.propertyId?.name || '—',
      createdAt: p.createdAt,
    }));

    res.json({ 
      payments: formattedPayments,
      total: formattedPayments.length  // will be 10 (or less if not enough)
    });

  } catch (error) {
    console.error('getAllPayments error:', error);
    res.status(500).json({ error: error.message });
  }
};