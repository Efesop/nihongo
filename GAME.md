# TinySenpai — Side-Scroller Game

A Katana Zero-inspired side-scroller mini-game living in the "Game" tab of TinySenpai.

## How It Works

### Architecture
The game lives in `src/game/` as a modular React component:

| File | Purpose |
|------|---------|
| `Game.jsx` | React shell — menus, game loop, screen states |
| `constants.js` | Physics values, color palette, math helpers |
| `sprites.js` | Image loader for PNGs + small sprite cache for projectiles |
| `levels.js` | 10 hand-crafted level segments chained together |
| `entities.js` | Player/enemy factories + enemy AI behaviors |
| `engine.js` | Main update loop — physics, combat, particles, scoring |
| `renderer.js` | All canvas rendering — player, enemies, background, effects, HUD |
| `input.js` | Keyboard + mobile touch input handlers |

### How Rendering Works
- **Player**: Loads the actual `tinysenpai2.png` mascot image and draws it with `drawImage()`. Animations are done via **canvas transforms** (rotation, scale, translate) — no sprite sheets needed.
- **Enemies**: Currently drawn with canvas primitives (procedural shapes). Will be replaced with PNG images as they're generated.
- **Background**: Procedural parallax layers (buildings, stars, moon, wires) drawn with canvas.
- **Effects**: Particles, slash arcs, screen shake, scanlines, vignette — all canvas.

### Game Mechanics
- **One-hit kills** — both player and enemies die in one hit
- **Slash** (J/Z) — 60px range, 150ms, can hit multiple enemies per swing
- **Dash** (L/C) — burst of speed with i-frames and afterimage trail
- **Focus/Slow-mo** (K/X/Shift) — time slows to 25%, meter drains, recharges on kills
- **Combo system** — kills within 2 seconds stack multipliers
- **Deflect** — slash shurikens out of the air for bonus points

### Enemy Types
| Internal Name | Role | Behavior |
|--------------|------|----------|
| `oni` | Melee attacker | Patrols, charges when player is close, one-hit attack |
| `ninja` | Ranged attacker | Throws shurikens, retreats when player approaches |
| `samurai` | Elite blocker | Blocks first slash (sparks), vulnerable after, 2HP |

### Adding a New Enemy Image
1. Generate/create a PNG (1024x1024, pixel art, transparent or solid background)
2. Save to `public/images/game/` (e.g., `oni.png`)
3. In `sprites.js`, add to the image loader
4. In `renderer.js`, update `drawEnemy()` to use the image instead of procedural shapes
5. Crop coordinates may need adjusting (like the mascot) if the character doesn't fill the full image

### Controls
| Action | Desktop | Mobile |
|--------|---------|--------|
| Move | WASD / Arrows | Touch left/right zones |
| Jump | W / Up / Space | Touch center zone |
| Slash | J / Z | Touch bottom-right |
| Dash | L / C | Touch mid-right |
| Focus | K / X / Shift | Touch top-right |
| Pause | ESC / P | — |

---

## Asset Generation Prompts

Use these prompts to generate game assets in a consistent pixel art style matching the TinySenpai mascot.

### Enemy: Oni Demon (melee attacker)
> Pixel art character, same style as a chibi samurai mascot. An oni demon — red/crimson skin, two short horns on top of head, muscular but small chibi body (large head, tiny body), wearing torn dark pants, carrying a kanabō (iron club). Angry squinting eyes, fangs visible. Black pixel outline. Facing left. Transparent background. 1024x1024. 16-bit retro game sprite style, clean pixel art, warm lighting.

### Enemy: Shadow Ninja (ranged attacker)
> Pixel art character, same style as a chibi samurai mascot. A ninja — all black/dark purple outfit, face mask showing only narrow glowing eyes, small chibi body (large head, tiny body), crouching pose, holding a shuriken in one hand. Flowing dark scarf trailing behind. Black pixel outline. Facing left. Transparent background. 1024x1024. 16-bit retro game sprite style, clean pixel art.

### Enemy: Armored Ronin (elite blocker)
> Pixel art character, same style as a chibi samurai mascot. A ronin warrior — wearing dark lacquered samurai armor with gold trim, kabuto helmet with crescent moon crest on top, menacing face plate. Small chibi body (large head, tiny body), holding a katana at ready position. Red and gold color accents. Black pixel outline. Facing left. Transparent background. 1024x1024. 16-bit retro game sprite style, clean pixel art.

