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
];

const LOOPS = [
  // ────── AMBIENT (continuous background layers) ──────
  ['rain_loop',     'Steady rain falling on wooden Japanese rooftops and stone paths, gentle but present, no thunder, nature ambience', 10, 0.4, true],
  ['forest_night',  'Dark Japanese forest at night, wind through bamboo, distant owl, rustling leaves, mysterious atmosphere, no music', 10, 0.4, true],

  // ────── MUSIC (per-environment) ──────
  ['music_forest',  'Dark intense Japanese action game music, taiko drums rhythmic beat, shamisen melody, koto accents, tense ninja combat atmosphere, fast paced, video game boss fight loop', 30, 0.5, true],
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
