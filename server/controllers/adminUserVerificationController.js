const Verification = require('../models/Verification');
const Tenant = require('../models/tenant');
const Owner  = require('../models/owner');
const Worker = require('../models/worker');

// Maps lowercase userModel values → actual mongoose models
const MODEL_MAP = { tenant: Tenant, owner: Owner, worker: Worker };

// Populate user field manually (handles lowercase refPath mismatch)
const populateUsers = async (verifications) => {
  return Promise.all(verifications.map(async (v) => {
    const obj = v.toObject();
    const Model = MODEL_MAP[v.userModel];
    if (Model) {
      obj.user = await Model.findById(v.user)
        .select('firstName lastName email phone')
        .lean();
    }
    return obj;
  }));
};

// Get all pending verifications
exports.getPendingVerifications = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized - admin required' });
    }
    const verifications = await Verification.find({ status: 'pending' }).sort({ createdAt: -1 });
    const populatedVerifications = await populateUsers(verifications);
    res.status(200).json({ 
      success: true, 
      verifications: populatedVerifications 
    });
  } catch (err) {
    console.error('Error fetching pending verifications:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

// Approve verification
exports.approveVerification = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized - admin required' });
    }
    const { id } = req.params;
    const { notes } = req.body;
    
    if (!id) {
      return res.status(400).json({ success: false, message: 'Verification ID is required' });
    }
    
    const verification = await Verification.findById(id);
    if (!verification) {
      return res.status(404).json({ success: false, message: 'Verification not found' });
    }
    
    verification.status = 'approved';
    verification.reviewer = req.user.id;
    if (notes) {
      verification.notes = notes;
    }
    await verification.save();
    
    res.status(200).json({ 
      success: true, 
      message: 'User verification approved successfully',
      status: 'approved'
    });
  } catch (err) {
    console.error('Error approving verification:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

// Reject verification
exports.rejectVerification = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized - admin required' });
    }
    const { id } = req.params;
    const { reason, feedback } = req.body;
    
    if (!id) {
      return res.status(400).json({ success: false, message: 'Verification ID is required' });
    }
    
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Reason for rejection is required' });
    }
    
    const verification = await Verification.findById(id);
    if (!verification) {
      return res.status(404).json({ success: false, message: 'Verification not found' });
    }
    
    if (verification.status === 'rejected') {
      return res.status(400).json({ success: false, message: 'Verification is already rejected' });
    }
    
    verification.status = 'rejected';
    verification.rejectionReason = reason;
    if (feedback) {
      verification.feedback = feedback;
    }
    verification.reviewer = req.user.id;
    await verification.save();
    
    res.status(200).json({ 
      success: true, 
      message: 'User verification rejected successfully',
      status: 'rejected'
    });
  } catch (err) {
    console.error('Error rejecting verification:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

// Get all verifications (for admin dashboard)
exports.getAllVerifications = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized - admin required' });
    }
    const { status, userType, limit = 20, skip = 0 } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (userType) query.userModel = userType.toLowerCase();
    
    const verifications = await Verification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    
    const total = await Verification.countDocuments(query);
    const populatedVerifications = await populateUsers(verifications);
    
    res.status(200).json({ 
      success: true, 
      verifications: populatedVerifications,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });
  } catch (err) {
    console.error('Error fetching verifications:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};
