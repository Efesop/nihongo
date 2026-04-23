#!/usr/bin/env node
/**
 * Pre-generate all TTS audio files using ElevenLabs.
 *
 * Usage:
 *   ELEVENLABS_API_KEY=your_key node scripts/generate-audio.mjs
 *
 * Modes (MODE env var):
 *   all               — kana + stories + phrases (default)
 *   kana              — kana characters only
 *   story             — mnemonic stories only
 *   phrase            — all phrases (normal speed)
 *   phrases-v2        — only phrases past the original 100 (food items, verbs, etc.)
 *   slow              — all phrases at 0.85x speed → public/audio/phrase-slow/
 *   test-voice        — 5 sample phrases × 3 JP voices for comparison
 *   missing           — only generate phrases that don't have audio files yet
 *   graded            — per-sentence audio for every graded-reader story (two voices)
 *   stories-v2        — only new graded stories (gs7 and above)
 *   scenes            — 2-voice scene conversations (no timestamps)
 *   scenes-timestamps — scenes + character-level alignment JSON for karaoke word sync
 *                       BATCH=1 for casual register only, BATCH=2 for polite+mixed only
 *   grammar           — English one-liner + Japanese example per grammar pattern
 *                       (for the GrammarInsight card "hear it" button). Writes
 *                       public/audio/grammar/{id}-en.mp3 and {id}-ja.mp3
 *   pitch             — atamadaka / heiban minimal-pair samples for pitch accent
 *                       intro + discrimination drill. Writes
 *                       public/audio/pitch/{pairId}-{pattern}.mp3
 *   phrases-akira     — all 505 phrases re-voiced by akira (male). Writes
 *                       public/audio/phrase-akira/{id}.mp3. Audio pipeline can
 *                       alternate konoha ↔ akira on listen cards for voice
 *                       variety without inviting pitch-memorisation cheating.
 *   numbers           — native Japanese 1-99 (いち, に, ..., きゅうじゅうきゅう)
 *                       for number-match + datetime exercises. Writes
 *                       public/audio/numbers/{n}.mp3
 *
 * Voice override: VOICE_JA=voiceId node scripts/generate-audio.mjs
 * Model override: MODEL=eleven_v3 node scripts/generate-audio.mjs
 *
 * Outputs to public/audio/{kana,story,phrase,phrase-slow,graded,scenes}/
 */
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');
const OUT = join(ROOT, 'public', 'audio');

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) { console.error('Set ELEVENLABS_API_KEY env var'); process.exit(1); }

// ── VOICES ─────────────────────────────────────────────────────────────────
// Native Japanese voices — Tokyo/Kanto standard for clear pronunciation.
// Only two canonical voices: konoha (F) + akira (M). No others — variety comes
// from alternation, not from voice sprawl (keeps pronunciation model stable
// across all content and avoids accidental fumi-in-scenes etc).
const VOICES_JA = {
  konoha: 'T7yYq3WpB94yAuOXraRi',  // Female — primary voice (phrases, kana, stories, scene A)
  akira:  'DOL4zlUH4vnnX1hByxsw',  // Male — secondary (scene B, graded B, phrase-akira alternate)
};

const VOICE_JA = process.env.VOICE_JA || VOICES_JA.konoha;
const VOICE_EN = process.env.VOICE_EN || 'XrExE9yKIg1WjnnlVkGX'; // Matilda — warm English

// eleven_v3 = best quality (pre-gen, latency doesn't matter)
// eleven_multilingual_v2 = proven stable fallback
const MODEL = process.env.MODEL || 'eleven_multilingual_v2';

// ── DATA ────────────────────────────────────────────────────────────────────

