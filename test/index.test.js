import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/index.js';

const makeHass = (states = {}) => ({ states });
const makeState = (state, attrs = {}) => ({ state, attributes: attrs });

const baseAttrs = {
  team_homeaway: 'home',
  team_name: 'Lakers',
  opponent_name: 'Celtics',
  team_record: '20-10',
  opponent_record: '18-12',
  team_score: '95',
  opponent_score: '90',
  team_winner: true,
  opponent_winner: false,
  team_logo: 'https://cdn.example.com/lal.png',
  opponent_logo: 'https://cdn.example.com/bos.png',
  season: 'regular',
};

const nbaSection = {
  name: 'NBA',
  prefix: 'sensor.nba_',
  limit: 10,
  special_teams: [],
  rankType: 'win-loss',
};

function makeCard() {
  return document.createElement('ha-teamtracker-scoreboard-card');
}

function makeHassWithConnection(states = {}) {
  const unsub = vi.fn();
  const connection = { subscribeEvents: vi.fn().mockResolvedValue(unsub) };
  return { hass: { states, connection }, unsub, connection };
}

describe('SportScoreboardCard', () => {
  describe('registration', () => {
    it('registers as a custom element', () => {
      expect(customElements.get('ha-teamtracker-scoreboard-card')).toBeDefined();
    });

    it('adds entry to window.customCards', () => {
      const entry = window.customCards?.find((c) => c.type === 'ha-teamtracker-scoreboard-card');
      expect(entry).toBeDefined();
      expect(entry.name).toBe('TeamTracker Scoreboard Card');
    });
  });

  describe('getStubConfig', () => {
    it('returns a valid default config shape', () => {
      const Cls = customElements.get('ha-teamtracker-scoreboard-card');
      const config = Cls.getStubConfig();
      expect(Array.isArray(config.sections)).toBe(true);
      expect(config.sections.length).toBeGreaterThan(0);
      expect(config).not.toHaveProperty('height');
    });
  });

  describe('getCardSize', () => {
    it('calculates rows from height string', () => {
      const card = makeCard();
      card._config = { height: '475px' };
      expect(card.getCardSize()).toBe(10);
    });

    it('rounds up fractional rows', () => {
      const card = makeCard();
      card._config = { height: '51px' };
      expect(card.getCardSize()).toBe(2);
    });

    it('calculates size from sections when height is absent', () => {
      const card = makeCard();
      card._config = { sections: [{ limit: 10 }, { limit: 5 }] };
      // 2 headers + 15 rows = 17 rows * 28px = 476px / 50 = ceil(9.52) = 10
      expect(card.getCardSize()).toBe(10);
    });

    it('returns 1 when config is null', () => {
      const card = makeCard();
      expect(card.getCardSize()).toBe(1);
    });

    it('defaults section limit to 10 when limit is omitted', () => {
      const card = makeCard();
      card._config = { sections: [{ name: 'NBA' }] };
      // 1 header + 10 default rows = 11 rows * 28px = 308px / 50 = ceil(6.16) = 7
      expect(card.getCardSize()).toBe(7);
    });

    it('falls back to section-based size when height is non-numeric', () => {
      const card = makeCard();
      card._config = { height: 'auto', sections: [{ limit: 10 }] };
      const size = card.getCardSize();
      expect(Number.isFinite(size)).toBe(true);
      expect(size).toBeGreaterThanOrEqual(1);
    });
  });

  describe('_hasRelevantChange', () => {
    it('returns true when prevHass is null (no prior state to compare)', () => {
      const card = makeCard();
      card._config = { sections: [nbaSection] };
      card._trackedIds = new Set(['sensor.nba_lal']);
      expect(card._hasRelevantChange(makeHass({}), null)).toBe(true);
    });

    it('returns true when config is null', () => {
      const card = makeCard();
      card._config = null;
      card._trackedIds = new Set(['sensor.nba_lal']);
      const hass = makeHass({ 'sensor.nba_lal': makeState('PRE', baseAttrs) });
      expect(card._hasRelevantChange(hass, hass)).toBe(true);
    });
  });

  describe('_buildTrackedIds', () => {
    it('populates _trackedIds with entity IDs matching configured prefixes', () => {
      const card = makeCard();
      card._config = { sections: [nbaSection] };
      card._buildTrackedIds(['sensor.nba_lal', 'sensor.nhl_bos', 'sensor.weather_london']);
      expect(card._trackedIds.has('sensor.nba_lal')).toBe(true);
      expect(card._trackedIds.has('sensor.nhl_bos')).toBe(false);
      expect(card._trackedIds.has('sensor.weather_london')).toBe(false);
    });

    it('produces an empty set when no prefix matches', () => {
      const card = makeCard();
      card._config = { sections: [nbaSection] };
      card._buildTrackedIds(['sensor.weather_london', 'sensor.sun']);
      expect(card._trackedIds.size).toBe(0);
    });

    it('produces an empty set when config has no sections', () => {
      const card = makeCard();
      card._config = {};
      card._buildTrackedIds(['sensor.nba_lal']);
      expect(card._trackedIds.size).toBe(0);
    });
  });

  describe('setConfig', () => {
    it('stores the provided config', () => {
      const card = makeCard();
      card.setConfig({ sections: [nbaSection] });
      expect(card._config.sections).toHaveLength(1);
    });

    it('triggers render immediately when hass is already set', () => {
      const card = makeCard();
      card._hass = makeHass({ 'sensor.nba_lal': makeState('PRE', baseAttrs) });
      card.setConfig({ sections: [nbaSection] });
      expect(card.shadowRoot.innerHTML).toContain('ha-card');
    });

    it('does not render when hass is not yet set', () => {
      const card = makeCard();
      card.setConfig({ sections: [nbaSection] });
      expect(card.shadowRoot.innerHTML).toBe('');
    });

    it('invalidates _trackedIds so it is rebuilt on the next hass push', () => {
      const card = makeCard();
      card._trackedIds = new Set(['sensor.nba_lal']);
      card.setConfig({ sections: [nbaSection] });
      expect(card._trackedIds).toBeNull();
    });
  });

  describe('set hass', () => {
    it('renders on first hass assignment when config is set', () => {
      const card = makeCard();
      card.setConfig({ sections: [nbaSection] });
      card.hass = makeHass({ 'sensor.nba_lal': makeState('PRE', baseAttrs) });
      expect(card.shadowRoot.innerHTML).toContain('ha-card');
    });

    it('does not render when no config is set', () => {
      const card = makeCard();
      card.hass = makeHass({ 'sensor.nba_lal': makeState('PRE', baseAttrs) });
      expect(card.shadowRoot.innerHTML).toBe('');
    });

    it('builds _trackedIds on first assignment', () => {
      const card = makeCard();
      card.setConfig({ sections: [nbaSection] });
      card.hass = makeHass({ 'sensor.nba_lal': makeState('PRE', baseAttrs) });
      expect(card._trackedIds).toBeInstanceOf(Set);
      expect(card._trackedIds.has('sensor.nba_lal')).toBe(true);
    });

    it('refreshes _trackedIds on render so newly-added sensors are picked up', () => {
      const card = makeCard();
      card._config = { sections: [nbaSection] };
      card._hass = makeHass({ 'sensor.nba_lal': makeState('PRE', baseAttrs) });
      card._trackedIds = new Set(); // simulate stale empty cache
      card._render();
      expect(card._trackedIds.has('sensor.nba_lal')).toBe(true);
    });

    it('skips _trackedIds rebuild when already populated and no render follows', () => {
      const card = makeCard();
      card.setConfig({ sections: [nbaSection] });
      const stateObj = makeState('PRE', baseAttrs);
      // first push: builds _trackedIds and renders
      card.hass = makeHass({ 'sensor.nba_lal': stateObj });
      const setAfterRender = card._trackedIds;
      // second push: same state reference — no change, no render, guard skipped
      card.hass = makeHass({ 'sensor.nba_lal': stateObj });
      expect(card._trackedIds).toBe(setAfterRender);
    });

    it('skips render when no relevant entity changed', () => {
      const card = makeCard();
      const stateObj = makeState('PRE', baseAttrs);
      card.setConfig({ sections: [nbaSection], lazyRefresh: 0 });
      card.hass = makeHass({ 'sensor.nba_lal': stateObj }); // first call: builds _trackedIds
      const renderSpy = vi.spyOn(card, '_render');
      // same state object reference — fallback diffing returns false, no render
      card.hass = makeHass({ 'sensor.nba_lal': stateObj });
      expect(renderSpy).not.toHaveBeenCalled();
    });

    it('treats missing sections as empty prefix list when checking relevance', () => {
      const card = makeCard();
      // pre-set _trackedIds so the first-call branch is bypassed
      card._trackedIds = new Set(); // empty — no sections to match
      card._hass = makeHass({});
      card._config = {}; // no sections key — hits the ?? [] fallback
      const renderSpy = vi.spyOn(card, '_render');
      card.hass = makeHass({ 'sensor.nba_lal': makeState('PRE', baseAttrs) });
      // empty _trackedIds → _hasRelevantChange returns false → no render
      expect(renderSpy).not.toHaveBeenCalled();
    });

    it('re-renders when a relevant entity state changes', () => {
      const card = makeCard();
      card.setConfig({ sections: [nbaSection], lazyRefresh: 0 });
      // first call: builds _trackedIds; makeHass has no connection so _unsubscribe stays null
      card.hass = makeHass({ 'sensor.nba_lal': makeState('PRE', baseAttrs) });
      const renderSpy = vi.spyOn(card, '_render');
      // second call: different state ref → fallback diffing triggers render
      card.hass = makeHass({ 'sensor.nba_lal': makeState('IN', baseAttrs) });
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('_render', () => {
    it('renders ha-card with game rows when entities match', () => {
      const card = makeCard();
      card._config = { sections: [nbaSection] };
      card._hass = makeHass({ 'sensor.nba_lal': makeState('PRE', baseAttrs) });
      card._render();
      expect(card.shadowRoot.innerHTML).toContain('ha-card');
      expect(card.shadowRoot.innerHTML).toContain('Lakers');
    });

    it('shows no-games message when no entities match the prefix', () => {
      const card = makeCard();
      card._config = { sections: [nbaSection] };
      card._hass = makeHass({});
      card._render();
      expect(card.shadowRoot.innerHTML).toContain('No games found');
    });

    it('applies custom height to ha-card style', () => {
      const card = makeCard();
      card._config = { sections: [nbaSection], height: '300px' };
      card._hass = makeHass({ 'sensor.nba_lal': makeState('PRE', baseAttrs) });
      card._render();
      expect(card.shadowRoot.innerHTML).toContain('300px');
    });

    it('passes colors config through to row rendering', () => {
      const card = makeCard();
      card._config = {
        sections: [{ ...nbaSection, special_teams: ['lal'] }],
        colors: { special: 'gold' },
      };
      card._hass = makeHass({ 'sensor.nba_lal': makeState('PRE', baseAttrs) });
      card._render();
      expect(card.shadowRoot.innerHTML).toContain('gold');
    });

    it('injects header color override into style block', () => {
      const card = makeCard();
      card._config = { sections: [nbaSection], colors: { header: 'tomato' } };
      card._hass = makeHass({ 'sensor.nba_lal': makeState('PRE', baseAttrs) });
      card._render();
      expect(card.shadowRoot.innerHTML).toContain('.section-header{color:tomato}');
    });

    it('shows error when sections is not an array', () => {
      const card = makeCard();
      card._config = { sections: null };
      card._hass = makeHass({});
      card._render();
      expect(card.shadowRoot.innerHTML).toContain('error');
    });

    it('shows error when sections array is empty', () => {
      const card = makeCard();
      card._config = { sections: [] };
      card._hass = makeHass({});
      card._render();
      expect(card.shadowRoot.innerHTML).toContain('error');
    });

    it('shows error when render throws internally', () => {
      const card = makeCard();
      card._config = { sections: [nbaSection] };
      card._hass = null; // accessing .states throws
      card._render();
      expect(card.shadowRoot.innerHTML).toContain('error');
    });
  });

  describe('refresh', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('starts fixedTimer with default 5-minute interval when refresh is omitted', () => {
      const card = makeCard();
      card.setConfig({ sections: [nbaSection] });
      expect(card._fixedTimer).not.toBeNull();
    });

    it('fixedRefresh: 0 does not start a fixed timer', () => {
      const card = makeCard();
      card.setConfig({ sections: [nbaSection], fixedRefresh: 0 });
      expect(card._fixedTimer).toBeNull();
    });

    it('starts fixedTimer at custom fixedRefresh interval', () => {
      const card = makeCard();
      card.setConfig({ sections: [nbaSection], fixedRefresh: 60_000 });
      expect(card._fixedTimer).not.toBeNull();
    });

    it('fixedTimer calls _render at fixedRefresh interval', () => {
      const card = makeCard();
      card._hass = makeHass({ 'sensor.nba_lal': makeState('PRE', baseAttrs) });
      card.setConfig({ sections: [nbaSection], fixedRefresh: 10_000 });
      const renderSpy = vi.spyOn(card, '_render');

      vi.advanceTimersByTime(10_000);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(10_000);
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('clears the old timer when setConfig is called again', () => {
      const card = makeCard();
      card.setConfig({ sections: [nbaSection], fixedRefresh: 30_000 });
      const firstTimer = card._fixedTimer;
      card.setConfig({ sections: [nbaSection], fixedRefresh: 60_000 });
      expect(card._fixedTimer).not.toBe(firstTimer);
    });

    it('clears the timer on disconnectedCallback', () => {
      const card = makeCard();
      card.setConfig({ sections: [nbaSection], fixedRefresh: 30_000 });
      card.disconnectedCallback();
      expect(card._fixedTimer).toBeNull();
    });

    it('does not render when timer fires before hass is assigned', () => {
      const card = makeCard();
      card.setConfig({ sections: [nbaSection], fixedRefresh: 10_000 });
      const renderSpy = vi.spyOn(card, '_render');

      vi.advanceTimersByTime(10_000);
      expect(renderSpy).not.toHaveBeenCalled();
    });

    it('does not fire after disconnectedCallback', () => {
      const card = makeCard();
      card._hass = makeHass({ 'sensor.nba_lal': makeState('PRE', baseAttrs) });
      card.setConfig({ sections: [nbaSection], fixedRefresh: 10_000 });
      const renderSpy = vi.spyOn(card, '_render');

      card.disconnectedCallback();
      vi.advanceTimersByTime(30_000);
      expect(renderSpy).not.toHaveBeenCalled();
    });
  });

  describe('subscription', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('calls subscribeEvents on first hass assignment in auto mode', async () => {
      const card = makeCard();
      card.setConfig({ sections: [nbaSection] });
      const { hass, connection } = makeHassWithConnection({
        'sensor.nba_lal': makeState('PRE', baseAttrs),
      });
      card.hass = hass;
      await Promise.resolve();
      expect(connection.subscribeEvents).toHaveBeenCalledWith(
        expect.any(Function),
        'state_changed'
      );
    });

    it('stores the unsubscribe function after subscription resolves', async () => {
      const card = makeCard();
      card.setConfig({ sections: [nbaSection] });
      const { hass, unsub } = makeHassWithConnection({
        'sensor.nba_lal': makeState('PRE', baseAttrs),
      });
      card.hass = hass;
      await Promise.resolve();
      expect(card._subscription._unsub).toBe(unsub);
    });

    it('WS callback schedules render via _renderTimer for a tracked entity', async () => {
      const card = makeCard();
      card.setConfig({ sections: [nbaSection] });
      const { hass, connection } = makeHassWithConnection({
        'sensor.nba_lal': makeState('PRE', baseAttrs),
      });
      card.hass = hass;
      await Promise.resolve();
      const callback = connection.subscribeEvents.mock.calls[0][0];
      callback({ data: { entity_id: 'sensor.nba_lal' } });
      expect(card._renderTimer).not.toBeNull();
    });

    it('WS callback does not schedule render for an untracked entity', async () => {
      const card = makeCard();
      card.setConfig({ sections: [nbaSection] });
      const { hass, connection } = makeHassWithConnection({
        'sensor.nba_lal': makeState('PRE', baseAttrs),
      });
      card.hass = hass;
      await Promise.resolve();
      const callback = connection.subscribeEvents.mock.calls[0][0];
      callback({ data: { entity_id: 'sensor.weather_london' } });
      expect(card._renderTimer).toBeNull();
    });

    it('lazyRefresh timer triggers render after configured delay', async () => {
      const card = makeCard();
      card.setConfig({ sections: [nbaSection], lazyRefresh: 200 });
      const { hass, connection } = makeHassWithConnection({
        'sensor.nba_lal': makeState('PRE', baseAttrs),
      });
      card.hass = hass;
      await Promise.resolve();
      const callback = connection.subscribeEvents.mock.calls[0][0];
      const renderSpy = vi.spyOn(card, '_render');
      callback({ data: { entity_id: 'sensor.nba_lal' } });
      expect(renderSpy).not.toHaveBeenCalled();
      vi.advanceTimersByTime(200);
      expect(renderSpy).toHaveBeenCalledTimes(1);
      expect(card._renderTimer).toBeNull();
    });

    it('lazyRefresh: 0 renders immediately without starting a timer', async () => {
      const card = makeCard();
      card.setConfig({ sections: [nbaSection], lazyRefresh: 0 });
      const { hass, connection } = makeHassWithConnection({
        'sensor.nba_lal': makeState('PRE', baseAttrs),
      });
      card.hass = hass;
      await Promise.resolve();
      const callback = connection.subscribeEvents.mock.calls[0][0];
      const renderSpy = vi.spyOn(card, '_render');
      callback({ data: { entity_id: 'sensor.nba_lal' } });
      expect(renderSpy).toHaveBeenCalledTimes(1);
      expect(card._renderTimer).toBeNull();
    });

    it('lazyRefresh timer skips render if hass is null when it fires', () => {
      const card = makeCard();
      card._config = { sections: [nbaSection], lazyRefresh: 300 };
      card._hass = makeHass({});
      card._trackedIds = new Set();
      card._scheduleRender();
      card._hass = null;
      const renderSpy = vi.spyOn(card, '_render');
      vi.advanceTimersByTime(300);
      expect(renderSpy).not.toHaveBeenCalled();
      expect(card._renderTimer).toBeNull();
    });

    it('multiple events within lazyRefresh window trigger only one render', async () => {
      const card = makeCard();
      card.setConfig({ sections: [nbaSection], lazyRefresh: 300 });
      const { hass, connection } = makeHassWithConnection({
        'sensor.nba_lal': makeState('PRE', baseAttrs),
      });
      card.hass = hass;
      await Promise.resolve();
      const callback = connection.subscribeEvents.mock.calls[0][0];
      const renderSpy = vi.spyOn(card, '_render');
      callback({ data: { entity_id: 'sensor.nba_lal' } });
      callback({ data: { entity_id: 'sensor.nba_lal' } });
      callback({ data: { entity_id: 'sensor.nba_lal' } });
      vi.advanceTimersByTime(300);
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    it('second event after lazyRefresh window closes schedules a new render', async () => {
      const card = makeCard();
      card.setConfig({ sections: [nbaSection], lazyRefresh: 300 });
      const { hass, connection } = makeHassWithConnection({
        'sensor.nba_lal': makeState('PRE', baseAttrs),
      });
      card.hass = hass;
      await Promise.resolve();
      const callback = connection.subscribeEvents.mock.calls[0][0];
      const renderSpy = vi.spyOn(card, '_render');
      callback({ data: { entity_id: 'sensor.nba_lal' } });
      vi.advanceTimersByTime(300);
      expect(renderSpy).toHaveBeenCalledTimes(1);
      callback({ data: { entity_id: 'sensor.nba_lal' } });
      vi.advanceTimersByTime(300);
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('_clearSubscription calls unsub, nulls _unsub, cancels _renderTimer', async () => {
      const card = makeCard();
      card.setConfig({ sections: [nbaSection] });
      const { hass, unsub, connection } = makeHassWithConnection({
        'sensor.nba_lal': makeState('PRE', baseAttrs),
      });
      card.hass = hass;
      await Promise.resolve();
      const callback = connection.subscribeEvents.mock.calls[0][0];
      callback({ data: { entity_id: 'sensor.nba_lal' } });
      expect(card._renderTimer).not.toBeNull();
      card._clearSubscription();
      expect(unsub).toHaveBeenCalledTimes(1);
      expect(card._subscription._unsub).toBeNull();
      expect(card._renderTimer).toBeNull();
    });

    it('stale callback does not schedule render after _clearSubscription', async () => {
      const card = makeCard();
      card.setConfig({ sections: [nbaSection] });
      const { hass, connection } = makeHassWithConnection({
        'sensor.nba_lal': makeState('PRE', baseAttrs),
      });
      card.hass = hass;
      await Promise.resolve();
      const staleCallback = connection.subscribeEvents.mock.calls[0][0];
      card._clearSubscription();
      staleCallback({ data: { entity_id: 'sensor.nba_lal' } });
      expect(card._renderTimer).toBeNull();
    });

    it('disconnectedCallback unsubscribes from WS', async () => {
      const card = makeCard();
      card.setConfig({ sections: [nbaSection] });
      const { hass, unsub } = makeHassWithConnection({
        'sensor.nba_lal': makeState('PRE', baseAttrs),
      });
      card.hass = hass;
      await Promise.resolve();
      card.disconnectedCallback();
      expect(unsub).toHaveBeenCalledTimes(1);
      expect(card._subscription._unsub).toBeNull();
    });

    it('setConfig with active subscription unsubscribes then re-subscribes', async () => {
      const card = makeCard();
      card.setConfig({ sections: [nbaSection] });
      const { hass, unsub, connection } = makeHassWithConnection({
        'sensor.nba_lal': makeState('PRE', baseAttrs),
      });
      card.hass = hass;
      await Promise.resolve();
      expect(unsub).not.toHaveBeenCalled();
      card.setConfig({ sections: [nbaSection] });
      expect(unsub).toHaveBeenCalledTimes(1);
      await Promise.resolve();
      expect(connection.subscribeEvents).toHaveBeenCalledTimes(2);
    });

    it('does not retain stale subscription handle when clearSubscription fires before promise resolves', async () => {
      const card = makeCard();
      card.setConfig({ sections: [nbaSection] });
      const { hass, unsub } = makeHassWithConnection({
        'sensor.nba_lal': makeState('PRE', baseAttrs),
      });
      card.hass = hass;
      // clear before the promise resolves — simulates rapid setConfig or disconnect
      card._clearSubscription();
      await Promise.resolve();
      // stale .then() must call unsub() to clean up, not store it
      expect(unsub).toHaveBeenCalledTimes(1);
      expect(card._subscription._unsub).toBeNull();
    });

    it('silently ignores subscribeEvents rejection and falls back to diffing', async () => {
      const card = makeCard();
      card.setConfig({ sections: [nbaSection] });
      const connection = { subscribeEvents: vi.fn().mockRejectedValue(new Error('ws error')) };
      card.hass = { states: { 'sensor.nba_lal': makeState('PRE', baseAttrs) }, connection };
      await Promise.resolve();
      await Promise.resolve(); // let rejection propagate through .catch
      expect(card._subscription._unsub).toBeNull();
    });

    it('new connection object triggers re-subscribe (HA reconnect)', async () => {
      const card = makeCard();
      card.setConfig({ sections: [nbaSection] });
      const { hass: hass1, unsub: unsub1 } = makeHassWithConnection({
        'sensor.nba_lal': makeState('PRE', baseAttrs),
      });
      card.hass = hass1;
      await Promise.resolve();

      const { hass: hass2, connection: conn2 } = makeHassWithConnection({
        'sensor.nba_lal': makeState('IN', baseAttrs),
      });
      card.hass = hass2;
      await Promise.resolve();

      expect(unsub1).toHaveBeenCalledTimes(1);
      expect(conn2.subscribeEvents).toHaveBeenCalledOnce();
    });
  });

  describe('debug', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('WS event increments notifications metric when debug is true', async () => {
      const card = makeCard();
      card.setConfig({ sections: [nbaSection], debug: true });
      const { hass, connection } = makeHassWithConnection({
        'sensor.nba_lal': makeState('PRE', baseAttrs),
      });
      card.hass = hass;
      await Promise.resolve();
      const callback = connection.subscribeEvents.mock.calls[0][0];
      callback({ data: { entity_id: 'sensor.nba_lal' } });
      expect(card._debug._data.notifications).toHaveLength(1);
    });

    it('WS event does not increment notifications when debug is false', async () => {
      const card = makeCard();
      card.setConfig({ sections: [nbaSection] });
      const { hass, connection } = makeHassWithConnection({
        'sensor.nba_lal': makeState('PRE', baseAttrs),
      });
      card.hass = hass;
      await Promise.resolve();
      const callback = connection.subscribeEvents.mock.calls[0][0];
      callback({ data: { entity_id: 'sensor.nba_lal' } });
      expect(card._debug._data.notifications).toHaveLength(0);
    });

    it('_scheduleRender increments accepted when debug is true and no timer is active', () => {
      const card = makeCard();
      card._config = { sections: [nbaSection], debug: true, lazyRefresh: 500 };
      card._hass = makeHass({});
      card._trackedIds = new Set();
      card._scheduleRender();
      expect(card._debug._data.accepted).toHaveLength(1);
    });

    it('_scheduleRender does not increment accepted when timer is already active', () => {
      const card = makeCard();
      card._config = { sections: [nbaSection], debug: true, lazyRefresh: 500 };
      card._hass = makeHass({});
      card._trackedIds = new Set();
      card._scheduleRender();
      card._scheduleRender(); // dropped — timer active
      expect(card._debug._data.accepted).toHaveLength(1);
    });

    it('_render increments renders metric when debug is true', () => {
      const card = makeCard();
      card._config = { sections: [nbaSection], debug: true };
      card._hass = makeHass({ 'sensor.nba_lal': makeState('PRE', baseAttrs) });
      card._render();
      expect(card._debug._data.renders).toHaveLength(1);
    });

    it('_render does not increment renders when debug is false', () => {
      const card = makeCard();
      card._config = { sections: [nbaSection] };
      card._hass = makeHass({ 'sensor.nba_lal': makeState('PRE', baseAttrs) });
      card._render();
      expect(card._debug._data.renders).toHaveLength(0);
    });

    it('debug pane is present in rendered HTML when debug is true', () => {
      const card = makeCard();
      card._config = { sections: [nbaSection], debug: true };
      card._hass = makeHass({ 'sensor.nba_lal': makeState('PRE', baseAttrs) });
      card._render();
      expect(card.shadowRoot.innerHTML).toContain('events');
      expect(card.shadowRoot.innerHTML).toContain('accepted');
      expect(card.shadowRoot.innerHTML).toContain('renders');
      expect(card.shadowRoot.innerHTML).toContain('5m');
      expect(card.shadowRoot.innerHTML).toContain('30m');
      expect(card.shadowRoot.innerHTML).toContain('1h');
      expect(card.shadowRoot.innerHTML).toContain('3h');
      expect(card.shadowRoot.innerHTML).toContain('6h');
    });

    it('debug pane is positioned at the bottom', () => {
      const card = makeCard();
      card._config = { sections: [nbaSection], debug: true };
      card._hass = makeHass({ 'sensor.nba_lal': makeState('PRE', baseAttrs) });
      card._render();
      expect(card.shadowRoot.innerHTML).toContain('bottom:0');
    });

    it('debug pane shows last render timestamp', () => {
      const card = makeCard();
      card._config = { sections: [nbaSection], debug: true };
      card._hass = makeHass({ 'sensor.nba_lal': makeState('PRE', baseAttrs) });
      vi.setSystemTime(new Date('2026-06-13T10:01:46.123Z'));
      card._render();
      expect(card.shadowRoot.innerHTML).toContain('10:01:46.123');
    });

    it('debug pane is absent when debug is not set', () => {
      const card = makeCard();
      card._config = { sections: [nbaSection] };
      card._hass = makeHass({ 'sensor.nba_lal': makeState('PRE', baseAttrs) });
      card._render();
      expect(card.shadowRoot.innerHTML).not.toContain('pointer-events:none');
    });

    it('ha-card gets position:relative when debug is true', () => {
      const card = makeCard();
      card._config = { sections: [nbaSection], debug: true };
      card._hass = makeHass({ 'sensor.nba_lal': makeState('PRE', baseAttrs) });
      card._render();
      expect(card.shadowRoot.innerHTML).toContain('position:relative');
    });
  });

  describe('_showError', () => {
    it('renders error message in shadow DOM', () => {
      const card = makeCard();
      card._showError('Something went wrong');
      expect(card.shadowRoot.innerHTML).toContain('Something went wrong');
      expect(card.shadowRoot.innerHTML).toContain('ha-card');
    });

    it('escapes HTML in the error message', () => {
      const card = makeCard();
      card._showError('<script>alert(1)</script>');
      expect(card.shadowRoot.innerHTML).toContain('&lt;script&gt;');
      expect(card.shadowRoot.innerHTML).not.toContain('<script>alert');
    });
  });
});
