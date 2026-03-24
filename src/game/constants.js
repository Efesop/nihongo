// ═══ PHYSICS ═══
export const GRAVITY = 1800;
export const MOVE_SPEED = 280;
export const JUMP_FORCE = -560;
export const SLASH_DURATION = 150;
export const SLASH_RANGE = 75;
export const DASH_SPEED = 600;
export const DASH_DURATION = 110;
export const DASH_COOLDOWN = 400;

// ═══ RENDERING ═══
export const SCALE = 3;
export const TILE = 20;
export const GROUND_Y = 0.78;
export const TOTAL_ROOMS = 10;

// ═══ ROOM STAR RATINGS (seconds) ═══
export const STAR_3 = 6;   // clear room under 6s = ★★★
export const STAR_2 = 12;  // clear under 12s = ★★
// anything else = ★

// ═══ COLOR PALETTE ═══
// Extracted from actual TinySenpai mascot PNG + enemy colors.
// Single-char keys for compact 20x20 sprite data.
export const PAL = {
  "0": null,               // transparent

  // ── Mascot hat (from real pixel data) ──
  "1": "#000000",          // outline black
  "2": "#804023",          // hat brown dark / band
  "3": "#e9ae51",          // hat golden
  "4": "#ffd976",          // hat highlight bright
  "5": "#dfa44e",          // hat golden mid
  "6": "#cb8c40",          // hat amber
  "7": "#90542e",          // hat band dark
  "8": "#ffd275",          // hat bright gold

  // ── Face + body (from real pixel data) ──
  "9": "#ffce80",          // skin warm
  "A": "#292e33",          // body dark blue-gray (NOT pure black)
  "B": "#cd1608",          // red accent bright
  "C": "#8b0f17",          // red accent dark
  "D": "#404145",          // body mid gray
  "E": "#f0f0ff",          // eye glint white

  // ── Blade ──
  "F": "#e0e8ff",          // blade highlight
  "G": "#a0b0c8",          // blade mid

  // ── Bandit enemy (warm brown tones) ──
  "H": "#8b6840",          // bandit cloth brown
  "I": "#6b4830",          // bandit dark brown
  "J": "#c4a060",          // bandit headband
  "K": "#d4b070",          // bandit skin

  // ── Archer enemy (dark green/teal) ──
  "L": "#2a4a3a",          // archer dark green
  "M": "#3a6a50",          // archer mid green
  "N": "#1a3a2a",          // archer deep green
  "O": "#4a8a60",          // archer light green

  // ── Guard enemy (armored red/gold) ──
  "P": "#4a3050",          // guard armor dark
  "Q": "#6a4870",          // guard armor mid
  "R": "#8a6090",          // guard armor light
  "S": "#cc9933",          // guard gold trim
  "T": "#aa7722",          // guard gold dark

  // ── Shared ──
  "U": "#666680",          // metal gray
  "V": "#8888aa",          // metal light
  "W": "#555566",          // dark metal
  "X": "#ffaa44",          // orange glow
  "Y": "#ff6644",          // fire/danger
  "Z": "#6666cc",          // projectile blue
};

// ═══ ENEMY CONFIG ═══
export const ENEMY_CONFIG = {
  oni:     { hp: 1, speed: 0.7, alertRange: 200, attackRange: 65, cooldown: 800, score: 100 },
  ninja:   { hp: 1, speed: 0,   alertRange: 350, fireRate: 900,  retreatSpeed: 150, score: 150 },
  samurai: { hp: 2, speed: 0.5, alertRange: 200, attackRange: 60, cooldown: 700, score: 300 },
};

// ═══ CAMERA ═══
export const LOOK_AHEAD_DIST = 80;
export const KILL_ZOOM = 1.08;
export const KILL_ZOOM_3RD = 1.12;
export const MILESTONE_ZOOM = 1.15;
export const SLOWMO_ZOOM = 0.97;

// ═══ COMBAT TIMING ═══
export const COMBO_WINDOW = 350;
export const DEATH_TIMER = 500;
export const ROOM_CLEAR_PAUSE = 2200;
export const LAST_KILL_FREEZE = 400;

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
