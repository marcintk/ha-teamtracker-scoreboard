import { describe, expect, it } from "vitest";
import "../src/index.js";
import type { SportScoreboardCard } from "../src/index.js";
import type { GameAttr, HassStates, HomeAssistant } from "../src/types.js";
import { snapHtml } from "./helpers.js";

const makeHass = (states: HassStates = {}): HomeAssistant =>
  ({ states }) as unknown as HomeAssistant;
const makeState = (state: string, attrs: GameAttr = {}) => ({ state, attributes: attrs });

const baseAttrs: GameAttr = {
  team_homeaway: "home",
  team_name: "Lakers",
  opponent_name: "Celtics",
  team_record: "20-10",
  opponent_record: "18-12",
  team_score: "95",
  opponent_score: "90",
  team_winner: true,
  opponent_winner: false,
  team_logo: "https://cdn.example.com/lal.png",
  opponent_logo: "https://cdn.example.com/bos.png",
  season: "regular",
};

const nbaSection = {
  name: "NBA",
  prefix: "sensor.nba_",
  limit: 10,
  special_teams: [] as string[],
  rank_type: "win-loss" as const,
};

function makeCard(): SportScoreboardCard {
  return document.createElement("ha-teamtracker-scoreboard-card") as unknown as SportScoreboardCard;
}

describe("SportScoreboardCard snapshots", () => {
  it("version badge HTML", () => {
    const card = makeCard();
    card._config = { sections: [nbaSection], show_version: true };
    card._hass = makeHass({ "sensor.nba_lal": makeState("PRE", baseAttrs) });
    card._render();
    const badge = card.shadowRoot?.getElementById("sc-version");
    expect(snapHtml(badge?.outerHTML ?? "")).toMatchSnapshot();
  });
});
