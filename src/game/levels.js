// ═══ ROOM DEFINITIONS ═══
// Each room scrolls horizontally. Platforms with wall:true have side collision
// for wall jumping. Rooms get progressively longer and more complex.
//
// Platform types:
//   { x, y, w }               — standard thin platform (land on top only)
//   { x, y, w, h, wall:true } — solid wall block (blocks movement, wall-jumpable)
//   { x, y, w, oneWay:true }  — one-way platform (jump through from below, land on top)
//
// Moving platforms (separate array):
//   { x, y, w, moveX, moveY, speed, offset, oneWay }
//
// Hide spots (stealth):
//   { type: "tallGrass"|"crate"|"barrel", x, w }
//
// Tutorial fields:
//   title: { jp, en }         — room title shown on entry

// Helper: generate a staircase as a series of one-way platforms
export function makeStairs(startX, startY, endX, endY, steps = 6) {
  const dx = (endX - startX) / steps;
  const dy = (endY - startY) / steps;
  return Array.from({ length: steps }, (_, i) => ({
    x: startX + dx * i, y: startY + dy * i, w: dx + 4, oneWay: true,
  }));
}
//   tutorials: [{ text, trigger }] — tutorial prompts
//     trigger: "start" | "nearEnemy" | "nearWall" | "nearGap" | "shurikens"

