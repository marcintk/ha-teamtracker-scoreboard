@node_modules/ha-shared/CLAUDE-SHARED.md @package.json @TODO.md

# ha-teamtracker-scoreboard-card

## Module Map

Every `src/*.ts` module has a corresponding `test/*.test.ts`. New source files must ship with their
test file.

| Source file           | Test file                   | Responsibility                                                                       |
| --------------------- | --------------------------- | ------------------------------------------------------------------------------------ |
| `src/index.ts`        | `test/index.test.ts`        | Custom element class, HA lifecycle hooks, entity cache, render orchestration         |
| `src/debug.ts`        | `test/debug.test.ts`        | `DebugMetrics` — timestamp tracking, windowed counts, overlay HTML                   |
| `src/subscription.ts` | `test/subscription.test.ts` | `SubscriptionManager` — WebSocket subscribe/unsubscribe with stale-gen guard         |
| `src/render.ts`       | `test/render.test.ts`       | `rowHtml()` — one game row; `sectionHtml()` — filter, sort, dedup, combine rows      |
| `src/display.ts`      | `test/display.test.ts`      | Pure value helpers: colors, text snippets (no HTML output)                           |
| `src/widgets.ts`      | `test/widgets.test.ts`      | HTML generators: `logoHtml()`, `tvHtml()`, `messageHtml()`                           |
| `src/sorting.ts`      | `test/sorting.test.ts`      | `winRatio()`, `sortKeyFor()`, `resolveSortMode()`, `deduplicate()` — ranking & dedup |
| `src/styles.ts`       | `test/styles.test.ts`       | CSS string exported as `CARD_STYLES`, injected into Shadow DOM on each render        |
| `src/utils.ts`        | `test/utils.test.ts`        | `safeLogoUrl()`, `VALID_STATES` — URL guard, valid state set                         |

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

## TODO.md discipline

`TODO.md` is the canonical list of known bugs and open issues.

- **When a new bug is found** — add to `TODO.md` with a one-line summary, the affected file:line,
  and a brief fix description.
- **When a bug is fixed and merged** — remove its entry in the same PR that fixes it.
- **Do not leave stale entries.** If a fix makes an entry obsolete, remove it and note why in the PR
  description.
