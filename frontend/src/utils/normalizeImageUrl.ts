import API_BASE_URL from '../config/api';

// API_BASE_URL ends with /api — derive origin
const API_ORIGIN = API_BASE_URL.replace(/\/api$/, '');

export default function normalizeImageUrl(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  try {
    const s = String(raw).trim();

    // Keep data:, blob:, and protocol-relative URLs as-is
    if (s.startsWith('data:') || s.startsWith('blob:') || s.startsWith('//')) return s;

    // Relative uploads path -> prefix backend origin
    if (s.startsWith('/uploads/') || s.startsWith('uploads/')) {
      const path = s.startsWith('/') ? s : `/${s}`;
      return `${API_ORIGIN}${path}`;
    }

    // If the URL explicitly points to localhost/127.0.0.1 (likely from local uploads),
    // rewrite to backend origin preserving path/query/hash so deployed frontend can load it.
    let url: URL;
    try {
      url = new URL(s);
    } catch (_) {
      // If parsing fails, return as-is
      return s;
    }

    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      return `${API_ORIGIN}${url.pathname}${url.search}${url.hash}`;
    }

    return s;
  } catch (e) {
    return raw as any;
  }
}
