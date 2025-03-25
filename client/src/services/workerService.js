// src/services/workerService.js
import axios from "axios";

const API = "/api/workers";

export const getDashboardData = async () => {
  const res = await axios.get(`${API}/api/dashboard`, { withCredentials: true });
  return res.data;
};

export const toggleAvailability = async (workerId) => {
  const res = await axios.post(`${API}/${workerId}/toggle`, {}, { withCredentials: true });
  return res.data;
};

export const deleteService = async () => {
  const res = await axios.post(`${API}/delete-service`, {}, { withCredentials: true });
  return res.data;
};

export const updateBookingStatus = async (bookingId, status) => {
  const res = await axios.post(`${API}/bookings/${bookingId}/status`, { status }, { withCredentials: true });
  return res.data;
};

export const updateSettings = async (payload) => {
  const res = await axios.post(`${API}/update-settings`, payload, { withCredentials: true });
  return res.data;
};

export const checkBookedStatus = async (workerId) => {
  const res = await axios.get(`${API}/check-booked/${workerId}`, { withCredentials: true });
  return res.data;
};

export const deleteAccount = async (workerId, password) => {
  const res = await axios.delete(`${API}/delete-account/${workerId}`, {
    data: { password },
    withCredentials: true,
  });
  return res.data;
};