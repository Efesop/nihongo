#!/usr/bin/env node
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, '..', 'public', 'images', 'tinysenpai', 'game');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error('Set GEMINI_API_KEY'); process.exit(1); }
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${API_KEY}`;

const STYLE = 'Dark dramatic anime art, 16:9 aspect ratio. Cinematic lighting, atmospheric fog, deep rich colors. Epic video game chapter title card. No text or words anywhere in the image.';

const CARDS = [
  ['titlecard_forest',
    `${STYLE} A lone ninja warrior with a massive straw hat running through a dark ancient Japanese forest at night. Towering gnarled trees with twisted branches, pale moonlight filtering through the dense canopy. Green-blue firefly orbs floating. The warrior is mid-sprint, desperate, looking over their shoulder. Pursued. Deep green and blue palette with amber moonbeams.`],

  ['titlecard_encounter',
    `${STYLE} A dark forest clearing at night. Two figures face each other from a distance: a young warrior with a straw hat on one side, and a mysterious dark ninja completely wrapped in purple-black cloth with glowing purple eyes on the other. Purple ethereal energy wisps between them. Tense standoff, moonlight, floating embers. Deep purple and blue tones.`],

  ['titlecard_edo',
    `${STYLE} A warrior with a straw hat standing on a rooftop overlooking a feudal Japanese Edo period castle town at dusk. Tiled rooftops stretching into the distance, castle tower silhouetted against orange sunset sky. Cherry blossom petals drifting. Paper lanterns lighting up below. Warm amber and deep indigo palette. A sense of arriving somewhere ancient and important.`],

  ['titlecard_neon',
    `${STYLE} A warrior with a straw hat standing in a rain-soaked cyberpunk Tokyo alley at night. Neon signs in Japanese reflecting off wet pavement. Holographic advertisements, electric blue and hot pink lights. The warrior is a silhouette holding a katana, completely out of place in this futuristic world. Stark contrast between traditional and cyber. Rain, neon, blade runner atmosphere.`],

  ['titlecard_underground',
    `${STYLE} A dark underground nightclub entrance in cyberpunk Japan. Heavy steel door cracked open, pulsing purple and red light spilling out. Bass vibration lines visible in the air. A warrior with a straw hat approaching from the shadows, katana concealed. Gritty, dangerous, seductive lighting. Deep purples, reds, and blacks.`],

  ['titlecard_spirit',
    `${STYLE} An ethereal Japanese spirit realm. A warrior with a straw hat walking along a floating stone path through a void filled with aurora-like energy. Giant ghostly torii gates in the distance. Cherry blossom petals made of light drifting upward. Otherworldly, beautiful, haunting. Celestial blues, ethereal whites, soft pinks. The boundary between life and death.`],

  ['titlecard_return',
    `${STYLE} A warrior with a straw hat walking up a mountain path toward a small Japanese dojo at sunrise. Golden morning light breaking over mountain peaks. The path behind them stretches endlessly, showing the journey they have taken. Warm golden hour lighting, peaceful but earned. Coming home after a long journey. Nostalgic, hopeful, bittersweet.`],
];

async function generate(name, prompt) {
  const outPath = join(OUT, name + '.png');
  if (existsSync(outPath)) { console.log(`  ${name}: exists`); return; }
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
    console.log(`  ${name}: FAILED`); return;
  }
  for (const part of data.candidates[0].content.parts) {
    if (part.inlineData) {
      const buf = Buffer.from(part.inlineData.data, 'base64');
      writeFileSync(outPath, buf);
      console.log(`  ${name}: done (${(buf.length / 1024).toFixed(1)}KB)`);
      return;
    }
  }
}

console.log(`Generating ${CARDS.length} title cards...`);
for (const [name, prompt] of CARDS) await generate(name, prompt);
console.log('Done!');
