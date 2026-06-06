import { sectionHtml } from './render.js';
import { CARD_STYLES } from './styles.js';
import { esc } from './utils.js';

class SportScoreboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = null;
    this._hass = null;
    this._refreshTimer = null;
  }

  setConfig(config) {
    this._config = config;
    this._startRefreshTimer();
    if (this._hass) this._render();
  }

  set hass(hass) {
    const isAuto =
      !this._config || this._config.refresh === undefined || this._config.refresh === 'auto';

    if (isAuto) {
      if (this._hasRelevantChange(hass)) {
        this._hass = hass;
        if (this._config) this._render();
      } else {
        this._hass = hass;
      }
    } else {
      this._hass = hass;
    }
  }

  _startRefreshTimer() {
    this._stopRefreshTimer();
    const interval = this._config?.refresh;
    if (typeof interval === 'number' && interval > 0) {
      this._refreshTimer = setInterval(() => {
        if (this._hass && this._config) this._render();
      }, interval * 1000);
    }
  }

  _stopRefreshTimer() {
    if (this._refreshTimer) {
      clearInterval(this._refreshTimer);
      this._refreshTimer = null;
    }
  }

  disconnectedCallback() {
    this._stopRefreshTimer();
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
      const { sections, height, colors = {} } = this._config;
      const states = this._hass.states;

      if (!Array.isArray(sections) || !sections.length) {
        this._showError('Add at least one section to your card config.');
        return;
      }

      const body = sections.map((s) => sectionHtml(s, states, colors)).join('');
      const heightStyle = height
        ? `height:${esc(String(height))};min-height:${esc(String(height))};max-height:${esc(String(height))};`
        : '';
      const headerOverride = colors.header
        ? `.section-header{color:${esc(String(colors.header))}}`
        : '';

      this.shadowRoot.innerHTML = `
        <style>${CARD_STYLES}${headerOverride}</style>
        <ha-card style="${heightStyle}">
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
    if (this._config?.height) return Math.ceil(parseInt(this._config.height, 10) / 50);
    const rows = (this._config?.sections ?? []).reduce((n, s) => n + 1 + (s.limit ?? 10), 0);
    return Math.max(1, Math.ceil((rows * 28) / 50));
  }

  static getStubConfig() {
    return {
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
