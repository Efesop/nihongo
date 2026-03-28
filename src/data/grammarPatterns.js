// ═══ GRAMMAR PATTERNS ═══
// Patterns that emerge naturally from phrases the user learns.
// Based on Schmidt's Noticing Hypothesis (1990) — explicit attention to
// grammatical forms accelerates acquisition (Norris & Ortega 2000: d=1.13).

export const GRAMMAR_PATTERNS = [
  {
    id: "desu",
    pattern: "です",
    meaning: "is (polite ending)",
    explanation: "Goes at the end of a sentence to make it polite. Like adding 'it is' — おいしいです = 'it IS delicious'. You'll see this in almost every phrase.",
    examples: ["f4", "g9", "f8"], // おいしいです, だいじょうぶです, ひとりです
    phrasePattern: "です",
    unlockAfter: 3,
  },
  {
    id: "ka",
    pattern: "か",
    meaning: "? (makes it a question)",
    explanation: "Stick か on the end and boom — it's a question. No need to rearrange words like in English. いくらです = 'it costs...', いくらですか = 'how much does it cost?'",
    examples: ["s1", "d5", "n13"], // これはいくらですか, ちかいですか, なんじですか
    phrasePattern: "ですか",
    unlockAfter: 2,
  },
  {
    id: "wa",
    pattern: "は",
    meaning: "about... / speaking of...",
    explanation: "Points to what you're talking about. トイレは = 'speaking of the toilet...' then you say what about it (where is it? etc). Written は but pronounced 'wa' when used this way.",
    examples: ["d8", "s1", "t8"], // トイレはどこですか, これはいくらですか, しゅうでんはなんじですか
    phrasePattern: "は",
    unlockAfter: 3,
  },
  {
    id: "wo",
    pattern: "を",
    meaning: "the thing I want / need",
    explanation: "Put what you want BEFORE を, then say what you want done with it. みず を ください = 'water — give me please'. Think of を as an arrow pointing from the thing to the action.",
    examples: ["f1", "f3", "d7"], // これをください, みずをください, ちずをみせてください
    phrasePattern: "を",
    unlockAfter: 3,
  },
  {
    id: "kudasai",
    pattern: "ください",
    meaning: "please (give me / do this)",
    explanation: "The magic word for getting things. Put what you want before it: みず を ください = 'water please'. Also works for actions: みせて ください = 'please show me'.",
    examples: ["f1", "f3", "e1"], // これをください, みずをください, たすけてください
    phrasePattern: "ください",
    unlockAfter: 3,
  },
  {
    id: "onegai",
    pattern: "おねがいします",
    meaning: "please (formal request)",
    explanation: "Fancier version of ください. Use for services and formal situations: check-in, taxis, paying. Shows you're being respectful. チェックイン おねがいします = 'check-in please'.",
    examples: ["h1", "t5", "s3"], // チェックインおねがいします, ...までおねがいします, カードでおねがいします
    phrasePattern: "おねがいします",
    unlockAfter: 2,
  },
  {
    id: "masen",
    pattern: "ません",
    meaning: "don't / not (polite)",
    explanation: "Flips a verb to negative. わかります = 'I understand', わかりません = 'I DON'T understand'. The ません ending is always negative.",
    examples: ["e5"], // にほんごがわかりません
    phrasePattern: "ません",
    unlockAfter: 2,
  },
  {
    id: "ga",
    pattern: "が",
    meaning: "marks what exists / who does it",
    explanation: "Points to the thing that exists or the person doing something. よやく が あります = 'a reservation EXISTS'. アレルギー が あります = 'allergies EXIST (I have allergies)'.",
    examples: ["h2", "f10", "dl4"], // よやくがあります, アレルギーがあります, これがすきです
    phrasePattern: "が",
    unlockAfter: 2,
  },
  {
    id: "de",
    pattern: "で",
    meaning: "by / with / at (how or where)",
    explanation: "Tells HOW you want to do something or WHERE it happens. カード で = 'BY card'. げんきん で = 'WITH cash'. ここ で = 'AT here'. Super versatile little word.",
    examples: ["s3", "s4", "t6"], // カードでおねがいします, げんきんでおねがいします, ここでおろしてください
    phrasePattern: "で",
    unlockAfter: 2,
  },
  {
    id: "doko",
    pattern: "どこ",
    meaning: "where?",
    explanation: "The 'where' word. Pair it with は...ですか and you can ask where ANYTHING is. えきはどこですか = 'where is the station?', トイレはどこですか = 'where is the toilet?'",
    examples: ["d1", "d8", "t1"], // ...はどこですか, トイレはどこですか, えきはどこですか
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
