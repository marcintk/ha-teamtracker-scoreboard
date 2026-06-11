# Architecture

`ha-teamtracker-scoreboard-card` is a custom Home Assistant Lovelace card implemented as a native
`HTMLElement` with a Shadow DOM. It reads game state from entities produced by the
[ha-teamtracker](https://github.com/vasqued2/ha-teamtracker) integration and renders a compact
scoreboard entirely in client-side JavaScript — no server round-trips, no framework.

---

## Module Map

| File               | Responsibility                                                                  |
| ------------------ | ------------------------------------------------------------------------------- |
| `src/index.js`     | Custom element class, HA lifecycle hooks, entity cache, render orchestration    |
| `src/render.js`    | `rowHtml()` — one game row; `sectionHtml()` — filter, sort, dedup, combine rows |
| `src/display.js`   | Stateless display helpers: colors, text snippets, TV badge, message column      |
| `src/sorting.js`   | `winRatio()`, `sortKeyFor()`, `deduplicate()` — ranking and dedup logic         |
| `src/styles.js`    | CSS string exported as `CARD_STYLES`, injected into Shadow DOM on each render   |
| `src/utils.js`     | `esc()` — HTML escaping; `safeLogoUrl()` — HTTPS-only URL guard                 |
| `src/constants.js` | `VALID_STATES` set: `PRE`, `IN`, `POST`, `BYE`                                  |

---

## Home Assistant Lifecycle

```
┌──────────────────────────────────────────────────────────┐
│ HA Dashboard                                             │
│  setConfig(config) ──► store config, reset cache,        │
│                         start timer, render if hass ready │
│                                                           │
│  set hass(hass)    ──► build cache (once), check for     │
│                         relevant change, render if needed  │
│                                                           │
│  disconnectedCallback ► stop interval timer               │
└──────────────────────────────────────────────────────────┘
```

### `setConfig(config)`

Stores the card config, resets `_trackedIds` (so the entity cache is rebuilt on the next `set hass`
call), starts or stops the optional polling timer, and triggers an immediate render if `_hass` is
already available.

### `set hass(hass)`

Called by HA whenever **any** entity in the dashboard changes. The card:

1. Lazily builds `_trackedIds` on the first call (see below).
2. In **auto** mode (default): calls `_hasRelevantChange()` — if no tracked entity changed, updates
   the `_hass` reference silently without re-rendering.
3. In **numeric** mode (`refresh: 30`): skips the change check; the interval timer drives renders.

### `disconnectedCallback()`

Clears the interval timer to prevent memory leaks when the card is removed from the DOM.

---

## Entity Update Mechanism & Caching

### `_trackedIds` — the key optimisation

HA fires `set hass` on every state change in the entire dashboard (potentially hundreds of
entities). Without filtering this would re-render the card far too often.

`_buildTrackedIds(stateKeys)` runs **once per config**:

```js
const prefixes = config.sections.map((s) => s.prefix);
this._trackedIds = new Set(stateKeys.filter((id) => prefixes.some((p) => id.startsWith(p))));
```

`_hasRelevantChange(newHass)` then does an O(1) reference comparison per tracked entity:

```js
for (const id of this._trackedIds) {
  if (newHass.states[id] !== this._hass.states[id]) return true;
}
```

HA replaces the entire state object reference when an entity updates, so reference inequality is
sufficient — no deep diffing needed. The Set is reset when `setConfig` is called (e.g. on config
edit) and rebuilt lazily on the next `set hass`.

---

## Data Flow

```
HA state change
      │
      ▼
set hass(hass)
      │  _hasRelevantChange? (tracked entity reference changed)
      ▼
_render()
      │  config.sections.map(s => sectionHtml(s, states, stateKeys, colors))
      ▼
sectionHtml()
      │  1. filter: id.startsWith(prefix) && VALID_STATES.has(state)
      │  2. detect sort mode: rankType (regular season) or by-date (playoffs/off-season)
      │  3. build items: { entityId, teamName, special, key: sortKeyFor(attr, sortMode) }
      │  4. sort: descending by win-ratio or ascending by date; tiebreak by name then id
      │  5. deduplicate: collapse duplicate game sensors into one row (by-date mode)
      │  6. slice to limit
      ▼
rowHtml(stateObj, special, colors, opponentSpecial)
      │  reads state + attributes, calls display.js functions:
      │  teamColor · scoreColor · scoreText · nameText · rankText
      │  logoHtml · tvHtml · messageHtml · colonColor
      ▼
shadowRoot.innerHTML = <style> + <ha-card> + rows
```

---

## Rendering Pipeline

- **Error boundary**: `_render()` is wrapped in try/catch; errors surface as a styled red message in
  the card instead of a silent crash.
- **Shadow DOM**: all HTML is written to `this.shadowRoot.innerHTML` each render — no diffing, full
  replacement. Fast enough for the small DOM sizes involved (~30 rows max).
- **CSS injection**: `CARD_STYLES` (from `styles.js`) is inlined as a `<style>` block each render.
  Optional `colors.header` appends an override rule.
- **Security**: every user-supplied string goes through `esc()` before insertion into HTML. Logo
  URLs are validated to be HTTPS via `safeLogoUrl()`.

---

## Sorting & Deduplication

### `winRatio(record, sortMode)`

Converts a team record string (`"W-L"`, `"W-D-L"`, `"W-L-OTL"`) to a normalised ratio in `[0, 1]`:

| Mode            | Formula                  |
| --------------- | ------------------------ |
| `win-loss`      | W / (W+L)                |
| `win-draw-loss` | (3W + D) / (3 × games)   |
| `win-loss-otl`  | (2W + OTL) / (2 × games) |

### `sortKeyFor(attr, sortMode)`

Returns `Date.parse(attr.date)` for `by-date`, or `winRatio(attr.team_record, sortMode)` otherwise.

### Season auto-detection

If the first entity's `season` attribute is not `"regular"`, the sort mode switches to `by-date`
automatically, regardless of `rankType`.

### `deduplicate(list, sortMode, states)`

Active in `by-date` mode only (playoffs, off-season). The ha-teamtracker integration creates one
sensor per tracked team — a single game can have two sensors (home and away) if both teams are
tracked. Deduplication collapses these into one row using a two-pass algorithm:

1. **Pass 1**: build sets of game keys that have a home sensor (`homeKeys`) and/or a special-team
   sensor (`specialKeys`, `specialAwayKeys`).
2. **Pass 2**: filter the date-sorted list, keeping one sensor per `date_teamA_teamB` key.
   Preference order: home sensor > away sensor. If a special team plays away and a home sensor
   exists, the home sensor is kept but annotated `opponentSpecial: true` so the away team still
   renders highlighted.

The two-pass design preserves the original date order — re-sorting by home/away would push away-only
games beyond the `limit` slice even when a valid sensor exists.

---

## Planned Improvements

### WebSocket entity subscription

Replace `_hasRelevantChange` / `set hass` diffing with
`hass.connection.subscribeEntities(entityIds, callback)`. Subscribe once in `connectedCallback`
(after `_trackedIds` is built), unsubscribe in `disconnectedCallback`. The callback receives only
the changed entities and calls `_render()` directly — no full-state scan, no `_trackedIds` Set
needed. The numeric `refresh` timer can stay alongside for the polling mode.
