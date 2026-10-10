import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { normalizeAddress, resolveRemoteUrl } from '../public/url.mjs';
import { appUrl, controllerPaths } from '../public/runtime.mjs';
import { RelayTransport } from '../public/relay-transport.mjs';

const [appSource, coreSource] = await Promise.all([
  readFile(new URL('../public/app.js', import.meta.url), 'utf8'),
  readFile(new URL('../node_modules/@mercuryworkshop/scramjet/dist/scramjet.js', import.meta.url), 'utf8'),
]);

// Execute the actual application hooks with the pinned core's Tap implementation.
// Browser rendering and network I/O remain isolated deterministic fixtures.
async function workspaceFixture(t) {
  const elements = new Map();
  const timers = new Set();
  const windowListeners = new Map();
  const controllers = [];
  const transports = [];
  let transportFailure;
  const element = id => {
    if (!elements.has(id)) elements.set(id, {
      id, hidden: true, value: '', textContent: '', listeners: new Map(),
      addEventListener(name, callback) { this.listeners.set(name, callback); },
      focus() {}, select() {},
    });
    return elements.get(id);
  };
  const browserDocument = {
    getElementById: element,
    querySelectorAll: () => [],
    addEventListener() {},
    body: { classList: { add() {} } },
  };
  class ProbeSocket {
    constructor() {
      queueMicrotask(() => this.onmessage?.({ data: new Uint8Array([3]).buffer }));
    }
    close() {}
  }
  class Transport {
    constructor(options) { this.options = options; transports.push(this); }
    async init() { if (transportFailure) throw transportFailure; }
  }
  const context = vm.createContext({
    console, URL, URLSearchParams, Headers, Request, Response, Blob,
    EventTarget, Event, MessageEvent, TextEncoder, TextDecoder, ReadableStream,
    atob, btoa, performance, WebSocket: ProbeSocket,
    fetch: async () => { throw new Error('Unexpected network request in isolated test'); },
    Window: class {}, WorkerGlobalScope: class {},
    navigator: { userAgent: 'Isolated application test' },
    document: browserDocument,
    location: { href: 'https://majorand.github.io/Canvas/workspace.html' },
    history: { replaceState() {} },
    setTimeout(callback, delay) {
      const timer = setTimeout(callback, delay);
      timer.unref(); timers.add(timer); return timer;
    },
    clearTimeout(timer) { clearTimeout(timer); timers.delete(timer); },
    setInterval: () => 1, clearInterval() {},
    addEventListener: (name, callback) => windowListeners.set(name, callback),
    normalizeAddress, resolveRemoteUrl, RelayTransport,
    appUrl: file => appUrl(file, 'https://majorand.github.io/Canvas/runtime.mjs?v=test-revision'),
    controllerPaths,
    prepareWorker: async () => ({ active: {} }),
    accountApi: async () => ({}),
    authorizedRelayUrl: async () => 'wss://relay.example/api/wisp/?ticket=test&transport=/',
    clearMember() { throw new Error('Reconnect must not clear the member session'); },
    signOut() {},
    signInUrl: () => new URL('https://majorand.github.io/Canvas/access.html'),
    EpoxyTransport: { default: Transport },
  });
  context.self = context; context.window = context; context.top = context;
  vm.runInContext(coreSource, context, { filename: 'pinned-scramjet.js' });
  const { Tap } = context.$scramjet;
  class Controller {
    constructor(options) { this.transport = options.transport; this.replacements = []; controllers.push(this); }
    async wait() {}
    createFrame(element) {
      this.frame = {
        element,
        hooks: { init: Tap.create(), fetch: Tap.create(), error: Tap.create() },
        go(url) { this.destination = url; },
        reload() { this.reloads = (this.reloads || 0) + 1; },
      };
      return this.frame;
    }
    setTransport(next) { this.transport = next; this.replacements.push(next); }
  }
  context.$scramjetController = { Controller };
  vm.runInContext(appSource.replace(/^import .*;\r?\n/gm, ''), context, { filename: 'workspace-app.js' });
  await context.navigate('https://www.youtube.com/');
  assert.equal(controllers.length, 1, 'workspace initialization must succeed');
  t.after(() => { for (const timer of timers) clearTimeout(timer); });
  return {
    context, elements, element, controllers, transports, Tap,
    frame: controllers[0].frame,
    setTransportFailure(error) { transportFailure = error; },
  };
}

test('remote navigation resolves YouTube paths, queries, fragments, and URL objects', () => {
  const base = 'https://www.youtube.com/watch?v=original';
  for (const [input, expected] of [
    ['/results?search_query=space', 'https://www.youtube.com/results?search_query=space'],
    ['/watch?v=next&list=playlist', 'https://www.youtube.com/watch?v=next&list=playlist'],
    ['?v=replaced', 'https://www.youtube.com/watch?v=replaced'],
    ['#comments', 'https://www.youtube.com/watch?v=original#comments'],
    [new URL('https://example.com/path'), 'https://example.com/path'],
  ]) assert.equal(resolveRemoteUrl(input, base)?.href, expected);
  for (const input of ['javascript:alert(1)', 'data:text/html,test', 'file:///test', 'https://user:password@example.com/']) {
    assert.equal(resolveRemoteUrl(input, base), null);
  }
  assert.equal(resolveRemoteUrl('/relative'), null);
  assert.equal(resolveRemoteUrl('https://['), null);
});

