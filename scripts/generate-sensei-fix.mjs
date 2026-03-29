#!/usr/bin/env node
/**
 * Regenerate sensei tea + throw sprites with CONE HAT (not gold hat).
 * Uses story_sensei_alarmed.png as the reference for the correct hat style.
 *
 * Run: GEMINI_API_KEY=your_key node scripts/generate-sensei-fix.mjs
 */
import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, '..', 'public', 'images', 'tinysenpai', 'game');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error('Set GEMINI_API_KEY env var'); process.exit(1); }

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent`;

// Load the CONE HAT reference sprite
const REF_PATH = join(OUT, 'story_sensei_alarmed.png');
const refData = readFileSync(REF_PATH).toString('base64');
const REF = { inlineData: { mimeType: 'image/png', data: refData } };

const SPRITES = [
  ['story_sensei_tea',
    'Generate a new sprite of this EXACT same character in a SEATED cross-legged pose, sipping tea from a small cup. Staff across his lap. CRITICAL: The hat MUST be the same FLAT WIDE CONE-SHAPED STRAW HAT (like a Vietnamese non la / rice paddy hat) shown in the reference — it is FLAT and TRIANGULAR, NOT tall, NOT golden, NOT ornate. Copy the hat EXACTLY from the reference image. Same white beard, dark robes, wooden staff. Same chibi pixel art style. Gray #808080 background. Facing left.'],
  ['story_sensei_throw',
    'Generate a new sprite of this EXACT same character in a THROWING pose — arm extended forward releasing a wooden bokken. Dynamic action pose, weight on front foot. CRITICAL: The hat MUST be the same FLAT WIDE CONE-SHAPED STRAW HAT (like a Vietnamese non la / rice paddy hat) shown in the reference — it is FLAT and TRIANGULAR, NOT tall, NOT golden, NOT ornate. Copy the hat EXACTLY from the reference image. Same white beard, dark robes. Same chibi pixel art style. Gray #808080 background. Facing left.'],
];

async function generateSprite(name, prompt) {
  const path = join(OUT, `${name}.png`);
  process.stdout.write(`  ${name}: generating...`);

  const parts = [
    { text: 'Here is the IDLE pose of this EXACT character. Generate a NEW pose of this SAME character — same cone straw hat, same white beard, same dark robes, same wooden staff, same art style. The character must look IDENTICAL except for the pose change:' },
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
  console.log('Generating sensei sprites with CONE HAT...');
  console.log(`Reference: ${REF_PATH}`);
  for (const [name, prompt] of SPRITES) {
    await generateSprite(name, prompt);
    // Small delay between requests
    await new Promise(r => setTimeout(r, 2000));
  }
  console.log('\nDone! Now run post-processing:');
  console.log('cd public/images/tinysenpai/game');
  console.log('for f in story_sensei_tea story_sensei_throw; do');
  console.log('  magick "${f}.png" -resize 256x256 -fuzz 18% -transparent "#808080" -strip PNG32:"${f}.png"');
  console.log('done');
}

main();
