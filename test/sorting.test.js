import { describe, expect, it } from 'vitest';
import { deduplicate, preferHome, sortKeyFor, winRatio } from '../src/sorting.js';

describe('winRatio', () => {
  it('calculates win percentage for win-loss', () => {
    expect(winRatio('30-10', 'win-loss')).toBeCloseTo(0.75);
    expect(winRatio('0-10', 'win-loss')).toBe(0);
    expect(winRatio('0-0', 'win-loss')).toBe(0);
  });

  it('calculates points ratio for win-draw-loss', () => {
    // 10W 5D 5L → points = 25, max = 40 → 0.625
    expect(winRatio('10-5-5', 'win-draw-loss')).toBeCloseTo(25 / 40);
    expect(winRatio('0-0-0', 'win-draw-loss')).toBe(0);
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

  it('returns 0 timestamp when date is missing', () => {
    expect(sortKeyFor({}, 'by-date')).toBe(new Date(0).getTime());
    expect(sortKeyFor(undefined, 'by-date')).toBe(new Date(0).getTime());
  });

  it('returns win ratio for win-loss', () => {
    expect(sortKeyFor({ team_record: '30-10' }, 'win-loss')).toBeCloseTo(0.75);
  });
});

describe('preferHome', () => {
  it('puts home sensor before away sensor', () => {
    const states = {
      'sensor.nba_lal': { attributes: { team_homeaway: 'away' } },
      'sensor.nba_gsw': { attributes: { team_homeaway: 'home' } },
    };
    const list = [{ entityId: 'sensor.nba_lal' }, { entityId: 'sensor.nba_gsw' }];
    const result = preferHome(list, states);
    expect(result[0].entityId).toBe('sensor.nba_gsw');
  });

  it('keeps home sensor first when it is already first in the list', () => {
    // Covers the comparator branch where `a` is home and `b` is away (lines 23-24 true/false).
    const states = {
      'sensor.nba_gsw': { attributes: { team_homeaway: 'home' } },
      'sensor.nba_lal': { attributes: { team_homeaway: 'away' } },
      'sensor.nba_bos': { attributes: { team_homeaway: 'away' } },
    };
    const list = [
      { entityId: 'sensor.nba_gsw' },
      { entityId: 'sensor.nba_lal' },
      { entityId: 'sensor.nba_bos' },
    ];
    const result = preferHome(list, states);
    expect(result[0].entityId).toBe('sensor.nba_gsw');
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
