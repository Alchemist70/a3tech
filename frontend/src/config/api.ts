// Centralized API base URL resolver
// In development prefer the CRA proxy (relative `/api`) so the frontend talks
// to the local backend at http://localhost:5000 unless an explicit API base
// is provided via env vars. In production, fall back to the configured URL.
const rawBase =
  // explicit overrides from env take precedence
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  // If running in development and no explicit base is set, use relative API
  // root to pick up `proxy` from package.json (CRA dev server proxy).
  (process.env.NODE_ENV === 'development' ? '/api' : 'https://a3tech.onrender.com');

// Ensure the returned base URL points to the API root (include /api)
function normalizeApiBase(url: string) {
  if (!url) return '/api';
  // Remove trailing slash
  let u = String(url).trim();
  if (u.endsWith('/')) u = u.slice(0, -1);
  // If the URL already ends with /api, return as-is
  if (u.endsWith('/api')) return u;
  // Otherwise append /api
  return `${u}/api`;
}

export const API_BASE_URL = normalizeApiBase(rawBase);

export default API_BASE_URL;
