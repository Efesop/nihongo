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
| `Game.jsx` | ~250 | React wrapper — menus, game loop, screen states, mute toggle |
| `engine.js` | ~750+ | Update loop — physics, combat, collision, particles, camera, room management |
| `renderer.js` | ~800+ | All canvas drawing — player, enemies, backgrounds, effects, transitions, HUD |
| `entities.js` | ~140 | Player & enemy factories + enemy AI state machines |
| `sprites.js` | ~130 | PNG loading with gray-bg removal, sprite cache for projectiles |
| `audio.js` | ~220 | jsfxr sound system — 17 retro SFX, volume control, mute toggle |
| `levels.js` | ~305 | 10 room definitions (platforms, enemies, decorations, shadows) |
| `input.js` | ~101 | Keyboard + mobile touch zone handlers |
| `constants.js` | ~110 | Physics, ENEMY_CONFIG, camera/combat constants, color palette, helpers |

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
1. Kill last enemy → **400ms last-kill freeze** (dramatic pause, camera zoom 1.15x)
2. Room cleared → **letterbox bars** slide in, star rating displayed
3. Star rating: <6s = ★★★, <12s = ★★, else = ★
4. 2.2s pause → **fade to black** → next room loads → **fade in from black** + "ROOM X" title slides in
5. Victory after room 10 (score, combo, high score screen)
6. Death → red flash + 400ms delay → restart room with fade-in + death counter increment

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
- **Blood burst**: 40+ directional particles in slash direction, streak lines, upward fountain
- **Blood stains**: Large organic ellipse puddles with dark cores, persist 10s
- **Slash trails**: Long bezier-curve blade crescents (200-320px reach), 3-layer additive glow
  - Combo 1: Cyan/white horizontal blade trail
  - Combo 2: Gold/orange upward arc
  - Combo 3: Blue lightning with crackling bolts along blade + expanding shockwave rings
- **Speed lines**: Horizontal particle lines during dash/slash, more on higher combos
- **Sparks**: Blue/white on clash, red/yellow/orange on kills
- **Impact ripple**: Expanding circle ring on enemy kill
- **White flash particles**: Additive blending (`globalCompositeOperation: "lighter"`) for actual glow
- **Enemy attack effects**: Oni red arc trail + ground telegraph, ninja purple energy buildup, samurai blue shield + red katana glow

### Post-Processing
- **Kill flash**: White overlay ~20% opacity for 120ms
- **Slow-mo tint**: Purple overlay + red/blue chromatic strips
- **Scanlines**: 3px spacing, 5% opacity (CRT effect)
- **Vignette**: Radial gradient darkening edges
- **Camera zoom**: 1.08x on kills, 1.12x on 3rd combo, 1.15x on milestones, 0.97x during slow-mo

### Feedback
- **Hit-stop**: 70-120ms freeze on impact (enemy kill = 70ms, clash = 120ms)
- **Camera shake**: Variable amplitude/duration on kills, landings, clashes
- **Camera look-ahead**: 80px offset in player's facing direction during movement
- **Last-kill freeze**: 400ms dramatic pause when final room enemy dies
- **Floating text**: CLASH!, DOUBLE KILL!, STEALTH, DEFLECT! — scale up and fade
- **Death flash**: Red tint overlay on room restart
- **Squash/stretch**: Player scales on jump (0.9x/1.1x), landing (1.15x/0.85x), dash (1.2x/0.8x), slash
- **Letterbox**: Black bars slide in on room clear for cinematic effect
- **Fade overlay**: Rooms fade in from black on load
- **Room title**: "ROOM X" text slides in/out on room start

### Audio (jsfxr)
17 retro 8-bit sound effects generated at runtime via jsfxr library:
- **Combat**: slash1/2/3 (progressive intensity), kill (pitch varies by enemy), clash, deflect
- **Movement**: jump, land (volume scales with fall speed), dash, footsteps, wall slide
- **UI**: room clear chime, menu start stab, combo milestone ping
- **Ambient**: slow-mo on/off sweeps, shuriken throw
- Mute toggle in menu, persisted in localStorage

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

