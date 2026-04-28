# TinySenpai — Architecture Guide

Japanese learning app (kana + phrases + AI tutor + game). Single-page React app, Vercel.

**Live:** [tinysenpai.com](https://tinysenpai.com)

---

## Product Vision

TinySenpai — **fastest, most effective way to learn Japanese** — complete beginners and beyond. NOT traditional textbook app. Key principles:

- **Phrases over isolated words** — learn grammar organically through real sentences
- **Whatever method works**, not what's traditional. Mnemonic images, audio chains, trick questions — whatever locks in.
- **Mnemonics everything** for kana. Every character has vivid visual story (apple for あ, boxer for う). Story audio pre-generated with ElevenLabs (Matilda voice).
- **FSRS-5 drives all review**. Adaptive spaced repetition — per-item stability + difficulty, 85% target retention.
- **Audio first-class**. Japanese pronunciation from Google TTS. English stories from ElevenLabs. Phrases from ElevenLabs.
- **Smart Sessions** — AI-powered adaptive learning with coaching, stories, branching conversations, confused pair drilling, productive failure, cross-category variety.
- **AI tutor (Senpai)** — harsh sensei character, knows user's progress, trip date, learning context. Roleplay scenarios, grammar explanations, personalised mnemonics.
- **Mobile-first**, works great on desktop with sidebar nav.

---

## Deployment & Commands

```bash
# Deploy to production
npx vercel --prod

# Or push to main — Vercel auto-deploys

# Generate audio files (one-time, needs ElevenLabs key)
ELEVENLABS_API_KEY=xxx node scripts/generate-audio.mjs

# Dev server
npm run dev
```

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 SPA (Vite), ~30 source files across components/data/utils |
| AI | Claude Sonnet via Anthropic API (chat, coaching, stories, conversations, mnemonics) |
| Auth | Clerk (`@clerk/clerk-react`), `routing="virtual"` for embedded SignIn/SignUp |
| Database | Neon PostgreSQL via `@neondatabase/serverless` |
| Hosting | Vercel (static + serverless functions) |
| TTS | Google Translate proxy (`/api/tts`) for Japanese, ElevenLabs static MP3s for stories + phrases |
| SRS | FSRS-5 (Free Spaced Repetition Scheduler), 6-box back-compat |

---

## File Structure

```
src/
  App.jsx                — State management, SRS, XP/levels, badges (~695 lines)
  main.jsx               — Entry point, ClerkProvider wrapper

  components/
    SmartSession.jsx     — Adaptive Learn-tab engine (largest: ~3,800 lines, 38 exercise types) — admitted tech debt; SmartSession/ subfolder is the staging ground for incremental extraction.
    SmartSession/
      registry.js          — type → component map (placeholder, populates as types are extracted)
      hooks/useCardTimer.js
      hooks/useHintReveal.js
      shared/RoleAvatar.jsx, RecallCard.jsx, ColoredJP.jsx (extracted helpers)
    PhraseBank.jsx       — Phrase browsing, 4 quiz modes
    KanaTrainer.jsx      — Kana learn/quiz/results
    Home.jsx             — Learn-tab-forward dashboard, hero CTA, stats, badges, travel survival nudge
    JapanMap.jsx         — Interactive Japan map (8 regions, travel tips, linked phrases)
    PhraseSegments.jsx   — Interactive word-by-word breakdowns (tap reveals meaning + romaji)
    SessionParts.jsx     — Shared session primitives (ActionBar, ChoiceCard, ChoiceGloss, HintChip, PlayButton, ResultMark, NoneOfThese, TypeLabel, AudioOrb, SceneImage, JpText, ProgressBar, Badge, SpeakerBubble, Skeleton, PostAnswerReveal) + ensureSessionStyles
    VocabBrowser.jsx     — Vocab tab: Browse / Test / Build modes (~700 lines, no SRS writes)
    Web.jsx              — Web tab: full-bleed force-directed node graph (~1,100 lines, no SRS writes)
    web/usePhysics.js    — Velocity-Verlet force sim hook (~120 lines, no deps)
    SenpaiChat.jsx       — AI tutor chat + roleplay
    DailyDrill.jsx       — Mixed kana+phrase daily drill
    Onboarding.jsx       — 3-step onboarding (defaults on skip, trip-date validation, focus-field counter, completion celebration → Learn handoff, travel-mode auto-inference)
    Profile.jsx          — Profile modal, sync status
    Layout.jsx           — Sidebar (desktop) + bottom nav (mobile)
    scene/               — SceneWatch / SceneCloze / SceneShadow / SceneRolePlay / SceneIntro / KaraokeText
    grammar/             — GrammarInsight
    pitch/               — PitchIntro / PitchPair
    speed/               — SpeedRound
    Icons.jsx            — single source of truth for SVG icons

  data/
    kana.js              — M (mnemonics), H_GROUPS, K_GROUPS, ROMAJI, DAKUTEN_BASE, YOON_PARTS
    phrases.js           — 100 phrases, CATS, CAT_ICONS, CAT_COLORS (11 categories)
    phraseBreakdowns.js  — Word-by-word: [japanese, romaji, meaning, grammar_type]
    conversations.js     — Fill-in-the-blank dialogue scenarios
    confusedPairs.js     — 17 visually similar kana pairs (シ/ツ, は/ほ, etc.) with hints
    confusedPhrases.js   — 25+ structurally similar phrase pairs with hints
    grammarPatterns.js   — 10 patterns auto-unlocking from phrase progress
    kanaWords.js         — Vocab context words, 46 kana
    regions.js           — Japan map (8 regions, cities, food, culture, linked phrases)
    themes.js            — Dark/light theme color objects
    constants.js         — SRS_DAYS, fonts, typography scale (T), JP, SCENE_IMG, RP_SCENARIOS, LEVEL_THRESHOLDS, GRAMMAR_COLORS, SPEAKER_COLORS, ROLE_AVATARS
    patternAssembly.js   — 10 grammar templates for sentence construction (pattern-assembly)
    keyWords.js          — KEY_WORDS + WORD_CATS for vocab building blocks

  utils/
    fsrs.js              — FSRS-5 (stability, difficulty, retrievability) + MCQ_TYPES guess-guard + capBoxBySkills + normalizeBoxesBySkills migration helper
    sessionEngine.js     — Smart session queue builder (~700 lines) + resolveNextAction
    scaffolding.js       — scaffoldForBox(box) → { en, romaji, hint } single source of truth for help-fade rules
    audio.js             — TTS playback (speak, speakPhrase, speakPhraseWithEnglish — gap-tightened)
    storage.js           — localStorage + Neon DB sync (debounced) + one-time normalizeBoxesBySkills migration on load
    helpers.js           — shuffle, daysUntil
    telemetry.js         — track(event, payload), debounced flush to /api/sync

  game/                  — Side-scroller game (separate chat, don't touch)
    Game.jsx             — React wrapper
    engine.js            — Physics, combat, collision
    renderer.js          — Canvas drawing
    entities.js          — Player & enemy factory
    sprites.js           — PNG loading, gray-bg removal
    levels.js            — 10 room definitions
    input.js             — Keyboard + mobile touch
    constants.js         — Physics values

api/
  chat.js                — Senpai AI tutor (Claude Sonnet)
  coach.js               — Session coaching (plan + review)
  sync.js                — Neon DB read/write user data (Clerk auth)
  tts.js                 — Google Translate TTS proxy
  story.js               — AI story generation, known phrases
  conversation.js        — AI branching dialogue scenarios
  mnemonic.js            — Personalised mnemonic generation

scripts/
  generate-audio.mjs     — ElevenLabs audio generation (one-time)
  generate-phrase-images.mjs  — Gemini scene image generation (100 phrases)
  generate-scene-images.mjs   — Regenerate mismatched phrase scene images
  simulate-learning.mjs       — 60-session learning simulation (accuracy, progression)
  test-session-engine.mjs     — Unit tests for session engine (12 tests)

public/
  audio/
    story3/              — ACTIVE: English mnemonic stories (Matilda, 92 files)
    phrase/              — ACTIVE: Japanese phrase audio (Lily, 100 files)
    rows/                — ACTIVE: Row-level dakuten/yōon explanations (Lily, 16 files)
    kana/, kana2/, story/, story2/  — Legacy backups (not used)
  images/
    mnemonics/approved/  — Kana mnemonic images (hiragana/ + katakana/)
    tinysenpai/          — Game sprites (run, slash, jump, death, etc.)
    phrases/             — Category banner images
    phrases/scenes/      — Per-phrase watercolor scene images (100, dual coding)
    phrases/scenes/backup/ — Old scene images before regeneration
```

---

## Smart Session Engine

Core learning experience. `SmartSession.jsx` + `sessionEngine.js` together:

### Session Building (`sessionEngine.js` — ~600 lines)

Builds adaptive 10-card exercise sessions via **specials-first** architecture:

#### Stage 1: Build Special Pool (reserved first)
High-impact exercises reserved BEFORE reviews fill queue:
- **Pattern assembly** — generative sentence construction (3+ phrases, 10 templates)
- **Phrase build** — fill missing segment
- **Word quiz** — vocab in context
- **Confused kana pair** — visual discrimination (20+ kana, 17 pairs)
- **Confused phrase pair** — structural discrimination (5+ phrases, 25+ pairs)
- **Grammar pattern** — auto-unlocked insights (10 patterns)
- **Story** — AI-generated narrative (25% chance, 3+ phrases)
- **Branching convo** — interactive AI dialogue (20% chance, 8+ phrases)
- **Fill-in-the-blank conversation** — scripted dialogue (40% chance, 5+ phrases)

Up to 3 specials reserved per session (`maxSpecials = min(specialPool.length, 3)`).

#### Stage 2: Fill Remaining Slots with Reviews
`reviewSlots = sessionLength - reservedSpecials.length`

Priority:
1. Help-requested items (up to 2 kana, 1 phrase)
2. Frequent error items (up to 2 kana, 1 phrase)
3. Easy wins — 1-2 high-box due items for confidence
4. Due items — proportionally split kana/phrases by what's due
5. Recently learned — max 1 each (2-hour window, prevents cross-session repetition)
6. Maintenance kana — high-box when too few kana in queue
7. **Productive failure** — quiz BEFORE teaching new items:
   - `try-first-kana` → delayed `learn-card` (2+ cards later)
   - `try-first-phrase` → delayed `learn-phrase` (2+ cards later)
8. Filler slots from remaining due/unseen

#### Stage 3: Interleaving with Randomized Placement
Specials placed with spacing + ±1 jitter (not fixed positions). Kana/phrase exercises alternate to prevent clustering.

#### Smart Phrase Ordering
New phrases ordered by: mission-critical first (+100 score), known building blocks (+15 per familiar word fragment), cross-category interleaving (no 3+ from same category in a row).

### Exercise Type Selection

Exercise types chosen from SRS box level + multi-dimensional skill tracking:

**Skill-based routing**: Each item tracks `visual`, `listen`, `production` scores (0-5). If item has 3+ total tests, weakest skill gets prioritised.

**Default progression** (when skill data sparse):

| Box | phrase-scenario | phrase-listen | phrase-reverse | phrase-production |
|-----|----------------|---------------|----------------|-------------------|
| 0 | 75% | 25% | — | — |
| 1 | 45% | 40% | 15% | — |
| 2 | 25% | 25% | 25% | 25% |
| 3+ | — | 10% | 60% | 30% |

Key design: production softened at box 1 (15% reverse, not 30%) to keep accuracy in 80-88% zone. Full production ramps at box 2-3.

### 38 Exercise Types

Highlights — full set in the SmartSession.jsx render switch. Notable behaviour from the late-April pedagogical pass is annotated.

| Type | Description | Notes |
|------|-------------|-------|
| `learn-card` / `learn-phrase` | Intro a new item | learn-phrase has a 3s dwell timer before quick-check unlocks; quick-check uses 3 distractors from DIFFERENT categories. SRS only credits when the quiz is answered (skipping no longer auto-credits). |
| `try-first-kana` / `try-first-phrase` | Productive failure | Romaji shown under JP choices when item box < 2 (decoding ≠ the test). |
| `kana-visual` / `kana-listen` / `kana-reverse` | Kana drills | On feedback, show one real word containing the kana (from `kanaWords.js`) as a phonetic anchor. |
| `kana-pair` | Confused-pair discrimination | First wrong reveals discriminator hint inline and allows a retry; SRS still records as wrong. |
| `phrase-scenario` / `phrase-listen` | MCQ phrase recall | Trick mode (no-correct-answer) disabled below box 2 to stop punishing beginners. phrase-listen dual-codes JP+EN on choices when box < 3. |
| `phrase-reverse` / `phrase-production` | Production direction | Free recall — Easy bonus applies on fast-correct. |
| `phrase-pair` | Confused phrase discrimination | Side-by-side. |
| `phrase-build` | Fill missing segment | Per-segment meaning shown under each choice when phrase box < 3. |
| `pattern-assembly` | Tap-to-build sentence | Piece pool shows each piece's meaning when phrase box < 3. |
| `phrase-kana-type` | Spell with kana keyboard | Pre-spelling meaning-pick: on wrong, side-by-side jp↔en for picked vs canonical (2.5s) before advancing. |
| `phrase-chain` | Connected speech | On wrong step, side-by-side comparison card (your pick vs correct). |
| `phrase-dj` | AI remix quiz | EN under each JP choice during selection. |
| `phrase-shadow` | Mic capture | Routes through ShadowExercise. |
| `mistake-memory` | AI error analysis | Retrieval gate — Next disabled until learner picks correct meaning of one error item. |
| `conversation` | Fill-in-blank dialogue | NPC text 100% kana. Each blank supports `alsoOkIds: []` so multiple valid responses grade as correct (e.g. after "200 yen", カードで / げんきんで / no bag / no receipt all OK). EN translation shown under filled NPC bubbles. EN+romaji on phrase choice chips when box < 3. Stale-options ref bug fixed (key by convo.id + ci, not just ci). |
| `branch-convo` / `story` / `graded-reader` | AI-generated content | |
| `scene-watch` / `scene-cloze` / `scene-shadow` / `scene-roleplay` | Scene exercises | |
| `pitch-intro` / `pitch-pair` | Pitch accent | |
| `cluster-contrast` / `speed-round` | Specials | |
| `number-match` / `bucket-sort` / `word-quiz` | Vocab drills | word-quiz reverse mode shows romaji under JP choices when phrase box < 3. |
| `grammar-pattern` | Auto-unlocked insight | |
| `leech-review` | 5+ errors → mnemonic treatment | |

### Scaffolding rule (single source of truth)

`utils/scaffolding.js` exports `scaffoldForBox(box)` returning `{ en, romaji, hint }` per the table:

| Box | EN under choices | Romaji | Hint timing |
|-----|------------------|--------|-------------|
| 0   | always           | always | before first attempt |
| 1   | always           | on tap | after 15s idle |
| 2   | on tap           | hidden | after first wrong |
| 3+  | post-answer only | hidden | post-answer only |

Used by `ChoiceGloss` in SessionParts.jsx. When you build a new exercise, route choice rendering through ChoiceGloss + scaffoldForBox so help fades consistently with mastery instead of being a binary "is romaji on?" toggle.

### Response Time Tracking
Every answer records ms (`getResponseMs()`). Used for:
- Adaptive auto-advance timing on kana (fast <2s = 1.5s display, normal = 2.5s, slow >5s = 4s)
- Phrase exercises use manual "Next →" button instead of auto-advance (prevents audio cutoff)
- Stored in `answerLog` for future AI analysis

### Senpai Mascot
- Circular avatar at bottom of session screen
- Hover for quips, click for floating chat (can ask about current exercise)
- Performance grades: S/A/B/C with different sprites
- Typewriter text animation for speech bubbles
- Items discussed in chat flagged via `helpRequested` for priority review

---

## SRS System

### FSRS-5 (`utils/fsrs.js`)
Free Spaced Repetition Scheduler:

- **Stability (S)**: Time until recall drops to 90%
- **Difficulty (D)**: Per-item (1-10)
- **Retrievability (R)**: Current probability of recall
- **Target**: 85% retention
- **Intervals**: Auto-calculated from stability curve
- **`lastReview`**: Timestamp of last review — used for elapsed time and 2-hour recently-learned window

Maps to 6-box system (0-5) for back-compat via `stabilityToBox()`. Box 0 reserved for truly new items (minimum return is box 1 after first review).

### Data Shape
```js
{
  kana: { [char]: { box: 0-5, next: timestamp, stability, difficulty, lastReview } },
  phr: { [phraseId]: { box: 0-5, next: timestamp, stability, difficulty, lastReview } },
  sessions: number,
  totalC: number,           // total correct count
  streak: number,
  lastDay: "Mon Mar 24 2026",
  started: ISO string,
  onboarded: boolean,
  onboarding: { why, level, focus, tripDate },
  errors: { [itemId]: number },        // wrong-answer count per item (leech at 5+)
  skills: { [itemId]: { visual: 0-5, listen: 0-5, production: 0-5 } },
  answerLog: [{ item, correct, type, ts, ms }],  // rolling buffer, last 200
  settings: {
    badges: ["first-session", "streak-3", ...],   // earned badge IDs
    sessionCount: number,
    sRanks: number,           // sessions with 100% score
    helpRequested: [itemId],  // items user asked Senpai about (last 20)
    regionsVisited: [region], // Japan map regions explored
    ...
  }
}
```

### Multi-Dimensional Skill Tracking
Each item tracks three skill dimensions independently:
- **Visual**: kana-visual, phrase-scenario
- **Listen**: kana-listen, phrase-listen
- **Production**: kana-reverse, phrase-reverse, phrase-production

Correct: +1 (max 5). Wrong: -1 (min 0). After 3+ total tests, exercises routed to weakest skill.

### Guess-guard (MCQ_TYPES)
`fsrs.js` exports `MCQ_TYPES` — exercises where a 1-second correct answer is plausibly a guess from a small option pool. On those types, fast-correct caps at Good (rating 3), not Easy (rating 4). Free-recall / typing / production exercises keep the Easy bonus because they can't be guessed.

```
MCQ_TYPES = [
  "phrase-listen", "phrase-scenario", "phrase-pair", "phrase-reverse",
  "phrase-dj", "kana-listen", "kana-pair", "word-quiz",
  "conversation", "scene-quick-check", "try-first-phrase", "try-first-kana",
  "learn-phrase",
]
```

### Tightened mastery cap (capBoxBySkills)
`fsrs.js#capBoxBySkills(box, skills)` clamps the FSRS-derived box by skill-coverage proof:

```
v >= 2 AND l >= 1 AND p >= 3   → box up to 5  (was p >= 2)
v >= 2 AND l >= 1 AND p >= 1   → box up to 4
v >= 1 AND (l >= 1 || p >= 1)  → box up to 3
otherwise                       → box up to 2
```

### One-time recap migration
`fsrs.js#normalizeBoxesBySkills(data)` re-applies the cap to every existing phr/kana entry. `storage.migrate()` runs it once per user, gated by `settings.recapMigrationV1`. Demoted-count is recorded to `settings.recapMigrationV1Capped` for visibility. Items that climbed to box 4-5 before the cap was tightened drop to whatever their skill profile actually justifies.

### End-of-session resolver
`sessionEngine.js#resolveNextAction(data)` returns `{ mode, dueCount?, label, subLabel? }`. Modes:

- `keep-going`     — `dueCount > 0` and user hasn't done `>= 3` sessions today (DAILY_SOFT_CAP).
- `all-caught-up`  — passive copy "Done for today — see you tomorrow".

SmartSession's done-screen renders one CTA based on this — replaces the old Continue / Done fork. `data.settings.autoContinue` (opt-in, default false) auto-chains to the next session 4s after the screen appears, cancellable with Esc / tap. A nudge prompt offers it after the user's 3rd session of the day.

Skill map:
```js
{ "kana-visual": "visual", "kana-listen": "listen", "kana-reverse": "production",
  "kana-pair": "visual", "phrase-scenario": "visual", "phrase-listen": "listen",
  "phrase-production": "production", "phrase-reverse": "production",
  "pattern-assembly": "production" }
```

### XP & Levels
11-tier leveling: `[0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500]`

### Badges (12 total)
| Badge | Trigger |
|-------|---------|
| First Steps | Complete first session |
| Consistent | 3-day streak |
| Dedicated | 7-day streak |
| Kana Beginner | Learn 10 kana |
| Hiragana Master | Learn all hiragana (46) |
| Kana Master | Learn all 92 base kana |
| Phrase Builder | Learn 10 phrases |
| Conversationalist | Learn 50 phrases |
| Perfectionist | First S rank (100% session) |
| Elite | 5 S ranks |
| Senpai's Favourite | 10 S ranks |
| Explorer | Visit all 8 Japan map regions |

### Persistence Flow
1. `save(updates)` → merges with `defaultD()` + previous state
2. Writes localStorage immediately
3. Debounces (1.5s), syncs to Neon DB via `/api/sync`
4. On load: DB source of truth, falls back to localStorage

---

## Confused Pairs & Phrases

### Kana Confused Pairs (`confusedPairs.js` — 17 pairs)
Visually similar kana with discrimination hints:
- Katakana: シ/ツ, ソ/ン, ノ/メ, ク/タ, ウ/ワ, コ/ユ, ア/マ, ヌ/ス
- Hiragana: は/ほ, き/さ, わ/れ, ね/れ, め/ぬ, る/ろ, い/り
- Dakuten: は/ば, か/が

Exercise: "Which one is **shi**?" — shows both as large buttons, reveals hint after answering.

### Confused Phrase Pairs (`confusedPhrases.js` — 25+ pairs)
Structurally similar phrases, different meanings:
- **Particle confusion**: これをください vs これはいくらですか (を vs は changes "give me" to "how much")
- **Same pattern, different noun**: えきはどこですか vs トイレはどこですか
- **Request styles**: ～をください (things) vs ～てください (actions)
- **Payment methods**: カードで vs げんきんで
- **Adjective opposites**: あつい/さむい, たかい/やすい, とおい/ちかい
- **Verb patterns**: たべたいです vs のみたいです vs いきたいです
- **Polarity**: わかります vs わかりません

Exercise: "Which means **How much is this?**" — shows both phrases, reveals hint explaining key structural difference.

---

## Grammar Patterns (`grammarPatterns.js` — 10 patterns)

Auto-unlock from phrase progress. Implements Schmidt's Noticing Hypothesis — explicit attention to patterns after implicit exposure.

| Pattern | Meaning | Unlocks when |
|---------|---------|-------------|
| ～をください | "please give me ~" | 3+ phrases with pattern |
| ～はどこですか | "where is ~?" | 3+ phrases |
| ～おねがいします | polite "please" | 3+ phrases |
| ～はなんですか | "what is ~?" | 2+ phrases |
| ～たいです | "I want to ~" | 2+ phrases |
| ～がありますか | "is there ~?" | 2+ phrases |
| ～です | copula | 5+ phrases |
| ～ません | negative | 2+ phrases |
| ～てください | "please do ~" | 2+ phrases |
| ～でおねがいします | "by/with ~ please" | 2+ phrases |

---

## Content

### Kana (208 total)
- **92 base**: 46 hiragana + 46 katakana — all with mnemonic images, stories, audio
- **50 dakuten/handakuten**: Row-based learn mode
- **66 yōon**: Row-based learn mode
- **46 kana context words**: Real vocab on learn cards (e.g. あ → あめ "rain")
- **17 confused pairs**: Visual discrimination drills with hints

### Phrases (100 total, 11 categories)
| Category | ID prefix | Count | Icon |
|----------|-----------|-------|------|
| Greetings | g | 10 | 👋 |
| Restaurants | f | 10 | 🍜 |
| Transport | t | 8 | 🚃 |
| Hotels | h | 6 | 🏨 |
| Shopping | s | 7 | 🏪 |
| Directions | d | 8 | 🗺️ |
| Emergencies | e | 6 | 🆘 |
| Numbers | n | 13 | 🔢 |
| Time & Days | tm | 10 | ⏰ |
| Daily Life | dl | 12 | 🌸 |
| Describing | dc | 10 | 🎨 |

Each phrase tuple: `[id, japanese, romaji, english, category, contextNote, isMissionCritical?]`

- **25+ confused phrase pairs**: Structural discrimination drills
- **10 grammar patterns**: Auto-unlocking from phrase progress

### Phrase Breakdowns (`phraseBreakdowns.js`)
```js
"f1": [
  ["これ", "kore", "this", "noun"],
  ["を", "o", "object marker", "particle"],
  ["ください", "kudasai", "please give", "verb"]
]
```
Grammar types: particle, noun, verb, adjective, expression, counter, copula, suffix, question

### Interactive Segments (`PhraseSegments.jsx`)
- Color-coded by grammar type (particles=gold, nouns=blue, verbs=green, etc.)
- Hover/tap shows tooltip with meaning, romaji, grammar type
- Used in learn cards, correct answer reveals, phrase detail views

### Japan Map (`JapanMap.jsx` + `regions.js`)
Interactive map of all 47 prefectures grouped into 8 regions:
- Each region: cities, food specialties, cultural highlights, travel tips, linked phrases
- Visiting all 8 regions earns "Explorer" badge

---

## Vocab tab (`VocabBrowser.jsx`)

Calm-mode review surface. **Telemetry only — never writes FSRS / boxes.** Keeps the Learn tab the authoritative SRS source.

Three modes share the same page via a header pill:

### Browse
- Phrases at box ≥ 1, grouped by category (CATS order). Each section header is a real `<button>` with an SVG chevron — collapsed state persists in `localStorage["vocab-collapsed"]`.
- Filter chips: All / Learning (box 1-2) / Mastered (box 3+).
- Row layout (big and readable):
  - JP `T.xxl` desktop / `T.xl` mobile, `fontJa`, `JP.weight`
  - Romaji `T.sm` `mono` `c.ro`
  - EN `T.md` `c.m2`
- Listen affordance: `PlayButton size="lg"` at the right. Default opacity `.35`, full opacity on row hover (desktop), full opacity always on touch (`@media (hover: none)`).

### Test
- EN → JP self-test pulled from filtered learned-phrase pool, shuffled once on entry.
- Active flashcard sits visually centred via `position: sticky; bottom: 28vh` (mobile `20vh`). Answered cards push above it as a history list — the active card stays anchored so the user only scrolls UP to review.
- Tap card to flip → JP + romaji + EN + auto-play `speakPhraseWithEnglish`. Three actions: `Missed` / `Replay` / `Knew it`. Esc cancels focus.
- History row is compact (one line: ✓/✗ + JP + EN + replay button).
- Telemetry: `vocab_test_open`, `vocab_test_attempt { id, knewIt }`.

### Build
- Pool of every unique segment from learned phrases (deduped on jp+meaning), grouped by grammar type — type-filter chips above the pool with counts.
- Tap chip → drop on canvas. Tap canvas chip → remove. Live EN gloss preview (`builtChips.map(c => c.meaning).join(" + ")`).
- `Hear it` plays `speak(builtJp)` via raw TTS. `Save` persists up to 20 sentences in `localStorage["vocab-built-sentences"]`. Saved sentences list with replay + delete.
- Telemetry: `vocab_build_open`, `vocab_build_add`, `vocab_build_speak`, `vocab_build_save`.
- Empty state when no phrases learned yet.

---

## Web tab — interactive node graph (`Web.jsx` + `web/usePhysics.js`)

Full-bleed force-directed visualisation of the user's learned content. **No SRS writes** — pure visual aid for understanding connections. **No emojis anywhere** — identity is the language; header is `フレーズ` or `ぶひん`, all node labels are JP segments themselves.

### Two views

| View                | Nodes                                                          | Edges                                                              |
|---------------------|----------------------------------------------------------------|--------------------------------------------------------------------|
| **Phrases (`フレーズ`)** | Learned phrases. Fill alpha = SRS box.                         | Typed (see taxonomy below).                                         |
| **Blocks (`ぶひん`)**   | Unique segments in ≥2 learned phrases. Size = usage count. Colour = grammar type. Fill alpha = avg box of containing phrases. | Co-occurrence: two segments that appear in the same parent phrase. |

### Edge taxonomy (Phrases view)

Each edge has a `kind` and `label`. The label renders mid-edge (via `<foreignObject>`) when one of the endpoints is focused.

| Kind        | Style              | Source                                                                 | Example label   |
|-------------|--------------------|------------------------------------------------------------------------|-----------------|
| `shared`    | blue, dashed       | Pair shares a non-trivial building block (segment used in 2..6 phrases). `TRIVIAL_SEGMENTS` filters です/ます/は/が/を/に/の/で/と/か. | `ください`      |
| `template`  | green, solid       | Both phrases end with the same verb in `TEMPLATE_OK` (ください, あります, おねがいします, etc). | `～ください`    |
| `opposite`  | amber, solid       | Curated `ANTONYM_PAIRS` (15 pairs: おおきい↔ちいさい, あつい↔さむい, とおい↔ちかい, みぎ↔ひだり, きょう↔あした, etc). | `opposite`      |
| `answer`    | pink, dotted       | Curated `QNA_PAIRS` (14 pairs: どこですか → みぎ/ひだり/まっすぐ, いくらですか → ___ えんです, etc). | `Q ↔ A`         |

### Learning-aid overlay

Visualisation isn't decoration — it teaches:

- Phrase node fill alpha computed by `alphaForBox(box)`: dim grey at box 0, full saturation at box 5. Glance-readable mastery map.
- Pulsing gold ring on items where `next < Date.now()` (due for review). CSS keyframe `webPulse`.
- Block nodes: avg-box drives saturation; usage drives radius. Dense central segments = central to your repertoire.

### Physics (`web/usePhysics.js`)

Velocity-Verlet integration, no deps, ~120 lines:

1. Centre gravity (gentle): `v += (centre - pos) * 0.0008`
2. Pairwise repulsion (Coulomb-like, O(n²)): `f = 1500 / (r² + 16)` with 1/r normalising
3. Edge springs: `f = (d - target) * 0.04`
4. Damping: `v *= 0.85`
5. Perpetual jitter: tiny random nudge so settled graph still feels alive
6. Cool-down: kinetic energy < 0.5 for 60 frames → sleep. Wake on interaction.

Exposed: `{ tick, wake, pin(idx, x, y), unpin(idx) }`. Runs `requestAnimationFrame` loop while enabled.

### Pan + zoom + drag

- Wheel zooms anchored at cursor (clamped to `[0.4, 4]`).
- Pointerdown on background → window-level pointermove/up listeners adjust `transform.x/y` (no `setPointerCapture` — that broke per-node click events).
- Pointerdown on a node → 4px movement threshold splits drag from click. Drag pins node; release unpins so physics absorbs the new position.
- Touch-friendly: pointer events are unified across mouse + touch.

### Focus mode

Tap node → `focusId` set. Selected node enlarges + drop-shadow in its colour. Connected nodes/edges highlight; everything else fades to ~18%. Connected edges animate with `stroke-dasharray: 6 4; animation: webDashFlow 1s linear infinite`. Esc clears.

### Detail panel

Bottom-right floating card (re-flows full-width on mobile), `backdrop-filter: blur(14px)`. Big text:

- JP hero rendered via `PhraseSegments` so each word is a tappable colour-coded chip with per-word meaning + romaji on tap (matches Learn-exercise affordance).
- Romaji `T.sm`, EN `T.md`, pills `T.sm`.
- SRS pills: box, last review (human-relative), next review, weak-skill chip if any dim < 3.
- "Why connected?" grouped by edge kind with coloured section headers (`OPPOSITE`, `SAME TEMPLATE`, `SHARES`, `Q ↔ A`). Each entry is a clickable card (JP `T.lg`, EN under, connector pill on the right) that refocuses the graph to that node.
- Empty state copy when focused phrase has no recorded connections.

### Telemetry
`web_open`, `web_view_change { from, to }`, `web_node_click { mode, id }`.

---

## Audio System

| What | Source | Voice | Runtime/Static |
|------|--------|-------|-----------------|
| Kana pronunciation | Google Translate | Google JP | Runtime via `/api/tts` |
| Mnemonic stories | ElevenLabs | Matilda | Static `/audio/story3/{hex}.mp3` |
| Phrase pronunciation | ElevenLabs | Lily | Static `/audio/phrase/{id}.mp3` |
| Row explanations | ElevenLabs | Lily | Static `/audio/rows/{id}.mp3` |

**Why two systems?**
- Google TTS better for single kana (always natural)
- ElevenLabs better for longer content (warm, natural voice quality)

### Audio Playback
- **Kana**: `speak(char)` → `/api/tts?lang=ja`
- **Story chain**: JP pronunciation → Matilda story → JP again (preloaded)
- **Phrase**: `/audio/phrase/{id}.mp3`, fallback to Google TTS
- **Phrase with English**: `speakPhraseWithEnglish(id, jp, en)` — plays JP, then English via TTS
- `_ttsAudio` module-level var tracks currently playing audio
- `stopAudio()` kills audio on navigation (prevents overlap)

### File Naming
- Stories: `public/audio/story3/{hex_codepoint}.mp3` (あ = U+3042 → `3042.mp3`)
- Phrases: `public/audio/phrase/{phrase_id}.mp3` (e.g. `g1.mp3`, `f3.mp3`)

---

## API Endpoints

All use Clerk JWT auth.

| Endpoint | Method | AI Model | Purpose |
|----------|--------|----------|---------|
| `/api/chat` | POST | Claude Sonnet | Senpai AI tutor chat |
| `/api/coach` | POST | Claude Sonnet | Session planning + performance review |
| `/api/story` | POST | Claude Sonnet | AI-generated stories, known phrases |
| `/api/conversation` | POST | Claude Sonnet | Branching dialogue scenarios |
| `/api/mnemonic` | POST | Claude Sonnet | Personalised kana mnemonics |
| `/api/sync` | GET/POST | — | DB read/write user data |
| `/api/tts` | GET | — | Google Translate TTS proxy |

---

## Environment Variables

### Vercel (production)
- `ANTHROPIC_API_KEY` — Claude API (all AI endpoints)
- `DATABASE_URL` — Neon PostgreSQL connection string
- `CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` — auth

### Local / Scripts
- `ELEVENLABS_API_KEY` — for `generate-audio.mjs` (one-time)
- Voice IDs: `VOICE_JA` (Lily: `pFZP5JQG7iQjIQuC4Bku`), `VOICE_EN` (Matilda: `XrExE9yKIg1WjnnlVkGX`)

---

## Known Gotchas & Past Bugs

1. **Hooks at component top**: All `useState`/`useRef` at component top level, NEVER inside JSX vars, conditionals, render blocks. Caused multiple blank-screen crashes.
2. **`save()` null spread**: `setD(prev => {...prev, ...u})` crashes when `prev` is null. Use `{...defaultD(), ...prev, ...u}`.
3. **Clerk routing**: Must use `routing="virtual"`. Don't pass `signInUrl`/`signUpUrl` props.
4. **Google TTS CORS**: Must proxy through `/api/tts.js`. Cannot call Google Translate directly from browser.
5. **ElevenLabs language_code**: Must pass `language_code: "ja"` and `apply_language_text_normalization: true` for Japanese audio.
6. **Audio overlap**: Call `stopAudio()` when navigating between cards. `_ttsAudio.src = ""` before releasing.
7. **`migrate()` phr guard**: Always include `phr: raw.phr || {}` — old data may not have phr field.
8. **Tooltip flickering**: PhraseSegments needs z-index on spans above mobile dismiss overlay.
9. **Variable TDZ errors**: When reorganizing code, declare vars before first use (especially `sessionEngine.js`).
10. **Pull before push**: Game module AI chat works simultaneously. Always `git stash && git pull --rebase && git stash pop` before committing.
11. **recentPhrases filter**: Must use `d.next` not `p.next` — `p` is phrase tuple, not SRS data. Bug made filter always empty, caused cross-session repetition.
12. **Box 0 invisible items**: `stabilityToBox()` minimum return is box 1. Box 0 reserved for truly unseen — else items with data but box 0 become neither "due" nor "unseen".
13. **sessionCount scoping**: `sessionCount` must be declared at top of done-screen useEffect, not inside `.then()` callback. Wrong scoping caused ReferenceError crash on done screen.
14. **Specials-first architecture**: Session engine reserves 2-3 slots for specials (pattern-assembly, grammar, confused pairs) BEFORE reviews. Old: reviews filled queue first, starved specials.
15. **Production bonus**: FSRS gives 15% stability bonus for production types (kana-reverse, phrase-reverse, phrase-production, pattern-assembly). Defined in `PRODUCTION_TYPES` set, `fsrs.js`.
16. **Don't use `setPointerCapture` in delegated SVG click handlers**. It moves the click target to the capturing element, so `e.target.closest("[data-node-idx]")` returns null. Web tab dead-clicks bug; fixed by using window-level pointermove/up listeners instead.
17. **Conversation `convoShuffledRef` keying**: must include `convo.id` not just `ci`, otherwise the option pool from a previous card's conversation can leak into a new conversation that lands at the same `ci`.
18. **Conversations: NPC text is kana-only**. Numerals stay as digits. No kanji unless no kana alternative exists. Ditto in any data file the user actually reads — kanji is a separate skill for later.
19. **Conversation grading**: every blank supports `alsoOkIds: []`. Real conversations have multiple valid responses (cash/card/no-bag/no-receipt all reasonable after "200 yen"). Picking any acceptable id grades as correct. Canonical id is still surfaced as "most natural" in feedback.
20. **Don't extend SmartSession.jsx**. New exercise types go in `src/components/SmartSession/exercises/` with an entry in `registry.js`. The legacy if-chain is admitted tech debt.
21. **Don't re-introduce small text on review/detail surfaces**. Body text minimum `T.md`. JP hero in detail panels `T.xxl`. The user has called out small text twice — apply the lesson.
22. **No emojis in language-identity surfaces**. Web tab and Vocab Build use JP labels everywhere (`フレーズ`, `あいさつ`, segment text). Emoji is fine in dashboard / nav / mode chips where it's not the primary identity.

---

## Style Conventions

- All styles inline objects. No CSS files, no CSS-in-JS libraries. (Exception: per-component scoped CSS injected once via `ensureSessionStyles()` / `ensureWebStyles()` / `ensureVocabStyles()` for things only CSS can do — keyframes, hover-only opacity, `@media (hover: none)` rules.)
- Colors from `c` object (theme-aware): `c.bg`, `c.tx`, `c.a` (accent/red), `c.g` (green), `c.go` (gold), `c.m` (muted), `c.s` (surface), `c.s2` (surface2), `c.b` (border). Speaker / grammar / role colours come from constants: `SPEAKER_COLORS`, `GRAMMAR_COLORS`, `ROLE_AVATARS`.
- **Typography**: Use `T` constants from `constants.js` — single source of truth:
  - `T.xs` (11) — tiny labels, grammar tags
  - `T.sm` (13) — small labels, secondary info, romaji in mono
  - `T.base` (15) — body text where space is tight
  - `T.md` (17) — **default body text on review / detail surfaces**
  - `T.lg` (20) — Japanese text (mobile body), section content
  - `T.xl` (24) — Japanese text (desktop body), Vocab Browse JP mobile
  - `T.xxl` (32) — hero text, big kana display, JP hero in detail panels
  - `T.huge` (48) — single character display
- **Body text minimum `T.md` on review surfaces.** Detail panels, Vocab rows, anything the user reads more than once should never go below `T.md`. `T.xs/T.sm` for labels and ephemeral metadata only.
- Font: `font` = Noto Sans JP / system font stack. `mono` = monospace stack. `fontJa` for Japanese text.
- **Reveal motion**: use `.ts-reveal` (300ms fade + 4px slide-up) and `.ts-reveal-fast` (150ms) classes from `ensureSessionStyles()`. Don't roll your own per-component.
- Mobile-first, responsive at 768px breakpoint.
- Pointer events (`onPointerDown` etc) preferred over mouse events for unified mouse + touch.

### UX patterns proven in this codebase (reuse when applicable)

- **Listen-on-hover affordance** — see VocabBrowser. Default `opacity: .35`, `:hover` → `1`, `@media (hover: none)` → `1`. Avoids cluttering the list while keeping the affordance discoverable.
- **Sticky-centered flashcard** — see VocabBrowser Test mode. Wrap active card in `position: sticky; bottom: 28vh` (mobile `20vh`). Stays anchored at viewport centre as a history list grows above.
- **Focus-mode pattern** — see Web. Selected item enlarges + coloured drop-shadow; connected items highlight; others fade to ~18%; connected edges animate via `stroke-dasharray` + `dashoffset`.
- **Edge labels in SVG** — use `<foreignObject>` containing an HTML `<div>` for the label background. Inherits font/colour tokens cleanly and keeps text legible over a busy graph.
- **JP hero uses PhraseSegments in detail panels.** Don't render bare JP strings on review surfaces — segment them with PhraseSegments so each word is colour-coded and tappable for meaning.
- **No emojis in language-identity surfaces.** Web headers, category nodes, Build chips: JP all the way.
- **Force-directed > radial** for graphs the user explores. Settles into structure-revealing clusters.
- **Telemetry-only review surfaces.** Vocab Test and Web record `track(...)` events but never write FSRS / boxes — Learn tab stays the authoritative SRS surface.

---

## Game Module (`src/game/`)

Katana Zero-inspired side-scroller — **managed by separate AI chat**. Don't modify unless you're that chat.

- 10 rooms, 1-hit kill, 3-hit slash combo
- Wall jumping, dashing, slow-motion focus
- Sprite-based animations with gray-bg removal
- Canvas rendering with particle effects, screen shake, scanlines
