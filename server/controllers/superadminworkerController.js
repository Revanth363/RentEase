// server/controllers/superadminworkerController.js
const Worker = require('../models/worker');
const WorkerPayment = require('../models/workerPayment');
const WorkerBooking = require('../models/workerBooking');

exports.getWorkerEarnings = async (req, res) => {
  try {
    // Include all workers so superadmin sees complete picture
    const workers = await Worker.find({})
      .select('firstName lastName serviceType experience status email phone')
      .lean();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const enrichedWorkers = await Promise.all(
      workers.map(async (worker) => {
        // Total earnings = sum of all paid worker payments
        const totalEarningsResult = await WorkerPayment.aggregate([
          { $match: { status: 'Paid', workerId: worker._id } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalEarnings = totalEarningsResult[0]?.total || 0;

        // Monthly earnings = payments this calendar month (check both paymentDate and createdAt)
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

        // Completed services = count from WorkerBooking (has status 'Completed')
        const completedServices = await WorkerBooking.countDocuments({
          workerId: worker._id,
          status: 'Completed'
        });

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