import { M, H_GROUPS, K_GROUPS, ROMAJI, DAKUTEN_BASE, YOON_PARTS } from "../data/kana.js";
import { PHRASES, CATS, CAT_ICONS, CAT_COLORS } from "../data/phrases.js";
import { SRS_DAYS } from "../data/constants.js";
import { shuffle } from "./helpers.js";
import { CONVERSATIONS } from "../data/conversations.js";
import { CONFUSED_PAIRS } from "../data/confusedPairs.js";
import { CONFUSED_PHRASES } from "../data/confusedPhrases.js";
import { getUnlockedPatterns } from "../data/grammarPatterns.js";
import { PHRASE_BREAKDOWNS } from "../data/phraseBreakdowns.js";
import { KEY_WORDS } from "../data/keyWords.js";
import { getUnlockedTemplates, generateAssemblyChallenge } from "../data/patternAssembly.js";

// All kana including dakuten and yōon
const ALL_BASE_KANA = [...H_GROUPS, ...K_GROUPS]
  .filter(g => !g.dk && !g.yo)
  .flatMap(g => g.c);

const ALL_DAKUTEN = [...H_GROUPS, ...K_GROUPS]
  .filter(g => g.dk)
  .flatMap(g => g.c);

const ALL_YOON = [...H_GROUPS, ...K_GROUPS]
  .filter(g => g.yo)
  .flatMap(g => g.c);

