import { createHash, randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

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
function checked(result) {
  if (result.error) throw new AccessError(503, 'Account storage is unavailable. Please try again later.');
  return result.data;
}
export function createAccessService({ db, authClient, ownerEmail, siteUrl, now = () => Date.now() }) {
  const owner = ownerEmail.trim().toLowerCase();
  const expires = milliseconds => new Date(now() + milliseconds).toISOString();
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
  async function authorize(token, kind) {
    if (!validToken(token)) throw new AccessError(401, 'Please sign in.');
    const user = checked(await db.rpc('site_authorize_session', { p_hash: digest(token), p_kind: kind }));
    if (!user) throw new AccessError(401, 'Your session has ended. Please sign in again.');
    return user;
  }
  async function mint(account, kind, parentToken, deadline) {
    const token = randomBytes(32).toString('hex');
    const expiresAt = deadline || expires(kind === 'admin' ? 3600000 : 14400000);
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
    if (typeof password !== 'string' || password.length > 128) throw new AccessError(401, 'Email or password is incorrect.');
    const client = authClient();
    const result = await client.auth.signInWithPassword({ email, password });
    if (result.error || !result.data?.user) throw new AccessError(401, 'Email or password is incorrect.');
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
    const email = emailCheck(body.email);
    const kind = body.admin === true ? 'admin' : 'member';
    await rate('login-ip:' + ip, 30);
    await rate('login-email:' + email, 10);
    let user;
    try { user = await verifyPassword(email, body.password); }
    catch (error) {
      const known = await accountByEmail(email);
      if (known) await log(known, 'failed_sign_in');
      throw error;
    }
    const account = await accountByEmail(email);
    if (!account || account.id !== user.id || !account.enabled || !account.activated) throw new AccessError(403, 'This account does not have access. Contact the administrator.');
    if (kind === 'admin' && account.role !== 'admin') throw new AccessError(403, 'Administrator access is required.');
    await log(account, kind === 'admin' ? 'admin_sign_in' : 'sign_in');
    return mint(account, kind);
  }
  async function dispatch(action, body, token, ip) {
    if (action === 'status') return status();
    if (action === 'setup') return setup(body, ip);
    if (action === 'complete-setup') return completeSetup(body, ip);
    if (action === 'login') return login(body, ip);
    const adminAction = ['admin-data', 'create-user', 'update-user', 'admin-password', 'admin-logout'].includes(action);
    const account = await authorize(token, adminAction ? 'admin' : 'member');
    if (action === 'me') return { user: account };
    if (action === 'enter' || action === 'presence') {
      checked(await db.from('site_accounts').update({ last_seen_at: new Date(now()).toISOString() }).eq('id', account.id));
      if (action === 'enter') await log(account, 'workspace_open');
      return { ok: true };
    }
    if (action === 'relay') {
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
    if (action === 'admin-data') {
      checked(await db.rpc('site_cleanup'));
      const users = checked(await db.from('site_accounts').select('id,email,display_name,role,enabled,activated,created_at,last_seen_at').order('created_at', { ascending: false }).limit(500));
      const events = checked(await db.from('site_access_events').select('id,email,event,created_at').gte('created_at', new Date(now() - 30 * 86400000).toISOString()).order('created_at', { ascending: false }).limit(200));
      return { users, events };
    }
    if (action === 'create-user') {
      await rate('admin-create:' + account.id, 30, 3600);
      const email = emailCheck(body.email); const name = displayName(body.name); passwordCheck(body.password);
      if (email === owner || await accountByEmail(email)) throw new AccessError(409, 'That account already exists.');
      const result = await db.auth.admin.createUser({ email, password: body.password, email_confirm: true });
      if (result.error || !result.data?.user) throw new AccessError(400, 'The account could not be created. Check the email and password.');
      const member = { id: result.data.user.id, email, display_name: name, role: 'member', enabled: true };
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
      if (body.name !== undefined) updates.display_name = displayName(body.name);
      if (typeof body.enabled === 'boolean') updates.enabled = body.enabled;
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
        await log(target, updates.enabled === false ? 'account_disabled' : updates.enabled === true ? 'account_enabled' : 'account_updated', account);
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
