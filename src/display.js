import { esc } from './utils.js';

// Returns true when `side` ('home'|'away') matches the sensor's tracked team.
export function isTeamSide(side, attr) {
  return side === 'home' ? attr?.team_homeaway === 'home' : attr?.team_homeaway !== 'home';
}

export function teamColor(side, attr, special, colors = {}, opponentSpecial = false) {
  if (!isTeamSide(side, attr)) {
    if (opponentSpecial) return colors.special ?? 'var(--scoreboard-special-color, #2196F3)';
    return colors.opponent ?? 'var(--scoreboard-opponent-color, #777)'; /* gray */
  }
  if (special)
    return colors.special ?? 'var(--scoreboard-special-color, #2196F3)'; /* Material Blue */
  return colors.team ?? 'var(--scoreboard-team-color, var(--primary-text-color, white))';
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
  if (gs === 'PRE') return '–';
  return isTeamSide(side, attr) ? (attr.team_score ?? '') : (attr.opponent_score ?? '');
}

export function nameText(side, attr) {
  return isTeamSide(side, attr) ? esc(attr.team_name) : esc(attr.opponent_name);
}

export function rankText(side, attr) {
  return isTeamSide(side, attr) ? esc(attr.team_record) : esc(attr.opponent_record);
}
