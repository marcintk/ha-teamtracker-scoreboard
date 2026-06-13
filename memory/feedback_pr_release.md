---
name: feedback_pr_release
description:
  One concern per PR; never push/merge/release without explicit user approval in that message
metadata:
  type: feedback
---

- **One concern per PR.** Don't bundle unrelated changes; split branches if a session drifts.
- **Never push or merge without explicit permission.** `git push`, `gh pr create`, and merge must be
  explicitly requested each session — prior approval doesn't carry over.
- **Never trigger the release workflow autonomously.** After merging, propose the next version
  ("ready to cut v1.0.X?") and stop. Only run `gh workflow run "Publish Release"` when the user
  explicitly says to release in that message.

**Why:** Releasing was triggered automatically without being asked — it has external, visible
effects and must always be user-initiated.

**How to apply:** After a merge, suggest the version number. Wait for "release it" or equivalent
before running the workflow.

_Canonical source: CLAUDE.md § PR discipline_
