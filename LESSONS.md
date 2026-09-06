# Lessons log

Root cause + guardrail per shipped change, newest first. Consulted before new work — grep the
symptom before reproducing. Per-issue detail lives in `docs/design-notes/`; this is the by-symptom
index.

<!-- ponytail: single file; split by area if it outgrows one screen-scroll -->

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
