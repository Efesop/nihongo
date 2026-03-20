import { useState, useEffect, useRef, useCallback } from "react";
import { useUser, useAuth, useClerk, SignIn, SignUp } from "@clerk/clerk-react";

// ═══ STORAGE HELPERS ═══
const store = {
  get: (key) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch(e) { return null; } },
  set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {} },
  del: (key) => { try { localStorage.removeItem(key); } catch(e) {} },
};

// ═══ SYNC HELPERS ═══
const syncLoad = async (token) => {
  try {
    const r = await fetch("/api/sync", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (r.status === 404) return null;
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
};
const syncSave = async (token, data) => {
  try {
    await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ data }),
    });
  } catch { /* offline — localStorage still holds it */ }
};

// ═══ TTS — static pre-generated files, fallback to /api/tts proxy ═══
let _ttsAudio = null;
const _isKana=(ch)=>/^[\u3040-\u30FF]$/.test(ch);
const _playAudio=(src,rate=1,onEnd=null,onErr=null)=>{
  if(_ttsAudio){_ttsAudio.pause();_ttsAudio=null;}
  if(window.speechSynthesis) window.speechSynthesis.cancel();
  const a=new Audio(src); a.playbackRate=rate; _ttsAudio=a;
  if(onEnd) a.onended=onEnd;
  if(onErr) a.onerror=onErr;
  return a.play();
};
const speak = (text, lang="ja-JP") => {
  // All Japanese → Google Translate proxy (natural pronunciation)
  const ttsLang=lang==="ja-JP"?"ja":"en";
  _playAudio(`/api/tts?lang=${ttsLang}&q=${encodeURIComponent(text)}`,lang==="ja-JP"?0.85:1).catch(()=>{
    if(!window.speechSynthesis) return;
    const u=new SpeechSynthesisUtterance(text); u.lang=lang; u.rate=0.85;
    window.speechSynthesis.speak(u);
  });
};
const speakPhrase=(id,text)=>{
  _playAudio(`/audio/phrase/${id}.mp3`,1).catch(()=>{
    _playAudio(`/api/tts?lang=ja&q=${encodeURIComponent(text)}`,0.85).catch(()=>{});
  });
};

// ═══ KANA MNEMONICS ═══
const M = {
"あ":["🍎","Apple","Cross stroke = stem, loop = apple shape","The cross stroke at the top is the stem of an apple, and the loop below is the round fruit hanging from it."],
"い":["🔤","Two i's side by side","Two vertical strokes like i i","Two simple strokes side by side — just like writing lowercase i twice."],
"う":["🥊","Boxer punched — uu!","Top = fist, curve = doubling over","A boxer just took a hit to the gut, body curving down as they double over."],
"え":["🥷","Energetic ninja","Dynamic fighting pose","A ninja caught mid-kick — those crossing strokes are arms and legs flying."],
"お":["🛸","UFO — oh!","Or face saying oh with x eyes","A UFO hovering overhead, saucer shape beneath a beam of light."],
"か":["🔪","Blade cutting stick","Diagonal = blade, vertical = stick","A blade cutting clean through a stick — the diagonal is the blade, the vertical line is the stick being split."],
"き":["🔑","Key","Horizontals = teeth, vertical = shaft","A key lying flat — the horizontal strokes are the teeth, the vertical line is the shaft."],
"く":["🐦","Cuckoo's beak","Angle = beak opening, ku-koo!","A cuckoo's beak wide open mid-call — one sharp angled stroke."],
"け":["🪣","Keg","First stroke = cane leaning on keg","A walking cane leaning against a keg."],
"こ":["🐟","Two koi fish","Two horizontals like fish swimming","Two koi fish gliding side by side through perfectly still water."],
"さ":["😏","Sneaky grin — sa-neaky!","Strokes form a sly face","A sneaky smirking face, one eyebrow raised — those crossing strokes are that sly grin."],
"し":["🎣","Fishing hook — fi-SHI-ng","Single swooping curve = hook","A fishing hook dropped into still water — one single swooping curve."],
"す":["🌀","Spiral straw — su-piral","Or curly Sue","A straw caught in a spiral, curling around itself."],
"せ":["🗣️","Mouth about to say — se-y","Or sensei speaking","A sensei mid-sentence, mouth open, caught in the act of teaching."],
"そ":["🧵","Sewing stitch — so-so","50/50 fraction = so-so","Thread being sewn through fabric in one neat crossing stroke."],
"た":["🔤","Letters t + a = ta!","Cross = T, curve = A","Look closely — the cross at the top is a T, the curve at the bottom is an A. T plus A."],
"ち":["📣","Cheerleader — chi-eer!","Looks like 5, groups of 5","A cheerleader throwing their arms up wide — the stroke looks just like a five."],
"つ":["🌊","Tsunami wave","Curling stroke or sideways U","One enormous sweeping curve — a tsunami, the whole ocean bending over, about to crash."],
"て":["🐾","Tail + letter T","te-il = tail","A letter T with a curling tail at the end."],
"と":["🌪️","Tornado","Funny stalk on TOp","A tornado spinning at the base, with a little stalk poking out of the very top."],
"な":["🪢","Knot — kna-t","Or X for nah + tongue out","A tangled knot of rope — all those crossing strokes tied up tight."],
"に":["🦵","Knee","Elongated n + sideways i","A leg with a bent knee — long left stroke for the thigh, right stroke bent at the joint."],
"ぬ":["🍜","Chopsticks + noodles","See n + angular u","Noodles twirling on chopsticks — an N shape on the left, a looping U on the right."],
"ね":["🐌","Snail behind nail","Extra hoop = NE not RE","A nail with a snail trailing behind it. That loop at the bottom is the snail — it's what makes this ne and not re."],
"の":["🚫","No sign","n + o in one swirl","One decisive swirl — N and O combined into a single spinning stroke."],
"は":["🔤","Capital H + little a","Has hoop, け does not","A capital H with a hoop on the right side. One hoop is ha — two horizontal bars is ho."],
"ひ":["😁","Smiling mouth — hihihi!","Big grinning mouth","A wide curved mouth, lips pulled right back in the silliest grin."],
"ふ":["🗻","Mount Fuji","Or nose blowing foooo","The silhouette of Mount Fuji — that iconic pointed peak."],
"へ":["⬆️","Arrow to heaven — he","Angled line pointing up","One simple angled line rising to a point — an arrow aimed straight at heaven."],
"ほ":["🐴","Horse face with mane","2 HOrizontal lines vs は's 1","Two horizontal bars making a very long face — like a horse's elongated muzzle."],
"ま":["🎵","Musical note — ma-usic","Or man with mask","A quaver note floating on a staff."],
"み":["🎶","I + i joined — Mi and mi","Or quaver note do-re-MI","Two quaver notes joined side by side — do, re, mi."],
"む":["🐄","Cow — mooo!","Clown imitating animals","A cow turning to look right at you — the curling strokes form that round bovine face."],
"め":["🥨","Pretzel","Chopsticks drop hoop = MEss","A pretzel, all twisted — or noodles dropped into a chaotic tangle."],
"も":["⛵","Sailboat","Or monitor lizard","A sailboat — two horizontal sails catching the wind, mast running clean through the middle."],
"ら":["🤠","Lasso","Wide loop at the bottom","A lasso looping through the air — that wide sweeping curve, ready to catch."],
"り":["🏞️","River","Right stroke longer than い","Two strokes, but the right one is longer and curves — one riverbank higher than the other."],
"る":["💎","Hand holding ruby","Loop = ruby being held","A hand gripping a precious gem — the loop at the bottom is the ruby held tight in the palm."],
"れ":["🦌","Reindeer","Strokes form reindeer","Trace the strokes and you'll find a reindeer — head, neck, branching antler."],
"ろ":["🚣","Row your boat — looks like 3","る got RObbed, no ruby","Just like ru, but the loop at the bottom is gone — the ruby got stolen."],
"や":["🦒","Yak or giraffe — yaaa!","Animal with long neck","A yak stretching its long neck up high — the tall stroke with the outstretched curve."],
"ゆ":["🦄","Unicorn","Or finger pointing at YOU","A unicorn rearing up, horn pointing to the sky — or a finger aimed right at you."],
"よ":["🪀","Yo-yo on string","Y without the cup","A yo-yo mid-trick, the loop descending on its string."],
"わ":["🐕","Dog wagging tail — wa!","Or white swan","A happy dog mid-wag — curved body on the left, little hooking tail on the right."],
"を":["🧱","Crack in wall — woah!","Only used as particle","Something cracked clean through a wall — those complex strokes are the drama of that split."],
"ん":["🔤","Elongated n","Single curve like letter n","One simple flowing curve, just like the letter n — the simplest character in the whole alphabet."],
"ア":["🪓","Axe","Angular blade + handle"],
"イ":["🎨","Easel","Two strokes like easel legs"],
"ウ":["👒","Angular う — beret hat","Connected angular version"],
"エ":["🛗","Elevator doors","Frame + where doors meet"],
"オ":["🎤","Opera singer — Ohhhh!","Mouth shaped like O"],
"カ":["🔪","Angular か","Same blade, sharper"],
"キ":["🗝️","き without bottom","Same key, less curve"],
"ク":["🐦","Cuckoo's tail","Tail feathers"],
"ケ":["🔤","Sideways K — ke!","Looks like T? Must be Ke"],
"コ":["📐","Corner — ko-rner","Two right angles"],
"サ":["🐎","Saddle","Strokes = saddle on horse"],
"シ":["🚢","Sinking ship smiley","Dots + curve going down"],
"ス":["⛷️","Skiing figure — su-ki","Angled = skiing downhill"],
"セ":["🗣️","Like せ — sensei","Angular mouth shape"],
"ソ":["🍦","Softserve — slimmer than ン","SO slim + one-eyed smiley"],
"タ":["📱","Person holding tablet","Gripping a tablet"],
"チ":["🐔","Chicken — chi-cken","Looks nothing like one!"],
"ツ":["🌊","Three tsunami drops","Like シ but different direction"],
"テ":["📞","Telephone pole","Wires on a pole"],
"ト":["🚪","Totem pole","Vertical + short horizontal"],
"ナ":["🔪","Knife — na-ife","Sword cross at top"],
"ニ":["2️⃣","Two lines = ni = 2!","Easiest one"],
"ヌ":["🪢","Noose — nu-se","Loop + cross"],
"ネ":["🪺","Nest","Twigs woven together"],
"ノ":["🚫","No slash","Single diagonal stroke"],
"ハ":["🏠","House — ha-us","Roof spreading out"],
"ヒ":["👠","Heel — hi-el","Small t = small tea + heels"],
"フ":["🦶","Foot tip — foo","U on its side"],
"ヘ":["⛰️","Same as へ — identical!","Same in both scripts"],
"ホ":["✝️","Holy cross shining","Cross + rays of light"],
"マ":["🦈","Manta ray — ma-nta","Wing sweeping through water"],
"ミ":["3️⃣","Three lines — mi-ddle","Three horizontal strokes"],
"ム":["🫎","Moose antlers — mu-se","Angular antler shape"],
"メ":["💌","Mail letter — me-il","X = back of envelope"],
"モ":["⛵","Like も — same shape","Angular sailboat"],
"ヤ":["🐐","Angular や","Sharp yak"],
"ユ":["🔭","U-boat periscope","Or sideways U"],
"ヨ":["🥚","Backwards E — egg yolk","E for Egg, YOlk = Yo"],
"ラ":["🪑","Rack / rocking chair","Simple chair shape"],
"リ":["🏞️","Like り — river","Flowing water strokes"],
"ル":["🌳","Tree root — ru-t","Two strokes = roots"],
"レ":["🪒","Razor edge — re-zor","Curve = blade edge"],
"ロ":["🤖","Robot mouth — ro-bot","Rectangle = mouth"],
"ワ":["🍷","Wine glass — wa-ine","Angular curve = glass"],
"ヲ":["🏆","Trophy — wo!","Wine glass + extra stroke"],
"ン":["🛸","Spacecraft entering — wider than ソ","ン wider, ソ slimmer"],
};

const H_GROUPS = [
{n:"Vowels",c:["あ","い","う","え","お"]},{n:"K",c:["か","き","く","け","こ"]},
{n:"S",c:["さ","し","す","せ","そ"]},{n:"T",c:["た","ち","つ","て","と"]},
{n:"N",c:["な","に","ぬ","ね","の"]},{n:"H",c:["は","ひ","ふ","へ","ほ"]},
{n:"M",c:["ま","み","む","め","も"]},{n:"Y",c:["や","ゆ","よ"]},
{n:"R",c:["ら","り","る","れ","ろ"]},{n:"W+N",c:["わ","を","ん"]},
];
const K_GROUPS = [
{n:"Vowels",c:["ア","イ","ウ","エ","オ"]},{n:"K",c:["カ","キ","ク","ケ","コ"]},
{n:"S",c:["サ","シ","ス","セ","ソ"]},{n:"T",c:["タ","チ","ツ","テ","ト"]},
{n:"N",c:["ナ","ニ","ヌ","ネ","ノ"]},{n:"H",c:["ハ","ヒ","フ","ヘ","ホ"]},
{n:"M",c:["マ","ミ","ム","メ","モ"]},{n:"Y",c:["ヤ","ユ","ヨ"]},
{n:"R",c:["ラ","リ","ル","レ","ロ"]},{n:"W+N",c:["ワ","ヲ","ン"]},
];

