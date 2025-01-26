const WorkerPayment = require('../models/workerPayment');
const Tenant = require('../models/tenant');
const Worker = require('../models/worker');

exports.getWorkerPaymentDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await WorkerPayment.findById(id)
      .populate('tenantId', 'firstName lastName email phone')
      .populate('workerId', 'firstName lastName email phone');

    if (!payment) {
      return res.status(404).send('Worker Payment not found');
    }

    const paymentData = {
      id: payment._id,
      amount: payment.amount,
      status: payment.status,
      paymentDate: payment.paymentDate,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      receiptUrl: payment.receiptUrl,
      userName: payment.userName,
      paidBy: payment.tenantId ? {
        _id: payment.tenantId._id,
        firstName: payment.tenantId.firstName,
        lastName: payment.tenantId.lastName,
        email: payment.tenantId.email,
        phone: payment.tenantId.phone
      } : null,
      receivedBy: payment.workerId ? {
        _id: payment.workerId._id,
        firstName: payment.workerId.firstName,
        lastName: payment.workerId.lastName,
        email: payment.workerId.email,
        phone: payment.workerId.phone
      } : null
    };

    res.render('admin/worker-payment-view', { payment: paymentData });
  } catch (error) {
    console.error('Error getting worker payment details:', error);
    res.status(500).send('Server error');
  }
};

exports.getAllWorkerPayments = async () => {
  try {
    const workerPayments = await WorkerPayment.find()
      .populate('tenantId', 'firstName lastName')
      .populate('workerId', 'firstName lastName')
      .sort({ createdAt: -1 });

    return workerPayments.map(p => ({
      id: p._id,
      paidByName: p.tenantId ? `${p.tenantId.firstName} ${p.tenantId.lastName}` : p.userName || 'N/A',
      paidById: p.tenantId?._id,
      receivedByName: p.workerId ? `${p.workerId.firstName} ${p.workerId.lastName}` : 'N/A',
      receivedById: p.workerId?._id,
      amount: p.amount,
      status: p.status,
      paymentDate: p.paymentDate,
      paymentMethod: p.paymentMethod,
      transactionId: p.transactionId
    }));
  } catch (error) {
    console.error('getAllWorkerPayments error:', error);
    throw error;
  }
};