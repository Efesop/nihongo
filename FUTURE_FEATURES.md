# Future Features (Backlog)

Research-backed improvements not yet built. Ranked by impact.

## Recently shipped (April 2026 — moved out of backlog)

- ✅ **Vocab tab — calm review** — Browse / Test / Build modes with no SRS pressure. See ARCHITECTURE.md "Vocab tab".
- ✅ **Web tab — visual concept graph** — full-bleed force-directed graph with typed labelled edges (shared / template / opposite / Q ↔ A). See ARCHITECTURE.md "Web tab".
- ✅ **Box-driven scaffolding fade** — `scaffoldForBox(box)` controls EN / romaji / hint visibility per item per box. Single source of truth for help-fade rules.
- ✅ **MCQ guess-guard** — fast-correct on multi-choice exercises caps at Good (3), not Easy (4). Prevents lucky-pick stability inflation.
- ✅ **Tightened mastery cap** — production ≥ 3 required for box 5 (was ≥ 2). One-time `normalizeBoxesBySkills` migration re-caps existing items.
- ✅ **End-of-session smart resolver** — replaces Continue/Done fork with one CTA based on `resolveNextAction`. Opt-in `autoContinue` chains sessions.
- ✅ **Conversation `alsoOkIds`** — multiple valid answers per blank; cash/card/no-bag/no-receipt all OK after "200 yen".
- ✅ **Conversation NPC text 100% kana** — kanji removed unless no kana alternative exists.
- ✅ **Travel survival nudge** — Home offers one-tap focus+tourist mode when `why=travel && trip<30d`.

---

## High Impact

### 1. Progressive Romaji Hiding
After 5+ correct for item, stop showing romaji on choices. Romaji creates fossilized pronunciation errors after 1-2 weeks (LEARNING_SCIENCE.md #18). The new `scaffoldForBox` table already does this conceptually — wire `RomajiReveal` and ChoiceGloss to honour it on every exercise.

### 2. Hint System for Long Struggles
After 10-15s on question, show "hint" button revealing partial info (first word, grammar pattern, category). Data: users spend 44-94s before wrong — frustration, not learning. `HintChip` primitive exists; routing not universal yet.

### 3. Struggling-Item Focus Mode
When 5+ phrases at box 1, suppress new content, focus review + word-level drilling of weak items. Current sessions still introduce new items while struggling pile exists.

### 4. Special Exercise Rotation Tracking
Track which grammar patterns, confused pairs, word quizzes shown. Lightweight SRS for even coverage vs random repetition.

### 5. Interactive Grammar Patterns
After pattern explanation, comprehension quiz — e.g. "In これをください, what does を do?" 3 choices. Currently passive read-and-dismiss.

### 6. Voice Input / Shadowing
Speak phrase, compare to native (Web Speech API). Research: 25-40% improvement, 8 weeks. ShadowExercise primitive exists for mic capture but full shadowing flow not wired everywhere it could be.

---

## Medium Impact

### 7. Phrase Reconstruction
Phrase segments in wrong order, arrange correctly. Different from phrase-build (fill blank) — tests sentence structure understanding. Closely related to Vocab Build but graded.

### 8. Audio-Only Production
Hear English, speak/type Japanese from memory, no visual choices. Hardest + most effective.

### 9. Weak Word Targeting
When phrase wrong, identify which WORD caused confusion, drill that word next session. Skill data already tracks per-item dimensions; need to surface "which segment was the failure" (probably via a one-tap MetacognitionTap variant).

### 10. Session Focus Themes
"This session focuses on shopping" — category fluency vs always mixing. Could flow from Web tab category-spotlight feature.

### 11. Adaptive Session Length
Many due → 12 cards. Few due → 8 cards. Currently fixed at 10.

### 12. Web tab — additional connection types
Current edges: shared / template / opposite / Q ↔ A. Could add:
- **Same-scenario** — phrases used together in real life (ordering: f1+f2+f3+f4)
- **Same building-block-cluster** — particles share a cluster, verbs share another
- **Difficulty cohort** — phrases at the same box level (helps see "what's stable")

### 13. Web tab — drill from a node
"You're focused on this phrase — practice it now" button on the detail panel that pre-loads a SmartSession session with this id and its connected items.

### 14. Vocab Build — AI translation check
On `Save`, optionally pass the assembled JP to Claude for a "is this grammatically valid?" check + suggest corrections. Currently the user is on their own.

---

## Nice to Have

### 15. Streak Freeze
Miss one day without losing streak. Reduces anxiety.

### 16. Bedtime Review Mode
3-min audio-only review before sleep. Research: sleep consolidation timing-dependent.

### 17. Character Tracing
Canvas-based kana tracing, motor memory. Handwriting > typing for retention.

### 18. Pitch Accent Indicators
Show high/low pitch on phrases. Pitch exercises exist (`PitchIntro` / `PitchPair`) but not visible in surfaces like Vocab Browse / Web detail panel.

### 19. Error Count Decay
Errors >30 days = half. >90 days = zero.

### 20. Separate Leech Thresholds with Decay
5 for kana, 7-8 for phrases. Time-based decay so early struggles don't haunt forever.

### 21. Vocab Build — share / export sentence
Once a learner has built a sentence they like, share it / save to a "phrasebook" surface for offline travel use.

### 22. Web tab — saved layouts
Always relax to physics on entry currently. Optional "pin layout" so a user who arranges nodes in a way that helps them can return to it.

### 23. SmartSession extraction
Continue moving exercise types from the SmartSession.jsx render switch into individual files under `SmartSession/exercises/`. Registry stub already in place.