const HIRAGANA = ['あ','い','う','え','お','か','き','く','け','こ','さ','し','す','せ','そ','た','ち','つ','て','と','な','に','ぬ','ね','の','は','ひ','ふ','へ','ほ','ま','み','む','め','も','や','ゆ','よ','ら','り','る','れ','ろ','わ','を','ん','が','ぎ','ぐ','げ','ご','ざ','じ','ず','ぜ','ぞ','だ','ぢ','づ','で','ど','ば','び','ぶ','べ','ぼ','ぱ','ぴ','ぷ','ぺ','ぽ'];
const KATAKANA = ['ア','イ','ウ','エ','オ','カ','キ','ク','ケ','コ','サ','シ','ス','セ','ソ','タ','チ','ツ','テ','ト','ナ','ニ','ヌ','ネ','ノ','ハ','ヒ','フ','ヘ','ホ','マ','ミ','ム','メ','モ','ヤ','ユ','ヨ','ラ','リ','ル','レ','ロ','ワ','ヲ','ン','ガ','ギ','グ','ゲ','ゴ','ザ','ジ','ズ','ゼ','ゾ','ダ','ヂ','ヅ','デ','ド','バ','ビ','ブ','ベ','ボ','パ','ピ','プ','ペ','ポ'];

const STORIES = {
  'あ': "The cross stroke at the top is the stem of an apple, and the loop below is the round fruit hanging from it.",
  'い': "Two simple strokes side by side — just like writing lowercase i twice.",
  'う': "A boxer just took a hit to the gut, body curving down as they double over.",
  'え': "A ninja sprinting with arms stretched behind — the classic anime run, full speed ahead.",
  'お': "A UFO hovering overhead, saucer shape beneath a beam of light.",
  'か': "A blade cutting clean through a stick — the diagonal is the blade, the vertical line is the stick being split.",
  'き': "A key lying flat — the horizontal strokes are the teeth, the vertical line is the shaft.",
  'く': "A cuckoo's beak wide open mid-call — one sharp angled stroke.",
  'け': "A walking cane leaning against a keg.",
  'こ': "Two koi fish gliding side by side through perfectly still water.",
  'さ': "A sneaky smirking face, one eyebrow raised — those crossing strokes are that sly grin.",
  'し': "A fishing hook dropped into still water — one single swooping curve.",
  'す': "A straw caught in a spiral, curling around itself.",
  'せ': "A sensei mid-sentence, mouth open, caught in the act of teaching.",
  'そ': "Thread being sewn through fabric in one neat crossing stroke.",
  'た': "Look closely — the cross at the top is a T, the curve at the bottom is an A. T plus A.",
  'ち': "A cheerleader throwing their arms up wide — the stroke looks just like a five.",
  'つ': "One enormous sweeping curve — a tsunami, the whole ocean bending over, about to crash.",
  'て': "A letter T with a curling tail at the end.",
  'と': "A tornado spinning at the base, with a little stalk poking out of the very top.",
  'な': "A tangled knot of rope — all those crossing strokes tied up tight.",
  'に': "A leg with a bent knee — long left stroke for the thigh, right stroke bent at the joint.",
  'ぬ': "Noodles twirling on chopsticks — an N shape on the left, a looping U on the right.",
  'ね': "A nail with a snail trailing behind it. That loop at the bottom is the snail — it's what makes this ne and not re.",
  'の': "One decisive swirl — N and O combined into a single spinning stroke.",
  'は': "A capital H with a hoop on the right side. One hoop is ha — two horizontal bars is ho.",
  'ひ': "A wide curved mouth, lips pulled right back in the silliest grin.",
  'ふ': "The silhouette of Mount Fuji — that iconic pointed peak.",
  'へ': "One simple angled line rising to a point — an arrow aimed straight at heaven.",
  'ほ': "Two horizontal bars making a very long face — like a horse's elongated muzzle.",
  'ま': "A quaver note floating on a staff.",
  'み': "Two quaver notes joined side by side — do, re, mi.",
  'む': "A cow turning to look right at you — the curling strokes form that round bovine face.",
  'め': "A pretzel, all twisted — or noodles dropped into a chaotic tangle.",
  'も': "A sailboat — two horizontal sails catching the wind, mast running clean through the middle.",
  'や': "A yak stretching its long neck up high — the tall stroke with the outstretched curve.",
  'ゆ': "A unicorn rearing up, horn pointing to the sky — or a finger aimed right at you.",
  'よ': "A yo-yo mid-trick, the loop descending on its string.",
  'ら': "A rabbit sitting inside a lasso loop — the wide sweeping curve wraps around the bunny.",
  'り': "Two strokes, but the right one is longer and curves — one riverbank higher than the other.",
  'る': "A hand gripping a precious gem — the loop at the bottom is the ruby held tight in the palm.",
  'れ': "Trace the strokes and you'll find a reindeer — head, neck, branching antler.",
  'ろ': "Just like ru, but the loop at the bottom is gone — the ruby got stolen.",
  'わ': "A white swan gliding on water — the curved neck and round body form the elegant shape.",
  'を': "Something cracked clean through a wall — those complex strokes are the drama of that split.",
  'ん': "One simple flowing curve, just like the letter n — the simplest character in the whole alphabet.",
  'ア': "The sharp angular strokes form the head of an axe — the diagonal slash is the blade, the vertical line is the handle.",
  'イ': "An artist's easel tipped sideways — the two leaning strokes are the legs splayed apart on the floor.",
  'ウ': "The angular katakana version of hiragana う — same character straightened out with sharp corners.",
  'エ': "Two horizontal bars with a vertical line between them — elevator doors about to slide open on the ground floor.",
  'オ': "An opera singer belting a high note — mouth wide open, one arm flung out dramatically to the side.",
  'カ': "A katana blade — the angular strokes form the sharp edge of a Japanese sword.",
  'キ': "Hiragana き with the bottom curve chopped off — the same key, but stripped down to straight lines.",
  'ク': "If hiragana く is the cuckoo's beak, this is the wing — the curved stroke sweeps out like a wing in flight.",
  'ケ': "Turn your head and you'll see the letter K lying on its side — that's your ke right there.",
  'コ': "A road with two sharp corners — follow the path and you'll make exactly two right-angle turns.",
  'サ': "A saddle sitting on a horse's back — the vertical stroke is the pommel, the horizontal stroke is the seat.",
  'シ': "A smiley face sinking beneath the waves — the two dots are eyes and the curve sweeps downward like a ship going under.",
  'ス': "A person carving down a ski slope — the angled strokes capture that forward lean as they fly downhill.",
  'セ': "The angular version of hiragana せ with the top-right portion stripped away — same sensei, sharper edges.",
  'ソ': "The two strokes of ソ form the cone of a soft-serve ice cream — the ice cream swirl sits on top, completing the picture.",
  'タ': "An arm reaching out to hold a tablet or phone — the strokes form the arm and device.",
  'チ': "A chicken with its beak wide open — squint hard and you might see the head and body in those strokes.",
  'ツ': "A tuna fish head — similar to シ but the strokes face a different direction, like the fish is swimming the other way.",
  'テ': "A telephone pole bent at an angle by the wind — the horizontal stroke is the crossbar with wires, the diagonal is the leaning pole.",
  'ト': "The side view of a temple gate — one tall vertical pillar with a short horizontal beam jutting out.",
  'ナ': "A curved knife — the horizontal stroke at the top is the handle, and the diagonal slash below is the blade.",
  'ニ': "Two horizontal bars stacked — like the number 2, easy as counting ni.",
  'ヌ': "A noose dangling from a rope — the crossing strokes form the knot, and the loop hangs below.",
  'ネ': "A bird's nest tucked into the fork of a tree — twigs woven together between the branches.",
  'ノ': "The diagonal slash from a no-entry sign — just the line itself, without the circle around it.",
  'ハ': "Two strokes spreading outward like the roof of a house — the peak is at the top, eaves angling down on each side.",
  'ヒ': "The side profile of a high heel shoe — the vertical stroke is the stiletto, the curve is the sole.",
  'フ': "The tip of a bare foot, toes pointing up — one simple curved stroke capturing that arch.",
  'ヘ': "Exactly the same as hiragana へ — one angled line pointing up, identical in both scripts.",
  'ホ': "A holy cross with rays of light shining from it — the vertical and horizontal strokes form the cross, the extra strokes are beams of radiance.",
  'マ': "A manta ray gliding through the ocean — the horizontal stroke is one massive wing, the curve beneath is the body sweeping through water.",
  'ミ': "Three horizontal bars stacked up — three bars, three sounds, mi.",
  'ム': "A moose's antler viewed from the side — the angular strokes branch upward like the pointed tips of an antler.",
  'メ': "Draw a rectangle around it and you get the back of a mail envelope — the X marks where the flap folds shut.",
  'モ': "Just like hiragana も but the third stroke floats free instead of cutting through the first — same sailboat, slightly different rigging.",
  'ヤ': "The angular version of hiragana や with one stroke removed — sharper, more geometric, but the same shape at heart.",
  'ユ': "The periscope of a U-boat poking above the water's surface — the vertical tube rising up, the horizontal piece scanning the horizon.",
  'ヨ': "An egg yolk being pulled by two oxen — the two horizontal strokes are the yoke beams, the vertical stroke connects them.",
  'ラ': "A reclining chair tipped back — the horizontal stroke is the headrest, the curve below is the seat and backrest.",
  'リ': "Hiragana り with the honey-like curves straightened out — the same river, but flowing in clean straight lines.",
  'ル': "The roots of a tree splitting into the ground — two strokes diverging downward, digging deep into the earth.",
  'レ': "A razor blade standing on its edge — one sharp vertical stroke with a curve at the base, ready to cut.",
  'ロ': "A boxy mechanical shape — a perfect rectangle like a robot's rigid mouth or a metal box.",
  'ワ': "A wine glass seen from the side — the angular curve is the bowl of the glass, tapering down to the stem.",
  'ヲ': "The Olympic torch held high — like ワ (wine glass) but with an extra stroke on top for the flame reaching skyward.",
  'ン': "A spacecraft streaking into Earth's atmosphere — wider and flatter than ソ, like a capsule heating up on re-entry.",
};

