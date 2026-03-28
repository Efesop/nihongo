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

  // ═══ CUTSCENE IMAGES — Room 5: The Turning Point ═══
  ['cutscene_arm_mark',         `Close-up pixel art of a Japanese person's forearm showing a subtle mysterious dark mark. Thin intricate ink-like lines forming a small abstract pattern on the inner forearm, with a faint blue-white ethereal glow emanating from the mark. Dark background, moody atmospheric lighting. The mark should look subtle and mysterious — NOT dramatic or glowing intensely. Like an ancient tattoo slowly awakening. ${STYLE_BG} Aspect ratio 16:9.`],
  ['cutscene_shoji_shattered',  `Wide pixel art interior of a Japanese dojo with shoji paper screens VIOLENTLY broken inward. Glass and wood shards scattered across the tatami floor, cold night air and moonlight pouring through the gaps. One shoji panel has a dark blood splatter visible on it from the outside. Broken wooden frames, torn paper fragments floating. Violent intrusion into a sacred space. Dark dramatic lighting. ${STYLE_BG} Aspect ratio 16:9.`],
  ['cutscene_hunters_approach', `Wide pixel art of dark armored silhouettes visible THROUGH broken shoji screens from inside a Japanese dojo. Multiple menacing warrior figures standing RIGHT OUTSIDE the broken panels, weapons drawn, lit from behind by cold moonlight creating imposing dark outlines. Close and imminent — they are AT the door, not distant. Heavy armor, masked faces barely visible, threatening posture. Terrifying and immediate. ${STYLE_BG} Aspect ratio 16:9.`],

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
  ['story_sensei_angry',       `Full body chibi pixel art of wise old Japanese sensei FURIOUS and shouting, facing LEFT. Same golden hat, white beard, dark robes but posture completely different — leaning forward aggressively, mouth wide open shouting, deep furrowed brow, eyes blazing with protective fury, staff gripped tightly, commanding and intimidating. A teacher desperately trying to save his student. ${STYLE_CHAR}`],

  // Shadow = dark ninja antagonist: all dark purple-black, wrapped head with only glowing purple eye slit, two long flowing scarf tails, stealthy posture
  ['story_shadow_idle',        `Full body chibi pixel art of dark mysterious shadow ninja standing with arms crossed, facing LEFT. Oversized chibi head completely wrapped in dark purple-black cloth, only narrow slit showing bright glowing purple eyes, two long flowing scarf tails trailing behind head. Dark purple-black outfit, stealthy crouched posture, dark aura wisps. Menacing and powerful. ${STYLE_CHAR}`],
  ['story_shadow_angry',       `Full body chibi pixel art of shadow ninja in aggressive furious stance, facing LEFT. Same wrapped head with purple eye slit now glowing intensely bright, scarf tails whipping aggressively, fists clenched, leaning forward threateningly, dark aura flaring. Enraged. ${STYLE_CHAR}`],
  ['story_shadow_bitter',      `Full body chibi pixel art of shadow ninja turning partially away, facing LEFT. Same wrapped head, purple eyes dimmer and downcast, scarf tails hanging limp, shoulders slumped, posture suggesting deep regret or hidden pain. Melancholic. ${STYLE_CHAR}`],

  // Elder = temple keeper: bald, white and green robes, prayer beads, calm serene
  ['story_elder_idle',         `Full body chibi pixel art of old Japanese temple elder standing peacefully, facing LEFT. Oversized chibi bald head, calm serene expression, white and green traditional temple robes, prayer bead necklace, hands clasped gently. Wise and gentle presence. ${STYLE_CHAR}`],
  ['story_elder_concerned',    `Full body chibi pixel art of old Japanese temple elder looking worried, facing LEFT. Same bald head, white and green robes, prayer beads, hands clasped tightly together, brow furrowed with deep concern. Anxious and caring. ${STYLE_CHAR}`],

  // ═══ REDESIGNED SENSEI PORTRAIT ═══
  ['portrait_sensei_v2', `Close-up face portrait of wise old Japanese sensei. Oversized chibi head, long flowing white beard, deep kind wise eyes with warmth, tall golden ornate hat with decorative kanji symbol, weathered but warm face, dark navy robes visible at neck. Distinguished noble teacher. ${STYLE_CHAR}`],

  // ═══ PLAYER REFRESH — TinySenpai (massive straw kasa hat, narrow eyes, black ninja outfit, red sash, katana) ═══
  ['player_idle',    `Tiny samurai ronin standing in relaxed idle pose. Massive wide-brimmed golden-brown woven straw kasa hat (wider than body), narrow eyes barely visible under hat brim, black/dark gray ninja outfit, bright red sash/belt at waist, katana with white blade at hip, small skin-tone hands. Compact stocky chibi proportions. Facing left. ${STYLE_CHAR}`],
  ['player_run1',    `Tiny samurai ronin running, left foot forward mid-stride. Same massive kasa hat, red sash, black outfit, katana. Dynamic forward lean. Facing left. ${STYLE_CHAR}`],
  ['player_run2',    `Tiny samurai ronin running, right foot forward mid-stride. Same massive kasa hat, red sash, black outfit, katana. Matching stride with run1. Facing left. ${STYLE_CHAR}`],
  ['player_run3',    `Tiny samurai ronin running, similar to run1 but slightly different arm position. Same massive kasa hat, red sash, black outfit. Facing left. ${STYLE_CHAR}`],
  ['player_run4',    `Tiny samurai ronin running, similar to run2 but slightly different arm position. Same massive kasa hat, red sash, black outfit. Facing left. ${STYLE_CHAR}`],
  ['player_slash1',  `Tiny samurai ronin slashing horizontally from left to right, katana extended. Massive kasa hat, red sash, aggressive forward lean. Facing left. ${STYLE_CHAR}`],
  ['player_slash2',  `Tiny samurai ronin mid-upward slash, katana arcing upward. Massive kasa hat, red sash, powerful stance. Facing left. ${STYLE_CHAR}`],
  ['player_slash3',  `Tiny samurai ronin finishing heavy downward slash, katana swinging down with force. Massive kasa hat, red sash, wide planted stance. Facing left. ${STYLE_CHAR}`],
  ['player_slash4',  `Tiny samurai ronin in piercing thrust, katana pointed straight forward like a spear. Massive kasa hat, red sash, deep lunge. Facing left. ${STYLE_CHAR}`],
  ['player_jump1',   `Tiny samurai ronin jumping upward, knees tucked, ascending. Massive kasa hat, red sash, katana at side. Facing left. ${STYLE_CHAR}`],
  ['player_jump2',   `Tiny samurai ronin at peak of jump, arms slightly raised. Massive kasa hat, red sash. Facing left. ${STYLE_CHAR}`],
  ['player_fall',    `Tiny samurai ronin falling downward, legs and arms spread slightly. Massive kasa hat, red sash. Facing left. ${STYLE_CHAR}`],
  ['player_dash',    `Tiny samurai ronin dashing forward in burst of speed, body horizontal, motion blur trail. Massive kasa hat, red sash. Facing left. ${STYLE_CHAR}`],
  ['player_wallslide', `Tiny samurai ronin sliding down a wall, one hand touching wall, body against surface. Massive kasa hat, red sash. Facing left. ${STYLE_CHAR}`],
  ['player_crouch',  `Tiny samurai ronin crouching low to the ground, one knee down, body compact and low. Massive kasa hat pulled low covering eyes, red sash, katana ready. Stealthy sneaking pose. Facing left. ${STYLE_CHAR}`],
  ['player_death1',  `Tiny samurai ronin hit and recoiling, body arching backward in pain. Massive kasa hat flying up slightly, red sash, katana dropping. Facing left. ${STYLE_CHAR}`],
  ['player_death2',  `Tiny samurai ronin collapsed on ground, face down, defeated. Massive kasa hat fallen nearby, red sash, katana on ground. Facing left. ${STYLE_CHAR}`],

  // ═══ EDO CASTLE TOWN ENEMIES ═══

  // ── RONIN (wandering swordsman — tattered brown kimono, straw hat like player but different, single katana, world-weary posture) ──
  ['ronin_idle',     `Ronin swordsman standing idle, world-weary posture. Tattered brown kimono with frayed edges, smaller conical straw hat (different from player's wide kasa), stubbled chin visible, worn katana at hip, sandals. Tired but dangerous. Facing left. ${STYLE_CHAR}`],
  ['ronin_walk1',    `Ronin swordsman walking step 1, slow deliberate stride. Tattered brown kimono, conical straw hat, katana at side. Facing left. ${STYLE_CHAR}`],
  ['ronin_walk2',    `Ronin swordsman walking step 2, opposite foot forward. Tattered brown kimono, conical straw hat, katana at side. Facing left. ${STYLE_CHAR}`],
  ['ronin_alert',    `Ronin swordsman drawing katana, alert stance, hat brim shadowing eyes. Tattered brown kimono. Facing left. ${STYLE_CHAR}`],
  ['ronin_attack',   `Ronin swordsman mid-slash, fast horizontal cut. Tattered brown kimono, conical hat, katana extended. Facing left. ${STYLE_CHAR}`],
  ['ronin_dazed',    `Ronin swordsman stunned, leaning back dizzy. Tattered brown kimono, hat askew. Facing left. ${STYLE_CHAR}`],
  ['ronin_hit',      `Ronin swordsman recoiling from hit. Tattered brown kimono, pain expression. Facing left. ${STYLE_CHAR}`],
  ['ronin_kneel',    `Ronin swordsman kneeling defeated, head bowed. Tattered brown kimono, hat fallen. Facing left. ${STYLE_CHAR}`],
  ['ronin_dead',     `Ronin swordsman collapsed dead on ground. Tattered brown kimono, hat beside body. Facing left. ${STYLE_CHAR}`],
  ['ronin_kb_back',  `Ronin swordsman flying backward from heavy hit. Tattered brown kimono billowing. Facing left. ${STYLE_CHAR}`],
  ['ronin_kb_tumble',`Ronin swordsman tumbling on ground from impact. Tattered brown kimono, hat flying off. Facing left. ${STYLE_CHAR}`],
  ['ronin_kb_seated',`Ronin swordsman slumped sitting on ground defeated. Tattered brown kimono. Facing left. ${STYLE_CHAR}`],

  // ── CYBER NINJA (sleek black bodysuit, neon blue circuit line patterns, energy katana, glowing visor) ──
  ['cyber_ninja_idle',     `Cyber ninja standing in ready stance. Sleek black bodysuit with glowing neon blue circuit line patterns, dark visor with blue glow, energy katana at side humming with light. Futuristic but clearly ninja. Facing left. ${STYLE_CHAR}`],
  ['cyber_ninja_walk1',    `Cyber ninja walking step 1, smooth silent stride. Black bodysuit, neon blue circuits, energy katana. Facing left. ${STYLE_CHAR}`],
  ['cyber_ninja_walk2',    `Cyber ninja walking step 2. Black bodysuit, neon blue circuits. Facing left. ${STYLE_CHAR}`],
  ['cyber_ninja_alert',    `Cyber ninja activating, visor flashing bright, circuits pulsing. Black bodysuit, energy katana drawn. Facing left. ${STYLE_CHAR}`],
  ['cyber_ninja_attack',   `Cyber ninja mid-teleport-slash, body blurring with afterimage trail, energy katana swinging. Black bodysuit, neon blue circuits blazing. Facing left. ${STYLE_CHAR}`],
  ['cyber_ninja_dazed',    `Cyber ninja stunned, circuits flickering, sparks flying from suit. Facing left. ${STYLE_CHAR}`],
  ['cyber_ninja_hit',      `Cyber ninja recoiling from hit, circuit lines disrupted. Facing left. ${STYLE_CHAR}`],
  ['cyber_ninja_kneel',    `Cyber ninja kneeling, system failure, circuits dimming. Facing left. ${STYLE_CHAR}`],
  ['cyber_ninja_dead',     `Cyber ninja collapsed, all circuits dark, energy katana deactivated. Facing left. ${STYLE_CHAR}`],
  ['cyber_ninja_kb_back',  `Cyber ninja flying backward, sparks and circuit fragments trailing. Facing left. ${STYLE_CHAR}`],
  ['cyber_ninja_kb_tumble',`Cyber ninja tumbling, bodysuit cracking. Facing left. ${STYLE_CHAR}`],
  ['cyber_ninja_kb_seated',`Cyber ninja slumped sitting, circuits pulsing weakly. Facing left. ${STYLE_CHAR}`],

  // ── BOUNCER (massive build, black suit, sunglasses, brass knuckles — nightclub enforcer) ──
  ['bouncer_idle',     `Massive nightclub bouncer standing arms crossed. Black suit stretching over huge muscular body, dark sunglasses, brass knuckles on both fists, earpiece, intimidating scowl. Facing left. ${STYLE_CHAR}`],
  ['bouncer_walk1',    `Bouncer walking step 1, heavy deliberate stride. Black suit, sunglasses, brass knuckles. Facing left. ${STYLE_CHAR}`],
  ['bouncer_walk2',    `Bouncer walking step 2. Black suit, sunglasses. Facing left. ${STYLE_CHAR}`],
  ['bouncer_alert',    `Bouncer cracking knuckles, removing sunglasses, aggressive stance. Black suit. Facing left. ${STYLE_CHAR}`],
  ['bouncer_attack',   `Bouncer throwing massive haymaker punch, brass knuckles gleaming. Black suit. Facing left. ${STYLE_CHAR}`],
  ['bouncer_charge',   `Bouncer charging forward like a bull, shoulder down, ground-shaking. Black suit. Facing left. ${STYLE_CHAR}`],
  ['bouncer_dazed',    `Bouncer stunned, swaying, sunglasses cracked. Black suit. Facing left. ${STYLE_CHAR}`],
  ['bouncer_hit',      `Bouncer flinching from hit, surprised. Black suit. Facing left. ${STYLE_CHAR}`],
  ['bouncer_kneel',    `Bouncer kneeling defeated, one knee down. Black suit torn. Facing left. ${STYLE_CHAR}`],
  ['bouncer_dead',     `Bouncer collapsed on ground, sunglasses fallen. Black suit. Facing left. ${STYLE_CHAR}`],
  ['bouncer_kb_back',  `Bouncer flying backward from powerful hit. Black suit. Facing left. ${STYLE_CHAR}`],
  ['bouncer_kb_seated',`Bouncer slumped sitting against wall. Black suit. Facing left. ${STYLE_CHAR}`],

  // ── MONK GUARDIAN (orange robes, shaved head, bo staff — temple protector) ──
  ['monk_idle',     `Monk guardian standing peacefully with bo staff. Shaved bald head, serene expression, flowing orange Buddhist robes, wooden bo staff held vertically, prayer beads on wrist. Facing left. ${STYLE_CHAR}`],
  ['monk_walk1',    `Monk guardian walking calmly step 1. Orange robes, bo staff, bald head. Facing left. ${STYLE_CHAR}`],
  ['monk_walk2',    `Monk guardian walking step 2. Orange robes, bo staff. Facing left. ${STYLE_CHAR}`],
  ['monk_alert',    `Monk guardian shifting to defensive martial arts stance, bo staff horizontal ready to block. Orange robes, focused expression. Facing left. ${STYLE_CHAR}`],
  ['monk_attack',   `Monk guardian striking with bo staff, sweeping horizontal strike. Orange robes flowing with motion. Facing left. ${STYLE_CHAR}`],
  ['monk_block',    `Monk guardian blocking with bo staff held across body, planted wide stance. Orange robes. Facing left. ${STYLE_CHAR}`],
  ['monk_dazed',    `Monk guardian stunned, off balance. Orange robes, bo staff drooping. Facing left. ${STYLE_CHAR}`],
  ['monk_hit',      `Monk guardian recoiling from hit. Orange robes. Facing left. ${STYLE_CHAR}`],
  ['monk_kneel',    `Monk guardian kneeling in meditation pose, defeated peacefully. Orange robes. Facing left. ${STYLE_CHAR}`],
  ['monk_dead',     `Monk guardian collapsed, bo staff broken beside. Orange robes. Facing left. ${STYLE_CHAR}`],
  ['monk_kb_back',  `Monk guardian flying backward from hit. Orange robes billowing. Facing left. ${STYLE_CHAR}`],
  ['monk_kb_seated',`Monk guardian sitting in meditation pose on ground. Orange robes. Facing left. ${STYLE_CHAR}`],

  // ── SPIRIT FOX (ethereal white fox, multiple tails, ghostly translucent glow) ──
  ['spirit_fox_idle',  `Ethereal spirit fox sitting regally. White-blue translucent ghostly body, multiple flowing tails (3-5), glowing golden eyes, soft light aura, ancient wise expression. Mystical Japanese kitsune. Facing left. ${STYLE_CHAR}`],
  ['spirit_fox_alert', `Spirit fox standing alert, tails fanned out, golden eyes blazing. White-blue translucent ghostly body, defensive pose. Facing left. ${STYLE_CHAR}`],
  ['spirit_fox_attack',`Spirit fox lunging with spiritual fire, tails streaking behind. White-blue body, golden eyes, supernatural energy. Facing left. ${STYLE_CHAR}`],
  ['spirit_fox_dazed', `Spirit fox flickering, partially transparent, stunned. Tails drooping. Facing left. ${STYLE_CHAR}`],
  ['spirit_fox_hit',   `Spirit fox recoiling, body briefly fragmenting into particles. Facing left. ${STYLE_CHAR}`],
  ['spirit_fox_dead',  `Spirit fox dissolving into floating light particles, fading peacefully. Facing left. ${STYLE_CHAR}`],

  // ── CURSED RONIN (dark mirror of TinySenpai — same kasa hat but ink-black, red glowing mark on arm, dark aura) ──
  ['cursed_ronin_idle',     `Dark mirror of TinySenpai standing menacingly. Same massive wide-brimmed kasa hat but completely ink-BLACK with dark purple edges, glowing red eyes under brim, all-black ninja outfit with red ink marks spreading across body, dark red sash, cursed katana with dark blade. Dark aura wisps. Evil twin. Facing left. ${STYLE_CHAR}`],
  ['cursed_ronin_walk1',    `Cursed dark TinySenpai walking step 1. Ink-black kasa hat, glowing red eyes, black outfit with red curse marks. Dark aura trail. Facing left. ${STYLE_CHAR}`],
  ['cursed_ronin_walk2',    `Cursed dark TinySenpai walking step 2. Ink-black kasa hat, red eyes, curse marks. Facing left. ${STYLE_CHAR}`],
  ['cursed_ronin_alert',    `Cursed dark TinySenpai drawing cursed katana, red eyes flaring bright. Ink-black hat, dark aura intensifying. Facing left. ${STYLE_CHAR}`],
  ['cursed_ronin_attack',   `Cursed dark TinySenpai mid-slash with dark energy trailing from blade. Ink-black hat, red curse marks glowing. Facing left. ${STYLE_CHAR}`],
  ['cursed_ronin_dash',     `Cursed dark TinySenpai dashing forward, body trailing dark afterimages. Ink-black hat, red aura. Facing left. ${STYLE_CHAR}`],
  ['cursed_ronin_dazed',    `Cursed dark TinySenpai stunned, curse marks flickering. Ink-black hat, red eyes dimming. Facing left. ${STYLE_CHAR}`],
  ['cursed_ronin_hit',      `Cursed dark TinySenpai recoiling, curse marks cracking. Ink-black hat. Facing left. ${STYLE_CHAR}`],
  ['cursed_ronin_kneel',    `Cursed dark TinySenpai kneeling, curse marks fading, showing glimpse of the person beneath. Ink-black hat. Facing left. ${STYLE_CHAR}`],
  ['cursed_ronin_dead',     `Cursed dark TinySenpai collapsed, curse dissolving off body, hat fading from black back toward golden-brown. Redemption in defeat. Facing left. ${STYLE_CHAR}`],
  ['cursed_ronin_kb_back',  `Cursed dark TinySenpai flying backward, dark energy scattering. Ink-black hat. Facing left. ${STYLE_CHAR}`],
  ['cursed_ronin_kb_seated',`Cursed dark TinySenpai slumped sitting, curse marks receding. Facing left. ${STYLE_CHAR}`],

  // ═══ NEW STORY CHARACTER SPRITES ═══

  // Kunoichi — female ninja ally, practical dark outfit, red hair ribbon, confident smirk
  ['story_kunoichi_idle',    `Full body chibi pixel art of female kunoichi ninja standing confidently, facing LEFT. Dark practical ninja outfit, visible red hair ribbon, short dark hair, confident smirk, kunai knife in hand, utility belt with pouches. Capable and sharp. ${STYLE_CHAR}`],
  ['story_kunoichi_smirk',   `Full body chibi pixel art of kunoichi with mischievous knowing smirk, facing LEFT. Same dark outfit, red hair ribbon, hand on hip, slight lean. Playful intelligence. ${STYLE_CHAR}`],
  ['story_kunoichi_serious', `Full body chibi pixel art of kunoichi in serious focused pose, facing LEFT. Same dark outfit, red hair ribbon, arms crossed, stern expression. All business. ${STYLE_CHAR}`],

  // Lord Katsura — Edo lord, ornate dark kimono with gold patterns, topknot, authoritative
  ['story_katsura_idle',   `Full body chibi pixel art of Japanese feudal lord standing regally, facing LEFT. Ornate dark navy kimono with gold phoenix pattern, traditional topknot hairstyle, sharp calculating eyes, hand on katana hilt, tall proud posture. Power and authority. ${STYLE_CHAR}`],
  ['story_katsura_angry',  `Full body chibi pixel art of feudal lord in fury, facing LEFT. Same ornate kimono, topknot, eyes blazing with anger, hand gripping katana, aggressive forward lean. Outraged. ${STYLE_CHAR}`],

  // Hacker — cyberpunk tech expert, hoodie with circuit patterns, glowing visor/glasses, tablet
  ['story_hacker_idle',    `Full body chibi pixel art of cyberpunk hacker standing casually, facing LEFT. Dark hoodie with glowing green circuit patterns, futuristic glowing green visor/glasses, holding holographic tablet, messy dark hair, relaxed slouching posture, sneakers. Tech-savvy rebel. ${STYLE_CHAR}`],

  // Fox Spirit — ethereal white fox in humanoid form, flowing white robes, golden eyes, multiple tail hints
  ['story_fox_idle',       `Full body chibi pixel art of ethereal fox spirit in semi-humanoid form, facing LEFT. Flowing white-blue translucent robes, golden glowing eyes, fox ears atop head, multiple ghostly tail wisps behind, prayer beads, gentle wise expression. Ancient divine being. ${STYLE_CHAR}`],

  // Shadow special poses for epilogue
  ['story_shadow_defeated', `Full body chibi pixel art of shadow ninja kneeling in defeat, curse marks visibly fading from body, facing LEFT. Dark purple cloth unwinding slightly to reveal exhausted face beneath, scarf tails limp, purple eye glow dimming to normal human eyes. Vulnerable. ${STYLE_CHAR}`],
  ['story_shadow_human',    `Full body chibi pixel art of shadow ninja REDEEMED — standing calmly without curse, facing LEFT. Purple cloth still wrapping head but looser, showing calm normal eyes (not glowing), clean arm without ink marks, relaxed peaceful posture, scarf tails gentle. The person behind the curse. ${STYLE_CHAR}`],

  // Player examining arm — solo story scene
  ['story_player_arm',     `Full body chibi pixel art of TinySenpai looking at glowing mark on forearm, facing RIGHT. Same massive kasa hat, red sash, black outfit, but holding out left arm and staring at it with concern, faint red-purple glow on forearm. Worried discovery. ${STYLE_CHAR}`],

  // ═══ NPC WALK SPRITES (for in-world story encounters) ═══
  // Sensei walking
  ['story_sensei_walk1',   `Full body chibi pixel art of wise old Japanese sensei walking, left foot forward, facing LEFT. Same golden hat, white beard, dark robes, wooden staff used as walking stick. Calm deliberate stride. ${STYLE_CHAR}`],
  ['story_sensei_walk2',   `Full body chibi pixel art of wise old Japanese sensei walking, right foot forward, facing LEFT. Same golden hat, white beard, dark robes, wooden staff forward. Matching stride with walk1. ${STYLE_CHAR}`],
  // Shadow walking
  ['story_shadow_walk1',   `Full body chibi pixel art of shadow ninja walking stealthily, left foot forward, facing LEFT. Same dark purple-black wrapped head, glowing purple eyes, scarf tails flowing behind, dark outfit. Silent predatory stride. ${STYLE_CHAR}`],
  ['story_shadow_walk2',   `Full body chibi pixel art of shadow ninja walking stealthily, right foot forward, facing LEFT. Same wrapped head, purple eyes, scarf tails. Matching stride. ${STYLE_CHAR}`],
  // Elder walking
  ['story_elder_walk1',    `Full body chibi pixel art of old temple elder walking slowly, left foot forward, facing LEFT. Same bald head, white and green robes, prayer beads. Gentle measured pace. ${STYLE_CHAR}`],
  ['story_elder_walk2',    `Full body chibi pixel art of old temple elder walking slowly, right foot forward, facing LEFT. Same bald head, robes. Matching stride. ${STYLE_CHAR}`],
  // Kunoichi walking
  ['story_kunoichi_walk1', `Full body chibi pixel art of female kunoichi ninja walking confidently, left foot forward, facing LEFT. Same dark outfit, red hair ribbon, kunai at side. Swift purposeful stride. ${STYLE_CHAR}`],
  ['story_kunoichi_walk2', `Full body chibi pixel art of female kunoichi ninja walking, right foot forward, facing LEFT. Same dark outfit, red hair ribbon. Matching stride. ${STYLE_CHAR}`],
  // Hacker walking
  ['story_hacker_walk1',   `Full body chibi pixel art of cyberpunk hacker walking casually, left foot forward, facing LEFT. Same dark hoodie with green circuits, glowing visor, tablet tucked under arm. Relaxed amble. ${STYLE_CHAR}`],
  ['story_hacker_walk2',   `Full body chibi pixel art of cyberpunk hacker walking, right foot forward, facing LEFT. Same hoodie, visor. Matching stride. ${STYLE_CHAR}`],

  // ═══ NEW ZONE BACKGROUNDS ═══

  // Edo Castle Town
  ['bg_edo_story',       `Wide pixel art background of an Edo period Japanese castle town at dusk. Wooden merchant buildings with tile roofs lining a narrow street, paper lanterns hanging between buildings casting warm amber glow, stone castle wall visible in background, cherry blossom petals falling. Warm golden hour lighting. ${STYLE_BG} Aspect ratio 16:9.`],
  ['bg_edo_far',         `Very wide pixel art distant background layer: Edo castle silhouette on hilltop, mountains beyond, orange-pink sunset sky. Simple shapes, muted warm colors. For parallax scrolling. ${STYLE_BG} Aspect ratio wider than 3:1.`],
  ['bg_edo_mid',         `Very wide pixel art mid-ground layer: Edo wooden building rooftops and tile roofs, wooden fences, stone walls, warm lantern glows from windows. More detail than far layer. For parallax scrolling. Semi-transparent gaps (no ground). ${STYLE_BG} Aspect ratio wider than 3:1.`],
  ['bg_edo_near',        `Very wide pixel art near-ground layer: Cherry blossom branches, wooden market stall roofs, hanging cloth banners with kanji. Close-up foreground elements. For parallax scrolling. Semi-transparent. ${STYLE_BG} Aspect ratio wider than 3:1.`],

  // Neon Tokyo
  ['bg_neon_story',      `Wide pixel art background of rain-soaked cyberpunk Tokyo alley at night. Neon signs in Japanese (カラオケ, 居酒屋, etc.) in hot pink, cyan, and purple reflecting off wet pavement. Vending machines glowing, steam rising from grates, overhead cables and pipes. Blade Runner meets pixel art. ${STYLE_BG} Aspect ratio 16:9.`],
  ['bg_neon_far',        `Very wide pixel art distant background layer: futuristic Tokyo skyline with massive towers, holographic billboards, dark sky with neon glow on clouds. Muted purples and blues. For parallax scrolling. ${STYLE_BG} Aspect ratio wider than 3:1.`],
  ['bg_neon_mid',        `Very wide pixel art mid-ground layer: Neon signs in Japanese kanji, mid-rise buildings with glowing windows, rain streaks, steam vents. Hot pink and cyan neon colors. For parallax scrolling. ${STYLE_BG} Aspect ratio wider than 3:1.`],
  ['bg_neon_near',       `Very wide pixel art near-ground layer: Wet pavement reflections, vending machines, neon puddles, street-level signs. Close foreground detail. For parallax scrolling. Semi-transparent. ${STYLE_BG} Aspect ratio wider than 3:1.`],

  // Nightclub / Underground
  ['bg_nightclub_story', `Wide pixel art background of dark underground nightclub interior. Purple and magenta laser beams cutting through haze, massive speaker stacks, DJ booth with turntables silhouetted, dance floor with geometric neon patterns, strobe light effects. Dark and pulsing energy. ${STYLE_BG} Aspect ratio 16:9.`],
  ['bg_nightclub_far',   `Very wide pixel art distant background layer: Dark void with purple laser grid lines receding into distance, faint strobe flashes. Minimal detail, very dark. For parallax scrolling. ${STYLE_BG} Aspect ratio wider than 3:1.`],
  ['bg_nightclub_mid',   `Very wide pixel art mid-ground layer: Speaker stacks, DJ equipment silhouettes, purple neon tube lights, ceiling infrastructure. For parallax scrolling. ${STYLE_BG} Aspect ratio wider than 3:1.`],

  // Spirit Realm
  ['bg_spirit_story',    `Wide pixel art background of ethereal Japanese spirit realm. Floating shrine torii gates in misty void, massive cherry blossom tree raining pink petals, aurora-like lights in sky, translucent ghostly shrine buildings, soft purple-blue color palette with warm golden accents. Otherworldly and beautiful. ${STYLE_BG} Aspect ratio 16:9.`],
  ['bg_spirit_far',      `Very wide pixel art distant background layer: starfield with aurora borealis in purple and blue, floating shrine silhouettes in distance. Ethereal and vast. For parallax scrolling. ${STYLE_BG} Aspect ratio wider than 3:1.`],
  ['bg_spirit_mid',      `Very wide pixel art mid-ground layer: Floating torii gates, drifting shrine platforms, cherry blossom branches. Purple and golden mist. For parallax scrolling. ${STYLE_BG} Aspect ratio wider than 3:1.`],
  ['bg_spirit_near',     `Very wide pixel art near-ground layer: Dense cherry blossom petal storm, floating lanterns, ethereal mist tendrils. Close foreground elements. For parallax scrolling. Semi-transparent. ${STYLE_BG} Aspect ratio wider than 3:1.`],

  // Portraits for new characters
  ['portrait_kunoichi',  `Close-up face portrait of female kunoichi ninja. Oversized chibi head, short dark hair with red ribbon, confident sharp eyes, slight smirk, dark ninja collar visible. ${STYLE_CHAR}`],
  ['portrait_katsura',   `Close-up face portrait of Japanese feudal lord. Oversized chibi head, traditional topknot hairstyle, sharp calculating eyes, thin stern mouth, ornate gold-trimmed dark collar. ${STYLE_CHAR}`],
  ['portrait_hacker',    `Close-up face portrait of cyberpunk hacker. Oversized chibi head, messy dark hair, glowing green visor/glasses, slight grin, hoodie collar with circuit patterns. ${STYLE_CHAR}`],
  ['portrait_fox',       `Close-up face portrait of ethereal fox spirit. Oversized chibi head, white-blue translucent fur, golden glowing eyes, fox ears, gentle wise expression, soft light aura. ${STYLE_CHAR}`],
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

