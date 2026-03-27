#!/usr/bin/env node
/**
 * Generate game SFX + music using ElevenLabs Sound Effects API.
 * Run: ELEVENLABS_API_KEY=your_key node scripts/generate-game-sfx.mjs
 *
 * Delete any file in public/audio/game/ to regenerate just that one.
 */
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, '..', 'public', 'audio', 'game');
mkdirSync(OUT, { recursive: true });

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) { console.error('Set ELEVENLABS_API_KEY env var'); process.exit(1); }

// ═══ COMPLETE AUDIO DESIGN ═══
// Style: dark feudal Japanese action — Katana Zero meets Sekiro
// Every sound should feel weighty, satisfying, and thematic.

const SOUNDS = [
  // ────── COMBAT ──────
  ['slash1',        'Sharp fast katana blade cutting through air, quick steel swoosh, Japanese sword slash, game sfx', 0.6, 0.5],
  ['slash2',        'Powerful upward katana arc with metallic ring, aggressive sword swing, heavier slash, game sfx', 0.7, 0.5],
  ['slash3',        'Massive heavy katana strike with electric crackle, thunderous final blow, devastating sword slash, game sfx', 1.0, 0.5],
  ['kill',          'Violent katana cutting through flesh, wet blood slash with heavy meaty impact, brutal sword kill, game sfx', 0.8, 0.6],
  ['blood_splatter','Wet blood splatter on ground, gore splash dripping, violent aftermath, game sfx', 0.7, 0.5],
  ['clash',         'Two katana blades clashing violently, sharp metal on metal ring with sparks, sword parry, game sfx', 0.8, 0.6],
  ['deflect',       'Quick metallic sword deflection ping, blade redirecting projectile, sharp ring, game sfx', 0.5, 0.5],

  // ────── MOVEMENT ──────
  ['jump',          'Quick ninja leap, soft fabric whoosh upward, light agile movement burst, game sfx', 0.5, 0.4],
  ['land',          'Ninja landing on wooden rooftop, soft controlled impact with slight creak, game sfx', 0.5, 0.4],
  ['dash',          'Fast ninja dash burst, rushing wind displacement, quick teleport whoosh, game sfx', 0.5, 0.5],
  ['wallSlide',     'Body scraping down rough stone wall, friction slide with fabric rustle, game sfx', 0.8, 0.4],
  ['footstep',      'Quick wooden geta sandal clack on stone, single fast running step, Japanese warrior, game sfx', 0.5, 0.3],

  // ────── ENEMIES: ONI (DEMON) ──────
  ['oni_alert',     'Deep guttural demon growl, angry beast spotting prey, dark menacing rumble, game monster sfx', 0.8, 0.5],
  ['oni_attack',    'Fierce demon battle roar, heavy beast lunging attack cry, aggressive, game monster sfx', 0.7, 0.6],
  ['oni_death',     'Demon death howl, beast collapsing with fading groan, dark creature dying, game sfx', 1.0, 0.5],

  // ────── ENEMIES: NINJA ──────
  ['ninja_alert',   'Sharp menacing ninja breath, quiet deadly whisper, stealthy threat, game sfx', 0.6, 0.4],
  ['ninja_throw',   'Ninja shuriken throw with sharp exhale, spinning metal release, game sfx', 0.6, 0.5],
  ['ninja_death',   'Quick ninja death gasp, sharp final exhale, falling body, game sfx', 0.7, 0.4],

  // ────── ENEMIES: SAMURAI ──────
  ['samurai_alert', 'Japanese samurai war cry kiai, commanding warrior battle shout, honorable challenge, game sfx', 0.8, 0.5],
  ['samurai_attack','Fierce samurai kiai strike yell, powerful focused attack shout with sword, game sfx', 0.6, 0.6],
  ['samurai_death', 'Samurai death groan, warrior falling with honor, heavy armor impact, game sfx', 1.0, 0.5],

  // ────── PROJECTILES ──────
  ['shuriken',      'Spinning shuriken blade whistling through air, metal star flying fast, game sfx', 0.7, 0.5],

  // ────── UI / STATE ──────
  ['slowmoOn',      'Deep dramatic time freeze, world slowing to crawl, bass drop with reverb, game slow motion sfx', 0.8, 0.5],
  ['slowmoOff',     'Time snapping back to speed, quick whoosh resume from slow motion, game sfx', 0.5, 0.5],
  ['roomClear',     'Triumphant Japanese victory fanfare, short taiko drum hit with koto chime, room cleared, game sfx', 1.5, 0.5],
  ['comboMilestone','Satisfying combo achievement chime, bright rewarding ping with resonance, game sfx', 0.5, 0.4],
  ['menuStart',     'Dramatic katana unsheathing from scabbard, steel sliding on wood, game start, intense, game sfx', 1.5, 0.6],
  ['death',         'Player death impact, painful hit with dark descending tone, defeat, game sfx', 1.0, 0.5],

  // ────── BREAKABLE OBJECTS ──────
  ['crate_break',   'Wooden crate smashing apart, wood splintering crack, boards breaking, game sfx', 0.6, 0.5],
  ['pot_break',     'Ceramic pot shattering on stone, clay pieces scattering, pottery breaking, game sfx', 0.5, 0.5],
  ['lantern_break', 'Paper lantern tearing and catching fire, fire whoosh burst, Japanese lantern destruction, game sfx', 0.7, 0.5],
  ['bamboo_break',  'Bamboo screen cracking and splitting apart, thin wood snapping, game sfx', 0.5, 0.4],

  // ────── DEATH & TRANSITIONS ──────
  ['death_dramatic', 'Deep dramatic bass impact with reverb, cinematic death hit, world stopping heavy blow, dark, game sfx', 1.5, 0.6],
  ['brush_wipe',    'Ink brush swooshing across paper, wet calligraphy stroke sound, Japanese brush painting, game transition sfx', 0.8, 0.5],

  // ────── WAVE / ENCOUNTER ──────
  ['wave_incoming', 'Ominous taiko war drum hit, deep reverberating warning drum, enemies approaching, game sfx', 1.5, 0.5],
  ['encounter',     'Soft dramatic string hit, tense moment start, subtle violin sting, game dialogue sfx', 0.8, 0.4],
  ['text_type',     'Very soft keyboard key click, subtle typing sound, minimal, game text sfx', 0.2, 0.3],

  // ────── STORY / CHOICE UI ──────
  ['sfx_choice_appear', 'Soft elegant whoosh, menu appearing, gentle slide in sound, Japanese ink brush sweep, game ui sfx', 0.5, 0.4],
  ['sfx_choice_select', 'Satisfying click chime, selection confirmed, bright warm resonant ping, game menu selection sfx', 0.4, 0.5],
  ['sfx_choice_tick',   'Subtle clock tick, soft tension timer, quiet countdown beat, game timer sfx', 0.3, 0.3],
  ['sfx_text_advance',  'Very soft page turn, paper sliding sound, gentle parchment flip, minimal, game dialogue advance sfx', 0.4, 0.3],
  ['sfx_combo4_pierce', 'Deep powerful piercing thrust impact, heavy spear-like stab through multiple targets, bass-heavy penetrating blow with metallic ring, game sfx', 0.8, 0.6],

  // ────── STEALTH ──────
  ['stealth_kill',      'Quiet satisfying blade insertion, muffled stab, clean silent assassination, no scream, game stealth kill sfx', 0.6, 0.5],
  ['detection_suspicious', 'Subtle warning chime, enemy becoming suspicious, soft questioning alert, game stealth sfx', 0.5, 0.4],
  ['detection_alert',   'Sharp alarm sting, enemy fully alert, aggressive detection sound with urgency, game stealth sfx', 0.5, 0.6],

  // ────── NEW HAZARDS ──────
  ['laser_hum',         'Electric laser beam continuous hum, sci-fi security laser drone, tense high-frequency buzz, game hazard sfx', 1.0, 0.4],
  ['electric_zap',      'Electric floor zap discharge, crackling voltage burst, shocking impact, game hazard sfx', 0.5, 0.5],

  // ────── NEW ENEMIES ──────
  ['cyber_teleport',    'Electronic digital teleport zap, short-range warp displacement, cyberpunk ninja dash, game sfx', 0.4, 0.5],
  ['pistol_shot',       'Single pistol gunshot, sharp crack, yakuza enforcer firearm, game sfx', 0.4, 0.6],
  ['drone_hover',       'Small electronic drone hovering buzz, futuristic surveillance drone motor, game sfx', 1.0, 0.4],
  ['drone_laser',       'Focused laser beam firing, thin high-energy beam weapon, sci-fi drone attack, game sfx', 0.6, 0.5],
  ['bouncer_slam',      'Massive heavy fist slam impact, ground-shaking punch, bass-heavy body blow, game sfx', 0.6, 0.6],
  ['shockwave_bass',    'Deep bass shockwave expanding, DJ speaker blast AOE attack, rumbling sub-bass explosion, game sfx', 1.0, 0.6],
  ['smoke_bomb',        'Ninja smoke bomb poof, muffled explosion with hissing smoke, concealment cloud, game sfx', 0.6, 0.4],
  ['staff_strike',      'Wooden bo staff striking, clean wooden impact, monk martial arts weapon hit, game sfx', 0.5, 0.5],
  ['fox_cry',           'Ethereal mystical fox spirit cry, supernatural kitsune howl, otherworldly and beautiful, game sfx', 1.0, 0.5],
  ['illusion_pop',      'Magical illusion clone disappearing poof, spirit dissolving into particles, game sfx', 0.4, 0.4],
  ['time_rift',         'Deep reality-tearing warp, dimensional rift opening, spacetime distortion bass rumble, game transition sfx', 1.5, 0.6],
];

