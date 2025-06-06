// server/controllers/superadminexecutivesController.js
const Admin = require('../models/admin');

exports.getExecutives = async (req, res) => {
  try {
    let executives = await Admin.find({})
      .select('firstName lastName email createdAt status role')
      .lean();

    // backfill missing createdAt from ObjectId timestamp
    executives = executives.map((exec) => {
      if (!exec.createdAt) {
        try {
          exec.createdAt = exec._id && exec._id.getTimestamp ? exec._id.getTimestamp() : new Date();
        } catch {
          exec.createdAt = new Date();
        }
      }
      return exec;
    });

    res.status(200).json({
      success: true,
      executives
    });
  } catch (error) {
    console.error('Get executives error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch executives list',
      error: error.message
    });
  }
};

exports.createExecutive = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role = 'admin' } = req.body;

    if (!email || !password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Email and password (min 8 chars) are required'
      });
    }

    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    const newExecutive = new Admin({
      firstName,
      lastName,
      email,
      password,           // plain text (current login uses plain text)
      role,
      status: 'Active',
      createdAt: new Date()
    });

    await newExecutive.save();

    res.status(201).json({
      success: true,
      message: 'Executive created successfully',
      executive: {
        _id: newExecutive._id,
        firstName,
        lastName,
        email,
        role,
        status: 'Active'
      }
    });
  } catch (error) {
    console.error('Create executive error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create executive',
      error: error.message
    });
  }
};

// update status (Active/Suspended)
exports.updateExecutiveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['Active', 'Suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const updated = await Admin.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).select('firstName lastName email status role');
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Executive not found' });
    }
    res.json({ success: true, executive: updated });
  } catch (error) {
    console.error('Update executive status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
};

// delete executive
exports.deleteExecutive = async (req, res) => {
  try {
    const { id } = req.params;
    const removed = await Admin.findByIdAndDelete(id);
    if (!removed) {
      return res.status(404).json({ success: false, message: 'Executive not found' });
    }
    res.json({ success: true, message: 'Executive deleted' });
  } catch (error) {
    console.error('Delete executive error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete executive', error: error.message });
  }
};