# TinySenpai — Side-Scroller Game

A Katana Zero-inspired action side-scroller with stealth mechanics. 50 rooms across 7 acts spanning feudal Japan through cyberpunk Tokyo to the spirit realm. Built on HTML5 Canvas 2D, no game framework.

## Vision & Design Philosophy

**Reference game: Katana Zero.** Every design decision should be measured against this bar.

### Story Presentation (CRITICAL)
The game should use **in-world NPC encounters**, NOT separate overlay screens:
- Player physically walks through the level and encounters NPCs in the game world
- Characters are IN the environment — standing on floors, sitting in chairs, leaning on walls
- Player walks up to NPCs using actual controls, dialogue triggers on proximity
- After dialogue, NPCs walk away, sit down, fight, or react — not just appear/disappear
- NOT every scene needs action — quiet moments, discoveries, campfires are important
- Characters should WALK with actual walk animation sprites, never slide/lerp

### What to Avoid
- Characters bobbing/floating in story scenes
- Characters sliding into frame without walking animations
- Enemies in rooms that don't fit the story (e.g., oni demon in a training dojo)
- Rain or weather effects inside indoor environments
- Generic sprite generation without self-referencing (causes inconsistent character looks)
- Long loading screens — sprites load in background, game starts immediately
- Anything that feels "amateur" — polish every detail

### Art Consistency
- Every character's sprites must use 2-pass generation: idle first as "hero" reference, then all other poses reference that idle
- Gray backgrounds removed OFFLINE via `scripts/remove-gray-bg.mjs`, not at runtime
- Originals always archived before processing (archive_originals/, archive_originals_safe/)
- Never delete assets — archive old versions for potential reuse

## Quick Start

```bash
npm run dev          # Start dev server (game at /game tab)
npm run build        # Production build

# Generate sprites (needs Gemini API key)
GEMINI_API_KEY=your_key node scripts/generate-sprites.mjs

# Generate audio (needs ElevenLabs + Gemini keys)
ELEVENLABS_API_KEY=your_key node scripts/generate-game-sfx.mjs
GEMINI_API_KEY=your_key node scripts/generate-music-gemini.mjs
```

## Story: "The Ink Curse Across Time"

The slow-motion mechanic IS the curse. Every time you use focus (slow-mo), the Ink Curse spreads. The curse tears through time, pulling the player across eras.

| Act | Setting | Rooms | Theme | Music |
|-----|---------|-------|-------|-------|
| Prologue | Mountain Dojo | 0-4 | Training with Sensei | music_forest |
| Act 1 | Feudal Forest | 5-19 | Fleeing, Shadow encounter | music_forest |
| Act 2 | Edo Castle Town | 20-26 | Time rift, Kunoichi ally | music_edo |
| Act 3 | Neon Tokyo | 27-33 | Cyberpunk, Hacker ally | music_neon |
| Act 4 | Underground | 34-39 | Nightclub stealth | music_nightclub |
| Act 5 | Spirit Realm | 40-46 | Truth, final battle | music_spirit |
| Epilogue | Dojo Return | 47-49 | Resolution | music_epilogue |

**Characters**: TinySenpai (player), Sensei, Shadow (antagonist), Elder, Kunoichi, Lord Katsura, Hacker, Fox Spirit

**Multiple endings** based on accumulated choices (compassion vs duty path).

---

## Architecture

All game code in `src/game/`:

| File | Lines | Purpose |
|------|-------|---------|
| `Game.jsx` | ~430 | React wrapper — menus, loading, game loop, screen states |
| `engine.js` | ~2200 | Physics, combat, collision, stealth, room management, camera |
| `renderer.js` | ~2700 | Canvas drawing — sprites, backgrounds, parallax, effects, HUD |
| `entities.js` | ~530 | Player + 12 enemy type factories + AI state machines |
| `storyRenderer.js` | ~700 | Canvas story scenes — typing, choices, entrance animations |
| `story.js` | ~600 | Dialogue, choices, scene configs, triggers, epilogue builder |
| `levels.js` | ~1600 | 50 room definitions with platforms, enemies, hazards, hide spots |
| `sprites.js` | ~200 | PNG loading with gray-bg removal, critical/deferred split |
| `audio.js` | ~430 | ElevenLabs MP3 + jsfxr fallback, 3 buses, crossfade, ambient themes |
| `input.js` | ~140 | Keyboard + mobile touch, story mode input |
| `constants.js` | ~140 | Physics, enemy configs, acts, camera, palettes, helpers |

