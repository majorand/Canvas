# Running the existing Canvas backend on Windows

The local backend uses the existing Supabase database, accounts, permissions and scoped relay tickets. It listens on 127.0.0.1:3030; Tailscale Funnel publishes that service over HTTPS. No router port forwarding is required. Keep Windows and Tailscale running; sleep, shutdown or a lost home connection takes the backend offline. Funnel is available on all plans but has bandwidth limits; it is not an unlimited hosting service.

The installed runtime is Node 24.22.1 in `%LOCALAPPDATA%\CanvasBackend\node.exe`. Update that runtime when new Node security patches are released. Source and dependencies run from this repository's website folder. After changing server code, run the stop and start scripts to use the update.

Private configuration lives outside the repository and OneDrive in `%LOCALAPPDATA%\CanvasBackend`. The folder is restricted to the current Windows user and SYSTEM. `secret.dpapi` uses Windows CurrentUser encryption: another account or computer cannot decrypt it. Never commit or publish the server key. `config.json` contains supabaseUrl and ownerEmail; these are supplied locally, not in public client files.

Run these scripts with Windows PowerShell:

- `scripts/setup-windows-backend.mjs` serves a masked private key-entry page at http://127.0.0.1:3031/. Start it with the installed Node runtime and open that address. It binds only loopback and stops after saving. Enter the existing Supabase secret/service_role key yourself; do not send it in chat.
- `scripts/install-windows-backend.ps1` starts a hidden supervisor and creates a Startup shortcut for this user. It resumes after Windows sign-in, not before login.
- `scripts/stop-windows-backend.ps1` stops only the registered Canvas supervisor and Node process. The Startup shortcut still starts it on your next sign-in.
- `scripts/start-windows-backend.ps1` restarts it manually. A mutex prevents duplicate supervisors; an exited Node process restarts after five seconds.

To stop publishing the HTTPS tunnel, run `tailscale funnel --https=443 off`. Remove the Canvas Backend shortcut from the Windows Startup folder to stop automatic startup. These commands do not delete accounts or database data.

Before changing Pages: verify public health, exact-origin CORS, unauthenticated Wisp rejection, Supabase account status, and a signed-in proxy page load. Then set the GitHub Actions repository variables AUTH_API_URL to the tunnel origin plus /api/access and WISP_URL to its wss origin plus /api/wisp/, and redeploy website-pages.yml. Render remains a recovery option when its allowance returns. Never set SUPABASE_SECRET_KEY as a Pages variable.

Logs are backend.stdout.log and backend.stderr.log in the private state folder. The launcher does not print the secret. The startup TLS distrust checks should report passed. Do not share logs containing session details or credentials.

