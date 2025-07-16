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
        path: 'propertyId',
        select: 'name location address ownerId',
        populate: { path: 'ownerId', select: 'firstName lastName email phone' },
      })
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

    // commission stored in DB (may be null/0 for older records) — compute from amount if missing
    const storedCommission = payment.commission;
    const commissionAmount = (storedCommission != null && storedCommission > 0)
      ? storedCommission
      : (payment.amount ? Math.round((commissionPercent / 100) * payment.amount * 100) / 100 : null);

    const paymentData = {
      _id: payment._id.toString(),
      id: payment._id.toString(),
      amount: payment.amount,
      commission: commissionAmount,
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
      // propertyId — prefer direct field, fall back to booking's nested property
      propertyId: payment.propertyId
        ? {
            _id: payment.propertyId._id.toString(),
            name: payment.propertyId.name,
            location: payment.propertyId.location,
            address: payment.propertyId.address,
          }
        : (payment.bookingId?.propertyId
          ? {
              _id: payment.bookingId.propertyId._id.toString(),
              name: payment.bookingId.propertyId.name,
            }
          : null),
      ownerId: payment.propertyId?.ownerId
        ? {
            _id: payment.propertyId.ownerId._id.toString(),
            firstName: payment.propertyId.ownerId.firstName,
            lastName: payment.propertyId.ownerId.lastName,
            email: payment.propertyId.ownerId.email,
            phone: payment.propertyId.ownerId.phone,
          }
        : null,
      propertyName: payment.propertyId?.name || payment.bookingId?.propertyId?.name || '—',
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
    const {
      status, method, transactionId, minAmount, maxAmount,
      fromDate, toDate, page = 1, limit = 500
    } = req.query;

    const matchFilter = { propertyId: { $exists: true, $ne: null } };
    if (status)      matchFilter.status = status;
    if (method)      matchFilter.paymentMethod = method;
    if (transactionId) matchFilter.transactionId = { $regex: transactionId, $options: 'i' };
    if (minAmount || maxAmount) {
      matchFilter.amount = {};
      if (minAmount) matchFilter.amount.$gte = Number(minAmount);
      if (maxAmount) matchFilter.amount.$lte = Number(maxAmount);
    }
    if (fromDate || toDate) {
      matchFilter.paymentDate = {};
      if (fromDate) matchFilter.paymentDate.$gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        matchFilter.paymentDate.$lte = end;
      }
    }

    const total = await Payment.countDocuments(matchFilter);
    const skip = (Number(page) - 1) * Number(limit);

    const payments = await Payment.find(matchFilter)
      .select('tenantId userName amount status paymentMethod transactionId paymentDate dueDate createdAt bookingId')
      .populate('tenantId', 'firstName lastName')
      .populate({ path: 'bookingId', select: 'propertyId', populate: { path: 'propertyId', select: 'name' } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const formattedPayments = payments.map(p => ({
      _id: p._id.toString(),
      id: p._id.toString(),
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
      propertyName: p.bookingId?.propertyId?.name || '—',
      createdAt: p.createdAt,
    }));

    res.json({
      payments: formattedPayments,
      total,
    });
  } catch (error) {
    console.error('getAllPayments error:', error);
    res.status(500).json({ error: error.message });
  }
};