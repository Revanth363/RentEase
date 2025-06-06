// server/controllers/superadminController.js
const Tenant = require('../models/tenant');
const Owner = require('../models/owner');
const Worker = require('../models/worker');
const Property = require('../models/property');
const Booking = require('../models/booking');
const Payment = require('../models/payment');

exports.getPlatformStats = async (req, res) => {
  try {
    // Get date ranges for revenue calculations
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = {
      totalProperties: await Property.countDocuments(),
      totalRenters: await Tenant.countDocuments(),
      totalOwners: await Owner.countDocuments(),
      totalWorkers: await Worker.countDocuments(),
      activeRentals: await Booking.countDocuments({ status: 'Active' }),
      
      // Active users = active tenants + active owners + active workers
      activeUsers: (
        (await Tenant.countDocuments({ status: 'Active' })) +
        (await Owner.countDocuments({ status: 'Active' })) +
        (await Worker.countDocuments({ status: 'Available' }))
      ),

      totalRevenue: await Payment.aggregate([
        { $match: { status: 'Paid' } },
        { $group: { _id: null, sum: { $sum: '$amount' } } }
      ]).then(r => r[0]?.sum || 0),

      // Revenue today
      revenueDaily: await Payment.aggregate([
        { $match: { status: 'Paid', createdAt: { $gte: todayStart } } },
        { $group: { _id: null, sum: { $sum: '$amount' } } }
      ]).then(r => r[0]?.sum || 0),

      // Revenue this week
      revenueWeekly: await Payment.aggregate([
        { $match: { status: 'Paid', createdAt: { $gte: weekStart } } },
        { $group: { _id: null, sum: { $sum: '$amount' } } }
      ]).then(r => r[0]?.sum || 0),

      // Revenue this month
      revenueMonthly: await Payment.aggregate([
        { $match: { status: 'Paid', createdAt: { $gte: monthStart } } },
        { $group: { _id: null, sum: { $sum: '$amount' } } }
      ]).then(r => r[0]?.sum || 0),

      propertiesActive: await Property.countDocuments({ isVerified: true, isRented: false }),
      propertiesPending: await Property.countDocuments({ isVerified: false }),
      propertiesAvailable: await Property.countDocuments({ isRented: false, isVerified: true }),
      workersAvailable: await Worker.countDocuments({ serviceStatus: 'Available' }),

      // Legacy fields for backward compatibility
      activeTenants: await Tenant.countDocuments({ status: 'Active' }),
      totalPayments: await Payment.countDocuments({ status: 'Paid' }),
      // record of payments made specifically to workers (separate collection)
      totalWorkerPayments: await require('../models/workerPayment').aggregate([
        { $match: { status: 'Paid' } },
        { $group: { _id: null, sum: { $sum: '$amount' } } }
      ]).then(r => r[0]?.sum || 0),
      platformCommission: null, // filled below
    };

    // Compute revenue breakdown by area (using property.location)
    const revenueByArea = await Payment.aggregate([
      { $match: { status: 'Paid', propertyId: { $exists: true, $ne: null } } },
      {
        $lookup: {
          from: 'properties',
          localField: 'propertyId',
          foreignField: '_id',
          as: 'property'
        }
      },
      { $unwind: '$property' },
      { $group: { _id: '$property.location', total: { $sum: '$amount' } } },
      { $project: { area: '$_id', revenue: '$total', _id: 0 } },
      { $sort: { revenue: -1 } }
    ]);

    stats.revenueByArea = revenueByArea;

    // Calculate commission (20% of total revenue)
    stats.platformCommission = Math.round((stats.totalRevenue || 0) * 0.20);

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Overview stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch platform overview statistics',
      error: error.message,
    });
  }
};