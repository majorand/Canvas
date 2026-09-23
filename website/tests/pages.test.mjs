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
  for (const page of ['index.html', 'workspace.html']) {
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
    fetch: async () => new Response('page', { headers: { 'Content-Type': 'text/html' } }),
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
  assert.equal(await document.text(), 'page');
  response = undefined;
  send('https://majorand.github.io/another-project/');
  assert.equal(response, undefined);
  proxied = true;
  send('https://majorand.github.io/Canvas/~/sj/test');
  assert.equal(await (await response).text(), 'proxied');
});
