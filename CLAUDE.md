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

All changes go through a pull request — push a branch and open a PR against `main`. CI runs build,
lint, and tests automatically on every PR.

## Releasing

Go to **Actions → Publish Release → Run workflow**, enter the version number (e.g. `1.0.1`). The
workflow builds `dist/card.js`, tags the release, and publishes a GitHub Release that HACS picks up.
