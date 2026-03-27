#!/usr/bin/env node
/**
 * Generate game music using Gemini Lyria 3 API.
 * Run: GEMINI_API_KEY=your_key node scripts/generate-music-gemini.mjs
 *
 * Generates 30-second loopable music clips for game zones.
 * Skips existing files. Output: public/audio/game/{name}.mp3
 */
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, '..', 'public', 'audio', 'game');
mkdirSync(OUT, { recursive: true });

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error('Set GEMINI_API_KEY env var'); process.exit(1); }

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/lyria-3-clip-preview:generateContent';

const TRACKS = [
  ['music_neon', 'Cyberpunk synthwave action game music with Japanese instruments. Fast electronic beats mixed with taiko drums, aggressive but melodic. Neon city night atmosphere. Dark intense energy like Akira meets Katana Zero. 130 BPM. Seamless loop structure with the ending transitioning smoothly back to the beginning.'],
  ['music_nightclub', 'Dark underground electronic game music. Deep pulsing bass beat, Japanese hip-hop influence, menacing club atmosphere. Heavy sub-bass with minimal melody. Stealth infiltration vibe. 110 BPM. Seamless loop.'],
  ['music_spirit', 'Ethereal otherworldly Japanese game music. Celestial koto with heavy reverb, shakuhachi flute echoing in void, temple bells, aurora-like ambient synth pads. Beautiful and haunting spirit realm atmosphere. 80 BPM. Seamless loop.'],
  ['music_boss_shadow', 'Intense personal boss battle game music. Dramatic shamisen duel melody, fast taiko drum rhythm, emotional string section. Tragic but fierce, two warriors destined to fight. Climactic final confrontation. 140 BPM. Seamless loop.'],
  ['music_epilogue', 'Quiet hopeful Japanese game music. Gentle koto resolution melody, soft shakuhachi sunrise, peaceful morning atmosphere. Warm nostalgic ending, bittersweet and beautiful. 70 BPM. Seamless loop.'],
  ['spirit_wind', 'Ethereal ambient soundscape. Otherworldly wind blowing softly, distant wind chimes tinkling gently, ghostly whispers barely audible, cherry blossom petals rustling. Supernatural peaceful atmosphere. No melody, no rhythm — pure ambient texture. Seamless loop.'],
  // Retry failed short SFX too
  ['cyber_teleport', 'Short electronic digital teleport sound effect. Quick futuristic warp displacement zap. Cyberpunk ninja dash. 0.5 seconds. Game SFX.'],
  ['pistol_shot', 'Single pistol gunshot crack. Sharp firearm report. Short and punchy. 0.5 seconds. Game SFX.'],
  ['illusion_pop', 'Magical illusion disappearing poof. Spirit dissolving into sparkle particles. Short mystical vanish. 0.5 seconds. Game SFX.'],
];

async function generateTrack(name, prompt) {
  const path = join(OUT, `${name}.mp3`);
  if (existsSync(path)) { console.log(`  ${name}: exists`); return; }
  process.stdout.write(`  ${name}: generating...`);

  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['AUDIO'] },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.log(` FAILED (${res.status}: ${errText.slice(0, 200)})`);
      return;
    }

    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const audioPart = parts.find(p => p.inlineData?.mimeType?.startsWith('audio/'));
    if (!audioPart) {
      const reason = data.candidates?.[0]?.finishReason || 'unknown';
      console.log(` FAILED (no audio — reason: ${reason})`);
      return;
    }

    const buf = Buffer.from(audioPart.inlineData.data, 'base64');
    writeFileSync(path, buf);
    console.log(` done (${(buf.byteLength / 1024).toFixed(1)}KB)`);
  } catch (err) {
    console.log(` ERROR: ${err.message}`);
  }

  // Rate limit
  await new Promise(r => setTimeout(r, 3000));
}

async function main() {
  console.log(`\nGenerating ${TRACKS.length} music tracks via Gemini Lyria 3\n`);
  for (const [name, prompt] of TRACKS) {
    await generateTrack(name, prompt);
  }
  console.log('\nDone!\n');
}

main().catch(e => { console.error(e.message); process.exit(1); });
