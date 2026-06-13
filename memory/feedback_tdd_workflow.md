---
name: feedback_tdd_workflow
description:
  Write the failing test first for every fix or feature — confirmed red before implementing
metadata:
  type: feedback
---

For every fix or feature: write the failing test first, confirm it fails (`npm test`), then
implement until it passes. Coverage is enforced at 100% — `npm run test:coverage` blocks CI if it
drops.

**Why:** Keeps tests honest; a test written after the fact tends to mirror the implementation rather
than specify behaviour.

**How to apply:** Before touching `src/`, add the test to the matching `test/*.test.js`. Run
`npm test` and confirm the new test fails. Only then write the implementation.

_Canonical source: CLAUDE.md § TDD Workflow_
