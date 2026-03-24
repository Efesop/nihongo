// ═══ JAPAN REGIONS DATA ═══

export const REGIONS = {
  hokkaido: {
    name: "北海道", romaji: "Hokkaidō", english: "Hokkaido",
    color: "#5a9ec4",
    cities: [
      { name: "札幌", romaji: "Sapporo", english: "Sapporo", desc: "Capital — beer, ramen, Snow Festival" },
      { name: "函館", romaji: "Hakodate", english: "Hakodate", desc: "Famous night view, morning fish market" },
      { name: "小樽", romaji: "Otaru", english: "Otaru", desc: "Canal town, glass crafts, sushi street" },
    ],
    landmarks: ["Lavender fields of Furano", "Shiretoko National Park (UNESCO)", "Niseko ski resort"],
    food: [
      { name: "みそラーメン", romaji: "miso rāmen", english: "Miso ramen", desc: "Sapporo's rich, warming signature dish" },
      { name: "ジンギスカン", romaji: "Jingisukan", english: "Genghis Khan BBQ", desc: "Grilled lamb on a dome-shaped grill" },
      { name: "かに", romaji: "kani", english: "Crab", desc: "King crab, snow crab — Hokkaido is the capital" },
    ],
    culture: "Japan's northern frontier — vast landscapes, hot springs, and indigenous Ainu culture. Winters are legendary.",
    festival: { name: "雪まつり", romaji: "Yuki Matsuri", english: "Snow Festival", when: "February" },
    anime: ["Golden Kamuy", "Silver Spoon"],
    senpaiQuote: "Hokkaido. Cold air sharpens the mind. The ramen warms the soul. Good training grounds.",
    usefulPhrases: ["f1", "f4", "f7", "h1", "t1"],
    travelTip: "Get a Hokkaido Rail Pass — distances are huge. Rent a car in summer for the countryside.",
  },
  tohoku: {
    name: "東北", romaji: "Tōhoku", english: "Tohoku",
    color: "#6ec4a0",
    cities: [
      { name: "仙台", romaji: "Sendai", english: "Sendai", desc: "City of Trees — gyutan beef tongue capital" },
      { name: "青森", romaji: "Aomori", english: "Aomori", desc: "Apple country, Nebuta Festival floats" },
      { name: "秋田", romaji: "Akita", english: "Akita", desc: "Rice country, beautiful Kakunodate samurai district" },
    ],
    landmarks: ["Matsushima Bay (one of Japan's three views)", "Ginzan Onsen (fairy-tale hot spring town)", "Mount Zaō ice monsters"],
    food: [
      { name: "牛タン", romaji: "gyūtan", english: "Beef tongue", desc: "Sendai specialty — thick-cut, chargrilled" },
      { name: "きりたんぽ", romaji: "kiritanpo", english: "Kiritanpo", desc: "Pounded rice sticks cooked in hot pot" },
      { name: "わんこそば", romaji: "wanko soba", english: "Wanko soba", desc: "Endless small bowls of buckwheat noodles" },
    ],
    culture: "Rural, traditional Japan at its purest. Famous for festivals with massive illuminated floats and deep snowfall.",
    festival: { name: "ねぶた祭り", romaji: "Nebuta Matsuri", english: "Nebuta Festival", when: "August" },
    anime: ["Mushishi", "Summer Wars"],
    senpaiQuote: "Tohoku is quiet. Disciplined. The people don't waste words. I respect that.",
    usefulPhrases: ["g1", "g4", "t1", "t3", "d1"],
    travelTip: "Visit in summer for festivals or winter for onsen + snow. The JR East Pass covers the region.",
  },
  kanto: {
    name: "関東", romaji: "Kantō", english: "Kanto",
    color: "#c45a5a",
    cities: [
      { name: "東京", romaji: "Tōkyō", english: "Tokyo", desc: "Capital — Shibuya, Akihabara, Asakusa, everything" },
      { name: "横浜", romaji: "Yokohama", english: "Yokohama", desc: "Chinatown, harbour views, ramen museum" },
      { name: "鎌倉", romaji: "Kamakura", english: "Kamakura", desc: "Great Buddha, temples, coastal vibes" },
      { name: "日光", romaji: "Nikkō", english: "Nikko", desc: "Ornate Tōshōgū shrine in the mountains" },
    ],
    landmarks: ["Tokyo Skytree", "Senso-ji Temple", "Mount Fuji (shared with Chubu)", "Meiji Shrine"],
    food: [
      { name: "もんじゃ焼き", romaji: "monjayaki", english: "Monjayaki", desc: "Tokyo's runny, savoury pancake — Tsukishima style" },
      { name: "すし", romaji: "sushi", english: "Sushi", desc: "Edomae-style — born in Tokyo's fish markets" },
      { name: "ラーメン", romaji: "rāmen", english: "Ramen", desc: "Every style exists here — shoyu, tonkotsu, tsukemen" },
    ],
    culture: "The beating heart of modern Japan. Neon lights and ancient temples side by side. 38 million people in greater Tokyo.",
    festival: { name: "三社祭", romaji: "Sanja Matsuri", english: "Sanja Festival", when: "May" },
    anime: ["Your Name", "Steins;Gate", "Tokyo Ghoul", "Durarara!!"],
    senpaiQuote: "Tokyo. Loud, fast, overwhelming. Either you conquer it or it swallows you whole.",
    usefulPhrases: ["g1", "g2", "g3", "s1", "t1", "t3", "d1", "d2"],
    travelTip: "Get a Suica/Pasmo IC card immediately. Walk more than you think — Tokyo is a walking city.",
  },
  chubu: {
    name: "中部", romaji: "Chūbu", english: "Chubu",
    color: "#8b6ec4",
    cities: [
      { name: "名古屋", romaji: "Nagoya", english: "Nagoya", desc: "Industrial powerhouse — Toyota, unique food culture" },
      { name: "金沢", romaji: "Kanazawa", english: "Kanazawa", desc: "Preserved samurai & geisha districts, Kenroku-en garden" },
      { name: "松本", romaji: "Matsumoto", english: "Matsumoto", desc: "Black Crow castle, gateway to the Alps" },
      { name: "高山", romaji: "Takayama", english: "Takayama", desc: "Mountain town — old streets, morning markets, sake" },
    ],
    landmarks: ["Japanese Alps (Kamikōchi)", "Shirakawa-gō (UNESCO thatched-roof village)", "Kenroku-en Garden"],
    food: [
      { name: "味噌カツ", romaji: "miso katsu", english: "Miso cutlet", desc: "Nagoya's deep-fried pork with red miso sauce" },
      { name: "ひつまぶし", romaji: "hitsumabushi", english: "Hitsumabushi", desc: "Nagoya grilled eel — eaten three ways" },
      { name: "ほうとう", romaji: "hōtō", english: "Houtou", desc: "Thick flat noodles in miso pumpkin stew" },
    ],
    culture: "Mountains and tradition. The Japanese Alps divide the region — coastal vs highland cultures are completely different.",
    festival: { name: "高山祭", romaji: "Takayama Matsuri", english: "Takayama Festival", when: "April & October" },
    anime: ["Your Name (Hida)", "Wolf Children"],
    senpaiQuote: "The mountains of Chubu forge strong people. Also strong sake. Both important.",
    usefulPhrases: ["g1", "f1", "f4", "h1", "d1", "d3"],
    travelTip: "The Alpine Route (Tateyama Kurobe) is spectacular April-November. Book Shirakawa-gō early.",
  },
  kansai: {
    name: "関西", romaji: "Kansai", english: "Kansai",
    color: "#c49a5a",
    cities: [
      { name: "大阪", romaji: "Ōsaka", english: "Osaka", desc: "Street food capital — Dotonbori, comedy, nightlife" },
      { name: "京都", romaji: "Kyōto", english: "Kyoto", desc: "1,000 temples, geisha, bamboo groves, tea ceremony" },
      { name: "奈良", romaji: "Nara", english: "Nara", desc: "Friendly deer, Great Buddha, ancient capital" },
      { name: "神戸", romaji: "Kōbe", english: "Kobe", desc: "Port city — famous beef, harbour views" },
    ],
    landmarks: ["Fushimi Inari (1000 red gates)", "Kinkaku-ji (Golden Pavilion)", "Arashiyama Bamboo Grove", "Osaka Castle"],
    food: [
      { name: "たこ焼き", romaji: "takoyaki", english: "Takoyaki", desc: "Osaka's famous octopus balls — street food king" },
      { name: "お好み焼き", romaji: "okonomiyaki", english: "Okonomiyaki", desc: "Savoury pancake you cook at your table" },
      { name: "抹茶", romaji: "matcha", english: "Matcha", desc: "Kyoto is matcha heaven — tea, sweets, ice cream" },
    ],
    culture: "The cultural heart of Japan. Kyoto was the capital for 1,000 years. Osaka is the food and comedy capital. The Kansai dialect (関西弁) is famously different.",
    festival: { name: "祇園祭", romaji: "Gion Matsuri", english: "Gion Festival", when: "July" },
    anime: ["The Tatami Galaxy", "Rurouni Kenshin (Kyoto arc)"],
    senpaiQuote: "Kansai people talk fast, eat well, and laugh loud. In Osaka, say おおきに instead of ありがとう.",
    usefulPhrases: ["g1", "g2", "f1", "f2", "f3", "f4", "s1", "d1"],
    travelTip: "Get the Kansai Thru Pass for trains between cities. Kyoto buses are packed — rent a bicycle instead.",
  },
  chugoku: {
    name: "中国", romaji: "Chūgoku", english: "Chugoku",
    color: "#5ac48a",
    cities: [
      { name: "広島", romaji: "Hiroshima", english: "Hiroshima", desc: "Peace Memorial, rebuilt with hope and resilience" },
      { name: "岡山", romaji: "Okayama", english: "Okayama", desc: "Momotaro's hometown, Korakuen garden" },
      { name: "松江", romaji: "Matsue", english: "Matsue", desc: "Castle town on a lake, sunset capital of Japan" },
    ],
    landmarks: ["Hiroshima Peace Memorial (UNESCO)", "Miyajima floating torii gate", "Izumo Grand Shrine"],
    food: [
      { name: "広島風お好み焼き", romaji: "Hiroshima-fū okonomiyaki", english: "Hiroshima okonomiyaki", desc: "Layered style with noodles — don't call it Osaka style" },
      { name: "もみじ饅頭", romaji: "momiji manjū", english: "Maple leaf cake", desc: "Miyajima's iconic maple-shaped sweet cake" },
      { name: "牡蠣", romaji: "kaki", english: "Oysters", desc: "Hiroshima produces 60% of Japan's oysters" },
    ],
    culture: "A region of resilience and beauty. Hiroshima's peace message resonates worldwide. The San'in coast is Japan's hidden gem.",
    festival: { name: "とうかさん", romaji: "Tōka-san", english: "Touka-san Festival", when: "June" },
    anime: ["In This Corner of the World"],
    senpaiQuote: "Hiroshima teaches that strength isn't about fighting. Sometimes it's about rebuilding.",
    usefulPhrases: ["g1", "g4", "t1", "d1", "d2"],
    travelTip: "Miyajima island is a must — time your visit for high tide to see the floating torii.",
  },
  shikoku: {
    name: "四国", romaji: "Shikoku", english: "Shikoku",
    color: "#c4985a",
    cities: [
      { name: "松山", romaji: "Matsuyama", english: "Matsuyama", desc: "Dōgo Onsen — Japan's oldest hot spring" },
      { name: "高松", romaji: "Takamatsu", english: "Takamatsu", desc: "Udon capital, Ritsurin Garden" },
      { name: "高知", romaji: "Kōchi", english: "Kochi", desc: "Sunday market, river fishing, free-spirited vibe" },
    ],
    landmarks: ["88-temple pilgrimage route", "Dōgo Onsen (oldest in Japan)", "Iya Valley vine bridges", "Ritsurin Garden"],
    food: [
      { name: "讃岐うどん", romaji: "Sanuki udon", english: "Sanuki udon", desc: "Takamatsu's thick, chewy, perfect udon noodles" },
      { name: "かつおのたたき", romaji: "katsuo no tataki", english: "Seared bonito", desc: "Kochi's flame-seared, barely cooked bonito" },
      { name: "鯛めし", romaji: "tai meshi", english: "Sea bream rice", desc: "Whole fish baked on rice — Ehime specialty" },
    ],
    culture: "The spiritual island. The 88-temple pilgrimage (1,200km walking) is one of the world's great spiritual journeys. Fewer tourists, deeper Japan.",
    festival: { name: "よさこい祭り", romaji: "Yosakoi Matsuri", english: "Yosakoi Festival", when: "August" },
    anime: ["Anpanman (creator from Kochi)"],
    senpaiQuote: "Shikoku is where you go to find yourself. 88 temples. 1,200 kilometres. No shortcuts.",
    usefulPhrases: ["g1", "g4", "h1", "d1", "f1"],
    travelTip: "The pilgrimage can be done in sections. Rent a car — trains are sparse outside cities.",
  },
  kyushu: {
    name: "九州・沖縄", romaji: "Kyūshū · Okinawa", english: "Kyushu & Okinawa",
    color: "#c45a8b",
    cities: [
      { name: "福岡", romaji: "Fukuoka", english: "Fukuoka", desc: "Yatai street stalls, tonkotsu ramen birthplace" },
      { name: "長崎", romaji: "Nagasaki", english: "Nagasaki", desc: "European heritage, peace park, castella cake" },
      { name: "別府", romaji: "Beppu", english: "Beppu", desc: "Japan's hot spring capital — steam everywhere" },
      { name: "沖縄", romaji: "Okinawa", english: "Okinawa", desc: "Tropical beaches, unique Ryukyu culture, US bases" },
    ],
    landmarks: ["Beppu's Hell Hot Springs", "Yakushima ancient cedar forest (UNESCO)", "Okinawa beaches", "Kumamoto Castle"],
    food: [
      { name: "とんこつラーメン", romaji: "tonkotsu rāmen", english: "Tonkotsu ramen", desc: "Fukuoka's creamy pork bone broth — the original" },
      { name: "チャンプルー", romaji: "chanpurū", english: "Champuru", desc: "Okinawan stir-fry — goya bitter melon, tofu, spam" },
      { name: "カステラ", romaji: "kasutera", english: "Castella", desc: "Nagasaki's Portuguese-influenced sponge cake" },
    ],
    culture: "Where Japan meets the tropics. Kyushu has volcanoes, hot springs, and warm people. Okinawa is a different world — Ryukyu kingdom culture, beaches, and the longest-living people on Earth.",
    festival: { name: "博多どんたく", romaji: "Hakata Dontaku", english: "Hakata Dontaku", when: "May" },
    anime: ["One Piece (Oda from Kumamoto)", "Barakamon (Gotō Islands)"],
    senpaiQuote: "Kyushu has fire in its blood — volcanoes, hot springs, and the strongest shōchū. Okinawa? Different rules entirely.",
    usefulPhrases: ["g1", "f1", "f2", "f4", "h1", "h2", "e1"],
    travelTip: "JR Kyushu Pass for trains. Fly to Okinawa — it's 1,500km from Tokyo. Beach season is April-October.",
  },
};

