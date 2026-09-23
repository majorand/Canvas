import { AccessError, bearer, getAccessService } from '../lib/access.mjs';
import { allowedOrigin } from '../lib/relay.mjs';

export function createAccessHandler(getService = getAccessService) {
  return async function access(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Vary', 'Origin');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const origin = req.headers.origin;
    if (origin && !allowedOrigin(req)) { res.writeHead(403); res.end(JSON.stringify({ error: 'Origin not allowed.' })); return; }
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    if (req.method !== 'POST') { res.writeHead(405); res.end(JSON.stringify({ error: 'Use POST.' })); return; }
    try {
      if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) throw new AccessError(415, 'Use JSON.');
      let body = req.body;
      if (!body) {
        let raw = '';
        for await (const chunk of req) {
          raw += chunk;
          if (Buffer.byteLength(raw) > 16384) throw new AccessError(413, 'Request is too large.');
        }
        try { body = JSON.parse(raw); } catch { throw new AccessError(400, 'Invalid JSON.'); }
      } else if (typeof body === 'string') {
        if (Buffer.byteLength(body) > 16384) throw new AccessError(413, 'Request is too large.');
        try { body = JSON.parse(body); } catch { throw new AccessError(400, 'Invalid JSON.'); }
      }
      if (body && Buffer.byteLength(JSON.stringify(body)) > 16384) throw new AccessError(413, 'Request is too large.');
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new AccessError(400, 'Invalid request.');
      const ip = process.env.VERCEL ? String(req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim() : req.socket?.remoteAddress || 'local';
      const result = await getService().dispatch(body.action, body, bearer(req), ip);
      res.writeHead(200); res.end(JSON.stringify(result));
    } catch (error) {
      const status = error instanceof AccessError ? error.status : 503;
      res.writeHead(status);
      res.end(JSON.stringify({ error: error instanceof AccessError ? error.message : 'The account service is unavailable. Please try again later.' }));
    }
  };
}
export default createAccessHandler();
