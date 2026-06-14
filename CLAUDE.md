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

Source is in `src/`, built output is `dist/card.js`. The dist file is **not committed** — it is
built by CI on every release and attached as a GitHub Release asset that HACS downloads.

## Module Map

Every `src/*.js` module has a corresponding `test/*.test.js`. New source files must ship with their
test file.

| Source file           | Test file                    | Responsibility                                                                  |
| --------------------- | ---------------------------- | ------------------------------------------------------------------------------- |
| `src/index.js`        | `test/index.test.js`         | Custom element class, HA lifecycle hooks, entity cache, render orchestration    |
| `src/debug.js`        | `test/debug.test.js`         | `DebugMetrics` — timestamp tracking, windowed counts, overlay HTML              |
| `src/subscription.js` | `test/subscription.test.js`  | `SubscriptionManager` — WebSocket subscribe/unsubscribe with stale-gen guard    |
| `src/render.js`       | `test/render.test.js`        | `rowHtml()` — one game row; `sectionHtml()` — filter, sort, dedup, combine rows |
| `src/display.js`      | `test/display.test.js`       | Stateless display helpers: colors, text snippets, TV badge, message column      |
| `src/sorting.js`      | `test/sorting.test.js`       | `winRatio()`, `sortKeyFor()`, `deduplicate()` — ranking and dedup logic         |
| `src/styles.js`       | `test/styles.test.js`        | CSS string exported as `CARD_STYLES`, injected into Shadow DOM on each render   |
| `src/utils.js`        | _(covered via render/index)_ | `esc()` — HTML escaping; `safeLogoUrl()` — HTTPS-only URL guard                 |
| `src/constants.js`    | _(covered via render/index)_ | `VALID_STATES` set: `PRE`, `IN`, `POST`, `BYE`                                  |

## Architecture Notes

- **Shadow DOM / full replacement**: `shadowRoot.innerHTML` is fully replaced on every render — no
  diffing. Fast enough for ~30 rows max.
- **WebSocket subscription**: card subscribes to `state_changed` events on first `set hass`;
  callback calls `_scheduleRender()`, which arms a debounce timer (`_renderTimer`). Rendering always
  uses `_hass.states`, not the event payload.
- **Entity filter**: `_trackedIds` (Set) is built once per config from section prefixes; reset on
  `setConfig`, rebuilt lazily on next `set hass`.
- **Security**: all user-supplied strings go through `esc()` before HTML insertion; logo URLs
  validated HTTPS via `safeLogoUrl()`.
- **Deduplication** (`by-date` mode only): two-pass algorithm — pass 1 builds home/special key sets,
  pass 2 filters keeping home sensor > away sensor per game key.

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

### PR discipline

- **One concern per PR.** A refactor PR must not bundle feature changes; a feature PR must not
  include unrelated refactors. If a session drifts across multiple concerns, split into separate
  branches before opening PRs.
- **Never push or merge without explicit permission.** Do not run `git push`, `gh pr create`, or
  merge a PR unless the user explicitly asks to open or merge it for that session.
- **Verify docs before every PR.** Before opening a PR, check that `README.md` and `CLAUDE.md`
  reflect any behavior changes made in that session — updated option defaults, new config keys,
  changed architecture, new modules. Never open a PR with stale docs.
- **Release cadence.** After three to five merged PRs, recommend cutting a release. Never trigger
  the release workflow autonomously — propose the next version number and wait for explicit user
  approval before pushing the tag.

**Why:** Clean, reviewable history and no unilateral publishing actions. Splitting concerns keeps
PRs easy to revert independently. Docs that lag behind the code require readers to diff both to
understand what the card actually does.

**How to apply:** If a session touches multiple concerns, flag it and offer to split before opening
PRs. Never run `git push` or `gh pr create` until explicitly asked for that session. Immediately
before running `gh pr create`, scan README.md options tables and CLAUDE.md architecture notes for
anything that no longer matches the implementation. Track merged PR count; after 3–5, proactively
suggest a release. To release, propose a version tag (`git tag vX.Y.Z && git push origin vX.Y.Z`)
and wait for the user to confirm before running it.

## TDD Workflow

For every fix or feature: **write the failing test first**, confirm it fails (`npm test`), then
implement the fix/feature until it passes.

**Why:** A test written after the fact tends to mirror the implementation rather than specify
behaviour — red-first keeps tests honest.

**How to apply:** Before touching `src/`, add the test to the matching `test/*.test.js`. Run
`npm test` and confirm the new assertion fails. Only then write the implementation.

## Releasing

Push a semver tag — the release workflow fires automatically:

```bash
git tag v1.0.32
git push origin v1.0.32
```

The workflow runs `npm test`, builds `dist/card.js` with the version injected from the tag, and
publishes a GitHub Release with `dist/card.js` as an asset that HACS downloads.

`package.json` version is a permanent `0.0.0-dev` placeholder and is never changed. The tag is the
single source of truth for the version. Dev builds (`npm run build`) stamp the bundle with
`0.0.0-dev`; release builds stamp it with the real version via the `VERSION` env var.
