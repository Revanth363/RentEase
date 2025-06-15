const Verification = require('../models/Verification');

// Get verification status for a user
exports.getVerificationStatus = async (req, res) => {
  const { userId, userModel } = req.query;
  if (!userId || userId === 'undefined') return res.json({ status: null });
  try {
    const verification = await Verification.findOne({ user: userId, userModel });
    if (!verification) return res.json({ status: null });
    res.json({ status: verification.status, documents: verification.documents, rejectionReason: verification.rejectionReason });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Upload documents for verification
exports.uploadDocuments = async (req, res) => {
  const { userId, userModel } = req.body;
  try {
    if (!userId || !userModel) return res.status(400).json({ error: 'userId and userModel are required' });
    const files = req.files;
    if (!files || files.length === 0) return res.status(400).json({ error: 'No files uploaded' });

    // Files are already on Cloudinary via multer-storage-cloudinary
    // file.path = secure_url, file.filename = public_id
    const uploadedDocs = files.map(file => ({
      url: file.path,
      public_id: file.filename,
    }));

    let verification = await Verification.findOne({ user: userId, userModel });
    if (!verification) {
      verification = new Verification({
        user: userId,
        userModel,
        status: 'pending',
        documents: uploadedDocs,
      });
    } else {
      verification.status = 'pending';
      verification.documents = uploadedDocs;
      verification.rejectionReason = undefined;
    }
    await verification.save();
    res.json({ success: true });
  } catch (err) {
    console.error('uploadDocuments error:', err);
    res.status(500).json({ error: err.message });
  }
};
