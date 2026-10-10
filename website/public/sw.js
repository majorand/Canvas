importScripts('./controller/controller.sw.js');
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
let waking;
async function restoreProxyRoute(event) {
  if (!waking) {
    waking = (async () => {
      for (const client of await self.clients.matchAll({ type: 'window' })) client.postMessage({ $controller$swrevive: {} });
      await new Promise(resolve => setTimeout(resolve, 100));
    })().finally(() => { waking = null; });
  }
  await waking;
  for (let attempt = 0; attempt < 80; attempt++) {
    if ($scramjetController.shouldRoute(event)) return $scramjetController.route(event);
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  return new Response('The workspace connection restarted. Reload the workspace to reconnect.', { status: 503, headers: { 'Content-Type': 'text/plain', 'Retry-After': '1' } });
}
self.addEventListener('fetch', event => {
  if ($scramjetController.shouldRoute(event)) {
    event.respondWith($scramjetController.route(event));
    return;
  }
  const url = new URL(event.request.url);
  if (!url.href.startsWith(self.registration.scope)) return;
  // A worker can be stopped while idle. Its controller map is in memory, and
  // the upstream revival message arrives after the first fetch. Wait for it
  // instead of leaking a rewritten URL to the static host as a missing file.
  if (url.pathname.startsWith(new URL('~/sj/', self.registration.scope).pathname)) {
    event.respondWith(restoreProxyRoute(event));
    return;
  }
  event.respondWith((async () => {
    const response = await fetch(event.request, { cache: 'no-cache' });
    if (response.status === 0) return response;
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'no-store');
    headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  })());
});
