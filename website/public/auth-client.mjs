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
export async function accountApi(action, fields = {}, token = memberSession()?.token) {
  const response = await fetch(window.SCRAMJET_CONFIG?.api || appUrl('api/access').href, {
    method: 'POST', credentials: 'omit', cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: JSON.stringify({ ...fields, action }), signal: AbortSignal.timeout(20000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error(data.error || 'The account service is unavailable. Please try again.'); error.status = response.status; throw error; }
  return data;
}
export function signInUrl() { return appUrl('access.html'); }
export async function requireMember() {
  if (!memberSession()) { location.replace(signInUrl()); return null; }
  try { return (await accountApi('me')).user; }
  catch (error) { if (error.status === 401 || error.status === 403) { clearMember(); location.replace(signInUrl()); return null; } throw error; }
}
let relayCredential;
export async function authorizedRelayUrl() {
  if (!relayCredential || new Date(relayCredential.expiresAt).getTime() < Date.now() + 30000) relayCredential = await accountApi('relay');
  const address = window.SCRAMJET_CONFIG?.wisp || `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/api/wisp/`;
  const url = new URL(address);
  url.searchParams.set('ticket', relayCredential.token);
  // libcurl validates the complete URL string, including its query, for a final slash.
  return url.href + '&transport=/';
}
export async function signOut() {
  try { await accountApi('logout'); } finally { clearMember(); location.replace(signInUrl()); }
}
