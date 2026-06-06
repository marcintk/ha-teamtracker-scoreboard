import { esc, safeLogoUrl } from './utils.js';

// Returns true when `side` ('home'|'away') matches the sensor's tracked team.
export function isTeamSide(side, attr) {
  return side === 'home' ? attr?.team_homeaway === 'home' : attr?.team_homeaway !== 'home';
}

export function teamColor(side, attr, special, colors = {}) {
  if (!isTeamSide(side, attr))
    return colors.opponent ?? 'var(--scoreboard-opponent-color, #777)'; /* gray */
  if (special)
    return colors.special ?? 'var(--scoreboard-special-color, #2196F3)'; /* Material Blue */
  return colors.team ?? 'var(--scoreboard-team-color, white)';
}

export function scoreBg(gs) {
  if (gs === 'PRE') return '#303030'; /* near-black */
  if (gs === 'IN') return 'lightgray';
  return 'transparent';
}

export function scoreColor(side, gs, attr, colors = {}) {
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

export function colonColor(gs) {
  if (gs === 'PRE' || gs === 'IN') return 'black';
  if (gs === 'POST') return '#777'; /* gray */
  return 'transparent';
}

export function scoreText(side, gs, attr) {
  if (gs === 'NOT_FOUND') return '';
  if (gs === 'PRE') return '–';
  return isTeamSide(side, attr) ? (attr.team_score ?? '') : (attr.opponent_score ?? '');
}

export function nameText(side, attr) {
  return isTeamSide(side, attr) ? esc(attr.team_name) : esc(attr.opponent_name);
}

export function rankText(side, attr) {
  return isTeamSide(side, attr) ? esc(attr.team_record) : esc(attr.opponent_record);
}

export function logoHtml(side, gs, attr) {
  if (gs === 'NOT_FOUND') return '';
  const url = safeLogoUrl(isTeamSide(side, attr) ? attr.team_logo : attr.opponent_logo);
  return url ? `<img src="${url}" alt="">` : '';
}

export function tvHtml(gs, attr, colors = {}) {
  if (gs !== 'PRE' && gs !== 'IN') return '';
  const tv = String(attr.tv_network ?? '').trim();
  if (!tv) return '';
  const label = tv.includes('/') ? `${tv.split('/')[0].substring(0, 8)}›` : tv.substring(0, 8);
  const bg = gs === 'IN' ? (colors.live ?? 'indianred') : '#666'; /* dimgray */
  return `<span class="tv-badge" style="background:${bg}">${esc(label)}</span>`;
}

export function messageHtml(gs, attr, colors = {}) {
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
