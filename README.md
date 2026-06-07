# TeamTracker Scoreboard Card

[![HACS Default](https://img.shields.io/badge/HACS-Default-41BDF5.svg)](https://hacs.xyz)
[![GitHub Release](https://img.shields.io/github/release/marcintk/ha-teamtracker-scoreboard-card.svg)](https://github.com/marcintk/ha-teamtracker-scoreboard-card/releases)
[![CI](https://github.com/marcintk/ha-teamtracker-scoreboard-card/actions/workflows/build-and-test.yml/badge.svg)](https://github.com/marcintk/ha-teamtracker-scoreboard-card/actions/workflows/build-and-test.yml)

Home Assistant custom Lovelace card displaying live scores, pre-game odds, win probability, TV
network, and series info — one row per game, grouped by sport. Built on top of the
[ha-teamtracker](https://github.com/vasqued2/ha-teamtracker) integration.

## Preview

[![Preview](https://raw.githubusercontent.com/marcintk/ha-teamtracker-scoreboard-card/main/docs/preview.png)](https://github.com/marcintk/ha-teamtracker-scoreboard-card)

## Features

- Live scores with in-game win probability and clock
- Pre-game: countdown, odds / series summary
- Post-game: final score, winner highlighted in orange
- TV network badge on live and upcoming games
- Highlight your favourite teams in blue via `special_teams` (colour configurable)
- Single HACS install — no extra card dependencies

## Requirements

| Dependency                                                   | Type             | Notes                                         |
| ------------------------------------------------------------ | ---------------- | --------------------------------------------- |
| [ha-teamtracker](https://github.com/vasqued2/ha-teamtracker) | HACS Integration | Provides the `sensor.<sport>_<team>` entities |

### Setting up ha-teamtracker sensors

Install [ha-teamtracker](https://github.com/vasqued2/ha-teamtracker) via HACS (Integrations), then
add your team sensors to `configuration.yaml`. The sensor `name` becomes the entity ID prefix used
in this card's `prefix` field — e.g. `name: nba_bos` → `sensor.nba_bos`.

```yaml
sensor:
  # ── NBA ──────────────────────────────────────────
  # ── ATLANTIC ───────────────────────────────────────────
  - platform: teamtracker
    league_id: "NBA"
    team_id: "BOS"
    name: "nba_bos"
  - platform: teamtracker
    league_id: "NBA"
    team_id: "BKN"
    name: "nba_bkn"
  - platform: teamtracker
    league_id: "NBA"
    team_id: "NY"
    name: "nba_ny"
```

Add one entry per team you want to track. The `name` value must be unique and should follow a
consistent `<league>_<team>` pattern so the card can group them with a single `prefix`.

## Installation

### Via HACS (recommended)

1. In HACS → Frontend → click the three-dot menu → **Custom repositories**
   - Repository: `https://github.com/marcintk/ha-teamtracker-scoreboard-card` (exact URL)
   - Category: **Dashboard**
2. Search **TeamTracker Scoreboard Card** → Install
3. Reload your browser
4. Add the card to your dashboard (see Configuration below)

### Manual

1. Copy `dist/card.js` to `<config>/www/ha-teamtracker-scoreboard-card/card.js` (create the folder
   if needed)
2. In Home Assistant → Settings → Dashboards → Resources → **Add resource**
   - URL: `/local/ha-teamtracker-scoreboard-card/card.js`
   - Resource type: **JavaScript module**
3. Reload your browser

## Configuration

Add a **Manual card** to your dashboard and paste:

```yaml
type: custom:ha-teamtracker-scoreboard-card
sections:
  - name: NBA Scoreboard
    prefix: sensor.nba_
    limit: 10
    special_teams:
      - bos
    rankType: win-loss
  - name: NHL Scoreboard
    prefix: sensor.nhl_
    limit: 5
    special_teams:
      - dal
    rankType: win-draw-loss
  - name: World Cup
    prefix: sensor.wc_
    limit: 13
    special_teams:
      - fra
```

### Options

| Option     | Type              | Default  | Description                                                                  |
| ---------- | ----------------- | -------- | ---------------------------------------------------------------------------- |
| `height`   | string            | auto     | Card height (CSS value); omit to fit content                                 |
| `refresh`  | `"auto"` / number | `"auto"` | `"auto"` re-renders on HA state changes; a number re-renders every n seconds |
| `sections` | list              | required | One entry per sport/league                                                   |
| `colors`   | map               | —        | Override team colours (see [Colors](#colors))                                |

### Section options

| Field           | Type   | Default         | Description                                                                                 |
| --------------- | ------ | --------------- | ------------------------------------------------------------------------------------------- |
| `name`          | string | required        | Header label shown above the section                                                        |
| `prefix`        | string | required        | Entity ID prefix, e.g. `sensor.nba_`                                                        |
| `limit`         | number | `10`            | Max rows to show                                                                            |
| `special_teams` | list   | `[]`            | Team suffixes to highlight. Use the part after the prefix — e.g. `bos` for `sensor.nba_bos` |
| `rankType`      | string | `win-draw-loss` | How to rank teams during regular season. See below                                          |

### rankType values

| Value           | Use for                                         |
| --------------- | ----------------------------------------------- |
| `win-draw-loss` | Leagues where draws count (NHL, MLS, soccer, …) |
| `win-loss`      | Leagues with W/L records only (NBA, …)          |

`rankType` only applies during the regular season. Outside it (playoffs, cups, tournaments), the
card automatically sorts by game date regardless of your setting.

## Colors

Set any colour directly in the card config:

```yaml
type: custom:ha-teamtracker-scoreboard-card
colors:
  team: white
  opponent: gray
  special: "#2196F3" # Material Blue
  header: "#2196F3" # Material Blue
  winner: orange
  loser: darkgray
  live: indianred
  leading: brown
sections:
  - ...
```

| Key        | Default                   | Description                                |
| ---------- | ------------------------- | ------------------------------------------ |
| `team`     | `white`                   | Your tracked team name                     |
| `opponent` | `#777` (Gray)             | Opponent name                              |
| `special`  | `#2196F3` (Material Blue) | `special_teams` highlight                  |
| `header`   | `#2196F3` (Material Blue) | Section header label                       |
| `winner`   | `orange`                  | POST winner score and final clock          |
| `loser`    | `darkgray`                | POST loser score                           |
| `live`     | `indianred`               | IN game clock text and TV badge background |
| `leading`  | `brown`                   | IN score for the currently leading team    |

## Score row visual states

| State  | Score bg         | Score colour                       | Message area              |
| ------ | ---------------- | ---------------------------------- | ------------------------- |
| `PRE`  | dark (`#303030`) | black                              | Countdown · odds / series |
| `IN`   | light gray       | brown (leading) / black (trailing) | Clock · win %             |
| `POST` | transparent      | orange (winner) / gray (loser)     | Final clock · series      |

## Development

See [CLAUDE.md](CLAUDE.md) for build commands, contributing guidelines, and release instructions.
