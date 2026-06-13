# TeamTracker Scoreboard Card

[![HACS](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://hacs.xyz)
[![GitHub Release](https://img.shields.io/github/release/marcintk/ha-teamtracker-scoreboard-card.svg)](https://github.com/marcintk/ha-teamtracker-scoreboard-card/releases)
[![License](https://img.shields.io/github/license/marcintk/ha-teamtracker-scoreboard-card.svg)](LICENSE)
[![Maintenance](https://img.shields.io/maintenance/yes/2026)](https://github.com/marcintk/ha-teamtracker-scoreboard-card)
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](https://github.com/marcintk/ha-teamtracker-scoreboard-card/actions/workflows/build-and-test.yml)
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
add your team sensors to Home Assistant. Each sensor entry creates one entity; the `name` value
becomes the entity ID — e.g. `name: nba_bos` → `sensor.nba_bos`. The card's `prefix` field groups
all sensors that share a common prefix, e.g. `sensor.nba_`.

#### Where to add the sensors

**Option A — directly in `configuration.yaml`** (simplest):

```yaml
# configuration.yaml
sensor:
  - platform: teamtracker
    league_id: "NBA"
    team_id: "BOS"
    name: "nba_bos"
  # … paste the rest of the league file here …
```

**Option B — via a package file** (keeps your main config clean):

```yaml
# configuration.yaml
homeassistant:
  packages: !include_dir_named packages/
```

```yaml
# packages/sports.yaml
sensor:
  - platform: teamtracker
    league_id: "NBA"
    team_id: "BOS"
    name: "nba_bos"
  # … paste the rest of the league file here …
```

After saving, **restart Home Assistant** (or use _Developer Tools → YAML → Check and Restart_).

#### Ready-to-paste sensor lists

Copy the file for each league you want to track and paste its contents under your `sensor:` key (or
into a package file). Delete any teams you don't need.

| League         | File                                           | Sensors                             |
| -------------- | ---------------------------------------------- | ----------------------------------- |
| NBA            | [docs/sensors-nba.yaml](docs/sensors-nba.yaml) | All 30 teams, grouped by division   |
| NHL            | [docs/sensors-nhl.yaml](docs/sensors-nhl.yaml) | All 32 teams, grouped by division   |
| FIFA World Cup | [docs/sensors-wc.yaml](docs/sensors-wc.yaml)   | Key national teams by confederation |

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
    rankType: win-loss-otl
  - name: World Cup
    prefix: sensor.wc_
    limit: 13
    special_teams:
      - fra
```

### Options

| Option         | Type    | Default  | Description                                                                           |
| -------------- | ------- | -------- | ------------------------------------------------------------------------------------- |
| `height`       | string  | auto     | Card height (CSS value); omit to fit content                                          |
| `lazyRefresh`  | number  | `500`    | Milliseconds to hold before rendering after the first event; `0` = render immediately |
| `fixedRefresh` | number  | `300000` | Re-render every N milliseconds regardless of events; `0` = disabled                   |
| `sections`     | list    | required | One entry per sport/league                                                            |
| `colors`       | map     | —        | Override team colours (see [Colors](#colors))                                         |
| `debug`        | boolean | `false`  | Show performance overlay (see [Debug overlay](#debug-overlay))                        |

### Refresh behaviour

The card subscribes to `state_changed` events; `lazyRefresh` and `fixedRefresh` can be combined:

| `lazyRefresh` | `fixedRefresh` | Behaviour                                                     |
| ------------- | -------------- | ------------------------------------------------------------- |
| `0`           | `0`            | Render only on events, immediately, no periodic refresh       |
| `0`           | `60000`        | Re-render every minute, plus immediately on every event       |
| `500`         | `300000`       | Default — batch events into 500 ms windows + 5 min safety net |
| `500`         | `0`            | Batch events only, no periodic refresh                        |

### Section options

| Field           | Type   | Default         | Description                                                                                 |
| --------------- | ------ | --------------- | ------------------------------------------------------------------------------------------- |
| `name`          | string | required        | Header label shown above the section                                                        |
| `prefix`        | string | required        | Entity ID prefix, e.g. `sensor.nba_`                                                        |
| `limit`         | number | `10`            | Max rows to show                                                                            |
| `special_teams` | list   | `[]`            | Team suffixes to highlight. Use the part after the prefix — e.g. `bos` for `sensor.nba_bos` |
| `rankType`      | string | `win-draw-loss` | How to rank teams during regular season. See below                                          |

### rankType values

| Value           | Points system   | Record format | Use for                              |
| --------------- | --------------- | ------------- | ------------------------------------ |
| `win-loss`      | W=2, L=0        | `W-L`         | NBA and other W/L-only leagues       |
| `win-draw-loss` | W=3, D=1, L=0   | `W-D-L`       | Soccer, MLS, World Cup, …            |
| `win-loss-otl`  | W=2, OTL=1, L=0 | `W-L-OTL`     | NHL and leagues with overtime losses |

`rankType` only applies during the regular season. Outside it (playoffs, cups, tournaments), the
card automatically sorts by game date regardless of your setting.

## Debug overlay

Add `debug: true` to your card config to enable a live performance overlay pinned to the bottom of
the card:

```yaml
type: custom:ha-teamtracker-scoreboard-card
debug: true
sections:
  - ...
```

The overlay shows three counters — **events** (raw WebSocket notifications received), **accepted**
(events that passed the entity filter and were scheduled for a render), and **renders** (actual DOM
updates performed) — across six rolling time windows:

| Column | Window          |
| ------ | --------------- |
| `1m`   | Last 1 minute   |
| `5m`   | Last 5 minutes  |
| `30m`  | Last 30 minutes |
| `1h`   | Last 1 hour     |
| `3h`   | Last 3 hours    |
| `6h`   | Last 6 hours    |

The timestamp in the top-left shows when the last render completed (`HH:MM:SS.mmm`). The overlay is
read-only and does not intercept clicks or touches.

Remove `debug: true` (or set it to `false`) to hide the overlay in production.

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
