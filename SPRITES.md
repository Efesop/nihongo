# Game Assets — Complete List

All character sprites: 1024x1024 PNG, pixel art chibi style, solid gray background, **facing LEFT**.
All backgrounds: 1536x1024 or wider, pixel art, side-scrolling perspective.

**Gray backgrounds are auto-removed on load** by `sprites.js`.
**Flip logic**: code flips sprites when `facing > 0` (right). Natural direction = LEFT.

---

## PRIORITY 1 — Regenerate (Current Sprites Need Improvement)

### Better Run Cycle (4 frames)
Current run looks stiff. Need more dynamic samurai/anime-style running — leaning forward, arms flowing behind, more fluid motion.

Frame 1 — Contact:
> Pixel art chibi samurai character, identical style to tinysenpai2.png — oversized straw sugegasa hat, dark kimono with red obi belt, face hidden in shadow under hat. Running pose with right foot hitting ground, body leaning forward aggressively, left arm extended forward, right arm back. Dynamic running samurai style, like anime ninja run. Side view facing right. Black pixel outlines. Solid gray background. 1024x1024.

Frame 2 — Push off:
> Pixel art chibi samurai character, identical style to tinysenpai2.png — oversized straw sugegasa hat, dark kimono with red obi belt, face hidden in shadow under hat. Running pose pushing off right foot, body stretched forward, both arms swept back, hat tilting slightly from speed. Dynamic samurai sprint. Side view facing right. Black pixel outlines. Solid gray background. 1024x1024.

Frame 3 — Flight:
> Pixel art chibi samurai character, identical style to tinysenpai2.png — oversized straw sugegasa hat, dark kimono with red obi belt, face hidden in shadow under hat. Mid-stride both feet off ground, body low and aerodynamic, arms trailing behind like anime ninja run. Side view facing right. Black pixel outlines. Solid gray background. 1024x1024.

Frame 4 — Reach:
> Pixel art chibi samurai character, identical style to tinysenpai2.png — oversized straw sugegasa hat, dark kimono with red obi belt, face hidden in shadow under hat. Left foot reaching forward about to land, right leg kicking back, arms in opposite motion, kimono fluttering from movement. Side view facing right. Black pixel outlines. Solid gray background. 1024x1024.

**Save to:** `public/images/tinysenpairun/ts1.png` through `ts4.png` (overwrite existing)

### Better Jump Sprites (2 frames)
Current jump makes character look smaller. Need poses where character fills more of the frame.

Frame 1 — Launch:
> Pixel art chibi samurai character, identical style to tinysenpai2.png — oversized straw sugegasa hat, dark kimono with red obi belt, face hidden in shadow under hat. Powerful upward leap, legs coiled beneath, one arm reaching up, body expanded and dynamic. Character should fill most of the frame. Side view facing right. Black pixel outlines. Solid gray background. 1024x1024.

Frame 2 — Airborne:
> Pixel art chibi samurai character, identical style to tinysenpai2.png — oversized straw sugegasa hat, dark kimono with red obi belt, face hidden in shadow under hat. Peak of jump, body spread wide — legs apart, arms out for balance, hat floating up slightly. Character should fill most of the frame horizontally. Side view facing right. Black pixel outlines. Solid gray background. 1024x1024.

**Save to:** `public/images/tinysenpaiother/jump1-launch.png`, `jump2-airborne.png` (overwrite)

### Better Fall Sprite (1 frame)
> Pixel art chibi samurai character, identical style to tinysenpai2.png — oversized straw sugegasa hat, dark kimono with red obi belt, face hidden in shadow under hat. Falling pose with body spread wide — arms out to sides, legs dangling apart, kimono and hat billowing upward from wind. Character fills most of the frame. Side view facing right. Black pixel outlines. Solid gray background. 1024x1024.

**Save to:** `public/images/tinysenpaiother/fall.png` (overwrite)

---

## PRIORITY 2 — New Enemy Sprites

### Armored Ronin / Samurai (elite blocker, 2HP)
Currently drawn procedurally (shapes). Needs a real sprite.

> Pixel art character, same chibi style as tinysenpai2.png. A ronin warrior — wearing dark lacquered samurai armor with gold trim, kabuto helmet with crescent moon crest on top, menacing face plate. Small chibi body (large head, tiny body), holding a katana at ready position. Red and gold color accents. Black pixel outline. Facing right. Solid gray background. 1024x1024.

**Save to:** `public/images/ronin.png`
**Then add to sprites.js:** `loadImg("samurai", "/images/ronin.png")`

### Oni Attack Frame (optional)
> Same as demon.png oni. Attacking pose — club raised high overhead about to smash down, body tensed, aggressive. Same chibi proportions. Facing right. Solid gray background. 1024x1024.

**Save to:** `public/images/demon-attack.png`

### Ninja Throw Frame (optional)
> Same as ninja.png shadow ninja. Arm extended forward releasing a shuriken, dynamic throwing stance, scarf flowing. Same chibi proportions. Facing right. Solid gray background. 1024x1024.

**Save to:** `public/images/ninja-throw.png`

---

## PRIORITY 3 — Environment Backgrounds

Each background is used for a group of rooms. Currently we only have the forest.

### Temple Gardens (Rooms 4-6)
> Pixel art seamless background, 16-bit retro game style. Japanese temple garden at dusk — elegant pagoda silhouette, cherry blossom trees with pink petals, stone lanterns, bamboo grove, koi pond. Warm golden sunset with purple sky. Rich detail — individual tiles on roofs, texture on stone. Side-scrolling game perspective. 1536x1024. Clean pixel art.

