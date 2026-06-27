import type { ColorsConfig, GameAttr, GameState } from "./types.js";

export function isTeamSide(side: "home" | "away", attr: GameAttr): boolean {
  return side === "home" ? attr?.team_homeaway === "home" : attr?.team_homeaway !== "home";
}

export function teamColor(
  side: "home" | "away",
  attr: GameAttr,
  special: boolean,
  colors: ColorsConfig = {},
  opponentSpecial = false
): string {
  if (!isTeamSide(side, attr)) {
    if (opponentSpecial) return colors.special ?? "var(--scoreboard-special-color, #2196F3)";
    return colors.opponent ?? "var(--scoreboard-opponent-color, #777)"; /* gray */
  }
  if (special)
    return colors.special ?? "var(--scoreboard-special-color, #2196F3)"; /* Material Blue */
  return colors.team ?? "var(--scoreboard-team-color, var(--primary-text-color, white))";
}

export function scoreBg(gs: GameState): string {
  if (gs === "PRE") return "#303030"; /* near-black */
  if (gs === "IN") return "lightgray";
  return "transparent";
}

export function scoreColor(
  side: "home" | "away",
  gs: GameState,
  attr: GameAttr,
  colors: ColorsConfig = {}
): string {
  const isSide = isTeamSide(side, attr);
  if (gs === "PRE") return "black";
  if (gs === "IN") {
    const ts = parseFloat(String(attr.team_score ?? 0));
    const os = parseFloat(String(attr.opponent_score ?? 0));
    return (isSide ? ts >= os : os >= ts) ? (colors.leading ?? "brown") : "black";
  }
  if (gs === "POST") {
    return (isSide ? attr.team_winner : attr.opponent_winner)
      ? (colors.winner ?? "orange")
      : (colors.loser ?? "darkgray");
  }
  return "black";
}

export function colonColor(gs: GameState): string {
  if (gs === "PRE" || gs === "IN") return "black";
  if (gs === "POST") return "#777"; /* gray */
  return "transparent";
}

export function scoreText(side: "home" | "away", gs: GameState, attr: GameAttr): string {
  if (gs === "PRE") return "–";
  return String(isTeamSide(side, attr) ? (attr.team_score ?? "") : (attr.opponent_score ?? ""));
}

export function nameText(side: "home" | "away", attr: GameAttr): string {
  return String(isTeamSide(side, attr) ? (attr.team_name ?? "") : (attr.opponent_name ?? ""));
}

export function rankText(side: "home" | "away", attr: GameAttr): string {
  return String(isTeamSide(side, attr) ? (attr.team_record ?? "") : (attr.opponent_record ?? ""));
}
