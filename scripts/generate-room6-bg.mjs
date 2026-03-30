#!/usr/bin/env node
/**
 * Generate Room 6 "Burning Forest" single-scene background.
 * Same approach as Room 5 — one dense painted scene, platforms aligned to art.
 *
 * Run: GEMINI_API_KEY=key node scripts/generate-room6-bg.mjs
 * Post-process: magick room_forest_06.png -resize 1280x714! -strip PNG32:room_forest_06.png
 */
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, '..', 'public', 'images', 'tinysenpai', 'game', 'rooms');
const outPath = join(OUT, 'room_forest_06.png');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error('Set GEMINI_API_KEY env var'); process.exit(1); }

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent`;

// Load Room 5 background as THE style reference
const REF_PATH = join(OUT, 'room_forest_05.png');
let refParts = [];
try {
  const data = readFileSync(REF_PATH).toString('base64');
  refParts = [
    { text: 'Here is the Room 5 background from our game. This is the EXACT art style, quality, and density we need. Study it carefully — the stone bridges, tree trunks, lanterns, scaffolding, moss, vines, fireflies are all baked into one dense painting. Platforms are painted surfaces that characters stand on. Generate a NEW scene at this SAME quality level but with the burning forest theme described below:' },
    { inlineData: { mimeType: 'image/png', data } },
  ];
  console.log('✓ Loaded room_forest_05.png as style reference');
} catch (e) {
  console.error('✗ Could not load room_forest_05.png — generation will lack style reference');
}

const PROMPT = `Generate a single dense pixel art scene for a 2D side-scrolling game level. This is Room 6: "Sky Path" — a burning forest at night.

CRITICAL: This must be ONE complete scene painting (like the reference image), NOT a tileable background. Every surface a character could stand on must be a visible painted platform.

SCENE LAYOUT (more zoomed out than reference — showing a WIDER area with MORE vertical layers):

BOTTOM (ground level ~85% from top):
- Wide mossy stone path / forest floor spanning most of the width
- Stone lanterns along the path, some toppled
- Left side: cracked earth with embers glowing through gaps
- Right side: thick tree roots and moss

LOWER-MID (about 65% from top, left-center):
- A thick fallen burning log forming a bridge/platform
- Fire licking along its surface, smoke rising
- Or: a stone bridge similar to Room 5's center bridge but cracked with fire damage

MID-HEIGHT (about 48% from top, center):
- Thick ancient tree branch extending horizontally across the center
- Hanging vines and moss, some singed
- Wide enough for combat (about 40% of screen width)

UPPER-LEFT (about 28% from top):
- Rock outcropping with a ruined/burned shrine
- Half-destroyed torii gate visible
- Stone platform surface for standing

UPPER-RIGHT (about 28% from top):
- Wooden treehouse/scaffold platform (like the reference image's upper-right area)
- Connected to a massive tree trunk
- Wooden railings, hanging ropes

CENTER VERTICAL:
- One massive tree trunk or stone pillar running vertically through the middle
- Characters can wall-run up this surface
- About 4% wide, from ~10% to ~42% from top

ATMOSPHERE:
- LEFT SIDE: Fire damage — burning trees, orange glow, embers, thick smoke
- RIGHT SIDE: Darker, calmer — the fire hasn't reached here yet, moonlit
- The gradient tells the story: FIRE (left) → TRANSITION → DARK FOREST (right)
- Floating embers and fireflies throughout
- Rain streaks (light)
- Dense canopy/foliage at the very top (dark, framing the scene)

WALLS:
- Left edge: stone wall or thick tree trunk (characters can't go past)
- Right edge: similar barrier

STYLE: Dense atmospheric pixel art. Same quality and density as the reference image. Rich saturated colors. Chunky but detailed. Dark moody palette with warm fire highlights. Stone textures, wood grain, moss detail. NOT empty or sparse — every area should have visual detail.

The image should be roughly 16:9 aspect ratio, edge-to-edge with no borders.`;

async function generate() {
  if (existsSync(outPath)) {
    console.log(`⊘ ${outPath} already exists. Delete to regenerate.`);
    return;
  }

  console.log('Generating room_forest_06.png...');
  console.log('(This may take 30-60 seconds)\n');

  const parts = [...refParts, { text: PROMPT }];

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
        console.log(`✓ Saved ${outPath} (${(buf.length / 1024).toFixed(0)}KB)`);
        console.log('\nPost-process:');
        console.log(`  magick "${outPath}" -resize 1280x714! -strip PNG32:"${outPath}"`);
        return;
      }
    }
    console.error('✗ No image in response:', cands.map(p => p.text || '[img]').join(' ').slice(0, 300));
  } catch (e) {
    console.error('✗ Error:', e.message);
  }
}

generate();
