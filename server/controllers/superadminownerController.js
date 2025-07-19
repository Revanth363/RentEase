// server/controllers/superadminownerController.js
const Owner = require('../models/owner');
const Payment = require('../models/payment');
const Property = require('../models/property');
const Booking = require('../models/booking');
const Tenant = require('../models/tenant');

exports.getOwnerEarnings = async (req, res) => {
  try {
    const owners = await Owner.find({})
      .select('firstName lastName accountNo upiid status email phone')
      .lean();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const enrichedOwners = await Promise.all(
      owners.map(async (owner) => {
        const props = await Property.find({ ownerId: owner._id })
          .select('name price location address isRented')
          .lean();

        const propIds = props.map(p => p._id);
        const numProperties = props.length;
        const monthlyRent = props.reduce((sum, p) => sum + (p.price || 0), 0);

        const totalRentResult = await Payment.aggregate([
          { $match: { status: 'Paid', propertyId: { $in: propIds } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalRent = totalRentResult[0]?.total || 0;

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

        // For each property, get tenant + this-month payment status
        const propertiesWithTenant = await Promise.all(
          props.map(async (p) => {
            if (!p.isRented) {
              return {
                _id: p._id,
                name: p.name || 'Unnamed Property',
                price: p.price || 0,
                location: p.address || p.location || '—',
                isRented: false,
                tenantName: null,
                tenantId: null,
                paidThisMonth: null,
              };
            }

            // Find active booking for this property
            const activeBooking = await Booking.findOne({
              propertyId: p._id,
              status: { $in: ['Active', 'Approved'] }
            })
              .populate('tenantId', 'firstName lastName')
              .lean();

            const tenant = activeBooking?.tenantId || null;
            const tenantName = tenant
              ? `${tenant.firstName} ${tenant.lastName}`.trim()
              : null;
            const tenantIdStr = tenant?._id?.toString() || null;

            // Check if this tenant paid this month for this property
            let paidThisMonth = false;
            if (tenantIdStr) {
              const thisMonthPayment = await Payment.findOne({
                propertyId: p._id,
                tenantId: tenant._id,
                status: 'Paid',
                $or: [
                  { paymentDate: { $gte: monthStart } },
                  { createdAt: { $gte: monthStart } }
                ]
              }).lean();
              paidThisMonth = !!thisMonthPayment;
            }

            return {
              _id: p._id,
              name: p.name || 'Unnamed Property',
              price: p.price || 0,
              location: p.address || p.location || '—',
              isRented: true,
              tenantName,
              tenantId: tenantIdStr,
              paidThisMonth,
            };
          })
        );

        return {
          _id: owner._id,
          firstName: owner.firstName,
          lastName: owner.lastName,
          email: owner.email,
          phone: owner.phone,
          status: owner.status,
          numProperties,
          properties: propertiesWithTenant,
          monthlyRent,
          totalRent,
          lastPayment,
          accountNo: owner.accountNo,
          upiid: owner.upiid,
        };
      })
    );

    res.status(200).json({ success: true, owners: enrichedOwners });
  } catch (error) {
    console.error('Owner earnings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch owner earnings data',
      error: error.message
    });
  }
};