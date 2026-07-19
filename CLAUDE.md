@node_modules/ha-card-shared/CLAUDE-SHARED.md @package.json

# ha-teamtracker-scoreboard-card

## Design Invariants

- **Render reads state, not events**: `_scheduleRender()` always uses `_hass.states` — never the
  `state_changed` event payload. Changing this breaks consistency guarantees.
- **Logo URLs must be HTTPS**: `safeLogoUrl()` guards every logo path. No raw URL interpolation into
  templates.
- **Lit escapes text; no manual escaping**: all interpolated text in `html` templates is
  auto-escaped. Do not add manual escaping — double-escaping will corrupt output.
- **Sort auto-switches out of regular season**: `resolveSortMode()` must override to `by-date` for
  any non-regular-season entity (playoffs, off-season, undefined). Do not short-circuit this logic.
- **Deduplication is `by-date` only**: the two-pass dedup algorithm (`deduplicate()`) must not run
  in `by-record` mode — it assumes date-keyed game identity.
- **Every `src/*.ts` has a `test/*.test.ts`**: new source files must ship with their test file.
  Coverage must stay at 100%.

## Architecture Notes

- **Shadow DOM / Lit rendering**: Lit's `render()` patches the shadow DOM on every render —
  efficient diffing, no full `innerHTML` replacement.
- **WebSocket subscription**: card subscribes to `state_changed` events on first `set hass`;
  callback calls `_scheduleRender()`, which arms a debounce timer (`_renderTimer`). Rendering always
  uses `_hass.states`, not the event payload.
- **Entity filter**: `_trackedIds` (Set) is built once per config from section prefixes; reset on
  `setConfig`, rebuilt lazily on next `set hass`.
- **Security**: Lit auto-escapes all interpolated text values in `html` templates — no manual
  escaping needed in render paths. Logo URLs validated HTTPS via `safeLogoUrl()`.
- **Sort mode resolution**: `resolveSortMode()` in `sorting.ts` auto-switches to `by-date` when any
  entity reports a non-regular season (playoffs, off-season, …); undefined season is treated as
  regular.
- **Deduplication** (`by-date` mode only): two-pass algorithm — pass 1 builds home/special key sets,
  pass 2 filters keeping home sensor > away sensor per game key.