const ROMAJI={"あ":"a","い":"i","う":"u","え":"e","お":"o","か":"ka","き":"ki","く":"ku","け":"ke","こ":"ko","さ":"sa","し":"shi","す":"su","せ":"se","そ":"so","た":"ta","ち":"chi","つ":"tsu","て":"te","と":"to","な":"na","に":"ni","ぬ":"nu","ね":"ne","の":"no","は":"ha","ひ":"hi","ふ":"fu","へ":"he","ほ":"ho","ま":"ma","み":"mi","む":"mu","め":"me","も":"mo","や":"ya","ゆ":"yu","よ":"yo","ら":"ra","り":"ri","る":"ru","れ":"re","ろ":"ro","わ":"wa","を":"wo","ん":"n","ア":"a","イ":"i","ウ":"u","エ":"e","オ":"o","カ":"ka","キ":"ki","ク":"ku","ケ":"ke","コ":"ko","サ":"sa","シ":"shi","ス":"su","セ":"se","ソ":"so","タ":"ta","チ":"chi","ツ":"tsu","テ":"te","ト":"to","ナ":"na","ニ":"ni","ヌ":"nu","ネ":"ne","ノ":"no","ハ":"ha","ヒ":"hi","フ":"fu","ヘ":"he","ホ":"ho","マ":"ma","ミ":"mi","ム":"mu","メ":"me","モ":"mo","ヤ":"ya","ユ":"yu","ヨ":"yo","ラ":"ra","リ":"ri","ル":"ru","レ":"re","ロ":"ro","ワ":"wa","ヲ":"wo","ン":"n"};

// mc=true → mission critical (first 48h survival phrases)
const PHRASES = [
["g1","こんにちは","kon-ni-chi-wa","Hello (daytime)","greet","Most universal greeting",true],
["g2","おはようございます","o-ha-you go-zai-ma-su","Good morning (polite)","greet","Use before ~10am"],
["g3","こんばんは","kon-ban-wa","Good evening","greet","Use after sunset"],
["g4","ありがとうございます","a-ri-ga-tou go-zai-ma-su","Thank you (polite)","greet","Use this version with strangers",true],
["g5","すみません","su-mi-ma-sen","Excuse me / sorry","greet","Swiss army knife phrase",true],
["g6","はい","hai","Yes","greet","Nod slightly when saying it",true],
["g7","いいえ","ii-e","No","greet","Can sound blunt — use daijoubu desu instead"],
["g8","おねがいします","o-ne-gai-shi-ma-su","Please","greet","Add after any request",true],
["g9","だいじょうぶです","dai-jou-bu de-su","I'm fine / no thank you","greet","Polite way to decline",true],
["g10","さようなら","sa-you-na-ra","Goodbye (formal)","greet","For when you won't see them again soon"],
["f1","これをください","ko-re o ku-da-sai","This one please","food","Point at menu + say this",true],
["f2","おかんじょうおねがいします","o-kan-jou o-ne-gai-shi-ma-su","Bill please","food","Or gesture writing in air",true],
["f3","みずをください","mi-zu o ku-da-sai","Water please","food","Water is free at restaurants",true],
["f4","おいしいです","oi-shii de-su","It's delicious","food","Staff love hearing this"],
["f5","いただきます","i-ta-da-ki-ma-su","(Before eating)","food","Say before every meal",true],
["f6","ごちそうさまでした","go-chi-sou-sa-ma de-shi-ta","(After eating)","food","Thanks for the meal — say when leaving"],
["f7","おすすめはなんですか","o-su-su-me wa nan de-su ka","What do you recommend?","food","Great for trying local specialties"],
["f8","ひとりです","hi-to-ri de-su","One person","food","When entering, say party size",true],
["f9","ふたりです","fu-ta-ri de-su","Two people","food","For when you're with someone"],
["f10","アレルギーがあります","a-re-ru-gii ga a-ri-ma-su","I have allergies","food","Follow with the allergen name"],
["t1","...えきはどこですか","...e-ki wa do-ko de-su ka","Where is ... station?","train","Insert station name before えき",true],
["t2","...までいくらですか","...ma-de i-ku-ra de-su ka","How much to ...?","train","For buying tickets"],
["t3","つぎのえきはなんですか","tsu-gi no e-ki wa nan de-su ka","What's the next station?","train","Useful on trains"],
["t4","のりかえはどこですか","no-ri-ka-e wa do-ko de-su ka","Where do I transfer?","train","For complex routes"],
["t5","...までおねがいします","...ma-de o-ne-gai-shi-ma-su","To ... please (taxi)","train","Give destination to taxi driver",true],
["t6","ここでおろしてください","ko-ko de o-ro-shi-te ku-da-sai","Let me off here please","train","For taxis"],
["t7","スイカ / パスモ","sui-ka / pa-su-mo","IC transit cards","train","Tap on/off at gates"],
["t8","しゅうでんはなんじですか","shuu-den wa nan-ji de-su ka","When is the last train?","train","Critical for nightlife"],
["h1","チェックインおねがいします","chek-ku-in o-ne-gai-shi-ma-su","Check in please","hotel","Hand over passport with this",true],
["h2","よやくがあります","yo-ya-ku ga a-ri-ma-su","I have a reservation","hotel","Follow with your name",true],
["h3","チェックアウトはなんじですか","chek-ku-au-to wa nan-ji de-su ka","What time is checkout?","hotel","Usually 10-11am"],
["h4","WiFiのパスワードはなんですか","wai-fai no pa-su-waa-do wa nan de-su ka","What's the WiFi password?","hotel","Most hotels have free WiFi"],
["h5","かぎ","ka-gi","Key","hotel","If you need a room key"],
["h6","もういっぱくおねがいします","mou ip-pa-ku o-ne-gai-shi-ma-su","One more night please","hotel","To extend your stay"],
["s1","これはいくらですか","ko-re wa i-ku-ra de-su ka","How much is this?","shop","Point at item",true],
["s2","ふくろはいらないです","fu-ku-ro wa i-ra-nai de-su","I don't need a bag","shop","Bags cost extra in Japan",true],
["s3","カードでおねがいします","kaa-do de o-ne-gai-shi-ma-su","By card please","shop","Most places take IC cards"],
["s4","げんきんでおねがいします","gen-kin de o-ne-gai-shi-ma-su","Cash please","shop","Japan is still very cash-friendly"],
["s5","あたためますか？","a-ta-ta-me-ma-su ka","Shall I heat it up?","shop","Conbini staff ask this for bento"],
["s6","これをふたつください","ko-re o fu-ta-tsu ku-da-sai","Two of these please","shop","Point + quantity"],
["s7","レシートはいらないです","re-shii-to wa i-ra-nai de-su","No receipt needed","shop","Common at convenience stores"],
["d1","...はどこですか","...wa do-ko de-su ka","Where is ...?","dir","Universal direction question",true],
["d2","みぎ","mi-gi","Right","dir","",true],
["d3","ひだり","hi-da-ri","Left","dir","",true],
["d4","まっすぐ","mas-su-gu","Straight ahead","dir","",true],
["d5","ちかいですか","chi-kai de-su ka","Is it close?","dir","Good follow-up"],
["d6","あるいていけますか","a-ru-i-te i-ke-ma-su ka","Can I walk there?","dir","Walk vs taxi decision"],
["d7","ちずをみせてください","chi-zu o mi-se-te ku-da-sai","Show me on the map please","dir","Hand them your phone"],
["d8","トイレはどこですか","toi-re wa do-ko de-su ka","Where is the toilet?","dir","Essential",true],
["e1","たすけてください","ta-su-ke-te ku-da-sai","Help me please","sos","For emergencies",true],
["e2","びょういんはどこですか","byou-in wa do-ko de-su ka","Where is the hospital?","sos",""],
["e3","けいさつをよんでください","kei-sa-tsu o yon-de ku-da-sai","Please call the police","sos","Emergency: 110"],
["e4","えいごをはなせますか","ei-go o ha-na-se-ma-su ka","Do you speak English?","sos","Try in tourist areas",true],
["e5","にほんごがわかりません","ni-hon-go ga wa-ka-ri-ma-sen","I don't understand Japanese","sos","Signal language barrier",true],
["e6","もういちどいってください","mou i-chi-do it-te ku-da-sai","Please say that again","sos","When someone speaks too fast"],
];

const CATS={greet:"Greetings",food:"Restaurants",train:"Transport",hotel:"Hotels",shop:"Shopping",dir:"Directions",sos:"Emergencies"};
const CAT_ICONS={greet:"👋",food:"🍜",train:"🚃",hotel:"🏨",shop:"🏪",dir:"🗺️",sos:"🆘"};
const CAT_COLORS={greet:"#5a9e6f",food:"#c45d4c",train:"#5a8ec4",hotel:"#8b6ec4",shop:"#c45d8b",dir:"#5ac4a0",sos:"#c44444"};
const SRS_DAYS=[0,0.5,1,3,7,14];
const KEY="nihongo-v4";

const font='"Noto Sans JP","Hiragino Sans",system-ui,sans-serif';
const mono='"JetBrains Mono","SF Mono","Fira Code",monospace';

// ═══ ROLE-PLAY SCENARIOS ═══
const RP_SCENARIOS = [
  {id:"hotel", icon:"🏨", name:"Hotel Check-In", prompt:"Let's role-play. You are the front desk staff at a Japanese hotel. Speak in Japanese with English translation in parentheses after each line. Start by greeting me as I approach the desk to check in."},
  {id:"food",  icon:"🍜", name:"Ordering Food",  prompt:"Let's role-play. You are a waiter at a Japanese restaurant. Speak in Japanese with English in parentheses. I've just sat down — start the scene."},
  {id:"train", icon:"🚃", name:"Buying a Ticket",prompt:"Let's role-play. You are a helpful Japanese train station attendant. Speak in Japanese with English in parentheses. I approach your window looking a bit lost — start the scene."},
  {id:"shop",  icon:"🏪", name:"Shopping",       prompt:"Let's role-play. You are staff at a Japanese convenience store. Speak in Japanese with English in parentheses. I walk up to the counter — start the scene."},
  {id:"dir",   icon:"🗺️", name:"Asking Directions",prompt:"Let's role-play. You are a friendly Japanese local on the street. Speak in Japanese with English in parentheses. I approach you looking confused with my phone — start the scene."},
];

// ═══ THEMES ═══
const THEMES = {
  dark: {
    name:"Dark",
    bg:"#0d0d10", s:"#161619", s2:"#1e1e23", s3:"#26262d", b:"#2e2e36",
    tx:"#f0eee9", m:"#64646a",
    a:"#c0282a", g:"#4f8ec4", go:"#9b8ecf", bl:"#5a8ec4",
    as:"rgba(192,40,42,.15)", gs:"rgba(79,142,196,.13)", gos:"rgba(155,142,207,.13)", rs:"rgba(192,40,42,.11)",
  },
  light: {
    name:"Light",
    bg:"#f7f6f3", s:"#ffffff", s2:"#f0efec", s3:"#e8e7e3", b:"#dddcD8",
    tx:"#111114", m:"#888580",
    a:"#a81e20", g:"#3a6ea0", go:"#7c6fcd", bl:"#3a6ea0",
    as:"rgba(168,30,32,.10)", gs:"rgba(58,110,160,.10)", gos:"rgba(124,111,205,.10)", rs:"rgba(168,30,32,.09)",
  },
};

function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
function daysUntil(dateStr){if(!dateStr)return 0;return Math.max(0,Math.ceil((new Date(dateStr)-Date.now())/(864e5)));}