// ═══ SELF-REFERENCING: for non-idle poses, use that character's own idle as primary reference ═══
// This ensures all poses of the same character look consistent.
function getCharacterPrefix(name) {
  // Extract character type prefix: "ronin_walk1" → "ronin", "cyber_ninja_idle" → "cyber_ninja"
  // Story sprites: "story_kunoichi_smirk" → "story_kunoichi"
  // Player: "player_run1" → "player"
  const prefixes = [
    'story_kunoichi', 'story_katsura', 'story_hacker', 'story_fox',
    'story_shadow', 'story_sensei', 'story_elder', 'story_player',
    'cyber_ninja', 'spirit_fox', 'cursed_ronin',
    'player', 'ronin', 'bouncer', 'monk',
  ];
  for (const p of prefixes) {
    if (name.startsWith(p + '_')) return p;
  }
  return null;
}

function getSelfReference(name) {
  const prefix = getCharacterPrefix(name);
  if (!prefix) return null;
  // Don't self-reference if this IS the idle sprite
  const idleName = `${prefix}_idle`;
  if (name === idleName) return null;
  // Try to load the idle sprite for this character
  return loadRefImage(join(OUT, `${idleName}.png`));
}

async function generateSprite(name, prompt) {
  const path = join(OUT, `${name}.png`);
  if (existsSync(path)) { console.log(`  ${name}: exists`); return; }
  process.stdout.write(`  ${name}: generating...`);

  // Build request parts with self-referencing
  const isCharSprite = name.startsWith('story_') || name.startsWith('portrait_');
  const isBgSprite = name.startsWith('bg_');
  const selfRef = getSelfReference(name); // THIS character's idle sprite
  const parts = [];

  if (selfRef) {
    // ── SELF-REFERENCE MODE: use character's own idle as PRIMARY reference ──
    // This is the key to style consistency across poses
    parts.push({ text: 'Here is the IDLE pose of this EXACT character. Generate a NEW pose of this SAME character — same colors, same proportions, same outfit, same accessories, same art style. The character must look IDENTICAL except for the pose change:' });
    parts.push(selfRef);
    // Also include game style references for overall art style
    if (REF_PLAYER) {
      parts.push({ text: 'Here is another character from the same game for art style reference (chibi pixel art, chunky outlines, oversized head):' });
      parts.push(REF_PLAYER);
    }
    parts.push({ text: `Now generate the NEW POSE of the character shown in the first reference. ${prompt}` });
  } else if (isCharSprite) {
    // Story characters + portraits: use player, oni, ninja as style references
    parts.push({ text: 'Here are reference images showing the EXACT pixel art style of my game. ALL new sprites must match this style precisely — same chibi proportions (oversized head ~40-50% of body), same chunky black outlines, same pixel density, same color saturation, same level of detail:' });
    if (REF_PLAYER) parts.push(REF_PLAYER);
    if (REF_ONI) { parts.push({ text: 'Reference 2 — oni enemy:' }); parts.push(REF_ONI); }
    if (REF_NINJA) { parts.push({ text: 'Reference 3 — ninja enemy:' }); parts.push(REF_NINJA); }
    parts.push({ text: `Now generate a NEW character sprite in the EXACT SAME chibi pixel art style. ${prompt}` });
  } else if (isBgSprite) {
    // Backgrounds: use forest as style reference
    parts.push({ text: 'Here is a reference background from my pixel art game. Match this moody atmospheric pixel art style — same level of detail, same dark palette approach, same pixel rendering:' });
    if (REF_FOREST) parts.push(REF_FOREST);
    if (REF_PLAYER) { parts.push({ text: 'Character for scale/style context:' }); parts.push(REF_PLAYER); }
    parts.push({ text: `Now generate a NEW background in the same pixel art style. ${prompt}` });
  } else {
    // Enemy idle sprites (first generation) — use existing game enemies as style reference
    const refs = [REF_ONI, REF_NINJA, REF_PLAYER].filter(Boolean);
    if (refs.length > 0) {
      parts.push({ text: 'Here are reference sprites from my game. Match this EXACT chibi pixel art style — oversized heads, chunky black outlines, rich saturated colors, ~32x32 pixel detail rendered as 1024x1024:' });
      refs.forEach(r => parts.push(r));
      parts.push({ text: `Now generate a NEW enemy sprite in the EXACT SAME style. ${prompt}` });
    } else {
      parts.push({ text: `Generate a game sprite. ${prompt}` });
    }
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
  console.log(`References loaded: player=${!!REF_PLAYER} oni=${!!REF_ONI} ninja=${!!REF_NINJA} forest=${!!REF_FOREST}\n`);

  // ── 2-PASS GENERATION for style consistency ──
  // Pass 1: Generate all _idle sprites FIRST (these become references for other poses)
  // Pass 2: Generate all non-idle sprites (using their character's idle as reference)

  const idleSprites = SPRITES.filter(([name]) => name.endsWith('_idle'));
  const nonIdleSprites = SPRITES.filter(([name]) => !name.endsWith('_idle'));

  console.log(`=== PASS 1: ${idleSprites.length} idle/hero sprites (style anchors) ===\n`);
  for (const [name, prompt] of idleSprites) {
    await generateSprite(name, prompt);
  }

  console.log(`\n=== PASS 2: ${nonIdleSprites.length} pose variants (self-referenced) ===\n`);
  for (const [name, prompt] of nonIdleSprites) {
    await generateSprite(name, prompt);
  }

  console.log('\nDone!\n');
}

main().catch(e => { console.error(e.message); process.exit(1); });
