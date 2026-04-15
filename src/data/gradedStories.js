/**
 * Graded readers — pre-written mini dialogues using known phrases.
 * Each story is unlocked when the user knows ALL of its required phrases (box >= 1).
 *
 * Format:
 *   title: Story title (English)
 *   requires: phrase IDs the user must know
 *   sentences: [{ jp, romaji, en, speaker: "a"|"b", role?: "Customer"|"Staff"|... }]
 *     - speaker: "a" (left bubble, neutral) or "b" (right bubble, you)
 *     - role: optional short label above bubble
 *   comprehension: { question, options, correctIndex, explanation }
 *
 * Writing principle: real dialogue has back-and-forth. Each speaker's turn
 * responds to the other. Non-required filler phrases (いらっしゃいませ, はい
 * どうぞ, etc) are OK — they provide natural context even if not in the
 * learner's SRS.
 */
export const GRADED_STORIES = [
  // ── LEVEL 1: First day basics (greetings only) ──
  {
    id: "gs1",
    title: "First Morning in Tokyo",
    requires: ["g1", "g2", "g4", "g8"],
    sentences: [
      { jp: "おはようございます。", romaji: "o-ha-you go-zai-ma-su.", en: "Good morning.", speaker: "b", role: "You" },
      { jp: "おはようございます！", romaji: "o-ha-you go-zai-ma-su!", en: "Good morning!", speaker: "a", role: "Hotel staff" },
      { jp: "コーヒーをおねがいします。", romaji: "koo-hii o o-ne-gai-shi-ma-su.", en: "Coffee please.", speaker: "b", role: "You" },
      { jp: "はい、どうぞ。", romaji: "hai, dou-zo.", en: "Yes, here you go.", speaker: "a", role: "Staff" },
      { jp: "ありがとうございます。", romaji: "a-ri-ga-tou go-zai-ma-su.", en: "Thank you.", speaker: "b", role: "You" },
    ],
    comprehension: {
      question: "What time of day is this scene?",
      options: ["Late at night", "Morning", "Afternoon", "Evening"],
      correctIndex: 1,
      explanation: "おはようございます is the polite morning greeting, used before about 10am.",
    },
  },
  {
    id: "gs2",
    title: "At the Convenience Store",
    requires: ["g5", "g6", "g8", "s2"],
    sentences: [
      { jp: "いらっしゃいませ！", romaji: "i-ras-shai-ma-se!", en: "Welcome!", speaker: "a", role: "Clerk" },
      { jp: "すみません、これをおねがいします。", romaji: "su-mi-ma-sen, ko-re o o-ne-gai-shi-ma-su.", en: "Excuse me, this please.", speaker: "b", role: "You" },
      { jp: "ふくろはいりますか？", romaji: "fu-ku-ro wa i-ri-ma-su ka?", en: "Do you need a bag?", speaker: "a", role: "Clerk" },
      { jp: "ふくろはいらないです。", romaji: "fu-ku-ro wa i-ra-nai de-su.", en: "I don't need a bag.", speaker: "b", role: "You" },
      { jp: "はい。ありがとうございます。", romaji: "hai. a-ri-ga-tou go-zai-ma-su.", en: "Yes. Thank you.", speaker: "a", role: "Clerk" },
    ],
    comprehension: {
      question: "Did the customer want a bag?",
      options: ["Yes, they asked for one", "No, they refused one", "They didn't answer", "They asked for two bags"],
      correctIndex: 1,
      explanation: "ふくろはいらないです means 'I don't need a bag' — bags cost extra in Japan.",
    },
  },

  // ── LEVEL 2: Restaurant basics ──
  {
    id: "gs3",
    title: "Lunch at the Ramen Shop",
    requires: ["f1", "f3", "f5", "f4", "g4"],
    sentences: [
      { jp: "いらっしゃいませ！なんめいさまですか？", romaji: "i-ras-shai-ma-se! nan-mei-sa-ma de-su ka?", en: "Welcome! How many people?", speaker: "a", role: "Staff" },
      { jp: "ひとりです。", romaji: "hi-to-ri de-su.", en: "One person.", speaker: "b", role: "You" },
      { jp: "こちらへどうぞ。", romaji: "ko-chi-ra e dou-zo.", en: "This way please.", speaker: "a", role: "Staff" },
      { jp: "これをください。みずもおねがいします。", romaji: "ko-re o ku-da-sai. mi-zu mo o-ne-gai-shi-ma-su.", en: "This one please. And water.", speaker: "b", role: "You" },
      { jp: "かしこまりました。", romaji: "ka-shi-ko-ma-ri-ma-shi-ta.", en: "Certainly.", speaker: "a", role: "Staff" },
      { jp: "いただきます。...おいしいです！", romaji: "i-ta-da-ki-ma-su. ...oi-shii de-su!", en: "(Before eating) ...Delicious!", speaker: "b", role: "You" },
    ],
    comprehension: {
      question: "What did the person think of the food?",
      options: ["They didn't like it", "It was OK", "It was delicious", "It was too spicy"],
      correctIndex: 2,
      explanation: "おいしいです means 'It's delicious!' — restaurant staff love hearing this.",
    },
  },
  {
    id: "gs4",
    title: "Restaurant for Two",
    requires: ["f8", "f9", "f7", "f1", "f6"],
    sentences: [
      { jp: "いらっしゃいませ。", romaji: "i-ras-shai-ma-se.", en: "Welcome.", speaker: "a", role: "Staff" },
      { jp: "ふたりです。", romaji: "fu-ta-ri de-su.", en: "Two people.", speaker: "b", role: "You" },
      { jp: "こちらのせきへどうぞ。", romaji: "ko-chi-ra no se-ki e dou-zo.", en: "This seat please.", speaker: "a", role: "Staff" },
      { jp: "おすすめはなんですか？", romaji: "o-su-su-me wa nan de-su ka?", en: "What do you recommend?", speaker: "b", role: "You" },
      { jp: "きょうはおさかなです。", romaji: "kyou wa o-sa-ka-na de-su.", en: "Today it's the fish.", speaker: "a", role: "Staff" },
      { jp: "じゃあ、これをください。", romaji: "jaa, ko-re o ku-da-sai.", en: "Then this one please.", speaker: "b", role: "You" },
      { jp: "ごちそうさまでした。", romaji: "go-chi-sou-sa-ma de-shi-ta.", en: "(After eating — thanks for the meal)", speaker: "b", role: "You" },
    ],
    comprehension: {
      question: "How many people came to the restaurant?",
      options: ["One", "Two", "Three", "Four"],
      correctIndex: 1,
      explanation: "ふたりです means 'Two people' — state your party size when entering.",
    },
  },

  // ── LEVEL 3: Getting around ──
  {
    id: "gs5",
    title: "Finding the Station",
    requires: ["g5", "t1", "d5", "d4", "g4"],
    sentences: [
      { jp: "すみません。", romaji: "su-mi-ma-sen.", en: "Excuse me.", speaker: "b", role: "You" },
      { jp: "はい、なんでしょうか？", romaji: "hai, nan de-shou ka?", en: "Yes, what is it?", speaker: "a", role: "Local" },
      { jp: "えきはどこですか？", romaji: "e-ki wa do-ko de-su ka?", en: "Where is the station?", speaker: "b", role: "You" },
      { jp: "まっすぐですよ。", romaji: "mas-su-gu de-su yo.", en: "It's straight ahead.", speaker: "a", role: "Local" },
      { jp: "ちかいですか？", romaji: "chi-kai de-su ka?", en: "Is it close?", speaker: "b", role: "You" },
      { jp: "はい、ちかいです。", romaji: "hai, chi-kai de-su.", en: "Yes, it's close.", speaker: "a", role: "Local" },
      { jp: "ありがとうございます。", romaji: "a-ri-ga-tou go-zai-ma-su.", en: "Thank you.", speaker: "b", role: "You" },
    ],
    comprehension: {
      question: "Which direction is the station?",
      options: ["Right", "Left", "Straight ahead", "Behind"],
      correctIndex: 2,
      explanation: "まっすぐ means 'straight ahead' — essential direction word.",
    },
  },
  {
    id: "gs6",
    title: "Taxi to the Hotel",
    requires: ["t5", "h1", "h2", "g4"],
    sentences: [
      { jp: "どちらまで？", romaji: "do-chi-ra ma-de?", en: "Where to?", speaker: "a", role: "Driver" },
      { jp: "ホテルまでおねがいします。", romaji: "ho-te-ru ma-de o-ne-gai-shi-ma-su.", en: "To the hotel please.", speaker: "b", role: "You" },
      { jp: "はい、しゅっぱつします。", romaji: "hai, shup-pa-tsu shi-ma-su.", en: "OK, departing.", speaker: "a", role: "Driver" },
      { jp: "（...つきました）ありがとうございます。", romaji: "(...tsu-ki-ma-shi-ta) a-ri-ga-tou go-zai-ma-su.", en: "(...arrived) Thank you.", speaker: "b", role: "You" },
      { jp: "チェックインおねがいします。よやくがあります。", romaji: "chek-ku-in o-ne-gai-shi-ma-su. yo-ya-ku ga a-ri-ma-su.", en: "Check in please. I have a reservation.", speaker: "b", role: "You" },
      { jp: "おなまえをどうぞ。", romaji: "o-na-ma-e o dou-zo.", en: "Your name please.", speaker: "a", role: "Hotel staff" },
    ],
    comprehension: {
      question: "Where did the person go by taxi?",
      options: ["The station", "The restaurant", "The hotel", "The airport"],
      correctIndex: 2,
      explanation: "ホテルまでおねがいします — 'made' means 'to (destination)'.",
    },
  },

  // ── LEVEL 4: Shopping + paying ──
  {
    id: "gs7",
    title: "Shopping in Akihabara",
    requires: ["s1", "s3", "g5", "g4", "dc3", "dc4"],
    sentences: [
      { jp: "すみません、これはいくらですか？", romaji: "su-mi-ma-sen, ko-re wa i-ku-ra de-su ka?", en: "Excuse me, how much is this?", speaker: "b", role: "You" },
      { jp: "それは、にまんえんです。", romaji: "so-re wa, ni-man-en de-su.", en: "That is 20,000 yen.", speaker: "a", role: "Clerk" },
      { jp: "たかい...。こちらは？", romaji: "ta-kai... ko-chi-ra wa?", en: "Expensive... How about this one?", speaker: "b", role: "You" },
      { jp: "それはやすいです。ごせんえんです。", romaji: "so-re wa ya-sui de-su. go-sen-en de-su.", en: "That's cheap. 5,000 yen.", speaker: "a", role: "Clerk" },
      { jp: "じゃあ、これをください。カードでおねがいします。", romaji: "jaa, ko-re o ku-da-sai. kaa-do de o-ne-gai-shi-ma-su.", en: "Then this one please. By card.", speaker: "b", role: "You" },
      { jp: "ありがとうございます。", romaji: "a-ri-ga-tou go-zai-ma-su.", en: "Thank you.", speaker: "a", role: "Clerk" },
    ],
    comprehension: {
      question: "How did the person pay?",
      options: ["Cash", "By card", "IC card", "They didn't buy anything"],
      correctIndex: 1,
      explanation: "カードでおねがいします means 'By card please'.",
    },
  },
  {
    id: "gs8",
    title: "Buying Souvenirs",
    requires: ["s1", "s6", "s4", "s7", "g4"],
    sentences: [
      { jp: "これはいくらですか？", romaji: "ko-re wa i-ku-ra de-su ka?", en: "How much is this?", speaker: "b", role: "You" },
      { jp: "ひとつせんえんです。", romaji: "hi-to-tsu sen-en de-su.", en: "1,000 yen each.", speaker: "a", role: "Clerk" },
      { jp: "じゃあ、これをふたつください。", romaji: "jaa, ko-re o fu-ta-tsu ku-da-sai.", en: "Then two of these please.", speaker: "b", role: "You" },
      { jp: "おしはらいは？", romaji: "o-shi-ha-rai wa?", en: "Payment method?", speaker: "a", role: "Clerk" },
      { jp: "げんきんでおねがいします。", romaji: "gen-kin de o-ne-gai-shi-ma-su.", en: "Cash please.", speaker: "b", role: "You" },
      { jp: "レシートはいりますか？", romaji: "re-shii-to wa i-ri-ma-su ka?", en: "Do you want a receipt?", speaker: "a", role: "Clerk" },
      { jp: "レシートはいらないです。", romaji: "re-shii-to wa i-ra-nai de-su.", en: "No receipt needed.", speaker: "b", role: "You" },
    ],
    comprehension: {
      question: "How many did the person buy?",
      options: ["One", "Two", "Three", "Four"],
      correctIndex: 1,
      explanation: "ふたつ means 'two (things)' — これをふたつください = 'Two of these please'.",
    },
  },

  // ── LEVEL 5: Daily life conversations ──
  {
    id: "gs9",
    title: "Making Friends at a Café",
    requires: ["g1", "dl7", "dl5", "dl10", "g4"],
    sentences: [
      { jp: "こんにちは！", romaji: "kon-ni-chi-wa!", en: "Hello!", speaker: "a", role: "Local" },
      { jp: "こんにちは。", romaji: "kon-ni-chi-wa.", en: "Hello.", speaker: "b", role: "You" },
      { jp: "どこからきましたか？", romaji: "do-ko ka-ra ki-ma-shi-ta ka?", en: "Where are you from?", speaker: "a", role: "Local" },
      { jp: "イギリスからきました。にほんごをべんきょうしています。", romaji: "i-gi-ri-su ka-ra ki-ma-shi-ta. ni-hon-go o ben-kyou shi-te i-ma-su.", en: "I'm from the UK. I'm studying Japanese.", speaker: "b", role: "You" },
      { jp: "すごいですね！むずかしいですか？", romaji: "su-goi de-su ne! mu-zu-ka-shii de-su ka?", en: "Amazing! Is it difficult?", speaker: "a", role: "Local" },
      { jp: "むずかしいですが、たのしいです！", romaji: "mu-zu-ka-shii de-su ga, ta-no-shii de-su!", en: "It's difficult, but fun!", speaker: "b", role: "You" },
    ],
    comprehension: {
      question: "What is the person studying?",
      options: ["English", "Japanese", "Cooking", "History"],
      correctIndex: 1,
      explanation: "にほんごをべんきょうしています = 'I'm studying Japanese'.",
    },
  },
  {
    id: "gs10",
    title: "A Long Day in Kyoto",
    requires: ["dl11", "dl12", "dl1", "dl2", "f4"],
    sentences: [
      { jp: "つかれました...。", romaji: "tsu-ka-re-ma-shi-ta...", en: "I'm tired...", speaker: "b", role: "You" },
      { jp: "だいじょうぶですか？", romaji: "dai-jou-bu de-su ka?", en: "Are you OK?", speaker: "a", role: "Friend" },
      { jp: "おなかがすきました。たべたいです。", romaji: "o-na-ka ga su-ki-ma-shi-ta. ta-be-tai de-su.", en: "I'm hungry. I want to eat.", speaker: "b", role: "You" },
      { jp: "あそこのレストランはどうですか？", romaji: "a-so-ko no re-su-to-ran wa dou de-su ka?", en: "How about that restaurant?", speaker: "a", role: "Friend" },
      { jp: "いいですね。のみたいです、ビールを！", romaji: "ii de-su ne. no-mi-tai de-su, bii-ru o!", en: "Sounds good. I want to drink — a beer!", speaker: "b", role: "You" },
      { jp: "（たべて）おいしいです！", romaji: "(ta-be-te) oi-shii de-su!", en: "(eating) Delicious!", speaker: "b", role: "You" },
    ],
    comprehension: {
      question: "How was the person feeling at the start?",
      options: ["Happy and energetic", "Tired and hungry", "Sick", "Lost"],
      correctIndex: 1,
      explanation: "つかれました (tired) + おなかがすきました (hungry) — classic sightseeing combo.",
    },
  },

  // ── LEVEL 6: Emergency + complex situations ──
  {
    id: "gs11",
    title: "Lost in Shinjuku",
    requires: ["g5", "e4", "e5", "d1", "d7"],
    sentences: [
      { jp: "すみません！", romaji: "su-mi-ma-sen!", en: "Excuse me!", speaker: "b", role: "You" },
      { jp: "はい？", romaji: "hai?", en: "Yes?", speaker: "a", role: "Passerby" },
      { jp: "にほんごがわかりません。えいごをはなせますか？", romaji: "ni-hon-go ga wa-ka-ri-ma-sen. ei-go o ha-na-se-ma-su ka?", en: "I don't understand Japanese. Do you speak English?", speaker: "b", role: "You" },
      { jp: "すこしだけ。だいじょうぶですか？", romaji: "su-ko-shi da-ke. dai-jou-bu de-su ka?", en: "Just a little. Are you OK?", speaker: "a", role: "Passerby" },
      { jp: "ホテルはどこですか？ちずをみせてください。", romaji: "ho-te-ru wa do-ko de-su ka? chi-zu o mi-se-te ku-da-sai.", en: "Where is the hotel? Show me the map please.", speaker: "b", role: "You" },
      { jp: "ああ、ここです。ちかいですよ。", romaji: "aa, ko-ko de-su. chi-kai de-su yo.", en: "Ah, it's here. It's close.", speaker: "a", role: "Passerby" },
    ],
    comprehension: {
      question: "What was the person's problem?",
      options: ["They were hungry", "They couldn't find their hotel", "They lost their wallet", "The train was late"],
      correctIndex: 1,
      explanation: "Lost — asking for directions, showing a map, looking for their hotel.",
    },
  },
  {
    id: "gs12",
    title: "A Full Day: Morning to Night",
    requires: ["tm1", "tm8", "tm9", "g2", "g3", "dl3"],
    sentences: [
      { jp: "きょうのあさ、なにをしますか？", romaji: "kyou no a-sa, na-ni o shi-ma-su ka?", en: "This morning, what will you do?", speaker: "a", role: "Friend" },
      { jp: "おはようございます。こうえんにいきたいです。", romaji: "o-ha-you go-zai-ma-su. kou-en ni i-ki-tai de-su.", en: "Good morning. I want to go to the park.", speaker: "b", role: "You" },
      { jp: "よる、ごはんはいっしょに？", romaji: "yo-ru, go-han wa is-sho ni?", en: "Evening, dinner together?", speaker: "a", role: "Friend" },
      { jp: "いいですね。こんばんは、いざかやに！", romaji: "ii de-su ne. kon-ban wa, i-za-ka-ya ni!", en: "Good idea. Tonight, to the izakaya!", speaker: "b", role: "You" },
    ],
    comprehension: {
      question: "What time words appear in this story?",
      options: ["Yesterday and tomorrow", "Morning and evening", "Monday and Friday", "Now and later"],
      correctIndex: 1,
      explanation: "あさ (morning) and よる (night/evening) bookend a full day.",
    },
  },

  // ── LEVEL 7: Bigger scenarios ──
  {
    id: "gs13",
    title: "The Perfect Restaurant Visit",
    requires: ["f8", "f3", "f7", "f1", "f5", "f4", "f2", "f6"],
    sentences: [
      { jp: "いらっしゃいませ！", romaji: "i-ras-shai-ma-se!", en: "Welcome!", speaker: "a", role: "Staff" },
      { jp: "ひとりです。", romaji: "hi-to-ri de-su.", en: "One person.", speaker: "b", role: "You" },
      { jp: "こちらへどうぞ。", romaji: "ko-chi-ra e dou-zo.", en: "This way.", speaker: "a", role: "Staff" },
      { jp: "みずをください。おすすめはなんですか？", romaji: "mi-zu o ku-da-sai. o-su-su-me wa nan de-su ka?", en: "Water please. What do you recommend?", speaker: "b", role: "You" },
      { jp: "てんぷらていしょくがおすすめです。", romaji: "ten-pu-ra tei-shoku ga o-su-su-me de-su.", en: "The tempura set is recommended.", speaker: "a", role: "Staff" },
      { jp: "じゃあ、これをください。", romaji: "jaa, ko-re o ku-da-sai.", en: "Then this please.", speaker: "b", role: "You" },
      { jp: "いただきます。...おいしいです！", romaji: "i-ta-da-ki-ma-su. ...oi-shii de-su!", en: "(Before eating) ...Delicious!", speaker: "b", role: "You" },
      { jp: "おかんじょうおねがいします。", romaji: "o-kan-jou o-ne-gai-shi-ma-su.", en: "Bill please.", speaker: "b", role: "You" },
      { jp: "ありがとうございました。", romaji: "a-ri-ga-tou go-zai-ma-shi-ta.", en: "Thank you.", speaker: "a", role: "Staff" },
      { jp: "ごちそうさまでした。", romaji: "go-chi-sou-sa-ma de-shi-ta.", en: "(After eating — thanks for the meal)", speaker: "b", role: "You" },
    ],
    comprehension: {
      question: "What is the correct order? (before eating → after eating)",
      options: [
        "ごちそうさまでした → いただきます",
        "いただきます → ごちそうさまでした",
        "おいしいです → いただきます",
        "おかんじょう → いただきます",
      ],
      correctIndex: 1,
      explanation: "いただきます before eating, ごちそうさまでした after — meal etiquette.",
    },
  },
  {
    id: "gs14",
    title: "Weather Talk",
    requires: ["dc5", "dc6", "tm1", "tm2", "g9"],
    sentences: [
      { jp: "きょうはあついですね。", romaji: "kyou wa a-tsui de-su ne.", en: "Today's hot, isn't it.", speaker: "a", role: "Local" },
      { jp: "はい、ほんとうにあついです。", romaji: "hai, hon-tou ni a-tsui de-su.", en: "Yes, really hot.", speaker: "b", role: "You" },
      { jp: "あしたはさむいらしいですよ。", romaji: "a-shi-ta wa sa-mui ra-shii de-su yo.", en: "Tomorrow will be cold apparently.", speaker: "a", role: "Local" },
      { jp: "えっ、ほんとうですか？だいじょうぶです、じゃけっとがあります。", romaji: "e', hon-tou de-su ka? dai-jou-bu de-su, ja-ket-to ga a-ri-ma-su.", en: "Really? It's fine, I have a jacket.", speaker: "b", role: "You" },
    ],
    comprehension: {
      question: "What is the weather like today?",
      options: ["Cold", "Hot", "Rainy", "Snowy"],
      correctIndex: 1,
      explanation: "あつい means hot — きょうはあついです = 'Today is hot'.",
    },
  },
  {
    id: "gs15",
    title: "Exploring a New City",
    requires: ["d8", "d1", "d6", "d2", "d3", "g4"],
    sentences: [
      { jp: "すみません、トイレはどこですか？", romaji: "su-mi-ma-sen, toi-re wa do-ko de-su ka?", en: "Excuse me, where is the toilet?", speaker: "b", role: "You" },
      { jp: "みぎにありますよ。", romaji: "mi-gi ni a-ri-ma-su yo.", en: "It's on the right.", speaker: "a", role: "Local" },
      { jp: "ありがとうございます。コンビニはどこですか？", romaji: "a-ri-ga-tou go-zai-ma-su. kon-bi-ni wa do-ko de-su ka?", en: "Thanks. Where is the convenience store?", speaker: "b", role: "You" },
      { jp: "ひだりにあります。あるいていけますよ。", romaji: "hi-da-ri ni a-ri-ma-su. a-ru-i-te i-ke-ma-su yo.", en: "On the left. You can walk there.", speaker: "a", role: "Local" },
      { jp: "はい！ありがとうございます。", romaji: "hai! a-ri-ga-tou go-zai-ma-su.", en: "Yes! Thank you.", speaker: "b", role: "You" },
    ],
    comprehension: {
      question: "Which direction is the toilet?",
      options: ["Left", "Right", "Straight ahead", "Far away"],
      correctIndex: 1,
      explanation: "みぎ means 'right' — the toilet is to the right.",
    },
  },
];
