export const SRS_DAYS=[0,0.5,1,3,7,14];
export const KEY="nihongo-v4";

// Primary UI font — Zen Kaku Gothic New (Adobe-designed, distinctive geometric, full JP coverage)
export const font='"Zen Kaku Gothic New","Hiragino Sans",system-ui,sans-serif';
// Japanese display — clean system JP font (reverted from Klee One per user preference)
export const fontJa='"Hiragino Sans","Noto Sans JP","Zen Kaku Gothic New",system-ui,sans-serif';
// Brand/hero font — Yuji Boku (brush calligraphy)
export const fontBrand='"Yuji Boku","Zen Kaku Gothic New",serif';
export const mono='"JetBrains Mono","SF Mono","Fira Code",monospace';

// ═══ TYPOGRAPHY — single source of truth for font sizes ═══
// Use these everywhere instead of hardcoding pixel values
export const T = {
  xs:    11,  // tiny accent labels (grammar type tags under kanji)
  sm:    13,  // small labels, secondary info
  base:  15,  // body text, descriptions, hints
  md:    17,  // prominent UI text, instructions
  lg:    20,  // main content (Japanese text on mobile)
  xl:    24,  // main content (Japanese text on desktop)
  xxl:   32,  // hero text, big kana display
  huge:  48,  // single character display
};

// ═══ JAPANESE TEXT — single source of truth for JP display sizes ═══
// Change here → updates every exercise automatically
export const JP = {
  // Font size for Japanese content in choice cards, prompts, dialogues
  size:     { desktop: 24, mobile: 20 },   // T.xl / T.lg
  // Font size for big JP (pattern tiles, kana keyboard, typed chars)
  sizeBig:  { desktop: 32, mobile: 24 },   // T.xxl / T.xl
  // Font weight for JP text — 500 (medium) for clear dakuten/particles, 700 was too heavy
  weight:   500,
  lineHeight: 1.3,
};

// ═══ SCENE IMAGE — single source of truth for scene image display ═══
export const SCENE_IMG = {
  height: { desktop: 240, mobile: 180 },
};

// ═══ GRAMMAR COLORS — per-segment tint for phrase breakdowns ═══
// Used by PhraseSegments.jsx and SmartSession's ColoredJP helper. Keep in sync.
export const GRAMMAR_COLORS = {
  particle: "#e8a838",
  noun: "#5a9ec4",
  verb: "#5ac48a",
  adjective: "#c45a8b",
  expression: "#8b8b8b",
  counter: "#8b6ec4",
  copula: "#c4985a",
  suffix: "#6e8bc4",
  question: "#e8a838",
};

// ═══ SPEAKER COLORS — canonical tint per scene character ═══
// Konoha = pink/feminine, Akira = blue/masculine. Used for dialogue bubbles,
// role-play buttons, karaoke highlight, speaker bubble accents.
export const SPEAKER_COLORS = {
  konoha: "#f48fb1",
  akira:  "#64b5f6",
};

// ═══ ROLE AVATARS — emoji + background per in-session role ═══
// Used by SmartSession to render speaker chips in branching conversations.
export const ROLE_AVATARS = {
  "You":         { emoji: "🎒", bg: "#5a9ec4" },
  "Staff":       { emoji: "👨‍🍳", bg: "#e8a838" },
  "Clerk":       { emoji: "🏪", bg: "#8b6ec4" },
  "Hotel staff": { emoji: "🏨", bg: "#c4985a" },
  "Driver":      { emoji: "🚕", bg: "#5ac48a" },
  "Local":       { emoji: "🗾", bg: "#c45a8b" },
  "Friend":      { emoji: "☕", bg: "#e8a838" },
  "Passerby":    { emoji: "🚶", bg: "#8b8b8b" },
  "staff":       { emoji: "👨‍🍳", bg: "#e8a838" },
  "you":         { emoji: "🎒", bg: "#5a9ec4" },
  "local":       { emoji: "🗾", bg: "#c45a8b" },
};

// ═══ ROLE-PLAY SCENARIOS ═══
export const RP_SCENARIOS = [
  {id:"hotel", icon:"🏨", name:"Hotel Check-In", prompt:"Let's role-play. You are the front desk staff at a Japanese hotel. Speak in Japanese with English translation in parentheses after each line. Start by greeting me as I approach the desk to check in."},
  {id:"food",  icon:"🍜", name:"Ordering Food",  prompt:"Let's role-play. You are a waiter at a Japanese restaurant. Speak in Japanese with English in parentheses. I've just sat down — start the scene."},
  {id:"train", icon:"🚃", name:"Buying a Ticket",prompt:"Let's role-play. You are a helpful Japanese train station attendant. Speak in Japanese with English in parentheses. I approach your window looking a bit lost — start the scene."},
  {id:"shop",  icon:"🏪", name:"Shopping",       prompt:"Let's role-play. You are staff at a Japanese convenience store. Speak in Japanese with English in parentheses. I walk up to the counter — start the scene."},
  {id:"dir",   icon:"🗺️", name:"Asking Directions",prompt:"Let's role-play. You are a friendly Japanese local on the street. Speak in Japanese with English in parentheses. I approach you looking confused with my phone — start the scene."},
];

// ═══ SKILL MAP — exerciseType → skill dimension ═══
// Used by reviewPhr / updateKanaSRS to credit the right slot in
// data.skills[id], and by capBoxBySkills to gate box advancement. Missing
// keys default to "visual" — safer than crediting production for unknown
// types, which would inflate mastery falsely.
//
// Single source of truth: every retrieval surface (Learn, Vocab Test,
// PhraseBank, DailyDrill, Web quiz) routes its writes through
// recordRetrieval which reads this map.
export const SKILL_MAP = {
  // Kana
  "kana-visual":     "visual",
  "kana-listen":     "listen",
  "kana-reverse":    "production",
  "kana-pair":       "visual",
  // Phrase MCQ / typed
  "phrase-scenario": "visual",
  "phrase-listen":   "listen",
  "phrase-production":"production",
  "phrase-reverse":  "production",
  "phrase-build":    "production",
  "phrase-pair":     "visual",
  "phrase-kana-type":"production",
  "phrase-chain":    "listen",
  "phrase-dj":       "production",
  "pattern-assembly":"production",
  "phrase-shadow":   "production",
  "number-match":    "listen",
  // Scene study
  "scene-watch":     "listen",
  "scene-cloze":     "listen",
  "scene-shadow":    "production",
  "scene-roleplay":  "production",
  // Vocab Test self-judge — EN→JP recall (production direction)
  "vocab-test":      "production",
  // Web tab quiz — comprehension prompt before reveal
  "web-quiz":        "visual",
  // Specials
  "speed-round-listen":"listen",
  "speed-round-produce":"production",
  "cluster-contrast":"visual",
  "pitch-pair":      "listen",
  "leech-review":    "production",
  "conversation":    "production",
};
