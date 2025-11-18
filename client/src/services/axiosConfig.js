import axios from 'axios';

// Determine environment
const isDev = import.meta.env.DEV;
console.log('[Axios Config] Environment:', isDev ? 'development' : 'production');

// Get base URL from environment variable (if set)
let envBaseURL = import.meta.env.VITE_API_BASE_URL;
console.log('[Axios Config] VITE_API_BASE_URL env:', envBaseURL);

// Construct base URL with intelligent fallback
let baseURL;

if (envBaseURL) {
  // Remove /api suffix if present (we add it later)
  baseURL = envBaseURL.replace('/api', '').replace(/\/$/, '');
  console.log('[Axios Config] Using env BaseURL:', baseURL);
} else {
  // Use intelligent default based on environment
  if (isDev) {
    baseURL = 'http://localhost:5000';
    console.log('[Axios Config] Using dev default:', baseURL);
  } else {
    // CRITICAL: Always use backend URL in production
    baseURL = 'https://ffsd-repo-react.onrender.com';
    console.log('[Axios Config] Using production default:', baseURL);
  }
}

// Ensure baseURL doesn't have trailing slash
baseURL = baseURL.replace(/\/$/, '');

// Safety check: if baseURL looks like frontend URL, override it
if (baseURL.includes('rentease') || baseURL.includes('vercel')) {
  console.warn('[Axios Config] ⚠️ DETECTED FRONTEND URL - OVERRIDING TO BACKEND!');
  baseURL = 'https://ffsd-repo-react.onrender.com';
}

console.log('[Axios Config] Final Base URL:', baseURL);

// Construct full API URL (with /api prefix)
const apiBaseURL = `${baseURL}/api`;
console.log('[Axios Config] API Base URL:', apiBaseURL);

// Create main axios instance with /api prefix
axios.defaults.baseURL = apiBaseURL;
axios.defaults.withCredentials = true;

// Create auth axios instance WITHOUT /api prefix (for /login, /register endpoints at root)
export const authAxios = axios.create({
  baseURL: baseURL,
  withCredentials: true
});

console.log('[Axios Config] Auth Base URL (no /api):', baseURL);

// Add interceptors for logging
const setupInterceptors = (instance, name) => {
  instance.interceptors.request.use(
    (config) => {
      const fullURL = `${config.baseURL}${config.url}`;
      console.log(`[${name}] ${config.method?.toUpperCase()} ${fullURL}`);
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
