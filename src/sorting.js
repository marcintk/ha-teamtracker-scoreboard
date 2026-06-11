// sortMode: 'win-loss' | 'win-draw-loss' | 'win-loss-otl' | 'by-date'
//   win-loss:      W=2 L=0           (NBA, …)    record: W-L
//   win-draw-loss: W=3 D=1 L=0      (soccer, …) record: W-D-L
//   win-loss-otl:  W=2 OTL=1 L=0   (NHL, …)    record: W-L-OTL
//   by-date: internal — auto-applied outside the regular season

export function winRatio(record, sortMode) {
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
      if (!specialKeys.has(key) && homeKeys.has(key) &&
          states[entityId]?.attributes?.team_homeaway !== 'home') return false;
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
