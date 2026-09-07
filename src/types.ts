export type GameState = "PRE" | "IN" | "POST" | "BYE";

export type SortMode = "win-loss" | "win-draw-loss" | "win-loss-otl" | "by-date";

export type SeasonMode = "auto" | "regular" | "by-date";

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
  season_mode?: SeasonMode;
  score_blink?: number;
  show_position?: boolean;
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

/** Card-level size / spacing / text-scale knobs, grouped like `colors`. */
export interface LayoutConfig {
  /** outer card height (any CSS length); omit to fit content */
  height?: string;
  /** team-name column width; one CSS length applied to both sides */
  team_width?: string;
  logo_width?: string;
  score_width?: string;
  colon_width?: string;
  row_height?: string;
  /** uniform multiplier over every font-size; 1 = baseline */
  font_scale?: number;
}

export interface SortItem {
  entityId: string;
  teamName?: string;
  special?: boolean;
  key?: number;
  opponentSpecial?: boolean;
  position?: number;
}

export interface CardConfig {
  sections?: SectionConfig[];
  /** size / spacing / text-scale knobs; the flat keys below are deprecated aliases */
  layout?: LayoutConfig;
  /** @deprecated use `layout.height` */
  height?: string;
  /** @deprecated use `layout.team_width` */
  team_width?: string;
  /** @deprecated use `layout.team_width` */
  team_col_width?: string;
  /** @deprecated use `layout.logo_width` */
  logo_width?: string;
  /** @deprecated use `layout.score_width` */
  score_width?: string;
  /** @deprecated use `layout.colon_width` */
  colon_width?: string;
  /** @deprecated use `layout.row_height` */
  row_height?: string;
  /** @deprecated use `layout.font_scale` */
  font_scale?: number;
  colors?: ColorsConfig;
  debug?: boolean;
  show_version?: boolean;
  lazy_refresh?: number;
  fixed_refresh?: number;
  /** card-level: false removes the .team-pos gutter entirely */
  show_position?: boolean;
  /** card-level: rotate sections as a slideshow, N seconds each (needs ≥2 sections) */
  slide_sec?: number;
}
