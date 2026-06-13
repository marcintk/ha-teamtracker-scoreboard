import { describe, expect, it, vi } from 'vitest';
import { SubscriptionManager } from '../src/subscription.js';

function makeConnection(resolvedUnsub = vi.fn()) {
  return {
    connection: { subscribeEvents: vi.fn().mockResolvedValue(resolvedUnsub) },
    unsub: resolvedUnsub,
  };
}

describe('SubscriptionManager', () => {
  describe('subscribe', () => {
    it('calls subscribeEvents on the connection', async () => {
      const mgr = new SubscriptionManager();
      const { connection } = makeConnection();
      mgr.subscribe(connection, new Set(['sensor.a']), vi.fn());
      await Promise.resolve();
      expect(connection.subscribeEvents).toHaveBeenCalledWith(
        expect.any(Function),
        'state_changed'
      );
    });

    it('stores the unsub handle after the promise resolves', async () => {
      const mgr = new SubscriptionManager();
      const { connection, unsub } = makeConnection();
      mgr.subscribe(connection, new Set(['sensor.a']), vi.fn());
      await Promise.resolve();
      expect(mgr._unsub).toBe(unsub);
    });

    it('fires onMatch when the event entity is in trackedIds', async () => {
      const mgr = new SubscriptionManager();
      const { connection } = makeConnection();
      const onMatch = vi.fn();
      mgr.subscribe(connection, new Set(['sensor.a']), onMatch);
      await Promise.resolve();
      const cb = connection.subscribeEvents.mock.calls[0][0];
      cb({ data: { entity_id: 'sensor.a' } });
      expect(onMatch).toHaveBeenCalledTimes(1);
    });

    it('does not fire onMatch for an entity not in trackedIds', async () => {
      const mgr = new SubscriptionManager();
      const { connection } = makeConnection();
      const onMatch = vi.fn();
      mgr.subscribe(connection, new Set(['sensor.a']), onMatch);
      await Promise.resolve();
      const cb = connection.subscribeEvents.mock.calls[0][0];
      cb({ data: { entity_id: 'sensor.b' } });
      expect(onMatch).not.toHaveBeenCalled();
    });

    it('does nothing when connection has no subscribeEvents', () => {
      const mgr = new SubscriptionManager();
      expect(() => mgr.subscribe({}, new Set(), vi.fn())).not.toThrow();
      expect(mgr._unsub).toBeNull();
    });

    it('does nothing when connection is null', () => {
      const mgr = new SubscriptionManager();
      expect(() => mgr.subscribe(null, new Set(), vi.fn())).not.toThrow();
      expect(mgr._unsub).toBeNull();
    });

    it('silently ignores subscribeEvents rejection', async () => {
      const mgr = new SubscriptionManager();
      const connection = { subscribeEvents: vi.fn().mockRejectedValue(new Error('ws error')) };
      mgr.subscribe(connection, new Set(), vi.fn());
      await Promise.resolve();
      await Promise.resolve();
      expect(mgr._unsub).toBeNull();
    });
  });

  describe('clear', () => {
    it('calls unsub and nulls the handle', async () => {
      const mgr = new SubscriptionManager();
      const { connection, unsub } = makeConnection();
      mgr.subscribe(connection, new Set(), vi.fn());
      await Promise.resolve();
      mgr.clear();
      expect(unsub).toHaveBeenCalledTimes(1);
      expect(mgr._unsub).toBeNull();
    });

    it('does not throw when called before any subscription', () => {
      const mgr = new SubscriptionManager();
      expect(() => mgr.clear()).not.toThrow();
    });

    it('stale callback fires after clear does not call onMatch', async () => {
      const mgr = new SubscriptionManager();
      const { connection } = makeConnection();
      const onMatch = vi.fn();
      mgr.subscribe(connection, new Set(['sensor.a']), onMatch);
      await Promise.resolve();
      const staleCallback = connection.subscribeEvents.mock.calls[0][0];
      mgr.clear();
      staleCallback({ data: { entity_id: 'sensor.a' } });
      expect(onMatch).not.toHaveBeenCalled();
    });

    it('stale promise after clear calls unsub immediately instead of storing it', async () => {
      const mgr = new SubscriptionManager();
      const { connection, unsub } = makeConnection();
      mgr.subscribe(connection, new Set(), vi.fn());
      mgr.clear(); // clear before promise resolves
      await Promise.resolve();
      expect(unsub).toHaveBeenCalledTimes(1);
      expect(mgr._unsub).toBeNull();
    });
  });
});