**Save to:** `public/images/temple.png`

### Neon Tokyo (Rooms 7-9)
> Pixel art seamless background, 16-bit retro game style. Futuristic neon Tokyo street at night — glowing Japanese kanji signs in hot pink and electric blue, rain-slicked surfaces, vending machines, narrow alleyways, steam rising from grates. Dense urban detail — cables, pipes, posters, fire escapes. Cyberpunk color palette. Side-scrolling perspective. 1536x1024. Clean pixel art.

**Save to:** `public/images/neon.png`

### Castle Interior (Room 10 — Boss Arena)
> Pixel art seamless background, 16-bit retro game style. Japanese castle throne room — dark wooden pillars, hanging war banners with mon crests, weapon racks on walls, moonlight streaming through high windows, ornate floor. Dramatic and imposing. Red and gold accents on dark wood. Side-scrolling perspective. 1536x1024. Clean pixel art.

**Save to:** `public/images/castle.png`

---

## PRIORITY 4 — Platform Tilesets (Future)

To make levels look more like Katana Zero (detailed environments with furniture, doors, objects):

### Forest Tileset
> Pixel art tileset, 16-bit style. Dark mystical forest elements: mossy wooden platforms, twisted tree branches as walkways, hanging vines, glowing mushrooms, hollow log tunnels, stone ruins overgrown with moss. Each tile 64x64. Dark green/brown palette. Clean pixel art.

### Temple Tileset
> Pixel art tileset, 16-bit style. Japanese temple elements: wooden walkways, stone walls, shoji screen doors, torii gate segments, stone steps, bamboo fences, hanging scrolls. Each tile 64x64. Warm gold/brown palette.

### Neon Tileset
> Pixel art tileset, 16-bit style. Cyberpunk urban elements: metal grate platforms, neon-lit pipes, air vents with steam, fire escape ladders, dumpsters, vending machines, electric panels with sparks. Each tile 64x64. Dark with neon accent lighting.

### Castle Tileset
> Pixel art tileset, 16-bit style. Japanese castle interior: dark wood flooring, stone walls with torch brackets, sliding doors, armor stands, weapon racks, hanging lanterns, tatami mats. Each tile 64x64. Dark wood/stone palette with red accents.

---

## PRIORITY 5 — Additional Player Animations (Future)

### Idle Breathing (2 frames)
Subtle up/down motion. Currently we use the single idle sprite + code-based scale pulse.

### Crouch (1 frame)
> Same style. Low crouch, one hand on ground, other hand on sword hilt. Ready to spring. Facing right. Gray bg. 1024x1024.

### Ledge Grab (1 frame)
> Same style. Hanging from ledge with both hands, legs dangling, hat tipping. Facing right. Gray bg. 1024x1024.

### Victory Pose (1 frame)
> Same style. Standing tall, katana resting on shoulder, wind blowing kimono and hat brim. Confident, heroic. Facing right. Gray bg. 1024x1024.

---

## What's Built in Code (No Images Needed)

All of these are canvas-drawn particle effects or rendering tricks:

- Rain streaks + splash particles ✅
- Fireflies / spirit orbs ✅
- Drifting leaves ✅
- Dust motes ✅
- Blood particles + stain puddles ✅
- Slash blade trails (bezier crescents) ✅
- Speed lines ✅
- Screen shake ✅
- Hit-stop freeze ✅
- Scanlines + vignette ✅
- Letterbox bars ✅
- Fade transitions ✅
- Floating text (damage, combo, room clear) ✅
- Enemy attack arcs (oni club trail, ninja energy, samurai shield) ✅
- Afterimages (dash/slash ghosts) ✅
- Impact ripple rings ✅
- Additive glow particles ✅

---

## Asset Generation Tips

1. **Use the same AI model** for all sprites to keep style consistent
2. **Gray background** is mandatory — `sprites.js` auto-removes it on load
3. **All characters face RIGHT** — the engine flips them when needed
4. **Character should fill most of the 1024x1024 frame** — prevents sprites looking tiny
5. **Crop rects** in `renderer.js` need updating when new sprites are added (measure with PIL or by eye)
6. **Test each sprite** by replacing the file and checking in-game for size/position consistency

---

## Current File Locations

| Asset | Path | Status |
|-------|------|--------|
| Player idle | `public/images/tinysenpai2.png` | ✅ |
| Player run 1-4 | `public/images/tinysenpairun/ts{1-4}.png` | ⚠️ Needs redo |
| Player slash 1-4 | `public/images/tinysenpaistrike/{1-4}.png` | ✅ |
| Player jump 1-2 | `public/images/tinysenpaiother/jump{1,2}-*.png` | ⚠️ Needs redo |
| Player fall | `public/images/tinysenpaiother/fall.png` | ⚠️ Needs redo |
| Player wall slide | `public/images/tinysenpaiother/wall-slide.png` | ✅ |
| Player dash | `public/images/tinysenpaiother/dash.png` | ✅ |
| Player death 1-2 | `public/images/tinysenpaiother/death{1,2}-*.png` | ✅ |
| Oni enemy | `public/images/demon.png` | ✅ |
| Ninja enemy | `public/images/ninja.png` | ✅ |
| Samurai enemy | *Not yet created* | ❌ Needs PNG |
| Forest background | `public/images/forest.png` | ✅ |
| Temple background | *Not yet created* | ❌ |
| Neon background | *Not yet created* | ❌ |
| Castle background | *Not yet created* | ❌ |
