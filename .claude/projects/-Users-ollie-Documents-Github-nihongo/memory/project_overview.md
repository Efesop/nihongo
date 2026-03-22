---
name: TinySenpai project overview
description: Japanese learning app (kana + phrases + AI tutor) at tinysenpai.com — React SPA on Vercel with Clerk auth, Neon DB, Claude API for chat
type: project
---

TinySenpai is a Japanese learning app targeting beginners (especially pre-trip travelers). Live at tinysenpai.com.

**Stack:** React 18 SPA (single App.jsx ~1470 lines), Vite, Clerk auth, Neon PostgreSQL, Vercel (static + serverless). AI tutor uses Claude API (Anthropic) via /api/chat.js. TTS via Google Translate proxy + ElevenLabs pre-generated audio.

**Key features:** Kana learning with mnemonics + emoji overlays, SRS-driven review, phrase bank (7 categories, 56 phrases), daily drill (mixed kana+phrases), AI tutor "Senpai" with role-play scenarios, onboarding flow, trip countdown, dark/light theme.

**Why:** This is Ollie's project. Architecture is deliberately single-file (App.jsx), inline styles only, no CSS files, offline-first with localStorage + async DB sync.

**How to apply:** Respect the single-file architecture. Don't split into components unless asked. Keep UX clean and beginner-friendly. SRS drives all review.
