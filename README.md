# ha-teamtracker-scoreboard

A compact, auto-generating sports scoreboard for Home Assistant Lovelace dashboards. Displays live scores, pre-game odds, win probability, TV channel, and series info — one row per game, grouped by sport.

Built on top of the [ha-teamtracker](https://github.com/vasqued2/ha-teamtracker) integration.

![Scoreboard preview](docs/preview.png)

---

## Features

- Live scores with in-game win probability
- Pre-game: countdown, odds, series summary
- Post-game: final score, winner highlighted
- TV channel badge (live and upcoming games)
- Team logos from ha-teamtracker
- Auto-deduplication (one row per game, not per team)
- Highlight your favourite teams in orange
- Automatically switches to tournament sort during playoffs/cups
- Refreshes every 2 minutes via a template sensor

---

## Prerequisites

Install all of the following via [HACS](https://hacs.xyz):

### Integration

| Name | Purpose |
|---|---|
| [ha-teamtracker](https://github.com/vasqued2/ha-teamtracker) | Provides `sensor.<sport>_<team>` entities with live game data |

### Frontend (Lovelace) cards

| Name | Purpose |
|---|---|
| [button-card](https://github.com/custom-cards/button-card) | Renders each score row |
| [config-template-card](https://github.com/iantrich/config-template-card) | Dynamically generates card list from JS |
| [stack-in-card](https://github.com/custom-cards/stack-in-card) | Stacks rows vertically |
| [card-mod](https://github.com/thomasloven/lovelace-card-mod) | Removes gaps between rows |

---

## Installation

### Step 1 — Configure ha-teamtracker sensors

Follow the [ha-teamtracker documentation](https://github.com/vasqued2/ha-teamtracker) to add sensors for each team you want to track. Your sensors will be named like:

```
sensor.nba_bos   # NBA Boston Celtics
sensor.nhl_dal   # NHL Dallas Stars
sensor.nfl_ne    # NFL New England Patriots
```

### Step 2 — Add the refresh signal sensor

Add this template sensor to your `configuration.yaml`. It alternates between `0` and `1` every minute, which forces `config-template-card` to re-evaluate the card and pick up new game data.

```yaml
template:
  - sensor:
      - name: "Sport Refresh Signal"
        unique_id: sport_refresh_signal
        state: >
          {{ now().minute % 2 }}
```

After adding, restart Home Assistant or reload template entities.

### Step 3 — Add the button-card template

Copy the contents of [`sport_tileboard_template.yaml`](sport_tileboard_template.yaml) into your `configuration.yaml` under the `button_card_templates:` key.

If you already have `button_card_templates:` defined, merge the `sport_tileboard_template` block into it — do **not** duplicate the top-level key.

Example `configuration.yaml` structure:

```yaml
button_card_templates:
  sport_tileboard_template:
    # ... contents of sport_tileboard_template.yaml (without the top-level key)
```

After adding, restart Home Assistant or reload Lovelace resources.

### Step 4 — Add the scoreboard card to your dashboard

1. Open your dashboard in the Lovelace UI editor
2. Add a new card → choose **Manual card**
3. Paste the contents of [`scoreboard_card.yaml`](scoreboard_card.yaml)
4. Edit the `sections` array to match your sensors (see Configuration below)

---

## Configuration

The only part of `scoreboard_card.yaml` you need to edit is the `sections` array near the top:

```yaml
const sections = [
  { name: "NBA Scoreboard",  prefix: "sensor.nba_", limit: 10, special_teams: ['bos'], sortType: 'rank-win-loss' },
  { name: "NHL Scoreboard",  prefix: "sensor.nhl_", limit: 5,  special_teams: ['dal'], sortType: 'rank-win-draw-loss' },
  { name: "NFL Scoreboard",  prefix: "sensor.nfl_", limit: 10, special_teams: [],      sortType: 'rank-win-loss' },
];
```

### Section options

| Field | Type | Description |
|---|---|---|
| `name` | string | Header label shown above the section |
| `prefix` | string | Entity ID prefix of your ha-teamtracker sensors |
| `limit` | number | Max number of game rows to display |
| `special_teams` | string[] | Team abbreviations to highlight in orange (your favourites). Use the suffix after the prefix, e.g. `'bos'` for `sensor.nba_bos` |
| `sortType` | string | See below |

### Sort types

| Value | Use for |
|---|---|
| `rank-win-loss` | Leagues with W/L records (NBA, NFL, MLB, …) |
| `rank-win-draw-loss` | Leagues with draws (NHL, MLS, soccer, …) |
| `earliest_date` | Tournaments with no standings (World Cup, playoffs, …) |

During non-regular seasons (playoffs, cups), the card automatically falls back to `earliest_date` sorting regardless of what you set.

### Card height

The card has a fixed height of `475px` by default. Adjust this in `scoreboard_card.yaml` to fit your dashboard layout:

```yaml
card_mod:
  style: |
    ha-card {
      height: 475px !important;
      min-height: 475px !important;
      max-height: 475px !important;
    }
```

---

## How it works

- `sensor.sport_refresh_signal` is listed as a watched entity in `config-template-card`. When it changes (every ~1 minute), the card re-evaluates its JS and regenerates the list of game rows.
- The JS scans all HA states for entities matching each section's `prefix` and in a valid game state (`PRE`, `IN`, `POST`, `BYE`).
- For `earliest_date` sort, duplicate games (same two teams, same date) are deduplicated — preferring the `home` team's sensor so the team side order is consistent.
- Each game row is rendered by `sport_tileboard_template`, a `button-card` template that reads all display values from the entity's attributes.

---

## Scoreboard visual states

| State | Score bg | Score color | Message area |
|---|---|---|---|
| `PRE` | dark | black | Countdown + odds / series |
| `IN` | light gray | brown (leading) / black (trailing) | Clock + win % |
| `POST` | transparent | orange (winner) / light gray (loser) | Final clock + series |