### Key Patterns
- **No game framework** — pure Canvas 2D API
- **Inline styles only** — no CSS files
- **State in game object** — `gameRef.current` holds all game state
- **React for UI only** — menus, loading, pause overlay; gameplay is 100% canvas
- **Sprite loading**: Critical sprites load first (player, room 0 enemies, BGs), deferred sprites load in background
- **Audio**: 3 independent buses (SFX 0.25, Music 0.18, Ambient 0.10), tab auto-pause

---

## Player Mechanics

### Movement
| Action | Speed | Controls |
|--------|-------|----------|
| Run | 280 px/s | A/D or arrows |
| Crouch | 100 px/s | Hold S/Down (stealth) |
| Jump | -560 initial vy | W/Up/Space |
| Wall jump | 1.6x horizontal | Jump while wall-sliding |
| Wall slide | 100 max fall | Touch wall while airborne |
| Wall run | See below | Hold Dash while wall-sliding or hold Dash + jump at wall |
| Dash | 700 px/s, 230ms | L/C, 500ms cooldown, i-frames |

### Wall Run + Backflip
| Parameter | Value |
|-----------|-------|
| Trigger | Hold Dash (L/C) while wall sliding, OR hold Dash + jump at wall (auto-triggers on contact) |
| Grace buffer | 300ms — dash pressed slightly before wall contact still works |
| Wall detection | 12px tolerance |
| Phase 1 — Wall Climb | 350ms duration, wall_climb1/wall_climb2 sprites alternating every 100ms, vy=-260 upward, player faces INTO wall |
| Phase 2 — Backflip | Auto-launches: JUMP_FORCE*1.3 up + MOVE_SPEED*2.0 horizontal away + 20px instant push |
| Cinematic | 0.35x slow-mo, 1.12x camera zoom, 300ms invincibility |
| Momentum | vx *= 0.98 drag, position uses Math.max(dt, rawDt*0.6) for visible launch during slow-mo |
| Cooldown | 500ms prevents re-trigger, _lastWallX prevents wall re-grab |

### Combat — 4-Hit Combo
| Hit | Duration | Special |
|-----|----------|---------|
| 1st | 150ms | Horizontal cut |
| 2nd | 150ms | Upward arc |
| 3rd | 375ms | Lightning slide, slash-through |
| 4th | 225ms | Piercing thrust (goes through enemies) |

- **350ms combo window** between hits
- **350ms cooldown** after full 4-hit combo (prevents spam)
- **Slash range**: 75px horizontal
- **Focus/Slow-mo**: Hold K/X/Shift → 25% time scale, drains meter

### Stealth System
- **Crouch**: 40% detection range, 100px/s speed
- **Hide spots**: Enter tallGrass/crate/barrel while crouching → invisible
- **Visibility**: 0-1 float (shadow=0.3×, crouch=0.4×, hidden=0, attacking+0.5)
- **Noise**: Decays 2.0/s, spikes on slash (+0.8), run (+0.3/s), land (+0.5)
- **Stealth kill**: Behind enemy + visibility<0.5 = instant silent kill, 3× score

