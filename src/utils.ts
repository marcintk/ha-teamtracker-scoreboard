import type { GameState } from './types.js';

export const VALID_STATES: ReadonlySet<GameState> = new Set(['PRE', 'IN', 'POST', 'BYE']);

export function esc(str: unknown): string {
  if (str == null) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function safeLogoUrl(url: unknown): string {
  if (!url || !String(url).startsWith('https://')) return '';
  return String(url);
}
