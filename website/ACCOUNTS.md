# Supabase account setup

The calculator remains public. Code Mode + 0000 opens the sign-in page.
The workspace requires an individual account; the relay enforces access on the server.
GitHub Pages serves the frontend. Vercel runs the account API and Wisp relay.
Supabase stores identities, profiles, scoped sessions, rate limits, and access events.

## Deploy

1. Create a dedicated Supabase project and run `supabase/schema.sql` in its SQL editor.
2. In Supabase Authentication → URL Configuration, set Site URL to the Vercel site
   and allow `https://scramjet-xi.vercel.app/access.html**` as a redirect URL.
   If using a different domain, replace that URL and AUTH_SITE_URL together.
3. Add these **server-side Vercel environment variables** before deploying:
   - SUPABASE_URL: the dedicated project's URL.
   - SUPABASE_SECRET_KEY: its server secret key (legacy SUPABASE_SERVICE_ROLE_KEY is also accepted).
   - SITE_OWNER_EMAIL: the administrator's email, kept out of the public repository.
   - AUTH_SITE_URL: `https://scramjet-xi.vercel.app/`.
4. Deploy the website directory to Vercel and deploy Pages through the existing workflow.
   Pages defaults to the Vercel account API and relay. AUTH_API_URL and WISP_URL can override
   those public endpoint addresses at build time. Never put a Supabase secret in either.
5. On access.html, use “Email my setup link” with the configured owner email.
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
- Change the administrator's own password after verifying the current one.
- View account sign-ins, failed sign-ins for known accounts, workspace visits,
  account changes, and approximate recent activity.
- The dashboard shows the latest 200 events from the last 30 days and up to 500 accounts.
  Expired logs and sessions are removed when the administrator loads the dashboard.
  No browsing destinations, passwords, or raw session tokens are saved in access logs.
- Logs identify the account used, not a verified physical person.

Passwords require 12–128 characters and are managed by Supabase Auth.
Member sessions last four hours; administrator sessions last one hour.
Logout, password changes, and account disabling revoke relevant server sessions.
Existing relay sockets recheck permission every 30 seconds and close on expiry or failed checks.
Admin credentials are separate from member and relay credentials. Admin session tokens stay
in page memory; refreshing admin.html requires signing in again.

## Local development and tests

Copy .env.example to .env.local and fill it privately, then use Node 22+:

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
