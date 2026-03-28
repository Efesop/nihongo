# TinySenpai — Architecture Guide

A Japanese learning app (kana + phrases + AI tutor + game) built as a single-page React app deployed on Vercel.

**Live:** [tinysenpai.com](https://tinysenpai.com)

---

## Product Vision

TinySenpai is the **fastest, most effective way to learn Japanese** — for complete beginners and beyond. It is NOT a traditional textbook app. Key principles:

- **Phrases over isolated words** — learn grammar organically through real sentences
- **Use whatever method works best**, not what's traditional. Mnemonic images, audio chains, trick questions — whatever locks it in.
- **Mnemonics are everything** for kana. Every character has a vivid visual story (apple for あ, boxer for う). Story audio pre-generated with ElevenLabs (Matilda voice).
- **FSRS-5 drives all review**. Adaptive spaced repetition — per-item stability and difficulty tracking, 85% target retention.
- **Audio is first-class**. Japanese pronunciation from Google TTS. English stories from ElevenLabs. Phrases from ElevenLabs.
- **Smart Sessions** — AI-powered adaptive learning with coaching, stories, branching conversations, confused pair drilling, productive failure, and cross-category variety.
- **The AI tutor (Senpai)** is a harsh sensei character who knows the user's progress, trip date, and learning context. Roleplay scenarios, grammar explanations, personalised mnemonics.
- **Mobile-first** but works great on desktop with sidebar navigation.

---

## Deployment & Commands

```bash
# Deploy to production
npx vercel --prod

# Or just push to main — Vercel auto-deploys

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
| TTS | Google Translate proxy (`/api/tts`) for Japanese, ElevenLabs pre-generated static MP3s for stories + phrases |
| SRS | FSRS-5 (Free Spaced Repetition Scheduler) with 6-box backward compatibility |

---

## File Structure

```
src/
  App.jsx                — State management, SRS, XP/levels, badges (~695 lines)
  main.jsx               — Entry point, ClerkProvider wrapper

  components/
    SmartSession.jsx     — Adaptive learning engine (largest: ~1485 lines, 18 exercise types)
    PhraseBank.jsx       — Phrase browsing, 4 quiz modes
    KanaTrainer.jsx      — Kana learn/quiz/results
    Home.jsx             — Dashboard, stats, review cards
    JapanMap.jsx         — Interactive Japan map (8 regions, travel tips, linked phrases)
    PhraseSegments.jsx   — Interactive word-by-word breakdowns
    SenpaiChat.jsx       — AI tutor chat + roleplay
    DailyDrill.jsx       — Mixed kana+phrase daily drill
    Onboarding.jsx       — 3-step onboarding flow
    Profile.jsx          — Profile modal, sync status
    Layout.jsx           — Sidebar (desktop) + bottom nav (mobile)

  data/
    kana.js              — M (mnemonics), H_GROUPS, K_GROUPS, ROMAJI, DAKUTEN_BASE, YOON_PARTS
    phrases.js           — 100 phrases, CATS, CAT_ICONS, CAT_COLORS (11 categories)
    phraseBreakdowns.js  — Word-by-word breakdowns: [japanese, romaji, meaning, grammar_type]
    conversations.js     — Fill-in-the-blank dialogue scenarios
    confusedPairs.js     — 17 visually similar kana pairs (シ/ツ, は/ほ, etc.) with hints
    confusedPhrases.js   — 25+ structurally similar phrase pairs with hints
    grammarPatterns.js   — 10 grammar patterns that auto-unlock from phrase progress
    kanaWords.js         — Real vocabulary context words for 46 kana characters
    regions.js           — Japan map data (8 regions, cities, food, culture, linked phrases)
    themes.js            — Dark/light theme color objects
    constants.js         — SRS_DAYS, fonts, RP_SCENARIOS, LEVEL_THRESHOLDS

  utils/
    fsrs.js              — FSRS-5 implementation (stability, difficulty, retrievability)
    sessionEngine.js     — Smart session queue builder (~546 lines)
    audio.js             — TTS playback functions (speak, speakPhrase, speakPhraseWithEnglish)
    storage.js           — localStorage + Neon DB sync (debounced)
    helpers.js           — shuffle, daysUntil

  game/                  — Side-scroller game module (separate chat, don't touch)
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
  story.js               — AI story generation using known phrases
  conversation.js        — AI branching dialogue scenarios
  mnemonic.js            — Personalised mnemonic generation

scripts/
  generate-audio.mjs     — ElevenLabs audio generation (one-time)

public/
  audio/
    story3/              — ACTIVE: English mnemonic stories (Matilda, 92 files)
    phrase/              — ACTIVE: Japanese phrase audio (Lily, 100 files)
    rows/                — ACTIVE: Row-level dakuten/yōon explanations (Lily, 16 files)
    kana/, kana2/, story/, story2/  — Legacy backups (not used)
  images/
    mnemonics/approved/  — Kana mnemonic images (hiragana/ + katakana/)
    tinysenpai/          — Game sprites (run, slash, jump, death, etc.)
    phrases/             — Category scene images
```

---

## Smart Session Engine

The core learning experience. `SmartSession.jsx` + `sessionEngine.js` work together:

### Session Building (`sessionEngine.js` — ~546 lines)

Builds adaptive 10-card exercise sessions through a multi-stage pipeline:

#### Stage 1: Gather Items by Priority
1. **Error patterns** — items with 5+ errors get priority drilling
2. **Help-requested** — items the user asked Senpai about
3. **Due for review** — all items past their FSRS due date (any box including 0)
4. **Struggling** — box 0-2 items that are due
5. **Recently learned** — box 0-1 items reviewed in last 2 hours (same-session reinforcement)
6. **Unseen** — new items never studied

#### Stage 2: Build the Queue
1. Help-requested items (up to 2 kana, 1 phrase)
2. Frequent error items (up to 2 kana, 1 phrase)
3. Easy wins — 1-2 high-box due items for confidence
4. Due items — up to 4 kana + 3 phrases
5. Recently learned — max 1 each (prevents cross-session repetition)
6. Maintenance kana — high-box items pulled in when too few kana in queue
7. **Productive failure** — quiz BEFORE teaching new items:
   - `try-first-kana` → delayed `learn-card` (2+ cards later)
   - `try-first-phrase` → delayed `learn-phrase` (2+ cards later)
8. Filler slots from remaining due/unseen items

#### Stage 3: Guaranteed Specials (variety every session)
- **Confused kana pair** — always 1 if 20+ kana learned (17 pairs available)
- **Confused phrase pair** — always 1 if 5+ phrases learned (25+ pairs available)
- **Grammar pattern** — always 1 if unlocked (10 patterns)
- **Reverse/production** — always 1 phrase-reverse if box 2+ available
- **Story** — AI-generated narrative (25% chance, needs 3+ phrases)
- **Branching convo** — interactive AI dialogue (20% chance, needs 8+ phrases)
- **Fill-in-the-blank conversation** — scripted dialogue (40% chance, needs 5+ phrases)

#### Stage 4: Interleaving
Final queue pass alternates kana and phrase exercises to prevent clustering. Special exercises (grammar, stories, convos, confused pairs) are woven in every ~4 cards.

#### Smart Phrase Ordering
New phrases are ordered by: mission-critical first (+100 score), known building blocks (+15 per familiar word fragment), cross-category interleaving (no 3+ from same category in a row).

### Exercise Type Selection

Exercise types are chosen based on SRS box level + multi-dimensional skill tracking:

**Skill-based routing**: Each item tracks `visual`, `listen`, `production` scores (0-5). If an item has 3+ total tests, the weakest skill gets prioritised.

**Default progression** (when skill data is sparse):

| Box | phrase-scenario | phrase-listen | phrase-reverse | phrase-production |
|-----|----------------|---------------|----------------|-------------------|
| 0 | 75% | 25% | — | — |
| 1 | 35% | 35% | 30% | — |
| 2 | 25% | 25% | 25% | 25% |
| 3+ | — | 10% | 60% | 30% |

Key design: production/reverse exercises appear from box 1 (not delayed until box 2-3) to combat the recognition-production gap.

### 18 Exercise Types

| Type | Description | When |
|------|-------------|------|
| `learn-card` | New kana: mnemonic image + story audio + context words | New kana |
| `learn-phrase` | New phrase: breakdown + building block connections | New phrase |
| `try-first-kana` | Productive failure: quiz BEFORE revealing kana | New kana |
| `try-first-phrase` | Productive failure: "what would you say?" before reveal | New phrase |
| `kana-visual` | See character, type romaji | Box 0+ |
| `kana-listen` | Hear character, type romaji | Box 1+ |
| `kana-reverse` | See romaji, pick character (production) | Box 2+ |
| `kana-pair` | Confused pair discrimination: "which is shi?" | 20+ kana |
| `phrase-scenario` | Conversational context, 8 choices + "none of these" | Box 0+ |
| `phrase-listen` | Hear phrase, identify meaning from choices | Box 0+ |
| `phrase-reverse` | See English + context, pick Japanese | Box 1+ |
| `phrase-production` | English → pick from 8 Japanese choices | Box 2+ |
| `phrase-pair` | Confused phrases: distinguish similar structures | 5+ phrases |
| `leech-review` | Special mnemonic treatment for items with 5+ errors | 5+ errors |
| `grammar-pattern` | Auto-unlocked grammar insight | 5+ phrases |
| `conversation` | Fill-in-the-blank scripted dialogue | 5+ phrases |
| `story` | AI-generated narrative using known phrases | 3+ phrases |
| `branch-convo` | Interactive AI dialogue tree | 8+ phrases |

### Response Time Tracking
Every answer records milliseconds to respond (`getResponseMs()`). Used for:
- Adaptive auto-advance timing on kana exercises (fast <2s = 1.5s display, normal = 2.5s, slow >5s = 4s)
- Phrase exercises use manual "Next →" button instead of auto-advance (prevents audio cutoff)
- Stored in `answerLog` for future AI analysis

### Senpai Mascot
- Circular avatar at bottom of session screen
- Hover for quips, click for floating chat (can ask about current exercise)
- Performance grades: S/A/B/C with different sprites
- Typewriter text animation for speech bubbles
- Items discussed in chat get flagged via `helpRequested` for priority review

---

## SRS System

### FSRS-5 (`utils/fsrs.js`)
Implements Free Spaced Repetition Scheduler:

- **Stability (S)**: Time until recall drops to 90%
- **Difficulty (D)**: Per-item difficulty (1-10 scale)
- **Retrievability (R)**: Current probability of recall
- **Target**: 85% retention rate
- **Intervals**: Auto-calculated from stability curve
- **`lastReview`**: Timestamp of last review — used for elapsed time and 2-hour recently-learned window

Maps to 6-box system (0-5) for backward compatibility via `stabilityToBox()`. Box 0 is reserved for truly new items (minimum return is box 1 after first review).

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
  errors: { [itemId]: number },        // wrong-answer count per item (leech detection at 5+)
  skills: { [itemId]: { visual: 0-5, listen: 0-5, production: 0-5 } },
  answerLog: [{ item, correct, type, ts, ms }],  // rolling buffer, last 200 answers
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
Each item independently tracks three skill dimensions:
- **Visual**: kana-visual, phrase-scenario exercises
- **Listen**: kana-listen, phrase-listen exercises
- **Production**: kana-reverse, phrase-reverse, phrase-production exercises

Correct: +1 (max 5). Wrong: -1 (min 0). After 3+ total tests, exercises are routed to the weakest skill.

Skill map:
```js
{ "kana-visual": "visual", "kana-listen": "listen", "kana-reverse": "production",
  "kana-pair": "visual", "phrase-scenario": "visual", "phrase-listen": "listen",
  "phrase-production": "production", "phrase-reverse": "production" }
```

### XP & Levels
11-tier leveling system: `[0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500]`

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
2. Writes to localStorage immediately
3. Debounces (1.5s) then syncs to Neon DB via `/api/sync`
4. On load: DB is source of truth, falls back to localStorage

---

## Confused Pairs & Phrases

### Kana Confused Pairs (`confusedPairs.js` — 17 pairs)
Visually similar kana characters with discrimination hints:
- Katakana: シ/ツ, ソ/ン, ノ/メ, ク/タ, ウ/ワ, コ/ユ, ア/マ, ヌ/ス
- Hiragana: は/ほ, き/さ, わ/れ, ね/れ, め/ぬ, る/ろ, い/り
- Dakuten: は/ば, か/が

Exercise: "Which one is **shi**?" — shows both characters as large buttons, reveals hint after answering.

### Confused Phrase Pairs (`confusedPhrases.js` — 25+ pairs)
Structurally similar phrases with different meanings:
- **Particle confusion**: これをください vs これはいくらですか (を vs は changes "give me" to "how much")
- **Same pattern, different noun**: えきはどこですか vs トイレはどこですか
- **Request styles**: ～をください (things) vs ～てください (actions)
- **Payment methods**: カードで vs げんきんで
- **Adjective opposites**: あつい/さむい, たかい/やすい, とおい/ちかい
- **Verb patterns**: たべたいです vs のみたいです vs いきたいです
- **Polarity**: わかります vs わかりません

Exercise: "Which one means **How much is this?**" — shows both phrases, reveals hint explaining the key structural difference.

---

## Grammar Patterns (`grammarPatterns.js` — 10 patterns)

Auto-unlock based on phrase progress. Implements Schmidt's Noticing Hypothesis — explicit attention to patterns after implicit exposure.

| Pattern | Meaning | Unlocks when |
|---------|---------|-------------|
| ～をください | "please give me ~" | 3+ phrases with this pattern learned |
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
- **46 kana context words**: Real vocabulary shown on learn cards (e.g. あ → あめ "rain")
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
- Used in learn cards, correct answer reveals, and phrase detail views

### Japan Map (`JapanMap.jsx` + `regions.js`)
Interactive map of all 47 prefectures grouped into 8 regions:
- Each region has: cities, food specialties, cultural highlights, travel tips, linked phrases
- Visiting all 8 regions earns the "Explorer" badge

---

## Audio System

| What | Source | Voice | Runtime/Static |
|------|--------|-------|-----------------|
| Kana pronunciation | Google Translate | Google JP | Runtime via `/api/tts` |
| Mnemonic stories | ElevenLabs | Matilda | Static `/audio/story3/{hex}.mp3` |
| Phrase pronunciation | ElevenLabs | Lily | Static `/audio/phrase/{id}.mp3` |
| Row explanations | ElevenLabs | Lily | Static `/audio/rows/{id}.mp3` |

**Why two systems?**
- Google TTS better for single kana characters (always natural)
- ElevenLabs better for longer content (warm, natural voice quality)

### Audio Playback
- **Kana**: `speak(char)` → `/api/tts?lang=ja`
- **Story chain**: JP pronunciation → Matilda story → JP pronunciation again (preloaded)
- **Phrase**: `/audio/phrase/{id}.mp3`, fallback to Google TTS
- **Phrase with English**: `speakPhraseWithEnglish(id, jp, en)` — plays JP then speaks English via TTS
- `_ttsAudio` module-level variable tracks currently playing audio
- `stopAudio()` kills audio on navigation (prevents overlap)

### File Naming
- Stories: `public/audio/story3/{hex_codepoint}.mp3` (あ = U+3042 → `3042.mp3`)
- Phrases: `public/audio/phrase/{phrase_id}.mp3` (e.g. `g1.mp3`, `f3.mp3`)

---

## API Endpoints

All use Clerk JWT authentication.

| Endpoint | Method | AI Model | Purpose |
|----------|--------|----------|---------|
| `/api/chat` | POST | Claude Sonnet | Senpai AI tutor chat |
| `/api/coach` | POST | Claude Sonnet | Session planning + performance review |
| `/api/story` | POST | Claude Sonnet | AI-generated stories using known phrases |
| `/api/conversation` | POST | Claude Sonnet | Branching dialogue scenarios |
| `/api/mnemonic` | POST | Claude Sonnet | Personalised kana mnemonics |
| `/api/sync` | GET/POST | — | Database read/write user data |
| `/api/tts` | GET | — | Google Translate TTS proxy |

---

## Environment Variables

### Vercel (production)
- `ANTHROPIC_API_KEY` — Claude API (all AI endpoints)
- `DATABASE_URL` — Neon PostgreSQL connection string
- `CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` — auth

### Local / Scripts
- `ELEVENLABS_API_KEY` — for `generate-audio.mjs` (one-time generation)
- Voice IDs: `VOICE_JA` (Lily: `pFZP5JQG7iQjIQuC4Bku`), `VOICE_EN` (Matilda: `XrExE9yKIg1WjnnlVkGX`)

---

## Known Gotchas & Past Bugs

1. **Hooks at component top**: All `useState`/`useRef` must be declared at component top level, NEVER inside JSX variables, conditionals, or render blocks. This has caused multiple blank-screen crashes.
2. **`save()` null spread**: `setD(prev => {...prev, ...u})` crashes when `prev` is null. Always use `{...defaultD(), ...prev, ...u}`.
3. **Clerk routing**: Must use `routing="virtual"`. Don't pass `signInUrl`/`signUpUrl` props.
4. **Google TTS CORS**: Must proxy through `/api/tts.js`. Cannot call Google Translate directly from browser.
5. **ElevenLabs language_code**: Must pass `language_code: "ja"` and `apply_language_text_normalization: true` for Japanese audio.
6. **Audio overlap**: Call `stopAudio()` when navigating between cards. `_ttsAudio.src = ""` before releasing.
7. **`migrate()` phr guard**: Always include `phr: raw.phr || {}` — old data may not have phr field.
8. **Tooltip flickering**: PhraseSegments needs z-index on spans above the mobile dismiss overlay.
9. **Variable TDZ errors**: When reorganizing code, ensure variables are declared before first use (especially in `sessionEngine.js`).
10. **Pull before push**: Another AI chat works on the game module simultaneously. Always `git stash && git pull --rebase && git stash pop` before committing.
11. **recentPhrases filter**: Must use `d.next` not `p.next` — `p` is the phrase tuple, not SRS data. This bug made the filter always empty, causing cross-session repetition.
12. **Box 0 invisible items**: `stabilityToBox()` minimum return is box 1. Box 0 is reserved for truly unseen items — otherwise items with data but box 0 become neither "due" nor "unseen".

---

## Style Conventions

- All styles are inline objects. No CSS files, no CSS-in-JS libraries.
- Colors always from `c` object (theme-aware): `c.bg`, `c.tx`, `c.a` (accent/red), `c.g` (green), `c.go` (gold), `c.m` (muted), `c.s` (surface), `c.s2` (surface2), `c.b` (border)
- Font: `font` variable = Noto Sans JP / system font stack. `mono` = monospace stack.
- Mobile-first, responsive at 768px breakpoint.
- Hover states via `onMouseEnter`/`onMouseLeave`.

---

## Game Module (`src/game/`)

Katana Zero-inspired side-scroller — **managed by a separate AI chat**. Do not modify unless you're that chat.

- 10 rooms, 1-hit kill, 3-hit slash combo
- Wall jumping, dashing, slow-motion focus
- Sprite-based animations with gray-bg removal
- Canvas rendering with particle effects, screen shake, scanlines
