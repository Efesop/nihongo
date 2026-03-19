#!/usr/bin/env node
/**
 * Pre-generate all TTS audio files using ElevenLabs.
 * Run once: ELEVENLABS_API_KEY=your_key node scripts/generate-audio.mjs
 *
 * Outputs to public/audio/{kana,story,phrase}/
 * Files are served as static assets — no runtime API calls.
 */
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');
const OUT = join(ROOT, 'public', 'audio');

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) { console.error('Set ELEVENLABS_API_KEY env var'); process.exit(1); }

// Voice IDs — change these to any ElevenLabs voice you like
// These are good multilingual defaults. Find voices at elevenlabs.io/voice-library
const VOICE_JA = process.env.VOICE_JA || 'pFZP5JQG7iQjIQuC4Bku'; // Lily — clear, multilingual
const VOICE_EN = process.env.VOICE_EN || 'XrExE9yKIg1WjnnlVkGX'; // Matilda — warm English
const MODEL    = 'eleven_multilingual_v2';

// ── DATA ────────────────────────────────────────────────────────────────────

const HIRAGANA = ['あ','い','う','え','お','か','き','く','け','こ','さ','し','す','せ','そ','た','ち','つ','て','と','な','に','ぬ','ね','の','は','ひ','ふ','へ','ほ','ま','み','む','め','も','や','ゆ','よ','ら','り','る','れ','ろ','わ','を','ん'];
const KATAKANA = ['ア','イ','ウ','エ','オ','カ','キ','ク','ケ','コ','サ','シ','ス','セ','ソ','タ','チ','ツ','テ','ト','ナ','ニ','ヌ','ネ','ノ','ハ','ヒ','フ','ヘ','ホ','マ','ミ','ム','メ','モ','ヤ','ユ','ヨ','ラ','リ','ル','レ','ロ','ワ','ヲ','ン'];

const STORIES = {
  'あ': "The cross stroke at the top is the stem of an apple, and the loop below is the round fruit hanging from it.",
  'い': "Two simple strokes side by side — just like writing lowercase i twice.",
  'う': "A boxer just took a hit to the gut, body curving down as they double over.",
  'え': "A ninja caught mid-kick — those crossing strokes are arms and legs flying.",
  'お': "A UFO hovering overhead, saucer shape beneath a beam of light, with a face below — mouth wide open in shock.",
  'か': "A blade slicing clean through a stick — the diagonal is the blade, the vertical line is the stick being split.",
  'き': "A key lying flat — the horizontal strokes are the teeth, the vertical line is the shaft.",
  'く': "A cuckoo's beak wide open mid-call — one sharp angled stroke.",
  'け': "A walking cane leaning against a keg.",
  'こ': "Two koi fish gliding side by side through perfectly still water.",
  'さ': "A crafty smirking face, one eyebrow raised — those crossing strokes are that sly grin.",
  'し': "A fishing hook dropped into still water — one single swooping curve.",
  'す': "A straw caught in a spiral, curling around itself.",
  'せ': "A sensei mid-sentence, mouth open, caught in the act of teaching.",
  'そ': "Thread pulled through fabric in one neat crossing stroke.",
  'た': "Look closely — the cross at the top is a T, the curve at the bottom is an A. T plus A.",
  'ち': "A cheerleader throwing their arms up wide — the stroke looks just like a five.",
  'つ': "One enormous sweeping curve — the whole ocean bending over, about to crash.",
  'て': "A letter T with a curling tail at the end.",
  'と': "A tornado spinning at the base, with a little stalk poking out of the very top.",
  'な': "A tangled knot of rope — all those crossing strokes tied up tight.",
  'に': "A leg with a bent knee — long left stroke for the thigh, right stroke bent at the joint.",
  'ぬ': "Noodles twirling on chopsticks — an N shape on the left, a looping U on the right.",
  'ね': "A nail with a snail trailing behind it. That loop at the bottom is the snail — it's what makes this different from the next character.",
  'の': "One decisive swirl — N and O combined into a single spinning stroke.",
  'は': "A capital H with a hoop on the right side. One hoop is this character — two horizontal bars is the next one.",
  'ひ': "A wide curved mouth, lips pulled right back in the silliest grin.",
  'ふ': "The silhouette of Mount Fuji — that iconic pointed peak.",
  'へ': "One simple angled line rising to a point — an arrow aimed straight at the sky.",
  'ほ': "Two horizontal bars making a very long face — like a horse's elongated muzzle.",
  'ま': "A quaver note floating on a staff.",
  'み': "Two quaver notes joined side by side — do, re, mi.",
  'む': "A cow turning to look right at you — the curling strokes form that round bovine face.",
  'め': "A pretzel, all twisted — or noodles dropped into a chaotic tangle.",
  'も': "A sailboat — two horizontal sails catching the wind, mast running clean through the middle.",
  'や': "A yak stretching its long neck up high — the tall stroke with the outstretched curve.",
  'ゆ': "A unicorn rearing up, horn pointing to the sky — or a finger aimed right at you.",
  'よ': "A yo-yo mid-trick, the loop descending on its string.",
  'ら': "A cheerleader with arms thrown wide open — like the previous one, but bigger and more spread out.",
  'り': "Two strokes, but the right one is longer and curves — one riverbank higher than the other.",
  'る': "A hand gripping a precious gem — the loop at the bottom is the ruby held tight in the palm.",
  'れ': "Trace the strokes and you'll find a reindeer — head, neck, branching antler.",
  'ろ': "Just like the previous character, but the loop at the bottom is gone — the ruby got stolen.",
  'わ': "A happy dog mid-wag — curved body on the left, little hooking tail on the right.",
  'を': "Something cracked clean through a wall — those complex strokes are the drama of that split.",
  'ん': "One simple flowing curve, just like the letter n — the simplest character in the whole alphabet.",
};

