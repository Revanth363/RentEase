// server/controllers/superadminsettingsController.js
// Settings persisted to MongoDB via Setting document
const Setting = require('../models/setting');

let cachedSettings = null;

async function loadSettings() {
  if (cachedSettings) return cachedSettings;
  let doc = await Setting.findOne({ name: 'platform' });
  if (!doc) {
    doc = await Setting.create({
      name: 'platform',
      commission: 20,
      maintenanceMode: false,
      maintenanceMessage: 'The site is currently under maintenance. Sorry for the inconvenience, we will be back shortly.',
    });
  }
  cachedSettings = doc;
  return doc;
}

// export getter for other modules to use
exports.getCachedSettings = loadSettings;

exports.getSystemSettings = async (req, res) => {
  try {
    const settings = await loadSettings();
    res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system settings',
      error: error.message,
    });
  }
};

exports.updateSystemSettings = async (req, res) => {
  try {
    const { commission, maintenanceMode, maintenanceMessage } = req.body;

    const update = {};
    if (commission !== undefined) {
      if (typeof commission !== 'number' || commission < 0 || commission > 100) {
        return res.status(400).json({
          success: false,
          message: 'Commission must be a number between 0 and 100',
        });
      }
      update.commission = commission;
    }
    if (maintenanceMode !== undefined) {
      update.maintenanceMode = !!maintenanceMode;
    }
    if (maintenanceMessage !== undefined) {
      update.maintenanceMessage = String(maintenanceMessage);
    }

    const updated = await Setting.findOneAndUpdate(
      { name: 'platform' },
      { $set: update },
      { new: true, upsert: true }
    );

    cachedSettings = updated;

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      settings: updated,
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update system settings',
      error: error.message,
    });
  }
};