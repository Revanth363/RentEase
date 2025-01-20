const Payment = require('../models/payment');
const Tenant = require('../models/tenant');
const Booking = require('../models/booking');
const Property = require('../models/property');


exports.getPaymentDetails = async (req, res) => {
    try {
      const { id } = req.params;
      
      const payment = await Payment.findById(id)
        .populate('tenantId', 'firstName lastName email phone')
        .populate({
          path: 'bookingId',
          populate: { path: 'propertyId', select: 'name' }
        });
  
      if (!payment) {
        return res.status(404).send('Payment not found');
      }
  
      const paymentData = {
        id: payment._id,
        amount: payment.amount,
        status: payment.status,
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId,
        dueDate: payment.dueDate,
        receiptUrl: payment.receiptUrl,
        userName: payment.userName,
        user: payment.tenantId ? {
          _id: payment.tenantId._id,
          firstName: payment.tenantId.firstName,
          lastName: payment.tenantId.lastName,
          email: payment.tenantId.email,
          phone: payment.tenantId.phone
        } : null,
        booking: payment.bookingId ? {
          _id: payment.bookingId._id,
          propertyName: payment.bookingId.propertyId?.name,
          startDate: payment.bookingId.startDate,
          endDate: payment.bookingId.endDate
        } : null
      };
  
      res.render('admin/payment-view', { payment: paymentData });
    } catch (error) {
      console.error('Error getting payment details:', error);
      res.status(500).send('Server error');
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
  
  exports.getAllPayments = async (req, res) => {
    try {
      const payments = await Payment.find()
        .populate('tenantId', 'firstName lastName')
        .populate('bookingId', 'propertyId startDate endDate')
        .sort({ createdAt: -1 });
      
      res.render('admin/payments-list', { 
        payments: payments.map(p => ({
          id: p._id,
          userName: p.tenantId ? `${p.tenantId.firstName} ${p.tenantId.lastName}` : p.userName,
          amount: p.amount,
          status: p.status,
          paymentDate: p.paymentDate,
          bookingId: p.bookingId?._id,
          paymentMethod: p.paymentMethod,
          transactionId: p.transactionId
        }))
      });
    } catch (error) {
      console.error('getAllPayments error:', error);
      res.status(500).render('error', { error });
    }
  };