const PHRASES = [
  ['g1','こんにちは'],['g2','おはようございます'],['g3','こんばんは'],
  ['g4','ありがとうございます'],['g5','すみません'],['g6','はい'],
  ['g7','いいえ'],['g8','おねがいします'],['g9','だいじょうぶです'],
  ['g10','さようなら'],
  ['f1','これをください'],['f2','おかんじょうおねがいします'],
  ['f3','みずをください'],['f4','おいしいです'],['f5','いただきます'],
  ['f6','ごちそうさまでした'],['f7','おすすめはなんですか'],
  ['f8','ひとりです'],['f9','ふたりです'],['f10','アレルギーがあります'],
  ['t1','えきはどこですか'],['t2','までいくらですか'],
  ['t3','つぎのえきはなんですか'],['t4','のりかえはどこですか'],
  ['t5','までおねがいします'],['t6','ここでおろしてください'],
  ['t7','スイカ'],['t8','しゅうでんはなんじですか'],
  ['h1','チェックインおねがいします'],['h2','よやくがあります'],
  ['h3','チェックアウトはなんじですか'],['h4','WiFiのパスワードはなんですか'],
  ['h5','かぎ'],['h6','もういっぱくおねがいします'],
  ['s1','これはいくらですか'],['s2','ふくろはいらないです'],
  ['s3','カードでおねがいします'],['s4','げんきんでおねがいします'],
  ['s5','あたためますか'],['s6','これをふたつください'],['s7','レシートはいらないです'],
  ['d1','はどこですか'],['d2','みぎ'],['d3','ひだり'],['d4','まっすぐ'],
  ['d5','ちかいですか'],['d6','あるいていけますか'],['d7','ちずをみせてください'],
  ['d8','トイレはどこですか'],
  ['e1','たすけてください'],['e2','びょういんはどこですか'],
  ['e3','けいさつをよんでください'],['e4','えいごをはなせますか'],
  ['e5','にほんごがわかりません'],['e6','もういちどいってください'],
];

// ── API ─────────────────────────────────────────────────────────────────────

async function generate(text, voiceId, outPath) {
  if (existsSync(outPath)) { process.stdout.write('·'); return; }

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      model_id: MODEL,
      voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.2 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs ${res.status}: ${err}`);
  }

  const buf = await res.arrayBuffer();
  writeFileSync(outPath, Buffer.from(buf));
  process.stdout.write('✓');

  await new Promise(r => setTimeout(r, 350)); // ~3 req/s — safe for free tier
}

// ── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  ['kana','story','story2','phrase'].forEach(d => mkdirSync(join(OUT, d), { recursive: true }));

  const mode = process.env.MODE || 'all';

  if (mode === 'all' || mode === 'kana') {
    console.log('\n🔤 Kana characters (Japanese)…');
    for (const ch of [...HIRAGANA, ...KATAKANA]) {
      const cp = ch.codePointAt(0).toString(16);
      await generate(ch, VOICE_JA, join(OUT, 'kana', `${cp}.mp3`));
    }
  }

  if (mode === 'all' || mode === 'story') {
    console.log('\n\n📖 Mnemonic stories (English)…');
    for (const ch of HIRAGANA) {
      const story = STORIES[ch];
      if (!story) continue;
      const cp = ch.codePointAt(0).toString(16);
      await generate(story, VOICE_EN, join(OUT, 'story2', `${cp}.mp3`));
    }
  }

  if (mode === 'all' || mode === 'phrase') {
    console.log('\n\n💬 Phrases (Japanese)…');
    for (const [id, text] of PHRASES) {
      await generate(text, VOICE_JA, join(OUT, 'phrase', `${id}.mp3`));
    }
  }

  console.log('\n\n✅ Done! Commit public/audio/ to your repo.\n');
}

main().catch(e => { console.error('\n\n❌', e.message); process.exit(1); });
