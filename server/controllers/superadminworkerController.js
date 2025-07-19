// server/controllers/superadminworkerController.js
const Worker = require('../models/worker');
const WorkerPayment = require('../models/workerPayment');
const WorkerBooking = require('../models/workerBooking');
const Tenant = require('../models/tenant');

exports.getWorkerEarnings = async (req, res) => {
  try {
    const workers = await Worker.find({})
      .select('firstName lastName serviceType experience status email phone')
      .lean();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const enrichedWorkers = await Promise.all(
      workers.map(async (worker) => {
        const totalEarningsResult = await WorkerPayment.aggregate([
          { $match: { status: 'Paid', workerId: worker._id } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalEarnings = totalEarningsResult[0]?.total || 0;

        const monthlyEarningsResult = await WorkerPayment.aggregate([
          {
            $match: {
              status: 'Paid',
              workerId: worker._id,
              $or: [
                { paymentDate: { $gte: monthStart } },
                { createdAt: { $gte: monthStart } }
              ]
            }
          },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const monthlyEarnings = monthlyEarningsResult[0]?.total || 0;

        const completedServices = await WorkerBooking.countDocuments({
          workerId: worker._id,
          status: 'Completed'
        });

        // Active bookings = Approved or Pending (ongoing clients)
        const activeBookings = await WorkerBooking.find({
          workerId: worker._id,
          status: { $in: ['Approved', 'Pending'] }
        })
          .populate('tenantId', 'firstName lastName email phone')
          .sort({ bookingDate: -1 })
          .lean();

        // For each active booking check if tenant has an unpaid/paid worker payment
        const tenants = await Promise.all(
          activeBookings.map(async (booking) => {
            const tenant = booking.tenantId;
            if (!tenant) return null;

            const latestPayment = await WorkerPayment.findOne({
              workerId: worker._id,
              tenantId: tenant._id,
            })
              .sort({ createdAt: -1 })
              .select('status amount paymentDate createdAt')
              .lean();

            return {
              tenantId: tenant._id.toString(),
              tenantName: `${tenant.firstName} ${tenant.lastName}`.trim(),
              tenantEmail: tenant.email || null,
              tenantPhone: tenant.phone || null,
              bookingStatus: booking.status,
              bookingDate: booking.bookingDate || booking.createdAt,
              serviceType: booking.serviceType,
              paymentStatus: latestPayment?.status || 'Not Paid',
              lastPaymentAmount: latestPayment?.amount || 0,
              lastPaymentDate: latestPayment?.paymentDate || latestPayment?.createdAt || null,
            };
          })
        );

        return {
          _id: worker._id,
          firstName: worker.firstName,
          lastName: worker.lastName,
          email: worker.email,
          phone: worker.phone,
          serviceType: worker.serviceType,
          experience: worker.experience,
          status: worker.status,
          monthlyEarnings,
          totalEarnings,
          completedServices,
          tenants: tenants.filter(Boolean),
        };
      })
    );

    res.status(200).json({ success: true, workers: enrichedWorkers });
  } catch (error) {
    console.error('Worker earnings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch worker earnings data',
      error: error.message
    });
  }
};