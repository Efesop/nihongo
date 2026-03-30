#!/usr/bin/env node
/**
 * Generate a forest exit arch sprite for Room 5 upper platform.
 * Run: GEMINI_API_KEY=key node scripts/generate-exit-sprite.mjs
 * Post-process: magick public/images/tinysenpai/game/exit_forest.png -resize 128x128 -fuzz 10% -transparent "#808080" -strip PNG32:public/images/tinysenpai/game/exit_forest.png
 */
import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, '..', 'public', 'images', 'tinysenpai', 'game');
const IMG = join(__dir, '..', 'public', 'images', 'tinysenpai');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error('Set GEMINI_API_KEY env var'); process.exit(1); }

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent`;

// Reference: the room background for style consistency
const BG_PATH = join(IMG, 'game', 'room_forest_05.png');
let BG_REF = null;
try {
  const bgData = readFileSync(BG_PATH).toString('base64');
  BG_REF = { inlineData: { mimeType: 'image/png', data: bgData } };
} catch {
  console.log('Note: room_forest_05.png not found, generating without bg reference');
}

const PROMPT = `Generate a small pixel art FOREST EXIT ELEMENT for a 2D side-scroller game.

This is an exit point on an elevated wooden platform in a dark atmospheric forest. It should look like a NATURAL BREAK IN THE TREES — a gap revealing a lit forest path continuing forward. Think of it as:

- Two gnarled tree trunks or thick branches framing an opening
- Warm golden-amber light glowing through the gap (like distant sunlight on a forest trail)
- Subtle moss and vines on the frame
- The opening should be about the width of a small character (roughly 60-80px concept)
- Height: about 1.5x character height

The feel should be: "there's a path forward through here." Dark forest colors (deep greens, browns) framing warm inviting light. It should feel like part of the forest, not a man-made door.

STYLE: Chibi pixel art style with chunky outlines. Dark atmospheric forest palette. Rich saturated colors.
BACKGROUND: Plain flat solid gray #808080 background. ONLY the exit element, nothing else. No ground, no extra trees, no sky.`;

async function generate() {
  console.log('Generating forest exit sprite...');

  const parts = [];
  if (BG_REF) {
    parts.push({ text: 'Here is the forest background this exit will appear in. Match the art style and color palette:' });
    parts.push(BG_REF);
  }
  parts.push({ text: PROMPT });

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
        const path = join(OUT, 'exit_forest.png');
        writeFileSync(path, buf);
        console.log(`  ✓ Saved ${path} (${(buf.length/1024).toFixed(0)}KB)`);
        console.log('\nPost-process:');
        console.log(`  magick "${path}" -resize 128x128 -fuzz 10% -transparent "#808080" -strip PNG32:"${path}"`);
        return;
      }
    }
    console.error('No image in response:', JSON.stringify(cands.map(p => p.text || '[img]')));
  } catch (e) {
    console.error('Error:', e.message);
  }
}

generate();