// Imported lazily from src/data/phrases.js (source of truth — all 380+ phrases)
let PHRASES = null;
async function loadPhrases() {
  if (PHRASES) return PHRASES;
  const m = await import(join(ROOT, 'src/data/phrases.js'));
  PHRASES = m.PHRASES.map(p => [p[0], p[1]]);
  return PHRASES;
}

// Subset for voice comparison tests
const TEST_PHRASES = [
  ['g1','こんにちは'],              // short greeting
  ['f2','おかんじょうおねがいします'],  // medium polite request
  ['t3','つぎのえきはなんですか'],     // question with particle chain
  ['dl5','にほんごをべんきょうしています'], // long compound sentence
  ['g4','ありがとうございます'],       // essential polite phrase
];

// ── API ─────────────────────────────────────────────────────────────────────

const STYLE_PRESETS = {
  learn:   { stability: 0.7,  similarity_boost: 0.8,  style: 0.1 },  // flat, clear — drills
  narrate: { stability: 0.55, similarity_boost: 0.8,  style: 0.25 }, // storytelling lilt
  convo:   { stability: 0.45, similarity_boost: 0.85, style: 0.4 },  // natural dialogue
  polite:  { stability: 0.55, similarity_boost: 0.85, style: 0.35 }, // polite register
};

