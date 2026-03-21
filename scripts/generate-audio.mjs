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

const HIRAGANA = ['あ','い','う','え','お','か','き','く','け','こ','さ','し','す','せ','そ','た','ち','つ','て','と','な','に','ぬ','ね','の','は','ひ','ふ','へ','ほ','ま','み','む','め','も','や','ゆ','よ','ら','り','る','れ','ろ','わ','を','ん','が','ぎ','ぐ','げ','ご','ざ','じ','ず','ぜ','ぞ','だ','ぢ','づ','で','ど','ば','び','ぶ','べ','ぼ','ぱ','ぴ','ぷ','ぺ','ぽ'];
const KATAKANA = ['ア','イ','ウ','エ','オ','カ','キ','ク','ケ','コ','サ','シ','ス','セ','ソ','タ','チ','ツ','テ','ト','ナ','ニ','ヌ','ネ','ノ','ハ','ヒ','フ','ヘ','ホ','マ','ミ','ム','メ','モ','ヤ','ユ','ヨ','ラ','リ','ル','レ','ロ','ワ','ヲ','ン','ガ','ギ','グ','ゲ','ゴ','ザ','ジ','ズ','ゼ','ゾ','ダ','ヂ','ヅ','デ','ド','バ','ビ','ブ','ベ','ボ','パ','ピ','プ','ペ','ポ'];

const STORIES = {
  'あ': "The cross stroke at the top is the stem of an apple, and the loop below is the round fruit hanging from it.",
  'い': "Two simple strokes side by side — just like writing lowercase i twice.",
  'う': "A boxer just took a hit to the gut, body curving down as they double over.",
  'え': "Eh — a ninja caught mid-kick, those crossing strokes are arms and legs flying.",
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
  'ら': "A lasso looping through the air — that wide sweeping curve, ready to catch.",
  'り': "Two strokes, but the right one is longer and curves — one riverbank higher than the other.",
  'る': "A hand gripping a precious gem — the loop at the bottom is the ruby held tight in the palm.",
  'れ': "Trace the strokes and you'll find a reindeer — head, neck, branching antler.",
  'ろ': "Just like ru, but the loop at the bottom is gone — the ruby got stolen.",
  'わ': "A happy dog mid-wag — curved body on the left, little hooking tail on the right.",
  'を': "Something cracked clean through a wall — those complex strokes are the drama of that split.",
  'ん': "One simple flowing curve, just like the letter n — the simplest character in the whole alphabet.",
  // Katakana
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

async function generate(text, voiceId, outPath, isJapanese = false) {
  if (existsSync(outPath)) { process.stdout.write('·'); return; }

  const body = {
    text,
    model_id: MODEL,
    voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.2 },
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

  await new Promise(r => setTimeout(r, 350)); // ~3 req/s — safe for free tier
}

// ── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  ['kana','story','story2','story3','phrase'].forEach(d => mkdirSync(join(OUT, d), { recursive: true }));

  const mode = process.env.MODE || 'all';

  if (mode === 'all' || mode === 'kana') {
    console.log('\n🔤 Kana characters (Japanese)…');
    for (const ch of [...HIRAGANA, ...KATAKANA]) {
      const cp = ch.codePointAt(0).toString(16);
      await generate(ch, VOICE_JA, join(OUT, 'kana', `${cp}.mp3`), true);
    }
  }

  if (mode === 'kana2') {
    console.log('\n🔤 Kana characters v2 (Japanese, with language_code)…');
    mkdirSync(join(OUT, 'kana2'), { recursive: true });
    for (const ch of [...HIRAGANA, ...KATAKANA]) {
      const cp = ch.codePointAt(0).toString(16);
      await generate(ch, VOICE_JA, join(OUT, 'kana2', `${cp}.mp3`), true);
    }
  }

  if (mode === 'all' || mode === 'story') {
    console.log('\n\n📖 Mnemonic stories (English)…');
    for (const ch of [...HIRAGANA, ...KATAKANA]) {
      const story = STORIES[ch];
      if (!story) continue;
      const cp = ch.codePointAt(0).toString(16);
      await generate(story, VOICE_EN, join(OUT, 'story3', `${cp}.mp3`));
    }
  }

  if (mode === 'all' || mode === 'phrase') {
    console.log('\n\n💬 Phrases (Japanese)…');
    for (const [id, text] of PHRASES) {
      await generate(text, VOICE_JA, join(OUT, 'phrase', `${id}.mp3`), true);
    }
  }

  console.log('\n\n✅ Done! Commit public/audio/ to your repo.\n');
}

main().catch(e => { console.error('\n\n❌', e.message); process.exit(1); });
