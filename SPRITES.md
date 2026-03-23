# Sprite Generation Prompts

All sprites should match the TinySenpai mascot style: chibi pixel art, oversized straw sugegasa hat, dark kimono, red obi, face hidden in shadow. Square 1024x1024, solid gray background, facing left.

## What Needs Generating vs What's Built in Code

**Generate as images:** Character poses, enemy designs, background scenes
**Built in code (no images needed):** Rain, fire particles, fog, lightning, dust, blood, screen effects, slash trails, environmental lighting, floating embers, falling leaves

---

## Player — TinySenpai

### Have Already
- **Idle**: tinysenpai2.png
- **Run cycle**: 4 frames (tinysenpairun/ts1-ts4.png)
- **Slash combo**: 4 frames (tinysenpaistrike/1-4.png)

### Still Need

**Jump — 2 frames**

Frame 1 — Launch:
> Pixel art chibi samurai character, identical style to tinysenpai2.png — oversized straw sugegasa hat, dark kimono with red obi belt, face hidden in shadow under hat. Crouching low about to spring upward, legs bent, arms down, coiled energy. Side view facing left. Black pixel outlines. Solid gray background. 1024x1024.

Frame 2 — Airborne:
> Pixel art chibi samurai character, identical style to tinysenpai2.png — oversized straw sugegasa hat, dark kimono with red obi belt, face hidden in shadow under hat. Mid-air pose, knees tucked up, arms slightly raised, hat tilting from upward motion. Dynamic pose. Side view facing left. Black pixel outlines. Solid gray background. 1024x1024.

**Fall — 1 frame**
> Pixel art chibi samurai character, identical style to tinysenpai2.png — oversized straw sugegasa hat, dark kimono with red obi belt, face hidden in shadow under hat. Falling downward pose, legs dangling beneath, arms slightly out for balance, hat floating up slightly from wind. Side view facing left. Black pixel outlines. Solid gray background. 1024x1024.

**Wall Slide — 1 frame**
> Pixel art chibi samurai character, identical style to tinysenpai2.png — oversized straw sugegasa hat, dark kimono with red obi belt, face hidden in shadow under hat. Pressed flat against a wall on their right side, one hand gripping the surface, feet braced against it, sliding slowly downward. Body facing the wall. Black pixel outlines. Solid gray background. 1024x1024.

**Dash — 1 frame**
> Pixel art chibi samurai character, identical style to tinysenpai2.png — oversized straw sugegasa hat, dark kimono with red obi belt, face hidden in shadow under hat. Explosive forward dash, body stretched and leaning far forward horizontally, hat streaming behind from speed, arms back. Side view facing left. Black pixel outlines. Solid gray background. 1024x1024.

**Death — 2 frames**

Frame 1 — Hit:
> Pixel art chibi samurai character, identical style to tinysenpai2.png — oversized straw sugegasa hat, dark kimono with red obi belt. Recoiling from being struck, body arching backward, arms flung out, hat flying off. Impact moment. Side view. Black pixel outlines. Solid gray background. 1024x1024.

Frame 2 — Fallen:
> Pixel art chibi samurai character, identical style to tinysenpai2.png — dark kimono with red obi belt. Collapsed on the ground, lying flat, hat fallen off to the side nearby. Defeated. Side view. Black pixel outlines. Solid gray background. 1024x1024.

---

## Enemies

### Have Already
- **Oni Demon**: demon.png (melee attacker)
- **Shadow Ninja**: ninja.png (ranged, shurikens)

### Still Need

**Armored Ronin** (elite, blocks first hit, 2HP):
> Pixel art character, same chibi style as tinysenpai2.png. A ronin warrior — wearing dark lacquered samurai armor with gold trim, kabuto helmet with crescent moon crest on top, menacing face plate. Small chibi body (large head, tiny body), holding a katana at ready position. Red and gold color accents. Black pixel outline. Facing left. Solid gray background. 1024x1024.

**Oni Attack Pose** (optional — club raised to strike):
> Pixel art character, same as demon.png oni demon. Attacking pose — club/kanabo raised high overhead about to smash down, body tensed, aggressive stance. Same chibi proportions. Black pixel outline. Facing left. Solid gray background. 1024x1024.

**Ninja Throw Pose** (optional — arm extended throwing shuriken):
> Pixel art character, same as ninja.png shadow ninja. Throwing pose — one arm extended forward releasing a shuriken, body in dynamic throwing stance, scarf flowing. Same chibi proportions. Black pixel outline. Facing left. Solid gray background. 1024x1024.

---

## Environments (backgrounds)

### Have Already
- **Mystical Forest**: forest.png

### Still Need

**Temple Gardens:**
> Pixel art seamless background, 16-bit retro game style. Japanese temple garden at dusk — elegant pagoda silhouette, cherry blossom trees with pink petals falling, stone bridge over koi pond, bamboo grove. Warm golden sunset lighting with purple sky. Side-scrolling game perspective. 1536x1024. Clean pixel art.

**Neon Tokyo:**
> Pixel art seamless background, 16-bit retro game style. Futuristic neon Tokyo street at night — glowing Japanese kanji signs in hot pink and electric blue, rain-slicked surfaces with reflections, vending machines, narrow alleyways between tall buildings, steam rising. Cyberpunk color palette. Side-scrolling game perspective. 1536x1024. Clean pixel art.

**Castle Interior:**
> Pixel art seamless background, 16-bit retro game style. Japanese castle interior at night — dark wooden corridors, paper sliding doors (shoji screens), hanging scrolls with calligraphy, moonlight through windows, candle holders on walls, tatami floor mats. Dark moody atmosphere. Side-scrolling game perspective. 1536x1024. Clean pixel art.

---

## Environmental Effects (built in code, no images needed)

These are all particle systems / canvas effects I'll build:

- **Rain** — vertical lines falling, splash particles on ground
- **Fog/mist** — translucent layers drifting slowly
- **Falling cherry blossoms** — pink petal particles swaying down
- **Floating embers** — small glowing dots rising (already have this)
- **Fireflies** — pulsing green orbs (already have this)
- **Dust motes** — tiny particles in light beams
- **Blood splatter** — red particles on kill (already have this)
- **Blood stains** — marks on ground (already have this)
- **Lightning flashes** — brief full-screen white flash during storms
- **Screen shake** — on impacts (already have this)
- **Scanlines** — retro CRT effect (already have this)
- **Vignette** — dark edges (already have this)
