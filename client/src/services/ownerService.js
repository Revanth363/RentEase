import axios from './axiosConfig';

const BASE = "/owner";
const BOOKING_BASE = "/bookings";

export const getOwnerDashboard = async () => {
  try {
    const res = await axios.get(`${BASE}/dashboard`, {
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
    console.error("Error fetching owner dashboard:", err);
    throw err;
  }
};

export const deleteProperty = async (propertyId) => {
  const res = await axios.delete(`/property/${propertyId}`, {
    withCredentials: true,
  });
  return res.data;
};

export const getNotifications = async () => {
  const res = await axios.get(`${BASE}/notifications`, {
    withCredentials: true,
  });
  return res.data;
};

export const updateMaintenanceRequestStatus = async (payload) => {
  const res = await axios.post(`${BASE}/maintenance-request/status`, payload, {
    withCredentials: true,
  });
  return res.data;
};

export const deleteOwnerAccount = async (payload) => {
  const res = await axios.delete(`${BASE}/delete-account`, {
    data: payload,
    withCredentials: true,
  });
  return res.data;
};

export const updateOwnerSettings = async (payload) => {
  const res = await axios.post(`${BASE}/update-settings`, payload, {
    withCredentials: true,
  });
  return res.data;
};

export const approveUnrentProperty = async (payload) => {
  const res = await axios.post(`${BASE}/approve-unrent-property`, payload, {
    withCredentials: true,
  });
  return res.data;
};

export const handleNotificationAction = async (payload) => {
  // Use the booking API for notification actions
  const res = await axios.post(
    `${BOOKING_BASE}/notifications/action`,
    payload,
    {
      withCredentials: true,
    }
  );
  return res.data;
};
