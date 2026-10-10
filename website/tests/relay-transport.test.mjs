import test from 'node:test';
import assert from 'node:assert/strict';
import { RelayTransport } from '../public/relay-transport.mjs';
const remote = new URL('https://example.com/');
const request = (relay, method = 'GET', body = null, signal) => relay.request(remote, method, body, [], signal);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

test('stale read connections recover once, sharing recovery and keeping the response stream', async () => {
  let created = 0, closed = 0, reads = 0;
  const states = [];
  const body = new ReadableStream({ start(c) { c.enqueue(new Uint8Array([7])); c.close(); } });
  const response = { status: 200, body };
  const relay = new RelayTransport({ onState: value => states.push(value), create: async refresh => {
    const generation = created++;
    assert.equal(refresh, generation > 0);
    await sleep(2);
    return { ready: true, session: { close() { closed++; } }, async request() {
      reads++;
      if (generation === 0) throw new Error('Socket closed');
      return response;
    } };
  } });
  await relay.init();
  const results = await Promise.all([request(relay), request(relay), request(relay)]);
  assert.ok(results.every(value => value === response));
  assert.equal(created, 2); assert.equal(closed, 1); assert.equal(reads, 6);
  assert.equal(body.locked, false); assert.equal(states.at(-1), true);
  relay.close(); assert.equal(closed, 2);
});

test('form submissions, caller cancellation, and HTTP denials are never replayed', async () => {
  let created = 0, sent = 0;
  let response;
  const states = [];
  const relay = new RelayTransport({ onState: value => states.push(value), create: async () => {
    created++;
    return { async request() { sent++; if (response) return response; throw new Error('Network failed'); } };
  } });
  await relay.init();
  await assert.rejects(request(relay, 'POST', 'important form'), /Network failed/);
  assert.equal(sent, 1); assert.equal(created, 1);
  assert.equal(states.at(-1), false);
  const abort = new AbortController(); abort.abort(new Error('User stopped loading'));
  await assert.rejects(request(relay, 'GET', null, abort.signal), /User stopped/);
  assert.equal(sent, 1);
  response = { status: 403 }; assert.equal(await request(relay), response);
  assert.equal(states.at(-1), true, 'a later successful connection restores the status without replaying the form');
  response = { status: 429 }; assert.equal(await request(relay), response);
  assert.equal(created, 1);
});

test('a hung request has a bounded header deadline and only one retry', async () => {
  let created = 0, sent = 0;
  const relay = new RelayTransport({ headerTimeout: 10, create: async () => {
    created++;
    return { request(_url, _method, _body, _headers, signal) {
      sent++;
      return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
    } };
  } });
  await relay.init();
  await assert.rejects(request(relay), { name: 'TimeoutError' });
  assert.equal(created, 2); assert.equal(sent, 2);
});

test('the header deadline never aborts an already streaming response', async () => {
  let passedSignal;
  const relay = new RelayTransport({ headerTimeout: 10, create: async () => ({
    async request(_url, _method, _body, _headers, signal) { passedSignal = signal; return { status: 200, body: new ReadableStream() }; },
  }) });
  await relay.init();
  const abort = new AbortController();
  await request(relay, 'GET', null, abort.signal);
  await sleep(25);
  assert.equal(passedSignal.aborted, false);
  abort.abort(); assert.equal(passedSignal.aborted, true);
});

test('closing while recovery is pending disposes the late pool without reopening the page', async () => {
  let resolve, closed = 0;
  const relay = new RelayTransport({ create: () => new Promise(done => { resolve = done; }) });
  const initializing = relay.init(); relay.close();
  resolve({ session: { close() { closed++; } } });
  await assert.rejects(initializing, /closed/); assert.equal(closed, 1);
  await assert.rejects(request(relay), /closed/);
});

test('the deadline also bounds transports that ignore cancellation', async () => {
  const relay = new RelayTransport({ headerTimeout: 10, create: async () => ({ request: () => new Promise(() => {}) }) });
  await relay.init();
  await assert.rejects(request(relay), { name: 'TimeoutError' });
});

test('retired Epoxy WASM clients are released exactly once', async () => {
  let freed = 0;
  const relay = new RelayTransport({ create: async () => ({ client: { free() { freed++; } } }) });
  await relay.init(); await relay.replace(); assert.equal(freed, 1);
  relay.close(); relay.close(); assert.equal(freed, 2);
});

test('parallel slow assets do not replace a relay that can still serve requests', async () => {
  let created = 0, checked = 0, freed = 0;
  const states = [];
  const relay = new RelayTransport({
    onState: value => states.push(value),
    healthy: async () => { checked++; await sleep(2); return true; },
    create: async () => { created++; return { client: { free() { freed++; } }, async request() { throw new Error('Slow asset'); } }; },
  });
  await relay.init();
  const results = await Promise.allSettled([request(relay), request(relay), request(relay)]);
  assert.ok(results.every(result => result.status === 'rejected' && result.reason.message === 'Slow asset'));
  assert.equal(checked, 1); assert.equal(created, 1); assert.equal(freed, 0);
  assert.equal(states.at(-1), true);
});

test('a failed relay probe allows one fresh-connection retry', async () => {
  let created = 0;
  const response = { status: 200 };
  const relay = new RelayTransport({ healthy: async () => false, create: async () => {
    const generation = created++;
    return { async request() { if (!generation) throw new Error('Lost relay'); return response; } };
  } });
  await relay.init(); assert.equal(await request(relay), response); assert.equal(created, 2);
});
