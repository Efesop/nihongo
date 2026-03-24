# TinySenpai — Side-Scroller Game

A Katana Zero-inspired action side-scroller living in the "Game" tab of TinySenpai. Built entirely on HTML5 Canvas with no external game libraries.

## Vision & Direction

The game is a fun break from Japanese study — a fast-paced pixel-art action platformer where TinySenpai the samurai mascot slashes through 10 rooms of escalating difficulty. The core loop is:

1. **Enter room** → kill all enemies → get star rating (speed-based)
2. **Progress** through 10 rooms with increasing complexity and enemy count
3. **Score** builds via combo multiplier, stealth kills, and deflections
4. **Victory** screen after clearing all 10 rooms with final score + high score tracking

### Design Pillars
- **Fast & lethal**: One-hit kills both ways. Every encounter is decisive.
- **Stylish combat**: 3-hit combo, dash i-frames, slow-mo focus, shuriken deflection
- **Arcade flow**: Instant restart on death, no loading, momentum preservation
- **Visual polish**: Per-state sprites, particle effects, screen shake, blood trails, rain, fog

### Future Plans (Not Yet Implemented)
- Japanese integration (kana appear during combat, quiz gates between rooms)
- More environments (Temple Gardens, Neon Tokyo, Castle Interior)
- Boss fights
- Unlockable abilities tied to learning progress
- Parry mechanic (sprites ready)

---

## Architecture

The game lives in `src/game/` as a self-contained module:

| File | Purpose |
|------|---------|
| `Game.jsx` | React wrapper — menus, loading screen, game loop, screen states, mute toggle |
| `engine.js` | Update loop — physics, combat, collision, particles, camera, room management, knockback death physics |
| `renderer.js` | All canvas drawing — player, enemies (per-state sprites), backgrounds, fog, rain, effects, transitions, HUD |
| `entities.js` | Player & enemy factories + enemy AI state machines |
| `sprites.js` | PNG loading with gray-bg removal for all characters (player 20+, oni 13, ninja 13, samurai 2) |
| `audio.js` | ElevenLabs MP3 primary + jsfxr fallback, Web Audio API, 3 buses (SFX/music/ambient), tab pause |
| `levels.js` | 10 room definitions with solid wall-jump shafts, entry/exit points |
| `input.js` | Keyboard + mobile touch zone handlers |
| `constants.js` | Physics, ENEMY_CONFIG, camera/combat constants, color palette, helpers |

### Audio System
- **48 MP3 files** generated via ElevenLabs Sound Effects API (`scripts/generate-game-sfx.mjs`)
- **3 audio buses**: SFX (0.25), Music (0.18), Ambient (0.10) — independent volume
- **Phased loading**: Critical SFX → music/ambient → gameplay SFX (all parallel via Promise.allSettled)
- **Exclusive channels**: New slash cancels previous (no overlap)
- **playRandom()**: Variant groups so sounds never repeat (6 swooshes, 3 deaths per enemy, 3 footsteps)
- **Tab visibility**: AudioContext suspends when tab hidden, resumes on return
- **Per-environment music**: `setMusic("music_forest")` — ready for biome switching

### Loading
Loading screen (斬 + "LOADING" + 準備中...) shows while sprites + audio load in parallel. Game starts only when critical sounds are ready.

---

## Player Mechanics

### Movement
| Action | Speed | Notes |
|--------|-------|-------|
| Run | 280 px/s | Left/right, facing updates on direction change |
| Jump | -560 px/s initial | Gravity 1800 px/s², landing dust at high speeds |
| Wall jump | 90% jump force, 1.6x horizontal | Auto-launches to opposite wall, momentum preserved during cooldown |
| Wall slide | 100 px/s max fall | Grabs walls while airborne (no vy>0 requirement), wall_grab sound |
| Dash | 600 px/s for 110ms | 400ms cooldown, grants invincibility, afterimage trail |

### Wall Jumping
- Walls are **solid** — player can't walk through them (horizontal collision)
- Wall shafts are **open at bottom** with step platforms leading to entry
- **100px inner gap** between walls — tight enough for meaningful height gain per bounce
- Press jump while wall-sliding → auto-launch to opposite wall (no manual air steering needed)
- **wallJumpCooldown** (200ms) prevents re-grabbing same wall, allows grabbing opposite
- Dust particles trail behind player while sliding

### Combat — 3-Hit Slash Combo
Press slash up to 3 times within a 350ms combo window:

