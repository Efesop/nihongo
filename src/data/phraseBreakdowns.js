// Word-by-word breakdowns for all phrases
// [japanese, romaji, meaning, grammar_type]
export const PHRASE_BREAKDOWNS = {
  // === Greetings ===
  "g1": [["こんにちは", "konnichiwa", "hello (daytime)", "expression"]],
  "g2": [["おはよう", "ohayou", "good morning", "expression"], ["ございます", "gozaimasu", "polite suffix", "suffix"]],
  "g3": [["こんばんは", "konbanwa", "good evening", "expression"]],
  "g4": [["ありがとう", "arigatou", "thank you", "expression"], ["ございます", "gozaimasu", "polite suffix", "suffix"]],
  "g5": [["すみません", "sumimasen", "excuse me / sorry", "expression"]],
  "g6": [["はい", "hai", "yes", "expression"]],
  "g7": [["いいえ", "iie", "no", "expression"]],
  "g8": [["おねがい", "onegai", "request / favor", "noun"], ["します", "shimasu", "do", "verb"]],
  "g9": [["だいじょうぶ", "daijoubu", "fine / okay", "adjective"], ["です", "desu", "is", "copula"]],
  "g10": [["さようなら", "sayounara", "goodbye", "expression"]],

  // === Food & Restaurants ===
  "f1": [["これ", "kore", "this", "noun"], ["を", "o", "object marker", "particle"], ["ください", "kudasai", "please give", "verb"]],
  "f2": [["おかんじょう", "okanjou", "the bill", "noun"], ["おねがい", "onegai", "request / favor", "noun"], ["します", "shimasu", "do", "verb"]],
  "f3": [["みず", "mizu", "water", "noun"], ["を", "o", "object marker", "particle"], ["ください", "kudasai", "please give", "verb"]],
  "f4": [["おいしい", "oishii", "delicious", "adjective"], ["です", "desu", "is", "copula"]],
  "f5": [["いただきます", "itadakimasu", "I humbly receive (before eating)", "expression"]],
  "f6": [["ごちそうさま", "gochisousama", "thank you for the meal", "expression"], ["でした", "deshita", "was (past)", "copula"]],
  "f7": [["おすすめ", "osusume", "recommendation", "noun"], ["は", "wa", "topic marker", "particle"], ["なん", "nan", "what", "noun"], ["です", "desu", "is", "copula"], ["か", "ka", "question marker", "particle"]],
  "f8": [["ひとり", "hitori", "one person", "counter"], ["です", "desu", "is", "copula"]],
  "f9": [["ふたり", "futari", "two people", "counter"], ["です", "desu", "is", "copula"]],
  "f10": [["アレルギー", "arerugii", "allergy", "noun"], ["が", "ga", "subject marker", "particle"], ["あります", "arimasu", "there is / I have", "verb"]],

  // === Transport ===
  "t1": [["えき", "eki", "station", "noun"], ["は", "wa", "topic marker", "particle"], ["どこ", "doko", "where", "noun"], ["です", "desu", "is", "copula"], ["か", "ka", "question marker", "particle"]],
  "t2": [["まで", "made", "to / until", "particle"], ["いくら", "ikura", "how much", "noun"], ["です", "desu", "is", "copula"], ["か", "ka", "question marker", "particle"]],
  "t3": [["つぎ", "tsugi", "next", "noun"], ["の", "no", "possessive marker", "particle"], ["えき", "eki", "station", "noun"], ["は", "wa", "topic marker", "particle"], ["なん", "nan", "what", "noun"], ["です", "desu", "is", "copula"], ["か", "ka", "question marker", "particle"]],
  "t4": [["のりかえ", "norikae", "transfer", "noun"], ["は", "wa", "topic marker", "particle"], ["どこ", "doko", "where", "noun"], ["です", "desu", "is", "copula"], ["か", "ka", "question marker", "particle"]],
  "t5": [["まで", "made", "to / until", "particle"], ["おねがい", "onegai", "request / favor", "noun"], ["します", "shimasu", "do", "verb"]],
  "t6": [["ここ", "koko", "here", "noun"], ["で", "de", "at / in", "particle"], ["おろして", "oroshite", "let off", "verb"], ["ください", "kudasai", "please", "verb"]],
  "t7": [["スイカ ", "suika", "Suica", "noun"], ["/ ", "/", "/", "expression"], ["パスモ", "pasumo", "Pasmo", "noun"]],
  "t8": [["しゅうでん", "shuuden", "last train", "noun"], ["は", "wa", "topic marker", "particle"], ["なんじ", "nanji", "what time", "noun"], ["です", "desu", "is", "copula"], ["か", "ka", "question marker", "particle"]],

  // === Hotels ===
  "h1": [["チェックイン", "chekkuin", "check-in", "noun"], ["おねがい", "onegai", "request / favor", "noun"], ["します", "shimasu", "do", "verb"]],
  "h2": [["よやく", "yoyaku", "reservation", "noun"], ["が", "ga", "subject marker", "particle"], ["あります", "arimasu", "there is / I have", "verb"]],
  "h3": [["チェックアウト", "chekkuauto", "checkout", "noun"], ["は", "wa", "topic marker", "particle"], ["なんじ", "nanji", "what time", "noun"], ["です", "desu", "is", "copula"], ["か", "ka", "question marker", "particle"]],
  "h4": [["WiFi", "waifai", "WiFi", "noun"], ["の", "no", "possessive marker", "particle"], ["パスワード", "pasuwaado", "password", "noun"], ["は", "wa", "topic marker", "particle"], ["なん", "nan", "what", "noun"], ["です", "desu", "is", "copula"], ["か", "ka", "question marker", "particle"]],
  "h5": [["かぎ", "kagi", "key", "noun"]],
  "h6": [["もう", "mou", "one more / already", "expression"], ["いっぱく", "ippaku", "one night", "counter"], ["おねがい", "onegai", "request / favor", "noun"], ["します", "shimasu", "do", "verb"]],

  // === Shopping ===
  "s1": [["これ", "kore", "this", "noun"], ["は", "wa", "topic marker", "particle"], ["いくら", "ikura", "how much", "noun"], ["です", "desu", "is", "copula"], ["か", "ka", "question marker", "particle"]],
  "s2": [["ふくろ", "fukuro", "bag", "noun"], ["は", "wa", "topic marker", "particle"], ["いらない", "iranai", "not needed", "adjective"], ["です", "desu", "is", "copula"]],
  "s3": [["カード", "kaado", "card", "noun"], ["で", "de", "by / with", "particle"], ["おねがい", "onegai", "request / favor", "noun"], ["します", "shimasu", "do", "verb"]],
  "s4": [["げんきん", "genkin", "cash", "noun"], ["で", "de", "by / with", "particle"], ["おねがい", "onegai", "request / favor", "noun"], ["します", "shimasu", "do", "verb"]],
  "s5": [["あたためます", "atatamemasu", "heat up", "verb"], ["か", "ka", "question marker", "particle"]],
  "s6": [["これ", "kore", "this", "noun"], ["を", "o", "object marker", "particle"], ["ふたつ", "futatsu", "two (items)", "counter"], ["ください", "kudasai", "please give", "verb"]],
  "s7": [["レシート", "reshiito", "receipt", "noun"], ["は", "wa", "topic marker", "particle"], ["いらない", "iranai", "not needed", "adjective"], ["です", "desu", "is", "copula"]],

  // === Directions ===
  "d1": [["は", "wa", "topic marker", "particle"], ["どこ", "doko", "where", "noun"], ["です", "desu", "is", "copula"], ["か", "ka", "question marker", "particle"]],
  "d2": [["みぎ", "migi", "right", "noun"]],
  "d3": [["ひだり", "hidari", "left", "noun"]],
  "d4": [["まっすぐ", "massugu", "straight ahead", "noun"]],
  "d5": [["ちかい", "chikai", "close / near", "adjective"], ["です", "desu", "is", "copula"], ["か", "ka", "question marker", "particle"]],
  "d6": [["あるいて", "aruite", "walking", "verb"], ["いけます", "ikemasu", "can go", "verb"], ["か", "ka", "question marker", "particle"]],
  "d7": [["ちず", "chizu", "map", "noun"], ["を", "o", "object marker", "particle"], ["みせて", "misete", "show", "verb"], ["ください", "kudasai", "please", "verb"]],
  "d8": [["トイレ", "toire", "toilet", "noun"], ["は", "wa", "topic marker", "particle"], ["どこ", "doko", "where", "noun"], ["です", "desu", "is", "copula"], ["か", "ka", "question marker", "particle"]],

  // === Emergencies ===
  "e1": [["たすけて", "tasukete", "help", "verb"], ["ください", "kudasai", "please", "verb"]],
  "e2": [["びょういん", "byouin", "hospital", "noun"], ["は", "wa", "topic marker", "particle"], ["どこ", "doko", "where", "noun"], ["です", "desu", "is", "copula"], ["か", "ka", "question marker", "particle"]],
  "e3": [["けいさつ", "keisatsu", "police", "noun"], ["を", "o", "object marker", "particle"], ["よんで", "yonde", "call", "verb"], ["ください", "kudasai", "please", "verb"]],
  "e4": [["えいご", "eigo", "English", "noun"], ["を", "o", "object marker", "particle"], ["はなせます", "hanasemasu", "can speak", "verb"], ["か", "ka", "question marker", "particle"]],
  "e5": [["にほんご", "nihongo", "Japanese", "noun"], ["が", "ga", "subject marker", "particle"], ["わかりません", "wakarimasen", "don't understand", "verb"]],
  "e6": [["もう", "mou", "one more", "expression"], ["いちど", "ichido", "one time", "counter"], ["いって", "itte", "say", "verb"], ["ください", "kudasai", "please", "verb"]],

  // === Numbers & Counting ===
  "n1": [["いち", "ichi", "one", "noun"]],
  "n2": [["に", "ni", "two", "noun"]],
  "n3": [["さん", "san", "three", "noun"]],
  "n4": [["よん", "yon", "four", "noun"]],
  "n5": [["ご", "go", "five", "noun"]],
  "n6": [["ろく", "roku", "six", "noun"]],
  "n7": [["なな", "nana", "seven", "noun"]],
  "n8": [["はち", "hachi", "eight", "noun"]],
  "n9": [["きゅう", "kyuu", "nine", "noun"]],
  "n10": [["じゅう", "juu", "ten", "noun"]],
  "n11": [["ひゃく", "hyaku", "one hundred", "counter"], ["えん", "en", "yen", "counter"], ["です", "desu", "is", "copula"]],
  "n12": [["せん", "sen", "one thousand", "counter"], ["えん", "en", "yen", "counter"], ["です", "desu", "is", "copula"]],
  "n13": [["なんじ", "nanji", "what time", "noun"], ["です", "desu", "is", "copula"], ["か", "ka", "question marker", "particle"]],

  // === Time & Days ===
  "tm1": [["きょう", "kyou", "today", "noun"]],
  "tm2": [["あした", "ashita", "tomorrow", "noun"]],
  "tm3": [["きのう", "kinou", "yesterday", "noun"]],
  "tm4": [["いま", "ima", "now", "noun"]],
  "tm5": [["あと", "ato", "after / later", "noun"], ["で", "de", "at / by", "particle"]],
  "tm6": [["なん", "nan", "what", "noun"], ["ようび", "youbi", "day of the week", "noun"], ["です", "desu", "is", "copula"], ["か", "ka", "question marker", "particle"]],
  "tm7": [["げつようび", "getsuyoubi", "Monday", "noun"]],
  "tm8": [["あさ", "asa", "morning", "noun"]],
  "tm9": [["よる", "yoru", "night / evening", "noun"]],
  "tm10": [["まいにち", "mainichi", "every day", "noun"]],

  // === Daily Life ===
  "dl1": [["たべたい", "tabetai", "want to eat", "verb"], ["です", "desu", "is", "copula"]],
  "dl2": [["のみたい", "nomitai", "want to drink", "verb"], ["です", "desu", "is", "copula"]],
  "dl3": [["いきたい", "ikitai", "want to go", "verb"], ["です", "desu", "is", "copula"]],
  "dl4": [["これ", "kore", "this", "noun"], ["が", "ga", "subject marker", "particle"], ["すき", "suki", "like / fond of", "adjective"], ["です", "desu", "is", "copula"]],
  "dl5": [["にほんご", "nihongo", "Japanese", "noun"], ["を", "o", "object marker", "particle"], ["べんきょう", "benkyou", "study", "noun"], ["しています", "shiteimasu", "am doing", "verb"]],
  "dl6": [["しごと", "shigoto", "job / work", "noun"], ["は", "wa", "topic marker", "particle"], ["なん", "nan", "what", "noun"], ["です", "desu", "is", "copula"], ["か", "ka", "question marker", "particle"]],
  "dl7": [["どこ", "doko", "where", "noun"], ["から", "kara", "from", "particle"], ["きました", "kimashita", "came", "verb"], ["か", "ka", "question marker", "particle"]],
  "dl8": [["わかります", "wakarimasu", "understand", "verb"]],
  "dl9": [["しゃしん", "shashin", "photo", "noun"], ["を", "o", "object marker", "particle"], ["とって", "totte", "take", "verb"], ["も", "mo", "also / even", "particle"], ["いい", "ii", "good / okay", "adjective"], ["です", "desu", "is", "copula"], ["か", "ka", "question marker", "particle"]],
  "dl10": [["たのしい", "tanoshii", "fun / enjoyable", "adjective"], ["です", "desu", "is", "copula"]],
  "dl11": [["つかれました", "tsukaremashita", "got tired", "verb"]],
  "dl12": [["おなか", "onaka", "stomach", "noun"], ["が", "ga", "subject marker", "particle"], ["すきました", "sukimashita", "became empty", "verb"]],

  // === Describing Things ===
  "dc1": [["おおきい", "ookii", "big", "adjective"]],
  "dc2": [["ちいさい", "chiisai", "small", "adjective"]],
  "dc3": [["たかい", "takai", "expensive / tall", "adjective"]],
  "dc4": [["やすい", "yasui", "cheap", "adjective"]],
  "dc5": [["あつい", "atsui", "hot", "adjective"]],
  "dc6": [["さむい", "samui", "cold", "adjective"]],
  "dc7": [["とおい", "tooi", "far", "adjective"]],
  "dc8": [["ちかい", "chikai", "close / nearby", "adjective"]],
  "dc9": [["あたらしい", "atarashii", "new", "adjective"]],
  "dc10": [["ふるい", "furui", "old (things)", "adjective"]],
};
