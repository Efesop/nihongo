import { M, H_GROUPS, K_GROUPS, ROMAJI, DAKUTEN_BASE, YOON_PARTS } from "../data/kana.js";
import { PHRASES, CATS, CAT_ICONS, CAT_COLORS } from "../data/phrases.js";
import { SRS_DAYS } from "../data/constants.js";
import { shuffle } from "./helpers.js";

// All base kana (no dakuten/yōon for now — keep it simpler)
const ALL_BASE_KANA = [...H_GROUPS, ...K_GROUPS]
  .filter(g => !g.dk && !g.yo)
  .flatMap(g => g.c);

/**
 * Build an adaptive smart session based on user's SRS data.
 * Returns an array of exercise cards.
 */
export function buildSmartSession(data, sessionLength = 10, difficultyMod = 0) {
  const queue = [];
  const now = Date.now();
  const kanaData = data.kana || {};
  const phrData = data.phr || {};

  // ═══ GATHER ITEMS BY PRIORITY ═══

  // 1. Due for review (highest priority)
  const dueKana = ALL_BASE_KANA.filter(ch => {
    const d = kanaData[ch];
    return d && d.box >= 1 && now >= (d.next || 0);
  });

  const duePhrases = PHRASES.filter(p => {
    const d = phrData[p[0]];
    return d && d.box >= 1 && now >= (d.next || 0);
  });

  // 2. Struggling (box 1-2, learning but not mastered)
  const strugglingKana = ALL_BASE_KANA.filter(ch => {
    const box = kanaData[ch]?.box || 0;
    return box >= 1 && box <= 2;
  });

  const strugglingPhrases = PHRASES.filter(p => {
    const box = phrData[p[0]]?.box || 0;
    return box >= 1 && box <= 2;
  });

  // 3. New items (never seen)
  const unseenKana = ALL_BASE_KANA.filter(ch => !kanaData[ch] && M[ch]);
  const unseenPhrases = PHRASES.filter(p => !phrData[p[0]]);

  // ═══ PICK EXERCISE TYPE BASED ON MASTERY ═══

  function kanaExercise(ch) {
    const box = kanaData[ch]?.box || 0;
    const adjusted = box + difficultyMod;
    // Mostly visual, listen only at higher mastery (20% chance)
    if (adjusted <= 2) return { type: "kana-visual", item: ch, romaji: ROMAJI[ch] };
    return Math.random() > 0.8
      ? { type: "kana-listen", item: ch, romaji: ROMAJI[ch] }
      : { type: "kana-visual", item: ch, romaji: ROMAJI[ch] };
  }

  function phraseExercise(p) {
    const box = phrData[p[0]]?.box || 0;
    const adjusted = box + difficultyMod;
    const r = Math.random();
    if (adjusted <= 0) return { type: "phrase-scenario", item: p };
    if (adjusted <= 1) return r > 0.6 ? { type: "phrase-listen", item: p } : { type: "phrase-scenario", item: p };
    if (adjusted <= 2) {
      if (r > 0.7) return { type: "phrase-production", item: p };
      if (r > 0.4) return { type: "phrase-listen", item: p };
      return { type: "phrase-scenario", item: p };
    }
    // Mastered — harder exercises
    if (r > 0.5) return { type: "phrase-production", item: p };
    return { type: "phrase-listen", item: p };
  }

  function learnCard(ch) {
    return { type: "learn-card", item: ch, romaji: ROMAJI[ch], mnemonic: M[ch] };
  }

  function learnPhraseCard(p) {
    return { type: "learn-phrase", item: p };
  }

  // ═══ BUILD THE QUEUE ═══

  // Start with 1-2 easy wins (due items the user probably knows)
  const easyWins = shuffle(dueKana.filter(ch => (kanaData[ch]?.box || 0) >= 3)).slice(0, 2);
  easyWins.forEach(ch => queue.push(kanaExercise(ch)));

  // Add due items (mixed kana + phrases)
  const duePool = [
    ...shuffle(dueKana.filter(ch => !easyWins.includes(ch))).slice(0, 4).map(ch => kanaExercise(ch)),
    ...shuffle(duePhrases).slice(0, 3).map(p => phraseExercise(p)),
  ];
  shuffle(duePool).forEach(ex => queue.push(ex));

  // Add struggling items
  const strugglePool = [
    ...shuffle(strugglingKana).slice(0, 2).map(ch => kanaExercise(ch)),
    ...shuffle(strugglingPhrases).slice(0, 1).map(p => phraseExercise(p)),
  ];
  shuffle(strugglePool).forEach(ex => queue.push(ex));

  // Add new content (learn cards, not quizzes)
  if (unseenKana.length > 0 && queue.length < sessionLength - 1) {
    const newKana = unseenKana.slice(0, 2);
    newKana.forEach(ch => queue.push(learnCard(ch)));
  }
  if (unseenPhrases.length > 0 && queue.length < sessionLength) {
    queue.push(learnPhraseCard(unseenPhrases[0]));
  }

  // Fill remaining slots with more due/struggling items if available
  while (queue.length < sessionLength) {
    const remaining = [
      ...shuffle(dueKana).slice(0, 2).map(ch => kanaExercise(ch)),
      ...shuffle(duePhrases).slice(0, 2).map(p => phraseExercise(p)),
      ...shuffle(strugglingKana).slice(0, 1).map(ch => kanaExercise(ch)),
    ];
    if (remaining.length === 0) break;
    queue.push(remaining[0]);
    if (queue.length >= sessionLength) break;
  }

  // If still too few (brand new user), add learn cards
  while (queue.length < Math.min(sessionLength, 5) && unseenKana.length > queue.length) {
    const idx = queue.filter(q => q.type === "learn-card").length;
    if (idx < unseenKana.length) {
      queue.push(learnCard(unseenKana[idx]));
    } else break;
  }

  // Trim to session length
  return queue.slice(0, sessionLength);
}

