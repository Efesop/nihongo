// ═══ LEVEL SEGMENTS ═══
// Each segment defines platforms (relative y: 0 = ground, negative = above),
// enemies, and decorations. Segments are chained left-to-right.

export const SEGMENTS = [
  // 0: Intro — flat, one oni, learn to slash
  {
    w: 800,
    platforms: [{ x: 0, y: 0, w: 800 }],
    enemies: [{ type: "oni", x: 500, y: 0 }],
    deco: [{ type: "lantern", x: 200 }, { type: "torii", x: 600 }],
  },
  // 1: Gaps — learn to jump
  {
    w: 900,
    platforms: [{ x: 0, y: 0, w: 300 }, { x: 380, y: 0, w: 200 }, { x: 660, y: 0, w: 240 }],
    enemies: [{ type: "oni", x: 200, y: 0 }, { type: "oni", x: 700, y: 0 }],
    deco: [{ type: "sign", x: 100 }],
  },
  // 2: Elevated platforms
  {
    w: 1000,
    platforms: [{ x: 0, y: 0, w: 400 }, { x: 250, y: -80, w: 180 }, { x: 500, y: -60, w: 200 }, { x: 780, y: 0, w: 220 }],
    enemies: [{ type: "oni", x: 300, y: -80 }, { type: "ninja", x: 550, y: -60 }],
    deco: [{ type: "lantern", x: 150 }, { type: "lantern", x: 850 }],
  },
  // 3: Ninja ambush
  {
    w: 800,
    platforms: [{ x: 0, y: 0, w: 800 }, { x: 200, y: -100, w: 120 }, { x: 500, y: -120, w: 120 }],
    enemies: [{ type: "ninja", x: 250, y: -100 }, { type: "ninja", x: 550, y: -120 }, { type: "oni", x: 650, y: 0 }],
    deco: [{ type: "torii", x: 400 }],
  },
  // 4: Rooftop jumps
  {
    w: 1100,
    platforms: [{ x: 0, y: 0, w: 200 }, { x: 280, y: -40, w: 160 }, { x: 520, y: -80, w: 160 }, { x: 760, y: -40, w: 160 }, { x: 960, y: 0, w: 140 }],
    enemies: [{ type: "ninja", x: 340, y: -40 }, { type: "oni", x: 580, y: -80 }, { type: "ninja", x: 820, y: -40 }],
    deco: [{ type: "sign", x: 50 }, { type: "lantern", x: 500 }],
  },
  // 5: Samurai intro
  {
    w: 700,
    platforms: [{ x: 0, y: 0, w: 700 }],
    enemies: [{ type: "oni", x: 250, y: 0 }, { type: "samurai", x: 500, y: 0 }],
    deco: [{ type: "torii", x: 350 }, { type: "lantern", x: 600 }],
  },
  // 6: Vertical challenge
  {
    w: 900,
    platforms: [{ x: 0, y: 0, w: 250 }, { x: 150, y: -90, w: 150 }, { x: 400, y: -50, w: 200 }, { x: 700, y: 0, w: 200 }],
    enemies: [{ type: "ninja", x: 200, y: -90 }, { type: "samurai", x: 450, y: -50 }, { type: "oni", x: 750, y: 0 }],
    deco: [{ type: "lantern", x: 100 }],
  },
  // 7: Bridge
  {
    w: 1000,
    platforms: [{ x: 0, y: 0, w: 150 }, { x: 200, y: -20, w: 600 }, { x: 850, y: 0, w: 150 }],
    enemies: [{ type: "oni", x: 350, y: -20 }, { type: "ninja", x: 550, y: -20 }, { type: "samurai", x: 700, y: -20 }],
    deco: [{ type: "sign", x: 50 }, { type: "sign", x: 900 }],
  },
  // 8: Gauntlet
  {
    w: 1200,
    platforms: [{ x: 0, y: 0, w: 1200 }, { x: 300, y: -80, w: 100 }, { x: 600, y: -80, w: 100 }, { x: 900, y: -80, w: 100 }],
    enemies: [
      { type: "oni", x: 200, y: 0 }, { type: "ninja", x: 350, y: -80 },
      { type: "oni", x: 500, y: 0 }, { type: "ninja", x: 650, y: -80 },
      { type: "samurai", x: 800, y: 0 }, { type: "oni", x: 1000, y: 0 },
    ],
    deco: [{ type: "torii", x: 100 }, { type: "torii", x: 1100 }],
  },
  // 9: Boss — three samurai
  {
    w: 800,
    platforms: [{ x: 0, y: 0, w: 800 }],
    enemies: [{ type: "samurai", x: 300, y: 0 }, { type: "samurai", x: 500, y: 0 }, { type: "samurai", x: 650, y: 0 }],
    deco: [{ type: "torii", x: 100 }, { type: "torii", x: 700 }, { type: "lantern", x: 400 }],
  },
];
