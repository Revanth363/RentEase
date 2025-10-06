import axios from 'axios';

// Get base URL from environment (should NOT include /api - services add it)
const baseURL = import.meta.env.VITE_API_BASE_URL ? 
  import.meta.env.VITE_API_BASE_URL.replace('/api', '') : 
  'http://localhost:5000';

// Construct full API URL
const apiBaseURL = baseURL.startsWith('http') ? 
  `${baseURL}/api` : 
  '/api';

axios.defaults.baseURL = apiBaseURL;
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
