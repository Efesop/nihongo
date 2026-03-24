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

export const REGION_PATHS = {
  hokkaido: "M606,250 L605,255 L602,256 L602,247 L608,245 L606,250 Z M635,271 L634,260 L630,253 L625,252 L623,247 L619,246 L617,241 L621,233 L619,222 L621,219 L630,217 L636,208 L639,212 L641,211 L645,202 L651,197 L641,183 L642,176 L649,174 L662,184 L673,181 L673,184 L680,187 L685,184 L691,175 L685,150 L688,145 L695,142 L699,136 L698,113 L702,105 L703,95 L700,77 L692,58 L695,49 L694,43 L696,46 L701,45 L707,38 L733,65 L741,78 L757,95 L786,114 L815,119 L816,123 L821,128 L840,128 L862,101 L864,106 L854,129 L854,139 L857,145 L867,148 L865,150 L866,147 L860,147 L865,159 L871,166 L875,167 L882,159 L889,158 L879,166 L877,173 L860,176 L858,182 L854,187 L849,187 L847,185 L848,183 L845,182 L842,188 L845,190 L830,191 L822,188 L807,196 L793,212 L784,226 L781,235 L782,250 L780,258 L766,247 L743,238 L715,221 L702,219 L705,216 L690,224 L674,240 L671,237 L675,237 L670,236 L668,230 L660,222 L649,223 L644,230 L641,240 L642,244 L654,252 L664,252 L673,264 L682,267 L684,270 L678,275 L674,277 L665,273 L662,275 L662,271 L659,270 L657,275 L650,279 L650,288 L642,292 L639,297 L632,294 L629,288 L630,279 L635,271 Z M673,58 L675,55 L679,57 L681,62 L677,65 L673,62 L673,58 Z M667,45 L667,43 L669,45 L668,55 L665,45 L667,45 Z M971,27 L969,23 L967,23 L965,27 L967,33 L966,36 L961,38 L959,45 L952,44 L953,51 L943,60 L943,64 L937,64 L937,66 L941,68 L941,72 L938,75 L934,74 L934,79 L931,76 L932,81 L929,88 L933,89 L938,80 L943,79 L948,69 L958,60 L960,50 L965,53 L971,51 L986,34 L999,25 L1008,23 L1009,20 L1006,16 L1009,12 L1004,10 L998,12 L986,30 L975,32 L971,27 Z M892,109 L897,103 L905,101 L910,94 L913,95 L916,89 L906,92 L898,87 L895,89 L891,99 L882,114 L882,117 L868,132 L870,139 L875,138 L875,142 L876,129 L884,124 L885,119 L888,119 L889,112 L892,109 Z M924,135 L936,125 L931,123 L927,126 L928,127 L921,129 L921,133 L923,132 L924,135 Z M902,152 L906,147 L899,149 L902,152 Z M893,156 L895,153 L891,154 L893,156 Z",
  tohoku: "M676,580 L666,575 L666,579 L660,585 L650,576 L649,570 L643,566 L631,563 L606,579 L598,577 L599,563 L594,558 L598,552 L596,548 L597,545 L606,544 L607,541 L615,541 L613,532 L622,522 L619,520 L626,522 L632,521 L634,525 L638,524 L641,526 L647,525 L650,521 L648,520 L649,511 L655,511 L659,515 L668,515 L669,521 L674,523 L673,521 L677,521 L677,515 L681,515 L687,529 L687,556 L685,572Z M626,440 L636,439 L640,444 L654,447 L656,452 L660,453 L665,461 L663,469 L660,469 L664,480 L657,492 L658,498 L655,504 L648,506 L649,511 L648,520 L650,521 L647,525 L641,526 L638,524 L634,525 L632,521 L626,522 L619,520 L616,515 L619,507 L619,499 L627,496 L629,492 L620,486 L620,479 L612,476 L625,453Z M671,449 L664,454 L660,453 L656,452 L654,447 L640,444 L636,439 L626,440 L628,430 L633,421 L634,399 L628,391 L620,394 L617,385 L623,388 L629,380 L632,371 L632,363 L627,358 L631,359 L634,355 L646,357 L649,354 L656,359 L659,357 L662,359 L672,352 L672,357 L677,357 L676,368 L672,373 L674,391 L669,392 L672,396 L669,400 L671,405 L667,411 L664,422 L672,435 L669,438 L672,443Z M681,515 L677,515 L677,521 L673,521 L674,523 L669,521 L668,515 L659,515 L655,511 L649,511 L648,506 L655,504 L658,498 L657,492 L664,480 L660,469 L663,469 L665,461 L660,453 L664,454 L671,449 L681,454 L689,453 L687,457 L693,461 L697,456 L703,459 L705,445 L712,446 L715,453 L710,450 L711,455 L707,459 L710,464 L708,462 L704,465 L708,467 L705,473 L709,473 L709,477 L706,475 L708,479 L705,480 L706,483 L709,482 L707,484 L709,486 L709,490 L705,488 L706,485 L703,486 L705,484 L704,482 L687,485 L684,488 L688,490 L683,491 L686,492 L680,502 L681,515 Z M691,486 L692,488 L690,488 L691,486 Z M712,446 L705,445 L703,459 L697,456 L693,461 L687,457 L689,453 L681,454 L671,449 L672,443 L669,438 L672,435 L664,422 L667,411 L671,405 L669,400 L672,396 L669,392 L674,391 L672,373 L676,368 L680,369 L693,359 L695,362 L699,359 L704,361 L710,354 L718,365 L716,370 L721,373 L719,377 L725,382 L728,397 L726,407 L729,403 L730,408 L732,409 L726,414 L728,416 L731,413 L731,417 L727,417 L727,422 L724,423 L729,422 L724,425 L726,427 L724,429 L728,428 L722,435 L726,437 L721,437 L724,440 L721,440 L723,442 L717,443 L716,440 L718,445 L716,445 L716,448 L714,444Z M627,358 L627,350 L624,347 L630,338 L636,338 L642,334 L645,318 L641,314 L644,313 L645,306 L651,310 L655,307 L659,310 L661,325 L664,332 L670,328 L669,324 L671,320 L682,329 L685,326 L689,310 L685,303 L679,309 L665,312 L671,287 L688,298 L697,293 L695,324 L697,338 L701,349 L705,348 L710,354 L704,361 L699,359 L695,362 L693,359 L680,369 L676,368 L677,357 L672,357 L672,352 L662,359 L659,357 L656,359 L649,354 L646,357 L634,355 L631,359Z",
  kanto: "M594,656 L608,662 L612,667 L612,662 L614,662 L611,660 L614,658 L628,665 L624,669 L620,668 L623,672 L620,672 L620,679 L626,682 L622,686 L623,689 L619,689 L620,684 L617,680 L610,678 L599,681 L595,684 L596,690 L594,690 L588,686 L588,673 L584,673 L593,665Z M634,815 L634,820 L629,813 L634,815 Z M619,755 L617,757 L614,756 L616,753 L619,755 Z M596,746 L598,748 L596,749 L596,746 Z M603,740 L601,738 L603,734 L603,740 Z M607,717 L607,711 L611,712 L611,718 L607,717 Z M633,649 L634,654 L632,658 L626,657 L628,661 L624,662 L628,662 L628,665 L614,658 L611,660 L614,662 L612,662 L612,667 L608,662 L594,656 L589,653 L585,645 L588,642 L603,646 L608,650 L615,647 L615,651 L621,648 L625,649 L627,647 L633,649 Z M632,658 L634,654 L633,649 L633,642 L627,629 L635,639 L646,644 L664,640 L664,637 L682,649 L682,653 L672,653 L661,664 L659,686 L646,690 L634,704 L627,700 L632,698 L630,695 L631,692 L630,687 L632,682 L628,678 L631,674 L634,675 L634,671 L640,668 L645,662 L638,655 L633,659Z M621,622 L622,623 L624,630 L627,629 L627,629 L633,642 L633,649 L627,647 L625,649 L621,648 L615,651 L615,647 L608,650 L603,646 L588,642 L585,645 L574,642 L573,637 L589,628 L594,618 L605,620 L611,624Z M621,622 L611,624 L605,620 L594,618 L589,628 L573,637 L569,635 L569,629 L566,626 L569,625 L567,619 L570,617 L569,611 L560,611 L557,606 L558,599 L563,595 L562,593 L571,590 L583,584 L583,581 L586,580 L585,575 L589,574 L591,570 L598,577 L606,579 L604,582 L607,584 L604,587 L603,596 L611,599 L605,612 L610,619 L619,618Z M622,623 L621,622 L619,618 L610,619 L605,612 L611,599 L603,596 L604,587 L607,584 L604,582 L606,579 L631,563 L643,566 L649,570 L650,576 L650,587 L651,590 L648,592 L650,602 L647,609 L636,611 L633,616 L630,616 L629,620Z M627,629 L627,629 L624,630 L622,623 L629,620 L630,616 L633,616 L636,611 L647,609 L650,602 L648,592 L651,590 L650,587 L650,576 L660,585 L666,579 L666,575 L676,580 L668,604 L669,610 L666,617 L668,627 L673,636 L671,638 L673,641 L674,637 L682,649 L664,637 L664,640 L646,644 L635,639Z",
  chubu: "M511,719 L487,725 L489,720 L492,722 L500,716 L502,719 L504,716 L503,713 L497,710 L495,714 L487,713 L483,710 L485,702 L481,713 L485,718 L482,718 L478,714 L479,709 L477,706 L477,701 L481,694 L474,698 L469,690 L470,684 L474,676 L484,673 L490,681 L495,683 L502,681 L508,685 L515,681 L516,687 L521,684 L529,686 L519,706 L511,711Z M584,673 L588,673 L588,686 L594,690 L592,695 L596,701 L596,705 L589,714 L588,720 L581,724 L575,718 L578,704 L576,700 L577,697 L583,696 L573,690 L566,692 L562,697 L564,700 L555,704 L553,713 L547,720 L549,724 L536,720 L511,719 L511,711 L519,706 L529,686 L544,676 L544,664 L548,659 L551,667 L550,678 L555,679 L559,688 L564,686 L563,679 L567,671 L572,676Z M516,612 L519,618 L514,628 L517,632 L516,636 L510,643 L505,643 L503,648 L509,651 L514,658 L512,661 L518,667 L516,671 L518,674 L515,674 L517,678 L515,681 L508,685 L502,681 L495,683 L490,681 L484,673 L474,676 L470,684 L469,690 L462,683 L456,685 L454,684 L458,674 L457,671 L454,664 L451,664 L450,658 L455,649 L461,652 L462,650 L475,649 L478,645 L472,637 L474,631 L479,621 L476,618 L480,613 L484,615 L485,619 L494,608 L497,610 L502,608 L502,610 L506,608Z M571,590 L562,593 L563,595 L558,599 L557,606 L560,611 L569,611 L570,617 L567,619 L569,625 L566,626 L569,629 L569,635 L573,637 L574,642 L571,644 L567,641 L561,643 L556,638 L546,649 L549,652 L546,654 L548,659 L544,664 L544,676 L529,686 L521,684 L516,687 L515,681 L517,678 L515,674 L518,674 L516,671 L518,667 L512,661 L514,658 L509,651 L503,648 L505,643 L510,643 L516,636 L517,632 L514,628 L519,618 L516,612 L522,604 L521,601 L524,600 L525,589 L530,582 L530,579 L537,580 L537,585 L539,586 L547,582 L551,584 L551,579 L556,574 L563,572 L566,574 L566,579 L571,583Z M548,659 L546,654 L549,652 L546,649 L556,638 L561,643 L567,641 L571,644 L574,642 L585,645 L589,653 L594,656 L593,665 L584,673 L572,676 L567,671 L563,679 L564,686 L559,688 L555,679 L550,678 L551,667Z M448,618 L454,626 L464,627 L469,632 L474,631 L472,637 L478,645 L475,649 L462,650 L461,652 L455,649 L450,658 L443,655 L444,663 L441,662 L441,665 L435,668 L432,666 L429,673 L426,672 L423,676 L411,674 L408,669 L409,663 L411,667 L418,664 L414,667 L421,668 L423,665 L421,666 L421,663 L427,665 L425,663 L428,661 L426,658 L434,659 L433,653 L436,651 L437,656 L439,657 L440,650 L433,637 L442,624 L442,620Z M485,567 L482,564 L489,564 L485,567 Z M476,618 L479,621 L474,631 L469,632 L464,627 L454,626 L448,618 L463,603 L474,585 L475,574 L473,570 L473,565 L470,564 L475,551 L500,541 L504,542 L505,546 L499,547 L498,556 L494,555 L487,563 L485,559 L482,560 L480,569 L486,571 L489,567 L489,577 L481,579 L479,589 L476,591 L478,595 L476,598 L477,602 L475,610 L476,618 Z M516,612 L506,608 L502,610 L502,608 L497,610 L494,608 L485,619 L484,615 L480,613 L476,618 L475,610 L477,602 L476,598 L478,595 L476,591 L479,589 L481,579 L489,577 L486,583 L498,590 L506,586 L508,578 L518,575 L522,578 L525,589 L524,600 L521,601 L522,604Z M525,589 L522,578 L518,575 L532,570 L541,563 L548,563 L563,551 L573,536 L578,522 L597,510 L598,512 L597,511 L603,504 L612,476 L620,479 L620,486 L629,492 L627,496 L619,499 L619,507 L616,515 L619,520 L622,522 L613,532 L615,541 L607,541 L606,544 L597,545 L596,548 L598,552 L594,558 L599,563 L598,577 L591,570 L589,574 L585,575 L586,580 L583,581 L583,584 L571,590 L571,583 L566,579 L566,574 L563,572 L556,574 L551,579 L551,584 L547,582 L539,586 L537,585 L537,580 L530,579 L530,582 L525,589 Z M554,522 L546,523 L553,514 L551,511 L548,513 L548,507 L552,499 L561,490 L557,506 L564,507 L561,516 L554,522 Z",
  kansai: "M426,769 L429,775 L434,778 L430,783 L431,787 L423,792 L422,796 L420,796 L421,793 L404,788 L399,781 L402,778 L394,774 L389,767 L385,767 L388,762 L385,761 L391,758 L386,755 L390,753 L389,751 L393,751 L385,743 L387,740 L390,743 L416,737 L420,746 L416,747 L410,754 L415,761 L413,767 L426,769 Z M434,760 L434,763 L429,766 L429,763 L434,760 Z M434,760 L429,763 L429,766 L427,766 L427,769 L426,769 L413,767 L415,761 L410,754 L416,747 L420,746 L416,737 L418,732 L416,723 L421,712 L427,717 L431,714 L435,717 L437,715 L439,719 L436,720 L438,721 L437,725 L446,730 L438,736 L441,741 L439,742 L441,745 L439,749 L440,756 L439,759Z M376,745 L368,748 L368,743 L365,744 L365,741 L383,722 L384,724 L377,734 L380,743 L376,745 Z M348,714 L349,711 L345,705 L347,702 L346,695 L354,687 L353,681 L359,679 L359,675 L352,658 L361,655 L378,656 L377,660 L381,665 L386,664 L387,666 L387,672 L381,672 L380,678 L387,683 L392,681 L394,688 L404,690 L403,695 L400,696 L401,700 L407,703 L405,704 L407,715 L404,717 L398,715 L385,721 L370,711 L356,712 L356,708 L353,713 L350,711 L348,714 Z M403,695 L411,703 L415,700 L414,703 L418,704 L421,712 L416,723 L418,732 L416,737 L390,743 L387,740 L394,739 L401,732 L404,723 L406,725 L404,717 L407,715 L405,704 L407,703 L401,700 L400,696Z M421,712 L418,704 L414,703 L415,700 L411,703 L403,695 L404,690 L394,688 L392,681 L387,683 L380,678 L381,672 L387,672 L387,666 L386,664 L381,665 L377,660 L378,656 L380,659 L379,657 L396,649 L400,656 L392,663 L395,664 L397,660 L397,664 L401,666 L400,670 L402,667 L404,668 L402,663 L408,660 L409,663 L408,669 L411,674 L423,676 L428,681 L425,695 L428,705 L432,705 L436,711 L437,715 L435,717 L431,714 L427,717Z M443,655 L450,658 L451,664 L454,664 L457,671 L458,674 L454,684 L456,685 L457,695 L453,705 L447,708 L440,705 L439,710 L436,711 L432,705 L428,705 L425,695 L428,681 L423,676 L426,672 L429,673 L432,666 L435,668 L441,665 L441,662 L444,663 L443,655 Z M443,668 L443,671 L441,668 L437,671 L439,679 L431,687 L431,691 L428,697 L430,700 L432,691 L438,690 L439,686 L448,680 L449,676 L443,668 Z M434,778 L429,775 L426,769 L427,769 L427,766 L429,766 L434,763 L434,760 L439,759 L440,756 L439,749 L441,745 L439,742 L441,741 L438,736 L446,730 L437,725 L438,721 L436,720 L439,719 L437,715 L436,711 L439,710 L440,705 L447,708 L453,705 L457,695 L456,685 L462,683 L469,690 L474,698 L468,699 L469,703 L462,715 L461,723 L477,730 L479,735 L482,734 L481,738 L476,738 L481,739 L481,744 L477,745 L479,743 L476,741 L475,743 L469,744 L472,740 L468,740 L465,745 L465,743 L462,746 L460,744 L460,747 L458,745 L451,749 L448,751 L449,756 L447,755 L448,753 L444,756 L448,760 L446,760 L448,763 L445,761 L446,764 L439,768Z",
  chugoku: "M213,710 L215,716 L211,721 L213,725 L218,725 L216,730 L218,734 L224,732 L226,734 L229,730 L228,726 L232,724 L232,731 L234,733 L235,739 L240,741 L240,746 L237,746 L238,754 L233,756 L233,764 L229,758 L225,758 L220,752 L215,754 L218,751 L214,748 L203,752 L200,749 L198,752 L197,750 L195,752 L195,748 L193,753 L189,755 L187,753 L184,755 L183,750 L177,746 L171,753 L171,746 L168,742 L172,737 L169,731 L172,727 L178,727 L173,725 L175,722 L184,724 L185,727 L192,727 L198,725 L197,722 L209,711 L211,712 L213,710 Z M232,764 L227,766 L230,762 L232,764 Z M243,760 L251,758 L246,760 L245,763 L241,760 L237,763 L235,758 L238,756 L243,760 Z M186,725 L186,723 L190,724 L186,725 Z M219,756 L216,756 L219,753 L219,756 Z M303,727 L302,729 L299,727 L302,730 L300,729 L298,734 L293,732 L293,729 L284,731 L281,735 L269,736 L267,740 L260,742 L258,740 L255,743 L256,740 L253,734 L255,732 L247,731 L239,738 L240,741 L235,739 L234,733 L232,731 L232,724 L230,722 L235,717 L237,711 L236,709 L242,704 L250,706 L252,703 L257,705 L265,703 L262,698 L268,695 L275,687 L288,689 L295,691 L298,694 L296,701 L300,706 L299,711 L303,727 Z M275,740 L273,743 L271,740 L276,738 L275,740 Z M251,741 L250,737 L253,738 L252,746 L249,746 L251,743 L247,738 L251,741 Z M245,735 L246,737 L242,739 L245,735 Z M265,744 L263,743 L266,743 L265,744 Z M254,745 L256,745 L255,748 L258,748 L256,750 L250,749 L253,743 L256,743 L254,745 Z M289,736 L289,739 L286,736 L289,736 Z M287,737 L283,739 L284,737 L287,737 Z M290,731 L292,732 L289,734 L290,731 Z M353,681 L354,687 L346,695 L347,702 L345,705 L349,711 L348,714 L341,712 L344,715 L338,722 L329,721 L334,722 L331,726 L329,725 L328,730 L322,728 L320,731 L318,725 L318,728 L314,724 L310,728 L305,725 L307,729 L303,727 L299,711 L300,706 L296,701 L298,694 L295,691 L296,688 L303,687 L302,683 L309,683 L308,680 L310,679 L313,673 L320,675 L324,680 L334,674 L333,676 L340,679 L341,685Z M285,624 L289,623 L286,627 L283,625 L284,629 L282,626 L285,624 Z M290,626 L288,629 L288,625 L290,624 L292,627 L290,626 Z M294,615 L299,610 L304,615 L303,619 L300,619 L302,621 L297,622 L294,615 Z M213,710 L221,708 L236,694 L246,688 L252,680 L263,675 L266,669 L264,665 L281,661 L287,656 L290,659 L298,658 L295,660 L293,661 L299,669 L298,678 L290,680 L292,683 L288,689 L275,687 L268,695 L262,698 L265,703 L257,705 L252,703 L250,706 L242,704 L236,709 L237,711 L235,717 L230,722 L232,724 L228,726 L229,730 L226,734 L224,732 L218,734 L216,730 L218,725 L213,725 L211,721 L215,716 L213,710 Z M295,691 L288,689 L292,683 L290,680 L298,678 L299,669 L293,661 L295,660 L297,664 L303,666 L311,662 L322,664 L343,663 L352,658 L359,675 L359,679 L353,681 L341,685 L340,679 L333,676 L334,674 L324,680 L320,675 L313,673 L310,679 L308,680 L309,683 L302,683 L303,687 L296,688Z",
  shikoku: "M312,765 L325,771 L331,769 L332,777 L339,778 L337,782 L339,786 L345,787 L338,806 L326,790 L316,786 L306,788 L306,786 L307,789 L295,793 L301,793 L295,794 L293,797 L292,794 L289,798 L290,803 L288,809 L285,809 L281,817 L276,818 L276,826 L273,829 L276,835 L272,831 L265,833 L260,830 L256,832 L257,826 L261,825 L260,822 L257,822 L259,819 L256,806 L260,809 L266,801 L271,798 L267,789 L278,788 L281,778 L288,769 L312,765 Z M252,834 L251,835 L251,832 L252,834 Z M259,758 L256,757 L260,754 L259,758 Z M280,743 L276,743 L280,737 L282,740 L280,743 Z M285,742 L286,742 L285,744 L282,743 L285,742 Z M283,747 L279,749 L280,744 L285,745 L283,747 Z M257,822 L250,820 L250,823 L248,823 L249,818 L252,819 L246,813 L249,813 L247,809 L250,809 L247,808 L248,806 L245,804 L249,807 L253,803 L253,800 L249,800 L252,797 L244,797 L246,794 L244,793 L247,788 L241,787 L233,793 L225,794 L260,774 L266,755 L275,752 L273,748 L276,747 L284,761 L295,757 L305,759 L309,755 L314,757 L312,765 L288,769 L281,778 L278,788 L267,789 L271,798 L266,801 L260,809 L256,806 L259,819 L257,822 Z M314,757 L309,755 L312,745 L308,741 L314,744 L327,734 L334,737 L338,733 L339,738 L342,735 L345,738 L344,741 L353,746 L352,749 L339,747 L330,754 L323,751 L314,757 Z M335,729 L333,728 L337,728 L335,729 Z M348,724 L350,724 L348,732 L346,731 L346,729 L343,733 L343,729 L339,727 L348,724 Z M362,746 L364,744 L363,748 L362,746 Z M353,746 L361,744 L361,747 L364,748 L360,757 L367,764 L362,768 L369,770 L350,780 L345,787 L339,786 L337,782 L339,778 L332,777 L331,769 L325,771 L312,765 L314,757 L323,751 L330,754 L339,747 L352,749 L353,746 Z",
  kyushu: "M56,302 L58,303 L56,304 L52,303Z M100,314 L107,316 L103,322 L91,317 L94,315 L96,318 L98,311Z M184,306 L182,303 L184,303 L182,301 L185,298 L184,293 L187,301 L194,307Z M277,216 L276,221 L271,216 L275,214Z M125,310 L129,305 L131,306 L125,313 L124,319 L118,320 L116,318 L119,315 L115,312 L123,313Z M339,213 L343,210 L338,208 L337,201 L344,203 L344,207 L351,206 L350,204 L359,193 L361,198 L361,202 L357,208 L352,208 L351,212 L345,212 L346,214 L340,218 L333,218 L338,227 L333,224 L328,232 L332,234 L322,239 L322,231 L329,225 L327,217 L332,218Z M129,977 L128,971 L135,967 L144,973 L143,978 L137,982 L131,981Z M160,970 L160,975 L155,976 L154,969 L158,966 L159,956 L166,946 L167,955Z M134,861 L139,865 L148,861 L153,867 L152,869 L157,876 L162,881 L161,886 L166,888 L169,897 L176,898 L176,905 L174,908 L171,907 L166,913 L171,916 L169,920 L172,919 L165,922 L162,927 L146,935 L146,930 L151,927 L155,915 L149,906 L150,901 L144,898 L149,896 L150,900 L153,901 L157,895 L150,889 L146,891 L140,904 L142,915 L147,918 L145,923 L139,924 L136,918 L123,918 L124,914 L121,913 L123,911 L118,907 L127,907 L131,897 L128,888 L123,884 L126,877 L124,865 L127,863 L131,865Z M123,865 L120,859 L125,857 L126,861Z M100,885 L102,882 L103,884 L98,892 L96,891Z M380,166 L376,167 L375,163 L385,161Z M397,143 L397,135 L402,135 L401,139 L405,143 L404,146 L399,149 L396,145Z M459,115 L456,116 L455,114 L461,110Z M440,107 L427,115 L431,118 L426,121 L423,120 L425,124 L419,119 L421,116 L412,114 L420,114 L421,112 L417,111 L431,105 L433,107 L435,103 L440,102 L438,106 L440,104 L441,106 L443,99 L445,105Z M420,125 L418,123 L416,125 L414,118 L419,119 L418,122 L424,124 L421,126 L422,124Z M188,824 L190,825 L195,824 L200,829 L208,829 L211,825 L215,826 L215,831 L217,831 L206,841 L205,845 L208,846 L204,847 L203,849 L205,850 L199,858 L193,875 L191,898 L186,903 L184,915 L179,913 L174,908 L176,905 L176,898 L169,897 L166,888 L161,886 L162,881 L157,876 L152,869 L153,867 L174,865 L171,859 L175,854 L170,847 L170,840 L175,838 L184,824Z M163,805 L166,800 L163,797 L165,795 L164,790 L168,784 L175,780 L182,781 L183,774 L196,778 L201,771 L210,775 L212,781 L209,789 L206,788 L206,791 L198,793 L199,797 L203,799 L219,798 L213,807 L219,807 L216,809 L219,811 L224,809 L225,812 L220,812 L218,816 L228,820 L222,820 L224,822 L220,825 L223,826 L217,827 L217,831 L215,831 L215,826 L211,825 L208,829 L200,829 L195,824 L190,825 L188,824 L184,820 L185,814 L178,801 L172,801 L173,807 L171,810Z M123,837 L128,838 L128,848 L120,857 L116,858 L116,852 L120,851 L115,850 L119,840 L118,837 L123,837 Z M135,847 L129,847 L127,843 L134,839 L141,839 L138,847 L135,847 Z M139,834 L141,834 L141,838 L138,838 L139,834 Z M153,867 L148,861 L139,865 L134,861 L147,846 L145,840 L147,841 L146,839 L152,834 L141,834 L149,828 L150,823 L142,815 L141,810 L146,810 L145,807 L150,803 L154,804 L155,800 L163,805 L171,810 L173,807 L172,801 L178,801 L185,814 L184,820 L188,824 L184,824 L175,838 L170,840 L170,847 L175,854 L171,859 L174,865 L153,867 Z M97,701 L99,700 L101,702 L98,705 L99,709 L93,715 L92,719 L95,718 L93,722 L95,721 L92,725 L92,720 L90,722 L90,719 L89,722 L86,720 L88,720 L89,715 L91,715 L89,714 L93,710 L90,708 L92,703 L96,703 L97,701 Z M90,729 L87,735 L81,736 L84,722 L85,724 L89,725 L88,722 L89,726 L92,725 L90,729 Z M111,759 L112,761 L108,763 L104,759 L106,759 L105,756 L108,753 L111,755 L110,757 L112,758 L111,759 Z M72,810 L69,815 L70,810 L67,807 L70,806 L70,802 L72,802 L74,794 L72,805 L77,806 L74,808 L72,806 L72,810 Z M68,812 L65,811 L65,809 L67,811 L66,808 L68,812 Z M63,813 L64,810 L63,816 L60,811 L63,813 Z M50,818 L53,817 L54,819 L56,815 L60,825 L53,824 L53,829 L44,826 L45,824 L47,826 L48,825 L46,825 L49,822 L48,816 L50,818 Z M109,780 L106,781 L108,778 L109,780 Z M111,782 L114,784 L111,786 L111,782 Z M73,788 L75,785 L77,787 L73,788 Z M98,776 L95,777 L99,774 L98,776 Z M110,786 L108,789 L110,796 L117,798 L116,802 L122,809 L130,812 L123,817 L136,818 L138,823 L136,830 L126,834 L124,828 L129,824 L128,822 L123,821 L115,823 L112,829 L104,834 L108,829 L107,826 L109,827 L111,823 L108,825 L107,818 L103,817 L100,811 L103,800 L107,804 L106,808 L107,806 L110,808 L108,815 L119,818 L115,812 L116,807 L113,803 L110,805 L109,799 L106,799 L106,797 L102,800 L104,798 L101,796 L101,793 L101,795 L97,793 L101,787 L98,786 L99,783 L104,782 L104,785 L109,784 L110,786 Z M93,788 L92,792 L86,794 L91,791 L89,789 L92,784 L96,784 L98,781 L99,784 L93,788 Z M59,815 L59,813 L62,816 L59,818 L59,815 Z M108,801 L107,804 L106,801 L108,798 L108,801 Z M123,779 L136,779 L142,785 L149,783 L148,789 L140,794 L138,801 L133,796 L127,802 L130,812 L122,809 L116,802 L117,798 L110,796 L108,789 L110,786 L113,790 L112,786 L114,782 L110,779 L111,777 L114,779 L114,773 L115,775 L119,775 L120,780Z M163,805 L155,800 L154,804 L150,803 L145,807 L146,810 L141,810 L141,804 L138,801 L140,794 L148,789 L149,783 L142,785 L136,779 L123,779 L130,775 L126,772 L133,767 L136,773 L143,772 L144,767 L140,769 L137,766 L142,767 L146,764 L148,757 L158,755 L159,752 L165,753 L161,757 L164,757 L166,754 L169,756 L176,752 L172,760 L175,762 L173,763 L178,774 L183,774 L182,781 L175,780 L168,784 L164,790 L165,795 L163,797 L166,800Z",
};

