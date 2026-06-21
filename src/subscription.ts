import type { HassConnection } from './types.js';

export class SubscriptionManager {
  _gen: number;
  _unsub: (() => void) | null;

  constructor() {
    this._gen = 0;
    this._unsub = null;
  }

  subscribe(
    connection: Partial<HassConnection> | null,
    trackedIds: Set<string> | null,
    onMatch: () => void
  ): void {
    if (!connection?.subscribeEvents) return;
    const gen = this._gen;
    connection
      .subscribeEvents((event) => {
        if (this._gen === gen && trackedIds?.has(event.data.entity_id)) {
          onMatch();
        }
      }, 'state_changed')
      .then((unsub) => {
        if (this._gen === gen) {
          this._unsub = unsub;
        } else {
          unsub();
        }
      })
      .catch(() => {});
  }

  clear(): void {
    this._gen++;
    this._unsub?.();
    this._unsub = null;
  }
}
