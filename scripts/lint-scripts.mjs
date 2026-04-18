#!/usr/bin/env node
/**
 * Lint scene + story scripts against the core curriculum.
 *
 * Every Japanese token used in scene lines or story sentences must be
 * either in CORE_VOCAB (derived from PHRASE_BREAKDOWNS) or explicitly
 * flagged in the scene's `newWords` array (≤4) / story's `newWords` (≤3).
 *
 * Tokenization strategy: each line in a scene must provide an optional
 * `tokens: [[jp,romaji,en,type], ...]` breakdown field (same shape as
 * PHRASE_BREAKDOWNS). If tokens omitted, lint falls back to naive
 * substring match against CORE_VOCAB (longest-first greedy) to extract
 * tokens automatically — imperfect but catches most violations.
 *
 * Run:  PATH="/usr/local/bin:$PATH" node scripts/lint-scripts.mjs
 * Exit code: 0 clean, 1 if any violations.
 */
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');

const { CORE_VOCAB_SET } = await import(join(ROOT, 'src/data/coreVocab.js'));

// Punctuation + whitespace to strip. Keep ー (katakana long vowel — part of words like ラーメン, ビール).
const STRIP_RE = /[。、！？!?…「」『』（）()\s　〜/・\.]/g;

// Common verb/adjective conjugation endings that can appear after any known root.
// These are grammar, not vocabulary — allow them freely.
const CONJ_SUFFIXES = [
  // Polite verb endings
  'ます', 'ました', 'ません', 'ませんでした', 'まして', 'ましょう',
  // Te-form + past (including geminate variants)
  'て', 'た', 'で', 'だ', 'って', 'った', 'いで', 'いだ', 'んで', 'んだ',
  // Negative
  'ない', 'なかった', 'なくて',
  // Potential / passive / causative
  'れる', 'られる', 'せる', 'させる', 'れ', 'られ', 'せ', 'させ',
  // Volitional
  'よう', 'おう', 'こう', 'そう', 'とう', 'もう', 'ろう',
  // Conditional
  'ば', 'たら', 'なら', 'ても', 'でも',
  // Desiderative
  'たい', 'たくない',
  // Adjective inflections
  'かった', 'くて', 'くない', 'く',
  // Casual / conversational
  'よ', 'ね', 'な', 'の', 'んだ', 'んです', 'んですか', 'かな', 'だろう', 'でしょう', 'でしょうか',
  // Honorific suffixes
  'さま', 'さん', 'ちゃん', 'くん',
  // Polite prefix (handled at tokenizer level — but listed here for reference)
];

const POLITE_PREFIXES = ['お', 'ご'];

// Characters allowed on their own (common particles / copula variants / short interjections).
const SINGLE_CHAR_OK = new Set([
  // Particles (single char)
  'は', 'を', 'が', 'に', 'で', 'と', 'や', 'も', 'か', 'ね', 'よ', 'の', 'な', 'ば',
  // Copula / te-form / etc.
  'だ', 'て', 'た', 'ず',
  // Interjections
  'あ', 'え', 'お', 'う', 'ん',
  // Numbers
  'し', 'じ', 'ま', 'い', 'ろ',
  // Direction kanji-alternate single chars
  'め',
]);

// All-katakana sequences are treated as proper nouns / loanwords — auto-allowed.
function isKatakana(s) {
  return /^[\u30A0-\u30FF・ー]+$/.test(s);
}

// Hiragana-only check for conjugation matching
function isHiragana(ch) {
  return /[\u3040-\u309F]/.test(ch);
}

function matchesAnyVocab(text, pos, sorted) {
  for (const v of sorted) if (text.startsWith(v, pos)) return v;
  // Try verb stem matching: if vocab contains X+る (ichidan) or X+u (godan),
  // accept the bare stem at this position (conjugation will follow).
  for (const v of sorted) {
    if (v.endsWith('る') && v.length >= 3) {
      const stem = v.slice(0, -1);
      if (text.startsWith(stem, pos) && stem.length >= 2) return stem;
    }
  }
  return null;
}

function matchesConjSuffix(text, pos) {
  // Try longest conjugation suffix first
  const sorted = [...CONJ_SUFFIXES].sort((a, b) => b.length - a.length);
  for (const s of sorted) if (text.startsWith(s, pos)) return s;
  return null;
}

