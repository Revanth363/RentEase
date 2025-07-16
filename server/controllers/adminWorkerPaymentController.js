// controllers/adminWorkerPaymentController.js
const WorkerPayment = require('../models/workerPayment');
const Tenant = require('../models/tenant');
const Worker = require('../models/worker');
const Property = require('../models/property');

exports.getWorkerPaymentDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await WorkerPayment.findById(id)
      .populate('tenantId', 'firstName lastName email phone location')
      .populate('workerId', 'firstName lastName email phone serviceType')
      .lean();

    if (!payment) {
      return res.status(404).json({ error: 'Worker Payment not found' });
    }

    // Look up the tenant's rented property for address; fall back to personal location
    let tenantPropertyAddress = null;
    if (payment.tenantId?._id) {
      const rentedProp = await Property.findOne({ tenantId: payment.tenantId._id }).lean();
      tenantPropertyAddress = rentedProp
        ? (rentedProp.address || rentedProp.location || null)
        : (payment.tenantId.location || null);
    }

    const paymentData = {
      _id: payment._id.toString(),
      id: payment._id.toString(),
      amount: payment.amount,
      status: payment.status,
      paymentDate: payment.paymentDate,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      receiptUrl: payment.receiptUrl,
      userName: payment.tenantId
        ? `${payment.tenantId.firstName} ${payment.tenantId.lastName}`.trim()
        : payment.userName || '—',
      workerName: payment.workerId
        ? `${payment.workerId.firstName} ${payment.workerId.lastName}`.trim()
        : '—',
      tenantPropertyAddress: tenantPropertyAddress,
      // tenantId as populated object (tenant who paid)
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
      // workerId as populated object (worker who received)
      workerId: payment.workerId
        ? {
            _id: payment.workerId._id.toString(),
            firstName: payment.workerId.firstName,
            lastName: payment.workerId.lastName,
            email: payment.workerId.email,
            phone: payment.workerId.phone,
            serviceType: payment.workerId.serviceType,
          }
        : null,
    };

    res.json(paymentData);
  } catch (error) {
    console.error('Error getting worker payment details:', error);
    res.status(500).json({ error: error.message });
  }
};

// controllers/adminWorkerPaymentController.js

exports.getAllWorkerPayments = async (req, res) => {
  try {
    const {
      status, paymentMethod, transactionId,
      fromDate, toDate, page = 1, limit = 500
    } = req.query;

    const matchFilter = {};
    if (status)        matchFilter.status = status;
    if (paymentMethod) matchFilter.paymentMethod = paymentMethod;
    if (transactionId) matchFilter.transactionId = { $regex: transactionId, $options: 'i' };
    if (fromDate || toDate) {
      matchFilter.paymentDate = {};
      if (fromDate) matchFilter.paymentDate.$gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        matchFilter.paymentDate.$lte = end;
      }
    }

    const total = await WorkerPayment.countDocuments(matchFilter);
    const skip = (Number(page) - 1) * Number(limit);

    const workerPayments = await WorkerPayment.find(matchFilter)
      .select('tenantId workerId userName amount status paymentMethod transactionId paymentDate createdAt')
      .populate('tenantId', 'firstName lastName')
      .populate('workerId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const formattedPayments = workerPayments.map(p => ({
      _id: p._id.toString(),
      id: p._id.toString(),
      paidByName: p.tenantId
        ? `${p.tenantId.firstName} ${p.tenantId.lastName}`.trim()
        : p.userName || 'Unknown Tenant',
      paidById: p.tenantId?._id?.toString(),
      receivedByName: p.workerId
        ? `${p.workerId.firstName} ${p.workerId.lastName}`.trim()
        : 'Unknown Worker',
      receivedById: p.workerId?._id?.toString(),
      status: p.status || 'Paid',
      paymentDate: p.paymentDate,
      paymentMethod: p.paymentMethod || 'N/A',
      transactionId: p.transactionId || '—',
      createdAt: p.createdAt,
    }));

    res.json({
      workerPayments: formattedPayments,
      total,
    });
  } catch (error) {
    console.error('getAllWorkerPayments error:', error);
    res.status(500).json({ error: error.message });
  }
};