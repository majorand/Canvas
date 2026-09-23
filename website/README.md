# Scramjet website

Live site: https://scramjet-xi.vercel.app/

Vercel project: https://vercel.com/major-andrews-projects/scramjet

Health endpoint: https://scramjet-xi.vercel.app/api/health

Backend: wss://scramjet-xi.vercel.app/api/wisp/ (a WebSocket URL, not a page to open).

Deployable website for this Scramjet fork. Uses the published `2.0.67-alpha.2` core and matching `0.0.14` controller, pinned in package-lock.json. The upstream source stays in packages/.

## Local use

With Node.js 22 or newer, from this directory:

```sh
npm ci --workspaces=false
npm run build
npm test
npm start
```

Open http://localhost:3030. The local server binds to loopback by default. Set PORT to change the port, or HOST=0.0.0.0 when running on a hosting provider.

## Vercel

Import `majorand/scramjet`, use `website` as the root directory and Other as the framework preset. Build/install/output settings are defined in vercel.json. The static frontend, service worker and WASM are served from dist. `/api/wisp/` runs the WebSocket relay and `/api/health` provides a lightweight health response. The UI probes the actual Wisp handshake instead of treating an HTTP response as proof that proxying works.

Vercel WebSockets are in beta and connections are subject to the configured 300-second function duration. Active long-lived streams can be interrupted by platform limits. For a dedicated relay, set WISP_URL at build time, or enter a secure wss:// URL in the website's Settings. A separate backend must set ALLOWED_ORIGINS to the frontend's exact origin.

## Features

- A prominent "Leave this page and go to Canvas" button opens https://hpisd.instructure.com/ directly in the current top-level tab, including from the about:blank workspace. It is independent of the proxy connection and is also available in workspace full screen. This replaces the current history entry; it does not erase browsing history or close other tabs.
- Website address entry and Google search queries.
- Browser workspace with back, forward, reload, home and full screen.
- Google, Wikipedia, YouTube and Example Domain shortcuts.
- Service-worker based interception and WebAssembly rewriting.
- Wisp transport for HTTP/HTTPS traffic, including proxied WebSockets.
- Connection status, initialization timeouts, loading errors and custom relay settings stored in the browser.
- Responsive layout, keyboard access and labeled controls.
- Open in about:blank: opens the workspace in a new blank tab, retaining the current website address. The original tab stays open. If pop-ups are blocked, the page explains how to retry. Reloading the blank wrapper itself may clear it; use the workspace's reload button for the proxied page.

The about:blank wrapper does not make a tab unclosable or invisible to browser-management extensions such as Securly or Hapara. It changes the top-level address; managed browser policies still apply.

## Boundaries

The relay allows web ports 80/443, blocks private/loopback destinations and UDP, and checks browser origins. Origin checking is not authentication: non-browser clients can forge the Origin header. This is a public proxy deployment, not a private VPN or an anonymity service. Site compatibility varies; DRM, CAPTCHAs, sign-in and anti-proxy systems may prevent particular features from working. Scramjet stores site data and cookies in the browser.

The wisp-js 0.5.0 per-host stream limit contains an upstream iterator bug, so this app uses its total-stream limit instead. The optional scramjet-utils release expects different runtime versions and is intentionally not loaded.

## Deployment verification

Verified on September 22, 2026: local build and automated tests; public health and service-worker endpoints without authentication; actual HTTPS proxy loads for Example Domain, Wikipedia, and Google search results; back/forward navigation; and the home page at a 390-pixel viewport. The frontend and relay both run on the Vercel Hobby project. No separate backend account, paid service, or always-on local computer is required for this deployment.

## License and source

AGPL-3.0-only, consistent with Scramjet. Source and deployment code: https://github.com/majorand/scramjet/tree/main/website. Original project: https://github.com/MercuryWorkshop/scramjet.
