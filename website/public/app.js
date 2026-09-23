import { normalizeAddress } from './url.mjs';
const $ = id => document.getElementById(id);
const address = $('address');
let controller, frame, initPromise, loadTimer, currentUrl = '';
function storedRelay() { try { return localStorage.getItem('scramjet-relay') || ''; } catch { return ''; } }
function relayUrl() { return storedRelay() || window.SCRAMJET_CONFIG?.wisp || `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/api/wisp/`; }
function notice(message = '') { $('notice').textContent = message; $('notice').hidden = !message; }
function setConnection(online) { $('connection').textContent = online ? 'Relay connected' : 'Relay unavailable'; $('connection').className = `status ${online ? 'online' : 'offline'}`; }
function checkRelay() {
  return new Promise((resolve, reject) => {
    let ws;
    const timer = setTimeout(() => finish(new Error('The relay did not respond. Try again shortly, or choose another relay in Settings.')), 20000);
    function finish(error) { clearTimeout(timer); if (ws) { ws.onclose = null; ws.onerror = null; ws.onmessage = null; ws.close(); } setConnection(!error); error ? reject(error) : resolve(); }
    try { ws = new WebSocket(relayUrl()); ws.binaryType = 'arraybuffer'; ws.onmessage = event => { const data = new Uint8Array(event.data); if (data[0] === 3 || data[0] === 5) finish(); else finish(new Error('This endpoint is not a Wisp relay. Check Settings.')); }; ws.onerror = () => finish(new Error('Cannot connect to the relay. Check your connection or the relay URL in Settings.')); ws.onclose = () => finish(new Error('The relay closed the connection. Please retry.')); }
    catch (error) { finish(error); }
  });
}
function withTimeout(promise, ms, message) { let timer; return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(message)), ms); })]).finally(() => clearTimeout(timer)); }
async function initialize() {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) throw new Error('This browser needs HTTPS (or localhost) and service-worker support to run Scramjet.');
  await checkRelay();
  await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
  const registration = await withTimeout(navigator.serviceWorker.ready, 15000, 'The browser could not start the service worker. Reload and try again.');
  if (!navigator.serviceWorker.controller) await withTimeout(new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true })), 15000, 'The service worker is not controlling this page. Reload and try again.');
  const transport = new LibcurlTransport.LibcurlClient({ wisp: relayUrl() });
  await withTimeout(transport.init(), 20000, 'The transport could not start. Reload and try again.');
  controller = new $scramjetController.Controller({ serviceworker: registration.active, transport });
  await withTimeout(controller.wait(), 20000, 'Scramjet could not initialize. Reload and try again.');
  frame = controller.createFrame($('web-frame'));
  $scramjet.Tap.tap(frame.hooks.init.post, context => {
    if (!context.isTopLevel) return;
    const update = url => { currentUrl = url; address.value = url; $('page-state').textContent = new URL(url).hostname; clearTimeout(loadTimer); notice(); };
    update(context.client.url.href);
    $scramjet.Tap.tap(context.client.hooks.lifecycle.navigate, (_context, props) => update(props.url));
  });
  $scramjet.Tap.tap(frame.hooks.error.request, context => {
    if (['document', 'iframe'].includes(context.rawrequest.destination)) { clearTimeout(loadTimer); $('page-state').textContent = 'Could not load this page'; notice('This page could not be loaded. Try reloading, a different website, or check the relay in Settings.'); }
  });
}
async function navigate(input) {
  $('go').disabled = true;
  notice();
  try {
    const url = normalizeAddress(input);
    if (!initPromise) initPromise = initialize().catch(error => { initPromise = null; throw error; });
    await initPromise;
    currentUrl = url; address.value = url;
    document.body.classList.add('browsing');
    for (const id of ['landing', 'start-content', 'footer']) $(id).hidden = true;
    $('workspace').hidden = false; $('navigation').hidden = false;
    $('page-state').textContent = 'Loading ' + new URL(url).hostname + '…';
    clearTimeout(loadTimer);
    loadTimer = setTimeout(() => notice('This website is taking longer than expected. You can reload it or try another address. Some websites restrict proxy access.'), 45000);
    frame.go(url);
  } catch (error) { notice(error.message || 'Unable to open this website.'); }
  finally { $('go').disabled = false; }
}
$('address-form').addEventListener('submit', event => { event.preventDefault(); navigate(address.value); });
$('blank-launch').hidden = window.self !== window.top;
$('open-blank').addEventListener('click', () => {
  // Open synchronously during the click so browser popup rules can allow it.
  const tab = window.open('about:blank', '_blank');
  if (!tab) { notice('The new tab was blocked. Allow pop-ups for this site, then click Open in about:blank again.'); return; }
  try {
    const target = new URL('/', location.origin);
    if (currentUrl) target.searchParams.set('goto', currentUrl);
    const doc = tab.document;
    doc.title = document.title;
    doc.documentElement.lang = 'en';
    const favicon = doc.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/png';
    favicon.href = new URL('/scots.png', location.origin).href;
    doc.head.append(favicon);
    const viewport = doc.createElement('meta');
    viewport.name = 'viewport';
    viewport.content = 'width=device-width, initial-scale=1';
    doc.head.append(viewport);
    const style = doc.createElement('style');
    style.textContent = 'html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#111612}iframe{display:block;border:0;width:100%;height:100%}';
    doc.head.append(style);
    const workspace = doc.createElement('iframe');
    workspace.title = 'Scramjet workspace';
    workspace.allow = 'fullscreen; autoplay; cross-origin-isolated';
    workspace.referrerPolicy = 'no-referrer';
    workspace.addEventListener('load', () => {
      try {
        if (workspace.contentDocument?.getElementById('address-form')) {
          notice('Scramjet loaded in the new about:blank tab. The original tab stays open.');
        } else {
          notice('The new tab opened, but its workspace did not load. You can continue browsing here.');
        }
      } catch { notice('The new tab opened. Check it to continue browsing.'); }
    }, { once: true });
    workspace.src = target.href;
    doc.body.replaceChildren(workspace);
    // Detach the opener without claiming protection from browser extensions.
    tab.opener = null;
    tab.focus();
    notice('Opening Scramjet in a new about:blank tab…');
    setTimeout(() => {
      if (tab.closed) notice('The new tab was closed or blocked by your browser. Try this feature in a regular browser with pop-ups allowed for this site.');
    }, 1000);
  } catch {
    tab.close();
    notice('This browser could not open the about:blank workspace. You can continue browsing in this tab.');
  }
});
document.querySelectorAll('[data-url]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.url)));
$('home').addEventListener('click', () => location.assign('/'));
$('back').addEventListener('click', () => frame?.back());
$('forward').addEventListener('click', () => frame?.forward());
$('reload').addEventListener('click', () => { notice(); frame?.reload(); });
$('fullscreen').addEventListener('click', async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await $('workspace').requestFullscreen(); } catch { notice('Full screen is unavailable in this browser.'); } });
$('settings-open').addEventListener('click', () => { $('relay').value = storedRelay(); $('settings-result').textContent = ''; $('settings').showModal(); });
$('reset-relay').addEventListener('click', () => { $('relay').value = ''; });
$('settings-form').addEventListener('submit', event => {
  event.preventDefault();
  try {
    const value = $('relay').value.trim();
    if (value) { const url = new URL(value); if (!['ws:', 'wss:'].includes(url.protocol) || url.username || url.password) throw new Error('Enter a valid ws:// or wss:// URL without embedded credentials.'); if (location.protocol === 'https:' && url.protocol !== 'wss:') throw new Error('An HTTPS website requires a secure wss:// relay.'); }
    if (value) localStorage.setItem('scramjet-relay', value); else localStorage.removeItem('scramjet-relay');
    location.reload();
  } catch (error) { $('settings-result').textContent = error.message; }
});
document.addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'l') { event.preventDefault(); address.focus(); address.select(); } });
window.addEventListener('offline', () => { setConnection(false); notice('You are offline. Reconnect to continue browsing.'); });
window.addEventListener('online', () => checkRelay().then(() => notice()).catch(error => notice(error.message)));
const initialUrl = new URL(location.href).searchParams.get('goto');
if (initialUrl) { history.replaceState(null, '', '/'); navigate(initialUrl); } else checkRelay().catch(error => notice(error.message));
