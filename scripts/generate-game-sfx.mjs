#!/usr/bin/env node
/**
 * Generate game SFX using ElevenLabs Sound Effects API.
 * Run: ELEVENLABS_API_KEY=your_key node scripts/generate-game-sfx.mjs
 *
 * Outputs to public/audio/game/
 * Files are served as static assets — loaded at game start.
 */
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');
const OUT = join(ROOT, 'public', 'audio', 'game');
mkdirSync(OUT, { recursive: true });

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) { console.error('Set ELEVENLABS_API_KEY env var'); process.exit(1); }

// ── SFX DEFINITIONS ──
// Each entry: [filename, prompt, duration_seconds, prompt_influence]
const SFX = [
  // Combat
  ['slash1', 'Quick sharp katana sword slash through air, fast metallic swish, game sound effect', 0.8, 0.5],
  ['slash2', 'Powerful upward katana sword arc, aggressive metallic swoosh with slight ring, game sound effect', 0.8, 0.5],
  ['slash3', 'Epic heavy katana lightning slash with electrical crackle and metallic ring, powerful final strike, game sound effect', 1.2, 0.5],
  ['kill', 'Heavy violent sword impact on flesh, meaty crunch hit with bass thump, game kill sound effect', 0.8, 0.5],
  ['clash', 'Loud sharp metal on metal sword clash, bright sparks, two katana blades clashing, game sound effect', 1.0, 0.5],
  ['deflect', 'Quick metallic ping deflection, sword blocking projectile with sharp ring, game sound effect', 0.6, 0.5],

  // Movement
  ['jump', 'Quick light jump whoosh, character leaping upward, short burst of air, retro game sound', 0.5, 0.4],
  ['land', 'Soft landing impact on stone ground, feet touching surface with thud, game sound effect', 0.5, 0.4],
  ['dash', 'Fast rushing air whoosh, quick dash burst movement, game sound effect', 0.5, 0.5],
  ['wallSlide', 'Short friction scraping on rough stone wall, sliding down surface, game sound effect', 0.8, 0.4],
  ['footstep', 'Single quick light footstep on stone, running step, game sound effect', 0.3, 0.3],

  // Projectiles
  ['shuriken', 'Spinning blade flying through air, shuriken throw with metallic whistle, game sound effect', 0.8, 0.5],

  // UI / State
  ['slowmoOn', 'Deep dramatic time slowdown effect, world slowing to a crawl, deep pitch drop, game sound effect', 1.0, 0.5],
  ['slowmoOff', 'Quick time speed-up whoosh, resuming normal speed from slow motion, game sound effect', 0.6, 0.5],
  ['roomClear', 'Short triumphant victory chime, room cleared fanfare with rising notes, game sound effect', 1.5, 0.5],
  ['comboMilestone', 'Quick satisfying achievement ping, bright rewarding chime, game combo sound', 0.5, 0.4],
  ['menuStart', 'Dramatic katana unsheathing sound, sword drawing from scabbard, game start, intense', 1.5, 0.5],
  ['death', 'Dark painful impact with descending tone, character death hit with reverb, game sound effect', 1.0, 0.5],
];

// ── MUSIC ──
const MUSIC = [
  ['bgm_ambient', 'Dark atmospheric Japanese ambient music loop, koto and shakuhachi flute, rain and wind, mysterious night forest mood, videogame background music', 30, 0.4, true],
];

// ── GENERATE ──
async function generateSFX(name, prompt, duration, influence, loop = false) {
  const outPath = join(OUT, `${name}.mp3`);
  if (existsSync(outPath)) {
    process.stdout.write(`  ${name}: exists, skipping\n`);
    return;
  }

  process.stdout.write(`  ${name}: generating...`);
  const body = {
    text: prompt,
    model_id: 'eleven_text_to_sound_v2',
    duration_seconds: duration,
    prompt_influence: influence,
  };
  if (loop) body.loop = true;

  const res = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    process.stdout.write(` FAILED (${res.status}): ${err.slice(0, 100)}\n`);
    return;
  }

  const buf = await res.arrayBuffer();
  writeFileSync(outPath, Buffer.from(buf));
  process.stdout.write(` done (${(buf.byteLength / 1024).toFixed(1)}KB)\n`);

  // Rate limit — safe for free tier (~3 req/s)
  await new Promise(r => setTimeout(r, 500));
}

async function main() {
  console.log('\n=== Generating Game SFX ===\n');
  for (const [name, prompt, dur, infl] of SFX) {
    await generateSFX(name, prompt, dur, infl);
  }

  console.log('\n=== Generating Background Music ===\n');
  for (const [name, prompt, dur, infl, loop] of MUSIC) {
    await generateSFX(name, prompt, dur, infl, loop);
  }

  console.log('\n\nDone! Files in public/audio/game/');
  console.log('Commit them to your repo and deploy.\n');
}

main().catch(e => { console.error('\n\nError:', e.message); process.exit(1); });
