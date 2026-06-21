import { describe, expect, it } from 'vitest';
import type { GameAttr } from '../src/types.js';
import { logoHtml, messageHtml, tvHtml } from '../src/widgets.js';

const homeAttr: GameAttr = {
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
  it('shows kickoff and odds for PRE when no location', () => {
    const html = messageHtml('PRE', { kickoff_in: '2h', odds: 'LAL -3.5' });
    expect(html).toContain('2h');
    expect(html).toContain('LAL -3.5');
  });

  it('shows only kickoff for PRE when no odds or location', () => {
    const html = messageHtml('PRE', { kickoff_in: 'Tomorrow' });
    expect(html).toContain('Tomorrow');
    expect(html).not.toContain('msg-sub');
  });

  it('shows city and odds as sub for PRE when both location and odds present', () => {
    const html = messageHtml('PRE', {
      kickoff_in: '2h',
      location: 'Houston, Texas, USA',
      odds: 'LAL -3.5',
    });
    expect(html).toContain('Houston, LAL -3.5');
  });

  it('extracts only city (text before first comma) from full location string', () => {
    const html = messageHtml('PRE', { location: 'San Antonio, TX', odds: 'HOU -7' });
    expect(html).toContain('San Antonio, HOU -7');
    expect(html).not.toContain('Texas');
  });

  it('shows only city in sub for PRE when odds is absent', () => {
    const html = messageHtml('PRE', { location: 'Dallas, Texas, USA' });
    expect(html).toContain('msg-sub');
    expect(html).toContain('Dallas');
    expect(html).not.toContain('Texas');
  });

  it('shows only odds in sub for PRE when location is absent', () => {
    const html = messageHtml('PRE', { odds: 'BOS -2' });
    expect(html).toContain('msg-sub');
    expect(html).toContain('BOS -2');
  });

  it('escapes HTML in location city and odds', () => {
    const html = messageHtml('PRE', { location: '<city>, State', odds: '<b>odds</b>' });
    expect(html).not.toContain('<city>');
    expect(html).not.toContain('<b>');
    expect(html).toContain('&lt;city&gt;');
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

  it('inserts newlines before soccer minute markers in long last_play tooltip', () => {
    const plays = "GER 66.9%, CUW 33.1%; 6' Goal: Nmecha 21' Goal: Other Player";
    const html = messageHtml('IN', { clock: "90'", last_play: plays });
    expect(html).toContain('tv-tooltip');
    expect(html).toContain(";\n6'");
    expect(html).toContain("\n21'");
  });

  it('inserts newlines before injury-time minute markers in tooltip', () => {
    const plays = "GER 1-0 CUW; 45'+5' Penalty - Scored: Havertz 90'+3' Goal: Musiala";
    const html = messageHtml('IN', { clock: "90'+3'", last_play: plays });
    expect(html).toContain(";\n45'+5'");
    expect(html).toContain("\n90'+3'");
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
