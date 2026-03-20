# TinySenpai — Architecture Guide

A Japanese learning app (kana + phrases + AI tutor) built as a single-page React app deployed on Vercel.

**Live:** [tinysenpai.com](https://tinysenpai.com)

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 SPA (Vite), single file `src/App.jsx` (~1470 lines) |
| Auth | Clerk (`@clerk/clerk-react`), `routing="virtual"` for embedded SignIn/SignUp |
| Database | Neon PostgreSQL via `@neondatabase/serverless` |
| Hosting | Vercel (static + serverless functions) |
| TTS | Google Translate proxy (`/api/tts`) for Japanese, ElevenLabs pre-generated static MP3s for stories + phrases |

---

## File Structure

```
src/
  App.jsx          — Entire app (all components, state, styles inline)
  main.jsx         — Entry point, ClerkProvider wrapper

api/
  chat.js          — Vercel serverless: OpenAI chat (Senpai AI tutor)
  sync.js          — Vercel serverless: Neon DB read/write user data
  tts.js           — Vercel serverless: Google Translate TTS proxy

scripts/
  generate-audio.mjs — One-time ElevenLabs audio generation script

public/
  audio/
    kana/           — OLD Japanese kana audio (Lily voice, no language_code)
    kana2/          — NEW Japanese kana audio (Lily voice, language_code: "ja")
    story/          — OLD English stories (Daniel voice)
    story2/         — OLD English stories (Matilda voice, verbose scripts)
    story3/         — CURRENT English stories (Matilda voice, concise scripts)
    phrase/         — Japanese phrase audio (Lily voice, language_code: "ja")
  images/
    tinysenpai1.png — Pixel art mascot v1
    tinysenpai2.png — Pixel art mascot v2 (used in sidebar)
```

**Active audio paths used by the app:**
- Kana pronunciation: `/api/tts?lang=ja` (Google Translate, not static files)
- Story narration: `/audio/story3/{codepoint}.mp3` (Matilda, ElevenLabs)
- Phrases: `/audio/phrase/{id}.mp3` (Lily, ElevenLabs)
- kana/, kana2/, story/, story2/ are backups — not actively used

---

## App.jsx Structure

The entire app is one file. Here's the layout (approximate line numbers):

```
Lines 1-56      — Imports, storage helpers, TTS functions (speak, speakPhrase)
Lines 58-230    — Data: M (kana mnemonics), ROMAJI map, PHRASES array,
                  H_GROUPS/K_GROUPS, CATS, THEMES, RP_SCENARIOS
Lines 232-370   — Component setup: state declarations, theme, resize listener
Lines 370-450   — Data persistence: migrate(), init useEffect, save(), defaultD()
Lines 450-490   — Effects: input focus, chat scroll, auto-greet, Enter key handler
Lines 490-570   — SRS helpers, quiz/drill logic functions
Lines 570-690   — Senpai chat: sendMsg, autoGreet, startRolePlay
Lines 690-730   — Shared UI: styles (card, btn, chip), speakBtn, speakStory, storyBtn
Lines 730-810   — renderHome()
Lines 810-1000  — renderKana() — learn, quiz, results, menu screens
Lines 1000-1100 — renderPhrases() — review, browse, category detail
Lines 1100-1200 — renderSensei() — chat UI, role-play scenarios
Lines 1200-1300 — renderDrill() — mixed kana+phrase daily drill
Lines 1300-1400 — renderProfile(), renderOnboarding()
Lines 1400-1470 — Main render: sidebar (desktop), bottom nav (mobile), tab routing
```

---

## Key Concepts

### Theming
```js
const THEMES = { dark: {...}, light: {...} };
const c = THEMES[theme]; // Used everywhere: c.bg, c.tx, c.a (accent), c.g (green), etc.
```

### SRS (Spaced Repetition)
```js
const SRS_DAYS = [0, 0.5, 1, 3, 7, 14]; // Box 0-5
// data.kana[char] = { box: 0-5, next: timestamp }
// data.phr[phraseId] = { box: 0-5, next: timestamp }
// Box >= 3 = "mastered"
```

### Data Shape
```js
{
  kana: { [char]: { box, next } },
  phr: { [phraseId]: { box, next } },
  sessions: number,
  totalC: number,
  streak: number,
  lastDay: "Fri Mar 20 2026",
  started: ISO string,
  onboarded: boolean,
  onboarding: { why, level, focus, tripDate }
}
```

### Persistence Flow
1. `save(updates)` → merges with `defaultD()` + prev state
2. Writes to localStorage immediately
3. Debounces (1.5s) then syncs to Neon DB via `/api/sync`
4. On load: DB is source of truth, falls back to localStorage

### Kana Mnemonics (M object)
```js
M["あ"] = ["🍎", "Apple", "Cross stroke = stem", "Story text for Matilda audio"]
//         emoji  title    hint                    m[3] = story narration text
```

### Phrases
```js
["g1", "こんにちは", "kon-ni-chi-wa", "Hello (daytime)", "greet", "Most universal greeting", true]
// id   japanese     romaji           english           category  context                   isMissionCritical
```

### Audio System
- **Kana click/quiz**: `speak(char)` → `/api/tts?lang=ja` (Google Translate proxy)
- **Story button**: chains Google JP → `/audio/story3/{cp}.mp3` (Matilda) → Google JP again
- **Phrase audio**: `/audio/phrase/{id}.mp3` (ElevenLabs static), fallback to `/api/tts`
- All story3 + phrase audio was pre-generated via `scripts/generate-audio.mjs`

### Quiz Modes
- **Visual** (default): See kana character → type romaji
- **Listen**: Hear audio only (character hidden as "?") → type romaji
- Toggle via 👁/👂 icons in quiz header

---

## Environment Variables

### Vercel (production)
- `OPENAI_API_KEY` — for Senpai AI chat
- `DATABASE_URL` — Neon PostgreSQL connection string
- `CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` — auth

### Local / Scripts
- `ELEVENLABS_API_KEY` — for `generate-audio.mjs` (one-time generation)
- Voice IDs in script: `VOICE_JA` (Lily: `pFZP5JQG7iQjIQuC4Bku`), `VOICE_EN` (Matilda: `XrExE9yKIg1WjnnlVkGX`)

---

## Audio Generation

Run once to generate all static MP3s:
```bash
ELEVENLABS_API_KEY=your_key node scripts/generate-audio.mjs
```

Modes: `MODE=kana`, `MODE=kana2`, `MODE=story`, `MODE=phrase`, or `MODE=all`

Generated files go to `public/audio/` and must be committed to the repo so Vercel serves them as static assets.

---

## Deployment

```bash
npx vercel --prod
```

Or push to `main` — Vercel auto-deploys.

---

## Design Principles

- **Single file**: Everything in App.jsx. No component splitting. Inline styles only.
- **Offline-first**: localStorage always has latest data, DB sync is async
- **Static audio**: Pre-generated MP3s for stories/phrases (zero runtime TTS cost)
- **Clean UX**: Minimal UI, dark-first, beginner-friendly. Don't overwhelm.
- **SRS-driven**: Everything uses spaced repetition — kana and phrases both track box/next timing
