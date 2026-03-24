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
- **Visual polish**: Particle effects, screen shake, blood, afterimages, rain, scanlines

### Future Plans (Not Yet Implemented)
- Japanese integration (kana appear during combat, quiz gates between rooms)
- More enemy types (Armored Ronin with PNG sprite)
- More environments (Temple Gardens, Neon Tokyo, Castle Interior)
- Boss fights
- Unlockable abilities tied to learning progress

---

## Architecture

The game lives in `src/game/` as a self-contained module:

| File | Lines | Purpose |
|------|-------|---------|
| `Game.jsx` | ~238 | React wrapper — menus, game loop, screen states (menu/playing/paused/victory) |
| `engine.js` | ~709 | Main update loop — physics, combat, collision, particles, room management, scoring |
| `renderer.js` | ~700+ | All canvas drawing — player, enemies, backgrounds, effects, HUD |
| `entities.js` | ~136 | Player & enemy factory functions + enemy AI state machines |
| `sprites.js` | ~126 | PNG image loading, gray-bg removal, small sprite cache for projectiles |
| `levels.js` | ~305 | 10 room definitions (platforms, enemies, decorations, shadows) |
| `input.js` | ~101 | Keyboard + mobile touch zone handlers |
| `constants.js` | ~88 | Physics values, color palette, math helpers |

### Integration with Main App
```jsx
// In App.jsx — just one line to render
{tab === "game" && <Game theme={theme} c={c} isDesktop={isDesktop} SIDEBAR_W={SIDEBAR_W} />}
```

Game state lives in a `useRef` (not `useState`) to avoid React re-renders at 60fps. The game loop runs via `requestAnimationFrame`.

---

## Player Mechanics

### Movement
| Action | Speed | Notes |
|--------|-------|-------|
| Run | 280 px/s | Left/right, facing updates on direction change |
| Jump | -560 px/s initial | Gravity 1800 px/s², landing dust at high speeds |
| Wall jump | 85% jump force | Launch away from wall, capped fall speed while sliding |
| Wall slide | 100 px/s max fall | Activates on wall-flagged platforms when falling |
| Dash | 600 px/s for 110ms | 400ms cooldown, grants invincibility, afterimage trail |

### Combat — 3-Hit Slash Combo
Press slash up to 3 times within a 350ms combo window:

| Combo | Lunge Speed | Duration | Visual |
|-------|-------------|----------|--------|
| 1st hit | 600 px/s | 150ms | Horizontal cut, white slash trail |
| 2nd hit | 720 px/s | 150ms | Upward arc, white slash trail |
| 3rd hit | 960 px/s | 375ms | Lightning slide, blue sparks + speed lines |

- **Slash range**: 75px from player center
- **Can hit multiple enemies** per swing (each enemy tracked to prevent double-hit)
- **Momentum preservation**: Player slides forward during slash

### Focus / Slow-Motion
- Hold K/X/Shift to slow time to 25%
- Meter drains at 40/s, recharges at 15/s passively, +20 per kill
- Purple tint + chromatic edge effect when active

### Afterimages
Dash and slash create semi-transparent afterimage clones that fade over ~200ms.

---

## Enemy Types

| Type | HP | Alert Range | Behavior |
|------|-----|------------|----------|
| **Oni** (demon) | 1 | 200px | Patrols → chases at 70% speed → melee attack at 65px range. Club swing with wind-up animation. |
| **Ninja** (shadow) | 1 | 350px | Stationary sniper → fires shuriken (450 px/s) every 900ms → retreats at 150 px/s if player close |
| **Samurai** (elite) | 2 | 200px | Patrols → chases at 50% speed → melee attack at 60px. First hit blocked (sparks), second kills. |

### Enemy AI Details
- **Vision**: Can't see player in shadow zones or when facing away (except within 40px)
- **Dazed state**: After clash, stunned for 1000ms (wobble animation, dizzy stars)
- **Platform clamping**: Enemies stay on their platform (15px inset from edges)
- **Cooldown**: 300-400ms pause after attack before re-engaging (prevents flicker)

### Clash Mechanic
When player's slash collides with enemy's attack frame simultaneously:
- Both knocked back (player gets 500ms i-frames, enemy dazed 1000ms)
- "CLASH!" floating text, 120ms hit-stop, camera shake
- Blue/white spark shower

---

## Room System

10 progressively complex rooms:

