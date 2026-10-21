import { createHash, randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { sanitizeActivity } from '../public/activity-details.mjs';

export class AccessError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const digest = value => createHash('sha256').update(value).digest('hex');
const validToken = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
export function bearer(req) {
  const match = /^Bearer ([a-f0-9]{64})$/.exec(req.headers.authorization || '');
  return match?.[1] || '';
}
const passwordCheck = value => {
  if (typeof value !== 'string' || value.length < 12 || value.length > 128) throw new AccessError(400, 'Use a password between 12 and 128 characters.');
};
const emailCheck = value => {
  const email = String(value || '').trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AccessError(400, 'Enter a valid email address.');
  return email;
};
const displayName = value => {
  const name = String(value || '').trim();
  if (!name || name.length > 80) throw new AccessError(400, 'Enter a name between 1 and 80 characters.');
  return name;
};
function usernameCheck(value) {
  const username = String(value || '').trim().toLowerCase();
  if (!username) return null;
  if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username)) throw new AccessError(400, 'Use 3–32 characters for usernames: letters, numbers, dots, underscores, or hyphens; start with a letter or number.');
  return username;
}
function checked(result) {
  if (result.error?.message?.includes('session_limit')) throw new AccessError(409, 'The account has reached its sign-in session limit. Sign out on another device or ask the administrator to end a session.');
  if (result.error?.code === '23505') throw new AccessError(409, 'That email or username is already in use.');
  if (result.error) throw new AccessError(503, 'Account storage is unavailable. Please try again later.');
  return result.data;
}
export function createAccessService({ db, authClient, ownerEmail, siteUrl, now = () => Date.now() }) {
  const owner = ownerEmail.trim().toLowerCase();
  const expires = milliseconds => new Date(now() + milliseconds).toISOString();
  const settings = async () => checked(await db.from('site_settings').select('*').eq('id', true).maybeSingle());
  async function featureAccess(account, feature, config = undefined) {
    if (account.role === 'admin') return;
    config ||= await settings();
    if (config.maintenance_enabled) throw new AccessError(403, config.maintenance_message);
    if (feature === 'workspace' && !account.can_browse) throw new AccessError(403, 'Workspace access is disabled for your account. Contact the administrator.');
    if (feature === 'games' && (!account.can_play || !config.games_enabled)) throw new AccessError(403, 'The games menu is disabled for your account.');
  }
  async function rate(key, limit, seconds = 900) {
    const allowed = checked(await db.rpc('site_allow_attempt', { p_key: digest(key), p_limit: limit, p_seconds: seconds }));
    if (!allowed) throw new AccessError(429, 'Too many attempts. Please try again later.');
  }
  async function log(account, event, actor = account) {
    checked(await db.from('site_access_events').insert({ user_id: account.id, actor_id: actor.id, email: account.email, event }));
  }
  async function accountByEmail(email) {
    return checked(await db.from('site_accounts').select('*').eq('email', email).maybeSingle());
  }
  async function uniqueUsername(value, exceptId) {
    const username = usernameCheck(value);
    if (username) {
      const existing = checked(await db.from('site_accounts').select('id').eq('username', username).maybeSingle());
      if (existing && existing.id !== exceptId) throw new AccessError(409, 'That username is already in use.');
    }
    return username;
  }
  async function authorize(token, kind) {
    if (!validToken(token)) throw new AccessError(401, 'Please sign in.');
    const user = checked(await db.rpc('site_authorize_session', { p_hash: digest(token), p_kind: kind }));
    if (!user) throw new AccessError(401, 'Your session has ended. Please sign in again.');
    return user;
  }
  async function mint(account, kind, parentToken, deadline) {
    const token = randomBytes(32).toString('hex');
    let expiresAt = deadline || expires(kind === 'admin' ? 3600000 : (await settings()).session_hours * 3600000);
    if (kind === 'member' && account.role !== 'admin' && account.access_expires_at && account.access_expires_at < expiresAt) expiresAt = account.access_expires_at;
    checked(await db.from('site_sessions').insert({
      token_hash: digest(token), user_id: account.id, kind, expires_at: expiresAt,
      parent_hash: parentToken ? digest(parentToken) : null,
    }));
    return { token, expiresAt, user: { id: account.id, email: account.email, name: account.display_name, role: account.role } };
  }
  async function revoke(userId) {
    checked(await db.from('site_sessions').delete().eq('user_id', userId));
  }
  async function verifyPassword(email, password) {
    if (typeof password !== 'string' || password.length > 128) throw new AccessError(401, 'Username, email, or password is incorrect.');
    const client = authClient();
    const result = await client.auth.signInWithPassword({ email, password });
    if (result.error || !result.data?.user) throw new AccessError(401, 'Username, email, or password is incorrect.');
    // Our own scoped sessions are revocable immediately; Supabase tokens stay off the frontend.
    await client.auth.signOut({ scope: 'local' });
    return result.data.user;
  }
  async function status() {
    const account = await accountByEmail(owner);
    return { configured: true, setupAvailable: !account?.activated };
  }
  async function setup(body, ip) {
    await rate('setup-ip:' + ip, 3, 3600);
    const email = emailCheck(body.email);
    if (email !== owner) return { message: 'If the address is the site owner, a setup email will be sent.' };
    await rate('setup-owner', 3, 3600);
    const existing = await accountByEmail(owner);
    if (existing?.activated) throw new AccessError(409, 'Administrator setup is already complete. Sign in instead.');
    const redirectTo = new URL('access.html?flow=setup', siteUrl).href;
    if (existing) {
      const result = await authClient().auth.resetPasswordForEmail(owner, { redirectTo });
      if (result.error) throw new AccessError(503, 'The setup email could not be sent. Check Supabase email settings.');
    } else {
      const result = await db.auth.admin.inviteUserByEmail(owner, { redirectTo });
      if (result.error || !result.data?.user) throw new AccessError(503, 'The setup email could not be sent. Check Supabase email settings.');
      checked(await db.from('site_accounts').insert({ id: result.data.user.id, email: owner, display_name: 'Site administrator', role: 'admin', enabled: true, activated: false }));
    }
    return { message: 'Check your inbox for the administrator setup link. Open it to choose your password.' };
  }
  async function completeSetup(body, ip) {
    await rate('complete-setup:' + ip, 10, 900);
    passwordCheck(body.password);
    if (typeof body.accessToken !== 'string' || body.accessToken.length > 8192) throw new AccessError(401, 'The setup link is invalid or expired.');
    const result = await db.auth.getUser(body.accessToken);
    const user = result.data?.user;
    if (result.error || !user || user.email?.toLowerCase() !== owner || !user.email_confirmed_at) throw new AccessError(401, 'The setup link is invalid or expired.');
    const account = await accountByEmail(owner);
    if (!account || account.id !== user.id || account.activated) throw new AccessError(409, 'Administrator setup is already complete or unavailable.');
    const update = await db.auth.admin.updateUserById(user.id, { password: body.password });
    if (update.error) throw new AccessError(400, 'The password could not be saved. Choose a stronger password and try again.');
    checked(await db.from('site_accounts').update({ activated: true }).eq('id', user.id));
    await revoke(user.id);
    await log(account, 'admin_setup');
    return { message: 'Administrator password saved. You can now sign in to the admin page.' };
  }
  async function login(body, ip) {
    const identifier = String(body.identifier ?? body.email ?? '').trim().toLowerCase();
    const kind = body.admin === true ? 'admin' : 'member';
    await rate('login-ip:' + ip, 30);
    if (!identifier || identifier.length > 254) throw new AccessError(401, 'Username, email, or password is incorrect.');
    const account = identifier.includes('@')
      ? await accountByEmail(identifier)
      : checked(await db.from('site_accounts').select('*').eq('username', identifier).maybeSingle());
    // Username and email attempts share the same limit for an existing account.
    await rate('login-account:' + (account?.id || identifier), 10);
    if (!account) throw new AccessError(401, 'Username, email, or password is incorrect.');
    const email = account.email;
    let user;
    try { user = await verifyPassword(email, body.password); }
    catch (error) {
      const known = await accountByEmail(email);
      if (known) await log(known, 'failed_sign_in');
      throw error;
    }
    if (!account || account.id !== user.id || !account.enabled || !account.activated) throw new AccessError(403, 'This account does not have access. Contact the administrator.');
    if (kind === 'admin' && account.role !== 'admin') throw new AccessError(403, 'Administrator access is required.');
    if (account.role !== 'admin' && account.access_expires_at && new Date(account.access_expires_at).getTime() <= now()) throw new AccessError(403, 'Your account access has expired. Contact the administrator.');
    if (kind === 'member') await featureAccess(account, 'login');
    const session = await mint(account, kind);
    await log(account, kind === 'admin' ? 'admin_sign_in' : 'sign_in');
    return session;
  }
  async function dispatch(action, body, token, ip) {
    if (action === 'status') return status();
    if (action === 'setup') return setup(body, ip);
    if (action === 'complete-setup') return completeSetup(body, ip);
    if (action === 'login') return login(body, ip);
    const adminAction = ['admin-data', 'create-user', 'update-user', 'admin-password', 'admin-logout', 'admin-profile', 'admin-settings', 'revoke-session', 'revoke-user-sessions', 'revoke-member-sessions'].includes(action);
    const account = await authorize(token, adminAction ? 'admin' : 'member');
    if (action === 'me') {
      const config = await settings();
      return { user: { ...account, settings: { activity_logging: config.activity_logging, retention_days: config.retention_days, games_enabled: config.games_enabled, maintenance_enabled: config.maintenance_enabled, maintenance_message: config.maintenance_message } } };
    }
    if (action === 'feature') {
      if (!['workspace','games'].includes(body.feature)) throw new AccessError(400, 'Choose a workspace feature.');
      await featureAccess(account, body.feature); return { ok: true };
    }
    if (action === 'enter' || action === 'presence') {
      await rate('presence:' + account.id, 90, 60);
      const feature = body.feature === 'games' ? 'games' : 'workspace';
      const config = await settings();
      await featureAccess(account, feature, config);
      checked(await db.from('site_accounts').update({ last_seen_at: new Date(now()).toISOString() }).eq('id', account.id));
      if (body.tabId) {
        if (!/^[a-f0-9-]{36}$/i.test(body.tabId)) throw new AccessError(400, 'Invalid tab.');
        checked(await db.rpc('site_touch_tab', { p_hash: digest(token), p_id: body.tabId, p_feature: feature, p_visible: body.visible !== false }));
      }
      if (action === 'enter') await log(account, 'workspace_open');
      return { ok: true, settings: { activity_logging: config.activity_logging, retention_days: config.retention_days, games_enabled: config.games_enabled } };
    }
    if (action === 'tab-close') {
      if (typeof body.tabId !== 'string' || !/^[a-f0-9-]{36}$/i.test(body.tabId)) throw new AccessError(400, 'Invalid tab.');
      checked(await db.from('site_workspace_tabs').delete().eq('id', body.tabId).eq('session_hash', digest(token)));
      return { ok: true };
    }
    if (action === 'activity') {
      await featureAccess(account, 'workspace');
      const config = await settings();
      if (!config.activity_logging) return { ok: true };
      const details = sanitizeActivity(body);
      if (!details) throw new AccessError(400, 'Invalid activity.');
      await rate('activity:' + account.id, 60, 60);
      checked(await db.from('site_activity').insert({ user_id: account.id, ...details }));
      return { ok: true };
    }
    if (action === 'relay') {
      await featureAccess(account, 'workspace');
      await rate('relay:' + account.id, 60, 60);
      return mint(account, 'relay', token, account.expires_at);
    }
    if (action === 'logout' || action === 'admin-logout') {
      checked(await db.from('site_sessions').delete().eq('token_hash', digest(token)));
      await log(account, 'sign_out');
      return { ok: true };
    }
    if (action === 'password' || action === 'admin-password') {
      passwordCheck(body.password);
      await rate('password:' + account.id, 5);
      await verifyPassword(account.email, body.currentPassword);
      const result = await db.auth.admin.updateUserById(account.id, { password: body.password });
      if (result.error) throw new AccessError(400, 'The password could not be saved. Choose a stronger password.');
      await revoke(account.id);
      await log(account, 'password_changed');
      return { message: 'Password changed. Sign in again with your new password.' };
    }
    if (action === 'admin-profile') {
      const username = await uniqueUsername(body.username, account.id);
      checked(await db.from('site_accounts').update({ username }).eq('id', account.id));
      await log(account, 'account_updated');
      return { message: username ? 'Administrator username saved. You can sign in with your username or email.' : 'Username removed. Continue signing in with your email.' };
    }
    if (action === 'admin-data') {
      checked(await db.rpc('site_cleanup'));
      const users = checked(await db.from('site_accounts').select('id,email,username,display_name,role,enabled,activated,created_at,last_seen_at,can_browse,can_play,access_expires_at').order('created_at', { ascending: false }).limit(500));
      const events = checked(await db.from('site_access_events').select('id,email,event,created_at').gte('created_at', new Date(now() - 30 * 86400000).toISOString()).order('created_at', { ascending: false }).limit(200));
      const config = await settings();
      const sessions = checked(await db.from('site_sessions').select('id,user_id,created_at,expires_at').eq('kind', 'member').gte('expires_at', new Date(now()).toISOString()).order('created_at', { ascending: false }).limit(1000));
      const tabs = checked(await db.from('site_workspace_tabs').select('id,user_id,feature,visible,last_seen_at').gte('last_seen_at', new Date(now() - 120000).toISOString()).order('last_seen_at', { ascending: false }).limit(1000));
      const activity = checked(await db.from('site_activity').select('id,user_id,kind,domain,query,created_at').gte('created_at', new Date(now() - config.retention_days * 86400000).toISOString()).order('created_at', { ascending: false }).limit(500));
      const stats = checked(await db.rpc('site_admin_stats'));
      return { users, events, settings: config, sessions, tabs, activity, stats };
    }
    if (action === 'admin-settings') {
      const updates = {};
      for (const key of ['activity_logging','games_enabled','maintenance_enabled']) {
        if (typeof body[key] !== 'boolean') throw new AccessError(400, 'Check the site settings.');
        updates[key] = body[key];
      }
      for (const [key,min,max] of [['retention_days',7,30],['session_hours',1,24],['session_limit',1,20]]) {
        if (!Number.isInteger(body[key]) || body[key] < min || body[key] > max || (key === 'retention_days' && ![7,14,30].includes(body[key]))) throw new AccessError(400, 'Check the site settings.');
        updates[key] = body[key];
      }
      const message = String(body.maintenance_message || '').trim();
      if (!message || message.length > 200) throw new AccessError(400, 'Use a maintenance message between 1 and 200 characters.');
      updates.maintenance_message = message;
      checked(await db.from('site_settings').update(updates).eq('id', true));
      await log(account, 'site_settings_changed');
      return { message: 'Site settings saved. Session duration and limits apply to new sign-ins. Permissions take effect within 60 seconds.' };
    }
    if (action === 'revoke-session' || action === 'revoke-user-sessions' || action === 'revoke-member-sessions') {
      if (action !== 'revoke-member-sessions' && (typeof body.id !== 'string' || !/^[a-f0-9-]{36}$/i.test(body.id))) throw new AccessError(400, 'Choose an account or session.');
      if (action === 'revoke-member-sessions') {
        const members = checked(await db.from('site_accounts').select('id,email').eq('role', 'member'));
        for (const member of members) {
          checked(await db.from('site_sessions').delete().eq('user_id', member.id).eq('kind', 'member'));
        }
        await log(account, 'all_member_sessions_ended');
      } else {
        let targetId = body.id;
        if (action === 'revoke-session') {
          const session = checked(await db.from('site_sessions').select('user_id').eq('id', body.id).eq('kind', 'member').maybeSingle());
          if (!session) throw new AccessError(404, 'That session has already ended.');
          targetId = session.user_id;
        }
        if (typeof targetId !== 'string' || !/^[a-f0-9-]{36}$/i.test(targetId)) throw new AccessError(400, 'Choose an account or session.');
        const target = checked(await db.from('site_accounts').select('*').eq('id', targetId).maybeSingle());
        if (!target || target.role === 'admin') throw new AccessError(403, 'Administrator sessions are protected.');
        let query = db.from('site_sessions').delete().eq('user_id', target.id).eq('kind', 'member');
        if (action === 'revoke-session') query = query.eq('id', body.id);
        checked(await query);
        await log(target, action === 'revoke-session' ? 'session_ended_by_admin' : 'account_sessions_ended', account);
      }
      return { message: 'Sessions ended. Open relay connections close within 30 seconds.' };
    }
    if (action === 'create-user') {
      await rate('admin-create:' + account.id, 30, 3600);
      const email = emailCheck(body.email); const name = displayName(body.name); passwordCheck(body.password);
      if (email === owner || await accountByEmail(email)) throw new AccessError(409, 'That account already exists.');
      const username = await uniqueUsername(body.username);
      const result = await db.auth.admin.createUser({ email, password: body.password, email_confirm: true });
      if (result.error || !result.data?.user) throw new AccessError(400, 'The account could not be created. Check the email and password.');
      const member = { id: result.data.user.id, email, username, display_name: name, role: 'member', enabled: true };
      try { checked(await db.from('site_accounts').insert(member)); }
      catch (error) { await db.auth.admin.deleteUser(member.id); throw error; }
      await log(member, 'account_created', account);
      return { message: 'Account created. Share the login details with this person privately.' };
    }
    if (action === 'update-user') {
      if (typeof body.id !== 'string' || !/^[a-f0-9-]{36}$/i.test(body.id)) throw new AccessError(400, 'Choose an account.');
      const target = checked(await db.from('site_accounts').select('*').eq('id', body.id).maybeSingle());
      if (!target || target.role === 'admin') throw new AccessError(403, 'Use administrator password settings to change your own account.');
      const updates = {};
      if (body.username !== undefined) updates.username = await uniqueUsername(body.username, target.id);
      if (body.name !== undefined) updates.display_name = displayName(body.name);
      if (typeof body.enabled === 'boolean') updates.enabled = body.enabled;
      for (const key of ['can_browse','can_play']) if (typeof body[key] === 'boolean') updates[key] = body[key];
      if (body.access_expires_at !== undefined) {
        const value = body.access_expires_at;
        if (value !== null && (typeof value !== 'string' || !Number.isFinite(new Date(value).getTime()))) throw new AccessError(400, 'Choose a valid access expiry date.');
        updates.access_expires_at = value === null ? null : new Date(value).toISOString();
      }
      if (body.password) {
        passwordCheck(body.password);
        const result = await db.auth.admin.updateUserById(target.id, { password: body.password });
        if (result.error) throw new AccessError(400, 'The password could not be saved.');
        await revoke(target.id);
        await log(target, 'password_reset', account);
      }
      if (Object.keys(updates).length) {
        checked(await db.from('site_accounts').update(updates).eq('id', target.id));
        if (updates.enabled === false) await revoke(target.id);
        await log(target, updates.enabled !== undefined && updates.enabled !== target.enabled ? (updates.enabled ? 'account_enabled' : 'account_disabled') : 'account_updated', account);
      }
      return { message: 'Account updated.' };
    }
    throw new AccessError(404, 'Unknown action.');
  }
  return { authorize, dispatch };
}
let service;
export function getAccessService() {
  if (service) return service;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ownerEmail = process.env.SITE_OWNER_EMAIL;
  if (!url || !key || !ownerEmail) throw new AccessError(503, 'Account setup is not configured yet. The owner must connect Supabase.');
  const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
  service = createAccessService({
    db: createClient(url, key, options), authClient: () => createClient(url, key, options),
    ownerEmail, siteUrl: process.env.AUTH_SITE_URL || 'https://scramjet-xi.vercel.app/',
  });
  return service;
}
export async function authorizeRelay(req) {
  const token = new URL(req.url, 'http://localhost').searchParams.get('ticket');
  if (!validToken(token)) throw new AccessError(401, 'Please sign in.');
  const service = getAccessService();
  const user = await service.authorize(token, 'relay');
  return { expiresAt: user.expires_at, revalidate: () => service.authorize(token, 'relay') };
}
