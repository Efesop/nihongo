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
  'あ': "Ah — that's the sound. Like when you bite into a crispy apple and just go... ah. Look at the character: a cross stroke at the top, that's the stem, and the looping shape below is the round fruit hanging from it. Ah. Apple. A.",
  'い': "Say ee — like you're grinning for a photo. Now look at the character: two simple vertical strokes standing side by side, just like writing lowercase i twice. i... i. That's it. Ee.",
  'う': "Oo — like you just took a hit to the gut. A boxer doubles over, groaning oo! The top stroke is the impact, and the curve swooping down is the body folding. Oo. U.",
  'え': "Eh? A ninja just flew past mid-kick — that surprised eh sound. The crossing strokes look exactly like a fighter caught in full motion, arms and legs everywhere. Eh. E.",
  'お': "Oh! A UFO just appeared overhead. That's the sound — oh. Look at the character: a saucer shape with a beam of light, and a face below with X eyes, mouth wide open. Oh. O.",
  'か': "Kah — a blade slices clean through a stick. That sharp crack: kah. The diagonal stroke is the blade coming down hard, the vertical line is the stick being split in two. Ka.",
  'き': "Kee — key. Say it: kee, key. The character looks just like a key lying flat — horizontal teeth along the top, a shaft running through the middle. Ki. Key.",
  'く': "Ku — like a cuckoo clock going ku-koo! The character is that beak, wide open mid-call. One sharp angled stroke, exactly the shape of a bird's mouth crying out. Ku.",
  'け': "Ke — keg. A walking cane leaning against a barrel, making that wooden knock: ke. The first stroke is the cane, the rest is the keg it's propped up against. Ke.",
  'こ': "Ko — koi. Two horizontal lines, two koi fish gliding side by side through perfectly still water. Ko. Koi. Just those two calm parallel lines. Ko.",
  'さ': "Sa — sneaky. Picture that sly grin someone pulls when they know something you don't. The crossing strokes form a crafty smirking face. Sa-neaky. Sa.",
  'し': "Shi — that shh sound, like being quiet by the water. One single swooping curve, hanging down just like a fishing hook dropped into the still water. Shh... waiting. Shi.",
  'す': "Su — like a straw being pulled into a swirl. The stroke curls around itself, caught in a su-piral. Or think of curly Sue, her hair looping round. Su.",
  'せ': "Se — sensei. Your teacher mid-sentence, mouth open, about to say something — se. The strokes suggest that open face, caught in the act of speaking. Se.",
  'そ': "So — sewing. Thread being pulled through fabric in one neat crossing stroke. So. Sew. So. Like a quiet rhythm: so, sew, so.",
  'た': "Ta — look closely and you'll find two hidden letters. The cross at the top is a T. The curve at the bottom is an A. T plus A: ta! Right there in the character. Ta.",
  'ち': "Chi — cheer! A cheerleader throws their arms up wide. The character looks like a five — chi, cheer, five fingers raised. Chi!",
  'つ': "Tsu — tsunami. One enormous sweeping curve, the whole ocean bending over on itself about to crash. Tsu. Tsunami.",
  'て': "Te — tail. A letter T with a little curling tail on the end. The crossbar, then it sweeps down and curls — like a cat flicking its te-il. Te.",
  'と': "To — tornado. A spiral at the base, and sticking out of the very top — a little stalk. That detail makes it to. To. Tornado.",
  'な': "Na — knot. All those crossing strokes tangled up tight like rope. Or picture someone going nah — shaking their head, tongue out. Na.",
  'に': "Ni — knee. Look at the character: a long stroke for the thigh, then a right stroke bent at the joint. There's the leg. There's the knee. Ni.",
  'ぬ': "Nu — noodles. Trace the character: an N shape on the left, a looping U on the right, like noodles being twisted round and round on chopsticks. Nu. Noodles.",
  'ね': "Ne — nail with a snail trailing behind it. Spot that loop at the bottom — that's the snail, and it's what makes this ne and not re. No loop: re. Loop: ne.",
  'の': "No — and it literally looks like no. One decisive swirl, N and O spinning into a single stroke. A circle of refusal. No.",
  'は': "Ha — a capital H with a little hoop on the right side. Ha! One hoop means ha. Two horizontal bars means ho. Ha.",
  'ひ': "Hee hee hee — that big silly laugh you can't stop. The stroke is a wide curved mouth, lips pulled right back in the most ridiculous grin. Hee. Hi.",
  'ふ': "Fu — Fuji. The character is the silhouette of Mount Fuji itself, that famous peak. Or just blow out slowly: foooo. Fu.",
  'へ': "He — heaven. One simple angled line, rising to a peak, pointing straight up like an arrow aimed at the sky. He.",
  'ほ': "Ho — horse. Two horizontal bars making a long face — longer than ha, like a horse's elongated muzzle. Ho ho ho, even. Ho.",
  'ま': "Ma — music. The strokes form a perfect quaver note floating on a staff. Go on, hum something: ma. Music. Ma.",
  'み': "Mi — do re mi. Two quaver notes joined side by side. Do re mi — the third note, and this character looks just like two of them linked together. Mi.",
  'む': "Mu — moo. A cow turning to look right at you, mid-moo. The curling strokes form that round bovine face. Moo. Mu. Same thing, basically. Mu.",
  'め': "Me — mess. A pretzel, all twisted and tangled. Or noodles dropped from chopsticks into a chaotic loop. Me. What a me-ss. Me.",
  'も': "Mo — mast. A sailboat with two horizontal sails catching the wind, the mast running clean through the middle. Mo. More wind. Mo.",
  'や': "Ya — yak. A yak stretching its long neck way up high — yaaa. The tall vertical stroke with the outstretched curve captures that neck reaching up. Ya.",
  'ゆ': "Yu — unicorn. That distinctive horn rearing up, or a finger pointing right at YOU. The U shape with a sharp point aimed at the sky. Yu.",
  'よ': "Yo — yo-yo. The descending loop looks exactly like a yo-yo spinning downward on its string, mid-trick. Yo.",
  'ら': "Ra — rah rah rah! A cheerleader with arms thrown wide open, going all in for the crowd. Like chi but bigger, more spread out. Ra!",
  'り': "Ri — river. Two strokes but the right one is longer and curves, one bank higher than the other. A river flowing downhill. Ri.",
  'る': "Ru — ruby. A hand gripping a precious stone, the loop at the bottom is the gem held tight in the palm. Ru. Ruby.",
  'れ': "Re — reindeer. Trace the character and you'll find it: the head, the neck, the branching antler. Re. Reindeer.",
  'ろ': "Ro — rowing. Just like ru but the loop is gone — the ruby got stolen. Ru got robbed. What's left is ro. Row the boat. Ro.",
  'わ': "Wa — wag. A happy dog, tail going. The curved body on the left, the little hooking tail on the right, mid-wag. Wa.",
  'を': "Wo — woah. Something just cracked right through a wall. Those complex strokes are the drama of it — the split, the impact. Wo. Woah. Wo.",
  'ん': "N. That's it. One flowing curve, just like the letter n. The simplest character in Japanese, and it can end almost any word. N.",
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