// Greedy tokenizer with morphological awareness.
function tokenize(line, vocab) {
  const sorted = [...vocab].sort((a, b) => b.length - a.length);
  const text = line.replace(STRIP_RE, '');
  const unknowns = [];
  let i = 0;

  while (i < text.length) {
    // Try direct vocab match
    let matched = matchesAnyVocab(text, i, sorted);
    if (matched) { i += matched.length; continue; }

    // Try polite prefix + vocab match (お + word, ご + word)
    if (POLITE_PREFIXES.includes(text[i])) {
      const after = matchesAnyVocab(text, i + 1, sorted);
      if (after) { i += 1 + after.length; continue; }
    }

    // Try katakana run — treat as proper noun / loanword (allowed)
    if (/[\u30A0-\u30FF]/.test(text[i])) {
      let j = i;
      while (j < text.length && /[\u30A0-\u30FF・ー]/.test(text[j])) j++;
      if (j > i) { i = j; continue; }
    }

    // Try latin/digit run — proper nouns (WiFi, ATM, names)
    if (/[A-Za-z0-9]/.test(text[i])) {
      let j = i;
      while (j < text.length && /[A-Za-z0-9]/.test(text[j])) j++;
      if (j > i) { i = j; continue; }
    }

    // Single common char allowed
    if (SINGLE_CHAR_OK.has(text[i])) { i += 1; continue; }

    // Conjugation suffix alone (appears after a stem we already consumed)
    const conj = matchesConjSuffix(text, i);
    if (conj) { i += conj.length; continue; }

    // Unknown — collect run until we can resume
    let j = i + 1;
    while (j < text.length) {
      if (matchesAnyVocab(text, j, sorted)) break;
      if (POLITE_PREFIXES.includes(text[j]) && matchesAnyVocab(text, j + 1, sorted)) break;
      if (SINGLE_CHAR_OK.has(text[j])) break;
      if (matchesConjSuffix(text, j)) break;
      if (/[\u30A0-\u30FF]/.test(text[j])) break;
      j++;
    }
    const unk = text.slice(i, j);
    // Ignore very short unknowns (1-char hiragana that's likely part of a conjugation we couldn't parse)
    if (unk.length >= 2 || (unk.length === 1 && !isHiragana(unk))) {
      unknowns.push(unk);
    }
    i = j;
  }

  return { unknowns };
}

let violations = 0;

function lintLine(lineText, allowed, context) {
  const { unknowns } = tokenize(lineText, allowed);
  for (const unk of unknowns) {
    if (!unk) continue;
    console.error(`  ✗ ${context}: unknown "${unk}" in "${lineText}"`);
    violations++;
  }
}

// ── SCENES ──
try {
  const { SCENE_STUDIES } = await import(join(ROOT, 'src/data/sceneStudies.js'));
  console.log(`\n🎬 Linting ${SCENE_STUDIES.length} scenes…`);
  for (const sc of SCENE_STUDIES) {
    if (sc.newWords && sc.newWords.length > 4) {
      console.error(`  ✗ scene ${sc.id}: newWords length ${sc.newWords.length} exceeds max 4`);
      violations++;
    }
    const allowed = new Set([...CORE_VOCAB_SET, ...(sc.newWords || []).map(w => w.jp)]);
    for (let i = 0; i < sc.lines.length; i++) {
      lintLine(sc.lines[i].jp, allowed, `${sc.id} line ${i + 1}`);
    }
  }
} catch (e) {
  if (!String(e.message).includes('Cannot find module')) throw e;
  console.log('  · sceneStudies.js not found yet — skipping scene lint');
}

// ── STORIES ──
try {
  const { GRADED_STORIES } = await import(join(ROOT, 'src/data/gradedStories.js'));
  // Only lint stories that opt in via `curriculumLocked: true` so legacy gs1-gs6 aren't retroactively rejected
  const locked = GRADED_STORIES.filter(gs => gs.curriculumLocked);
  console.log(`\n📚 Linting ${locked.length} curriculum-locked stories…`);
  for (const gs of locked) {
    if (gs.newWords && gs.newWords.length > 3) {
      console.error(`  ✗ story ${gs.id}: newWords length ${gs.newWords.length} exceeds max 3`);
      violations++;
    }
    const allowed = new Set([...CORE_VOCAB_SET, ...(gs.newWords || []).map(w => w.jp)]);
    for (let i = 0; i < gs.sentences.length; i++) {
      const s = gs.sentences[i];
      const jp = s.jp.replace(/[（(][^）)]*[）)]/g, '').replace(/\s+/g, '').trim();
      if (!jp) continue;
      lintLine(jp, allowed, `${gs.id} sentence ${i + 1}`);
    }
  }
} catch (e) {
  if (!String(e.message).includes('Cannot find module')) throw e;
  console.log('  · gradedStories.js not found yet — skipping story lint');
}

if (violations === 0) {
  console.log('\n✅ All scripts stay within the curriculum.\n');
  process.exit(0);
} else {
  console.error(`\n❌ ${violations} violation(s). Add missing tokens to newWords or rewrite lines.\n`);
  process.exit(1);
}
