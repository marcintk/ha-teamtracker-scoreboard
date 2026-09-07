# TeamTracker Scoreboard Card

[![TeamTracker Scoreboard Card][preview-img]][repo]

Home Assistant custom Lovelace card displaying live scores, pre-game odds, win probability, TV
network, and series info — one row per game, grouped by sport. Built on top of the
[ha-teamtracker](https://github.com/vasqued2/ha-teamtracker) integration.

[![hacs_badge][hacs-shield]][hacs] [![GitHub Release][releases-shield]][releases]
[![License][license-shield]][license] ![Maintenance][maintenance-shield]
[![Coverage][coverage-shield]][ci] [![Downloads][downloads-shield]][releases] [![CI][ci-shield]][ci]

## Requirements

Requires [ha-teamtracker](https://github.com/vasqued2/ha-teamtracker) (HACS Integration) — it
provides the `sensor.<sport>_<team>` entities this card reads.

**Ready-made sensor configs** live in [`docs/sensors/`](docs/sensors/) — one drop-in `sensor:`
package per league, all rosters verified against ESPN for the 2026/27 season:

- **NBA** — all 30 teams
- **NHL** — all 32 teams
- **NFL** — all 32 teams
- **Premier League** (England) — all 20 clubs
- **La Liga / Primera División** (Spain) — all 20 clubs
- **Serie A** (Italy) — all 20 clubs

See [docs/sensors/README.md](docs/sensors/README.md) for how to load them and per-league notes.

## Installation

### Via HACS (recommended)

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=marcintk&repository=ha-teamtracker-scoreboard-card&category=plugin)

Click the badge to open this card in your own HACS, or find it manually: HACS → Frontend → search
**TeamTracker Scoreboard Card**. Then Install, reload your browser, and add the card to your
dashboard (see Configuration below).

### Manual

Drop `card.js` from the
[latest release](https://github.com/marcintk/ha-teamtracker-scoreboard-card/releases/latest) into
`<config>/www/ha-teamtracker-scoreboard-card/`, then register
`/local/ha-teamtracker-scoreboard-card/card.js` as a **JavaScript Module** under Settings →
Dashboards → Resources.

## Usage

Add a **Manual card** to your dashboard and paste:

```yaml
type: custom:ha-teamtracker-scoreboard-card
slide_sec: 45
layout:
  team_width: 80px
sections:
  - name: Serie A
    prefix: sensor.sera_
    limit: 20
    season_mode: regular
    rank_type: win-draw-loss
    special_teams:
      - juv
  - name: Primera Division
    prefix: sensor.liga_
    limit: 20
    season_mode: regular
    rank_type: win-draw-loss
  - name: Premier League
    prefix: sensor.epl_
    limit: 20
    season_mode: regular
    rank_type: win-draw-loss
  - name: NBA Scoreboard
    prefix: sensor.nba_
    limit: 20
    rank_type: win-loss
    special_teams:
      - sa
  - name: NHL Scoreboard
    prefix: sensor.nhl_
    limit: 20
    rank_type: win-loss-otl
    special_teams:
      - dal
  - name: NFL Scoreboard
    prefix: sensor.nfl_
    limit: 20
    rank_type: win-loss
    special_teams:
      - gb
```

Card-level keys are optional: `slide_sec` (see [Options](#options)) and the `layout:` map (see
[Layout & sizing](#layout--sizing)). Per section: `prefix` matches the entity IDs from the league
file you imported (see [docs/sensors/](docs/sensors/)); `rank_type` is `win-loss` for NBA/NFL,
`win-loss-otl` for NHL, `win-draw-loss` for the soccer leagues; and the soccer sections use
`season_mode: regular` so the card always shows the standings table (ha-teamtracker's `season`
attribute isn't a clean token — see [Season mode](#season-mode)). `special_teams` takes the suffix
after the prefix (`juv` for `sensor.sera_juv`).

## Configuration

### Options

Behavioural card-level options. Everything that controls **size, spacing, and text scale** lives
under the `layout:` map — see [Layout & sizing](#layout--sizing). `slide_sec` is in
[Rotating sections](#rotating-sections).

| Option          | Type    | Default  | Description                                                                                                            |
| --------------- | ------- | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `lazy_refresh`  | number  | `1`      | Seconds to hold before rendering after the first event; `0` = render immediately                                       |
| `fixed_refresh` | number  | `60`     | Re-render every N seconds regardless of events; `0` = disabled                                                         |
| `sections`      | list    | required | One entry per sport/league                                                                                             |
| `colors`        | map     | —        | Override team colours (see [Colors](#colors))                                                                          |
| `debug`         | boolean | `false`  | Pin a live-refresh overlay to the card — **events** / **accepted** / **renders** counters over 1m–3h windows, every 5s |
| `show_version`  | boolean | `false`  | Show card version badge (top-right corner)                                                                             |
| `show_position` | boolean | `true`   | Set `false` to drop the standings-position column from the whole card. See [Standings position](#standings-position)   |

### Section options

| Field           | Type    | Default         | Description                                                                                              |
| --------------- | ------- | --------------- | -------------------------------------------------------------------------------------------------------- |
| `name`          | string  | required        | Header label shown above the section                                                                     |
| `prefix`        | string  | required        | Entity ID prefix, e.g. `sensor.nba_`                                                                     |
| `limit`         | number  | `10`            | Max rows to show                                                                                         |
| `special_teams` | list    | `[]`            | Team suffixes to highlight. Use the part after the prefix — e.g. `bos` for `sensor.nba_bos`              |
| `rank_type`     | string  | `win-draw-loss` | Ranking formula for the regular season. See below                                                        |
| `season_mode`   | string  | `auto`          | Override the automatic standings-vs-fixtures choice. `auto` / `regular` / `by-date`. See below           |
| `show_position` | boolean | `true`          | Show the standings-position number in the leftmost column. See [Standings position](#standings-position) |
| `score_blink`   | number  | `5`             | Seconds to blink the score after a goal/basket. Set to `0` to disable.                                   |

### Rank type

During the **regular season** the card ranks all tracked teams by their win-loss record and displays
them top-to-bottom from highest to lowest in the standings — i.e. first place at the top, last place
at the bottom. Choose the formula that matches the league:

| Value           | Points system   | Record format | Use for                              |
| --------------- | --------------- | ------------- | ------------------------------------ |
| `win-loss`      | W=2, L=0        | `W-L`         | NBA and other W/L-only leagues       |
| `win-draw-loss` | W=3, D=1, L=0   | `W-D-L`       | Soccer leagues, MLS, …               |
| `win-loss-otl`  | W=2, OTL=1, L=0 | `W-L-OTL`     | NHL and leagues with overtime losses |

During **playoffs, cups, and tournaments** the card ignores `rank_type` entirely and sorts rows by
game date instead.

### Standings position

In the regular season each row opens with a narrow column holding that team's **position in the
standings** — its rank in the full sorted list, so `1` is the section leader even when `limit` hides
the rows below it. The number is coloured like its team, so `special_teams` positions stand out too.

Set `show_position: false` on a **section** to hide the numbers. The narrow column is still drawn
(empty), so a card that mixes a standings section with a date-sorted one keeps every row aligned. In
date-sorted mode (playoffs, cups, or `season_mode: by-date`) the column is always empty — there is
no league position to show.

Set `show_position: false` at the **card** level to remove the column entirely — no gutter on any
row, restoring the pre-position-column layout. Use this when no section ever shows standings.

```yaml
sections:
  - name: Premier League
    prefix: sensor.epl_
    rank_type: win-draw-loss
    show_position: false # hide the position numbers for this section
```

### Season mode

The switch between the standings table and the date-sorted fixture table is automatic: if any
tracked sensor reports a `season` attribute that is set and not `regular`, the card shows the
fixture table. Some leagues don't expose a clean season-type token — TeamTracker's Italian Serie A
sensors, for example, report `season: 2026-27-italian-serie-a`, which the heuristic reads as "not
the regular season" and wrongly flips to the fixture table.

`season_mode` overrides the heuristic for a section, in either direction:

| Value     | Effect                                                                      |
| --------- | --------------------------------------------------------------------------- |
| `auto`    | Default. Fixture table when any sensor's `season` is set and not `regular`. |
| `regular` | Always rank by `rank_type`, whatever `season` says.                         |
| `by-date` | Always the date-sorted fixture table, one row per game.                     |

```yaml
sections:
  - name: Serie A
    prefix: sensor.sera_
    rank_type: win-draw-loss
    season_mode: regular # treat as regular season even though the sensor doesn't say so
```

### Colors

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

### Layout & sizing

Every card-level knob for size, spacing, and text scale lives under one `layout:` map (like
`colors:`). `height` sets the outer card box; the rest override the built-in pixel constants for the
row layout — each maps to a `--scoreboard-*` CSS variable that falls back to its default, so a card
with no `layout:` renders exactly as before.

```yaml
type: custom:ha-teamtracker-scoreboard-card
layout:
  height: 600px # fixed card box (else fits content)
  row_height: 34px # roomier rows; the logo scales with it
  logo_width: 40px
  score_width: 42px # room for 3-digit basketball totals
  team_width: 130px # widen both team-name columns
  font_scale: 1.15 # ~15% larger text throughout
sections:
  - ...
```

| `layout:` key | Type   | Default | Controls                                                                                  |
| ------------- | ------ | ------- | ----------------------------------------------------------------------------------------- |
| `height`      | string | auto    | Outer card height (any CSS length); omit to fit content                                   |
| `row_height`  | string | `28px`  | `.game-row` height, the logo / score / colon cell heights, the logo image                 |
| `logo_width`  | string | `30px`  | Logo cell width and the logo image width (aspect ratio is preserved)                      |
| `score_width` | string | `34px`  | Score cell width — widen for 3-digit totals                                               |
| `colon_width` | string | `9px`   | Centre colon cell width                                                                   |
| `team_width`  | string | `99px`  | Team-name column width; one CSS length applied to both sides                              |
| `font_scale`  | number | `1`     | Uniform multiplier over every text size — see [Typography scale](#typography-scale) below |

The same keys set flat at the card root (plus `team_col_width` for `team_width`) are still accepted
as **deprecated** aliases; a value under `layout:` wins over its flat counterpart.

`getCardSize()` — the height hint Home Assistant uses for masonry layout — tracks
`layout.row_height` when it is a plain pixel value.

#### Typography scale

`layout.font_scale` is a single multiplier applied to **every** font size in the card — score, team
name, section header, rank, message, TV badge. The built-in sizes were tuned as a set, so scaling
them together keeps their proportions (the score stays ≈1.5× the team name at any value).

```yaml
type: custom:ha-teamtracker-scoreboard-card
layout:
  font_scale: 1.15 # ~15% larger text throughout
  row_height: 34px # give the taller text room — see below
sections:
  - ...
```

It is a positive multiplier; `1` is the baseline and is a no-op (nothing is emitted). It is a
readability knob only — it does **not** touch `row_height` or the column widths. A `font_scale` much
above `1` puts larger text in an unchanged row, which clips top and bottom; raise `row_height`
alongside it. Values ≤ 0 collapse the text to nothing and are not validated — don't set them.

### Rotating sections

With `slide_sec` set and **two or more** sections, the card stops stacking them and instead shows
one section at a time, advancing to the next every `slide_sec` seconds and wrapping after the last.
Empty sections take their turn too (header + "no games"), so the rotation order is stable.

```yaml
type: custom:ha-teamtracker-scoreboard-card
slide_sec: 60 # a minute per league
sections:
  - name: NBA
    prefix: sensor.nba_
  - name: NHL
    prefix: sensor.nhl_
  - name: EPL
    prefix: sensor.epl_
```

Three buttons sit at the right of the section header:

| Button    | Action                                                           |
| --------- | ---------------------------------------------------------------- |
| `‹`       | Previous section — steps immediately and **pauses** the rotation |
| `⏸` / `▶` | Stop / resume the rotation. Turns **orange** while paused        |
| `›`       | Next section — steps immediately and **pauses** the rotation     |

Only the stop/resume button resumes auto-advancing; the arrows just pause. If the viewer's system is
set to **reduce motion**, the card starts paused (orange `▶`) — every section is still reachable
with the arrows, and one tap starts the rotation.

Unset `slide_sec`, `slide_sec: 0`, or a single section → the sections stack as before, with no
controls.

When `layout.height` is not set, a rotating card locks its height to the tallest section so it
doesn't jump between advances; an explicit `layout.height` still wins. `getCardSize()` reports one
section rather than the sum.

<!-- Reference links -->

[repo]: https://github.com/marcintk/ha-teamtracker-scoreboard-card
[hacs]: https://hacs.xyz
[hacs-shield]: https://img.shields.io/badge/HACS-Default-41BDF5.svg
[releases]: https://github.com/marcintk/ha-teamtracker-scoreboard-card/releases
[releases-shield]: https://img.shields.io/github/release/marcintk/ha-teamtracker-scoreboard-card.svg
[license]: https://github.com/marcintk/ha-teamtracker-scoreboard-card/blob/main/LICENSE
[license-shield]: https://img.shields.io/github/license/marcintk/ha-teamtracker-scoreboard-card.svg
[maintenance-shield]: https://img.shields.io/maintenance/yes/2026
[ci]:
  https://github.com/marcintk/ha-teamtracker-scoreboard-card/actions/workflows/build-and-test.yml
[ci-shield]:
  https://github.com/marcintk/ha-teamtracker-scoreboard-card/actions/workflows/build-and-test.yml/badge.svg
[coverage-shield]: https://img.shields.io/badge/coverage-100%25-brightgreen
[downloads-shield]:
  https://img.shields.io/github/downloads/marcintk/ha-teamtracker-scoreboard-card/total?label=downloads
[preview-img]:
  https://raw.githubusercontent.com/marcintk/ha-teamtracker-scoreboard-card/main/docs/preview.png
