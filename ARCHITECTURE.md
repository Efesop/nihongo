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
- **Smart Sessions** — AI-powered adaptive learning with coaching, stories, branching conversations, and cross-category variety.
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
| Frontend | React 18 SPA (Vite), ~18 source files across components/data/utils |
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
  App.jsx                — State management, orchestration, SRS logic (~616 lines)
  main.jsx               — Entry point, ClerkProvider wrapper

  components/
    SmartSession.jsx     — Adaptive learning engine (largest: ~990 lines)
    PhraseBank.jsx       — Phrase browsing, 4 quiz modes (~395 lines)
    KanaTrainer.jsx      — Kana learn/quiz/results (~320 lines)
    Home.jsx             — Dashboard, stats, review cards
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
    themes.js            — Dark/light theme color objects
    constants.js         — SRS_DAYS, fonts, RP_SCENARIOS

  utils/
    fsrs.js              — FSRS-5 implementation (stability, difficulty, retrievability)
    sessionEngine.js     — Smart session queue builder (~320 lines)
    audio.js             — TTS playback functions (speak, speakPhrase, speakPhraseWithEnglish)
    storage.js           — localStorage + Neon DB sync (debounced)
    helpers.js           — shuffle, daysUntil

  game/                  — Side-scroller game module (8 files, separate chat)
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

### Session Building (`sessionEngine.js`)
Builds adaptive 10-card exercise sessions:

1. **Priority Queue**: due items → struggling (box 1-2) → new content
2. **Smart Phrase Ordering**: mission-critical first (+100), known building blocks (+15), cross-category interleaving
3. **Exercise Types**:
   - `learn-card` — new kana with mnemonic image + story
   - `learn-phrase` — new phrase with breakdown + "you already know" connections
   - `kana-visual` — see character, type romaji
   - `kana-listen` — hear character, type romaji
   - `phrase-scenario` — conversational context, 8 choices + "none of these"
   - `phrase-listen` — hear phrase, identify meaning
   - `phrase-production` — English → type romaji (8 choices)
   - `conversation` — fill-in-the-blank dialogue
   - `story` — AI-generated narrative (25% chance)
   - `branch-convo` — interactive dialogue tree (20% chance)
4. **Difficulty Modifier**: adjusts based on session performance
5. **AI Coaching**: pre-session plan + post-session review via `/api/coach`

### Senpai Mascot
- Circular avatar at bottom of session screen
- Hover for quips, click for floating chat
- Performance grades: S/A/B/C with different sprites
- Typewriter text animation for speech bubbles

---

## SRS System

### FSRS-5 (`utils/fsrs.js`)
Implements Free Spaced Repetition Scheduler:

- **Stability (S)**: Time until recall drops to 90%
- **Difficulty (D)**: Per-item difficulty (1-10 scale)
- **Retrievability (R)**: Current probability of recall
- **Target**: 85% retention rate
- **Intervals**: Auto-calculated from stability curve

Maps to 6-box system (0-5) for backward compatibility via `stabilityToBox()`.

### Data Shape
```js
{
  kana: { [char]: { box: 0-5, next: timestamp, stability?, difficulty? } },
  phr: { [phraseId]: { box: 0-5, next: timestamp, stability?, difficulty? } },
  sessions: number,
  totalC: number,
  streak: number,
  lastDay: "Mon Mar 24 2026",
  started: ISO string,
  onboarded: boolean,
  onboarding: { why, level, focus, tripDate }
}
```

### Persistence Flow
1. `save(updates)` → merges with `defaultD()` + previous state
2. Writes to localStorage immediately
3. Debounces (1.5s) then syncs to Neon DB via `/api/sync`
4. On load: DB is source of truth, falls back to localStorage

---

## Content

### Kana (208 total)
- **92 base**: 46 hiragana + 46 katakana — all with mnemonic images, stories, audio
- **50 dakuten/handakuten**: Row-based learn mode
- **66 yōon**: Row-based learn mode

### Phrases (100 total, 11 categories)
| Category | ID prefix | Count | Icon |
|----------|-----------|-------|------|
| Greetings | g | 10 | 👋 |
| Restaurants | f | 10 | 🍜 |
| Transport | t | 10 | 🚃 |
| Hotels | h | 10 | 🏨 |
| Shopping | s | 10 | 🏪 |
| Directions | d | 10 | 🗺️ |
| Emergencies | e | 10 | 🆘 |
| Numbers | n | 10 | 🔢 |
| Time & Days | ti | varies | ⏰ |
| Daily Life | dl | varies | 🌸 |
| Describing | de | varies | 🎨 |

Each phrase has: id, japanese, romaji, english, category, context, isMissionCritical flag, word breakdown.

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
