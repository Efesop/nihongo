#!/usr/bin/env node
/**
 * Generate all Room 6 "Burning Forest" assets.
 * Run: GEMINI_API_KEY=key node scripts/generate-room6-assets.mjs
 *
 * Generates:
 *   - 3 parallax background layers (bg_forest_fire_far/mid/near)
 *   - 1 tall grass hide spot sprite
 *   - 1 burned torii gate sprite
 *
 * Post-process backgrounds:
 *   (no transparency removal needed — edge-to-edge art)
 *
 * Post-process sprites:
 *   magick FILE -resize 256x256 -fuzz 10% -transparent "#808080" -strip PNG32:FILE
 */
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const BG_OUT = join(__dir, '..', 'public', 'images', 'tinysenpai', 'game', 'backgrounds');
const SPRITE_OUT = join(__dir, '..', 'public', 'images', 'tinysenpai', 'game');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error('Set GEMINI_API_KEY env var'); process.exit(1); }

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent`;

// Load existing forest backgrounds as style reference
const REF_PATH = join(BG_OUT, 'bg_forest_mid.png');
let BG_REF = null;
try {
  const bgData = readFileSync(REF_PATH).toString('base64');
  BG_REF = { inlineData: { mimeType: 'image/png', data: bgData } };
  console.log('✓ Loaded bg_forest_mid.png as style reference');
} catch {
  console.log('Note: bg_forest_mid.png not found, generating without reference');
}

// Load player idle as character scale reference
const IDLE_PATH = join(__dir, '..', 'public', 'images', 'tinysenpai', 'idle.png');
let IDLE_REF = null;
try {
  const idleData = readFileSync(IDLE_PATH).toString('base64');
  IDLE_REF = { inlineData: { mimeType: 'image/png', data: idleData } };
} catch {}

const ASSETS = [
  // ═══ PARALLAX BACKGROUNDS ═══
  {
    name: "bg_forest_fire_far",
    outDir: BG_OUT,
    isBackground: true,
    prompt: `Generate a WIDE parallax background layer for a 2D side-scrolling game. This is the FARTHEST/DEEPEST layer (slowest scroll).

SCENE: A dark forest at night with a DISTANT FIRE GLOW on the horizon. The dojo is burning far behind — we see the orange-red glow illuminating distant tree silhouettes from the LEFT side.

COMPOSITION:
- Far left: Intense orange-amber glow against dark sky (the burning dojo, far away)
- Center: Dark forest silhouettes — tall pines and ancient trees, black against the smoky sky
- Far right: Darker, calmer — the fire hasn't reached here yet
- Sky: Deep purples, dark greys, hints of orange from fire-lit smoke clouds
- The gradient tells a story: FIRE (left) → SMOKE (center) → DARK CALM (right)

STYLE: Dark atmospheric pixel art. Rich saturated colors. Painterly but with clear pixel detail.
This is a PARALLAX LAYER so it should be a WIDE panoramic image (roughly 3:1 aspect ratio).
The bottom 20% should be darker (ground/undergrowth silhouettes).
NO characters, NO UI elements. Just the environment.
The image should tile-wrap seamlessly or have natural edges.`
  },
  {
    name: "bg_forest_fire_mid",
    outDir: BG_OUT,
    isBackground: true,
    prompt: `Generate a WIDE parallax background layer for a 2D side-scrolling game. This is the MIDDLE layer (medium scroll speed).

SCENE: A forest with fire damage progression — LEFT side shows burning/smoldering trees, RIGHT side shows healthy dark forest. The fire is spreading from left to right.

COMPOSITION:
- Far left: Actively burning trees — orange flames licking up trunks, bright embers, thick smoke
- Center-left: Smoldering trees — charred trunks, glowing embers, smoke rising
- Center: Transitional — some trees singed, smoke wisps, still partially green
- Right: Dark healthy forest — tall green pines, thick undergrowth, mossy trunks
- Throughout: Floating embers and ash particles in the air

DETAIL: More detail than the far layer. Individual tree trunks visible. Foliage shapes.
Smoke wisps rising from damaged areas. Glowing ember particles.

STYLE: Dark atmospheric pixel art. Rich saturated colors — deep greens, fiery oranges, charred blacks.
WIDE panoramic (roughly 3:1 aspect ratio). This is a parallax layer.
Bottom portion: forest floor with fallen logs, undergrowth, moss.
NO characters, NO UI. Just the environment.`
  },
  {
    name: "bg_forest_fire_near",
    outDir: BG_OUT,
    isBackground: true,
    prompt: `Generate a WIDE parallax background layer for a 2D side-scrolling game. This is the NEAREST/CLOSEST layer (fastest scroll, most detail).

SCENE: Close-up forest elements — thick tree trunks in foreground, hanging vines, some on fire. This layer frames the gameplay area.

COMPOSITION:
- Large tree trunks at intervals (every ~300px conceptually) — thick, gnarled, some charred
- Hanging vines and moss — some burning or singed
- Fallen branches and logs at the base
- Gaps between elements are ESSENTIAL — the player and enemies must be visible behind this layer
- Left portion: More fire damage (charred, glowing edges on trunks)
- Right portion: Healthier trees (dark bark, green moss, intact vines)

