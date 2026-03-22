# TinySenpai — Architecture Guide

A Japanese learning app (kana + phrases + AI tutor) built as a single-page React app deployed on Vercel.

**Live:** [tinysenpai.com](https://tinysenpai.com)

---

## Product Vision

TinySenpai should be the **fastest, most effective way to learn Japanese** — especially for complete beginners preparing for a trip. It is NOT a traditional textbook app. Key principles:

- **Use whatever method works best**, not what's traditional. If overlaying emoji ghosts on characters helps memory, do that. If chaining audio (JP pronunciation → English mnemonic story → JP again) locks it in, do that.
- **Mnemonics are everything** for kana. Every character has a vivid visual story (apple for あ, boxer for う, UFO for お). The story audio is pre-generated with ElevenLabs (Matilda voice).
- **SRS drives all review**. No busywork — only practice what's due, at the right time.
- **Audio is first-class**. Japanese pronunciation comes from Google Translate TTS (natural). English stories from ElevenLabs static files. Phrases from ElevenLabs static files.
- **UX must be clean and focused**. A beginner should never feel overwhelmed. Fewer buttons, clear hierarchy, one primary action per screen.
- **The AI tutor (Senpai)** knows the user's progress, trip date, and learning context. It can roleplay scenarios, explain grammar, answer questions.
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

## Audio Generation — Full Guide

The app uses **two TTS systems** for different purposes:

| What | TTS Source | Voice | Where |
|------|-----------|-------|-------|
| Kana pronunciation (あ, カ, etc.) | Google Translate proxy | Google's JP voice | Runtime — `/api/tts?lang=ja` |
| Mnemonic stories (English) | ElevenLabs static MP3s | Matilda (`XrExE9yKIg1WjnnlVkGX`) | Pre-generated — `/audio/story3/` |
| Phrase pronunciation (こんにちは, etc.) | ElevenLabs static MP3s | Lily (`pFZP5JQG7iQjIQuC4Bku`) | Pre-generated — `/audio/phrase/` |

### Why two systems?
- **Google Translate** is better for single kana characters — it always pronounces them naturally. ElevenLabs sometimes mispronounces isolated characters even with `language_code: "ja"`.
- **ElevenLabs** is better for longer content — stories sound warm and natural (Matilda), phrases sound clear (Lily). Google TTS for longer text sounds robotic.

### How audio playback works in the app

**Kana pronunciation** — `speak(char)` calls `/api/tts?lang=ja&q=あ` at runtime. No static files involved. Falls back to browser `SpeechSynthesis` if the proxy fails.

**Story chain** — `speakStory(m, char)` plays three audio segments back-to-back:
1. Google TTS says the Japanese character (e.g. "あ")
2. Matilda narrates the English mnemonic from `/audio/story3/{codepoint}.mp3`
3. Google TTS says the Japanese character again

The second and third audio files are **preloaded** while the first plays, so transitions are instant. The `_ttsAudio` module-level variable tracks the currently playing audio so `stopAudio()` can kill it on navigation.

**Phrase audio** — `speakPhrase(id)` plays `/audio/phrase/{id}.mp3`. Falls back to Google TTS if the file is missing.

### File naming conventions
- **Story files**: `public/audio/story3/{hex_codepoint}.mp3` — e.g. あ = U+3042 → `3042.mp3`
- **Phrase files**: `public/audio/phrase/{phrase_id}.mp3` — e.g. `g1.mp3`, `f3.mp3`, `t7.mp3`
- **Kana backup files**: `public/audio/kana2/{hex_codepoint}.mp3` — not used by app, kept as backup

### Generating / regenerating audio

The script is `scripts/generate-audio.mjs`. It calls the ElevenLabs API and writes MP3 files to `public/audio/`.

```bash
# Generate everything (stories + phrases + kana backup)
ELEVENLABS_API_KEY=your_key node scripts/generate-audio.mjs

# Generate only stories (English mnemonic narrations)
ELEVENLABS_API_KEY=your_key MODE=story node scripts/generate-audio.mjs

# Generate only phrases (Japanese phrase audio)
ELEVENLABS_API_KEY=your_key MODE=phrase node scripts/generate-audio.mjs

# Generate kana backup files (not used by app, just for reference)
ELEVENLABS_API_KEY=your_key MODE=kana2 node scripts/generate-audio.mjs
```

**Important behaviors:**
- The script **skips files that already exist** (prints `·` instead of `✓`). To regenerate a specific file, delete it first, then run the script.
- Rate-limited to ~3 requests/second (350ms delay) — safe for ElevenLabs free tier.
- All generated files must be **committed to git** and pushed — Vercel serves them as static assets from `public/`.

### Changing a story

If you want to update a mnemonic story (e.g. improve the wording for あ):

1. **Update the story text** in two places:
   - `scripts/generate-audio.mjs` → `STORIES` object (this is what gets spoken by Matilda)
   - `src/App.jsx` → `M` object, index `[3]` (this is what gets displayed as text in the app)
   - **These MUST match** — the displayed text should be what the audio says
2. **Delete the old audio file**: `rm public/audio/story3/3042.mp3` (use the hex codepoint)
3. **Regenerate**: `ELEVENLABS_API_KEY=your_key MODE=story node scripts/generate-audio.mjs`
4. **Commit the new MP3** and push

### Adding a new phrase

1. Add the phrase to `PHRASES` array in both:
   - `scripts/generate-audio.mjs` — `['id', 'japanese text']`
   - `src/App.jsx` — full 7-element array `['id', 'japanese', 'romaji', 'english', 'category', 'context', isMissionCritical]`
2. **Generate audio**: `ELEVENLABS_API_KEY=your_key MODE=phrase node scripts/generate-audio.mjs`
3. **Commit** the new MP3 from `public/audio/phrase/{id}.mp3` and push

### Voice settings (in generate-audio.mjs)

```js
model_id: 'eleven_multilingual_v2',
voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.2 }
// For Japanese audio, also includes:
language_code: 'ja',
apply_language_text_normalization: true  // CRITICAL for single characters
```

### Audio directory history

| Directory | Voice | Status | Notes |
|-----------|-------|--------|-------|
| `kana/` | Lily (no `language_code`) | BACKUP | Some characters mispronounced |
| `kana2/` | Lily (with `language_code: "ja"`) | BACKUP | Better, but app uses Google TTS instead |
| `story/` | Daniel | BACKUP | First attempt, wrong voice |
| `story2/` | Matilda (verbose scripts) | BACKUP | Stories were too long |
| `story3/` | Matilda (concise scripts) | **ACTIVE** | 92 base kana mnemonic stories |
| `phrase/` | Lily (with `language_code: "ja"`) | **ACTIVE** | 55 phrase MP3s |
| `rows/` | Lily (multilingual) | **ACTIVE** | 16 row-level dakuten/yōon explanations |
| `dakuten/` | Matilda | LEGACY | Bridge audio (old spliced approach, kept for reference) |

### ElevenLabs API key

Get one at [elevenlabs.io](https://elevenlabs.io). Free tier gives ~10,000 characters/month. Generating all audio (46 stories + 55 phrases) uses roughly 3,000-4,000 characters. Only needed for the one-time generation script — the app never calls ElevenLabs at runtime.

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

---

## Known Gotchas & Past Bugs (avoid repeating)

1. **`save()` null spread**: `setD(prev => {...prev, ...u})` crashes when `prev` is null (new users). Always use `{...defaultD(), ...prev, ...u}`.
2. **Clerk routing**: Must use `routing="virtual"` on SignIn/SignUp components. `routing="hash"` breaks multi-step flows (email verification) because the hashchange listener switches auth mode mid-flow.
3. **ClerkProvider props**: Do NOT pass `signInUrl`, `signUpUrl`, `afterSignInUrl`, `afterSignUpUrl` — they conflict with embedded components.
4. **Onboarding visibility**: The onboarding container div MUST have `color: c.tx` explicitly set, otherwise text is invisible on dark backgrounds (browser default is near-black).
5. **`migrate()` phr guard**: Always include `phr: raw.phr || {}` — old data may not have the phr field.
6. **Google TTS CORS**: Cannot fetch `translate.google.com` directly from browser. Must proxy through `/api/tts.js` serverless function.
7. **ElevenLabs language_code**: When generating Japanese audio, MUST pass `language_code: "ja"` and `apply_language_text_normalization: true` in the API body. Without this, single kana characters get mispronounced.
8. **Audio cleanup on navigation**: When user clicks Prev/Next in kana learn mode, must call `stopAudio()` to prevent overlapping audio from previous card.
9. **`_ttsAudio` global**: There's a module-level `let _ttsAudio = null` that tracks the currently playing audio. Always clean it up before starting new audio.

---

## Roadmap / Feature Ideas

### Completed
- [x] All 92 base kana with mnemonic images (watercolor + red calligraphy)
- [x] All 92 kana story text + audio (ElevenLabs Matilda)
- [x] Katakana mnemonic images and stories (matched to JapanesePod101 video)
- [x] Hiragana mnemonic images and stories (matched to JapanesePod101 video)
- [x] Dakuten/handakuten support (50 characters, row-based learn)
- [x] Yōon combinations (66 characters, row-based learn)
- [x] Row-level audio for dakuten/yōon (Lily voice, 16 files)
- [x] Side-by-side learn layout (character + mnemonic image)
- [x] Auto-reveal and auto-story toggles
- [x] Swipe navigation for learn cards
- [x] Individual character selection in grid
- [x] Listening quiz mode (👂 hear kana, type romaji)
- [x] SRS due indicators + review badges on nav
- [x] Home page review card
- [x] Streak celebration animation
- [x] Keyboard shortcut hints (↵)
- [x] Mobile bottom nav + swipe
- [x] Pre-generated ElevenLabs audio (stories + phrases)
- [x] Google Translate TTS proxy for kana

### Not Yet Implemented
- [ ] **Speed recognition drill** — timed kana flash, track response time
- [ ] **Reverse quiz (production)** — see romaji, pick correct kana from choices
- [ ] **Confused pairs drilling** — シ/ツ, ソ/ン, は/ほ targeted practice
- [ ] **Achievement badges** — unlock milestones for motivation
- [ ] **Drawing practice** — trace kana on canvas, motor memory
- [ ] **Story-based trip journey** — simulated day in Japan using phrases in context
- [ ] **Grammar module** — basic particles, sentence structure
- [ ] **Kanji introduction** — basic kanji (numbers, days, common signs)

---

## Style Conventions

- All styles are inline objects. No CSS files, no CSS-in-JS libraries.
- Common style objects: `card`, `btn`, `chip(color)`, `progressBar(pct, color)`
- Colors always from `c` object (theme-aware): `c.bg`, `c.tx`, `c.a` (accent/red), `c.g` (green), `c.go` (gold), `c.m` (muted), `c.s` (surface), `c.s2` (surface2), `c.b` (border)
- Font: `font` variable = Inter/system font stack. `mono` = monospace stack.
- Animations via `<style>` tags injected inline in JSX where needed.
- Hover states via `onMouseEnter`/`onMouseLeave` setting `hov` state.
