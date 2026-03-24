# Claude Code Instructions

## Critical: Read before doing anything

**Multiple Claude chats work on this project.** Before making assumptions about what exists or doesn't exist:
1. **Always check the actual filesystem** — files may have been created in another chat
2. **Always read the latest code** before suggesting changes — another chat may have refactored
3. **Never assume the codebase is the same as when you last saw it** — pull latest first
4. **Check git log** for recent commits you may not know about
5. **Always pull before pushing** — `git stash && git pull --rebase origin main && git stash pop`

## Project Overview

TinySenpai — Japanese learning app for everyone (not just travelers). React SPA on Vercel.

**Live:** https://tinysenpai.com

## Current Architecture (as of March 2026)

```
src/
  App.jsx                — state management + orchestration (~616 lines)
  main.jsx               — React entry point (ClerkProvider)
  components/
    Home.jsx             — dashboard, stats, review cards
    KanaTrainer.jsx      — learn, quiz, results, menu
    PhraseBank.jsx       — phrase browsing, practice, 4 quiz modes
    SmartSession.jsx     — adaptive AI-powered learning sessions (~990 lines, largest)
    PhraseSegments.jsx   — interactive word-by-word phrase breakdowns
    SenpaiChat.jsx       — AI chat with roleplay scenarios
    DailyDrill.jsx       — mixed kana + phrase drill
    Onboarding.jsx       — 3-step onboarding flow
    Profile.jsx          — profile modal
    Layout.jsx           — sidebar (desktop) + bottom nav (mobile)
  data/
    kana.js              — mnemonics (M), groups, ROMAJI, dakuten/yōon mappings
    phrases.js           — 100 phrases, 11 categories, icons, colors
    phraseBreakdowns.js  — word-by-word translations + grammar types for all phrases
    conversations.js     — fill-in-the-blank dialogue scenarios
    themes.js            — dark/light themes
    constants.js         — SRS config, fonts, roleplay scenarios
  utils/
    audio.js             — TTS playback functions
    storage.js           — localStorage + DB sync
    helpers.js           — shuffle, daysUntil
    fsrs.js              — FSRS-5 spaced repetition algorithm
    sessionEngine.js     — smart session queue builder (~320 lines)
  game/                  — side-scroller game (separate module, separate chat)
api/
  chat.js                — Senpai AI tutor (Claude Sonnet)
  sync.js                — Neon DB read/write
  tts.js                 — Google Translate TTS proxy
  story.js               — AI story generation
  coach.js               — AI coaching (session plan + review)
  conversation.js        — AI branching dialogues
  mnemonic.js            — AI personalised mnemonic generation
```

## Key Technical Details

- **State lives in App.jsx** — passed as props to components (no Context/Redux)
- **SRS**: FSRS-5 adaptive algorithm (stability/difficulty per item), backward-compatible with 6-box system
- **Smart Sessions**: AI-powered adaptive learning with coaching, stories, branching convos
- **Audio**: Google TTS proxy for kana, ElevenLabs static MP3s for stories + phrases
- **Images**: Mnemonic images in `public/images/mnemonics/approved/{hiragana|katakana}/`
- **Auth**: Clerk. **DB**: Neon PostgreSQL. **Hosting**: Vercel
- **AI**: Claude Sonnet for chat, coaching, stories, conversations, mnemonics

## Content Status

- **92 base kana**: All have mnemonic images, stories, and audio ✓
- **50 dakuten/handakuten**: Row-based learn mode ✓
- **66 yōon combinations**: Row-based learn mode ✓
- **100 phrases**: 11 categories, SRS, word breakdowns, scenario quizzes ✓
- **Categories**: Greetings, Restaurants, Transport, Hotels, Shopping, Directions, Emergencies, Numbers, Time & Days, Daily Life, Describing
- **Mnemonic images**: Watercolor + red calligraphy style (Gemini Pro)

## Important Files

- `ARCHITECTURE.md` — detailed technical docs (audio, deployment, gotchas)
- `LEARNING_SCIENCE.md` — evidence-based learning research
- `GAME.md` / `SPRITES.md` — game design docs (managed by game chat)
- `scripts/generate-audio.mjs` — ElevenLabs audio generation
- `.claude/projects/.../memory/` — persistent memory files

## Critical Rules

- **React hooks at component top** — never inside JSX variables or conditionals
- **Always pull before pushing** — other chats push concurrently
- **Don't touch `src/game/`** — managed by a separate AI chat
- **Inline styles only** — no CSS files, colors from theme `c` object
- **Mobile-first** — responsive at 768px breakpoint
- **Proactive approach** — suggest alternatives, flag issues, don't just execute blindly
