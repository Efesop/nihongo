import { M, H_GROUPS, K_GROUPS, ROMAJI, DAKUTEN_BASE, YOON_PARTS } from "../data/kana.js";
import { PHRASES, CATS, CAT_ICONS, CAT_COLORS } from "../data/phrases.js";
import { SRS_DAYS } from "../data/constants.js";
import { shuffle } from "./helpers.js";
import { CONVERSATIONS } from "../data/conversations.js";

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

  // 2. Struggling (box 1-2 AND due — don't repeat items just answered)
  const strugglingKana = ALL_BASE_KANA.filter(ch => {
    const d = kanaData[ch];
    return d && d.box >= 1 && d.box <= 2 && now >= (d.next || 0);
  });

  const strugglingPhrases = PHRASES.filter(p => {
    const d = phrData[p[0]];
    return d && d.box >= 1 && d.box <= 2 && now >= (d.next || 0);
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

  // How much kana does the user know?
  const kanaLearned = ALL_BASE_KANA.filter(ch => (kanaData[ch]?.box || 0) >= 1).length;

  // If user knows very few kana, focus on teaching kana first
  if (kanaLearned < 10) {
    // Beginner: all learn cards, introduce 5 vowels first, then K row
    const toTeach = unseenKana.slice(0, Math.min(sessionLength, 8));
    toTeach.forEach(ch => queue.push(learnCard(ch)));
    // Add 1-2 quizzes on any they've already seen
    const reviewable = ALL_BASE_KANA.filter(ch => (kanaData[ch]?.box || 0) >= 1);
    shuffle(reviewable).slice(0, 2).forEach(ch => queue.push(kanaExercise(ch)));
    return queue.slice(0, sessionLength);
  }

  // If user knows kana but no phrases yet, mix in phrase introductions
  if (kanaLearned >= 10 && Object.keys(phrData).length === 0) {
    // Ready for phrases — add kana review + phrase learn cards
    shuffle(dueKana).slice(0, 4).forEach(ch => queue.push(kanaExercise(ch)));
    unseenPhrases.slice(0, 3).forEach(p => queue.push(learnPhraseCard(p)));
    shuffle(ALL_BASE_KANA.filter(ch => (kanaData[ch]?.box || 0) >= 1)).slice(0, 3).forEach(ch => queue.push(kanaExercise(ch)));
    return queue.slice(0, sessionLength);
  }

  // Items the user asked Senpai for help on — prioritise these
  const helpRequested = data.settings?.helpRequested || [];
  const helpKana = helpRequested.filter(id => ALL_BASE_KANA.includes(id));
  const helpPhrases = helpRequested.filter(id => PHRASES.find(p => p[0] === id));

  // Add helped items first (they struggled enough to ask)
  helpKana.slice(0, 2).forEach(ch => { if (ROMAJI[ch]) queue.push(kanaExercise(ch)); });
  helpPhrases.slice(0, 1).forEach(id => { const p = PHRASES.find(pp => pp[0] === id); if (p) queue.push(phraseExercise(p)); });

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

  // Add new content (learn cards) + immediate follow-up quiz
  if (unseenKana.length > 0 && queue.length < sessionLength - 2) {
    const newKana = unseenKana.slice(0, 2);
    newKana.forEach(ch => {
      queue.push(learnCard(ch));
      // Queue a quiz on it 2-3 cards later (immediate reinforcement)
      queue.push({ type: "_delayed_kana", item: ch, romaji: ROMAJI[ch], delay: 2 });
    });
  }
  if (unseenPhrases.length > 0 && queue.length < sessionLength - 1) {
    const np = unseenPhrases[0];
    queue.push(learnPhraseCard(np));
    // Queue a scenario quiz on it 2-3 cards later
    queue.push({ type: "_delayed_phrase", item: np, delay: 2 });
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

  // Add an AI-generated story if user knows enough phrases (1 per session, 30% chance)
  if (phrasesLearned >= 3 && queue.length < sessionLength && Math.random() < 0.3) {
    queue.push({ type: "story" });
  }

  // Add a conversation exercise if user knows enough phrases (1 per session)
  const phrasesLearned = Object.keys(phrData).length;
  if (phrasesLearned >= 5 && queue.length < sessionLength && Math.random() < 0.4) {
    const eligible = CONVERSATIONS.filter(conv =>
      conv.lines.filter(l => l.blank).every(l => phrData[l.correctId]?.box >= 0)
    );
    if (eligible.length > 0) {
      const conv = eligible[Math.floor(Math.random() * eligible.length)];
      queue.push({ type: "conversation", conversation: conv });
    }
  }

  // Process delayed items — move them 2-3 positions after their learn card
  const finalQueue = [];
  const delayed = [];
  for (const item of queue) {
    if (item.type === "_delayed_kana") {
      delayed.push({ ...kanaExercise(item.item), _insertAfter: finalQueue.length + item.delay });
    } else if (item.type === "_delayed_phrase") {
      delayed.push({ ...phraseExercise(item.item), _insertAfter: finalQueue.length + item.delay });
    } else {
      finalQueue.push(item);
    }
  }
  // Insert delayed items at their target positions
  for (const d of delayed) {
    const pos = Math.min(d._insertAfter, finalQueue.length);
    delete d._insertAfter;
    finalQueue.splice(pos, 0, d);
  }

  // Trim to session length
  return finalQueue.slice(0, sessionLength);
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
