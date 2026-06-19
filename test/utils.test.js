import { describe, expect, it } from 'vitest';
import { esc, safeLogoUrl, VALID_STATES } from '../src/utils.js';

describe('esc', () => {
  it('returns empty string for null and undefined', () => {
    expect(esc(null)).toBe('');
    expect(esc(undefined)).toBe('');
  });

  it('escapes &, <, and >', () => {
    expect(esc('<b>hello & world</b>')).toBe('&lt;b&gt;hello &amp; world&lt;/b&gt;');
  });

  it('converts non-string values to string before escaping', () => {
    expect(esc(42)).toBe('42');
  });

  it('returns plain text unchanged', () => {
    expect(esc('hello')).toBe('hello');
  });
});

describe('safeLogoUrl', () => {
  it('returns https URLs unchanged', () => {
    expect(safeLogoUrl('https://example.com/logo.png')).toBe('https://example.com/logo.png');
  });

  it('rejects http URLs', () => {
    expect(safeLogoUrl('http://example.com/logo.png')).toBe('');
  });

  it('returns empty string for null, undefined, and empty string', () => {
    expect(safeLogoUrl(null)).toBe('');
    expect(safeLogoUrl(undefined)).toBe('');
    expect(safeLogoUrl('')).toBe('');
  });
});

describe('VALID_STATES', () => {
  it('contains PRE, IN, POST, and BYE', () => {
    expect(VALID_STATES.has('PRE')).toBe(true);
    expect(VALID_STATES.has('IN')).toBe(true);
    expect(VALID_STATES.has('POST')).toBe(true);
    expect(VALID_STATES.has('BYE')).toBe(true);
  });

  it('does not contain unrecognised states', () => {
    expect(VALID_STATES.has('UNKNOWN')).toBe(false);
    expect(VALID_STATES.has('')).toBe(false);
  });
});
