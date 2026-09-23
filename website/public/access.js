import { accountApi, saveMember, memberSession, clearMember, signOut } from './auth-client.mjs';
import { appUrl } from './runtime.mjs';
const $ = id => document.getElementById(id);
const show = (text, error = false) => { $('message').textContent = text; $('message').classList.toggle('error', error); };
const fragment = new URLSearchParams(location.hash.slice(1));
let setupAccessToken = fragment.get('access_token');
if (location.hash) history.replaceState(null, '', location.pathname + location.search);
async function submit(form, action) {
  const button = form.querySelector('button[type=submit]');
  button.disabled = true;
  try { await action(Object.fromEntries(new FormData(form))); }
  catch (error) { show(error.message || 'Something went wrong. Please try again.', true); }
  finally { button.disabled = false; form.querySelectorAll('input[type=password]').forEach(input => { input.value = ''; }); }
}
function matching(fields) { if (fields.password !== fields.confirm) throw new Error('The passwords do not match.'); }
$('login-form').addEventListener('submit', event => { event.preventDefault(); submit(event.currentTarget, async fields => {
  const session = await accountApi('login', fields, '');
  saveMember(session); location.replace(appUrl('workspace.html'));
}); });
$('setup-form').addEventListener('submit', event => { event.preventDefault(); submit(event.currentTarget, async fields => {
  show((await accountApi('setup', fields, '')).message);
}); });
$('complete-form').addEventListener('submit', event => { event.preventDefault(); submit(event.currentTarget, async fields => {
  matching(fields);
  const result = await accountApi('complete-setup', { accessToken: setupAccessToken, password: fields.password }, '');
  setupAccessToken = null; $('complete-card').hidden = true; $('login-card').hidden = false; show(result.message);
}); });
$('password-form').addEventListener('submit', event => { event.preventDefault(); submit(event.currentTarget, async fields => {
  matching(fields); const result = await accountApi('password', fields);
  clearMember(); $('member-card').hidden = true; $('login-card').hidden = false; show(result.message);
}); });
$('logout').addEventListener('click', signOut);
try {
  if (setupAccessToken) {
    $('complete-card').hidden = false; $('login-card').hidden = true; show('Choose a password with at least 12 characters.');
  } else {
    const status = await accountApi('status', {}, '');
    $('setup-card').hidden = !status.setupAvailable;
    show(status.setupAvailable ? 'The owner needs to finish administrator setup before accounts can be used.' : 'Enter your email and password to continue.');
    if (memberSession()) {
      try {
        const { user } = await accountApi('me');
        $('member-name').textContent = user.display_name; $('member-card').hidden = false; $('login-card').hidden = true; show('You are signed in.');
      } catch (error) { if (error.status === 401) clearMember(); else throw error; }
    }
  }
} catch (error) { show(error.message, true); }
