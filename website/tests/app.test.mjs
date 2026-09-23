import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import WebSocket from 'ws';
import { normalizeAddress } from '../public/url.mjs';
import { server } from '../server.mjs';
let base;
before(async () => { await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); base = `http://127.0.0.1:${server.address().port}`; });
after(async () => { await new Promise(resolve => server.close(resolve)); });
test('URLs, search terms, and unsafe schemes', () => {
  assert.equal(normalizeAddress('example.com/path'), 'https://example.com/path');
  assert.equal(normalizeAddress(' hello world '), 'https://www.google.com/search?q=hello%20world');
  assert.equal(normalizeAddress('https://example.com/?a=1'), 'https://example.com/?a=1');
  assert.throws(() => normalizeAddress('javascript:alert(1)'));
  assert.throws(() => normalizeAddress('file:///etc/passwd'));
  assert.throws(() => normalizeAddress('https://user:secret@example.com'));
  assert.throws(() => normalizeAddress('   '));
});
test('serves app, service worker, WASM and health with correct headers', async () => {
  const html = await fetch(base); assert.equal(html.status, 200); assert.match(await html.text(), /Code Mode/);
  const workspace = await fetch(base + '/workspace.html'); assert.equal(workspace.status, 200); assert.match(await workspace.text(), /Your web/);
  const calculator = await fetch(base + '/calculator-engine.mjs'); assert.equal(calculator.status, 200); assert.match(calculator.headers.get('content-type'), /javascript/);
  assert.equal(html.headers.get('cross-origin-embedder-policy'), 'credentialless');
  const sw = await fetch(base + '/sw.js'); assert.match(sw.headers.get('content-type'), /javascript/); assert.equal(sw.headers.get('service-worker-allowed'), '/');
  const wasm = await fetch(base + '/scramjet/scramjet.wasm'); assert.equal(wasm.headers.get('content-type'), 'application/wasm'); assert.equal(wasm.status, 200); await wasm.arrayBuffer();
  const health = await fetch(base + '/api/health'); assert.equal((await health.json()).status, 'ok');
  assert.equal((await fetch(base + '/nonexistent')).status, 404);
});
test('Wisp handshake works for own origin', async () => {
  await new Promise((resolve, reject) => {
    const ws = new WebSocket(base.replace('http:', 'ws:') + '/api/wisp/', { origin: base });
    const timeout = setTimeout(() => { ws.terminate(); reject(new Error('Wisp handshake timeout')); }, 5000);
    ws.on('error', reject); ws.once('message', data => { try { assert.ok([3, 5].includes(data[0])); ws.close(); clearTimeout(timeout); resolve(); } catch (error) { reject(error); } });
  });
});
test('relay rejects requests from other websites', async () => {
  await new Promise((resolve, reject) => {
    const ws = new WebSocket(base.replace('http:', 'ws:') + '/api/wisp/', { origin: 'https://unrelated.example' });
    ws.on('open', () => { ws.close(); reject(new Error('Unexpected unauthorized connection')); });
    ws.on('unexpected-response', (_req, res) => { assert.equal(res.statusCode, 403); res.resume(); ws.terminate(); resolve(); });
    ws.on('error', () => {});
  });
});

for (const [host, port] of [['127.0.0.1', 80], ['192.168.1.1', 443], ['example.com', 22]]) {
  test(`relay blocks ${host}:${port}`, async () => {
    await new Promise((resolve, reject) => {
      const ws = new WebSocket(base.replace('http:', 'ws:') + '/api/wisp/', { origin: base });
      const timeout = setTimeout(() => { ws.terminate(); reject(new Error('Stream rejection timeout')); }, 5000);
      const finish = error => { clearTimeout(timeout); ws.close(); error ? reject(error) : resolve(); };
      ws.on('error', finish);
      ws.on('open', () => {
        const packet = Buffer.alloc(8 + Buffer.byteLength(host));
        packet[0] = 1; packet.writeUInt32LE(1, 1); packet[5] = 1; packet.writeUInt16LE(port, 6); packet.write(host, 8);
        ws.send(packet);
      });
      ws.on('message', packet => {
        if (packet[0] !== 4 || packet.readUInt32LE(1) !== 1) return;
        try { assert.equal(packet[5], 0x48); finish(); } catch (error) { finish(error); }
      });
    });
  });
}
