#!/usr/bin/env node
/**
 * Generate wall-climb sprites — character FACING the wall, running UP it.
 * These are used during the wall run phase before the backflip push-off.
 * Run: GEMINI_API_KEY=key node scripts/generate-wall-climb.mjs
 */
import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, '..', 'public', 'images', 'tinysenpai');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error('Set GEMINI_API_KEY env var'); process.exit(1); }

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent`;

// Use wall-cling as reference — shows character on wall
const REF_PATH = join(OUT, 'wall-cling.png');
const refData = readFileSync(REF_PATH).toString('base64');
const REF = { inlineData: { mimeType: 'image/png', data: refData } };

// Also use idle for character consistency
const IDLE_PATH = join(OUT, 'idle.png');
const idleData = readFileSync(IDLE_PATH).toString('base64');
const IDLE_REF = { inlineData: { mimeType: 'image/png', data: idleData } };

const SPRITES = [
  ['wall-cling',
    `Generate a sprite of this EXACT same character clinging to a wall — ONLY the character, NO WALL, NO BRICKS, NO ENVIRONMENT. Just the character alone on a plain flat gray #808080 background. He is pressed flat against an invisible surface to his LEFT, gripping with both hands, feet pressed against it, sliding down slightly. Facing LEFT. Same cone straw hat, dark ninja outfit with red sash, same chibi pixel art style. CRITICAL: Do NOT draw any wall, stones, bricks, or surfaces — ONLY the character on flat gray.`],
  ['wall-climb1',
    `Generate a sprite of this EXACT same character in a WALL CLIMBING pose — ONLY the character, NO WALL, NO ENVIRONMENT, NOTHING ELSE. Just the character on a plain flat gray #808080 background. His body is angled as if running up a vertical surface. LEFT FOOT higher (stepping up), RIGHT FOOT lower (pushing off). Arms reaching upward. He is facing LEFT. Same cone straw hat, dark ninja outfit with red sash, same chibi pixel art style. CRITICAL: Do NOT draw any wall, bricks, stones, or surfaces — ONLY the character alone on gray background.`],
  ['wall-climb2',
    `Generate a sprite of this EXACT same character in the OPPOSITE wall climbing pose — ONLY the character, NO WALL, NO ENVIRONMENT, NOTHING ELSE. Just the character on a plain flat gray #808080 background. His body is angled as if running up a vertical surface. RIGHT FOOT higher (stepping up), LEFT FOOT lower (pushing off). Opposite arm positions from climb1. He is facing LEFT. Same cone straw hat, dark ninja outfit with red sash, same chibi pixel art style. CRITICAL: Do NOT draw any wall, bricks, stones, or surfaces — ONLY the character alone on gray background.`],
];

async function generateSprite(filename, prompt) {
  const path = join(OUT, `${filename}.png`);
  process.stdout.write(`  ${filename}: generating...`);

  const parts = [
    { text: 'Here is the character in an idle pose. Generate a WALL CLIMBING version of this SAME character. He must look IDENTICAL — same hat, outfit, art style. IMPORTANT: Draw ONLY the character on a plain gray background. Do NOT include any wall or environment:' },
    IDLE_REF,
    { text: prompt },
  ];

  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.log(` FAILED (${res.status}: ${errText.slice(0, 200)})`);
      return;
    }

    const data = await res.json();
    const resParts = data.candidates?.[0]?.content?.parts || [];
    const imgPart = resParts.find(p => p.inlineData?.mimeType?.startsWith('image/'));
    if (!imgPart) {
      const reason = data.candidates?.[0]?.finishReason || 'unknown';
      console.log(` FAILED (no image — finishReason: ${reason})`);
      return;
    }

    const buf = Buffer.from(imgPart.inlineData.data, 'base64');
    writeFileSync(path, buf);
    console.log(` done (${(buf.byteLength / 1024).toFixed(1)}KB)`);
  } catch (err) {
    console.log(` ERROR: ${err.message}`);
  }
}

async function main() {
  console.log('Generating wall-climb sprites (facing wall, running up)...');
  console.log(`Reference: ${REF_PATH}`);
  for (const [filename, prompt] of SPRITES) {
    await generateSprite(filename, prompt);
    await new Promise(r => setTimeout(r, 2000));
  }
  console.log('\nDone! Now post-process:');
  console.log(`cd "${OUT}"`);
  console.log('for f in wall-cling wall-climb1 wall-climb2; do');
  console.log('  magick "${f}.png" -resize 256x256 -fuzz 10% -transparent "#808080" -strip PNG32:"${f}.png"');
  console.log('done');
}

main();
