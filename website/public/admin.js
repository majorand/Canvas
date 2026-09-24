import { accountApi } from './auth-client.mjs';
let adminToken = ''; // Administrator tokens stay only in this page's memory.
let users = [];
let refreshTimer;
const $ = id => document.getElementById(id);
const show = (text, error = false) => { $('message').textContent = text; $('message').classList.toggle('error', error); };
const api = (action, fields = {}) => accountApi(action, fields, adminToken);
function lock(message = 'Administrator signed out.') {
  adminToken = ''; users = []; clearInterval(refreshTimer);
  $('admin-panel').hidden = true; $('admin-login').hidden = false;
  $('users').replaceChildren(); $('events').replaceChildren(); show(message);
}
function cell(text) { const td = document.createElement('td'); td.textContent = text; return td; }
function row(values) { const tr = document.createElement('tr'); values.forEach(value => tr.append(cell(value))); return tr; }
const date = value => value ? new Date(value).toLocaleString() : 'Not yet';
const eventNames = { sign_in: 'Signed in', failed_sign_in: 'Failed sign-in', admin_sign_in: 'Administrator signed in', workspace_open: 'Opened workspace', sign_out: 'Signed out', account_created: 'Account created', account_disabled: 'Account disabled', account_enabled: 'Account enabled', account_updated: 'Account updated', password_changed: 'Password changed', password_reset: 'Password reset by administrator', admin_setup: 'Administrator setup completed' };
async function load() {
  const data = await api('admin-data');
  users = data.users;
  if (document.activeElement !== $('admin-username')) $('admin-username').value = users.find(user => user.role === 'admin')?.username || '';
  const selected = $('user-select').value;
  $('account-count').textContent = users.length;
  $('enabled-count').textContent = users.filter(user => user.enabled).length;
  $('recent-count').textContent = users.filter(user => user.enabled && Date.now() - new Date(user.last_seen_at).getTime() < 120000).length;
  $('users').replaceChildren(...users.map(user => row([user.display_name, user.username || "—", user.email, user.role === 'admin' ? 'Administrator' : user.enabled ? 'Enabled' : 'Disabled', date(user.last_seen_at)])));
  $('events').replaceChildren(...data.events.map(event => row([date(event.created_at), event.email, eventNames[event.event] || event.event])));
  if (!data.events.length) $('events').append(row(['—', 'No access events yet.', '—']));
  const placeholder = document.createElement('option'); placeholder.value = ''; placeholder.textContent = 'Choose an account';
  $('user-select').replaceChildren(placeholder, ...users.filter(user => user.role !== 'admin').map(user => {
    const option = document.createElement('option'); option.value = user.id; option.textContent = user.display_name + ' · ' + user.email; return option;
  }));
  $('user-select').value = selected;
}
async function submit(form, action) {
  const button = form.querySelector('button[type=submit]'); button.disabled = true;
  try { await action(Object.fromEntries(new FormData(form))); }
  catch (error) { if (error.status === 401) lock('Your administrator session ended. Sign in again.'); else show(error.message, true); }
  finally { button.disabled = false; form.querySelectorAll('input[type=password]').forEach(input => { input.value = ''; }); }
}
$('admin-login-form').addEventListener('submit', event => { event.preventDefault(); submit(event.currentTarget, async fields => {
  const data = await accountApi('login', { ...fields, admin: true }, '');
  adminToken = data.token; $('admin-name').textContent = data.user.email;
  await load(); $('admin-login').hidden = true; $('admin-panel').hidden = false; show('You are signed in as administrator.');
  clearInterval(refreshTimer); refreshTimer = setInterval(() => load().catch(error => { if (error.status === 401) lock(); else show('Could not refresh access logs.', true); }), 60000);
}); });
$('create-form').addEventListener('submit', event => { event.preventDefault(); submit(event.currentTarget, async fields => {
  const result = await api('create-user', fields); event.target.reset(); await load(); show(result.message);
}); });
$('user-select').addEventListener('change', () => {
  const user = users.find(user => user.id === $('user-select').value);
  $('edit-username').value = user?.username || '';
  $('edit-name').value = user?.display_name || ''; $('edit-enabled').checked = Boolean(user?.enabled);
});
$('edit-form').addEventListener('submit', event => { event.preventDefault(); submit(event.currentTarget, async fields => {
  const result = await api('update-user', { ...fields, enabled: $('edit-enabled').checked }); await load(); show(result.message);
}); });
$('admin-profile-form').addEventListener('submit', event => { event.preventDefault(); submit(event.currentTarget, async fields => {
  const result = await api('admin-profile', fields); await load(); show(result.message);
}); });
$('admin-password-form').addEventListener('submit', event => { event.preventDefault(); submit(event.currentTarget, async fields => {
  if (fields.password !== fields.confirm) throw new Error('The passwords do not match.');
  const result = await api('admin-password', fields); lock(result.message);
}); });
$('refresh').addEventListener('click', () => load().then(() => show('Access log refreshed.')).catch(error => error.status === 401 ? lock() : show(error.message, true)));
$('admin-logout').addEventListener('click', async () => { try { await api('admin-logout'); } finally { lock(); } });
if (window.top !== window.self) { document.body.replaceChildren(); throw new Error('Open administration in its own tab.'); }
window.addEventListener('pagehide', () => { adminToken = ''; clearInterval(refreshTimer); });
