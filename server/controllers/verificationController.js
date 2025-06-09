const Verification = require('../models/Verification');
const cloudinary = require('../config/cloudinary');

// Get verification status for a user
exports.getVerificationStatus = async (req, res) => {
  const { userId, userModel } = req.query;
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
    let verification = await Verification.findOne({ user: userId, userModel });
    const files = req.files;
    const { documentTypes, skillTypes } = req.body;
    if (!files || files.length === 0) return res.status(400).json({ error: 'No files uploaded' });
    // Validate file types
    const allowedTypes = [
      'application/pdf',
      'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/jpg'
    ];
    for (const file of files) {
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ error: 'Only PDF and image files are allowed.' });
      }
    }
    // Upload to Cloudinary and attach document type/skillType
    const uploadedDocs = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await cloudinary.uploader.upload(file.path, { folder: 'verifications' });
      uploadedDocs.push({
        url: result.secure_url,
        public_id: result.public_id,
        type: documentTypes && documentTypes[i],
        skillType: skillTypes && skillTypes[i]
      });
    }
    if (!verification) {
      verification = new Verification({
        user: userId,
        userModel,
        status: 'pending',
        documents: uploadedDocs
      });
    } else {
      verification.status = 'pending';
      verification.documents = uploadedDocs;
      verification.rejectionReason = undefined;
    }
    await verification.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
