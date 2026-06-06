import { describe, it, expect } from 'vitest';
import { winRatio, sortKeyFor, preferHome, deduplicate } from '../src/sorting.js';

const state = (homeaway, date, team_abbr, opponent_abbr, team_record) => ({
  entityId: `sensor.nba_${team_abbr}`,
  attributes: { team_homeaway: homeaway, date, team_abbr, opponent_abbr, team_record },
});

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
    const list = [
      { entityId: 'sensor.nba_lal' },
      { entityId: 'sensor.nba_gsw' },
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
      'sensor.wc_fra': { attributes: { team_homeaway: 'home', date, team_abbr: 'fra', opponent_abbr: 'bra' } },
      'sensor.wc_bra': { attributes: { team_homeaway: 'away', date, team_abbr: 'bra', opponent_abbr: 'fra' } },
    };
    const list = [
      { entityId: 'sensor.wc_fra' },
      { entityId: 'sensor.wc_bra' },
    ];
    const result = deduplicate(list, 'by-date', states);
    expect(result).toHaveLength(1);
  });

  it('keeps both entries when games are on different dates', () => {
    const states = {
      'sensor.wc_fra': { attributes: { team_homeaway: 'home', date: '2024-03-15', team_abbr: 'fra', opponent_abbr: 'bra' } },
      'sensor.wc_bra': { attributes: { team_homeaway: 'home', date: '2024-03-16', team_abbr: 'bra', opponent_abbr: 'fra' } },
    };
    const list = [
      { entityId: 'sensor.wc_fra' },
      { entityId: 'sensor.wc_bra' },
    ];
    expect(deduplicate(list, 'by-date', states)).toHaveLength(2);
  });

  it('prefers home sensor when deduplicating', () => {
    const date = '2024-03-15';
    const states = {
      'sensor.wc_fra': { attributes: { team_homeaway: 'away', date, team_abbr: 'fra', opponent_abbr: 'bra' } },
      'sensor.wc_bra': { attributes: { team_homeaway: 'home', date, team_abbr: 'bra', opponent_abbr: 'fra' } },
    };
    const list = [
      { entityId: 'sensor.wc_fra' },
      { entityId: 'sensor.wc_bra' },
    ];
    const result = deduplicate(list, 'by-date', states);
    expect(result[0].entityId).toBe('sensor.wc_bra');
  });
});
