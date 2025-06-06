// src/services/superadminService.js
import axios from 'axios';
import { API_URL } from './api';

// Dedicated axios instance for superadmin endpoints
const superadminApi = axios.create({
  baseURL: `${API_URL}/superadmin`,
  withCredentials: true,          // Required for cookie-based auth
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── HELPER ────────────────────────────────────────────────────────────────

/**
 * Handles 401 silently for public/unauthenticated contexts
 * @param {Error} error 
 * @returns {null|object} null or fallback value
 */
const handle401 = (error) => {
  if (error.response?.status === 401) {
    console.warn('Superadmin endpoint - 401 Unauthorized (normal if not logged in as superadmin)');
    return null; // or {} depending on what you want to return
  }
  console.error('Superadmin API error:', error);
  throw error;
};

// ─── SUPERADMIN API SERVICES ────────────────────────────────────────────────

/**
 * Fetch overall platform statistics for Overview dashboard
 * @param {boolean} [silentOn401=true] - whether to silently return null on 401
 * @returns {Promise<Object|null>} stats object or null on 401
 */
export const getPlatformStats = async (silentOn401 = true) => {
  try {
    const response = await superadminApi.get('/stats');
    return response.data;
  } catch (error) {
    if (silentOn401 && error.response?.status === 401) {
      return null;
    }
    return handle401(error);
  }
};

/**
 * Fetch financial analytics data
 * @param {string} [range='12months']
 * @param {boolean} [silentOn401=true]
 */
export const getFinancialAnalytics = async (range = '12months', silentOn401 = true) => {
  try {
    const response = await superadminApi.get('/financial-analytics', {
      params: { range },
    });
    return response.data;
  } catch (error) {
    if (silentOn401 && error.response?.status === 401) {
      return null;
    }
    return handle401(error);
  }
};

/**
 * Fetch owner earnings summary
 */
export const getOwnerEarnings = async (silentOn401 = true) => {
  try {
    const response = await superadminApi.get('/owner-earnings');
    return response.data;
  } catch (error) {
    if (silentOn401 && error.response?.status === 401) {
      return [];
    }
    return handle401(error);
  }
};

/**
 * Fetch worker earnings summary
 */
export const getWorkerEarnings = async (silentOn401 = true) => {
  try {
    const response = await superadminApi.get('/worker-earnings');
    return response.data;
  } catch (error) {
    if (silentOn401 && error.response?.status === 401) {
      return [];
    }
    return handle401(error);
  }
};

/**
 * Fetch list of executives/admins
 */
export const getExecutives = async (silentOn401 = true) => {
  try {
    const response = await superadminApi.get('/executives');
    return response.data;
  } catch (error) {
    if (silentOn401 && error.response?.status === 401) {
      return [];
    }
    return handle401(error);
  }
};

/**
 * Get current system settings
 */
export const getSystemSettings = async (silentOn401 = true) => {
  try {
    const response = await superadminApi.get('/settings');
    return response.data;
  } catch (error) {
    if (silentOn401 && error.response?.status === 401) {
      return {};
    }
    return handle401(error);
  }
};

/**
 * Update system settings
 */
export const updateSystemSettings = async (settings) => {
  try {
    const response = await superadminApi.post('/settings', settings);
    return response.data;
  } catch (error) {
    // Updates should never be silent — always throw
    console.error('Error updating system settings:', error);
    throw error.response?.data || { message: 'Failed to update settings' };
  }
};

/**
 * Fetch audit logs
 */
export const getAuditLogs = async (silentOn401 = true) => {
  try {
    const response = await superadminApi.get('/audit-logs');
    return response.data;
  } catch (error) {
    if (silentOn401 && error.response?.status === 401) {
      return [];
    }
    return handle401(error);
  }
};

/**
 * Create a new executive
 */
export const createExecutive = async (data) => {
  try {
    const response = await superadminApi.post('/executives', data);
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
    const response = await superadminApi.patch(`/executives/${id}/status`, { status });
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
    const response = await superadminApi.delete(`/executives/${id}`);
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
};