# Scramjet — Base44 Dev Environment

## What this is
Scramjet is an interception-based web proxy monorepo (pnpm workspaces). The dev
server (`pnpm dev`) starts three things from the repo root:
1. A **Vite dev server** on `DEMO_PORT` (default 4141, set to 3000 in the sandbox)
   serving the demo app from `packages/demo`.
2. A **Wisp WebSocket server** on `WISP_PORT` (default 4142) for proxy transport.
3. An **rspack watcher** that builds the core, controller, and utils packages
   into their `dist/` directories. The demo's `index.html` loads
   `/scramjet/scramjet.js` and `/controller/controller.api.js` which are copied
   from those `dist/` dirs via `vite-plugin-static-copy`.

## Build prerequisites (installed in Dockerfile.base44)
- **Rust nightly** with `wasm32-unknown-unknown` target and `rust-src` component.
- **wasm-bindgen-cli** 0.2.105 (version is checked by the build script).
- **Binaryen** (`wasm-opt`) — latest release.
- **wasm-snip** from the `r58Playz/wasm-snip` fork (not the upstream crate).

## Startup order
The compose command runs:
1. `pnpm install --frozen-lockfile` — installs all workspace dependencies.
2. `bash build.sh` in `packages/core/rewriter/wasm/` — builds the WASM rewriter.
   This produces `packages/core/dist/scramjet.wasm`, which the rspack config
   reads at load time (it base64-embeds it into some bundles). The build script
   skips itself if sources are unchanged (hash check in `out/.build-hash`).
3. `pnpm dev` — starts Vite + Wisp + rspack watcher.

The first build takes a long time (Rust compiles oxc and many crates). The
`scramjet_cargo_target` Docker volume caches the Cargo target dir so subsequent
starts skip the Rust compilation.

## Sandbox-specific overrides
- `devserver.ts` binds the Vite server to `0.0.0.0` with `allowedHosts: true`
  when `BASE44_PREVIEW_MODE === "1"`. Outside the sandbox the original
  `localhost`-only binding is preserved.
- `VITE_WISP_URL` is set to `wss://4142-${BASE44_PUBLIC_HOST_SUFFIX}/` so the
  browser can reach the Wisp server through the preview proxy.
- Port 4142 is exposed for the Wisp WebSocket server.

## No external secrets
This project is self-contained — no external API keys or credentials are needed.
