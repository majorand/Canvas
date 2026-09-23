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

Import `majorand/Canvas`, use `website` as the root directory and Other as the framework preset. Build/install/output settings are defined in vercel.json. The static frontend, service worker and WASM are served from dist. `/api/wisp/` runs the WebSocket relay and `/api/health` provides a lightweight health response. The UI probes the actual Wisp handshake instead of treating an HTTP response as proof that proxying works.

Vercel WebSockets are in beta and connections are subject to the configured 300-second function duration. Active long-lived streams can be interrupted by platform limits. For a dedicated relay, set WISP_URL at build time, or enter a secure wss:// URL in the website's Settings. A separate backend must set ALLOWED_ORIGINS to the frontend's exact origin.


## GitHub Pages

Live frontend: https://majorand.github.io/Canvas/

The `.github/workflows/website-pages.yml` workflow builds and tests `website/`, then deploys `website/dist` on pushes to main. In repository Settings → Pages, set Source to **GitHub Actions**. You can also run **Deploy website to GitHub Pages** manually in Actions.

`npm run build:pages` creates the Pages artifact. It defaults to `wss://scramjet-xi.vercel.app/api/wisp/`; set the repository Actions variable `WISP_URL` to use another secure Wisp relay. GitHub Pages only serves static files, so keep the Vercel project running for proxy traffic. The Vercel relay explicitly allows `https://majorand.github.io`; other owners or custom domains must add their exact origin to its `ALLOWED_ORIGINS` environment variable and redeploy the backend. Do not use a wildcard. The default relay is specific to this deployment.

The calculator, Code Mode (`0000`), browsing controls, Canvas exit, and about:blank window work on Pages. All assets, links, proxy prefixes, and worker scope follow the deployed directory, so repository subpaths and root/custom-domain hosting are supported. On the first workspace visit, its service worker reloads once to add cross-origin isolation headers that Pages cannot configure on the server. This preserves the browser features available on Vercel. Unsupported browsers show an error instead of repeatedly reloading.

For a local simulation of Pages at `http://localhost:3031/Canvas/`, run `npm run preview:pages`. This serves without isolation headers and uses a local relay solely for testing. Clear `WISP_URL` if you want the local relay. No local computer is required for the published Pages site.

Browser data and custom relay preferences are separate for the Pages and Vercel origins. Both sites share the same backend limits and third-party website compatibility constraints.

## Features

- CalcSolver-inspired calculator homepage with a light blue header and dark keypad. Supports addition, subtraction, multiplication, division, decimals, square roots, operator precedence, keyboard parentheses, clear, and backspace. Enter calculates and Escape clears.
- Turn on **Code Mode** and press **0 four times** to open Scramjet at `/workspace.html`. Other digits or operations reset the consecutive-zero sequence; switching mode clears the partial code. Regular calculator mode never opens the workspace. The Calculator link returns to the calculator. This is a navigation shortcut, not password protection: the workspace URL remains directly accessible.
- Canvas tab styling: the title "Canvas - Highland Park High School" and Scots favicon match the public page reached from hpisd.instructure.com. The same title and icon are copied into about:blank windows, and the page header reads "Scots Canvas". This changes display branding, not the site's address or its Scramjet functionality.
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

The Scots logo in public/scots.png is the existing favicon from the school Canvas page, downloaded from https://resources.finalsite.net/images/v1774986756/hpisdorg/udonhuq0lkslosopfmll/Scots.png. School branding belongs to its respective owner and is not covered by this app's software license.

AGPL-3.0-only, consistent with Scramjet. Source and deployment code: https://github.com/majorand/Canvas/tree/main/website. Original project: https://github.com/MercuryWorkshop/scramjet.
