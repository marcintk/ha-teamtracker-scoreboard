# Setting up ha-teamtracker sensors

Install [ha-teamtracker](https://github.com/vasqued2/ha-teamtracker) via HACS (Integrations), then
add your team sensors to Home Assistant. Each sensor entry creates one entity; the `name` value
becomes the entity ID — e.g. `name: nba_bos` → `sensor.nba_bos`. The card's `prefix` field groups
all sensors sharing a common prefix, e.g. `sensor.nba_`.

## Where to add the sensors

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

## Ready-to-paste sensor lists

Copy the file for each league you want to track and paste its contents under your `sensor:` key (or
into a package file). Delete any teams you don't need.

| League         | File                                 | Sensors                             |
| -------------- | ------------------------------------ | ----------------------------------- |
| NBA            | [sensors-nba.yaml](sensors-nba.yaml) | All 30 teams, grouped by division   |
| NHL            | [sensors-nhl.yaml](sensors-nhl.yaml) | All 32 teams, grouped by division   |
| FIFA World Cup | [sensors-wc.yaml](sensors-wc.yaml)   | Key national teams by confederation |
