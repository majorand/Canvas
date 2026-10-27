# October 2026 runtime and CA security update

The [Render advisory](https://render.com/docs/advisory-emudhra) and [Node release](https://nodejs.org/en/blog/release/v24.22.1) apply to this deployment. Node fetch (Supabase) and HTTPS (video metadata) use Node TLS; the Wisp server forwards TCP bytes and does not itself validate a remote website's certificate. The Epoxy WASM client performs that TLS validation separately in the browser.

## Versions and build configuration

- Render NODE_VERSION, website/.node-version, and both GitHub Actions workflows pin 24.22.1. The website engine range is >=24.22.1 <25, and the direct server entry point refuses older/unapproved runtimes.
- Render must rebuild the native service to refresh its OS CA store. An environment change plus a build of the updated commit does this; restarting an old build is insufficient.
- Epoxy transport 3.0.2 pins Epoxy TLS 2.1.20-1. Upstream's latest tag at 9cde724aea1a0f5e46b1c962b3d19ca1389af074 resolves webpki-roots 1.0.10 and rustls-webpki 0.103.16, the patched versions named by Render. The client embeds its own root store, so a Node upgrade alone cannot replace it.
- Wisp JS is 0.5.1 and its ws dependency resolves to 8.22.0. No separate PEM/CRT CA bundle was found in the server dependencies. Neither our HTTPS client nor transport opts disable certificate validation or install custom roots.
- npm audit fix was run without --force; retain the pinned transport and lockfile. npm audit does not audit Rust/WASM trust stores or Node's built-in libraries.

## Verification

- /api/health reports the running Node and OpenSSL versions, alongside the existing relay health information.
- VERIFY_TLS_DISTRUST=1 runs fixed, bounded probes on server startup against both test endpoints published by Render, using Node fetch and the actual HTTPS requestPublic client. Logs report passed only for certificate-verification rejection; a DNS/network failure is inconclusive, and any HTTP response (including 403) is a failure. No TLS bypass is used. The probes run in the background after listen, so an unavailable third-party test host cannot take the website offline.
- A manual integration check of the shipped Epoxy 2.1.20-1 WASM through a local authenticated Wisp fixture accepted example.com and rejected both compromised-certificate endpoints with CertDistrusted. This checks the actual compiled client rather than relying only on source manifests. Security regression tests cover Node diagnostic classification; existing authorization, private-network blocking, relay, browser tabs, video fallback and account tests remain required.
- PHP, Bun, Python certifi, Ruby, Go and Elixir are not used by this website. Other services in the account and local Node installations require their own audit. The local default Node was 24.11.1; verification used a portable 24.22.1 binary checked against Node's official SHA256 checksum, without replacing the user's global install.

## Free bandwidth

Prefer the dedicated video window or Open original for media; those streams go directly to the provider rather than through Render. Avoid video in normal proxy tabs, lower video quality, close unused media/game tabs, and avoid repeated reloads and large downloads. Keep cacheable public assets cached, without caching private/authenticated responses globally. Per-account byte budgets and optional media/download limits could reduce abuse but need product decisions and should not be silently enabled. Do not run load tests or recurring download probes on the small free quota.
