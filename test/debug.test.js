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
      vi.setSystemTime(new Date('2026-06-13T10:01:46.123Z'));
      d.track('renders');
      expect(d.html()).toContain('10:01:46.123');
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
  });
});
