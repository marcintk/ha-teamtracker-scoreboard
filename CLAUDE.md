@node_modules/ha-card-shared/CLAUDE-SHARED.md @package.json

# ha-teamtracker-scoreboard-card

## Design Invariants

Durable behavioral/UX constraints. Preserve unless the user explicitly changes them.

- Sort switches to `by-date` automatically during non-regular season (playoffs, off-season);
  undefined season counts as regular
- `by-date` mode shows one entry per game: home sensor wins over away sensor when both exist
- Team logos render only for HTTPS URLs; non-HTTPS is silently dropped

## Architecture Notes

- **WebSocket subscription**: subscribed to `state_changed` on first `set hass`; callback arms
  `_renderTimer` debounce. Rendering always reads `_hass.states` — never the event payload.
- **Entity filter**: `_trackedIds` (Set) built from section prefixes once per config; reset on
  `setConfig`, rebuilt lazily on next `set hass`.
- **Deduplication** (`by-date` only): two-pass — pass 1 builds home/special key sets, pass 2 keeps
  home sensor over away sensor per game key.
