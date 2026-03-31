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
]);

// Recognition-only types get no bonus (baseline)
// "kana-listen", "phrase-scenario", "phrase-listen", "kana-pair", "phrase-pair"

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
  // Use response time to distinguish Hard/Good/Easy instead of binary
  // Fast correct (<3s) = Easy(4), normal = Good(3), slow correct (>8s) = Hard(2), wrong = Again(1)
  let rating = 1; // Again (wrong)
  if (correct) {
    if (responseTime && responseTime < 3000) rating = 4;      // Easy — knew it instantly
    else if (responseTime && responseTime > 8000) rating = 2;  // Hard — got it but struggled
    else rating = 3;                                            // Good — normal recall
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
