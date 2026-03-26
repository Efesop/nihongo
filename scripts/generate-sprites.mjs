#!/usr/bin/env node
/**
 * Generate game sprites using Gemini API (pixel art generation).
 * Run: GEMINI_API_KEY=your_key node scripts/generate-sprites.mjs
 *
 * Sprites are 20x20 pixel art, matching the TinySenpai game art style.
 * Reference existing oni/ninja sprites for consistent art.
 * Delete any file in public/images/tinysenpai/game/ to regenerate just that one.
 */
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, '..', 'public', 'images', 'tinysenpai', 'game');
mkdirSync(OUT, { recursive: true });

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error('Set GEMINI_API_KEY env var'); process.exit(1); }

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`;

// ═══ SPRITE DEFINITIONS ═══
// Each sprite: [filename, description]
// Style: 20x20 pixel art, dark feudal Japanese, gray #808080 background
// All characters face LEFT by default

const SPRITES = [
  // ── SAMURAI (needs more states — has kneel + dead already) ──
  ['samurai_idle',    'Samurai warrior standing alert in idle pose, heavy armor, purple/gold colors, face left, 20x20 pixel art, gray background #808080'],
  ['samurai_walk1',   'Samurai warrior walking step 1, left foot forward, heavy armor, purple/gold, face left, 20x20 pixel art, gray background #808080'],
  ['samurai_walk2',   'Samurai warrior walking step 2, right foot forward, heavy armor, purple/gold, face left, 20x20 pixel art, gray background #808080'],
  ['samurai_alert',   'Samurai warrior in defensive stance, sword raised, ready to block, purple/gold armor, face left, 20x20 pixel art, gray background #808080'],
  ['samurai_attack',  'Samurai warrior mid downward sword strike, aggressive, purple/gold armor, face left, 20x20 pixel art, gray background #808080'],
  ['samurai_dazed',   'Samurai warrior stunned and dizzy, leaning back, stars above head, purple/gold armor, face left, 20x20 pixel art, gray background #808080'],
  ['samurai_hit',     'Samurai warrior recoiling from being hit, knocked back slightly, purple/gold armor, face left, 20x20 pixel art, gray background #808080'],
  ['samurai_windup',  'Samurai warrior winding up for attack, sword pulled back, intense stance, purple/gold armor, face left, 20x20 pixel art, gray background #808080'],
  ['samurai_kb_back', 'Samurai warrior flying backward from hit, body arching back, purple/gold armor, face left, 20x20 pixel art, gray background #808080'],
  ['samurai_kb_tumble','Samurai warrior tumbling on ground, rolling, purple/gold armor, face left, 20x20 pixel art, gray background #808080'],
  ['samurai_kb_seated','Samurai warrior slumped sitting on ground, defeated but alive, purple/gold armor, face left, 20x20 pixel art, gray background #808080'],

  // ── ARCHER (full set) ──
  ['archer_idle',     'Archer warrior standing with bow, dark green cloth, hooded, face left, 20x20 pixel art, gray background #808080'],
  ['archer_alert',    'Archer warrior spotting enemy, pulling arrow from quiver, dark green cloth, face left, 20x20 pixel art, gray background #808080'],
  ['archer_draw_bow', 'Archer warrior drawing bow back, aiming, dark green cloth, face left, 20x20 pixel art, gray background #808080'],
  ['archer_fire',     'Archer warrior releasing arrow, bow string snapping forward, dark green cloth, face left, 20x20 pixel art, gray background #808080'],
  ['archer_retreat',  'Archer warrior stepping backward, defensive, dark green cloth, face left, 20x20 pixel art, gray background #808080'],
  ['archer_dazed',    'Archer warrior stunned and dizzy, leaning, dark green cloth, face left, 20x20 pixel art, gray background #808080'],
  ['archer_hit',      'Archer warrior recoiling from hit, dark green cloth, face left, 20x20 pixel art, gray background #808080'],
  ['archer_kneel',    'Archer warrior kneeling defeated, dark green cloth, face left, 20x20 pixel art, gray background #808080'],
  ['archer_dead',     'Archer warrior collapsed dead on ground, dark green cloth, face left, 20x20 pixel art, gray background #808080'],
  ['archer_kb_back',  'Archer warrior flying backward from hit, dark green cloth, face left, 20x20 pixel art, gray background #808080'],

  // ── BRUTE (full set) ──
  ['brute_idle',      'Massive brute warrior standing with large club, bulky muscular, red/brown, face left, 20x20 pixel art, gray background #808080'],
  ['brute_alert',     'Brute warrior spotting enemy, raising club threateningly, red/brown, face left, 20x20 pixel art, gray background #808080'],
  ['brute_charge',    'Brute warrior charging forward running, club trailing behind, red/brown, face left, 20x20 pixel art, gray background #808080'],
  ['brute_attack',    'Brute warrior slamming club down, overhead smash, red/brown, face left, 20x20 pixel art, gray background #808080'],
  ['brute_exhausted', 'Brute warrior hunched over panting, tired after attack, red/brown, face left, 20x20 pixel art, gray background #808080'],
  ['brute_hit',       'Brute warrior flinching from hit, red/brown, face left, 20x20 pixel art, gray background #808080'],
  ['brute_kneel',     'Brute warrior kneeling defeated, red/brown, face left, 20x20 pixel art, gray background #808080'],
  ['brute_dead',      'Brute warrior collapsed dead, red/brown, face left, 20x20 pixel art, gray background #808080'],
  ['brute_kb_back',   'Brute warrior flying backward from hit, red/brown, face left, 20x20 pixel art, gray background #808080'],

  // ── TENGU (full set) ──
  ['tengu_hover',     'Tengu crow demon hovering in air with spread wings, dark blue/black, face left, 20x20 pixel art, gray background #808080'],
  ['tengu_swoop',     'Tengu diving downward to attack, wings folded, dark blue/black, face left, 20x20 pixel art, gray background #808080'],
  ['tengu_attack',    'Tengu striking with talons, attacking pose mid-air, dark blue/black, face left, 20x20 pixel art, gray background #808080'],
  ['tengu_dazed',     'Tengu stunned in air, wings drooping, dark blue/black, face left, 20x20 pixel art, gray background #808080'],
  ['tengu_hit',       'Tengu recoiling from hit in air, dark blue/black, face left, 20x20 pixel art, gray background #808080'],
  ['tengu_dead',      'Tengu falling dead from sky, wings limp, dark blue/black, face left, 20x20 pixel art, gray background #808080'],

  // ── CHARACTER PORTRAITS (64x64) ──
  ['portrait_sensei', 'Wise old Japanese sensei face portrait, gold hat, kind but serious eyes, white beard, 64x64 pixel art, gray background #808080'],
  ['portrait_player', 'Young determined Japanese warrior face portrait, TinySenpai mascot, brown hat, red accent, 64x64 pixel art, gray background #808080'],
  ['portrait_shadow', 'Dark mysterious silhouette face portrait, glowing purple eyes, menacing aura, 64x64 pixel art, gray background #808080'],
  ['portrait_elder',  'Kind old Japanese woman face portrait, temple robes, green accent, warm smile, 64x64 pixel art, gray background #808080'],
];

async function generateSprite(name, prompt) {
  const path = join(OUT, `${name}.png`);
  if (existsSync(path)) { console.log(`  ${name}: exists`); return; }
  process.stdout.write(`  ${name}: generating...`);

  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Generate a single sprite image. ${prompt}. Style: clean pixel art, solid colors, no anti-aliasing, game-ready. The character should be centered in the image with a solid gray (#808080) background. No text, no labels.`
          }]
        }],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
          imageMimeType: "image/png",
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.log(` FAILED (${res.status}: ${errText.slice(0, 100)})`);
      return;
    }

    const data = await res.json();
    // Extract image from response
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imgPart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'));
    if (!imgPart) {
      console.log(` FAILED (no image in response)`);
      return;
    }

    const buf = Buffer.from(imgPart.inlineData.data, 'base64');
    writeFileSync(path, buf);
    console.log(` done (${(buf.byteLength / 1024).toFixed(1)}KB)`);
  } catch (err) {
    console.log(` ERROR: ${err.message}`);
  }

  // Rate limit
  await new Promise(r => setTimeout(r, 1500));
}

async function main() {
  console.log(`\nGenerating ${SPRITES.length} sprites to ${OUT}\n`);
  for (const [name, prompt] of SPRITES) {
    await generateSprite(name, prompt);
  }
  console.log('\nDone!\n');
}

main().catch(e => { console.error(e.message); process.exit(1); });