const LOOPS = [
  // ────── AMBIENT (continuous background layers) ──────
  ['rain_loop',     'Steady rain falling on wooden Japanese rooftops and stone paths, gentle but present, no thunder, nature ambience', 10, 0.4, true],
  ['forest_night',  'Dark Japanese forest at night, wind through bamboo, distant owl, rustling leaves, mysterious atmosphere, no music', 10, 0.4, true],

  // ────── MUSIC (per-environment) ──────
  ['music_forest',  'Dark intense Japanese action game music, taiko drums rhythmic beat, shamisen melody, koto accents, tense ninja combat atmosphere, fast paced, video game boss fight loop', 30, 0.5, true],
  ['music_temple',  'Serene but tense Japanese temple music, koto melody, temple bells, wind, ethereal atmosphere, underlying tension, video game loop', 30, 0.5, true],
  ['music_boss',    'Intense Japanese boss battle music, fast aggressive taiko drums, dramatic strings, shakuhachi flute, epic combat, video game boss fight loop', 30, 0.6, true],

  // ────── STORY MUSIC ──────
  ['music_story_calm',    'Calm peaceful Japanese ambient music, soft koto melody, gentle shakuhachi flute, distant wind chimes, meditative atmosphere, warm and nostalgic, video game story scene loop', 30, 0.5, true],
  ['music_story_tension', 'Tense suspenseful Japanese ambient music, low shamisen drones, subtle taiko heartbeat rhythm, ominous atmosphere, building unease, dramatic revelation moment, video game story loop', 30, 0.5, true],

  // ────── NEW ZONE MUSIC ──────
  ['music_edo',           'Traditional Edo period Japanese music, shamisen melody with koto accompaniment, wooden percussion, steady rhythmic taiko, feudal town atmosphere, warm but tense, action game combat loop', 30, 0.5, true],
  ['music_neon',          'Cyberpunk synthwave mixed with Japanese instruments, electronic beats with taiko drums, neon city night action, fast-paced, aggressive but melodic, Akira meets Katana Zero, game combat loop', 30, 0.6, true],
  ['music_nightclub',     'Dark underground electronic bass music, deep pulsing beat, Japanese hip-hop influence, menacing club atmosphere, heavy sub-bass, stealth infiltration vibe, game combat loop', 30, 0.5, true],
  ['music_spirit',        'Ethereal otherworldly Japanese music, celestial koto with reverb, shakuhachi echoing in void, temple bells, aurora-like ambient pads, beautiful and haunting, spirit realm atmosphere, game loop', 30, 0.5, true],
  ['music_boss_shadow',   'Intense personal boss battle music, dramatic shamisen duel, fast taiko rhythm, emotional strings, tragic but fierce, two warriors destined to fight, climactic final confrontation, game boss loop', 30, 0.6, true],
  ['music_epilogue',      'Quiet hopeful Japanese music, gentle koto resolution, soft shakuhachi sunrise melody, peaceful morning atmosphere, warm nostalgic ending, bittersweet and beautiful, video game credits loop', 30, 0.4, true],

  // ────── NEW AMBIENT ──────
  ['city_hum',            'Cyberpunk city night ambience, distant traffic, neon sign electrical buzz, rain on concrete, urban Japanese nightlife background, no music', 10, 0.4, true],
  ['nightclub_bass',      'Muffled bass beat through club walls, distant deep electronic music, vibrating floors, underground nightlife, no clear melody', 10, 0.4, true],
  ['spirit_wind',         'Otherworldly ethereal wind, distant wind chimes, ghostly whispers, cherry blossom petals rustling, supernatural peaceful ambience, no music', 10, 0.4, true],
];

async function generate(name, prompt, dur, influence, loop = false) {
  const path = join(OUT, `${name}.mp3`);
  if (existsSync(path)) { console.log(`  ${name}: exists`); return; }
  process.stdout.write(`  ${name}: generating...`);
  const body = { text: prompt, model_id: 'eleven_text_to_sound_v2', duration_seconds: dur, prompt_influence: influence };
  if (loop) body.loop = true;
  const res = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) { console.log(` FAILED (${res.status})`); return; }
  const buf = await res.arrayBuffer();
  writeFileSync(path, Buffer.from(buf));
  console.log(` done (${(buf.byteLength / 1024).toFixed(1)}KB)`);
  await new Promise(r => setTimeout(r, 400));
}

async function main() {
  console.log('\n=== SFX ===');
  for (const [n, p, d, i] of SOUNDS) await generate(n, p, d, i);
  console.log('\n=== Loops + Music ===');
  for (const [n, p, d, i, l] of LOOPS) await generate(n, p, d, i, l);
  console.log('\nDone!\n');
}

main().catch(e => { console.error(e.message); process.exit(1); });
