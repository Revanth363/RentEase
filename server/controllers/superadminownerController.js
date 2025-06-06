// server/controllers/superadminownerController.js
const Owner = require('../models/owner');
const Payment = require('../models/payment');
const Property = require('../models/property');

exports.getOwnerEarnings = async (req, res) => {
  try {
    const owners = await Owner.find({})
      .select('firstName lastName numProperties propertyIds accountNo upiid')
      .lean();

    const enrichedOwners = await Promise.all(
      owners.map(async (owner) => {
        const propIds = owner.propertyIds || [];
        // property documents to calculate rents
        const props = await Property.find({ _id: { $in: propIds } }).select('price').lean();
        const monthlyRent = props.reduce((sum, p) => sum + (p.price || 0), 0);
        const numProperties = props.length;

        // total rent collected via payments linked to those properties
        const totalRent = await Payment.aggregate([
          {
            $match: {
              status: 'Paid',
              propertyId: { $in: propIds }
            }
          },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]).then(r => r[0]?.total || 0);

        // last payment date for these properties
        const lastPaymentDoc = await Payment.findOne({
          status: 'Paid',
          propertyId: { $in: propIds }
        })
          .sort({ paymentDate: -1 })
          .select('paymentDate')
          .lean();
        const lastPayment = lastPaymentDoc ? lastPaymentDoc.paymentDate : null;

        return {
          _id: owner._id,
          firstName: owner.firstName,
          lastName: owner.lastName,
          numProperties,
          monthlyRent,
          totalRent,
          lastPayment,
          accountNo: owner.accountNo,
          upiid: owner.upiid
        };
      })
    );

    res.status(200).json({
      success: true,
      owners: enrichedOwners
    });
  } catch (error) {
    console.error('Owner earnings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch owner earnings data',
      error: error.message
    });
  }
};