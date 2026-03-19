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
const VOICE_EN = process.env.VOICE_EN || 'onwK4e9ZLuTAKqWW03F9'; // Daniel — clear English
const MODEL    = 'eleven_multilingual_v2';

// ── DATA ────────────────────────────────────────────────────────────────────

const HIRAGANA = ['あ','い','う','え','お','か','き','く','け','こ','さ','し','す','せ','そ','た','ち','つ','て','と','な','に','ぬ','ね','の','は','ひ','ふ','へ','ほ','ま','み','む','め','も','や','ゆ','よ','ら','り','る','れ','ろ','わ','を','ん'];
const KATAKANA = ['ア','イ','ウ','エ','オ','カ','キ','ク','ケ','コ','サ','シ','ス','セ','ソ','タ','チ','ツ','テ','ト','ナ','ニ','ヌ','ネ','ノ','ハ','ヒ','フ','ヘ','ホ','マ','ミ','ム','メ','モ','ヤ','ユ','ヨ','ラ','リ','ル','レ','ロ','ワ','ヲ','ン'];

const STORIES = {
  'あ': "Look at the character — there's a cross stroke at the top like the stem of an apple, and the looping body below is the round fruit hanging from it.",
  'い': "Two simple vertical strokes standing side by side — just like writing the letter i twice: i i. As simple as that.",
  'う': "A boxer just took a hit to the gut. The top stroke is the impact, and the curve swooping down is their body doubling over, groaning uu!",
  'え': "An energetic ninja mid-kick — the crossing strokes capture the dynamic, angular movement of a fighter in full action.",
  'お': "A surprised face with X eyes going oh! — or picture a UFO hovering with its distinctive saucer shape beneath a beam of light.",
  'か': "A blade slicing through a stick — the diagonal stroke is the sharp edge cutting down, the vertical line is the stick being split.",
  'き': "A key lying flat — the horizontal strokes are the teeth that unlock the door, and the vertical shaft runs through the middle.",
  'く': "A cuckoo opening its beak wide — the sharp angle of the stroke is exactly the shape of a beak calling out ku-koo!",
  'け': "A keg with a cane leaning against it — the first stroke is the walking cane propped up against the barrel shape of the keg.",
  'こ': "Two koi fish swimming side by side — the two horizontal lines are the sleek bodies of fish gliding through still water.",
  'さ': "A sly, sneaky grin — the crossing strokes form a crafty smirking face. Sa-neaky! You can almost see the raised eyebrow.",
  'し': "A fishing hook dropped into the water — the single swooping curve hangs down exactly like a hook waiting for a bite.",
  'す': "A straw caught in a spiral — the curling stroke twists around like a straw mid-su-piral, or curly Sue's distinctive hair.",
  'せ': "A sensei with their mouth open mid-sentence — the strokes suggest a face caught in the act of teaching, about to say something important.",
  'そ': "A sewing stitch passing through fabric — the crossing stroke looks like thread being pulled through, so neatly stitched.",
  'た': "Spot two hidden letters inside — the cross at the top makes a T, and the curve at the bottom forms an A. T plus A equals ta!",
  'ち': "A cheerleader throwing their arms up — the stroke resembles a 5, perfect for counting off cheer groups of five fans.",
  'つ': "A massive tsunami wave rolling in — the broad sweeping curve captures the enormous curling force of an ocean wave.",
  'て': "The letter T with a curling tail — the horizontal stroke is the crossbar of a T, and the end curls into a tail.",
  'と': "A tornado with a stalk sticking out at the top — the spiral spins at the base and that distinctive little stalk pokes out from the top.",
  'な': "A tangled knot of rope — the complex crossing strokes look like rope twisted up tight. Or think of X for nah, with a tongue stuck out defiantly.",
  'に': "A leg with a bent knee — the elongated left stroke is the thigh, and the right stroke is the lower leg bent at the knee joint.",
  'ぬ': "Noodles twirling on chopsticks — you can trace an n-shape at the left and a looping u on the right, like noodles being twirled around.",
  'ね': "A snail trailing behind a nail — that extra loop at the bottom is what separates ne from re. No loop equals re, loop equals ne.",
  'の': "The universal no sign — a single decisive swirl that combines n and o into one stroke. A spinning circle of refusal.",
  'は': "A capital H with a small hoop attached — notice it has one hoop at the right side, unlike ho which has two horizontal bars.",
  'ひ': "A huge grinning mouth laughing hihihi — the wide curved stroke spreads like lips pulled back in the biggest, silliest grin imaginable.",
  'ふ': "The silhouette of Mount Fuji — the upper strokes form the iconic peak, or picture someone blowing out a long breath: foooo.",
  'へ': "An arrow pointing straight up to heaven — the simple angled line rises to a peak like a directional sign pointing heavenward.",
  'ほ': "A horse face with a long mane — two horizontal bars make the face longer, like the elongated muzzle of a horse.",
  'ま': "A musical note floating on the staff — the strokes form a quaver note, perfect for music. Hum it to yourself.",
  'み': "Two quaver notes joined together — the strokes look like mi and mi connected, as in the musical scale: do-re-mi.",
  'む': "A cow turning to moo at you — the curling strokes suggest a round bovine face mid-moo, loud and proud.",
  'め': "A pretzel twisted into a mess — the crossing loop looks like a pretzel, as if chopsticks dropped noodles into a messy tangle.",
  'も': "A sailboat with two masts — the horizontal strokes are the sails catching wind, with the mast running straight through the middle.",
  'や': "A yak stretching its neck up high — the tall vertical stroke with the outstretched curve captures that long neck reaching up.",
  'ゆ': "A unicorn rearing up — the distinctive horn shape, or picture a finger pointing directly at you, the u-shape with a sharp point.",
  'よ': "A yo-yo mid-trick on its string — the descending loop looks exactly like a yo-yo spinning downward in a classic move.",
  'ら': "Rah rah rah! A cheerleader with arms thrown wide — like chi but spread out further, a cheerleader going all-in for the crowd.",
  'り': "A river flowing downhill — like i but the right stroke is longer and curves, like a river with one bank higher than the other.",
  'る': "A hand clutching a ruby — the loop at the bottom is the precious gem being gripped tightly in the palm.",
  'れ': "A reindeer seen in profile — trace the strokes and you'll find the distinctive head, neck and branching antler of a reindeer.",
  'ろ': "Rowing a boat on a river — like ru but the ruby got stolen, so the loop is gone. Ru got robbed, leaving just ro.",
  'わ': "A dog wagging its tail excitedly — the curved body stroke on the left and the little hooking tail on the right, mid-wag.",
  'を': "A dramatic crack splitting a wall — the complex strokes look like something went woah and split right through the brickwork.",
  'ん': "The simplest character of all — just like the letter n, a single flowing curve. Every Japanese sentence can end with this.",
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
  ['kana','story','phrase'].forEach(d => mkdirSync(join(OUT, d), { recursive: true }));

  console.log('\n🔤 Kana characters (Japanese)…');
  for (const ch of [...HIRAGANA, ...KATAKANA]) {
    const cp = ch.codePointAt(0).toString(16);
    await generate(ch, VOICE_JA, join(OUT, 'kana', `${cp}.mp3`));
  }

  console.log('\n\n📖 Mnemonic stories (English)…');
  for (const ch of HIRAGANA) {
    const story = STORIES[ch];
    if (!story) continue;
    const cp = ch.codePointAt(0).toString(16);
    await generate(story, VOICE_EN, join(OUT, 'story', `${cp}.mp3`));
  }

  console.log('\n\n💬 Phrases (Japanese)…');
  for (const [id, text] of PHRASES) {
    await generate(text, VOICE_JA, join(OUT, 'phrase', `${id}.mp3`));
  }

  console.log('\n\n✅ Done! Commit public/audio/ to your repo.\n');
}

main().catch(e => { console.error('\n\n❌', e.message); process.exit(1); });
