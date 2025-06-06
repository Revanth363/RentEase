// server/controllers/superadminworkerController.js
const Worker = require('../models/worker');
const WorkerPayment = require('../models/workerPayment');
const Booking = require('../models/booking');

exports.getWorkerEarnings = async (req, res) => {
  try {
    const workers = await Worker.find({ status: 'Active' })
      .select('firstName lastName serviceType experience')
      .lean();

    const enrichedWorkers = await Promise.all(
      workers.map(async (worker) => {
        // Total earnings = sum of worker payments (from WorkerPayment collection)
        const totalEarnings = await WorkerPayment.aggregate([
          { $match: { status: 'Paid', workerId: worker._id } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]).then(r => r[0]?.total || 0);

        // Monthly earnings = sum of payments within current month
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyEarnings = await WorkerPayment.aggregate([
          { $match: { status: 'Paid', workerId: worker._id, createdAt: { $gte: monthStart } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]).then(r => r[0]?.total || 0);

        // Completed services = count of completed bookings
        const completedServices = await Booking.countDocuments({
          assignedWorker: worker._id,
          status: { $in: ['Completed', 'Finished'] }
        });

        return {
          _id: worker._id,
          firstName: worker.firstName,
          lastName: worker.lastName,
          serviceType: worker.serviceType,
          experience: worker.experience,
          monthlyEarnings,
          totalEarnings,
          completedServices
        };
      })
    );

    res.status(200).json({
      success: true,
      workers: enrichedWorkers
    });
  } catch (error) {
    console.error('Worker earnings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch worker earnings data',
      error: error.message
    });
  }
};