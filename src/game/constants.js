// ═══ PHYSICS ═══
export const GRAVITY = 1800;
export const MOVE_SPEED = 280;
export const JUMP_FORCE = -560;
export const SLASH_DURATION = 150;
export const SLASH_RANGE = 60;
export const DASH_SPEED = 600;
export const DASH_DURATION = 110;
export const DASH_COOLDOWN = 400;

// ═══ RENDERING ═══
export const SCALE = 3;
export const TILE = 20; // 20x20 sprites
export const GROUND_Y = 0.78;

// ═══ EXPANDED COLOR PALETTE ═══
// Single-char keys for compact sprite data
export const PAL = {
  "0": null,               // transparent
  "1": "#1a1a2e",          // body dark
  "2": "#c0282a",          // red accent
  "3": "#e8c8a0",          // skin
  "4": "#d4a850",          // hat straw
  "5": "#b08030",          // hat straw dark
  "6": "#e0e8ff",          // blade highlight
  "7": "#a0b0c8",          // blade
  "8": "#222238",          // shadow/dark
  "9": "#ff4444",          // oni red bright
  "A": "#6e3080",          // purple
  "B": "#303040",          // armor dark
  "C": "#f0f0ff",          // white/eye glint
  "D": "#80404a",          // dark red
  "E": "#50a050",          // green
  "F": "#ffa040",          // orange
  "G": "#e8c060",          // hat highlight
  "H": "#181828",          // deepest shadow
  "I": "#8a6010",          // hat band dark
  "J": "#3a3a52",          // body mid
  "K": "#dd3333",          // bright red
  "L": "#3a5080",          // ninja blue-gray
  "M": "#705010",          // hat edge
  "N": "#c8a040",          // hat mid
  "O": "#cc6666",          // oni skin mid
  "P": "#aa2020",          // oni skin dark
  "Q": "#ffdd44",          // oni eyes / gold
  "R": "#2a3a5a",          // ninja dark blue
  "S": "#4a6090",          // ninja mid blue
  "T": "#886644",          // club/wood
  "U": "#664422",          // club dark
  "V": "#8888cc",          // ninja scarf
  "W": "#555588",          // samurai armor mid
  "X": "#aaaadd",          // samurai armor light
  "Y": "#44446a",          // samurai armor dark
};

// ═══ HELPERS ═══
export function lerp(a, b, t) { return a + (b - a) * t; }
export function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
export function rnd(a, b) { return a + Math.random() * (b - a); }
export function rndInt(a, b) { return Math.floor(rnd(a, b + 1)); }
export function hash(x, y) {
  let h = (x | 0) * 374761393 + (y | 0) * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}
