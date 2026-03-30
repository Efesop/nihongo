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
    { text: 'Here is an existing level background from our pixel art game for reference. The new scene should be pixel art like this but MORE ZOOMED OUT (showing a much bigger area — imagine the camera pulled way back so characters would be tiny), MORE CINEMATIC (dramatic lighting, strong mood, Katana Zero vibes), and with its OWN unique visual identity — do NOT copy this layout. Use it only as a pixel art quality reference:' },
    { inlineData: { mimeType: 'image/png', data } },
  ];
  console.log('✓ Loaded room_forest_05.png as style reference');
} catch (e) {
  console.error('✗ Could not load room_forest_05.png — generation will lack style reference');
}

const PROMPT = `Generate a CINEMATIC pixel art scene for a 2D side-scrolling action game. Think Katana Zero — every room is a beautiful, stylish painting with dramatic lighting and strong mood.

THIS IS A WIDE, ZOOMED-OUT VIEW. Imagine the camera pulled far back — a HUGE ancient burning forest fills the entire frame. Tiny characters would be only 5% of the screen height. This shows a MASSIVE area.

SCENE: "Sky Path" — An ancient Japanese forest burning at night. The player is fleeing through it.

COMPOSITION (cinematic, dramatic):
- MASSIVE ancient trees — enormous trunks and canopy dominating the scene, dwarfing everything
- The forest is on FIRE on the left side — dramatic orange flames climbing enormous tree trunks, billowing smoke, showers of embers against the dark sky
- Right side transitions to dark, misty, untouched forest — cool blues and deep greens, moonlight filtering through canopy
- The contrast between FIRE (warm, bright, destructive) and DARK FOREST (cool, mysterious, serene) creates cinematic tension

PLATFORM SURFACES (characters fight on these — must be clearly walkable):
- GROUND (~85% from top): Wide stone forest path running across most of the bottom. Cracked flagstones, moss, scattered debris. Broken stone lanterns.
- LOWER-LEFT (~62%): A massive burning fallen tree forming a natural bridge. Flames along its surface, thick bark texture. About 25% screen width.
- MID-CENTER (~45%): A huge ancient branch extending from the biggest tree. Thick, gnarled, with hanging moss. About 35% screen width.
- UPPER-LEFT (~25%): Rocky cliff ledge / ruined stone shrine platform with a half-burned torii gate. About 20% screen width.
- UPPER-RIGHT (~25%): Ancient wooden platform/lookout built into the tree canopy. Rope bridges, wooden beams. About 25% screen width.

VERTICAL ELEMENT:
- One enormous tree trunk or ancient stone pillar in the center, connecting mid to upper areas. Characters can climb this.

KEY VISUAL STYLE:
- Pixel art but CINEMATIC — dramatic volumetric light shafts from the fire, deep atmospheric perspective
- Katana Zero style: strong silhouettes, bold color choices, moody and stylish
- Deep layered depth — foreground debris, midground platforms, background massive trees fading into smoke/mist
- Color palette: deep charcoal blacks, fiery oranges/ambers, cool moonlit blues, mossy greens
- NOT cute or cartoonish — this is atmospheric and serious. A forest DYING in fire.
- Dense detail everywhere — bark texture, stone cracks, hanging vines, scattered leaves, ember particles
- Dramatic lighting: fire glow illuminates left side from below, moonlight catches right side from above

FRAMING:
- Top: dense dark canopy creates natural ceiling/frame
- Left edge: stone cliff face or massive trunk (natural wall)
- Right edge: similar natural barrier
- The scene should feel like looking into a vast ancient forest through a wide lens

16:9 aspect ratio, edge-to-edge, no borders, no characters, no UI. Just the beautiful, burning environment.`;

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
