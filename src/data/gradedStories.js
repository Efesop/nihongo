/**
 * Graded readers — pre-written mini stories using known phrases.
 * Each story is unlocked when the user knows ALL of its required phrases (by ID).
 * Stories are ordered by difficulty: fewer/simpler phrases first.
 *
 * Format:
 *   title: Story title (English)
 *   requires: phrase IDs the user must know (box >= 1)
 *   sentences: array of { jp, romaji, en }
 *   comprehension: { question, options, correctIndex, explanation }
 */
export const GRADED_STORIES = [
  // ── LEVEL 1: First day basics (greetings only) ──
  {
    id: "gs1",
    title: "First Morning in Tokyo",
    requires: ["g1", "g2", "g4", "g8"],
    sentences: [
      { jp: "おはようございます。", romaji: "o-ha-you go-zai-ma-su.", en: "Good morning." },
      { jp: "こんにちは。", romaji: "kon-ni-chi-wa.", en: "Hello." },
      { jp: "おねがいします。", romaji: "o-ne-gai-shi-ma-su.", en: "Please." },
      { jp: "ありがとうございます。", romaji: "a-ri-ga-tou go-zai-ma-su.", en: "Thank you." },
    ],
    comprehension: {
      question: "What is the first thing you say in the morning?",
      options: ["こんにちは", "おはようございます", "ありがとうございます", "おねがいします"],
      correctIndex: 1,
      explanation: "おはようございます is the polite morning greeting, used before about 10am.",
    },
  },
  {
    id: "gs2",
    title: "At the Convenience Store",
    requires: ["g5", "g6", "g8", "s2"],
    sentences: [
      { jp: "すみません。", romaji: "su-mi-ma-sen.", en: "Excuse me." },
      { jp: "おねがいします。", romaji: "o-ne-gai-shi-ma-su.", en: "Please." },
      { jp: "ふくろはいらないです。", romaji: "fu-ku-ro wa i-ra-nai de-su.", en: "I don't need a bag." },
      { jp: "はい。ありがとうございます。", romaji: "hai. a-ri-ga-tou go-zai-ma-su.", en: "Yes. Thank you." },
    ],
    comprehension: {
      question: "Did the customer want a bag?",
      options: ["Yes, they asked for one", "No, they said they don't need one", "They didn't say", "They asked for two bags"],
      correctIndex: 1,
      explanation: "ふくろはいらないです means 'I don't need a bag' — bags cost extra in Japan!",
    },
  },

  // ── LEVEL 2: Restaurant basics ──
  {
    id: "gs3",
    title: "Lunch at the Ramen Shop",
    requires: ["f1", "f3", "f5", "f4", "g4"],
    sentences: [
      { jp: "みずをください。", romaji: "mi-zu o ku-da-sai.", en: "Water please." },
      { jp: "これをください。", romaji: "ko-re o ku-da-sai.", en: "This one please." },
      { jp: "いただきます。", romaji: "i-ta-da-ki-ma-su.", en: "(Before eating)" },
      { jp: "おいしいです！", romaji: "oi-shii de-su!", en: "It's delicious!" },
      { jp: "ありがとうございます。", romaji: "a-ri-ga-tou go-zai-ma-su.", en: "Thank you." },
    ],
    comprehension: {
      question: "What did the person think of the food?",
      options: ["They didn't like it", "It was OK", "It was delicious", "It was too hot"],
      correctIndex: 2,
      explanation: "おいしいです means 'It's delicious!' — restaurant staff love hearing this.",
    },
  },
  {
    id: "gs4",
    title: "Restaurant for Two",
    requires: ["f8", "f9", "f7", "f1", "f6"],
    sentences: [
      { jp: "ふたりです。", romaji: "fu-ta-ri de-su.", en: "Two people." },
      { jp: "おすすめはなんですか？", romaji: "o-su-su-me wa nan de-su ka?", en: "What do you recommend?" },
      { jp: "これをください。", romaji: "ko-re o ku-da-sai.", en: "This one please." },
      { jp: "ごちそうさまでした。", romaji: "go-chi-sou-sa-ma de-shi-ta.", en: "(After eating — thanks for the meal)" },
    ],
    comprehension: {
      question: "How many people came to the restaurant?",
      options: ["One (ひとり)", "Two (ふたり)", "Three", "It doesn't say"],
      correctIndex: 1,
      explanation: "ふたりです means 'Two people' — always state your party size when entering.",
    },
  },

  // ── LEVEL 3: Getting around ──
  {
    id: "gs5",
    title: "Finding the Station",
    requires: ["g5", "t1", "d5", "d4", "g4"],
    sentences: [
      { jp: "すみません。", romaji: "su-mi-ma-sen.", en: "Excuse me." },
      { jp: "えきはどこですか？", romaji: "e-ki wa do-ko de-su ka?", en: "Where is the station?" },
      { jp: "まっすぐ。", romaji: "mas-su-gu.", en: "Straight ahead." },
      { jp: "ちかいですか？", romaji: "chi-kai de-su ka?", en: "Is it close?" },
      { jp: "はい。ありがとうございます。", romaji: "hai. a-ri-ga-tou go-zai-ma-su.", en: "Yes. Thank you." },
    ],
    comprehension: {
      question: "Which direction is the station?",
      options: ["Turn right", "Turn left", "Straight ahead", "It's far away"],
      correctIndex: 2,
      explanation: "まっすぐ means 'straight ahead' — one of the most useful direction words.",
    },
  },
  {
    id: "gs6",
    title: "Taxi to the Hotel",
    requires: ["t5", "h1", "h2", "g4"],
    sentences: [
      { jp: "ホテルまでおねがいします。", romaji: "ho-te-ru ma-de o-ne-gai-shi-ma-su.", en: "To the hotel please." },
      { jp: "ありがとうございます。", romaji: "a-ri-ga-tou go-zai-ma-su.", en: "Thank you." },
      { jp: "チェックインおねがいします。", romaji: "chek-ku-in o-ne-gai-shi-ma-su.", en: "Check in please." },
      { jp: "よやくがあります。", romaji: "yo-ya-ku ga a-ri-ma-su.", en: "I have a reservation." },
    ],
    comprehension: {
      question: "Where did the person go by taxi?",
      options: ["The station", "The restaurant", "The hotel", "The hospital"],
      correctIndex: 2,
      explanation: "ホテルまでおねがいします — 'made' means 'to (destination)', used with taxis.",
    },
  },

  // ── LEVEL 4: Shopping + paying ──
  {
    id: "gs7",
    title: "Shopping in Akihabara",
    requires: ["s1", "s3", "g5", "g4", "dc3", "dc4"],
    sentences: [
      { jp: "すみません。これはいくらですか？", romaji: "su-mi-ma-sen. ko-re wa i-ku-ra de-su ka?", en: "Excuse me. How much is this?" },
      { jp: "たかい...", romaji: "ta-kai...", en: "Expensive..." },
      { jp: "これはやすいです。", romaji: "ko-re wa ya-sui de-su.", en: "This one is cheap." },
      { jp: "カードでおねがいします。", romaji: "kaa-do de o-ne-gai-shi-ma-su.", en: "By card please." },
      { jp: "ありがとうございます。", romaji: "a-ri-ga-tou go-zai-ma-su.", en: "Thank you." },
    ],
    comprehension: {
      question: "How did the person pay?",
      options: ["Cash", "By card", "IC card (Suica)", "They didn't buy anything"],
      correctIndex: 1,
      explanation: "カードでおねがいします means 'By card please' — most shops now accept cards.",
    },
  },
  {
    id: "gs8",
    title: "Buying Souvenirs",
    requires: ["s1", "s6", "s4", "s7", "g4"],
    sentences: [
      { jp: "これはいくらですか？", romaji: "ko-re wa i-ku-ra de-su ka?", en: "How much is this?" },
      { jp: "これをふたつください。", romaji: "ko-re o fu-ta-tsu ku-da-sai.", en: "Two of these please." },
      { jp: "げんきんでおねがいします。", romaji: "gen-kin de o-ne-gai-shi-ma-su.", en: "Cash please." },
      { jp: "レシートはいらないです。", romaji: "re-shii-to wa i-ra-nai de-su.", en: "No receipt needed." },
      { jp: "ありがとうございます。", romaji: "a-ri-ga-tou go-zai-ma-su.", en: "Thank you." },
    ],
    comprehension: {
      question: "How many did the person buy?",
      options: ["One", "Two", "Three", "None"],
      correctIndex: 1,
      explanation: "ふたつ means 'two (things)' — これをふたつください = 'Two of these please'.",
    },
  },

  // ── LEVEL 5: Daily life conversations ──
  {
    id: "gs9",
    title: "Making Friends",
    requires: ["g1", "dl7", "dl5", "dl10", "g4"],
    sentences: [
      { jp: "こんにちは！", romaji: "kon-ni-chi-wa!", en: "Hello!" },
      { jp: "どこからきましたか？", romaji: "do-ko ka-ra ki-ma-shi-ta ka?", en: "Where are you from?" },
      { jp: "にほんごをべんきょうしています。", romaji: "ni-hon-go o ben-kyou shi-te i-ma-su.", en: "I'm studying Japanese." },
      { jp: "たのしいです！", romaji: "ta-no-shii de-su!", en: "It's fun!" },
      { jp: "ありがとうございます。", romaji: "a-ri-ga-tou go-zai-ma-su.", en: "Thank you." },
    ],
    comprehension: {
      question: "What is the person studying?",
      options: ["English", "Japanese", "Cooking", "History"],
      correctIndex: 1,
      explanation: "にほんごをべんきょうしています = 'I'm studying Japanese' — great conversation starter!",
    },
  },
  {
    id: "gs10",
    title: "A Long Day in Kyoto",
    requires: ["dl11", "dl12", "dl1", "dl2", "f4"],
    sentences: [
      { jp: "つかれました。", romaji: "tsu-ka-re-ma-shi-ta.", en: "I'm tired." },
      { jp: "おなかがすきました。", romaji: "o-na-ka ga su-ki-ma-shi-ta.", en: "I'm hungry." },
      { jp: "たべたいです。", romaji: "ta-be-tai de-su.", en: "I want to eat." },
      { jp: "のみたいです。", romaji: "no-mi-tai de-su.", en: "I want to drink." },
      { jp: "おいしいです！", romaji: "oi-shii de-su!", en: "It's delicious!" },
    ],
    comprehension: {
      question: "How was the person feeling at the start?",
      options: ["Happy and energetic", "Tired and hungry", "Sick", "Lost"],
      correctIndex: 1,
      explanation: "つかれました (tired) + おなかがすきました (hungry) — a typical sightseeing experience!",
    },
  },

  // ── LEVEL 6: Emergency + complex situations ──
  {
    id: "gs11",
    title: "Lost in Shinjuku",
    requires: ["g5", "e4", "e5", "d1", "d7"],
    sentences: [
      { jp: "すみません。", romaji: "su-mi-ma-sen.", en: "Excuse me." },
      { jp: "にほんごがわかりません。", romaji: "ni-hon-go ga wa-ka-ri-ma-sen.", en: "I don't understand Japanese." },
      { jp: "えいごをはなせますか？", romaji: "ei-go o ha-na-se-ma-su ka?", en: "Do you speak English?" },
      { jp: "ホテルはどこですか？", romaji: "ho-te-ru wa do-ko de-su ka?", en: "Where is the hotel?" },
      { jp: "ちずをみせてください。", romaji: "chi-zu o mi-se-te ku-da-sai.", en: "Show me on the map please." },
    ],
    comprehension: {
      question: "What was the person's problem?",
      options: ["They were hungry", "They couldn't find their hotel", "They lost their wallet", "The train was late"],
      correctIndex: 1,
      explanation: "They were lost — asking for directions, showing a map, trying to find their hotel.",
    },
  },
  {
    id: "gs12",
    title: "A Full Day: Morning to Night",
    requires: ["tm1", "tm8", "tm9", "g2", "g3", "dl3"],
    sentences: [
      { jp: "きょう、あさ。", romaji: "kyou, a-sa.", en: "Today, morning." },
      { jp: "おはようございます。", romaji: "o-ha-you go-zai-ma-su.", en: "Good morning." },
      { jp: "いきたいです。", romaji: "i-ki-tai de-su.", en: "I want to go." },
      { jp: "よる。こんばんは。", romaji: "yo-ru. kon-ban-wa.", en: "Evening. Good evening." },
    ],
    comprehension: {
      question: "What time words appear in this story?",
      options: ["Yesterday and tomorrow", "Morning and night", "Monday and Friday", "Now and later"],
      correctIndex: 1,
      explanation: "あさ (morning) and よる (night/evening) — the story follows a full day.",
    },
  },

  // ── LEVEL 7: Bigger scenarios, more phrases ──
  {
    id: "gs13",
    title: "The Perfect Restaurant Visit",
    requires: ["f8", "f3", "f7", "f1", "f5", "f4", "f2", "f6"],
    sentences: [
      { jp: "ひとりです。", romaji: "hi-to-ri de-su.", en: "One person." },
      { jp: "みずをください。", romaji: "mi-zu o ku-da-sai.", en: "Water please." },
      { jp: "おすすめはなんですか？", romaji: "o-su-su-me wa nan de-su ka?", en: "What do you recommend?" },
      { jp: "これをください。", romaji: "ko-re o ku-da-sai.", en: "This one please." },
      { jp: "いただきます。", romaji: "i-ta-da-ki-ma-su.", en: "(Before eating)" },
      { jp: "おいしいです！", romaji: "oi-shii de-su!", en: "It's delicious!" },
      { jp: "おかんじょうおねがいします。", romaji: "o-kan-jou o-ne-gai-shi-ma-su.", en: "Bill please." },
      { jp: "ごちそうさまでした。", romaji: "go-chi-sou-sa-ma de-shi-ta.", en: "(After eating — thanks for the meal)" },
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
      explanation: "いただきます before eating, ごちそうさまでした after — essential Japanese meal etiquette!",
    },
  },
  {
    id: "gs14",
    title: "Weather Talk",
    requires: ["dc5", "dc6", "tm1", "tm2", "g9"],
    sentences: [
      { jp: "きょう、あついです。", romaji: "kyou, a-tsui de-su.", en: "Today is hot." },
      { jp: "あした、さむいです。", romaji: "a-shi-ta, sa-mui de-su.", en: "Tomorrow will be cold." },
      { jp: "だいじょうぶです。", romaji: "dai-jou-bu de-su.", en: "It's fine / I'm OK." },
    ],
    comprehension: {
      question: "What is the weather like today?",
      options: ["Cold", "Hot", "Rainy", "Snowy"],
      correctIndex: 1,
      explanation: "あつい means hot — きょう、あついです = 'Today is hot'.",
    },
  },
  {
    id: "gs15",
    title: "Exploring a New City",
    requires: ["d8", "d1", "d6", "d2", "d3", "g4"],
    sentences: [
      { jp: "トイレはどこですか？", romaji: "toi-re wa do-ko de-su ka?", en: "Where is the toilet?" },
      { jp: "みぎ。", romaji: "mi-gi.", en: "Right." },
      { jp: "コンビニはどこですか？", romaji: "kon-bi-ni wa do-ko de-su ka?", en: "Where is the convenience store?" },
      { jp: "ひだり。", romaji: "hi-da-ri.", en: "Left." },
      { jp: "あるいていけますか？", romaji: "a-ru-i-te i-ke-ma-su ka?", en: "Can I walk there?" },
      { jp: "はい！ありがとうございます。", romaji: "hai! a-ri-ga-tou go-zai-ma-su.", en: "Yes! Thank you." },
    ],
    comprehension: {
      question: "Which direction is the toilet?",
      options: ["Left (ひだり)", "Right (みぎ)", "Straight ahead (まっすぐ)", "Far away (とおい)"],
      correctIndex: 1,
      explanation: "みぎ means 'right' — the toilet is to the right!",
    },
  },
];
