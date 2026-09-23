import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { upgrade, health } from './lib/relay.mjs';
const root = path.resolve(fileURLToPath(new URL('./dist/', import.meta.url)));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.wasm': 'application/wasm', '.svg': 'image/svg+xml' };
export const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (['/api/health', '/api/wisp', '/api/wisp/', '/health'].includes(pathname)) return health(req, res);
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
  try {
    const name = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
    const file = path.resolve(root, '.' + name);
    if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
    const content = await readFile(file);
    res.writeHead(200, {
      'Content-Type': types[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Service-Worker-Allowed': '/',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.on('upgrade', upgrade);
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 3030);
  server.listen(port, process.env.HOST || '127.0.0.1', () => console.log(`Scramjet ready at http://localhost:${port}`));
}
