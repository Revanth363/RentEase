// src/services/workerService.js
import axios from './axiosConfig';

const API = "/workers";

export const getDashboardData = async () => {
  const res = await axios.get(`${API}/dashboard`, {
    withCredentials: true,
  });
  return res.data;
};

export const toggleAvailability = async (workerId) => {
  const res = await axios.post(
    `${API}/${workerId}/toggle`,
    {},
    { withCredentials: true }
  );
  return res.data;
};

export const deleteService = async () => {
  const res = await axios.post(
    `${API}/delete-service`,
    {},
    { withCredentials: true }
  );
  return res.data;
};

export const updateBookingStatus = async (bookingId, status) => {
  const res = await axios.post(
    `${API}/bookings/${bookingId}/status`,
    { status },
    { withCredentials: true }
  );
  return res.data;
};

// ============================================================
// NOTIFICATIONS
// ============================================================
export const markNotificationAsRead = async (notificationId) => {
  const res = await axios.post(
    `${API}/notifications/${notificationId}/read`,
    {},
    {
      withCredentials: true,
    }
  );
  return res.data;
};

export const updateSettings = async (payload) => {
  const res = await axios.post(`${API}/update-settings`, payload, {
    withCredentials: true,
  });
  return res.data;
};

export const checkBookedStatus = async (workerId) => {
  const res = await axios.get(`${API}/check-booked/${workerId}`, {
    withCredentials: true,
  });
  return res.data;
};

export const deleteAccount = async (workerId, password) => {
  const res = await axios.delete(`${API}/delete-account/${workerId}`, {
    data: { password },
    withCredentials: true,
  });
  return res.data;
};

// ============================================================
// REGISTER / UPDATE WORKER PROFILE (from WorkerRegister page)
// ============================================================
export const registerWorker = async (formData) => {
  // FIXED: Changed from "/worker_register" to "/api/workers/register"
  const res = await axios.post(`${API}/register`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    withCredentials: true,
  });
  return res.data;
};

export const generateWorkOTP = async (tenantId, workDate) => {
  const res = await axios.post(
    `${API}/work-tracking/generate-otp`,
    { tenantId, workDate },
    { withCredentials: true }
  );
  return res.data;
};

export const verifyWorkOTP = async (tenantId, workDate, otp) => {
  const res = await axios.post(
    `${API}/work-tracking/verify-otp`,
    { tenantId, workDate, otp },
    { withCredentials: true }
  );
  return res.data;
};

export const getWorkHistory = async (tenantId) => {
  const res = await axios.get(`${API}/work-tracking/history/${tenantId}`, {
    withCredentials: true,
  });
  return res.data;
};
