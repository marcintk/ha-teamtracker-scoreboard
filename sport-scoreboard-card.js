'use strict';

// =============================================================================
// sport-scoreboard-card.js
// Custom Lovelace card for ha-teamtracker sports scoreboards
// https://github.com/vasqued2/ha-teamtracker
// =============================================================================

// ── Constants ─────────────────────────────────────────────────────────────────

const VALID_STATES = new Set(['PRE', 'IN', 'POST', 'BYE']);

// ── Utilities ─────────────────────────────────────────────────────────────────

function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function safeLogoUrl(url) {
  if (!url || !String(url).startsWith('https://')) return '';
  return String(url);
}

// ── Sorting ───────────────────────────────────────────────────────────────────

function winRatio(record, sortType) {
  const pts = String(record ?? '0-0').split('-').map(Number);
  if (sortType === 'rank-win-draw-loss') {
    // W-D-L: points = 2W + D, max = 2(W+D+L)
    return (pts[0] + pts[1] + pts[2]) ? (2 * pts[0] + pts[2]) / (2 * (pts[0] + pts[1] + pts[2])) : 0;
  }
  // W-L: simple win %
  return (pts[0] + pts[1]) ? pts[0] / (pts[0] + pts[1]) : 0;
}

function sortKeyFor(attr, sortType) {
  if (sortType === 'earliest_date') return new Date(attr?.date ?? 0).getTime();
  return winRatio(attr?.team_record, sortType);
}

function preferHome(list, states) {
  return [...list].sort((a, b) => {
    const aHome = states[a.entityId]?.attributes?.team_homeaway === 'home' ? 0 : 1;
    const bHome = states[b.entityId]?.attributes?.team_homeaway === 'home' ? 0 : 1;
    return aHome - bHome;
  });
}

