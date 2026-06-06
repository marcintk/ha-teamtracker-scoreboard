import { describe, expect, it } from 'vitest';
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

    it('skips render when no relevant entity changed', () => {
      const card = makeCard();
      const stateObj = makeState('PRE', baseAttrs);
      card._hass = makeHass({ 'sensor.nba_lal': stateObj });
      card._config = { sections: [nbaSection] };
      // same state object reference — no change detected
      card.hass = makeHass({ 'sensor.nba_lal': stateObj });
      expect(card.shadowRoot.innerHTML).toBe('');
    });

    it('treats missing sections as empty prefix list when checking relevance', () => {
      const card = makeCard();
      card._hass = makeHass({});
      card._config = {}; // no sections key — hits the ?? [] fallback
      card.hass = makeHass({ 'sensor.nba_lal': makeState('PRE', baseAttrs) });
      // no prefixes to match, so no render triggered
      expect(card.shadowRoot.innerHTML).toBe('');
    });

    it('re-renders when a relevant entity state changes', () => {
      const card = makeCard();
      card._hass = makeHass({ 'sensor.nba_lal': makeState('PRE', baseAttrs) });
      card._config = { sections: [nbaSection] };
      card.hass = makeHass({ 'sensor.nba_lal': makeState('IN', baseAttrs) });
      expect(card.shadowRoot.innerHTML).toContain('ha-card');
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
