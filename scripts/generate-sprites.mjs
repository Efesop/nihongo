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

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent`;

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

  // ═══ STORY SCENE BACKGROUNDS (wide pixel art, ~640x360) ═══
  ['bg_dojo_story',       'Wide pixel art scene background of a traditional Japanese dojo interior. Polished wooden floor, shoji paper sliding screens on walls, wooden support pillars, weapon rack with katanas on back wall, warm amber lantern light from above, hanging scroll calligraphy on wall. Dark atmospheric mood, warm wood tones. No characters. 640x360 pixel art, detailed environment, gray background #808080'],
  ['bg_dojo_night_story', 'Wide pixel art scene background of a Japanese dojo at night. Same wooden dojo interior but dark and dramatic, only moonlight through paper screens casting blue shadows, one red lantern glowing ominously. Tense foreboding atmosphere. No characters. 640x360 pixel art, detailed, gray background #808080'],
  ['bg_forest_story',     'Wide pixel art scene background of a dark Japanese forest clearing at night. Moonlight filtering through tall cedar trees, a small campfire with warm glow, moss-covered stones, fireflies floating, misty atmosphere. No characters. 640x360 pixel art, detailed environment, gray background #808080'],
  ['bg_temple_story',     'Wide pixel art scene background of a Japanese mountain temple interior. Golden Buddha statue in back, incense smoke wisping up, red pillars, hanging paper lanterns with warm glow, wooden prayer beads, stone floor. Sacred atmosphere. No characters. 640x360 pixel art, detailed, gray background #808080'],
  ['bg_dojo',             'Wide pixel art parallax background of a Japanese dojo interior for side-scrolling game. Long wooden floor stretching left to right, repeating shoji screens, support pillars every 200px, weapons on walls, warm amber lantern glow. Tileable horizontally. No characters. 1280x360 pixel art, gray background #808080'],

  // ═══ STORY SCENE CHARACTER SPRITES (64x128, full body standing) ═══
  ['story_player_idle',        'Full body pixel art of young Japanese warrior standing casually, facing RIGHT. Brown hat, red scarf, simple dark clothing, katana at hip. Neutral relaxed pose. 64x128 pixel art, clean, centered, gray background #808080'],
  ['story_player_surprised',   'Full body pixel art of young Japanese warrior reacting in shock, facing RIGHT. Brown hat, red scarf, eyes wide, body leaning back slightly, one hand raised. Surprised expression. 64x128 pixel art, centered, gray background #808080'],
  ['story_player_determined',  'Full body pixel art of young Japanese warrior with determined pose, facing RIGHT. Brown hat, red scarf, clenched fist, firm stance, resolute expression. Ready for battle. 64x128 pixel art, centered, gray background #808080'],
  ['story_player_kneeling',    'Full body pixel art of young Japanese warrior kneeling respectfully, facing RIGHT. Brown hat, red scarf, one knee down, head bowed slightly. Training position. 64x128 pixel art, centered, gray background #808080'],
  ['story_sensei_idle',        'Full body pixel art of wise old Japanese sensei standing calmly, facing LEFT. Long white beard, traditional dark robes, wooden staff, golden ornate hat, kind but weathered face. Dignified and warm presence. 64x128 pixel art, centered, gray background #808080'],
  ['story_sensei_serious',     'Full body pixel art of wise old Japanese sensei with grave expression, facing LEFT. White beard, dark robes, golden hat, arms crossed, brow furrowed with concern. Serious and worried. 64x128 pixel art, centered, gray background #808080'],
  ['story_sensei_amused',      'Full body pixel art of wise old Japanese sensei with slight warm smile, facing LEFT. White beard, dark robes, golden hat, relaxed posture, gentle amusement in eyes. Kind teacher. 64x128 pixel art, centered, gray background #808080'],
  ['story_shadow_idle',        'Full body pixel art of dark mysterious ninja figure standing with arms crossed, facing LEFT. All black clothing, glowing purple eyes visible, dark aura wisps around body. Menacing and powerful. 64x128 pixel art, centered, gray background #808080'],
  ['story_shadow_angry',       'Full body pixel art of dark ninja figure in aggressive stance, facing LEFT. Black clothing, glowing purple eyes bright with rage, fists clenched, leaning forward threateningly. Furious. 64x128 pixel art, centered, gray background #808080'],
  ['story_shadow_bitter',      'Full body pixel art of dark ninja figure turning away, facing partially LEFT. Black clothing, purple eyes dimmer, shoulders slumped slightly, posture suggesting regret or pain. Melancholic. 64x128 pixel art, centered, gray background #808080'],
  ['story_elder_idle',         'Full body pixel art of old Japanese temple elder standing peacefully, facing LEFT. White and green robes, prayer beads around neck, bald head, calm serene expression. Wise and gentle. 64x128 pixel art, centered, gray background #808080'],
  ['story_elder_concerned',    'Full body pixel art of old Japanese temple elder looking worried, facing LEFT. White and green robes, prayer beads, hands clasped together, brow furrowed with concern. Anxious. 64x128 pixel art, centered, gray background #808080'],

  // ═══ REDESIGNED SENSEI PORTRAIT ═══
  ['portrait_sensei_v2', 'Wise old Japanese sensei face portrait close-up. Long flowing white beard, deep wise eyes with warmth, golden ornate hat with kanji symbol, weathered but kind face, dark robes visible at neck. Distinguished and noble. 64x64 pixel art, detailed face, gray background #808080'],
];

async function generateSprite(name, prompt) {
  const path = join(OUT, `${name}.png`);
  if (existsSync(path)) { console.log(`  ${name}: exists`); return; }
  process.stdout.write(`  ${name}: generating...`);

  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Generate a single sprite image. ${prompt}. Style: clean pixel art, solid colors, no anti-aliasing, game-ready. The character should be centered in the image with a solid gray (#808080) background. No text, no labels.`
          }]
        }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
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