/**
 * Get a session summary description for the home page button
 */
export function getSessionSummary(data) {
  const now = Date.now();
  const kanaData = data.kana || {};
  const phrData = data.phr || {};
  const dueKana = ALL_BASE_KANA.filter(ch => {
    const d = kanaData[ch];
    return d && d.box >= 1 && now >= (d.next || 0);
  }).length;

  const duePhrases = PHRASES.filter(p => {
    const d = phrData[p[0]];
    return d && d.box >= 1 && now >= (d.next || 0);
  }).length;

  const unseenKana = ALL_BASE_KANA.filter(ch => !kanaData[ch] && M[ch]).length;
  const unseenPhrases = PHRASES.filter(p => !phrData[p[0]]).length;

  const parts = [];
  if (dueKana > 0) parts.push(`${dueKana} kana review`);
  if (duePhrases > 0) parts.push(`${duePhrases} phrase review`);
  if (unseenKana > 0) parts.push(`new characters`);
  if (unseenPhrases > 0) parts.push(`new phrases`);
  if (parts.length === 0) parts.push("practice session");

  return parts.join(" + ");
}

/**
 * Fuzzy match romaji input for phrase production mode
 */
export function matchRomaji(input, target) {
  const normalize = s => s.toLowerCase()
    .replace(/[\s\-\.]/g, "")
    .replace(/si/g, "shi")
    .replace(/ti/g, "chi")
    .replace(/tu/g, "tsu")
    .replace(/hu/g, "fu")
    .replace(/sy/g, "sh")
    .replace(/ty/g, "ch")
    .replace(/wo/g, "o")
    .replace(/du/g, "zu")
    .replace(/di/g, "ji");

  return normalize(input) === normalize(target);
}

/**
 * Get distractors for multiple choice (phrases from different category preferred)
 */
export function getDistractors(correct, count = 3) {
  const sameCat = PHRASES.filter(p => p[4] === correct[4] && p[0] !== correct[0]);
  const others = PHRASES.filter(p => p[4] !== correct[4] && p[0] !== correct[0]);
  return shuffle([...sameCat, ...others]).slice(0, count);
}
