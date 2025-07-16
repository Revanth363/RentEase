// server/controllers/superadmintenantPaymentController.js
const Payment = require('../models/payment');
const Setting = require('../models/setting');

exports.getTenantPayments = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;

    // Build base match for aggregation stats (all payments)
    const baseMatch = { propertyId: { $exists: true, $ne: null } };

    // Fetch platform commission percent from settings
    const setting = await Setting.findOne({}).lean();
    const commissionPercent = setting?.commission ?? 20;

    // ── SUMMARY STATS ──────────────────────────────────────────────────────

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalRevenueResult, monthlyRevenueResult, pendingCount, overdueCount] =
      await Promise.all([
        // All-time total paid
        Payment.aggregate([
          { $match: { ...baseMatch, status: 'Paid' } },
          { $group: { _id: null, total: { $sum: '$amount' }, commission: { $sum: '$commission' } } },
        ]),
        // This month paid
        Payment.aggregate([
          {
            $match: {
              ...baseMatch,
              status: 'Paid',
              $or: [
                { paymentDate: { $gte: monthStart } },
                { createdAt: { $gte: monthStart } },
              ],
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Payment.countDocuments({ ...baseMatch, status: 'Pending' }),
        Payment.countDocuments({ ...baseMatch, status: 'Overdue' }),
      ]);

    const totalRevenue = totalRevenueResult[0]?.total || 0;
    const storedCommissionTotal = totalRevenueResult[0]?.commission || 0;
    // Use stored commission if credible, otherwise compute from %
    const totalCommission =
      storedCommissionTotal > 0
        ? storedCommissionTotal
        : Math.round((commissionPercent / 100) * totalRevenue * 100) / 100;
    const monthlyRevenue = monthlyRevenueResult[0]?.total || 0;

    // ── PAYMENTS LIST ──────────────────────────────────────────────────────

    const matchFilter = { ...baseMatch };
    if (status && status !== 'all') matchFilter.status = status;

    // Get all payments populated (we'll do text search in JS for simplicity)
    const payments = await Payment.find(matchFilter)
      .populate('tenantId', 'firstName lastName email phone')
      .populate({
        path: 'propertyId',
        select: 'name address location ownerId',
        populate: {
          path: 'ownerId',
          select: 'firstName lastName email',
        },
      })
      .sort({ paymentDate: -1, createdAt: -1 })
      .lean();

    // Text search across tenant name, property name
    let filtered = payments;
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = payments.filter((p) => {
        const tenantName = `${p.tenantId?.firstName || ''} ${p.tenantId?.lastName || ''}`.toLowerCase();
        const propName = (p.propertyId?.name || '').toLowerCase();
        const ownerName = `${p.propertyId?.ownerId?.firstName || ''} ${p.propertyId?.ownerId?.lastName || ''}`.toLowerCase();
        return tenantName.includes(q) || propName.includes(q) || ownerName.includes(q);
      });
    }

    // Pagination
    const total = filtered.length;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const paginated = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    // Shape the response
    const shaped = paginated.map((p) => {
      const storedComm = p.commission;
      const commAmount =
        storedComm != null && storedComm > 0
          ? storedComm
          : p.amount
          ? Math.round((commissionPercent / 100) * p.amount * 100) / 100
          : 0;

      return {
        _id: p._id,
        tenant: p.tenantId
          ? {
              _id: p.tenantId._id,
              name: `${p.tenantId.firstName || ''} ${p.tenantId.lastName || ''}`.trim(),
              email: p.tenantId.email || null,
              phone: p.tenantId.phone || null,
            }
          : { name: p.userName || '—' },
        property: p.propertyId
          ? {
              _id: p.propertyId._id,
              name: p.propertyId.name || '—',
              location: p.propertyId.address || p.propertyId.location || '—',
            }
          : null,
        owner: p.propertyId?.ownerId
          ? {
              _id: p.propertyId.ownerId._id,
              name: `${p.propertyId.ownerId.firstName || ''} ${p.propertyId.ownerId.lastName || ''}`.trim(),
              email: p.propertyId.ownerId.email || null,
            }
          : null,
        amount: p.amount || 0,
        commissionPercent,
        commissionAmount: commAmount,
        paymentDate: p.paymentDate || p.createdAt || null,
        dueDate: p.dueDate || null,
        status: p.status || 'Pending',
        paymentMethod: p.paymentMethod || null,
        transactionId: p.transactionId || null,
      };
    });

    res.status(200).json({
      success: true,
      stats: {
        totalRevenue,
        monthlyRevenue,
        totalCommission,
        commissionPercent,
        pendingCount,
        overdueCount,
      },
      payments: shaped,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Tenant payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tenant payments',
      error: error.message,
    });
  }
};
