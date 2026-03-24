import { M, H_GROUPS, K_GROUPS, ROMAJI, DAKUTEN_BASE, YOON_PARTS } from "../data/kana.js";
import { PHRASES, CATS, CAT_ICONS, CAT_COLORS } from "../data/phrases.js";
import { SRS_DAYS } from "../data/constants.js";
import { shuffle } from "./helpers.js";
import { CONVERSATIONS } from "../data/conversations.js";

// All base kana (no dakuten/yōon for now — keep it simpler)
const ALL_BASE_KANA = [...H_GROUPS, ...K_GROUPS]
  .filter(g => !g.dk && !g.yo)
  .flatMap(g => g.c);

// Common building-block words that appear across many phrases
const BUILDING_BLOCKS = [
  "ください", "おねがいします", "です", "ですか", "ません",
  "はどこ", "いくら", "なん", "ありま", "ほしい", "たい",
];

/**
 * Smart phrase ordering: mission-critical first, cross-category variety,
 * and phrases with familiar building blocks are prioritised.
 */
function smartPhraseOrder(unseen, phrData) {
  // Words the user has already encountered (from learned phrases)
  const knownPhraseTexts = PHRASES.filter(p => phrData[p[0]]).map(p => p[1]);
  const knownBlocks = BUILDING_BLOCKS.filter(b => knownPhraseTexts.some(t => t.includes(b)));

  // Score each unseen phrase
  const scored = unseen.map(p => {
    let score = 0;
    // Mission-critical gets big boost
    if (p[6]) score += 100;
    // Bonus for each known building block in this phrase
    knownBlocks.forEach(b => { if (p[1].includes(b)) score += 15; });
    return { p, score, cat: p[4] };
  });

  // Sort by score (highest first), then interleave categories for variety
  scored.sort((a, b) => b.score - a.score);

  // Interleave: don't show 3+ from same category in a row
  const result = [];
  const remaining = [...scored];
  const lastCats = [];
  while (remaining.length > 0) {
    // Find first item whose category isn't in the last 2
    let idx = remaining.findIndex(s => !lastCats.includes(s.cat));
    if (idx === -1) idx = 0; // fallback if all same category
    const pick = remaining.splice(idx, 1)[0];
    result.push(pick.p);
    lastCats.push(pick.cat);
    if (lastCats.length > 2) lastCats.shift();
  }
  return result;
}

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

  // 3. New items (never seen) — smart ordering for phrases
  const unseenKana = ALL_BASE_KANA.filter(ch => !kanaData[ch] && M[ch]);
  const unseenPhrases = smartPhraseOrder(PHRASES.filter(p => !phrData[p[0]]), phrData);

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

  // Track used items to prevent duplicates
  const usedKana = new Set();
  const usedPhrases = new Set();

  function addKana(ch) {
    if (usedKana.has(ch)) return false;
    usedKana.add(ch);
    queue.push(kanaExercise(ch));
    return true;
  }

  function addPhrase(p) {
    if (usedPhrases.has(p[0])) return false;
    usedPhrases.add(p[0]);
    queue.push(phraseExercise(p));
    return true;
  }

  function addLearnKana(ch) {
    if (usedKana.has(ch)) return false;
    usedKana.add(ch);
    queue.push(learnCard(ch));
    return true;
  }

  function addLearnPhrase(p) {
    if (usedPhrases.has(p[0])) return false;
    usedPhrases.add(p[0]);
    queue.push(learnPhraseCard(p));
    return true;
  }

  // How much kana does the user know?
  const kanaLearned = ALL_BASE_KANA.filter(ch => (kanaData[ch]?.box || 0) >= 1).length;

  // If user knows very few kana, focus on teaching kana first
  if (kanaLearned < 10) {
    unseenKana.slice(0, Math.min(sessionLength, 8)).forEach(ch => addLearnKana(ch));
    const reviewable = ALL_BASE_KANA.filter(ch => (kanaData[ch]?.box || 0) >= 1);
    shuffle(reviewable).slice(0, 2).forEach(ch => addKana(ch));
    return queue.slice(0, sessionLength);
  }

  // If user knows kana but no phrases yet, mix in phrase introductions
  if (kanaLearned >= 10 && Object.keys(phrData).length === 0) {
    shuffle(dueKana).slice(0, 4).forEach(ch => addKana(ch));
    unseenPhrases.slice(0, 3).forEach(p => addLearnPhrase(p));
    shuffle(ALL_BASE_KANA.filter(ch => (kanaData[ch]?.box || 0) >= 1)).slice(0, 3).forEach(ch => addKana(ch));
    return queue.slice(0, sessionLength);
  }

  // Items the user asked Senpai for help on — prioritise these
  const helpRequested = data.settings?.helpRequested || [];
  const helpKana = helpRequested.filter(id => ALL_BASE_KANA.includes(id));
  const helpPhrases = helpRequested.filter(id => PHRASES.find(p => p[0] === id));

  helpKana.slice(0, 2).forEach(ch => { if (ROMAJI[ch]) addKana(ch); });
  helpPhrases.slice(0, 1).forEach(id => { const p = PHRASES.find(pp => pp[0] === id); if (p) addPhrase(p); });

  // Start with 1-2 easy wins (due items the user probably knows)
  shuffle(dueKana.filter(ch => (kanaData[ch]?.box || 0) >= 3)).slice(0, 2).forEach(ch => addKana(ch));

  // Add due items (mixed kana + phrases)
  shuffle(dueKana).slice(0, 6).forEach(ch => addKana(ch));
  shuffle(duePhrases).slice(0, 4).forEach(p => addPhrase(p));

  // Add struggling items (only ones not already added)
  shuffle(strugglingKana).slice(0, 3).forEach(ch => addKana(ch));
  shuffle(strugglingPhrases).slice(0, 2).forEach(p => addPhrase(p));

  // Add new content (learn cards) + immediate follow-up quiz
  if (unseenKana.length > 0 && queue.length < sessionLength - 2) {
    const newKana = unseenKana.filter(ch => !usedKana.has(ch)).slice(0, 2);
    newKana.forEach(ch => {
      addLearnKana(ch);
      queue.push({ type: "_delayed_kana", item: ch, romaji: ROMAJI[ch], delay: 2 });
    });
  }
  if (unseenPhrases.length > 0 && queue.length < sessionLength - 1) {
    const np = unseenPhrases.find(p => !usedPhrases.has(p[0]));
    if (np) {
      addLearnPhrase(np);
      queue.push({ type: "_delayed_phrase", item: np, delay: 2 });
    }
  }

  // Fill remaining slots — only items not already used
  if (queue.length < sessionLength) {
    const unusedDueKana = shuffle(dueKana.filter(ch => !usedKana.has(ch)));
    const unusedDuePhrases = shuffle(duePhrases.filter(p => !usedPhrases.has(p[0])));
    const unusedUnseen = unseenKana.filter(ch => !usedKana.has(ch));
    const fillers = [
      ...unusedDueKana.slice(0, 3).map(ch => ({ add: () => addKana(ch) })),
      ...unusedDuePhrases.slice(0, 3).map(p => ({ add: () => addPhrase(p) })),
      ...unusedUnseen.slice(0, 2).map(ch => ({ add: () => addLearnKana(ch) })),
    ];
    for (const f of fillers) {
      if (queue.length >= sessionLength) break;
      f.add();
    }
  }

  // If still too few (brand new user), add learn cards
  while (queue.length < Math.min(sessionLength, 5) && unseenKana.length > queue.length) {
    const idx = queue.filter(q => q.type === "learn-card").length;
    if (idx < unseenKana.length) {
      queue.push(learnCard(unseenKana[idx]));
    } else break;
  }

  // Add a conversation exercise if user knows enough phrases (1 per session)
  const phrasesLearned = Object.keys(phrData).length;

  // Add an AI-generated story if user knows enough phrases (1 per session, 25% chance)
  if (phrasesLearned >= 3 && queue.length < sessionLength && Math.random() < 0.25) {
    queue.push({ type: "story" });
  }

  // Add a branching conversation if user knows enough phrases (1 per session, 20% chance)
  if (phrasesLearned >= 8 && queue.length < sessionLength && Math.random() < 0.2) {
    const scenarios = ["restaurant", "hotel", "train station", "convenience store", "asking directions"];
    queue.push({ type: "branch-convo", scenario: scenarios[Math.floor(Math.random() * scenarios.length)] });
  }
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
