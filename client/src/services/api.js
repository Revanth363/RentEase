import axios from 'axios';

const API_URL = '/api';

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