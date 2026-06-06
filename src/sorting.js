// rankType: 'win-loss' | 'win-draw-loss' | 'by-date'

export function winRatio(record, rankType) {
  const pts = String(record ?? '0-0').split('-').map(Number);
  if (rankType === 'win-draw-loss') {
    // points = 2W + D, max possible = 2(W+D+L)
    const total = pts[0] + pts[1] + pts[2];
    return total ? (2 * pts[0] + pts[2]) / (2 * total) : 0;
  }
  // win-loss: simple win percentage
  return (pts[0] + pts[1]) ? pts[0] / (pts[0] + pts[1]) : 0;
}

export function sortKeyFor(attr, rankType) {
  if (rankType === 'by-date') return new Date(attr?.date ?? 0).getTime();
  return winRatio(attr?.team_record, rankType);
}

export function preferHome(list, states) {
  return [...list].sort((a, b) => {
    const aHome = states[a.entityId]?.attributes?.team_homeaway === 'home' ? 0 : 1;
    const bHome = states[b.entityId]?.attributes?.team_homeaway === 'home' ? 0 : 1;
    return aHome - bHome;
  });
}

// For by-date sort, one row per game — deduplicate by (date, team pair), preferring home sensor.
export function deduplicate(list, rankType, states) {
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
