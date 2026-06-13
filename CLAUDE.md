# Development

```bash
npm install
npm run build          # bundle src/ → dist/card.js
npm run build:prod     # minified production build
npm run dev            # watch mode
npm test               # run tests
npm run test:coverage  # run tests with coverage report
npm run check          # biome lint + format (src/ and test/)
npm run format:md      # prettier for markdown files
```

Source is in `src/`, built output is `dist/card.js`. The dist file is committed so HACS can serve it
directly without a CI build step.

## Module Map

| File               | Responsibility                                                                  |
| ------------------ | ------------------------------------------------------------------------------- |
| `src/index.js`     | Custom element class, HA lifecycle hooks, entity cache, render orchestration    |
| `src/render.js`    | `rowHtml()` — one game row; `sectionHtml()` — filter, sort, dedup, combine rows |
| `src/display.js`   | Stateless display helpers: colors, text snippets, TV badge, message column      |
| `src/sorting.js`   | `winRatio()`, `sortKeyFor()`, `deduplicate()` — ranking and dedup logic         |
| `src/styles.js`    | CSS string exported as `CARD_STYLES`, injected into Shadow DOM on each render   |
| `src/utils.js`     | `esc()` — HTML escaping; `safeLogoUrl()` — HTTPS-only URL guard                 |
| `src/constants.js` | `VALID_STATES` set: `PRE`, `IN`, `POST`, `BYE`                                  |

## Architecture Notes

- **Shadow DOM / full replacement**: `shadowRoot.innerHTML` is fully replaced on every render — no diffing. Fast enough for ~30 rows max.
- **WebSocket subscription**: card subscribes to `state_changed` events on first `set hass`; callback sets `_needsRender` flag (O(1) check). Rendering always uses `_hass.states`, not the event payload.
- **Entity filter**: `_trackedIds` (Set) is built once per config from section prefixes; reset on `setConfig`, rebuilt lazily on next `set hass`.
- **Security**: all user-supplied strings go through `esc()` before HTML insertion; logo URLs validated HTTPS via `safeLogoUrl()`.
- **Deduplication** (`by-date` mode only): two-pass algorithm — pass 1 builds home/special key sets, pass 2 filters keeping home sensor > away sensor per game key.

## Contributing

> **Never commit directly to `main`.** Every change — features, bug fixes, docs, config — must go
> through a pull request. Create a branch first, then open a PR against `main`.

```bash
git checkout -b feat/my-feature   # or fix/, docs/, chore/ as appropriate
# ... make changes ...
git push -u origin feat/my-feature
gh pr create
```

CI runs build, lint, and tests automatically on every PR.

Every new feature or bug fix must include associated tests. Coverage thresholds are enforced at 100%
for statements, branches, functions, and lines — `npm run test:coverage` will fail (and block CI) if
coverage drops below that.

## TDD Workflow

For every fix or feature: **write the failing test first**, confirm it fails (`npm test`), then implement the fix/feature until it passes.

## Releasing

Go to **Actions → Publish Release → Run workflow**, enter the version number (e.g. `1.0.1`). The
workflow builds `dist/card.js`, tags the release, and publishes a GitHub Release that HACS picks up.
