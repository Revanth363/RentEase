import axios from 'axios';

// Get base URL from environment (should NOT include /api - services add it)
let baseURL = import.meta.env.VITE_API_BASE_URL ? 
  import.meta.env.VITE_API_BASE_URL.replace('/api', '') : 
  null;

// If not set, try intelligent default
if (!baseURL) {
  if (import.meta.env.DEV) {
    // Development: use localhost
    baseURL = 'http://localhost:5000';
  } else {
    // Production: assume backend is same host with different port or use explicit URL
    // Use hardcoded backend URL for production
    baseURL = 'https://ffsd-repo-react.onrender.com';
  }
}

console.log('[Axios Config] Base URL:', baseURL);

// Construct full API URL (with /api)
const apiBaseURL = baseURL.startsWith('http') ? 
  `${baseURL}/api` : 
  '/api';

console.log('[Axios Config] API Base URL:', apiBaseURL);

// Create main axios instance with /api prefix
axios.defaults.baseURL = apiBaseURL;
axios.defaults.withCredentials = true;

// Create auth axios instance WITHOUT /api prefix (for /login, /register endpoints)
export const authAxios = axios.create({
  baseURL: baseURL.startsWith('http') ? baseURL : `https://ffsd-repo-react.onrender.com`,
  withCredentials: true
});

console.log('[Axios Config] Auth Base URL:', authAxios.defaults.baseURL);

// Add interceptors
const setupInterceptors = (instance, name) => {
  instance.interceptors.request.use(
    (config) => {
      console.log(`[${name}] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
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