### Tutorial Enforcement (Rooms 0-4)
Each tutorial room FORCES the skill it teaches:
- **Room 0 (Slash)**: Crate blocks exit — must slash to pass. Exit rejected if breakables remain.
- **Room 1 (Jump)**: Wide gaps between platforms — can't reach dummies without jumping.
- **Room 2 (Dash-Slash)**: Shielded dummy blocks ALL normal attacks (including backstab). Only dash-slash works. Shows "DASH + SLASH!" hint on block.
- **Room 3 (Wall Jump)**: Shaft geometry enforces wall jumping. No cheese path.
- **Room 4 (Slow-Mo)**: Shuriken gauntlet — sensei throws projectiles too fast to dodge normally. Must use slow-mo.

### Title Cards
Dramatic crimson kanji calligraphy at major zone transitions (9 rooms). Uses "Yuji Boku" brush font from Google Fonts. Dark anime art backgrounds. Shamisen sting SFX. 3.2s hold, skippable after 0.8s. Defined in `TITLE_CARD_ROOMS` set in story.js.

### Scene Image Editing
Cutscene backgrounds created by editing existing bg images with Gemini API (send original + edit prompt). Blood, shadows, damage are added to the SAME room so characters stay visible. Each variant = ONE change from the original base image.

### Exit Doors (Room 6+)
After last kill in combat rooms, "open" roomState: music fades out over 2s, cyan exit glow appears at right edge. Player must run to exit to trigger room clear + star rating. Tutorial rooms (0-4) exempt.

### Cinematic Beat System
Story renderer supports: bgSwap, sfx, musicChange, musicStop, shake, pause, flash, blackout, persistentBlack, overlay, centerImage, clearCenter, charSwap, characterExit. Beats can have `condition` flags for choice-branched content.

---

## Enemy Types (12)

| Type | HP | Zone | Special Behavior |
|------|-----|------|-----------------|
| Oni | 1 | All | Basic melee, windup telegraph |
| Ninja | 1 | All | Throws shurikens, retreats when close |
| Samurai | 2 | All | Blocks frontal attacks, must backstab |
| Archer | 1 | All | Parabolic arrows, retreats |
| Brute | 3 | All | Charge attack, exhausted after |
| Tengu | 1 | All | Flying, sine-wave hover, swoops |
| Ronin | 1 | Edo | Fast melee, wider patrol |
| Cyber Ninja | 1 | Neon | 150px teleport-dash, fast shurikens |
| Bouncer | 3 | Night | Charge + grab, 2.2× speed |
| Monk | 2 | Spirit | Block-first AI (staff), slow attack window |
| Spirit Fox | 1 | Spirit | Flying, illusion clones |
| Cursed Ronin | 3 | Spirit | Dark mirror of player, dash + combo |

### Enemy Detection AI (3-state)
1. **Unaware** (patrolling) → suspicion builds when player visible/noisy
2. **Suspicious** (? indicator) → walks to last known position, searches
3. **Alert** (! indicator) → full chase, propagates to nearby enemies within 300px

Detection range modified by: crouch (×0.4), shadow zone (×0.3), hidden (invisible)

---

## Room System

### 50 Rooms, 7 Acts
Defined in `levels.js`. Each room specifies:
```javascript
{
  title: { jp, en },
  theme: "dojo"|"forest"|"edo"|"neonTokyo"|"nightclub"|"spirit",
  platforms: [{ x, y, w, h?, wall?, oneWay? }],
  enemies: [{ type, x, y?, passive? }],
  shadows: [{ x, w }],           // Stealth shadow zones
  hideSpots: [{ type, x, w }],   // Stealth hide spots
  movingPlatforms: [{ x, y, w, moveX, moveY, speed, offset }],
  hazards: [{ type, x, y, w, h, onTime, offTime, offset }],
  breakables: [{ type, x, y, w, h }],
  deco: [{ type, x }],
  objective: { type: "killAll"|"parkour"|"survive"|"stealth", ... },
}
```

### Platform Types
- **Standard**: `{ x, y, w }` — land on top only
- **Wall block**: `{ x, y, w, h, wall: true }` — solid sides, wall-jumpable
- **One-way**: `{ x, y, w, oneWay: true }` — jump through from below, press down to drop
- **Moving**: sine-wave motion, player rides with it
- **Stairs**: `makeStairs(startX, startY, endX, endY, steps)` helper

