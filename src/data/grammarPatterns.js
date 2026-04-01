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
  {
    id: "tai",
    pattern: "～たいです",
    meaning: "I want to...",
    explanation: "Swap the ます ending of a verb for たいです to say you WANT to do it. たべます → たべたいです = 'I want to eat'. のみます → のみたいです = 'I want to drink'. Simple and super useful.",
    examples: ["dl1", "dl2", "dl3"], // たべたいです, のみたいです, いきたいです
    phrasePattern: "たいです",
    unlockAfter: 2,
  },
  {
    id: "made",
    pattern: "まで",
    meaning: "to / until (destination or limit)",
    explanation: "Marks where you're going TO or how far something extends. えきまで = 'to the station'. ...までいくらですか = 'how much to...?'. Think of it as drawing a line to a destination.",
    examples: ["t2", "t5"], // ...までいくらですか, ...までおねがいします
    phrasePattern: "まで",
    unlockAfter: 2,
  },
  {
    id: "no",
    pattern: "の",
    meaning: "possessive / linking ('s / of)",
    explanation: "Connects two nouns — the first one describes or owns the second. つぎのえき = 'next's station' = 'next station'. WiFiのパスワード = 'WiFi's password'. Like putting 's between words.",
    examples: ["t3", "h4"], // つぎのえきはなんですか, WiFiのパスワードはなんですか
    phrasePattern: "の",
    unlockAfter: 2,
  },
  {
    id: "nandesuka",
    pattern: "なんですか",
    meaning: "what is...?",
    explanation: "なん means 'what' and ですか makes it a polite question. Pair with は to ask 'what is X?': おすすめはなんですか = 'what is the recommendation?', しごとはなんですか = 'what is your job?'",
    examples: ["f7", "t3", "h4", "dl6"], // おすすめはなんですか, つぎのえきはなんですか, WiFiのパスワードはなんですか, しごとはなんですか
    phrasePattern: "なんですか",
    unlockAfter: 2,
  },
  {
    id: "te-kudasai",
    pattern: "～てください",
    meaning: "please do... (verb request)",
    explanation: "Change a verb into its て-form and add ください to politely ask someone to DO something. みせてください = 'please show me', おろしてください = 'please let me off'. The て-form is a key building block in Japanese.",
    examples: ["t6", "d7", "e1", "e6"], // おろしてください, みせてください, たすけてください, いってください
    phrasePattern: "てください",
    unlockAfter: 2,
  },
  {
    id: "iranai",
    pattern: "いらないです",
    meaning: "I don't need... (polite refusal)",
    explanation: "いらない means 'don't need/want' — add です to keep it polite. Perfect for declining things at shops: ふくろはいらないです = 'I don't need a bag'. A gentler way to say no than いいえ.",
    examples: ["s2", "s7"], // ふくろはいらないです, レシートはいらないです
    phrasePattern: "いらないです",
    unlockAfter: 2,
  },
  {
    id: "mashita",
    pattern: "～ました",
    meaning: "did / has done (polite past)",
    explanation: "Swap ます for ました and the verb becomes past tense. きます → きました = 'came'. つかれます → つかれました = 'got tired'. Same polite level, just in the past.",
    examples: ["dl7", "dl11", "dl12"], // どこからきましたか, つかれました, おなかがすきました
    phrasePattern: "ました",
    unlockAfter: 2,
  },
  {
    id: "nanji",
    pattern: "なんじ",
    meaning: "what time?",
    explanation: "なん = 'what' + じ = 'o'clock'. Put it in a question to ask about time: なんじですか = 'what time is it?', しゅうでんはなんじですか = 'what time is the last train?'. Essential for catching trains.",
    examples: ["n13", "t8", "h3"], // なんじですか, しゅうでんはなんじですか, チェックアウトはなんじですか
    phrasePattern: "なんじ",
    unlockAfter: 2,
  },
  {
    id: "mou",
    pattern: "もう",
    meaning: "more / again / already",
    explanation: "A versatile little word. もういっぱく = 'one MORE night'. もういちど = 'one MORE time' (= 'again'). Placed before the thing you want more of. Handy for extending stays or asking for repeats.",
    examples: ["h6", "e6"], // もういっぱくおねがいします, もういちどいってください
    phrasePattern: "もう",
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
