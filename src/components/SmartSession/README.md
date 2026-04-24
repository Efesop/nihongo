# SmartSession module

The adaptive learning engine. Lives in this subfolder **only for new code**.

## Current state

`../SmartSession.jsx` is the legacy monolith (~3,700 lines, 38 exercise types
rendered via an if-chain). It is flagged as tech debt in the root `CLAUDE.md`.
Do not extend it.

## Architecture direction

```
SmartSession/
  index.jsx          # (future) thin shell — queue consumption, XP/SRS, coach, end screen
  registry.js        # type → exercise component mapping
  exercises/         # one file per exercise type (PhraseListen.jsx, KanaVisual.jsx, ...)
  hooks/             # useCardTimer, useHintReveal, useSkillScoring
  shared/            # small primitives specific to SmartSession (RoleAvatar, RecallCard, ColoredJP)
```

## Contract for new exercises

```js
export function meta() {
  return {
    type: "phrase-listen",
    skills: ["listen"],  // used by session engine to pick weakest-skill exercises
  };
}

export default function PhraseListenExercise({
  card,           // the queue entry { type, id, ... }
  c, btn,         // theme + base button style
  cardStyle,      // shared card style from parent
  isDesktop,      // responsive branch
  session,        // read-only session state (score, ci, cards.length)
  onAdvance,      // (result: { correct, timeMs, skipped }) => void
  onSkill,        // (dims: { visual?, listen?, production? }) => void
}) {
  // Renders the exercise body. ActionBar comes from ../SessionParts.jsx.
  // Must call onAdvance() exactly once per card.
}
```

## Migration rules

- New exercise types MUST go in `exercises/` and register in `registry.js`.
- Do NOT add new `if (card.type === "foo")` branches to SmartSession.jsx.
- When you touch an existing exercise type for non-trivial work, consider
  extracting it into `exercises/` as part of that PR.
- `shared/` is for helpers that are specific to session exercises (e.g. the
  small typography wrappers `RecallCard`, `ColoredJP`, `RoleAvatar`). General
  primitives belong in `../SessionParts.jsx`.

## Completed extractions

- `shared/RoleAvatar.jsx` — circular emoji avatar for role-play / branching lines
- `shared/RecallCard.jsx` — tap-to-reveal English→Japanese card
- `shared/ColoredJP.jsx` — inline Japanese with per-segment grammar tints
