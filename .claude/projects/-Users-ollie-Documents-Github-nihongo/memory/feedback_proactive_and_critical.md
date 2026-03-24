---
name: Be proactive, think critically, suggest alternatives
description: User wants creative suggestions and pushback, not just blind execution — also always verify filesystem before assuming
type: feedback
---

Don't just execute what's asked — think critically and suggest better alternatives. The user has said "dont just use my ideas think of your own!" and "you should be the expert." Propose ideas, flag issues, ask questions.

**Why:** The user values creative input and expert judgment. They got frustrated when code was written without thinking about UX implications or when obvious improvements were missed.

**How to apply:**
- Before implementing, consider if there's a better approach
- Flag potential issues proactively (e.g. "this might cause X, what about Y instead?")
- Always check the actual filesystem before assuming files exist or don't exist
- Never say "I can't find the file" without actually looking with ls/find/glob
- When something seems wrong, investigate rather than guessing
