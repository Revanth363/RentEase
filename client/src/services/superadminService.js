// src/services/superadminService.js
import axios from './axiosConfig';

// Use the configured axios directly since it already has the correct baseURL
// All calls will use: https://backend.com/api/superadmin/... (axios adds /api prefix)

// ─── HELPER ────────────────────────────────────────────────────────────────

/**
 * Logs API errors without throwing - allows pages to show empty data gracefully
 * @param {Error} error 
 * @param {string} context - what was being fetched
 */
const handleError = (error, context) => {
  if (error.response?.status === 401) {
    // Silently handle 401 - user may not be superadmin
    return null;
  }
  // Log other errors but don't re-throw - let components handle empty state gracefully
  console.error(`Superadmin ${context} error:`, error.response?.status, error.message);
  return null;
};

// ─── SUPERADMIN API SERVICES ────────────────────────────────────────────────

/**
 * Fetch overall platform statistics for Overview dashboard
 * @returns {Promise<Object>} stats object with safe defaults
 */
export const getPlatformStats = async () => {
  try {
    const response = await axios.get('/superadmin/stats');
    return response.data || {};
  } catch (error) {
    handleError(error, 'getPlatformStats');
    return { totalUsers: 0, activeBookings: 0, totalEarnings: 0 };
  }
};

/**
 * Fetch financial analytics data
 * @param {string} [range='12months']
 */
export const getFinancialAnalytics = async (range = '12months') => {
  try {
    const response = await axios.get('/superadmin/financial-analytics', {
      params: { range },
    });
    return response.data || { monthlyRevenue: [], workerPayments: [], commission: [], distribution: [] };
  } catch (error) {
    handleError(error, 'getFinancialAnalytics');
    return { monthlyRevenue: [], workerPayments: [], commission: [], distribution: [] };
  }
};

/**
 * Fetch owner earnings summary
 */
export const getOwnerEarnings = async () => {
  try {
    const response = await axios.get('/superadmin/owner-earnings');
    return response.data || [];
  } catch (error) {
    handleError(error, 'getOwnerEarnings');
    return [];
  }
};

/**
 * Fetch worker earnings summary
 */
export const getWorkerEarnings = async () => {
  try {
    const response = await axios.get('/superadmin/worker-earnings');
    return response.data || [];
  } catch (error) {
    handleError(error, 'getWorkerEarnings');
    return [];
  }
};

/**
 * Fetch list of executives/admins
 */
export const getExecutives = async () => {
  try {
    const response = await axios.get('/superadmin/executives');
    return response.data || [];
  } catch (error) {
    handleError(error, 'getExecutives');
    return [];
  }
};

/**
 * Get current system settings
 */
export const getSystemSettings = async () => {
  try {
    const response = await axios.get('/superadmin/settings');
    return response.data || {};
  } catch (error) {
    handleError(error, 'getSystemSettings');
    return {};
  }
};

/**
 * Update system settings
 */
export const updateSystemSettings = async (settings) => {
  try {
    const response = await axios.post('/superadmin/settings', settings);
    return response.data;
  } catch (error) {
    console.error('Error updating system settings:', error);
    throw error.response?.data || { message: 'Failed to update settings' };
  }
};

/**
 * Fetch audit logs with filtering and pagination
 * @param {Object} filters - { action, userId, startDate, endDate, status, limit, skip, sortBy, sortOrder }
 */
export const getAuditLogs = async (filters = {}) => {
  try {
    const params = {
      limit: filters.limit || 50,
      skip: filters.skip || 0,
      sortBy: filters.sortBy || 'timestamp',
      sortOrder: filters.sortOrder || '-1',
    };

    if (filters.action) params.action = filters.action;
    if (filters.userId) params.userId = filters.userId;
    if (filters.role) params.role = filters.role;
    if (filters.search) params.search = filters.search;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.resourceType) params.resourceType = filters.resourceType;
    if (filters.status) params.status = filters.status;

    const response = await axios.get('/superadmin/audit-logs', { params });
    return response.data || { logs: [], pagination: {} };
  } catch (error) {
    const message = error.response?.data?.error || error.response?.data?.message || 'Failed to fetch audit logs';
    throw new Error(message);
  }
};

/**
 * Get audit log statistics
 * @param {Object} filters - { startDate, endDate }
 */
export const getAuditStats = async (filters = {}) => {
  try {
    const params = {};
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;

    const response = await axios.get('/superadmin/audit-logs/stats', { params });
    return response.data || {};
  } catch (error) {
    handleError(error, 'getAuditStats');
    return {};
  }
};

/**
 * Export audit logs to CSV
 * @param {Object} filters - { action, startDate, endDate }
 */
export const exportAuditLogs = async (filters = {}) => {
  try {
    const params = {};
    if (filters.action) params.action = filters.action;
    if (filters.role) params.role = filters.role;
    if (filters.status) params.status = filters.status;
    if (filters.resourceType) params.resourceType = filters.resourceType;
    if (filters.search) params.search = filters.search;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;

    const response = await axios.get('/superadmin/audit-logs/export', { params, responseType: 'blob' });
    // Trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit-logs-${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    return true;
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    return false;
  }
};

/**
 * Fetch all tenant payments for superadmin
 * @param {Object} params - { status, search, page, limit }
 */
export const getTenantPayments = async (params = {}) => {
  try {
    const response = await axios.get('/superadmin/tenant-payments', { params });
    return response.data || { stats: {}, payments: [], pagination: {} };
  } catch (error) {
    handleError(error, 'getTenantPayments');
    return { stats: {}, payments: [], pagination: {} };
  }
};

/**
 * Create a new executive
 */
export const createExecutive = async (data) => {
  try {
    const response = await axios.post('/superadmin/executives', data);
    return response.data;
  } catch (error) {
    console.error('Error creating executive:', error);
    throw error.response?.data || { message: 'Failed to create executive' };
  }
};

/**
 * Change an executive's status (Active/Suspended)
 */
export const updateExecutiveStatus = async (id, status) => {
  try {
    const response = await axios.patch(`/superadmin/executives/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating executive status:', error);
    throw error.response?.data || { message: 'Failed to update status' };
  }
};

/**
 * Delete an executive by id
 */
export const deleteExecutive = async (id) => {
  try {
    const response = await axios.delete(`/superadmin/executives/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting executive:', error);
    throw error.response?.data || { message: 'Failed to delete executive' };
  }
};

export default {
  getPlatformStats,
  getFinancialAnalytics,
  getOwnerEarnings,
  getWorkerEarnings,
  getExecutives,
  createExecutive,
  updateExecutiveStatus,
  deleteExecutive,
  getSystemSettings,
  updateSystemSettings,
  getAuditLogs,
  getTenantPayments,
};