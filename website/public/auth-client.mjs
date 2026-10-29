import { appUrl } from './runtime.mjs';
const storageKey = 'canvas.member-session';
export function memberSession() {
  try {
    const value = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
    if (value?.token && new Date(value.expiresAt).getTime() > Date.now()) return value;
  } catch {}
  return null;
}
export function saveMember(value) { sessionStorage.setItem(storageKey, JSON.stringify(value)); }
export function clearMember() { sessionStorage.removeItem(storageKey); relayCredential = null; }
export async function accountApi(action, fields = {}, token = memberSession()?.token, options = {}) {
  let response;
  try { response = await fetch(window.SCRAMJET_CONFIG?.api || appUrl('api/access').href, {
    method: 'POST', credentials: 'omit', cache: 'no-store', keepalive: options.keepalive === true,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    // Free hosting can take about a minute to wake after being idle. Never replay
    // a login or other mutation automatically when a request times out.
    body: JSON.stringify({ ...fields, action }), signal: AbortSignal.timeout(90000),
  }); } catch (error) {
    throw new Error(error.name === 'TimeoutError'
      ? 'The account server is taking too long to respond. Free hosting may be waking up. Wait a minute, then try again.'
      : 'Could not connect to the account server. It may be offline or suspended after reaching its hosting allowance, or your network may block it. If retrying after a minute does not help, the site administrator must check the hosting dashboard.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const unavailable = response.status === 402
      ? 'The hosting provider has disabled the account server. The site administrator must check its usage allowance in the hosting dashboard.'
      : response.status === 503
        ? 'The account server is unavailable. It may be waking up, offline, or suspended by its host. If retrying after a minute does not help, the site administrator must check the hosting dashboard.'
        : 'The account service is unavailable. Please try again.';
    const error = new Error(data.error || unavailable); error.status = response.status; throw error;
  }
  return data;
}
export function signInUrl() { return appUrl('access.html'); }
export async function requireMember() {
  if (!memberSession()) { location.replace(signInUrl()); return null; }
  try { return (await accountApi('me')).user; }
  catch (error) { if (error.status === 401 || error.status === 403) { clearMember(); location.replace(signInUrl()); return null; } throw error; }
}
let relayCredential;
export async function authorizedRelayUrl(refresh = false) {
  if (refresh || !relayCredential || new Date(relayCredential.expiresAt).getTime() < Date.now() + 30000) relayCredential = await accountApi('relay');
  const address = window.SCRAMJET_CONFIG?.wisp || `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/api/wisp/`;
  const url = new URL(address);
  url.searchParams.set('ticket', relayCredential.token);
  // Retain the trailing slash accepted by both current and older transport clients.
  return url.href + '&transport=/';
}
export async function signOut() {
  try { await accountApi('logout'); } finally { clearMember(); location.replace(signInUrl()); }
}
