/**
 * FSRS-5 — Free Spaced Repetition Scheduler
 * Adapts review intervals to each user's personal forgetting curve.
 * Based on: https://github.com/open-spaced-repetition/fsrs4anki
 *
 * Key concepts:
 * - Stability (S): how long until 90% retention drops to target
 * - Difficulty (D): how hard the item is for this user (1-10)
 * - Retrievability (R): current probability of recall
 *
 * Simplified implementation for TinySenpai — uses the core FSRS math
 * but stores data in our existing box/next format for compatibility.
 */

const DEFAULT_PARAMS = {
  w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61],
  requestRetention: 0.85, // Target 85% retention
};

/**
 * Calculate initial stability based on rating
 * Rating: 1=Again, 2=Hard, 3=Good, 4=Easy
 */
function initStability(rating, w = DEFAULT_PARAMS.w) {
  return Math.max(w[rating - 1], 0.1);
}

/**
 * Calculate initial difficulty based on rating
 */
function initDifficulty(rating, w = DEFAULT_PARAMS.w) {
  return Math.min(Math.max(w[4] - Math.exp(w[5] * (rating - 1)) + 1, 1), 10);
}

/**
 * Calculate next stability after review
 */
function nextStability(d, s, r, rating, w = DEFAULT_PARAMS.w) {
  if (rating === 1) {
    // Lapse — stability decreases
    return Math.max(
      w[11] * Math.pow(d, -w[12]) * (Math.pow(s + 1, w[13]) - 1) * Math.exp((1 - r) * w[14]),
      0.1
    );
  }
  // Success — stability increases
  const hardPenalty = rating === 2 ? w[15] : 1;
  const easyBonus = rating === 4 ? w[16] : 1;
  return s * (
    1 + Math.exp(w[8]) * (11 - d) * Math.pow(s, -w[9]) *
    (Math.exp((1 - r) * w[10]) - 1) * hardPenalty * easyBonus
  );
}

/**
 * Calculate next difficulty after review
 */
function nextDifficulty(d, rating, w = DEFAULT_PARAMS.w) {
  const newD = d - w[6] * (rating - 3);
  // Mean reversion
  return Math.min(Math.max(w[7] * initDifficulty(4, w) + (1 - w[7]) * newD, 1), 10);
}

/**
 * Calculate retrievability (probability of recall) given elapsed time
 */
function retrievability(stability, elapsedDays) {
  return Math.pow(1 + elapsedDays / (9 * stability), -1);
}

/**
 * Calculate next review interval for target retention
 */
function nextInterval(stability, requestRetention = DEFAULT_PARAMS.requestRetention) {
  return Math.max(Math.round(9 * stability * (1 / requestRetention - 1)), 1);
}

// Exercise types that require production (harder recall = stronger evidence of learning)
// Research: Smith & Karpicke 2014 — production recall creates stronger memory traces than recognition
const PRODUCTION_TYPES = new Set([
  "kana-visual",      // free-text typing
  "kana-reverse",     // see romaji, pick character
  "phrase-reverse",   // see English, pick Japanese
  "phrase-production", // English → pick from 8 Japanese
  "phrase-build",     // fill in missing segment
  "pattern-assembly", // construct sentence from pieces (highest production)
  "phrase-kana-type", // spell phrase with kana keyboard
  "phrase-shadow",    // speak the phrase out loud (highest production)
]);

// Recognition-only types get no bonus (baseline)
// "kana-listen", "phrase-scenario", "phrase-listen", "kana-pair", "phrase-pair"

// Multiple-choice exercises where a fast-correct could plausibly be a guess
// from a small option pool. We DENY the Easy bonus on these — fast-correct on
// MCQ caps at Good (rating 3) instead of Easy (rating 4) so a 1-second lucky
// pick from 3-4 options doesn't inflate stability the way confident free-recall does.
// Production-typed (free input) exercises are NOT in this set — those can't be guessed.
const MCQ_TYPES = new Set([
  "phrase-listen",     // hear → pick EN meaning
  "phrase-scenario",   // context → pick JP from 4
  "phrase-pair",       // confused-pair discrimination
  "phrase-reverse",    // see EN, pick JP from 4 — small pool, guessable
  "phrase-dj",         // remix quiz — 4 JP choices
  "kana-listen",       // hear → pick romaji from set
  "kana-pair",         // confused kana discrimination
  "word-quiz",         // word → meaning multiple choice
  "conversation",      // dialogue blanks pulled from a small option pool
  "scene-quick-check", // scene comprehension check (3-option)
  "try-first-phrase",  // 4-choice productive-failure probe
  "try-first-kana",    // kana productive-failure probe
  "learn-phrase",      // intro card's quick-check (1 of N choices)
]);

/**
 * Main function: calculate next review timing
 *
 * @param {object} itemData - { stability, difficulty, lastReview } or null for new item
 * @param {boolean} correct - whether the user got it right
 * @param {number} responseTime - ms taken to answer (optional, for future use)
 * @param {string} exerciseType - the exercise type (for production weighting)
 * @returns {object} { stability, difficulty, nextMs, intervalDays }
 */
