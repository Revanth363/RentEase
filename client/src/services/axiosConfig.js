import axios from 'axios';

// Set axios baseURL from environment variable
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

axios.defaults.baseURL = baseURL;
axios.defaults.withCredentials = true;

// Optional: Add request/response interceptors if needed
axios.interceptors.request.use(
  (config) => {
    console.log(`[Axios] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[Axios] Request error:', error);
    return Promise.reject(error);
  }
);

export default axios;