async function generate(text, voiceId, outPath, { isJapanese = false, speed = 1.0, force = false, preset = 'learn' } = {}) {
  if (!force && existsSync(outPath)) { process.stdout.write('·'); return; }

  const s = STYLE_PRESETS[preset] || STYLE_PRESETS.learn;
  const body = {
    text,
    model_id: MODEL,
    voice_settings: {
      ...s,
      ...(speed !== 1.0 && { speed }),
      use_speaker_boost: true,
    },
    ...(isJapanese && {
      language_code: 'ja',
      apply_language_text_normalization: true,
    }),
  };

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs ${res.status}: ${err}`);
  }

  const buf = await res.arrayBuffer();
  writeFileSync(outPath, Buffer.from(buf));
  process.stdout.write('✓');

  await new Promise(r => setTimeout(r, 350)); // ~3 req/s rate limit
}

// Variant that returns character-level timestamps alongside audio.
// Writes {outPath}.json with { chars: [...], timings_ms: [...] }.
async function generateWithTimestamps(text, voiceId, outPath, { force = false, preset = 'convo' } = {}) {
  const jsonPath = outPath.replace(/\.mp3$/, '.json');
  if (!force && existsSync(outPath) && existsSync(jsonPath)) { process.stdout.write('·'); return; }

  const s = STYLE_PRESETS[preset] || STYLE_PRESETS.convo;
  const body = {
    text,
    model_id: MODEL,
    voice_settings: { ...s, use_speaker_boost: true },
    language_code: 'ja',
    apply_language_text_normalization: true,
  };

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`, {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  const data = await res.json();
  // Response: { audio_base64, alignment: { characters, character_start_times_seconds, character_end_times_seconds }, normalized_alignment: {...} }
  const audioBuf = Buffer.from(data.audio_base64, 'base64');
  writeFileSync(outPath, audioBuf);
  const align = data.alignment || data.normalized_alignment || null;
  if (align) {
    writeFileSync(jsonPath, JSON.stringify({
      characters: align.characters,
      startMs: align.character_start_times_seconds.map(t => Math.round(t * 1000)),
      endMs: align.character_end_times_seconds.map(t => Math.round(t * 1000)),
    }));
  }
  process.stdout.write('✓');
  await new Promise(r => setTimeout(r, 400));
}

// ── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  const mode = process.env.MODE || 'all';

  // ── TEST VOICE COMPARISON ──
  if (mode === 'test-voice') {
    const testDir = join(OUT, 'test-voices');
    mkdirSync(testDir, { recursive: true });

    console.log('\n🎤 Voice comparison test — generating 5 phrases × 3 voices…\n');
    for (const [name, voiceId] of Object.entries(VOICES_JA)) {
      const voiceDir = join(testDir, name);
      mkdirSync(voiceDir, { recursive: true });
      console.log(`\n  ${name} (${voiceId}):`);
      for (const [id, text] of TEST_PHRASES) {
        process.stdout.write(`    ${id}: `);
        await generate(text, voiceId, join(voiceDir, `${id}.mp3`), { isJapanese: true, force: true });
        console.log(` ${text}`);
      }
    }
    console.log(`\n✅ Test files in: public/audio/test-voices/`);
    console.log('   Listen and pick your favourite, then set VOICE_JA=<id> for the full batch.\n');
    return;
  }

  // Create output dirs
  ['kana','story','story2','story3','phrase','phrase-slow','phrase-akira','graded','scenes','grammar','pitch','numbers'].forEach(d =>
    mkdirSync(join(OUT, d), { recursive: true })
  );

  // ── KANA ──
  if (mode === 'all' || mode === 'kana') {
    console.log('\n🔤 Kana characters (Japanese)…');
    for (const ch of [...HIRAGANA, ...KATAKANA]) {
      const cp = ch.codePointAt(0).toString(16);
      await generate(ch, VOICE_JA, join(OUT, 'kana', `${cp}.mp3`), { isJapanese: true });
    }
  }

  // ── STORIES ──
  if (mode === 'all' || mode === 'story') {
    console.log('\n\n📖 Mnemonic stories (English)…');
    for (const ch of [...HIRAGANA, ...KATAKANA]) {
      const story = STORIES[ch];
      if (!story) continue;
      const cp = ch.codePointAt(0).toString(16);
      await generate(story, VOICE_EN, join(OUT, 'story3', `${cp}.mp3`));
    }
  }

  // ── PHRASES (normal speed) ──
  // Modes: phrase (all), missing (skip existing), phrases-v2 (only new IDs not in first 100)
  if (mode === 'all' || mode === 'phrase' || mode === 'missing' || mode === 'phrases-v2') {
    console.log('\n\n💬 Phrases (Japanese, normal speed)…');
    const allPhrases = await loadPhrases();
    const LEGACY_PREFIXES = ['g','f','t','h','s','d','e','n','tm','dl','dc']; // first 100 phrases
    const isLegacy = (id) => LEGACY_PREFIXES.some(p => id.startsWith(p) && /^\d+$/.test(id.slice(p.length)));
    const phrasesToRun = mode === 'phrases-v2'
      ? allPhrases.filter(([id]) => !isLegacy(id))
      : allPhrases;
    console.log(`  → ${phrasesToRun.length} phrases queued`);
    for (const [id, text] of phrasesToRun) {
      const outPath = join(OUT, 'phrase', `${id}.mp3`);
      if ((mode === 'missing' || mode === 'phrases-v2') && existsSync(outPath)) { process.stdout.write('·'); continue; }
      await generate(text, VOICE_JA, outPath, { isJapanese: true, preset: 'learn' });
    }
  }

  // ── PHRASES (slow speed for learning) ──
  if (mode === 'all' || mode === 'slow') {
    console.log('\n\n🐢 Phrases (Japanese, slow 0.85x)…');
    const allPhrases = await loadPhrases();
    for (const [id, text] of allPhrases) {
      await generate(text, VOICE_JA, join(OUT, 'phrase-slow', `${id}.mp3`), { isJapanese: true, speed: 0.85, preset: 'learn' });
    }
  }

  // ── GRADED READER SENTENCES ──
  // Modes: graded (all stories), stories-v2 (only gs7+)
  if (mode === 'all' || mode === 'graded' || mode === 'stories-v2') {
    console.log('\n\n📚 Graded reader sentences (two voices)…');
    const { GRADED_STORIES } = await import(join(ROOT, 'src/data/gradedStories.js'));
    const VOICE_A = VOICES_JA.konoha;
    const VOICE_B = VOICES_JA.akira;
    const isNew = (id) => {
      const n = parseInt(id.replace(/^gs/, ''), 10);
      return Number.isFinite(n) && n >= 7;
    };
    const pool = mode === 'stories-v2' ? GRADED_STORIES.filter(gs => isNew(gs.id)) : GRADED_STORIES;
    console.log(`  → ${pool.length} stories queued`);
    for (const gs of pool) {
      console.log(`\n  ${gs.id} — ${gs.title}`);
      for (let i = 0; i < gs.sentences.length; i++) {
        const s = gs.sentences[i];
        const voice = s.speaker === 'b' ? VOICE_B : VOICE_A;
        const text = s.jp.replace(/[（(][^）)]*[）)]/g, '').replace(/\s+/g, ' ').trim();
        if (!text) { process.stdout.write('∅'); continue; }
        const outPath = join(OUT, 'graded', `${gs.id}-${i}.mp3`);
        await generate(text, voice, outPath, { isJapanese: true, preset: 'narrate' });
      }
    }
  }

  // ── SCENE STUDIES (2-voice conversations) ──
  // Modes: scenes (no timestamps), scenes-timestamps (with karaoke alignment JSON)
  // BATCH=1 = casual register, BATCH=2 = polite+mixed register
  if (mode === 'scenes' || mode === 'scenes-timestamps') {
    const withTimestamps = (mode === 'scenes-timestamps');
    const batch = process.env.BATCH; // '1', '2', or empty = all
    console.log(`\n\n🎬 Scene studies${withTimestamps ? ' (with timestamps)' : ''}${batch ? ` BATCH=${batch}` : ''}…`);
    const { SCENE_STUDIES } = await import(join(ROOT, 'src/data/sceneStudies.js'));
    const VOICE_A = VOICES_JA.konoha;
    const VOICE_B = VOICES_JA.akira;

    let pool = SCENE_STUDIES;
    if (batch === '1') pool = SCENE_STUDIES.filter(sc => sc.register === 'casual');
    if (batch === '2') pool = SCENE_STUDIES.filter(sc => sc.register !== 'casual');
    console.log(`  → ${pool.length} scenes queued`);

    for (const sc of pool) {
      console.log(`\n  ${sc.id} — ${sc.title} [${sc.register}]`);
      const preset = sc.register === 'casual' ? 'convo' : 'polite';
      for (let i = 0; i < sc.lines.length; i++) {
        const ln = sc.lines[i];
        const voice = ln.speaker === 'b' ? VOICE_B : VOICE_A;
        const text = ln.jp.replace(/[（(][^）)]*[）)]/g, '').replace(/\s+/g, ' ').trim();
        if (!text) { process.stdout.write('∅'); continue; }
        const outPath = join(OUT, 'scenes', `${sc.id}-${String(i).padStart(2, '0')}.mp3`);
        if (withTimestamps) {
          await generateWithTimestamps(text, voice, outPath, { preset });
        } else {
          await generate(text, voice, outPath, { isJapanese: true, preset });
        }
      }
    }
  }

  // ── AKIRA (MALE) PHRASE BANK ──
  // Re-voice all 505 phrases with akira so the app can cycle voices on listen
  // cards. Skips files that already exist (safe to resume on rate-limit).
  if (mode === 'phrases-akira') {
    console.log('\n\n👤 Phrases re-voiced by akira (male)…');
    const allPhrases = await loadPhrases();
    console.log(`  → ${allPhrases.length} phrases queued`);
    for (const [id, text] of allPhrases) {
      const outPath = join(OUT, 'phrase-akira', `${id}.mp3`);
      if (existsSync(outPath)) { process.stdout.write('·'); continue; }
      await generate(text, VOICES_JA.akira, outPath, { isJapanese: true, preset: 'learn' });
    }
  }

  // ── NUMBERS 1-99 ──
  // Japanese native reading for every integer 1..99. Powers number-match and
  // any datetime exercise wanting real spoken values. Skips existing.
  if (mode === 'numbers') {
    console.log('\n\n🔢 Numbers 1-99 (Japanese)…');
    const ONES = ['','いち','に','さん','よん','ご','ろく','なな','はち','きゅう'];
    const numToKana = (n) => {
      if (n < 10) return ONES[n];
      if (n === 10) return 'じゅう';
      if (n < 20) return 'じゅう' + ONES[n - 10];
      const tens = Math.floor(n / 10);
      const ones = n % 10;
      return ONES[tens] + 'じゅう' + (ones ? ONES[ones] : '');
    };
    for (let n = 1; n <= 99; n++) {
      const text = numToKana(n);
      const outPath = join(OUT, 'numbers', `${n}.mp3`);
      if (existsSync(outPath)) { process.stdout.write('·'); continue; }
      process.stdout.write(`${n}: `);
      await generate(text, VOICES_JA.konoha, outPath, { isJapanese: true, preset: 'learn' });
      console.log(` ${text}`);
    }
  }

  // ── PITCH ACCENT MINIMAL PAIRS ──
  // ElevenLabs doesn't expose direct pitch control, but the Japanese voice
  // (konoha) produces a noticeably different contour when you bracket the
  // high-pitched mora with capitalised romaji hints or include a subtle
  // pause marker. Results aren't perfect — flag to hand-review.
  if (mode === 'pitch') {
    console.log('\n\n🎵 Pitch accent minimal pairs…');
    const { PITCH_PAIRS } = await import(join(ROOT, 'src/data/pitchAccentIntro.js'));
    for (const pair of PITCH_PAIRS) {
      console.log(`\n  ${pair.id} (${pair.kana})`);
      for (const m of pair.meanings) {
        // Feed the kana with a context word to elicit the correct pattern from
        // the TTS. E.g. "箸を" (chopsticks) vs "橋を" (bridge) — the kanji
        // disambiguates for the model without affecting the final audio much.
        const promptText = m.word;
        const outPath = join(OUT, 'pitch', `${pair.id}-${m.pattern}.mp3`);
        process.stdout.write(`    ${m.pattern}: `);
        await generate(promptText, VOICES_JA.konoha, outPath, { isJapanese: true, preset: 'learn', force: true });
        console.log(` ${m.word} (${m.en})`);
      }
    }
    console.log('\n⚠  Review output manually — TTS pitch control is approximate. Re-run after any data tweaks.');
  }

  // ── GRAMMAR PATTERN EXPLAINERS ──
  // For each pattern: one EN narration of the plain-English oneLiner + one JA
  // narration of the speakExample. Powers the "hear it" button on GrammarInsight.
  if (mode === 'grammar') {
    console.log('\n\n📚 Grammar pattern explainers…');
    const { GRAMMAR_PATTERNS } = await import(join(ROOT, 'src/data/grammarPatterns.js'));
    console.log(`  → ${GRAMMAR_PATTERNS.length} patterns queued`);
    for (const gp of GRAMMAR_PATTERNS) {
      console.log(`\n  ${gp.id} — ${gp.shortTitle || gp.pattern}`);
      // English explanation — Matilda voice, narrate preset (light storytelling lilt)
      const enText = gp.oneLiner || gp.explanation || '';
      if (enText) {
        process.stdout.write('    EN: ');
        await generate(enText, VOICE_EN, join(OUT, 'grammar', `${gp.id}-en.mp3`), { preset: 'narrate' });
        console.log('');
      }
      // Japanese example — konoha voice, learn preset (clear, drill-friendly)
      const jaText = gp.speakExample || '';
      if (jaText) {
        process.stdout.write('    JA: ');
        await generate(jaText, VOICES_JA.konoha, join(OUT, 'grammar', `${gp.id}-ja.mp3`), { isJapanese: true, preset: 'learn' });
        console.log('');
      }
    }
  }

  console.log('\n\n✅ Done! Commit public/audio/ to your repo.\n');
}

main().catch(e => { console.error('\n\n❌', e.message); process.exit(1); });