export function fsrsUpdate(itemData, correct, responseTime = null, exerciseType = null) {
  const now = Date.now();
  // Rating from response time:
  //   wrong          → 1 (Again)
  //   fast correct   → 4 (Easy)  — knew it instantly
  //   normal correct → 3 (Good)
  //   slow correct   → 2 (Hard)  — got it but struggled (>8s)
  // Guess guard: on MCQ-style exercises a 1-second correct pick is plausibly
  // a guess from a small pool. Cap MCQ fast-correct at Good (3) — Easy bonus
  // is reserved for free-recall / production exercises where you can't guess.
  const isMcq = exerciseType && MCQ_TYPES.has(exerciseType);
  let rating = 1;
  if (correct) {
    if (responseTime && responseTime < 3000 && !isMcq) rating = 4;     // Easy
    else if (responseTime && responseTime > 8000) rating = 2;          // Hard
    else rating = 3;                                                    // Good
  }

  // Production bonus: correct answers on harder exercise types earn more stability
  // This means the same item reviewed via production advances faster through SRS
  const isProduction = exerciseType && PRODUCTION_TYPES.has(exerciseType);
  const productionBonus = (correct && isProduction) ? 1.15 : 1.0; // 15% stability boost

  if (!itemData || !itemData.stability) {
    // New item — first review
    const s = initStability(rating) * productionBonus;
    const d = initDifficulty(rating);
    const interval = nextInterval(s);
    return {
      stability: s,
      difficulty: d,
      nextMs: now + interval * 864e5,
      intervalDays: interval,
    };
  }

  // Existing item — calculate elapsed time
  const elapsedDays = (now - (itemData.lastReview || now)) / 864e5;
  const r = retrievability(itemData.stability, elapsedDays);

  const newS = nextStability(itemData.difficulty, itemData.stability, r, rating) * productionBonus;
  const newD = nextDifficulty(itemData.difficulty, rating);
  const interval = nextInterval(newS);

  return {
    stability: newS,
    difficulty: newD,
    nextMs: now + interval * 864e5,
    intervalDays: interval,
  };
}

/**
 * Convert FSRS data to our existing box format for backward compatibility
 * Maps stability to approximate box level (0-5)
 */
export function stabilityToBox(stability) {
  // Minimum box 1 for any reviewed item — box 0 is reserved for truly unseen
  // items. Returning 0 here caused items to become invisible to the due filter.
  if (stability < 0.5) return 1;
  if (stability < 1.5) return 1;
  if (stability < 4) return 2;
  if (stability < 10) return 3;
  if (stability < 25) return 4;
  return 5;
}

/**
 * Skill-based box ceiling — the anti-illusion-of-fluency gate.
 *
 * FSRS stability alone can push an item to box 4 or 5 from visual-recognition
 * alone (tap right answer from 4 MCQ options). But being able to RECOGNIZE a
 * phrase in a list ≠ being able to PRODUCE it cold or parse it when HEARD.
 * Tulving's encoding specificity + Karpicke & Roediger (2008): retrieval
 * pathways are mode-specific — recognition-only memory doesn't transfer to
 * production.
 *
 * This helper caps the box value so no item reaches "mastered" status unless
 * the learner has demonstrated recall across multiple skill dimensions.
 *
 *   box ≥ 3 requires: visual ≥ 1
 *   box ≥ 4 requires: visual ≥ 2 AND listen ≥ 1
 *   box 5   requires: visual ≥ 2 AND listen ≥ 1 AND production ≥ 2
 *
 * Skills are tracked in App.jsx's reviewPhr/updateKanaSRS. They increment
 * +1 per correct, clamp 0-5. This gate reads, never writes.
 *
 * @param {number} box — proposed box from stabilityToBox
 * @param {{visual?: number, listen?: number, production?: number}} skills — per-item counters
 * @returns {number} — capped box (never exceeds input box)
 */
export function capBoxBySkills(box, skills) {
  if (!skills) return Math.min(box, 2);
  const v = skills.visual || 0;
  const l = skills.listen || 0;
  const p = skills.production || 0;
  // Box 5 ("mastered") now requires real production proof — production ≥ 3
  // means at least three successful free-recall / typed / picked-from-8 attempts.
  // Previous rule (p ≥ 2) was too lenient and let MCQ-only items climb to box 5.
  if (v >= 2 && l >= 1 && p >= 3) return box;                // box 5 OK
  if (v >= 2 && l >= 1 && p >= 1) return Math.min(box, 4);   // cap at box 4 — needs at least 1 production
  if (v >= 1 && (l >= 1 || p >= 1)) return Math.min(box, 3); // cap at box 3
  return Math.min(box, 2);                                   // cap at box 2 — recognition only
}

/**
 * One-time normalization: re-apply skill-based box caps to every existing item.
 * Items that climbed to box 4-5 before the cap rule was tightened (or before
 * skills tracking was reliable) get demoted to the level their skill profile
 * actually justifies. Idempotent — safe to call multiple times.
 *
 * Returns { phr, kana, capped } — new phr/kana objects with capped box values
 * and a count of how many items were demoted.
 */
export function normalizeBoxesBySkills(data) {
  const skills = data?.skills || {};
  let capped = 0;
  const reCap = (items) => {
    const out = {};
    for (const id of Object.keys(items || {})) {
      const item = items[id];
      const oldBox = item?.box ?? 0;
      const newBox = capBoxBySkills(oldBox, skills[id]);
      if (newBox !== oldBox) capped++;
      out[id] = { ...item, box: newBox };
    }
    return out;
  };
  return {
    phr: reCap(data?.phr),
    kana: reCap(data?.kana),
    capped,
  };
}
