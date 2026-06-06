import { describe, it, expect } from 'vitest';
import { rowHtml, sectionHtml } from '../src/render.js';

const makeState = (state, attrs) => ({ state, attributes: attrs });

const baseAttrs = {
  team_homeaway: 'home',
  team_name: 'Lakers',
  opponent_name: 'Celtics',
  team_record: '20-10',
  opponent_record: '18-12',
  team_score: '95',
  opponent_score: '90',
  team_winner: true,
  opponent_winner: false,
  team_logo: 'https://cdn.example.com/lal.png',
  opponent_logo: 'https://cdn.example.com/bos.png',
  season: 'regular',
};

describe('rowHtml', () => {
  it('renders a game-row div', () => {
    const html = rowHtml(makeState('PRE', baseAttrs), false);
    expect(html).toContain('class="game-row"');
  });

  it('renders team names', () => {
    const html = rowHtml(makeState('PRE', baseAttrs), false);
    expect(html).toContain('Lakers');
    expect(html).toContain('Celtics');
  });

  it('renders records', () => {
    const html = rowHtml(makeState('PRE', baseAttrs), false);
    expect(html).toContain('20-10');
    expect(html).toContain('18-12');
  });

  it('shows dash for scores in PRE state', () => {
    const html = rowHtml(makeState('PRE', baseAttrs), false);
    expect(html).toContain('–');
  });

  it('shows actual scores in IN state', () => {
    const html = rowHtml(makeState('IN', baseAttrs), false);
    expect(html).toContain('95');
    expect(html).toContain('90');
  });

  it('renders colon when game is found', () => {
    const html = rowHtml(makeState('IN', baseAttrs), false);
    expect(html).toContain(':');
  });

  it('renders logo img tag', () => {
    const html = rowHtml(makeState('PRE', baseAttrs), false);
    expect(html).toContain('<img');
    expect(html).toContain('https://cdn.example.com/lal.png');
  });

  it('renders gracefully when stateObj is null', () => {
    const html = rowHtml(null, false);
    expect(html).toContain('class="game-row"');
    expect(html).not.toContain('<img');
  });
});

describe('sectionHtml', () => {
  const section = { name: 'NBA', prefix: 'sensor.nba_', limit: 10, special_teams: [], rankType: 'win-loss' };

  it('returns empty string when no matching entities', () => {
    expect(sectionHtml(section, {})).toBe('');
  });

  it('returns empty string when entities are in invalid states', () => {
    const states = { 'sensor.nba_lal': makeState('UNKNOWN', baseAttrs) };
    expect(sectionHtml(section, states)).toBe('');
  });

  it('renders section header with name', () => {
    const states = { 'sensor.nba_lal': makeState('PRE', baseAttrs) };
    const html = sectionHtml(section, states);
    expect(html).toContain('section-header');
    expect(html).toContain('NBA');
  });

  it('renders a row for each matching entity', () => {
    const states = {
      'sensor.nba_lal': makeState('PRE', baseAttrs),
      'sensor.nba_gsw': makeState('IN', { ...baseAttrs, team_name: 'Warriors' }),
    };
    const html = sectionHtml(section, states);
    expect(html).toContain('Lakers');
    expect(html).toContain('Warriors');
  });

  it('respects the limit', () => {
    const states = Object.fromEntries(
      Array.from({ length: 5 }, (_, i) => [
        `sensor.nba_team${i}`,
        makeState('PRE', { ...baseAttrs, team_name: `Team${i}`, team_record: `${i}-10` }),
      ])
    );
    const html = sectionHtml({ ...section, limit: 2 }, states);
    const rowCount = (html.match(/class="game-row"/g) ?? []).length;
    expect(rowCount).toBe(2);
  });

  it('escapes HTML in section name', () => {
    const states = { 'sensor.nba_lal': makeState('PRE', baseAttrs) };
    const html = sectionHtml({ ...section, name: '<b>NBA</b>' }, states);
    expect(html).toContain('&lt;b&gt;NBA&lt;/b&gt;');
  });

  it('marks special teams correctly', () => {
    const states = { 'sensor.nba_lal': makeState('PRE', baseAttrs) };
    const html = sectionHtml({ ...section, special_teams: ['lal'] }, states);
    expect(html).toContain('scoreboard-special-color');
  });

  it('auto-switches to by-date sort outside regular season', () => {
    const states = {
      'sensor.nba_lal': makeState('PRE', { ...baseAttrs, season: 'playoffs', date: '2024-04-20T00:00:00Z' }),
    };
    // Should not throw — just verifies the fallback path executes cleanly
    expect(() => sectionHtml(section, states)).not.toThrow();
  });
});