// For tournament-style (earliest_date), one row per game — deduplicate by (date, team pair).
function deduplicate(list, sortType, states) {
  if (sortType !== 'earliest_date') return list;
  const seen = new Set();
  return preferHome(list, states).filter(({ entityId }) => {
    const { date, team_abbr, opponent_abbr } = states[entityId]?.attributes ?? {};
    const key = `${date}_${[team_abbr, opponent_abbr].sort().join('_')}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Display helpers ───────────────────────────────────────────────────────────

function isTeamSide(side, attr) {
  // 'home'/'away' side relative to the sensor's tracked team
  return side === 'home'
    ? attr?.team_homeaway === 'home'
    : attr?.team_homeaway !== 'home';
}

function teamColor(side, attr, special) {
  if (!isTeamSide(side, attr)) return 'var(--scoreboard-opponent-color, #777)';
  return special
    ? 'var(--scoreboard-special-color, orange)'
    : 'var(--scoreboard-team-color, white)';
}

function scoreBg(gs) {
  if (gs === 'PRE') return '#303030';
  if (gs === 'IN')  return 'lightgray';
  return 'transparent';
}

function scoreColor(side, gs, attr) {
  const isSide = isTeamSide(side, attr);
  if (gs === 'PRE') return 'black';
  if (gs === 'IN') {
    const ts = parseFloat(attr.team_score), os = parseFloat(attr.opponent_score);
    return (isSide ? ts >= os : os >= ts) ? 'brown' : 'black';
  }
  if (gs === 'POST') {
    return (isSide ? attr.team_winner : attr.opponent_winner) ? 'orange' : '#aaa';
  }
  return 'black';
}

function colonColor(gs) {
  if (gs === 'PRE' || gs === 'IN') return 'black';
  if (gs === 'POST') return '#777';
  return 'transparent';
}

function scoreText(side, gs, attr) {
  if (gs === 'NOT_FOUND') return '';
  if (gs === 'PRE')       return '–';
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

function tvHtml(gs, attr) {
  if (gs !== 'PRE' && gs !== 'IN') return '';
  const tv = String(attr.tv_network ?? '').trim();
  if (!tv) return '';
  const label = tv.includes('/')
    ? tv.split('/')[0].substring(0, 8) + '›'
    : tv.substring(0, 8);
  const bg = gs === 'IN' ? 'indianred' : '#666';
  return `<span class="tv-badge" style="background:${bg}">${esc(label)}</span>`;
}

function messageHtml(gs, attr) {
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
      return `<span style="color:#aaa">${kickoff}</span>`
           + (sub ? `<span class="msg-sub">${sub}</span>` : '');
    }
    case 'IN': {
      const clock = esc(attr.clock ?? '');
      const pct = attr.team_win_probability != null
        ? esc(`(${attr.team_abbr ?? ''}${(Number(attr.team_win_probability) * 100).toFixed(1)}%)`)
        : '';
      return `<span style="color:indianred">${clock}</span>`
           + (pct ? `<span class="msg-sub">${pct}</span>` : '');
    }
    default: {
      const clock = esc(attr.clock ?? '');
      const sub = esc(attr.series_summary ?? '');
      return `<span style="color:orange">${clock}</span>`
           + (sub ? `<span class="msg-sub">${sub}</span>` : '');
    }
  }
}

// ── Row + section HTML ────────────────────────────────────────────────────────

function rowHtml(stateObj, special) {
  const gs  = stateObj?.state ?? 'NOT_FOUND';
  const attr = stateObj?.attributes ?? {};
  const bg   = scoreBg(gs);

  return `
<div class="game-row">
  <div class="team-col team-col-a">
    <div class="team-name" style="color:${teamColor('home', attr, special)};font-weight:${isTeamSide('home', attr) ? 'bold' : 'normal'}">${nameText('home', attr)}</div>
    <div class="team-rank" style="color:${teamColor('home', attr, special)}">${rankText('home', attr)}</div>
  </div>
  <div class="logo logo-a">${logoHtml('home', gs, attr)}</div>
  <div class="score score-a" style="background:${bg};color:${scoreColor('home', gs, attr)}">${scoreText('home', gs, attr)}</div>
  <div class="colon" style="background:${bg};color:${colonColor(gs)}">${gs !== 'NOT_FOUND' ? ':' : ''}</div>
  <div class="score score-b" style="background:${bg};color:${scoreColor('away', gs, attr)}">${scoreText('away', gs, attr)}</div>
  <div class="logo logo-b">${logoHtml('away', gs, attr)}</div>
  <div class="team-col team-col-b">
    <div class="team-name" style="color:${teamColor('away', attr, special)};font-weight:${isTeamSide('away', attr) ? 'bold' : 'normal'}">${nameText('away', attr)}</div>
    <div class="team-rank" style="color:${teamColor('away', attr, special)}">${rankText('away', attr)}</div>
  </div>
  <div class="tv">${tvHtml(gs, attr)}</div>
  <div class="message">${messageHtml(gs, attr)}</div>
</div>`;
}

function sectionHtml(section, states) {
  const { name, prefix, limit = 10, special_teams = [], sort = 'rank-win-loss' } = section;

  const entities = Object.keys(states).filter(
    id => id.startsWith(prefix) && VALID_STATES.has(states[id]?.state)
  );
  if (!entities.length) return '';

  // Auto-switch to date sort outside regular season
  const firstAttr = states[entities[0]]?.attributes;
  const effectiveSort = (sort !== 'earliest_date' && firstAttr?.season !== 'regular')
    ? 'earliest_date'
    : sort;

  const items = entities.map(entityId => ({
    entityId,
    special: special_teams.includes(entityId.replace(prefix, '')),
    key: sortKeyFor(states[entityId]?.attributes, effectiveSort),
  }));

  items.sort((a, b) =>
    effectiveSort === 'earliest_date' ? a.key - b.key : b.key - a.key
  );

  const rows = deduplicate(items, effectiveSort, states)
    .slice(0, limit)
    .map(({ entityId, special }) => rowHtml(states[entityId], special))
    .join('');

  return `<div class="section-header">${esc(name)}</div>${rows}`;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const CARD_STYLES = `
  :host { display: block; }

  ha-card {
    padding: 4px 8px 4px 6px;
    box-sizing: border-box;
    overflow-y: auto;
    font-family: var(--paper-font-body1_-_font-family, sans-serif);
    color: #888;
    font-size: 14px;
  }

  .section-header {
    color: #2196F3;
    font-size: 15px;
    padding: 5px 0 2px 0;
    margin-top: 2px;
  }

  .game-row {
    display: flex;
    align-items: center;
    height: 28px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    gap: 0;
  }

  /* Team columns: name stacked over rank */
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

  /* Logos */
  .logo {
    width: 26px;
    min-width: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 28px;
  }
  .logo-a { padding-right: 3px; }
  .logo-b { padding-left:  3px; }
  .logo img {
    width: 22px;
    height: 22px;
    object-fit: contain;
    display: block;
  }

  /* Scores */
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
    width: 16px;
    min-width: 16px;
    font-size: 17px;
    font-weight: bold;
    text-align: center;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* TV badge */
  .tv {
    width: 44px;
    min-width: 44px;
    text-align: center;
    font-size: 0; /* avoid gap around inline child */
  }
  .tv-badge {
    font-size: 8px;
    font-weight: bold;
    color: #fff;
    border-radius: 3px;
    padding: 1px 3px;
    white-space: nowrap;
  }

  /* Message / clock area */
  .message {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    font-size: 13px;
    font-weight: bold;
    line-height: 1.2;
    overflow: hidden;
    padding-left: 4px;
  }
  .msg-sub {
    font-size: 10px;
    font-weight: normal;
    color: #666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .empty {
    padding: 8px 4px;
    font-size: 13px;
    color: #555;
  }
`;

// ── Card element ──────────────────────────────────────────────────────────────

class SportScoreboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = null;
    this._hass   = null;
  }

  // Called by HA when the user saves card config
  setConfig(config) {
    if (!Array.isArray(config.sections) || !config.sections.length) {
      throw new Error('"sections" must be a non-empty array');
    }
    this._config = config;
    if (this._hass) this._render();
  }

  // HA pushes updated state here whenever anything changes
  set hass(hass) {
    if (this._hasRelevantChange(hass)) {
      this._hass = hass;
      if (this._config) this._render();
    } else {
      this._hass = hass;
    }
  }

  // Only re-render when a tracked entity actually changed
  _hasRelevantChange(newHass) {
    if (!this._hass || !this._config) return true;
    const prefixes = this._config.sections.map(s => s.prefix);
    return prefixes.some(prefix =>
      Object.keys(newHass.states).some(id =>
        id.startsWith(prefix) && newHass.states[id] !== this._hass.states[id]
      )
    );
  }

  _render() {
    const { sections, height = '475px' } = this._config;
    const states = this._hass.states;

    const body = sections.map(s => sectionHtml(s, states)).join('');

    this.shadowRoot.innerHTML = `
      <style>${CARD_STYLES}</style>
      <ha-card style="height:${esc(String(height))};min-height:${esc(String(height))};max-height:${esc(String(height))};">
        ${body || '<div class="empty">No games found — check your section prefixes.</div>'}
      </ha-card>
    `;
  }

  // Tells HA roughly how many dashboard rows to allocate
  getCardSize() {
    return Math.ceil(parseInt(this._config?.height ?? 475) / 50);
  }

  // Minimal visual editor stub — HA shows a JSON fallback when this is absent
  static getConfigElement() {
    return document.createElement('sport-scoreboard-card-editor');
  }

  static getStubConfig() {
    return {
      height: '475px',
      sections: [
        { name: 'NBA Scoreboard', prefix: 'sensor.nba_', limit: 10, special_teams: [], sort: 'rank-win-loss' },
        { name: 'NHL Scoreboard', prefix: 'sensor.nhl_', limit: 5,  special_teams: [], sort: 'rank-win-draw-loss' },
      ],
    };
  }
}

customElements.define('sport-scoreboard-card', SportScoreboardCard);

// Register with the HA card picker
window.customCards = window.customCards || [];
window.customCards.push({
  type:        'sport-scoreboard-card',
  name:        'Sport Scoreboard Card',
  description: 'Compact sports scoreboard powered by ha-teamtracker',
  preview:     false,
});
