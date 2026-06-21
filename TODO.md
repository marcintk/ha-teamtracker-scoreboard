# TODO — Open Issues

Found by automated code review (2026-06-21). Ranked by severity.

## Bugs

### 1. CSS injection via `colors.header` — `src/index.ts:188`

`colors.header` is string-concatenated unescaped into a `<style>` block rendered via `unsafeHTML`. A
value like `red} * {display:none}` disrupts the card's Shadow DOM styles. **Fix:** validate against
`/^[a-zA-Z0-9#(),. %]+$/` or switch to `styleMap` on `.section-header`.

### 2. Subscription not re-established after DOM re-insertion — `src/index.ts:141`

`disconnectedCallback` nulls `_unsub` but leaves `_trackedIds` intact. On re-insertion with the same
HA connection, `isFirstCall=false` and `connectionChanged=false`, so the code only calls
`_scheduleRender()` — `_subscribe()` is never retried. The card falls back to fixed-interval polling
only, missing live WebSocket events. **Fix:** add `this._trackedIds = null;` in
`disconnectedCallback`.

### 3. `_buildTrackedIds` misses net-neutral entity swap — `src/index.ts:147`

The early-exit guard compares `stateKeys.length === this._stateKeyCount`. If HA removes one entity
and adds a different one in the same cycle, the count is unchanged and the guard skips the rebuild.
`_trackedIds` retains the dead entity and never learns about the new one. **Fix:** remove the length
guard (the rebuild is O(n) and called only from `_render`) or use a content hash.

### 4. `win-loss` mode drops OTL games from denominator — `src/sorting.ts:24`

A 3-part record like `'42-30-10'` (W-L-OTL) destructures to `w=42, d=30, l=10`. The `win-loss`
branch computes `total = w + d = 72`, ignoring `l=10`, giving `42/72 ≈ 0.583` instead of
`42/82 ≈ 0.512`. Teams with many OTL losses rank artificially higher. **Fix:** use `w + d + l` as
the denominator in the `win-loss` branch.

### 5. Stray `>` renders as visible text — `src/widgets.ts:53`

Template has `` `${raw.substring(0, 50)}></span>` `` — the `>` before `</span>` is a literal
character. Whenever `last_play` exceeds 50 chars (common for play-by-play), a spurious `>` appears
in the row. **Fix:** change to `` `${raw.substring(0, 50)}</span>` ``.

### 6. No `BYE` case in `messageHtml` — `src/widgets.ts:38`

`BYE` is a valid state (present in `VALID_STATES`) so BYE rows reach `messageHtml`. The switch has
no `case 'BYE':` and falls to the `default` (POST) handler, rendering `attr.clock` and
`attr.series_summary` in orange — both typically empty for bye weeks. **Fix:** add a dedicated
`case 'BYE':` branch returning a "Bye" label or `nothing`.
