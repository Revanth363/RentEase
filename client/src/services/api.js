import axios from './axiosConfig';

const API_URL = '';
export { API_URL };

export const fetchProperties = async () => {
  try {
    const response = await axios.get(`${API_URL}/properties`, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Error fetching properties:', error);
    return [];
  }
};

export const fetchSliderProperties = async () => {
  try {
    const response = await axios.get(`${API_URL}/slider-properties`, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Error fetching slider properties:', error);
    return [];
  }
};

export const checkSession = async () => {
  try {
    const response = await axios.get(`${API_URL}/check-session`, { withCredentials: true });
    return response.data.user;
  } catch (error) {
    console.error('Error checking session:', error);
    return null;
  }
};

export const logout = async () => {
  try {
    const response = await axios.get(`${API_URL}/logout`, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

// Admin-related functions
export const fetchAdminDashboard = async (filter = 'monthly') => {
  try {
    const response = await axios.get(`${API_URL}/admin?filter=${filter}`, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    throw error;
  }
};

export const fetchAdminProperties = async () => {
  try {
    const response = await axios.get(`${API_URL}/admin`, { withCredentials: true });
    return response.data.properties || [];
  } catch (error) {
    console.error('Error fetching admin properties:', error);
    return [];
  }
};

export const fetchAdminUsers = async (queryString = '') => {
  try {
    const response = await axios.get(`${API_URL}/admin/users${queryString}`, {
      withCredentials: true
    });
    return response.data; // → { users: [...], total: 123 }
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return { users: [], total: 0 };
  }
};

export const fetchAdminBookings = async () => {
  try {
    const response = await axios.get(`${API_URL}/admin`, { withCredentials: true });
    return response.data.bookings || [];
  } catch (error) {
    console.error('Error fetching admin bookings:', error);
    return [];
  }
};

export const fetchAdminPayments = async () => {
  try {
    const response = await axios.get(`${API_URL}/admin/payments`, { withCredentials: true });
    return response.data.payments || [];
  } catch (error) {
    console.error('Error fetching admin payments:', error);
    return [];
  }
};

export const fetchAdminWorkerPayments = async () => {
  try {
    const response = await axios.get(`${API_URL}/admin/worker-payments`, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Error fetching admin worker payments:', error);
    return {};
  }
};

export const fetchAdminNotifications = async () => {
  try {
    const response = await axios.get(`${API_URL}/admin/notifications`, { withCredentials: true });
    return response.data.notifications || [];
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    return [];
  }
};

export const fetchAdminMaintenanceRequests = async () => {
  try {
    const response = await axios.get(`${API_URL}/admin/maintenance-requests`, { withCredentials: true });
    return response.data.maintenanceRequests || [];
  } catch (error) {
    console.error('Error fetching admin maintenance requests:', error);
    return [];
  }
};

export const fetchAdminMessages = async () => {
  try {
    const response = await axios.get(`${API_URL}/admin/messages`, { withCredentials: true });
    return response.data.contactSubmissions || [];
  } catch (error) {
    console.error('Error fetching admin messages:', error);
    return [];
  }
};

export const fetchAdminMessageDetails = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/admin/message/${id}`, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Error fetching admin message details:', error);
    throw error;
  }
};

export const deleteProperty = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/admin/property/delete/${id}`, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Error deleting property:', error);
    throw error;
  }
};

export const toggleVerify = async (id, isVerified) => {
  try {
    const response = await axios.post(
      `${API_URL}/admin/property/verify/${id}`,
      { isVerified },
      { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    console.error('Error toggling property verification:', error);
    throw error;
  }
};

export const deleteUser = async (id, userType) => {
  try {
    const response = await axios.delete(`${API_URL}/admin/user/delete/${id}/${userType}`, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

export const suspendUser = async (id, userType, status) => {
  try {
    const response = await axios.post(
      `${API_URL}/admin/user/status/${id}/${userType}`,
      { status },
      { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    console.error('Error suspending user:', error);
    throw error;
  }
};

export const approveBooking = async (id) => {
  try {
    const response = await axios.post(
      `${API_URL}/admin/booking/approve/${id}`,
      {},
      { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    console.error('Error approving booking:', error);
    throw error;
  }
};

export const rejectBooking = async (id) => {
  try {
    const response = await axios.post(
      `${API_URL}/admin/booking/reject/${id}`,
      {},
      { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    console.error('Error rejecting booking:', error);
    throw error;
  }
};

export const refundPayment = async (id) => {
  try {
    const response = await axios.post(
      `${API_URL}/admin/payment/${id}/refund`,
      {},
      { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    console.error('Error refunding payment:', error);
    throw error;
  }
};

export const retryPayment = async (id) => {
  try {
    const response = await axios.post(
      `${API_URL}/admin/payment/${id}/retry`,
      {},
      { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    console.error('Error retrying payment:', error);
    throw error;
  }
};

export const completeTask = async (id) => {
  try {
    const response = await axios.post(
      `${API_URL}/admin/notification/${id}/complete`,
      {},
      { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    console.error('Error completing task:', error);
    throw error;
  }
};

export const completeMaintenance = async (id) => {
  try {
    const response = await axios.post(
      `${API_URL}/admin/maintenance/${id}/complete`,
      {},
      { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    console.error('Error completing maintenance:', error);
    throw error;
  }
};

export const fetchBookingDetails = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/admin/booking/${id}`, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Error fetching booking details:', error);
    throw error;
  }
};

export const fetchWorkerBookingDetails = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/admin/worker-booking/${id}`, { 
      withCredentials: true 
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching worker booking details:', error);
    throw error;
  }
};

export const fetchPropertyDetails = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/admin/property/${id}`, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Error fetching property details:', error);
    throw error;
  }
};

// ==================== WORKER API FUNCTIONS ====================

// Fetch all workers with optional filters
export const fetchWorkers = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const queryString = params.toString();
    const url = queryString ? `${API_URL}/workers?${queryString}` : `${API_URL}/workers`;
    const response = await axios.get(url, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Error fetching workers:', error);
    return [];
  }
};

// Fetch worker filter options (locations, areas, service types)
export const fetchWorkerFilters = async () => {
  try {
    const response = await axios.get(`${API_URL}/workers/filters`, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Error fetching worker filters:', error);
    return { locations: [], areas: [], serviceTypes: [] };
  }
};

// Fetch a single worker by ID
export const fetchWorkerById = async (workerId) => {
  try {
    const response = await axios.get(`${API_URL}/workers/${workerId}`, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Error fetching worker:', error);
    return null;
  }
};

// Filter workers with advanced criteria
export const filterWorkers = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const queryString = params.toString();
    const url = queryString ? `${API_URL}/workers/filter?${queryString}` : `${API_URL}/workers/filter`;
    const response = await axios.get(url, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Error filtering workers:', error);
    return [];
  }
};

// Book a worker
export const bookWorker = async (workerId, serviceType) => {
  try {
    const response = await axios.post(
      `${API_URL}/workers/${workerId}/book`,
      { serviceType },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error('Error booking worker:', error);
    throw error;
  }
};

// Debook a worker
export const debookWorker = async (workerId) => {
  try {
    const response = await axios.post(
      `${API_URL}/workers/debook/${workerId}`,
      {},
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error('Error debooking worker:', error);
    throw error;
  }
};


// Add this to your api.js file
export const fetchAdminWorkerBookings = async (queryString = '') => {
  try {
    const response = await axios.get(`${API_URL}/admin/worker-bookings${queryString}`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching worker bookings:', error);
    return { bookings: [], total: 0 };
  }
};


export const approveWorkerBooking = async (id) => {
  try {
    const response = await axios.post(
      `${API_URL}/admin/worker-booking/approve/${id}`,
      {},
      { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    console.error('Error approving worker booking:', error);
    throw error;
  }
};

export const declineWorkerBooking = async (id) => {
  try {
    const response = await axios.post(
      `${API_URL}/admin/worker-booking/decline/${id}`,
      {},
      { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    console.error('Error declining worker booking:', error);
    throw error;
  }
};