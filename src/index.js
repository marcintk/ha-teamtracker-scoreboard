import { sectionHtml } from './render.js';
import { CARD_STYLES } from './styles.js';
import { esc } from './utils.js';

class SportScoreboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = null;
    this._hass = null;
    this._fixedTimer = null;
    this._renderTimer = null;
    this._trackedIds = null;
    this._unsubscribe = null;
    this._subscribeGen = 0;
    this._metrics = { notifications: [], accepted: [], renders: [] };
  }

  setConfig(config) {
    this._config = config;
    this._clearSubscription();
    this._trackedIds = null;
    this._startFixedTimer();
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

    if (isFirstCall || connectionChanged) {
      if (connectionChanged) this._clearSubscription();
      if (this._config) {
        this._render();
      } else {
        this._buildTrackedIds(Object.keys(hass.states));
      }
      this._subscribe();
      return;
    }

    if (!this._unsubscribe && this._hasRelevantChange(hass, prevHass) && this._config) {
      this._scheduleRender();
    }
  }

  _getRefreshConfig() {
    return {
      lazyMs: this._config?.lazyRefresh ?? 500,
      fixedMs: this._config?.fixedRefresh ?? 300_000,
    };
  }

  _trackMetric(key) {
    const now = Date.now();
    const arr = this._metrics[key];
    arr.push(now);
    const cutoff = now - 86_400_000;
    let i = 0;
    while (i < arr.length && arr[i] < cutoff) i++;
    if (i) arr.splice(0, i);
  }

  _metricCounts(key) {
    const now = Date.now();
    const arr = this._metrics[key];
    return {
      min1: arr.filter((t) => now - t <= 60_000).length,
      min5: arr.filter((t) => now - t <= 300_000).length,
      hour: arr.filter((t) => now - t <= 3_600_000).length,
      day: arr.length,
    };
  }

  _debugHtml() {
    const cell = (n) => `<td style="padding-right:8px;text-align:right">${n}</td>`;
    const row = (label, key) => {
      const c = this._metricCounts(key);
      return `<tr><td style="padding-right:10px;color:#999">${label}</td>${cell(c.min1)}${cell(c.min5)}${cell(c.hour)}${cell(c.day)}</tr>`;
    };
    return `<div style="position:absolute;top:0;left:0;right:0;z-index:10;background:rgba(0,0,0,0.5);color:#00e676;font-family:monospace;font-size:9px;line-height:1.3;padding:2px 6px;pointer-events:none;"><table style="border-collapse:collapse;width:100%"><tr style="color:#555;font-size:8px"><td style="padding-right:10px"></td><td style="padding-right:8px;text-align:right">1m</td><td style="padding-right:8px;text-align:right">5m</td><td style="padding-right:8px;text-align:right">1h</td><td style="text-align:right">24h</td></tr>${row('events', 'notifications')}${row('accepted', 'accepted')}${row('renders', 'renders')}</table></div>`;
  }

  _scheduleRender() {
    if (this._renderTimer) return;
    if (this._config?.debug) this._trackMetric('accepted');
    const { lazyMs } = this._getRefreshConfig();
    if (lazyMs === 0) {
      this._render();
      return;
    }
    this._renderTimer = setTimeout(() => {
      this._renderTimer = null;
      if (this._hass && this._config) this._render();
    }, lazyMs);
  }

  _cancelRenderTimer() {
    if (this._renderTimer) {
      clearTimeout(this._renderTimer);
      this._renderTimer = null;
    }
  }

  _subscribe() {
    if (!this._config || !this._hass?.connection?.subscribeEvents) return;

    const gen = this._subscribeGen;
    this._hass.connection
      .subscribeEvents((event) => {
        if (this._subscribeGen === gen && this._trackedIds?.has(event.data.entity_id)) {
          if (this._config?.debug) this._trackMetric('notifications');
          this._scheduleRender();
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
    this._cancelRenderTimer();
  }

  _startFixedTimer() {
    this._stopFixedTimer();
    const { fixedMs } = this._getRefreshConfig();
    if (fixedMs > 0) {
      this._fixedTimer = setInterval(() => {
        if (this._hass && this._config) this._render();
      }, fixedMs);
    }
  }

  _stopFixedTimer() {
    if (this._fixedTimer) {
      clearInterval(this._fixedTimer);
      this._fixedTimer = null;
    }
  }

  disconnectedCallback() {
    this._stopFixedTimer();
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
    if (this._config?.debug) this._trackMetric('renders');
    try {
      const { sections, height, colors = {}, debug } = this._config;
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
        <ha-card style="${heightStyle}${debug ? 'position:relative;' : ''}">
          ${debug ? this._debugHtml() : ''}
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
