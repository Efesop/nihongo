#!/usr/bin/env node
/**
 * Generate a badass backflip sprite — extended pose, katana out, anime-cool.
 * Run: GEMINI_API_KEY=key node scripts/generate-backflip.mjs
 * Post-process: magick public/images/tinysenpai/backflip.png -resize 256x256 -fuzz 10% -transparent "#808080" -strip PNG32:public/images/tinysenpai/backflip.png
 */
import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, '..', 'public', 'images', 'tinysenpai');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error('Set GEMINI_API_KEY env var'); process.exit(1); }

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent`;

// Reference: idle sprite for character consistency
const IDLE_PATH = join(OUT, 'idle.png');
const idleData = readFileSync(IDLE_PATH).toString('base64');
const IDLE_REF = { inlineData: { mimeType: 'image/png', data: idleData } };

const PROMPT = `Generate a sprite of this EXACT same chibi pixel art character in a MID-AIR BACKFLIP pose.

POSE REFERENCE: Like a real backflip at the halfway point — his body is arched BACKWARDS in a C-shape, head tilted back, looking behind him. His back is arched, chest facing the sky. LEGS are STRAIGHT and extended (like a gymnast, NOT tucked or curled up). One arm reaches back holding a KATANA sword extended outward. The other arm is stretched out for balance. His large straw kasa hat is still on his head. He has a small wheat stalk in his mouth (tiny detail, NOT smoke).

The character should look like he is rotating backwards through the air — feet going UP and OVER, head going DOWN and BACK. Like a freeze frame of someone doing a standing backflip at the peak moment.

STYLE: Same chibi pixel art with chunky black outlines, oversized head (~40% of body), small stubby body. Same dark black ninja outfit with bright red sash/belt. Same massive golden-brown straw kasa hat. Rich saturated colors, clear pixel detail.

BACKGROUND: Plain flat solid gray #808080 background. ONLY the character, nothing else. No ground, no walls, no effects, no smoke, no trails.`;

async function generate() {
  console.log('Generating backflip sprite...');

  const parts = [
    { text: 'Here is the character in his idle pose. Generate a BACKFLIP version of this SAME character. He must look IDENTICAL — same hat, outfit, art style. Draw ONLY the character on a plain gray background:' },
    IDLE_REF,
    { text: PROMPT },
  ];

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
        const path = join(OUT, 'backflip.png');
        writeFileSync(path, buf);
        console.log(`  ✓ Saved ${path} (${(buf.length/1024).toFixed(0)}KB)`);
        console.log('\nPost-process:');
        console.log(`  magick "${path}" -resize 256x256 -fuzz 10% -transparent "#808080" -strip PNG32:"${path}"`);
        return;
      }
    }
    console.error('No image in response:', JSON.stringify(cands.map(p => p.text || '[img]')));
  } catch (e) {
    console.error('Error:', e.message);
  }
}

generate();
