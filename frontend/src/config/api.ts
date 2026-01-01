// Centralized API base URL resolver
export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  'https://a3tech.onrender.com';

export default API_BASE_URL;