| Room | Theme | Enemies | Key Feature |
|------|-------|---------|-------------|
| 1 | Tutorial corridor | 3 oni | Flat ground, learn slash |
| 2 | Vertical intro | 5 mixed | Staggered platform heights |
| 3 | Wall jump shaft | 5 mixed | Vertical walls to climb, samurai guard |
| 4 | Rooftop run | 8 mixed | Long platforming gaps |
| 5 | Tower assault | 9 mixed | Interior staircase with walls |
| 6 | Ninja gauntlet | 10 mixed | Elevated ninja/oni pairs, shurikens everywhere |
| 7 | Canyon | 8 mixed | Two narrow wall-jump canyons |
| 8 | Fortress | 10 mixed | Multi-level complex structure |
| 9 | The gauntlet | 14 mixed | Long + wall section + upper/lower paths |
| 10 | Boss arena | 9 mixed | Wide open with 4 wall-jump pillars |

### Room Flow
1. All enemies dead for 0.5s → room cleared
2. Star rating: <6s = ★★★, <12s = ★★, else = ★
3. 2-second pause showing rating → next room loads (or victory after room 10)
4. Death → instant restart of current room (400ms delay), death counter increments

### Platform Types
```javascript
{ x, y, w }                    // Standard thin platform (land on top)
{ x, y, w, h, wall: true }     // Solid wall block (wall-jumpable sides)
```

### Decorations
- **Torii gates**: Red arches drawn procedurally
- **Lanterns**: Glowing orbs with pulsing light
- **Signs**: Kanji characters on posts

### Shadow Zones
Dark overlay areas where player becomes semi-transparent. Killing an enemy from shadow = **stealth kill** (double points + "STEALTH" text).

---

## Scoring System

| Action | Points |
|--------|--------|
| Kill oni | 100 × combo |
| Kill ninja | 150 × combo |
| Kill samurai | 300 × combo |
| Stealth kill | 2× above |
| Deflect shuriken | 150 flat |

- **Combo timer**: 2 seconds per kill, resets on each kill
- **Combo labels**: DOUBLE (2), TRIPLE (3), QUAD (4), PENTA (5), HEXA (6), ULTRA (7+)
- **High score**: Persisted in localStorage (`nihongo-game-highscore`)

---

## Visual Effects

### Ambient (always running)
- **Fireflies**: Pulsing green orbs, float with sine wave motion
- **Drifting leaves**: Green shapes rotating and falling
- **Dust motes**: Tiny white particles drifting
- **Rain**: Diagonal streaks with splash particles on ground impact

### Combat
- **Blood burst**: 20 red particles on enemy kill, persistent ground stains
- **Slash trail**: Tapered tear/rip shape, 3 opacity layers (glow → mid → core), varies by combo
- **Speed lines**: Horizontal particle lines during dash/slash, more on higher combos
- **Sparks**: Blue/white on clash, red/yellow/orange on kills
- **Lightning**: Blue spark shower + bolt lines on 3rd combo hit

### Post-Processing
- **Kill flash**: White overlay ~20% opacity for 80ms
- **Slow-mo tint**: Purple overlay + red/blue chromatic strips
- **Scanlines**: 3px spacing, 5% opacity (CRT effect)
- **Vignette**: Radial gradient darkening edges

### Feedback
- **Hit-stop**: 70-120ms freeze on impact (enemy kill = 70ms, clash = 120ms)
- **Camera shake**: Variable amplitude/duration on kills, landings, clashes
- **Floating text**: CLASH!, DOUBLE KILL!, STEALTH, DEFLECT! — scale up and fade
- **Death flash**: Red overlay on room restart

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

Mobile shows faint button zone outlines on the HUD.

---

## Assets

### Player Sprites
All face **LEFT** by default. Flipped via `ctx.scale(-1, 1)` for right-facing.

| Sprite | Path | Crop Rect (x,y,w,h) |
|--------|------|---------------------|
| Idle | `public/images/tinysenpai2.png` | 64, 160, 896, 660 |
| Run 1-4 | `public/images/tinysenpairun/ts{1-4}.png` | 140, 140, 750, 730 |
| Slash 1-4 | `public/images/tinysenpaistrike/{1-4}.png` | 80, 100, 860, 800 |
| Jump (launch) | `public/images/tinysenpaiother/jump1-launch.png` | 160, 190, 700, 650 |
| Jump (airborne) | `public/images/tinysenpaiother/jump2-airborne.png` | 250, 150, 600, 720 |
| Fall | `public/images/tinysenpaiother/fall.png` | 260, 60, 550, 860 |
| Wall slide | `public/images/tinysenpaiother/wall-slide.png` | 140, 120, 660, 800 |
| Dash | `public/images/tinysenpaiother/dash.png` | 60, 210, 900, 600 |
| Death (hit) | `public/images/tinysenpaiother/death1-hit.png` | 100, 80, 810, 800 |
| Death (fallen) | `public/images/tinysenpaiother/death2-fallen.png` | 80, 420, 920, 310 |

