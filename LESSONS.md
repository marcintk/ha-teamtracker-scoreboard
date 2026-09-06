# Lessons log

Root cause + guardrail per shipped change, newest first. Consulted before new work — grep the
symptom before reproducing. Per-issue detail lives in `docs/design-notes/`; this is the by-symptom
index.

<!-- ponytail: single file; split by area if it outgrows one screen-scroll -->

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
- **Ref:** [#132](https://github.com/marcintk/ha-teamtracker-scoreboard-card/issues/132),
  [#133](https://github.com/marcintk/ha-teamtracker-scoreboard-card/issues/133) · 2026-09-06

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
