import { describe, expect, it } from 'vitest';
import {
  colonColor,
  isTeamSide,
  logoHtml,
  messageHtml,
  nameText,
  rankText,
  scoreBg,
  scoreColor,
  scoreText,
  teamColor,
  tvHtml,
} from '../src/display.js';

const homeAttr = {
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
};

const awayAttr = { ...homeAttr, team_homeaway: 'away' };

describe('isTeamSide', () => {
  it('matches home side when team is home', () => {
    expect(isTeamSide('home', homeAttr)).toBe(true);
    expect(isTeamSide('away', homeAttr)).toBe(false);
  });

  it('matches away side when team is away', () => {
    expect(isTeamSide('away', awayAttr)).toBe(true);
    expect(isTeamSide('home', awayAttr)).toBe(false);
  });

  it('handles missing attr gracefully', () => {
    expect(isTeamSide('home', {})).toBe(false);
    expect(isTeamSide('away', {})).toBe(true);
  });
});

describe('teamColor', () => {
  it('returns team color when side matches', () => {
    expect(teamColor('home', homeAttr, false)).toBe(
      'var(--scoreboard-team-color, var(--primary-text-color, white))'
    );
  });

  it('returns special color (blue) when side matches and special is true', () => {
    expect(teamColor('home', homeAttr, true)).toBe('var(--scoreboard-special-color, #2196F3)');
  });

  it('returns special color when tracked team is away and special is true', () => {
    expect(teamColor('away', awayAttr, true)).toBe('var(--scoreboard-special-color, #2196F3)');
  });

  it('returns opponent color when side does not match', () => {
    expect(teamColor('away', homeAttr, false)).toBe('var(--scoreboard-opponent-color, #777)');
    expect(teamColor('away', homeAttr, true)).toBe('var(--scoreboard-opponent-color, #777)');
  });

  it('returns special color for opponent side when opponentSpecial is true', () => {
    expect(teamColor('away', homeAttr, false, {}, true)).toBe(
      'var(--scoreboard-special-color, #2196F3)'
    );
    const colors = { special: 'gold', opponent: 'gray' };
    expect(teamColor('away', homeAttr, false, colors, true)).toBe('gold');
  });

  it('uses config colors when provided', () => {
    const colors = { team: 'cyan', special: 'gold', opponent: 'gray' };
    expect(teamColor('home', homeAttr, false, colors)).toBe('cyan');
    expect(teamColor('home', homeAttr, true, colors)).toBe('gold');
    expect(teamColor('away', homeAttr, false, colors)).toBe('gray');
  });
});

describe('scoreBg', () => {
  it('returns dark background for PRE', () => {
    expect(scoreBg('PRE')).toBe('#303030');
  });

  it('returns light background for IN', () => {
    expect(scoreBg('IN')).toBe('lightgray');
  });

  it('returns transparent for POST and other states', () => {
    expect(scoreBg('POST')).toBe('transparent');
    expect(scoreBg('BYE')).toBe('transparent');
  });
});

describe('scoreColor', () => {
  it('returns black for PRE regardless of side', () => {
    expect(scoreColor('home', 'PRE', homeAttr)).toBe('black');
    expect(scoreColor('away', 'PRE', homeAttr)).toBe('black');
  });

  it('returns brown for leading team during IN', () => {
    // home team scores 95 vs 90 — home is leading
    expect(scoreColor('home', 'IN', homeAttr)).toBe('brown');
    expect(scoreColor('away', 'IN', homeAttr)).toBe('black');
  });

  it('returns orange for winner and darkgray for loser in POST', () => {
    expect(scoreColor('home', 'POST', homeAttr)).toBe('orange');
    expect(scoreColor('away', 'POST', homeAttr)).toBe('darkgray');
  });

  it('uses config colors for winner, loser, and leading', () => {
    const colors = { winner: 'gold', loser: 'silver', leading: 'teal' };
    expect(scoreColor('home', 'POST', homeAttr, colors)).toBe('gold');
    expect(scoreColor('away', 'POST', homeAttr, colors)).toBe('silver');
    expect(scoreColor('home', 'IN', homeAttr, colors)).toBe('teal');
  });
});

