---
name: React hooks must be at component top level
description: useState/useRef inside JSX variables or conditionals causes blank screen crashes — has happened multiple times, user was very frustrated
type: feedback
---

React hooks (useState, useRef, useEffect) must ALWAYS be declared at the very top of component functions, never inside JSX variable declarations, conditionals, or render blocks.

**Why:** This has caused multiple blank-screen crashes in production (SmartSession.jsx especially). Each time, it was a TDZ (temporal dead zone) error like "Cannot access 'z' before initialization" from Vite's minified output. The user was very frustrated about this recurring issue.

**How to apply:** Before committing any component changes, verify all hooks are at the top. When adding new state, always add it to the hook block at the top of the component, never inline where it's used. Also watch for variable declarations that reference each other — ensure declaration order matches usage order (especially in sessionEngine.js).
