import { describe, expect, it } from 'vitest';
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
  const section = {
    name: 'NBA',
    prefix: 'sensor.nba_',
    limit: 10,
    special_teams: [],
    rankType: 'win-loss',
  };

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

  it('marks special teams correctly using default CSS var color', () => {
    const states = { 'sensor.nba_lal': makeState('PRE', baseAttrs) };
    const html = sectionHtml({ ...section, special_teams: ['lal'] }, states);
    expect(html).toContain('scoreboard-special-color');
  });

  it('applies config colors to special teams', () => {
    const states = { 'sensor.nba_lal': makeState('PRE', baseAttrs) };
    const html = sectionHtml({ ...section, special_teams: ['lal'] }, states, Object.keys(states), {
      special: 'gold',
    });
    expect(html).toContain('gold');
    expect(html).not.toContain('scoreboard-special-color');
  });

  it('accepts pre-filtered entity IDs without colors', () => {
    const states = { 'sensor.nba_lal': makeState('PRE', baseAttrs) };
    const html = sectionHtml(section, states, Object.keys(states));
    expect(html).toContain('class="game-row"');
  });

  it('accepts pre-filtered entity IDs and still applies colors', () => {
    const states = { 'sensor.nba_lal': makeState('PRE', baseAttrs) };
    const html = sectionHtml({ ...section, special_teams: ['lal'] }, states, Object.keys(states), {
      special: 'gold',
    });
    expect(html).toContain('gold');
    expect(html).not.toContain('scoreboard-special-color');
  });

  it('applies config colors to team and opponent', () => {
    const states = { 'sensor.nba_lal': makeState('PRE', baseAttrs) };
    const html = sectionHtml(section, states, Object.keys(states), {
      team: 'cyan',
      opponent: 'dimgray',
    });
    expect(html).toContain('cyan');
    expect(html).toContain('dimgray');
  });

  it('sorts by-date with multiple entities in ascending date order', () => {
    const states = {
      'sensor.wc_bra': makeState('PRE', {
        ...baseAttrs,
        date: '2024-04-20T00:00:00Z',
        team_name: 'Brazil',
        season: 'regular',
      }),
      'sensor.wc_fra': makeState('PRE', {
        ...baseAttrs,
        date: '2024-04-18T00:00:00Z',
        team_name: 'France',
        season: 'regular',
      }),
    };
    const wcSection = {
      name: 'WC',
      prefix: 'sensor.wc_',
      limit: 10,
      special_teams: [],
      rankType: 'by-date',
    };
    const html = sectionHtml(wcSection, states);
    expect(html.indexOf('France')).toBeLessThan(html.indexOf('Brazil'));
  });

  it('produces stable order when two teams have the same win ratio', () => {
    // Both teams are 5-5 → identical winRatio(0.5). Without a tie-breaker the sort
    // is non-deterministic and the rows could swap on every render (blinking).
    const states = {
      'sensor.nba_zzz': makeState('PRE', { ...baseAttrs, team_name: 'ZZZ', team_record: '5-5' }),
      'sensor.nba_aaa': makeState('PRE', { ...baseAttrs, team_name: 'AAA', team_record: '5-5' }),
    };
    const html1 = sectionHtml(section, states);
    const html2 = sectionHtml(section, states);
    expect(html1).toBe(html2);
    // team name tie-break is alphabetical: AAA < ZZZ
    expect(html1.indexOf('AAA')).toBeLessThan(html1.indexOf('ZZZ'));
  });

  it('produces stable order when two by-date games have the same kick-off time', () => {
    // Both games at identical timestamp → same sort key. Without a tie-breaker
    // the order depends on Object.keys() insertion order → potential blink.
    const sameTime = '2024-04-20T15:00:00Z';
    const states = {
      'sensor.wc_zzz': makeState('PRE', {
        ...baseAttrs,
        team_name: 'ZZZ',
        team_abbr: 'zzz',
        opponent_abbr: 'yyy',
        date: sameTime,
        season: 'postseason',
      }),
      'sensor.wc_aaa': makeState('PRE', {
        ...baseAttrs,
        team_name: 'AAA',
        team_abbr: 'aaa',
        opponent_abbr: 'bbb',
        date: sameTime,
        season: 'postseason',
      }),
    };
    const wcSection = {
      name: 'WC',
      prefix: 'sensor.wc_',
      limit: 10,
      special_teams: [],
      rankType: 'by-date',
    };
    const html1 = sectionHtml(wcSection, states);
    const html2 = sectionHtml(wcSection, states);
    expect(html1).toBe(html2);
    // team name tie-break is alphabetical: AAA < ZZZ
    expect(html1.indexOf('AAA')).toBeLessThan(html1.indexOf('ZZZ'));
  });

  it('keeps configured rankType when first entity has no season attribute yet', () => {
    // sensor.nba_aaa is alphabetically first — Object.keys returns it first.
    // It has no season field, so firstAttr?.season is undefined.
    // Bug: undefined !== 'regular' → sortMode='by-date', keys all 0, alpha tie-break → Team A first.
    // Fix: undefined && ... → false → sortMode='win-loss', Team Z (0.833) > Team A (0.167) → Team Z first.
    const states = {
      'sensor.nba_aaa': makeState('PRE', { team_name: 'Team A', team_record: '5-25' }),
      'sensor.nba_zzz': makeState('PRE', {
        ...baseAttrs,
        team_name: 'Team Z',
        team_record: '25-5',
      }),
    };
    const html = sectionHtml({ ...section, rankType: 'win-loss' }, states);
    expect(html.indexOf('Team Z')).toBeLessThan(html.indexOf('Team A'));
  });

  it('falls back to entityId as teamName when team_name attribute is absent', () => {
    // Covers the ?? entityId branch on the teamName assignment (line 59).
    const states = {
      'sensor.nba_lal': makeState('PRE', { ...baseAttrs, team_name: undefined }),
    };
    expect(() => sectionHtml(section, states)).not.toThrow();
    expect(sectionHtml(section, states)).toContain('class="game-row"');
  });

  it('uses entityId as final tie-breaker when team names and sort keys are equal', () => {
    // Covers the a.entityId.localeCompare branch (line 69): only reached when
    // nameDiff === 0, i.e. two entities share the same teamName and win ratio.
    const states = {
      'sensor.nba_zzz': makeState('PRE', {
        ...baseAttrs,
        team_name: 'Lakers',
        team_record: '10-10',
        opponent_name: 'Opp-Z',
      }),
      'sensor.nba_aaa': makeState('PRE', {
        ...baseAttrs,
        team_name: 'Lakers',
        team_record: '10-10',
        opponent_name: 'Opp-A',
      }),
    };
    const html = sectionHtml(section, states);
    // nba_aaa < nba_zzz lexicographically → Opp-A row must come before Opp-Z row.
    expect(html.indexOf('Opp-A')).toBeLessThan(html.indexOf('Opp-Z'));
  });

  it('preserves special-team highlight when special team plays away against a tracked home opponent', () => {
    const date = '2024-04-20T00:00:00Z';
    const states = {
      'sensor.nba_lal': makeState('PRE', {
        ...baseAttrs,
        team_homeaway: 'away',
        team_abbr: 'LAL',
        opponent_abbr: 'BOS',
        date,
        season: 'playoffs',
      }),
      'sensor.nba_bos': makeState('PRE', {
        ...baseAttrs,
        team_homeaway: 'home',
        team_name: 'Celtics',
        team_abbr: 'BOS',
        opponent_abbr: 'LAL',
        date,
        season: 'playoffs',
      }),
    };
    const html = sectionHtml({ ...section, special_teams: ['lal'] }, states);
    // LAL (away, special) must still render highlighted even though BOS (home) sensor is used
    expect(html).toContain('scoreboard-special-color');
    // BOS (home, non-special) must remain bold white — not demoted to opponent gray
    expect(html).toContain('scoreboard-team-color');
    expect(html).toContain('font-weight:bold');
  });

  it('auto-switches to by-date sort outside regular season', () => {
    const states = {
      'sensor.nba_lal': makeState('PRE', {
        ...baseAttrs,
        season: 'playoffs',
        date: '2024-04-20T00:00:00Z',
      }),
    };
    // Should not throw — just verifies the fallback path executes cleanly
    expect(() => sectionHtml(section, states)).not.toThrow();
  });
});