describe('colonColor', () => {
  it('is black for active game states', () => {
    expect(colonColor('PRE')).toBe('black');
    expect(colonColor('IN')).toBe('black');
  });

  it('is muted for POST and transparent for unknown', () => {
    expect(colonColor('POST')).toBe('#777');
    expect(colonColor('BYE')).toBe('transparent');
  });
});

describe('scoreText', () => {
  it('returns dash for PRE', () => {
    expect(scoreText('home', 'PRE', homeAttr)).toBe('–');
    expect(scoreText('away', 'PRE', homeAttr)).toBe('–');
  });

  it('returns correct score for home sensor during IN', () => {
    expect(scoreText('home', 'IN', homeAttr)).toBe('95');
    expect(scoreText('away', 'IN', homeAttr)).toBe('90');
  });

  it('returns empty string when score is undefined in IN state', () => {
    const attr = { team_homeaway: 'home', team_score: undefined, opponent_score: undefined };
    expect(scoreText('home', 'IN', attr)).toBe('');
    expect(scoreText('away', 'IN', attr)).toBe('');
  });
});

describe('nameText', () => {
  it('returns team name on the tracked side', () => {
    expect(nameText('home', homeAttr)).toBe('Lakers');
    expect(nameText('away', homeAttr)).toBe('Celtics');
  });

  it('escapes HTML in team names', () => {
    const attr = { team_homeaway: 'home', team_name: '<script>', opponent_name: 'Safe' };
    expect(nameText('home', attr)).toBe('&lt;script&gt;');
  });
});

describe('rankText', () => {
  it('returns correct record for each side', () => {
    expect(rankText('home', homeAttr)).toBe('20-10');
    expect(rankText('away', homeAttr)).toBe('18-12');
  });
});

describe('logoHtml', () => {
  it('returns img tag for valid https logo URL', () => {
    const html = logoHtml('home', homeAttr);
    expect(html).toContain('<img');
    expect(html).toContain('https://cdn.example.com/lal.png');
  });

  it('rejects non-https logo URLs', () => {
    const attr = { ...homeAttr, team_logo: 'http://insecure.example.com/logo.png' };
    expect(logoHtml('home', attr)).toBe('');
  });
});

describe('tvHtml', () => {
  it('returns empty for POST state', () => {
    expect(tvHtml('POST', { tv_network: 'ESPN' })).toBe('');
  });

  it('returns empty when tv_network is blank', () => {
    expect(tvHtml('IN', { tv_network: '' })).toBe('');
    expect(tvHtml('IN', { tv_network: '   ' })).toBe('');
  });

  it('returns red badge for IN state', () => {
    const html = tvHtml('IN', { tv_network: 'ESPN' });
    expect(html).toContain('ESP');
    expect(html).toContain('indianred');
  });

  it('uses config live color for IN TV badge', () => {
    const html = tvHtml('IN', { tv_network: 'ESPN' }, { live: 'steelblue' });
    expect(html).toContain('steelblue');
  });

  it('returns gray badge for PRE state', () => {
    const html = tvHtml('PRE', { tv_network: 'TNT' });
    expect(html).toContain('TNT');
    expect(html).toContain('#666');
  });

  it('truncates long network names to 3 chars with > suffix', () => {
    const html = tvHtml('PRE', { tv_network: 'VERY_LONG_CHANNEL_NAME' });
    expect(html).toContain('VER&gt;');
    expect(html).not.toContain('VERY_LONG_CHANNEL_NAME');
  });

  it('shows > suffix for single network name longer than 3 chars', () => {
    const html = tvHtml('PRE', { tv_network: 'ESPN' });
    expect(html).toContain('ESP&gt;');
  });

  it('shows no suffix for short network name (3 chars or fewer)', () => {
    const html = tvHtml('PRE', { tv_network: 'TNT' });
    expect(html).toContain('TNT');
    expect(html).not.toContain('&gt;');
  });

  it('handles multi-network with slash', () => {
    const html = tvHtml('PRE', { tv_network: 'ESPN/ESPN2' });
    expect(html).toContain('&gt;');
  });

  it('wraps multi-network badge in tooltip element', () => {
    const html = tvHtml('PRE', { tv_network: 'ESPN/ESPN2' });
    expect(html).toContain('tv-tooltip');
    expect(html).toContain('data-tooltip');
  });

  it('tooltip contains all networks separated by ·', () => {
    const html = tvHtml('PRE', { tv_network: 'ESPN/ESPN2/TNT' });
    expect(html).toContain('ESPN · ESPN2 · TNT');
  });

  it('trims whitespace around network names in tooltip', () => {
    const html = tvHtml('PRE', { tv_network: 'ESPN / ESPN2' });
    expect(html).toContain('ESPN · ESPN2');
  });

  it('does not wrap single network in tooltip element', () => {
    const html = tvHtml('PRE', { tv_network: 'ESPN' });
    expect(html).not.toContain('tv-tooltip');
    expect(html).not.toContain('data-tooltip');
  });
});

