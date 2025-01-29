// controllers/adminBookingController.js
const Booking = require('../models/booking');
const Payment = require('../models/payment');
const Property = require('../models/property');
const Tenant = require('../models/tenant');
const Worker = require('../models/worker');

exports.getBookingDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id)
      .populate('tenantId', 'firstName lastName email phone')
      .populate('propertyId', 'name location address price')
      .populate('assignedWorker', 'firstName lastName serviceType')
      .lean();

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (!booking.propertyId) {
      console.error(`Property not found for booking ID: ${id}`);
      return res.status(404).json({ error: 'Associated property not found' });
    }

    const bookingData = {
      id: booking._id.toString(),
      status: booking.status,
      bookingDate: booking.createdAt,
      startDate: booking.startDate,
      endDate: booking.endDate,
      amount: booking.amount,
      user: booking.tenantId
        ? {
            _id: booking.tenantId._id.toString(),
            firstName: booking.tenantId.firstName,
            lastName: booking.tenantId.lastName,
            email: booking.tenantId.email,
            phone: booking.tenantId.phone,
          }
        : null,
      property: booking.propertyId
        ? {
            _id: booking.propertyId._id.toString(),
            name: booking.propertyId.name,
            location: booking.propertyId.location,
            address: booking.propertyId.address,
            price: booking.propertyId.price,
          }
        : null,
      assignedWorker: booking.assignedWorker
        ? {
            _id: booking.assignedWorker._id.toString(),
            firstName: booking.assignedWorker.firstName,
            lastName: booking.assignedWorker.lastName,
            serviceType: booking.assignedWorker.serviceType,
          }
        : null,
    };

    res.json(bookingData);
  } catch (error) {
    console.error('getBookingDetails error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.approveBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findByIdAndUpdate(
      id,
      { status: 'Approved' },
      { new: true }
    ).populate('propertyId');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Create payment record
    const payment = new Payment({
      bookingId: id,
      user: booking.tenantId,
      property: booking.propertyId._id,
      amount: booking.propertyId.price,
      status: 'Pending',
      paymentMethod: 'Online',
    });

    await payment.save();

    // Update property status if needed
    if (booking.propertyId.status !== 'Rented') {
      await Property.findByIdAndUpdate(
        booking.propertyId._id,
        { status: 'Rented', isRented: true }
      );
    }

    res.json({ message: 'Booking approved successfully' });
  } catch (error) {
    console.error('approveBooking error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.rejectBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findByIdAndUpdate(
      id,
      { status: 'Rejected' },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ message: 'Booking rejected successfully' });
  } catch (error) {
    console.error('rejectBooking error:', error);
    res.status(500).json({ error: error.message });
  }
};