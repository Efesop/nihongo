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
import { GRADED_STORIES } from "../data/gradedStories.js";
import { PHRASE_CHAINS } from "../data/phraseChains.js";
import { IMMERSION_SCENES } from "../data/immersionScenes.js";
import { buildBucketSort } from "../data/bucketSort.js";
import { SCENE_STUDIES } from "../data/sceneStudies.js";

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
  const shadowDisabled = data.settings?.shadowDisabled;
  // Morning/evening asymmetry: morning favours new items, evening favours reviews
  // Research: new encoding is stronger in morning, consolidation in evening
  const hour = new Date().getHours();
  const isMorning = hour >= 5 && hour < 12;
  const isEvening = hour >= 19 || hour < 5;
  const kanaData = data.kana || {};
  const phrData = data.phr || {};

  // ═══ GATHER ITEMS BY PRIORITY ═══

  // Error patterns — items the user frequently gets wrong (5+ errors, not 3)
  // 3 was too low — normal learning involves a few errors before mastery
  const errors = data.errors || {};
  const frequentErrorKana = ALL_KANA.filter(ch => (errors[ch] || 0) >= 5 && kanaData[ch]);
  const frequentErrorPhrases = PHRASES.filter(p => (errors[p[0]] || 0) >= 5 && phrData[p[0]]);

  // ═══ ADAPTIVE ROUTING — answerLog signals ═══
  // Build per-item stats from recent answer log (last 200 entries)
  const answerLog = data.answerLog || [];
  const itemStats = {}; // { itemId: { recent: [], avgMs: 0, accuracy: 0 } }
  // Walk log in reverse — newest first, take up to 10 per item
  for (let i = answerLog.length - 1; i >= 0; i--) {
    const e = answerLog[i];
    if (!e.item) continue;
    if (!itemStats[e.item]) itemStats[e.item] = { recent: [], totalMs: 0 };
    if (itemStats[e.item].recent.length < 10) {
      itemStats[e.item].recent.push(e);
      itemStats[e.item].totalMs += e.ms || 0;
    }
  }
  Object.keys(itemStats).forEach(id => {
    const s = itemStats[id];
    const correct = s.recent.filter(e => e.correct).length;
    s.accuracy = s.recent.length > 0 ? correct / s.recent.length : 1;
    s.avgMs = s.recent.length > 0 ? s.totalMs / s.recent.length : 0;
  });

  // Adaptive priority: items with <50% accuracy in last N attempts get force-pushed
  const lowAccuracyPhrases = PHRASES.filter(p => {
    const s = itemStats[p[0]];
    return s && s.recent.length >= 4 && s.accuracy < 0.5 && phrData[p[0]];
  });

  // Response time leech candidates: avg >15s in last 10 attempts
  const slowResponsePhrases = PHRASES.filter(p => {
    const s = itemStats[p[0]];
    return s && s.recent.length >= 3 && s.avgMs > 15000 && phrData[p[0]];
  });

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

  // Consolidation gate: don't introduce new phrases when too many are still shaky.
  // If 10+ phrases are at box 0-1, the user is drowning — drill what they have
  // before adding more. This prevents the "seen everything, mastered nothing" problem.
  const shakyPhrases = PHRASES.filter(p => phrData[p[0]] && phrData[p[0]].box <= 1).length;
  const blockNewPhrases = shakyPhrases >= 10;
  // Even when consolidation gate is active, still allow unseen mission-critical phrases —
  // survival basics shouldn't be blocked by non-critical backlog
  const unseenAllPhrases = PHRASES.filter(p => !phrData[p[0]]);
  const unseenPhrases = blockNewPhrases
    ? smartPhraseOrder(unseenAllPhrases.filter(p => p[6]), phrData)
    : smartPhraseOrder(unseenAllPhrases, phrData);

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
    // Only if the character HAS a mnemonic (base kana) AND is actually due.
    // Correct answers reduce error count so leeches can graduate.
    if (errorCount >= 5 && M[ch]) {
      const kanaInfo = kanaData[ch];
      const isDue = !kanaInfo?.next || kanaInfo.next <= Date.now();
      if (isDue) return { type: "leech-review", item: ch, romaji: ROMAJI[ch], mnemonic: M[ch], errorCount, isKana: true };
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

    // Leech treatment: show mnemonic + breakdown for items with 5+ errors.
    // Only if the item is actually due for review — prevents leech from
    // dominating every session even when the user already knows it.
    // Correct answers now reduce error count, so leeches can graduate.
    if (errorCount >= 5) {
      const phrInfo = phrData[p[0]];
      const isDue = !phrInfo?.next || phrInfo.next <= Date.now();
      if (isDue) return { type: "leech-review", item: p, errorCount, isKana: false };
    }

    // Romaji fading — progressive removal to force reading Japanese
    // Research: romaji is a crutch that prevents direct kana reading.
    // Aggressive fading: start hiding at box 1 to force kana reading early.
    // Box 0: always show (first encounter)
    // Box 1: hide 30% (start weaning immediately)
    // Box 2: hide 65% (should be reading kana mostly)
    // Box 3+: hide 95% (romaji is training wheels, take them off)
    const hideRomaji = adjusted >= 3 ? Math.random() < 0.95
      : adjusted >= 2 ? Math.random() < 0.65
      : adjusted >= 1 ? Math.random() < 0.3
      : false;

    // Pick based on weakest skill
    const weak = getWeakestSkill(p[0]);
    if (weak === "listen" && adjusted >= 1) return { type: "phrase-listen", item: p, hideRomaji };
    if (weak === "production" && adjusted >= 2) return { type: "phrase-reverse", item: p, hideRomaji };

    // Default progression — gradual difficulty increase
    // Research: 85% accuracy target (Wilson 2019). Recognition first, production later.
    // Box 0-1: high success rate exercises (scenario, listen)
    // Box 2: introduce reverse (production)
    // Box 3+: production-heavy (recall over recognition)
    const r = Math.random();
    if (adjusted <= 0) {
      // Brand new: recognition only — build confidence
      return r > 0.7 ? { type: "phrase-listen", item: p, hideRomaji } : { type: "phrase-scenario", item: p, hideRomaji };
    }
    if (adjusted <= 1) {
      // Learning: still mostly recognition, 15% reverse to start stretching
      if (r > 0.85) return { type: "phrase-reverse", item: p, hideRomaji };
      if (r > 0.45) return { type: "phrase-listen", item: p, hideRomaji };
      return { type: "phrase-scenario", item: p, hideRomaji };
    }
    if (adjusted <= 2) {
      if (r > 0.6) return { type: "phrase-reverse", item: p, hideRomaji };
      if (r > 0.35 && !shadowDisabled) return { type: "phrase-shadow", item: p };
      if (r > 0.15) return { type: "phrase-listen", item: p, hideRomaji };
      return { type: "phrase-scenario", item: p, hideRomaji };
    }
    if (r > 0.6) return { type: "phrase-reverse", item: p, hideRomaji };
    if (r > 0.4) return { type: "phrase-production", item: p, hideRomaji };
    if (r > 0.25) return { type: "phrase-kana-type", item: p };
    if (r > 0.1 && !shadowDisabled) return { type: "phrase-shadow", item: p };
    return { type: "phrase-listen", item: p, hideRomaji };
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
      if (knownWords.length > 0) queue.push({ type: "word-quiz", word: shuffle(knownWords)[0], reverse: Math.random() < 0.4 });
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
      specialPool.push({ type: "word-quiz", word: shuffle(knownWords)[0], reverse: Math.random() < 0.4 });
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

  // Graded readers — pre-built stories using only known phrases (instant, no API call)
  if (phrasesLearned >= 3) {
    const eligible = GRADED_STORIES.filter(gs =>
      gs.requires.every(id => phrData[id] && (phrData[id].box || 0) >= 1)
    );
    // Pick one the user hasn't seen recently (tracked via data.gradedStoriesSeen)
    const seen = data.gradedStoriesSeen || [];
    const unseen = eligible.filter(gs => !seen.includes(gs.id));
    const pool = unseen.length > 0 ? unseen : eligible; // cycle if all seen
    if (pool.length > 0) {
      specialPool.push({ type: "graded-reader", story: pool[Math.floor(Math.random() * pool.length)] });
    }
  }

  // Phrase chains — connected speech scenarios (requires 5+ phrases)
  if (phrasesLearned >= 5) {
    const eligibleChains = PHRASE_CHAINS.filter(ch =>
      ch.requires.every(id => phrData[id] && (phrData[id].box || 0) >= 1)
    );
    if (eligibleChains.length > 0) {
      specialPool.push({ type: "phrase-chain", chain: eligibleChains[Math.floor(Math.random() * eligibleChains.length)] });
    }
  }

  // Number match — all-numbers drill (unlocks once any n1-n10 seen, 20% chance)
  const knownNumbers = ["n1","n2","n3","n4","n5","n6","n7","n8","n9","n10"]
    .filter(id => phrData[id] && phrData[id].box >= 0);
  if (knownNumbers.length >= 3 && Math.random() < 0.2) {
    specialPool.push({ type: "number-match", numberIds: knownNumbers });
  }

  // Immersion scenes — contextual listening (8+ phrases, 30% chance)
  if (phrasesLearned >= 8 && Math.random() < 0.3) {
    const eligible = IMMERSION_SCENES.filter(scene => {
      const knownCount = scene.phraseIds.filter(id => phrData[id] && phrData[id].box >= 1).length;
      return knownCount >= scene.minKnown;
    });
    if (eligible.length > 0) {
      specialPool.push({ type: "immersion", scene: eligible[Math.floor(Math.random() * eligible.length)] });
    }
  }

  // Bucket sort — categorize words by grammatical function (30% chance, 3+ phrases)
  if (phrasesLearned >= 3 && Math.random() < 0.30) {
    const knownPhraseIds = Object.keys(phrData).filter(id => (phrData[id]?.box || 0) >= 1);
    const payload = buildBucketSort({ phrasesLearned, knownPhraseIds });
    if (payload) specialPool.push({ type: "bucket-sort", payload });
  }

  // Scene study — 2-voice conversational scenes. 4 modes per scene, user progresses through them.
  // Max 1 scene per session (longer than drill cards).
  if (phrasesLearned >= 3 && Math.random() < 0.4) {
    const sceneProgress = data.scenes || {};
    const eligible = SCENE_STUDIES.filter(sc => {
      const prereqMet = sc.requires.every(id => (phrData[id]?.box || 0) >= 1);
      if (!prereqMet) return false;
      const state = sceneProgress[sc.id];
      // Not started, or not done yet
      return !state || state.mode !== "done";
    });
    if (eligible.length > 0) {
      // Each scene has a 4-stage progression: watch → cloze → shadow → roleplay → done.
      // Prefer scenes that haven't been started yet (user discovers new content),
      // then scenes mid-progression (finish what you started).
      const unstarted = eligible.filter(sc => !(sceneProgress[sc.id]?.mode));
      const inProgress = eligible.filter(sc => sceneProgress[sc.id]?.mode && sceneProgress[sc.id].mode !== "done");

      // 60/40 split favoring new scenes when both available, else whichever exists
      let chosen = null;
      if (unstarted.length && inProgress.length) {
        chosen = (Math.random() < 0.6 ? unstarted : inProgress)[Math.floor(Math.random() * (Math.random() < 0.6 ? unstarted.length : inProgress.length))];
        // (simpler: just pick from the chosen pool cleanly)
        const pool = Math.random() < 0.6 ? unstarted : inProgress;
        chosen = pool[Math.floor(Math.random() * pool.length)];
      } else if (unstarted.length) {
        chosen = unstarted[Math.floor(Math.random() * unstarted.length)];
      } else if (inProgress.length) {
        chosen = inProgress[Math.floor(Math.random() * inProgress.length)];
      }

      if (chosen) {
        const mode = sceneProgress[chosen.id]?.mode || "watch";
        specialPool.push({ type: `scene-${mode}`, scene: chosen });
      }
    }
  }

  // ADAPTIVE PRIORITY — items struggling in answerLog go first
  // Don't add to special pool (those compete for slots) — instead force into review queue.
  // We'll surface these as a priority list the queue builder reads.
  const adaptivePriorityPhrases = [...lowAccuracyPhrases, ...slowResponsePhrases]
    .filter((p, i, arr) => arr.findIndex(x => x[0] === p[0]) === i) // dedupe
    .slice(0, 3);

  // Phrase DJ — AI remixes known components into new phrases (10+ phrases known)
  if (phrasesLearned >= 10 && Math.random() < 0.25) {
    const knownPhraseData = PHRASES.filter(p => phrData[p[0]] && phrData[p[0]].box >= 2)
      .map(p => ({ id: p[0], jp: p[1], en: p[3] }));
    if (knownPhraseData.length >= 5) {
      specialPool.push({ type: "phrase-dj", knownPhrases: knownPhraseData });
    }
  }

  // Mistake Memory — AI error analysis
  // Auto-trigger every 5 sessions if any errors exist (forced).
  // Otherwise random 20% chance when 3+ error items.
  const sessionCount = data.settings?.sessionCount || 0;
  const forceMistakeMemory = sessionCount > 0 && sessionCount % 5 === 0 && frequentErrorPhrases.length >= 1;
  const randomMistakeMemory = frequentErrorPhrases.length >= 2 && Math.random() < 0.2;
  if (forceMistakeMemory || randomMistakeMemory) {
    const errorItems = frequentErrorPhrases.slice(0, 5).map(p => ({
      item: p[1], correct: p[3], id: p[0], count: errors[p[0]] || 0,
    }));
    specialPool.push({ type: "mistake-memory", errorItems });
  }

  // AI exercises (probabilistic — not every session)
  // Bumped from 25% → 45% for more comprehensible input exposure
  if (phrasesLearned >= 3 && Math.random() < 0.45) {
    specialPool.push({ type: "story" });
  }
  if (phrasesLearned >= 8 && Math.random() < 0.2) {
    const scenarios = ["restaurant", "hotel", "train station", "convenience store", "asking directions"];
    specialPool.push({ type: "branch-convo", scenario: scenarios[Math.floor(Math.random() * scenarios.length)] });
  }
  // Conversations — boosted frequency, user loves these
  if (phrasesLearned >= 3 && Math.random() < 0.65) {
    const eligible = CONVERSATIONS.filter(conv =>
      conv.lines.filter(l => l.blank).every(l => (phrData[l.correctId]?.box || 0) >= 1)
    );
    if (eligible.length > 0) {
      specialPool.push({ type: "conversation", conversation: eligible[Math.floor(Math.random() * eligible.length)] });
    }
  }

  // Backlog mode: when many items are due, prioritise reviews over new content.
  // Research: retrieval practice on existing knowledge beats introducing new items
  // when retention is at risk (Kornell & Bjork 2008).
  const totalDue = dueKana.length + duePhrases.length;
  const backlogMode = totalDue > 15; // user has a significant review backlog

  // Reserve specials — reduce to 1 when backlog is high (reviews take priority)
  // Shuffle the pool so every exercise type has a fair chance of appearing.
  // Previously, the deterministic order meant confused pairs, grammar patterns,
  // and AI exercises were ALWAYS outcompeted by the first 3 (pattern-assembly,
  // phrase-build, word-quiz) and never appeared.
  const maxSpecials = backlogMode ? 1 : Math.min(specialPool.length, sessionLength <= 10 ? 3 : 4);
  const reservedSpecials = shuffle(specialPool).slice(0, maxSpecials);

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
  // In backlog mode: only 1 slot reserved for new items (clear the backlog first)
  // Normal mode: 3 slots for new items (keep introducing fresh material)
  const usedReviewSlots = queue.length;
  const hasUnseen = unseenKana.length > 0 || unseenPhrases.length > 0;
  // Morning: reserve more slots for new items. Evening: prioritise reviews.
  const newItemReserve = !hasUnseen ? 0 : backlogMode ? 1 : isMorning ? 4 : isEvening ? 1 : 3;
  const dueItemCap = Math.max(reviewSlots - usedReviewSlots - newItemReserve, 2);
  const dueCap = Math.min(dueItemCap, reviewSlots);

  // Split due cap between kana and phrases proportionally
  const dueKanaCount = dueKana.length;
  const duePhrCount = duePhrases.length;
  const dueTotal = dueKanaCount + duePhrCount;
  let kanaDueCap = dueTotal > 0 ? Math.max(Math.round(dueCap * dueKanaCount / dueTotal), 1) : Math.floor(dueCap / 2);

  // Queue rebalance (2026-04): soft-reduce standalone kana drill for learners with decent phrase
  // coverage — they see kana through phrase context via breakdowns, so pure kana drill is lower
  // leverage. Phrase-first pacing.
  //   < 20 phrases learned: no change (kana still the main course)
  //   >= 20 phrases learned: reduce kana slots by ~40%
  if (phrasesLearned >= 20 && kanaDueCap > 1) {
    kanaDueCap = Math.max(1, Math.floor(kanaDueCap * 0.6));
  }
  const phrDueCap = dueCap - kanaDueCap;

  shuffle(dueKana).slice(0, kanaDueCap).forEach(ch => addKana(ch, queue));
  // Adaptive priority phrases first (low accuracy / slow response in last 10 attempts).
  // Then mission-critical unmastered. Then everything else.
  const adaptiveIds = new Set(adaptivePriorityPhrases.map(p => p[0]));
  const duePhrasesSorted = [...duePhrases].sort((a, b) => {
    const aAdaptive = adaptiveIds.has(a[0]) ? 1 : 0;
    const bAdaptive = adaptiveIds.has(b[0]) ? 1 : 0;
    if (aAdaptive !== bAdaptive) return bAdaptive - aAdaptive; // adaptive first
    const aMc = a[6] && (phrData[a[0]]?.box || 0) < 3 ? 1 : 0;
    const bMc = b[6] && (phrData[b[0]]?.box || 0) < 3 ? 1 : 0;
    if (aMc !== bMc) return bMc - aMc; // then mc
    return Math.random() - 0.5;
  });
  // Force-include adaptive priority phrases even when not in due (struggling needs work)
  const forcedAdaptive = adaptivePriorityPhrases.filter(p => !duePhrasesSorted.find(d => d[0] === p[0]));
  [...forcedAdaptive, ...duePhrasesSorted].slice(0, phrDueCap).forEach(p => addPhrase(p, queue));

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
  // Each new item needs 3 slots in the raw queue (try-first + delayed learn + delayed quiz).
  // IMPORTANT: limit to 1 new kana + 1 new phrase per session — introducing 2 of the same
  // type causes the second item's learn card to overflow past sessionLength, meaning the
  // user sees try-first but never gets the lesson card in the same session.
  let newItemCount = 0;
  const MAX_NEW = 5;
  const slotsLeft = reviewSlots - queue.length;

  if (unseenKana.length > 0 && slotsLeft >= 2 && newItemCount < MAX_NEW) {
    // Cap at 1: ensures try-first + learn + quiz all fit within the session
    const maxNewKana = Math.min(1, MAX_NEW - newItemCount);
    const newKana = unseenKana.filter(ch => !usedKana.has(ch)).slice(0, maxNewKana);
    newKana.forEach(ch => {
      usedKana.add(ch);
      queue.push({ type: "try-first-kana", item: ch, romaji: ROMAJI[ch], mnemonic: M[ch] });
      // Delayed items use _triggerIdx to track position relative to try-first card
      queue.push({ type: "_delayed_learn_kana", item: ch, romaji: ROMAJI[ch], mnemonic: M[ch], _triggerIdx: queue.length - 1, delay: 2 });
      queue.push({ type: "_delayed_kana", item: ch, _triggerIdx: queue.length - 2, delay: 4 });
      newItemCount++;
    });
  }
  if (unseenPhrases.length > 0 && slotsLeft >= 1 && newItemCount < MAX_NEW) {
    // Cap at 1: same reason — ensures learn card always follows in the same session
    const maxNewPhr = Math.min(1, MAX_NEW - newItemCount);
    const newPhrases = unseenPhrases.filter(p => !usedPhrases.has(p[0])).slice(0, maxNewPhr);
    newPhrases.forEach(np => {
      usedPhrases.add(np[0]);
      queue.push({ type: "try-first-phrase", item: np });
      queue.push({ type: "_delayed_learn_phrase", item: np, _triggerIdx: queue.length - 1, delay: 2 });
      queue.push({ type: "_delayed_phrase", item: np, _triggerIdx: queue.length - 2, delay: 4 });
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
        t === "pattern-assembly" || t === "story" || t === "graded-reader" || t === "phrase-chain" || t === "phrase-kana-type" || t === "phrase-shadow" || t === "phrase-dj" || t === "mistake-memory" || t === "immersion" || t === "number-match" || t === "branch-convo" || t === "conversation" ||
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

  // Cap leech-review at 1 per session — clusters demoralise
  let leechCount = 0;
  const leechCapped = safeQueue.filter(item => {
    if (item.type === "leech-review") {
      if (leechCount >= 1) return false;
      leechCount++;
    }
    return true;
  });

  // Trim to session length
  return leechCapped.slice(0, sessionLength);
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
