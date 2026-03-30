#!/usr/bin/env node
/**
 * Generate backflip animation frames — 3 new poses for smooth frame-based flip.
 * Run: GEMINI_API_KEY=key node scripts/generate-backflip-frames.mjs
 * Post-process each: magick FILE -resize 256x256 -fuzz 10% -transparent "#808080" -strip PNG32:FILE
 */
import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, '..', 'public', 'images', 'tinysenpai');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error('Set GEMINI_API_KEY env var'); process.exit(1); }

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent`;

// Reference sprites for consistency
const IDLE_PATH = join(OUT, 'idle.png');
const BACKFLIP_PATH = join(OUT, 'backflip.png');
const idleData = readFileSync(IDLE_PATH).toString('base64');
const backflipData = readFileSync(BACKFLIP_PATH).toString('base64');
const IDLE_REF = { inlineData: { mimeType: 'image/png', data: idleData } };
const BACKFLIP_REF = { inlineData: { mimeType: 'image/png', data: backflipData } };

const SPRITES = [
  {
    name: "backflip_pushoff",
    prompt: `Generate a sprite of this EXACT same chibi pixel art character in a WALL PUSH-OFF pose — the very START of a backflip.

POSE: The character has just KICKED OFF a wall with explosive force. His body is leaning backward at about 30-45 degrees from vertical. One leg is fully extended backward (just pushed off the wall surface), the other leg is pulling up toward his chest. His arms are spread wide for balance — one hand grips the katana, the other reaches out. His torso is arching BACKWARD — he's about to flip. His large straw kasa hat is still on his head. Small wheat stalk in his mouth.

This is the EXPLOSIVE LAUNCH moment — think of a gymnast the instant their feet leave the surface. Maximum power, body just starting to arch back. NOT yet rotating, just the initial push-off.

STYLE: Same chibi pixel art with chunky black outlines, oversized head (~40% of body), small stubby body. Same dark black ninja outfit with bright red sash/belt. Same massive golden-brown straw kasa hat. Rich saturated colors.
BACKGROUND: Plain flat solid gray #808080 background. ONLY the character, nothing else.`
  },
  {
    name: "backflip_tuck",
    prompt: `Generate a sprite of this EXACT same chibi pixel art character TUCKED in the middle of a backflip.

POSE: The character is roughly HALFWAY through a backflip. His body is TUCKED TIGHT — knees pulled up toward chest, arms close to body. He's essentially a compact ball rotating backward. His body is roughly SIDEWAYS (horizontal) — head pointing to one side, feet pointing to the other, back facing downward. One hand grips the katana close to his tucked body. His large straw kasa hat is pressed against his head. Small wheat stalk in mouth.

This is the FASTEST ROTATION point — body is compact and spinning tight, like a figure skater pulling their arms in. The character should look like a tight spinning ball with the distinctive hat.

STYLE: Same chibi pixel art with chunky black outlines, oversized head (~40% of body), small stubby body. Same dark black ninja outfit with bright red sash/belt. Same massive golden-brown straw kasa hat. Rich saturated colors.
BACKGROUND: Plain flat solid gray #808080 background. ONLY the character, nothing else.`
  },
  {
    name: "backflip_land",
    prompt: `Generate a sprite of this EXACT same chibi pixel art character at the END of a backflip, about to LAND.

POSE: The character has nearly completed the backflip — about 3/4 through the rotation. His legs are EXTENDING DOWNWARD, reaching for the ground. His body is almost upright again with a slight backward lean. His katana is extended out in one hand — ready to STRIKE on landing (looks badass). The other arm is out for balance. His body is UNCURLING from the flip. His large straw kasa hat is on his head. Small wheat stalk in mouth.

This is the LANDING READY moment — think of the frame just before a gymnast's feet touch down. Legs down, body straightening, katana out ready to fight. Cool and in control.

STYLE: Same chibi pixel art with chunky black outlines, oversized head (~40% of body), small stubby body. Same dark black ninja outfit with bright red sash/belt. Same massive golden-brown straw kasa hat. Rich saturated colors.
BACKGROUND: Plain flat solid gray #808080 background. ONLY the character, nothing else.`
  }
];

async function generate(sprite) {
  console.log(`\nGenerating ${sprite.name}...`);

  const parts = [
    { text: 'Here is the character in his idle pose and his mid-backflip pose. Generate a new pose for the SAME character. He must look IDENTICAL — same hat, outfit, art style. Draw ONLY the character on a plain gray background:' },
    IDLE_REF,
    BACKFLIP_REF,
    { text: sprite.prompt },
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
        const path = join(OUT, `${sprite.name}.png`);
        writeFileSync(path, buf);
        console.log(`  ✓ Saved ${path} (${(buf.length/1024).toFixed(0)}KB)`);
        return true;
      }
    }
    console.error(`  ✗ No image in response:`, cands.map(p => p.text || '[img]').join(' '));
    return false;
  } catch (e) {
    console.error(`  ✗ Error:`, e.message);
    return false;
  }
}

async function main() {
  console.log('=== Backflip Frame Generation ===');
  console.log(`Generating ${SPRITES.length} frames...\n`);

  for (const sprite of SPRITES) {
    await generate(sprite);
    // Brief pause between API calls
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n=== Post-process all frames ===');
  console.log('Run these commands:');
  for (const sprite of SPRITES) {
    const p = join(OUT, `${sprite.name}.png`);
    console.log(`  magick "${p}" -resize 256x256 -fuzz 10% -transparent "#808080" -strip PNG32:"${p}"`);
  }
}

main();
