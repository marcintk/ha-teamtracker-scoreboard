import { sectionHtml } from './render.js';
import { CARD_STYLES } from './styles.js';
import { esc } from './utils.js';

class SportScoreboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = null;
    this._hass = null;
  }

  setConfig(config) {
    this._config = config;
    if (this._hass) this._render();
  }

  set hass(hass) {
    if (this._hasRelevantChange(hass)) {
      this._hass = hass;
      if (this._config) this._render();
    } else {
      this._hass = hass;
    }
  }

  _hasRelevantChange(newHass) {
    if (!this._hass || !this._config) return true;
    const prefixes = (this._config.sections ?? []).map((s) => s.prefix);
    return prefixes.some((prefix) =>
      Object.keys(newHass.states).some(
        (id) => id.startsWith(prefix) && newHass.states[id] !== this._hass.states[id]
      )
    );
  }

  _render() {
    try {
      const { sections, height = '475px', colors = {} } = this._config;
      const states = this._hass.states;

      if (!Array.isArray(sections) || !sections.length) {
        this._showError('Add at least one section to your card config.');
        return;
      }

      const body = sections.map((s) => sectionHtml(s, states, colors)).join('');
      const h = esc(String(height));

      this.shadowRoot.innerHTML = `
        <style>${CARD_STYLES}</style>
        <ha-card style="height:${h};min-height:${h};max-height:${h};">
          ${body || '<div class="empty">No games found — check your section prefixes.</div>'}
        </ha-card>
      `;
    } catch (e) {
      this._showError(e.message);
      // biome-ignore lint/suspicious/noConsole: intentional render error logging
      console.error('ha-teamtracker-scoreboard-card render error:', e);
    }
  }

  _showError(msg) {
    this.shadowRoot.innerHTML = `
      <ha-card>
        <div style="padding:12px;color:var(--error-color,red);font-size:13px;">
          <b>ha-teamtracker-scoreboard-card error:</b><br>${esc(msg)}
        </div>
      </ha-card>
    `;
  }

  getCardSize() {
    return Math.ceil(parseInt(this._config?.height ?? 475, 10) / 50);
  }

  static getStubConfig() {
    return {
      height: '475px',
      sections: [
        {
          name: 'NBA Scoreboard',
          prefix: 'sensor.nba_',
          limit: 10,
          special_teams: [],
          rankType: 'win-loss',
        },
        {
          name: 'NHL Scoreboard',
          prefix: 'sensor.nhl_',
          limit: 5,
          special_teams: [],
          rankType: 'win-draw-loss',
        },
      ],
    };
  }
}

customElements.define('ha-teamtracker-scoreboard-card', SportScoreboardCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'ha-teamtracker-scoreboard-card',
  name: 'TeamTracker Scoreboard Card',
  description: 'Compact sports scoreboard powered by ha-teamtracker',
  preview: false,
});
