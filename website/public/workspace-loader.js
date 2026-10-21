import { requireMember } from './auth-client.mjs';
import { accountApi } from './auth-client.mjs';
import { showActivityNotice } from './member-activity.mjs';
try {
  const user = await requireMember();
  if (user) {
    await accountApi('feature', { feature:'workspace' });
    showActivityNotice(user.settings);
    document.querySelector('.games-link').hidden = user.role !== 'admin' && (!user.can_play || !user.settings.games_enabled);
    document.getElementById('signed-in-name').textContent = user.display_name;
    document.getElementById('admin-link').hidden = user.role !== 'admin';
    document.body.classList.remove('auth-loading');
    document.getElementById('auth-status').hidden = true;
    await import('./app.js');
  }
} catch (error) {
  document.getElementById('auth-status-text').textContent = error.message || 'Sign-in could not be checked. Reload this page or return to sign in.';
}
