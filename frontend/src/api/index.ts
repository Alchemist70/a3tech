import axios from 'axios';
import { getOrCreateFingerprint } from '../utils/fingerprint';
import API_BASE_URL from '../config/api';

// Create axios instance with sensible defaults and timeouts
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  },
  // Enable cross-site credentials (cookies) for authentication
  withCredentials: true,
  // reasonable request timeout
  timeout: 15000
});

// Simple exponential backoff retry for transient network/server errors
api.interceptors.response.use(undefined, async (error) => {
  const config = error?.config;
  if (!config) return Promise.reject(error);

  // Do not retry if explicitly disabled
  if (config.__noRetry) return Promise.reject(error);

  config.__retryCount = config.__retryCount || 0;
  const MAX_RETRIES = 3;

  // Retry for network errors or 5xx responses or timeouts
  const shouldRetry = !error.response || (error.response && error.response.status >= 500) || error.code === 'ECONNABORTED';
  if (shouldRetry && config.__retryCount < MAX_RETRIES) {
    config.__retryCount += 1;
    const delay = Math.min(10000, Math.pow(2, config.__retryCount) * 300 + Math.random() * 200);
    await new Promise((res) => setTimeout(res, delay));
    return api(config);
  }

  return Promise.reject(error);
});

// Attach fingerprint and auth token to all requests (reads token from localStorage)
api.interceptors.request.use((config) => {
  try {
    const fp = getOrCreateFingerprint();
    if (fp && config.headers) config.headers['x-fingerprint'] = fp;
    
    // Determine which auth token to use
    // If admin_auth_token exists, the user is an admin - use it for ALL requests
    // Otherwise use the regular auth_token for public/user routes
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_auth_token') : null;
    const publicToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const token = adminToken || publicToken;
    
    // Attach auth headers when present
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
      config.headers['x-auth-token'] = token;
    }

    // Helpful debug logging in development to trace token/header issues
    if (process.env.NODE_ENV !== 'production') {
      const tokenSummary = token ? `${token.slice(0,6)}...${token.slice(-6)}` : 'none';
      const tokenType = adminToken ? 'admin' : publicToken ? 'public' : 'none';
      // eslint-disable-next-line no-console
      console.debug('[api] request ->', config.method?.toUpperCase(), config.url, { tokenType, token: tokenSummary, fingerprint: fp });
    }
  } catch (e) {
    // ignore header attach errors
  }
  return config;
}, (err) => Promise.reject(err));

// Response logging in development to aid debugging
api.interceptors.response.use((res) => {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.debug('[api] response <-', res.config?.method?.toUpperCase(), res.config?.url, res.status, res.data);
  }
  return res;
}, (err) => {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error('[api] response error <-', err?.config?.method?.toUpperCase(), err?.config?.url, err?.response?.status, err?.response?.data || err.message);
  }
  return Promise.reject(err);
});

export default api;
