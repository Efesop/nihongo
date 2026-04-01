// ═══ CONFUSED KANA PAIRS ═══
// Characters that look similar and are commonly mixed up.
// Used for interleaved discrimination drilling (Kornell & Bjork 2008).

export const CONFUSED_PAIRS = [
  // Katakana — the most confusing script for beginners
  { chars: ["シ", "ツ"], romaji: ["shi", "tsu"], hint: "シ (shi) strokes slant left↗ like a smile. ツ (tsu) strokes drop down↘ like rain." },
  { chars: ["ソ", "ン"], romaji: ["so", "n"], hint: "ソ (so) stroke goes down-right ↘. ン (n) stroke sweeps up-right ↗." },
  { chars: ["ノ", "メ"], romaji: ["no", "me"], hint: "ノ (no) is one stroke. メ (me) crosses itself with two strokes." },
  { chars: ["ク", "タ"], romaji: ["ku", "ta"], hint: "タ (ta) has a horizontal bar inside. ク (ku) is open." },
  { chars: ["ウ", "ワ"], romaji: ["u", "wa"], hint: "ウ (u) has a top dot. ワ (wa) is open on top." },
  { chars: ["コ", "ユ"], romaji: ["ko", "yu"], hint: "コ (ko) is a box open on the left. ユ (yu) has a horizontal line poking out." },
  { chars: ["ア", "マ"], romaji: ["a", "ma"], hint: "マ (ma) has two equal legs. ア (a) has a curve hanging down." },
  { chars: ["ヌ", "ス"], romaji: ["nu", "su"], hint: "ヌ (nu) has a dot/cross at top. ス (su) is a simpler curve." },

  // Hiragana — subtler but still tricky
  { chars: ["は", "ほ"], romaji: ["ha", "ho"], hint: "ほ (ho) has an extra horizontal stroke making it look 'fuller'." },
  { chars: ["き", "さ"], romaji: ["ki", "sa"], hint: "き (ki) has 4 strokes with a gap. さ (sa) has 3 strokes, connected." },
  { chars: ["わ", "れ"], romaji: ["wa", "re"], hint: "れ (re) has a tail that curves right. わ (wa) loops back left." },
  { chars: ["ね", "れ"], romaji: ["ne", "re"], hint: "ね (ne) has a loop at the bottom. れ (re) just curves." },
  { chars: ["め", "ぬ"], romaji: ["me", "nu"], hint: "ぬ (nu) has a loop like a knot. め (me) ends with a simple tail." },
  { chars: ["る", "ろ"], romaji: ["ru", "ro"], hint: "る (ru) has a loop. ろ (ro) is open — no loop." },
  { chars: ["い", "り"], romaji: ["i", "ri"], hint: "い (i) has two separate strokes. り (ri) strokes are closer together." },

  // Dakuten pairs (voicing confusion)
  { chars: ["は", "ば"], romaji: ["ha", "ba"], hint: "ば (ba) has two dots (dakuten ゛). は (ha) has none." },
  { chars: ["か", "が"], romaji: ["ka", "ga"], hint: "が (ga) = か (ka) + two dots. The dots add voice." },

  // ── Additional confusing pairs (added April 2026) ──

  // Hiragana — more subtle lookalikes
  { chars: ["さ", "ら"], romaji: ["sa", "ra"], hint: "さ (sa) has a cross at the top like an X. ら (ra) has a simple horizontal bar — no crossing." },
  { chars: ["つ", "ち"], romaji: ["tsu", "chi"], hint: "つ (tsu) is one open scoop. ち (chi) has a vertical stem dropping down before the curve." },
  { chars: ["せ", "ね"], romaji: ["se", "ne"], hint: "ね (ne) has a snail-shell loop at the bottom. せ (se) ends open — no loop." },
  { chars: ["わ", "ね"], romaji: ["wa", "ne"], hint: "わ (wa) loops gently left like a swan's neck. ね (ne) loops tighter and has a knot at the bottom." },
  { chars: ["た", "な"], romaji: ["ta", "na"], hint: "た (ta) has a clean cross + curve. な (na) adds an extra stroke — a knot hanging off the right." },
  { chars: ["ま", "も"], romaji: ["ma", "mo"], hint: "ま (ma) has a loop at the bottom right. も (mo) has two horizontal bars and no loop." },
  { chars: ["け", "は"], romaji: ["ke", "ha"], hint: "は (ha) has a round loop on the right. け (ke) has a straight stroke — no loop." },

  // Katakana — more angular lookalikes
  { chars: ["ヨ", "コ"], romaji: ["yo", "ko"], hint: "ヨ (yo) has three horizontal bars. コ (ko) has only two — it's missing the middle bar." },
  { chars: ["フ", "ワ"], romaji: ["fu", "wa"], hint: "フ (fu) is one stroke curving down. ワ (wa) has two strokes forming a wider wine-glass shape." },
  { chars: ["チ", "テ"], romaji: ["chi", "te"], hint: "テ (te) angles straight down. チ (chi) has a horizontal bar then curves — like a lollipop on a stick." },
  { chars: ["ナ", "メ"], romaji: ["na", "me"], hint: "ナ (na) has a horizontal bar on top. メ (me) is just two crossing strokes — no bar." },

  // Cross-script pairs (same sound, different scripts — learners mix up which is which)
  { chars: ["り", "リ"], romaji: ["ri", "ri"], hint: "り (hiragana) has soft curves. リ (katakana) uses straight rigid strokes — angular = katakana." },
  { chars: ["か", "カ"], romaji: ["ka", "ka"], hint: "か (hiragana) has a flowing brush feel. カ (katakana) is sharp and angular — blocky = katakana." },
];
