// ═══ ROOM DEFINITIONS ═══
// Each room is a combat puzzle. Platforms use relative Y (0 = ground, negative = above).
// Enemies are placed to create interesting approach angles and chain-kill paths.

export const ROOMS = [
  // ── Room 1: Simple intro — 2 oni, learn slash and dash ──
  {
    platforms: [{ x: 0, y: 0, w: 1100 }],
    enemies: [
      { type: "oni", x: 500, y: 0 },
      { type: "oni", x: 800, y: 0 },
    ],
    shadows: [],
    playerStart: 80,
    deco: [{ type: "torii", x: 300 }, { type: "lantern", x: 700 }],
  },

  // ── Room 2: 3 oni + elevation — learn jumping attacks ──
  {
    platforms: [
      { x: 0, y: 0, w: 500 },
      { x: 350, y: -80, w: 200 },
      { x: 600, y: 0, w: 500 },
    ],
    enemies: [
      { type: "oni", x: 300, y: 0 },
      { type: "oni", x: 450, y: -80 },
      { type: "oni", x: 800, y: 0 },
    ],
    shadows: [],
    playerStart: 60,
    deco: [{ type: "lantern", x: 150 }, { type: "lantern", x: 900 }],
  },

  // ── Room 3: Ninja introduction — shurikens from above ──
  {
    platforms: [
      { x: 0, y: 0, w: 1100 },
      { x: 200, y: -100, w: 180 },
      { x: 700, y: -100, w: 180 },
    ],
    enemies: [
      { type: "ninja", x: 290, y: -100 },
      { type: "ninja", x: 790, y: -100 },
      { type: "oni", x: 500, y: 0 },
      { type: "oni", x: 900, y: 0 },
    ],
    shadows: [],
    playerStart: 60,
    deco: [{ type: "torii", x: 500 }],
  },

  // ── Room 4: Gap platforming + oni ──
  {
    platforms: [
      { x: 0, y: 0, w: 220 },
      { x: 300, y: -30, w: 200 },
      { x: 580, y: 0, w: 200 },
      { x: 860, y: -40, w: 200 },
      { x: 1100, y: 0, w: 200 },
    ],
    enemies: [
      { type: "oni", x: 150, y: 0 },
      { type: "oni", x: 400, y: -30 },
      { type: "ninja", x: 660, y: 0 },
      { type: "oni", x: 960, y: -40 },
    ],
    shadows: [],
    playerStart: 40,
    deco: [],
  },

  // ── Room 5: Mixed assault — ninjas snipe, oni charge ──
  {
    platforms: [
      { x: 0, y: 0, w: 1200 },
      { x: 150, y: -110, w: 160 },
      { x: 500, y: -90, w: 180 },
      { x: 880, y: -110, w: 160 },
    ],
    enemies: [
      { type: "ninja", x: 230, y: -110 },
      { type: "oni", x: 400, y: 0 },
      { type: "ninja", x: 590, y: -90 },
      { type: "oni", x: 700, y: 0 },
      { type: "ninja", x: 960, y: -110 },
    ],
    shadows: [],
    playerStart: 50,
    deco: [{ type: "torii", x: 350 }, { type: "lantern", x: 800 }],
  },

  // ── Room 6: Samurai intro — learn blocking + clash ──
  {
    platforms: [{ x: 0, y: 0, w: 1100 }],
    enemies: [
      { type: "oni", x: 400, y: 0 },
      { type: "oni", x: 600, y: 0 },
      { type: "samurai", x: 850, y: 0 },
    ],
    shadows: [],
    playerStart: 60,
    deco: [{ type: "torii", x: 250 }, { type: "torii", x: 750 }, { type: "lantern", x: 500 }],
  },

  // ── Room 7: Chain kill room — designed for flow ──
  {
    platforms: [
      { x: 0, y: 0, w: 400 },
      { x: 300, y: -60, w: 200 },
      { x: 500, y: 0, w: 300 },
      { x: 700, y: -70, w: 180 },
      { x: 900, y: 0, w: 300 },
    ],
    enemies: [
      { type: "oni", x: 200, y: 0 },
      { type: "oni", x: 400, y: -60 },
      { type: "oni", x: 600, y: 0 },
      { type: "ninja", x: 790, y: -70 },
      { type: "oni", x: 700, y: 0 },
      { type: "oni", x: 1050, y: 0 },
    ],
    shadows: [],
    playerStart: 40,
    deco: [{ type: "sign", x: 500 }],
  },

  // ── Room 8: Heavy resistance — samurai + ninja combo ──
  {
    platforms: [
      { x: 0, y: 0, w: 550 },
      { x: 400, y: -90, w: 200 },
      { x: 650, y: 0, w: 550 },
    ],
    enemies: [
      { type: "samurai", x: 350, y: 0 },
      { type: "ninja", x: 500, y: -90 },
      { type: "oni", x: 750, y: 0 },
      { type: "samurai", x: 950, y: 0 },
      { type: "ninja", x: 1050, y: 0 },
    ],
    shadows: [],
    playerStart: 60,
    deco: [{ type: "lantern", x: 200 }, { type: "lantern", x: 800 }],
  },

  // ── Room 9: The gauntlet — everything at once ──
  {
    platforms: [
      { x: 0, y: 0, w: 1300 },
      { x: 250, y: -80, w: 180 },
      { x: 550, y: -100, w: 160 },
      { x: 900, y: -80, w: 180 },
    ],
    enemies: [
      { type: "oni", x: 200, y: 0 },
      { type: "ninja", x: 340, y: -80 },
      { type: "oni", x: 450, y: 0 },
      { type: "ninja", x: 630, y: -100 },
      { type: "samurai", x: 700, y: 0 },
      { type: "oni", x: 850, y: 0 },
      { type: "ninja", x: 990, y: -80 },
      { type: "oni", x: 1100, y: 0 },
    ],
    shadows: [],
    playerStart: 50,
    deco: [{ type: "torii", x: 650 }],
  },

  // ── Room 10: Boss — 3 samurai + 2 oni ──
  {
    platforms: [
      { x: 0, y: 0, w: 1200 },
      { x: 500, y: -90, w: 200 },
    ],
    enemies: [
      { type: "oni", x: 300, y: 0 },
      { type: "samurai", x: 500, y: 0 },
      { type: "samurai", x: 700, y: 0 },
      { type: "oni", x: 900, y: 0 },
      { type: "samurai", x: 1050, y: 0 },
    ],
    shadows: [],
    playerStart: 60,
    deco: [{ type: "torii", x: 200 }, { type: "torii", x: 1000 }, { type: "lantern", x: 600 }],
  },
];

// Keep old SEGMENTS export for backwards compat
export const SEGMENTS = ROOMS.map(r => ({
  w: Math.max(...r.platforms.map(p => p.x + p.w)),
  platforms: r.platforms,
  enemies: r.enemies,
  deco: r.deco || [],
}));