### Enemy Sprites
| Sprite | Path | Crop Rect |
|--------|------|-----------|
| Oni (demon) | `public/images/demon.png` | 170, 160, 690, 670 |
| Ninja | `public/images/ninja.png` | 150, 230, 780, 570 |
| Samurai | *Procedural fallback (no PNG yet)* | — |

### Environment
| Asset | Path |
|-------|------|
| Forest background | `public/images/forest.png` |

### Generating New Assets
See [SPRITES.md](SPRITES.md) for pixel art prompt templates. Key rules:
- 1024x1024 PNG, pixel art, chibi proportions
- All characters face **LEFT**
- Gray background (auto-removed on load via `sprites.js`)
- Black pixel outlines, consistent style with `tinysenpai2.png`

---

## Technical Gotchas

### Subpixel rendering jitter
All pixel art (`imageSmoothingEnabled = false`) must be drawn at whole-pixel coordinates. Camera lerps produce floats — **always `Math.round()`** the camera translation. Also round enemy draw positions.

### Platform mapping must preserve wall properties
`loadRoom()` and `initGame()` map room platforms. Must copy `wall: true` and actual `h` for wall platforms, not hardcode `h: 16`. Wall sliding/jumping depends on `plat.wall` being set.

### Enemy platform detection: `>=` not `>`
After snapping `e.y = plat.y - TILE*SCALE`, feet are at exactly `plat.y`. Strict `>` fails next frame → gravity drop → re-snap → jitter. Use `>=`.

### Enemy movement order: AI → move → clamp
(1) AI sets `e.vx`, (2) `e.x += e.vx * dt`, (3) clamp to platform bounds. If movement is inside the AI function, enemy oscillates past edges.

### Enemy attack cooldown
Enemies that attack → timer expires → patrol → immediately re-attack (player still close) will flicker. A `cooldown` state (300-600ms) between attack and patrol prevents this.

### Canvas DPR scaling
`canvas.width/height` are device pixels (×DPR). Game logic uses CSS pixels. `ctx.setTransform(dpr, ...)` handles scaling. Read `container.clientWidth/Height`, not `canvas.width/height`.

### Image source cropping
1024x1024 PNGs have padding. Use 9-argument `drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)`. Crop rects in `CROPS` object in `renderer.js`.

### Death rendering order
Dead check must come BEFORE run/jump/fall checks in `drawPlayer()`, otherwise the death sprite is never shown (pre-death state takes priority).

### Gray background removal
Enemy PNGs have gray backgrounds removed at load time by `sprites.js`. The algorithm detects pixels where `avg > 100` and `maxDiff < 35` from the average, making them transparent.

### Game container positioning
Uses `position: fixed` with `left: SIDEBAR_W` (desktop) and `bottom: 70px` (mobile). Fixed positioning is required because parent div uses `minHeight: 100vh`.

### Background panning (not tiling)
Scale background to cover viewport, pan based on camera position. Don't tile — creates visible seams.

---

## Physics Constants

```javascript
GRAVITY      = 1800    // px/s²
MOVE_SPEED   = 280     // px/s
JUMP_FORCE   = -560    // px/s (negative = up)
SLASH_DURATION = 150   // ms (375ms for 3rd combo)
SLASH_RANGE  = 75      // px from player center
DASH_SPEED   = 600     // px/s
DASH_DURATION = 110    // ms
DASH_COOLDOWN = 400    // ms
TILE         = 20      // base sprite unit
SCALE        = 3       // pixels per sprite unit (draw size = 60px)
GROUND_Y     = 0.78    // ground at 78% of canvas height
```

---

## Screen States

| State | Render | Loop Running |
|-------|--------|--------------|
| `menu` | React JSX (glitch title, START button, controls, high score) | No |
| `playing` | Canvas (game world, HUD) | Yes (60fps) |
| `paused` | Canvas + React overlay (RESUME/QUIT) | No (frozen) |
| `victory` | React JSX (score, combo, NEW HIGH SCORE, PLAY AGAIN) | No |

---

## Notes
- Game loop: `requestAnimationFrame` → `update(g, callbacks)` → `render(g, ctx)` → repeat
- Delta time capped at 33ms (prevents physics explosions on tab-switch)
- Particle arrays are created fresh and garbage collected when `life <= 0`
- No external game framework — pure Canvas 2D API + React for UI screens
- HUD rendered directly on canvas (score, combo, room timer, deaths, meters)
