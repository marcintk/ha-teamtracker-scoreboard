@node_modules/ha-card-shared/CLAUDE-SHARED.md

# ha-teamtracker-scoreboard-card

## Design Invariants

Durable behavioral/UX constraints. Preserve unless the user explicitly changes them.

- `view: auto` (default) shows the standings table only when **every** tracked entity has a numeric
  win-loss `team_record` (`12-4`, `0-1-2`); otherwise it sorts `by-date`. A section's `view` (`auto`
  | `ranking` | `schedule`) overrides in either direction — `ranking` forces the standings table,
  `schedule` forces the date-sorted list. The internal `SortMode` value for the list is still
  `by-date`. The sensor `season` attribute is no longer consulted.
- `schedule` / `by-date` shows one entry per game: home sensor wins over away sensor when both exist
- Team logos render only for HTTPS URLs; non-HTTPS is silently dropped
- Every row opens with a fixed-width position cell (`.team-pos`). In a ranking sort it holds the
  row's 1-based rank in the full sorted list (pre-`limit`), coloured like the tracked team; under
  `by-date` or `show_position: false` (section option, default `true`) the cell is drawn but empty,
  so mixed standings/fixture cards stay row-aligned without a card-wide pre-pass. There is no
  card-level position toggle — the cell is always drawn
- With `mode: slide` and **≥ 2 sections**, the card shows one section at a time and auto-advances
  every `slide_sec` seconds (default 45; `≤ 0` ⇒ 45; hard swap, wraps, empty sections take their
  turn). Three header buttons: `‹`/`›` step and pause; the stop/resume toggle (orange while paused)
  is the only way back to auto-advance; `prefers-reduced-motion` starts it paused. With `height`
  unset the card locks to the tallest slide. `mode: stack` (default) / a single section ⇒ the
  stacked render

## Architecture Notes

- **WebSocket subscription**: subscribed to `state_changed` on first `set hass`; callback arms
  `_renderTimer` debounce. Rendering always reads `_hass.states` — never the event payload.
- **Entity filter**: `_trackedIds` (Set) built from section prefixes once per config; reset on
  `setConfig`, rebuilt lazily on next `set hass`.
- **Deduplication** (`by-date` only): two-pass — pass 1 builds home/special key sets, pass 2 keeps
  home sensor over away sensor per game key.
- **View state** (`mode: slide` only): `_slideIndex` / `_slidePaused` are instance fields, not
  derived from `hass`; reset in `setConfig` beside the score caches. The rotation timer is one
  idempotent `_syncSlideTimer()` (arms/stops to match state), called from `_render`, `setConfig` and
  the `@click` handlers; `disconnectedCallback` calls `_stopSlideTimer()` only. This is the card's
  one interactive-control pattern — follow it for any future click affordance.
