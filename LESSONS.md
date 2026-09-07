# Lessons log

Root cause + guardrail per shipped change, newest first. Consulted before new work — grep the
symptom before reproducing. Per-issue detail lives in `docs/design-notes/`; this is the by-symptom
index.

<!-- ponytail: single file; split by area if it outgrows one screen-scroll -->

## Interactive control / view-state / rotation timer in the card — the reference pattern

- **Context:** `slide_sec` (#140) added the card's first `@click` control, first view-state not
  derived from `hass` (`_slideIndex`, `_slidePaused`), and a rotation timer. Bare `HTMLElement` +
  standalone lit `render()` — no `LitElement`, no reactive props, so a field change does nothing
  until something calls `_render()`. (#143 later split the trigger: `mode: slide` gates the
  carousel, `slide_sec` is just the interval, default 45 — "should run" is now
  `_isSlideMode() && !_slidePaused`.)
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
- **Also — `window.matchMedia` is not implemented by jsdom and there is no test setup file.** A bare
  `window.matchMedia("…").matches` in `src/` throws under test. Read it optional-chained —
  `window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true` — so an absent
  `matchMedia` degrades to the feature being off; the existing carousel tests never stub it and rely
  on exactly that. Tests that exercise the branch do
  `vi.stubGlobal("matchMedia", q => ({ matches: …, media: q, addEventListener(){}, removeEventListener(){}, … }))`.
- **Also — the per-slice review gate runs `npm test`, which does not enforce the 100% coverage
  threshold; `npm run test:coverage` does.** Slices 1–2 of #140 landed a few branches short
  (`_syncSlideTimer` fall-throughs, `_slideStep`'s `n < 2` guard, `?? 10` / numeric-`row_height` in
  the min-height + `getCardSize` math, `sectionHtml`'s carousel `emptyHtml()` paths) and it was only
  caught at the end. Run `test:coverage` at each slice gate, or expect a coverage-catch-up test
  block before shipping.
- **Ref:** [#140](https://github.com/marcintk/ha-teamtracker-scoreboard-card/issues/140) ·
  2026-09-06

## Test for a CSS-custom-property-backed option fails/passes misleadingly on `shadowRoot.innerHTML`

- **Root cause:** `CARD_STYLES` is inlined into the shadow DOM as a `<style>` block, so any
  `var(--x, fallback)` in `src/styles.ts` is _always_ present in `card.shadowRoot.innerHTML`.
  Asserting an option is "not emitted" against `innerHTML` gives a false negative once the
  stylesheet references the property; asserting it "is emitted" there doesn't prove it reached the
  element.
- **Guardrail:** for options wired through a `--ttsc-*` custom property on `<ha-card>` (the
  `layout:` map — `height` excepted, it's a plain `height` — plus the three `colors` keys with a
  property), assert on `card.shadowRoot.querySelector("ha-card").getAttribute("style")`, not
  `innerHTML`; pair it with a `CARD_STYLES`-contains assertion for the stylesheet side.
  `test/index.test.ts` › "layout: map" and `test/snapshot.test.ts` › CARD_STYLES wiring show the
  split. (The `--scoreboard-*` prefix was renamed to `--ttsc-*` in #143; the card-level
  `show_position` / `--scoreboard-position-display` switch was removed the same batch — a stylesheet
  assertion on `shadowRoot.innerHTML` for `position:relative` broke there for exactly this reason.)
- **Also:** the `cssVars` table in `_render` is serialised through `.filter(([, v]) => v)`, so a
  value routed through it whose "off"/"default" state is falsy needs an _explicit_ comparison, not a
  truthy check. A numeric option with a non-zero baseline (`font_scale`, default `1`) emits on
  `font_scale != null && font_scale !== 1` — so `0` still reaches CSS as `--ttsc-font-scale:0` (a
  valid `calc()` operand; intentional GIGO, no validation) and the `1` no-op is not emitted.
- **Also:** wrapping a `styles.ts` literal in `calc(Npx * var(--x, 1))` changes `CARD_STYLES`, so
  the `toMatchSnapshot()` test in `test/snapshot.test.ts` must be refreshed (`vitest -u`). The
  `code-writer` role can't write `test/`, so the driver (or `test-writer`) regenerates it; a
  `// @ts-expect-error` the failing test left on a not-yet-typed config field also has to be removed
  once the field lands, or `tsc` fails on the unused directive.
- **Ref:** [#132](https://github.com/marcintk/ha-teamtracker-scoreboard-card/issues/132),
  [#133](https://github.com/marcintk/ha-teamtracker-scoreboard-card/issues/133),
  [#134](https://github.com/marcintk/ha-teamtracker-scoreboard-card/issues/134),
  [#136](https://github.com/marcintk/ha-teamtracker-scoreboard-card/issues/136) · 2026-09-06

## Wrong standings-vs-schedule choice for a section

- **Root cause:** `resolveSortMode` treated _any_ truthy `season` attribute other than the literal
  `"regular"` as non-regular, so leagues that emit a descriptive `season` label (TeamTracker Serie
  A: `2026-27-italian-serie-a`) tripped a false positive.
- **Guardrail (current):** the `season` attribute is **no longer consulted**. A section's `view`
  (`auto` | `ranking` | `schedule`, default `schedule` since #143) decides directly; `auto` shows
  the standings table only when every tracked entity has a numeric `team_record`. `src/sorting.ts` ›
  `resolveSortMode`; `test/sorting.test.ts` › "view override (4th parameter)" pins the forced
  directions and the unrecognised-value fall-through. Schedule ordering (live → `|date − now|`) is
  pinned in `test/render.test.ts`.
- **Ref:** [#130](https://github.com/marcintk/ha-teamtracker-scoreboard-card/issues/130) (original),
  #143 (season heuristic removed) · 2026-09-06
