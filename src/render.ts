import { html, nothing, type TemplateResult } from "lit";
import {
  colonColor,
  isTeamSide,
  nameText,
  rankText,
  scoreBg,
  scoreColor,
  scoreText,
  teamColor,
} from "./display.js";
import { deduplicate, resolveSortMode, sortKeyFor } from "./sorting.js";
import type { ColorsConfig, GameState, HassEntity, HassStates, SectionConfig } from "./types.js";
import { VALID_STATES } from "./utils.js";
import { logoHtml, messageHtml, tvHtml } from "./widgets.js";

export function rowHtml(
  stateObj: HassEntity | null,
  special: boolean,
  colors: ColorsConfig = {},
  opponentSpecial = false,
  isFresh = false,
  position: number | null = null
): TemplateResult {
  const gs = (stateObj?.state ?? "") as GameState;
  const attr = stateObj?.attributes ?? {};
  const bg = scoreBg(gs);
  const freshClass = isFresh ? " score-fresh" : "";

  const homeColor = teamColor("home", attr, special, colors, opponentSpecial);
  const awayColor = teamColor("away", attr, special, colors, opponentSpecial);
  const posColor = attr.team_homeaway === "home" ? homeColor : awayColor;

  return html`
<div class="game-row">
  <div class="team-pos" style=${position == null ? nothing : `color:${posColor}`}>${position ?? ""}</div>
  <div class="team-col team-col-a">
    <div class="team-name" style="color:${homeColor};font-weight:${isTeamSide("home", attr) ? "bold" : "normal"}">${nameText("home", attr)}</div>
    <div class="team-rank" style="color:${homeColor}">${rankText("home", attr)}</div>
  </div>
  <div class="logo logo-a">${logoHtml("home", attr)}</div>
  <div class="score score-a${freshClass}" style="background:${bg};color:${scoreColor("home", gs, attr, colors)}">${scoreText("home", gs, attr)}</div>
  <div class="colon${freshClass}" style="background:${bg};color:${colonColor(gs)}">${gs ? ":" : ""}</div>
  <div class="score score-b${freshClass}" style="background:${bg};color:${scoreColor("away", gs, attr, colors)}">${scoreText("away", gs, attr)}</div>
  <div class="logo logo-b">${logoHtml("away", attr)}</div>
  <div class="team-col team-col-b">
    <div class="team-name" style="color:${awayColor};font-weight:${isTeamSide("away", attr) ? "bold" : "normal"}">${nameText("away", attr)}</div>
    <div class="team-rank" style="color:${awayColor}">${rankText("away", attr)}</div>
  </div>
  <div class="message">${messageHtml(gs, attr, colors)}</div>
  <div class="tv">${tvHtml(gs, attr, colors)}</div>
</div>`;
}

export function sectionHtml(
  section: SectionConfig,
  states: HassStates,
  entityIds?: string[],
  colors: ColorsConfig = {},
  scoreChangedAt: Map<string, number> = new Map(),
  carousel = false
): TemplateResult | typeof nothing {
  const {
    name,
    prefix = "",
    limit = 10,
    special_teams = [],
    rank_type = "win-draw-loss",
    season_mode = "auto",
    score_blink = 5,
    show_position = true,
  } = section;
  const blinkMs = score_blink * 1000;
  const resolvedIds = entityIds ?? Object.keys(states).filter((id) => id.startsWith(prefix));
  const entities = resolvedIds.filter((id) =>
    VALID_STATES.has((states[id]?.state ?? "") as GameState)
  );
  const header = html`<div class="section-header" style=${colors.header ? `color:${colors.header}` : nothing}>${name}</div>`;
  const emptyHtml = () =>
    html`${header}<div class="empty">No games found — check your section prefixes.</div>`;
  if (!entities.length) return carousel ? emptyHtml() : nothing;

  const sortMode = resolveSortMode(entities, states, rank_type, season_mode);

  const items = entities.map((entityId) => {
    const attr = states[entityId]?.attributes;
    return {
      entityId,
      teamName: String(attr?.team_name ?? entityId),
      special: special_teams.includes(entityId.replace(prefix, "")),
      key: sortKeyFor(attr, sortMode),
    };
  });

  items.sort((a, b) => {
    const diff = sortMode === "by-date" ? a.key - b.key : b.key - a.key;
    if (diff !== 0) return diff;
    const nameDiff = a.teamName.localeCompare(b.teamName);
    return nameDiff !== 0 ? nameDiff : a.entityId.localeCompare(b.entityId);
  });

  const ranked = items.map((it, i) => ({ ...it, position: i + 1 }));

  const now = Date.now();
  const rows = deduplicate(ranked, sortMode, states)
    .slice(0, limit)
    .map(({ entityId, special = false, opponentSpecial = false, position }) => {
      const isFresh = blinkMs > 0 && now - (scoreChangedAt.get(entityId) ?? -Infinity) < blinkMs;
      const pos = sortMode !== "by-date" && show_position ? position : null;
      return rowHtml(
        states[entityId] as HassEntity,
        special,
        colors,
        opponentSpecial,
        isFresh,
        pos
      );
    });

  if (!rows.length) return carousel ? emptyHtml() : nothing;
  return html`${header}${rows}`;
}
