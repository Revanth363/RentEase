// server/controllers/superadminfinancialController.js
const Payment = require('../models/payment');
const WorkerPayment = require('../models/workerPayment');

const formatMonth = (year, month) => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[month - 1]} ${year}`;
};

exports.getFinancialAnalytics = async (req, res) => {
  try {
    const { range = '12months' } = req.query;

    const now = new Date();
    let monthsToFetch = 12;

    if (range === '1month') monthsToFetch = 1;
    else if (range === '3months') monthsToFetch = 3;
    else if (range === '6months') monthsToFetch = 6;

    const startDate = new Date(now.getFullYear(), now.getMonth() - monthsToFetch + 1, 1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    // Monthly Rent Revenue
    const monthlyRevenue = await Payment.aggregate([
      {
        $match: {
          status: { $in: ['Paid', 'Completed'] },
          paymentDate: { $gte: startDate, $lte: endDate },
          propertyId: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' }
          },
          revenue: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          month: {
            $concat: [
              { $arrayElemAt: [['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], { $subtract: ['$_id.month', 1] }] },
              ' ',
              { $toString: '$_id.year' }
            ]
          },
          revenue: 1,
          _id: 0
        }
      }
    ]);

    // Monthly Worker Payments (from dedicated worker payment collection)
    const workerPayments = await WorkerPayment.aggregate([
      {
        $match: {
          status: { $in: ['Paid', 'Completed'] },
          paymentDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' }
          },
          payments: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          month: {
            $concat: [
              { $arrayElemAt: [['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], { $subtract: ['$_id.month', 1] }] },
              ' ',
              { $toString: '$_id.year' }
            ]
          },
          payments: 1,
          _id: 0
        }
      }
    ]);

    // Commission series based on stored commission or settings rate
    const { getCachedSettings } = require('./superadminsettingsController');
    const settings = await getCachedSettings();
    const rate = settings.commission || 20;
    const commission = monthlyRevenue.map(item => ({
      month: item.month,
      commission: Math.round(item.revenue * rate / 100)
    }));

    // if WorkerPayment has commission field, we could also adjust workerPayments accordingly

    // Revenue Distribution
    const totalRent = await Payment.aggregate([
      { $match: { status: 'Paid', propertyId: { $exists: true } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).then(r => r[0]?.total || 0);

    const totalWorker = await WorkerPayment.aggregate([
      { $match: { status: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).then(r => r[0]?.total || 0);

    const totalCommission = Math.round(totalRent * rate / 100);

    const distribution = [
      { name: 'Owner Payments', value: totalRent, color: '#28a745' },
      { name: 'Worker Payments', value: totalWorker, color: '#ff6f00' },
      { name: 'Platform Commission', value: totalCommission, color: '#ffc107' }
    ];

    res.status(200).json({
      success: true,
      monthlyRevenue,
      workerPayments,
      commission,
      distribution
    });
  } catch (error) {
    console.error('Financial analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial analytics',
      error: error.message
    });
  }
};