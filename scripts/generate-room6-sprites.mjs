#!/usr/bin/env node
/**
 * Generate Room 6 environment sprites.
 * Run: GEMINI_API_KEY="YOUR_KEY" node scripts/generate-room6-sprites.mjs
 * Post-process: cd public/images/tinysenpai/game && for f in smoke_overlay.png burning_debris.png hanging_vine.png stone_lantern_broken.png exit_forest_fire.png; do magick "$f" -resize 256x256 -fuzz 10% -transparent "#808080" -strip PNG32:"$f"; done
 */
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, '..', 'public', 'images', 'tinysenpai', 'game');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error('Set GEMINI_API_KEY env var'); process.exit(1); }

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent';

const SPRITES = [
  ['smoke_overlay.png', 'Generate a pixel art smoke wisp sprite on a plain gray (#808080) background. Thin, translucent white-gray smoke tendril, horizontal orientation, about 200px wide and 60px tall. Pixel art style matching a 2D side-scrolling action game. The smoke should look like it is drifting left to right. Subtle, atmospheric, not cartoonish. PNG, no border.'],
  ['burning_debris.png', 'Generate a pixel art sprite sheet of burning wooden debris on a plain gray (#808080) background. Show 3-4 small pieces of burning wood, charred branches with orange flame tips, and glowing embers. Each piece about 30-50px. Dark charcoal wood with bright orange fire edges. Pixel art style for a 2D ninja action game. Atmospheric, serious tone. PNG, no border.'],
  ['hanging_vine.png', 'Generate a pixel art hanging vine sprite on a plain gray (#808080) background. A single thick vine hanging vertically, about 30px wide and 200px tall. Dark green with some brown, a few small leaves attached. Looks like something a ninja could grab and climb. Ancient Japanese forest style. Pixel art, 2D game sprite. PNG, no border.'],
  ['stone_lantern_broken.png', 'Generate a pixel art broken Japanese stone lantern (toro) sprite on a plain gray (#808080) background. The traditional stone garden lantern is cracked and toppled, moss-covered, partially destroyed. About 40px wide, 50px tall. Dark gray stone with green moss patches. Atmospheric, ancient, ruined feel. Pixel art style for a 2D ninja action game set in feudal Japan. PNG, no border.'],
];

async function generate(filename, prompt) {
  const outPath = join(OUT, filename);
  if (existsSync(outPath)) { console.log(`⊘ ${filename} exists, skipping`); return; }
  console.log(`⏳ Generating ${filename}...`);
  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
    });
    const json = await res.json();
    const parts = json.candidates?.[0]?.content?.parts || [];
    for (const p of parts) {
      if (p.inlineData) {
        writeFileSync(outPath, Buffer.from(p.inlineData.data, 'base64'));
        console.log(`✓ Saved ${filename} (${(Buffer.from(p.inlineData.data, 'base64').length / 1024).toFixed(0)}KB)`);
        return;
      }
    }
    console.log(`✗ No image for ${filename}`);
  } catch (e) {
    console.error(`✗ Error generating ${filename}:`, e.message);
  }
}

async function generateExit() {
  const filename = 'exit_forest_fire.png';
  const outPath = join(OUT, filename);
  if (existsSync(outPath)) { console.log(`⊘ ${filename} exists, skipping`); return; }
  console.log(`⏳ Generating ${filename} (with reference)...`);
  try {
    const refPath = join(OUT, 'exit_forest.png');
    const refData = readFileSync(refPath).toString('base64');
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [
          { text: 'Here is an existing forest exit sprite from our game. Generate a BURNING version — same style and proportions but the archway/gate is on fire, crumbling, with embers and smoke. Keep the same pixel art quality and gray (#808080) background:' },
          { inlineData: { mimeType: 'image/png', data: refData } },
          { text: 'Generate the burning forest exit sprite. Same dimensions and style, but flames climbing up the sides, cracking wood, orange glow, falling embers. Dramatic but still readable as an exit. PNG, no border, gray background.' },
        ] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
    });
    const json = await res.json();
    const parts = json.candidates?.[0]?.content?.parts || [];
    for (const p of parts) {
      if (p.inlineData) {
        writeFileSync(outPath, Buffer.from(p.inlineData.data, 'base64'));
        console.log(`✓ Saved ${filename} (${(Buffer.from(p.inlineData.data, 'base64').length / 1024).toFixed(0)}KB)`);
        return;
      }
    }
    console.log(`✗ No image for ${filename}`);
  } catch (e) {
    console.error(`✗ Error generating ${filename}:`, e.message);
  }
}

(async () => {
  for (const [file, prompt] of SPRITES) await generate(file, prompt);
  await generateExit();
  console.log('\n✅ Done! Post-process:');
  console.log('  cd public/images/tinysenpai/game && for f in smoke_overlay.png burning_debris.png hanging_vine.png stone_lantern_broken.png exit_forest_fire.png; do magick "$f" -resize 256x256 -fuzz 10% -transparent "#808080" -strip PNG32:"$f"; done');
})();
