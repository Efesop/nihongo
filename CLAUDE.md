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

## Current Architecture (as of late March 2026)

```
src/
  App.jsx                — state management, SRS, XP/levels, badges (~695 lines)
  main.jsx               — React entry point (ClerkProvider)
  components/
    Home.jsx             — dashboard, stats, review cards
    KanaTrainer.jsx      — learn, quiz, results, menu
    PhraseBank.jsx       — phrase browsing, practice, 4 quiz modes
    SmartSession.jsx     — adaptive AI-powered learning sessions (~1485 lines, largest)
    PhraseSegments.jsx   — interactive word-by-word phrase breakdowns
    SenpaiChat.jsx       — AI chat with roleplay scenarios
    DailyDrill.jsx       — mixed kana + phrase drill
    JapanMap.jsx         — interactive Japan map with 8 regions, travel tips, linked phrases
    Onboarding.jsx       — 3-step onboarding flow
    Profile.jsx          — profile modal
    Layout.jsx           — sidebar (desktop) + bottom nav (mobile)
  data/
    kana.js              — mnemonics (M), groups, ROMAJI, dakuten/yōon mappings
    phrases.js           — 100 phrases, 11 categories, icons, colors
    phraseBreakdowns.js  — word-by-word translations + grammar types for all phrases
    conversations.js     — fill-in-the-blank dialogue scenarios
    confusedPairs.js     — 17 visually similar kana pairs with hints
    confusedPhrases.js   — 25+ structurally similar phrase pairs with hints
    grammarPatterns.js   — 10 auto-unlocking grammar patterns
    kanaWords.js         — real vocabulary context words for 46 kana characters
    regions.js           — Japan map data (8 regions, cities, food, culture, phrases)
    themes.js            — dark/light themes
    constants.js         — SRS config, fonts, roleplay scenarios
  utils/
    audio.js             — TTS playback functions
    storage.js           — localStorage + DB sync
    helpers.js           — shuffle, daysUntil
    fsrs.js              — FSRS-5 spaced repetition algorithm
    sessionEngine.js     — smart session queue builder (~546 lines)
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
- **Smart Sessions**: 18 exercise types, AI coaching, interleaved kana/phrase queue, productive failure, confused pair drilling
- **Skill tracking**: Multi-dimensional per item (visual, listen, production) — weakest skill gets prioritised
- **XP/Levels**: 11-tier system (0→7500 XP). **Badges**: 12 achievements (streaks, milestones, S-ranks, explorer)
- **Audio**: Google TTS proxy for kana, ElevenLabs static MP3s for stories + phrases
- **Images**: Mnemonic images in `public/images/mnemonics/approved/{hiragana|katakana}/`
- **Auth**: Clerk. **DB**: Neon PostgreSQL. **Hosting**: Vercel
- **AI**: Claude Sonnet for chat, coaching, stories, conversations, mnemonics

## Smart Session — 18 Exercise Types

| Type | Description | Unlocks at |
|------|-------------|------------|
| `learn-card` | New kana with mnemonic image + story + context words | Always |
| `learn-phrase` | New phrase with breakdown + building block connections | Always |
| `try-first-kana` | Productive failure: quiz BEFORE teaching kana | Always |
| `try-first-phrase` | Productive failure: "what would you say?" before reveal | Always |
| `kana-visual` | See character, type romaji | Box 0+ |
| `kana-listen` | Hear character, type romaji | Box 1+ |
| `kana-reverse` | See romaji, pick character (production) | Box 2+ |
| `kana-pair` | Confused pair: "which one is shi?" (シ vs ツ) | 20+ kana |
| `phrase-scenario` | Conversational context, 8 choices + "none of these" | Box 0+ |
| `phrase-listen` | Hear phrase, identify meaning | Box 0+ |
| `phrase-reverse` | See English, pick Japanese (production) | Box 1+ |
| `phrase-production` | English → pick from 8 Japanese choices | Box 2+ |
| `phrase-pair` | Confused phrases: distinguish similar structures | 5+ phrases |
| `leech-review` | Special mnemonic treatment for items with 5+ errors | 5+ errors |
| `grammar-pattern` | Auto-unlocked grammar insight ("You've seen です in 6 phrases") | 5+ phrases |
| `conversation` | Fill-in-the-blank dialogue scenarios | 5+ phrases |
| `story` | AI-generated narrative using known phrases (25% chance) | 3+ phrases |
| `branch-convo` | Interactive AI dialogue tree (20% chance) | 8+ phrases |

## Content Status

- **92 base kana**: All have mnemonic images, stories, and audio ✓
- **50 dakuten/handakuten**: Row-based learn mode ✓
- **66 yōon combinations**: Row-based learn mode ✓
- **100 phrases**: 11 categories, SRS, word breakdowns, scenario quizzes ✓
- **Categories**: Greetings, Restaurants, Transport, Hotels, Shopping, Directions, Emergencies, Numbers, Time & Days, Daily Life, Describing
- **Mnemonic images**: Watercolor + red calligraphy style (Gemini Pro)
- **17 confused kana pairs** with visual discrimination hints ✓
- **25+ confused phrase pairs** with structural difference explanations ✓
- **10 grammar patterns** auto-unlocking from phrase progress ✓
- **46 kana context words** (real vocabulary on learn cards) ✓
- **8 Japan regions** with cities, food, culture, travel tips ✓

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
