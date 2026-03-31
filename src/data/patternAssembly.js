/**
 * Pattern Assembly — generative sentence construction exercise
 *
 * Instead of memorising fixed phrases, users learn to COMBINE patterns with
 * vocabulary to create sentences they've never seen before.
 *
 * Research: DeKeyser 2007 (skill acquisition theory) — procedural knowledge
 * requires practice combining rules + lexical items, not just memorising examples.
 *
 * Each template defines:
 * - pattern: the grammar frame (e.g. "X はどこですか")
 * - meaning: what the pattern means in English
 * - slots: variable positions with compatible vocabulary
 * - fixedParts: the parts of the pattern that don't change
 * - requiredPhrases: phrase IDs the user must know before this unlocks
 * - examplePhraseId: a known phrase that uses this exact pattern (for the "aha" moment)
 */

export const ASSEMBLY_TEMPLATES = [
  // ═══ LOCATION — X はどこですか ═══
  {
    id: "doko",
    pattern: "X はどこですか",
    meaning: "Where is X?",
    slots: [
      { japanese: "えき", romaji: "eki", meaning: "the station", sourcePhrase: "t1" },
      { japanese: "トイレ", romaji: "toire", meaning: "the toilet", sourcePhrase: "d8" },
      { japanese: "びょういん", romaji: "byouin", meaning: "the hospital", sourcePhrase: "e2" },
      { japanese: "のりかえ", romaji: "norikae", meaning: "the transfer", sourcePhrase: "t4" },
      { japanese: "コンビニ", romaji: "konbini", meaning: "the convenience store", sourcePhrase: null },
      { japanese: "ホテル", romaji: "hoteru", meaning: "the hotel", sourcePhrase: null },
      { japanese: "レストラン", romaji: "resutoran", meaning: "the restaurant", sourcePhrase: null },
    ],
    fixedParts: [
      { japanese: "は", romaji: "wa", meaning: "about...", type: "particle" },
      { japanese: "どこ", romaji: "doko", meaning: "where", type: "question" },
      { japanese: "です", romaji: "desu", meaning: "is", type: "copula" },
      { japanese: "か", romaji: "ka", meaning: "?", type: "particle" },
    ],
    // [slot, は, どこ, です, か]
    buildOrder: ["slot", "は", "どこ", "です", "か"],
    requiredPhrases: ["d8", "t1"], // must know at least 2 "where is" phrases
    examplePhraseId: "d8",
    situation: "You need to find something — ask where it is!",
  },

  // ═══ REQUEST — X をください ═══
  {
    id: "o-kudasai",
    pattern: "X をください",
    meaning: "X please (give me)",
    slots: [
      { japanese: "みず", romaji: "mizu", meaning: "water", sourcePhrase: "f3" },
      { japanese: "これ", romaji: "kore", meaning: "this", sourcePhrase: "f1" },
      { japanese: "ちず", romaji: "chizu", meaning: "a map", sourcePhrase: "d7" },
      { japanese: "メニュー", romaji: "menyuu", meaning: "a menu", sourcePhrase: null },
      { japanese: "ビール", romaji: "biiru", meaning: "a beer", sourcePhrase: null },
      { japanese: "おちゃ", romaji: "ocha", meaning: "tea", sourcePhrase: null },
    ],
    fixedParts: [
      { japanese: "を", romaji: "o", meaning: "the thing I want", type: "particle" },
      { japanese: "ください", romaji: "kudasai", meaning: "please give", type: "verb" },
    ],
    buildOrder: ["slot", "を", "ください"],
    requiredPhrases: ["f1", "f3"],
    examplePhraseId: "f3",
    situation: "You want something — ask for it politely!",
  },

  // ═══ FORMAL REQUEST — X おねがいします ═══
  {
    id: "onegai",
    pattern: "X おねがいします",
    meaning: "X please (formal)",
    slots: [
      { japanese: "チェックイン", romaji: "chekkuin", meaning: "check-in", sourcePhrase: "h1" },
      { japanese: "おかんじょう", romaji: "okanjou", meaning: "the bill", sourcePhrase: "f2" },
      { japanese: "チェックアウト", romaji: "chekkuauto", meaning: "checkout", sourcePhrase: null },
      { japanese: "やきにく", romaji: "yakiniku", meaning: "grilled meat", sourcePhrase: null },
    ],
    fixedParts: [
      { japanese: "おねがい", romaji: "onegai", meaning: "request", type: "noun" },
      { japanese: "します", romaji: "shimasu", meaning: "do", type: "verb" },
    ],
    buildOrder: ["slot", "おねがい", "します"],
    requiredPhrases: ["h1", "f2"],
    examplePhraseId: "h1",
    situation: "You need a service — make a polite request!",
  },

  // ═══ METHOD — X で おねがいします ═══
  {
    id: "de-onegai",
    pattern: "X でおねがいします",
    meaning: "By X please",
    slots: [
      { japanese: "カード", romaji: "kaado", meaning: "card", sourcePhrase: "s3" },
      { japanese: "げんきん", romaji: "genkin", meaning: "cash", sourcePhrase: "s4" },
      { japanese: "スイカ", romaji: "suika", meaning: "Suica", sourcePhrase: null },
      { japanese: "ペイペイ", romaji: "peipei", meaning: "PayPay", sourcePhrase: null },
    ],
    fixedParts: [
      { japanese: "で", romaji: "de", meaning: "by/with", type: "particle" },
      { japanese: "おねがい", romaji: "onegai", meaning: "request", type: "noun" },
      { japanese: "します", romaji: "shimasu", meaning: "do", type: "verb" },
    ],
    buildOrder: ["slot", "で", "おねがい", "します"],
    requiredPhrases: ["s3", "s4"],
    examplePhraseId: "s3",
    situation: "You're paying — say how you want to pay!",
  },

  // ═══ PRICE — X はいくらですか ═══
  {
    id: "ikura",
    pattern: "X はいくらですか",
    meaning: "How much is X?",
    slots: [
      { japanese: "これ", romaji: "kore", meaning: "this", sourcePhrase: "s1" },
      { japanese: "それ", romaji: "sore", meaning: "that", sourcePhrase: null },
      { japanese: "あれ", romaji: "are", meaning: "that over there", sourcePhrase: null },
      { japanese: "きっぷ", romaji: "kippu", meaning: "the ticket", sourcePhrase: null },
    ],
    fixedParts: [
      { japanese: "は", romaji: "wa", meaning: "about...", type: "particle" },
      { japanese: "いくら", romaji: "ikura", meaning: "how much", type: "question" },
      { japanese: "です", romaji: "desu", meaning: "is", type: "copula" },
      { japanese: "か", romaji: "ka", meaning: "?", type: "particle" },
    ],
    buildOrder: ["slot", "は", "いくら", "です", "か"],
    requiredPhrases: ["s1"],
    examplePhraseId: "s1",
    situation: "You see something you might buy — ask the price!",
  },

  // ═══ TIME — X はなんじですか ═══
  {
    id: "nanji",
    pattern: "X はなんじですか",
    meaning: "What time is X?",
    slots: [
      { japanese: "チェックアウト", romaji: "chekkuauto", meaning: "checkout", sourcePhrase: "h3" },
      { japanese: "しゅうでん", romaji: "shuuden", meaning: "the last train", sourcePhrase: "t8" },
      { japanese: "あさごはん", romaji: "asagohan", meaning: "breakfast", sourcePhrase: null },
      { japanese: "フライト", romaji: "furaito", meaning: "the flight", sourcePhrase: null },
    ],
    fixedParts: [
      { japanese: "は", romaji: "wa", meaning: "about...", type: "particle" },
      { japanese: "なんじ", romaji: "nanji", meaning: "what time", type: "question" },
      { japanese: "です", romaji: "desu", meaning: "is", type: "copula" },
      { japanese: "か", romaji: "ka", meaning: "?", type: "particle" },
    ],
    buildOrder: ["slot", "は", "なんじ", "です", "か"],
    requiredPhrases: ["h3", "t8"],
    examplePhraseId: "h3",
    situation: "You need to know what time something happens!",
  },

  // ═══ EXISTENCE — X があります ═══
  {
    id: "ga-arimasu",
    pattern: "X があります",
    meaning: "I have X / there is X",
    slots: [
      { japanese: "よやく", romaji: "yoyaku", meaning: "a reservation", sourcePhrase: "h2" },
      { japanese: "アレルギー", romaji: "arerugii", meaning: "allergies", sourcePhrase: "f10" },
      { japanese: "しつもん", romaji: "shitsumon", meaning: "a question", sourcePhrase: null },
      { japanese: "にもつ", romaji: "nimotsu", meaning: "luggage", sourcePhrase: null },
    ],
    fixedParts: [
      { japanese: "が", romaji: "ga", meaning: "marks what exists", type: "particle" },
      { japanese: "あります", romaji: "arimasu", meaning: "exists / I have", type: "verb" },
    ],
    buildOrder: ["slot", "が", "あります"],
    requiredPhrases: ["h2", "f10"],
    examplePhraseId: "h2",
    situation: "You need to tell someone you have something!",
  },

  // ═══ WANT TO — X たいです ═══
  {
    id: "tai",
    pattern: "X たいです",
    meaning: "I want to X",
    slots: [
      { japanese: "たべ", romaji: "tabe", meaning: "eat", sourcePhrase: "dl1" },
      { japanese: "のみ", romaji: "nomi", meaning: "drink", sourcePhrase: "dl2" },
      { japanese: "いき", romaji: "iki", meaning: "go", sourcePhrase: "dl3" },
      { japanese: "かえり", romaji: "kaeri", meaning: "go home", sourcePhrase: null },
      { japanese: "やすみ", romaji: "yasumi", meaning: "rest", sourcePhrase: null },
    ],
    fixedParts: [
      { japanese: "たい", romaji: "tai", meaning: "want to", type: "suffix" },
      { japanese: "です", romaji: "desu", meaning: "(polite)", type: "copula" },
    ],
    buildOrder: ["slot", "たい", "です"],
    requiredPhrases: ["dl1", "dl2"],
    examplePhraseId: "dl1",
    situation: "Express what you want to do!",
  },

  // ═══ ACTION REQUEST — X を V てください ═══
  {
    id: "te-kudasai",
    pattern: "X をVてください",
    meaning: "Please V X",
    slots: [
      { japanese: "けいさつ", romaji: "keisatsu", meaning: "the police", verb: "よんで", verbMeaning: "call", sourcePhrase: "e3" },
      { japanese: "ちず", romaji: "chizu", meaning: "a map", verb: "みせて", verbMeaning: "show", sourcePhrase: "d7" },
      { japanese: "しゃしん", romaji: "shashin", meaning: "a photo", verb: "とって", verbMeaning: "take", sourcePhrase: "dl9" },
      { japanese: "タクシー", romaji: "takushii", meaning: "a taxi", verb: "よんで", verbMeaning: "call", sourcePhrase: null },
    ],
    fixedParts: [
      { japanese: "を", romaji: "o", meaning: "the thing", type: "particle" },
      { japanese: "ください", romaji: "kudasai", meaning: "please", type: "verb" },
    ],
    // For this pattern, verb is part of the slot — build order is special
    buildOrder: ["slot", "を", "verb", "ください"],
    requiredPhrases: ["e3", "d7"],
    examplePhraseId: "e3",
    situation: "You need someone to do something — ask politely!",
    hasVerb: true,
  },

  // ═══ NOT NEEDED — X はいらないです ═══
  {
    id: "iranai",
    pattern: "X はいらないです",
    meaning: "I don't need X",
    slots: [
      { japanese: "ふくろ", romaji: "fukuro", meaning: "a bag", sourcePhrase: "s2" },
      { japanese: "レシート", romaji: "reshiito", meaning: "a receipt", sourcePhrase: "s7" },
      { japanese: "おはし", romaji: "ohashi", meaning: "chopsticks", sourcePhrase: null },
      { japanese: "ストロー", romaji: "sutoroo", meaning: "a straw", sourcePhrase: null },
    ],
    fixedParts: [
      { japanese: "は", romaji: "wa", meaning: "about...", type: "particle" },
      { japanese: "いらない", romaji: "iranai", meaning: "not needed", type: "adjective" },
      { japanese: "です", romaji: "desu", meaning: "(polite)", type: "copula" },
    ],
    buildOrder: ["slot", "は", "いらない", "です"],
    requiredPhrases: ["s2", "s7"],
    examplePhraseId: "s2",
    situation: "You want to decline something politely!",
  },
];

