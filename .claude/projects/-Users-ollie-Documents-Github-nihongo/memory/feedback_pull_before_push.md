---
name: Always pull before pushing — concurrent AI chats
description: Another AI chat works on game module simultaneously, must pull before every commit/push to avoid overwrites
type: feedback
---

Always `git stash && git pull --rebase origin main && git stash pop` before committing and pushing.

**Why:** Another AI chat works on the game module (`src/game/`, `SPRITES.md`, `GAME.md`, sprite images) simultaneously. Both push to main. Pushing without pulling can overwrite the other chat's work.

**How to apply:** Before every commit: stash → pull → pop → commit → push. Never skip this step. Our files (components, data, utils, api) don't overlap with the game chat's files, but the pull ensures we're building on the latest commit.
