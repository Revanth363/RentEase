// controllers/adminWorkerPaymentController.js
const WorkerPayment = require('../models/workerPayment');
const Tenant = require('../models/tenant');
const Worker = require('../models/worker');

exports.getWorkerPaymentDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await WorkerPayment.findById(id)
      .populate('tenantId', 'firstName lastName email phone')
      .populate('workerId', 'firstName lastName email phone')
      .lean();

    if (!payment) {
      return res.status(404).json({ error: 'Worker Payment not found' });
    }

    const paymentData = {
      id: payment._id.toString(),
      amount: payment.amount,
      status: payment.status,
      paymentDate: payment.paymentDate,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      receiptUrl: payment.receiptUrl,
      userName: payment.userName,
      paidBy: payment.tenantId
        ? {
            _id: payment.tenantId._id.toString(),
            firstName: payment.tenantId.firstName,
            lastName: payment.tenantId.lastName,
            email: payment.tenantId.email,
            phone: payment.tenantId.phone,
          }
        : null,
      receivedBy: payment.workerId
        ? {
            _id: payment.workerId._id.toString(),
            firstName: payment.workerId.firstName,
            lastName: payment.workerId.lastName,
            email: payment.workerId.email,
            phone: payment.workerId.phone,
          }
        : null,
    };

    res.json(paymentData);
  } catch (error) {
    console.error('Error getting worker payment details:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAllWorkerPayments = async (req, res) => {
  try {
    const workerPayments = await WorkerPayment.find()
      .populate('tenantId', 'firstName lastName')
      .populate('workerId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();

    const formattedPayments = workerPayments.map(p => ({
      id: p._id.toString(),
      paidByName: p.tenantId
        ? `${p.tenantId.firstName} ${p.tenantId.lastName}`
        : p.userName || 'N/A',
      paidById: p.tenantId?._id.toString(),
      receivedByName: p.workerId
        ? `${p.workerId.firstName} ${p.workerId.lastName}`
        : 'N/A',
      receivedById: p.workerId?._id.toString(),
      amount: p.amount,
      status: p.status,
      paymentDate: p.paymentDate,
      paymentMethod: p.paymentMethod,
      transactionId: p.transactionId,
    }));

    res.json({ workerPayments: formattedPayments });
  } catch (error) {
    console.error('getAllWorkerPayments error:', error);
    res.status(500).json({ error: error.message });
  }
};