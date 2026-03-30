#!/usr/bin/env node
/**
 * Generate Room Background v2 — Design-First Approach
 *
 * Instead of generating art then trying to match collision to it,
 * this takes the LEVEL DESIGN as input and generates art that matches.
 *
 * The prompt tells Gemini exactly where flat walkable surfaces should be,
 * so the collision rectangles naturally align with the painted art.
 *
 * Usage: GEMINI_API_KEY=key node scripts/generate-room-bg-v2.mjs
 */
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, '..', 'public', 'images', 'tinysenpai', 'game', 'rooms');
const outPath = join(OUT, 'room_forest_06.png');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error('Set GEMINI_API_KEY env var'); process.exit(1); }

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent';

// Load Room 5 as style reference
const REF_PATH = join(OUT, 'room_forest_05.png');
let refParts = [];
try {
  const data = readFileSync(REF_PATH).toString('base64');
  refParts = [
    { text: 'Here is an existing level background from our pixel art game. Match this pixel art quality and density. Use it ONLY as a style reference — create a completely different scene:' },
    { inlineData: { mimeType: 'image/png', data } },
  ];
  console.log('✓ Loaded room_forest_05.png as style reference');
} catch (e) {
  console.log('⚠ No style reference found');
}

// ═══ LEVEL DESIGN — defines where platforms ARE ═══
// This is the source of truth. The art must match this layout.
const LEVEL_DESIGN = {
  name: "Sky Path — Burning Forest",
  description: "Ancient Japanese forest burning at night. Left side on fire, right side dark and misty.",
  platforms: [
    { label: "LEFT GROUND", position: "bottom-left", pctBounds: "x:0-25%, y:88-100%",
      art: "Flat stone cobblestone path. Moss between stones. Must have a CLEARLY FLAT horizontal top edge." },
    { label: "RIGHT GROUND", position: "bottom-right", pctBounds: "x:56-100%, y:90-100%",
      art: "Flat stone cobblestone path continuing. Broken stone lantern nearby. CLEARLY FLAT horizontal top edge." },
    { label: "BURNING LOG", position: "mid-left", pctBounds: "x:10-42%, y:64-72%",
      art: "Massive fallen tree trunk on fire, lying HORIZONTALLY. The top surface must be FLAT and walkable. Flames along the sides but the top is a clear flat walking surface." },
    { label: "TREE BRANCH", position: "mid-right", pctBounds: "x:48-78%, y:54-62%",
      art: "Thick gnarled tree branch extending HORIZONTALLY from the center tree. Must have a FLAT top surface for walking. Moss and vines hanging from it." },
    { label: "SHRINE CLIFF", position: "upper-left", pctBounds: "x:2-17%, y:26-34%",
      art: "Rocky cliff ledge with a small wooden shrine and half-burned torii gate. The ledge surface must be FLAT and horizontal." },
    { label: "ROPE BRIDGE", position: "upper-right", pctBounds: "x:72-98%, y:18-26%",
      art: "Wooden scaffold platform with rope railings, built into the tree canopy. The walking surface must be FLAT wooden planks." },
  ],
  centerFeature: "One MASSIVE tree trunk in the center (~35-40% from left), stretching from near the top to near the bottom. This is the vertical connector — characters wall-run up it.",
  atmosphere: {
    left: "FIRE — dramatic orange flames climbing trees, billowing smoke, showers of embers. Destructive and hot.",
    right: "DARK FOREST — cool blues, deep greens, moonlight filtering through canopy. Mysterious and serene.",
    contrast: "The dramatic contrast between fire (warm) and dark forest (cool) creates cinematic tension.",
  },
};

// Build the prompt from the level design
function buildPrompt(design) {
  const platformDescs = design.platforms.map(p =>
    `• ${p.label} (${p.position}, ${p.pctBounds}): ${p.art}`
  ).join('\n');

  return `Generate a CINEMATIC pixel art scene for a 2D side-scrolling action game (1280x714 pixels, 16:9).

SCENE: "${design.name}" — ${design.description}

CRITICAL REQUIREMENT — FLAT WALKABLE SURFACES:
This is a GAME LEVEL. Characters walk on these surfaces. Every platform listed below MUST have a CLEARLY FLAT, HORIZONTAL top edge. The top of each platform should be a straight horizontal line that a character can walk on. Think of it like a shelf or table — the top is perfectly flat even if the sides have organic detail.

DO NOT make surfaces slope, curve, or have uneven tops. The artistic detail goes on the SIDES and UNDERNEATH — the TOP EDGE is always flat and horizontal.

PLATFORMS (each must have a FLAT horizontal top):
${platformDescs}

CENTER FEATURE:
${design.centerFeature}

ATMOSPHERE:
• Left side: ${design.atmosphere.left}
• Right side: ${design.atmosphere.right}
• ${design.atmosphere.contrast}

GAP BETWEEN GROUNDS:
There is NO ground in the center (25-56% x). This area has the massive tree roots, fire, and debris — but NO walkable surface at ground level. Forces the player to go UP.

BACKGROUND DEPTH:
• Foreground: the platforms listed above, debris, particles
• Midground: massive tree trunks, fire, stone structures
• Background: more trees fading into smoke/mist, moon glow

VISUAL STYLE:
• Pixel art — dense, detailed, every pixel has purpose
• Katana Zero / Dead Cells style — cinematic, moody, dramatic lighting
• Color palette: deep charcoal blacks, fiery oranges/ambers, cool moonlit blues, mossy greens
• NOT cute or cartoonish — atmospheric and serious
• Dramatic volumetric light from the fire, deep atmospheric perspective

Edge-to-edge art, NO borders, NO characters, NO UI elements. Just the environment.`;
}

const PROMPT = buildPrompt(LEVEL_DESIGN);

async function generate() {
  // Back up existing file
  if (existsSync(outPath)) {
    const backupPath = outPath.replace('.png', '_prev.png');
    writeFileSync(backupPath, readFileSync(outPath));
    console.log(`📦 Backed up existing to ${backupPath}`);
  }

  console.log('🎨 Generating room background from level design...');
  console.log('   (This may take 30-60 seconds)\n');
  console.log('Platform layout:');
  for (const p of LEVEL_DESIGN.platforms) {
    console.log(`   ${p.label}: ${p.pctBounds}`);
  }
  console.log('');

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
    console.error('✗ No image in response:', cands.map(p => p.text || '[img]').join(' ').slice(0, 500));
  } catch (e) {
    console.error('✗ Error:', e.message);
  }
}

generate();
