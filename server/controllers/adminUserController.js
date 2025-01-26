const Owner = require('../models/owner');
const Tenant = require('../models/tenant');
const Worker = require('../models/worker');
const Property = require('../models/property');
const Booking = require('../models/booking');

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

    // 🚨 NEW: GET RELATIONSHIPS
    let tenantProperty = null;
    let workerBookings = [];
    let ownerProperties = [];

    if (userType === 'tenant') {
      // TENANT: Find their PROPERTY
      tenantProperty = await Property.findOne({ tenantId: id })
        .populate('ownerId', 'firstName lastName email')
        .lean();
    } else if (userType === 'worker') {
      // WORKER: Find ACTIVE BOOKINGS
      workerBookings = await Booking.find({ 
        assignedWorker: id, 
        status: 'Active' 
      })
        .populate('tenantId', 'firstName lastName email')
        .populate('propertyId', 'name location')
        .lean();
    } else if (userType === 'owner') {
      // OWNER: Find their PROPERTIES
      ownerProperties = await Property.find({ ownerId: id })
        .populate('tenantId', 'firstName lastName email')
        .lean();
    }

    // Format user
    user.id = user._id.toString();
    user.address = user.location;

    console.log('🚨 USER:', userType, user.firstName);
    console.log('🚨 TENANT PROPERTY:', tenantProperty);
    console.log('🚨 WORKER BOOKINGS:', workerBookings.length);

    res.render('admin/user-view', { 
      user, 
      userType, 
      tenantProperty,
      workerBookings,
      ownerProperties 
    });
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