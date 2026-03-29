#!/usr/bin/env node
/**
 * Regenerate sensei walk sprites — based on IDLE (calm), not alarmed.
 * Run: GEMINI_API_KEY=key node scripts/generate-sensei-walks.mjs
 */
import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, '..', 'public', 'images', 'tinysenpai', 'game', 'story', 'sensei');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error('Set GEMINI_API_KEY env var'); process.exit(1); }

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent`;

// Use IDLE as reference — calm, serene, staff in hand
const REF_PATH = join(OUT, 'story_sensei_idle.png');
const refData = readFileSync(REF_PATH).toString('base64');
const REF = { inlineData: { mimeType: 'image/png', data: refData } };

const SPRITES = [
  ['story_sensei_walk1',
    'Generate a new sprite of this EXACT same character taking a STEP with his LEFT LEG FORWARD and RIGHT LEG BEHIND. This is a mid-stride walking pose. His left foot should be clearly in FRONT of his body and his right foot clearly BEHIND. He is walking calmly. Same calm facial expression — mouth CLOSED. Staff in same hand. CRITICAL: The leg positions must be CLEARLY VISIBLE and DIFFERENT from a standing pose. Same cone straw hat, white beard, gray robes, wooden staff, same chibi pixel art style. Gray #808080 background. Facing left.'],
  ['story_sensei_walk2',
    'Generate a new sprite of this EXACT same character taking a STEP with his RIGHT LEG FORWARD and LEFT LEG BEHIND. This is the OPPOSITE stride from walk1. His right foot should be clearly in FRONT of his body and his left foot clearly BEHIND. He is walking calmly. Same calm facial expression — mouth CLOSED. Staff in same hand. CRITICAL: The leg positions must be CLEARLY VISIBLE and OPPOSITE to the other walk frame. Same cone straw hat, white beard, gray robes, wooden staff, same chibi pixel art style. Gray #808080 background. Facing left.'],
];

async function generateSprite(filename, prompt) {
  const path = join(OUT, `${filename}.png`);
  process.stdout.write(`  ${filename}: generating...`);

  const parts = [
    { text: 'Here is the IDLE pose of this character. Generate a WALKING version of this SAME character. He must look IDENTICAL — same hat, beard, robes, staff, art style. The ONLY difference is the walking leg position. Keep his face CALM and RELAXED (mouth closed, no shock or alarm):' },
    REF,
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
  console.log('Regenerating sensei walk sprites (calm, based on idle)...');
  console.log(`Reference: ${REF_PATH}`);
  for (const [filename, prompt] of SPRITES) {
    await generateSprite(filename, prompt);
    await new Promise(r => setTimeout(r, 2000));
  }
  console.log('\nDone! Now post-process:');
  console.log(`cd "${OUT}"`);
  console.log('for f in story_sensei_walk1 story_sensei_walk2; do');
  console.log('  magick "${f}.png" -resize 256x256 -fuzz 10% -transparent "#808080" -strip PNG32:"${f}.png"');
  console.log('done');
}

main();
