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