export const LABEL_POS = {
  hokkaido: { x: 795, y: 146 },
  tohoku: { x: 671, y: 441 },
  kanto: { x: 620, y: 647 },
  chubu: { x: 518, y: 628 },
  kansai: { x: 419, y: 717 },
  chugoku: { x: 265, y: 712 },
  shikoku: { x: 297, y: 776 },
  kyushu: { x: 167, y: 705 },
};

// City positions removed — using label positions for now
export const CITY_POS = {};

// Season data
const month = new Date().getMonth();
export const CURRENT_SEASON = month >= 2 && month <= 4
  ? { name: "春", romaji: "Haru", english: "Spring", tip: "Cherry blossom season — sakura bloom from south to north, late March to mid April.", icon: "🌸" }
  : month >= 5 && month <= 7
  ? { name: "夏", romaji: "Natsu", english: "Summer", tip: "Festival season! Hot and humid. Okinawa beaches, mountain hiking, fireworks everywhere.", icon: "🎆" }
  : month >= 8 && month <= 10
  ? { name: "秋", romaji: "Aki", english: "Autumn", tip: "Autumn leaves (紅葉 kōyō) paint Japan red and gold. Best weather for travel.", icon: "🍁" }
  : { name: "冬", romaji: "Fuyu", english: "Winter", tip: "Ski season in Hokkaido & the Alps. Hot springs feel best in the cold. Illuminations everywhere.", icon: "❄️" };
