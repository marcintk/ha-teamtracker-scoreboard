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
sections:
  - name: Serie A
    prefix: sensor.sera_
    limit: 20
    rank_type: win-draw-loss
    special_teams:
      - juv
  - name: Primera Division
    prefix: sensor.liga_
    limit: 20
    rank_type: win-draw-loss
  - name: NBA Scoreboard
    prefix: sensor.nba_
    limit: 20
    rank_type: win-loss
    special_teams:
      - sa
```

## Standings vs schedule

Every section renders as one of two things:

- a **standings table** — **one row per team**, ranked by record, best at the top, with a position
  number in the gutter (this is what `rank_type` and the position column are for). If you track both
  sides of a fixture, that game shows up on both teams' rows — this view doesn't merge them
- a **schedule** — **one row per game**, sorted by date, no ranking. Home and away sensors for the
  same game are deduplicated (the home sensor wins)

By default (`view: auto`) a section shows the standings table when **every** tracked team reports a
numeric win-loss record (`12-4`, `0-1-2`, `5-2-1`), and the schedule otherwise — so a cup or
knockout stage with no records lands on the schedule on its own. Set the [`view`](#section) field to
`ranking` or `schedule` to override.

## Rank type

In the standings table teams are ordered by their win-loss record, best at the top. `rank_type` (per
section) picks the formula:

| Value           | Points system   | Record format | Use for                              |
| --------------- | --------------- | ------------- | ------------------------------------ |
| `win-loss`      | W=2, L=0        | `W-L`         | NBA and other W/L-only leagues       |
| `win-draw-loss` | W=3, D=1, L=0   | `W-D-L`       | Soccer leagues, MLS, …               |
| `win-loss-otl`  | W=2, OTL=1, L=0 | `W-L-OTL`     | NHL and leagues with overtime losses |

## Configuration

### Card

| Option         | Type    | Default  | Description                                                                                                                                                                                                                           |
| -------------- | ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sections`     | list    | required | One entry per league — see [Section](#section)                                                                                                                                                                                        |
| `layout`       | map     | —        | Size / spacing / text-scale knobs — see [Layout](#layout)                                                                                                                                                                             |
| `colors`       | map     | —        | Team colour overrides — see [Colors](#colors)                                                                                                                                                                                         |
| `slide_sec`    | number  | —        | Show one section at a time, auto-advancing every N seconds (needs ≥ 2 sections); header gets `‹` / stop-resume / `›` controls. With no `layout.height`, the card locks to the tallest section. `prefers-reduced-motion` starts paused |
| `debug`        | boolean | `false`  | Pin a live-refresh overlay — **events** / **accepted** / **renders** counters over 1m–3h windows, every 5s                                                                                                                            |
| `show_version` | boolean | `false`  | Show the card version badge, centred at the top                                                                                                                                                                                       |

### Refresh

The card subscribes to Home Assistant state changes and re-renders when a tracked sensor updates.
These two knobs tune that cadence.

| Option          | Type   | Default | Description                                                                      |
| --------------- | ------ | ------- | -------------------------------------------------------------------------------- |
| `lazy_refresh`  | number | `1`     | Seconds to debounce after the first event before rendering; `0` = render at once |
| `fixed_refresh` | number | `60`    | Re-render every N seconds regardless of events; `0` = disabled                   |

### Section

```yaml
type: custom:ha-teamtracker-scoreboard-card
sections:
  - name: Premier League
    prefix: sensor.epl_
    limit: 12
    view: auto
    rank_type: win-draw-loss
    score_blink: 5
    show_position: true
    special_teams:
      - liv
  - ...
```

| Field                   | Type    | Default         | Description                                                                                                                                                                                                                  |
| ----------------------- | ------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `section.name`          | string  | required        | Header label shown above the section                                                                                                                                                                                         |
| `section.prefix`        | string  | required        | Entity ID prefix, e.g. `sensor.nba_`                                                                                                                                                                                         |
| `section.limit`         | number  | `10`            | Max rows to show                                                                                                                                                                                                             |
| `section.view`          | string  | `auto`          | What the section shows (see [Standings vs schedule](#standings-vs-schedule)). `auto` = standings when every team has a numeric record, else schedule; `ranking` = always standings; `schedule` = always the date-sorted list |
| `section.rank_type`     | string  | `win-draw-loss` | Ranking formula for the standings table — see [Rank type](#rank-type)                                                                                                                                                        |
| `section.score_blink`   | number  | `5`             | Seconds to blink the score after a goal/basket; `0` disables                                                                                                                                                                 |
| `section.show_position` | boolean | `true`          | Show this section's position numbers. Only applies in a `ranking` view — a `schedule` section's gutter is always blank. `false` blanks the numbers but keeps the gutter drawn so mixed sections stay row-aligned             |
| `section.special_teams` | list    | `[]`            | Team suffixes to highlight — the part after the prefix, e.g. `bos` for `sensor.nba_bos`                                                                                                                                      |

### Layout

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

| Key                  | Type   | Default | Description                                                               |
| -------------------- | ------ | ------- | ------------------------------------------------------------------------- |
| `layout.height`      | string | auto    | Outer card height (any CSS length); omit to fit content                   |
| `layout.row_height`  | string | `28px`  | `.game-row` height, the logo / score / colon cell heights, the logo image |
| `layout.logo_width`  | string | `30px`  | Logo cell width and the logo image width (aspect ratio preserved)         |
| `layout.score_width` | string | `34px`  | Score cell width — widen for 3-digit totals                               |
| `layout.colon_width` | string | `9px`   | Centre colon cell width                                                   |
| `layout.team_width`  | string | `99px`  | Team-name column width; one CSS length applied to both sides              |
| `layout.font_scale`  | number | `1`     | Uniform multiplier over every text size; raise `layout.row_height` too    |

### Styling with CSS

Every dimension and colour above is also a CSS custom property, each prefixed **`--ttsc-`** (unique
to this card) and each with a built-in fallback. Setting a `layout:` / `colors:` key just writes the
matching property inline on the card. To restyle from a theme or `card_mod` instead, set the
property on `ha-card` (or any ancestor — custom properties inherit into the card's shadow DOM); a
key you left out of `layout:` / `colors:` takes the CSS value, one you set there wins unless your
rule uses `!important`.

| Property                                              | Default                            | Set by                           |
| ----------------------------------------------------- | ---------------------------------- | -------------------------------- |
| `--ttsc-row-height`                                   | `28px`                             | `layout.row_height`              |
| `--ttsc-logo-width`                                   | `30px`                             | `layout.logo_width`              |
| `--ttsc-score-width`                                  | `34px`                             | `layout.score_width`             |
| `--ttsc-colon-width`                                  | `9px`                              | `layout.colon_width`             |
| `--ttsc-team-col-a-width` / `--ttsc-team-col-b-width` | `99px`                             | `layout.team_width` (both sides) |
| `--ttsc-font-scale`                                   | `1`                                | `layout.font_scale`              |
| `--ttsc-team-color`                                   | `var(--primary-text-color, white)` | `colors.team`                    |
| `--ttsc-opponent-color`                               | `#777`                             | `colors.opponent`                |
| `--ttsc-special-color`                                | `#2196F3`                          | `colors.special`                 |

The remaining `colors:` keys (`header`, `winner`, `loser`, `live`, `leading`) have no CSS property —
set them through the `colors:` map.

```css
/* e.g. via card_mod */
ha-card {
  --ttsc-row-height: 40px;
  --ttsc-special-color: #e91e63;
}
```

`layout.height` is applied as a plain `height` on `ha-card`, not a custom property.

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

| Key               | Default                   | Description                                |
| ----------------- | ------------------------- | ------------------------------------------ |
| `colors.team`     | `white`                   | Your tracked team name                     |
| `colors.opponent` | `#777` (gray)             | Opponent name                              |
| `colors.special`  | `#2196F3` (Material Blue) | `special_teams` highlight                  |
| `colors.header`   | `#2196F3` (Material Blue) | Section header label                       |
| `colors.winner`   | `orange`                  | POST winner score and final clock          |
| `colors.loser`    | `darkgray`                | POST loser score                           |
| `colors.live`     | `indianred`               | IN game clock text and TV badge background |
| `colors.leading`  | `brown`                   | IN score for the currently leading team    |

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