IMPORTANT: This layer must have SIGNIFICANT TRANSPARENCY/GAPS between elements. It's a foreground frame, not a solid wall. At least 40% of the image should be open space so the gameplay behind is visible.

STYLE: Dark atmospheric pixel art with chunky outlines. Most detailed of the three layers.
WIDE panoramic (roughly 3:1 aspect ratio).
Rich texture on bark, moss, vines. Glowing ember details on damaged sections.
NO characters, NO UI. Just environmental elements.`
  },

  // ═══ ENVIRONMENT SPRITES ═══
  {
    name: "tall_grass",
    outDir: SPRITE_OUT,
    isBackground: false,
    prompt: `Generate a small pixel art TALL GRASS / FERN CLUSTER for a 2D side-scrolling game.

This is a HIDE SPOT — a clump of tall dark forest grass and ferns that a small chibi character can crouch behind to hide.

DESIGN:
- Cluster of tall grass blades and fern fronds
- About as wide as 1.5x a small character, and as tall as a character
- Dark forest greens — deep emerald, dark olive, some lighter tips catching moonlight
- Dense enough to hide behind, but with visible blade/frond shapes
- Subtle blue-green undertones (moonlit forest)
- A few small flowers or mushrooms at the base for visual interest

STYLE: Chibi pixel art with chunky black outlines. Rich saturated dark greens. Same art style as a cute side-scroller game.
BACKGROUND: Plain flat solid gray #808080 background. ONLY the grass cluster, nothing else. No ground, no sky.`
  },
  {
    name: "torii_burned",
    outDir: SPRITE_OUT,
    isBackground: false,
    prompt: `Generate a small pixel art HALF-DESTROYED TORII GATE for a 2D side-scrolling game.

This is a traditional Japanese torii gate that has been DAMAGED BY FIRE — it tells the story of a forest fire passing through.

DESIGN:
- Classic torii gate shape but damaged: one pillar charred and leaning, crossbar partially broken
- Traditional red color but faded/scorched — patches of black char marks, peeling paint
- One side more damaged than the other (fire came from the left)
- Scorch marks, cracks, smoke wisps rising from charred wood
- Some moss/vines still clinging to the less-damaged side
- About 1.5x character height, slightly wider than tall
- Should feel sad/atmospheric — a sacred thing damaged by disaster

STYLE: Chibi pixel art with chunky black outlines. Rich saturated colors (red, charred black, grey smoke). Same art style as a cute side-scroller game.
BACKGROUND: Plain flat solid gray #808080 background. ONLY the torii gate, nothing else. No ground, no sky.`
  },
];

async function generate(asset) {
  const outPath = join(asset.outDir, `${asset.name}.png`);

  // Skip if already exists
  if (existsSync(outPath)) {
    console.log(`  ⊘ ${asset.name} already exists, skipping (delete to regenerate)`);
    return true;
  }

  console.log(`\n  Generating ${asset.name}...`);

  const parts = [];

  // Add reference images
  if (asset.isBackground && BG_REF) {
    parts.push({ text: 'Here is an existing forest parallax layer from this game. Match the art style, color richness, and pixel art quality. Generate a NEW layer with the burning forest theme described below:' });
    parts.push(BG_REF);
  }
  if (!asset.isBackground && IDLE_REF) {
    parts.push({ text: 'Here is the main character of this game for scale and art style reference. Generate an environment element in the same pixel art style:' });
    parts.push(IDLE_REF);
  }

  parts.push({ text: asset.prompt });

  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
    });
    const json = await res.json();
    const cands = json.candidates?.[0]?.content?.parts || [];
    for (const part of cands) {
      if (part.inlineData) {
        const buf = Buffer.from(part.inlineData.data, 'base64');
        writeFileSync(outPath, buf);
        console.log(`  ✓ Saved ${outPath} (${(buf.length/1024).toFixed(0)}KB)`);
        return true;
      }
    }
    console.error(`  ✗ No image in response:`, cands.map(p => p.text || '[img]').join(' ').slice(0, 200));
    return false;
  } catch (e) {
    console.error(`  ✗ Error:`, e.message);
    return false;
  }
}

async function main() {
  console.log('═══ Room 6: Burning Forest Assets ═══');
  console.log(`Generating ${ASSETS.length} assets...\n`);

  for (const asset of ASSETS) {
    await generate(asset);
    // Brief pause between API calls
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n═══ Post-processing ═══');
  console.log('\nBackgrounds (resize to match existing 1792x592):');
  for (const a of ASSETS.filter(a => a.isBackground)) {
    const p = join(a.outDir, `${a.name}.png`);
    console.log(`  magick "${p}" -resize 1792x592! -strip PNG32:"${p}"`);
  }
  console.log('\nSprites (256x256, remove gray bg):');
  for (const a of ASSETS.filter(a => !a.isBackground)) {
    const p = join(a.outDir, `${a.name}.png`);
    console.log(`  magick "${p}" -resize 256x256 -fuzz 10% -transparent "#808080" -strip PNG32:"${p}"`);
  }
}

main();
