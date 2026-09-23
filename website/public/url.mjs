export function normalizeAddress(input) {
  const value = input.trim();
  if (!value) throw new Error('Enter a website address or a search.');
  if (/^[a-z][a-z\d+.-]*:/i.test(value) && !/^https?:\/\//i.test(value)) throw new Error('Only http:// and https:// website addresses are supported.');
  if (/^https?:\/\//i.test(value)) {
    const url = new URL(value);
    if (url.username || url.password) throw new Error('Use an address without embedded login details.');
    return url.href;
  }
  if (/^[^\s/]+\.[^\s/]+(?:\/\S*)?$/.test(value)) return new URL('https://' + value).href;
  return 'https://www.google.com/search?q=' + encodeURIComponent(value);
}
