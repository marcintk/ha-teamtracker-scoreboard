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
    expect(teamColor('home', homeAttr, false)).toBe('var(--scoreboard-team-color, white)');
  });

  it('returns special color when side matches and special is true', () => {
    expect(teamColor('home', homeAttr, true)).toBe('var(--scoreboard-special-color, orange)');
  });

  it('returns opponent color when side does not match', () => {
    expect(teamColor('away', homeAttr, false)).toBe('var(--scoreboard-opponent-color, #777)');
    expect(teamColor('away', homeAttr, true)).toBe('var(--scoreboard-opponent-color, #777)');
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
    expect(scoreBg('NOT_FOUND')).toBe('transparent');
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

  it('returns orange for winner and gray for loser in POST', () => {
    expect(scoreColor('home', 'POST', homeAttr)).toBe('orange');
    expect(scoreColor('away', 'POST', homeAttr)).toBe('#aaa');
  });
});

describe('colonColor', () => {
  it('is black for active game states', () => {
    expect(colonColor('PRE')).toBe('black');
    expect(colonColor('IN')).toBe('black');
  });

  it('is muted for POST and transparent for unknown', () => {
    expect(colonColor('POST')).toBe('#777');
    expect(colonColor('NOT_FOUND')).toBe('transparent');
  });
});

describe('scoreText', () => {
  it('returns empty for NOT_FOUND', () => {
    expect(scoreText('home', 'NOT_FOUND', homeAttr)).toBe('');
  });

  it('returns dash for PRE', () => {
    expect(scoreText('home', 'PRE', homeAttr)).toBe('–');
    expect(scoreText('away', 'PRE', homeAttr)).toBe('–');
  });

  it('returns correct score for home sensor during IN', () => {
    expect(scoreText('home', 'IN', homeAttr)).toBe('95');
    expect(scoreText('away', 'IN', homeAttr)).toBe('90');
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
  it('returns empty for NOT_FOUND state', () => {
    expect(logoHtml('home', 'NOT_FOUND', homeAttr)).toBe('');
  });

  it('returns img tag for valid https logo URL', () => {
    const html = logoHtml('home', 'PRE', homeAttr);
    expect(html).toContain('<img');
    expect(html).toContain('https://cdn.example.com/lal.png');
  });

  it('rejects non-https logo URLs', () => {
    const attr = { ...homeAttr, team_logo: 'http://insecure.example.com/logo.png' };
    expect(logoHtml('home', 'PRE', attr)).toBe('');
  });
});

describe('tvHtml', () => {
  it('returns empty for POST state', () => {
    expect(tvHtml('POST', { tv_network: 'ESPN' })).toBe('');
  });

  it('returns red badge for IN state', () => {
    const html = tvHtml('IN', { tv_network: 'ESPN' });
    expect(html).toContain('ESPN');
    expect(html).toContain('indianred');
  });

  it('returns gray badge for PRE state', () => {
    const html = tvHtml('PRE', { tv_network: 'TNT' });
    expect(html).toContain('TNT');
    expect(html).toContain('#666');
  });

  it('truncates long network names', () => {
    const html = tvHtml('PRE', { tv_network: 'VERY_LONG_CHANNEL_NAME' });
    expect(html).not.toContain('VERY_LONG_CHANNEL_NAME');
  });

  it('handles multi-network with slash', () => {
    const html = tvHtml('PRE', { tv_network: 'ESPN/ESPN2' });
    expect(html).toContain('›');
  });
});

describe('messageHtml', () => {
  it('shows cleaned api_message for NOT_FOUND', () => {
    const html = messageHtml('NOT_FOUND', { api_message: 'Cached data: stale' });
    expect(html).toContain('stale');
    expect(html).not.toContain('Cached data');
  });

  it('shows kickoff and odds for PRE', () => {
    const html = messageHtml('PRE', { kickoff_in: '2h', odds: 'LAL -3.5' });
    expect(html).toContain('2h');
    expect(html).toContain('LAL -3.5');
  });

  it('shows clock and win probability for IN', () => {
    const html = messageHtml('IN', {
      clock: 'Q3 5:00',
      team_abbr: 'LAL',
      team_win_probability: '0.65',
    });
    expect(html).toContain('Q3 5:00');
    expect(html).toContain('65.0%');
  });

  it('shows clock and series summary for POST', () => {
    const html = messageHtml('POST', { clock: 'Final', series_summary: 'LAL leads 3-2' });
    expect(html).toContain('Final');
    expect(html).toContain('LAL leads 3-2');
  });
});
