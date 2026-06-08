// sortMode: 'win-loss' | 'win-draw-loss' | 'by-date'  (by-date is internal only — auto-applied outside regular season)

export function winRatio(record, sortMode) {
  const pts = String(record ?? '0-0')
    .split('-')
    .map(Number);
  if (sortMode === 'win-draw-loss') {
    // points = 2W + D, max possible = 2(W+D+L)
    const total = pts[0] + pts[1] + pts[2];
    return total ? (2 * pts[0] + pts[1]) / (2 * total) : 0;
  }
  // win-loss: simple win percentage
  const total = pts[0] + pts[1];
  return total ? pts[0] / total : 0;
}

export function sortKeyFor(attr, sortMode) {
  if (sortMode === 'by-date') return Date.parse(attr?.date ?? '') || 0;
  return winRatio(attr?.team_record, sortMode);
}

export function preferHome(list, states) {
  return [...list].sort((a, b) => {
    const aHome = states[a.entityId]?.attributes?.team_homeaway === 'home' ? 0 : 1;
    const bHome = states[b.entityId]?.attributes?.team_homeaway === 'home' ? 0 : 1;
    return aHome - bHome;
  });
}

// For by-date sort, one row per game — deduplicate by (date, team pair), preferring home sensor.
// Uses a two-pass approach to preserve the original date order: re-sorting the whole list by
// home/away would push away-only games (whose home-team sensor is missing) to the end where they
// get cut off by the limit slice even though a valid sensor is available.
export function deduplicate(list, sortMode, states) {
  if (sortMode !== 'by-date') return list;

  const gameKey = (entityId) => {
    const { date, team_abbr, opponent_abbr } = states[entityId]?.attributes ?? {};
    return `${date}_${[team_abbr, opponent_abbr].sort().join('_')}`;
  };

  // First pass: find which game keys have at least one home-side sensor.
  const homeKeys = new Set();
  for (const { entityId } of list) {
    if (states[entityId]?.attributes?.team_homeaway === 'home') {
      homeKeys.add(gameKey(entityId));
    }
  }

  // Second pass: filter the original (date-sorted) list in place.
  // Skip an away sensor only when a home sensor exists for the same game.
  const seen = new Set();
  return list.filter(({ entityId }) => {
    const key = gameKey(entityId);
    if (seen.has(key)) return false;
    const homeaway = states[entityId]?.attributes?.team_homeaway;
    if (homeKeys.has(key) && homeaway !== 'home') return false;
    seen.add(key);
    return true;
  });
}