export const REGION_ORDER = ["hokkaido", "tohoku", "kanto", "chubu", "kansai", "chugoku", "shikoku", "kyushu"];

// SVG paths for Japan regions (viewBox 0 0 500 800)
// Japan runs NE-SW: Hokkaido top-right, Kyushu bottom-left, Okinawa far south
export const REGION_PATHS = {
  hokkaido: "M 310 40 L 340 30 L 370 35 L 390 55 L 395 80 L 385 105 L 370 115 L 350 118 L 335 130 L 320 125 L 300 115 L 285 105 L 280 85 L 285 65 L 295 50 Z",
  tohoku: "M 300 155 L 315 148 L 330 152 L 340 165 L 345 185 L 342 210 L 338 230 L 330 248 L 318 258 L 305 255 L 295 248 L 288 235 L 282 215 L 280 195 L 282 175 L 290 160 Z",
  kanto: "M 318 258 L 335 255 L 348 262 L 352 278 L 348 295 L 338 305 L 322 308 L 310 302 L 305 290 L 305 272 L 310 262 Z",
  chubu: "M 282 248 L 295 248 L 305 255 L 310 262 L 305 272 L 305 290 L 310 302 L 300 312 L 285 318 L 268 320 L 252 315 L 240 305 L 235 290 L 238 275 L 248 262 L 265 252 Z",
  kansai: "M 252 315 L 268 320 L 278 330 L 280 345 L 275 358 L 265 365 L 250 368 L 238 362 L 230 350 L 228 338 L 235 325 L 245 318 Z",
  chugoku: "M 175 330 L 195 322 L 215 318 L 235 325 L 228 338 L 230 350 L 225 360 L 210 368 L 195 370 L 178 365 L 165 355 L 160 342 L 165 332 Z",
  shikoku: "M 210 378 L 230 375 L 248 380 L 258 392 L 255 405 L 242 412 L 225 415 L 210 410 L 200 400 L 202 388 Z",
  kyushu: "M 135 348 L 152 340 L 165 345 L 170 360 L 172 378 L 168 395 L 158 410 L 145 418 L 130 415 L 120 402 L 118 385 L 122 368 L 128 355 Z M 145 520 L 165 515 L 180 525 L 185 545 L 178 560 L 162 568 L 145 565 L 135 550 L 138 535 Z",
};

// Label positions for region names on map
export const LABEL_POS = {
  hokkaido: { x: 340, y: 80 },
  tohoku: { x: 312, y: 205 },
  kanto: { x: 330, y: 282 },
  chubu: { x: 268, y: 285 },
  kansai: { x: 258, y: 342 },
  chugoku: { x: 195, y: 348 },
  shikoku: { x: 232, y: 396 },
  kyushu: { x: 148, y: 382 },
};

// City dot positions on the map
export const CITY_POS = {
  hokkaido: [{ x: 345, y: 68 }, { x: 310, y: 110 }, { x: 330, y: 85 }],
  tohoku: [{ x: 325, y: 235 }, { x: 315, y: 175 }, { x: 298, y: 200 }],
  kanto: [{ x: 335, y: 278 }, { x: 342, y: 292 }, { x: 325, y: 298 }, { x: 315, y: 265 }],
  chubu: [{ x: 278, y: 298 }, { x: 248, y: 272 }, { x: 265, y: 268 }, { x: 255, y: 280 }],
  kansai: [{ x: 262, y: 345 }, { x: 250, y: 335 }, { x: 268, y: 355 }, { x: 245, y: 348 }],
  chugoku: [{ x: 195, y: 355 }, { x: 208, y: 340 }, { x: 178, y: 345 }],
  shikoku: [{ x: 215, y: 395 }, { x: 238, y: 388 }, { x: 225, y: 405 }],
  kyushu: [{ x: 148, y: 368 }, { x: 138, y: 390 }, { x: 158, y: 400 }, { x: 160, y: 540 }],
};

// Season data
const month = new Date().getMonth();
export const CURRENT_SEASON = month >= 2 && month <= 4
  ? { name: "春", romaji: "Haru", english: "Spring", tip: "Cherry blossom season — sakura bloom from south to north, late March to mid April.", icon: "🌸" }
  : month >= 5 && month <= 7
  ? { name: "夏", romaji: "Natsu", english: "Summer", tip: "Festival season! Hot and humid. Okinawa beaches, mountain hiking, fireworks everywhere.", icon: "🎆" }
  : month >= 8 && month <= 10
  ? { name: "秋", romaji: "Aki", english: "Autumn", tip: "Autumn leaves (紅葉 kōyō) paint Japan red and gold. Best weather for travel.", icon: "🍁" }
  : { name: "冬", romaji: "Fuyu", english: "Winter", tip: "Ski season in Hokkaido & the Alps. Hot springs feel best in the cold. Illuminations everywhere.", icon: "❄️" };
