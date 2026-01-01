// Centralized API base URL resolver
const rawBase =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  'https://a3tech.onrender.com';

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
