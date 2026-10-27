# Supabase account setup

The calculator remains public. Code Mode + 0000 opens the sign-in page.
The workspace requires an individual account; the relay enforces access on the server.
GitHub Pages serves the frontend. Render Free runs the account API and Wisp relay.
Supabase stores identities, profiles, scoped sessions, tab heartbeats, site settings, activity, rate limits, and access events.

## Deploy

1. Create a dedicated Supabase project and run `supabase/schema.sql` in its SQL editor.
2. In Supabase Authentication → URL Configuration, set Site URL to the Pages site
   and allow `https://majorand.github.io/Canvas/access.html**` as a redirect URL.
   If using a different domain, replace that URL and AUTH_SITE_URL together.
3. Add these **server-side Render environment variables** before deploying:
   - SUPABASE_URL: the dedicated project's URL.
   - SUPABASE_SECRET_KEY: its server secret key (legacy SUPABASE_SERVICE_ROLE_KEY is also accepted).
   - SITE_OWNER_EMAIL: the administrator's email, kept out of the public repository.
   - AUTH_SITE_URL: `https://majorand.github.io/Canvas/`.
   - NODE_VERSION: `24.22.1`, HOST: `0.0.0.0`, ALLOWED_ORIGINS: `https://majorand.github.io`.
4. Deploy the website directory to a Render Free Node web service and deploy Pages through the existing workflow.
   Pages defaults to the Render account API and relay. AUTH_API_URL and WISP_URL can override
   those public endpoint addresses at build time. Never put a Supabase secret in either.
   For this existing deployment, keep the same Supabase project and key: accounts, passwords,
   profiles, sessions, and logs stay in place. Do not rerun setup or create a replacement database.
5. For a fresh installation only: on access.html, use “Email my setup link” with the configured owner email.
   Open the emailed link and choose the administrator password privately.
   Only the verified configured owner can complete setup.
6. Sign in at admin.html. Create individual accounts with a name, email, and initial
   password. Share those details privately. Members can change their own password.

Supabase must be able to send email to the owner. Its default email service has recipient
and rate restrictions; configure custom SMTP in Supabase if the owner cannot receive
the setup email. Public Supabase signup alone never grants access: a matching enabled
application account is also required.

## Administrator controls

- Create named member accounts.
- Rename members, enable/disable access, and reset member passwords.
- Grant workspace/relay and games-menu permissions separately, with optional account expiry.
- View unexpired sign-in sessions, recently active tabs, foreground/background state, and online account estimates.
- End an individual session, all sessions for a member, or all member sessions. Owner sessions are protected.
- Filter submitted searches and page-domain activity by account, type, or text, and export the matching loaded records to CSV.
- Set activity logging, 7/14/30-day activity retention, games-menu availability, maintenance mode, new session duration (1–24 hours), and simultaneous session limits (1–20 per member).
- Change the administrator's own password after verifying the current one.
- View account sign-ins, failed sign-ins for known accounts, workspace visits,
  account changes, and approximate recent activity.
- The dashboard shows the latest 200 events from the last 30 days and up to 500 accounts.
  Expired logs and sessions are removed when the administrator loads the dashboard.
  Search/domain activity is separate: the latest 500 records within the configured retention period.
  Browser-reported top-level domains and submitted Google.com, Bing, DuckDuckGo, and YouTube searches are recorded after this update.
  Full URLs, credentials, arbitrary URL parameters, keystrokes, and form contents are excluded from activity collection.
  Both the sign-in page and workspace disclose administrator visibility. Tracking is approximate, can be blocked by clients, and is not a complete history.
- Session lists show up to 1,000 rows; headline totals are database aggregates. Tabs heartbeat every minute and count as active for 2 minutes.
- Logs identify the account used, not a verified physical person.

Passwords require 12–128 characters and are managed by Supabase Auth.
Member sessions default to four hours and a maximum of ten concurrent sign-ins; administrator sessions last one hour.
New duration/limit settings apply to future sign-ins; account expiry and permission changes are checked for existing access.
Maintenance mode pauses member access while keeping the owner's administrator/member access available.
Games permission controls the catalog menu; general workspace access still allows external game websites.
Logout, password changes, and account disabling revoke relevant server sessions.
Existing relay sockets recheck permission every 30 seconds and close on expiry or failed checks.
Admin credentials are separate from member and relay credentials. Admin session tokens stay
in page memory; refreshing admin.html requires signing in again.

## Local development and tests

Copy .env.example to .env.local and fill it privately, then use Node >=24.22.1 <25:

```sh
npm ci --workspaces=false
npm run build
node --env-file=.env.local server.mjs
```

Run `npm test` after a build. The tests cover role separation, password checks, revocation,
expiry, rate limits, CORS, relay authentication, private-destination blocking, and calculator behavior.

For an isolated UI demonstration without any live Supabase data:
`node tests/demo-server.mjs`, then open http://localhost:3032.
Its fixture logins are owner@example.test / owner-test-password-123 and
member@example.test / member-test-password-123. This server binds only to loopback and is never
imported by the deployed endpoints.

Static HTML, JavaScript, and the open-source calculator are public on Pages.
Account data and proxy relay access are protected on the backend. Missing server configuration
fails closed; configure Supabase before replacing an existing public deployment.

## Usernames

People can sign in with either their email or an assigned username. In the admin dashboard,
set an optional username when creating or editing a member. Use “Your administrator username”
to set your own. Existing accounts continue using email until a username is assigned.
Usernames are unique, case-insensitive, 3–32 characters, and stored in lowercase. Allowed characters
are letters, numbers, dots, underscores, and hyphens; start with a letter or number.
Clearing a username removes that alias without changing the email or password.
For an existing database, apply supabase/usernames.sql before deploying this update.
The isolated demonstration member also accepts test.member as its login.

## Upgrading the administrator dashboard

For an existing Canvas database, apply `supabase/admin-controls.sql` before deploying the matching website update.
The migration is additive and repeatable; it preserves accounts, passwords, and existing sessions.
New installations use the complete `supabase/schema.sql` instead. All new tables have RLS enabled with no anon/authenticated grants;
only the existing server service-role client can use them. Session-list responses never expose session token hashes.
Session limits use a PostgreSQL advisory lock and trigger so parallel login requests cannot bypass the limit.
Expired records are pruned during administrator dashboard loads; retention filtering also excludes expired activity from responses.
Audit logs retain settings changes and session revocations for 30 days.
