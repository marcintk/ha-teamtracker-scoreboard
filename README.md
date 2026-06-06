# ha-teamtracker-scoreboard

A compact, auto-generating sports scoreboard card for Home Assistant Lovelace dashboards.

Displays live scores, pre-game odds, win probability, TV network, and series info — one row per game, grouped by sport. Built on top of the [ha-teamtracker](https://github.com/vasqued2/ha-teamtracker) integration.

![Scoreboard preview](docs/preview.png)

## Features

- Live scores with in-game win probability and clock
- Pre-game: countdown, odds / series summary
- Post-game: final score, winner highlighted in orange
- TV network badge on live and upcoming games
- Team logos from ha-teamtracker (ESPN CDN)
- Auto-deduplication: one row per game, not per sensor
- Highlight your favourite teams in orange via `special_teams`
- Automatically falls back to date sort during playoffs / tournaments
- Single HACS install — no extra card dependencies

## Requirements

| Dependency | Type | Notes |
|---|---|---|
| [ha-teamtracker](https://github.com/vasqued2/ha-teamtracker) | HACS Integration | Provides the `sensor.<sport>_<team>` entities |

That's it. This card replaces button-card, config-template-card, stack-in-card, and card-mod.

## Installation

### Via HACS (recommended)

1. In HACS → Frontend → click **+** → search **Sport Scoreboard Card** → Install
2. Reload your browser
3. Add the card to your dashboard (see Configuration below)

### Manual

1. Copy `card.js` to `<config>/www/ha-teamtracker-scoreboard-card/card.js` (create the folder if needed)
2. In Home Assistant → Settings → Dashboards → Resources → **Add resource**
   - URL: `/local/ha-teamtracker-scoreboard-card/card.js`
   - Resource type: **JavaScript module**
3. Reload your browser

## Configuration

Add a **Manual card** to your dashboard and paste:

```yaml
type: custom:ha-teamtracker-scoreboard-card
height: 475px
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
    rankType: by-date
```

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `height` | string | `475px` | Card height (CSS value) |
| `sections` | list | required | One entry per sport/league |

### Section options

| Field | Type | Default | Description |
|---|---|---|---|
| `name` | string | required | Header label shown above the section |
| `prefix` | string | required | Entity ID prefix, e.g. `sensor.nba_` |
| `limit` | number | `10` | Max rows to show |
| `special_teams` | list | `[]` | Team suffixes to highlight in orange. Use the part after the prefix — e.g. `bos` for `sensor.nba_bos` |
| `rankType` | string | `win-loss` | How to rank teams during regular season. See below |

### rankType values

| Value | Use for |
|---|---|
| `win-loss` | Leagues with W/L records (NBA, NFL, MLB, …) |
| `win-draw-loss` | Leagues where draws count (NHL, MLS, soccer, …) |
| `by-date` | Tournaments without standings (World Cup, …) |

`rankType` only applies during the regular season. Outside it (playoffs, cups), the card automatically sorts by game date regardless of your setting.

## Theming

You can override colours with CSS custom properties in your theme:

```yaml
ha-teamtracker-scoreboard-card:
  --scoreboard-team-color: white        # tracked team name colour
  --scoreboard-opponent-color: "#777"   # opponent name colour
  --scoreboard-special-color: orange    # special_teams highlight colour
```

## Score row visual states

| State | Score bg | Score colour | Message area |
|---|---|---|---|
| `PRE` | dark (`#303030`) | black | Countdown · odds / series |
| `IN` | light gray | brown (leading) / black (trailing) | Clock · win % |
| `POST` | transparent | orange (winner) / gray (loser) | Final clock · series |
