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
      expect(c.min15).toBe(3);
      expect(c.min30).toBe(3);
      expect(c.hour3).toBe(3);
    });

    it('excludes entries outside the 1-minute window', () => {
      const d = new DebugMetrics();
      d.track('notifications');
      vi.advanceTimersByTime(61_000);
      d.track('notifications');
      const c = d.counts('notifications');
      expect(c.min1).toBe(1);
      expect(c.min5).toBe(2);
      expect(c.min15).toBe(2);
      expect(c.min30).toBe(2);
      expect(c.hour3).toBe(2);
    });

    it('excludes entries outside the 5-minute window', () => {
      const d = new DebugMetrics();
      d.track('notifications');
      vi.advanceTimersByTime(301_000);
      d.track('notifications');
      const c = d.counts('notifications');
      expect(c.min1).toBe(1);
      expect(c.min5).toBe(1);
      expect(c.min15).toBe(2);
      expect(c.min30).toBe(2);
      expect(c.hour3).toBe(2);
    });

    it('excludes entries outside the 15-minute window', () => {
      const d = new DebugMetrics();
      d.track('notifications');
      vi.advanceTimersByTime(900_001);
      d.track('notifications');
      const c = d.counts('notifications');
      expect(c.min1).toBe(1);
      expect(c.min5).toBe(1);
      expect(c.min15).toBe(1);
      expect(c.min30).toBe(2);
      expect(c.hour1).toBe(2);
      expect(c.hour3).toBe(2);
    });

    it('excludes entries outside the 30-minute window', () => {
      const d = new DebugMetrics();
      d.track('notifications');
      vi.advanceTimersByTime(1_800_001);
      d.track('notifications');
      const c = d.counts('notifications');
      expect(c.min1).toBe(1);
      expect(c.min5).toBe(1);
      expect(c.min15).toBe(1);
      expect(c.min30).toBe(1);
      expect(c.hour1).toBe(2);
      expect(c.hour3).toBe(2);
    });

    it('excludes entries outside the 1-hour window', () => {
      const d = new DebugMetrics();
      d.track('notifications');
      vi.advanceTimersByTime(3_600_001);
      d.track('notifications');
      const c = d.counts('notifications');
      expect(c.min1).toBe(1);
      expect(c.min5).toBe(1);
      expect(c.min15).toBe(1);
      expect(c.min30).toBe(1);
      expect(c.hour1).toBe(1);
      expect(c.hour3).toBe(2);
    });

    it('prunes entries older than 3 hours', () => {
      const d = new DebugMetrics();
      d.track('renders');
      vi.advanceTimersByTime(10_800_001);
      d.track('renders');
      expect(d._data.renders).toHaveLength(1);
    });
  });

  describe('tableHtml', () => {
    it('contains all metric row labels', () => {
      const d = new DebugMetrics();
      const h = d.tableHtml();
      expect(h).toContain('events');
      expect(h).toContain('accepted');
      expect(h).toContain('renders');
    });

    it('contains all column headers', () => {
      const d = new DebugMetrics();
      const h = d.tableHtml();
      expect(h).toContain('1m');
      expect(h).toContain('5m');
      expect(h).toContain('15m');
      expect(h).toContain('30m');
      expect(h).toContain('1h');
      expect(h).toContain('3h');
    });

    it('does not contain 6h column', () => {
      const d = new DebugMetrics();
      expect(d.tableHtml()).not.toContain('6h');
    });

    it('does not contain the outer wrapper positioning styles', () => {
      const d = new DebugMetrics();
      expect(d.tableHtml()).not.toContain('position:absolute');
      expect(d.tableHtml()).not.toContain('pointer-events:none');
    });

    it('row labels are colored orange', () => {
      const d = new DebugMetrics();
      const h = d.tableHtml();
      expect(h).toContain('color:orange">events');
      expect(h).toContain('color:orange">accepted');
      expect(h).toContain('color:orange">renders');
    });

    it('shows "--" timestamp when no render has been tracked yet', () => {
      const d = new DebugMetrics();
      expect(d.tableHtml()).toContain('--');
    });

    it('shows the last tracked render timestamp', () => {
      const d = new DebugMetrics();
      const fixed = new Date('2026-06-13T10:01:46.123Z');
      vi.setSystemTime(fixed);
      d.track('renders');
      const pad = (n, w = 2) => String(n).padStart(w, '0');
      const expected = `${pad(fixed.getHours())}:${pad(fixed.getMinutes())}:${pad(fixed.getSeconds())}.${pad(fixed.getMilliseconds(), 3)}`;
      expect(d.tableHtml()).toContain(expected);
    });

    it('appends "(Xs ago)" when render was seconds ago', () => {
      const d = new DebugMetrics();
      vi.setSystemTime(new Date('2026-06-13T10:00:00.000Z'));
      d.track('renders');
      vi.advanceTimersByTime(10_000);
      expect(d.tableHtml()).toContain('(10s ago)');
    });

    it('appends "(Xm ago)" when render was minutes ago', () => {
      const d = new DebugMetrics();
      vi.setSystemTime(new Date('2026-06-13T10:00:00.000Z'));
      d.track('renders');
      vi.advanceTimersByTime(120_000);
      expect(d.tableHtml()).toContain('(2m ago)');
    });

    it('appends "(Xh ago)" when render was hours ago', () => {
      const d = new DebugMetrics();
      vi.setSystemTime(new Date('2026-06-13T10:00:00.000Z'));
      d.track('renders');
      vi.advanceTimersByTime(7_200_000);
      expect(d.tableHtml()).toContain('(2h ago)');
    });

    it('shows no "ago" when no render has been tracked', () => {
      const d = new DebugMetrics();
      expect(d.tableHtml()).not.toContain('ago');
    });
  });

  describe('_timeAgo', () => {
    it('formats seconds as "Xs"', () => {
      const d = new DebugMetrics();
      expect(d._timeAgo(10_000)).toBe('10s');
    });

    it('formats 59 seconds as "59s"', () => {
      const d = new DebugMetrics();
      expect(d._timeAgo(59_999)).toBe('59s');
    });

    it('formats 60 seconds as "1m"', () => {
      const d = new DebugMetrics();
      expect(d._timeAgo(60_000)).toBe('1m');
    });

    it('formats minutes as "Xm"', () => {
      const d = new DebugMetrics();
      expect(d._timeAgo(150_000)).toBe('2m');
    });

    it('formats 41 minutes as "41m"', () => {
      const d = new DebugMetrics();
      expect(d._timeAgo(2_460_000)).toBe('41m');
    });

    it('formats 3600 seconds as "1h"', () => {
      const d = new DebugMetrics();
      expect(d._timeAgo(3_600_000)).toBe('1h');
    });

    it('formats hours as "Xh"', () => {
      const d = new DebugMetrics();
      expect(d._timeAgo(7_200_000)).toBe('2h');
    });
  });

  describe('html', () => {
    it('wraps tableHtml in a div with id="sc-debug"', () => {
      const d = new DebugMetrics();
      expect(d.html()).toContain('id="sc-debug"');
    });

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
      expect(h).toContain('15m');
      expect(h).toContain('30m');
      expect(h).toContain('1h');
      expect(h).toContain('3h');
    });

    it('does not contain 6h column', () => {
      const d = new DebugMetrics();
      expect(d.html()).not.toContain('6h');
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

    it('outer font size is 11px', () => {
      const d = new DebugMetrics();
      expect(d.html()).toContain('font-size:11px');
    });

    it('footer font size is 10px', () => {
      const d = new DebugMetrics();
      expect(d.html()).toContain('font-size:10px');
    });

    it('line-height is 1 for minimum row spacing', () => {
      const d = new DebugMetrics();
      expect(d.html()).toContain('line-height:1;');
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