### Objective Types
- **killAll** (default): Destroy all enemies
- **parkour**: Reach exit within time limit
- **survive**: Survive N enemy waves
- **stealth**: Reach exit without triggering alerts

### Hazards
- **Spikes**: Static instant kill
- **Fire jet**: Timer-based on/off, 500ms telegraph
- **Falling platform**: Shakes when stood on, drops, respawns in 3s
- **Laser grid**: Thin beam, timer toggle, flicker telegraph
- **Electric floor**: Ground section zaps periodically

---

## Visual System

### Multi-Layer Parallax
Rooms can define 4 background layers:
```javascript
bg: { far: "bg_edo_far", mid: "bg_edo_mid", near: "bg_edo_near", fg: "bg_edo_fg", tint: "rgba(20,10,5,0.15)" }
```
- Far: 0.1× scroll speed (distant mountains)
- Mid: 0.3× (buildings)
- Near: 0.6× (foreground objects)
- FG: 1.2× (overlay rendered AFTER world objects)
- Falls back to single-image parallax for rooms without `bg` property

### Theme Palettes (8)
`dojo`, `forest`, `temple`, `neon`, `edo`, `neonTokyo`, `nightclub`, `spirit`

Each defines: sky gradient, ground color, platform accent/base/dark, wall colors, star color, fog color, building colors, window color.

### Story Scenes (Canvas-rendered)
- Characters stand in pixel-art backgrounds with COVER scaling
- Entrance animations: walk_in (easeOutCubic slide), already_there, fade_in
- Typing animation with voice blips (per-character pitch)
- Choice boxes with slide-in animation, number keys, timer bar
- Conditional dialogue based on accumulated choice flags

---

## Asset Generation

### Sprites — `scripts/generate-sprites.mjs`
**Model**: Gemini 3.1 Flash Image Preview (`gemini-3.1-flash-image-preview`)

**2-pass self-referencing**:
1. Pass 1: Generate `_idle` sprite for each character using game-wide references (player, oni, ninja PNGs)
2. Pass 2: Generate all other poses using that character's OWN idle as primary reference

**Art style**: Chibi pixel art, chunky black outlines, oversized head (40-50% body), 32×32 logical rendered as 1024×1024, gray #808080 background (removed at runtime).

All sprites face LEFT by default. ~170 sprite definitions total.

### Audio — `scripts/generate-game-sfx.mjs` + `scripts/generate-music-gemini.mjs`
- **SFX**: ElevenLabs `eleven_text_to_sound_v2` (short clips 0.4-1.5s)
- **Music**: Gemini Lyria 3 `lyria-3-clip-preview` (30s loops)
- **Ambient**: Mixed (ElevenLabs for rain/forest, Gemini for city/spirit)
- **Fallback**: jsfxr synthesized sounds for any missing MP3

### Asset Inventory
- **~170 sprite PNGs** in `public/images/tinysenpai/game/`
- **~70 audio MP3s** in `public/audio/game/`
- **Gray bg removal**: Runtime canvas pixel processing (tolerance for near-gray tints)
- **Never delete assets** — archive old versions in `archive_v1/`, `archive_v2/`, `archive_v3/`

---

## Controls

| Action | Desktop | Mobile | Story Mode |
|--------|---------|--------|------------|
| Move | A/D, Arrows | Left/Right zones | — |
| Jump | W/Up/Space | Center tap | — |
| Slash | J/Z | Bottom-right | — |
| Dash | L/C | Mid-right | — |
| Focus | K/X/Shift | Top-right | — |
| Crouch | S/Down (hold) | — | — |
| Advance text | — | — | Space/Enter/Tap |
| Choose option | — | — | 1/2/3 keys, tap choice |
| Navigate choices | — | — | Up/Down arrows |
| Pause | ESC/P | — | — |

---

## In-World NPC System (Katana Zero Style)

