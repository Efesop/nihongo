#!/usr/bin/env node
/**
 * Generate title card art in 3 styles for testing.
 * Run: GEMINI_API_KEY=your_key node scripts/generate-titlecards.mjs
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, '..', 'public', 'images', 'tinysenpai', 'game');
mkdirSync(OUT, { recursive: true });

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error('Set GEMINI_API_KEY'); process.exit(1); }

const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${API_KEY}`;

const CARDS = [
  // ═══ ROOM 0: THE DOJO — 3 styles ═══
  ['titlecard_dojo_anime',
    'Dark dramatic anime art, 16:9 aspect ratio. A young ninja warrior with a massive wide straw hat standing alone in a traditional Japanese dojo at dawn. Moonlight streaming through paper screens casting dramatic shadows. Warrior seen from behind, katana at hip, looking toward training grounds. Deep blues and warm amber from a single lantern. Cinematic lighting, atmospheric fog. Epic video game chapter title card. No text or words anywhere.'],

  ['titlecard_dojo_sumi',
    'Traditional Japanese sumi-e ink wash painting, 16:9 aspect ratio. A lone samurai figure with wide straw hat in a zen dojo. Loose expressive black ink brush strokes on aged rice paper texture. Minimal color, just black ink with subtle warm sepia tones. Mountains visible through open doorway. The beauty is in negative space and what is NOT painted. Wabi-sabi aesthetic. Meditative and powerful. No text or words.'],

  ['titlecard_dojo_ukiyoe',
    'Japanese ukiyo-e woodblock print style, 16:9 aspect ratio. A warrior with a large straw hat stands before a mountain dojo at sunrise. Bold black outlines, flat vivid colors: deep indigo, vermillion red, gold. Cherry blossom petals drift. Stylized clouds. Classic Hokusai and Hiroshige composition. Wood grain texture visible. Rich decorative Japanese art. No text or words.'],

  // ═══ ROOM 5: THE TURNING POINT — 3 styles ═══
  ['titlecard_turning_anime',
    'Dark dramatic anime art, 16:9 aspect ratio. Inside a Japanese dojo at night, two figures face each other: a young ninja with straw hat and an old sensei with golden hat and white beard. Warm lantern glow between them, long shadows on wooden floor. Tension in the air, embers floating. A faint mysterious blue glow emanates from the young warriors forearm. Cinematic, foreboding, the last calm moment. No text or words.'],

  ['titlecard_turning_sumi',
    'Traditional Japanese sumi-e ink wash, 16:9 aspect ratio. Two figures in a dojo, master and student, painted with bold wet ink strokes. The student has a wide straw hat, the master leans on a staff. Between them a small ethereal glow (the mark). Dramatic negative space. Black ink on aged paper with hints of blue wash for the glow. Emotional weight in the empty space between them. No text or words.'],

  ['titlecard_turning_ukiyoe',
    'Japanese ukiyo-e woodblock print, 16:9 aspect ratio. Night scene in a traditional dojo. An old master with ornate golden hat and flowing white beard faces his young student who wears a massive straw hat. Paper lanterns cast warm glow. Outside the shoji screens, shadowy figures approach. Bold outlines, flat dramatic colors: deep purple night sky, warm amber interior, danger red accents. Classic Japanese composition. No text or words.'],
];

async function generate(name, prompt) {
  const outPath = join(OUT, name + '.png');
  console.log(`  ${name}: generating...`);

  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
    }),
  });

  const data = await res.json();
  if (!data.candidates?.[0]?.content?.parts) {
    console.log(`  ${name}: FAILED — ${JSON.stringify(data).slice(0, 200)}`);
    return;
  }

  for (const part of data.candidates[0].content.parts) {
    if (part.inlineData) {
      const buf = Buffer.from(part.inlineData.data, 'base64');
      writeFileSync(outPath, buf);
      console.log(`  ${name}: done (${(buf.length / 1024).toFixed(1)}KB)`);
      return;
    }
  }
  console.log(`  ${name}: no image in response`);
}

console.log(`Generating ${CARDS.length} title card concepts...`);
for (const [name, prompt] of CARDS) {
  await generate(name, prompt);
}
console.log('Done!');
