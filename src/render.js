import { VALID_STATES } from './constants.js';
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
} from './display.js';
import { deduplicate, sortKeyFor } from './sorting.js';
import { esc } from './utils.js';

export function rowHtml(stateObj, special, colors = {}, opponentSpecial = false) {
  const gs = stateObj?.state ?? '';
  const attr = stateObj?.attributes ?? {};
  const bg = scoreBg(gs);

  return `
<div class="game-row">
  <div class="team-col team-col-a">
    <div class="team-name" style="color:${teamColor('home', attr, special, colors, opponentSpecial)};font-weight:${isTeamSide('home', attr) ? 'bold' : 'normal'}">${nameText('home', attr)}</div>
    <div class="team-rank" style="color:${teamColor('home', attr, special, colors, opponentSpecial)}">${rankText('home', attr)}</div>
  </div>
  <div class="logo logo-a">${logoHtml('home', attr)}</div>
  <div class="score score-a" style="background:${bg};color:${scoreColor('home', gs, attr, colors)}">${scoreText('home', gs, attr)}</div>
  <div class="colon" style="background:${bg};color:${colonColor(gs)}">${gs ? ':' : ''}</div>
  <div class="score score-b" style="background:${bg};color:${scoreColor('away', gs, attr, colors)}">${scoreText('away', gs, attr)}</div>
  <div class="logo logo-b">${logoHtml('away', attr)}</div>
  <div class="team-col team-col-b">
    <div class="team-name" style="color:${teamColor('away', attr, special, colors, opponentSpecial)};font-weight:${isTeamSide('away', attr) ? 'bold' : 'normal'}">${nameText('away', attr)}</div>
    <div class="team-rank" style="color:${teamColor('away', attr, special, colors, opponentSpecial)}">${rankText('away', attr)}</div>
  </div>
  <div class="message">${messageHtml(gs, attr, colors)}</div>
  <div class="tv">${tvHtml(gs, attr, colors)}</div>
</div>`;
}

export function sectionHtml(section, states, stateKeysOrColors, colors) {
  let stateKeys, resolvedColors;
  if (Array.isArray(stateKeysOrColors)) {
    stateKeys = stateKeysOrColors;
    resolvedColors = colors ?? {};
  } else {
    stateKeys = Object.keys(states);
    resolvedColors = stateKeysOrColors ?? {};
  }
  const { name, prefix, limit = 10, special_teams = [], rankType = 'win-draw-loss' } = section;

  const entities = stateKeys.filter(
    (id) => id.startsWith(prefix) && VALID_STATES.has(states[id]?.state)
  );
  if (!entities.length) return '';

  // rankType applies to regular season only — auto-switch to by-date outside it
  const firstAttr = states[entities[0]]?.attributes;
  const sortMode = firstAttr?.season && firstAttr.season !== 'regular' ? 'by-date' : rankType;

  const items = entities.map((entityId) => {
    const attr = states[entityId]?.attributes;
    return {
      entityId,
      teamName: String(attr?.team_name ?? entityId),
      special: special_teams.includes(entityId.replace(prefix, '')),
      key: sortKeyFor(attr, sortMode),
    };
  });

  items.sort((a, b) => {
    const diff = sortMode === 'by-date' ? a.key - b.key : b.key - a.key;
    if (diff !== 0) return diff;
    const nameDiff = a.teamName.localeCompare(b.teamName);
    return nameDiff !== 0 ? nameDiff : a.entityId.localeCompare(b.entityId);
  });

  const rows = deduplicate(items, sortMode, states)
    .slice(0, limit)
    .map(({ entityId, special, opponentSpecial = false }) =>
      rowHtml(states[entityId], special, resolvedColors, opponentSpecial)
    )
    .join('');

  return `<div class="section-header">${esc(name)}</div>${rows}`;
}
