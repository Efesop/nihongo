#!/usr/bin/env node
/**
 * Pre-generate all TTS audio files using ElevenLabs.
 *
 * Usage:
 *   ELEVENLABS_API_KEY=your_key node scripts/generate-audio.mjs
 *
 * Modes (MODE env var):
 *   all        — kana + stories + phrases (default)
 *   kana       — kana characters only
 *   story      — mnemonic stories only
 *   phrase     — all 100 phrases (normal speed)
 *   slow       — all 100 phrases at 0.85x speed → public/audio/phrase-slow/
 *   test-voice — generate 5 sample phrases with 3 different native JP voices for comparison
 *   missing    — only generate phrases that don't have audio files yet
 *
 * Voice override: VOICE_JA=voiceId node scripts/generate-audio.mjs
 * Model override: MODEL=eleven_v3 node scripts/generate-audio.mjs
 *
 * Outputs to public/audio/{kana,story,phrase,phrase-slow}/
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
// Native Japanese voices — Tokyo/Kanto standard for clear pronunciation
const VOICES_JA = {
  konoha: 'T7yYq3WpB94yAuOXraRi',  // Female — premium clarity, natural rhythm
  akira:  'DOL4zlUH4vnnX1hByxsw',  // Male — smooth, captivating Tokyo standard
  fumi:   'PmgfHCGeS5b7sH90BOOJ',  // Female — clear, friendly, gentle warmth
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

// All 100 phrases — complete list
const PHRASES = [
  // Greetings (10)
  ['g1','こんにちは'],['g2','おはようございます'],['g3','こんばんは'],
  ['g4','ありがとうございます'],['g5','すみません'],['g6','はい'],
  ['g7','いいえ'],['g8','おねがいします'],['g9','だいじょうぶです'],
  ['g10','さようなら'],['g11','わたしのなまえは...です'],
  // Restaurants (10)
  ['f1','これをください'],['f2','おかんじょうおねがいします'],
  ['f3','みずをください'],['f4','おいしいです'],['f5','いただきます'],
  ['f6','ごちそうさまでした'],['f7','おすすめはなんですか'],
  ['f8','ひとりです'],['f9','ふたりです'],['f10','アレルギーがあります'],
  // Transport (8)
  ['t1','えきはどこですか'],['t2','までいくらですか'],
  ['t3','つぎのえきはなんですか'],['t4','のりかえはどこですか'],
  ['t5','までおねがいします'],['t6','ここでおろしてください'],
  ['t7','スイカ'],['t8','しゅうでんはなんじですか'],
  // Hotels (6)
  ['h1','チェックインおねがいします'],['h2','よやくがあります'],
  ['h3','チェックアウトはなんじですか'],['h4','WiFiのパスワードはなんですか'],
  ['h5','かぎ'],['h6','もういっぱくおねがいします'],
  // Shopping (7)
  ['s1','これはいくらですか'],['s2','ふくろはいらないです'],
  ['s3','カードでおねがいします'],['s4','げんきんでおねがいします'],
  ['s5','あたためますか'],['s6','これをふたつください'],['s7','レシートはいらないです'],
  // Directions (8)
  ['d1','はどこですか'],['d2','みぎ'],['d3','ひだり'],['d4','まっすぐ'],
  ['d5','ちかいですか'],['d6','あるいていけますか'],['d7','ちずをみせてください'],
  ['d8','トイレはどこですか'],
  // Emergencies (6)
  ['e1','たすけてください'],['e2','びょういんはどこですか'],
  ['e3','けいさつをよんでください'],['e4','えいごをはなせますか'],
  ['e5','にほんごがわかりません'],['e6','もういちどいってください'],
  // Numbers (13)
  ['n1','いち'],['n2','に'],['n3','さん'],['n4','よん'],['n5','ご'],
  ['n6','ろく'],['n7','なな'],['n8','はち'],['n9','きゅう'],['n10','じゅう'],
  ['n11','ひゃくえんです'],['n12','せんえんです'],['n13','なんじですか'],
  // Time & Days (10)
  ['tm1','きょう'],['tm2','あした'],['tm3','きのう'],
  ['tm4','いま'],['tm5','あとで'],['tm6','なんようびですか'],
  ['tm7','げつようび'],['tm8','あさ'],['tm9','よる'],['tm10','まいにち'],
  // Daily Life (12)
  ['dl1','たべたいです'],['dl2','のみたいです'],['dl3','いきたいです'],
  ['dl4','これがすきです'],['dl5','にほんごをべんきょうしています'],
  ['dl6','しごとはなんですか'],['dl7','どこからきましたか'],
  ['dl8','わかります'],['dl9','しゃしんをとってもいいですか'],
  ['dl10','たのしいです'],['dl11','つかれました'],['dl12','おなかがすきました'],
  // Describing (10)
  ['dc1','おおきい'],['dc2','ちいさい'],['dc3','たかい'],['dc4','やすい'],
  ['dc5','あつい'],['dc6','さむい'],['dc7','とおい'],['dc8','ちかい'],
  ['dc9','あたらしい'],['dc10','ふるい'],
];

// Subset for voice comparison tests
const TEST_PHRASES = [
  ['g1','こんにちは'],              // short greeting
  ['f2','おかんじょうおねがいします'],  // medium polite request
  ['t3','つぎのえきはなんですか'],     // question with particle chain
  ['dl5','にほんごをべんきょうしています'], // long compound sentence
  ['g4','ありがとうございます'],       // essential polite phrase
];

// ── API ─────────────────────────────────────────────────────────────────────

async function generate(text, voiceId, outPath, { isJapanese = false, speed = 1.0, force = false } = {}) {
  if (!force && existsSync(outPath)) { process.stdout.write('·'); return; }

  const body = {
    text,
    model_id: MODEL,
    voice_settings: {
      stability: 0.7,           // higher = clearer pronunciation
      similarity_boost: 0.8,
      style: 0.1,               // low = less stylistic, clearer for learning
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
  ['kana','story','story2','story3','phrase','phrase-slow'].forEach(d =>
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
  if (mode === 'all' || mode === 'phrase' || mode === 'missing') {
    console.log('\n\n💬 Phrases (Japanese, normal speed)…');
    for (const [id, text] of PHRASES) {
      const outPath = join(OUT, 'phrase', `${id}.mp3`);
      if (mode === 'missing' && existsSync(outPath)) { process.stdout.write('·'); continue; }
      await generate(text, VOICE_JA, outPath, { isJapanese: true });
    }
  }

  // ── PHRASES (slow speed for learning) ──
  if (mode === 'all' || mode === 'slow') {
    console.log('\n\n🐢 Phrases (Japanese, slow 0.85x)…');
    for (const [id, text] of PHRASES) {
      await generate(text, VOICE_JA, join(OUT, 'phrase-slow', `${id}.mp3`), { isJapanese: true, speed: 0.85 });
    }
  }

  console.log('\n\n✅ Done! Commit public/audio/ to your repo.\n');
}

main().catch(e => { console.error('\n\n❌', e.message); process.exit(1); });
