export const VALID_STATES = new Set(['PRE', 'IN', 'POST', 'BYE']);

export function esc(str) {
  if (str == null) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function safeLogoUrl(url) {
  if (!url || !String(url).startsWith('https://')) return '';
  return String(url);
}
