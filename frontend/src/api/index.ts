import axios from 'axios';
import { getOrCreateFingerprint } from '../utils/fingerprint';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  // If REACT_APP_API_URL is set (e.g. https://your-backend.vercel.app), use it;
  // otherwise default to relative /api (works in local dev with proxy).
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach fingerprint and auth token to all requests (reads token from localStorage)
api.interceptors.request.use((config) => {
  try {
    const fp = getOrCreateFingerprint();
    if (fp && config.headers) config.headers['x-fingerprint'] = fp;
  // Use admin token for admin routes (admin UI and gold-members), otherwise use public auth token
  const urlPath = config.url || '';
  const isAdminRoute = /^(\/admin|\/gold-members)/.test(urlPath);
    const token = typeof window !== 'undefined' 
      ? (isAdminRoute 
          ? localStorage.getItem('admin_auth_token')
          : localStorage.getItem('auth_token'))
      : null;
    
    // Attach auth headers when present
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
      config.headers['x-auth-token'] = token;
    }

    // Helpful debug logging in development to trace token/header issues
    if (process.env.NODE_ENV !== 'production') {
      const tokenSummary = token ? `${token.slice(0,6)}...${token.slice(-6)}` : 'none';
      // eslint-disable-next-line no-console
      console.debug('[api] request ->', config.method?.toUpperCase(), config.url, { isAdminRoute, token: tokenSummary, fingerprint: fp });
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