| Combo | Sound | Duration | Visual |
|-------|-------|----------|--------|
| 1st hit | Shing (blade draw) | 150ms | Horizontal cut |
| 2nd hit | Random swoosh (6 variants) | 150ms | Upward arc |
| 3rd hit | Swoosh + electric thunder | 375ms | Lightning slide, slash-through sprite |

- **Slash range**: 75px from player center
- **Vertical reach per combo**: combo 1 = ±30px (same level), combo 2 = 70px above, combo 3 = ±60px
- **Hit impact**: meaty hit_impact sound (3 variants) plays on enemy contact
- **Momentum preservation**: Player slides forward during slash

### Focus / Slow-Motion
- Hold K/X/Shift to slow time to 25%
- Meter drains at 40/s, recharges at 15/s passively, +20 per kill
- **20% minimum** to activate (prevents flicker when meter depletes)
- Purple tint + chromatic edge effect when active

---

## Enemy Types

| Type | HP | Sprites | Behavior |
|------|-----|---------|----------|
| **Oni** (demon) | 1 | 13 sprites | Patrols → chases at 70% speed → melee attack. Per-state sprites: idle, walk1/2, alert, windup, attack, dazed, hit, kneel, dead, 3 knockback poses |
| **Ninja** (shadow) | 1 | 13 sprites | Stationary sniper → fires shuriken every 900ms → retreats if close. Sprites: idle, walk1/2, alert, throw, retreat, dazed, hit, kneel, dead, 3 knockback poses |
| **Samurai** (elite) | 2 | 2 sprites | Chases at 50% speed → melee. First hit blocked (sparks), second kills. Sprites: kneel, dead (uses kneel as temp idle) |

### Enemy Sounds (per-type, random variants)
- **Oni**: growl/snarl on alert (2), roar/grunt on attack (2), howl/shriek/groan on death (3)
- **Ninja**: whisper/hiss on alert (2), breath+throw (2), gasp/choke/thud on death (3)
- **Samurai**: kiai/challenge on alert (2), strike yell (2), groan/exhale/armor on death (3)

### Death Animations

**Knockback (Combo 1 & 2):**
- Enemy launched at 600-900 px/s horizontally
- Random pose: on-back, face-down tumble, or on-butt seated
- Slides along ground with blood stain trail + spraying droplets
- Falls off platform edges with gravity, stops at walls
- Impact VFX: white flash ring + directional sparks + slash speed lines
- Visible for 2.5 seconds

**Cinematic (Combo 3):**
- 120ms hit-stop freeze
- Phase 0: Brief white flash glow + hit sprite
- Phase 1: Kneel sprite (wounded defeat)
- Phase 2: Face-down dead sprite, fading out

### Attack Damage
- Damage window aligned with visual strike sprite (oni: timer < 200, samurai: timer < 210)
- 60px hit range

---

## Room System

10 progressively complex rooms:

| Room | Theme | Enemies | Key Feature |
|------|-------|---------|-------------|
| 1 | Tutorial corridor | 3 oni | Flat ground, learn slash |
| 2 | Vertical intro | 5 mixed | Staggered platform heights |
| 3 | Wall jump intro | 5 mixed | Shaft with step entry, samurai guard top |
| 4 | Rooftop run | 8 mixed | Long platforming gaps |
| 5 | Tower climb | 6 mixed | Tall shaft with rest ledge |
| 6 | Ninja gauntlet | 10 mixed | Elevated ninja/oni pairs |
| 7 | Double canyon | 8 mixed | Two wall-jump shafts in sequence |
| 8 | Fortress | 10 mixed | Multi-level complex structure |
| 9 | The gauntlet | 14 mixed | Wall shaft mid-run + upper/lower paths |
| 10 | Pillar arena | 9 mixed | Wide open with 4 wall-jump pillars |

### Wall Shafts
- Walls are 35px wide with stone/brick texture (mortar lines, mossy edges)
- 100px inner gap between walls
- Open at bottom for entry (step platforms lead up)
- Top platform serves as exit

### Room Flow
1. Kill last enemy → **400ms last-kill freeze** (dramatic pause, camera zoom 1.15x)
2. Room cleared → **letterbox bars** slide in, star rating displayed
3. Star rating: <6s = ★★★, <12s = ★★, else = ★
4. 2.2s pause → **fade to black** → next room → **fade in** + "ROOM X" title
5. Death → red flash + 400ms delay → restart room (input flags reset)

