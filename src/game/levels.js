// ═══ ROOM DEFINITIONS ═══
// Each room scrolls horizontally. Platforms with wall:true have side collision
// for wall jumping. Rooms get progressively longer and more complex.
//
// Platform types:
//   { x, y, w }               — standard thin platform (land on top only)
//   { x, y, w, h, wall:true } — solid wall block (blocks movement, wall-jumpable)
//
// Tutorial fields:
//   title: { jp, en }         — room title shown on entry
//   tutorials: [{ text, trigger }] — tutorial prompts
//     trigger: "start" | "nearEnemy" | "nearWall" | "nearGap" | "shurikens"

export const ROOMS = [
  // ════════════════════════════════════════════════════
  // PROLOGUE: THE DOJO — Tutorial Rooms (0-4)
  // Training with Sensei. The tutorial IS the story.
  // ════════════════════════════════════════════════════

  // ── Room 0: "修行 Training" — learn MOVE + SLASH ──
  {
    title: { jp: "修行", en: "Training" },
    theme: "dojo",
    platforms: [
      { x: 0, y: 0, w: 1200 },
    ],
    enemies: [
      { type: "oni", x: 700, y: 0, passive: true },
    ],
    shadows: [],
    playerStart: 80,
    deco: [{ type: "lantern", x: 400 }, { type: "scroll", x: 200 }, { type: "weapon_rack", x: 900 }],
    tutorials: [
      { text: "← → to move    (A/D)", trigger: "start" },
      { text: "J or Z to slash!", trigger: "nearEnemy" },
    ],
  },

  // ── Room 1: "跳躍 Take Flight" — learn JUMP ──
  {
    title: { jp: "跳躍", en: "Take Flight" },
    theme: "dojo",
    platforms: [
      { x: 0, y: 0, w: 500 },
      { x: 600, y: -60, w: 250 },
      { x: 950, y: -120, w: 200 },
      { x: 1200, y: 0, w: 500 },
    ],
    enemies: [
      { type: "oni", x: 700, y: -60, passive: true },
      { type: "oni", x: 1050, y: -120, passive: true },
    ],
    shadows: [],
    playerStart: 80,
    deco: [{ type: "lantern", x: 300 }],
    tutorials: [
      { text: "↑ / W / Space to jump", trigger: "nearGap" },
    ],
  },

  // ── Room 2: "閃光 Phase Through" — learn DASH + DASH-SLASH ──
  {
    title: { jp: "閃光", en: "Phase Through" },
    theme: "dojo",
    platforms: [
      { x: 0, y: 0, w: 1400 },
    ],
    enemies: [
      { type: "samurai", x: 700, y: 0 },
    ],
    shadows: [],
    playerStart: 80,
    deco: [{ type: "torii", x: 400 }],
    tutorials: [
      { text: "L or C to dash forward", trigger: "start" },
      { text: "Slash DURING dash to phase through!", trigger: "nearEnemy" },
    ],
  },

  // ── Room 3: "壁走 Wall Runner" — learn WALL JUMP ──
  {
    title: { jp: "壁走", en: "Wall Runner" },
    theme: "dojo",
    platforms: [
      { x: 0, y: 0, w: 500 },
      { x: 400, y: -70, w: 160 },
      // Wall shaft
      { x: 500, y: -350, w: 35, h: 230, wall: true },
      { x: 635, y: -350, w: 35, h: 230, wall: true },
      // Top exit
      { x: 480, y: -360, w: 230 },
      { x: 720, y: -360, w: 400 },
    ],
    enemies: [
      { type: "oni", x: 900, y: -360, passive: true },
    ],
    shadows: [],
    playerStart: 80,
    deco: [{ type: "lantern", x: 570 }],
    tutorials: [
      { text: "Jump into walls, press ↑ to wall jump!", trigger: "nearWall" },
    ],
  },

  // ── Room 4: "集中 Bullet Time" — learn SLOW-MO / FOCUS ──
  {
    title: { jp: "集中", en: "Bullet Time" },
    theme: "dojo",
    platforms: [
      { x: 0, y: 0, w: 2000 },
      { x: 500, y: -100, w: 160 },
      { x: 900, y: -110, w: 160 },
      { x: 1300, y: -100, w: 160 },
    ],
    enemies: [
      { type: "ninja", x: 580, y: -100 },
      { type: "ninja", x: 980, y: -110 },
      { type: "ninja", x: 1380, y: -100 },
    ],
    shadows: [],
    playerStart: 80,
    deco: [{ type: "torii", x: 700 }],
    tutorials: [
      { text: "Hold K / X / Shift for slow-motion!", trigger: "shurikens" },
      { text: "Kills in slow-mo = 1.5x score!", trigger: "nearEnemy" },
    ],
  },

  // ════════════════════════════════════════════════════
  // ACT 1: THE FOREST — Fleeing from the dojo (5-14)
  // The player has been forced out. They're being hunted.
  // ════════════════════════════════════════════════════

  // ── Room 5: The flight begins — breakables placed NEXT TO enemies ──
  // The player should discover: "Wait, the debris killed that guy!"
  {
    title: { jp: "逃走", en: "Flight" },
    theme: "dojo",
    platforms: [
      { x: 0, y: 0, w: 2000 },
    ],
    enemies: [
      { type: "oni", x: 500, y: 0 },
      { type: "oni", x: 900, y: 0 },
      { type: "oni", x: 1400, y: 0 },
    ],
    shadows: [],
    playerStart: 80,
    deco: [{ type: "torii", x: 400 }, { type: "lantern", x: 800 }, { type: "lantern", x: 1300 }],
    breakables: [
      // Crate RIGHT BEFORE first oni — slash sends debris into him
      { type: "crate", x: 460, y: 0, w: 40, h: 40 },
      // Lantern near second oni — fire burst incinerates him
      { type: "lantern", x: 870, y: 0, w: 28, h: 36 },
      // Crate right before third oni
      { type: "crate", x: 1360, y: 0, w: 40, h: 40 },
      // Pot further back for bonus points
      { type: "pot", x: 1650, y: 0, w: 25, h: 30 },
    ],
  },

  // ── Room 6: Vertical intro — platforms at different heights ──
  {
    title: { jp: "天空", en: "Sky Path" },
    platforms: [
      { x: 0, y: 0, w: 600 },
      { x: 400, y: -70, w: 250 },
      { x: 700, y: -140, w: 200 },
      { x: 950, y: -70, w: 250 },
      { x: 1250, y: 0, w: 600 },
      { x: 1600, y: -80, w: 200 },
    ],
    enemies: [
      { type: "oni", x: 350, y: 0 },
      { type: "oni", x: 500, y: -70 },
      { type: "ninja", x: 800, y: -140 },
      { type: "oni", x: 1050, y: -70 },
      { type: "oni", x: 1500, y: 0 },
    ],
    shadows: [],
    playerStart: 60,
    deco: [{ type: "lantern", x: 200 }, { type: "torii", x: 1400 }],
    breakables: [
      // Lantern next to oni on first platform — fire burst kills him
      { type: "lantern", x: 465, y: -70, w: 28, h: 36 },
      // Crate next to ninja up high — slash sends debris down
      { type: "crate", x: 770, y: -140, w: 35, h: 35 },
      // Lantern between two ground onis
      { type: "lantern", x: 1420, y: 0, w: 28, h: 36 },
      { type: "pot", x: 1010, y: -70, w: 25, h: 30 },
    ],
  },

  // ── Room 7: Wall jump intro — shaft climb ──
  {
    title: { jp: "登城", en: "Ascent" },
    platforms: [
      { x: 0, y: 0, w: 550 },
      { x: 400, y: -70, w: 160 },
      { x: 520, y: -140, w: 160 },
      { x: 540, y: -380, w: 35, h: 170, wall: true },
      { x: 675, y: -380, w: 35, h: 170, wall: true },
      { x: 520, y: -390, w: 230 },
      { x: 760, y: -390, w: 500 },
      { x: 1310, y: -390, w: 300 },
      { x: 760, y: 0, w: 300 },
    ],
    enemies: [
      { type: "oni", x: 300, y: 0 },
      { type: "ninja", x: 900, y: -390 },
      { type: "oni", x: 1050, y: -390 },
      { type: "oni", x: 1200, y: -390 },
      { type: "samurai", x: 1450, y: -390 },
    ],
    shadows: [],
    playerStart: 60,
    deco: [{ type: "lantern", x: 620 }],
    breakables: [
      { type: "bamboo", x: 200, y: 0, w: 50, h: 60 },
      { type: "crate", x: 850, y: -390, w: 40, h: 40 },
      { type: "pot", x: 1150, y: -390, w: 25, h: 30 },
    ],
  },

  // ── Room 8: Rooftop run — PARKOUR (timed speed run, reach the exit!) ──
  {
    title: { jp: "屋根走", en: "Rooftop Run" },
    objective: { type: "parkour", time: 18, exitX: 2540 },
    platforms: [
      { x: 0, y: 0, w: 300 },
      { x: 380, y: -30, w: 200 },
      { x: 660, y: -60, w: 200 },
      { x: 940, y: -30, w: 200 },
      { x: 1200, y: 0, w: 250 },
      { x: 1520, y: -50, w: 180 },
      { x: 1780, y: -100, w: 200 },
      { x: 2050, y: -50, w: 200 },
      { x: 2320, y: 0, w: 300 },
    ],
    enemies: [
      { type: "oni", x: 480, y: -30 },
      { type: "oni", x: 1040, y: -30 },
      { type: "oni", x: 1880, y: -100 },
    ],
    shadows: [],
    playerStart: 50,
    deco: [{ type: "sign", x: 700 }, { type: "torii", x: 1400 }, { type: "lantern", x: 2100 }],
    hazards: [
      { type: "spikes", x: 280, y: 0, w: 80 },
      { type: "spikes", x: 1100, y: 0, w: 80 },
    ],
    breakables: [
      { type: "pot", x: 460, y: -30, w: 25, h: 30 },
      { type: "lantern", x: 1000, y: -30, w: 28, h: 36 },
      { type: "crate", x: 2380, y: 0, w: 40, h: 40 },
    ],
  },

  // ── Room 9: Tower — climb shaft with wall jumps ──
  {
    title: { jp: "塔", en: "The Tower" },
    platforms: [
      { x: 0, y: 0, w: 450 },
      { x: 380, y: -80, w: 160 },
      { x: 420, y: -420, w: 35, h: 280, wall: true },
      { x: 555, y: -420, w: 35, h: 280, wall: true },
      { x: 455, y: -250, w: 120 },
      { x: 400, y: -430, w: 230 },
      { x: 650, y: -380, w: 500 },
      { x: 1200, y: -320, w: 300 },
    ],
    enemies: [
      { type: "oni", x: 250, y: 0 },
      { type: "ninja", x: 490, y: -250 },
      { type: "samurai", x: 520, y: -430 },
      { type: "ninja", x: 850, y: -380 },
      { type: "oni", x: 1050, y: -380 },
      { type: "samurai", x: 1350, y: -320 },
    ],
    shadows: [],
    playerStart: 60,
    deco: [{ type: "lantern", x: 510 }],
    hazards: [
      { type: "falling", x: 700, y: -380, w: 100 },
      { type: "falling", x: 900, y: -380, w: 100 },
    ],
    breakables: [
      { type: "crate", x: 470, y: -250, w: 35, h: 35 },
      { type: "lantern", x: 750, y: -380, w: 28, h: 36 },
    ],
  },

  // ── Room 10: Ninja gauntlet — SURVIVE (3 waves of ninjas!) ──
  {
    title: { jp: "忍道", en: "Ninja Gauntlet" },
    objective: {
      type: "survive",
      waves: [
        // Wave 1: basic ninjas
        [{ type: "ninja", x: 400, y: -120 }, { type: "oni", x: 700, y: 0 }, { type: "ninja", x: 1000, y: -130 }],
        // Wave 2: more ninjas + oni
        [{ type: "ninja", x: 500, y: -100 }, { type: "ninja", x: 900, y: -120 }, { type: "oni", x: 1200, y: 0 }, { type: "oni", x: 1500, y: 0 }],
        // Wave 3: elite
        [{ type: "ninja", x: 600, y: -130 }, { type: "ninja", x: 1100, y: -110 }, { type: "samurai", x: 800, y: 0 }, { type: "ninja", x: 1400, y: -120 }],
      ],
    },
    platforms: [
      { x: 0, y: 0, w: 2500 },
      { x: 300, y: -120, w: 160 },
      { x: 700, y: -100, w: 160 },
      { x: 1100, y: -130, w: 160 },
      { x: 1500, y: -110, w: 160 },
      { x: 1900, y: -120, w: 160 },
    ],
    enemies: [
      { type: "oni", x: 300, y: 0 },
    ],
    shadows: [],
    playerStart: 50,
    deco: [{ type: "torii", x: 600 }, { type: "torii", x: 1200 }, { type: "torii", x: 1800 }],
    hazards: [
      { type: "firejet", x: 600, y: 0, w: 30, h: 80, onTime: 1200, offTime: 2000, offset: 0 },
      { type: "firejet", x: 1200, y: 0, w: 30, h: 80, onTime: 1200, offTime: 2000, offset: 1000 },
      { type: "spikes", x: 1850, y: 0, w: 96 },
    ],
    breakables: [
      { type: "lantern", x: 550, y: 0, w: 28, h: 36 },
      { type: "crate", x: 1050, y: 0, w: 40, h: 40 },
      { type: "lantern", x: 1750, y: 0, w: 28, h: 36 },
      { type: "pot", x: 2100, y: 0, w: 25, h: 30 },
    ],
  },

  // ── Room 11: Canyon — two wall-jump shafts ──
  {
    title: { jp: "峡谷", en: "The Canyon" },
    platforms: [
      { x: 0, y: 0, w: 400 },
      { x: 320, y: -70, w: 140 },
      { x: 380, y: -280, w: 35, h: 170, wall: true },
      { x: 515, y: -280, w: 35, h: 170, wall: true },
      { x: 360, y: -290, w: 230 },
      { x: 600, y: -200, w: 200 },
      { x: 700, y: -100, w: 150 },
      { x: 880, y: -280, w: 35, h: 170, wall: true },
      { x: 1015, y: -280, w: 35, h: 170, wall: true },
      { x: 860, y: -290, w: 230 },
      { x: 1100, y: -200, w: 200 },
      { x: 1350, y: -100, w: 200 },
      { x: 1600, y: 0, w: 400 },
    ],
    enemies: [
      { type: "oni", x: 200, y: 0 },
      { type: "archer", x: 480, y: -290 },
      { type: "oni", x: 700, y: -200 },
      { type: "archer", x: 980, y: -290 },
      { type: "samurai", x: 1200, y: -200 },
      { type: "tengu", x: 1450, y: -140 },
      { type: "oni", x: 1700, y: 0 },
      { type: "samurai", x: 1850, y: 0 },
    ],
    shadows: [],
    playerStart: 50,
    deco: [{ type: "lantern", x: 460 }, { type: "lantern", x: 960 }],
    breakables: [
      { type: "bamboo", x: 150, y: 0, w: 50, h: 60 },
      { type: "crate", x: 650, y: -200, w: 40, h: 40 },
      { type: "pot", x: 1700, y: 0, w: 25, h: 30 },
    ],
  },

  // ── Room 12: Fortress ──
  {
    title: { jp: "要塞", en: "The Fortress" },
    platforms: [
      { x: 0, y: 0, w: 500 },
      { x: 500, y: -60, w: 400 },
      { x: 900, y: -120, w: 400 },
      { x: 700, y: -200, w: 300 },
      { x: 1100, y: -200, w: 30, h: 90, wall: true },
      { x: 1300, y: 0, w: 500 },
      { x: 1300, y: -140, w: 300 },
      { x: 1650, y: -80, w: 200 },
      { x: 1900, y: 0, w: 400 },
      { x: 2000, y: -150, w: 200 },
    ],
    enemies: [
      { type: "oni", x: 300, y: 0 },
      { type: "archer", x: 700, y: -60 },
      { type: "samurai", x: 1000, y: -120 },
      { type: "tengu", x: 850, y: -240 },
      { type: "brute", x: 1400, y: 0 },
      { type: "oni", x: 1500, y: -140 },
      { type: "samurai", x: 1750, y: -80 },
      { type: "oni", x: 2000, y: 0 },
      { type: "ninja", x: 2100, y: -150 },
      { type: "samurai", x: 2200, y: 0 },
    ],
    shadows: [],
    playerStart: 50,
    deco: [{ type: "torii", x: 650 }, { type: "lantern", x: 1000 }, { type: "torii", x: 1800 }],
    hazards: [
      { type: "firejet", x: 800, y: -120, w: 25, h: 70, onTime: 1000, offTime: 1800, offset: 500 },
      { type: "spikes", x: 1500, y: 0, w: 128 },
      { type: "falling", x: 1400, y: -140, w: 120 },
    ],
    breakables: [
      { type: "crate", x: 350, y: 0, w: 40, h: 40 },
      { type: "lantern", x: 1350, y: 0, w: 28, h: 36 },
      { type: "bamboo", x: 1900, y: 0, w: 50, h: 60 },
      { type: "pot", x: 2150, y: -150, w: 25, h: 30 },
    ],
  },

  // ── Room 13: The gauntlet — SURVIVE (mixed enemy waves with hazards) ──
  {
    title: { jp: "試練", en: "The Gauntlet" },
    objective: {
      type: "survive",
      waves: [
        // Wave 1: ground fighters
        [{ type: "oni", x: 400, y: 0 }, { type: "oni", x: 800, y: 0 }, { type: "samurai", x: 1200, y: 0 }],
        // Wave 2: mixed — ranged + melee
        [{ type: "archer", x: 700, y: -80 }, { type: "brute", x: 500, y: 0 }, { type: "oni", x: 1000, y: 0 }, { type: "ninja", x: 1800, y: -260 }],
        // Wave 3: heavy assault
        [{ type: "samurai", x: 600, y: 0 }, { type: "tengu", x: 900, y: -370 }, { type: "samurai", x: 1100, y: 0 }, { type: "brute", x: 1500, y: 0 }],
        // Wave 4: final push
        [{ type: "oni", x: 2500, y: 0 }, { type: "samurai", x: 2700, y: 0 }, { type: "samurai", x: 2900, y: 0 }, { type: "archer", x: 2650, y: -100 }],
      ],
    },
    platforms: [
      { x: 0, y: 0, w: 800 },
      { x: 600, y: -80, w: 250 },
      { x: 900, y: 0, w: 400 },
      { x: 1250, y: -80, w: 150 },
      { x: 1320, y: -320, w: 35, h: 200, wall: true },
      { x: 1455, y: -320, w: 35, h: 200, wall: true },
      { x: 1300, y: -330, w: 230 },
      { x: 1540, y: -260, w: 400 },
      { x: 1990, y: -180, w: 300 },
      { x: 1540, y: 0, w: 400 },
      { x: 1990, y: 0, w: 400 },
      { x: 2440, y: 0, w: 600 },
      { x: 2590, y: -100, w: 200 },
    ],
    enemies: [
      { type: "oni", x: 200, y: 0 },
    ],
    shadows: [],
    playerStart: 50,
    deco: [{ type: "torii", x: 400 }, { type: "lantern", x: 1400 }, { type: "torii", x: 2500 }],
    hazards: [
      { type: "spikes", x: 1100, y: 0, w: 80 },
      { type: "firejet", x: 2000, y: 0, w: 30, h: 90, onTime: 1000, offTime: 2500, offset: 0 },
      { type: "firejet", x: 2300, y: 0, w: 30, h: 90, onTime: 1000, offTime: 2500, offset: 1200 },
      { type: "falling", x: 1600, y: -260, w: 100 },
      { type: "falling", x: 1800, y: -260, w: 100 },
    ],
    breakables: [
      { type: "lantern", x: 400, y: 0, w: 28, h: 36 },
      { type: "crate", x: 680, y: -80, w: 40, h: 40 },
      { type: "crate", x: 1080, y: 0, w: 40, h: 40 },
      { type: "lantern", x: 1950, y: 0, w: 28, h: 36 },
      { type: "pot", x: 2650, y: -100, w: 25, h: 30 },
    ],
  },

  // ── Room 14: Boss arena — Act 1 finale ──
  {
    title: { jp: "鬼大将", en: "Oni Warlord" },
    platforms: [
      { x: 0, y: 0, w: 2000 },
      { x: 400, y: -180, w: 35, h: 190, wall: true },
      { x: 400, y: -190, w: 100 },
      { x: 800, y: -180, w: 35, h: 190, wall: true },
      { x: 800, y: -190, w: 100 },
      { x: 1200, y: -180, w: 35, h: 190, wall: true },
      { x: 1200, y: -190, w: 100 },
      { x: 1600, y: -180, w: 35, h: 190, wall: true },
      { x: 1600, y: -190, w: 100 },
    ],
    enemies: [
      { type: "oni", x: 300, y: 0 },
      { type: "samurai", x: 600, y: 0 },
      { type: "archer", x: 450, y: -190 },
      { type: "samurai", x: 900, y: 0 },
      { type: "tengu", x: 850, y: -220 },
      { type: "brute", x: 1100, y: 0 },
      { type: "oni", x: 1400, y: 0 },
      { type: "samurai", x: 1700, y: 0 },
      { type: "archer", x: 1650, y: -190 },
    ],
    shadows: [],
    playerStart: 60,
    deco: [{ type: "torii", x: 200 }, { type: "torii", x: 1000 }, { type: "torii", x: 1800 }],
    breakables: [
      { type: "crate", x: 200, y: 0, w: 40, h: 40 },
      { type: "lantern", x: 700, y: 0, w: 28, h: 36 },
      { type: "crate", x: 1500, y: 0, w: 40, h: 40 },
    ],
  },

  // ════════════════════════════════════════════════════
  // ACT 2: TEMPLE GARDENS (Rooms 15-19)
  // ════════════════════════════════════════════════════

  // ── Room 15: Temple entrance ──
  {
    title: { jp: "鳥居", en: "Temple Gate" },
    theme: "temple",
    platforms: [
      { x: 0, y: 0, w: 800 },
      { x: 900, y: -40, w: 300 },
      { x: 1300, y: -80, w: 200 },
      { x: 1600, y: -40, w: 300 },
      { x: 2000, y: 0, w: 500 },
    ],
    enemies: [
      { type: "oni", x: 400, y: 0 },
      { type: "archer", x: 1000, y: -40 },
      { type: "oni", x: 1400, y: -80 },
      { type: "samurai", x: 1700, y: -40 },
      { type: "oni", x: 2200, y: 0 },
    ],
    shadows: [],
    playerStart: 60,
    deco: [{ type: "torii", x: 300 }, { type: "lantern", x: 900 }, { type: "torii", x: 1800 }],
    hazards: [
      { type: "spikes", x: 820, y: 0, w: 64 },
    ],
    breakables: [
      { type: "pot", x: 500, y: 0, w: 25, h: 30 },
      { type: "lantern", x: 780, y: 0, w: 28, h: 36 },
      { type: "bamboo", x: 1500, y: -80, w: 50, h: 60 },
      { type: "crate", x: 2300, y: 0, w: 40, h: 40 },
    ],
  },

  // ── Room 16: Garden walkway ──
  {
    title: { jp: "庭園", en: "Garden Path" },
    theme: "temple",
    platforms: [
      { x: 0, y: 0, w: 400 },
      { x: 500, y: -30, w: 200 },
      { x: 800, y: -60, w: 200 },
      { x: 1100, y: -30, w: 200 },
      { x: 1400, y: 0, w: 400 },
      { x: 1900, y: -50, w: 300 },
      { x: 2300, y: 0, w: 500 },
    ],
    enemies: [
      { type: "ninja", x: 600, y: -30 },
      { type: "tengu", x: 900, y: -120 },
      { type: "archer", x: 1200, y: -30 },
      { type: "samurai", x: 1600, y: 0 },
      { type: "brute", x: 2000, y: -50 },
      { type: "oni", x: 2500, y: 0 },
    ],
    shadows: [],
    playerStart: 60,
    deco: [{ type: "lantern", x: 300 }, { type: "lantern", x: 1200 }, { type: "torii", x: 2200 }],
    hazards: [
      { type: "firejet", x: 420, y: 0, w: 25, h: 70, onTime: 1200, offTime: 2000, offset: 0 },
      { type: "falling", x: 1050, y: -30, w: 100 },
    ],
    breakables: [
      { type: "lantern", x: 380, y: 0, w: 28, h: 36 },
      { type: "pot", x: 860, y: -60, w: 25, h: 30 },
      { type: "crate", x: 1500, y: 0, w: 40, h: 40 },
      { type: "lantern", x: 2050, y: -50, w: 28, h: 36 },
    ],
  },

  // ── Room 17: Bell tower ──
  {
    title: { jp: "鐘楼", en: "Bell Tower" },
    theme: "temple",
    platforms: [
      { x: 0, y: 0, w: 500 },
      { x: 400, y: -80, w: 160 },
      // Tower shaft
      { x: 450, y: -400, w: 35, h: 280, wall: true },
      { x: 585, y: -400, w: 35, h: 280, wall: true },
      { x: 500, y: -230, w: 100 }, // rest ledge
      { x: 430, y: -410, w: 230 }, // top exit
      { x: 670, y: -360, w: 500 },
      { x: 1220, y: -280, w: 300 },
      { x: 1570, y: -200, w: 200 },
      { x: 1820, y: 0, w: 400 },
    ],
    enemies: [
      { type: "oni", x: 300, y: 0 },
      { type: "archer", x: 530, y: -230 },
      { type: "samurai", x: 560, y: -410 },
      { type: "tengu", x: 850, y: -400 },
      { type: "oni", x: 1000, y: -360 },
      { type: "brute", x: 1350, y: -280 },
      { type: "archer", x: 1650, y: -200 },
      { type: "samurai", x: 2000, y: 0 },
    ],
    shadows: [],
    playerStart: 60,
    deco: [{ type: "lantern", x: 520 }],
    hazards: [
      { type: "falling", x: 750, y: -360, w: 100 },
      { type: "spikes", x: 1500, y: -280, w: 64 },
    ],
    breakables: [
      { type: "bamboo", x: 350, y: 0, w: 50, h: 60 },
      { type: "pot", x: 530, y: -230, w: 25, h: 30 },
      { type: "crate", x: 900, y: -360, w: 40, h: 40 },
      { type: "lantern", x: 1400, y: -280, w: 28, h: 36 },
    ],
  },

  // ── Room 18: Inner sanctum ──
  {
    title: { jp: "内殿", en: "Inner Sanctum" },
    theme: "temple",
    platforms: [
      { x: 0, y: 0, w: 2800 },
      { x: 400, y: -120, w: 160 },
      { x: 800, y: -140, w: 160 },
      { x: 1200, y: -120, w: 160 },
      { x: 1600, y: -140, w: 160 },
      { x: 2000, y: -120, w: 160 },
    ],
    enemies: [
      { type: "samurai", x: 300, y: 0 },
      { type: "archer", x: 480, y: -120 },
      { type: "brute", x: 600, y: 0 },
      { type: "tengu", x: 900, y: -180 },
      { type: "ninja", x: 1280, y: -120 },
      { type: "samurai", x: 1400, y: 0 },
      { type: "brute", x: 1800, y: 0 },
      { type: "archer", x: 2080, y: -120 },
      { type: "samurai", x: 2400, y: 0 },
      { type: "tengu", x: 2200, y: -180 },
    ],
    shadows: [],
    playerStart: 60,
    deco: [{ type: "torii", x: 500 }, { type: "lantern", x: 1000 }, { type: "torii", x: 1500 }, { type: "lantern", x: 2000 }],
    hazards: [
      { type: "firejet", x: 700, y: 0, w: 30, h: 90, onTime: 1000, offTime: 1800, offset: 0 },
      { type: "firejet", x: 1100, y: 0, w: 30, h: 90, onTime: 1000, offTime: 1800, offset: 900 },
      { type: "spikes", x: 1700, y: 0, w: 80 },
      { type: "spikes", x: 2100, y: 0, w: 80 },
    ],
    breakables: [
      { type: "lantern", x: 650, y: 0, w: 28, h: 36 },
      { type: "crate", x: 1000, y: 0, w: 40, h: 40 },
      { type: "lantern", x: 1600, y: 0, w: 28, h: 36 },
      { type: "pot", x: 880, y: -140, w: 25, h: 30 },
      { type: "bamboo", x: 2400, y: 0, w: 50, h: 60 },
    ],
  },

  // ── Room 19: Temple boss — Act 2 finale ──
  {
    title: { jp: "大天狗", en: "Great Tengu" },
    theme: "temple",
    platforms: [
      { x: 0, y: 0, w: 2200 },
      { x: 300, y: -160, w: 35, h: 170, wall: true },
      { x: 300, y: -170, w: 120 },
      { x: 700, y: -160, w: 35, h: 170, wall: true },
      { x: 700, y: -170, w: 120 },
      { x: 1100, y: -200, w: 200 },
      { x: 1500, y: -160, w: 35, h: 170, wall: true },
      { x: 1500, y: -170, w: 120 },
      { x: 1900, y: -160, w: 35, h: 170, wall: true },
      { x: 1900, y: -170, w: 120 },
    ],
    enemies: [
      { type: "samurai", x: 250, y: 0 },
      { type: "tengu", x: 500, y: -200 },
      { type: "brute", x: 700, y: 0 },
      { type: "archer", x: 380, y: -170 },
      { type: "samurai", x: 1000, y: 0 },
      { type: "tengu", x: 1200, y: -240 },
      { type: "brute", x: 1400, y: 0 },
      { type: "archer", x: 1580, y: -170 },
      { type: "samurai", x: 1800, y: 0 },
      { type: "tengu", x: 2000, y: -200 },
    ],
    shadows: [],
    playerStart: 60,
    deco: [{ type: "torii", x: 150 }, { type: "torii", x: 1100 }, { type: "torii", x: 2050 }],
    hazards: [
      { type: "spikes", x: 850, y: 0, w: 96 },
      { type: "firejet", x: 1300, y: 0, w: 30, h: 100, onTime: 1200, offTime: 2000, offset: 0 },
      { type: "falling", x: 1150, y: -200, w: 100 },
    ],
    breakables: [
      { type: "lantern", x: 500, y: 0, w: 28, h: 36 },
      { type: "crate", x: 1100, y: 0, w: 40, h: 40 },
      { type: "lantern", x: 1700, y: 0, w: 28, h: 36 },
    ],
  },
];

export const SEGMENTS = ROOMS.map(r => ({
  w: Math.max(...r.platforms.map(p => p.x + p.w)),
  platforms: r.platforms,
  enemies: r.enemies,
  deco: r.deco || [],
}));
