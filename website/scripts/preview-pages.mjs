// Local Pages-style preview: subdirectory hosting without custom HTTP headers.
// The local relay is only for testing; the real Pages site uses the configured remote relay.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { upgrade } from '../lib/relay.mjs';
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const prefix = '/Canvas/';
const types = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === prefix.slice(0,-1)) { res.writeHead(301, { Location: prefix }); res.end(); return; }
  if (!url.pathname.startsWith(prefix) || !['GET', 'HEAD'].includes(req.method)) { res.writeHead(404); res.end(); return; }
  try {
    const name = decodeURIComponent(url.pathname.slice(prefix.length) || 'index.html');
    const file = path.resolve(root, name);
    if (!file.startsWith(path.resolve(root) + path.sep)) { res.writeHead(403); res.end(); return; }
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.on('upgrade', upgrade);
const port = Number(process.env.PORT || 3031);
server.listen(port, '127.0.0.1', () => console.log('Pages-style preview: http://localhost:' + port + prefix));
