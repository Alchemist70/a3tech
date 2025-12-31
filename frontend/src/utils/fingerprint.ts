// Manage a per-device fingerprint stored in localStorage.
export function getOrCreateFingerprint(): string | null {
  if (typeof window === 'undefined') return null;
  const key = 'alchemist_fp_v1';
  try {
    let fp = localStorage.getItem(key);
    if (fp) return fp;
    let id = null;
    if (window.crypto && typeof (window.crypto as any).randomUUID === 'function') {
      id = (window.crypto as any).randomUUID();
    } else if (window.crypto && window.crypto.getRandomValues) {
      // fallback to random hex
      const arr = new Uint8Array(16);
      window.crypto.getRandomValues(arr);
      id = Array.from(arr).map(b => ('00' + b.toString(16)).slice(-2)).join('');
    } else {
      id = 'fp-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    }
    localStorage.setItem(key, id);
    return id;
  } catch (e) {
    try { return localStorage.getItem(key); } catch (e2) { return null; }
  }
}

export function ensureFingerprint() {
  getOrCreateFingerprint();
}