### Player Sprites — `public/images/tinysenpai/`
Sprites face MIXED directions (measured by pixel analysis). Each has a per-frame `R` flag in `CROPS` object.

| Sprite | Path | Faces | R flag |
|--------|------|-------|--------|
| Idle | `tinysenpai/idle.png` | LEFT | false |
| Run 1 | `tinysenpai/run/1.png` | LEFT | false |
| Run 2 | `tinysenpai/run/2.png` | LEFT | false |
| Run 3 | `tinysenpai/run/3.png` | LEFT | false |
| Run 4 | `tinysenpai/run/4.png` | LEFT | false |
| Slash 1 | `tinysenpai/slash/1.png` | LEFT | false |
| Slash 2 | `tinysenpai/slash/2.png` | RIGHT | true |
| Slash 3 | `tinysenpai/slash/3.png` | LEFT | false |
| Slash 4 | `tinysenpai/slash/4.png` | RIGHT | true |
| Jump launch | `tinysenpai/jump/launch.png` | LEFT | false |
| Jump airborne | `tinysenpai/jump/airborne.png` | RIGHT | true |
| Fall | `tinysenpai/fall.png` | LEFT | false |
| Wall slide | `tinysenpai/wallslide.png` | RIGHT | true |
| Dash | `tinysenpai/dash.png` | LEFT | false |
| Death hit | `tinysenpai/death/hit.png` | LEFT | false |
| Death fallen | `tinysenpai/death/fallen.png` | LEFT | false |

### Enemy Sprites
| Sprite | Path | Faces | Crop Rect |
|--------|------|-------|-----------|
| Oni (demon) | `public/images/demon.png` | LEFT | 170, 160, 690, 670 |
| Ninja | `public/images/ninja.png` | LEFT | 150, 230, 780, 570 |
| Samurai | *Procedural fallback (no PNG yet)* | — | — |

### Environment
| Asset | Path |
|-------|------|
| Forest background | `public/images/forest.png` |
| Temple background | *Not yet created* |
| Neon Tokyo background | *Not yet created* |
| Castle background | *Not yet created* |

### Adding New Sprites
See [SPRITES.md](SPRITES.md) for generation prompts and complete asset list.

**Critical rules:**
1. **Measure direction** with PIL pixel-weight analysis — NEVER guess
2. Set the `R` flag per-sprite in `CROPS` object in `renderer.js`
3. Load with `removeGrayBg = true` in `sprites.js`
4. All sprites draw at identical `DRAW_W × DRAW_H` — no per-sprite sizing
5. Gray background auto-removed on load (avg > 100, maxDiff < 35)

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

### Sprite direction: MEASURE, don't guess
AI-generated sprites face unpredictable directions. Use PIL pixel-weight analysis to objectively measure which way each sprite faces. Set per-frame `R` flags in CROPS. This was learned after 6+ failed iterations of guessing directions visually.

### Gray background removal — ALWAYS enable
ALL player and enemy sprites must be loaded with `removeGrayBg = true` in `loadGameImages()`. The algorithm makes gray/near-gray pixels transparent at load time (avg > 100, maxDiff < 35). Forgetting this causes visible gray rectangles around sprites.

### Consistent sprite sizing
ALL player sprites must draw at the same `DRAW_W × DRAW_H` regardless of the source image aspect ratio. Otherwise the character grows/shrinks between animation states (e.g., run sprites are squarer, making character taller; jump sprites are narrower, making character smaller).

### Undefined variable references crash the game loop
If `render()` throws a ReferenceError (e.g., accessing undefined constants), `requestAnimationFrame(loop)` never executes and the game freezes. Always verify constants exist before deploying. The original freeze was caused by `IDLE_CROP` and `SLASH_CROP` being referenced after they were refactored into the `CROPS` object.

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
