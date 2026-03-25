// ═══ CONTEXT WORDS FOR KANA ═══
// 2-3 common words using each character, connecting isolated kana to real vocabulary.
// Based on frequency data: top 1000 Japanese words (Nation 2001).

export const KANA_WORDS = {
  // Hiragana vowels
  "あ": [{ word: "あさ", romaji: "asa", meaning: "morning" }, { word: "あめ", romaji: "ame", meaning: "rain" }],
  "い": [{ word: "いぬ", romaji: "inu", meaning: "dog" }, { word: "いま", romaji: "ima", meaning: "now" }],
  "う": [{ word: "うみ", romaji: "umi", meaning: "sea" }, { word: "うた", romaji: "uta", meaning: "song" }],
  "え": [{ word: "えき", romaji: "eki", meaning: "station" }, { word: "えん", romaji: "en", meaning: "yen" }],
  "お": [{ word: "おちゃ", romaji: "ocha", meaning: "tea" }, { word: "おかね", romaji: "okane", meaning: "money" }],

  // K row
  "か": [{ word: "かわ", romaji: "kawa", meaning: "river" }, { word: "かさ", romaji: "kasa", meaning: "umbrella" }],
  "き": [{ word: "きれい", romaji: "kirei", meaning: "beautiful" }, { word: "きょう", romaji: "kyou", meaning: "today" }],
  "く": [{ word: "くるま", romaji: "kuruma", meaning: "car" }, { word: "くに", romaji: "kuni", meaning: "country" }],
  "け": [{ word: "けさ", romaji: "kesa", meaning: "this morning" }, { word: "けん", romaji: "ken", meaning: "prefecture" }],
  "こ": [{ word: "こども", romaji: "kodomo", meaning: "child" }, { word: "ここ", romaji: "koko", meaning: "here" }],

  // S row
  "さ": [{ word: "さくら", romaji: "sakura", meaning: "cherry blossom" }, { word: "さかな", romaji: "sakana", meaning: "fish" }],
  "し": [{ word: "しろ", romaji: "shiro", meaning: "white/castle" }, { word: "しんかんせん", romaji: "shinkansen", meaning: "bullet train" }],
  "す": [{ word: "すし", romaji: "sushi", meaning: "sushi" }, { word: "すき", romaji: "suki", meaning: "like" }],
  "せ": [{ word: "せんせい", romaji: "sensei", meaning: "teacher" }, { word: "せかい", romaji: "sekai", meaning: "world" }],
  "そ": [{ word: "そら", romaji: "sora", meaning: "sky" }, { word: "そと", romaji: "soto", meaning: "outside" }],

  // T row
  "た": [{ word: "たべる", romaji: "taberu", meaning: "to eat" }, { word: "たかい", romaji: "takai", meaning: "expensive/tall" }],
  "ち": [{ word: "ちず", romaji: "chizu", meaning: "map" }, { word: "ちいさい", romaji: "chiisai", meaning: "small" }],
  "つ": [{ word: "つき", romaji: "tsuki", meaning: "moon" }, { word: "つよい", romaji: "tsuyoi", meaning: "strong" }],
  "て": [{ word: "てんき", romaji: "tenki", meaning: "weather" }, { word: "てがみ", romaji: "tegami", meaning: "letter" }],
  "と": [{ word: "ともだち", romaji: "tomodachi", meaning: "friend" }, { word: "とり", romaji: "tori", meaning: "bird" }],

  // N row
  "な": [{ word: "なつ", romaji: "natsu", meaning: "summer" }, { word: "なまえ", romaji: "namae", meaning: "name" }],
  "に": [{ word: "にほん", romaji: "nihon", meaning: "Japan" }, { word: "にく", romaji: "niku", meaning: "meat" }],
  "ぬ": [{ word: "ぬの", romaji: "nuno", meaning: "cloth" }],
  "ね": [{ word: "ねこ", romaji: "neko", meaning: "cat" }, { word: "ねる", romaji: "neru", meaning: "to sleep" }],
  "の": [{ word: "のみもの", romaji: "nomimono", meaning: "drink" }, { word: "のる", romaji: "noru", meaning: "to ride" }],

  // H row
  "は": [{ word: "はな", romaji: "hana", meaning: "flower" }, { word: "はし", romaji: "hashi", meaning: "chopsticks/bridge" }],
  "ひ": [{ word: "ひと", romaji: "hito", meaning: "person" }, { word: "ひる", romaji: "hiru", meaning: "noon" }],
  "ふ": [{ word: "ふゆ", romaji: "fuyu", meaning: "winter" }, { word: "ふね", romaji: "fune", meaning: "ship" }],
  "へ": [{ word: "へや", romaji: "heya", meaning: "room" }],
  "ほ": [{ word: "ほん", romaji: "hon", meaning: "book" }, { word: "ほし", romaji: "hoshi", meaning: "star" }],

  // M row
  "ま": [{ word: "まち", romaji: "machi", meaning: "town" }, { word: "まど", romaji: "mado", meaning: "window" }],
  "み": [{ word: "みず", romaji: "mizu", meaning: "water" }, { word: "みち", romaji: "michi", meaning: "road" }],
  "む": [{ word: "むら", romaji: "mura", meaning: "village" }],
  "め": [{ word: "めがね", romaji: "megane", meaning: "glasses" }, { word: "め", romaji: "me", meaning: "eye" }],
  "も": [{ word: "もり", romaji: "mori", meaning: "forest" }, { word: "もの", romaji: "mono", meaning: "thing" }],

  // Y row
  "や": [{ word: "やま", romaji: "yama", meaning: "mountain" }, { word: "やすい", romaji: "yasui", meaning: "cheap" }],
  "ゆ": [{ word: "ゆき", romaji: "yuki", meaning: "snow" }, { word: "ゆめ", romaji: "yume", meaning: "dream" }],
  "よ": [{ word: "よる", romaji: "yoru", meaning: "night" }, { word: "よむ", romaji: "yomu", meaning: "to read" }],

  // R row
  "ら": [{ word: "らいねん", romaji: "rainen", meaning: "next year" }],
  "り": [{ word: "りんご", romaji: "ringo", meaning: "apple" }],
  "る": [{ word: "るす", romaji: "rusu", meaning: "absence" }],
  "れ": [{ word: "れきし", romaji: "rekishi", meaning: "history" }],
  "ろ": [{ word: "ろく", romaji: "roku", meaning: "six" }],

  // W row + N
  "わ": [{ word: "わたし", romaji: "watashi", meaning: "I/me" }],
  "を": [{ word: "みずをのむ", romaji: "mizu o nomu", meaning: "drink water" }],
  "ん": [{ word: "にほん", romaji: "nihon", meaning: "Japan" }, { word: "せんえん", romaji: "sen-en", meaning: "1000 yen" }],
};
