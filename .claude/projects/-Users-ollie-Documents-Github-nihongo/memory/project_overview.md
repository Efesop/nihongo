---
name: TinySenpai project overview
description: Japanese learning app at tinysenpai.com — React SPA with FSRS-5 SRS, Smart Sessions, 100 phrases, AI coaching, game module
type: project
---

TinySenpai is a Japanese learning app for everyone learning Japanese (not just travelers). Live at tinysenpai.com.

**Stack:** React 18 SPA (Vite), ~18 source files split across components/data/utils. Clerk auth, Neon PostgreSQL, Vercel (static + serverless). AI features use Claude Sonnet via Anthropic API. TTS via Google Translate proxy + ElevenLabs pre-generated audio.

**Key features:**
- Kana learning with watercolor mnemonic images + audio stories (92 base + 50 dakuten + 66 yōon)
- 100 phrases across 11 categories with word-by-word breakdowns (PhraseSegments)
- FSRS-5 adaptive spaced repetition (per-item stability/difficulty, 85% retention target)
- Smart Sessions: AI-powered adaptive learning with coaching, stories, branching conversations
- Senpai mascot: harsh sensei personality, hover quips, performance grades (S/A/B/C)
- 4 phrase quiz modes: scenario, listen, match, flashcard (with "none of these" trick questions)
- AI tutor chat with 5 roleplay scenarios
- Katana Zero-inspired side-scroller game (separate module, separate AI chat)
- Dark/light theme, mobile-first, offline-first with localStorage + async DB sync

**Architecture:** State in App.jsx passed as props. SmartSession.jsx is largest component (~990 lines). Inline styles only, no CSS files.

**Why:** This is Ollie's project. He wants proactive suggestions, not just execution. Always think critically.

**How to apply:** Don't touch src/game/ (separate chat). Always pull before pushing. Hooks at component top always. Keep UX clean and beginner-friendly.
