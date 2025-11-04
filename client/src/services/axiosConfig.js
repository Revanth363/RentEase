import axios from 'axios';

// Get base URL from environment (should NOT include /api - services add it)
const baseURL = import.meta.env.VITE_API_BASE_URL ? 
  import.meta.env.VITE_API_BASE_URL.replace('/api', '') : 
  'http://localhost:5000';

// Construct full API URL (with /api)
const apiBaseURL = baseURL.startsWith('http') ? 
  `${baseURL}/api` : 
  '/api';

// Create main axios instance with /api prefix
axios.defaults.baseURL = apiBaseURL;
axios.defaults.withCredentials = true;

// Create auth axios instance WITHOUT /api prefix (for /login, /register endpoints)
export const authAxios = axios.create({
  baseURL: baseURL,
  withCredentials: true
});

// Add interceptors
const setupInterceptors = (instance, name) => {
  instance.interceptors.request.use(
    (config) => {
      console.log(`[${name}] ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => {
      console.error(`[${name}] Request error:`, error);
      return Promise.reject(error);
    }
  );
};

setupInterceptors(axios, 'Axios');
setupInterceptors(authAxios, 'AuthAxios');

export default axios;