export const ROOMS = [
  // ════════════════════════════════════════════════════
  // PROLOGUE: THE DOJO — Tutorial Rooms (0-4)
  // Training with Sensei. The tutorial IS the story.
  // ════════════════════════════════════════════════════

  // ── Room 0: "修行 Training" — learn MOVE + SLASH ──
  // Early morning dojo. Warm lanterns, scrolls on walls. Sensei waits with tea.
  // Walk through the dojo → talk to sensei → slash training posts → exit.
  {
    title: { jp: "修行", en: "Training" },
    theme: "dojo",
    platforms: [
      { x: 0, y: 0, w: 1200 },
    ],
    enemies: [],
    npcs: [
      { charKey: "sensei", x: 600, facing: -1, dialogueKey: 0, stayForever: true, triggerRange: 100 },
    ],
    shadows: [],
    playerStart: 80,
    deco: [
      { type: "lantern", x: 100 }, { type: "lantern", x: 500 }, { type: "lantern", x: 1000 },
      { type: "scroll", x: 200 }, { type: "scroll", x: 800 },
      { type: "weapon_rack", x: 350 },
    ],
    breakables: [
      // Training targets — bamboo practice posts along the way
      { type: "bamboo", x: 750, y: 0, w: 40, h: 60, hp: 2 },
      { type: "bamboo", x: 900, y: 0, w: 40, h: 60, hp: 2 },
      // Crate blocks exit — MUST slash to pass
      { type: "crate", x: 1060, y: 0, w: 35, h: 40, hp: 1 },
    ],
    objective: { type: "parkour", time: 120, exitX: 1100 },
    tutorials: [
      { text: "← → to move    (A/D)", trigger: "start" },
      { text: "Walk to Sensei to talk", trigger: "start" },
      { text: "J or Z to slash!", trigger: "nearEnemy" },
    ],
  },

  // ── Room 1: "跳躍 Take Flight" — learn JUMP ──
  // Elevated wooden training platforms — like balance beams at different heights.
  // Dummies stand on each platform as targets. Must jump gaps to reach them.
  {
    title: { jp: "跳躍", en: "Take Flight" },
    theme: "dojo",
    platforms: [
      // Ground level — starting area
      { x: 0, y: 0, w: 400 },
      // First training platform — low wooden beam
      { x: 550, y: -50, w: 280 },
      // Second platform — higher, narrower
      { x: 980, y: -110, w: 200 },
      // Landing area — back to ground
      { x: 1350, y: 0, w: 350 },
    ],
    enemies: [
      { type: "dummy", x: 680, y: -50, passive: true },
      { type: "dummy", x: 1070, y: -110, passive: true },
    ],
    shadows: [],
    playerStart: 80,
    deco: [
      { type: "lantern", x: 200 }, { type: "lantern", x: 850 }, { type: "lantern", x: 1500 },
      { type: "scroll", x: 100 },
      { type: "weapon_rack", x: 1450 },
    ],
    breakables: [
      { type: "pot", x: 350, y: 0, w: 25, h: 30, hp: 1 },
    ],
    tutorials: [
      { text: "↑ / W / Space to jump", trigger: "nearGap" },
    ],
  },

  // ── Room 2: "閃光 Phase Through" — learn DASH + DASH-SLASH ──
  // A long practice corridor with a shielded training dummy at the far end.
  // Bamboo posts line the path for atmosphere. Torii gate marks the challenge.
  // The dummy blocks ALL normal attacks — only dash+slash breaks through.
  {
    title: { jp: "閃光", en: "Phase Through" },
    theme: "dojo",
    platforms: [
      { x: 0, y: 0, w: 1400 },
    ],
    enemies: [
      // Shielded dummy — deflects normal slash, only dash-slash works
      { type: "dummy", x: 900, y: 0, passive: true, shielded: true },
    ],
    shadows: [],
    playerStart: 80,
    deco: [
      { type: "lantern", x: 150 }, { type: "lantern", x: 600 }, { type: "lantern", x: 1200 },
      { type: "torii", x: 700 },
      { type: "scroll", x: 300 },
    ],
    breakables: [
      // Bamboo posts lining the dash corridor
      { type: "bamboo", x: 350, y: 0, w: 30, h: 50, hp: 1 },
      { type: "bamboo", x: 500, y: 0, w: 30, h: 50, hp: 1 },
    ],
    tutorials: [
      { text: "L or C to dash forward", trigger: "start" },
      { text: "Slash DURING dash to break its guard!", trigger: "nearEnemy" },
    ],
  },

  // ── Room 3: "壁走 Wall Runner" — learn WALL JUMP ──
  // A vertical climbing tower inside the dojo. Two wooden pillars form a shaft.
  // Must wall jump between them to reach the top training platform.
  // Lanterns mounted at different heights light the way up.
  {
    title: { jp: "壁走", en: "Wall Runner" },
    theme: "dojo",
    platforms: [
      // Ground
      { x: 0, y: 0, w: 500 },
      // Step up to the shaft entrance
      { x: 400, y: -70, w: 160 },
      // Wooden pillar shaft — wall jump between these
      { x: 500, y: -350, w: 35, h: 230, wall: true },
      { x: 635, y: -350, w: 35, h: 230, wall: true },
      // Top training area
      { x: 480, y: -360, w: 230 },
      { x: 720, y: -360, w: 500 },
    ],
    enemies: [
      { type: "dummy", x: 950, y: -360, passive: true },
    ],
    shadows: [],
    playerStart: 80,
    deco: [
      { type: "lantern", x: 200 }, { type: "lantern", x: 560 },
      { type: "lantern", x: 800 }, { type: "lantern", x: 1100 },
      { type: "scroll", x: 100 },
      { type: "weapon_rack", x: 850 },
    ],
    breakables: [
      { type: "pot", x: 300, y: 0, w: 25, h: 30, hp: 1 },
      { type: "pot", x: 780, y: -360, w: 25, h: 30, hp: 1 },
    ],
    tutorials: [
      { text: "Jump into walls, press ↑ to wall jump!", trigger: "nearWall" },
    ],
  },

  // ── Room 4: "集中 Bullet Time" — learn SLOW-MO / FOCUS ──
  // Sensei throws shurikens from the far end — his final test.
  // Must use slow-mo to see and dodge. Dummy at the end to kill.
  {
    title: { jp: "集中", en: "Bullet Time" },
    theme: "dojo",
    platforms: [
      { x: 0, y: 0, w: 2000 },
      // Cover ledges between shuriken zones
      { x: 450, y: -50, w: 80 },
      { x: 800, y: -50, w: 80 },
      { x: 1100, y: -50, w: 80 },
    ],
    enemies: [
      { type: "dummy", x: 1700, y: 0, passive: true },
    ],
    npcs: [
      // Sensei at the far end — throws shurikens at the player as training
      { charKey: "sensei", x: 1850, facing: -1, stayForever: true },
    ],
    shadows: [],
    playerStart: 80,
    deco: [
      { type: "lantern", x: 100 }, { type: "lantern", x: 550 },
      { type: "lantern", x: 950 }, { type: "lantern", x: 1400 }, { type: "lantern", x: 1800 },
      { type: "torii", x: 250 },
      { type: "scroll", x: 1600 },
      { type: "weapon_rack", x: 1850 },
    ],
    breakables: [
      { type: "pot", x: 350, y: 0, w: 25, h: 30, hp: 1 },
      { type: "crate", x: 1500, y: 0, w: 35, h: 40, hp: 1 },
    ],
    hazards: [
      // Sensei throws shurikens from the far end at different heights/speeds
      { type: "shuriken_launcher", x: 1800, y: -30, direction: -1, interval: 1400, speed: 320 },
      { type: "shuriken_launcher", x: 1800, y: -55, direction: -1, interval: 1100, speed: 370 },
      { type: "shuriken_launcher", x: 1800, y: -80, direction: -1, interval: 900, speed: 350 },
    ],
    tutorials: [
      { text: "Hold K / X / Shift for slow-motion!", trigger: "shurikens" },
      { text: "Slow time to dodge the shurikens!", trigger: "start" },
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

  // ════════════════════════════════════════════════════
  // ACT 2: EDO CASTLE TOWN (Rooms 20-26)
  // Time rift. Rooftops, markets, castle corridors.
  // Stealth rooms, one-way platforms, new enemy types.
  // ════════════════════════════════════════════════════

  // ── Room 20: "城下町 Castle Town" — Rooftop arrival ──
  {
    title: { jp: "城下町", en: "Castle Town" },
    theme: "edo",
    platforms: [
      { x: 0, y: 0, w: 600 },
      { x: 700, y: -40, w: 200, oneWay: true },
      { x: 1000, y: -80, w: 200, oneWay: true },
      { x: 1300, y: -40, w: 300 },
      { x: 1700, y: 0, w: 500 },
    ],
    enemies: [
      { type: "oni", x: 400, y: 0 },
      { type: "samurai", x: 1400, y: -40 },
      { type: "oni", x: 1900, y: 0 },
    ],
    shadows: [{ x: 200, w: 120 }],
    hideSpots: [{ type: "crate", x: 550, w: 50 }],
    playerStart: 60,
    deco: [{ type: "lantern", x: 300 }, { type: "sign", x: 1100 }, { type: "lantern", x: 1800 }],
  },

  // ── Room 21: "市場 Market" — Stealth through market stalls ──
  {
    title: { jp: "市場", en: "Market Street" },
    theme: "edo",
    platforms: [
      { x: 0, y: 0, w: 2200 },
      { x: 300, y: -60, w: 100, oneWay: true },
      { x: 600, y: -60, w: 100, oneWay: true },
      { x: 900, y: -60, w: 100, oneWay: true },
      { x: 1200, y: -100, w: 150, oneWay: true },
      { x: 1500, y: -60, w: 100, oneWay: true },
      { x: 1800, y: -60, w: 100, oneWay: true },
    ],
    enemies: [
      { type: "oni", x: 500, y: 0 },
      { type: "samurai", x: 800, y: 0 },
      { type: "oni", x: 1100, y: 0 },
      { type: "samurai", x: 1600, y: 0 },
      { type: "oni", x: 1900, y: 0 },
    ],
    shadows: [{ x: 350, w: 80 }, { x: 950, w: 80 }, { x: 1550, w: 80 }],
    hideSpots: [
      { type: "tallGrass", x: 250, w: 80 },
      { type: "crate", x: 850, w: 50 },
      { type: "barrel", x: 1450, w: 50 },
    ],
    playerStart: 60,
    deco: [{ type: "lantern", x: 200 }, { type: "sign", x: 700 }, { type: "lantern", x: 1300 }, { type: "sign", x: 1850 }],
    objective: { type: "stealth", exitX: 2100, maxAlerts: 1 },
  },

  // ── Room 22: "城壁 Castle Wall" — Vertical climb with archers ──
  {
    title: { jp: "城壁", en: "Castle Wall" },
    theme: "edo",
    platforms: [
      { x: 0, y: 0, w: 600 },
      { x: 700, y: -80, w: 200 },
      { x: 200, y: -180, w: 200, oneWay: true },
      { x: 500, y: -280, w: 200 },
      { x: 800, y: -360, w: 300 },
      { x: 100, y: -360, w: 35, h: 280, wall: true },
      { x: 1200, y: -200, w: 35, h: 200, wall: true },
      { x: 1300, y: 0, w: 400 },
    ],
    movingPlatforms: [
      { x: 1000, y: -150, w: 80, moveX: 0, moveY: -100, speed: 0.4 },
    ],
    enemies: [
      { type: "archer", x: 800, y: -360 },
      { type: "oni", x: 400, y: 0 },
      { type: "samurai", x: 700, y: -80 },
      { type: "archer", x: 1400, y: 0 },
    ],
    shadows: [],
    playerStart: 60,
    deco: [{ type: "lantern", x: 300 }],
    hazards: [{ type: "spikes", x: 900, y: 0, w: 80 }],
  },

  // ── Room 23: "廊下 Castle Corridor" — Tight stealth ──
  {
    title: { jp: "廊下", en: "Corridor" },
    theme: "edo",
    platforms: [
      { x: 0, y: 0, w: 2000 },
      { x: 400, y: -80, w: 150, oneWay: true },
      { x: 800, y: -80, w: 150, oneWay: true },
      { x: 1200, y: -80, w: 150, oneWay: true },
    ],
    enemies: [
      { type: "samurai", x: 300, y: 0 },
      { type: "dummy", x: 700, y: 0, passive: true },
      { type: "samurai", x: 1100, y: 0 },
      { type: "samurai", x: 1500, y: 0 },
      { type: "oni", x: 1800, y: 0 },
    ],
    shadows: [{ x: 150, w: 100 }, { x: 550, w: 100 }, { x: 950, w: 100 }, { x: 1350, w: 100 }],
    hideSpots: [
      { type: "crate", x: 100, w: 50 },
      { type: "barrel", x: 500, w: 50 },
      { type: "crate", x: 900, w: 50 },
      { type: "barrel", x: 1300, w: 50 },
    ],
    playerStart: 40,
    deco: [{ type: "lantern", x: 250 }, { type: "lantern", x: 650 }, { type: "lantern", x: 1050 }, { type: "lantern", x: 1450 }],
    objective: { type: "stealth", exitX: 1900, maxAlerts: 0 },
  },

  // ── Room 24: "中庭 Inner Court" — Open combat arena + survive ──
  {
    title: { jp: "中庭", en: "Inner Court" },
    theme: "edo",
    platforms: [
      { x: 0, y: 0, w: 2500 },
      { x: 400, y: -100, w: 200 },
      { x: 800, y: -60, w: 150, oneWay: true },
      { x: 1200, y: -120, w: 200 },
      { x: 1600, y: -60, w: 150, oneWay: true },
      { x: 2000, y: -100, w: 200 },
    ],
    enemies: [{ type: "oni", x: 300, y: 0 }],
    shadows: [],
    playerStart: 60,
    deco: [{ type: "torii", x: 200 }, { type: "lantern", x: 1000 }, { type: "torii", x: 1800 }],
    breakables: [
      { type: "crate", x: 600, y: 0, w: 40, h: 40 },
      { type: "lantern", x: 1000, y: 0, w: 28, h: 36 },
      { type: "pot", x: 1400, y: 0, w: 24, h: 28 },
      { type: "crate", x: 1800, y: 0, w: 40, h: 40 },
    ],
    objective: { type: "survive", waves: [
      [{ type: "oni", x: 500 }, { type: "oni", x: 1500 }, { type: "samurai", x: 1000 }],
      [{ type: "samurai", x: 400 }, { type: "archer", x: 1200 }, { type: "oni", x: 800 }, { type: "oni", x: 1800 }],
      [{ type: "samurai", x: 600 }, { type: "samurai", x: 1400 }, { type: "brute", x: 1000 }],
    ]},
  },

  // ── Room 25: "天守 Castle Keep" — Multi-level + boss ──
  {
    title: { jp: "天守", en: "Castle Keep" },
    theme: "edo",
    platforms: [
      { x: 0, y: 0, w: 2000 },
      ...makeStairs(200, -20, 600, -120, 5),
      { x: 600, y: -120, w: 400 },
      { x: 1100, y: -80, w: 200, oneWay: true },
      { x: 1400, y: -160, w: 300 },
      { x: 300, y: -240, w: 200, oneWay: true },
      { x: 700, y: -280, w: 400 },
    ],
    enemies: [
      { type: "samurai", x: 400, y: 0 },
      { type: "archer", x: 800, y: -120 },
      { type: "samurai", x: 1500, y: -160 },
      { type: "oni", x: 900, y: -280 },
      { type: "brute", x: 1200, y: 0 },
      { type: "samurai", x: 1800, y: 0 },
    ],
    shadows: [{ x: 100, w: 100 }],
    playerStart: 60,
    deco: [{ type: "torii", x: 150 }, { type: "lantern", x: 700 }, { type: "torii", x: 1600 }],
    hazards: [
      { type: "spikes", x: 1000, y: 0, w: 80 },
      { type: "firejet", x: 1300, y: -160, w: 30, h: 80, onTime: 1200, offTime: 1800, offset: 0 },
    ],
  },

  // ── Room 26: "桂の間 Katsura's Chamber" — Boss arena ──
  {
    title: { jp: "桂の間", en: "Katsura's Chamber" },
    theme: "edo",
    platforms: [
      { x: 0, y: 0, w: 2200 },
      { x: 300, y: -100, w: 200, oneWay: true },
      { x: 700, y: -150, w: 200, oneWay: true },
      { x: 1100, y: -100, w: 200, oneWay: true },
      { x: 1500, y: -150, w: 200, oneWay: true },
      { x: 1900, y: -100, w: 200, oneWay: true },
    ],
    enemies: [
      { type: "samurai", x: 500, y: 0 },
      { type: "brute", x: 1000, y: 0 },
      { type: "samurai", x: 1300, y: 0 },
      { type: "archer", x: 800, y: -150 },
      { type: "archer", x: 1600, y: -150 },
      { type: "samurai", x: 1800, y: 0 },
    ],
    shadows: [],
    playerStart: 60,
    deco: [{ type: "torii", x: 200 }, { type: "lantern", x: 600 }, { type: "torii", x: 1100 }, { type: "lantern", x: 1700 }],
    breakables: [
      { type: "crate", x: 400, y: 0, w: 40, h: 40 },
      { type: "lantern", x: 900, y: 0, w: 28, h: 36 },
      { type: "crate", x: 1400, y: 0, w: 40, h: 40 },
    ],
  },

  // ════════════════════════════════════════════════════
  // ACT 3: NEON TOKYO (Rooms 27-33)
  // Cyberpunk streets. Rain. Neon signs as platforms.
  // ════════════════════════════════════════════════════

  // ── Room 27: "ネオン通り Neon Street" — Arrival ──
  {
    title: { jp: "ネオン通り", en: "Neon Street" },
    theme: "neonTokyo",
    platforms: [
      { x: 0, y: 0, w: 800 },
      { x: 900, y: -40, w: 120, oneWay: true },
      { x: 1100, y: -80, w: 120, oneWay: true },
      { x: 1300, y: 0, w: 600 },
      { x: 2000, y: -60, w: 150, oneWay: true },
      { x: 2200, y: 0, w: 400 },
    ],
    enemies: [
      { type: "ninja", x: 600, y: 0 },
      { type: "ninja", x: 1500, y: 0 },
      { type: "oni", x: 2300, y: 0 },
    ],
    shadows: [{ x: 350, w: 100 }, { x: 1700, w: 80 }],
    playerStart: 60,
    deco: [{ type: "sign", x: 400 }, { type: "lantern", x: 1200 }, { type: "sign", x: 2100 }],
  },

  // ── Room 28: "路地裏 Alley Chase" — Parkour ──
  {
    title: { jp: "路地裏", en: "Alley Chase" },
    theme: "neonTokyo",
    platforms: [
      { x: 0, y: 0, w: 400 },
      { x: 500, y: -60, w: 120, oneWay: true },
      { x: 700, y: -120, w: 120, oneWay: true },
      { x: 900, y: -60, w: 200 },
      { x: 1200, y: -100, w: 120, oneWay: true },
      { x: 1400, y: -40, w: 200 },
      { x: 1700, y: -80, w: 120, oneWay: true },
      { x: 1900, y: 0, w: 300 },
      { x: 2300, y: -60, w: 200 },
      { x: 2600, y: 0, w: 300 },
    ],
    enemies: [
      { type: "ninja", x: 800, y: -60 },
      { type: "oni", x: 1300, y: -100 },
      { type: "ninja", x: 2000, y: 0 },
    ],
    shadows: [],
    playerStart: 60,
    deco: [{ type: "sign", x: 300 }, { type: "sign", x: 1100 }, { type: "sign", x: 2400 }],
    objective: { type: "parkour", time: 20, exitX: 2800 },
  },

  // ── Room 29: "高速道路 Highway" — Fast horizontal, drones ──
  {
    title: { jp: "高速道路", en: "Highway" },
    theme: "neonTokyo",
    platforms: [
      { x: 0, y: 0, w: 3000 },
      { x: 500, y: -80, w: 200 },
      { x: 1000, y: -120, w: 200 },
      { x: 1500, y: -80, w: 200 },
      { x: 2000, y: -120, w: 200 },
      { x: 2500, y: -80, w: 200 },
    ],
    movingPlatforms: [
      { x: 700, y: -60, w: 100, moveX: 150, moveY: 0, speed: 0.5 },
      { x: 1700, y: -60, w: 100, moveX: 150, moveY: 0, speed: 0.5, offset: 0.5 },
    ],
    enemies: [
      { type: "ninja", x: 400, y: 0 },
      { type: "tengu", x: 800, y: -200 },
      { type: "ninja", x: 1200, y: 0 },
      { type: "tengu", x: 1600, y: -200 },
      { type: "ninja", x: 2200, y: 0 },
      { type: "samurai", x: 2600, y: 0 },
    ],
    shadows: [],
    playerStart: 60,
    deco: [{ type: "sign", x: 300 }, { type: "sign", x: 1300 }, { type: "sign", x: 2300 }],
    hazards: [
      { type: "laser", x: 900, y: 0, w: 4, h: 200, onTime: 2000, offTime: 1500, offset: 0 },
      { type: "laser", x: 1900, y: 0, w: 4, h: 200, onTime: 2000, offTime: 1500, offset: 750 },
    ],
  },

  // ── Room 30: "地下通路 Underground" — Dark stealth ──
  {
    title: { jp: "地下通路", en: "Underground" },
    theme: "neonTokyo",
    platforms: [
      { x: 0, y: 0, w: 2400 },
      { x: 500, y: -60, w: 120, oneWay: true },
      { x: 1000, y: -60, w: 120, oneWay: true },
      { x: 1500, y: -60, w: 120, oneWay: true },
    ],
    enemies: [
      { type: "ninja", x: 400, y: 0 },
      { type: "samurai", x: 800, y: 0 },
      { type: "ninja", x: 1200, y: 0 },
      { type: "samurai", x: 1600, y: 0 },
      { type: "ninja", x: 2000, y: 0 },
    ],
    shadows: [{ x: 200, w: 120 }, { x: 700, w: 120 }, { x: 1100, w: 120 }, { x: 1700, w: 120 }],
    hideSpots: [
      { type: "crate", x: 300, w: 50 },
      { type: "barrel", x: 850, w: 50 },
      { type: "crate", x: 1350, w: 50 },
      { type: "barrel", x: 1850, w: 50 },
    ],
    playerStart: 60,
    deco: [{ type: "lantern", x: 250 }, { type: "lantern", x: 750 }, { type: "lantern", x: 1250 }],
    objective: { type: "stealth", exitX: 2300, maxAlerts: 1 },
    hazards: [
      { type: "laser", x: 600, y: 0, w: 4, h: 150, onTime: 1500, offTime: 2000, offset: 0 },
      { type: "laser", x: 1400, y: 0, w: 4, h: 150, onTime: 1500, offTime: 2000, offset: 1000 },
    ],
  },

  // ── Room 31: "アーケード Arcade" — Mixed combat ──
  {
    title: { jp: "アーケード", en: "Arcade" },
    theme: "neonTokyo",
    platforms: [
      { x: 0, y: 0, w: 2000 },
      { x: 400, y: -80, w: 150 },
      { x: 800, y: -120, w: 200 },
      { x: 1200, y: -80, w: 150 },
      { x: 1600, y: -120, w: 200 },
    ],
    enemies: [
      { type: "oni", x: 300, y: 0 },
      { type: "ninja", x: 600, y: -80 },
      { type: "samurai", x: 900, y: 0 },
      { type: "tengu", x: 1100, y: -200 },
      { type: "ninja", x: 1400, y: -80 },
      { type: "samurai", x: 1700, y: 0 },
    ],
    shadows: [],
    playerStart: 60,
    deco: [{ type: "sign", x: 200 }, { type: "sign", x: 1000 }, { type: "sign", x: 1800 }],
    breakables: [
      { type: "crate", x: 500, y: 0, w: 40, h: 40 },
      { type: "pot", x: 1000, y: 0, w: 24, h: 28 },
      { type: "crate", x: 1500, y: 0, w: 40, h: 40 },
    ],
  },

  // ── Room 32: "屋上庭園 Rooftop Garden" — Vertical gauntlet ──
  {
    title: { jp: "屋上庭園", en: "Rooftop Garden" },
    theme: "neonTokyo",
    platforms: [
      { x: 0, y: 0, w: 500 },
      { x: 200, y: -100, w: 35, h: 100, wall: true },
      { x: 500, y: -100, w: 35, h: 100, wall: true },
      { x: 300, y: -200, w: 200, oneWay: true },
      { x: 100, y: -300, w: 200 },
      { x: 400, y: -380, w: 300 },
      { x: 800, y: -300, w: 200 },
      { x: 800, y: 0, w: 400 },
    ],
    enemies: [
      { type: "ninja", x: 400, y: -380 },
      { type: "ninja", x: 200, y: -300 },
      { type: "samurai", x: 900, y: 0 },
      { type: "tengu", x: 600, y: -400 },
    ],
    shadows: [],
    playerStart: 60,
    deco: [{ type: "sign", x: 100 }],
  },

  // ── Room 33: "影の再会 Shadow Encounter" — Open arena + dialogue ──
  {
    title: { jp: "影の再会", en: "Shadow's Return" },
    theme: "neonTokyo",
    platforms: [
      { x: 0, y: 0, w: 2200 },
      { x: 400, y: -100, w: 200, oneWay: true },
      { x: 900, y: -150, w: 300 },
      { x: 1400, y: -100, w: 200, oneWay: true },
      { x: 1800, y: -80, w: 200 },
    ],
    enemies: [
      { type: "samurai", x: 500, y: 0 },
      { type: "brute", x: 1000, y: 0 },
      { type: "ninja", x: 700, y: -100 },
      { type: "ninja", x: 1500, y: -100 },
      { type: "samurai", x: 1900, y: 0 },
    ],
    shadows: [],
    playerStart: 60,
    deco: [{ type: "sign", x: 300 }, { type: "sign", x: 1200 }],
  },

  // ════════════════════════════════════════════════════
  // ACT 4: UNDERGROUND / NIGHTCLUB (Rooms 34-39)
  // Dark. Stealth-heavy. Neon purple lighting.
  // ════════════════════════════════════════════════════

  // ── Room 34: "下水道 Sewers" — Dark stealth entry ──
  {
    title: { jp: "下水道", en: "Sewers" },
    theme: "nightclub",
    platforms: [
      { x: 0, y: 0, w: 2000 },
      { x: 500, y: -80, w: 100, oneWay: true },
      { x: 1000, y: -80, w: 100, oneWay: true },
      { x: 1500, y: -80, w: 100, oneWay: true },
    ],
    enemies: [
      { type: "ninja", x: 400, y: 0 },
      { type: "oni", x: 800, y: 0 },
      { type: "ninja", x: 1200, y: 0 },
      { type: "oni", x: 1700, y: 0 },
    ],
    shadows: [{ x: 150, w: 150 }, { x: 600, w: 150 }, { x: 1050, w: 150 }, { x: 1550, w: 150 }],
    hideSpots: [
      { type: "barrel", x: 300, w: 50 },
      { type: "crate", x: 750, w: 50 },
      { type: "barrel", x: 1150, w: 50 },
      { type: "crate", x: 1650, w: 50 },
    ],
    playerStart: 40,
    deco: [{ type: "lantern", x: 200 }, { type: "lantern", x: 900 }],
    objective: { type: "stealth", exitX: 1900, maxAlerts: 1 },
  },

  // ── Room 35: "闇市 Black Market" — Mixed ──
  {
    title: { jp: "闇市", en: "Black Market" },
    theme: "nightclub",
    platforms: [
      { x: 0, y: 0, w: 2400 },
      { x: 400, y: -100, w: 200, oneWay: true },
      { x: 800, y: -60, w: 150 },
      { x: 1200, y: -120, w: 200, oneWay: true },
      { x: 1600, y: -60, w: 150 },
      { x: 2000, y: -100, w: 200, oneWay: true },
    ],
    enemies: [
      { type: "oni", x: 300, y: 0 },
      { type: "dummy", x: 700, y: 0, passive: true },
      { type: "ninja", x: 1000, y: -60 },
      { type: "brute", x: 1400, y: 0 },
      { type: "samurai", x: 1800, y: 0 },
      { type: "ninja", x: 2100, y: -100 },
    ],
    shadows: [{ x: 500, w: 100 }, { x: 1300, w: 100 }],
    playerStart: 60,
    deco: [{ type: "lantern", x: 200 }, { type: "sign", x: 900 }, { type: "lantern", x: 1700 }],
    breakables: [
      { type: "crate", x: 450, y: 0, w: 40, h: 40 },
      { type: "lantern", x: 1100, y: 0, w: 28, h: 36 },
      { type: "pot", x: 1900, y: 0, w: 24, h: 28 },
    ],
  },

  // ── Room 36: "クラブ Nightclub" — Pulsing stealth ──
  {
    title: { jp: "クラブ", en: "Nightclub" },
    theme: "nightclub",
    platforms: [
      { x: 0, y: 0, w: 2000 },
      { x: 300, y: -80, w: 150, oneWay: true },
      { x: 700, y: -80, w: 150, oneWay: true },
      { x: 1100, y: -80, w: 150, oneWay: true },
      { x: 1500, y: -80, w: 150, oneWay: true },
    ],
    enemies: [
      { type: "brute", x: 500, y: 0 },
      { type: "ninja", x: 800, y: 0 },
      { type: "brute", x: 1200, y: 0 },
      { type: "ninja", x: 1600, y: 0 },
    ],
    shadows: [{ x: 200, w: 80 }, { x: 600, w: 80 }, { x: 1000, w: 80 }, { x: 1400, w: 80 }],
    hideSpots: [
      { type: "crate", x: 350, w: 50 },
      { type: "barrel", x: 750, w: 50 },
      { type: "crate", x: 1150, w: 50 },
    ],
    playerStart: 40,
    deco: [{ type: "sign", x: 200 }, { type: "sign", x: 800 }, { type: "sign", x: 1400 }],
    hazards: [
      { type: "electric", x: 400, y: 0, w: 150, onTime: 1500, offTime: 2500, offset: 0 },
      { type: "electric", x: 1000, y: 0, w: 150, onTime: 1500, offTime: 2500, offset: 1250 },
    ],
  },

  // ── Room 37: "VIP室 VIP Room" — Boss: DJ Mech ──
  {
    title: { jp: "VIP室", en: "VIP Room" },
    theme: "nightclub",
    platforms: [
      { x: 0, y: 0, w: 2000 },
      { x: 300, y: -120, w: 200 },
      { x: 700, y: -80, w: 150, oneWay: true },
      { x: 1100, y: -120, w: 200 },
      { x: 1500, y: -80, w: 150, oneWay: true },
    ],
    enemies: [
      { type: "brute", x: 600, y: 0 },
      { type: "brute", x: 1000, y: 0 },
      { type: "samurai", x: 1400, y: 0 },
      { type: "ninja", x: 400, y: -120 },
      { type: "ninja", x: 1200, y: -120 },
    ],
    shadows: [],
    playerStart: 60,
    deco: [{ type: "sign", x: 300 }, { type: "sign", x: 1000 }, { type: "sign", x: 1700 }],
    breakables: [
      { type: "crate", x: 500, y: 0, w: 40, h: 40 },
      { type: "lantern", x: 900, y: 0, w: 28, h: 36 },
      { type: "crate", x: 1300, y: 0, w: 40, h: 40 },
    ],
    hazards: [
      { type: "electric", x: 200, y: 0, w: 100, onTime: 1200, offTime: 2000, offset: 0 },
      { type: "electric", x: 800, y: 0, w: 100, onTime: 1200, offTime: 2000, offset: 600 },
      { type: "electric", x: 1400, y: 0, w: 100, onTime: 1200, offTime: 2000, offset: 1200 },
    ],
  },

  // ── Room 38: "サーバー室 Server Room" — Laser parkour ──
  {
    title: { jp: "サーバー室", en: "Server Room" },
    theme: "nightclub",
    platforms: [
      { x: 0, y: 0, w: 400 },
      { x: 500, y: -60, w: 120, oneWay: true },
      { x: 700, y: -120, w: 120 },
      { x: 900, y: -60, w: 200 },
      { x: 1200, y: -120, w: 120, oneWay: true },
      { x: 1400, y: -60, w: 200 },
      { x: 1700, y: -120, w: 120 },
      { x: 1900, y: 0, w: 400 },
    ],
    enemies: [
      { type: "ninja", x: 700, y: -120 },
      { type: "ninja", x: 1400, y: -60 },
    ],
    shadows: [],
    playerStart: 60,
    deco: [{ type: "sign", x: 200 }, { type: "sign", x: 1500 }],
    objective: { type: "parkour", time: 22, exitX: 2200 },
    hazards: [
      { type: "laser", x: 450, y: 0, w: 4, h: 180, onTime: 1500, offTime: 1500, offset: 0 },
      { type: "laser", x: 850, y: 0, w: 4, h: 180, onTime: 1500, offTime: 1500, offset: 750 },
      { type: "laser", x: 1150, y: 0, w: 4, h: 180, onTime: 1500, offTime: 1500, offset: 1500 },
      { type: "laser", x: 1650, y: 0, w: 4, h: 180, onTime: 1500, offTime: 1500, offset: 375 },
    ],
  },

  // ── Room 39: "脱出 Rooftop Escape" — Vertical climb, fast ──
  {
    title: { jp: "脱出", en: "Escape" },
    theme: "nightclub",
    platforms: [
      { x: 0, y: 0, w: 400 },
      { x: 100, y: -100, w: 35, h: 100, wall: true },
      { x: 400, y: -100, w: 35, h: 100, wall: true },
      { x: 200, y: -200, w: 200, oneWay: true },
      { x: 500, y: -300, w: 200 },
      { x: 100, y: -380, w: 200, oneWay: true },
      { x: 300, y: -460, w: 300 },
      { x: 700, y: 0, w: 400 },
    ],
    enemies: [
      { type: "ninja", x: 300, y: -200 },
      { type: "tengu", x: 400, y: -400 },
      { type: "samurai", x: 800, y: 0 },
      { type: "ninja", x: 500, y: -460 },
    ],
    shadows: [],
    playerStart: 60,
    deco: [{ type: "sign", x: 100 }],
    hazards: [
      { type: "falling", x: 200, y: -200, w: 100 },
    ],
  },

  // ════════════════════════════════════════════════════
  // ACT 5: SPIRIT REALM (Rooms 40-46)
  // Cherry blossoms. Ethereal. Time fracturing.
  // ════════════════════════════════════════════════════

  // ── Room 40: "山道 Mountain Path" — Temple approach ──
  {
    title: { jp: "山道", en: "Mountain Path" },
    theme: "spirit",
    platforms: [
      { x: 0, y: 0, w: 2000 },
      ...makeStairs(400, -10, 800, -100, 6),
      { x: 800, y: -100, w: 400 },
      ...makeStairs(1200, -100, 1600, -10, 6),
      { x: 1600, y: 0, w: 400 },
    ],
    enemies: [
      { type: "samurai", x: 600, y: -50 },
      { type: "oni", x: 1000, y: -100 },
      { type: "samurai", x: 1400, y: -50 },
      { type: "archer", x: 900, y: -100 },
    ],
    shadows: [{ x: 300, w: 100 }],
    playerStart: 60,
    deco: [{ type: "torii", x: 200 }, { type: "lantern", x: 700 }, { type: "torii", x: 1500 }],
  },

  // ── Room 41: "鳥居 Temple Gate" — Spirit foxes ──
  {
    title: { jp: "鳥居", en: "Temple Gate" },
    theme: "spirit",
    platforms: [
      { x: 0, y: 0, w: 2200 },
      { x: 400, y: -80, w: 200, oneWay: true },
      { x: 800, y: -120, w: 200 },
      { x: 1200, y: -80, w: 200, oneWay: true },
      { x: 1600, y: -120, w: 200 },
    ],
    enemies: [
      { type: "ninja", x: 500, y: 0 },
      { type: "tengu", x: 900, y: -200 },
      { type: "samurai", x: 1300, y: 0 },
      { type: "tengu", x: 1700, y: -200 },
      { type: "ninja", x: 2000, y: 0 },
    ],
    shadows: [],
    playerStart: 60,
    deco: [{ type: "torii", x: 150 }, { type: "torii", x: 700 }, { type: "torii", x: 1400 }, { type: "torii", x: 1900 }],
    breakables: [
      { type: "pot", x: 400, y: 0, w: 24, h: 28 },
      { type: "lantern", x: 1000, y: 0, w: 28, h: 36 },
      { type: "pot", x: 1600, y: 0, w: 24, h: 28 },
    ],
  },

  // ── Room 42: "内殿 Inner Temple" — Time fracture, mixed era enemies ──
  {
    title: { jp: "時の狭間", en: "Time Fracture" },
    theme: "spirit",
    platforms: [
      { x: 0, y: 0, w: 2800 },
      { x: 500, y: -100, w: 200 },
      { x: 900, y: -60, w: 150, oneWay: true },
      { x: 1300, y: -140, w: 200 },
      { x: 1700, y: -80, w: 150, oneWay: true },
      { x: 2100, y: -120, w: 200 },
    ],
    movingPlatforms: [
      { x: 700, y: -80, w: 100, moveY: -60, speed: 0.4 },
      { x: 1500, y: -100, w: 100, moveY: -60, speed: 0.4, offset: 0.5 },
    ],
    enemies: [
      { type: "oni", x: 400, y: 0 },
      { type: "ninja", x: 800, y: 0 },
      { type: "samurai", x: 1200, y: 0 },
      { type: "tengu", x: 1600, y: -200 },
      { type: "brute", x: 2000, y: 0 },
      { type: "archer", x: 1400, y: -140 },
      { type: "samurai", x: 2400, y: 0 },
    ],
    shadows: [],
    playerStart: 60,
    deco: [{ type: "torii", x: 200 }, { type: "lantern", x: 1000 }, { type: "torii", x: 1800 }],
    hazards: [
      { type: "spikes", x: 600, y: 0, w: 64 },
      { type: "firejet", x: 1100, y: 0, w: 30, h: 80, onTime: 1200, offTime: 1800, offset: 0 },
      { type: "falling", x: 1900, y: -120, w: 100 },
    ],
  },

  // ── Room 43: "精霊の道 Spirit Path" — Floating platforms ──
  {
    title: { jp: "精霊の道", en: "Spirit Path" },
    theme: "spirit",
    platforms: [
      { x: 0, y: 0, w: 300 },
      { x: 400, y: -40, w: 120, oneWay: true },
      { x: 600, y: -100, w: 120, oneWay: true },
      { x: 800, y: -60, w: 120 },
      { x: 1050, y: -140, w: 120, oneWay: true },
      { x: 1250, y: -80, w: 120 },
      { x: 1500, y: -160, w: 200 },
      { x: 1800, y: -100, w: 120, oneWay: true },
      { x: 2000, y: 0, w: 400 },
    ],
    movingPlatforms: [
      { x: 350, y: -80, w: 80, moveY: -40, speed: 0.3 },
      { x: 1400, y: -120, w: 80, moveX: 80, speed: 0.4 },
    ],
    enemies: [
      { type: "tengu", x: 700, y: -200 },
      { type: "ninja", x: 1100, y: -140 },
      { type: "tengu", x: 1600, y: -250 },
      { type: "samurai", x: 2100, y: 0 },
    ],
    shadows: [],
    playerStart: 60,
    deco: [{ type: "torii", x: 100 }, { type: "torii", x: 1500 }],
  },

  // ── Room 44: "試練 Spirit Trial" — Gauntlet ──
  {
    title: { jp: "試練", en: "Spirit Trial" },
    theme: "spirit",
    platforms: [
      { x: 0, y: 0, w: 2500 },
      { x: 400, y: -100, w: 200, oneWay: true },
      { x: 800, y: -150, w: 200 },
      { x: 1200, y: -100, w: 200, oneWay: true },
      { x: 1600, y: -150, w: 200 },
      { x: 2000, y: -100, w: 200, oneWay: true },
    ],
    enemies: [{ type: "samurai", x: 300, y: 0 }],
    shadows: [],
    playerStart: 60,
    deco: [{ type: "torii", x: 150 }, { type: "torii", x: 900 }, { type: "torii", x: 1700 }],
    objective: { type: "survive", waves: [
      [{ type: "oni", x: 500 }, { type: "samurai", x: 1000 }, { type: "oni", x: 1500 }],
      [{ type: "ninja", x: 400 }, { type: "samurai", x: 800 }, { type: "tengu", x: 1200, y: -200 }, { type: "oni", x: 1600 }],
      [{ type: "brute", x: 600 }, { type: "samurai", x: 1000 }, { type: "samurai", x: 1400 }, { type: "archer", x: 1800 }],
      [{ type: "brute", x: 500 }, { type: "brute", x: 1000 }, { type: "samurai", x: 1500 }, { type: "tengu", x: 800, y: -200 }],
    ]},
    hazards: [
      { type: "spikes", x: 700, y: 0, w: 64 },
      { type: "firejet", x: 1400, y: 0, w: 30, h: 80, onTime: 1000, offTime: 1500, offset: 0 },
    ],
  },

  // ── Room 45: "呪いの心臓 Heart of the Curse" — Story heavy ──
  {
    title: { jp: "呪いの心臓", en: "Heart of the Curse" },
    theme: "spirit",
    platforms: [
      { x: 0, y: 0, w: 1500 },
      { x: 300, y: -100, w: 200, oneWay: true },
      { x: 700, y: -120, w: 300 },
      { x: 1100, y: -80, w: 200, oneWay: true },
    ],
    enemies: [
      { type: "samurai", x: 500, y: 0 },
      { type: "samurai", x: 900, y: -120 },
      { type: "samurai", x: 1200, y: 0 },
    ],
    shadows: [],
    playerStart: 60,
    deco: [{ type: "torii", x: 150 }, { type: "torii", x: 750 }],
  },

  // ── Room 46: "最終決戦 Final Battle" — Shadow boss arena ──
  {
    title: { jp: "最終決戦", en: "Final Battle" },
    theme: "spirit",
    platforms: [
      { x: 0, y: 0, w: 2200 },
      { x: 300, y: -120, w: 200, oneWay: true },
      { x: 700, y: -180, w: 200 },
      { x: 1100, y: -120, w: 200, oneWay: true },
      { x: 1500, y: -180, w: 200 },
      { x: 1900, y: -120, w: 200, oneWay: true },
      { x: 200, y: -300, w: 35, h: 180, wall: true },
      { x: 2000, y: -300, w: 35, h: 180, wall: true },
    ],
    enemies: [
      { type: "samurai", x: 500, y: 0 },
      { type: "brute", x: 900, y: 0 },
      { type: "tengu", x: 700, y: -280 },
      { type: "samurai", x: 1300, y: 0 },
      { type: "brute", x: 1700, y: 0 },
      { type: "tengu", x: 1500, y: -280 },
      { type: "samurai", x: 2000, y: 0 },
    ],
    shadows: [],
    playerStart: 60,
    deco: [{ type: "torii", x: 100 }, { type: "torii", x: 1000 }, { type: "torii", x: 1900 }],
    hazards: [
      { type: "spikes", x: 600, y: 0, w: 80 },
      { type: "spikes", x: 1400, y: 0, w: 80 },
    ],
    breakables: [
      { type: "lantern", x: 400, y: 0, w: 28, h: 36 },
      { type: "crate", x: 1000, y: 0, w: 40, h: 40 },
      { type: "lantern", x: 1600, y: 0, w: 28, h: 36 },
    ],
  },

  // ════════════════════════════════════════════════════
  // EPILOGUE (Rooms 47-49)
  // Quiet. Resolution. No enemies in room 47.
  // ════════════════════════════════════════════════════

  // ── Room 47: "帰路 Spirit Walk" — No enemies, pure story ──
  {
    title: { jp: "帰路", en: "Spirit Walk" },
    theme: "spirit",
    platforms: [
      { x: 0, y: 0, w: 1500 },
    ],
    enemies: [],
    shadows: [],
    playerStart: 60,
    deco: [{ type: "torii", x: 200 }, { type: "torii", x: 700 }, { type: "torii", x: 1200 }],
    objective: { type: "parkour", time: 60, exitX: 1400 }, // just walk to end
  },

  // ── Room 48: "道場 Dojo Return" — Nostalgic callback ──
  {
    title: { jp: "帰還", en: "Homecoming" },
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
  },

  // ── Room 49: "新しい夜明け New Dawn" — Final test ──
  {
    title: { jp: "新しい夜明け", en: "New Dawn" },
    theme: "dojo",
    platforms: [
      { x: 0, y: 0, w: 800 },
    ],
    enemies: [
      { type: "samurai", x: 500, y: 0 },
    ],
    shadows: [],
    playerStart: 80,
    deco: [{ type: "lantern", x: 200 }, { type: "torii", x: 600 }],
  },
];

export const SEGMENTS = ROOMS.map(r => ({
  w: Math.max(...r.platforms.map(p => p.x + p.w)),
  platforms: r.platforms,
  enemies: r.enemies,
  deco: r.deco || [],
}));