describe('messageHtml', () => {
  it('shows kickoff and odds for PRE', () => {
    const html = messageHtml('PRE', { kickoff_in: '2h', odds: 'LAL -3.5' });
    expect(html).toContain('2h');
    expect(html).toContain('LAL -3.5');
  });

  it('shows only kickoff for PRE when no odds or series summary', () => {
    const html = messageHtml('PRE', { kickoff_in: 'Tomorrow' });
    expect(html).toContain('Tomorrow');
    expect(html).not.toContain('msg-sub');
  });

  it('shows clock and last_play for IN', () => {
    const html = messageHtml('IN', { clock: 'Q3 5:00', last_play: 'Touchdown - LAL' });
    expect(html).toContain('Q3 5:00');
    expect(html).toContain('Touchdown - LAL');
    expect(html).not.toContain('tv-tooltip');
  });

  it('omits last_play span when last_play is absent', () => {
    const html = messageHtml('IN', { clock: 'Q3 5:00' });
    expect(html).toContain('Q3 5:00');
    expect(html).not.toContain('msg-sub');
  });

  it('truncates last_play longer than 50 chars and adds > with tooltip', () => {
    const long = 'A'.repeat(51);
    const html = messageHtml('IN', { clock: 'Q3 5:00', last_play: long });
    expect(html).toContain('A'.repeat(50));
    expect(html).toContain('&gt;');
    expect(html).toContain('tv-tooltip');
    expect(html).toContain(`data-tooltip="${long}"`);
    expect(html).not.toContain(`>${'A'.repeat(51)}<`);
  });

  it('does not truncate last_play of exactly 50 chars', () => {
    const exact = 'B'.repeat(50);
    const html = messageHtml('IN', { clock: 'Q2 1:00', last_play: exact });
    expect(html).toContain(exact);
    expect(html).not.toContain('tv-tooltip');
    expect(html).not.toContain('&gt;');
  });

  it('shows clock and series summary for POST', () => {
    const html = messageHtml('POST', { clock: 'Final', series_summary: 'LAL leads 3-2' });
    expect(html).toContain('Final');
    expect(html).toContain('LAL leads 3-2');
  });

  it('shows only clock for POST when no series summary', () => {
    const html = messageHtml('POST', { clock: 'Final' });
    expect(html).toContain('Final');
    expect(html).not.toContain('msg-sub');
  });

  it('handles missing clock in POST state', () => {
    const html = messageHtml('POST', {});
    expect(html).toContain('color:orange');
  });

  it('uses config live color for IN clock', () => {
    const html = messageHtml(
      'IN',
      { clock: 'Q1 10:00', team_win_probability: null },
      { live: 'teal' }
    );
    expect(html).toContain('color:teal');
  });

  it('uses config winner color for POST clock', () => {
    const html = messageHtml('POST', { clock: 'Final' }, { winner: 'gold' });
    expect(html).toContain('color:gold');
  });
});
