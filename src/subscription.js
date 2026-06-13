export class SubscriptionManager {
  constructor() {
    this._gen = 0;
    this._unsub = null;
  }

  subscribe(connection, trackedIds, onMatch) {
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

  clear() {
    this._gen++;
    this._unsub?.();
    this._unsub = null;
  }
}
