import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DebugMetrics } from '../src/debug.js';

describe('DebugMetrics', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  describe('track / counts', () => {
    it('records timestamps and returns correct window counts', () => {
      const d = new DebugMetrics();
      d.track('notifications');
      d.track('notifications');
      vi.advanceTimersByTime(30_000);
      d.track('notifications');
      const c = d.counts('notifications');
      expect(c.min1).toBe(3);
      expect(c.min5).toBe(3);
      expect(c.min30).toBe(3);
      expect(c.hour3).toBe(3);
      expect(c.hour6).toBe(3);
    });

    it('excludes entries outside the 1-minute window', () => {
      const d = new DebugMetrics();
      d.track('notifications');
      vi.advanceTimersByTime(61_000);
      d.track('notifications');
      const c = d.counts('notifications');
      expect(c.min1).toBe(1);
      expect(c.min5).toBe(2);
      expect(c.min30).toBe(2);
      expect(c.hour3).toBe(2);
      expect(c.hour6).toBe(2);
    });

    it('excludes entries outside the 5-minute window', () => {
      const d = new DebugMetrics();
      d.track('notifications');
      vi.advanceTimersByTime(301_000);
      d.track('notifications');
      const c = d.counts('notifications');
      expect(c.min1).toBe(1);
      expect(c.min5).toBe(1);
      expect(c.min30).toBe(2);
      expect(c.hour3).toBe(2);
      expect(c.hour6).toBe(2);
    });

    it('excludes entries outside the 30-minute window', () => {
      const d = new DebugMetrics();
      d.track('notifications');
      vi.advanceTimersByTime(1_800_001);
      d.track('notifications');
      const c = d.counts('notifications');
      expect(c.min1).toBe(1);
      expect(c.min5).toBe(1);
      expect(c.min30).toBe(1);
      expect(c.hour1).toBe(2);
      expect(c.hour3).toBe(2);
      expect(c.hour6).toBe(2);
    });

    it('excludes entries outside the 1-hour window', () => {
      const d = new DebugMetrics();
      d.track('notifications');
      vi.advanceTimersByTime(3_600_001);
      d.track('notifications');
      const c = d.counts('notifications');
      expect(c.min1).toBe(1);
      expect(c.min5).toBe(1);
      expect(c.min30).toBe(1);
      expect(c.hour1).toBe(1);
      expect(c.hour3).toBe(2);
      expect(c.hour6).toBe(2);
    });

    it('prunes entries older than 6 hours', () => {
      const d = new DebugMetrics();
      d.track('renders');
      vi.advanceTimersByTime(21_600_001);
      d.track('renders');
      expect(d._data.renders).toHaveLength(1);
    });
  });

  describe('html', () => {
    it('shows "--" timestamp when no render has been tracked yet', () => {
      const d = new DebugMetrics();
      expect(d.html()).toContain('--');
    });

    it('shows the last tracked render timestamp', () => {
      const d = new DebugMetrics();
      const fixed = new Date('2026-06-13T10:01:46.123Z');
      vi.setSystemTime(fixed);
      d.track('renders');
      const pad = (n, w = 2) => String(n).padStart(w, '0');
      const expected = `${pad(fixed.getHours())}:${pad(fixed.getMinutes())}:${pad(fixed.getSeconds())}.${pad(fixed.getMilliseconds(), 3)}`;
      expect(d.html()).toContain(expected);
    });

    it('timestamp uses local time, not UTC', () => {
      const d = new DebugMetrics();
      const fixed = new Date('2026-06-13T10:01:46.123Z');
      vi.setSystemTime(fixed);
      d.track('renders');
      const pad = (n, w = 2) => String(n).padStart(w, '0');
      const expected = `${pad(fixed.getHours())}:${pad(fixed.getMinutes())}:${pad(fixed.getSeconds())}.${pad(fixed.getMilliseconds(), 3)}`;
      expect(d.html()).toContain(expected);
    });

    it('contains all column headers', () => {
      const d = new DebugMetrics();
      const h = d.html();
      expect(h).toContain('1m');
      expect(h).toContain('5m');
      expect(h).toContain('30m');
      expect(h).toContain('1h');
      expect(h).toContain('3h');
      expect(h).toContain('6h');
    });

    it('contains all metric row labels', () => {
      const d = new DebugMetrics();
      const h = d.html();
      expect(h).toContain('events');
      expect(h).toContain('accepted');
      expect(h).toContain('renders');
    });

    it('is positioned at the bottom', () => {
      const d = new DebugMetrics();
      expect(d.html()).toContain('bottom:0');
    });

    it('has pointer-events:none so it does not block interaction', () => {
      const d = new DebugMetrics();
      expect(d.html()).toContain('pointer-events:none');
    });

    it('column headers are colored orange', () => {
      const d = new DebugMetrics();
      expect(d.html()).toContain('color:orange');
    });

    it('timestamp is colored red', () => {
      const d = new DebugMetrics();
      expect(d.html()).toContain('color:red');
    });

    it('data rows appear before the column header row', () => {
      const d = new DebugMetrics();
      const h = d.html();
      expect(h.indexOf('renders')).toBeLessThan(h.indexOf('1m'));
    });

    it('timestamp is the first cell of the footer row, before the column labels', () => {
      const d = new DebugMetrics();
      const fixed = new Date('2026-06-13T10:01:46.123Z');
      vi.setSystemTime(fixed);
      d.track('renders');
      const pad = (n, w = 2) => String(n).padStart(w, '0');
      const ts = `${pad(fixed.getHours())}:${pad(fixed.getMinutes())}:${pad(fixed.getSeconds())}.${pad(fixed.getMilliseconds(), 3)}`;
      const h = d.html();
      expect(h.indexOf(ts)).toBeLessThan(h.indexOf('1m'));
    });

    it('-- placeholder is the first cell of the footer row, before the column labels', () => {
      const d = new DebugMetrics();
      const h = d.html();
      expect(h.indexOf('--')).toBeLessThan(h.indexOf('1m'));
    });
  });
});
