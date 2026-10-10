// Keep the controller/page intact when a pooled relay connection becomes stale.
// Retry only reads, once, before response headers; never replay a submitted form
// or restart an already streaming response.
export class RelayTransport {
  constructor({ create, onState = () => {}, onRecovered = () => {}, headerTimeout = 45000 }) {
    this.create = create; this.onState = onState; this.onRecovered = onRecovered;
    this.headerTimeout = headerTimeout; this.ready = false; this.generation = 0;
    this.transport = null; this.pending = null; this.closed = false;
  }
  async init() { await this.replace(false); }
  async meta() { return this.transport?.meta(); }
  async replace(refresh = true) {
    if (this.closed) throw new Error('The workspace connection is closed.');
    if (this.pending) return this.pending;
    this.pending = (async () => {
      const next = await this.create(refresh);
      if (this.closed) { this.dispose(next); throw new Error('The workspace connection is closed.'); }
      const previous = this.transport;
      this.transport = next; this.generation++; this.ready = true;
      this.dispose(previous); this.onState(true);
    })();
    try { await this.pending; }
    catch (error) { this.onState(false); throw error; }
    finally { this.pending = null; }
  }
  async request(remote, method, body, headers, signal) {
    if (this.closed) throw new Error('The workspace connection is closed.');
    if (signal?.aborted) throw signal.reason;
    const generation = this.generation;
    const send = async () => {
      // Only time out waiting for headers. Streaming games/video bodies keep running.
      const deadline = new AbortController();
      const timer = setTimeout(() => deadline.abort(new DOMException('The relay response timed out.', 'TimeoutError')), this.headerTimeout);
      const combined = signal ? AbortSignal.any([signal, deadline.signal]) : deadline.signal;
      let onAbort;
      const aborted = new Promise((_resolve, reject) => {
        onAbort = () => reject(combined.reason);
        combined.addEventListener('abort', onAbort, { once: true });
        if (combined.aborted) onAbort();
      });
      // Some transport implementations ignore AbortSignal. Bound the caller wait
      // anyway, and discard a late response without buffering its media body.
      const operation = Promise.resolve().then(() => this.transport.request(remote, method, body, headers, combined));
      operation.then(response => { if (combined.aborted) response.body?.cancel?.().catch(() => {}); }, () => {});
      try { return await Promise.race([operation, aborted]); }
      finally { clearTimeout(timer); combined.removeEventListener('abort', onAbort); }
    };
    try { return await send(); }
    catch (error) {
      if (signal?.aborted || this.closed) throw error;
      this.onState(false);
      if (!['GET', 'HEAD'].includes(method.toUpperCase()) || body != null) throw error;
      // Parallel failures share one recovery. Late failures use the new generation.
      if (generation === this.generation) await this.replace(true);
      if (signal?.aborted) throw signal.reason;
      try {
        const response = await send(); this.onState(true); this.onRecovered(); return response;
      } catch (retryError) { this.onState(false); throw retryError; }
    }
  }
  connect(...args) { return this.transport.connect(...args); }
  dispose(transport) {
    // Release retired WASM clients and their connection pools.
    try { if (transport?.client?.free) transport.client.free(); else transport?.session?.close(); } catch {}
  }
  close() { if (this.closed) return; this.closed = true; this.ready = false; this.dispose(this.transport); }
}
