/**
 * Confused phrase pairs — phrases that look/sound similar but mean different things.
 * Exercises teach learners to distinguish by highlighting the key difference.
 *
 * Each entry: { ids: [phraseId1, phraseId2], hint: "how to tell apart", diff: "key differentiator" }
 * The diff is the particle or word that changes meaning — shown highlighted in the exercise.
 */
export const CONFUSED_PHRASES = [
  // ═══ これ prefix — particle changes everything ═══
  {
    ids: ["f1", "s1"],
    hint: "を (o) marks what you WANT → 'this one please'. は (wa) marks the TOPIC → 'how much is THIS?'. Think: を = action, は = question.",
    diff: "particle"
  },
  {
    ids: ["s1", "dl4"],
    hint: "いくらですか asks the PRICE. すきです expresses LIKING. Same これ, different feeling — wallet vs heart!",
    diff: "ending"
  },
  {
    ids: ["f1", "s6"],
    hint: "ください = 'this one'. ふたつください = 'TWO of these'. The counter ふたつ changes the quantity.",
    diff: "counter"
  },

  // ═══ ～はどこですか — where is X? ═══
  {
    ids: ["t1", "d8"],
    hint: "えき = station, トイレ = toilet. Same 'where is...?' pattern — just swap the noun!",
    diff: "noun"
  },
  {
    ids: ["d1", "e2"],
    hint: "Both ask 'where is...?' — びょういん (hospital) is for emergencies, どこ alone is the general pattern.",
    diff: "noun"
  },

  // ═══ ～はなんですか — what is X? ═══
  {
    ids: ["n13", "tm6"],
    hint: "なんじ = what TIME (時 = hour). なんようび = what DAY (曜日 = day of week). The counter word tells you what you're asking about.",
    diff: "counter"
  },
  {
    ids: ["t3", "dl6"],
    hint: "つぎのえき = next station. しごと = job. Same question pattern (なんですか) but asking about completely different things.",
    diff: "noun"
  },
  {
    ids: ["t8", "h3"],
    hint: "しゅうでん = last train. チェックアウト = checkout. Both ask 'what time?' (なんじですか) — the noun before it changes what you're asking about.",
    diff: "noun"
  },

  // ═══ ～をください vs ～てください — request styles ═══
  {
    ids: ["f3", "e1"],
    hint: "みずをください = requesting a THING (water). たすけてください = requesting an ACTION (help). を + noun vs て + verb!",
    diff: "particle"
  },
  {
    ids: ["e6", "t6"],
    hint: "いってください = say (it) again. おろしてください = let me off. Both use てください for requesting actions — just different verbs!",
    diff: "verb"
  },

  // ═══ おねがいします vs ください — two ways to say please ═══
  {
    ids: ["s3", "s4"],
    hint: "カードで = by CARD. げんきんで = in CASH. Same ending (おねがいします) — the で particle marks the METHOD of payment.",
    diff: "noun"
  },
  {
    ids: ["h1", "h6"],
    hint: "チェックイン = check IN. もういっぱく = one MORE night. Same おねがいします ending — arriving vs extending!",
    diff: "noun"
  },
  {
    ids: ["f2", "t5"],
    hint: "おかんじょう = the bill. ...まで = to [destination]. Both use おねがいします but one is paying, the other is going!",
    diff: "noun"
  },

  // ═══ いくらですか — price confusion ═══
  {
    ids: ["s1", "t2"],
    hint: "これは = 'THIS thing'. ...まで = 'TO [place]'. Both ask 'how much?' — one for items, one for destinations.",
    diff: "particle"
  },
  {
    ids: ["n11", "n12"],
    hint: "ひゃく = 100 (百). せん = 1,000 (千). Same pattern — just the number prefix changes. 10x difference!",
    diff: "number"
  },

  // ═══ Adjective opposites (sound similar, opposite meaning) ═══
  {
    ids: ["dc5", "dc6"],
    hint: "あつい = HOT 🔥. さむい = COLD ❄️. 'Atsui' sounds intense like heat. 'Samui' sounds like 'some way' to get warm.",
    diff: "opposite"
  },
  {
    ids: ["dc3", "dc4"],
    hint: "たかい = expensive/tall (high up 📈). やすい = cheap (easy on wallet 💰). たか- sounds like 'tak' = take your money!",
    diff: "opposite"
  },
  {
    ids: ["dc7", "dc8"],
    hint: "とおい = far (toooo far 😩). ちかい = close/nearby. と sounds stretched out like distance!",
    diff: "opposite"
  },

  // ═══ ～たいです — want to do X ═══
  {
    ids: ["dl1", "dl2"],
    hint: "たべ = eat. のみ = drink. Same ～たいです (want to) pattern — the verb stem changes what you want!",
    diff: "verb"
  },
  {
    ids: ["dl1", "dl3"],
    hint: "たべ = eat. いき = go. Same desire pattern — たべたい = hungry, いきたい = wanderlust!",
    diff: "verb"
  },

  // ═══ Understanding ═══
  {
    ids: ["dl8", "e5"],
    hint: "わかります = I DO understand ✓. わかりません = I DON'T understand ✗. The ません ending flips it to negative!",
    diff: "polarity"
  },

  // ═══ いらないです — declining things ═══
  {
    ids: ["s2", "s7"],
    hint: "ふくろ = bag. レシート = receipt. Same 'I don't need...' pattern. Both save you clutter in Japan!",
    diff: "noun"
  },

  // ═══ Time of day greetings ═══
  {
    ids: ["g1", "g3"],
    hint: "こんにちは = daytime (にち = day/sun 🌞). こんばんは = evening (ばん = evening 🌙). Listen for にち vs ばん!",
    diff: "time"
  },

  // ═══ ひとり vs ふたり — counting people ═══
  {
    ids: ["f8", "f9"],
    hint: "ひとり = ONE person (ひと = one). ふたり = TWO people (ふた = two). Japanese uses special counters for 1-2 people!",
    diff: "counter"
  },

  // ═══ Before vs after eating ═══
  {
    ids: ["f5", "f6"],
    hint: "いただきます = BEFORE eating (I humbly receive). ごちそうさまでした = AFTER eating (it was a feast). Bookend your meals!",
    diff: "timing"
  },
];
