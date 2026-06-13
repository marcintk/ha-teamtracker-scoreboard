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
    this._trackedIds = null;
    this._unsubscribe = null;
    this._needsRender = false;
    this._subscribeGen = 0;
  }

  setConfig(config) {
    this._config = config;
    this._clearSubscription();
    this._trackedIds = null;
    this._startRefreshTimer();
    if (this._hass) {
      this._render();
      this._subscribe();
    }
  }

  set hass(hass) {
    const isFirstCall = !this._trackedIds;
    const connectionChanged = !isFirstCall && this._hass?.connection !== hass.connection;
    const prevHass = this._hass;
    this._hass = hass;

    const isAuto =
      !this._config || this._config.refresh === undefined || this._config.refresh === 'auto';

    if (isFirstCall || connectionChanged) {
      if (connectionChanged) this._clearSubscription();
      if (this._config && isAuto) {
        this._render();
      } else {
        this._buildTrackedIds(Object.keys(hass.states));
      }
      this._subscribe();
      return;
    }
    if (!isAuto) return;

    if (this._needsRender) {
      this._needsRender = false;
      this._render();
      return;
    }

    if (!this._unsubscribe && this._hasRelevantChange(hass, prevHass) && this._config) {
      this._render();
    }
  }

  _subscribe() {
    if (!this._config) return;
    const isAuto = this._config.refresh === undefined || this._config.refresh === 'auto';
    if (!isAuto || !this._hass?.connection?.subscribeEvents) return;

    const gen = this._subscribeGen;
    this._hass.connection
      .subscribeEvents((event) => {
        if (this._subscribeGen === gen && this._trackedIds?.has(event.data.entity_id)) {
          this._needsRender = true;
        }
      }, 'state_changed')
      .then((unsub) => {
        if (this._subscribeGen === gen) {
          this._unsubscribe = unsub;
        } else {
          unsub();
        }
      })
      .catch(() => {});
  }

  _clearSubscription() {
    this._subscribeGen++;
    this._unsubscribe?.();
    this._unsubscribe = null;
    this._needsRender = false;
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
    this._clearSubscription();
  }

  _buildTrackedIds(stateKeys) {
    const prefixes = (this._config?.sections ?? []).map((s) => s.prefix);
    this._trackedIds = new Set(stateKeys.filter((id) => prefixes.some((p) => id.startsWith(p))));
  }

  _hasRelevantChange(newHass, prevHass) {
    if (!prevHass || !this._config) return true;
    for (const id of this._trackedIds) {
      if (newHass.states[id] !== prevHass.states[id]) return true;
    }
    return false;
  }

  _render() {
    try {
      const { sections, height, colors = {} } = this._config;
      const states = this._hass.states;
      const stateKeys = Object.keys(states);
      this._buildTrackedIds(stateKeys);

      if (!Array.isArray(sections) || !sections.length) {
        this._showError('Add at least one section to your card config.');
        return;
      }
      const body = sections.map((s) => sectionHtml(s, states, stateKeys, colors)).join('');
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
    if (this._config?.height) {
      const px = parseInt(this._config.height, 10);
      if (Number.isFinite(px)) return Math.ceil(px / 50);
    }
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
          rankType: 'win-loss-otl',
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
