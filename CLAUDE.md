@node_modules/ha-card-shared/CLAUDE-SHARED.md

# ha-teamtracker-scoreboard-card

## Design Invariants

Durable behavioral/UX constraints. Preserve unless the user explicitly changes them.

- Sort switches to `by-date` automatically during non-regular season (playoffs, off-season);
  undefined season counts as regular. A section's `view` (`auto` | `ranking` | `schedule`) overrides
  this heuristic in either direction; `auto` is the default and preserves the behaviour above.
  (`ranking` forces the standings table, `schedule` forces the date-sorted list; the internal
  `SortMode` value for the latter is still `by-date`.)
- `schedule` / `by-date` shows one entry per game: home sensor wins over away sensor when both exist
- Team logos render only for HTTPS URLs; non-HTTPS is silently dropped
- Every row opens with a fixed-width position cell (`.team-pos`). In a ranking sort it holds the
  row's 1-based rank in the full sorted list (pre-`limit`), coloured like the tracked team; under
  `by-date` or `show_position: false` (section option, default `true`) the cell is drawn but empty,
  so mixed standings/fixture cards stay row-aligned without a card-wide pre-pass. A **card-level**
  `show_position: false` removes the cell entirely (`--scoreboard-position-display: none`),
  restoring the pre-position-column layout
- With `slide_sec` set and **≥ 2 sections**, the card shows one section at a time and auto-advances
  every `slide_sec` seconds (hard swap, wraps, empty sections take their turn). Three header
  buttons: `‹`/`›` step and pause; the stop/resume toggle (orange while paused) is the only way back
  to auto-advance; `prefers-reduced-motion` starts it paused. With `height` unset the card locks to
  the tallest slide. Unset `slide_sec` / `0` / a single section ⇒ today's stacked render, unchanged

## Architecture Notes

- **WebSocket subscription**: subscribed to `state_changed` on first `set hass`; callback arms
  `_renderTimer` debounce. Rendering always reads `_hass.states` — never the event payload.
- **Entity filter**: `_trackedIds` (Set) built from section prefixes once per config; reset on
  `setConfig`, rebuilt lazily on next `set hass`.
- **Deduplication** (`by-date` only): two-pass — pass 1 builds home/special key sets, pass 2 keeps
  home sensor over away sensor per game key.
- **View state** (`slide_sec` only): `_slideIndex` / `_slidePaused` are instance fields, not derived
  from `hass`; reset in `setConfig` beside the score caches. The rotation timer is one idempotent
  `_syncSlideTimer()` (arms/stops to match state), called from `_render`, `setConfig` and the
  `@click` handlers; `disconnectedCallback` calls `_stopSlideTimer()` only. This is the card's one
  interactive-control pattern — follow it for any future click affordance.
