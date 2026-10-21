import { accountApi } from './auth-client.mjs';
import { csvCell } from './activity-details.mjs';
let adminToken = ''; // Administrator tokens stay only in this page's memory.
let users = [], activity = [], refreshTimer, settingsDirty = false, settingsSnapshot;
const $ = id => document.getElementById(id);
const show = (text, error = false) => { $('message').textContent = text; $('message').classList.toggle('error', error); };
const api = (action, fields = {}) => accountApi(action, fields, adminToken);
function lock(message = 'Administrator signed out.') {
  adminToken = ''; users = []; activity = []; settingsDirty = false; settingsSnapshot = null; clearInterval(refreshTimer);
  $('admin-panel').hidden = true; $('admin-login').hidden = false;
  for (const id of ['users','events','activity','tabs','sessions']) $(id).replaceChildren();
  show(message);
}
function cell(text) { const td = document.createElement('td'); td.textContent = text; return td; }
function row(values) { const tr = document.createElement('tr'); values.forEach(value => tr.append(cell(value))); return tr; }
const date = value => value ? new Date(value).toLocaleString() : 'Not yet';
const userFor = id => users.find(user => user.id === id);
const accountName = id => { const user = userFor(id); return user ? `${user.display_name} · ${user.username || user.email}` : 'Unknown account'; };
const eventNames = { sign_in:'Signed in',failed_sign_in:'Failed sign-in',admin_sign_in:'Administrator signed in',workspace_open:'Opened workspace / games',sign_out:'Signed out',account_created:'Account created',account_disabled:'Account disabled',account_enabled:'Account enabled',account_updated:'Account / permissions updated',password_changed:'Password changed',password_reset:'Password reset by administrator',admin_setup:'Administrator setup completed',site_settings_changed:'Site settings changed',session_ended_by_admin:'Session ended by administrator',account_sessions_ended:'Account sessions ended',all_member_sessions_ended:'All member sessions ended' };
function fillAccounts(select, includeAdmin) {
  const selected = select.value;
  const placeholder = document.createElement('option'); placeholder.value = ''; placeholder.textContent = includeAdmin ? 'All accounts' : 'Choose an account';
  select.replaceChildren(placeholder, ...users.filter(user => includeAdmin || user.role !== 'admin').map(user => {
    const option = document.createElement('option'); option.value = user.id; option.textContent = accountName(user.id); return option;
  })); select.value = selected;
}
function renderUsers() {
  const query = $('account-filter').value.trim().toLowerCase();
  const visible = users.filter(user => `${user.display_name} ${user.username || ''} ${user.email}`.toLowerCase().includes(query));
  $('users').replaceChildren(...visible.map(user => {
    const access = user.role === 'admin' ? 'Administrator' : [user.enabled ? 'Enabled' : 'Disabled',user.can_browse ? 'Workspace' : 'No workspace',user.can_play ? 'Games menu' : 'No games menu',user.access_expires_at ? 'Until ' + date(user.access_expires_at) : 'No expiry'].join(' · ');
    return row([user.display_name,user.username || '—',user.email,access,date(user.last_seen_at)]);
  }));
  if (!visible.length) $('users').append(row(['No matching accounts.','—','—','—','—']));
}
function filteredActivity() {
  const query = $('activity-filter').value.trim().toLowerCase();
  return activity.filter(item => (!$('activity-account').value || item.user_id === $('activity-account').value) && (!$('activity-kind').value || item.kind === $('activity-kind').value) && `${accountName(item.user_id)} ${item.domain} ${item.query}`.toLowerCase().includes(query));
}
function renderActivity() {
  const visible = filteredActivity();
  $('activity').replaceChildren(...visible.map(item => row([date(item.created_at),accountName(item.user_id),item.kind === 'search' ? 'Search' : 'Visit',item.domain,item.query || '—'])));
  if (!visible.length) $('activity').append(row(['—','No matching activity yet.','—','—','—']));
  $('activity-summary').textContent = `${visible.length} matching records from the latest 500 · up to ${settingsSnapshot?.retention_days || 30} days · logging ${settingsSnapshot?.activity_logging ? 'on' : 'off'}.`;
  $('export-activity').disabled = visible.length === 0;
}
function fillSettings(config) {
  $('setting-activity').checked = config.activity_logging; $('setting-games').checked = config.games_enabled;
  $('setting-maintenance').checked = config.maintenance_enabled; $('setting-retention').value = config.retention_days;
  $('setting-hours').value = config.session_hours; $('setting-limit').value = config.session_limit; $('setting-message').value = config.maintenance_message;
}
async function load() {
  const data = await api('admin-data');
  users = data.users; activity = data.activity; settingsSnapshot = data.settings;
  if (document.activeElement !== $('admin-username')) $('admin-username').value = users.find(user => user.role === 'admin')?.username || '';
  $('account-count').textContent = users.length; $('enabled-count').textContent = users.filter(user => user.enabled).length;
  $('session-count').textContent = data.stats.sessions; $('tab-count').textContent = data.stats.active_tabs;
  $('recent-count').textContent = data.stats.online_accounts; $('search-count').textContent = data.stats.searches_today;
  $('updated-at').textContent = 'Updated ' + new Date().toLocaleTimeString() + ' · refreshes every 30 seconds';
  fillAccounts($('user-select'), false); fillAccounts($('activity-account'), true); renderUsers(); renderActivity();
  if (!settingsDirty) fillSettings(data.settings);
  $('sessions').replaceChildren(...data.sessions.map(session => {
    const tr = row([accountName(session.user_id),date(session.created_at),date(session.expires_at)]);
    const action = cell('Administrator protected');
    if (userFor(session.user_id)?.role !== 'admin') {
      action.textContent = ''; const button = document.createElement('button'); button.type = 'button'; button.textContent = 'End session';
      button.addEventListener('click', () => run(button, async () => {
        if (!confirm('End this sign-in session? Its open tabs will lose relay access.')) return;
        const result = await api('revoke-session', { id:session.id }); await load(); show(result.message);
      })); action.append(button);
    } tr.append(action); return tr;
  }));
  if (!data.sessions.length) $('sessions').append(row(['No unexpired member sign-ins.','—','—','—']));
  $('tabs').replaceChildren(...data.tabs.map(tab => row([accountName(tab.user_id),tab.feature,tab.visible ? 'Foreground' : 'Background',date(tab.last_seen_at)])));
  if (!data.tabs.length) $('tabs').append(row(['No recent tab heartbeats.','—','—','—']));
  $('events').replaceChildren(...data.events.map(event => row([date(event.created_at),event.email,eventNames[event.event] || event.event])));
  if (!data.events.length) $('events').append(row(['—','No access events yet.','—']));
}
async function run(button, action) {
  button.disabled = true;
  try { await action(); }
  catch (error) { if (error.status === 401) lock('Your administrator session ended. Sign in again.'); else show(error.message, true); }
  finally { button.disabled = false; }
}
function submit(form, action) {
  return run(form.querySelector('button[type=submit]'), async () => {
    try { await action(Object.fromEntries(new FormData(form))); }
    finally { form.querySelectorAll('input[type=password]').forEach(input => { input.value = ''; }); }
  });
}
function onForm(id, action) { $(id).addEventListener('submit', event => { event.preventDefault(); submit(event.currentTarget, action); }); }
onForm('admin-login-form', async fields => {
  const data = await accountApi('login', { ...fields,admin:true }, '');
  adminToken = data.token; $('admin-name').textContent = data.user.email;
  await load(); $('admin-login').hidden = true; $('admin-panel').hidden = false; show('You are signed in as administrator.');
  clearInterval(refreshTimer); refreshTimer = setInterval(() => load().catch(error => { if (error.status === 401) lock(); else show('Dashboard refresh failed. Try Refresh.', true); }), 30000);
});
onForm('create-form', async fields => { const result = await api('create-user',fields); $('create-form').reset(); await load(); show(result.message); });
$('user-select').addEventListener('change', () => {
  const user = userFor($('user-select').value);
  $('edit-username').value = user?.username || ''; $('edit-name').value = user?.display_name || '';
  $('edit-enabled').checked = Boolean(user?.enabled); $('edit-browse').checked = Boolean(user?.can_browse); $('edit-play').checked = Boolean(user?.can_play);
  const expiry = user?.access_expires_at ? new Date(user.access_expires_at) : null;
  $('edit-expiry').value = expiry ? new Date(expiry.getTime() - expiry.getTimezoneOffset()*60000).toISOString().slice(0,16) : '';
});
onForm('edit-form', async fields => {
  const result = await api('update-user',{ ...fields,enabled:$('edit-enabled').checked,can_browse:$('edit-browse').checked,can_play:$('edit-play').checked,access_expires_at:$('edit-expiry').value ? new Date($('edit-expiry').value).toISOString() : null });
  await load(); show(result.message);
});
onForm('admin-profile-form', async fields => { const result = await api('admin-profile',fields); await load(); show(result.message); });
onForm('admin-password-form', async fields => {
  if (fields.password !== fields.confirm) throw new Error('The passwords do not match.');
  const result = await api('admin-password',fields); lock(result.message);
});
$('settings-form').addEventListener('input', () => { settingsDirty = true; });
onForm('settings-form', async () => {
  const retention = Number($('setting-retention').value);
  if (retention < settingsSnapshot.retention_days && !confirm('Shortening retention permanently deletes older search and domain activity on the next refresh. Save these settings?')) return;
  const result = await api('admin-settings',{ activity_logging:$('setting-activity').checked,games_enabled:$('setting-games').checked,maintenance_enabled:$('setting-maintenance').checked,retention_days:retention,session_hours:Number($('setting-hours').value),session_limit:Number($('setting-limit').value),maintenance_message:$('setting-message').value });
  settingsDirty = false; await load(); show(result.message);
});
$('end-user-sessions').addEventListener('click', event => run(event.currentTarget, async () => {
  const id = $('user-select').value; if (!id) throw new Error('Choose an account first.');
  if (!confirm('End all sign-in sessions for this account?')) return;
  const result = await api('revoke-user-sessions',{id}); await load(); show(result.message);
}));
$('end-all-sessions').addEventListener('click', event => run(event.currentTarget, async () => {
  if (!confirm('Sign out all members on every device? Administrator sessions will stay open.')) return;
  const result = await api('revoke-member-sessions'); await load(); show(result.message);
}));
$('refresh').addEventListener('click', event => run(event.currentTarget, async () => { await load(); show('Dashboard refreshed.'); }));
$('admin-logout').addEventListener('click', async () => { try { await api('admin-logout'); } finally { lock(); } });
$('account-filter').addEventListener('input',renderUsers);
for (const id of ['activity-account','activity-kind','activity-filter']) $(id).addEventListener('input',renderActivity);
$('export-activity').addEventListener('click', () => {
  const rows = [['Time (UTC)','Account','Type','Domain','Search'],...filteredActivity().map(item => [item.created_at,accountName(item.user_id),item.kind,item.domain,item.query])];
  const url = URL.createObjectURL(new Blob(['\uFEFF'+rows.map(row => row.map(csvCell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
  const link = document.createElement('a'); link.href = url; link.download = 'workspace-activity-'+new Date().toISOString().slice(0,10)+'.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
});
if (window.top !== window.self) { document.body.replaceChildren(); throw new Error('Open administration in its own tab.'); }
window.addEventListener('pagehide', () => { adminToken = ''; clearInterval(refreshTimer); });
