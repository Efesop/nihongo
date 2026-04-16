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

// ═══ ROLE-PLAY SCENARIOS ═══
export const RP_SCENARIOS = [
  {id:"hotel", icon:"🏨", name:"Hotel Check-In", prompt:"Let's role-play. You are the front desk staff at a Japanese hotel. Speak in Japanese with English translation in parentheses after each line. Start by greeting me as I approach the desk to check in."},
  {id:"food",  icon:"🍜", name:"Ordering Food",  prompt:"Let's role-play. You are a waiter at a Japanese restaurant. Speak in Japanese with English in parentheses. I've just sat down — start the scene."},
  {id:"train", icon:"🚃", name:"Buying a Ticket",prompt:"Let's role-play. You are a helpful Japanese train station attendant. Speak in Japanese with English in parentheses. I approach your window looking a bit lost — start the scene."},
  {id:"shop",  icon:"🏪", name:"Shopping",       prompt:"Let's role-play. You are staff at a Japanese convenience store. Speak in Japanese with English in parentheses. I walk up to the counter — start the scene."},
  {id:"dir",   icon:"🗺️", name:"Asking Directions",prompt:"Let's role-play. You are a friendly Japanese local on the street. Speak in Japanese with English in parentheses. I approach you looking confused with my phone — start the scene."},
];
