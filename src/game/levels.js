// ═══ ROOM DEFINITIONS ═══
// Each room scrolls horizontally. Platforms with wall:true have side collision
// for wall jumping. Rooms get progressively longer and more complex.
//
// Platform types:
//   { x, y, w }               — standard thin platform (land on top only)
//   { x, y, w, h, wall:true } — solid wall block (blocks movement, wall-jumpable)
//
// Wall shafts: walls are open at bottom for entry. Player jumps up into shaft,
// bounces between walls to climb, exits at the top platform.

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

  // ── Room 3: Wall jump intro — step up, enter shaft, climb to top ──
  {
    platforms: [
      { x: 0, y: 0, w: 550 },
      // Step platforms leading to shaft entry
      { x: 400, y: -70, w: 160 },
      { x: 520, y: -140, w: 160 },
      // Wall shaft — open at bottom (walls start at -210, step is at -140, so 70px entry gap)
      // Player jumps from step into the shaft and bounces up
      { x: 540, y: -380, w: 35, h: 170, wall: true },  // left wall (170px tall, starts above entry)
      { x: 695, y: -380, w: 35, h: 170, wall: true },  // right wall (120px inner gap)
      // Top platform — exit from shaft
      { x: 520, y: -390, w: 230 },
      // Continue right at height
      { x: 760, y: -390, w: 500 },
      { x: 1310, y: -390, w: 300 },
      // Ground continues right
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

  // ── Room 5: Tower — climb the shaft with wall jumps ──
  {
    platforms: [
      { x: 0, y: 0, w: 450 },
      // Entry step
      { x: 380, y: -80, w: 160 },
      // Tower shaft — open at bottom, walls start above the step
      { x: 420, y: -420, w: 35, h: 280, wall: true },   // left wall
      { x: 575, y: -420, w: 35, h: 280, wall: true },   // right wall (120px inner gap)
      // Rest ledge halfway up (inside shaft, narrow)
      { x: 455, y: -250, w: 120 },
      // Top exit
      { x: 400, y: -430, w: 230 },
      // Continue right from tower top
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

  // ── Room 7: Canyon — two wall-jump shafts in sequence ──
  {
    platforms: [
      { x: 0, y: 0, w: 400 },
      // First canyon — entry step, shaft, top platform
      { x: 320, y: -70, w: 140 },
      { x: 380, y: -280, w: 35, h: 170, wall: true },   // left wall
      { x: 535, y: -280, w: 35, h: 170, wall: true },   // right wall
      { x: 360, y: -290, w: 230 },                       // top exit
      // Bridge between canyons
      { x: 600, y: -200, w: 200 },
      { x: 700, y: -100, w: 150 },
      // Second canyon
      { x: 880, y: -280, w: 35, h: 170, wall: true },
      { x: 1035, y: -280, w: 35, h: 170, wall: true },
      { x: 860, y: -290, w: 230 },
      // End area — descend
      { x: 1100, y: -200, w: 200 },
      { x: 1350, y: -100, w: 200 },
      { x: 1600, y: 0, w: 400 },
    ],
    enemies: [
      { type: "oni", x: 200, y: 0 },
      { type: "ninja", x: 480, y: -290 },
      { type: "oni", x: 700, y: -200 },
      { type: "ninja", x: 980, y: -290 },
      { type: "samurai", x: 1200, y: -200 },
      { type: "oni", x: 1450, y: -100 },
      { type: "oni", x: 1700, y: 0 },
      { type: "samurai", x: 1850, y: 0 },
    ],
    shadows: [],
    playerStart: 50,
    deco: [{ type: "lantern", x: 460 }, { type: "lantern", x: 960 }],
  },

  // ── Room 8: Fortress — complex multi-level structure ──
  {
    platforms: [
      { x: 0, y: 0, w: 500 },
      { x: 500, y: -60, w: 400 },
      { x: 900, y: -120, w: 400 },
      { x: 700, y: -200, w: 300 },
      // Short wall obstacle
      { x: 1100, y: -200, w: 30, h: 90, wall: true },
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

  // ── Room 9: The gauntlet — wall jump section mid-run ──
  {
    platforms: [
      { x: 0, y: 0, w: 800 },
      { x: 600, y: -80, w: 250 },
      { x: 900, y: 0, w: 400 },
      // Entry step to wall shaft
      { x: 1250, y: -80, w: 150 },
      // Wall jump section (120px inner gap, open at bottom)
      { x: 1320, y: -320, w: 35, h: 200, wall: true },
      { x: 1475, y: -320, w: 35, h: 200, wall: true },
      { x: 1300, y: -330, w: 230 },
      // Upper path
      { x: 1540, y: -260, w: 400 },
      { x: 1990, y: -180, w: 300 },
      // Lower path continues
      { x: 1540, y: 0, w: 400 },
      { x: 1990, y: 0, w: 400 },
      // Final arena
      { x: 2440, y: 0, w: 600 },
      { x: 2590, y: -100, w: 200 },
    ],
    enemies: [
      { type: "oni", x: 300, y: 0 },
      { type: "oni", x: 500, y: 0 },
      { type: "ninja", x: 725, y: -80 },
      { type: "oni", x: 1000, y: 0 },
      { type: "samurai", x: 1200, y: 0 },
      { type: "ninja", x: 1400, y: -330 },
      { type: "oni", x: 1700, y: -260 },
      { type: "oni", x: 1850, y: -260 },
      { type: "samurai", x: 2100, y: -180 },
      { type: "oni", x: 1700, y: 0 },
      { type: "ninja", x: 2150, y: 0 },
      { type: "oni", x: 2600, y: 0 },
      { type: "samurai", x: 2750, y: 0 },
      { type: "samurai", x: 2900, y: 0 },
    ],
    shadows: [],
    playerStart: 50,
    deco: [{ type: "torii", x: 400 }, { type: "lantern", x: 1400 }, { type: "torii", x: 2500 }],
  },

  // ── Room 10: Boss arena — pillars with wall-jump tops ──
  {
    platforms: [
      { x: 0, y: 0, w: 2000 },
      // Pillars — solid columns you can wall-jump up and land on top
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
