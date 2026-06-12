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

function teamColor(side, attr, special, colors = {}, opponentSpecial = false) {
  if (!isTeamSide(side, attr)) {
    if (opponentSpecial) return colors.special ?? 'var(--scoreboard-special-color, #2196F3)';
    return colors.opponent ?? 'var(--scoreboard-opponent-color, #777)'; /* gray */
  }
  if (special)
    return colors.special ?? 'var(--scoreboard-special-color, #2196F3)'; /* Material Blue */
  return colors.team ?? 'var(--scoreboard-team-color, var(--primary-text-color, white))';
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
  if (gs === 'PRE') return '–';
  return isTeamSide(side, attr) ? (attr.team_score ?? '') : (attr.opponent_score ?? '');
}

function nameText(side, attr) {
  return isTeamSide(side, attr) ? esc(attr.team_name) : esc(attr.opponent_name);
}

function rankText(side, attr) {
  return isTeamSide(side, attr) ? esc(attr.team_record) : esc(attr.opponent_record);
}

function logoHtml(side, attr) {
  const url = safeLogoUrl(isTeamSide(side, attr) ? attr.team_logo : attr.opponent_logo);
  return url ? `<img src="${url}" alt="">` : '';
}

function tvHtml(gs, attr, colors = {}) {
  if (gs !== 'PRE' && gs !== 'IN') return '';
  const tv = String(attr.tv_network ?? '').trim();
  if (!tv) return '';
  const networks = tv.split('/').map((n) => n.trim());
  const hasMultiple = networks.length > 1;
  const first = networks[0];
  const truncated = first.substring(0, 3);
  const label = first.length > 3 || hasMultiple ? `${truncated}>` : truncated;
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
      const raw = String(attr.last_play ?? '');
      let subHtml = '';
      if (raw) {
        if (raw.length > 50) {
          subHtml = `<span class="msg-sub tv-tooltip" data-tooltip="${esc(raw)}">${esc(raw.substring(0, 50) + '>')}</span>`;
        } else {
          subHtml = `<span class="msg-sub">${esc(raw)}</span>`;
        }
      }
      return `<span style="color:${colors.live ?? 'indianred'}">${clock}</span>` + subHtml;
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

// sortMode: 'win-loss' | 'win-draw-loss' | 'win-loss-otl' | 'by-date'
//   win-loss:      W=2 L=0           (NBA, …)    record: W-L
//   win-draw-loss: W=3 D=1 L=0      (soccer, …) record: W-D-L
//   win-loss-otl:  W=2 OTL=1 L=0   (NHL, …)    record: W-L-OTL
//   by-date: internal — auto-applied outside the regular season

function winRatio(record, sortMode) {
  const pts = String(record ?? '0-0')
    .split('-')
    .map(Number);
  if (sortMode === 'win-draw-loss') {
    // points = 3W + D, max possible = 3(W+D+L)
    const total = pts[0] + pts[1] + pts[2];
    return total ? (3 * pts[0] + pts[1]) / (3 * total) : 0;
  }
  if (sortMode === 'win-loss-otl') {
    // points = 2W + OTL, max possible = 2(W+L+OTL)  — record order: W-L-OTL
    const total = pts[0] + pts[1] + pts[2];
    return total ? (2 * pts[0] + pts[2]) / (2 * total) : 0;
  }
  // win-loss: W/(W+L)
  const total = pts[0] + pts[1];
  return total ? pts[0] / total : 0;
}

function sortKeyFor(attr, sortMode) {
  if (sortMode === 'by-date') return Date.parse(attr?.date ?? '') || 0;
  return winRatio(attr?.team_record, sortMode);
}

// For by-date sort, one row per game — deduplicate by (date, team pair), preferring home sensor.
// Uses a two-pass approach to preserve the original date order: re-sorting the whole list by
// home/away would push away-only games (whose home-team sensor is missing) to the end where they
// get cut off by the limit slice even though a valid sensor is available.
function deduplicate(list, sortMode, states) {
  if (sortMode !== 'by-date') return list;

  const gameKey = (entityId) => {
    const { date, team_abbr, opponent_abbr } = states[entityId]?.attributes ?? {};
    return `${date}_${[team_abbr, opponent_abbr].sort().join('_')}`;
  };

  // First pass: find which game keys have at least one home-side and/or special sensor.
  const homeKeys = new Set();
  const specialKeys = new Set();
  const specialAwayKeys = new Set();
  for (const { entityId, special } of list) {
    const key = gameKey(entityId);
    if (states[entityId]?.attributes?.team_homeaway === 'home') homeKeys.add(key);
    if (special) {
      specialKeys.add(key);
      if (states[entityId]?.attributes?.team_homeaway !== 'home') specialAwayKeys.add(key);
    }
  }

  // Second pass: filter the original (date-sorted) list in place, then annotate.
  // When a special team plays away AND a home sensor also exists, prefer the home sensor
  // but mark opponentSpecial so the away team still renders highlighted.
  // Otherwise keep the special sensor (special-plays-away with no home counterpart).
  const seen = new Set();
  return list
    .filter(({ entityId, special }) => {
      const key = gameKey(entityId);
      if (seen.has(key)) return false;
      if (special && states[entityId]?.attributes?.team_homeaway !== 'home' && homeKeys.has(key))
        return false;
      if (specialKeys.has(key) && !special && (!specialAwayKeys.has(key) || !homeKeys.has(key)))
        return false;
      if (
        !specialKeys.has(key) &&
        homeKeys.has(key) &&
        states[entityId]?.attributes?.team_homeaway !== 'home'
      )
        return false;
      seen.add(key);
      return true;
    })
    .map((item) => {
      const key = gameKey(item.entityId);
      if (states[item.entityId]?.attributes?.team_homeaway === 'home' && specialAwayKeys.has(key))
        return { ...item, opponentSpecial: true };
      return item;
    });
}

function rowHtml(stateObj, special, colors = {}, opponentSpecial = false) {
  const gs = stateObj?.state ?? '';
  const attr = stateObj?.attributes ?? {};
  const bg = scoreBg(gs);

  return `
<div class="game-row">
  <div class="team-col team-col-a">
    <div class="team-name" style="color:${teamColor('home', attr, special, colors, opponentSpecial)};font-weight:${isTeamSide('home', attr) ? 'bold' : 'normal'}">${nameText('home', attr)}</div>
    <div class="team-rank" style="color:${teamColor('home', attr, special, colors, opponentSpecial)}">${rankText('home', attr)}</div>
  </div>
  <div class="logo logo-a">${logoHtml('home', attr)}</div>
  <div class="score score-a" style="background:${bg};color:${scoreColor('home', gs, attr, colors)}">${scoreText('home', gs, attr)}</div>
  <div class="colon" style="background:${bg};color:${colonColor(gs)}">${gs ? ':' : ''}</div>
  <div class="score score-b" style="background:${bg};color:${scoreColor('away', gs, attr, colors)}">${scoreText('away', gs, attr)}</div>
  <div class="logo logo-b">${logoHtml('away', attr)}</div>
  <div class="team-col team-col-b">
    <div class="team-name" style="color:${teamColor('away', attr, special, colors, opponentSpecial)};font-weight:${isTeamSide('away', attr) ? 'bold' : 'normal'}">${nameText('away', attr)}</div>
    <div class="team-rank" style="color:${teamColor('away', attr, special, colors, opponentSpecial)}">${rankText('away', attr)}</div>
  </div>
  <div class="message">${messageHtml(gs, attr, colors)}</div>
  <div class="tv">${tvHtml(gs, attr, colors)}</div>
</div>`;
}

function sectionHtml(section, states, stateKeysOrColors, colors) {
  let stateKeys, resolvedColors;
  if (Array.isArray(stateKeysOrColors)) {
    stateKeys = stateKeysOrColors;
    resolvedColors = colors ?? {};
  } else {
    stateKeys = Object.keys(states);
    resolvedColors = stateKeysOrColors ?? {};
  }
  const { name, prefix, limit = 10, special_teams = [], rankType = 'win-draw-loss' } = section;

  const entities = stateKeys.filter(
    (id) => id.startsWith(prefix) && VALID_STATES.has(states[id]?.state)
  );
  if (!entities.length) return '';

  // rankType applies to regular season only — auto-switch to by-date outside it
  const firstAttr = states[entities[0]]?.attributes;
  const sortMode = firstAttr?.season && firstAttr.season !== 'regular' ? 'by-date' : rankType;

  const items = entities.map((entityId) => {
    const attr = states[entityId]?.attributes;
    return {
      entityId,
      teamName: String(attr?.team_name ?? entityId),
      special: special_teams.includes(entityId.replace(prefix, '')),
      key: sortKeyFor(attr, sortMode),
    };
  });

  items.sort((a, b) => {
    const diff = sortMode === 'by-date' ? a.key - b.key : b.key - a.key;
    if (diff !== 0) return diff;
    const nameDiff = a.teamName.localeCompare(b.teamName);
    return nameDiff !== 0 ? nameDiff : a.entityId.localeCompare(b.entityId);
  });

  const rows = deduplicate(items, sortMode, states)
    .slice(0, limit)
    .map(({ entityId, special, opponentSpecial = false }) =>
      rowHtml(states[entityId], special, resolvedColors, opponentSpecial)
    )
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
    position: relative;
  }

  .team-col {
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 99px;
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
    width: 28px;
    height: 28px;
    object-fit: contain;
    display: block;
  }

  .score {
    width: 34px;
    min-width: 34px;
    font-size: 20px;
    font-weight: bold;
    height: 28px;
    display: flex;
    flex-direction: row;
    align-items: center;
    align-self: center;
  }
  .score-a { justify-content: flex-end; }
  .score-b { justify-content: flex-start; }

  .colon {
    width: 9px;
    min-width: 9px;
    font-size: 17px;
    font-weight: bold;
    text-align: center;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .tv {
    position: absolute;
    top: 2px;
    right: 2px;
    font-size: 0;
  }
  .tv-badge {
    font-size: 8px;
    font-weight: bold;
    color: white;
    border-radius: 3px;
    padding: 1px 2px;
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
    this._trackedIds = null;
    this._unsubscribe = null;
    this._needsRender = false;
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
      this._buildTrackedIds(Object.keys(hass.states));
      if (this._config && isAuto) this._render();
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
    const isAuto = !this._config.refresh || this._config.refresh === 'auto';
    if (!isAuto || !this._hass?.connection?.subscribeEvents) return;

    this._hass.connection
      .subscribeEvents((event) => {
        if (this._trackedIds?.has(event.data.entity_id)) {
          this._needsRender = true;
        }
      }, 'state_changed')
      .then((unsub) => {
        this._unsubscribe = unsub;
      })
      .catch(() => {});
  }

  _clearSubscription() {
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

      if (!Array.isArray(sections) || !sections.length) {
        this._showError('Add at least one section to your card config.');
        return;
      }

      const stateKeys = Object.keys(states);
      this._buildTrackedIds(stateKeys);
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
