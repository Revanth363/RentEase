import axios from "axios";

const BASE = "/api/tenant";

export const getDashboard = async () => {
  try {
    const res = await axios.get(`${BASE}/dashboard-data`, {
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
    console.error("Error fetching tenant dashboard:", err);
    throw err;
  }
};

export const submitMaintenance = async (payload) => {
  const res = await axios.post(`${BASE}/maintenance`, payload, {
    withCredentials: true,
  });
  return res.data;
};

export const submitComplaint = async (payload) => {
  const res = await axios.post(`${BASE}/complaint`, payload, {
    withCredentials: true,
  });
  return res.data;
};

export const submitReview = async (payload) => {
  const res = await axios.post(`${BASE}/review`, payload, {
    withCredentials: true,
  });
  return res.data;
};

export const updateProfile = async (payload) => {
  const res = await axios.post(`${BASE}/profile`, payload, {
    withCredentials: true,
  });
  return res.data;
};

export const changePassword = async (payload) => {
  const res = await axios.post(`${BASE}/password`, payload, {
    withCredentials: true,
  });
  return res.data;
};

export const updateNotificationPrefs = async (payload) => {
  const res = await axios.post(`${BASE}/notifications`, payload, {
    withCredentials: true,
  });
  return res.data;
};

export const toggleSavedProperty = async (propertyId, action = "remove") => {
  const res = await axios.post(
    `${BASE}/saved-property`,
    { propertyId, action },
    { withCredentials: true }
  );
  return res.data;
};

export const markNotificationRead = async (notificationId) => {
  const res = await axios.post(
    `${BASE}/notification/read`,
    { notificationId },
    { withCredentials: true }
  );
  return res.data;
};

export const checkRecentPayment = async () => {
  const res = await axios.post(
    `${BASE}/check-recent-payment`,
    {},
    { withCredentials: true }
  );
  return res.data;
};

export const submitPayment = async (payload) => {
  const res = await axios.post(`${BASE}/payment`, payload, {
    withCredentials: true,
  });
  return res.data;
};

export const submitWorkerPayment = async (payload) => {
  const res = await axios.post(`${BASE}/worker-payment`, payload, {
    withCredentials: true,
  });
  return res.data;
};

export const requestUnrent = async (reason) => {
  const res = await axios.post(
    `${BASE}/unrent-property`,
    { reason },
    { withCredentials: true }
  );
  return res.data;
};

export const checkAccountStatus = async () => {
  try {
    const res = await axios.post(
      `${BASE}/check-account-status`,
      {},
      { withCredentials: true }
    );
    return res.data;
  } catch (err) {
    // Return the error response data if it exists
    if (err.response && err.response.data) {
      return err.response.data;
    }
    throw err;
  }
};

export const deleteAccount = async (password) => {
  try {
    const res = await axios.post(
      `${BASE}/delete-account`,
      { password },
      { withCredentials: true }
    );
    return res.data;
  } catch (err) {
    // Return the error response data if it exists
    if (err.response && err.response.data) {
      return err.response.data;
    }
    throw err;
  }
};

export const getWorkHistory = async (workerId) => {
  const res = await axios.get(`${BASE}/work-tracking/history/${workerId}`, {
    withCredentials: true,
  });
  return res.data;
};

export const sendWorkOTPToTenant = async (workerId, workDate) => {
  const res = await axios.post(
    `${BASE}/work-tracking/send-otp`,
    { workerId, workDate },
    { withCredentials: true }
  );
  return res.data;
};
