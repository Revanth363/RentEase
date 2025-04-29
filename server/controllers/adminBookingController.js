// controllers/adminBookingController.js
const Booking = require('../models/booking');
const WorkerBooking = require('../models/workerBooking');
const Payment = require('../models/payment');
const Property = require('../models/property');
const Tenant = require('../models/tenant');
const Worker = require('../models/worker');

// ==================== PROPERTY BOOKINGS ====================

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

// ==================== WORKER/SERVICE BOOKINGS ====================

exports.getAllWorkerBookings = async (req, res) => {
  try {
    const {
      status,
      tenantName,
      workerName,
      fromDate,
      toDate,
      minAmount,
      maxAmount,
      page = 1,
      limit = 25
    } = req.query;

    // Build base queries for both models
    let bookingQuery = {};
    let workerBookingQuery = {};

    // Status filter
    if (status) {
      bookingQuery.status = status;
      workerBookingQuery.status = status;
    }

    // Date range filter
    if (fromDate || toDate) {
      const dateFilter = {};
      if (fromDate) {
        dateFilter.$gte = new Date(fromDate);
      }
      if (toDate) {
        const toDateEnd = new Date(toDate);
        toDateEnd.setHours(23, 59, 59, 999);
        dateFilter.$lte = toDateEnd;
      }
      bookingQuery.startDate = dateFilter;
      workerBookingQuery.bookingDate = dateFilter;
    }

    // Fetch property bookings
    const propertyBookings = await Booking.find(bookingQuery)
      .populate('tenantId', 'firstName lastName _id')
      .populate('propertyId', 'name price _id')
      .populate('assignedWorker', 'firstName lastName price _id')
      .sort({ startDate: -1 })
      .lean();

    // Fetch worker/service bookings
    const workerBookings = await WorkerBooking.find(workerBookingQuery)
      .populate('tenantId', 'firstName lastName _id')
      .populate('workerId', 'firstName lastName price _id')
      .sort({ bookingDate: -1 })
      .lean();

    // Format property bookings - check if tenant has worker booking
    const formattedPropertyBookings = await Promise.all(
      propertyBookings.map(async (b) => {
        // Check if this tenant has any worker booking
        let workerInfo = null;
        if (b.tenantId) {
          const tenantWorkerBooking = await WorkerBooking.findOne({ 
            tenantId: b.tenantId._id 
          }).populate('workerId', 'firstName lastName price _id').lean();
          
          if (tenantWorkerBooking && tenantWorkerBooking.workerId) {
            workerInfo = {
              _id: tenantWorkerBooking.workerId._id,
              firstName: tenantWorkerBooking.workerId.firstName,
              lastName: tenantWorkerBooking.workerId.lastName,
              price: tenantWorkerBooking.workerId.price
            };
          }
        }

        return {
          id: b._id.toString(),
          type: 'property', // Mark as property booking
          tenantId: b.tenantId?._id?.toString() || null,
          tenantName: b.tenantId 
            ? `${b.tenantId.firstName} ${b.tenantId.lastName}` 
            : (b.userName || 'N/A'),
          propertyId: b.propertyId?._id?.toString() || null,
          propertyName: b.propertyId?.name || b.propertyName || 'N/A',
          workerId: workerInfo?._id?.toString() || null,
          workerName: workerInfo 
            ? `${workerInfo.firstName} ${workerInfo.lastName}` 
            : 'Not Available',
          serviceType: workerInfo ? 'Property Service' : 'N/A',
          status: b.status,
          bookingDate: b.startDate || b.bookingDate,
          price: b.propertyId?.price || b.amount || 0,
          workerPrice: workerInfo?.price || 0
        };
      })
    );

    // Format worker bookings
    const formattedWorkerBookings = workerBookings.map(b => ({
      id: b._id.toString(),
      type: 'worker', // Mark as worker booking
      tenantId: b.tenantId?._id?.toString() || null,
      tenantName: b.tenantId 
        ? `${b.tenantId.firstName} ${b.tenantId.lastName}` 
        : (b.tenantName || 'N/A'),
      propertyId: null,
      propertyName: 'N/A',
      workerId: b.workerId?._id?.toString() || null,
      workerName: b.workerId 
        ? `${b.workerId.firstName} ${b.workerId.lastName}` 
        : 'Not Available',
      serviceType: b.serviceType || 'N/A',
      status: b.status,
      bookingDate: b.bookingDate,
      price: 0, // Worker bookings don't have property price
      workerPrice: b.workerId?.price || 0
    }));

    // Combine both arrays
    let allBookings = [...formattedPropertyBookings, ...formattedWorkerBookings];

    // Sort by date (most recent first)
    allBookings.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));

    // Apply tenant name filter
    if (tenantName) {
      const searchTerm = tenantName.toLowerCase();
      allBookings = allBookings.filter(b => {
        return b.tenantName.toLowerCase().includes(searchTerm);
      });
    }

    // Apply worker name filter
    if (workerName) {
      const searchTerm = workerName.toLowerCase();
      allBookings = allBookings.filter(b => {
        if (!b.workerId || b.workerName === 'Not Available') return false;
        return b.workerName.toLowerCase().includes(searchTerm);
      });
    }

    // Apply amount filters
    if (minAmount || maxAmount) {
      allBookings = allBookings.filter(b => {
        const totalAmount = b.price + b.workerPrice;
        if (minAmount && totalAmount < Number(minAmount)) return false;
        if (maxAmount && totalAmount > Number(maxAmount)) return false;
        return true;
      });
    }

    const total = allBookings.length;

    // Pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedBookings = allBookings.slice(startIndex, endIndex);

    // Final formatting for frontend
    const finalBookings = paginatedBookings.map(b => ({
      id: b.id,
      type: b.type,
      tenantId: b.tenantId,
      tenantName: b.tenantName,
      propertyId: b.propertyId,
      propertyName: b.propertyName,
      workerId: b.workerId,
      workerName: b.workerName,
      serviceType: b.serviceType,
      status: b.status,
      bookingDate: b.bookingDate,
      price: b.price + b.workerPrice, // Combined total
      propertyPrice: b.price,
      workerPrice: b.workerPrice
    }));

    res.json({
      bookings: finalBookings,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    });

  } catch (error) {
    console.error('getAllWorkerBookings error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getWorkerBookingDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await WorkerBooking.findById(id)
      .populate('tenantId', 'firstName lastName email phone location')
      .populate('workerId', 'firstName lastName serviceType price phone location')
      .lean();

    if (!booking) {
      return res.status(404).json({ error: 'Worker booking not found' });
    }

    const bookingData = {
      id: booking._id.toString(),
      status: booking.status,
      bookingDate: booking.bookingDate,
      serviceType: booking.serviceType,
      tenant: booking.tenantId
        ? {
            _id: booking.tenantId._id.toString(),
            firstName: booking.tenantId.firstName,
            lastName: booking.tenantId.lastName,
            email: booking.tenantId.email,
            phone: booking.tenantId.phone,
            location: booking.tenantId.location
          }
        : null,
      worker: booking.workerId
        ? {
            _id: booking.workerId._id.toString(),
            firstName: booking.workerId.firstName,
            lastName: booking.workerId.lastName,
            serviceType: booking.workerId.serviceType,
            price: booking.workerId.price,
            phone: booking.workerId.phone,
            location: booking.workerId.location
          }
        : null,
      tenantName: booking.tenantName,
      tenantAddress: booking.tenantAddress
    };

    res.json(bookingData);
  } catch (error) {
    console.error('getWorkerBookingDetails error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.approveWorkerBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await WorkerBooking.findByIdAndUpdate(
      id,
      { status: 'Approved' },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ error: 'Worker booking not found' });
    }

    res.json({ message: 'Worker booking approved successfully', booking });
  } catch (error) {
    console.error('approveWorkerBooking error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.declineWorkerBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await WorkerBooking.findByIdAndUpdate(
      id,
      { status: 'Declined' },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ error: 'Worker booking not found' });
    }

    res.json({ message: 'Worker booking declined successfully', booking });
  } catch (error) {
    console.error('declineWorkerBooking error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports;