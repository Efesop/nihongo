// Scene Studies — 25 two-voice conversational scenes.
// Vocabulary stays within CORE_VOCAB (from phraseBreakdowns.js) + up to 4
// explicit newWords per scene. Enforced by scripts/lint-scripts.mjs.
//
// Shape:
//   {
//     id, title, emoji, illustration,
//     register: "casual" | "polite" | "mixed",
//     requires: [phraseIds],
//     newWords: [{jp, romaji, en}],       // ≤4, intentional new vocab
//     lines: [{speaker: "a"|"b", role, jp, romaji, en}],
//     comprehension: [{q, options, correct, explanation}],
//     tags: [string]
//   }
//
// Speaker convention: "a" voiced by konoha (F), "b" voiced by akira (M).

export const SCENE_STUDIES = [

// ═══════════════ CASUAL (ss1-ss10) ═══════════════

{
  id: "ss1", title: "Ordering Ramen", emoji: "🍜",
  illustration: "/images/scenes/ss1.jpg",
  register: "casual",
  requires: ["g1","g4","f1","f4","f8","fi1","ne21"],
  newWords: [
    { jp: "いらっしゃいませ", romaji: "irasshaimase", en: "Welcome (to a shop)" },
    { jp: "しお", romaji: "shio", en: "salt (ramen base)" },
  ],
  lines: [
    { speaker: "a", role: "Staff", jp: "いらっしゃいませ！ひとりですか？", romaji: "i-ras-sha-i-ma-se! hi-to-ri de-su ka?", en: "Welcome! Just one?" },
    { speaker: "b", role: "You",   jp: "うん、ひとりです。", romaji: "un, hi-to-ri de-su.", en: "Yeah, just one." },
    { speaker: "a", role: "Staff", jp: "ここ、どうぞ。", romaji: "ko-ko, dou-zo.", en: "Here, please." },
    { speaker: "b", role: "You",   jp: "えっと、おすすめは？", romaji: "et-to, o-su-su-me wa?", en: "Um, what's your recommendation?" },
    { speaker: "a", role: "Staff", jp: "しおラーメン、すごくおいしいですよ。", romaji: "shi-o raa-men, su-go-ku oi-shii de-su yo.", en: "Shio ramen, it's really good." },
    { speaker: "b", role: "You",   jp: "じゃ、それひとつください。", romaji: "ja, so-re hi-to-tsu ku-da-sai.", en: "Then, one of those please." },
    { speaker: "a", role: "Staff", jp: "はい、ちょっとまってくださいね。", romaji: "hai, chot-to mat-te ku-da-sai ne.", en: "OK, wait just a moment." },
  ],
  comprehension: [
    { q: "What did the customer order?", options: ["Shio ramen", "Shoyu ramen", "Tonkotsu ramen"], correct: 0, explanation: "The staff recommended しおラーメン (salt ramen) and the customer said 'one of those'." },
  ],
  tags: ["food","restaurant","ordering"],
},

{
  id: "ss2", title: "Meeting a Friend at the Station", emoji: "🚉",
  illustration: "/images/scenes/ss2.jpg",
  register: "casual",
  requires: ["g1","t1","cv1","cv15","fm17","vb24"],
  newWords: [
    { jp: "おそい", romaji: "osoi", en: "late / slow" },
    { jp: "ごめん", romaji: "gomen", en: "sorry (casual)" },
  ],
  lines: [
    { speaker: "a", role: "Friend", jp: "あ、きた！ちょっとおそいよ。", romaji: "a, ki-ta! chot-to o-soi yo.", en: "Ah, you're here! You're a little late!" },
    { speaker: "b", role: "You",    jp: "ごめんごめん、でんしゃがおくれた。", romaji: "go-men go-men, den-sha ga o-ku-re-ta.", en: "Sorry sorry, the train was late." },
    { speaker: "a", role: "Friend", jp: "そっか。じゃ、いこう。", romaji: "sok-ka. ja, i-kou.", en: "Ah I see. Well, let's go." },
    { speaker: "b", role: "You",    jp: "どこいくの？", romaji: "do-ko i-ku no?", en: "Where are we going?" },
    { speaker: "a", role: "Friend", jp: "うん、カフェ。ちかいよ。", romaji: "un, ka-fe. chi-kai yo.", en: "Yeah, a cafe. It's close." },
    { speaker: "b", role: "You",    jp: "いいね。", romaji: "ii ne.", en: "Nice." },
  ],
  comprehension: [
    { q: "Why was the customer late?", options: ["They overslept", "The train was late", "Got lost"], correct: 1, explanation: "でんしゃがおくれた = 'the train was late'." },
  ],
  tags: ["friends","transit","meeting"],
},

{
  id: "ss3", title: "At the Convenience Store", emoji: "🏪",
  illustration: "/images/scenes/ss3.jpg",
  register: "casual",
  requires: ["g4","s5","s7","ne35","cv15"],
  newWords: [
    { jp: "ふくろ", romaji: "fukuro", en: "bag" },
    { jp: "はしをつけますか", romaji: "hashi o tsukemasu ka", en: "Shall I add chopsticks?" },
  ],
  lines: [
    { speaker: "a", role: "Clerk", jp: "いらっしゃいませ。あたためますか？", romaji: "i-ras-sha-i-ma-se. a-ta-ta-me-ma-su ka?", en: "Welcome. Shall I heat it up?" },
    { speaker: "b", role: "You",   jp: "はい、おねがいします。", romaji: "hai, o-ne-gai shi-ma-su.", en: "Yes, please." },
    { speaker: "a", role: "Clerk", jp: "ふくろはいりますか？", romaji: "fu-ku-ro wa i-ri-ma-su ka?", en: "Do you need a bag?" },
    { speaker: "b", role: "You",   jp: "いや、だいじょうぶです。", romaji: "i-ya, dai-jou-bu de-su.", en: "No, I'm fine." },
    { speaker: "a", role: "Clerk", jp: "ごひゃくえんです。", romaji: "go-hya-ku en de-su.", en: "That's 500 yen." },
    { speaker: "b", role: "You",   jp: "カードで。", romaji: "kaa-do de.", en: "By card." },
    { speaker: "a", role: "Clerk", jp: "はい、ありがとうございます。", romaji: "hai, a-ri-ga-tou go-zai-ma-su.", en: "OK, thank you." },
  ],
  comprehension: [
    { q: "How did the customer pay?", options: ["Cash", "Card", "IC card"], correct: 1, explanation: "カードで means 'by card'." },
  ],
  tags: ["shopping","conbini","payment"],
},

{
  id: "ss4", title: "Casual Coffee Date", emoji: "☕",
  illustration: "/images/scenes/ss4.jpg",
  register: "casual",
  requires: ["g1","fi40","fi41","cv18","fe30"],
  newWords: [
    { jp: "ひさしぶり", romaji: "hisashiburi", en: "long time no see" },
  ],
  lines: [
    { speaker: "a", role: "Friend", jp: "ひさしぶり！げんき？", romaji: "hi-sa-shi-bu-ri! gen-ki?", en: "Long time! How are you?" },
    { speaker: "b", role: "You",    jp: "うん、げんきだよ。あなたは？", romaji: "un, gen-ki da yo. a-na-ta wa?", en: "Yeah, I'm good. You?" },
    { speaker: "a", role: "Friend", jp: "まあまあかな。こおひい のむ？", romaji: "maa-maa ka-na. koo-hii no-mu?", en: "So-so I guess. Getting coffee?" },
    { speaker: "b", role: "You",    jp: "うん、のみたい。", romaji: "un, no-mi-tai.", en: "Yeah, I want some." },
    { speaker: "a", role: "Friend", jp: "ここのケーキ、すごくおいしいよ。", romaji: "ko-ko no kee-ki, su-go-ku oi-shii yo.", en: "The cake here is really good." },
    { speaker: "b", role: "You",    jp: "ほんと？たのしみ。", romaji: "hon-to? ta-no-shi-mi.", en: "Really? Looking forward to it." },
  ],
  comprehension: [
    { q: "What is the friend recommending?", options: ["The coffee", "The cake", "The tea"], correct: 1, explanation: "ここのケーキ = 'the cake here'." },
  ],
  tags: ["friends","cafe","catching-up"],
},

{
  id: "ss5", title: "Shopping with a Friend", emoji: "🛍️",
  illustration: "/images/scenes/ss5.jpg",
  register: "casual",
  requires: ["s1","fe23","dc3","dc4","cv18"],
  newWords: [
    { jp: "みて", romaji: "mite", en: "look (imperative)" },
    { jp: "じゃない", romaji: "ja nai", en: "isn't / don't you think?" },
  ],
  lines: [
    { speaker: "a", role: "Friend", jp: "みて、これ、かわいいじゃない？", romaji: "mi-te, ko-re, ka-wa-ii ja nai?", en: "Look, isn't this cute?" },
    { speaker: "b", role: "You",    jp: "ほんとだ、すごくかわいい。", romaji: "hon-to da, su-go-ku ka-wa-ii.", en: "Oh yeah, really cute." },
    { speaker: "a", role: "Friend", jp: "でも、ちょっとたかいかな。", romaji: "de-mo, chot-to ta-kai ka-na.", en: "But, a bit expensive maybe." },
    { speaker: "b", role: "You",    jp: "いくら？", romaji: "i-ku-ra?", en: "How much?" },
    { speaker: "a", role: "Friend", jp: "えっと…ごせんえん。", romaji: "et-to... go-sen en.", en: "Um... 5000 yen." },
    { speaker: "b", role: "You",    jp: "たかっ！やすいの、ないかな。", romaji: "ta-kaa! ya-sui no, nai ka-na.", en: "Expensive! Anything cheaper?" },
  ],
  comprehension: [
    { q: "What's the problem with the item?", options: ["It's ugly", "It's too expensive", "It's broken"], correct: 1, explanation: "ちょっとたかい = 'a bit expensive', reinforced by 'やすいの、ないかな' (anything cheaper?)." },
  ],
  tags: ["friends","shopping","prices"],
},

{
  id: "ss6", title: "Lost in a Neighborhood", emoji: "🗺️",
  illustration: "/images/scenes/ss6.jpg",
  register: "casual",
  requires: ["g5","d1","d2","d3","d4","cp1"],
  newWords: [
    { jp: "たぶん", romaji: "tabun", en: "probably (already in curriculum)" },
  ],
  lines: [
    { speaker: "b", role: "You",   jp: "すみません、ちょっといいですか？", romaji: "su-mi-ma-sen, chot-to ii de-su ka?", en: "Excuse me, got a sec?" },
    { speaker: "a", role: "Local", jp: "はい、どうぞ。", romaji: "hai, dou-zo.", en: "Sure, go ahead." },
    { speaker: "b", role: "You",   jp: "えきはどこですか？まいごなんです。", romaji: "e-ki wa do-ko de-su ka? mai-go nan de-su.", en: "Where's the station? I'm lost." },
    { speaker: "a", role: "Local", jp: "ああ、えきね。まっすぐいって、みぎ。", romaji: "aa, e-ki ne. mas-su-gu it-te, mi-gi.", en: "Ah, the station. Go straight, then right." },
    { speaker: "b", role: "You",   jp: "まっすぐ、みぎ。ちかいですか？", romaji: "mas-su-gu, mi-gi. chi-kai de-su ka?", en: "Straight, then right. Is it close?" },
    { speaker: "a", role: "Local", jp: "うん、たぶんごふんくらい。", romaji: "un, ta-bun go-fun ku-rai.", en: "Yeah, probably about 5 minutes." },
    { speaker: "b", role: "You",   jp: "ありがとうございます！", romaji: "a-ri-ga-tou go-zai-ma-su!", en: "Thanks so much!" },
  ],
  comprehension: [
    { q: "How far is the station?", options: ["About 5 minutes", "About 10 minutes", "Very far"], correct: 0, explanation: "ごふんくらい = about 5 minutes." },
  ],
  tags: ["directions","lost","locals"],
},

{
  id: "ss7", title: "Small Talk About Weather", emoji: "🌦️",
  illustration: "/images/scenes/ss7.jpg",
  register: "casual",
  requires: ["wt1","wt6","fe8","dc5","cv19"],
  newWords: [
    { jp: "ですね", romaji: "desu ne", en: "isn't it (polite tag)" },
  ],
  lines: [
    { speaker: "a", role: "Friend", jp: "きょう、とてもあついね。", romaji: "kyou, to-te-mo a-tsui ne.", en: "It's really hot today, huh." },
    { speaker: "b", role: "You",    jp: "うん、むしあつい。", romaji: "un, mu-shi a-tsui.", en: "Yeah, humid and hot." },
    { speaker: "a", role: "Friend", jp: "あしたもあついかな？", romaji: "a-shi-ta mo a-tsui ka-na?", en: "I wonder if tomorrow's hot too?" },
    { speaker: "b", role: "You",    jp: "たぶんね。あめかも。", romaji: "ta-bun ne. a-me ka-mo.", en: "Probably. Maybe rain." },
    { speaker: "a", role: "Friend", jp: "ええ、いやだな。", romaji: "ee, i-ya da na.", en: "Eh, that's no good." },
    { speaker: "b", role: "You",    jp: "だよね。", romaji: "da yo ne.", en: "Right?" },
  ],
  comprehension: [
    { q: "What might tomorrow's weather be?", options: ["Sunny", "Rainy", "Snow"], correct: 1, explanation: "あめかも = 'maybe rain'." },
  ],
  tags: ["smalltalk","weather"],
},

{
  id: "ss8", title: "Weekend Plans", emoji: "📅",
  illustration: "/images/scenes/ss8.jpg",
  register: "casual",
  requires: ["dt8","vb3","vb50","cv15"],
  newWords: [
    { jp: "おもい", romaji: "omoi", en: "I'm thinking (short for おもう)" },
    { jp: "ぜったい", romaji: "zettai", en: "definitely" },
  ],
  lines: [
    { speaker: "a", role: "Friend", jp: "しゅうまつ、なにする？", romaji: "shuu-ma-tsu, na-ni su-ru?", en: "What are you doing this weekend?" },
    { speaker: "b", role: "You",    jp: "えっと、まだきめてない。", romaji: "et-to, ma-da ki-me-te nai.", en: "Uh, haven't decided yet." },
    { speaker: "a", role: "Friend", jp: "じゃ、いっしょにあそぼう？", romaji: "ja, is-sho ni a-so-bou?", en: "Then let's hang out?" },
    { speaker: "b", role: "You",    jp: "いいね！どこいく？", romaji: "ii ne! do-ko i-ku?", en: "Nice! Where to?" },
    { speaker: "a", role: "Friend", jp: "しぶや、いきたいなとおもい。", romaji: "shi-bu-ya, i-ki-tai na to o-mo-i.", en: "I'm thinking Shibuya." },
    { speaker: "b", role: "You",    jp: "ぜったいいこう！", romaji: "zet-tai i-kou!", en: "Let's definitely go!" },
  ],
  comprehension: [
    { q: "Where do they plan to go?", options: ["Shinjuku", "Shibuya", "Harajuku"], correct: 1, explanation: "しぶや, reinforced by 'ぜったいいこう'." },
  ],
  tags: ["friends","plans","weekend"],
},

{
  id: "ss9", title: "At the Onsen (Public Bath)", emoji: "♨️",
  illustration: "/images/scenes/ss9.jpg",
  register: "casual",
  requires: ["fe8","fe7","fe14"],
  newWords: [
    { jp: "おふろ", romaji: "ofuro", en: "bath" },
    { jp: "きもちいい", romaji: "kimochi ii", en: "feels good" },
  ],
  lines: [
    { speaker: "a", role: "Friend", jp: "あー、きもちいい。", romaji: "aa, ki-mo-chi ii.", en: "Ahh, feels amazing." },
    { speaker: "b", role: "You",    jp: "ほんとだ。おふろ、さいこう。", romaji: "hon-to da. o-fu-ro, sai-kou.", en: "Right? The bath is the best." },
    { speaker: "a", role: "Friend", jp: "すこしあついけど、だいじょうぶ？", romaji: "su-ko-shi a-tsui ke-do, dai-jou-bu?", en: "It's a bit hot, you OK?" },
    { speaker: "b", role: "You",    jp: "うん、へいき。", romaji: "un, hei-ki.", en: "Yeah, I'm fine." },
    { speaker: "a", role: "Friend", jp: "おんせんのあと、ビール のみたい。", romaji: "on-sen no a-to, bii-ru no-mi-tai.", en: "After the bath I want beer." },
    { speaker: "b", role: "You",    jp: "いいね！", romaji: "ii ne!", en: "Nice!" },
  ],
  comprehension: [
    { q: "What do they want after the bath?", options: ["Tea", "Beer", "Coffee"], correct: 1, explanation: "ビールのみたい = want beer." },
  ],
  tags: ["onsen","relaxing","friends"],
},

{
  id: "ss10", title: "Tired and Asking for Help", emoji: "😴",
  illustration: "/images/scenes/ss10.jpg",
  register: "casual",
  requires: ["fe4","fe12","vb32","cv10"],
  newWords: [
    { jp: "だいじょうぶ", romaji: "daijoubu", en: "OK / fine" },
  ],
  lines: [
    { speaker: "b", role: "You",    jp: "ああ、つかれた。", romaji: "aa, tsu-ka-re-ta.", en: "Ugh, I'm tired." },
    { speaker: "a", role: "Friend", jp: "だいじょうぶ？ねむい？", romaji: "dai-jou-bu? ne-mui?", en: "You OK? Sleepy?" },
    { speaker: "b", role: "You",    jp: "うん、すごくねむい。", romaji: "un, su-go-ku ne-mui.", en: "Yeah, really sleepy." },
    { speaker: "a", role: "Friend", jp: "じゃ、てつだうよ。なに？", romaji: "ja, te-tsu-dau yo. na-ni?", en: "I'll help then. What is it?" },
    { speaker: "b", role: "You",    jp: "ほんと？ありがとう。", romaji: "hon-to? a-ri-ga-tou.", en: "Really? Thanks." },
    { speaker: "a", role: "Friend", jp: "もちろん。", romaji: "mo-chi-ron.", en: "Of course." },
  ],
  comprehension: [
    { q: "How does the friend respond?", options: ["Says they're busy", "Offers to help", "Walks away"], correct: 1, explanation: "てつだうよ = 'I'll help'." },
  ],
  tags: ["friends","helping","tiredness"],
},

// ═══════════════ POLITE (ss11-ss20) ═══════════════

{
  id: "ss11", title: "Hotel Check-in", emoji: "🏨",
  illustration: "/images/scenes/ss11.jpg",
  register: "polite",
  requires: ["g4","h1","h2","h3","h4"],
  newWords: [
    { jp: "おなまえ", romaji: "onamae", en: "your name (polite)" },
    { jp: "おへや", romaji: "oheya", en: "room (polite)" },
  ],
  lines: [
    { speaker: "b", role: "You",   jp: "チェックインおねがいします。", romaji: "chek-ku-in o-ne-gai shi-ma-su.", en: "Check-in please." },
    { speaker: "a", role: "Staff", jp: "いらっしゃいませ。おなまえをおねがいします。", romaji: "i-ras-sha-i-ma-se. o-na-ma-e o o-ne-gai shi-ma-su.", en: "Welcome. Your name please." },
    { speaker: "b", role: "You",   jp: "よやくがあります。スミスです。", romaji: "yo-ya-ku ga a-ri-ma-su. su-mi-su de-su.", en: "I have a reservation. Smith." },
    { speaker: "a", role: "Staff", jp: "はい、かくにんします。しょうしょうおまちください。", romaji: "hai, ka-ku-nin shi-ma-su. shou-shou o-ma-chi ku-da-sai.", en: "Yes, I'll check. One moment please." },
    { speaker: "b", role: "You",   jp: "WiFiのパスワードはなんですか？", romaji: "wai-fai no pa-su-waa-do wa nan de-su ka?", en: "What's the WiFi password?" },
    { speaker: "a", role: "Staff", jp: "おへやのなかにございます。", romaji: "o-he-ya no na-ka ni go-zai-ma-su.", en: "It's inside your room." },
    { speaker: "b", role: "You",   jp: "ありがとうございます。", romaji: "a-ri-ga-tou go-zai-ma-su.", en: "Thank you." },
  ],
  comprehension: [
    { q: "Where's the WiFi password?", options: ["At reception", "In the room", "On a flyer"], correct: 1, explanation: "おへやのなかに = 'inside the room'." },
  ],
  tags: ["hotel","check-in","polite"],
},

{
  id: "ss12", title: "Taxi Ride", emoji: "🚖",
  illustration: "/images/scenes/ss12.jpg",
  register: "polite",
  requires: ["t5","t6","d1","ne34"],
  newWords: [
    { jp: "かしこまりました", romaji: "kashikomarimashita", en: "Understood (very polite)" },
  ],
  lines: [
    { speaker: "a", role: "Driver", jp: "どちらまでですか？", romaji: "do-chi-ra ma-de de-su ka?", en: "Where to?" },
    { speaker: "b", role: "You",    jp: "しぶやえきまでおねがいします。", romaji: "shi-bu-ya e-ki ma-de o-ne-gai shi-ma-su.", en: "To Shibuya station please." },
    { speaker: "a", role: "Driver", jp: "かしこまりました。", romaji: "ka-shi-ko-ma-ri-ma-shi-ta.", en: "Understood." },
    { speaker: "b", role: "You",    jp: "いくらくらいですか？", romaji: "i-ku-ra ku-rai de-su ka?", en: "About how much?" },
    { speaker: "a", role: "Driver", jp: "にせんえんくらいですね。", romaji: "ni-sen en ku-rai de-su ne.", en: "About 2000 yen." },
    { speaker: "b", role: "You",    jp: "はい、ありがとうございます。", romaji: "hai, a-ri-ga-tou go-zai-ma-su.", en: "OK, thank you." },
    { speaker: "a", role: "Driver", jp: "つきました。", romaji: "tsu-ki-ma-shi-ta.", en: "We've arrived." },
  ],
  comprehension: [
    { q: "Roughly how much was the fare?", options: ["About 1000 yen", "About 2000 yen", "About 5000 yen"], correct: 1, explanation: "にせんえんくらい = 'about 2000 yen'." },
  ],
  tags: ["taxi","travel","polite"],
},

{
  id: "ss13", title: "Restaurant Reservation", emoji: "🍽️",
  illustration: "/images/scenes/ss13.jpg",
  register: "polite",
  requires: ["f8","f9","h2","ne28","ne29"],
  newWords: [
    { jp: "よやく", romaji: "yoyaku", en: "reservation" },
  ],
  lines: [
    { speaker: "b", role: "You",   jp: "よやくおねがいします。", romaji: "yo-ya-ku o-ne-gai shi-ma-su.", en: "I'd like to make a reservation." },
    { speaker: "a", role: "Staff", jp: "はい、なんめいさまですか？", romaji: "hai, nan-mei sa-ma de-su ka?", en: "Yes, how many people?" },
    { speaker: "b", role: "You",   jp: "ふたりです。", romaji: "fu-ta-ri de-su.", en: "Two people." },
    { speaker: "a", role: "Staff", jp: "おじかんは？", romaji: "o-ji-kan wa?", en: "What time?" },
    { speaker: "b", role: "You",   jp: "しちじでおねがいします。", romaji: "shi-chi-ji de o-ne-gai shi-ma-su.", en: "Seven o'clock please." },
    { speaker: "a", role: "Staff", jp: "かしこまりました。おなまえをどうぞ。", romaji: "ka-shi-ko-ma-ri-ma-shi-ta. o-na-ma-e o dou-zo.", en: "Understood. Your name please." },
  ],
  comprehension: [
    { q: "What time is the reservation?", options: ["6pm", "7pm", "8pm"], correct: 1, explanation: "しちじ = 7 o'clock." },
  ],
  tags: ["restaurant","reservation","polite"],
},

{
  id: "ss14", title: "At the Pharmacy", emoji: "💊",
  illustration: "/images/scenes/ss14.jpg",
  register: "polite",
  requires: ["fe13","cp4","cp15","bd1"],
  newWords: [
    { jp: "あたまがいたい", romaji: "atama ga itai", en: "I have a headache" },
    { jp: "しょくご", romaji: "shokugo", en: "after meals" },
  ],
  lines: [
    { speaker: "b", role: "You",        jp: "すみません、くすりがほしいです。", romaji: "su-mi-ma-sen, ku-su-ri ga ho-shii de-su.", en: "Excuse me, I need medicine." },
    { speaker: "a", role: "Pharmacist", jp: "どうされましたか？", romaji: "dou sa-re-ma-shi-ta ka?", en: "What's wrong?" },
    { speaker: "b", role: "You",        jp: "あたまがいたいです。ねつもあります。", romaji: "a-ta-ma ga i-tai de-su. ne-tsu mo a-ri-ma-su.", en: "My head hurts. I have a fever too." },
    { speaker: "a", role: "Pharmacist", jp: "こちらのくすりをどうぞ。", romaji: "ko-chi-ra no ku-su-ri o dou-zo.", en: "Please take this medicine." },
    { speaker: "b", role: "You",        jp: "いつのみますか？", romaji: "i-tsu no-mi-ma-su ka?", en: "When do I take it?" },
    { speaker: "a", role: "Pharmacist", jp: "しょくご、みっつです。", romaji: "sho-ku-go, mit-tsu de-su.", en: "After meals, three tablets." },
  ],
  comprehension: [
    { q: "When should the medicine be taken?", options: ["Before meals", "After meals", "At night only"], correct: 1, explanation: "しょくご = after meals." },
  ],
  tags: ["pharmacy","sick","polite"],
},

{
  id: "ss15", title: "Reporting a Lost Wallet", emoji: "👮",
  illustration: "/images/scenes/ss15.jpg",
  register: "polite",
  requires: ["cp6","cp14","cp19","vb15"],
  newWords: [
    { jp: "でんしゃのなか", romaji: "densha no naka", en: "inside the train" },
  ],
  lines: [
    { speaker: "b", role: "You",     jp: "すみません、さいふをなくしました。", romaji: "su-mi-ma-sen, sai-fu o na-ku-shi-ma-shi-ta.", en: "Excuse me, I lost my wallet." },
    { speaker: "a", role: "Officer", jp: "どこでなくしましたか？", romaji: "do-ko de na-ku-shi-ma-shi-ta ka?", en: "Where did you lose it?" },
    { speaker: "b", role: "You",     jp: "たぶん、でんしゃのなかです。", romaji: "ta-bun, den-sha no na-ka de-su.", en: "Probably inside the train." },
    { speaker: "a", role: "Officer", jp: "いつですか？", romaji: "i-tsu de-su ka?", en: "When?" },
    { speaker: "b", role: "You",     jp: "けさ、はちじごろです。", romaji: "ke-sa, ha-chi-ji go-ro de-su.", en: "This morning, around eight." },
    { speaker: "a", role: "Officer", jp: "かくにんします。すこしおまちください。", romaji: "ka-ku-nin shi-ma-su. su-ko-shi o-ma-chi ku-da-sai.", en: "I'll check. One moment please." },
  ],
  comprehension: [
    { q: "Where did the user lose the wallet?", options: ["At a restaurant", "In the train", "At the hotel"], correct: 1, explanation: "でんしゃのなか = inside the train." },
  ],
  tags: ["emergency","lost-items","police"],
},

{
  id: "ss16", title: "Asking a Stranger for Directions", emoji: "🙇",
  illustration: "/images/scenes/ss16.jpg",
  register: "polite",
  requires: ["g5","d1","d4","d5"],
  newWords: [
    { jp: "はくぶつかん", romaji: "hakubutsukan", en: "museum" },
  ],
  lines: [
    { speaker: "b", role: "You",       jp: "すみません、ちょっといいですか？", romaji: "su-mi-ma-sen, chot-to ii de-su ka?", en: "Excuse me, do you have a moment?" },
    { speaker: "a", role: "Passerby",  jp: "はい、どうぞ。", romaji: "hai, dou-zo.", en: "Yes, go ahead." },
    { speaker: "b", role: "You",       jp: "はくぶつかんはどこですか？", romaji: "ha-ku-bu-tsu-kan wa do-ko de-su ka?", en: "Where's the museum?" },
    { speaker: "a", role: "Passerby",  jp: "ああ、まっすぐ、そのさきをひだりです。", romaji: "aa, mas-su-gu, so-no sa-ki o hi-da-ri de-su.", en: "Ah, straight, then left at the end." },
    { speaker: "b", role: "You",       jp: "ちかいですか？", romaji: "chi-kai de-su ka?", en: "Is it close?" },
    { speaker: "a", role: "Passerby",  jp: "はい、ごふんくらいです。", romaji: "hai, go-fun ku-rai de-su.", en: "Yes, about 5 minutes." },
  ],
  comprehension: [
    { q: "Direction to the museum?", options: ["Straight then right", "Straight then left", "Back the way they came"], correct: 1, explanation: "まっすぐ、ひだり = 'straight, then left'." },
  ],
  tags: ["directions","polite","strangers"],
},

{
  id: "ss17", title: "Buying a Train Ticket", emoji: "🎫",
  illustration: "/images/scenes/ss17.jpg",
  register: "polite",
  requires: ["t1","t2","t5","ne34"],
  newWords: [
    { jp: "かたみち", romaji: "katamichi", en: "one way" },
    { jp: "おうふく", romaji: "oufuku", en: "round trip" },
  ],
  lines: [
    { speaker: "b", role: "You",   jp: "きょうとまでいちまいください。", romaji: "kyou-to ma-de i-chi-mai ku-da-sai.", en: "One ticket to Kyoto please." },
    { speaker: "a", role: "Staff", jp: "かたみちですか、おうふくですか？", romaji: "ka-ta-mi-chi de-su ka, ou-fu-ku de-su ka?", en: "One way or round trip?" },
    { speaker: "b", role: "You",   jp: "おうふくでおねがいします。", romaji: "ou-fu-ku de o-ne-gai shi-ma-su.", en: "Round trip please." },
    { speaker: "a", role: "Staff", jp: "にまんえんになります。", romaji: "ni-man en ni na-ri-ma-su.", en: "That'll be 20,000 yen." },
    { speaker: "b", role: "You",   jp: "カードでおねがいします。", romaji: "kaa-do de o-ne-gai shi-ma-su.", en: "By card please." },
    { speaker: "a", role: "Staff", jp: "ありがとうございます。", romaji: "a-ri-ga-tou go-zai-ma-su.", en: "Thank you." },
  ],
  comprehension: [
    { q: "Which ticket type did the user buy?", options: ["One way", "Round trip", "Season pass"], correct: 1, explanation: "おうふく = round trip." },
  ],
  tags: ["train","tickets","polite"],
},

{
  id: "ss18", title: "At the Hospital", emoji: "🏥",
  illustration: "/images/scenes/ss18.jpg",
  register: "polite",
  requires: ["e2","cp13","cp15","bd11"],
  newWords: [
    { jp: "きのうから", romaji: "kinou kara", en: "since yesterday" },
  ],
  lines: [
    { speaker: "a", role: "Doctor", jp: "どうされましたか？", romaji: "dou sa-re-ma-shi-ta ka?", en: "What's wrong?" },
    { speaker: "b", role: "You",    jp: "おなかがすごくいたいです。", romaji: "o-na-ka ga su-go-ku i-tai de-su.", en: "My stomach hurts a lot." },
    { speaker: "a", role: "Doctor", jp: "いつからですか？", romaji: "i-tsu ka-ra de-su ka?", en: "Since when?" },
    { speaker: "b", role: "You",    jp: "きのうからです。", romaji: "ki-nou ka-ra de-su.", en: "Since yesterday." },
    { speaker: "a", role: "Doctor", jp: "ねつはありますか？", romaji: "ne-tsu wa a-ri-ma-su ka?", en: "Do you have a fever?" },
    { speaker: "b", role: "You",    jp: "はい、すこしあります。", romaji: "hai, su-ko-shi a-ri-ma-su.", en: "Yes, a little." },
    { speaker: "a", role: "Doctor", jp: "わかりました。しんさつしましょう。", romaji: "wa-ka-ri-ma-shi-ta. shin-sa-tsu shi-ma-shou.", en: "Understood. Let's examine you." },
  ],
  comprehension: [
    { q: "Since when has the patient been sick?", options: ["Today", "Yesterday", "A week ago"], correct: 1, explanation: "きのうから = since yesterday." },
  ],
  tags: ["hospital","sick","polite"],
},

{
  id: "ss19", title: "At the Embassy", emoji: "🛂",
  illustration: "/images/scenes/ss19.jpg",
  register: "polite",
  requires: ["cp5","cp14","cp20","cp21"],
  newWords: [
    { jp: "さいはっこう", romaji: "saihakkou", en: "reissue" },
  ],
  lines: [
    { speaker: "b", role: "You",   jp: "パスポートをなくしました。", romaji: "pa-su-poo-to o na-ku-shi-ma-shi-ta.", en: "I lost my passport." },
    { speaker: "a", role: "Staff", jp: "それはたいへんですね。", romaji: "so-re wa tai-hen de-su ne.", en: "That's terrible." },
    { speaker: "b", role: "You",   jp: "さいはっこうおねがいします。", romaji: "sai-hak-kou o-ne-gai shi-ma-su.", en: "Please reissue it." },
    { speaker: "a", role: "Staff", jp: "しゃしんがひつようです。あとは、しょるいです。", romaji: "sha-shin ga hi-tsu-you de-su. a-to wa, sho-rui de-su.", en: "You need a photo. And documents." },
    { speaker: "b", role: "You",   jp: "わかりました。どのくらいかかりますか？", romaji: "wa-ka-ri-ma-shi-ta. do-no ku-rai ka-ka-ri-ma-su ka?", en: "Got it. How long does it take?" },
    { speaker: "a", role: "Staff", jp: "いっしゅうかんくらいです。", romaji: "is-shuu-kan ku-rai de-su.", en: "About one week." },
  ],
  comprehension: [
    { q: "How long to reissue the passport?", options: ["One day", "One week", "One month"], correct: 1, explanation: "いっしゅうかんくらい = about one week." },
  ],
  tags: ["emergency","embassy","passport"],
},

{
  id: "ss20", title: "Fancy Restaurant", emoji: "🍷",
  illustration: "/images/scenes/ss20.jpg",
  register: "polite",
  requires: ["f2","f4","f7","f8","f9"],
  newWords: [
    { jp: "コース", romaji: "koosu", en: "course menu" },
  ],
  lines: [
    { speaker: "a", role: "Staff", jp: "いらっしゃいませ。ごよやくのおなまえをどうぞ。", romaji: "i-ras-sha-i-ma-se. go-yo-ya-ku no o-na-ma-e o dou-zo.", en: "Welcome. Reservation name please." },
    { speaker: "b", role: "You",   jp: "スミスでよやくしました。", romaji: "su-mi-su de yo-ya-ku shi-ma-shi-ta.", en: "I reserved under Smith." },
    { speaker: "a", role: "Staff", jp: "かしこまりました。おすすめはコースになります。", romaji: "ka-shi-ko-ma-ri-ma-shi-ta. o-su-su-me wa koo-su ni na-ri-ma-su.", en: "Understood. Our recommendation is the course menu." },
    { speaker: "b", role: "You",   jp: "じゃあ、コースでおねがいします。", romaji: "jaa, koo-su de o-ne-gai shi-ma-su.", en: "Then the course please." },
    { speaker: "a", role: "Staff", jp: "おのみものはいかがでしょうか？", romaji: "o-no-mi-mo-no wa i-ka-ga de-shou ka?", en: "What about drinks?" },
    { speaker: "b", role: "You",   jp: "ビールをふたつおねがいします。", romaji: "bii-ru o fu-ta-tsu o-ne-gai shi-ma-su.", en: "Two beers please." },
  ],
  comprehension: [
    { q: "What did the customer order?", options: ["À la carte", "The course menu", "Just drinks"], correct: 1, explanation: "コースでおねがいします = 'course please'." },
  ],
  tags: ["restaurant","fancy","polite"],
},

// ═══════════════ MIXED REGISTER (ss21-ss25) ═══════════════
// Service staff speak polite; customer speaks casual.

{
  id: "ss21", title: "Casual Order, Polite Waiter", emoji: "🥢",
  illustration: "/images/scenes/ss21.jpg",
  register: "mixed",
  requires: ["fi8","fi24","f8","cv5"],
  newWords: [
    { jp: "なまビール", romaji: "namabiiru", en: "draft beer" },
  ],
  lines: [
    { speaker: "a", role: "Waiter", jp: "いらっしゃいませ。ごちゅうもんは？", romaji: "i-ras-sha-i-ma-se. go-chuu-mon wa?", en: "Welcome. What'll you have?" },
    { speaker: "b", role: "You",    jp: "やきとり、みっつ。", romaji: "ya-ki-to-ri, mit-tsu.", en: "Yakitori, three." },
    { speaker: "a", role: "Waiter", jp: "かしこまりました。おのみものは？", romaji: "ka-shi-ko-ma-ri-ma-shi-ta. o-no-mi-mo-no wa?", en: "Understood. Drinks?" },
    { speaker: "b", role: "You",    jp: "なまビールひとつ。", romaji: "na-ma bii-ru hi-to-tsu.", en: "One draft beer." },
    { speaker: "a", role: "Waiter", jp: "かしこまりました。", romaji: "ka-shi-ko-ma-ri-ma-shi-ta.", en: "Understood." },
    { speaker: "b", role: "You",    jp: "ありがとう。", romaji: "a-ri-ga-tou.", en: "Thanks." },
  ],
  comprehension: [
    { q: "How many yakitori did they order?", options: ["Two", "Three", "Four"], correct: 1, explanation: "みっつ = three." },
  ],
  tags: ["restaurant","mixed-register","food"],
},

{
  id: "ss22", title: "Couple at a 100-Yen Shop", emoji: "🛒",
  illustration: "/images/scenes/ss22.jpg",
  register: "mixed",
  requires: ["s1","s6","ne35","fe23"],
  newWords: [
    { jp: "ぜんぶ", romaji: "zenbu", en: "all / everything" },
  ],
  lines: [
    { speaker: "b", role: "You",         jp: "これ、かわいくない？", romaji: "ko-re, ka-wa-i-ku nai?", en: "This is cute, right?" },
    { speaker: "a", role: "Partner",     jp: "うん、かわいい！ぜんぶひゃくえん？", romaji: "un, ka-wa-ii! zen-bu hya-ku en?", en: "Yeah, cute! All 100 yen?" },
    { speaker: "b", role: "You",         jp: "そう、やすいよね。", romaji: "sou, ya-sui yo ne.", en: "Right, so cheap huh." },
    { speaker: "a", role: "Partner",     jp: "じゃ、みっつかおう。", romaji: "ja, mit-tsu ka-ou.", en: "Then let's buy three." },
    { speaker: "b", role: "You",         jp: "すみません、これみっつください。", romaji: "su-mi-ma-sen, ko-re mit-tsu ku-da-sai.", en: "Excuse me, three of these please." },
    { speaker: "c", role: "Clerk",       jp: "かしこまりました。さんびゃくえんです。", romaji: "ka-shi-ko-ma-ri-ma-shi-ta. san-bya-ku en de-su.", en: "Understood. 300 yen." },
  ],
  comprehension: [
    { q: "Total cost?", options: ["100 yen", "300 yen", "500 yen"], correct: 1, explanation: "Three items × 100 yen = 300 yen (さんびゃくえん)." },
  ],
  tags: ["shopping","couple","mixed-register"],
},

{
  id: "ss23", title: "Old Shop Owner & Young Customer", emoji: "🏮",
  illustration: "/images/scenes/ss23.jpg",
  register: "mixed",
  requires: ["g4","s1","fi20","fi21"],
  newWords: [
    { jp: "むかしから", romaji: "mukashi kara", en: "since long ago" },
  ],
  lines: [
    { speaker: "a", role: "Owner", jp: "いらっしゃい。", romaji: "i-ras-sha-i.", en: "Welcome." },
    { speaker: "b", role: "You",   jp: "おばあちゃん、このもち、いくら？", romaji: "o-baa-chan, ko-no mo-chi, i-ku-ra?", en: "Grandma, how much is this mochi?" },
    { speaker: "a", role: "Owner", jp: "さんびゃくえんだよ。むかしからつくっているんだ。", romaji: "san-bya-ku en da yo. mu-ka-shi ka-ra tsu-kut-te i-ru n da.", en: "300 yen. I've made them since long ago." },
    { speaker: "b", role: "You",   jp: "ほんと？すごい。ふたつください。", romaji: "hon-to? su-goi. fu-ta-tsu ku-da-sai.", en: "Really? Amazing. Two please." },
    { speaker: "a", role: "Owner", jp: "はい、どうぞ。", romaji: "hai, dou-zo.", en: "Here you go." },
    { speaker: "b", role: "You",   jp: "ありがとう！", romaji: "a-ri-ga-tou!", en: "Thanks!" },
  ],
  comprehension: [
    { q: "How long has the owner made the mochi?", options: ["A few years", "Since long ago", "Just started"], correct: 1, explanation: "むかしから = 'since long ago'." },
  ],
  tags: ["traditional","shop","mixed-register"],
},

{
  id: "ss24", title: "Asking the Landlord for Help", emoji: "🔑",
  illustration: "/images/scenes/ss24.jpg",
  register: "mixed",
  requires: ["cp8","vb32","cv15"],
  newWords: [
    { jp: "エアコン", romaji: "eakon", en: "air conditioner" },
    { jp: "すぐ", romaji: "sugu", en: "right away" },
  ],
  lines: [
    { speaker: "b", role: "You",         jp: "すみません、エアコンがこわれてます。", romaji: "su-mi-ma-sen, e-a-kon ga ko-wa-re-te ma-su.", en: "Excuse me, the AC is broken." },
    { speaker: "a", role: "Landlord",    jp: "ああ、それはこまりましたね。", romaji: "aa, so-re wa ko-ma-ri-ma-shi-ta ne.", en: "Ah, that's a problem." },
    { speaker: "b", role: "You",         jp: "ちょっとあついんです。", romaji: "chot-to a-tsui n de-su.", en: "It's a bit hot." },
    { speaker: "a", role: "Landlord",    jp: "わかりました。あしたみにいきます。", romaji: "wa-ka-ri-ma-shi-ta. a-shi-ta mi ni i-ki-ma-su.", en: "Understood. I'll come look tomorrow." },
    { speaker: "b", role: "You",         jp: "きょう、きてほしいんですけど。", romaji: "kyou, ki-te ho-shii n de-su ke-do.", en: "I'd like you to come today though." },
    { speaker: "a", role: "Landlord",    jp: "じゃあ、すぐいきます。", romaji: "jaa, su-gu i-ki-ma-su.", en: "Alright, I'll come right away." },
  ],
  comprehension: [
    { q: "When does the landlord agree to come?", options: ["Tomorrow", "Right away", "Next week"], correct: 1, explanation: "すぐいきます = 'I'll come right away'." },
  ],
  tags: ["home","landlord","mixed-register"],
},

{
  id: "ss25", title: "Doctor Reassures a Worried Patient", emoji: "👨‍⚕️",
  illustration: "/images/scenes/ss25.jpg",
  register: "mixed",
  requires: ["fe17","fe9","cp13","bd3"],
  newWords: [
    { jp: "しんぱいしないで", romaji: "shinpai shinaide", en: "don't worry" },
  ],
  lines: [
    { speaker: "a", role: "Doctor", jp: "ぐあいはどうですか？", romaji: "gu-ai wa dou de-su ka?", en: "How are you feeling?" },
    { speaker: "b", role: "You",    jp: "めがちょっといたい。こわい。", romaji: "me ga chot-to i-tai. ko-wai.", en: "My eye hurts a bit. I'm scared." },
    { speaker: "a", role: "Doctor", jp: "しんぱいしないでください。だいじょうぶですよ。", romaji: "shin-pai shi-nai-de ku-da-sai. dai-jou-bu de-su yo.", en: "Please don't worry. You're OK." },
    { speaker: "b", role: "You",    jp: "ほんと？よかった。", romaji: "hon-to? yo-kat-ta.", en: "Really? Thank god." },
    { speaker: "a", role: "Doctor", jp: "くすりをだしますね。", romaji: "ku-su-ri o da-shi-ma-su ne.", en: "I'll prescribe medicine." },
    { speaker: "b", role: "You",    jp: "ありがとう。", romaji: "a-ri-ga-tou.", en: "Thanks." },
  ],
  comprehension: [
    { q: "What does the doctor say?", options: ["It's serious", "Don't worry", "Come back tomorrow"], correct: 1, explanation: "しんぱいしないで + だいじょうぶですよ." },
  ],
  tags: ["doctor","reassurance","mixed-register"],
},

];
