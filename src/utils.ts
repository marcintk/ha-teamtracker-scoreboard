import type { GameState } from "./types.js";

export const VALID_STATES: ReadonlySet<GameState> = new Set(["PRE", "IN", "POST", "BYE"]);

export function safeLogoUrl(url: unknown): string {
  if (!url || !String(url).startsWith("https://")) return "";
  return String(url);
}
