# Lessons log

Root cause + guardrail per shipped change, newest first. Consulted before new work — grep the
symptom before reproducing. Per-issue detail lives in `docs/design-notes/`; this is the by-symptom
index.

<!-- ponytail: single file; split by area if it outgrows one screen-scroll -->

## Interactive control / view-state / rotation timer in the card — the reference pattern

- **Context:** `slide_sec` (#140) added the card's first `@click` control, first view-state not
  derived from `hass` (`_slideIndex`, `_slidePaused`), and a rotation timer. Bare `HTMLElement` +
  standalone lit `render()` — no `LitElement`, no reactive props, so a field change does nothing
  until something calls `_render()`.
- **Pattern to copy:** view-state fields are constructor-inited and reset in `setConfig` next to the
  `_scoreChangedAt` / `_prevScores` clears (new config = fresh view). The timer is a single
  idempotent `_syncSlideTimer()` — it arms iff `(should run) && !this._slideTimer` and stops iff
  `!(should run) && this._slideTimer` — called unconditionally from `_render()`, from `setConfig`
  (after an explicit `_stopSlideTimer()` so a changed interval re-arms), and from each handler.
  Handlers do `mutate field → _syncSlideTimer() → _render()`. `disconnectedCallback` calls
  `_stopSlideTimer()` only, **never** `_syncSlideTimer()`, or a post-teardown render would resurrect
  it. Do not arm a timer from `_render()` with an ad-hoc `if (!this._timer)` guard — that was the
  slice-1 shape and it made detach→reattach behave inconsistently vs `_fixedTimer` (armed only in
  `setConfig`); the idempotent sync is the fix.
- **Test guardrail:** `test/index.test.ts` › "slide_sec carousel" / "slide_sec controls" pin
  advance/wrap, pause/resume, `_slideIndex`/`_slidePaused` reset on `setConfig`, and timer-inert
  after `disconnectedCallback` (mirrors the `_fixedTimer` teardown test). Fake timers per
  `describe`; `makeCard()` is never attached, so lifecycle callbacks are invoked by hand.
- **Also — a container that grows children in a later slice breaks an earlier slice's `.textContent`
  assertion.** Slice 1's `headerTexts` helper did
  `querySelectorAll(".section-header").map(el => el.textContent)` with `toEqual(["NHL"])`; slice 2
  nested `<button>`s inside `.section-header`, so the text became `"NHL‹⏸›"`. Fix: scope such
  helpers to a stable inner element (`.section-title`) — and prefer that from the start when a
  region is likely to gain controls.
- **Ref:** [#140](https://github.com/marcintk/ha-teamtracker-scoreboard-card/issues/140) ·
  2026-09-06

## Test for a CSS-custom-property-backed option fails/passes misleadingly on `shadowRoot.innerHTML`

- **Root cause:** `CARD_STYLES` is inlined into the shadow DOM as a `<style>` block, so any
  `var(--x, fallback)` in `src/styles.ts` is _always_ present in `card.shadowRoot.innerHTML`.
  Asserting an option is "not emitted" against `innerHTML` gives a false negative once the
  stylesheet references the property; asserting it "is emitted" there doesn't prove it reached the
  element.
- **Guardrail:** for options wired through a `--scoreboard-*` custom property on `<ha-card>`
  (`team_col_width`, `logo_width` / `score_width` / `colon_width` / `row_height`, and the
  `team_width` A/B split), assert on
  `card.shadowRoot.querySelector("ha-card").getAttribute("style")`, not `innerHTML`; pair it with a
  `CARD_STYLES`-contains assertion for the stylesheet side. `test/index.test.ts` › "team_col_width"
  / "layout dimension options" and `test/snapshot.test.ts` › CARD_STYLES wiring show the split.
- **Also:** the `cssVars` table in `_render` is serialised through `.filter(([, v]) => v)`, so a
  value routed through it whose "off"/"default" state is falsy needs an _explicit_ comparison, not a
  truthy check. A boolean "off" flag (`show_position` → `--scoreboard-position-display: none`)
  compares `option === false`, never `!option` (`!option` also fires on `0` / `""`). A numeric
  option with a non-zero baseline (`font_scale`, default `1`) emits on
  `font_scale != null && font_scale !== 1` — so `0` still reaches CSS as `--scoreboard-font-scale:0`
  (a valid `calc()` operand; intentional GIGO, no validation) and the `1` no-op is not emitted.
- **Also:** wrapping a `styles.ts` literal in `calc(Npx * var(--x, 1))` changes `CARD_STYLES`, so
  the `toMatchSnapshot()` test in `test/snapshot.test.ts` must be refreshed (`vitest -u`). The
  `code-writer` role can't write `test/`, so the driver (or `test-writer`) regenerates it; a
  `// @ts-expect-error` the failing test left on a not-yet-typed config field also has to be removed
  once the field lands, or `tsc` fails on the unused directive.
- **Ref:** [#132](https://github.com/marcintk/ha-teamtracker-scoreboard-card/issues/132),
  [#133](https://github.com/marcintk/ha-teamtracker-scoreboard-card/issues/133),
  [#134](https://github.com/marcintk/ha-teamtracker-scoreboard-card/issues/134),
  [#136](https://github.com/marcintk/ha-teamtracker-scoreboard-card/issues/136) · 2026-09-06

## Card shows the fixture table during the regular season / wrong standings-vs-fixtures sort

- **Root cause:** `resolveSortMode` treated _any_ truthy `season` attribute other than the literal
  `"regular"` as non-regular, so leagues that emit a descriptive `season` label (TeamTracker Serie
  A: `2026-27-italian-serie-a`) tripped a false positive and there was no config escape hatch either
  way.
- **Guardrail:** section option `season_mode` (`auto` | `regular` | `by-date`, default `auto`)
  short-circuits the heuristic in `src/sorting.ts`; `test/sorting.test.ts` › "seasonMode override
  (4th parameter)" pins both forced directions and the unrecognised-value fall-through.
- **Ref:** [#130](https://github.com/marcintk/ha-teamtracker-scoreboard-card/issues/130) ·
  2026-09-06
