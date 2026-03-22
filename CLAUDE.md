# Claude Code Instructions

## Critical: Read before doing anything

**Multiple Claude chats work on this project.** Before making assumptions about what exists or doesn't exist:
1. **Always check the actual filesystem** (`ls`, `find`) — files may have been created in another chat
2. **Always read the latest code** before suggesting changes — another chat may have refactored or restructured things
3. **Never assume the codebase is the same as when you last saw it** — pull latest, check file structure, read key files first
4. **Check git log** for recent commits you may not know about

## Project Overview

TinySenpai — Japanese learning app for travelers. React SPA on Vercel.

**Live:** https://tinysenpai.com

## Current Architecture (as of March 2026)

The app was recently split from a single 1687-line App.jsx into components:

```
src/
  App.jsx              — state management + orchestration (592 lines)
  main.jsx             — React entry point
  components/
    Home.jsx           — dashboard, stats, review cards
    KanaTrainer.jsx    — learn, quiz, results, menu (largest component)
    PhraseBank.jsx     — phrase browsing, practice, categories
    SenpaiChat.jsx     — AI chat with roleplay scenarios
    DailyDrill.jsx     — mixed kana + phrase drill
    Onboarding.jsx     — 3-step onboarding flow
    Profile.jsx        — profile modal
    Layout.jsx         — sidebar (desktop) + bottom nav (mobile)
  data/
    kana.js            — mnemonics (M), groups, ROMAJI, dakuten/yōon mappings
    phrases.js         — 56 phrases, categories, icons, colors
    themes.js          — dark/light themes
    constants.js       — SRS config, fonts, roleplay scenarios
  utils/
    audio.js           — TTS playback functions
    storage.js         — localStorage + DB sync
    helpers.js         — shuffle, daysUntil
  game/                — side-scroller game (separate module)
```

## Key Technical Details

- **State lives in App.jsx** — passed as props to components (no Context/Redux)
- **Audio**: Google TTS proxy for Japanese pronunciation, ElevenLabs for English stories
- **Images**: Mnemonic images in `public/images/mnemonics/approved/{hiragana|katakana}/`
- **SRS**: 6-box spaced repetition (0, 0.5, 1, 3, 7, 14 days)
- **Auth**: Clerk. **DB**: Neon PostgreSQL. **Hosting**: Vercel

## Content Status

- **92 base kana**: All have mnemonic images, stories, and audio ✓
- **50 dakuten/handakuten**: Row-based learn mode ✓
- **66 yōon combinations**: Row-based learn mode ✓
- **56 travel phrases**: 7 categories, SRS, situation-based practice ✓
- **Mnemonic images**: Watercolor + red calligraphy style (Gemini Pro)

## Important Files

- `ARCHITECTURE.md` — detailed technical docs
- `scripts/generate-audio.mjs` — ElevenLabs audio generation
- `.claude/projects/.../memory/` — persistent memory files with workflow docs

## Style Rules

- All styles are inline objects (no CSS files)
- Colors from theme `c` object: `c.bg`, `c.tx`, `c.a` (accent/red), `c.g` (green), etc.
- Mobile-first, responsive at 768px breakpoint
