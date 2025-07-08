// controllers/adminUserController.js
const Owner = require('../models/owner');
const Tenant = require('../models/tenant');
const Worker = require('../models/worker');
const Property = require('../models/property');
const Booking = require('../models/booking');
const Verification = require('../models/Verification');
const Payment = require('../models/payment');
const WorkerPayment = require('../models/workerPayment');

exports.getUserDetails = async (req, res) => {
  try {
    const { id, userType } = req.params;
    let user;

    switch (userType) {
      case 'owner':
        user = await Owner.findById(id).lean();
        break;
      case 'tenant':
        user = await Tenant.findById(id)
          .populate('ownerId', 'firstName lastName email')
          .lean();
        break;
      case 'worker':
        user = await Worker.findById(id).lean();
        break;
      default:
        return res.status(400).json({ message: 'Invalid user type' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let tenantProperty = null;
    let workerBookings = [];
    let ownerProperties = [];
    let ownerPayments = [];
    let tenantRentPayments = [];
    let tenantWorkerPayments = [];
    let workerPayments = [];

    if (userType === 'tenant') {
      tenantProperty = await Property.findOne({ tenantId: id })
        .populate('ownerId', 'firstName lastName email')
        .lean();
      tenantRentPayments = await Payment.find({ tenantId: id })
        .populate('propertyId', 'name')
        .sort({ paymentDate: -1 })
        .lean();
      tenantWorkerPayments = await WorkerPayment.find({ tenantId: id })
        .populate('workerId', 'firstName lastName serviceType')
        .sort({ paymentDate: -1 })
        .lean();
    } else if (userType === 'worker') {
      workerBookings = await Booking.find({ assignedWorker: id, status: 'Active' })
        .populate('tenantId', 'firstName lastName email')
        .populate('propertyId', 'name location')
        .lean();
      workerPayments = await WorkerPayment.find({ workerId: id })
        .populate('tenantId', 'firstName lastName')
        .sort({ paymentDate: -1 })
        .lean();
    } else if (userType === 'owner') {
      ownerProperties = await Property.find({ ownerId: id })
        .populate('tenantId', 'firstName lastName email')
        .lean();
      const propertyIds = ownerProperties.map(p => p._id);
      if (propertyIds.length > 0) {
        ownerPayments = await Payment.find({ propertyId: { $in: propertyIds } })
          .populate('tenantId', 'firstName lastName')
          .populate('propertyId', 'name')
          .sort({ paymentDate: -1 })
          .lean();
      }
    }

    const userData = {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userType: userType,
      address: user.location,
      phone: user.phone,
      status: user.status,
      createdAt: user.createdAt,
      tenantProperty: tenantProperty
        ? {
            _id: tenantProperty._id.toString(),
            name: tenantProperty.name,
            location: tenantProperty.location,
            owner: tenantProperty.ownerId
              ? {
                  _id: tenantProperty.ownerId._id.toString(),
                  firstName: tenantProperty.ownerId.firstName,
                  lastName: tenantProperty.ownerId.lastName,
                  email: tenantProperty.ownerId.email,
                }
              : null,
          }
        : null,
      workerBookings: workerBookings.map(booking => ({
        _id: booking._id.toString(),
        tenant: booking.tenantId
          ? {
              _id: booking.tenantId._id.toString(),
              firstName: booking.tenantId.firstName,
              lastName: booking.tenantId.lastName,
              email: booking.tenantId.email,
            }
          : null,
        property: booking.propertyId
          ? {
              _id: booking.propertyId._id.toString(),
              name: booking.propertyId.name,
              location: booking.propertyId.location,
            }
          : null,
        startDate: booking.startDate,
        endDate: booking.endDate,
      })),
      ownerProperties: ownerProperties.map(property => ({
        _id: property._id.toString(),
        name: property.name,
        location: property.location,
        tenant: property.tenantId
          ? {
              _id: property.tenantId._id.toString(),
              firstName: property.tenantId.firstName,
              lastName: property.tenantId.lastName,
              email: property.tenantId.email,
            }
          : null,
      })),
      ownerPayments: ownerPayments.map(p => ({
        _id: p._id.toString(),
        amount: p.amount,
        paymentDate: p.paymentDate,
        status: p.status,
        paymentMethod: p.paymentMethod,
        propertyName: p.propertyId?.name || '—',
        propertyId: p.propertyId?._id?.toString() || null,
        tenantName: p.tenantId ? `${p.tenantId.firstName} ${p.tenantId.lastName}`.trim() : (p.userName || '—'),
        tenantId: p.tenantId?._id?.toString() || null,
      })),
      tenantRentPayments: tenantRentPayments.map(p => ({
        _id: p._id.toString(),
        amount: p.amount,
        paymentDate: p.paymentDate,
        status: p.status,
        paymentMethod: p.paymentMethod,
        propertyName: p.propertyId?.name || '—',
        propertyId: p.propertyId?._id?.toString() || null,
      })),
      tenantWorkerPayments: tenantWorkerPayments.map(p => ({
        _id: p._id.toString(),
        amount: p.amount,
        paymentDate: p.paymentDate,
        status: p.status,
        paymentMethod: p.paymentMethod,
        workerName: p.workerId ? `${p.workerId.firstName} ${p.workerId.lastName}`.trim() : (p.userName || '—'),
        serviceType: p.workerId?.serviceType || '—',
        workerId: p.workerId?._id?.toString() || null,
      })),
      workerPayments: workerPayments.map(p => ({
        _id: p._id.toString(),
        amount: p.amount,
        paymentDate: p.paymentDate,
        status: p.status,
        paymentMethod: p.paymentMethod,
        tenantName: p.tenantId ? `${p.tenantId.firstName} ${p.tenantId.lastName}`.trim() : (p.userName || '—'),
        tenantId: p.tenantId?._id?.toString() || null,
      })),
    };

    res.json(userData);
  } catch (error) {
    console.error('getUserDetails error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.changeUserStatus = async (req, res) => {
  try {
    const { id, userType } = req.params;
    const { status } = req.body;
    console.log(`changeUserStatus: id=${id}, userType=${userType}, status=${status}`);

    if (!['Active', 'Suspended'].includes(status)) {
      console.log(`Invalid status: ${status}`);
      return res.status(400).json({ message: 'Invalid status value' });
    }

    let Model;
    switch (userType.toLowerCase()) {
      case 'owner':
        Model = Owner;
        break;
      case 'tenant':
        Model = Tenant;
        break;
      case 'worker':
        Model = Worker;
        break;
      default:
        console.log(`Invalid userType: ${userType}`);
        return res.status(400).json({ message: 'Invalid user type' });
    }

    const user = await Model.findByIdAndUpdate(id, { status }, { new: true });
    if (!user) {
      console.log(`User not found: id=${id}, userType=${userType}`);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`User status updated: id=${id}, userType=${userType}, status=${status}`);
    res.json({ message: `User ${status === 'Active' ? 'activated' : 'suspended'} successfully` });
  } catch (error) {
    console.error('changeUserStatus error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id, userType } = req.params;
    console.log(`Attempting to delete user with ID: ${id}, userType: ${userType}`);

    let Model;
    switch (userType.toLowerCase()) {
      case 'owner':
        Model = Owner;
        await Property.deleteMany({ ownerId: id });
        break;
      case 'tenant':
        Model = Tenant;
        await Property.updateMany(
          { tenantId: id },
          { $set: { tenantId: null, isRented: false } }
        );
        break;
      case 'worker':
        Model = Worker;
        await Property.updateMany(
          { activeWorkers: id },
          { $pull: { activeWorkers: id } }
        );
        await Booking.updateMany(
          { assignedWorker: id },
          { $set: { assignedWorker: null } }
        );
        break;
      default:
        console.log(`Invalid userType: ${userType}`);
        return res.status(400).json({ message: 'Invalid user type' });
    }

    const user = await Model.findByIdAndDelete(id);
    if (!user) {
      console.log(`User not found: id=${id}, userType=${userType}`);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`User deleted successfully: id=${id}, userType=${userType}`);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('deleteUser error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// controllers/adminUserController.js
exports.getAllUsers = async (req, res) => {
  try {
    const {
      name = '', email = '', phone = '', role = '', status = '',
      fromDate = '', toDate = '', address = '',
      page = 1, limit = 25
    } = req.query;

    const currentPage = parseInt(page);
    const currentLimit = parseInt(limit);
    const skip = (currentPage - 1) * currentLimit;

    const hasFilter = name || email || phone || role || status || fromDate || toDate || address;

    // Build MongoDB regex filter
    const buildFilter = () => {
      const filter = {};

      if (role) filter.userType = role;
      if (status) filter.status = status;

      if (name) {
        const regex = new RegExp(name.trim(), 'i');
        filter.$or = [
          { firstName: regex },
          { lastName: regex },
          { $expr: { $regexMatch: { input: { $concat: ["$firstName", " ", "$lastName"] }, regex } } }
        ];
      }

      if (email) filter.email = { $regex: email.trim(), $options: 'i' };
      if (phone) filter.phone = { $regex: phone.trim(), $options: 'i' };
      if (address) filter.location = { $regex: address.trim(), $options: 'i' };

      if (fromDate || toDate) {
        filter.createdAt = {};
        if (fromDate) filter.createdAt.$gte = new Date(fromDate);
        if (toDate) {
          const end = new Date(toDate);
          end.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = end;
        }
      }

      return filter;
    };

    const filter = buildFilter();

    // NO FILTER → Show only 5 latest users
    if (!hasFilter) {
      const latest = await Promise.all([
        Tenant.find().sort({ createdAt: -1 }).limit(5).lean(),
        Owner.find().sort({ createdAt: -1 }).limit(5).lean(),
        Worker.find().sort({ createdAt: -1 }).limit(5).lean(),
      ]);

      let users = [...latest[0], ...latest[1], ...latest[2]]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      const ids = users.map(u => u._id);
      const verifications = await Verification.find({ user: { $in: ids } }).lean();
      const vMap = {};
      verifications.forEach(v => { vMap[v.user.toString()] = v.status; });

      const formatted = users.map(u => ({
        id: u._id.toString(),
        firstName: u.firstName,
        lastName: u.lastName,
        userType: u.userType || 'tenant',
        email: u.email,
        phone: u.phone || 'N/A',
        address: u.location || 'N/A',
        status: u.status || 'Active',
        createdAt: u.createdAt,
        verificationStatus: vMap[u._id.toString()] || null,
      }));

      return res.json({ users: formatted, total: formatted.length });
    }

    // WITH FILTER → Full search + correct pagination
    const collections = [
      { model: Tenant, type: 'tenant' },
      { model: Owner, type: 'owner' },
      { model: Worker, type: 'worker' }
    ];

    const promises = collections.map(async ({ model, type }) => {
      if (role && role !== type) return [];
      return await model.find(filter)
        .select('firstName lastName email phone location status createdAt userType')
        .lean();
    });

    const results = await Promise.all(promises);
    let allUsers = results.flat();

    // Sort by newest first
    allUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = allUsers.length;
    const paginated = allUsers.slice(skip, skip + currentLimit);

    const paginatedIds = paginated.map(u => u._id);
    const verifications2 = await Verification.find({ user: { $in: paginatedIds } }).lean();
    const vMap2 = {};
    verifications2.forEach(v => { vMap2[v.user.toString()] = v.status; });

    const formatted = paginated.map(u => ({
      id: u._id.toString(),
      firstName: u.firstName,
      lastName: u.lastName,
      userType: u.userType,
      email: u.email,
      phone: u.phone || 'N/A',
      address: u.location || 'N/A',
      status: u.status || 'Active',
      createdAt: u.createdAt,
      verificationStatus: vMap2[u._id.toString()] || null,
    }));

    res.json({ users: formatted, total });

  } catch (error) {
    console.error('getAllUsers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};