### Environment: Night City Background
> Pixel art tileset, 16-bit retro game style. Japanese feudal night city rooftops — dark blue/purple sky, neon-lit wooden buildings, paper lanterns glowing orange, torii gates in dark red, cherry blossom petals. Side-scrolling platformer perspective. Dark moody atmosphere with neon accent lighting in red and purple. Seamless horizontal tile. Dark background. Clean pixel art style.

### Environment: Platform/Ground Tiles
> Pixel art tileset, 16-bit retro game style. Japanese rooftop platform tiles — dark wooden planks with subtle neon edge glow in red, seamless horizontal pattern. Include: flat ground tile, left edge, right edge. Dark color scheme. 64x64 pixels per tile. Clean pixel art.

### Sprite Sheet Prompt (for animated characters)
> Pixel art sprite sheet of [CHARACTER DESCRIPTION]. 3x3 grid on transparent background. Top row: idle pose, walk frame 1, walk frame 2. Middle row: attack wind-up, attack mid-swing, attack follow-through. Bottom row: jump, fall, hurt/death. Consistent chibi proportions (large head, small body). Clean black pixel outlines. 16-bit retro game style. Each frame same size.

---

## File Locations

| Asset | Path | Used By |
|-------|------|---------|
| Player sprite | `public/images/tinysenpai2.png` | `renderer.js` via `sprites.js` loader |
| Enemy sprites | `public/images/game/oni.png` (etc.) | `renderer.js` drawEnemy() |
| Player sprite sheets | (in Downloads, not yet integrated) | Future: frame-by-frame animation |

## Technical Gotchas (learned the hard way)

### Subpixel rendering jitter
**THE biggest gotcha.** All pixel art (`imageSmoothingEnabled = false`) must be drawn at whole-pixel coordinates. The camera position lerps and produces floats like `142.337px` — if you `ctx.translate(-cx, -cy)` with floats, every world object snaps between pixels each frame = visible vibration. **Fix**: `Math.round()` the camera translation in `render()`. Also round enemy draw positions.

### Enemy platform detection: `>=` not `>`
After snapping `e.y = plat.y - TILE*SCALE`, the feet are at exactly `plat.y`. If the platform check uses `> plat.y` (strict), the enemy fails the check next frame, gravity drops it 1px, then it's re-detected and snapped = vertical jitter. **Fix**: use `>=` in `e.y + TILE * SCALE >= plat.y`.

### Enemy movement must happen BETWEEN AI and clamping
The update order matters: (1) AI sets `e.vx`, (2) `e.x += e.vx * dt`, (3) clamp to platform bounds. If movement happens inside the AI function (before engine can clamp), the enemy oscillates past platform edges.

### Enemy attack state cycling
Enemies that enter attack → timer expires → patrol → immediately re-enter attack (player still close) will visually flicker. **Fix**: add a `cooldown` state (500-600ms) between attack and patrol.

### Canvas DPR scaling
`canvas.width/height` are device pixels (multiplied by DPR). All game logic must use CSS pixels. `initGame()` reads `container.clientWidth/Height` (CSS), not `canvas.width/height`. The `ctx.setTransform(dpr, ...)` handles the scaling.

### Image source cropping
Character PNGs (1024x1024) have transparent/gray padding around the actual character. Must use 9-argument `drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)` to crop. Crop rects are determined via Python PIL pixel analysis.

### Game container positioning
The game uses `position: fixed` with `left: SIDEBAR_W` (desktop) and `bottom: 70px` (mobile bottom nav). Parent `wrap` div uses `minHeight: 100vh` not fixed height, so `height: 100%` on children doesn't resolve — fixed positioning is required.

### Background panning (not tiling)
Single background images should be scaled to cover the viewport (`Math.max(scaleW, scaleH)`) and panned slowly, NOT tiled. Tiling creates visible seams. Pan range maps camera position to image overflow.

## Notes
- The game runs entirely on HTML5 Canvas — no external game libraries
- All rendering uses CSS pixel coordinates (DPR handled via canvas transform)
- Game state lives in a `useRef` to avoid React re-renders at 60fps
- Enemy AI, collision, and combat are in `engine.js`
- The game is integrated into the main app with just 3 lines in `App.jsx`
- Player animations use canvas transforms on the mascot PNG (rotation, scale, translate)
- Enemy images loaded via `sprites.js` `loadGameImages()`, crop rects in `renderer.js`
