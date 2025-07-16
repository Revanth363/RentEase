// controllers/adminMaintenanceController.js
const MaintenanceRequest = require('../models/MaintenanceRequest');
const Property = require('../models/property');
const Tenant = require('../models/tenant');
const Owner = require('../models/owner');
const Worker = require('../models/worker'); // ← Important: import Worker model

// GET /api/admin/maintenance/:id
exports.getMaintenanceDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || id.length < 10) {
      return res.status(400).json({ error: 'Invalid request ID' });
    }

    // Find the maintenance request + populate known valid fields
    const request = await MaintenanceRequest.findById(id)
      .populate({
        path: 'propertyId',
        select: 'name location address ownerId',
        populate: {
          path: 'ownerId',
          select: 'firstName lastName email phone'
        }
      })
      .populate('tenantId', 'firstName lastName email phone')
      .lean(); // ← Use .lean() for easier manipulation

    if (!request) {
      return res.status(404).json({ error: 'Maintenance request not found' });
    }

    // Manually populate assignedWorker if it exists (your real field name)
    let assignedWorker = null;
    if (request.assignedWorker) {
      try {
        assignedWorker = await Worker.findById(request.assignedWorker)
          .select('firstName lastName serviceType')
          .lean();
      } catch (err) {
        console.log('Assigned worker not found:', request.assignedWorker);
      }
    }

    // Build clean, React-friendly response
    const response = {
      id: request._id.toString(),
      issueType: request.issueType || 'General',
      status: request.status || 'Pending',
      description: request.description || 'No description provided',
      location: request.location || null,
      dateReported: request.dateReported || request.createdAt,
      scheduledDate: request.scheduledDate || null,
      completionDate: request.completionDate || null,

      // Property + Owner (nested)
      propertyId: request.propertyId ? {
        _id: request.propertyId._id.toString(),
        name: request.propertyId.name || 'Unknown Property',
        location: request.propertyId.location || 'N/A',
        address: request.propertyId.address || 'N/A',
        owner: request.propertyId.ownerId ? {
          _id: request.propertyId.ownerId._id.toString(),
          firstName: request.propertyId.ownerId.firstName,
          lastName: request.propertyId.ownerId.lastName,
          email: request.propertyId.ownerId.email || 'N/A',
          phone: request.propertyId.ownerId.phone || 'N/A'
        } : null
      } : null,

      // Tenant
      tenantId: request.tenantId ? {
        _id: request.tenantId._id.toString(),
        firstName: request.tenantId.firstName,
        lastName: request.tenantId.lastName,
        email: request.tenantId.email || 'N/A',
        phone: request.tenantId.phone || 'N/A'
      } : null,

      // Assigned Worker (only if exists)
      assignedWorkerId: assignedWorker ? {
        _id: assignedWorker._id.toString(),
        firstName: assignedWorker.firstName,
        lastName: assignedWorker.lastName,
        serviceType: assignedWorker.serviceType || 'General Service'
      } : null
    };

    res.json(response);
  } catch (error) {
    console.error('getMaintenanceDetails error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/admin/maintenance/:id/complete
exports.completeMaintenance = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await MaintenanceRequest.findByIdAndUpdate(
      id,
      { 
        status: 'Completed',
        completionDate: new Date()
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json({ success: true, message: 'Maintenance completed' });
  } catch (error) {
    console.error('completeMaintenance error:', error);
    res.status(500).json({ error: 'Failed to complete' });
  }
};

exports.getAllMaintenanceRequests = async (req, res) => {
  try {
    const { issueType, status, fromDate, toDate, page = 1, limit = 500 } = req.query;

    const matchFilter = {};
    if (issueType) matchFilter.issueType = { $regex: issueType, $options: 'i' };
    if (status)    matchFilter.status = status;
    if (fromDate || toDate) {
      matchFilter.dateReported = {};
      if (fromDate) matchFilter.dateReported.$gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        matchFilter.dateReported.$lte = end;
      }
    }

    const total = await MaintenanceRequest.countDocuments(matchFilter);
    const skip = (Number(page) - 1) * Number(limit);

    const requests = await MaintenanceRequest.find(matchFilter)
      .select('issueType status description dateReported scheduledDate completionDate createdAt propertyId tenantId')
      .populate({
        path: 'propertyId',
        select: 'name ownerId',
        populate: { path: 'ownerId', select: 'firstName lastName' }
      })
      .populate('tenantId', 'firstName lastName')
      .sort({ dateReported: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const formatted = requests.map(r => ({
      id: r._id.toString(),
      _id: r._id.toString(),
      issueType: r.issueType || 'General',
      status: r.status || 'Pending',
      description: r.description || '',
      propertyName: r.propertyId?.name || '—',
      tenantName: r.tenantId
        ? `${r.tenantId.firstName} ${r.tenantId.lastName}`.trim()
        : 'Unknown',
      ownerName: r.propertyId?.ownerId
        ? `${r.propertyId.ownerId.firstName} ${r.propertyId.ownerId.lastName}`.trim()
        : '—',
      dateReported: r.dateReported || r.createdAt,
      scheduledDate: r.scheduledDate || null,
      completionDate: r.completionDate || null,
      createdAt: r.createdAt,
    }));

    res.json({ maintenanceRequests: formatted, total });
  } catch (error) {
    console.error('getAllMaintenanceRequests error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};