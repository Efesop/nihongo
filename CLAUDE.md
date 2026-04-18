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

## Current Architecture (as of late March 2026)

```
src/
  App.jsx                — state management, SRS, XP/levels, badges (~695 lines)
  main.jsx               — React entry point (ClerkProvider)
  components/
    Home.jsx             — dashboard, stats, review cards
    KanaTrainer.jsx      — learn, quiz, results, menu
    PhraseBank.jsx       — phrase browsing, practice, 4 quiz modes
    SmartSession.jsx     — adaptive AI-powered learning sessions (~1600 lines, largest)
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
    phraseBreakdowns.js  — word-by-word translations + grammar types
    conversations.js     — fill-in-the-blank dialogue scenarios
    confusedPairs.js     — 17 visually similar kana pairs with hints
    confusedPhrases.js   — 25+ structurally similar phrase pairs with hints
    grammarPatterns.js   — 10 auto-unlocking grammar patterns
    kanaWords.js         — vocab context words, 46 kana
    regions.js           — Japan map data (8 regions, cities, food, culture, phrases)
    themes.js            — dark/light themes
    constants.js         — SRS config, fonts, typography (T), roleplay scenarios
    patternAssembly.js   — 10 grammar templates, sentence construction
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

- **State in App.jsx** — props to components (no Context/Redux)
- **SRS**: FSRS-5 adaptive (stability/difficulty per item), back-compat with 6-box
- **Smart Sessions**: 19 exercise types, AI coaching, interleaved kana/phrase queue, productive failure, confused pair drilling, pattern assembly
- **Skill tracking**: Multi-dimensional per item (visual, listen, production) — weakest skill prioritised
- **XP/Levels**: 11-tier (0→7500 XP). **Badges**: 12 achievements (streaks, milestones, S-ranks, explorer)
- **Audio**: Google TTS proxy for kana, ElevenLabs static MP3s for stories + phrases
- **Images**: Mnemonic images in `public/images/mnemonics/approved/{hiragana|katakana}/`
- **Auth**: Clerk. **DB**: Neon PostgreSQL. **Hosting**: Vercel
- **AI**: Claude Sonnet for chat, coaching, stories, conversations, mnemonics

## Smart Session — 19 Exercise Types

| Type | Description | Unlocks at |
|------|-------------|------------|
| `learn-card` | New kana: mnemonic image + story + context words | Always |
| `learn-phrase` | New phrase: breakdown + building block connections | Always |
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
| `pattern-assembly` | Tap-to-build sentence from grammar pattern + vocab | 3+ phrases |
| `leech-review` | Special mnemonic treatment, 5+ errors | 5+ errors |
| `grammar-pattern` | Auto-unlocked grammar insight | 5+ phrases |
| `conversation` | Fill-in-the-blank dialogue scenarios | 5+ phrases |
| `story` | AI-generated narrative, known phrases (25% chance) | 3+ phrases |
| `branch-convo` | Interactive AI dialogue tree (20% chance) | 8+ phrases |

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

## Important Files

- `ARCHITECTURE.md` — detailed technical docs (audio, deployment, gotchas)
- `LEARNING_SCIENCE.md` — evidence-based learning research
- `GAME.md` / `SPRITES.md` — game design docs (managed by game chat)
- `scripts/generate-audio.mjs` — ElevenLabs audio generation
- `.claude/projects/.../memory/` — persistent memory files

## Critical Rules

- **React hooks at component top** — never inside JSX vars or conditionals
- **Pull before push** — other chats push concurrently
- **Don't touch `src/game/`** — separate AI chat manages
- **Inline styles only** — no CSS files, colors from theme `c` object
- **Mobile-first** — responsive at 768px breakpoint
- **Proactive approach** — suggest alternatives, flag issues, don't execute blindly

## Component Architecture Rules (2026-04+)

New code MUST follow these. SmartSession.jsx (3600+ lines) is admitted tech debt — do not extend it; extract.

- **Max ~400 lines per component.** If bigger, split into a subfolder with one shell + multiple subcomponents.
- **One component per file.** File name matches the export.
- **Subfolder patterns** for multi-mode screens: e.g., `src/components/scene/SceneWatch.jsx`, `SceneCloze.jsx`, `SceneShadow.jsx`, `SceneRolePlay.jsx`, plus `SceneIntro.jsx` shared primitive.
- **Reuse `SessionParts.jsx` primitives** — never duplicate `ActionBar`, `ChoiceCard`, `AudioOrb`, `PlayButton`, `HintChip`, `TypeLabel`, `ResultMark`, `NoneOfThese`, `SceneImage`, `JpText`.
- **Reuse `PhraseSegments.jsx`** for word-by-word breakdowns. It accepts either a phraseId or a raw breakdown array.
- **Extract shared logic** (mic capture → `ShadowExercise.jsx`; karaoke sync → `KaraokeText.jsx`) into dedicated components/utils.
- **Icons from `Icons.jsx`** — don't inline SVG in components.
- **Never add exercise types to SmartSession.jsx** — create a component, import it, call from the render switch.

## UI Polish Conventions

Beautiful UI is non-negotiable. New components MUST:

- **Colors from theme `c`.** Never hardcode hex. Tokens: `c.bg`, `c.s` (surface), `c.s2` (raised), `c.b` (border), `c.tx` (text), `c.m` (muted), `c.m2` (muted-light), `c.a` (accent red), `c.g` (green), `c.go` (gold/hint), `c.ro` (romaji coral), `c.ac` (accent UI blue), `c.gs` (green surface), `c.rs` (red surface), `c.as` (active surface).
- **Typography from `T` constants.** Never hardcode px. `T.xs` (11) / `T.sm` (13) / `T.base` (15) / `T.md` (17) / `T.lg` (20) / `T.xl` (24) / `T.xxl` (32) / `T.huge` (48).
- **Japanese text uses `fontJa`,** `JP.weight` (500), `JP.lineHeight` (1.3). Size via `JP.size.desktop`/`.mobile`.
- **Spacing scale:** 6 / 8 / 10 / 12 / 16 / 20 / 24 / 32. No in-between values.
- **Border radius:** 8 (chip) / 10 (button) / 12 (card) / 16 (major panel).
- **Borders:** `1px solid ${c.b}` standard. Dashed `2px dashed ${c.ac}` for drop targets.
- **Cards:** `{ background: c.s, border: "1px solid " + c.b, borderRadius: 12, padding: 16 }`.
- **Transitions:** `.15s` standard (buttons, state changes); `.3s` for larger reveals.
- **Motion for reveal:** fade + 4px slide up, 200ms ease-out.
- **Speaker color coding in dialogue:** Konoha (female voice) = `#f48fb1` accent / left stripe 3px; Akira (male voice) = `#64b5f6`.
- **Touch targets:** min 44px on mobile.
- **Use `className="ts-btn"`** for interactive buttons — gets hover/active micro-animations defined in `SessionParts.jsx`.
- **Japanese first, English second.** When showing both, JP is the hero (bigger font, darker), EN is support (`c.m`, smaller).
