import { describe, expect, it } from 'vitest';
import { deduplicate, sortKeyFor, winRatio } from '../src/sorting.js';

describe('winRatio', () => {
  it('calculates win percentage for win-loss', () => {
    expect(winRatio('30-10', 'win-loss')).toBeCloseTo(0.75);
    expect(winRatio('0-10', 'win-loss')).toBe(0);
    expect(winRatio('0-0', 'win-loss')).toBe(0);
  });

  it('calculates points ratio for win-draw-loss (soccer W=3 D=1 L=0)', () => {
    // 10W 5D 5L → points = 3*10+5 = 35, max = 3*20 = 60
    expect(winRatio('10-5-5', 'win-draw-loss')).toBeCloseTo(35 / 60);
    // 10W 3D 7L → points = 3*10+3 = 33, max = 3*20 = 60
    // Guards against swapping draws (pts[1]) with losses (pts[2]) in the formula.
    expect(winRatio('10-3-7', 'win-draw-loss')).toBeCloseTo(33 / 60);
    expect(winRatio('0-0-0', 'win-draw-loss')).toBe(0);
  });

  it('calculates points ratio for win-loss-otl (NHL W=2 OTL=1 L=0)', () => {
    // Record format: W-L-OTL
    // 40W 28L 14OTL → points = 2*40+14 = 94, max = 2*82 = 164
    expect(winRatio('40-28-14', 'win-loss-otl')).toBeCloseTo(94 / 164);
    // 35W 33L 14OTL → points = 2*35+14 = 84, max = 2*82 = 164
    expect(winRatio('35-33-14', 'win-loss-otl')).toBeCloseTo(84 / 164);
    expect(winRatio('0-0-0', 'win-loss-otl')).toBe(0);
  });

  it('handles missing or malformed record', () => {
    expect(winRatio(undefined, 'win-loss')).toBe(0);
    expect(winRatio('', 'win-loss')).toBe(0);
  });
});

describe('sortKeyFor', () => {
  it('returns timestamp for by-date', () => {
    const date = '2024-03-15T20:00:00Z';
    expect(sortKeyFor({ date }, 'by-date')).toBe(new Date(date).getTime());
  });

  it('returns 0 timestamp when date is missing or non-parseable', () => {
    expect(sortKeyFor({}, 'by-date')).toBe(0);
    expect(sortKeyFor(undefined, 'by-date')).toBe(0);
    // Empty string and sentinel values must not leak NaN into the sort comparator.
    expect(sortKeyFor({ date: '' }, 'by-date')).toBe(0);
    expect(sortKeyFor({ date: 'TBD' }, 'by-date')).toBe(0);
  });

  it('returns win ratio for win-loss', () => {
    expect(sortKeyFor({ team_record: '30-10' }, 'win-loss')).toBeCloseTo(0.75);
  });
});

