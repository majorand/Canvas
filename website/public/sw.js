importScripts('./controller/controller.sw.js');
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  if ($scramjetController.shouldRoute(event)) {
    event.respondWith($scramjetController.route(event));
    return;
  }
  const url = new URL(event.request.url);
  if (!url.href.startsWith(self.registration.scope)) return;
  event.respondWith((async () => {
    const response = await fetch(event.request);
    if (response.status === 0) return response;
    const headers = new Headers(response.headers);
    headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  })());
});
