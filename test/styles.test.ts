import { describe, expect, it } from 'vitest';
import { rowHtml } from '../src/render.js';
import { CARD_STYLES } from '../src/styles.js';
import type { GameAttr } from '../src/types.js';

// ─── CSS extractor helpers ────────────────────────────────────────────────────
// Parse the flat, well-formed CARD_STYLES string without a full CSS parser.

function cssBlock(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`${escaped}\\s*\\{([^}]+)\\}`, 's');
  const m = CARD_STYLES.match(re);
  return m ? (m[1] ?? '') : '';
}

function cssProp(selector: string, property: string): string | null {
  const stripped = cssBlock(selector).replace(/\/\*[^*]*\*\//g, '');
  const re = new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*([^;]+)`, 'm');
  const m = stripped.match(re);
  return m ? (m[1]?.trim() ?? null) : null;
}

// ─── CSS layout and font tests ────────────────────────────────────────────────

describe('CARD_STYLES — ha-card', () => {
  it('has 14px base font size', () => {
    expect(cssProp('ha-card', 'font-size')).toBe('14px');
  });
  it('has compact padding', () => {
    expect(cssProp('ha-card', 'padding')).toBe('4px 2px');
  });
});

describe('CARD_STYLES — .section-header', () => {
  it('has 15px font size', () => {
    expect(cssProp('.section-header', 'font-size')).toBe('15px');
  });
});

describe('CARD_STYLES — .game-row', () => {
  it('uses flex layout', () => {
    expect(cssProp('.game-row', 'display')).toBe('flex');
  });
  it('vertically centres all children', () => {
    expect(cssProp('.game-row', 'align-items')).toBe('center');
  });
  it('has a fixed 28px height', () => {
    expect(cssProp('.game-row', 'height')).toBe('28px');
  });
  it('is a positioning context for the tv overlay', () => {
    expect(cssProp('.game-row', 'position')).toBe('relative');
  });
});

describe('CARD_STYLES — .score', () => {
  it('has 20px bold font', () => {
    expect(cssProp('.score', 'font-size')).toBe('20px');
    expect(cssProp('.score', 'font-weight')).toBe('bold');
  });
  it('is vertically centred within the row (align-self + align-items)', () => {
    expect(cssProp('.score', 'align-self')).toBe('center');
    expect(cssProp('.score', 'align-items')).toBe('center');
  });
  it('has fixed 34px width', () => {
    expect(cssProp('.score', 'width')).toBe('34px');
    expect(cssProp('.score', 'min-width')).toBe('34px');
  });
  it('matches the game-row height', () => {
    expect(cssProp('.score', 'height')).toBe(cssProp('.game-row', 'height'));
  });
});

describe('CARD_STYLES — .score-a / .score-b', () => {
  it('right-aligns home score', () => {
    expect(cssProp('.score-a', 'justify-content')).toBe('flex-end');
  });
  it('left-aligns away score', () => {
    expect(cssProp('.score-b', 'justify-content')).toBe('flex-start');
  });
});

describe('CARD_STYLES — .colon', () => {
  it('has 17px bold font', () => {
    expect(cssProp('.colon', 'font-size')).toBe('17px');
    expect(cssProp('.colon', 'font-weight')).toBe('bold');
  });
  it('is centred horizontally and vertically', () => {
    expect(cssProp('.colon', 'text-align')).toBe('center');
    expect(cssProp('.colon', 'align-items')).toBe('center');
    expect(cssProp('.colon', 'justify-content')).toBe('center');
  });
  it('has fixed 9px width', () => {
    expect(cssProp('.colon', 'width')).toBe('9px');
    expect(cssProp('.colon', 'min-width')).toBe('9px');
  });
  it('matches the game-row height', () => {
    expect(cssProp('.colon', 'height')).toBe(cssProp('.game-row', 'height'));
  });
});

describe('CARD_STYLES — .team-col', () => {
  it('uses column flex layout', () => {
    expect(cssProp('.team-col', 'display')).toBe('flex');
    expect(cssProp('.team-col', 'flex-direction')).toBe('column');
  });
  it('has constrained width', () => {
    expect(cssProp('.team-col', 'width')).toBe('99px');
    expect(cssProp('.team-col', 'min-width')).toBe('60px');
  });
});

describe('CARD_STYLES — .team-col-a / .team-col-b', () => {
  it('right-aligns home team column', () => {
    expect(cssProp('.team-col-a', 'text-align')).toBe('right');
  });
  it('left-aligns away team column', () => {
    expect(cssProp('.team-col-b', 'text-align')).toBe('left');
  });
});

describe('CARD_STYLES — .team-name', () => {
  it('has 13px font size', () => {
    expect(cssProp('.team-name', 'font-size')).toBe('13px');
  });
  it('truncates overflow with ellipsis', () => {
    expect(cssProp('.team-name', 'white-space')).toBe('nowrap');
    expect(cssProp('.team-name', 'overflow')).toBe('hidden');
    expect(cssProp('.team-name', 'text-overflow')).toBe('ellipsis');
  });
});

describe('CARD_STYLES — .team-rank', () => {
  it('has 9px font size (smaller than team-name)', () => {
    expect(cssProp('.team-rank', 'font-size')).toBe('9px');
  });
});

describe('CARD_STYLES — .logo', () => {
  it('has fixed 30px width', () => {
    expect(cssProp('.logo', 'width')).toBe('30px');
    expect(cssProp('.logo', 'min-width')).toBe('30px');
  });
  it('matches the game-row height', () => {
    expect(cssProp('.logo', 'height')).toBe(cssProp('.game-row', 'height'));
  });
});

describe('CARD_STYLES — .logo img', () => {
  it('is 28px square', () => {
    expect(cssProp('.logo img', 'width')).toBe('28px');
    expect(cssProp('.logo img', 'height')).toBe('28px');
  });
  it('uses contain fit so logos are not cropped', () => {
    expect(cssProp('.logo img', 'object-fit')).toBe('contain');
  });
});

describe('CARD_STYLES — .message', () => {
  it('has 13px bold font', () => {
    expect(cssProp('.message', 'font-size')).toBe('13px');
    expect(cssProp('.message', 'font-weight')).toBe('bold');
  });
  it('takes remaining row space', () => {
    expect(cssProp('.message', 'flex')).toBe('1');
  });
});

describe('CARD_STYLES — .msg-sub', () => {
  it('has 10px font size (smaller than .message)', () => {
    expect(cssProp('.msg-sub', 'font-size')).toBe('10px');
  });
  it('is not bold', () => {
    expect(cssProp('.msg-sub', 'font-weight')).toBe('normal');
  });
});

describe('CARD_STYLES — .tv-badge', () => {
  it('has 8px bold font', () => {
    expect(cssProp('.tv-badge', 'font-size')).toBe('8px');
    expect(cssProp('.tv-badge', 'font-weight')).toBe('bold');
  });
  it('has white text on a coloured background', () => {
    expect(cssProp('.tv-badge', 'color')).toBe('white');
  });
  it('has rounded corners', () => {
    expect(cssProp('.tv-badge', 'border-radius')).toBe('3px');
  });
});

describe('CARD_STYLES — .tv-tooltip::after', () => {
  it('has 10px font size', () => {
    expect(cssProp('.tv-tooltip::after', 'font-size')).toBe('10px');
  });
  it('starts invisible and fades in', () => {
    expect(cssProp('.tv-tooltip::after', 'opacity')).toBe('0');
    expect(cssProp('.tv-tooltip::after', 'transition')).toBe('opacity 0.15s');
  });
});

// ─── rowHtml inline styles ────────────────────────────────────────────────────
// The rendered HTML carries dynamic inline styles (background, color, font-weight).
// These tests verify the style attributes are written into the HTML correctly.

const makeState = (state: string, attrs: GameAttr) => ({ state, attributes: attrs });

const baseAttrs: GameAttr = {
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

describe('rowHtml inline styles — score background', () => {
  it('uses dark background in PRE state', () => {
    const html = rowHtml(makeState('PRE', baseAttrs), false);
    expect(html).toContain('background:#303030');
  });
  it('uses lightgray background in IN state', () => {
    const html = rowHtml(makeState('IN', baseAttrs), false);
    expect(html).toContain('background:lightgray');
  });
  it('uses transparent background in POST state', () => {
    const html = rowHtml(makeState('POST', baseAttrs), false);
    expect(html).toContain('background:transparent');
  });
});

describe('rowHtml inline styles — score text color', () => {
  it('uses black for both scores in PRE state', () => {
    const html = rowHtml(makeState('PRE', baseAttrs), false);
    // Both score divs carry color:black in PRE
    expect(html.match(/color:black/g)?.length).toBeGreaterThanOrEqual(2);
  });
  it('highlights leading team with brown in IN state', () => {
    // home (95) leads away (90) — home score should be brown, away black
    const html = rowHtml(makeState('IN', baseAttrs), false);
    expect(html).toContain('color:brown');
    expect(html).toContain('color:black');
  });
  it('marks winner orange and loser darkgray in POST state', () => {
    const html = rowHtml(makeState('POST', baseAttrs), false);
    expect(html).toContain('color:orange');
    expect(html).toContain('color:darkgray');
  });
});

describe('rowHtml inline styles — team name font-weight', () => {
  it('bolds the tracked team name', () => {
    // home sensor → home team-name div should be bold
    const html = rowHtml(makeState('PRE', baseAttrs), false);
    expect(html).toContain('font-weight:bold');
  });
  it('uses normal weight for the opponent name', () => {
    const html = rowHtml(makeState('PRE', baseAttrs), false);
    expect(html).toContain('font-weight:normal');
  });
});

describe('rowHtml inline styles — colon visibility', () => {
  it('hides the colon for BYE and other non-game states', () => {
    const html = rowHtml(makeState('BYE', baseAttrs), false);
    expect(html).toContain('color:transparent');
  });
  it('shows a black colon in PRE state', () => {
    const html = rowHtml(makeState('PRE', baseAttrs), false);
    // colon div carries color:black
    expect(html).toContain('color:black');
  });
});
