#!/usr/bin/env node
/**
 * Audio probe — samples each content type planned for A+C+D expansion.
 *
 * Run: ELEVENLABS_API_KEY=xxx node scripts/test-audio-probe.mjs
 *
 * Generates 4 samples covering every planned content shape:
 *   1. phrase       — short greeting (A: new phrases)
 *   2. narration    — longer single-voice story (D: graded reader)
 *   3. monologue    — medium single-voice scene (C: passive listening, one speaker)
 *   4. conversation — two-voice dialogue (C: passive listening, real convo)
 *
 * Also runs the existing voice-comparison (5 phrases × 3 voices) unless SKIP_VOICES=1.
 *
 * Outputs to public/audio/probe/. Prints char counts + quota at the end.
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');
const OUT = join(ROOT, 'public', 'audio', 'probe');
mkdirSync(OUT, { recursive: true });

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error('Set ELEVENLABS_API_KEY'); process.exit(1); }

const MODEL = process.env.MODEL || 'eleven_multilingual_v2';

const VOICES = {
  konoha: 'T7yYq3WpB94yAuOXraRi', // F, premium clarity
  akira:  'DOL4zlUH4vnnX1hByxsw', // M, smooth Tokyo standard
  fumi:   'PmgfHCGeS5b7sH90BOOJ', // F, friendly warmth
};

let totalChars = 0;

async function tts(text, voiceId, outPath, stylePreset = 'learn') {
  totalChars += text.length;
  const styles = {
    learn: { stability: 0.7, similarity_boost: 0.8, style: 0.1 },  // clear, flat, good for drilling
    narrate: { stability: 0.55, similarity_boost: 0.8, style: 0.25 }, // storytelling lilt
    convo: { stability: 0.45, similarity_boost: 0.85, style: 0.35 }, // natural dialogue
  };
  const body = {
    text,
    model_id: MODEL,
    language_code: 'ja',
    apply_language_text_normalization: true,
    voice_settings: { ...styles[stylePreset], use_speaker_boost: true },
  };
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  const buf = await res.arrayBuffer();
  writeFileSync(outPath, Buffer.from(buf));
  console.log(`  ✓ ${outPath.replace(ROOT + '/', '')} — ${text.length} chars`);
  await new Promise(r => setTimeout(r, 350));
}

// ═══ SAMPLES ═══

const PHRASE_SAMPLES = [
  ['g1', 'こんにちは'],
  ['f2', 'おかんじょうおねがいします'],
  ['t3', 'つぎのえきはなんですか'],
  ['dl5', 'にほんごをべんきょうしています'],
  ['g4', 'ありがとうございます'],
];

const NARRATION = `きょうはどようびです。わたしはともだちとしぶやにいきました。でんしゃのなかはとてもこんでいました。しぶやえきについて、ハチこうのまえでともだちとあいました。ちかくのレストランにはいって、ラーメンをちゅうもんしました。とてもおいしかったです。ごちそうさまでした。`;

const MONOLOGUE = `いらっしゃいませ、おきゃくさま。こちらのせきへどうぞ。メニューをごらんください。おすすめはてんぷらていしょくです。おのみものはなにになさいますか？おまちしております。`;

// Two-voice conversation — A = shop staff (female, konoha), B = customer (male, akira)
const CONVERSATION = [
  { voice: 'konoha', text: 'いらっしゃいませ！なんめいさまですか？' },
  { voice: 'akira',  text: 'ふたりです。おねがいします。' },
  { voice: 'konoha', text: 'こちらへどうぞ。メニューです。' },
  { voice: 'akira',  text: 'すみません、おすすめはなんですか？' },
  { voice: 'konoha', text: 'きょうはまぐろがとてもしんせんです。' },
  { voice: 'akira',  text: 'じゃあ、それをふたつください。' },
  { voice: 'konoha', text: 'かしこまりました。すこしおまちください。' },
];

// ═══ MAIN ═══

async function main() {
  console.log('=== 1. PHRASES (voice comparison) ===');
  if (process.env.SKIP_VOICES !== '1') {
    for (const [vname, vid] of Object.entries(VOICES)) {
      for (const [id, text] of PHRASE_SAMPLES) {
        const out = join(OUT, `phrase-${vname}-${id}.mp3`);
        if (existsSync(out)) { console.log(`  · skip ${out.replace(ROOT+'/','')}`); continue; }
        await tts(text, vid, out, 'learn');
      }
    }
  } else console.log('  (skipped via SKIP_VOICES=1)');

  console.log('\n=== 2. NARRATION (graded reader, single voice) ===');
  await tts(NARRATION, VOICES.konoha, join(OUT, 'narration.mp3'), 'narrate');

  console.log('\n=== 3. MONOLOGUE (scene, single voice) ===');
  await tts(MONOLOGUE, VOICES.fumi, join(OUT, 'monologue.mp3'), 'narrate');

  console.log('\n=== 4. CONVERSATION (2 voices alternating) ===');
  for (let i = 0; i < CONVERSATION.length; i++) {
    const { voice, text } = CONVERSATION[i];
    await tts(text, VOICES[voice], join(OUT, `convo-${String(i+1).padStart(2,'0')}-${voice}.mp3`), 'convo');
  }

  console.log('\n=== QUOTA ===');
  const sub = await fetch('https://api.elevenlabs.io/v1/user/subscription', { headers: { 'xi-api-key': KEY } }).then(r => r.json());
  console.log(`Tier: ${sub.tier}`);
  console.log(`Used: ${sub.character_count?.toLocaleString()} / ${sub.character_limit?.toLocaleString()}`);
  console.log(`Remaining: ${(sub.character_limit - sub.character_count).toLocaleString()} chars`);
  console.log(`\nThis probe burned: ${totalChars.toLocaleString()} chars (~$${(totalChars * 0.0001).toFixed(3)} pay-as-you-go)`);
  console.log(`\nFiles in: public/audio/probe/`);
  console.log('Listen + tell me: best voice? convo pacing good? narration natural?');
}

main().catch(e => { console.error(e); process.exit(1); });
