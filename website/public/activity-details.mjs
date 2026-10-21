// Only top-level destinations and recognized, submitted search queries are recorded.
// Paths, arbitrary URL parameters, fragments, credentials, forms and keystrokes are excluded.
const clean = value => String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 160);
function searchKey(domain, path) {
  if (/^(www\.)?google\.com$/.test(domain) && path === '/search') return 'q';
  if (/^(www\.)?bing\.com$/.test(domain) && path === '/search') return 'q';
  if (/^(www\.)?duckduckgo\.com$/.test(domain) && path === '/') return 'q';
  if (/^(www\.|m\.)?youtube\.com$/.test(domain) && path === '/results') return 'search_query';
  return null;
}
export function activityFromUrl(value) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    const key = searchKey(url.hostname, url.pathname);
    const query = key ? clean(url.searchParams.get(key)) : '';
    return { kind: query ? 'search' : 'visit', domain: url.hostname, query };
  } catch { return null; }
}
export function sanitizeActivity(value) {
  if (!value || typeof value.domain !== 'string' || value.domain.length > 253 || !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(value.domain)) return null;
  const searchDomains = /^(?:(?:www\.)?(?:google\.com|bing\.com|duckduckgo\.com)|(?:www\.|m\.)?youtube\.com)$/;
  const query = value.kind === 'search' && searchDomains.test(value.domain) ? clean(value.query) : '';
  return { kind: query ? 'search' : 'visit', domain: value.domain, query };
}
export function csvCell(value) {
  let text = String(value ?? '');
  if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
