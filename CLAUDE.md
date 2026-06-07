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

Every new feature or bug fix must include associated tests. Coverage thresholds are enforced at 99%
for statements, branches, functions, and lines — `npm run test:coverage` will fail (and block CI) if
coverage drops below that.

## Releasing

Go to **Actions → Publish Release → Run workflow**, enter the version number (e.g. `1.0.1`). The
workflow builds `dist/card.js`, tags the release, and publishes a GitHub Release that HACS picks up.
