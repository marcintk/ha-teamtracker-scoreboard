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

export function rowHtml(stateObj, special) {
  const gs = stateObj?.state ?? 'NOT_FOUND';
  const attr = stateObj?.attributes ?? {};
  const bg = scoreBg(gs);

  return `
<div class="game-row">
  <div class="team-col team-col-a">
    <div class="team-name" style="color:${teamColor('home', attr, special)};font-weight:${isTeamSide('home', attr) ? 'bold' : 'normal'}">${nameText('home', attr)}</div>
    <div class="team-rank" style="color:${teamColor('home', attr, special)}">${rankText('home', attr)}</div>
  </div>
  <div class="logo logo-a">${logoHtml('home', gs, attr)}</div>
  <div class="score score-a" style="background:${bg};color:${scoreColor('home', gs, attr)}">${scoreText('home', gs, attr)}</div>
  <div class="colon" style="background:${bg};color:${colonColor(gs)}">${gs !== 'NOT_FOUND' ? ':' : ''}</div>
  <div class="score score-b" style="background:${bg};color:${scoreColor('away', gs, attr)}">${scoreText('away', gs, attr)}</div>
  <div class="logo logo-b">${logoHtml('away', gs, attr)}</div>
  <div class="team-col team-col-b">
    <div class="team-name" style="color:${teamColor('away', attr, special)};font-weight:${isTeamSide('away', attr) ? 'bold' : 'normal'}">${nameText('away', attr)}</div>
    <div class="team-rank" style="color:${teamColor('away', attr, special)}">${rankText('away', attr)}</div>
  </div>
  <div class="message">${messageHtml(gs, attr)}</div>
  <div class="tv">${tvHtml(gs, attr)}</div>
</div>`;
}

export function sectionHtml(section, states) {
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
    .map(({ entityId, special }) => rowHtml(states[entityId], special))
    .join('');

  return `<div class="section-header">${esc(name)}</div>${rows}`;
}
