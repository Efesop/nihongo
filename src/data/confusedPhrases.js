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

  // ═══ Time words — today/tomorrow/yesterday ═══
  {
    ids: ["tm1", "tm2"],
    hint: "きょう = TODAY (kyou — 'now'). あした = TOMORROW (ashita — 'next'). きょう starts with き like 気 (feeling present). あした sounds like 'a-shi-ta' — stepping ahead!",
    diff: "time"
  },
  {
    ids: ["tm2", "tm3"],
    hint: "あした = TOMORROW (forward). きのう = YESTERDAY (backward). Both end differently: した = next, のう = old/past.",
    diff: "time"
  },
  {
    ids: ["tm4", "tm5"],
    hint: "いま = NOW (immediate). あとで = LATER (delayed). いま is short and urgent. あとで has あと (after) built right in!",
    diff: "time"
  },
  {
    ids: ["tm8", "tm9"],
    hint: "あさ = MORNING (bright start 🌅). よる = NIGHT (dark end 🌃). あさ sounds open and fresh. よる sounds deep and dark.",
    diff: "time"
  },

  // ═══ Direction opposites ═══
  {
    ids: ["d2", "d3"],
    hint: "みぎ = RIGHT. ひだり = LEFT. みぎ is short (2 mora) like a quick right turn. ひだり is longer (3 mora) like 'he-dah-ree' stretching left.",
    diff: "opposite"
  },
  {
    ids: ["d5", "d6"],
    hint: "ちかいですか = 'Is it CLOSE?' (yes/no answer). あるいていけますか = 'Can I WALK there?' (asking about walkability). One checks distance, the other checks method.",
    diff: "meaning"
  },

  // ═══ Greeting pairs — time of day ═══
  {
    ids: ["g2", "g3"],
    hint: "おはよう = MORNING greeting (before ~10am). こんばんは = EVENING greeting (after sunset). はよう = early, ばん = evening. Opposite ends of the day!",
    diff: "time"
  },
  {
    ids: ["g1", "g2"],
    hint: "こんにちは = DAYTIME hello (general). おはようございます = MORNING hello (before ~10am). こんにちは works all afternoon; おはよう is early birds only!",
    diff: "time"
  },

  // ═══ は...ですか pattern — same grammar, different questions ═══
  {
    ids: ["s1", "d8"],
    hint: "これはいくらですか = 'How MUCH is this?' (price). トイレはどこですか = 'WHERE is the toilet?' (location). Same は...ですか frame — いくら asks price, どこ asks place.",
    diff: "question-word"
  },
  {
    ids: ["h4", "dl6"],
    hint: "WiFiのパスワードはなんですか = asking for the WiFi PASSWORD. しごとはなんですか = asking someone's JOB. Same なんですか (what is...?) — the topic before は changes everything.",
    diff: "noun"
  },

  // ═══ を...ください pattern — requesting different things ═══
  {
    ids: ["f3", "d7"],
    hint: "みずをください = 'WATER please' (requesting a drink). ちずをみせてください = 'SHOW me the MAP' (requesting an action). を marks the object — but ください vs みせてください changes the request type!",
    diff: "verb"
  },
  {
    ids: ["e3", "e1"],
    hint: "けいさつをよんでください = 'CALL the police' (summon someone). たすけてください = 'HELP me' (direct action). Both are emergencies — よんで = call/summon, たすけて = help/save.",
    diff: "verb"
  },

  // ═══ おねがいします vs ください — two please styles ═══
  {
    ids: ["g8", "f1"],
    hint: "おねがいします = general 'please' (polite request). これをください = 'THIS ONE please' (specific item). おねがいします is versatile; ください is for concrete things you can point at.",
    diff: "structure"
  },

  // ═══ Size adjective pair ═══
  {
    ids: ["dc1", "dc2"],
    hint: "おおきい = BIG (oo = long sound = large). ちいさい = SMALL (chii = tiny sound). The 'oo' in おおきい stretches big. The 'chii' in ちいさい sounds itty-bitty!",
    diff: "opposite"
  },
];
