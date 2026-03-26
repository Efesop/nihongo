#!/usr/bin/env node
/**
 * Generate game sprites using Gemini API (pixel art generation).
 * Run: GEMINI_API_KEY=your_key node scripts/generate-sprites.mjs
 *
 * Art style: Chibi pixel art with chunky black outlines, oversized heads (~40-50% body height),
 * small stubby bodies, exaggerated features. ~32x32 pixel scale rendered as 1024x1024 images.
 * Rich saturated colors, clear pixel-level detail. Solid gray #808080 background (removed at runtime).
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

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent`;

// ═══ ART STYLE PREAMBLE ═══
// Included in every prompt so Gemini stays on-model
const STYLE_CHAR = `Chibi pixel art style with chunky black outlines. Oversized head (about 40-50% of body height), small stubby body, exaggerated features. Rendered at roughly 32x32 pixel scale but generated as a 1024x1024 image. Rich saturated colors with clear pixel-level detail. Solid gray (#808080) background. No text, no labels, no UI elements. Single character centered in image.`;

const STYLE_BG = `Dark moody Japanese pixel art environment. Deep rich color palette with atmospheric fog/haze. Warm light sources (lanterns, fire) provide small orange glows against dark surroundings. Pixel art style matching a side-scrolling action game. No characters. Scene extends edge-to-edge with absolutely NO border, NO margin, NO gray background — the environment fills the entire image.`;

// ═══ SPRITE DEFINITIONS ═══
// Each sprite: [filename, description]
// All characters face LEFT by default

const SPRITES = [
  // ── SAMURAI (armored elite enemy — dark steel-grey and gold armor, horned kabuto helmet with golden crescent, stoic face, red accents, long katana, heavy upright posture, purple-grey tones with gold trim) ──
  ['samurai_idle',    `Samurai enemy standing alert in idle pose. Dark steel-grey and gold ornate armor, horned kabuto helmet with golden crescent ornament on top, stoic expression, red accent details on armor joints, long katana held ready. Heavy upright posture. Facing left. ${STYLE_CHAR}`],
  ['samurai_walk1',   `Samurai enemy walking step 1, left foot forward. Dark steel-grey and gold armor, horned kabuto helmet with golden crescent, katana at side. Facing left. ${STYLE_CHAR}`],
  ['samurai_walk2',   `Samurai enemy walking step 2, right foot forward. Dark steel-grey and gold armor, horned kabuto helmet with golden crescent, katana at side. Facing left. ${STYLE_CHAR}`],
  ['samurai_alert',   `Samurai enemy in defensive stance, sword raised ready to block. Dark steel-grey and gold armor, horned kabuto helmet, intense eyes. Facing left. ${STYLE_CHAR}`],
  ['samurai_attack',  `Samurai enemy mid downward sword strike, aggressive attack pose. Dark steel-grey and gold armor, horned kabuto helmet, katana slashing down. Facing left. ${STYLE_CHAR}`],
  ['samurai_dazed',   `Samurai enemy stunned and dizzy, leaning back, small stars above head. Dark steel-grey and gold armor, horned kabuto helmet askew. Facing left. ${STYLE_CHAR}`],
  ['samurai_hit',     `Samurai enemy recoiling from being hit, knocked back slightly, pain expression. Dark steel-grey and gold armor, horned kabuto helmet. Facing left. ${STYLE_CHAR}`],
  ['samurai_windup',  `Samurai enemy winding up for powerful attack, sword pulled far back, intense wide stance. Dark steel-grey and gold armor, horned kabuto helmet. Facing left. ${STYLE_CHAR}`],
  ['samurai_kb_back', `Samurai enemy flying backward from heavy hit, body arching back, arms flailing. Dark steel-grey and gold armor, horned kabuto helmet. Facing left. ${STYLE_CHAR}`],
  ['samurai_kb_tumble',`Samurai enemy tumbling on ground, rolling from impact. Dark steel-grey and gold armor, horned kabuto helmet coming loose. Facing left. ${STYLE_CHAR}`],
  ['samurai_kb_seated',`Samurai enemy slumped sitting on ground, defeated but alive, head bowed. Dark steel-grey and gold armor, horned kabuto helmet. Facing left. ${STYLE_CHAR}`],

  // ── ARCHER (hooded green ranger enemy — dark forest green cloth, deep hood hiding face, quiver of arrows on back, longbow) ──
  ['archer_idle',     `Archer enemy standing with longbow, dark forest green hooded cloak hiding face, quiver on back. Stealthy crouched posture. Facing left. ${STYLE_CHAR}`],
  ['archer_alert',    `Archer enemy spotting target, pulling arrow from quiver, dark green hooded cloak, alert stance. Facing left. ${STYLE_CHAR}`],
  ['archer_draw_bow', `Archer enemy drawing bow back fully, aiming, dark green hooded cloak, focused stance. Facing left. ${STYLE_CHAR}`],
  ['archer_fire',     `Archer enemy releasing arrow, bowstring snapping forward, dark green hooded cloak, follow-through pose. Facing left. ${STYLE_CHAR}`],
  ['archer_retreat',  `Archer enemy stepping backward defensively, dark green hooded cloak, wary expression. Facing left. ${STYLE_CHAR}`],
  ['archer_dazed',    `Archer enemy stunned and dizzy, leaning, dark green hooded cloak, stars above head. Facing left. ${STYLE_CHAR}`],
  ['archer_hit',      `Archer enemy recoiling from hit, dark green hooded cloak, pain expression. Facing left. ${STYLE_CHAR}`],
  ['archer_kneel',    `Archer enemy kneeling defeated, dark green hooded cloak, head bowed. Facing left. ${STYLE_CHAR}`],
  ['archer_dead',     `Archer enemy collapsed dead on ground, dark green hooded cloak, bow fallen beside. Facing left. ${STYLE_CHAR}`],
  ['archer_kb_back',  `Archer enemy flying backward from hit, dark green hooded cloak billowing. Facing left. ${STYLE_CHAR}`],

  // ── BRUTE (massive heavy enemy — huge muscular red-brown body, small angry head, carries enormous iron kanabo club, slow and powerful) ──
  ['brute_idle',      `Massive brute enemy standing with enormous iron kanabo studded club. Huge muscular red-brown body, tiny angry head, bulging muscles, tattered dark shorts. Imposing and heavy. Facing left. ${STYLE_CHAR}`],
  ['brute_alert',     `Brute enemy spotting target, raising kanabo club threateningly overhead. Huge red-brown muscular body, angry snarl. Facing left. ${STYLE_CHAR}`],
  ['brute_charge',    `Brute enemy charging forward running, kanabo club trailing behind. Huge red-brown muscular body, ground-shaking stance. Facing left. ${STYLE_CHAR}`],
  ['brute_attack',    `Brute enemy slamming kanabo club down, massive overhead smash. Huge red-brown muscular body, impact pose. Facing left. ${STYLE_CHAR}`],
  ['brute_exhausted', `Brute enemy hunched over panting, exhausted after attack. Huge red-brown muscular body, kanabo resting on ground. Facing left. ${STYLE_CHAR}`],
  ['brute_hit',       `Brute enemy flinching from hit, surprised expression. Huge red-brown muscular body. Facing left. ${STYLE_CHAR}`],
  ['brute_kneel',     `Brute enemy kneeling defeated, head bowed. Huge red-brown muscular body, kanabo dropped. Facing left. ${STYLE_CHAR}`],
  ['brute_dead',      `Brute enemy collapsed dead on ground. Huge red-brown muscular body, kanabo beside. Facing left. ${STYLE_CHAR}`],
  ['brute_kb_back',   `Brute enemy flying backward from powerful hit. Huge red-brown muscular body, arms flailing. Facing left. ${STYLE_CHAR}`],

  // ── TENGU (crow demon — dark blue/black feathered body, long red tengu nose, wings, talons, mystical) ──
  ['tengu_hover',     `Tengu crow demon hovering in air with spread dark wings. Blue-black feathered body, long red nose, golden eyes, mystical aura. Facing left. ${STYLE_CHAR}`],
  ['tengu_swoop',     `Tengu crow demon diving downward to attack, wings folded back. Blue-black feathered body, long red nose, talons extended. Facing left. ${STYLE_CHAR}`],
  ['tengu_attack',    `Tengu crow demon striking with sharp talons mid-air. Blue-black feathered body, long red nose, aggressive pose. Facing left. ${STYLE_CHAR}`],
  ['tengu_dazed',     `Tengu crow demon stunned in air, wings drooping. Blue-black feathered body, long red nose, dizzy expression. Facing left. ${STYLE_CHAR}`],
  ['tengu_hit',       `Tengu crow demon recoiling from hit in air, feathers flying off. Blue-black body, long red nose. Facing left. ${STYLE_CHAR}`],
  ['tengu_dead',      `Tengu crow demon falling dead from sky, wings limp, eyes closed. Blue-black feathered body, long red nose. Facing left. ${STYLE_CHAR}`],

  // ── CHARACTER PORTRAITS (close-up face, chibi style, 64x64 feel) ──
  ['portrait_sensei', `Close-up face portrait of wise old Japanese sensei. Oversized chibi head, long flowing white beard, kind wise eyes, tall golden ornate hat, weathered warm face, dark robes at neck. ${STYLE_CHAR}`],
  ['portrait_player', `Close-up face portrait of TinySenpai — tiny samurai ronin. Oversized chibi head, massive wide-brimmed golden-brown straw kasa hat (wider than head), narrow eyes barely visible under hat brim, bright red scarf/bandana. Determined expression. ${STYLE_CHAR}`],
  ['portrait_shadow', `Close-up face portrait of mysterious shadow ninja. Oversized chibi head completely wrapped in dark purple-black cloth, only narrow eye slit showing bright glowing purple eyes, two long flowing scarf tails behind head. Menacing aura. ${STYLE_CHAR}`],
  ['portrait_elder',  `Close-up face portrait of kind old Japanese temple elder woman. Oversized chibi head, bald, serene expression, white and green temple robes at neck, prayer beads visible. Warm gentle smile. ${STYLE_CHAR}`],

  // ═══ STORY SCENE BACKGROUNDS (wide pixel art, ~640x360, edge-to-edge) ═══
  ['bg_dojo_story',       `Wide pixel art background of a traditional Japanese dojo interior. Polished warm wooden floor stretching wall to wall, shoji paper sliding screens on both sides, thick wooden support pillars, weapon rack with katanas on the back wall, warm amber lantern light from hanging lanterns, scroll calligraphy on wall. Dark atmospheric mood, warm wood and amber tones. ${STYLE_BG} Aspect ratio 16:9.`],
  ['bg_dojo_night_story', `Wide pixel art background of a Japanese dojo interior at night. Same wooden dojo but dark and dramatic — only pale moonlight filtering through paper screens casting blue-white shadows, one red paper lantern glowing ominously in corner. Tense foreboding atmosphere, blue-black shadows. ${STYLE_BG} Aspect ratio 16:9.`],
  ['bg_forest_story',     `Wide pixel art background of a dark Japanese forest clearing at night. Massive gnarled ancient trees with twisted branches and hanging moss filling the sides. Deep blue-green color palette. Soft green-yellow firefly orbs floating. Pale moonlight filtering through canopy. Small campfire with warm orange glow in center. Atmospheric fog/haze between tree layers. Mysterious and dark like a haunted Miyazaki forest in pixel art. ${STYLE_BG} Aspect ratio 16:9.`],
  ['bg_temple_story',     `Wide pixel art background of a Japanese mountain temple interior. Golden Buddha statue in back center, wisps of incense smoke rising, tall red lacquered pillars, warm hanging paper lanterns with soft glow, stone floor with prayer cushions. Sacred serene atmosphere, golden and red tones. ${STYLE_BG} Aspect ratio 16:9.`],
  ['bg_dojo',             `Very wide pixel art parallax background of a Japanese dojo interior for side-scrolling game. Long polished wooden floor stretching left to right, repeating shoji screens, support pillars spaced evenly, weapons on walls, warm amber lantern glow. Tileable horizontally. ${STYLE_BG} Aspect ratio wider than 3:1, at least 1280x360.`],

  // ═══ STORY SCENE CHARACTER SPRITES (full body standing, chibi style matching game characters) ═══
  // Player = TinySenpai: massive straw kasa hat, narrow eyes under brim, black ninja outfit, red sash, katana
  ['story_player_idle',        `Full body chibi pixel art of TinySenpai standing casually, facing RIGHT. Massive wide-brimmed golden-brown straw kasa hat (wider than body, most recognizable feature), narrow eyes barely visible under hat brim, black/dark gray ninja outfit, bright red sash at waist, katana at hip, small skin-tone hands. Neutral relaxed standing pose. ${STYLE_CHAR}`],
  ['story_player_surprised',   `Full body chibi pixel art of TinySenpai reacting in shock, facing RIGHT. Same massive kasa hat, eyes wide with surprise visible under brim, body leaning back slightly, one hand raised in alarm, red sash, black ninja outfit. Shocked expression. ${STYLE_CHAR}`],
  ['story_player_determined',  `Full body chibi pixel art of TinySenpai in determined resolute pose, facing RIGHT. Same massive kasa hat, narrowed serious eyes under brim, clenched fists, firm wide stance, red sash, black ninja outfit, katana gripped ready. Fierce determination. ${STYLE_CHAR}`],
  ['story_player_kneeling',    `Full body chibi pixel art of TinySenpai kneeling respectfully, facing RIGHT. Same massive kasa hat bowed forward, one knee down, head slightly bowed in respect, red sash, black ninja outfit. Humble training position. ${STYLE_CHAR}`],

  // Sensei = wise old master: tall golden ornate hat, long white beard, dark traditional robes, wooden staff, kind weathered face
  ['story_sensei_idle',        `Full body chibi pixel art of wise old Japanese sensei standing calmly, facing LEFT. Oversized chibi head with tall golden ornate hat, long flowing white beard reaching chest, kind weathered eyes, traditional dark navy robes, wooden walking staff in hand. Dignified warm presence, slightly hunched with age. ${STYLE_CHAR}`],
  ['story_sensei_serious',     `Full body chibi pixel art of wise old Japanese sensei with grave serious expression, facing LEFT. Same golden hat, white beard, dark robes, arms crossed firmly, brow deeply furrowed with concern, staff tucked under arm. Worried and stern. ${STYLE_CHAR}`],
  ['story_sensei_amused',      `Full body chibi pixel art of wise old Japanese sensei with warm amused smile, facing LEFT. Same golden hat, white beard, dark robes, relaxed posture leaning on staff, gentle kind amusement in eyes, slight smile through beard. Fond teacher. ${STYLE_CHAR}`],

  // Shadow = dark ninja antagonist: all dark purple-black, wrapped head with only glowing purple eye slit, two long flowing scarf tails, stealthy posture
  ['story_shadow_idle',        `Full body chibi pixel art of dark mysterious shadow ninja standing with arms crossed, facing LEFT. Oversized chibi head completely wrapped in dark purple-black cloth, only narrow slit showing bright glowing purple eyes, two long flowing scarf tails trailing behind head. Dark purple-black outfit, stealthy crouched posture, dark aura wisps. Menacing and powerful. ${STYLE_CHAR}`],
  ['story_shadow_angry',       `Full body chibi pixel art of shadow ninja in aggressive furious stance, facing LEFT. Same wrapped head with purple eye slit now glowing intensely bright, scarf tails whipping aggressively, fists clenched, leaning forward threateningly, dark aura flaring. Enraged. ${STYLE_CHAR}`],
  ['story_shadow_bitter',      `Full body chibi pixel art of shadow ninja turning partially away, facing LEFT. Same wrapped head, purple eyes dimmer and downcast, scarf tails hanging limp, shoulders slumped, posture suggesting deep regret or hidden pain. Melancholic. ${STYLE_CHAR}`],

  // Elder = temple keeper: bald, white and green robes, prayer beads, calm serene
  ['story_elder_idle',         `Full body chibi pixel art of old Japanese temple elder standing peacefully, facing LEFT. Oversized chibi bald head, calm serene expression, white and green traditional temple robes, prayer bead necklace, hands clasped gently. Wise and gentle presence. ${STYLE_CHAR}`],
  ['story_elder_concerned',    `Full body chibi pixel art of old Japanese temple elder looking worried, facing LEFT. Same bald head, white and green robes, prayer beads, hands clasped tightly together, brow furrowed with deep concern. Anxious and caring. ${STYLE_CHAR}`],

  // ═══ REDESIGNED SENSEI PORTRAIT ═══
  ['portrait_sensei_v2', `Close-up face portrait of wise old Japanese sensei. Oversized chibi head, long flowing white beard, deep kind wise eyes with warmth, tall golden ornate hat with decorative kanji symbol, weathered but warm face, dark navy robes visible at neck. Distinguished noble teacher. ${STYLE_CHAR}`],
];

// ═══ REFERENCE IMAGES for style consistency ═══
// Load actual in-game sprites so Gemini matches the exact art style
function loadRefImage(path) {
  try {
    const buf = readFileSync(path);
    return { inlineData: { mimeType: 'image/png', data: buf.toString('base64') } };
  } catch { return null; }
}

const REF_PLAYER = loadRefImage(join(__dir, '..', 'public', 'images', 'tinysenpai', 'idle.png'));
const REF_ONI = loadRefImage(join(__dir, '..', 'public', 'images', 'oni', 'demon.png'));
const REF_NINJA = loadRefImage(join(__dir, '..', 'public', 'images', 'ninja', 'ninja.png'));
const REF_FOREST = loadRefImage(join(__dir, '..', 'public', 'images', 'forest.png'));

async function generateSprite(name, prompt) {
  const path = join(OUT, `${name}.png`);
  if (existsSync(path)) { console.log(`  ${name}: exists`); return; }
  process.stdout.write(`  ${name}: generating...`);

  // Build request parts — include reference images for style matching
  const isCharSprite = name.startsWith('story_') || name.startsWith('portrait_');
  const isBgSprite = name.startsWith('bg_');
  const isEnemySprite = !isCharSprite && !isBgSprite;
  const parts = [];

  if (isCharSprite && REF_PLAYER) {
    // Story characters + portraits: use player, oni, ninja as style references
    parts.push({ text: 'Here are reference images showing the EXACT pixel art style of my game. ALL new sprites must match this style precisely — same chibi proportions (oversized head ~40-50% of body), same chunky black outlines, same pixel density, same color saturation, same level of detail:' });
    parts.push(REF_PLAYER);
    parts.push({ text: 'Reference 2 — oni enemy from the same game:' });
    if (REF_ONI) parts.push(REF_ONI);
    if (REF_NINJA) {
      parts.push({ text: 'Reference 3 — ninja enemy from the same game:' });
      parts.push(REF_NINJA);
    }
    parts.push({ text: `Now generate a NEW character sprite in the EXACT SAME chibi pixel art style as the references above. ${prompt}` });
  } else if (isBgSprite && REF_FOREST) {
    // Backgrounds: use forest as style reference
    parts.push({ text: 'Here is a reference background from my pixel art game. Match this moody atmospheric pixel art style — same level of detail, same dark palette approach, same pixel rendering:' });
    parts.push(REF_FOREST);
    if (REF_PLAYER) {
      parts.push({ text: 'And here is a character from the game for scale/style context:' });
      parts.push(REF_PLAYER);
    }
    parts.push({ text: `Now generate a NEW background in the same pixel art style. ${prompt}` });
  } else if (isEnemySprite) {
    // Enemy sprites: use existing enemies as reference
    const refs = [REF_ONI, REF_NINJA, REF_PLAYER].filter(Boolean);
    if (refs.length > 0) {
      parts.push({ text: 'Here are reference sprites from my game. Match this EXACT chibi pixel art style — oversized heads, chunky black outlines, rich saturated colors, ~32x32 pixel detail rendered as 1024x1024:' });
      refs.forEach(r => parts.push(r));
      parts.push({ text: `Now generate a NEW enemy sprite in the EXACT SAME style. ${prompt}` });
    } else {
      parts.push({ text: `Generate a game sprite. ${prompt}` });
    }
  } else {
    parts.push({ text: `Generate a game sprite. ${prompt}` });
  }

  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.log(` FAILED (${res.status}: ${errText.slice(0, 200)})`);
      return;
    }

    const data = await res.json();
    // Extract image from response
    const resParts = data.candidates?.[0]?.content?.parts || [];
    const imgPart = resParts.find(p => p.inlineData?.mimeType?.startsWith('image/'));
    if (!imgPart) {
      // Check for safety/blocking
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

  // Rate limit — be nice to the API
  await new Promise(r => setTimeout(r, 2000));
}

async function main() {
  console.log(`\nGenerating ${SPRITES.length} sprites to ${OUT}`);
  console.log(`Model: gemini-3.1-flash-image-preview\n`);

  // Check reference images
  console.log(`References loaded: player=${!!REF_PLAYER} oni=${!!REF_ONI} ninja=${!!REF_NINJA} forest=${!!REF_FOREST}\n`);

  for (const [name, prompt] of SPRITES) {
    await generateSprite(name, prompt);
  }
  console.log('\nDone!\n');
}

main().catch(e => { console.error(e.message); process.exit(1); });
