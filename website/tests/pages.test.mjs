import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import vm from 'node:vm';
import { appUrl, controllerPaths } from '../public/runtime.mjs';
import { allowedOrigin } from '../lib/relay.mjs';

test('all application and Scramjet paths remain within the deployed directory', () => {
  for (const base of ['https://example.test/', 'https://majorand.github.io/Canvas/', 'https://example.test/another/repository/']) {
    const module = base + 'runtime.mjs';
    assert.equal(appUrl('workspace.html', module).href, base + 'workspace.html');
    assert.equal(appUrl('./', module).href, base);
    assert.equal(appUrl('sw.js', module).href, base + 'sw.js');
    const paths = controllerPaths(module);
    assert.equal(paths.prefix, new URL(base).pathname + '~/sj/');
    assert.equal(paths.wasmPath, new URL(base).pathname + 'scramjet/scramjet.wasm');
    assert.equal(paths.injectPath, new URL(base).pathname + 'controller/controller.inject.js');
  }
});

test('built HTML assets and navigation are relative and resolve inside Pages', async () => {
  for (const page of ['index.html', 'workspace.html', 'access.html', 'admin.html', 'games.html']) {
    const html = await readFile(new URL('../dist/' + page, import.meta.url), 'utf8');
    for (const [, target] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      if (target.startsWith('https:') || target.startsWith('#')) continue;
      assert.ok(target.startsWith('./'), target);
      await access(new URL('../dist/' + (target === './' ? 'index.html' : target.slice(2)), import.meta.url));
    }
  }
});

test('relay allows the exact Pages origin and continues rejecting other origins', () => {
  const request = origin => ({ headers: { origin, host: 'scramjet-xi.vercel.app' } });
  assert.equal(allowedOrigin(request('https://majorand.github.io')), true);
  for (const origin of ['https://other.github.io', 'https://majorand.github.io.evil.test', 'http://majorand.github.io', 'null', undefined]) {
    assert.equal(allowedOrigin(request(origin)), false, origin);
  }
});

test('worker isolates Pages documents without interfering with proxy routing or other sites', async () => {
  const handlers = {};
  let proxied = false;
  const context = {
    URL, Headers, Response,
    importScripts: file => assert.equal(file, './controller/controller.sw.js'),
    self: { registration: { scope: 'https://majorand.github.io/Canvas/' }, addEventListener: (name, cb) => { handlers[name] = cb; } },
    fetch: async (_request, options) => { assert.equal(options.cache, 'no-cache'); return new Response('page', { headers: { 'Content-Type': 'text/html' } }); },
    $scramjetController: { shouldRoute: () => proxied, route: async () => new Response('proxied') },
  };
  vm.runInNewContext(await readFile(new URL('../public/sw.js', import.meta.url), 'utf8'), context);
  let response;
  const send = url => handlers.fetch({ request: { url }, respondWith: value => { response = value; } });
  send('https://majorand.github.io/Canvas/workspace.html');
  const document = await response;
  assert.equal(document.headers.get('Cross-Origin-Opener-Policy'), 'same-origin');
  assert.equal(document.headers.get('Cross-Origin-Embedder-Policy'), 'credentialless');
  assert.equal(document.headers.get('Content-Type'), 'text/html');
  assert.equal(document.headers.get('Cache-Control'), 'no-store');
  assert.equal(await document.text(), 'page');
  response = undefined;
  send('https://majorand.github.io/another-project/');
  assert.equal(response, undefined);
  proxied = true;
  send('https://majorand.github.io/Canvas/~/sj/test');
  assert.equal(await (await response).text(), 'proxied');
});

test('published entry pages and nested modules use one cache revision', async () => {
  const read = file => readFile(new URL('../dist/' + file, import.meta.url), 'utf8');
  const workspace = await read('workspace.html');
  const revision = /workspace-loader\.js\?v=([a-f0-9]{16})/.exec(workspace)?.[1];
  assert.ok(revision, 'workspace loader must bypass older cached scripts');
  for (const file of ['index.html','workspace.html','access.html','admin.html','games.html','games.js','games-catalog.mjs','relay-transport.mjs','workspace-loader.js','app.js','auth-client.mjs','access.js','admin.js','calculator.js','sw.js']) {
    const source = await read(file);
    for (const [, target] of source.matchAll(/['"](\.\/[^'"\s]+\.(?:html|js|mjs|css)(?:\?[^'"\s]*)?)['"]/g)) {
      const url = new URL(target,'https://example.test/Canvas/');
      assert.equal(url.searchParams.get('v'),revision,file + ': ' + target);
      await access(new URL('../dist/' + url.pathname.slice('/Canvas/'.length),import.meta.url));
    }
  }
});

test('an idle worker revives the proxy before its first request reaches the static host', async () => {
  const handlers = {};
  let known = false, notified = 0, routed = 0;
  const context = {
    URL, Headers, Response, setTimeout: callback => queueMicrotask(callback), importScripts() {},
    self: {
      registration: { scope: 'https://majorand.github.io/Canvas/' },
      addEventListener: (name, callback) => { handlers[name] = callback; },
      clients: { matchAll: async () => [{ postMessage(message) { assert.deepEqual(Object.keys(message), ['$controller$swrevive']); notified++; known = true; } }] },
    },
    fetch: () => { throw new Error('A rewritten URL must never be fetched as a static file'); },
    $scramjetController: { shouldRoute: () => known, route: async () => { routed++; return new Response('restored website'); } },
  };
  vm.runInNewContext(await readFile(new URL('../public/sw.js', import.meta.url), 'utf8'), context);
  let response;
  handlers.fetch({ request: { url: 'https://majorand.github.io/Canvas/~/sj/controller/frame/https%3A%2F%2Fexample.com%2F' }, respondWith: value => { response = value; } });
  assert.equal(await (await response).text(), 'restored website');
  assert.equal(notified, 1); assert.equal(routed, 1);
});

test('a proxy without its workspace gives recovery guidance rather than a static-host 404', async () => {
  const handlers = {};
  const context = {
    URL, Headers, Response, setTimeout: callback => queueMicrotask(callback), importScripts() {},
    self: { registration: { scope: 'https://majorand.github.io/Canvas/' }, addEventListener: (name, cb) => { handlers[name] = cb; }, clients: { matchAll: async () => [] } },
    fetch: () => { throw new Error('Proxy requests must not fall through to static hosting'); },
    $scramjetController: { shouldRoute: () => false },
  };
  vm.runInNewContext(await readFile(new URL('../public/sw.js', import.meta.url), 'utf8'), context);
  let response;
  handlers.fetch({ request: { url: 'https://majorand.github.io/Canvas/~/sj/controller/frame/https%3A%2F%2Fexample.com%2F' }, respondWith: value => { response = value; } });
  const result = await response;
  assert.equal(result.status, 503); assert.equal(result.headers.get('retry-after'), '1');
  assert.match(await result.text(), /Reload the workspace/);
});

test('sign-in and workspace navigation retain the deployed revision', () => {
  const module = 'https://example.test/Canvas/runtime.mjs?v=revision123';
  assert.equal(appUrl('workspace.html',module).href,'https://example.test/Canvas/workspace.html?v=revision123');
  assert.equal(appUrl('access.html?flow=setup',module).href,'https://example.test/Canvas/access.html?flow=setup&v=revision123');
  assert.equal(appUrl('api/access',module).href,'https://example.test/Canvas/api/access');
});
