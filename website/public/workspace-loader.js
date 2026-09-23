import { requireMember } from './auth-client.mjs';
try {
  const user = await requireMember();
  if (user) {
    document.getElementById('signed-in-name').textContent = user.display_name;
    document.getElementById('admin-link').hidden = user.role !== 'admin';
    document.body.classList.remove('auth-loading');
    document.getElementById('auth-status').hidden = true;
    await import('./app.js');
  }
} catch {
  document.getElementById('auth-status-text').textContent = 'Sign-in could not be checked. Reload this page or return to sign in.';
}