describe('deduplicate', () => {
  it('returns list unchanged for non-by-date sort', () => {
    const list = [{ entityId: 'a' }, { entityId: 'b' }];
    expect(deduplicate(list, 'win-loss', {})).toBe(list);
    expect(deduplicate(list, 'win-draw-loss', {})).toBe(list);
  });

  it('removes duplicate game from two sensors for the same match', () => {
    const date = '2024-03-15';
    const states = {
      'sensor.wc_fra': {
        attributes: { team_homeaway: 'home', date, team_abbr: 'fra', opponent_abbr: 'bra' },
      },
      'sensor.wc_bra': {
        attributes: { team_homeaway: 'away', date, team_abbr: 'bra', opponent_abbr: 'fra' },
      },
    };
    const list = [{ entityId: 'sensor.wc_fra' }, { entityId: 'sensor.wc_bra' }];
    const result = deduplicate(list, 'by-date', states);
    expect(result).toHaveLength(1);
  });

  it('keeps both entries when games are on different dates', () => {
    const states = {
      'sensor.wc_fra': {
        attributes: {
          team_homeaway: 'home',
          date: '2024-03-15',
          team_abbr: 'fra',
          opponent_abbr: 'bra',
        },
      },
      'sensor.wc_bra': {
        attributes: {
          team_homeaway: 'home',
          date: '2024-03-16',
          team_abbr: 'bra',
          opponent_abbr: 'fra',
        },
      },
    };
    const list = [{ entityId: 'sensor.wc_fra' }, { entityId: 'sensor.wc_bra' }];
    expect(deduplicate(list, 'by-date', states)).toHaveLength(2);
  });

  it('handles entity missing from states gracefully', () => {
    const list = [
      { entityId: 'sensor.wc_fra' },
      { entityId: 'sensor.wc_missing' }, // not in states
    ];
    const states = {
      'sensor.wc_fra': {
        attributes: {
          team_homeaway: 'home',
          date: '2024-03-15',
          team_abbr: 'fra',
          opponent_abbr: 'bra',
        },
      },
    };
    // sensor.wc_missing hits the ?? {} fallback — key becomes "undefined_..."
    const result = deduplicate(list, 'by-date', states);
    expect(result).toHaveLength(2);
  });

  it('shows away-only game in correct date position when home sensor is missing', () => {
    // Bug: old code called preferHome() on the whole list, moving ALL away sensors to the end.
    // A game whose home sensor is missing/unavailable got pushed past games with home sensors,
    // so the limit slice cut it off and the game was never shown.
    const states = {
      'sensor.wc_early_away': {
        attributes: {
          team_homeaway: 'away',
          date: '2024-03-14',
          team_abbr: 'fra',
          opponent_abbr: 'bra',
        },
      },
      'sensor.wc_later_home': {
        attributes: {
          team_homeaway: 'home',
          date: '2024-03-15',
          team_abbr: 'gsw',
          opponent_abbr: 'lal',
        },
      },
    };
    // List is already date-sorted (earlier game first)
    const list = [{ entityId: 'sensor.wc_early_away' }, { entityId: 'sensor.wc_later_home' }];
    const result = deduplicate(list, 'by-date', states);
    expect(result).toHaveLength(2);
    // Date order must be preserved: the early away-only game comes before the later home game.
    expect(result[0].entityId).toBe('sensor.wc_early_away');
    expect(result[1].entityId).toBe('sensor.wc_later_home');
  });

  it('prefers home sensor and marks opponentSpecial when away sensor is special', () => {
    const date = '2024-03-15';
    const states = {
      'sensor.wc_fra': {
        attributes: { team_homeaway: 'home', date, team_abbr: 'fra', opponent_abbr: 'bra' },
      },
      'sensor.wc_bra': {
        attributes: { team_homeaway: 'away', date, team_abbr: 'bra', opponent_abbr: 'fra' },
      },
    };
    const list = [
      { entityId: 'sensor.wc_fra', special: false },
      { entityId: 'sensor.wc_bra', special: true },
    ];
    const result = deduplicate(list, 'by-date', states);
    expect(result).toHaveLength(1);
    expect(result[0].entityId).toBe('sensor.wc_fra');
    expect(result[0].opponentSpecial).toBe(true);
  });

  it('prefers home sensor and marks opponentSpecial regardless of list order', () => {
    const date = '2024-03-15';
    const states = {
      'sensor.wc_fra': {
        attributes: { team_homeaway: 'home', date, team_abbr: 'fra', opponent_abbr: 'bra' },
      },
      'sensor.wc_bra': {
        attributes: { team_homeaway: 'away', date, team_abbr: 'bra', opponent_abbr: 'fra' },
      },
    };
    // away-special sensor appears first in list
    const list = [
      { entityId: 'sensor.wc_bra', special: true },
      { entityId: 'sensor.wc_fra', special: false },
    ];
    const result = deduplicate(list, 'by-date', states);
    expect(result).toHaveLength(1);
    expect(result[0].entityId).toBe('sensor.wc_fra');
    expect(result[0].opponentSpecial).toBe(true);
  });

  it('keeps special away sensor when no home sensor exists in the section', () => {
    const date = '2024-03-15';
    const states = {
      'sensor.wc_bra': {
        attributes: { team_homeaway: 'away', date, team_abbr: 'bra', opponent_abbr: 'fra' },
      },
    };
    const list = [{ entityId: 'sensor.wc_bra', special: true }];
    const result = deduplicate(list, 'by-date', states);
    expect(result).toHaveLength(1);
    expect(result[0].entityId).toBe('sensor.wc_bra');
    expect(result[0].opponentSpecial).toBeUndefined();
  });

  it('drops non-special away sensor when home sensor is the special one', () => {
    const date = '2024-03-15';
    const states = {
      'sensor.wc_fra': {
        attributes: { team_homeaway: 'home', date, team_abbr: 'fra', opponent_abbr: 'bra' },
      },
      'sensor.wc_bra': {
        attributes: { team_homeaway: 'away', date, team_abbr: 'bra', opponent_abbr: 'fra' },
      },
    };
    // away-non-special sensor appears first to exercise the drop-non-special branch
    const list = [
      { entityId: 'sensor.wc_bra', special: false },
      { entityId: 'sensor.wc_fra', special: true },
    ];
    const result = deduplicate(list, 'by-date', states);
    expect(result).toHaveLength(1);
    expect(result[0].entityId).toBe('sensor.wc_fra');
    expect(result[0].opponentSpecial).toBeUndefined();
  });

  it('prefers home sensor when deduplicating', () => {
    const date = '2024-03-15';
    const states = {
      'sensor.wc_fra': {
        attributes: { team_homeaway: 'away', date, team_abbr: 'fra', opponent_abbr: 'bra' },
      },
      'sensor.wc_bra': {
        attributes: { team_homeaway: 'home', date, team_abbr: 'bra', opponent_abbr: 'fra' },
      },
    };
    const list = [{ entityId: 'sensor.wc_fra' }, { entityId: 'sensor.wc_bra' }];
    const result = deduplicate(list, 'by-date', states);
    expect(result[0].entityId).toBe('sensor.wc_bra');
  });
});
