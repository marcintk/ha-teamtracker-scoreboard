---
name: feedback_release_policy
description:
  Never trigger a release without explicit user instruction — propose it, wait for approval
metadata:
  type: feedback
---

Never run the release workflow autonomously. After merging a PR, propose the release ("ready to cut
vX.Y.Z?") and wait for the user to say yes.

**Why:** User was surprised when releases were triggered without being asked. Releasing has
external, visible effects and must be user-initiated each time.

**How to apply:** After every merge, suggest the next version number but stop there. Do not call
`gh workflow run "Publish Release"` unless the user explicitly says "release it", "cut the release",
or equivalent in that message.
