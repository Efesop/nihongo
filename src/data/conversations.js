// Mini conversation scenarios with blanks for fill-in-the-blank exercises
// Each conversation has a setting, lines of dialogue, and blanks to fill
// blank: { position, correct: phraseId, options: [phraseId, ...] }

export const CONVERSATIONS = [
  // ===== EXISTING 6 CONVERSATIONS =====
  {
    id: "restaurant1",
    setting: "You walk into a restaurant...",
    icon: "🍜",
    lines: [
      { speaker: "staff", text: "いらっしゃいませ！" , translation: "Welcome!" },
      { speaker: "you", blank: true, correctId: "f8", options: ["f8", "f1", "g5", "g8"] },
      { speaker: "staff", text: "こちらへどうぞ。", translation: "This way please." },
      { speaker: "you", blank: true, correctId: "g4", options: ["g4", "g10", "g7", "f4"] },
      { speaker: "staff", text: "ご注文は？", translation: "Your order?" },
      { speaker: "you", blank: true, correctId: "f1", options: ["f1", "f2", "f3", "s1"] },
    ]
  },
  {
    id: "restaurant2",
    setting: "You've finished eating...",
    icon: "🍜",
    lines: [
      { speaker: "you", blank: true, correctId: "f6", options: ["f6", "f5", "f4", "g4"] },
      { speaker: "you", blank: true, correctId: "f2", options: ["f2", "f1", "f3", "s3"] },
      { speaker: "staff", text: "3,500円です。", translation: "That'll be 3,500 yen." },
      { speaker: "you", blank: true, correctId: "s3", options: ["s3", "s4", "s1", "g8"] },
    ]
  },
  {
    id: "hotel1",
    setting: "You arrive at your hotel...",
    icon: "🏨",
    lines: [
      { speaker: "you", blank: true, correctId: "g5", options: ["g5", "g1", "g4", "g10"] },
      { speaker: "you", blank: true, correctId: "h1", options: ["h1", "h2", "h3", "g8"] },
      { speaker: "staff", text: "お名前は？", translation: "Your name?" },
      { speaker: "you", blank: true, correctId: "h2", options: ["h2", "h1", "h4", "h6"] },
    ]
  },
  {
    id: "directions1",
    setting: "You're lost and need to find the station...",
    icon: "🗺️",
    lines: [
      { speaker: "you", blank: true, correctId: "g5", options: ["g5", "g1", "g8", "e4"] },
      { speaker: "you", blank: true, correctId: "t1", options: ["t1", "d1", "d8", "t2"] },
      { speaker: "local", text: "あ、まっすぐ行って、みぎです。", translation: "Ah, go straight, then right." },
      { speaker: "you", blank: true, correctId: "g4", options: ["g4", "g5", "g1", "d5"] },
    ]
  },
  {
    id: "shopping1",
    setting: "You're at a convenience store...",
    icon: "🏪",
    lines: [
      { speaker: "staff", text: "いらっしゃいませ！", translation: "Welcome!" },
      { speaker: "you", blank: true, correctId: "s1", options: ["s1", "s6", "f1", "f3"] },
      { speaker: "staff", text: "200円です。", translation: "200 yen." },
      { speaker: "you", blank: true, correctId: "s2", options: ["s2", "s3", "s4", "s7"] },
      { speaker: "staff", text: "ありがとうございます！", translation: "Thank you!" },
    ]
  },
  {
    id: "emergency1",
    setting: "You need help...",
    icon: "🆘",
    lines: [
      { speaker: "you", blank: true, correctId: "g5", options: ["g5", "g1", "e1", "e4"] },
      { speaker: "you", blank: true, correctId: "e4", options: ["e4", "e5", "e6", "g1"] },
      { speaker: "local", text: "少しだけ...", translation: "Just a little..." },
      { speaker: "you", blank: true, correctId: "e6", options: ["e6", "e5", "e4", "g8"] },
    ]
  },

  // ===== NEW CONVERSATIONS =====

  // --- Transport ---
  {
    id: "taxi1",
    setting: "You hop into a taxi in Osaka...",
    icon: "🚃",
    lines: [
      { speaker: "driver", text: "どちらまで？", translation: "Where to?" },
      { speaker: "you", blank: true, correctId: "t5", options: ["t5", "t1", "d1", "t2"] },
      { speaker: "driver", text: "はい、わかりました。", translation: "Got it." },
      { speaker: "driver", text: "着きましたよ。", translation: "We've arrived." },
      { speaker: "you", blank: true, correctId: "s3", options: ["s3", "s4", "g8", "f2"] },
      { speaker: "you", blank: true, correctId: "g4", options: ["g4", "g5", "g10", "g1"] },
    ]
  },
  {
    id: "train1",
    setting: "You're on the train and unsure about your stop...",
    icon: "🚃",
    lines: [
      { speaker: "you", blank: true, correctId: "g5", options: ["g5", "g1", "e4", "g8"] },
      { speaker: "you", blank: true, correctId: "t3", options: ["t3", "t1", "t4", "t2"] },
      { speaker: "passenger", text: "新宿ですよ。", translation: "It's Shinjuku." },
      { speaker: "you", blank: true, correctId: "t4", options: ["t4", "t1", "t3", "d1"] },
      { speaker: "passenger", text: "次の駅で乗り換えてください。", translation: "Transfer at the next station." },
      { speaker: "you", blank: true, correctId: "g4", options: ["g4", "g8", "g5", "g10"] },
    ]
  },
  {
    id: "taxi2",
    setting: "You need to get out of a taxi early...",
    icon: "🚃",
    lines: [
      { speaker: "you", blank: true, correctId: "t6", options: ["t6", "t5", "t1", "g8"] },
      { speaker: "driver", text: "ここですか？", translation: "Here?" },
      { speaker: "you", blank: true, correctId: "g6", options: ["g6", "g7", "g9", "g4"] },
      { speaker: "you", blank: true, correctId: "t2", options: ["t2", "s1", "t1", "n13"] },
      { speaker: "driver", text: "800円です。", translation: "It's 800 yen." },
    ]
  },
  {
    id: "lastTrain",
    setting: "It's getting late and you're at a bar in Shibuya...",
    icon: "🚃",
    lines: [
      { speaker: "you", blank: true, correctId: "g5", options: ["g5", "g1", "e4", "g4"] },
      { speaker: "you", blank: true, correctId: "t8", options: ["t8", "t1", "n13", "t3"] },
      { speaker: "bartender", text: "11時55分ですよ。急いで！", translation: "11:55! Hurry!" },
      { speaker: "you", blank: true, correctId: "g4", options: ["g4", "g10", "g8", "g5"] },
    ]
  },

  // --- Hotel ---
  {
    id: "hotel2",
    setting: "You want to extend your stay at the ryokan...",
    icon: "🏨",
    lines: [
      { speaker: "you", blank: true, correctId: "g5", options: ["g5", "g1", "g4", "g8"] },
      { speaker: "you", blank: true, correctId: "h6", options: ["h6", "h1", "h3", "h2"] },
      { speaker: "staff", text: "はい、大丈夫ですよ。", translation: "Yes, that's fine." },
      { speaker: "you", blank: true, correctId: "h4", options: ["h4", "h3", "h5", "n13"] },
      { speaker: "staff", text: "「sakura2024」です。", translation: "It's 'sakura2024'." },
      { speaker: "you", blank: true, correctId: "g4", options: ["g4", "g8", "g5", "g10"] },
    ]
  },
  {
    id: "hotelCheckout",
    setting: "It's morning and you need to check out...",
    icon: "🏨",
    lines: [
      { speaker: "you", blank: true, correctId: "g2", options: ["g2", "g1", "g3", "g5"] },
      { speaker: "you", blank: true, correctId: "h3", options: ["h3", "h1", "h4", "n13"] },
      { speaker: "staff", text: "10時です。", translation: "It's 10 o'clock." },
      { speaker: "you", blank: true, correctId: "s3", options: ["s3", "s4", "g8", "f2"] },
    ]
  },

  // --- Directions ---
  {
    id: "directions2",
    setting: "You're looking for a famous temple...",
    icon: "🗺️",
    lines: [
      { speaker: "you", blank: true, correctId: "g5", options: ["g5", "g1", "e4", "g8"] },
      { speaker: "you", blank: true, correctId: "d1", options: ["d1", "t1", "d8", "e2"] },
      { speaker: "local", text: "まっすぐ行って、ひだりです。", translation: "Go straight, then left." },
      { speaker: "you", blank: true, correctId: "d5", options: ["d5", "d6", "d7", "dc8"] },
      { speaker: "local", text: "5分ぐらいです。", translation: "About 5 minutes." },
      { speaker: "you", blank: true, correctId: "d6", options: ["d6", "d5", "d7", "dl3"] },
    ]
  },
  {
    id: "directions3",
    setting: "You need to find a toilet urgently...",
    icon: "🗺️",
    lines: [
      { speaker: "you", blank: true, correctId: "g5", options: ["g5", "g1", "e1", "g8"] },
      { speaker: "you", blank: true, correctId: "d8", options: ["d8", "d1", "e2", "t1"] },
      { speaker: "staff", text: "あちらです。まっすぐ行って、みぎ。", translation: "Over there. Go straight, then right." },
      { speaker: "you", blank: true, correctId: "g4", options: ["g4", "g5", "g8", "g1"] },
    ]
  },
  {
    id: "mapHelp",
    setting: "You're completely lost in a residential area...",
    icon: "🗺️",
    lines: [
      { speaker: "you", blank: true, correctId: "g5", options: ["g5", "g1", "e1", "g4"] },
      { speaker: "you", blank: true, correctId: "e5", options: ["e5", "e4", "e6", "dl8"] },
      { speaker: "you", blank: true, correctId: "d7", options: ["d7", "d1", "d8", "t1"] },
      { speaker: "local", text: "あ、ここですよ。", translation: "Ah, it's right here." },
      { speaker: "you", blank: true, correctId: "g4", options: ["g4", "g8", "g5", "g10"] },
    ]
  },

  // --- Shopping ---
  {
    id: "shopping2",
    setting: "You're browsing a souvenir shop in Asakusa...",
    icon: "🏪",
    lines: [
      { speaker: "you", blank: true, correctId: "s1", options: ["s1", "f1", "s6", "t2"] },
      { speaker: "staff", text: "1,500円です。", translation: "It's 1,500 yen." },
      { speaker: "you", blank: true, correctId: "s6", options: ["s6", "f1", "s1", "s2"] },
      { speaker: "staff", text: "3,000円です。", translation: "That's 3,000 yen." },
      { speaker: "you", blank: true, correctId: "s4", options: ["s4", "s3", "s7", "g8"] },
    ]
  },
  {
    id: "conbini1",
    setting: "You're buying a bento at a convenience store...",
    icon: "🏪",
    lines: [
      { speaker: "staff", text: "あたためますか？", translation: "Shall I heat it up?" },
      { speaker: "you", blank: true, correctId: "g6", options: ["g6", "g7", "g9", "g8"] },
      { speaker: "staff", text: "レシートはいりますか？", translation: "Do you need a receipt?" },
      { speaker: "you", blank: true, correctId: "s7", options: ["s7", "s2", "s3", "g7"] },
      { speaker: "you", blank: true, correctId: "s2", options: ["s2", "s7", "s4", "g9"] },
    ]
  },

  // --- Numbers & Time ---
  {
    id: "numbers1",
    setting: "You're at a ticket counter buying entry passes...",
    icon: "🔢",
    lines: [
      { speaker: "staff", text: "何名様ですか？", translation: "How many people?" },
      { speaker: "you", blank: true, correctId: "f9", options: ["f9", "f8", "n2", "n3"] },
      { speaker: "staff", text: "入場料は一人1,000円です。", translation: "Entry fee is 1,000 yen per person." },
      { speaker: "you", blank: true, correctId: "s3", options: ["s3", "s4", "g8", "s1"] },
      { speaker: "you", blank: true, correctId: "g4", options: ["g4", "g5", "g8", "g1"] },
    ]
  },
  {
    id: "time1",
    setting: "You're meeting a friend and need to coordinate...",
    icon: "⏰",
    lines: [
      { speaker: "friend", text: "いつ会う？", translation: "When shall we meet?" },
      { speaker: "you", blank: true, correctId: "tm2", options: ["tm2", "tm1", "tm3", "tm5"] },
      { speaker: "friend", text: "何時がいい？", translation: "What time works?" },
      { speaker: "you", blank: true, correctId: "tm8", options: ["tm8", "tm9", "tm4", "tm5"] },
      { speaker: "friend", text: "OK、10時にね！", translation: "OK, 10 o'clock then!" },
    ]
  },
  {
    id: "askTime",
    setting: "You're at a park and forgot your phone...",
    icon: "⏰",
    lines: [
      { speaker: "you", blank: true, correctId: "g5", options: ["g5", "g1", "g4", "e4"] },
      { speaker: "you", blank: true, correctId: "n13", options: ["n13", "tm6", "t8", "h3"] },
      { speaker: "stranger", text: "3時です。", translation: "It's 3 o'clock." },
      { speaker: "you", blank: true, correctId: "g4", options: ["g4", "g8", "g5", "g10"] },
    ]
  },

  // --- Daily Life ---
  {
    id: "dailyLife1",
    setting: "You're chatting with someone at a hostel common area...",
    icon: "🌸",
    lines: [
      { speaker: "traveler", text: "こんにちは！日本語上手ですね。", translation: "Hello! Your Japanese is good." },
      { speaker: "you", blank: true, correctId: "g4", options: ["g4", "g5", "g1", "g9"] },
      { speaker: "you", blank: true, correctId: "dl5", options: ["dl5", "dl8", "dl4", "dl3"] },
      { speaker: "traveler", text: "どこから来ましたか？", translation: "Where are you from?" },
      { speaker: "you", blank: true, correctId: "dl7", options: ["dl7", "dl6", "dl5", "dl3"] },
    ]
  },
  {
    id: "dailyLife2",
    setting: "You're at a shrine and want to take a photo...",
    icon: "🌸",
    lines: [
      { speaker: "you", blank: true, correctId: "g5", options: ["g5", "g1", "g4", "e4"] },
      { speaker: "you", blank: true, correctId: "dl9", options: ["dl9", "dl4", "d7", "dl3"] },
      { speaker: "local", text: "はい、どうぞ！", translation: "Yes, go ahead!" },
      { speaker: "you", blank: true, correctId: "g4", options: ["g4", "g8", "g5", "g10"] },
    ]
  },
  {
    id: "dailyLife3",
    setting: "You're tired after a long day of sightseeing...",
    icon: "🌸",
    lines: [
      { speaker: "friend", text: "もう一つお寺に行く？", translation: "Shall we visit one more temple?" },
      { speaker: "you", blank: true, correctId: "dl11", options: ["dl11", "dl10", "dl12", "g9"] },
      { speaker: "you", blank: true, correctId: "dl12", options: ["dl12", "dl11", "dl1", "dl2"] },
      { speaker: "friend", text: "じゃあ、ラーメン食べに行こう！", translation: "Then let's go eat ramen!" },
      { speaker: "you", blank: true, correctId: "dl1", options: ["dl1", "dl2", "dl3", "dl4"] },
    ]
  },

  // --- Describing ---
  {
    id: "describe1",
    setting: "You're shopping for a gift and comparing items...",
    icon: "🎨",
    lines: [
      { speaker: "staff", text: "こちらはいかがですか？", translation: "How about this one?" },
      { speaker: "you", blank: true, correctId: "dc3", options: ["dc3", "dc4", "dc1", "dc2"] },
      { speaker: "staff", text: "こちらは2,000円です。", translation: "This one is 2,000 yen." },
      { speaker: "you", blank: true, correctId: "dc4", options: ["dc4", "dc3", "dc8", "dc2"] },
      { speaker: "you", blank: true, correctId: "f1", options: ["f1", "s1", "s6", "g8"] },
    ]
  },

  // --- Emergency ---
  {
    id: "emergency2",
    setting: "You've lost your bag and need to find the police...",
    icon: "🆘",
    lines: [
      { speaker: "you", blank: true, correctId: "e1", options: ["e1", "g5", "e4", "e6"] },
      { speaker: "local", text: "どうしましたか？", translation: "What happened?" },
      { speaker: "you", blank: true, correctId: "e5", options: ["e5", "e4", "e6", "dl8"] },
      { speaker: "you", blank: true, correctId: "e3", options: ["e3", "e2", "e1", "e6"] },
      { speaker: "local", text: "交番はあそこです。", translation: "The police box is over there." },
      { speaker: "you", blank: true, correctId: "g4", options: ["g4", "g5", "g8", "g1"] },
    ]
  },

  // --- Restaurant (advanced) ---
  {
    id: "restaurant3",
    setting: "You want to try a local specialty at an izakaya...",
    icon: "🍜",
    lines: [
      { speaker: "you", blank: true, correctId: "g3", options: ["g3", "g1", "g2", "g5"] },
      { speaker: "staff", text: "いらっしゃいませ！何名様？", translation: "Welcome! How many?" },
      { speaker: "you", blank: true, correctId: "f9", options: ["f9", "f8", "n2", "n3"] },
      { speaker: "you", blank: true, correctId: "f7", options: ["f7", "f1", "f3", "dl1"] },
      { speaker: "staff", text: "焼き鳥がおすすめです！", translation: "The yakitori is recommended!" },
      { speaker: "you", blank: true, correctId: "f1", options: ["f1", "f3", "f5", "g8"] },
    ]
  },

  // --- Mixed: Hospital ---
  {
    id: "hospital1",
    setting: "You're feeling sick and need to find a hospital...",
    icon: "🆘",
    lines: [
      { speaker: "you", blank: true, correctId: "g5", options: ["g5", "g1", "e1", "g4"] },
      { speaker: "you", blank: true, correctId: "e2", options: ["e2", "d8", "d1", "e3"] },
      { speaker: "local", text: "まっすぐ行って、ひだりです。", translation: "Go straight, then left." },
      { speaker: "you", blank: true, correctId: "d5", options: ["d5", "d6", "d7", "dc8"] },
      { speaker: "local", text: "はい、すぐそこです。", translation: "Yes, it's right there." },
      { speaker: "you", blank: true, correctId: "g4", options: ["g4", "g5", "g8", "g1"] },
    ]
  },
];
