import { accountApi } from './auth-client.mjs';
import { activityFromUrl } from './activity-details.mjs';
let logging = true;
let previous = '', previousAt = 0;
export function showActivityNotice(config) {
  logging = config.activity_logging;
  document.querySelectorAll('[data-activity-notice]').forEach(node => {
    node.textContent = logging
      ? `Administrator visibility: submitted web searches and page domains are recorded for up to ${config.retention_days} days. Passwords and form contents are excluded.`
      : 'Search and page-domain logging is off. Account sign-ins and workspace visits remain visible to the administrator for 30 days.';
  });
}
export function recordNavigation(url) {
  if (!logging) return;
  const activity = activityFromUrl(url);
  if (!activity) return;
  const key = JSON.stringify(activity);
  if (previous === key && Date.now() - previousAt < 10000) return;
  previous = key; previousAt = Date.now();
  accountApi('activity', activity).catch(() => {}); // Analytics never block a page load.
}
export function startPresence(feature, onBlocked) {
  const tabId = crypto.randomUUID();
  let timer, stopped = false;
  const beat = async (action = 'presence') => {
    try {
      const result = await accountApi(action, { tabId, feature, visible: !document.hidden });
      showActivityNotice(result.settings);
    } catch (error) {
      if (error.status === 401 || error.status === 403) { stopped = true; clearInterval(timer); onBlocked(error); }
    }
  };
  const resume = () => { if (!stopped) { clearInterval(timer); beat(); timer = setInterval(() => beat(), 60000); } };
  beat('enter'); timer = setInterval(() => beat(), 60000);
  document.addEventListener('visibilitychange', () => { if (!stopped) beat(); });
  window.addEventListener('pagehide', () => {
    clearInterval(timer);
    accountApi('tab-close', { tabId }, undefined, { keepalive:true }).catch(() => {});
  });
  window.addEventListener('pageshow', event => { if (event.persisted) resume(); });
  return () => { stopped = true; clearInterval(timer); };
}
