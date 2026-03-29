#!/usr/bin/env node
/**
 * Generate wall run + backflip sprites for the player character.
 * Uses idle.png as the reference for consistent character design.
 *
 * Run: GEMINI_API_KEY=your_key node scripts/generate-player-wallrun.mjs
 */
import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, '..', 'public', 'images', 'tinysenpai');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error('Set GEMINI_API_KEY env var'); process.exit(1); }

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent`;

// Load IDLE reference sprite
const REF_PATH = join(OUT, 'idle.png');
const refData = readFileSync(REF_PATH).toString('base64');
const REF = { inlineData: { mimeType: 'image/png', data: refData } };

// Also load wallslide as secondary reference
const WALL_PATH = join(OUT, 'wallslide.png');
const wallData = readFileSync(WALL_PATH).toString('base64');
const WALL_REF = { inlineData: { mimeType: 'image/png', data: wallData } };

const SPRITES = [
  ['wall-run', 'wallrun',
    'Generate a new sprite of this EXACT same character in a WALL RUN pose — the character is running UP a vertical wall. Body is sideways/tilted, feet pushing off the wall surface, one leg forward one back (mid-stride running motion), arms pumping. Dynamic upward movement. The character should look like they are sprinting vertically up a wall. CRITICAL: Must be the EXACT same character from the reference — same dark hair, same outfit, same chibi pixel art style. Gray #808080 background. Facing left.'],
  ['backflip', 'backflip',
    'Generate a new sprite of this EXACT same character in a MID-BACKFLIP pose — the character is tucked into a tight backward somersault. Knees pulled to chest, body curled, mid-rotation in the air. Dynamic and acrobatic. Should look like the peak of a backflip off a wall. CRITICAL: Must be the EXACT same character from the reference — same dark hair, same outfit, same chibi pixel art style. Gray #808080 background. Facing left.'],
  ['wall-run2', 'wallrun2',
    'Generate a new sprite of this EXACT same character in a WALL RUN starting pose — the character has just leaped onto a wall and is beginning to run up. One foot planted on the wall, body leaning into the wall, other leg about to push off. This is frame 1 of a wall run — explosive start. CRITICAL: Must be the EXACT same character from the reference — same dark hair, same outfit, same chibi pixel art style. Gray #808080 background. Facing left.'],
];

async function generateSprite(filename, name, prompt) {
  const path = join(OUT, `${filename}.png`);
  process.stdout.write(`  ${name}: generating...`);

  const parts = [
    { text: 'Here is the IDLE pose of this character and their WALL SLIDE pose. Generate a NEW pose of this SAME character — same dark clothing, same hair, same art style. The character must look IDENTICAL except for the pose change:' },
    REF,
    WALL_REF,
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
  console.log('Generating player wall run + backflip sprites...');
  console.log(`Reference: ${REF_PATH}`);
  console.log(`Wall ref: ${WALL_PATH}`);
  for (const [filename, name, prompt] of SPRITES) {
    await generateSprite(filename, name, prompt);
    await new Promise(r => setTimeout(r, 2000));
  }
  console.log('\nDone! Now run post-processing:');
  console.log('cd public/images/tinysenpai');
  console.log('for f in wall-run backflip wall-run2; do');
  console.log('  magick "${f}.png" -resize 256x256 -fuzz 10% -transparent "#808080" -strip PNG32:"${f}.png"');
  console.log('done');
}

main();