/**
 * Get unlocked assembly templates based on user's phrase progress
 */
export function getUnlockedTemplates(phrData) {
  return ASSEMBLY_TEMPLATES.filter(t =>
    t.requiredPhrases.every(id => (phrData[id]?.box || 0) >= 1)
  );
}

/**
 * Generate a novel assembly challenge from a template
 * Picks a slot the user HASN'T seen as that exact phrase (novel combination)
 * Falls back to any slot if all are known
 */
export function generateAssemblyChallenge(template, phrData) {
  // Prefer novel combinations (vocabulary the user knows but hasn't seen in this pattern)
  const novelSlots = template.slots.filter(s => !s.sourcePhrase || !(phrData[s.sourcePhrase]?.box >= 1));
  const knownSlots = template.slots.filter(s => s.sourcePhrase && (phrData[s.sourcePhrase]?.box || 0) >= 1);

  // 60% chance of novel if available, 40% chance of known (reinforcement)
  let slot;
  if (novelSlots.length > 0 && Math.random() < 0.6) {
    slot = novelSlots[Math.floor(Math.random() * novelSlots.length)];
  } else if (knownSlots.length > 0) {
    slot = knownSlots[Math.floor(Math.random() * knownSlots.length)];
  } else {
    slot = template.slots[Math.floor(Math.random() * template.slots.length)];
  }

  // Build the correct answer pieces
  const pieces = template.buildOrder.map(part => {
    if (part === "slot") return { japanese: slot.japanese, romaji: slot.romaji, meaning: slot.meaning, type: "noun", isSlot: true };
    if (part === "verb" && template.hasVerb) return { japanese: slot.verb, romaji: "", meaning: slot.verbMeaning, type: "verb", isVerb: true };
    const fixed = template.fixedParts.find(f => f.japanese === part);
    if (fixed) return { ...fixed };
    return { japanese: part, romaji: "", meaning: "", type: "unknown" };
  });

  // Build the full English prompt
  let englishPrompt = template.meaning.replace("X", slot.meaning);
  if (template.hasVerb && slot.verb) {
    englishPrompt = `Please ${slot.verbMeaning} ${slot.meaning}`;
  }

  // Generate distractors — wrong pieces to make it harder
  // Pick 2-3 plausible wrong pieces from other templates' fixed parts and other slots
  const allFixedParts = ASSEMBLY_TEMPLATES.flatMap(t => t.fixedParts.map(f => f.japanese));
  const otherSlotWords = template.slots
    .filter(s => s.japanese !== slot.japanese)
    .map(s => ({ japanese: s.japanese, romaji: s.romaji, meaning: s.meaning, type: "noun", isDistractor: true }));

  const otherParticles = [
    { japanese: "に", romaji: "ni", meaning: "to/at", type: "particle", isDistractor: true },
    { japanese: "も", romaji: "mo", meaning: "also", type: "particle", isDistractor: true },
    { japanese: "の", romaji: "no", meaning: "'s", type: "particle", isDistractor: true },
    { japanese: "から", romaji: "kara", meaning: "from", type: "particle", isDistractor: true },
    { japanese: "まで", romaji: "made", meaning: "until", type: "particle", isDistractor: true },
  ].filter(d => !pieces.some(p => p.japanese === d.japanese));

  // Pick 2 distractors: 1 wrong noun + 1 wrong particle/word
  const distractors = [];
  if (otherSlotWords.length > 0) {
    distractors.push(otherSlotWords[Math.floor(Math.random() * otherSlotWords.length)]);
  }
  const wrongParticle = otherParticles[Math.floor(Math.random() * otherParticles.length)];
  if (wrongParticle) distractors.push(wrongParticle);

  return {
    templateId: template.id,
    pattern: template.pattern,
    patternMeaning: template.meaning,
    situation: template.situation,
    englishPrompt,
    correctPieces: pieces,
    distractors,
    allPieces: pieces.concat(distractors), // will be shuffled by the UI
    examplePhraseId: template.examplePhraseId,
    isNovel: !slot.sourcePhrase || !(phrData[slot.sourcePhrase]?.box >= 1),
  };
}