export default function App(){
  const { user, isLoaded: clerkLoaded } = useUser();
  const { getToken } = useAuth();

  // Show sign-in/sign-up screen if not authenticated
  // Detect Clerk verification callbacks (email link clicks redirect back with __clerk params)
  const hasClerkCallback = window.location.search.includes("__clerk") || window.location.hash.includes("__clerk");
  const [authMode, setAuthMode] = useState(() => {
    if (hasClerkCallback) return "sign-up";
    return window.location.hash.includes("sign-up") ? "sign-up" : "sign-in";
  });
  useEffect(() => {
    const onHash = () => {
      if (!window.location.href.includes("__clerk")) {
        setAuthMode(window.location.hash.includes("sign-up") ? "sign-up" : "sign-in");
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  if (!clerkLoaded) return null;
  if (!user) return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"radial-gradient(ellipse 80% 50% at 50% 110%, rgba(192,40,42,0.18) 0%, transparent 70%), #0d0d10",gap:24}}>
      <div style={{textAlign:"center",marginBottom:8}}>
        <div style={{fontSize:32,fontWeight:800,letterSpacing:"-.02em",color:"#f0eee9",textShadow:"0 0 40px rgba(192,40,42,0.4)"}}>日本語</div>
        <div style={{fontSize:12,color:"#64646a",letterSpacing:".08em",textTransform:"uppercase",fontFamily:"'SF Mono','Fira Mono',monospace"}}>TinySenpai</div>
      </div>
      {authMode === "sign-up"
        ? <SignUp routing="virtual" afterSignUpUrl="/" signInUrl="#sign-in" />
        : <SignIn routing="virtual" afterSignInUrl="/" signUpUrl="#sign-up" />}
    </div>
  );

  return <AuthedApp user={user} getToken={getToken} />;
}

function AuthedApp({ user, getToken }){
  const { signOut } = useClerk();
  const [tab,setTab]=useState("home");
  const [d,setD]=useState(null);
  const [loaded,setLoaded]=useState(false);
  const [theme,setTheme]=useState(()=>localStorage.getItem("nihongo-theme")||"dark");
  // kana
  const [kScript,setKScript]=useState("h");
  const [kSel,setKSel]=useState([0]);
  const [kScreen,setKScreen]=useState("menu");
  const [kCards,setKCards]=useState([]);
  const [kI,setKI]=useState(0);
  const [kInput,setKInput]=useState("");
  const [kFb,setKFb]=useState(null);
  const [kScore,setKScore]=useState({c:0,w:0});
  const [kMistakes,setKMistakes]=useState([]);
  const [kPeek,setKPeek]=useState(false);
  const [storyPlaying,setStoryPlaying]=useState(false);
  const [kFlip,setKFlip]=useState(false);
  const [kLI,setKLI]=useState(0);
  // phrases
  const [pCat,setPCat]=useState(null);
  const [pMode,setPMode]=useState("browse");
  const [pCards,setPCards]=useState([]);
  const [pI,setPI]=useState(0);
  const [pFlip,setPFlip]=useState(false);
  const [pDone,setPDone]=useState(false);
  const [pRecall,setPRecall]=useState(false);
  const [fastTrack,setFastTrack]=useState(false);
  // sensei
  const [msgs,setMsgs]=useState([]);
  const [chatIn,setChatIn]=useState("");
  const [loading,setLoading]=useState(false);
  // drill
  const [drillCards,setDrillCards]=useState([]);
  const [drillI,setDrillI]=useState(0);
  const [drillFlip,setDrillFlip]=useState(false);
  const [drillInput,setDrillInput]=useState("");
  const [drillFb,setDrillFb]=useState(null);
  const [drillScore,setDrillScore]=useState({c:0,w:0});
  const [drillDone,setDrillDone]=useState(false);
  // profile
  const [profile,setProfile]=useState(()=>store.get("nihongo-profile")||{name:"",notes:""});
  const [showProfile,setShowProfile]=useState(false);
  const [onboardStep,setOnboardStep]=useState(0);
  const [onboardAnswers,setOnboardAnswers]=useState({});
  const [syncStatus,setSyncStatus]=useState("idle"); // idle | saving | saved | error
  const uid = user.id;
  // ui
  const [isDesktop,setIsDesktop]=useState(window.innerWidth>=768);
  const [hov,setHov]=useState(null);
  const inputRef=useRef(null);
  const drillRef=useRef(null);
  const chatEndRef=useRef(null);

  const c=THEMES[theme];
  const SIDEBAR_W=240;

  const toggleTheme=()=>{
    const next=theme==="dark"?"light":"dark";
    setTheme(next);
    localStorage.setItem("nihongo-theme",next);
  };

  const saveProfile=(u)=>{
    const np={...profile,...u};
    setProfile(np);
    store.set("nihongo-profile",np);
  };

  useEffect(()=>{
    const onResize=()=>setIsDesktop(window.innerWidth>=768);
    window.addEventListener("resize",onResize);
    return()=>window.removeEventListener("resize",onResize);
  },[]);

  // Pre-warm TTS voices
  useEffect(()=>{
    if(window.speechSynthesis) window.speechSynthesis.getVoices();
    const h=()=>window.speechSynthesis.getVoices();
    window.speechSynthesis?.addEventListener?.("voiceschanged",h);
    return()=>window.speechSynthesis?.removeEventListener?.("voiceschanged",h);
  },[]);

  const migrate=(raw)=>{
    if(!raw) return null;
    const migratedKana={};
    Object.entries(raw.kana||{}).forEach(([ch,v])=>{
      migratedKana[ch]=typeof v==="number"?{box:Math.min(v,5),next:Date.now()}:v;
    });
    const today=new Date().toDateString();
    const yesterday=new Date(Date.now()-864e5).toDateString();
    const lastDay=raw.lastDay;
    const streak=lastDay===today?raw.streak||1:lastDay===yesterday?(raw.streak||0)+1:1;
    return {...raw,kana:migratedKana,phr:raw.phr||{},streak,lastDay:today};
  };

  useEffect(()=>{
    const init=async()=>{
      const token=await getToken();
      // 1. Try loading from DB (source of truth)
      const remote=await syncLoad(token);
      if(remote?.data){
        const nd=migrate(remote.data);
        setD(nd);
        store.set(KEY,nd);
      } else {
        // 2. First sign-in — migrate any existing localStorage data up to DB
        const local=store.get(KEY);
        if(local){
          const nd=migrate(local);
          setD(nd);
          store.set(KEY,nd);
          syncSave(token,nd);
        }
      }
      setLoaded(true);
    };
    init();
  },[]);// eslint-disable-line

  const defaultD=()=>({kana:{},phr:{},sessions:0,totalC:0,streak:1,lastDay:new Date().toDateString(),started:new Date().toISOString(),onboarded:false,onboarding:{}});
  const data=d||defaultD();

  // atomic save — localStorage + DB
  const syncTimer=useRef(null);
  const save=useCallback((u={})=>{
    setD(prev=>{
      const nd={...defaultD(),...prev,...u};
      store.set(KEY,nd);
      clearTimeout(syncTimer.current);
      setSyncStatus("saving");
      syncTimer.current=setTimeout(async()=>{
        const token=await getToken();
        syncSave(token,nd)
          .then(()=>setSyncStatus("saved"))
          .catch(()=>setSyncStatus("error"));
        setTimeout(()=>setSyncStatus("idle"),2000);
      },1500);
      return nd;
    });
  },[getToken]);

  useEffect(()=>{
    if(kScreen==="quiz"&&!kFb&&inputRef.current)inputRef.current.focus();
  },[kI,kFb,kScreen]);

  useEffect(()=>{
    if(drillFb===null&&tab==="drill"&&drillCards[drillI]?.type==="kana"&&drillRef.current)drillRef.current.focus();
  },[drillI,drillFb,tab]);

  useEffect(()=>{
    if(chatEndRef.current)chatEndRef.current.scrollIntoView({behavior:"smooth"});
  },[msgs]);

  useEffect(()=>{
    if(tab==="sensei"&&msgs.length===0&&loaded&&d)autoGreet();
  },[tab,msgs.length]);// eslint-disable-line

  // Global Enter key — advance through learn/quiz without touching mouse
  useEffect(()=>{
    const handler=(e)=>{
      if(e.key!=="Enter") return;
      if(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA") return;
      if(kScreen==="learn"){
        e.preventDefault();
        if(!kFlip){setKFlip(true);}
        else{
          const chars=(kScript==="h"?H_GROUPS:K_GROUPS).flatMap((_,i)=>kSel.includes(i)?(kScript==="h"?H_GROUPS:K_GROUPS)[i].c:[]);
          if(kLI<chars.length-1){setKLI(l=>l+1);setKFlip(false);}
          else startKanaQuiz();
        }
      }
      if(kScreen==="quiz"&&kFb){e.preventDefault();nextKana();}
    };
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  },[kScreen,kFlip,kLI,kFb,kSel,kScript]);// eslint-disable-line

  const groups=kScript==="h"?H_GROUPS:K_GROUPS;
  const allKana=kSel.flatMap(i=>groups[i]?.c||[]);

  // kana SRS helpers
  const getKBox=(ch)=>data.kana[ch]?.box??0;
  const isKanaDue=(ch)=>Date.now()>=(data.kana[ch]?.next??0);
  const kMastered=Object.values(data.kana).filter(v=>(v?.box??0)>=3).length;
  const kDueCount=Object.keys(data.kana).filter(ch=>(data.kana[ch]?.box??0)>=1&&isKanaDue(ch)).length;

  // phrase helpers
  const getPhrBox=(id)=>data.phr[id]?.box||0;
  const isPhrDue=(id)=>Date.now()>=(data.phr[id]?.next||0);
  const dueCount=PHRASES.filter(p=>isPhrDue(p[0])).length;
  const learnedPhr=Object.keys(data.phr).length;

  // mission critical
  const MC_PHRASES=PHRASES.filter(p=>p[6]);
  const mcLeft=MC_PHRASES.filter(p=>getPhrBox(p[0])<4).length;

  const reviewPhr=(id,correct)=>{
    setD(prev=>{
      const cur=prev.phr[id]||{box:0,next:0};
      const newBox=correct?Math.min(cur.box+1,5):0;
      const nextMs=Date.now()+SRS_DAYS[newBox]*864e5;
      const nd={...prev,phr:{...prev.phr,[id]:{box:newBox,next:nextMs}},totalC:correct?prev.totalC+1:prev.totalC};
      store.set(KEY,nd);
      return nd;
    });
  };

  const updateKanaSRS=(ch,correct)=>{
    setD(prev=>{
      const cur=prev.kana[ch]||{box:0,next:0};
      const newBox=correct?Math.min(cur.box+1,5):Math.max(cur.box-1,0);
      const nextMs=Date.now()+SRS_DAYS[newBox]*864e5;
      const nd={...prev,kana:{...prev.kana,[ch]:{box:newBox,next:nextMs}}};
      store.set(KEY,nd);
      return nd;
    });
  };

  const startKanaQuiz=()=>{
    setKCards(shuffle(allKana));setKI(0);setKInput("");setKFb(null);
    setKScore({c:0,w:0});setKMistakes([]);setKPeek(false);setKScreen("quiz");
  };

  const submitKana=()=>{
    if(kFb||!kInput.trim())return;
    const ch=kCards[kI];const rom=ROMAJI[ch];
    const ok=kInput.trim().toLowerCase()===rom;
    if(ok){setKFb("ok");setKScore(s=>({...s,c:s.c+1}));}
    else{setKFb("no");setKScore(s=>({...s,w:s.w+1}));setKMistakes(m=>[...m,{ch,rom,ans:kInput.trim()}]);}
    updateKanaSRS(ch,ok);
  };

  const nextKana=()=>{
    if(kI+1>=kCards.length){
      setKScreen("results");
      setD(prev=>{const nd={...prev,sessions:prev.sessions+1};store.set(KEY,nd);return nd;});
    } else {setKI(kI+1);setKInput("");setKFb(null);setKPeek(false);}
  };

  const startDrill=()=>{
    // 5 kana: due first, then unseen
    const dueK=shuffle(Object.keys(data.kana).filter(ch=>isKanaDue(ch)&&(data.kana[ch]?.box??0)>=1)).slice(0,5);
    const newK=dueK.length<5?shuffle(Object.keys(M).filter(ch=>!data.kana[ch])).slice(0,5-dueK.length):[];
    const kanaSet=[...dueK,...newK].map(ch=>({type:"kana",ch}));
    // 5 phrases: due first, then unseen
    const dueP=shuffle(PHRASES.filter(p=>isPhrDue(p[0])&&data.phr[p[0]])).slice(0,5);
    const newP=dueP.length<5?shuffle(PHRASES.filter(p=>!data.phr[p[0]])).slice(0,5-dueP.length):[];
    const phrSet=[...dueP,...newP].map(p=>({type:"phrase",p}));
    const cards=shuffle([...kanaSet,...phrSet]);
    setDrillCards(cards);setDrillI(0);setDrillFlip(false);setDrillInput("");
    setDrillFb(null);setDrillScore({c:0,w:0});setDrillDone(false);
    setTab("drill");
  };

  const submitDrillKana=()=>{
    if(drillFb||!drillInput.trim())return;
    const ch=drillCards[drillI].ch;
    const rom=ROMAJI[ch];
    const ok=drillInput.trim().toLowerCase()===rom;
    if(ok){setDrillFb("ok");setDrillScore(s=>({...s,c:s.c+1}));}
    else{setDrillFb("no");setDrillScore(s=>({...s,w:s.w+1}));}
    updateKanaSRS(ch,ok);
  };

  const advanceDrill=()=>{
    if(drillI+1>=drillCards.length){setDrillDone(true);}
    else{setDrillI(drillI+1);setDrillFlip(false);setDrillInput("");setDrillFb(null);}
  };

  const sendToSensei=async(overrideMsgs)=>{
    const msgs_to_use=overrideMsgs||null;
    if(!msgs_to_use&&(!chatIn.trim()||loading))return;
    const userMsg=msgs_to_use?null:{role:"user",content:chatIn.trim()};
    const newMsgs=msgs_to_use||[...msgs,userMsg];
    setMsgs(newMsgs);setChatIn("");setLoading(true);

    const hMastered=Object.entries(data.kana).filter(([k])=>k.charCodeAt(0)>=0x3040&&k.charCodeAt(0)<=0x309F).filter(([_,v])=>(v?.box??0)>=3).length;
    const kaMastered=Object.entries(data.kana).filter(([k])=>k.charCodeAt(0)>=0x30A0&&k.charCodeAt(0)<=0x30FF).filter(([_,v])=>(v?.box??0)>=3).length;

    const nameLine=profile.name?`User's name is ${profile.name}. `:"";
    const notesLine=profile.notes?`User context: ${profile.notes.slice(0,200)}. `:"";
    const streakLine=`Streak: ${data.streak||1} day${(data.streak||1)!==1?"s":""}.`;

    const ob=data.onboarding||{};
    const whyMap={travel:"travelling to Japan",anime:"interested in anime and Japanese culture",work:"learning for work or study",moving:"planning to live in Japan",curious:"curious about Japanese"};
    const levelMap={beginner:"complete beginner",basics:"knows a few words and phrases",refresh:"studied before and is refreshing",intermediate:"intermediate level"};
    const whyLine=ob.why?`Reason for learning: ${whyMap[ob.why]||ob.why}. `:"";
    const levelLine=`Level: ${levelMap[ob.level]||"complete beginner"}. `;
    const focusLine=ob.focus?`Specific focus: ${ob.focus}. `:"";
    const tripLine=ob.tripDate&&daysUntil(ob.tripDate)>0?`Trip date: ${ob.tripDate} (${daysUntil(ob.tripDate)} days away). `:"";
    const sysPrompt=`You are Senpai, a friendly Japanese tutor built into a learning app.

${nameLine}${whyLine}${levelLine}${focusLine}${tripLine}${notesLine}
PROGRESS: Hiragana ${hMastered}/46 mastered. Katakana ${kaMastered}/46 mastered. Phrases ${learnedPhr}/${PHRASES.length} learned. ${dueCount} phrases due for review. ${streakLine}

RULES:
- Plain English, no jargon
- Pronunciations with syllable breaks using dashes (e.g. su-mi-ma-sen)
- Concise and practical, tailored to the user's goal above
- Roleplay scenarios fully when asked (you play the Japanese speaker, provide English in parentheses)
- Give cultural context naturally
- Adapt difficulty to the level and progress shown above
- Short focused responses, this is a chat not an essay
- Never use em dashes or special characters in prose`;

    try{
      const response=await fetch("/api/chat",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({system:sysPrompt,messages:newMsgs.slice(-20)})
      });
      const json=await response.json();
      const reply=json.content?.map(c=>c.text||"").join("\n")||json.error||"Couldn't get a response. Check your API key is set.";
      setMsgs([...newMsgs,{role:"assistant",content:reply}]);
    }catch(e){
      setMsgs([...newMsgs,{role:"assistant",content:"Connection error. Make sure ANTHROPIC_API_KEY is set in Vercel environment variables."}]);
    }
    setLoading(false);
  };

  const autoGreet=async()=>{
    setLoading(true);
    const hMastered=Object.entries(data.kana).filter(([k])=>k.charCodeAt(0)>=0x3040&&k.charCodeAt(0)<=0x309F).filter(([_,v])=>(v?.box??0)>=3).length;
    const ob=data.onboarding||{};
    const whyMap={travel:"travelling to Japan",anime:"interested in anime and Japanese culture",work:"learning for work or study",moving:"planning to live in Japan",curious:"curious about Japanese"};
    const levelMap={beginner:"complete beginner",basics:"knows a few words and phrases",refresh:"studied before and is refreshing",intermediate:"intermediate level"};
    const nameLine=profile.name?`User's name is ${profile.name}. `:"";
    const whyLine=ob.why?`Reason for learning: ${whyMap[ob.why]||ob.why}. `:"";
    const levelLine=`Level: ${levelMap[ob.level]||"complete beginner"}. `;
    const tripLine=ob.tripDate&&daysUntil(ob.tripDate)>0?`Trip in ${daysUntil(ob.tripDate)} days. `:"";
    const sysPrompt=`You are Senpai, a friendly Japanese tutor. ${nameLine}${whyLine}${levelLine}${tripLine}
STATS: Hiragana ${hMastered}/46 mastered. ${dueCount} phrases due for review. Streak: ${data.streak||1} day${(data.streak||1)!==1?"s":""}.
Give a SHORT proactive opening message: 2-3 sentences max. Mention their specific stats (kana count, phrases due, streak, or trip countdown if relevant). End with one concrete suggestion or question to get them started. Be warm and direct, like a tutor checking in.`;
    try{
      const response=await fetch("/api/chat",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({system:sysPrompt,messages:[{role:"user",content:"(opening — greet me proactively)"}],max_tokens:200})
      });
      const json=await response.json();
      const reply=json.content?.map(c=>c.text||"").join("\n")||json.error||"";
      if(reply)setMsgs([{role:"assistant",content:reply}]);
    }catch(e){}
    setLoading(false);
  };

  const startRolePlay=async(scenario)=>{
    if(loading)return;
    const kickoff=[{role:"user",content:scenario.prompt}];
    setMsgs(kickoff);setChatIn("");setLoading(true);
    const hM=Object.entries(data.kana).filter(([k])=>k.charCodeAt(0)>=0x3040&&k.charCodeAt(0)<=0x309F).filter(([_,v])=>(v?.box??0)>=3).length;
    const kaM=Object.entries(data.kana).filter(([k])=>k.charCodeAt(0)>=0x30A0&&k.charCodeAt(0)<=0x30FF).filter(([_,v])=>(v?.box??0)>=3).length;
    const nameLine=profile.name?`User's name is ${profile.name}. `:"";
    const ob2=data.onboarding||{};
    const levelMap2={beginner:"complete beginner",basics:"knows a few words",refresh:"studied before",intermediate:"intermediate"};
    const sysPrompt=`You are Senpai, a Japanese tutor doing a role-play scenario. ${nameLine}Level: ${levelMap2[ob2.level]||"beginner"}.
PROGRESS: Hiragana ${hM}/46. Katakana ${kaM}/46. Phrases ${learnedPhr}/${PHRASES.length}.
ROLE-PLAY RULES: You play the Japanese speaker. Always respond in Japanese first, then provide the English translation in parentheses. Keep turns short (1-3 sentences). After 2-3 exchanges, gently note if the user should use a specific phrase from their studies. Adapt difficulty to the user's level.`;
    try{
      const response=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system:sysPrompt,messages:kickoff.slice(-20)})});
      const json=await response.json();
      const reply=json.content?.map(c=>c.text||"").join("\n")||json.error||"Error";
      setMsgs([...kickoff,{role:"assistant",content:reply}]);
    }catch(e){
      setMsgs([...kickoff,{role:"assistant",content:"Connection error."}]);
    }
    setLoading(false);
  };

  // ═══ SHARED STYLES ═══
  const card={background:c.s,border:"1px solid "+c.b,borderRadius:12,padding:16};
  const btn={fontFamily:font,cursor:"pointer",border:"none",transition:"all .15s"};
  const chip=(color)=>({display:"inline-flex",alignItems:"center",padding:"3px 9px",borderRadius:20,fontSize:11,fontWeight:600,background:color+"22",color:color,border:"1px solid "+color+"44"});
  const speakBtn=(text)=><button onClick={e=>{e.stopPropagation();speak(text);}} style={{...btn,padding:"5px 10px",borderRadius:8,background:c.s2,border:"1px solid "+c.b,fontSize:15,color:c.m,marginTop:8,flexShrink:0}} title="Listen">🔊</button>;
  const speakStory=(m,ch)=>{
    if(!m||!ch) return;
    if(storyPlaying){
      if(_ttsAudio){_ttsAudio.pause();_ttsAudio=null;}
      setStoryPlaying(false);
      return;
    }
    setStoryPlaying(true);
    const done=()=>setStoryPlaying(false);
    const cp=ch.codePointAt(0).toString(16);
    // Chain: JP kana → English story → JP kana again
    const playStory=(onStoryEnd)=>{
      const s=new Audio(`/audio/story3/${cp}.mp3`);
      s.playbackRate=1.1; _ttsAudio=s;
      s.onended=onStoryEnd;
      s.onerror=()=>{
        const s1=new Audio(`/audio/story/${cp}.mp3`);
        s1.playbackRate=1.1; _ttsAudio=s1;
        s1.onended=onStoryEnd; s1.onerror=onStoryEnd;
        s1.play().catch(onStoryEnd);
      };
      s.play().catch(onStoryEnd);
    };
    const playKana=(onEnd)=>{
      const k=new Audio(`/api/tts?lang=ja&q=${encodeURIComponent(ch)}`);
      k.playbackRate=0.85; _ttsAudio=k;
      k.onended=onEnd; k.onerror=onEnd;
      k.play().catch(onEnd);
    };
    playKana(()=>playStory(()=>playKana(done)));
    k1.play().catch(done);
  };
  const storyBtn=(m,ch)=>m?<button onClick={e=>{e.stopPropagation();speakStory(m,ch);}} style={{...btn,padding:"5px 12px",borderRadius:8,background:storyPlaying?c.a+"22":c.s2,border:"1px solid "+(storyPlaying?c.a:c.b),fontSize:12,color:storyPlaying?c.a:c.m,marginTop:8,flexShrink:0}}>
    {storyPlaying?"■ stop":"📖 story"}
  </button>:null;

  const sideTabBtn=(active)=>({
    ...btn,width:"100%",padding:"9px 12px",
    background:active?c.as:"transparent",
    display:"flex",flexDirection:"row",alignItems:"center",gap:10,
    color:active?c.a:c.m,fontSize:14,fontWeight:active?600:400,
    borderRadius:8,border:"none",textAlign:"left",
  });

  const bottomTabBtn=(active)=>({
    ...btn,flex:1,padding:"10px 0 8px",background:"transparent",
    display:"flex",flexDirection:"column",alignItems:"center",gap:3,
    color:active?c.a:c.m,fontSize:10,fontWeight:active?600:400,
  });

  const redGlow=theme==="dark"?"radial-gradient(ellipse 70% 35% at 50% 105%, rgba(192,40,42,0.13) 0%, transparent 100%)":"none";
  const wrap={fontFamily:font,background:theme==="dark"?`${redGlow}, ${c.bg}`:c.bg,color:c.tx,minHeight:"100vh",paddingBottom:isDesktop?0:70,paddingLeft:isDesktop?SIDEBAR_W:0};
  const inner={maxWidth:isDesktop?740:540,margin:"0 auto",padding:"28px 20px 36px"};

  const progressBar=(pct,color)=>(
    <div style={{flex:1,height:8,background:c.s3,borderRadius:4,overflow:"hidden"}}>
      <div style={{height:"100%",width:pct+"%",background:color,borderRadius:4,transition:"width .4s"}}/>
    </div>
  );

  if(!loaded)return <div style={{...wrap,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:c.m}}>Loading...</span></div>;

  // ═══ HOME ═══
  const renderHome=()=>{
    const ob=data.onboarding||{};
    const dl=ob.tripDate?daysUntil(ob.tripDate):0;
    const kanaPct=Math.round(kMastered/92*100);
    const phrPct=Math.round(learnedPhr/PHRASES.length*100);
    const stats=[
      {l:"Kana",v:kanaPct+"%",cl:c.a},
      {l:"Phrases",v:phrPct+"%",cl:c.g},
      {l:"Phr Due",v:dueCount,cl:dueCount>0?c.go:c.m},
      {l:"Kana Due",v:kDueCount,cl:kDueCount>0?c.a:c.m},
    ];
    const actions=[
      {id:"drill",icon:"🔥",title:"Daily Drill",desc:"5 kana + 5 phrases mixed",action:startDrill},
      {id:"study",icon:"💬",title:"Review Phrases",desc:dueCount>0?`${dueCount} phrases due`:"Learn new phrases",action:()=>{setTab("phrases");setPMode("review");}},
      {id:"kana",icon:"あ",title:"Kana Practice",desc:`${kMastered}/92 mastered${kDueCount>0?" · "+kDueCount+" due":""}`,action:()=>{setTab("kana");setKScreen("menu");}},
      {id:"sensei",icon:"🎌",title:"Ask Senpai",desc:"Roleplay, questions, grammar",action:()=>setTab("sensei")},
    ];
    return <div style={inner}>
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:28,fontWeight:700,margin:"0 0 6px",letterSpacing:"-.02em",textShadow:theme==="dark"?"0 0 30px rgba(192,40,42,0.35)":"none"}}>{profile.name?`こんにちは, ${profile.name}!`:"日本語 Journey"}</h1>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {dl>0&&<span style={{fontSize:12,color:c.m,fontFamily:mono}}>{dl} days to go</span>}
          {(data.streak||1)>1&&<span style={{fontSize:12,color:c.a,fontFamily:mono}}>🔥 {data.streak} day streak</span>}
        </div>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {stats.map((s,i)=><div key={i} style={{flex:1,...card,textAlign:"center",padding:"12px 6px"}}>
          <div style={{fontSize:19,fontWeight:800,fontFamily:mono,color:s.cl,marginBottom:3}}>{s.v}</div>
          <div style={{fontSize:10,color:c.m,textTransform:"uppercase",letterSpacing:".04em"}}>{s.l}</div>
        </div>)}
      </div>
      {mcLeft>0&&<div onClick={()=>{setTab("phrases");setFastTrack(true);setPMode("review");setPCards([]);setPDone(false);setPFlip(false);setPI(0);}}
        onMouseEnter={()=>setHov("ft")} onMouseLeave={()=>setHov(null)}
        style={{...card,marginBottom:8,cursor:"pointer",padding:"11px 16px",background:hov==="ft"?c.as:c.s,border:"1px solid "+c.a+"50",transition:"background .15s"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:20,flexShrink:0}}>⚡</span>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:600,color:c.a}}>Fast Track</div>
            <div style={{fontSize:11,color:c.m,marginTop:1}}>{mcLeft} mission-critical phrases left</div>
          </div>
          <span style={{fontSize:14,color:c.m,opacity:.4}}>›</span>
        </div>
      </div>}
      {actions.map(item=><div key={item.id} onClick={item.action}
        onMouseEnter={()=>setHov(item.id)} onMouseLeave={()=>setHov(null)}
        style={{...card,marginBottom:8,cursor:"pointer",padding:"13px 16px",background:hov===item.id?c.s2:c.s,transition:"background .15s"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:22,lineHeight:1,flexShrink:0}}>{item.icon}</span>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:600}}>{item.title}</div>
            <div style={{fontSize:12,color:c.m,marginTop:1}}>{item.desc}</div>
          </div>
          <span style={{fontSize:14,color:c.m,opacity:.4}}>›</span>
        </div>
      </div>)}
      <div style={{...card,marginTop:8,padding:"16px 18px"}}>
        <div style={{fontSize:11,color:c.m,textTransform:"uppercase",letterSpacing:".07em",fontFamily:mono,marginBottom:2}}>Scenarios</div>
        {Object.entries(CATS).map(([k,v],i,arr)=>{
          const total=PHRASES.filter(p=>p[4]===k).length;
          const done=PHRASES.filter(p=>p[4]===k&&(data.phr[p[0]]?.box||0)>=1).length;
          const pct=Math.round(done/total*100);
          const col=CAT_COLORS[k];
          return <div key={k} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<arr.length-1?"1px solid "+c.b+"88":"none"}}>
            <span style={{fontSize:15,width:22,flexShrink:0,textAlign:"center"}}>{CAT_ICONS[k]}</span>
            <span style={{fontSize:13,width:88,flexShrink:0,color:c.tx}}>{v}</span>
            {progressBar(pct,col)}
            <span style={{fontSize:11,fontFamily:mono,color:c.m,width:30,textAlign:"right",flexShrink:0}}>{done}/{total}</span>
          </div>;
        })}
      </div>
    </div>;
  };

  // ═══ KANA ═══
  const renderKana=()=>{
    const tileSize=isDesktop?48:42;
    const tileFont=isDesktop?19:16;

    if(kScreen==="learn"){
      const chars=allKana;const ch=chars[kLI];const m=M[ch];const rom=ROMAJI[ch];
      return <div style={inner}>
        <button onClick={()=>setKScreen("menu")} style={{...btn,background:"none",color:c.m,fontFamily:mono,fontSize:12,padding:0,marginBottom:20}}>← back</button>
        <div style={{fontSize:11,fontFamily:mono,color:c.m,marginBottom:6}}>{kLI+1}/{chars.length}</div>
        <div style={{height:4,background:c.b,borderRadius:4,marginBottom:28,overflow:"hidden"}}><div style={{height:"100%",width:((kLI+1)/chars.length*100)+"%",background:c.a,borderRadius:4,transition:"width .3s"}}/></div>
        <style>{`
          @keyframes mnemonicPulse{0%,100%{opacity:.05}50%{opacity:.18}}
          @keyframes mnemonicReveal{0%,100%{opacity:.12}50%{opacity:.32}}
        `}</style>
        {/* Character card */}
        <div onClick={()=>setKFlip(!kFlip)} style={{...card,textAlign:"center",cursor:"pointer",padding:"40px 24px",border:"1px solid "+(kFlip?c.a+"60":c.b),display:"flex",flexDirection:"column",alignItems:"center"}}>
          {/* Emoji sits in the same inline container as the character so it overlays it exactly */}
          <div style={{position:"relative",display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:kFlip?8:16}}>
            {m&&<div style={{
              position:"absolute",top:"50%",left:"50%",
              transform:"translate(-50%,-50%)",
              fontSize:kFlip?110:130,lineHeight:1,pointerEvents:"none",userSelect:"none",
              animation:kFlip?"mnemonicReveal 2.5s ease-in-out infinite":"mnemonicPulse 3s ease-in-out infinite",
              filter:kFlip?"none":"blur(2px)",
            }}>{m[0]}</div>}
            <div style={{position:"relative",zIndex:1,fontSize:kFlip?88:110,lineHeight:1}}>{ch}</div>
          </div>
          {kFlip
            ?<div style={{fontSize:34,fontWeight:700,color:c.a,fontFamily:mono}}>{rom}</div>
            :<div style={{fontSize:12,color:c.m}}>tap to reveal</div>}
          {kFlip&&<div style={{marginTop:12,display:"flex",gap:8,justifyContent:"center"}}>{speakBtn(ch)}</div>}
        </div>
        {/* Mnemonic card — only shown after flip */}
        {kFlip&&m&&<div style={{...card,display:"flex",alignItems:"center",gap:16,padding:"16px 18px",border:"1px solid "+c.b,marginTop:12}}>
          <span style={{fontSize:44,flexShrink:0}}>{m[0]}</span>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:700,color:c.tx,marginBottom:4}}>{m[1]}</div>
            <div style={{fontSize:13,color:c.m,lineHeight:1.6}}>{m[3]||m[2]}</div>
          </div>
          {storyBtn(m,ch)}
        </div>}
        <div style={{display:"flex",gap:10,marginTop:20}}>
          <button onClick={()=>{setKLI(Math.max(0,kLI-1));setKFlip(false);}} disabled={kLI===0} style={{...btn,flex:1,padding:13,borderRadius:10,border:"1px solid "+c.b,background:"transparent",color:kLI>0?c.tx:c.m,fontSize:14}}>← Prev</button>
          {kLI<chars.length-1
            ?<button onClick={()=>{setKLI(kLI+1);setKFlip(false);}} style={{...btn,flex:1,padding:13,borderRadius:10,background:c.a,color:"#fff",fontSize:14,fontWeight:600}}>Next →</button>
            :<button onClick={startKanaQuiz} style={{...btn,flex:1,padding:13,borderRadius:10,background:c.g,color:"#fff",fontSize:14,fontWeight:600}}>Quiz</button>}
        </div>
      </div>;
    }

    if(kScreen==="quiz"){
      const ch=kCards[kI];const rom=ROMAJI[ch];const m=M[ch];
      const prog=kCards.length>0?((kI+(kFb?1:0))/kCards.length*100):0;
      return <div style={inner}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
          <button onClick={()=>setKScreen("menu")} style={{...btn,background:"none",color:c.m,fontFamily:mono,fontSize:12,padding:0}}>← back</button>
          <div style={{fontFamily:mono,fontSize:12,color:c.m}}><span style={{color:c.g}}>{kScore.c}</span>{" / "}<span style={{color:c.a}}>{kScore.w}</span></div>
        </div>
        <div style={{height:4,background:c.b,borderRadius:4,marginBottom:36,overflow:"hidden"}}><div style={{height:"100%",width:prog+"%",background:c.a,borderRadius:4,transition:"width .3s"}}/></div>
        <div style={{textAlign:"center",marginBottom:kFb?8:28}}>
          <div onClick={()=>speak(ch)} title="Listen" style={{fontSize:108,lineHeight:1,marginBottom:10,color:kFb==="ok"?c.g:kFb==="no"?c.a:c.tx,cursor:"pointer"}}>{ch}</div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
            <span style={{fontSize:12,fontFamily:mono,color:c.m}}>{kI+1} of {kCards.length}</span>
            <button onClick={()=>speak(ch)} style={{...btn,padding:"3px 9px",borderRadius:6,background:c.s2,border:"1px solid "+c.b,fontSize:11,color:c.m}}>🔊 listen</button>
          </div>
        </div>
        {!kFb?<>
          <div style={{display:"flex",gap:8}}>
            <input ref={inputRef} value={kInput} onChange={e=>setKInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")submitKana();}}
              placeholder="romaji..." autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false"
              style={{flex:1,padding:"13px 16px",borderRadius:10,border:"1px solid "+c.b,background:c.s2,color:c.tx,fontFamily:mono,fontSize:20,outline:"none",textAlign:"center"}}/>
            <button onClick={submitKana} style={{...btn,padding:"13px 22px",borderRadius:10,background:kInput.trim()?c.a:c.b,color:kInput.trim()?"#fff":c.m,fontSize:14,fontWeight:600}}>Go</button>
          </div>
          <button onClick={()=>setKPeek(!kPeek)} style={{...btn,display:"block",margin:"14px auto 0",background:"none",color:c.m,fontFamily:mono,fontSize:11,opacity:.55}}>{kPeek?`"${rom}"`:"peek"}</button>
        </>:<>
          <div style={{...card,marginTop:14,background:kFb==="ok"?c.gs:c.rs,border:"1px solid "+(kFb==="ok"?c.g+"50":c.a+"50"),position:"relative",overflow:"hidden"}}>
            {m&&<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:130,opacity:0.1,pointerEvents:"none",lineHeight:1,userSelect:"none"}}>{m[0]}</div>}
            <div style={{position:"relative",zIndex:1,textAlign:"center"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,marginBottom:6}}>
                <span style={{fontSize:56}}>{ch}</span>
                <div style={{fontFamily:mono,fontSize:26,fontWeight:700,color:kFb==="ok"?c.g:c.a,marginLeft:8}}>{rom}</div>
              </div>
              {kFb==="no"&&<div style={{fontSize:12,color:c.m,marginBottom:8}}>you typed: <span style={{color:c.a,textDecoration:"line-through"}}>{kInput}</span></div>}
              {m&&<div style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:kFb==="ok"?c.gs:c.rs,borderRadius:10,border:"1px solid "+(kFb==="ok"?c.g+"30":c.a+"30"),textAlign:"left",marginTop:4}}>
                <span style={{fontSize:32,flexShrink:0}}>{m[0]}</span>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:c.tx,marginBottom:2}}>{m[1]}</div>
                  <div style={{fontSize:11,color:c.m,fontStyle:"italic",lineHeight:1.4}}>{m[2]}</div>
                </div>
              </div>}
              <div style={{marginTop:10,display:"flex",gap:8,justifyContent:"center"}}>{speakBtn(ch)}{storyBtn(m,ch)}</div>
            </div>
          </div>
          <button onClick={nextKana} style={{...btn,width:"100%",padding:13,borderRadius:10,marginTop:12,background:c.a,color:"#fff",fontSize:14,fontWeight:600}}>{kI+1>=kCards.length?"See results":"Next →"}</button>
        </>}
      </div>;
    }

    if(kScreen==="results"){
      const pct=kCards.length>0?Math.round(kScore.c/kCards.length*100):0;
      return <div style={inner}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:60,marginBottom:14}}>{pct>=90?"🎌":pct>=70?"📖":"🔄"}</div>
          <h2 style={{fontSize:26,fontWeight:700,margin:"0 0 6px",letterSpacing:"-.01em"}}>{pct>=90?"Excellent!":pct>=70?"Good progress":"Keep going"}</h2>
          <div style={{fontSize:44,fontWeight:800,fontFamily:mono,color:pct>=70?c.g:c.go}}>{pct}%</div>
        </div>
        {kMistakes.length>0&&<div style={{...card,marginBottom:16}}>
          <div style={{fontSize:11,fontFamily:mono,color:c.m,textTransform:"uppercase",marginBottom:10}}>Review</div>
          {kMistakes.map((m,i)=>{const mn=M[m.ch];return <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 0",borderBottom:i<kMistakes.length-1?"1px solid "+c.b:"none"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:26}}>{m.ch}</span>{mn&&<span style={{fontSize:18}}>{mn[0]}</span>}<span style={{fontFamily:mono,fontWeight:700,color:c.g}}>{m.rom}</span></div>
            <span style={{fontFamily:mono,fontSize:12,color:c.a,textDecoration:"line-through"}}>{m.ans}</span>
          </div>;})}
        </div>}
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>setKScreen("menu")} style={{...btn,flex:1,padding:13,borderRadius:10,border:"1px solid "+c.b,background:"transparent",color:c.tx,fontSize:14}}>Back</button>
          <button onClick={()=>{if(kMistakes.length>0){setKCards(shuffle(kMistakes.map(m=>m.ch)));setKI(0);setKInput("");setKFb(null);setKScore({c:0,w:0});setKMistakes([]);setKScreen("quiz");}else startKanaQuiz();}} style={{...btn,flex:1,padding:13,borderRadius:10,background:kMistakes.length?c.go:c.a,color:"#fff",fontSize:14,fontWeight:600}}>{kMistakes.length?"Retry misses":"Again"}</button>
        </div>
      </div>;
    }

    return <div style={inner}>
      <div style={{fontSize:11,fontFamily:mono,color:c.m,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>Kana Trainer</div>
      <h2 style={{fontSize:26,fontWeight:700,margin:"0 0 18px",letterSpacing:"-.01em"}}>{kScript==="h"?"ひらがな Hiragana":"カタカナ Katakana"}</h2>
      <div style={{display:"flex",gap:6,marginBottom:18}}>
        {[["h","ひらがな"],["k","カタカナ"]].map(([s,l])=><button key={s} onClick={()=>{setKScript(s);setKSel([0]);}} style={{...btn,flex:1,padding:"9px 0",borderRadius:9,border:"1px solid "+(kScript===s?c.a:c.b),background:kScript===s?c.as:"transparent",color:kScript===s?c.a:c.m,fontSize:13,fontWeight:600}}>{l}</button>)}
      </div>
      {kDueCount>0&&<button onClick={()=>{
        const due=shuffle(Object.keys(data.kana).filter(ch=>(data.kana[ch]?.box??0)>=1&&isKanaDue(ch)));
        setKCards(due);setKI(0);setKInput("");setKFb(null);setKScore({c:0,w:0});setKMistakes([]);setKPeek(false);setKScreen("quiz");
      }} style={{...btn,width:"100%",padding:13,borderRadius:10,background:c.go,color:"#fff",fontSize:14,fontWeight:600,marginBottom:12}}>
        Review {kDueCount} due kana
      </button>}
      <div style={{...card,marginBottom:18}}>
        <div style={{fontSize:11,fontFamily:mono,color:c.m,marginBottom:10,textTransform:"uppercase"}}>Select rows</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {groups.map((g,i)=>{const sel=kSel.includes(i);const mas=g.c.every(ch=>getKBox(ch)>=3);
            return <button key={i} onClick={()=>setKSel(sel?kSel.filter(x=>x!==i):[...kSel,i])} style={{...btn,padding:"6px 12px",borderRadius:7,border:"1px solid "+(sel?c.a:c.b),background:sel?c.as:"transparent",color:sel?c.tx:c.m,fontSize:12}}>{g.n}{mas&&<span style={{marginLeft:4,color:c.g,fontSize:10}}>✓</span>}</button>;
          })}
        </div>
        <button onClick={()=>setKSel(groups.map((_,i)=>i))} style={{...btn,marginTop:10,padding:"4px 10px",borderRadius:5,border:"1px solid "+c.b,background:"transparent",color:c.m,fontFamily:mono,fontSize:10}}>all</button>
      </div>
      <div style={{display:"flex",gap:10,marginBottom:18}}>
        <button onClick={()=>{setKLI(0);setKFlip(false);setKScreen("learn");}} disabled={!allKana.length} style={{...btn,flex:1,padding:14,borderRadius:10,background:allKana.length?c.s2:c.b,border:"1px solid "+c.b,color:allKana.length?c.tx:c.m,fontSize:14,fontWeight:600}}>Learn ({allKana.length})</button>
        <button onClick={startKanaQuiz} disabled={!allKana.length} style={{...btn,flex:1,padding:14,borderRadius:10,background:allKana.length?c.a:c.b,color:allKana.length?"#fff":c.m,fontSize:14,fontWeight:600}}>Quiz ({allKana.length})</button>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
        {allKana.map((ch,i)=>{const box=getKBox(ch);const mastered=box>=3;const learning=box>=1&&box<3;const due=isKanaDue(ch)&&box>=1;
          return <div key={i} style={{
            width:tileSize,height:tileSize,
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
            borderRadius:9,
            background:mastered?c.gs:learning?c.go+"1a":c.s2,
            border:"1px solid "+(mastered?c.g+"55":learning?c.go+"44":c.b),
            outline:due?"2px solid "+c.a+"50":"none",
            position:"relative",
          }}>
            <div style={{fontSize:tileFont,lineHeight:1}}>{ch}</div>
            <div style={{fontSize:8,color:c.m,marginTop:2}}>{ROMAJI[ch]}</div>
            {mastered&&<div style={{position:"absolute",top:2,right:4,fontSize:7,color:c.g}}>✓</div>}
            {learning&&<div style={{position:"absolute",top:2,right:4,fontSize:7,color:c.go,fontFamily:mono,fontWeight:700}}>{box}</div>}
          </div>;
        })}
      </div>
    </div>;
  };

  // ═══ PHRASES ═══
  const renderPhrases=()=>{
    if(pMode==="review"&&!pDone){
      let reviewable=fastTrack?MC_PHRASES:pCat?PHRASES.filter(p=>p[4]===pCat):PHRASES;
      let due=reviewable.filter(p=>isPhrDue(p[0]));
      if(due.length===0)due=reviewable.filter(p=>!data.phr[p[0]]).slice(0,5);
      if(pCards.length===0&&due.length>0){setPCards(shuffle(due));setPI(0);setPFlip(false);return null;}
      if(pCards.length===0)return <div style={inner}>
        <button onClick={()=>{setPMode("browse");setPCards([]);setFastTrack(false);}} style={{...btn,background:"none",color:c.m,fontFamily:mono,fontSize:12,padding:0,marginBottom:20}}>← back</button>
        <div style={{textAlign:"center",padding:48}}><div style={{fontSize:52,marginBottom:14}}>✅</div><h3 style={{fontSize:20,fontWeight:600}}>All caught up!</h3><div style={{fontSize:13,color:c.m,marginTop:8}}>No phrases due. Check back later.</div></div>
      </div>;
      const p=pCards[pI];if(!p){setPDone(true);return null;}
      return <div style={inner}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <button onClick={()=>{setPMode("browse");setPCards([]);setFastTrack(false);}} style={{...btn,background:"none",color:c.m,fontFamily:mono,fontSize:12,padding:0}}>← back</button>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {fastTrack&&<span style={chip(c.a)}>⚡ Fast Track</span>}
            <div style={{fontFamily:mono,fontSize:12,color:c.m}}>{pI+1}/{pCards.length}</div>
          </div>
        </div>
        <div style={{height:4,background:c.b,borderRadius:4,marginBottom:28,overflow:"hidden"}}><div style={{height:"100%",width:((pI+1)/pCards.length*100)+"%",background:c.g,borderRadius:4,transition:"width .3s"}}/></div>
        {/* recall mode toggle */}
        <div style={{display:"flex",gap:6,marginBottom:14}}>
          {[["recognise","Show Japanese"],["recall","Recall Mode"]].map(([mode,label])=>(
            <button key={mode} onClick={()=>setPRecall(mode==="recall")}
              style={{...btn,flex:1,padding:"7px 0",borderRadius:8,border:"1px solid "+(pRecall===(mode==="recall")?c.g:c.b),background:pRecall===(mode==="recall")?c.gs:"transparent",color:pRecall===(mode==="recall")?c.g:c.m,fontSize:11,fontWeight:600}}>
              {label}
            </button>
          ))}
        </div>
        <div style={{...card,padding:"36px 24px",textAlign:"center",minHeight:220,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:!pFlip?"pointer":"default"}} onClick={()=>!pFlip&&setPFlip(true)}>
          {!pFlip
            ?<><span style={{...chip(CAT_COLORS[p[4]]),marginBottom:12}}>{CAT_ICONS[p[4]]} {CATS[p[4]]}</span>
              <div style={{fontSize:19,fontWeight:600,marginBottom:14,lineHeight:1.4}}>{p[3]}</div>
              <div style={{fontSize:12,color:c.m}}>{pRecall?"think of the Japanese... then flip":"tap to reveal"}</div></>
            :<><span style={{...chip(CAT_COLORS[p[4]]),marginBottom:12}}>{CAT_ICONS[p[4]]} {CATS[p[4]]}</span>
              <div style={{fontSize:30,fontWeight:700,marginBottom:6,lineHeight:1.3}}>{p[1]}</div>
              <button onClick={e=>{e.stopPropagation();speakPhrase(p[0],p[1]);}} style={{...btn,padding:"5px 10px",borderRadius:8,background:c.s2,border:"1px solid "+c.b,fontSize:15,color:c.m,marginTop:8,flexShrink:0}} title="Listen">🔊</button>
              <div style={{fontSize:19,fontFamily:mono,color:c.a,marginTop:6,marginBottom:8}}>{p[2]}</div>
              <div style={{fontSize:14,color:c.m}}>{p[3]}</div>
              {p[5]&&<div style={{fontSize:12,color:c.m,fontStyle:"italic",marginTop:6}}>{p[5]}</div>}</>}
        </div>
        {pFlip&&<div style={{display:"flex",gap:10,marginTop:16}}>
          <button onClick={()=>{reviewPhr(p[0],false);if(pI+1>=pCards.length)setPDone(true);else{setPI(pI+1);setPFlip(false);}}} style={{...btn,flex:1,padding:14,borderRadius:10,background:c.rs,border:"1px solid "+c.a+"40",color:c.a,fontSize:14,fontWeight:600}}>Missed it</button>
          <button onClick={()=>{reviewPhr(p[0],true);if(pI+1>=pCards.length)setPDone(true);else{setPI(pI+1);setPFlip(false);}}} style={{...btn,flex:1,padding:14,borderRadius:10,background:c.gs,border:"1px solid "+c.g+"40",color:c.g,fontSize:14,fontWeight:600}}>Got it</button>
        </div>}
      </div>;
    }
    if(pDone)return <div style={inner}>
      <div style={{textAlign:"center",padding:40}}>
        <div style={{fontSize:60,marginBottom:14}}>🎉</div>
        <h3 style={{fontSize:24,fontWeight:600,margin:"0 0 8px",letterSpacing:"-.01em"}}>Session complete!</h3>
        <div style={{display:"flex",gap:10,marginTop:24}}>
          <button onClick={()=>{setPMode("browse");setPCards([]);setPDone(false);setPFlip(false);setPI(0);setFastTrack(false);}} style={{...btn,flex:1,padding:13,borderRadius:10,border:"1px solid "+c.b,background:"transparent",color:c.tx,fontSize:14}}>Browse</button>
          <button onClick={()=>{setPCards([]);setPDone(false);setPFlip(false);setPI(0);}} style={{...btn,flex:1,padding:13,borderRadius:10,background:c.g,color:"#fff",fontSize:14,fontWeight:600}}>More</button>
        </div>
      </div>
    </div>;
    if(pCat){
      const phrases=PHRASES.filter(p=>p[4]===pCat);
      return <div style={inner}>
        <button onClick={()=>setPCat(null)} style={{...btn,background:"none",color:c.m,fontFamily:mono,fontSize:12,padding:0,marginBottom:14}}>← scenarios</button>
        <h2 style={{fontSize:22,fontWeight:700,margin:"0 0 18px",letterSpacing:"-.01em"}}>{CAT_ICONS[pCat]} {CATS[pCat]}</h2>
        <button onClick={()=>{setPMode("review");setPCards([]);setPDone(false);setPFlip(false);setPI(0);}} style={{...btn,width:"100%",padding:13,borderRadius:10,background:c.g,color:"#fff",fontSize:14,fontWeight:600,marginBottom:16}}>Practice</button>
        {phrases.map((p,i)=>{const box=getPhrBox(p[0]);
          const badgeColor=box>=4?c.g:box>=1?c.go:c.m;
          return <div key={i} style={{...card,marginBottom:8,padding:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                  <div style={{fontSize:17,fontWeight:600}}>{p[1]}</div>
                  <button onClick={()=>speakPhrase(p[0],p[1])} style={{...btn,padding:"2px 7px",borderRadius:6,background:c.s2,border:"1px solid "+c.b,fontSize:12,color:c.m}}>🔊</button>
                </div>
                <div style={{fontSize:13,fontFamily:mono,color:c.a,marginBottom:2}}>{p[2]}</div>
                <div style={{fontSize:13,color:c.m}}>{p[3]}</div>
              </div>
              <span style={chip(badgeColor)}>{box>=4?"mastered":box>=1?"learning":"new"}</span>
            </div>
          </div>;
        })}
      </div>;
    }
    return <div style={inner}>
      <div style={{fontSize:11,fontFamily:mono,color:c.m,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>Phrase Bank</div>
      <h2 style={{fontSize:26,fontWeight:700,margin:"0 0 18px",letterSpacing:"-.01em"}}>Scenarios</h2>
      {mcLeft>0&&<button onClick={()=>{setFastTrack(true);setPMode("review");setPCards([]);setPDone(false);setPFlip(false);setPI(0);}}
        style={{...btn,width:"100%",padding:13,borderRadius:10,background:c.a,color:"#fff",fontSize:14,fontWeight:600,marginBottom:10}}>
        ⚡ Fast Track — {mcLeft} mission-critical left
      </button>}
      {dueCount>0&&<button onClick={()=>{setFastTrack(false);setPCat(null);setPMode("review");setPCards([]);setPDone(false);setPFlip(false);setPI(0);}} style={{...btn,width:"100%",padding:13,borderRadius:10,background:c.go,color:"#fff",fontSize:15,fontWeight:600,marginBottom:16}}>Review {dueCount} due</button>}
      {Object.entries(CATS).map(([k,v])=>{
        const total=PHRASES.filter(p=>p[4]===k).length;
        const done=PHRASES.filter(p=>p[4]===k&&(data.phr[p[0]]?.box||0)>=1).length;
        const pct=Math.round(done/total*100);
        const col=CAT_COLORS[k];
        return <div key={k} onClick={()=>setPCat(k)}
          onMouseEnter={()=>setHov("cat_"+k)} onMouseLeave={()=>setHov(null)}
          style={{...card,marginBottom:8,padding:14,cursor:"pointer",background:hov==="cat_"+k?c.s2:c.s,transition:"all .15s"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:22,flexShrink:0}}>{CAT_ICONS[k]}</span>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
                <span style={{fontSize:15,fontWeight:600}}>{v}</span>
                <span style={chip(col)}>{done}/{total}</span>
              </div>
              {progressBar(pct,col)}
            </div>
            <div style={{color:c.m,opacity:.4,fontSize:14,marginLeft:4}}>→</div>
          </div>
        </div>;
      })}
    </div>;
  };

  // ═══ SENSEI ═══
  const renderSensei=()=>{
    const chatW=isDesktop?800:540;
    return <div style={{fontFamily:font,background:c.bg,color:c.tx,display:"flex",flexDirection:"column",position:"fixed",top:0,right:0,bottom:0,left:isDesktop?SIDEBAR_W:0}}>
      <style>{`@keyframes pulse{0%,100%{opacity:.2}50%{opacity:.9}}.dot1{animation:pulse 1.4s ease-in-out infinite}.dot2{animation:pulse 1.4s ease-in-out .22s infinite}.dot3{animation:pulse 1.4s ease-in-out .44s infinite}`}</style>
      <div style={{padding:"18px 24px 14px",borderBottom:"1px solid "+c.b,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontSize:26}}>🎌</div>
          <div>
            <div style={{fontSize:16,fontWeight:700}}>Senpai{profile.name?` · ${profile.name}`:""}</div>
            <div style={{fontSize:11,color:c.m}}>AI Japanese tutor · {data.streak||1} day streak</div>
          </div>
        </div>
        {msgs.length>0&&<button onClick={()=>setMsgs([])} style={{...btn,padding:"5px 10px",borderRadius:7,background:c.s2,border:"1px solid "+c.b,fontSize:12,color:c.m}}>New</button>}
      </div>
      <div style={{flex:1,overflow:"auto",padding:"20px 24px"}}>
        {msgs.length===0&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"60%",textAlign:"center",padding:"40px 20px"}}>
          <div style={{fontSize:52,marginBottom:16}}>🎌</div>
          <div style={{fontSize:18,fontWeight:600,marginBottom:6}}>Hey{profile.name?`, ${profile.name}`:""}. I'm your Senpai.</div>
          <div style={{fontSize:13,color:c.m,marginBottom:24,lineHeight:1.6}}>I know your progress and trip details.</div>
          {/* Role-play scenarios */}
          <div style={{width:"100%",maxWidth:460,marginBottom:20}}>
            <div style={{fontSize:11,fontFamily:mono,color:c.m,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10,textAlign:"left"}}>Role-play a scenario</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {RP_SCENARIOS.map((sc,i)=>
                <button key={sc.id} onClick={()=>startRolePlay(sc)}
                  onMouseEnter={()=>setHov("rp"+i)} onMouseLeave={()=>setHov(null)}
                  style={{...btn,padding:"11px 14px",borderRadius:10,background:hov==="rp"+i?c.s2:c.s,border:"1px solid "+c.b,color:c.tx,fontSize:13,textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center",transition:"all .15s"}}>
                  <span>{sc.icon} {sc.name}</span><span style={{color:c.m,opacity:.4,fontSize:16}}>→</span>
                </button>
              )}
            </div>
          </div>
          {/* Free questions */}
          <div style={{width:"100%",maxWidth:460}}>
            <div style={{fontSize:11,fontFamily:mono,color:c.m,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10,textAlign:"left"}}>Or ask a question</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {["Quiz me on what I've learned","Explain how to count in Japanese","What phrases should I focus on?",data.onboarding?.why==="travel"?"Cultural tips for Japan":data.onboarding?.why==="anime"?"Anime phrases I should know":"What should I learn next?"].map((s,i)=>
                <button key={i} onClick={()=>setChatIn(s)}
                  onMouseEnter={()=>setHov("sg"+i)} onMouseLeave={()=>setHov(null)}
                  style={{...btn,padding:"11px 14px",borderRadius:10,background:hov==="sg"+i?c.s2:c.s,border:"1px solid "+c.b,color:c.tx,fontSize:13,textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center",transition:"all .15s"}}>
                  <span>{s}</span><span style={{color:c.m,opacity:.4,fontSize:16}}>→</span>
                </button>
              )}
            </div>
          </div>
        </div>}
        <div style={{maxWidth:chatW,margin:"0 auto"}}>
          {msgs.map((m,i)=>m.role!=="user"||!m.content.startsWith("Let's role-play")&&!m.content.startsWith("Let's do a role-play")?<div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:10}}>
            <div style={{
              maxWidth:"80%",padding:"10px 14px",
              borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",
              background:m.role==="user"?c.a+"18":c.s,
              border:"1px solid "+(m.role==="user"?c.a+"30":c.b),
              fontSize:14,lineHeight:1.65,whiteSpace:"pre-wrap",
            }}>{m.content}</div>
          </div>:null)}
          {loading&&<div style={{display:"flex",marginBottom:10}}>
            <div style={{padding:"12px 18px",borderRadius:"14px 14px 14px 4px",background:c.s,border:"1px solid "+c.b,display:"flex",gap:5,alignItems:"center"}}>
              <span className="dot1" style={{fontSize:22,color:c.m,lineHeight:1}}>·</span>
              <span className="dot2" style={{fontSize:22,color:c.m,lineHeight:1}}>·</span>
              <span className="dot3" style={{fontSize:22,color:c.m,lineHeight:1}}>·</span>
            </div>
          </div>}
          <div ref={chatEndRef}/>
        </div>
      </div>
      <div style={{padding:"12px 24px",borderTop:"1px solid "+c.b,paddingBottom:"max(14px, env(safe-area-inset-bottom))",background:c.bg}}>
        <div style={{maxWidth:chatW,margin:"0 auto",display:"flex",gap:8}}>
          <input value={chatIn} onChange={e=>setChatIn(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendToSensei();}}}
            placeholder="Ask senpai..." style={{flex:1,padding:"11px 16px",borderRadius:10,border:"1px solid "+c.b,background:c.s2,color:c.tx,fontFamily:font,fontSize:14,outline:"none"}}/>
          <button onClick={()=>sendToSensei()} disabled={!chatIn.trim()||loading} style={{...btn,padding:"11px 20px",borderRadius:10,background:chatIn.trim()&&!loading?c.a:c.b,color:chatIn.trim()&&!loading?"#fff":c.m,fontSize:14,fontWeight:600}}>Send</button>
        </div>
      </div>
    </div>;
  };

  // ═══ DAILY DRILL ═══
  const renderDrill=()=>{
    if(drillDone||drillCards.length===0){
      const total=drillCards.length;
      const pct=total>0?Math.round(drillScore.c/total*100):0;
      return <div style={inner}>
        <div style={{textAlign:"center",padding:"40px 20px"}}>
          <div style={{fontSize:60,marginBottom:14}}>{pct>=80?"🔥":pct>=60?"👍":"🔄"}</div>
          <h2 style={{fontSize:26,fontWeight:700,margin:"0 0 6px"}}>Drill complete!</h2>
          <div style={{fontSize:44,fontWeight:800,fontFamily:mono,color:pct>=80?c.g:c.go,marginBottom:24}}>{pct}%</div>
          <div style={{fontSize:13,color:c.m,marginBottom:24}}>{drillScore.c} correct · {drillScore.w} missed</div>
          <div style={{display:"flex",gap:10,justifyContent:"center"}}>
            <button onClick={()=>setTab("home")} style={{...btn,flex:1,maxWidth:160,padding:13,borderRadius:10,border:"1px solid "+c.b,background:"transparent",color:c.tx,fontSize:14}}>Home</button>
            <button onClick={startDrill} style={{...btn,flex:1,maxWidth:160,padding:13,borderRadius:10,background:c.a,color:"#fff",fontSize:14,fontWeight:600}}>Again</button>
          </div>
        </div>
      </div>;
    }
    const card_=drillCards[drillI];
    const progress=(drillI/(drillCards.length))*100;
    if(card_.type==="kana"){
      const ch=card_.ch;const rom=ROMAJI[ch];const m=M[ch];
      return <div style={inner}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <button onClick={()=>setTab("home")} style={{...btn,background:"none",color:c.m,fontFamily:mono,fontSize:12,padding:0}}>← exit</button>
          <span style={chip(c.a)}>🔥 Daily Drill</span>
          <div style={{fontFamily:mono,fontSize:12,color:c.m}}>{drillI+1}/{drillCards.length}</div>
        </div>
        <div style={{height:4,background:c.b,borderRadius:4,marginBottom:36,overflow:"hidden"}}><div style={{height:"100%",width:progress+"%",background:c.a,borderRadius:4,transition:"width .3s"}}/></div>
        <div style={{textAlign:"center",marginBottom:drillFb?8:28}}>
          <div style={{fontSize:12,fontFamily:mono,color:c.m,marginBottom:8}}>Kana</div>
          <div style={{fontSize:108,lineHeight:1,marginBottom:10,color:drillFb==="ok"?c.g:drillFb==="no"?c.a:c.tx}}>{ch}</div>
        </div>
        {!drillFb?<>
          <div style={{display:"flex",gap:8}}>
            <input ref={drillRef} value={drillInput} onChange={e=>setDrillInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")submitDrillKana();}}
              placeholder="romaji..." autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false"
              style={{flex:1,padding:"13px 16px",borderRadius:10,border:"1px solid "+c.b,background:c.s2,color:c.tx,fontFamily:mono,fontSize:20,outline:"none",textAlign:"center"}}/>
            <button onClick={submitDrillKana} style={{...btn,padding:"13px 22px",borderRadius:10,background:drillInput.trim()?c.a:c.b,color:drillInput.trim()?"#fff":c.m,fontSize:14,fontWeight:600}}>Go</button>
          </div>
        </>:<>
          <div style={{...card,textAlign:"center",marginTop:14,background:drillFb==="ok"?c.gs:c.rs,border:"1px solid "+(drillFb==="ok"?c.g+"50":c.a+"50")}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:14,marginBottom:10}}>
              <span style={{fontSize:48}}>{ch}</span>{m&&<span style={{fontSize:32}}>{m[0]}</span>}
            </div>
            <div style={{fontFamily:mono,fontSize:22,fontWeight:700,color:drillFb==="ok"?c.g:c.a}}>{rom}</div>
            {m&&<div style={{fontSize:14,color:c.tx,marginTop:6}}>{m[1]}</div>}
            {drillFb==="no"&&<div style={{fontSize:12,color:c.m,marginTop:4}}>you typed: <span style={{color:c.a,textDecoration:"line-through"}}>{drillInput}</span></div>}
            <div style={{marginTop:8}}>{speakBtn(ch)}</div>
          </div>
          <button onClick={advanceDrill} style={{...btn,width:"100%",padding:13,borderRadius:10,marginTop:12,background:c.a,color:"#fff",fontSize:14,fontWeight:600}}>{drillI+1>=drillCards.length?"Finish":"Next →"}</button>
        </>}
      </div>;
    }
    // phrase card in drill
    const p=card_.p;
    return <div style={inner}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <button onClick={()=>setTab("home")} style={{...btn,background:"none",color:c.m,fontFamily:mono,fontSize:12,padding:0}}>← exit</button>
        <span style={chip(c.g)}>🔥 Daily Drill</span>
        <div style={{fontFamily:mono,fontSize:12,color:c.m}}>{drillI+1}/{drillCards.length}</div>
      </div>
      <div style={{height:4,background:c.b,borderRadius:4,marginBottom:28,overflow:"hidden"}}><div style={{height:"100%",width:progress+"%",background:c.a,borderRadius:4,transition:"width .3s"}}/></div>
      <div style={{...card,padding:"36px 24px",textAlign:"center",minHeight:220,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:!drillFlip?"pointer":"default"}} onClick={()=>!drillFlip&&setDrillFlip(true)}>
        {!drillFlip
          ?<><span style={{...chip(CAT_COLORS[p[4]]),marginBottom:12}}>{CAT_ICONS[p[4]]} {CATS[p[4]]}</span>
            <div style={{fontSize:19,fontWeight:600,marginBottom:14,lineHeight:1.4}}>{p[3]}</div>
            <div style={{fontSize:12,color:c.m}}>think of it... then tap to reveal</div></>
          :<><span style={{...chip(CAT_COLORS[p[4]]),marginBottom:12}}>{CAT_ICONS[p[4]]} {CATS[p[4]]}</span>
            <div style={{fontSize:30,fontWeight:700,marginBottom:6,lineHeight:1.3}}>{p[1]}</div>
            <button onClick={e=>{e.stopPropagation();speakPhrase(p[0],p[1]);}} style={{...btn,padding:"5px 10px",borderRadius:8,background:c.s2,border:"1px solid "+c.b,fontSize:15,color:c.m,marginTop:8,flexShrink:0}} title="Listen">🔊</button>
            <div style={{fontSize:19,fontFamily:mono,color:c.a,marginTop:6,marginBottom:8}}>{p[2]}</div>
            <div style={{fontSize:14,color:c.m}}>{p[3]}</div></>}
      </div>
      {drillFlip&&<div style={{display:"flex",gap:10,marginTop:16}}>
        <button onClick={()=>{reviewPhr(p[0],false);setDrillScore(s=>({...s,w:s.w+1}));advanceDrill();}} style={{...btn,flex:1,padding:14,borderRadius:10,background:c.rs,border:"1px solid "+c.a+"40",color:c.a,fontSize:14,fontWeight:600}}>Missed it</button>
        <button onClick={()=>{reviewPhr(p[0],true);setDrillScore(s=>({...s,c:s.c+1}));advanceDrill();}} style={{...btn,flex:1,padding:14,borderRadius:10,background:c.gs,border:"1px solid "+c.g+"40",color:c.g,fontSize:14,fontWeight:600}}>Got it</button>
      </div>}
    </div>;
  };

  // ═══ ONBOARDING ═══
  const WHY_OPTIONS=[
    {id:"travel",icon:"🗾",label:"Travelling to Japan"},
    {id:"anime",icon:"🎌",label:"Anime & culture"},
    {id:"work",icon:"💼",label:"Work or study"},
    {id:"moving",icon:"🏠",label:"Living / moving there"},
    {id:"curious",icon:"✨",label:"Just curious"},
  ];
  const LEVEL_OPTIONS=[
    {id:"beginner",label:"Complete beginner — I know nothing yet"},
    {id:"basics",label:"I know a few words or phrases"},
    {id:"refresh",label:"Studied before, need a refresh"},
    {id:"intermediate",label:"Intermediate — want to level up"},
  ];

  const finishOnboarding=()=>{
    const ob={...onboardAnswers,completedAt:new Date().toISOString()};
    save({onboarded:true,onboarding:ob});
  };

  const renderOnboarding=()=>{
    const stepCount=3;
    const progressPct=Math.round((onboardStep/stepCount)*100);
    const ans=onboardAnswers;
    return(
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:theme==="dark"?`radial-gradient(ellipse 80% 50% at 50% 110%, rgba(192,40,42,0.16) 0%, transparent 70%), ${c.bg}`:c.bg,padding:24,color:c.tx,fontFamily:font}}>
        <div style={{width:"100%",maxWidth:420}}>
          <div style={{textAlign:"center",marginBottom:32}}>
            <div style={{fontSize:36,fontWeight:800,letterSpacing:"-.02em",marginBottom:4}}>日本語</div>
            <div style={{fontSize:12,color:c.m,fontFamily:mono,textTransform:"uppercase",letterSpacing:".08em"}}>TinySenpai</div>
          </div>
          {/* progress bar */}
          <div style={{height:3,background:c.b,borderRadius:2,marginBottom:32}}>
            <div style={{height:3,width:progressPct+"%",background:c.a,borderRadius:2,transition:"width .3s"}}/>
          </div>

          {onboardStep===0&&(
            <div>
              <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>Why are you learning Japanese?</div>
              <div style={{fontSize:14,color:c.m,marginBottom:20}}>We'll personalise your experience around your goal.</div>
              {WHY_OPTIONS.map(o=>(
                <div key={o.id} onClick={()=>{setOnboardAnswers(a=>({...a,why:o.id}));setOnboardStep(1);}}
                  style={{...card,padding:"14px 18px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:14,border:"1px solid "+(ans.why===o.id?c.a:c.b),transition:"border .15s"}}>
                  <span style={{fontSize:22}}>{o.icon}</span>
                  <span style={{fontSize:15,fontWeight:500,color:c.tx}}>{o.label}</span>
                </div>
              ))}
              <button onClick={()=>setOnboardStep(1)} style={{...btn,width:"100%",padding:12,marginTop:8,background:"transparent",color:c.m,fontSize:13}}>Skip</button>
            </div>
          )}

          {onboardStep===1&&(
            <div>
              <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>What's your current level?</div>
              <div style={{fontSize:14,color:c.m,marginBottom:20}}>Be honest — this helps your AI tutor pitch things right.</div>
              {LEVEL_OPTIONS.map(o=>(
                <div key={o.id} onClick={()=>{setOnboardAnswers(a=>({...a,level:o.id}));setOnboardStep(2);}}
                  style={{...card,padding:"14px 18px",marginBottom:8,cursor:"pointer",border:"1px solid "+(ans.level===o.id?c.a:c.b),transition:"border .15s"}}>
                  <span style={{fontSize:14,fontWeight:500,color:c.tx}}>{o.label}</span>
                </div>
              ))}
              <button onClick={()=>setOnboardStep(2)} style={{...btn,width:"100%",padding:12,marginTop:8,background:"transparent",color:c.m,fontSize:13}}>Skip</button>
            </div>
          )}

          {onboardStep===2&&(
            <div>
              <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>Anything else to know?</div>
              <div style={{fontSize:14,color:c.m,marginBottom:20}}>Optional — helps your Senpai give better answers.</div>
              {ans.why==="travel"&&(
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:12,color:c.m,fontFamily:mono,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>Trip date (optional)</div>
                  <input type="date" value={ans.tripDate||""} onChange={e=>setOnboardAnswers(a=>({...a,tripDate:e.target.value}))}
                    style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid "+c.b,background:c.s2,color:c.tx,fontFamily:font,fontSize:14,outline:"none",boxSizing:"border-box",marginBottom:12}}/>
                </div>
              )}
              <div style={{fontSize:12,color:c.m,fontFamily:mono,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>Anything to focus on? (optional)</div>
              <textarea value={ans.focus||""} onChange={e=>setOnboardAnswers(a=>({...a,focus:e.target.value.slice(0,200)}))}
                placeholder="e.g. ordering food, reading menus, anime without subtitles, business meetings..."
                rows={3} style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid "+c.b,background:c.s2,color:c.tx,fontFamily:font,fontSize:13,outline:"none",resize:"none",boxSizing:"border-box",lineHeight:1.5,marginBottom:16}}/>
              <button onClick={finishOnboarding} style={{...btn,width:"100%",padding:14,borderRadius:10,background:c.a,color:"#fff",fontSize:15,fontWeight:600}}>Let's go →</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ═══ PROFILE MODAL ═══
  const renderProfile=()=>(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setShowProfile(false)}>
      <div style={{...card,width:"100%",maxWidth:360,padding:24}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
          <div style={{fontSize:16,fontWeight:700}}>Your Profile</div>
          <div style={{fontSize:11,color:c.m}}>{user.primaryEmailAddress?.emailAddress}</div>
        </div>
        <div style={{fontSize:12,color:c.m,marginBottom:18}}>Changes save automatically to the cloud</div>

        <div style={{fontSize:11,color:c.m,marginBottom:4,fontFamily:mono,textTransform:"uppercase"}}>Display Name</div>
        <input value={profile.name} onChange={e=>saveProfile({name:e.target.value})} placeholder="e.g. Ollie"
          style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid "+c.b,background:c.s2,color:c.tx,fontFamily:font,fontSize:14,outline:"none",marginBottom:14,boxSizing:"border-box"}}/>

        <div style={{fontSize:11,color:c.m,marginBottom:4,fontFamily:mono,textTransform:"uppercase"}}>Why learning Japanese</div>
        <select value={data.onboarding?.why||""} onChange={e=>save({onboarding:{...data.onboarding,why:e.target.value}})}
          style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid "+c.b,background:c.s2,color:c.tx,fontFamily:font,fontSize:14,outline:"none",marginBottom:12,boxSizing:"border-box"}}>
          <option value="">Select a reason...</option>
          <option value="travel">Travelling to Japan</option>
          <option value="anime">Anime & culture</option>
          <option value="work">Work or study</option>
          <option value="moving">Living / moving there</option>
          <option value="curious">Just curious</option>
        </select>
        <div style={{fontSize:11,color:c.m,marginBottom:4,fontFamily:mono,textTransform:"uppercase"}}>Trip date (optional)</div>
        <input type="date" value={data.onboarding?.tripDate||""} onChange={e=>save({onboarding:{...data.onboarding,tripDate:e.target.value}})}
          style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid "+c.b,background:c.s2,color:c.tx,fontFamily:font,fontSize:14,outline:"none",marginBottom:12,boxSizing:"border-box"}}/>
        <div style={{fontSize:11,color:c.m,marginBottom:4,fontFamily:mono,textTransform:"uppercase"}}>Extra context for Senpai</div>
        <textarea value={profile.notes} onChange={e=>saveProfile({notes:e.target.value.slice(0,200)})} placeholder="e.g. vegetarian, solo traveller, interested in anime, need business phrases..."
          rows={2} style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid "+c.b,background:c.s2,color:c.tx,fontFamily:font,fontSize:13,outline:"none",resize:"none",boxSizing:"border-box",lineHeight:1.5}}/>
        <div style={{fontSize:10,color:c.m,fontFamily:mono,textAlign:"right",marginBottom:16}}>{(profile.notes||"").length}/200</div>

        <div style={{display:"flex",gap:8,fontSize:12,color:c.m,marginBottom:18,padding:"10px 12px",background:c.s2,borderRadius:8}}>
          <span>🔥 {data.streak||1} day streak</span>
          <span style={{marginLeft:"auto"}}>📚 {data.sessions} sessions</span>
          <span>✅ {data.totalC} correct</span>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setShowProfile(false)} style={{...btn,flex:1,padding:11,borderRadius:9,background:c.a,color:"#fff",fontSize:14,fontWeight:600}}>Done</button>
          <button onClick={()=>signOut()} style={{...btn,padding:"11px 14px",borderRadius:9,background:"transparent",border:"1px solid "+c.b,color:c.m,fontSize:13}}>Sign out</button>
        </div>
      </div>
    </div>
  );

  // ═══ RENDER ═══
  const tabs=[{id:"home",icon:"🏠",label:"Home"},{id:"kana",icon:"あ",label:"Kana"},{id:"phrases",icon:"💬",label:"Phrases"},{id:"sensei",icon:"🎌",label:"Senpai"}];
  const handleTabClick=(id)=>{
    setTab(id);
    if(id==="phrases"){setPMode("browse");setPCat(null);setPCards([]);setPDone(false);setFastTrack(false);}
    if(id==="kana")setKScreen("menu");
    if(id==="sensei"){}
  };

  if(loaded&&!data.onboarded)return renderOnboarding();

  return <div style={wrap}>
    {tab==="home"&&renderHome()}
    {tab==="kana"&&renderKana()}
    {tab==="phrases"&&renderPhrases()}
    {tab==="sensei"&&renderSensei()}
    {tab==="drill"&&renderDrill()}
    {showProfile&&renderProfile()}

    {isDesktop
      ? <div style={{position:"fixed",top:0,left:0,bottom:0,width:SIDEBAR_W,background:c.s,borderRight:"1px solid "+c.b,display:"flex",flexDirection:"column",zIndex:100}}>
          <div style={{padding:"16px 16px 14px",borderBottom:"1px solid "+c.b,display:"flex",alignItems:"center",gap:10}}>
            <img src="/images/tinysenpai2.png" alt="TinySenpai" style={{width:38,height:38,imageRendering:"pixelated",borderRadius:6}}/>
            <div>
              <div style={{fontSize:18,fontWeight:700,letterSpacing:"-.02em",lineHeight:1}}>日本語</div>
              <div style={{fontSize:11,color:c.m,marginTop:3,fontFamily:mono,letterSpacing:".02em"}}>TinySenpai</div>
            </div>
          </div>
          <div style={{flex:1,padding:"12px 8px"}}>
            {tabs.map(tb=><button key={tb.id} onClick={()=>handleTabClick(tb.id)} style={sideTabBtn(tab===tb.id||tab==="drill"&&tb.id==="home")}>
              <span style={{fontSize:18,lineHeight:1}}>{tb.icon}</span>
              <span>{tb.label}</span>
            </button>)}
          </div>
          <div style={{padding:"10px 8px",borderTop:"1px solid "+c.b}}>
            <button onClick={()=>setShowProfile(true)} style={{...sideTabBtn(false),gap:10,marginBottom:2}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.m} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              <span style={{fontSize:13}}>{profile.name||"Profile"}</span>
              <div style={{marginLeft:"auto",width:7,height:7,borderRadius:"50%",background:syncStatus==="saved"?c.g:syncStatus==="saving"?c.go:syncStatus==="error"?c.a:c.b,transition:"background .3s",flexShrink:0}}/>
            </button>
            <button onClick={toggleTheme} style={{...sideTabBtn(false),gap:10}}>
              {theme==="dark"
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.m} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.m} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
              <span style={{fontSize:13}}>{theme==="dark"?"Light mode":"Dark mode"}</span>
              {daysUntil(data.onboarding?.tripDate)>0&&<span style={{marginLeft:"auto",fontSize:10,fontFamily:mono,color:c.m,flexShrink:0}}>{daysUntil(data.onboarding?.tripDate)}d</span>}
            </button>
          </div>
        </div>
      : <div style={{position:"fixed",bottom:0,left:0,right:0,background:c.s,borderTop:"1px solid "+c.b,display:"flex",zIndex:100,paddingBottom:"env(safe-area-inset-bottom)"}}>
          {tabs.map(tb=><button key={tb.id} onClick={()=>handleTabClick(tb.id)} style={bottomTabBtn(tab===tb.id||tab==="drill"&&tb.id==="home")}>
            <span style={{fontSize:20}}>{tb.icon}</span><span>{tb.label}</span>
          </button>)}
        </div>
    }
  </div>;
}