test('YouTube navigation hooks accept relative paths without throwing or corrupting the address', async t => {
  const fixture = await workspaceFixture(t);
  const { frame, Tap, element } = fixture;
  const remoteDocument = { addEventListener() {} };
  const client = { url: new URL('https://www.youtube.com/'), hooks: { lifecycle: Tap.create() } };
  await Tap.dispatch(frame.hooks.init.post, { isTopLevel: true, client, window: { document: remoteDocument } }, {});
  await Tap.dispatch(client.hooks.lifecycle.navigate, {}, { url: '/results?search_query=space&themeRefresh=1' });
  assert.equal(element('address').value, 'https://www.youtube.com/results?search_query=space&themeRefresh=1');
  assert.equal(element('open-original').href, element('address').value);
  assert.equal(element('page-state').textContent, 'www.youtube.com');
  client.url = new URL(element('address').value);
  await Tap.dispatch(client.hooks.lifecycle.navigate, {}, { url: '/watch?v=next' });
  assert.equal(element('address').value, 'https://www.youtube.com/watch?v=next');
});

test('escaped document links reopen the Pages workspace after the upstream cache hook', async t => {
  const { frame, Tap, context } = await workspaceFixture(t);
  const remote = new URL('https://www.youtube.com/watch?v=next&list=one');
  Tap.tap(frame.hooks.fetch.intercept, (_context, props) => {
    props.response = { status: 200, body: 'cached document' };
  }, new context.$scramjet.Plugin('scramjet-http-cache'));
  const props = {};
  await Tap.dispatch(frame.hooks.fetch.intercept, { parsed: { destination: 'document', url: remote } }, props);
  assert.equal(props.response.status, 302);
  const target = new URL(props.response.headers.get('location'));
  assert.equal(target.pathname, '/Canvas/workspace.html');
  assert.equal(target.searchParams.get('goto'), remote.href);
  assert.equal(target.searchParams.get('v'), 'test-revision');
  for (const destination of ['iframe', 'script', 'video']) {
    const untouched = {};
    // Remove the fixture cache callback; it should only influence the document assertion above.
    const isolated = await workspaceFixture(t);
    await isolated.Tap.dispatch(isolated.frame.hooks.fetch.intercept, { parsed: { destination, url: remote } }, untouched);
    assert.equal(untouched.response, undefined);
  }
});

test('denied media requests show guidance while preserving the HTTP response and stream', async t => {
  const { frame, Tap, element } = await workspaceFixture(t);
  const body = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array([1, 2])); controller.close(); } });
  const response = { status: 429, body, rawHeaders: [['Retry-After', '60']] };
  const props = { response };
  await Tap.dispatch(frame.hooks.fetch.preresponse, { parsed: { destination: '', url: new URL('https://r1.googlevideo.com/videoplayback') } }, props);
  assert.equal(props.response, response);
  assert.equal(body.locked, false);
  assert.match(element('notice').textContent, /limiting requests.*Wait before retrying/);
  assert.equal(element('notice').hidden, false);
  element('notice').textContent = '';
  await Tap.dispatch(frame.hooks.fetch.preresponse, { parsed: { destination: 'image', url: new URL('https://example.com/missing.png') } }, { response: { status: 403 } });
  assert.equal(element('notice').textContent, '', 'unrelated image failures should not become a page access warning');
  await Tap.dispatch(frame.hooks.fetch.preresponse, { parsed: { destination: 'iframe', isIframe: true, url: new URL('https://ads.example/') } }, { response: { status: 403 } });
  assert.equal(element('notice').textContent, '', 'a blocked advertisement should not become a page access warning');
  await Tap.dispatch(frame.hooks.fetch.preresponse, { parsed: { destination: 'iframe', url: new URL('https://example.com/') } }, { response: { status: 403 } });
  assert.match(element('notice').textContent, /denied access.*Open original/);
});

test('Reconnect replaces the transport and preserves the controller and member session', async t => {
  const { controllers, transports, element, frame } = await workspaceFixture(t);
  const previous = controllers[0].transport;
  await element('reconnect').listeners.get('click')();
  assert.equal(controllers.length, 1);
  assert.equal(transports.length, 2);
  assert.notEqual(controllers[0].transport, previous);
  assert.equal(controllers[0].replacements.length, 1);
  assert.equal(frame.reloads, 1);
  assert.equal(element('reconnect').disabled, false);
});

test('a failed Reconnect preserves the working transport and re-enables retry', async t => {
  const { controllers, element, frame, setTransportFailure } = await workspaceFixture(t);
  const previous = controllers[0].transport;
  setTransportFailure(new Error('Connection unavailable'));
  await element('reconnect').listeners.get('click')();
  assert.equal(controllers[0].transport, previous);
  assert.equal(controllers[0].replacements.length, 0);
  assert.equal(frame.reloads, undefined);
  assert.equal(element('reconnect').disabled, false);
  assert.match(element('notice').textContent, /Connection unavailable/);
  assert.equal(element('connection').textContent, 'Relay unavailable');
});