const ALL_KANA = [...ALL_BASE_KANA, ...ALL_DAKUTEN, ...ALL_YOON];

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

  // Error patterns — items the user frequently gets wrong (5+ errors, not 3)
  // 3 was too low — normal learning involves a few errors before mastery
  const errors = data.errors || {};
  const frequentErrorKana = ALL_KANA.filter(ch => (errors[ch] || 0) >= 5 && kanaData[ch]);
  const frequentErrorPhrases = PHRASES.filter(p => (errors[p[0]] || 0) >= 5 && phrData[p[0]]);

  // 1. Due for review — include ALL items past their due date (even box 0)
  // Box 0 items were getting stuck invisible — they exist in data but the old
  // filter (box >= 1) excluded them, making them neither "due" nor "unseen"
  const dueKana = ALL_KANA.filter(ch => {
    const d = kanaData[ch];
    return d && now >= (d.next || 0);
  });

  const duePhrases = PHRASES.filter(p => {
    const d = phrData[p[0]];
    return d && now >= (d.next || 0);
  });

  // 2. Struggling (box 0-2 AND due)
  const strugglingKana = ALL_KANA.filter(ch => {
    const d = kanaData[ch];
    return d && d.box <= 2 && now >= (d.next || 0);
  });

  const strugglingPhrases = PHRASES.filter(p => {
    const d = phrData[p[0]];
    return d && d.box <= 2 && now >= (d.next || 0);
  });

  // 2b. Recently learned (last 2 hours, box 0-1) — same-session reinforcement only
  // Was 24h which caused cross-session repetition of the same items
  const recentKana = ALL_KANA.filter(ch => {
    const d = kanaData[ch];
    return d && d.box <= 1 && d.lastReview && (now - d.lastReview) < 7200000 && now < (d.next || 0);
  });
  const recentPhrases = PHRASES.filter(p => {
    const d = phrData[p[0]];
    return d && d.box <= 1 && d.lastReview && (now - d.lastReview) < 7200000 && now < (d.next || 0);
  });

  // How much kana does the user know? (needed for unseen filtering + beginner check)
  const kanaLearned = ALL_BASE_KANA.filter(ch => (kanaData[ch]?.box || 0) >= 1).length;

  // 3. New items (never seen)
  // Base kana first, then dakuten after 30+ base learned, then yōon after 60+ base
  const unseenBaseKana = ALL_BASE_KANA.filter(ch => !kanaData[ch] && M[ch]);
  const unseenDakuten = kanaLearned >= 30 ? ALL_DAKUTEN.filter(ch => !kanaData[ch] && ROMAJI[ch]) : [];
  const unseenYoon = kanaLearned >= 60 ? ALL_YOON.filter(ch => !kanaData[ch] && ROMAJI[ch]) : [];
  const unseenKana = [...unseenBaseKana, ...unseenDakuten, ...unseenYoon];
  const unseenPhrases = smartPhraseOrder(PHRASES.filter(p => !phrData[p[0]]), phrData);

  // ═══ PICK EXERCISE TYPE BASED ON MASTERY ═══

  // Multi-dimensional skill tracking: check weakest skill per item
  // Only route to weak skill if item has been tested 3+ times total
  // (otherwise the skill data is too sparse to be meaningful)
  const skills = data.skills || {};
  function getWeakestSkill(id) {
    const s = skills[id];
    if (!s) return null; // not enough data — use default progression
    const v = s.visual || 0, l = s.listen || 0, p = s.production || 0;
    const total = v + l + p;
    if (total < 3) return null; // too few data points — use default
    if (l <= v && l <= p) return "listen";
    if (p <= v && p <= l) return "production";
    return "visual";
  }

  function kanaExercise(ch) {
    const box = kanaData[ch]?.box || 0;
    const errorCount = errors[ch] || 0;
    const adjusted = box + difficultyMod;

    // Leech treatment: 5+ errors → show mnemonic + breakdown, not quiz
    // Only if the character HAS a mnemonic (base kana). Dakuten/yōon don't have
    // mnemonic images so leech review is useless for them — just quiz normally.
    if (errorCount >= 5 && M[ch]) {
      return { type: "leech-review", item: ch, romaji: ROMAJI[ch], mnemonic: M[ch], errorCount, isKana: true };
    }

    // Pick exercise based on weakest skill
    const weak = getWeakestSkill(ch);
    if (weak === "listen" && adjusted >= 1) return { type: "kana-listen", item: ch, romaji: ROMAJI[ch] };
    if (weak === "production" && adjusted >= 2) return { type: "kana-reverse", item: ch, romaji: ROMAJI[ch] };

    // Default progression — introduce production earlier
    if (adjusted <= 1) return { type: "kana-visual", item: ch, romaji: ROMAJI[ch] };
    const r = Math.random();
    if (adjusted <= 2) {
      // Box 2: 50% visual, 30% listen, 20% reverse (production starts here)
      if (r > 0.70) return { type: "kana-reverse", item: ch, romaji: ROMAJI[ch] };
      if (r > 0.50) return { type: "kana-listen", item: ch, romaji: ROMAJI[ch] };
      return { type: "kana-visual", item: ch, romaji: ROMAJI[ch] };
    }
    // Box 3+: 45% listen, 45% reverse, 10% visual (production-heavy)
    if (r > 0.55) return { type: "kana-listen", item: ch, romaji: ROMAJI[ch] };
    if (r > 0.10) return { type: "kana-reverse", item: ch, romaji: ROMAJI[ch] };
    return { type: "kana-visual", item: ch, romaji: ROMAJI[ch] };
  }

  function phraseExercise(p) {
    const box = phrData[p[0]]?.box || 0;
    const errorCount = errors[p[0]] || 0;
    const adjusted = box + difficultyMod;

    // Leech treatment: ALWAYS treat, don't quiz (threshold higher for phrases — they're harder)
    if (errorCount >= 7) {
      return { type: "leech-review", item: p, errorCount, isKana: false };
    }

    // Pick based on weakest skill
    const weak = getWeakestSkill(p[0]);
    if (weak === "listen" && adjusted >= 1) return { type: "phrase-listen", item: p };
    if (weak === "production" && adjusted >= 2) return { type: "phrase-reverse", item: p };

    // Default progression — gradual difficulty increase
    // Research: 85% accuracy target (Wilson 2019). Recognition first, production later.
    // Box 0-1: high success rate exercises (scenario, listen)
    // Box 2: introduce reverse (production)
    // Box 3+: production-heavy (recall over recognition)
    const r = Math.random();
    if (adjusted <= 0) {
      // Brand new: recognition only — build confidence
      return r > 0.7 ? { type: "phrase-listen", item: p } : { type: "phrase-scenario", item: p };
    }
    if (adjusted <= 1) {
      // Learning: still mostly recognition, 15% reverse to start stretching
      if (r > 0.85) return { type: "phrase-reverse", item: p };
      if (r > 0.45) return { type: "phrase-listen", item: p };
      return { type: "phrase-scenario", item: p };
    }
    if (adjusted <= 2) {
      // Reviewing: introduce production, balance recognition
      if (r > 0.80) return { type: "phrase-production", item: p };
      if (r > 0.55) return { type: "phrase-reverse", item: p };
      if (r > 0.25) return { type: "phrase-listen", item: p };
      return { type: "phrase-scenario", item: p };
    }
    // Mature (box 3+): production-heavy — recall over recognition
    if (r > 0.55) return { type: "phrase-reverse", item: p };
    if (r > 0.25) return { type: "phrase-production", item: p };
    return { type: "phrase-listen", item: p };
  }

  function learnCard(ch) {
    return { type: "learn-card", item: ch, romaji: ROMAJI[ch], mnemonic: M[ch] };
  }

  function learnPhraseCard(p) {
    return { type: "learn-phrase", item: p };
  }

  // ═══ BUILD THE QUEUE ═══
  // Architecture: specials-first design. Reserve 2-3 slots for high-impact
  // exercises (pattern assembly, phrase build, etc.) BEFORE filling with reviews.
  // This prevents review backlogs from starving the exercises that build
  // generative ability. Research: varied practice > massed practice (Rohrer 2012).

  // Track used items to prevent duplicates
  const usedKana = new Set();
  const usedPhrases = new Set();
  const phrasesLearned = Object.keys(phrData).length;

  function addKana(ch, targetQueue) {
    if (usedKana.has(ch)) return false;
    usedKana.add(ch);
    targetQueue.push(kanaExercise(ch));
    return true;
  }

  function addPhrase(p, targetQueue) {
    if (usedPhrases.has(p[0])) return false;
    usedPhrases.add(p[0]);
    targetQueue.push(phraseExercise(p));
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

  // ═══ EARLY LEARNER PATHS ═══
  // Even beginners get variety — word quizzes start at 3 phrases

  if (kanaLearned < 10) {
    unseenKana.slice(0, Math.min(sessionLength, 10)).forEach(ch => addLearnKana(ch));
    const reviewable = ALL_BASE_KANA.filter(ch => (kanaData[ch]?.box || 0) >= 1);
    shuffle(reviewable).slice(0, 2).forEach(ch => addKana(ch, queue));
    // Even beginners get a word quiz if they know any phrases
    if (phrasesLearned >= 3) {
      const knownWords = KEY_WORDS.filter(w => (w[4] || []).some(id => phrData[id]?.box >= 1));
      if (knownWords.length > 0) queue.push({ type: "word-quiz", word: shuffle(knownWords)[0] });
    }
    return queue.slice(0, sessionLength);
  }

  if (kanaLearned >= 10 && phrasesLearned === 0) {
    shuffle(dueKana).slice(0, 4).forEach(ch => addKana(ch, queue));
    unseenPhrases.slice(0, 3).forEach(p => addLearnPhrase(p));
    shuffle(ALL_BASE_KANA.filter(ch => (kanaData[ch]?.box || 0) >= 1)).slice(0, 3).forEach(ch => addKana(ch, queue));
    return queue.slice(0, sessionLength);
  }

  // ═══ STEP 1: BUILD SPECIAL EXERCISES FIRST (reserved slots) ═══
  // These are the high-impact exercises that build understanding, not just recall.
  // Built into a separate pool, guaranteed 2-3 slots in every session.
  const specialPool = [];

  // Pattern Assembly — highest impact: generative sentence construction
  if (phrasesLearned >= 5) {
    const unlockedTemplates = getUnlockedTemplates(phrData);
    if (unlockedTemplates.length > 0) {
      const template = shuffle(unlockedTemplates)[0];
      const challenge = generateAssemblyChallenge(template, phrData);
      specialPool.push({ type: "pattern-assembly", challenge });
    }
  }

  // Phrase build — fill-in-the-blank at segment level
  if (phrasesLearned >= 3) {
    const buildCandidates = PHRASES.filter(p => {
      const d = phrData[p[0]];
      const segs = PHRASE_BREAKDOWNS[p[0]];
      if (!d || d.box < 1 || !segs || segs.length < 3 || usedPhrases.has(p[0])) return false;
      return now >= (d.next || 0) || (d.next - now) < 86400000;
    });
    if (buildCandidates.length > 0) {
      const p = shuffle(buildCandidates)[0];
      usedPhrases.add(p[0]);
      const segs = PHRASE_BREAKDOWNS[p[0]];
      const blankable = segs
        .map((seg, i) => ({ seg, i }))
        .filter(({ seg }) => {
          const t = seg[3];
          return t === "particle" || t === "noun" || t === "verb" || t === "counter";
        })
        .filter(({ seg }) => !["です", "か", "します", "ですか"].includes(seg[0]));
      if (blankable.length > 0) {
        const pick = blankable[Math.floor(Math.random() * blankable.length)];
        specialPool.push({ type: "phrase-build", item: p, blankIdx: pick.i });
      }
    }
  }

  // Word quiz — building block vocabulary
  if (phrasesLearned >= 3) {
    const knownWords = KEY_WORDS.filter(w => (w[4] || []).some(id => phrData[id]?.box >= 1));
    if (knownWords.length > 0) {
      specialPool.push({ type: "word-quiz", word: shuffle(knownWords)[0] });
    }
  }

  // Confused kana pairs
  if (kanaLearned >= 20) {
    const eligible = CONFUSED_PAIRS.filter(pair => pair.chars.every(ch => kanaData[ch]?.box >= 1));
    if (eligible.length > 0) {
      specialPool.push({ type: "kana-pair", pair: eligible[Math.floor(Math.random() * eligible.length)] });
    }
  }

  // Confused phrase pairs
  if (phrasesLearned >= 5) {
    const eligiblePhrPairs = CONFUSED_PHRASES.filter(cp => cp.ids.every(id => phrData[id]?.box >= 1));
    if (eligiblePhrPairs.length > 0) {
      specialPool.push({ type: "phrase-pair", pair: eligiblePhrPairs[Math.floor(Math.random() * eligiblePhrPairs.length)] });
    }
  }

  // Grammar pattern
  if (phrasesLearned >= 5) {
    const unlocked = getUnlockedPatterns(phrData, PHRASES);
    if (unlocked.length > 0) {
      specialPool.push({ type: "grammar-pattern", pattern: unlocked[Math.floor(Math.random() * unlocked.length)] });
    }
  }

  // AI exercises (probabilistic — not every session)
  if (phrasesLearned >= 3 && Math.random() < 0.25) {
    specialPool.push({ type: "story" });
  }
  if (phrasesLearned >= 8 && Math.random() < 0.2) {
    const scenarios = ["restaurant", "hotel", "train station", "convenience store", "asking directions"];
    specialPool.push({ type: "branch-convo", scenario: scenarios[Math.floor(Math.random() * scenarios.length)] });
  }
  if (phrasesLearned >= 5 && Math.random() < 0.4) {
    const eligible = CONVERSATIONS.filter(conv =>
      conv.lines.filter(l => l.blank).every(l => (phrData[l.correctId]?.box || 0) >= 1)
    );
    if (eligible.length > 0) {
      specialPool.push({ type: "conversation", conversation: eligible[Math.floor(Math.random() * eligible.length)] });
    }
  }

  // Reserve 2-3 slots for specials (more if session is longer)
  // Priority order: pattern-assembly > phrase-build > word-quiz > confused pairs > grammar > AI
  const maxSpecials = Math.min(specialPool.length, sessionLength <= 10 ? 3 : 4);
  const reservedSpecials = specialPool.slice(0, maxSpecials);

  // ═══ STEP 2: BUILD REVIEW + NEW ITEM QUEUE ═══
  // Fill the remaining slots with SRS reviews and new items
  const reviewSlots = sessionLength - reservedSpecials.length;

  // Priority order within reviews:
  // 1. Help-requested items (user explicitly asked for help)
  // 2. Frequent error items (leeches that need drilling)
  // 3. Easy win (start session with confidence)
  // 4. Due items (core SRS)
  // 5. Recently learned (same-session reinforcement)
  // 6. New items (productive failure flow)

  const helpRequested = data.settings?.helpRequested || [];
  const helpKana = helpRequested.filter(id => ALL_BASE_KANA.includes(id));
  const helpPhrases = helpRequested.filter(id => PHRASES.find(p => p[0] === id));

  helpKana.slice(0, 1).forEach(ch => { if (ROMAJI[ch]) addKana(ch, queue); });
  helpPhrases.slice(0, 1).forEach(id => { const p = PHRASES.find(pp => pp[0] === id); if (p) addPhrase(p, queue); });

  // Frequent errors
  shuffle(frequentErrorKana).slice(0, 1).forEach(ch => addKana(ch, queue));
  shuffle(frequentErrorPhrases).slice(0, 1).forEach(p => addPhrase(p, queue));

  // Easy win — 1 high-box due item for confidence
  shuffle(dueKana.filter(ch => (kanaData[ch]?.box || 0) >= 3)).slice(0, 1).forEach(ch => addKana(ch, queue));

  // Due items — dynamically capped to leave room for new items
  // Cap = remaining review slots minus 3-4 for productive failure
  const usedReviewSlots = queue.length;
  const newItemReserve = (unseenKana.length > 0 || unseenPhrases.length > 0) ? 3 : 0;
  const dueItemCap = Math.max(reviewSlots - usedReviewSlots - newItemReserve, 2);
  const dueCap = Math.min(dueItemCap, reviewSlots);

  // Split due cap between kana and phrases proportionally
  const dueKanaCount = dueKana.length;
  const duePhrCount = duePhrases.length;
  const dueTotal = dueKanaCount + duePhrCount;
  const kanaDueCap = dueTotal > 0 ? Math.max(Math.round(dueCap * dueKanaCount / dueTotal), 1) : Math.floor(dueCap / 2);
  const phrDueCap = dueCap - kanaDueCap;

  shuffle(dueKana).slice(0, kanaDueCap).forEach(ch => addKana(ch, queue));
  shuffle(duePhrases).slice(0, phrDueCap).forEach(p => addPhrase(p, queue));

  // Recently learned — max 1 each
  shuffle(recentKana).slice(0, 1).forEach(ch => addKana(ch, queue));
  shuffle(recentPhrases).slice(0, 1).forEach(p => addPhrase(p, queue));

  // Maintenance kana — only if very few kana in queue
  const kanaInQueue = queue.filter(q => q.type?.startsWith("kana-") || q.type === "learn-card" || q.type === "try-first-kana").length;
  if (kanaInQueue < 2) {
    const maintenanceKana = shuffle(ALL_KANA.filter(ch => {
      const d = kanaData[ch];
      return d && d.box >= 3 && !usedKana.has(ch) && now >= (d.next || 0);
    }));
    maintenanceKana.slice(0, 2 - kanaInQueue).forEach(ch => addKana(ch, queue));
  }

  // ═══ STEP 3: PRODUCTIVE FAILURE — NEW ITEMS ═══
  // Flow: try-first → [2 cards] → learn card → [3 cards] → quiz
  // Uses absolute position tracking for delayed items (not relative offsets)
  let newItemCount = 0;
  const MAX_NEW = 5;
  const slotsLeft = reviewSlots - queue.length;

  if (unseenKana.length > 0 && slotsLeft >= 2 && newItemCount < MAX_NEW) {
    const maxNewKana = Math.min(2, MAX_NEW - newItemCount, Math.floor(slotsLeft / 2));
    const newKana = unseenKana.filter(ch => !usedKana.has(ch)).slice(0, maxNewKana);
    newKana.forEach(ch => {
      usedKana.add(ch);
      queue.push({ type: "try-first-kana", item: ch, romaji: ROMAJI[ch], mnemonic: M[ch] });
      // Delayed items use _triggerIdx to track position relative to try-first card
      queue.push({ type: "_delayed_learn_kana", item: ch, romaji: ROMAJI[ch], mnemonic: M[ch], _triggerIdx: queue.length - 1, delay: 2 });
      queue.push({ type: "_delayed_kana", item: ch, _triggerIdx: queue.length - 2, delay: 5 });
      newItemCount++;
    });
  }
  if (unseenPhrases.length > 0 && slotsLeft >= 1 && newItemCount < MAX_NEW) {
    const maxNewPhr = Math.min(2, MAX_NEW - newItemCount);
    const newPhrases = unseenPhrases.filter(p => !usedPhrases.has(p[0])).slice(0, maxNewPhr);
    newPhrases.forEach(np => {
      usedPhrases.add(np[0]);
      queue.push({ type: "try-first-phrase", item: np });
      queue.push({ type: "_delayed_learn_phrase", item: np, _triggerIdx: queue.length - 1, delay: 2 });
      queue.push({ type: "_delayed_phrase", item: np, _triggerIdx: queue.length - 2, delay: 5 });
      newItemCount++;
    });
  }

  // Fill any remaining review slots
  if (queue.length < reviewSlots) {
    const unusedDueKana = shuffle(dueKana.filter(ch => !usedKana.has(ch)));
    const unusedDuePhrases = shuffle(duePhrases.filter(p => !usedPhrases.has(p[0])));
    const unusedUnseen = unseenKana.filter(ch => !usedKana.has(ch));
    const fillers = [
      ...unusedDueKana.slice(0, 3).map(ch => ({ add: () => addKana(ch, queue) })),
      ...unusedDuePhrases.slice(0, 2).map(p => ({ add: () => addPhrase(p, queue) })),
      ...unusedUnseen.slice(0, 2).map(ch => ({ add: () => addLearnKana(ch) })),
    ];
    for (const f of fillers) {
      if (queue.length >= reviewSlots) break;
      f.add();
    }
  }

  // If still too few (brand new user), add learn cards
  while (queue.length < Math.min(reviewSlots, 5) && unseenKana.length > queue.length) {
    const idx = queue.filter(q => q.type === "learn-card").length;
    if (idx < unseenKana.length) {
      queue.push(learnCard(unseenKana[idx]));
    } else break;
  }

  // Production exercise — include 1 if eligible AND due
  if (queue.length < reviewSlots) {
    const productionPhrases = PHRASES.filter(p => {
      const d = phrData[p[0]];
      if (!d || d.box < 2 || usedPhrases.has(p[0])) return false;
      return now >= (d.next || 0) || (d.next - now) < 86400000;
    });
    if (productionPhrases.length > 0) {
      const p = shuffle(productionPhrases)[0];
      usedPhrases.add(p[0]);
      queue.push({ type: "phrase-reverse", item: p });
    }
  }

  // ═══ STEP 4: PROCESS DELAYED ITEMS ═══
  // Separate delayed items, resolve to real exercises, insert at correct positions
  const resolvedQueue = [];
  const delayedItems = [];
  for (const item of queue) {
    if (item.type === "_delayed_kana") {
      delayedItems.push({ resolved: kanaExercise(item.item), _insertAfter: resolvedQueue.length + item.delay });
    } else if (item.type === "_delayed_phrase") {
      delayedItems.push({ resolved: phraseExercise(item.item), _insertAfter: resolvedQueue.length + item.delay });
    } else if (item.type === "_delayed_learn_kana") {
      delayedItems.push({ resolved: { type: "learn-card", item: item.item, romaji: item.romaji, mnemonic: item.mnemonic }, _insertAfter: resolvedQueue.length + item.delay });
    } else if (item.type === "_delayed_learn_phrase") {
      delayedItems.push({ resolved: { type: "learn-phrase", item: item.item }, _insertAfter: resolvedQueue.length + item.delay });
    } else {
      resolvedQueue.push(item);
    }
  }

  // Sort delayed items by target position (earliest first) so insertions don't shift later targets
  delayedItems.sort((a, b) => a._insertAfter - b._insertAfter);
  for (let i = 0; i < delayedItems.length; i++) {
    const d = delayedItems[i];
    // Clamp to within the queue, but NOT to the very end — leave at least 1 card after
    const pos = Math.min(d._insertAfter + i, resolvedQueue.length + i);
    resolvedQueue.splice(pos, 0, d.resolved);
  }

  // ═══ STEP 5: INTERLEAVE WITH RANDOMIZED SPECIAL PLACEMENT ═══
  // Instead of fixed positions (3, 7, 11), place specials at varied intervals
  const kanaItems = [];
  const phraseItems = [];
  for (const item of resolvedQueue) {
    const t = item.type || "";
    if (t.startsWith("kana-") || t === "learn-card" || t === "try-first-kana" || (t === "leech-review" && item.isKana)) {
      kanaItems.push(item);
    } else if (t.startsWith("phrase-") || t === "learn-phrase" || t === "try-first-phrase" || (t === "leech-review" && !item.isKana)) {
      phraseItems.push(item);
    }
  }

  // Alternate kana and phrase items
  const coreItems = [];
  let ki = 0, pi = 0;
  let preferKana = kanaItems.length >= phraseItems.length;
  while (ki < kanaItems.length || pi < phraseItems.length) {
    if (preferKana && ki < kanaItems.length) coreItems.push(kanaItems[ki++]);
    else if (!preferKana && pi < phraseItems.length) coreItems.push(phraseItems[pi++]);
    else if (ki < kanaItems.length) coreItems.push(kanaItems[ki++]);
    else if (pi < phraseItems.length) coreItems.push(phraseItems[pi++]);
    preferKana = !preferKana;
  }

  // Insert specials at varied positions throughout the session
  // Target: spread evenly with ±1 jitter for unpredictability
  const interleaved = [...coreItems];
  if (reservedSpecials.length > 0) {
    const spacing = Math.max(Math.floor(interleaved.length / (reservedSpecials.length + 1)), 2);
    const shuffledSpecials = shuffle([...reservedSpecials]);
    for (let i = 0; i < shuffledSpecials.length; i++) {
      // Base position = evenly spaced, jitter = ±1
      const basePos = spacing * (i + 1);
      const jitter = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
      const pos = Math.min(Math.max(basePos + jitter, 1), interleaved.length);
      interleaved.splice(pos, 0, shuffledSpecials[i]);
    }
  }

  // Safety filter: remove any exercise whose item is far from due
  const safeQueue = interleaved.filter(item => {
    const t = item.type || "";
    if (t.includes("learn") || t.includes("try-first") || t === "grammar-pattern" ||
        t === "kana-pair" || t === "phrase-pair" || t === "phrase-build" || t === "word-quiz" ||
        t === "pattern-assembly" || t === "story" || t === "branch-convo" || t === "conversation" ||
        t === "leech-review") return true;
    if (t.startsWith("phrase-") && item.item && item.item[0]) {
      const d = phrData[item.item[0]];
      if (d && d.next && (d.next - now) > 2 * 86400000) return false;
    }
    if (t.startsWith("kana-") && typeof item.item === "string") {
      const d = kanaData[item.item];
      if (d && d.next && (d.next - now) > 2 * 86400000) return false;
    }
    return true;
  });

  // Trim to session length
  return safeQueue.slice(0, sessionLength);
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
  // Score distractors by structural similarity — shared segments make harder choices
  // Research: minimal pairs force deeper processing → stronger memory traces
  const correctSegs = PHRASE_BREAKDOWNS[correct[0]];
  const correctWords = correctSegs ? correctSegs.map(s => s[0]) : [];

  const candidates = PHRASES.filter(p => p[0] !== correct[0]).map(p => {
    const segs = PHRASE_BREAKDOWNS[p[0]];
    const words = segs ? segs.map(s => s[0]) : [];
    // Count shared segments (particles, nouns, verbs etc.)
    const shared = correctWords.filter(w => words.includes(w) && !["です", "か"].includes(w)).length;
    // Bonus for same category (similar context makes it harder)
    const catBonus = p[4] === correct[4] ? 1 : 0;
    // Bonus for similar length (same number of segments)
    const lenBonus = segs && correctSegs && Math.abs(segs.length - correctSegs.length) <= 1 ? 1 : 0;
    return { p, score: shared * 3 + catBonus + lenBonus };
  });

  // Sort by similarity score (highest first), then pick top candidates
  candidates.sort((a, b) => b.score - a.score);

  // Take the most similar ones, but shuffle among top candidates for variety
  const topPool = candidates.slice(0, Math.max(count * 3, 9));
  const picked = shuffle(topPool).slice(0, count);
  return picked.map(c => c.p);
}
