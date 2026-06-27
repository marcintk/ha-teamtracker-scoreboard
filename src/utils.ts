import type { GameState } from "./types.js";

export const VALID_STATES: ReadonlySet<GameState> = new Set(["PRE", "IN", "POST", "BYE"]);

export function timeAgo(ms: number): string {
  if (ms < 60_000) return `${Math.floor(ms / 1_000)}s`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m`;
  return `${Math.floor(ms / 3_600_000)}h`;
}

export function safeLogoUrl(url: unknown): string {
  if (!url || !String(url).startsWith("https://")) return "";
  return String(url);
}
