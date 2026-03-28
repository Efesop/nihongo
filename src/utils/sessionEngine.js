import { M, H_GROUPS, K_GROUPS, ROMAJI, DAKUTEN_BASE, YOON_PARTS } from "../data/kana.js";
import { PHRASES, CATS, CAT_ICONS, CAT_COLORS } from "../data/phrases.js";
import { SRS_DAYS } from "../data/constants.js";
import { shuffle } from "./helpers.js";
import { CONVERSATIONS } from "../data/conversations.js";
import { CONFUSED_PAIRS } from "../data/confusedPairs.js";
import { CONFUSED_PHRASES } from "../data/confusedPhrases.js";
import { getUnlockedPatterns } from "../data/grammarPatterns.js";
import { PHRASE_BREAKDOWNS } from "../data/phraseBreakdowns.js";

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

    // Leech treatment: 5+ errors → ALWAYS show mnemonic + breakdown, not quiz
    // Don't keep quizzing items they've failed 5+ times — treat them differently
    if (errorCount >= 5) {
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

    // Default progression — mix exercise types at every level
    // Earlier production/reverse builds recall, not just recognition
    const r = Math.random();
    if (adjusted <= 0) {
      // Brand new: mostly scenario but sprinkle in listening
      return r > 0.75 ? { type: "phrase-listen", item: p } : { type: "phrase-scenario", item: p };
    }
    if (adjusted <= 1) {
      // Learning: 35% scenario, 35% listen, 30% reverse (early production!)
      if (r > 0.65) return { type: "phrase-reverse", item: p };
      if (r > 0.35) return { type: "phrase-listen", item: p };
      return { type: "phrase-scenario", item: p };
    }
    if (adjusted <= 2) {
      // Reviewing: 25% scenario, 25% listen, 25% reverse, 25% production
      if (r > 0.75) return { type: "phrase-production", item: p };
      if (r > 0.50) return { type: "phrase-reverse", item: p };
      if (r > 0.25) return { type: "phrase-listen", item: p };
      return { type: "phrase-scenario", item: p };
    }
    // Mature: heavier on production/reverse (recall over recognition)
    if (r > 0.6) return { type: "phrase-reverse", item: p };
    if (r > 0.3) return { type: "phrase-production", item: p };
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

  // Items with frequent errors — these need extra drilling
  shuffle(frequentErrorKana).slice(0, 2).forEach(ch => addKana(ch));
  shuffle(frequentErrorPhrases).slice(0, 1).forEach(p => addPhrase(p));

  // Start with 1-2 easy wins (due items the user probably knows)
  shuffle(dueKana.filter(ch => (kanaData[ch]?.box || 0) >= 3)).slice(0, 2).forEach(ch => addKana(ch));

  // Add due items (mixed kana + phrases) — cap to leave room for variety
  shuffle(dueKana).slice(0, 4).forEach(ch => addKana(ch));
  shuffle(duePhrases).slice(0, 3).forEach(p => addPhrase(p));

  // Struggling items already included in due items (dedup handles overlap)
  // No separate section needed — they're just due items with low box

  // Recently learned — max 1 each to avoid repetition across sessions
  shuffle(recentKana).slice(0, 1).forEach(ch => addKana(ch));
  shuffle(recentPhrases).slice(0, 1).forEach(p => addPhrase(p));

  // Maintenance kana — only if very few kana in queue, pick DUE high-box items (not non-due)
  const kanaInQueue = queue.filter(q => q.type?.startsWith("kana-") || q.type === "learn-card" || q.type === "try-first-kana").length;
  if (kanaInQueue < 2) {
    const maintenanceKana = shuffle(ALL_KANA.filter(ch => {
      const d = kanaData[ch];
      return d && d.box >= 3 && !usedKana.has(ch) && now >= (d.next || 0);
    }));
    maintenanceKana.slice(0, 2 - kanaInQueue).forEach(ch => addKana(ch));
  }

  // New item cap: max 3 new items per session (research: 3-5 optimal for complex items)
  // Prevents sessions from becoming 60% new content instead of review-dominant
  let newItemCount = 0;
  const MAX_NEW = 3;

  // Productive failure: quiz FIRST on unseen items, then reveal learn card
  // Research: struggling before instruction → better outcomes (Kapur 2014)
  if (unseenKana.length > 0 && queue.length < sessionLength - 2 && newItemCount < MAX_NEW) {
    const maxNewKana = Math.min(2, MAX_NEW - newItemCount);
    const newKana = unseenKana.filter(ch => !usedKana.has(ch)).slice(0, maxNewKana);
    newKana.forEach(ch => {
      usedKana.add(ch);
      queue.push({ type: "try-first-kana", item: ch, romaji: ROMAJI[ch], mnemonic: M[ch] });
      queue.push({ type: "_delayed_learn_kana", item: ch, romaji: ROMAJI[ch], mnemonic: M[ch], delay: 2 });
      newItemCount++;
    });
  }
  if (unseenPhrases.length > 0 && queue.length < sessionLength - 1 && newItemCount < MAX_NEW) {
    const np = unseenPhrases.find(p => !usedPhrases.has(p[0]));
    if (np) {
      usedPhrases.add(np[0]);
      queue.push({ type: "try-first-phrase", item: np });
      queue.push({ type: "_delayed_learn_phrase", item: np, delay: 2 });
      newItemCount++;
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

  // ═══ GUARANTEED SPECIAL EXERCISES (variety in every session) ═══
  const phrasesLearned = Object.keys(phrData).length;

  // Confused pairs — ALWAYS include 1 if eligible (not random)
  if (kanaLearned >= 20 && queue.length < sessionLength) {
    const eligible = CONFUSED_PAIRS.filter(pair =>
      pair.chars.every(ch => kanaData[ch]?.box >= 1)
    );
    if (eligible.length > 0) {
      const pair = eligible[Math.floor(Math.random() * eligible.length)];
      queue.push({ type: "kana-pair", pair });
    }
  }

  // Confused phrase pairs — ALWAYS include 1 if both phrases learned
  if (phrasesLearned >= 5 && queue.length < sessionLength) {
    const eligiblePhrPairs = CONFUSED_PHRASES.filter(cp =>
      cp.ids.every(id => phrData[id]?.box >= 1)
    );
    if (eligiblePhrPairs.length > 0) {
      const cp = eligiblePhrPairs[Math.floor(Math.random() * eligiblePhrPairs.length)];
      queue.push({ type: "phrase-pair", pair: cp });
    }
  }

  // Grammar pattern — ALWAYS include 1 if unlocked
  if (phrasesLearned >= 5 && queue.length < sessionLength) {
    const unlocked = getUnlockedPatterns(phrData, PHRASES);
    if (unlocked.length > 0) {
      const gp = unlocked[Math.floor(Math.random() * unlocked.length)];
      queue.push({ type: "grammar-pattern", pattern: gp });
    }
  }

  // Phrase build (fill-in-the-blank at segment level) — ALWAYS include 1 if eligible
  // Teaches particles and key words, not just whole phrases
  if (phrasesLearned >= 3 && queue.length < sessionLength) {
    // Pick a learned phrase with 3+ segments, not already in queue
    const buildCandidates = PHRASES.filter(p => {
      const d = phrData[p[0]];
      const segs = PHRASE_BREAKDOWNS[p[0]];
      if (!d || d.box < 1 || !segs || segs.length < 3 || usedPhrases.has(p[0])) return false;
      // Prefer due or close-to-due items
      return now >= (d.next || 0) || (d.next - now) < 86400000;
    });
    if (buildCandidates.length > 0) {
      const p = shuffle(buildCandidates)[0];
      usedPhrases.add(p[0]);
      const segs = PHRASE_BREAKDOWNS[p[0]];
      // Prefer blanking particles and key nouns/verbs — not copulas or question markers
      const blankable = segs
        .map((seg, i) => ({ seg, i }))
        .filter(({ seg }) => {
          const t = seg[3];
          // Blank particles (は, を, が, で, の) and content words (nouns, verbs)
          // Skip copulas (です), question markers (か), expressions, suffixes
          return t === "particle" || t === "noun" || t === "verb" || t === "counter";
        })
        .filter(({ seg }) => {
          // Skip trivially easy ones like です, か, します
          return !["です", "か", "します", "ですか"].includes(seg[0]);
        });
      if (blankable.length > 0) {
        const pick = blankable[Math.floor(Math.random() * blankable.length)];
        queue.push({ type: "phrase-build", item: p, blankIdx: pick.i });
      }
    }
  }

  // Reverse/production — include 1 if eligible AND due (or close to due)
  if (queue.length < sessionLength) {
    const productionPhrases = PHRASES.filter(p => {
      const d = phrData[p[0]];
      if (!d || d.box < 2 || usedPhrases.has(p[0])) return false;
      // Must be due or due within 3 days — don't pull items far ahead of schedule
      return now >= (d.next || 0) || (d.next - now) < 86400000;
    });
    if (productionPhrases.length > 0) {
      const p = shuffle(productionPhrases)[0];
      usedPhrases.add(p[0]);
      queue.push({ type: "phrase-reverse", item: p });
    }
  }
  if (queue.length < sessionLength) {
    const productionKana = ALL_KANA.filter(ch => {
      const d = kanaData[ch];
      if (!d || d.box < 2 || usedKana.has(ch)) return false;
      return now >= (d.next || 0) || (d.next - now) < 86400000;
    });
    if (productionKana.length > 0) {
      const ch = shuffle(productionKana)[0];
      usedKana.add(ch);
      queue.push({ type: "kana-reverse", item: ch, romaji: ROMAJI[ch] });
    }
  }

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

  // Process delayed items — move them after their trigger card
  const finalQueue = [];
  const delayed = [];
  for (const item of queue) {
    if (item.type === "_delayed_kana") {
      delayed.push({ ...kanaExercise(item.item), _insertAfter: finalQueue.length + item.delay });
    } else if (item.type === "_delayed_phrase") {
      delayed.push({ ...phraseExercise(item.item), _insertAfter: finalQueue.length + item.delay });
    } else if (item.type === "_delayed_learn_kana") {
      delayed.push({ type: "learn-card", item: item.item, romaji: item.romaji, mnemonic: item.mnemonic, _insertAfter: finalQueue.length + item.delay });
    } else if (item.type === "_delayed_learn_phrase") {
      delayed.push({ type: "learn-phrase", item: item.item, _insertAfter: finalQueue.length + item.delay });
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

  // Interleave: avoid same exercise category back-to-back
  // Also prevent same phrase/kana ID appearing within 3 cards of itself
  const interleaved = [];
  const kanaItems = [];
  const phraseItems = [];
  const specialItems = [];
  for (const item of finalQueue) {
    const t = item.type || "";
    if (t.startsWith("kana-") || t === "learn-card" || t === "try-first-kana" || t === "leech-review" && item.isKana) {
      kanaItems.push(item);
    } else if (t.startsWith("phrase-") || t === "learn-phrase" || t === "try-first-phrase" || t === "leech-review" && !item.isKana) {
      phraseItems.push(item);
    } else {
      specialItems.push(item);
    }
  }
  // Alternate kana and phrase, weaving in specials
  let ki = 0, pi = 0, si = 0;
  // Start with whichever bucket is larger
  let preferKana = kanaItems.length >= phraseItems.length;
  while (ki < kanaItems.length || pi < phraseItems.length || si < specialItems.length) {
    if (preferKana && ki < kanaItems.length) {
      interleaved.push(kanaItems[ki++]);
    } else if (!preferKana && pi < phraseItems.length) {
      interleaved.push(phraseItems[pi++]);
    } else if (ki < kanaItems.length) {
      interleaved.push(kanaItems[ki++]);
    } else if (pi < phraseItems.length) {
      interleaved.push(phraseItems[pi++]);
    }
    preferKana = !preferKana;
    // Insert a special every 4-5 cards
    if (si < specialItems.length && interleaved.length % 4 === 3) {
      interleaved.push(specialItems[si++]);
    }
  }
  // Append remaining specials
  while (si < specialItems.length) interleaved.push(specialItems[si++]);

  // Safety filter: remove any exercise whose item is far from due
  // Belt-and-suspenders — catches any code path that accidentally includes non-due items
  const safeQueue = interleaved.filter(item => {
    const t = item.type || "";
    // Skip safety check for learn cards, try-first, specials (they don't have SRS schedules)
    if (t.includes("learn") || t.includes("try-first") || t === "grammar-pattern" ||
        t === "kana-pair" || t === "story" || t === "branch-convo" || t === "conversation" ||
        t === "leech-review") return true;
    // For phrase exercises: check if the phrase is due or close to due
    if (t.startsWith("phrase-") && item.item && item.item[0]) {
      const d = phrData[item.item[0]];
      if (d && d.next && (d.next - now) > 2 * 86400000) return false; // more than 2 days away = skip
    }
    // For kana exercises: same check
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
  const sameCat = PHRASES.filter(p => p[4] === correct[4] && p[0] !== correct[0]);
  const others = PHRASES.filter(p => p[4] !== correct[4] && p[0] !== correct[0]);
  return shuffle([...sameCat, ...others]).slice(0, count);
}
