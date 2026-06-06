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

export function rowHtml(stateObj, special, colors = {}) {
  const gs = stateObj?.state ?? 'NOT_FOUND';
  const attr = stateObj?.attributes ?? {};
  const bg = scoreBg(gs);

  return `
<div class="game-row">
  <div class="team-col team-col-a">
    <div class="team-name" style="color:${teamColor('home', attr, special, colors)};font-weight:${isTeamSide('home', attr) ? 'bold' : 'normal'}">${nameText('home', attr)}</div>
    <div class="team-rank" style="color:${teamColor('home', attr, special, colors)}">${rankText('home', attr)}</div>
  </div>
  <div class="logo logo-a">${logoHtml('home', gs, attr)}</div>
  <div class="score score-a" style="background:${bg};color:${scoreColor('home', gs, attr, colors)}">${scoreText('home', gs, attr)}</div>
  <div class="colon" style="background:${bg};color:${colonColor(gs)}">${gs !== 'NOT_FOUND' ? ':' : ''}</div>
  <div class="score score-b" style="background:${bg};color:${scoreColor('away', gs, attr, colors)}">${scoreText('away', gs, attr)}</div>
  <div class="logo logo-b">${logoHtml('away', gs, attr)}</div>
  <div class="team-col team-col-b">
    <div class="team-name" style="color:${teamColor('away', attr, special, colors)};font-weight:${isTeamSide('away', attr) ? 'bold' : 'normal'}">${nameText('away', attr)}</div>
    <div class="team-rank" style="color:${teamColor('away', attr, special, colors)}">${rankText('away', attr)}</div>
  </div>
  <div class="message">${messageHtml(gs, attr, colors)}</div>
  <div class="tv">${tvHtml(gs, attr, colors)}</div>
</div>`;
}

export function sectionHtml(section, states, colors = {}) {
  const { name, prefix, limit = 10, special_teams = [], rankType = 'win-loss' } = section;

  const entities = Object.keys(states).filter(
    (id) => id.startsWith(prefix) && VALID_STATES.has(states[id]?.state)
  );
  if (!entities.length) return '';

  // rankType applies to regular season only — auto-switch to by-date outside it
  const firstAttr = states[entities[0]]?.attributes;
  const effectiveRankType =
    rankType !== 'by-date' && firstAttr?.season !== 'regular' ? 'by-date' : rankType;

  const items = entities.map((entityId) => ({
    entityId,
    special: special_teams.includes(entityId.replace(prefix, '')),
    key: sortKeyFor(states[entityId]?.attributes, effectiveRankType),
  }));

  items.sort((a, b) => (effectiveRankType === 'by-date' ? a.key - b.key : b.key - a.key));

  const rows = deduplicate(items, effectiveRankType, states)
    .slice(0, limit)
    .map(({ entityId, special }) => rowHtml(states[entityId], special, colors))
    .join('');

  return `<div class="section-header">${esc(name)}</div>${rows}`;
}
