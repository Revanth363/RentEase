// controllers/adminWorkerPaymentController.js
const WorkerPayment = require('../models/workerPayment');
const Tenant = require('../models/tenant');
const Worker = require('../models/worker');

exports.getWorkerPaymentDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await WorkerPayment.findById(id)
      .populate('tenantId', 'firstName lastName email phone')
      .populate('workerId', 'firstName lastName email phone serviceType')
      .lean();

    if (!payment) {
      return res.status(404).json({ error: 'Worker Payment not found' });
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
      // tenantId as populated object (tenant who paid)
      tenantId: payment.tenantId
        ? {
            _id: payment.tenantId._id.toString(),
            firstName: payment.tenantId.firstName,
            lastName: payment.tenantId.lastName,
            email: payment.tenantId.email,
            phone: payment.tenantId.phone,
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
    const workerPayments = await WorkerPayment.find()
      .populate('tenantId', 'firstName lastName')
      .populate('workerId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10)  // Only latest 10 payments
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
      total: formattedPayments.length  // will be ≤10
    });

  } catch (error) {
    console.error('getAllWorkerPayments error:', error);
    res.status(500).json({ error: error.message });
  }
};