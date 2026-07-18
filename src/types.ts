export type GameState = "PRE" | "IN" | "POST" | "BYE";

export type SortMode = "win-loss" | "win-draw-loss" | "win-loss-otl" | "by-date";

export interface GameAttr {
  state?: string;
  season?: string;
  date?: string;
  team_homeaway?: "home" | "away";
  team_abbr?: string;
  team_name?: string;
  team_score?: string | number;
  team_winner?: boolean;
  team_record?: string;
  team_logo?: string;
  team_rank?: string | number;
  opponent_abbr?: string;
  opponent_name?: string;
  opponent_score?: string | number;
  opponent_winner?: boolean;
  opponent_record?: string;
  opponent_logo?: string;
  opponent_rank?: string | number;
  kickoff_in?: string;
  tv_network?: string;
  location?: string;
  odds?: string;
  clock?: string;
  last_play?: string;
  series_summary?: string;
  [key: string]: unknown;
}

export interface HassEntity {
  state: string;
  attributes: GameAttr;
}

export type HassStates = Record<string, HassEntity>;

import type { HasSubscribeEvents } from "ha-card-shared/runtime";
export type HassConnection = HasSubscribeEvents;

export interface HomeAssistant {
  states: HassStates;
  connection: HassConnection;
}

export interface SectionConfig {
  name?: string;
  prefix?: string;
  limit?: number;
  special_teams?: string[];
  rank_type?: SortMode;
  score_blink?: number;
}

export interface ColorsConfig {
  header?: string;
  opponent?: string;
  special?: string;
  team?: string;
  winner?: string;
  loser?: string;
  leading?: string;
  live?: string;
}

export interface SortItem {
  entityId: string;
  teamName?: string;
  special?: boolean;
  key?: number;
  opponentSpecial?: boolean;
}

export interface CardConfig {
  sections?: SectionConfig[];
  height?: string;
  colors?: ColorsConfig;
  debug?: boolean;
  show_version?: boolean;
  lazy_refresh?: number;
  fixed_refresh?: number;
}
