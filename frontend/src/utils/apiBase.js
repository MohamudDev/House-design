/**
 * API / Socket base URL.
 * - Dev: local backend
 * - Prod with VITE_API_URL=same-origin or empty: same host (Cloudflare / Vercel rewrites)
 * - Prod with absolute URL: that URL
 */
export function getApiBaseUrl() {
  const raw = import.meta.env.VITE_API_URL;
  if (raw && raw !== 'same-origin') return String(raw).replace(/\/$/, '');
  if (import.meta.env.PROD) return '';
  return 'http://localhost:5004';
}
