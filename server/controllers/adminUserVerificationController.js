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
    const verifications = await Verification.find({ status: 'pending' });
    res.json(await populateUsers(verifications));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Approve verification
exports.approveVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const verification = await Verification.findById(id);
    if (!verification) return res.status(404).json({ error: 'Verification not found' });
    verification.status = 'approved';
    verification.reviewer = req.user._id;
    await verification.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Reject verification
exports.rejectVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const verification = await Verification.findById(id);
    if (!verification) return res.status(404).json({ error: 'Verification not found' });
    verification.status = 'rejected';
    verification.rejectionReason = reason;
    verification.reviewer = req.user._id;
    await verification.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all verifications (for admin dashboard)
exports.getAllVerifications = async (req, res) => {
  try {
    const verifications = await Verification.find().sort({ createdAt: -1 });
    res.json(await populateUsers(verifications));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
