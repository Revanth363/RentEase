// server/routes/superadmin.js
const express = require('express');
const router = express.Router();

const { protect, superadminProtect } = require('../middleware/auth');

// Import controllers
const superadminCtrl = require('../controllers/superadminController');
const financialCtrl = require('../controllers/superadminfinancialController');
const ownerCtrl = require('../controllers/superadminownerController');
const workerCtrl = require('../controllers/superadminworkerController');
const executivesCtrl = require('../controllers/superadminexecutivesController');
const settingsCtrl = require('../controllers/superadminsettingsController');
const auditCtrl = require('../controllers/superadminauditController');

// Apply protection to ALL superadmin routes
// protect: must be logged in
// superadminProtect: must be superadmin (replaces your broken requireSuperAdmin)
router.use(protect, superadminProtect);

// ─── ROUTES ────────────────────────────────────────────────────────────────

router.get('/stats', superadminCtrl.getPlatformStats);
router.get('/financial-analytics', financialCtrl.getFinancialAnalytics);
router.get('/owner-earnings', ownerCtrl.getOwnerEarnings);
router.get('/worker-earnings', workerCtrl.getWorkerEarnings);
router.get('/executives', executivesCtrl.getExecutives);
router.post('/executives', executivesCtrl.createExecutive);
// status update (activate/suspend)
router.patch('/executives/:id/status', executivesCtrl.updateExecutiveStatus);
// delete executive
router.delete('/executives/:id', executivesCtrl.deleteExecutive);
router.get('/settings', settingsCtrl.getSystemSettings);
router.post('/settings', settingsCtrl.updateSystemSettings);
router.get('/audit-logs', auditCtrl.getAuditLogs);

module.exports = router;