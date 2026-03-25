// ═══ GRAMMAR PATTERNS ═══
// Patterns that emerge naturally from phrases the user learns.
// Based on Schmidt's Noticing Hypothesis (1990) — explicit attention to
// grammatical forms accelerates acquisition (Norris & Ortega 2000: d=1.13).

export const GRAMMAR_PATTERNS = [
  {
    id: "desu",
    pattern: "です",
    meaning: "is / am / are (polite)",
    explanation: "Makes any sentence polite. Goes at the end. It's the Japanese 'to be'.",
    example: "これは すし です → This is sushi",
    phrasePattern: "です",
    unlockAfter: 3, // user must know 3+ phrases containing this
  },
  {
    id: "ka",
    pattern: "か",
    meaning: "? (question marker)",
    explanation: "Add か to the end to turn any statement into a question. No need to change word order like English.",
    example: "いくら です か → How much is (it)?",
    phrasePattern: "ですか",
    unlockAfter: 2,
  },
  {
    id: "wa",
    pattern: "は",
    meaning: "(topic marker — pronounced 'wa')",
    explanation: "Marks the topic of your sentence. Think of it as 'as for...' — トイレは = 'as for the toilet...'",
    example: "トイレ は どこ です か → As for the toilet, where is it?",
    phrasePattern: "は",
    unlockAfter: 3,
  },
  {
    id: "wo",
    pattern: "を",
    meaning: "(object marker — pronounced 'o')",
    explanation: "Marks what you're doing something TO. The thing before を is what you want, eat, drink, etc.",
    example: "これ を ください → This (object), please",
    phrasePattern: "を",
    unlockAfter: 3,
  },
  {
    id: "kudasai",
    pattern: "ください",
    meaning: "please (give me / do)",
    explanation: "The magic word for getting things. Put what you want before it. Works for objects AND actions.",
    example: "みず を ください → Water, please",
    phrasePattern: "ください",
    unlockAfter: 3,
  },
  {
    id: "onegai",
    pattern: "おねがいします",
    meaning: "please (polite request)",
    explanation: "More formal than ください. Use for services, check-in, reservations. Shows respect.",
    example: "チェックイン おねがいします → Check-in, please",
    phrasePattern: "おねがいします",
    unlockAfter: 2,
  },
  {
    id: "masen",
    pattern: "ません",
    meaning: "not / don't (polite negative)",
    explanation: "Makes verbs negative and polite. わかる (understand) → わかりません (don't understand).",
    example: "わかり ません → I don't understand",
    phrasePattern: "ません",
    unlockAfter: 2,
  },
  {
    id: "ga",
    pattern: "が",
    meaning: "(subject marker)",
    explanation: "Marks who or what does something. Often used with あります (exists) and ほしい (want).",
    example: "よやく が あります → A reservation exists (I have a reservation)",
    phrasePattern: "が",
    unlockAfter: 2,
  },
  {
    id: "de",
    pattern: "で",
    meaning: "at / by / with (location/means)",
    explanation: "Marks WHERE something happens or HOW you do it. えき で = at the station. カード で = by card.",
    example: "げんきん で おねがいします → By cash, please",
    phrasePattern: "で",
    unlockAfter: 2,
  },
  {
    id: "doko",
    pattern: "どこ",
    meaning: "where?",
    explanation: "The universal question word for location. ...はどこですか covers almost any 'where is...?' question.",
    example: "えき は どこ です か → Where is the station?",
    phrasePattern: "どこ",
    unlockAfter: 2,
  },
];

// Helper: check which patterns the user has unlocked based on known phrases
export function getUnlockedPatterns(phrData, allPhrases) {
  return GRAMMAR_PATTERNS.filter(gp => {
    const phrasesWithPattern = allPhrases.filter(p => p[1].includes(gp.phrasePattern));
    const knownCount = phrasesWithPattern.filter(p => (phrData[p[0]]?.box || 0) >= 1).length;
    return knownCount >= gp.unlockAfter;
  });
}
