/* ha-teamtracker-scoreboard-card */
const VALID_STATES = new Set(['PRE', 'IN', 'POST', 'BYE']);

function esc(str) {
  if (str == null) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function safeLogoUrl(url) {
  if (!url || !String(url).startsWith('https://')) return '';
  return String(url);
}

// Returns true when `side` ('home'|'away') matches the sensor's tracked team.
function isTeamSide(side, attr) {
  return side === 'home' ? attr?.team_homeaway === 'home' : attr?.team_homeaway !== 'home';
}

function teamColor(side, attr, special, colors = {}) {
  if (!isTeamSide(side, attr))
    return colors.opponent ?? 'var(--scoreboard-opponent-color, #777)'; /* gray */
  if (special)
    return colors.special ?? 'var(--scoreboard-special-color, #2196F3)'; /* Material Blue */
  return colors.team ?? 'var(--scoreboard-team-color, white)';
}

function scoreBg(gs) {
  if (gs === 'PRE') return '#303030'; /* near-black */
  if (gs === 'IN') return 'lightgray';
  return 'transparent';
}

function scoreColor(side, gs, attr, colors = {}) {
  const isSide = isTeamSide(side, attr);
  if (gs === 'PRE') return 'black';
  if (gs === 'IN') {
    const ts = parseFloat(attr.team_score);
    const os = parseFloat(attr.opponent_score);
    return (isSide ? ts >= os : os >= ts) ? (colors.leading ?? 'brown') : 'black';
  }
  if (gs === 'POST') {
    return (isSide ? attr.team_winner : attr.opponent_winner)
      ? (colors.winner ?? 'orange')
      : (colors.loser ?? 'darkgray');
  }
  return 'black';
}

function colonColor(gs) {
  if (gs === 'PRE' || gs === 'IN') return 'black';
  if (gs === 'POST') return '#777'; /* gray */
  return 'transparent';
}

function scoreText(side, gs, attr) {
  if (gs === 'NOT_FOUND') return '';
  if (gs === 'PRE') return '–';
  return isTeamSide(side, attr) ? (attr.team_score ?? '') : (attr.opponent_score ?? '');
}

function nameText(side, attr) {
  return isTeamSide(side, attr) ? esc(attr.team_name) : esc(attr.opponent_name);
}

function rankText(side, attr) {
  return isTeamSide(side, attr) ? esc(attr.team_record) : esc(attr.opponent_record);
}

function logoHtml(side, gs, attr) {
  if (gs === 'NOT_FOUND') return '';
  const url = safeLogoUrl(isTeamSide(side, attr) ? attr.team_logo : attr.opponent_logo);
  return url ? `<img src="${url}" alt="">` : '';
}

function tvHtml(gs, attr, colors = {}) {
  if (gs !== 'PRE' && gs !== 'IN') return '';
  const tv = String(attr.tv_network ?? '').trim();
  if (!tv) return '';
  const networks = tv.split('/').map((n) => n.trim());
  const hasMultiple = networks.length > 1;
  const label = hasMultiple ? `${networks[0].substring(0, 8)}›` : networks[0].substring(0, 8);
  const bg = gs === 'IN' ? (colors.live ?? 'indianred') : '#666';
  const badge = `<span class="tv-badge" style="background:${bg}">${esc(label)}</span>`;
  if (hasMultiple) {
    const tooltip = esc(networks.join(' · '));
    return `<span class="tv-tooltip" data-tooltip="${tooltip}">${badge}</span>`;
  }
  return badge;
}

function messageHtml(gs, attr, colors = {}) {
  switch (gs) {
    case 'NOT_FOUND': {
      const msg = String(attr.api_message ?? 'Unknown')
        .replace(/^Cached data:\s*/i, '')
        .replace(/^API_LIMIT hit\.\s*/i, '');
      return `<span class="msg-sub">${esc(msg)}</span>`;
    }
    case 'PRE': {
      const kickoff = esc(attr.kickoff_in ?? '');
      const sub = esc(attr.series_summary ?? attr.odds ?? '');
      return (
        `<span style="color:darkgray">${kickoff}</span>` +
        (sub ? `<span class="msg-sub">${sub}</span>` : '')
      );
    }
    case 'IN': {
      const clock = esc(attr.clock ?? '');
      const pct =
        attr.team_win_probability != null
          ? esc(`(${attr.team_abbr ?? ''}${(Number(attr.team_win_probability) * 100).toFixed(1)}%)`)
          : '';
      return (
        `<span style="color:${colors.live ?? 'indianred'}">${clock}</span>` +
        (pct ? `<span class="msg-sub">${pct}</span>` : '')
      );
    }
    default: {
      const clock = esc(attr.clock ?? '');
      const sub = esc(attr.series_summary ?? '');
      return (
        `<span style="color:${colors.winner ?? 'orange'}">${clock}</span>` +
        (sub ? `<span class="msg-sub">${sub}</span>` : '')
      );
    }
  }
}

// rankType: 'win-loss' | 'win-draw-loss'  (by-date is internal only — auto-applied outside regular season)

function winRatio(record, rankType) {
  const pts = String(record ?? '0-0')
    .split('-')
    .map(Number);
  if (rankType === 'win-draw-loss') {
    // points = 2W + D, max possible = 2(W+D+L)
    const total = pts[0] + pts[1] + pts[2];
    return total ? (2 * pts[0] + pts[2]) / (2 * total) : 0;
  }
  // win-loss: simple win percentage
  return pts[0] + pts[1] ? pts[0] / (pts[0] + pts[1]) : 0;
}

function sortKeyFor(attr, rankType) {
  if (rankType === 'by-date') return new Date(attr?.date ?? 0).getTime();
  return winRatio(attr?.team_record, rankType);
}

function preferHome(list, states) {
  return [...list].sort((a, b) => {
    const aHome = states[a.entityId]?.attributes?.team_homeaway === 'home' ? 0 : 1;
    const bHome = states[b.entityId]?.attributes?.team_homeaway === 'home' ? 0 : 1;
    return aHome - bHome;
  });
}

// For by-date sort, one row per game — deduplicate by (date, team pair), preferring home sensor.
function deduplicate(list, rankType, states) {
  if (rankType !== 'by-date') return list;
  const seen = new Set();
  return preferHome(list, states).filter(({ entityId }) => {
    const { date, team_abbr, opponent_abbr } = states[entityId]?.attributes ?? {};
    const key = `${date}_${[team_abbr, opponent_abbr].sort().join('_')}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function rowHtml(stateObj, special, colors = {}) {
  const gs = stateObj?.state ?? 'NOT_FOUND';
  const attr = stateObj?.attributes ?? {};
  const bg = scoreBg(gs);

  return `
<div class="game-row">
  <div class="team-col team-col-a">
    <div class="team-name" style="color:${teamColor('home', attr, special, colors)};font-weight:${isTeamSide('home', attr) ? 'bold' : 'normal'}">${nameText('home', attr)}</div>
    <div class="team-rank" style="color:${teamColor('home', attr, special, colors)}">${rankText('home', attr)}</div>
  </div>
  <div class="logo logo-a">${logoHtml('home', gs, attr)}</div>
  <div class="score score-a" style="background:${bg};color:${scoreColor('home', gs, attr, colors)}">${scoreText('home', gs, attr)}</div>
  <div class="colon" style="background:${bg};color:${colonColor(gs)}">${gs !== 'NOT_FOUND' ? ':' : ''}</div>
  <div class="score score-b" style="background:${bg};color:${scoreColor('away', gs, attr, colors)}">${scoreText('away', gs, attr)}</div>
  <div class="logo logo-b">${logoHtml('away', gs, attr)}</div>
  <div class="team-col team-col-b">
    <div class="team-name" style="color:${teamColor('away', attr, special, colors)};font-weight:${isTeamSide('away', attr) ? 'bold' : 'normal'}">${nameText('away', attr)}</div>
    <div class="team-rank" style="color:${teamColor('away', attr, special, colors)}">${rankText('away', attr)}</div>
  </div>
  <div class="message">${messageHtml(gs, attr, colors)}</div>
  <div class="tv">${tvHtml(gs, attr, colors)}</div>
</div>`;
}

function sectionHtml(section, states, colors = {}) {
  const { name, prefix, limit = 10, special_teams = [], rankType = 'win-draw-loss' } = section;

  const entities = Object.keys(states).filter(
    (id) => id.startsWith(prefix) && VALID_STATES.has(states[id]?.state)
  );
  if (!entities.length) return '';

  // rankType applies to regular season only — auto-switch to by-date outside it
  const firstAttr = states[entities[0]]?.attributes;
  const effectiveRankType = firstAttr?.season !== 'regular' ? 'by-date' : rankType;

  const items = entities.map((entityId) => ({
    entityId,
    special: special_teams.includes(entityId.replace(prefix, '')),
    key: sortKeyFor(states[entityId]?.attributes, effectiveRankType),
  }));

  items.sort((a, b) => (effectiveRankType === 'by-date' ? a.key - b.key : b.key - a.key));

  const rows = deduplicate(items, effectiveRankType, states)
    .slice(0, limit)
    .map(({ entityId, special }) => rowHtml(states[entityId], special, colors))
    .join('');

  return `<div class="section-header">${esc(name)}</div>${rows}`;
}

const CARD_STYLES = `
  :host { display: block; }

  ha-card {
    padding: 4px 8px 4px 6px;
    box-sizing: border-box;
    font-family: var(--paper-font-body1_-_font-family, sans-serif);
    color: #888; /* gray */
    font-size: 14px;
  }

  .section-header {
    color: #2196F3; /* Material Blue */
    font-size: 15px;
    padding: 2px 0 2px 0;
    margin-top: 1px;
  }

  .game-row {
    display: flex;
    align-items: center;
    height: 28px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    gap: 0;
  }

  .team-col {
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100px;
    min-width: 60px;
    overflow: hidden;
  }
  .team-col-a { text-align: right; padding-right: 3px; }
  .team-col-b { text-align: left;  padding-left: 3px;  }

  .team-name {
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.2;
  }
  .team-rank {
    font-size: 9px;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
  }

  .logo {
    width: 30px;
    min-width: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 28px;
    overflow: hidden;
  }
  .logo-a { padding-right: 3px; }
  .logo-b { padding-left:  3px; }
  .logo img {
    width: 26px;
    height: 26px;
    object-fit: contain;
    display: block;
  }

  .score {
    width: 30px;
    min-width: 30px;
    font-size: 17px;
    font-weight: bold;
    text-align: center;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .colon {
    width: 8px;
    min-width: 8px;
    font-size: 17px;
    font-weight: bold;
    text-align: center;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .tv {
    flex-shrink: 0;
    text-align: center;
    font-size: 0;
    padding: 0 3px;
  }
  .tv-badge {
    font-size: 8px;
    font-weight: bold;
    color: white;
    border-radius: 3px;
    padding: 1px 3px;
    white-space: nowrap;
  }
  .tv-tooltip {
    position: relative;
    cursor: default;
  }
  .tv-tooltip::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: calc(100% + 4px);
    left: 50%;
    transform: translateX(-50%);
    background: #222;
    color: #fff;
    font-size: 10px;
    font-weight: bold;
    padding: 3px 6px;
    border-radius: 4px;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s;
    z-index: 10;
  }
  .tv-tooltip:hover::after {
    opacity: 1;
  }

  .message {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    font-size: 13px;
    font-weight: bold;
    line-height: 1.1;
    padding-left: 4px;
  }
  .msg-sub {
    font-size: 10px;
    font-weight: normal;
    color: #666; /* dimgray */
    line-height: 1.1;
  }

  .empty {
    padding: 8px 4px;
    font-size: 13px;
    color: #555; /* dark gray */
  }
`;

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
