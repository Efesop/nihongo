// ═══ ROOM DEFINITIONS ═══
// Each room scrolls horizontally. Platforms with wall:true have side collision
// for wall jumping. Rooms get progressively longer and more complex.
//
// Platform types:
//   { x, y, w }           — standard thin platform (land on top only)
//   { x, y, w, h, wall:true } — solid block (wall jumpable sides)

export const ROOMS = [
  // ── Room 1: Tutorial corridor — run right, slash enemies ──
  {
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
  },

  // ── Room 2: Vertical intro — platforms at different heights ──
  {
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
  },

  // ── Room 3: Wall jump introduction — narrow shaft to climb ──
  {
    platforms: [
      { x: 0, y: 0, w: 500 },
      // Vertical shaft with walls
      { x: 500, y: -250, w: 20, h: 260, wall: true },
      { x: 650, y: -250, w: 20, h: 260, wall: true },
      // Top platform
      { x: 480, y: -260, w: 210 },
      { x: 750, y: -260, w: 500 },
      // Enemies guard the top
      { x: 1300, y: -260, w: 300 },
      // Ground continues
      { x: 750, y: 0, w: 300 },
    ],
    enemies: [
      { type: "oni", x: 300, y: 0 },
      { type: "ninja", x: 600, y: -260 },
      { type: "oni", x: 900, y: -260 },
      { type: "oni", x: 1100, y: -260 },
      { type: "samurai", x: 1450, y: -260 },
    ],
    shadows: [],
    playerStart: 60,
    deco: [{ type: "lantern", x: 585 }],
  },

  // ── Room 4: Rooftop run — long platforming section ──
  {
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
      { type: "oni", x: 200, y: 0 },
      { type: "ninja", x: 480, y: -30 },
      { type: "oni", x: 760, y: -60 },
      { type: "oni", x: 1040, y: -30 },
      { type: "ninja", x: 1300, y: 0 },
      { type: "oni", x: 1600, y: -50 },
      { type: "oni", x: 1880, y: -100 },
      { type: "samurai", x: 2450, y: 0 },
    ],
    shadows: [],
    playerStart: 50,
    deco: [{ type: "sign", x: 700 }, { type: "torii", x: 1400 }, { type: "lantern", x: 2100 }],
  },

  // ── Room 5: Tower assault — climb up through wall jumps ──
  {
    platforms: [
      { x: 0, y: 0, w: 400 },
      // Tower left wall
      { x: 400, y: -400, w: 20, h: 410, wall: true },
      // Interior platforms (staircase)
      { x: 420, y: -80, w: 150 },
      { x: 600, y: -160, w: 150 },
      { x: 420, y: -240, w: 150 },
      { x: 600, y: -320, w: 150 },
      // Tower right wall
      { x: 770, y: -400, w: 20, h: 410, wall: true },
      // Top
      { x: 380, y: -410, w: 430 },
      { x: 850, y: -350, w: 500 },
      { x: 1400, y: -300, w: 300 },
    ],
    enemies: [
      { type: "oni", x: 250, y: 0 },
      { type: "ninja", x: 500, y: -80 },
      { type: "oni", x: 680, y: -160 },
      { type: "ninja", x: 500, y: -240 },
      { type: "oni", x: 680, y: -320 },
      { type: "samurai", x: 600, y: -410 },
      { type: "ninja", x: 1000, y: -350 },
      { type: "oni", x: 1200, y: -350 },
      { type: "samurai", x: 1550, y: -300 },
    ],
    shadows: [],
    playerStart: 60,
    deco: [{ type: "lantern", x: 590 }, { type: "lantern", x: 590 }],
  },

  // ── Room 6: Ninja gauntlet — shurikens from every angle ──
  {
    platforms: [
      { x: 0, y: 0, w: 2500 },
      { x: 300, y: -120, w: 160 },
      { x: 700, y: -100, w: 160 },
      { x: 1100, y: -130, w: 160 },
      { x: 1500, y: -110, w: 160 },
      { x: 1900, y: -120, w: 160 },
    ],
    enemies: [
      { type: "ninja", x: 380, y: -120 },
      { type: "oni", x: 500, y: 0 },
      { type: "ninja", x: 780, y: -100 },
      { type: "oni", x: 900, y: 0 },
      { type: "ninja", x: 1180, y: -130 },
      { type: "oni", x: 1300, y: 0 },
      { type: "ninja", x: 1580, y: -110 },
      { type: "oni", x: 1700, y: 0 },
      { type: "ninja", x: 1980, y: -120 },
      { type: "samurai", x: 2200, y: 0 },
    ],
    shadows: [],
    playerStart: 50,
    deco: [{ type: "torii", x: 600 }, { type: "torii", x: 1200 }, { type: "torii", x: 1800 }],
  },

  // ── Room 7: Canyon — wall jump between narrow gaps ──
  {
    platforms: [
      { x: 0, y: 0, w: 350 },
      // Canyon walls
      { x: 350, y: -200, w: 20, h: 210, wall: true },
      { x: 500, y: -200, w: 20, h: 210, wall: true },
      { x: 350, y: -210, w: 190 },
      // Second canyon
      { x: 600, y: -100, w: 200 },
      { x: 850, y: -200, w: 20, h: 210, wall: true },
      { x: 1000, y: -200, w: 20, h: 210, wall: true },
      { x: 850, y: -210, w: 170 },
      // End area
      { x: 1100, y: -150, w: 200 },
      { x: 1350, y: -100, w: 200 },
      { x: 1600, y: 0, w: 400 },
    ],
    enemies: [
      { type: "oni", x: 200, y: 0 },
      { type: "ninja", x: 450, y: -210 },
      { type: "oni", x: 700, y: -100 },
      { type: "ninja", x: 950, y: -210 },
      { type: "samurai", x: 1200, y: -150 },
      { type: "oni", x: 1450, y: -100 },
      { type: "oni", x: 1700, y: 0 },
      { type: "samurai", x: 1850, y: 0 },
    ],
    shadows: [],
    playerStart: 50,
    deco: [{ type: "lantern", x: 435 }, { type: "lantern", x: 935 }],
  },

  // ── Room 8: Fortress — complex multi-level structure ──
  {
    platforms: [
      { x: 0, y: 0, w: 500 },
      { x: 500, y: -60, w: 400 },
      { x: 900, y: -120, w: 400 },
      { x: 700, y: -200, w: 300 },
      { x: 1100, y: -200, w: 20, h: 90, wall: true },
      { x: 1300, y: 0, w: 500 },
      { x: 1300, y: -140, w: 300 },
      { x: 1650, y: -80, w: 200 },
      { x: 1900, y: 0, w: 400 },
      { x: 2000, y: -150, w: 200 },
    ],
    enemies: [
      { type: "oni", x: 300, y: 0 },
      { type: "ninja", x: 700, y: -60 },
      { type: "samurai", x: 1000, y: -120 },
      { type: "ninja", x: 850, y: -200 },
      { type: "oni", x: 1400, y: 0 },
      { type: "oni", x: 1500, y: -140 },
      { type: "samurai", x: 1750, y: -80 },
      { type: "oni", x: 2000, y: 0 },
      { type: "ninja", x: 2100, y: -150 },
      { type: "samurai", x: 2200, y: 0 },
    ],
    shadows: [],
    playerStart: 50,
    deco: [{ type: "torii", x: 650 }, { type: "lantern", x: 1000 }, { type: "torii", x: 1800 }],
  },

  // ── Room 9: The gauntlet — long, relentless, everything ──
  {
    platforms: [
      { x: 0, y: 0, w: 800 },
      { x: 600, y: -80, w: 250 },
      { x: 900, y: 0, w: 400 },
      // Wall jump section
      { x: 1300, y: -250, w: 20, h: 260, wall: true },
      { x: 1450, y: -250, w: 20, h: 260, wall: true },
      { x: 1280, y: -260, w: 210 },
      // Upper path
      { x: 1500, y: -200, w: 400 },
      { x: 1950, y: -130, w: 300 },
      // Lower path continues
      { x: 1500, y: 0, w: 400 },
      { x: 1950, y: 0, w: 400 },
      // Final arena
      { x: 2400, y: 0, w: 600 },
      { x: 2550, y: -100, w: 200 },
    ],
    enemies: [
      { type: "oni", x: 300, y: 0 },
      { type: "oni", x: 500, y: 0 },
      { type: "ninja", x: 725, y: -80 },
      { type: "oni", x: 1000, y: 0 },
      { type: "samurai", x: 1200, y: 0 },
      { type: "ninja", x: 1380, y: -260 },
      { type: "oni", x: 1650, y: -200 },
      { type: "oni", x: 1800, y: -200 },
      { type: "samurai", x: 2050, y: -130 },
      { type: "oni", x: 1650, y: 0 },
      { type: "ninja", x: 2100, y: 0 },
      { type: "oni", x: 2550, y: 0 },
      { type: "samurai", x: 2700, y: 0 },
      { type: "samurai", x: 2850, y: 0 },
    ],
    shadows: [],
    playerStart: 50,
    deco: [{ type: "torii", x: 400 }, { type: "lantern", x: 1385 }, { type: "torii", x: 2500 }],
  },

  // ── Room 10: Boss arena — wide open with pillars ──
  {
    platforms: [
      { x: 0, y: 0, w: 2000 },
      // Pillars for wall jumping
      { x: 400, y: -180, w: 25, h: 190, wall: true },
      { x: 400, y: -190, w: 100 },
      { x: 800, y: -180, w: 25, h: 190, wall: true },
      { x: 800, y: -190, w: 100 },
      { x: 1200, y: -180, w: 25, h: 190, wall: true },
      { x: 1200, y: -190, w: 100 },
      { x: 1600, y: -180, w: 25, h: 190, wall: true },
      { x: 1600, y: -190, w: 100 },
    ],
    enemies: [
      { type: "oni", x: 300, y: 0 },
      { type: "samurai", x: 600, y: 0 },
      { type: "ninja", x: 450, y: -190 },
      { type: "samurai", x: 900, y: 0 },
      { type: "ninja", x: 850, y: -190 },
      { type: "samurai", x: 1100, y: 0 },
      { type: "oni", x: 1400, y: 0 },
      { type: "samurai", x: 1700, y: 0 },
      { type: "ninja", x: 1650, y: -190 },
    ],
    shadows: [],
    playerStart: 60,
    deco: [{ type: "torii", x: 200 }, { type: "torii", x: 1000 }, { type: "torii", x: 1800 }],
  },
];

export const SEGMENTS = ROOMS.map(r => ({
  w: Math.max(...r.platforms.map(p => p.x + p.w)),
  platforms: r.platforms,
  enemies: r.enemies,
  deco: r.deco || [],
}));
