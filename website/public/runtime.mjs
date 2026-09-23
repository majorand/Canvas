// Resolve against this module so root and /Repository/ hosting use the same build.
export const appUrl = (file, moduleUrl = import.meta.url) => new URL(file, moduleUrl);
export function controllerPaths(moduleUrl = import.meta.url) {
  return Object.fromEntries(Object.entries({
    prefix: '~/sj/',
    scramjetPath: 'scramjet/scramjet.js',
    injectPath: 'controller/controller.inject.js',
    wasmPath: 'scramjet/scramjet.wasm',
  }).map(([key, file]) => [key, appUrl(file, moduleUrl).pathname]));
}
export async function prepareWorker(pendingAddress) {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) throw new Error('This browser needs HTTPS (or localhost) and service-worker support to run Scramjet.');
  let timeout;
  try {
    const registration = await Promise.race([
      (async () => {
        await navigator.serviceWorker.register(appUrl('sw.js'), { scope: appUrl('./').pathname, updateViaCache: 'none' });
        const ready = await navigator.serviceWorker.ready;
        if (!navigator.serviceWorker.controller) await new Promise(resolve => {
          navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
        });
        return ready;
      })(),
      new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('The browser could not start the service worker. Reload and try again.')), 20000); }),
    ]);
    // Pages cannot set HTTP headers. The worker supplies them on the reload.
    const url = new URL(location.href);
    if (!window.crossOriginIsolated) {
      if (url.searchParams.has('isolation-retry')) throw new Error('This browser could not enable the workspace. Open this page in a regular tab in an up-to-date browser and try again.');
      url.searchParams.set('isolation-retry', '1');
      const target = pendingAddress?.();
      if (target) url.searchParams.set('goto', target);
      location.replace(url);
      return null;
    }
    if (url.searchParams.has('isolation-retry')) {
      url.searchParams.delete('isolation-retry');
      history.replaceState(null, '', url);
    }
    return registration;
  } finally { clearTimeout(timeout); }
}
