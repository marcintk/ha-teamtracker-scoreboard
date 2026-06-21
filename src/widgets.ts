import { isTeamSide } from './display.js';
import type { ColorsConfig, GameAttr, GameState } from './types.js';
import { esc, safeLogoUrl } from './utils.js';

export function logoHtml(side: 'home' | 'away', attr: GameAttr): string {
  const url = safeLogoUrl(isTeamSide(side, attr) ? attr.team_logo : attr.opponent_logo);
  return url ? `<img src="${url}" alt="">` : '';
}

export function tvHtml(gs: GameState, attr: GameAttr, colors: ColorsConfig = {}): string {
  if (gs !== 'PRE' && gs !== 'IN') return '';
  const tv = String(attr.tv_network ?? '').trim();
  if (!tv) return '';
  const networks = tv.split('/').map((n) => n.trim());
  const hasMultiple = networks.length > 1;
  const first = networks[0] ?? '';
  const truncated = first.substring(0, 3);
  const label = first.length > 3 || hasMultiple ? `${truncated}>` : truncated;
  const bg = gs === 'IN' ? (colors.live ?? 'indianred') : '#666';
  const badge = `<span class="tv-badge" style="background:${bg}">${esc(label)}</span>`;
  if (hasMultiple) {
    const tooltip = esc(networks.join(' · '));
    return `<span class="tv-tooltip" data-tooltip="${tooltip}">${badge}</span>`;
  }
  return badge;
}

export function messageHtml(gs: GameState, attr: GameAttr, colors: ColorsConfig = {}): string {
  switch (gs) {
    case 'PRE': {
      const kickoff = esc(attr.kickoff_in ?? '');
      const city = esc((String(attr.location ?? '').split(',')[0] ?? '').trim());
      const odds = esc(attr.odds ?? '');
      const sub = city && odds ? `${city}, ${odds}` : city || odds;
      return (
        `<span style="color:darkgray">${kickoff}</span>` +
        (sub ? `<span class="msg-sub">${sub}</span>` : '')
      );
    }
    case 'IN': {
      const clock = esc(attr.clock ?? '');
      const raw = String(attr.last_play ?? '');
      let subHtml = '';
      if (raw) {
        if (raw.length > 50) {
          const fmt = raw.replace(/; /g, ';\n').replace(/ (\d+(?:'\+\d+)?')/g, '\n$1');
          subHtml = `<span class="msg-sub tv-tooltip" data-tooltip="${esc(fmt)}">${esc(`${raw.substring(0, 50)}>`)}</span>`;
        } else {
          subHtml = `<span class="msg-sub">${esc(raw)}</span>`;
        }
      }
      return `<span style="color:${colors.live ?? 'indianred'}">${clock}</span>${subHtml}`;
    }
    default: {
      const clock = esc(attr.clock ?? '');
      const sub = esc(attr.series_summary ?? '');
      return (
        `<span style="color:${colors.winner ?? 'orange'}">${clock}</span>` +
        (sub ? `<span class="msg-sub">${sub}</span>` : '')
      );
    }
  }
}
