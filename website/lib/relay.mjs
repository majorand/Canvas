import { authorizeRelay } from './access.mjs';
import { server as wisp, logging } from '@mercuryworkshop/wisp-js/server';
logging.set_level(logging.ERROR);
Object.assign(wisp.options, {
  allow_private_ips: false,
  allow_loopback_ips: false,
  allow_udp_streams: false,
  port_whitelist: [80, 443],
  // wisp-js 0.5.0 has a broken per-host iterator; use its total stream limit.
  stream_limit_total: 128,
  dns_result_order: 'ipv4first',
});

export function allowedOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return false;
  try {
    const url = new URL(origin);
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    // The GitHub Pages frontend shares this deployment's Vercel relay.
    const extra = ['https://majorand.github.io', ...(process.env.ALLOWED_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean)];
    return (['http:', 'https:'].includes(url.protocol) && url.host === host) || extra.includes(url.origin);
  } catch { return false; }
}

export function createUpgrade(authorize = authorizeRelay) {
  return async function upgrade(req, socket, head) {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (!['/api/wisp', '/api/wisp/', '/wisp/'].includes(pathname)) {
      socket.end('HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n'); return;
    }
    if (!allowedOrigin(req)) {
      socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'); return;
    }
    let session;
    const waiting = setTimeout(() => socket.destroy(), 20000);
    try { session = await authorize(req); }
    catch (error) {
      clearTimeout(waiting);
      const status = error.status === 401 || error.status === 403 ? 401 : 503;
      socket.end('HTTP/1.1 ' + status + (status === 401 ? ' Unauthorized' : ' Service Unavailable') + '\r\nConnection: close\r\n\r\n'); return;
    }
    clearTimeout(waiting);
    if (socket.destroyed) return;
    const expires = setTimeout(() => socket.destroy(), Math.max(1, new Date(session.expiresAt).getTime() - Date.now()));
    const recheck = setInterval(() => session.revalidate().catch(() => socket.destroy()), 30000);
    socket.once('close', () => { clearInterval(recheck); clearTimeout(expires); });
    // Strip the relay-only credential before passing the request to Wisp.
    req.url = '/wisp/';
    wisp.routeRequest(req, socket, head);
  };
}
export const upgrade = createUpgrade();

export function health(_req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify({ status: 'ok', service: 'scramjet-relay', protocol: 'wisp', ports: [80, 443] }));
}
