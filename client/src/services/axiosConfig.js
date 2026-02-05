import axios from 'axios';

// Determine environment
const isDev = import.meta.env.DEV;

// Get base URL from environment variable (if set)
let envBaseURL = import.meta.env.VITE_API_BASE_URL;

// Construct base URL with intelligent fallback
let baseURL;

if (envBaseURL) {
  // Remove /api suffix if present (we add it once later, consistently)
  baseURL = envBaseURL.trim();
  if (baseURL.endsWith('/api')) {
    baseURL = baseURL.slice(0, -4); // Remove last 4 chars "/api"
  }
  baseURL = baseURL.replace(/\/$/, ''); // Remove trailing slash
} else {
  // Use intelligent default based on environment
  if (isDev) {
    baseURL = 'http://localhost:5000';
  } else {
    // CRITICAL: Always use backend URL in production
    baseURL = 'https://ffsd-repo-react.onrender.com';
  }
}

// Ensure baseURL doesn't have trailing slash
baseURL = baseURL.replace(/\/$/, '');

// Safety check: if baseURL looks like frontend URL, override it
if (baseURL.includes('rentease') || baseURL.includes('vercel')) {
  baseURL = 'https://ffsd-repo-react.onrender.com';
}

// Construct full API URL (with /api prefix)
const apiBaseURL = `${baseURL}/api`;

// DEBUG: Log configuration
console.log('[Axios] Environment:', { isDev, envBaseURL, baseURL, apiBaseURL });
console.log('[Axios] Using baseURL:', apiBaseURL);

// Create main axios instance with /api prefix
axios.defaults.baseURL = apiBaseURL;
axios.defaults.withCredentials = true;

// DEBUG: Log axios config
console.log('[Axios] axios.defaults.baseURL set to:', axios.defaults.baseURL);

// Create auth axios instance WITHOUT /api prefix (for /login, /register endpoints at root)
export const authAxios = axios.create({
  baseURL: baseURL,
  withCredentials: true
});

// DEBUG: Log every request
axios.interceptors.request.use(config => {
  console.log('[Axios] Request URL:', config.url, '| Full URL would be:', `${config.baseURL}${config.url}`);
  return config;
});

export default axios;
