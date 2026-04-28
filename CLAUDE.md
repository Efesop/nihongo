# Claude Code Instructions

## Critical: Read before doing anything

**Multiple Claude chats on project.** Before assumptions:
1. **Check filesystem** — files may exist from other chat
2. **Read latest code** before changes — may be refactored
3. **Never assume unchanged codebase** — pull first
4. **Check git log** for unknown commits
5. **Pull before push** — `git stash && git pull --rebase origin main && git stash pop`

## Shell Environment — IMPORTANT

Bash tool sandboxed shell, minimal PATH (`/usr/bin:/bin:/usr/sbin:/sbin`). Dotfiles NOT sourced. `npm`, `node`, `npx` not found.

**Prefix npm/node commands:**
```bash
PATH="/usr/local/bin:$PATH" npm run build
PATH="/usr/local/bin:$PATH" node script.mjs
```

**Do NOT:**
- `export PATH=...` separately (state doesn't persist between Bash calls)
- Modify `.zshenv` (sandbox ignores)
- Remove `.git/index.lock` unless git says exists — check `ls` first

## Project Overview

TinySenpai — Japanese learning app, everyone (not just travelers). React SPA on Vercel.

**Live:** https://tinysenpai.com

## Current Architecture (as of late April 2026)

```
src/
  App.jsx                — state management, SRS, XP/levels, badges, tab routing (~720 lines)
  main.jsx               — React entry point (ClerkProvider)
  components/
    Home.jsx             — Learn-tab-forward dashboard, hero CTA, stats, badges, travel survival nudge
    KanaTrainer.jsx      — learn, quiz, results, menu
    PhraseBank.jsx       — phrase browsing, practice, 4 quiz modes
    SmartSession.jsx     — adaptive Learn tab session engine (~3,800 lines, 38 exercise types — admitted tech debt)
    SmartSession/        — new scaffold for incremental extraction
      registry.js          — type → component mapping (placeholder)
      hooks/               — useCardTimer, useHintReveal
      shared/              — RoleAvatar, RecallCard, ColoredJP (extracted helpers)
    PhraseSegments.jsx   — interactive word-by-word phrase breakdowns (tap reveals meaning + romaji)
    SessionParts.jsx     — shared session primitives — ActionBar, ChoiceCard, ChoiceGloss,
                            HintChip, PlayButton, ResultMark, NoneOfThese, TypeLabel, AudioOrb,
                            SceneImage, JpText, ProgressBar, Badge, SpeakerBubble, Skeleton,
                            PostAnswerReveal + ensureSessionStyles (.ts-reveal, etc)
    SenpaiChat.jsx       — AI chat with roleplay scenarios
    DailyDrill.jsx       — mixed kana + phrase drill
    JapanMap.jsx         — interactive Japan map with 8 regions, travel tips, linked phrases
    Onboarding.jsx       — 3-step onboarding flow with completion celebration + Learn handoff
    Profile.jsx          — profile modal
    Layout.jsx           — sidebar (desktop) + bottom nav (mobile)
    VocabBrowser.jsx     — Vocab tab: Browse / Test / Build (~700 lines)
    Web.jsx              — Web tab: full-bleed force-directed node graph (~1,100 lines)
    web/usePhysics.js    — velocity-Verlet force sim hook (~120 lines, no deps)
    scene/               — SceneWatch / SceneCloze / SceneShadow / SceneRolePlay / SceneIntro / KaraokeText
    grammar/             — GrammarInsight
    pitch/               — PitchIntro / PitchPair
    speed/               — SpeedRound
    Icons.jsx            — single source of truth for SVG icons
    ShadowExercise.jsx   — mic capture + scoring (reused by scene)
    ClusterContrast.jsx  — confused-cluster discrimination
    MetacognitionTap.jsx — post-wrong reflection (sounded / similar / unknown)
  data/
    kana.js              — mnemonics (M), groups, ROMAJI, dakuten/yōon mappings
    phrases.js           — 100 phrases, 11 categories, icons, colors
    phraseBreakdowns.js  — word-by-word translations + grammar types
    conversations.js     — fill-in-the-blank dialogue scenarios (kana-only NPC text, alsoOkIds for valid alternatives)
    confusedPairs.js     — 17 visually similar kana pairs with hints
    confusedPhrases.js   — 25+ structurally similar phrase pairs with hints
    grammarPatterns.js   — 10 auto-unlocking grammar patterns
    kanaWords.js         — vocab context words, 46 kana
    keyWords.js          — vocab building blocks (KEY_WORDS, WORD_CATS)
    regions.js           — Japan map data (8 regions, cities, food, culture, phrases)
    themes.js            — dark/light themes
    constants.js         — SRS config, fonts, T (typography), JP (Japanese display),
                           SCENE_IMG, RP_SCENARIOS, GRAMMAR_COLORS, SPEAKER_COLORS, ROLE_AVATARS
    patternAssembly.js   — 10 grammar templates, sentence construction
  utils/
    audio.js             — TTS playback (speak, speakPhrase, speakPhraseWithEnglish — gap-tightened)
    storage.js           — localStorage + DB sync + one-time normalizeBoxesBySkills migration
    helpers.js           — shuffle, daysUntil
    fsrs.js              — FSRS-5, MCQ_TYPES guess-guard, capBoxBySkills, normalizeBoxesBySkills
    sessionEngine.js     — smart session queue builder, resolveNextAction
    scaffolding.js       — scaffoldForBox(box) → { en, romaji, hint } visibility per SRS box
    telemetry.js         — track(event, payload) with debounced flush
  game/                  — side-scroller game (separate module, separate chat)
api/
  chat.js                — Senpai AI tutor (Claude Sonnet)
  sync.js                — Neon DB read/write
  tts.js                 — Google Translate TTS proxy
  story.js               — AI story generation
  coach.js               — AI coaching (session plan + review)
  conversation.js        — AI branching dialogues
  mnemonic.js            — AI personalised mnemonic generation
  remix.js               — AI phrase-dj remixes / mistake-memory analysis
  verify-code.js         — early-access gate
```

## Tabs (sidebar nav)

| Tab    | Component       | Purpose |
|--------|-----------------|---------|
| Home   | Home.jsx        | Dashboard. Hero "Start Today's Session" routes to Learn. Stats, XP, badges, travel survival nudge when `why=travel && trip<30d`. |
| Learn  | SmartSession    | Adaptive session — 38 exercise types, AI coach, smart end-of-session resolver, opt-in autoContinue. |
| Kana   | KanaTrainer     | Browse + quiz kana by row, dakuten, yōon. |
| Phrases| PhraseBank      | Browse + 4 quiz modes (review, match, spelling, recall). |
| Vocab  | VocabBrowser    | Calm review tab — Browse / Test / Build modes. **No SRS writes.** |
| Web    | Web             | Full-bleed force-directed node graph of learned content. Two views (Phrases / Blocks). **No SRS writes.** |
| Map    | JapanMap        | Interactive Japan, regions, travel tips, linked phrases. |
| Senpai | SenpaiChat      | AI tutor chat, roleplay scenarios. |
| Game   | Game            | Side-scroller (separate chat owns this). |

## Key Technical Details

- **State in App.jsx** — props to components (no Context/Redux)
- **SRS**: FSRS-5 adaptive (stability/difficulty per item), back-compat with 6-box.
  - **Guess-guard:** MCQ_TYPES set in fsrs.js — fast-correct on MCQ caps at Good (3), not Easy (4). Free-recall keeps Easy bonus.
  - **Tightened cap:** capBoxBySkills requires production ≥ 3 for box 5 (was ≥ 2). Visual-only items cap at box 2.
  - **Migration:** `normalizeBoxesBySkills` runs once via storage.migrate(), gated by `settings.recapMigrationV1`. Re-caps all existing items to match the tighter rule.
- **Smart Sessions**: 38 exercise types. Specials-first queue (2-3 per session reserved before reviews).
- **Scaffolding rule** (one source of truth in `scaffoldForBox(box)`):

  | Box | EN under choices | Romaji | Hint timing |
  |-----|------------------|--------|-------------|
  | 0   | always           | always | before first attempt |
  | 1   | always           | on tap | after 15s idle |
  | 2   | on tap           | hidden | after first wrong |
  | 3+  | post-answer only | hidden | post-answer only |

- **Skill tracking**: Multi-dimensional per item (visual, listen, production) — weakest skill prioritised
- **XP/Levels**: 11-tier (0→7500 XP). **Badges**: 12 achievements
- **Audio**: Google TTS proxy for kana, ElevenLabs static MP3s for stories + phrases. EN→JP gap in `speakPhraseWithEnglish` is the natural chain pause (no `setTimeout` delay).
- **Auth**: Clerk. **DB**: Neon PostgreSQL. **Hosting**: Vercel
- **AI**: Claude Sonnet for chat, coaching, stories, conversations, mnemonics, remixes

## Smart Session — exercise types (now 38)

Selected highlights (full set in SmartSession.jsx render switch):

| Type | Description | Notes |
|------|-------------|-------|
| `learn-card` / `learn-phrase` | Intro a new item | learn-phrase has 3s dwell timer before quick-check unlocks; quick-check uses 3 distractors from DIFFERENT categories. SRS only credits when quiz answered. |
| `try-first-kana` / `try-first-phrase` | Productive failure | Romaji shown under JP choices when item box < 2. |
| `kana-visual` / `kana-listen` / `kana-reverse` | Kana drills | Phonetic anchor (context word from `kanaWords.js`) shown on feedback. |
| `kana-pair` | Confused pair discrimination | First wrong reveals discriminator hint, allows retry (counts as wrong in SRS). |
| `phrase-scenario` / `phrase-listen` | MCQ phrase recall | Trick-mode (no-correct-answer) disabled below box 2. Dual-coded JP+EN choices when box <3 (phrase-listen). |
| `phrase-reverse` / `phrase-production` | Production-direction | Free-recall, Easy bonus applies on fast-correct. |
| `phrase-pair` | Confused phrase discrimination | Side-by-side. |
| `phrase-build` | Fill missing segment | Per-segment meaning shown under each choice when phrase box < 3. |
| `pattern-assembly` | Tap-to-build sentence | Piece pool shows meaning under each chip when phrase box < 3. |
| `phrase-kana-type` | Spell with kana keyboard | Pre-spelling meaning-pick: on wrong, side-by-side jp↔en for picked vs correct (2.5s). |
| `phrase-chain` | Connected speech | On wrong step, side-by-side comparison card (your pick vs correct). |
| `phrase-dj` | AI remix quiz | EN under each JP choice during selection. |
| `phrase-shadow` | Mic capture | Routes through ShadowExercise. |
| `mistake-memory` | AI error analysis | Retrieval gate — Next disabled until learner picks correct meaning of one error item. |
| `conversation` | Fill-in-blank dialogue | NPC text 100% kana. Each blank supports `alsoOkIds: []` for multiple valid responses (e.g. after "200 yen" both カードで and げんきんで are accepted). EN translation shown under filled NPC bubbles. EN+romaji on phrase choice chips when box <3. |
| `branch-convo` / `story` / `graded-reader` | AI-generated content | |
| `scene-watch` / `scene-cloze` / `scene-shadow` / `scene-roleplay` | Scene exercises | |
| `pitch-intro` / `pitch-pair` | Pitch accent | |
| `cluster-contrast` / `speed-round` | Specials | |
| `number-match` / `bucket-sort` / `word-quiz` | Vocab drills | |
| `grammar-pattern` | Auto-unlocked insight | |
| `leech-review` | 5+ errors → mnemonic treatment | |

## Vocab tab — calm review (no SRS write)

Three modes, telemetry only — never bumps boxes.

- **Browse** — phrases at box ≥1, grouped by category. Each header is a clickable button with a chevron (collapsed state persists in `localStorage["vocab-collapsed"]`). Rows are big and readable: JP `T.xxl/T.xl`, romaji `T.sm`, EN `T.md`. Listen button low-opacity by default, full opacity on row hover (desktop) / always full opacity on touch.
- **Test** — EN→JP self-test. Active flashcard is sticky-centered (`position: sticky; bottom: 28vh`) so the card stays in view as the answered-history list grows above it. Tap card to flip → JP+romaji + auto-play. `Missed` / `Replay` / `Knew it` buttons. Telemetry: `vocab_test_attempt`.
- **Build** — sentence builder. Pool of unique segments from learned phrases, deduped, grouped by grammar type (`Nouns / Verbs / Particles / Adj / Expressions / Counters / Copula / Suffix`). Tap chips → drop on canvas in order. Live EN gloss preview ("this + water"). `Hear it` plays raw TTS, `Save` persists up to 20 sentences in `localStorage["vocab-built-sentences"]`.

## Web tab — interactive node graph

Full-bleed (no card border) force-directed visualisation. **No emojis anywhere** — identity is the language: header is `フレーズ` or `ぶひん`, all node labels are JP segments themselves.

- **Two views (toggle pill in header):**
  - **Phrases (`フレーズ`)** — nodes = learned phrases, edges = typed connections (see below).
  - **Blocks (`ぶひん`)** — nodes = unique segments appearing in ≥2 learned phrases, sized by usage count, coloured by grammar type, edges = co-occurrence in same phrase.
- **Edge taxonomy** — each edge has a `kind` and a `label` shown mid-edge on focus:
  - `shared`   blue, dashed   — share a non-trivial building block. Label = the segment.
  - `template` green, solid   — both end with the same verb (`～ください`, `～あります`, `～おねがいします`, etc).
  - `opposite` amber, solid   — curated antonyms in `ANTONYM_PAIRS` (おおきい↔ちいさい, あつい↔さむい, みぎ↔ひだり, きょう↔あした, …).
  - `answer`   pink, dotted   — curated Q↔A in `QNA_PAIRS` (どこですか → みぎ/ひだり/まっすぐ, いくらですか → ___ えんです).
- **Learning-aid overlay:**
  - Phrase node fill alpha = SRS box (dim → bright as you master).
  - Pulsing gold ring on items currently due for review.
  - Block node fill alpha = avg box of phrases that contain it; size = usage count.
- **Physics:** velocity-Verlet sim in `web/usePhysics.js`. Centre gravity + pairwise repulsion + edge springs + damping. Cool-down + wake-on-interact. Gentle perpetual jitter so a settled graph still feels alive.
- **Interaction:**
  - Wheel zooms anchored at cursor; drag empty space pans; drag a node to pin it (releases on pointer up).
  - Hover → small lift + glow + reveal the node's label.
  - Tap node → focus mode: enlarges, glows, dims non-connected nodes, animates connected edges via stroke-dasharray dash-flow, opens a detail panel bottom-right.
- **Detail panel:**
  - JP hero rendered via `PhraseSegments` so each word is colour-coded by grammar type and tappable for per-word meaning + romaji (matches Learn-exercise pattern).
  - Big text: JP `T.xxl`, romaji `T.sm`, EN `T.md`, pills `T.sm`.
  - SRS state pills (box, last review, next review, weak skill).
  - "Why connected?" grouped by edge kind with coloured section headers (`OPPOSITE` / `SAME TEMPLATE` / `SHARES` / `Q ↔ A`). Each item is a clickable card that refocuses to that node.
- **Telemetry:** `web_open`, `web_view_change`, `web_node_click`.

## Content Status

- **92 base kana**: mnemonic images, stories, audio ✓
- **50 dakuten/handakuten**: Row-based learn mode ✓
- **66 yōon combinations**: Row-based learn mode ✓
- **100 phrases**: 11 categories, SRS, word breakdowns, scenario quizzes ✓
- **Categories**: Greetings, Restaurants, Transport, Hotels, Shopping, Directions, Emergencies, Numbers, Time & Days, Daily Life, Describing
- **Mnemonic images**: Watercolor + red calligraphy (Gemini Pro)
- **17 confused kana pairs**, visual discrimination hints ✓
- **25+ confused phrase pairs**, structural difference explanations ✓
- **10 grammar patterns**, auto-unlocking from phrase progress ✓
- **46 kana context words**, real vocab on learn cards ✓
- **8 Japan regions**, cities, food, culture, travel tips ✓
- **26 fill-in-blank conversations** with `alsoOkIds` for multiple valid responses, kana-only NPC text ✓
- **15 antonym pairs + 14 Q↔A pairs** wired into Web graph edges ✓

## Important Files

- `ARCHITECTURE.md` — detailed technical docs (audio, deployment, gotchas, Vocab + Web internals)
- `LEARNING_SCIENCE.md` — evidence-based learning research, marks Vocab + Web as shipped review aids
- `FUTURE_FEATURES.md` — backlog
- `GAME.md` / `SPRITES.md` — game design docs (managed by game chat)
- `scripts/generate-audio.mjs` — ElevenLabs audio generation
- `scripts/test-session-engine.mjs` — session engine smoke tests (5 probabilistic failures are baseline)

## Critical Rules

- **React hooks at component top** — never inside JSX vars or conditionals
- **Pull before push** — other chats push concurrently
- **Don't touch `src/game/`** — separate AI chat manages
- **Inline styles only** — no CSS files, colors from theme `c` object
- **Mobile-first** — responsive at 768px breakpoint
- **Proactive approach** — suggest alternatives, flag issues, don't execute blindly
- **Plan before big work** — for anything bigger than a small fix (new tab, new exercise type, system redesign), draft a real plan first; user has called this out when shipped lazy
- **No small text in user-facing surfaces** — body text minimum `T.md`, headers `T.lg+`, JP hero `T.xl+`. Detail panels and review surfaces especially.
- **No emojis where the JP language is the identity** — Web tab, Vocab Build chips, sentence assembly. Use JP labels (`あいさつ`, `しょくじ`, etc) instead.

## Component Architecture Rules (2026-04+)

New code MUST follow these. SmartSession.jsx (3,800+ lines) is admitted tech debt — do not extend it; extract instead. The `SmartSession/` subfolder is the staging ground for incremental extraction.

- **Max ~400 lines per component.** If bigger, split into a subfolder with one shell + multiple subcomponents.
- **One component per file.** File name matches the export.
- **Subfolder patterns** for multi-mode screens: e.g., `src/components/scene/SceneWatch.jsx`, `SceneCloze.jsx`, `SceneShadow.jsx`, `SceneRolePlay.jsx`, plus `SceneIntro.jsx` shared primitive.
- **Reuse `SessionParts.jsx` primitives** — never duplicate `ActionBar`, `ChoiceCard`, `ChoiceGloss`, `AudioOrb`, `PlayButton`, `HintChip`, `TypeLabel`, `ResultMark`, `NoneOfThese`, `SceneImage`, `JpText`, `ProgressBar`, `Badge`, `SpeakerBubble`, `Skeleton`, `PostAnswerReveal`.
- **Reuse `PhraseSegments.jsx`** for word-by-word breakdowns. It accepts either a phraseId or a raw breakdown array.
- **Reuse `scaffoldForBox(box)` from `utils/scaffolding.js`** when deciding how much help to show alongside a tested item — single source of truth, used by ChoiceGloss.
- **Extract shared logic** (mic capture → `ShadowExercise.jsx`; karaoke sync → `KaraokeText.jsx`; force sim → `web/usePhysics.js`) into dedicated components/utils.
- **Icons from `Icons.jsx`** — don't inline SVG in components.
- **Never add exercise types to SmartSession.jsx** — create a component, import it, call from the render switch.

## UI Polish Conventions

Beautiful UI is non-negotiable. New components MUST:

- **Colors from theme `c`.** Never hardcode hex. Tokens: `c.bg`, `c.s` (surface), `c.s2` (raised), `c.b` (border), `c.tx` (text), `c.m` (muted), `c.m2` (muted-light), `c.a` (accent red), `c.g` (green), `c.go` (gold/hint), `c.ro` (romaji coral), `c.ac` (accent UI blue), `c.gs` (green surface), `c.rs` (red surface), `c.as` (active surface). Speaker / grammar / role colours come from `SPEAKER_COLORS`, `GRAMMAR_COLORS`, `ROLE_AVATARS` in `constants.js`.
- **Typography from `T` constants.** Never hardcode px. `T.xs` (11) / `T.sm` (13) / `T.base` (15) / `T.md` (17) / `T.lg` (20) / `T.xl` (24) / `T.xxl` (32) / `T.huge` (48).
- **Body text minimum `T.md`.** Detail panels, review surfaces, and anything the user reads more than once should never go below `T.md`. Use `T.xs/T.sm` for labels, badges, and ephemeral metadata only.
- **Japanese text uses `fontJa`,** `JP.weight` (500), `JP.lineHeight` (1.3). Size via `JP.size.desktop`/`.mobile` for body JP; bigger (`T.xxl`) for hero JP in detail panels.
- **Spacing scale:** 6 / 8 / 10 / 12 / 16 / 20 / 24 / 32. No in-between values.
- **Border radius:** 8 (chip) / 10 (button) / 12 (card) / 16 (major panel).
- **Borders:** `1px solid ${c.b}` standard. Dashed `2px dashed ${c.ac}` for drop targets.
- **Cards:** `{ background: c.s, border: "1px solid " + c.b, borderRadius: 12, padding: 16 }`.
- **Transitions:** `.15s` standard (buttons, state changes); `.3s` for larger reveals.
- **Motion for reveal:** use the `.ts-reveal` class from `ensureSessionStyles()` (fade + 4px slide-up, 300ms ease-out). `.ts-reveal-fast` for feedback marks.
- **Speaker color coding in dialogue:** Konoha (female voice) = `SPEAKER_COLORS.konoha` (`#f48fb1`) / left stripe 3px; Akira (male voice) = `SPEAKER_COLORS.akira` (`#64b5f6`).
- **Touch targets:** min 44px on mobile.
- **Use `className="ts-btn"`** for interactive buttons — gets hover/active micro-animations defined in `SessionParts.jsx`.
- **Japanese first, English second.** When showing both, JP is the hero (bigger font, darker), EN is support (`c.m`, smaller). Romaji `c.ro`, mono.

## UX patterns proven in this codebase (reuse when applicable)

- **Listen-on-hover affordance** (Vocab Browse): button at low opacity (`0.35`) by default, full opacity on row hover (desktop) and full opacity on touch (`@media (hover: none)`). Avoids cluttering the list while keeping the affordance discoverable.
- **Sticky-centered flashcard** (Vocab Test): wrap the active card in a container with `position: sticky; bottom: 28vh` (mobile: `20vh`). The card stays anchored at viewport centre as a history list grows above it. No JS, just sticky.
- **Focus-mode pattern** (Web): selected item enlarges + gets a coloured drop-shadow, connected items highlight, all others fade to ~18% opacity. Animated edges via `stroke-dasharray` + `dashoffset` keyframe (`webDashFlow`).
- **Edge labels in SVG** (Web): use `<foreignObject>` with an HTML `<div>` for the label background — keeps text legible over a busy graph and inherits font/colour tokens cleanly.
- **JP hero in detail panels uses `PhraseSegments`** — segments JP into colour-coded chips by grammar type, tap reveals per-word meaning + romaji. Don't render the bare string in detail surfaces.
- **No emojis in surfaces where JP is the identity.** Header for the Web tab is `フレーズ` / `ぶひん`. Category nodes labelled in JP (`あいさつ`, `しょくじ`, …). Build chips, sentence assembly tiles, etc.
- **Force-directed > radial** for graphs the user explores. Settles into clusters that reveal structure naturally; gentle drift at rest signals the page is alive without being distracting.
- **Telemetry-only review surfaces.** Vocab Test and Web both record `track(...)` events but never write FSRS / boxes. Keeps the Learn tab the authoritative SRS surface and avoids inflating mastery from low-stakes tapping.
