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
    `Edit this EXACT image to show the character mid-step. ONLY change his legs: move his LEFT LEG forward and RIGHT LEG back in a walking stride. Keep EVERYTHING else pixel-perfect identical — same cone straw hat, same white beard, same dark gray robes, same wooden staff in same hand, same calm closed-mouth face, same colors, same art style, same proportions, same background color. The ONLY change is leg positions showing a walking stride. Gray #808080 background. Facing left.`],
  ['story_sensei_walk2',
    `Edit this EXACT image to show the character mid-step in the OPPOSITE stride. ONLY change his legs: move his RIGHT LEG forward and LEFT LEG back. Keep EVERYTHING else pixel-perfect identical — same cone straw hat, same white beard, same dark gray robes, same wooden staff in same hand, same calm closed-mouth face, same colors, same art style, same proportions, same background color. The ONLY change is leg positions showing the opposite walking stride from walk1. Gray #808080 background. Facing left.`],
];

async function generateSprite(filename, prompt) {
  const path = join(OUT, `${filename}.png`);
  process.stdout.write(`  ${filename}: generating...`);

  const parts = [
    { text: 'Here is a chibi pixel art character. I need you to create a WALKING version. You MUST keep the character looking EXACTLY the same — same hat, beard, robes, staff, face, colors, proportions, pixel art style. Do NOT change the art style or colors. The ONLY thing that changes is the leg position:' },
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
