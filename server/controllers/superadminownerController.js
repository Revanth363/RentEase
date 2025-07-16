// server/controllers/superadminownerController.js
const Owner = require('../models/owner');
const Payment = require('../models/payment');
const Property = require('../models/property');

exports.getOwnerEarnings = async (req, res) => {
  try {
    const owners = await Owner.find({})
      .select('firstName lastName accountNo upiid status email phone')
      .lean();

    const enrichedOwners = await Promise.all(
      owners.map(async (owner) => {
        // Query properties directly by ownerId (more reliable than owner.propertyIds array)
        const props = await Property.find({ ownerId: owner._id })
          .select('name price location address isRented')
          .lean();

        const propIds = props.map(p => p._id);
        const numProperties = props.length;
        const monthlyRent = props.reduce((sum, p) => sum + (p.price || 0), 0);

        // Total rent collected via payments for those properties
        const totalRentResult = await Payment.aggregate([
          { $match: { status: 'Paid', propertyId: { $in: propIds } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalRent = totalRentResult[0]?.total || 0;

        // Last payment date for these properties
        const lastPaymentDoc = await Payment.findOne({
          status: 'Paid',
          propertyId: { $in: propIds }
        })
          .sort({ paymentDate: -1, createdAt: -1 })
          .select('paymentDate createdAt')
          .lean();
        const lastPayment = lastPaymentDoc
          ? (lastPaymentDoc.paymentDate || lastPaymentDoc.createdAt)
          : null;

        return {
          _id: owner._id,
          firstName: owner.firstName,
          lastName: owner.lastName,
          email: owner.email,
          phone: owner.phone,
          status: owner.status,
          numProperties,
          properties: props.map(p => ({
            _id: p._id,
            name: p.name || 'Unnamed Property',
            price: p.price || 0,
            location: p.address || p.location || '—',
            isRented: p.isRented || false,
          })),
          monthlyRent,
          totalRent,
          lastPayment,
          accountNo: owner.accountNo,
          upiid: owner.upiid,
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