const Verification = require('../models/Verification');

// Get all pending verifications
exports.getPendingVerifications = async (req, res) => {
  try {
    const verifications = await Verification.find({ status: 'pending' }).populate('user');
    res.json(verifications);
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
    const verifications = await Verification.find().populate('user');
    res.json(verifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
