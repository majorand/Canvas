import { authorizedRelayUrl, signOut } from './auth-client.mjs';
import { normalizeAddress, resolveRemoteUrl } from './url.mjs';
import { appUrl, controllerPaths, prepareWorker } from './runtime.mjs';
import { RelayTransport } from './relay-transport.mjs';
import { recordNavigation, startPresence } from './member-activity.mjs';
import { initWorkspaceWindows } from './workspace-windows.mjs';
import { createBrowserTabs } from './browser-tabs.mjs';
const $ = id => document.getElementById(id);
const address = $('address');
let controller, frame, initPromise, activeTransport, windowTools, browserTabs, currentUrl = '';
function notice(message = '') { $('notice').textContent = message; $('notice').hidden = !message; }
function paintTab(tab) {
  if(!tab || tab.closed || browserTabs.active!==tab)return;
  frame=tab.frame;currentUrl=tab.url;address.value=tab.url;
  $('open-original').href=tab.url || '#';$('open-original').hidden=!tab.url;
  $('page-state').textContent=tab.status || (tab.url?new URL(tab.url).hostname:'New tab');
  const browsing=Boolean(tab.url);
  document.body.classList.toggle('browsing',browsing);
  for(const id of ['landing','start-content','footer'])$(id).hidden=browsing;
  $('workspace').hidden=!browsing;$('navigation').hidden=!browsing;
  notice(tab.warning);
}
function tabWarning(tab,message) { if(!tab || tab.closed)return;tab.warning=message;if(browserTabs.active===tab)notice(message); }
function closeTab(tab) {
  clearTimeout(tab.timer);
  if(controller?.frames && tab.frame){const index=controller.frames.indexOf(tab.frame);if(index>=0)controller.frames.splice(index,1);}
  for(const dispose of tab.disposers || [])dispose();
}
function setConnection(online) { $('connection').textContent = online ? 'Relay connected' : 'Relay unavailable'; $('connection').className = `status ${online ? 'online' : 'offline'}`; }
async function checkRelay(refresh = false) {
  const relay = await authorizedRelayUrl(refresh);
  return new Promise((resolve, reject) => {
    let ws;
    const timer = setTimeout(() => finish(new Error('The relay did not respond. Check your internet connection and try again shortly.')), 20000);
    function finish(error) { clearTimeout(timer); if (ws) { ws.onclose = null; ws.onerror = null; ws.onmessage = null; ws.close(); } setConnection(!error); error ? reject(error) : resolve(); }
    try { ws = new WebSocket(relay); ws.binaryType = 'arraybuffer'; ws.onmessage = event => { const data = new Uint8Array(event.data); if (data[0] === 3 || data[0] === 5) finish(); else finish(new Error('The relay returned an unexpected response. Reload the workspace and try again.')); }; ws.onerror = () => finish(new Error('Cannot connect to the relay. Reload the workspace to refresh your sign-in, then try again. If this continues, your network may block WebSocket connections or the relay may be unavailable.')); ws.onclose = () => finish(new Error('The relay closed the connection. Please retry.')); }
    catch (error) { finish(error); }
  });
}
function withTimeout(promise, ms, message) { let timer; return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(message)), ms); })]).finally(() => clearTimeout(timer)); }
async function newTransport() {
  const transport = new RelayTransport({
    create: async refresh => {
      await checkRelay(refresh);
      const client = new EpoxyTransport.default({ wisp: await authorizedRelayUrl() });
      try { await withTimeout(client.init(), 20000, 'The transport could not start. Check your connection and try Reconnect.'); }
      catch (error) { client.client?.free(); throw error; }
      return client;
    },
    healthy: async client => {
      const probe = client.request(new URL('https://example.com/'), 'HEAD', null, [], undefined).then(response => {
        response.body?.cancel?.().catch(() => {}); return true;
      });
      try { return await withTimeout(probe, 6000, 'Relay check timed out.'); } catch { return false; }
    },
    onState: setConnection,
    onRecovered: () => notice('The relay connection was restored. You can continue using this page.'),
  });
  await transport.init();
  return transport;
}
async function initialize() {
  if (!window.$scramjet?.Tap || !window.$scramjetController?.Controller || !window.EpoxyTransport?.default) throw new Error('The browser could not load the workspace engine. Reload once, then try an up-to-date Chrome, Edge, or Firefox browser if it still fails.');
  const registration = await workspaceReady;
  if (!registration) return false;
  const transport = await newTransport();
  activeTransport?.close(); activeTransport = transport;
  controller = new $scramjetController.Controller({ serviceworker: registration.active, transport, config: controllerPaths() });
  await withTimeout(controller.wait(), 20000, 'Scramjet could not initialize. Reload and try again.');
  return true;
}
function attachFrame(tab) {
  const tabFrame=controller.createFrame(tab.element);tab.frame=tabFrame;tab.disposers=[];
  if(browserTabs.active===tab)frame=tabFrame;
  $scramjet.Tap.tap(tabFrame.hooks.init.post, context => {
    if(tab.closed)return;
    if (!context.isTopLevel) return;
    for(const dispose of tab.disposers)dispose();tab.disposers=[];
    const update = input => {
      const url = resolveRemoteUrl(input, context.client.url.href || tab.url);
      if (!url || tab.closed) return;
      browserTabs.update(tab,{url:url.href,title:context.window.document.title?.trim().slice(0,80) || url.hostname,status:url.hostname});
      recordNavigation(url.href);
      clearTimeout(tab.timer);paintTab(tab);
    };
    update(context.client.url.href);
    $scramjet.Tap.tap(context.client.hooks.lifecycle.navigate, (_context, props) => update(props.url));
    const refreshTitle=()=>{const title=context.window.document.title?.trim().slice(0,80) || (tab.url?new URL(tab.url).hostname:'New tab');if(!tab.closed && title!==tab.title)browserTabs.update(tab,{title});};
    context.window.document.addEventListener('DOMContentLoaded',refreshTitle,{once:true});
    if(context.window.MutationObserver && context.window.document.head){
      const observer=new context.window.MutationObserver(refreshTitle);observer.observe(context.window.document.head,{childList:true,subtree:true,characterData:true});
      tab.disposers.push(()=>observer.disconnect());
    }
    context.window.document.addEventListener('error', event => {
      if (['VIDEO', 'AUDIO'].includes(event.target?.tagName) && event.target.error) {
        tabWarning(tab,'This website could not play the media. Try Reconnect once. If it still fails, use Open original; some video formats, protected content, or site restrictions cannot work through this proxy.');
      }
    }, true);
  });
  // Match upstream CatchEscapedLinksPlugin so new-tab links retain the workspace.
  $scramjet.Tap.tap(tabFrame.hooks.fetch.intercept, (context, props) => {
    if (context.parsed.destination !== 'document') return;
    const remote = resolveRemoteUrl(context.parsed.url);
    if (!remote) return;
    const target = appUrl('workspace.html');
    target.searchParams.set('goto', remote.href);
    props.response = { body: '', status: 302, statusText: 'Found', headers: $scramjet.ScramjetHeaders.fromRawHeaders([['Location', target.href]]) };
  }, undefined, { after: ['scramjet-http-cache'] });
  $scramjet.Tap.tap(tabFrame.hooks.fetch.preresponse, (context, props) => {
    if (![403, 429].includes(props.response.status)) return;
    const url = context.parsed.url;
    const media = /(^|\.)googlevideo\.com$/.test(url.hostname);
    if (!media && context.parsed.isIframe) return;
    if (!media && !['document', 'iframe'].includes(context.parsed.destination)) return;
    const warning = props.response.status === 429
      ? 'This website is limiting requests from the relay. Wait before retrying, or use Open original.'
      : 'This website denied access through the relay. It may require sign-in or verification, or block shared server addresses. Use Open original if verification or playback will not work here.';
    clearTimeout(tab.timer);tabWarning(tab,warning);
  });
  $scramjet.Tap.tap(tabFrame.hooks.error.request, context => {
    if(tab.closed)return;
    if (['document', 'iframe'].includes(context.rawrequest.destination)) { clearTimeout(tab.timer);tab.status='Could not load this page';tabWarning(tab,'This page could not be loaded. Try Reconnect or Open original.');paintTab(tab); }
  });
  return tabFrame;
}
async function navigate(input,tab=browserTabs.active) {
  $('go').disabled = true;
  try {
    const url = normalizeAddress(input);
    if(!tab || tab.closed)return;
    tab.warning='';
    recordNavigation(url);
    browserTabs.update(tab,{url,title:new URL(url).hostname,status:'Loading '+new URL(url).hostname+'…'});paintTab(tab);
    if (!initPromise) initPromise = initialize().catch(error => { initPromise = null; throw error; });
    if (!await initPromise) return;
    if(tab.closed)return;
    history.replaceState(null, '', appUrl('workspace.html'));
    const destinationFrame=tab.frame || attachFrame(tab);paintTab(tab);
    clearTimeout(tab.timer);
    tab.timer = setTimeout(() => tabWarning(tab,'This website is taking longer than expected. You can reload it or try another address. Some websites restrict proxy access.'), 45000);
    destinationFrame.go(url);
  } catch (error) { if(tab)tabWarning(tab,error.message || 'Unable to open this website.'); }
  finally { $('go').disabled = false; }
}
$('address-form').addEventListener('submit', event => { event.preventDefault(); navigate(address.value); });
$('blank-launch').hidden = window.self !== window.top;
$('open-blank').addEventListener('click', () => {
  // Open synchronously during the click so browser popup rules can allow it.
  const tab = window.open('about:blank', '_blank');
  if (!tab) { notice('The new tab was blocked. Allow pop-ups for this site, then click Open in about:blank again.'); return; }
  try {
    const target = appUrl('workspace.html');
    if (currentUrl) target.searchParams.set('goto', currentUrl);
    const doc = tab.document;
    doc.title = document.title;
    doc.documentElement.lang = 'en';
    const favicon = doc.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/png';
    favicon.href = appUrl('scots.png').href;
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
    workspace.allow = 'fullscreen; autoplay; encrypted-media; picture-in-picture; cross-origin-isolated';
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
$('home').addEventListener('click', () => browserTabs.add());
$('back').addEventListener('click', () => frame?.back());
$('forward').addEventListener('click', () => frame?.forward());
$('reload').addEventListener('click', () => { tabWarning(browserTabs.active,'');frame?.reload(); });
$('reconnect').addEventListener('click', async () => {
  const requestedTab=browserTabs.active;
  $('reconnect').disabled = true;tabWarning(browserTabs.active,'');notice('Reconnecting…');
  try {
    if (!controller) { initPromise = null; if (currentUrl || address.value) await navigate(currentUrl || address.value); else await checkRelay(); }
    else { const next = await newTransport(); controller.setTransport(next); activeTransport?.close(); activeTransport = next;if(!requestedTab.closed)requestedTab.frame?.reload();notice('Relay reconnected. Other website tabs stay open.'); }
  } catch (error) { setConnection(false); notice(error.message || 'Could not reconnect. Try again shortly.'); }
  finally { $('reconnect').disabled = false; }
});
$('fullscreen').addEventListener('click', async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await $('workspace').requestFullscreen(); } catch { notice('Full screen is unavailable in this browser.'); } });
$('settings-open').addEventListener('click', () => $('settings').showModal());
$('sign-out').addEventListener('click', signOut);
startPresence('workspace', error => {
  activeTransport?.close();
  windowTools?.closePlayers();
  for(const tab of [...browserTabs.all]){closeTab(tab);tab.closed=true;tab.element.src='about:blank';tab.element.remove();}
  document.body.classList.add('auth-loading');
  $('auth-status').hidden = false; $('auth-status-text').textContent = error.message;
});
window.addEventListener('pagehide', () => { activeTransport?.close(); });
let refreshingWorker = false;
navigator.serviceWorker?.addEventListener('controllerchange', () => {
  if (!controller || refreshingWorker) return;
  refreshingWorker = true;
  const target = appUrl('workspace.html');
  const remote = resolveRemoteUrl(currentUrl || address.value);
  if (remote) target.searchParams.set('goto', remote.href);
  location.replace(target);
});

document.addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'l') { event.preventDefault(); address.focus(); address.select(); } });
window.addEventListener('offline', () => { setConnection(false); notice('Your browser reports that internet access is offline. Check your Wi-Fi or network connection to continue browsing.'); });
window.addEventListener('online', () => {
  const restore = activeTransport ? activeTransport.replace(true) : checkRelay();
  restore.then(() => notice('Your internet connection is back. You can continue using this page.')).catch(error => notice(error.message));
});
const initialUrl = new URL(location.href).searchParams.get('goto');
browserTabs=createBrowserTabs({document,firstElement:$('web-frame'),container:$('browser-pages'),list:$('browser-tabs'),addButton:$('new-tab'),
  onSelect:(tab,created)=>{paintTab(tab);if(tab.url && !tab.frame)navigate(tab.url,tab);else if(created)address.focus();},onClose:closeTab,onLimit:message=>notice(message)});
paintTab(browserTabs.active);
$('open-blank').disabled = true;
const workspaceReady = prepareWorker(() => address.value || initialUrl).then(registration => {
  if (registration) $('open-blank').disabled = false;
  return registration;
});
workspaceReady.then(registration => {
  if (!registration) return;
  if (initialUrl) navigate(initialUrl); else checkRelay().catch(error => notice(error.message));
}).catch(error => { setConnection(false); notice(error.message); });
windowTools = initWorkspaceWindows({currentUrl:()=>currentUrl});
