/**
 * Cloudflare Worker — public front door for House Design.
 * Vercel (frontend) + Railway (backend) stay as-is; this only proxies traffic
 * so users open a *.workers.dev URL that ISPs rarely block.
 */

const FRONTEND = 'https://frontend-kappa-five-gb74q3sgly.vercel.app';
const BACKEND = 'https://housedesignbackend-production.up.railway.app';

function isBackendPath(pathname) {
  return (
    pathname.startsWith('/api') ||
    pathname.startsWith('/uploads') ||
    pathname.startsWith('/socket.io')
  );
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
          'access-control-allow-headers': '*',
          'access-control-max-age': '86400'
        }
      });
    }

    const url = new URL(request.url);
    const backend = env.BACKEND_ORIGIN || BACKEND;
    const frontend = env.FRONTEND_ORIGIN || FRONTEND;
    const origin = isBackendPath(url.pathname) ? backend : frontend;
    const target = new URL(url.pathname + url.search, origin);

    try {
      if (request.headers.get('Upgrade')?.toLowerCase() === 'websocket') {
        return fetch(target.toString(), request);
      }

      const headers = new Headers(request.headers);
      headers.delete('host');
      headers.delete('cf-connecting-ip');
      headers.delete('cf-ray');
      headers.delete('cf-visitor');
      headers.delete('cf-ipcountry');
      headers.delete('x-forwarded-proto');
      headers.delete('x-real-ip');

      const init = {
        method: request.method,
        headers,
        redirect: 'follow'
      };

      if (request.method !== 'GET' && request.method !== 'HEAD') {
        init.body = request.body;
        init.duplex = 'half';
      }

      const upstream = await fetch(target.toString(), init);
      const outHeaders = new Headers(upstream.headers);
      outHeaders.set('access-control-allow-origin', '*');
      outHeaders.delete('content-security-policy');
      outHeaders.delete('x-frame-options');

      return new Response(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: outHeaders
      });
    } catch (err) {
      return new Response(JSON.stringify({ message: 'Proxy error', error: String(err) }), {
        status: 502,
        headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }
      });
    }
  }
};
