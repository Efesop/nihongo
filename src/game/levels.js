// ═══ ROOM DEFINITIONS ═══
// Each room fits roughly on-screen. Platforms use relative Y (0 = ground, negative = above).
// Shadow zones: [{x, w}] — dark patches on platforms where player is invisible.
// Enemy positions are fixed — each room is a puzzle to solve.

export const ROOMS = [
  // ── Room 1: Tutorial — learn to slash ──
  {
    platforms: [{ x: 0, y: 0, w: 900 }],
    enemies: [{ type: "oni", x: 600, y: 0 }],
    shadows: [],
    playerStart: 100,
    deco: [{ type: "lantern", x: 300 }],
  },

  // ── Room 2: Two oni, shadow between them ──
  {
    platforms: [{ x: 0, y: 0, w: 900 }],
    enemies: [
      { type: "oni", x: 400, y: 0 },
      { type: "oni", x: 700, y: 0 },
    ],
    shadows: [{ x: 350, w: 120 }],
    playerStart: 80,
    deco: [{ type: "torii", x: 550 }],
  },

  // ── Room 3: Ninja on high ground, oni below ──
  {
    platforms: [
      { x: 0, y: 0, w: 400 },
      { x: 350, y: -80, w: 200 },
      { x: 600, y: 0, w: 300 },
    ],
    enemies: [
      { type: "oni", x: 200, y: 0 },
      { type: "oni", x: 700, y: 0 },
      { type: "ninja", x: 450, y: -80 },
    ],
    shadows: [{ x: 50, w: 100 }],
    playerStart: 80,
    deco: [{ type: "lantern", x: 450 }],
  },

  // ── Room 4: Gaps — must jump between platforms ──
  {
    platforms: [
      { x: 0, y: 0, w: 200 },
      { x: 280, y: -20, w: 180 },
      { x: 540, y: 0, w: 180 },
      { x: 780, y: -30, w: 180 },
    ],
    enemies: [
      { type: "oni", x: 140, y: 0 },
      { type: "oni", x: 370, y: -20 },
      { type: "oni", x: 630, y: 0 },
    ],
    shadows: [{ x: 560, w: 80 }],
    playerStart: 50,
    deco: [],
  },

  // ── Room 5: Ninja snipers on high, oni patrol below ──
  {
    platforms: [
      { x: 0, y: 0, w: 900 },
      { x: 100, y: -100, w: 150 },
      { x: 650, y: -100, w: 150 },
    ],
    enemies: [
      { type: "ninja", x: 175, y: -100 },
      { type: "ninja", x: 725, y: -100 },
      { type: "oni", x: 450, y: 0 },
    ],
    shadows: [{ x: 380, w: 140 }],
    playerStart: 50,
    deco: [{ type: "torii", x: 450 }, { type: "lantern", x: 200 }],
  },

  // ── Room 6: Samurai introduction ──
  {
    platforms: [{ x: 0, y: 0, w: 900 }],
    enemies: [
      { type: "oni", x: 350, y: 0 },
      { type: "samurai", x: 650, y: 0 },
    ],
    shadows: [{ x: 150, w: 100 }],
    playerStart: 60,
    deco: [{ type: "torii", x: 500 }, { type: "lantern", x: 800 }],
  },

  // ── Room 7: Fast room — chain kills for flow ──
  {
    platforms: [
      { x: 0, y: 0, w: 350 },
      { x: 250, y: -60, w: 150 },
      { x: 430, y: 0, w: 250 },
      { x: 750, y: 0, w: 200 },
    ],
    enemies: [
      { type: "oni", x: 150, y: 0 },
      { type: "oni", x: 320, y: -60 },
      { type: "ninja", x: 550, y: 0 },
      { type: "oni", x: 500, y: 0 },
      { type: "ninja", x: 850, y: 0 },
    ],
    shadows: [],
    playerStart: 40,
    deco: [{ type: "sign", x: 600 }],
  },

  // ── Room 8: Stealth or brute force ──
  {
    platforms: [
      { x: 0, y: 0, w: 400 },
      { x: 500, y: 0, w: 400 },
    ],
    enemies: [
      { type: "samurai", x: 300, y: 0 },
      { type: "ninja", x: 600, y: 0 },
      { type: "samurai", x: 800, y: 0 },
    ],
    shadows: [{ x: 50, w: 150 }, { x: 520, w: 120 }],
    playerStart: 80,
    deco: [{ type: "lantern", x: 250 }, { type: "lantern", x: 700 }],
  },

  // ── Room 9: The gauntlet ──
  {
    platforms: [
      { x: 0, y: 0, w: 1000 },
      { x: 200, y: -80, w: 150 },
      { x: 650, y: -80, w: 150 },
    ],
    enemies: [
      { type: "oni", x: 200, y: 0 },
      { type: "oni", x: 400, y: 0 },
      { type: "ninja", x: 275, y: -80 },
      { type: "oni", x: 600, y: 0 },
      { type: "ninja", x: 725, y: -80 },
      { type: "oni", x: 800, y: 0 },
      { type: "samurai", x: 900, y: 0 },
    ],
    shadows: [{ x: 430, w: 100 }],
    playerStart: 50,
    deco: [{ type: "torii", x: 500 }],
  },

  // ── Room 10: Boss — 3 samurai ──
  {
    platforms: [{ x: 0, y: 0, w: 900 }],
    enemies: [
      { type: "samurai", x: 350, y: 0 },
      { type: "samurai", x: 550, y: 0 },
      { type: "samurai", x: 750, y: 0 },
    ],
    shadows: [{ x: 50, w: 100 }],
    playerStart: 80,
    deco: [{ type: "torii", x: 200 }, { type: "torii", x: 800 }, { type: "lantern", x: 450 }],
  },
];

// Keep old SEGMENTS export for backwards compat (not used anymore)
export const SEGMENTS = ROOMS.map(r => ({
  w: Math.max(...r.platforms.map(p => p.x + p.w)),
  platforms: r.platforms,
  enemies: r.enemies,
  deco: r.deco || [],
}));
