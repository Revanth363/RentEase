const Verification = require('../models/Verification');

// Get verification status for authenticated user
exports.getVerificationStatus = async (req, res) => {
  try {
    // Use authenticated user's ID
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized: Please log in',
        status: null 
      });
    }

    const userId = req.user.id;
    const userModel = req.user.userType ? req.user.userType.toLowerCase() : 'tenant'; // Default to tenant if userType not specified

    console.log('🔍 Checking verification status for:', { userId, userModel });

    const verification = await Verification.findOne({ user: userId, userModel });
    
    if (!verification) {
      console.log('❌ No verification record found');
      return res.json({ 
        success: true,
        status: null, 
        message: 'No verification record found'
      });
    }

    console.log('✅ Verification found:', { status: verification.status });
    res.json({ 
      success: true,
      status: verification.status, 
      documents: verification.documents, 
      rejectionReason: verification.rejectionReason 
    });
  } catch (err) {
    console.error('❌ Error getting verification status:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message,
      status: null
    });
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
