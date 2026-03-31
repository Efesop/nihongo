export const SRS_DAYS=[0,0.5,1,3,7,14];
export const KEY="nihongo-v4";

export const font='"Noto Sans JP","Hiragino Sans",system-ui,sans-serif';
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

// ═══ ROLE-PLAY SCENARIOS ═══
export const RP_SCENARIOS = [
  {id:"hotel", icon:"🏨", name:"Hotel Check-In", prompt:"Let's role-play. You are the front desk staff at a Japanese hotel. Speak in Japanese with English translation in parentheses after each line. Start by greeting me as I approach the desk to check in."},
  {id:"food",  icon:"🍜", name:"Ordering Food",  prompt:"Let's role-play. You are a waiter at a Japanese restaurant. Speak in Japanese with English in parentheses. I've just sat down — start the scene."},
  {id:"train", icon:"🚃", name:"Buying a Ticket",prompt:"Let's role-play. You are a helpful Japanese train station attendant. Speak in Japanese with English in parentheses. I approach your window looking a bit lost — start the scene."},
  {id:"shop",  icon:"🏪", name:"Shopping",       prompt:"Let's role-play. You are staff at a Japanese convenience store. Speak in Japanese with English in parentheses. I walk up to the counter — start the scene."},
  {id:"dir",   icon:"🗺️", name:"Asking Directions",prompt:"Let's role-play. You are a friendly Japanese local on the street. Speak in Japanese with English in parentheses. I approach you looking confused with my phone — start the scene."},
];