---

## Visual Effects

### Environment
- **Rain**: 6 drops/frame, affected by periodic wind gusts, splashes on platforms + player + ground
- **Parallax mist**: Two fog layers drifting at different speeds between BG and foreground
- **Puddles**: Ground-level dark ellipses with expanding rain ripple rings
- **Fireflies**: Pulsing green orbs with sine wave motion
- **Leaves**: Rotating, falling, pushed sideways by wind
- **Lanterns**: Dual-frequency flickering flame with warm glow radius
- **Wind gusts**: Periodic sideways push bends rain and blows leaves

### Combat
- **Impact VFX**: White flash ring + 12 directional sparks (white/gold/orange) + 4 white speed lines
- **Blood burst**: 40+ directional particles, streak lines, upward fountain
- **Blood stains**: Organic puddles on platform surfaces, persist 10s
- **Blood trail**: Continuous stains + spraying droplets while knockback body slides
- **Slash trails**: Bezier-curve blade crescents, 3-layer glow
- **Camera shake**: 180ms on kills, variable on clashes/landings

### Audio
- **48 MP3 sounds** via ElevenLabs (slash swooshes, blade shing, hit impacts, enemy grunts/deaths, footsteps, wall grab/launch, ambient rain + forest, combat music)
- **Combat**: shing on first slash, random swoosh (6) on swings, electric thunder on combo 3, meaty hit_impact (3) on contact, blood_splatter on kill
- **Movement**: geta sandal footsteps (3 variants, synced to animation), wall_grab, wall_launch
- **Music**: Taiko + shamisen + koto forest combat loop

---

## Assets

### Player Sprites — `public/images/tinysenpai/`
20 sprites with per-frame R flags. Gray bg removed on load.

Active: idle, run/1-4, slash/1-4, jump/launch+airborne, fall, dash, wallslide, wall-cling, death/hit+fallen, parry, land-heavy, slash-through

### Enemy Sprites
| Folder | Sprites | Notes |
|--------|---------|-------|
| `oni/` | 13 | demon.png (original) + idle, walk1/2, alert, windup, attack, dazed, hit, kneel, dead, kb_back, kb_tumble, kb_seated |
| `ninja/` | 13 | ninja.png (original) + idle, walk1/2, alert, throw, retreat, dazed, hit, kneel, dead, kb_back, kb_tumble, kb_seated |
| `samurai/` | 2 | kneel, dead (needs full sprite set) |

### Audio — `public/audio/game/`
48 MP3 files. Generation script: `scripts/generate-game-sfx.mjs`

---

## Controls

| Action | Desktop | Mobile Touch Zone |
|--------|---------|-------------------|
| Move left | A / ArrowLeft | Left 20% of screen |
| Move right | D / ArrowRight | 20-45% from left |
| Jump | W / ArrowUp / Space | Center 20-75% width |
| Slash | J / Z | Bottom-right (>75% x, >60% y) |
| Dash | L / C | Mid-right (>75% x, 30-60% y) |
| Focus (slow-mo) | K / X / Shift | Top-right (>75% x, <30% y) |
| Pause | ESC / P | — |

---

## Screen States

| State | Render | Loop |
|-------|--------|------|
| `menu` | React JSX (glitch title, START, controls, high score, mute) | No |
| `loading` | React JSX (斬 + LOADING + 準備中...) | No |
| `playing` | Canvas (game world, HUD) | Yes (60fps) |
| `paused` | Canvas + React overlay (RESUME/QUIT) | No |
| `victory` | React JSX (score, combo, NEW HIGH SCORE, PLAY AGAIN) | No |

---

## Technical Notes

- **Wall collision**: Walls block horizontal movement (push player out from nearest face). Skipped during wallJumpCooldown for smooth wall-jump traversal.
- **Knockback physics**: Dead enemies re-check platform bounds every frame (fall off edges), respect wall collision, blood stains placed at platform Y not enemy Y.
- **Sprite direction**: Per-sprite R flag. Enemies use ENEMY_SPRITE_MAP with state-based sprite selection. Knockback sprites flip based on knockback direction (p.facing at kill time).
- **Sound exclusive channels**: `playExclusive("slash", name)` stops previous sound before starting new one. Prevents slash sound overlap on rapid combos.
- **Delta time**: Capped at 33ms. Hit-stop freezes entire update function. Slow-mo scales dt by 0.25.
- **No external game framework**: Pure Canvas 2D API + React for UI screens.