Two dialogue systems exist:
1. **Story overlay** (storyRenderer.js) — full-screen canvas scene, used for major multi-character scenes (rooms 1-4, act transitions)
2. **In-world NPCs** (entities.js + engine.js) — characters placed in the actual game world, dialogue triggers on proximity

### How In-World NPCs Work
```javascript
// In levels.js room definition:
npcs: [
  { charKey: "sensei", x: 600, facing: -1, dialogueKey: 0, stayForever: true, triggerRange: 100 },
]
```
- `charKey`: matches CHARACTERS in story.js (sensei, shadow, kunoichi, etc.)
- `dialogueKey`: key into ROOM_DIALOGUE for this NPC's lines
- `triggerRange`: player must be this close (px) to trigger dialogue
- `exitAfter`: NPC walks offscreen after dialogue ends
- `stayForever`: NPC remains in room after dialogue

### NPC States
1. `walking_in` → walks to target position (uses walk1/walk2 sprites)
2. `idle` → standing still, faces player when nearby
3. `talking` → dialogue active, uses emotion sprites
4. `walking_out` → leaves the scene after dialogue

### Dialogue During Gameplay
- Renders at bottom of screen (semi-transparent panel, 20% height)
- Game continues at 0.6x speed (not frozen)
- Space/Enter/click advances text
- Player can't move during dialogue (input captured)
- Japanese + English text with typing animation

### Converting Rooms to NPC System
To convert a story overlay room to in-world NPC:
1. Add `npcs: [...]` to room definition in levels.js
2. Remove room number from STORY_TRIGGERS in story.js
3. Keep dialogue in ROOM_DIALOGUE (NPCs reference it via dialogueKey)

### NPC Sprites Needed Per Character
- `story_{char}_idle.png` — standing
- `story_{char}_walk1.png` — walk frame 1
- `story_{char}_walk2.png` — walk frame 2
- `story_{char}_{emotion}.png` — emotion variants (serious, amused, angry, etc.)

---

## Known Issues & Gotchas

### Rain Indoors
Rain particles are spawned in engine.js based on room theme. Indoor themes (dojo, nightclub, neonTokyo) skip rain. If rain appears indoors, check:
1. Room has `theme: "dojo"` set in levels.js
2. `setAmbientTheme()` is called in loadRoom and before story scenes
3. Engine rain check at line ~290 uses `roomTheme` variable

### Sprite Loading
- Critical sprites (3) load synchronously, everything else is fire-and-forget
- `loadGameImages()` returns `Promise.resolve()` immediately — never blocks
- Gray backgrounds removed OFFLINE (not runtime) — see `scripts/remove-gray-bg.mjs`
- Missing sprites → renderer uses procedural fallback (colored shapes)
- New sprites must be registered in `sprites.js` loadGameImages()

### Story Triggers vs NPC Dialogue
- `STORY_TRIGGERS` in story.js maps room→dialogue for the **overlay** system
- NPCs use `dialogueKey` to reference **the same** ROOM_DIALOGUE entries
- A room should use ONE system, not both. Remove from STORY_TRIGGERS when adding NPCs.

### Audio Initialization Race
- `initAudio()` is fire-and-forget (don't await)
- `setAmbientTheme()` always processes (no early return for same theme)
- `startMusic()` starts ambient with current theme — call setAmbientTheme FIRST

### Vercel Deployment Cache
- Changes may take 30-60s to propagate after push
- Hard refresh (Ctrl+Shift+R) to bypass CDN cache

---

## Save System
- Auto-saves after each room clear: room number, score, deaths, stars, time, choices
- `localStorage` key: `nihongo-game-save`
- Resume from last cleared room via stage select

## Screen States
| State | Renders | Game Loop |
|-------|---------|-----------|
| menu | React JSX | No |
| loading | React JSX (斬 + bar) | No |
| playing | Canvas (world + HUD) | Yes 60fps |
| story | Canvas (storyRenderer) | Yes (typing) |
| paused | Canvas + React overlay | No |
| victory | React JSX | No |
