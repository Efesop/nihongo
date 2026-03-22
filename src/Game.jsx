import { useState, useEffect, useRef, useCallback } from "react";

// ═══ CONSTANTS ═══
const GRAVITY = 1800;
const MOVE_SPEED = 280;
const JUMP_FORCE = -560;
const SLASH_DURATION = 150;
const SLASH_RANGE = 60;
const DASH_SPEED = 600;
const DASH_DURATION = 110;
const DASH_COOLDOWN = 400;
const SCALE = 3;
const TILE = 16;
const GROUND_Y = 0.78;

// ═══ COLORS ═══
const PAL = {
  0: null,
  1: "#1a1a2e",  // dark body
  2: "#c0282a",  // red accent
  3: "#f0d0a0",  // skin
  4: "#d4a850",  // hat straw
  5: "#b08030",  // hat shadow
  6: "#e0e8ff",  // blade highlight
  7: "#a0b0c8",  // blade
  8: "#2a2a3e",  // dark detail
  9: "#ff4444",  // enemy red/oni
  A: "#6e3080",  // purple
  B: "#303040",  // dark gray
  C: "#f0f0ff",  // white
  D: "#80404a",  // dark red
  E: "#50a050",  // green
  F: "#ffa040",  // orange
};

// ═══ SPRITE DATA (16x16, all rows must be exactly 16 chars) ═══
const SPR = {
  // ── Player: TinySenpai ──
  idle1: [
    "0000044444400000",
    "0000445544440000",
    "0004445555444000",
    "0044455555544000",
    "0444455555544400",
    "4444455555544440",
    "0000033330000000",
    "0000031130000000",
    "0000111811000000",
    "0001112211100000",
    "0001182211100000",
    "0000112211000000",
    "0000011110000000",
    "0000011110000000",
    "0000011110000000",
    "0000010010000000",
  ],
  idle2: [
    "0000044444400000",
    "0000445544440000",
    "0004445555444000",
    "0044455555544000",
    "0444455555544400",
    "4444455555544440",
    "0000033330000000",
    "0000031130000000",
    "0000111811000000",
    "0001112211100000",
    "0001182211100000",
    "0000112211000000",
    "0000011110000000",
    "0000011110000000",
    "0000001100000000",
    "0000010010000000",
  ],
  // Run cycle — more exaggerated leg/arm movement
  run1: [
    "0000044444400000",
    "0000445544440000",
    "0004445555444000",
    "0044455555544000",
    "0444455555544400",
    "4444455555544440",
    "0000033330000000",
    "0000031130000000",
    "0010111811000000",
    "0001112211000000",
    "0000182211010000",
    "0000112200000000",
    "0000011100000000",
    "0000001100000000",
    "0000010010000000",
    "0000100000100000",
  ],
  run2: [
    "0000044444400000",
    "0000445544440000",
    "0004445555444000",
    "0044455555544000",
    "0444455555544400",
    "4444455555544440",
    "0000033330000000",
    "0000031130000000",
    "0000111811000000",
    "0011112211100000",
    "0001182211100000",
    "0000112211000000",
    "0000011100000000",
    "0000010010000000",
    "0000010010000000",
    "0000010010000000",
  ],
  run3: [
    "0000044444400000",
    "0000445544440000",
    "0004445555444000",
    "0044455555544000",
    "0444455555544400",
    "4444455555544440",
    "0000033330000000",
    "0000031130000000",
    "0000111811010000",
    "0000112211100000",
    "0100182211000000",
    "0000112200000000",
    "0000011100000000",
    "0000001100000000",
    "0000010010000000",
    "0000000100100000",
  ],
  run4: [
    "0000044444400000",
    "0000445544440000",
    "0004445555444000",
    "0044455555544000",
    "0444455555544400",
    "4444455555544440",
    "0000033330000000",
    "0000031130000000",
    "0000111811000000",
    "0001112211110000",
    "0001182211000000",
    "0000112211000000",
    "0000011100000000",
    "0000001010000000",
    "0000010010000000",
    "0000010001000000",
  ],
  jump: [
    "0000044444400000",
    "0000445544440000",
    "0004445555444000",
    "0044455555544000",
    "0444455555544400",
    "4444455555544440",
    "0000033330000000",
    "0000031130000000",
    "0011111811100000",
    "0001112211100000",
    "0000182211000000",
    "0000112211000000",
    "0000011110000000",
    "0000010010000000",
    "0000100001000000",
    "0000000000000000",
  ],
  fall: [
    "0000044444400000",
    "0000445544440000",
    "0004445555444000",
    "0044455555544000",
    "0444455555544400",
    "4444455555544440",
    "0000033330000000",
    "0010031130010000",
    "0001111811100000",
    "0000112211000000",
    "0000182211000000",
    "0000112211000000",
    "0000011110000000",
    "0000010010000000",
    "0000010010000000",
    "0000000000000000",
  ],
  // Slash — katana arc in 3 frames
  slash1: [
    "0000044444400000",
    "0000445544440000",
    "0004445555444000",
    "0044455555544000",
    "0444455555544400",
    "4444455555544440",
    "0000033330000000",
    "0000031130000000",
    "0000111811000067",
    "0001112211006770",
    "0001182210067000",
    "0000112267700000",
    "0000011670000000",
    "0000011110000000",
    "0000011110000000",
    "0000010010000000",
  ],
  slash2: [
    "0000044444400000",
    "0000445544440000",
    "0004445555444000",
    "0044455555544000",
    "0444455555544400",
    "4444455555544440",
    "0000033330000670",
    "0000031130067700",
    "0000111816770000",
    "0001112267000000",
    "0001182110000000",
    "0000112211000000",
    "0000011110000000",
    "0000011110000000",
    "0000011110000000",
    "0000010010000000",
  ],
  slash3: [
    "0000044444400000",
    "0000445544440000",
    "0004445555444000",
    "0044455555544000",
    "0444455555544400",
    "4444455555544440",
    "0076033330000000",
    "0677031130000000",
    "6700111811000000",
    "0001112211100000",
    "0001182211100000",
    "0000112211000000",
    "0000011110000000",
    "0000011110000000",
    "0000011110000000",
    "0000010010000000",
  ],
  // Dash afterimage — squished forward pose
  dash: [
    "0000044444400000",
    "0000445544440000",
    "0004445555444000",
    "0044455555544000",
    "0444455555544400",
    "4444455555544440",
    "0000033330000000",
    "0000031130000000",
    "0000111811100000",
    "0001112211100000",
    "0001182211100000",
    "0000112211000000",
    "0000011100000000",
    "0000001010000000",
    "0000010001000000",
    "0000000000000000",
  ],

  // ── Oni frames (red demon, patrol + charge) ──
  oni1: [
    "0009000009000000",
    "0009099090000000",
    "0000999990000000",
    "0009929290000000",
    "0009999990000000",
    "0000999900000000",
    "00009D9D00000000",
    "0000DDDD00000000",
    "000DDDDDD0000000",
    "00DDDDDDD0000000",
    "0000DDDDD0000000",
    "0000DDDD00000000",
    "00000DD000000000",
    "0000DD0D00000000",
    "0000D000D0000000",
    "0000D000D0000000",
  ],
  oni2: [
    "0009000009000000",
    "0009099090000000",
    "0000999990000000",
    "0009929290000000",
    "0009999990000000",
    "0000999900000000",
    "00009D9D00000000",
    "0000DDDD00000000",
    "000DDDDDD0000000",
    "00DDDDDDD0000000",
    "0000DDDDD0000000",
    "0000DDDD00000000",
    "00000DD000000000",
    "00000D0DD0000000",
    "0000D000D0000000",
    "00000000D0000000",
  ],

  // ── Ninja frames ──
  ninja1: [
    "0000088880000000",
    "0000888888000000",
    "0000838838000000",
    "0000888888000000",
    "0000088880000000",
    "0000018100000000",
    "0001111110000000",
    "0011111111000000",
    "0001111110000000",
    "0000111100000000",
    "0000111100000000",
    "0000011000000000",
    "0000110100000000",
    "0000100100000000",
    "0000100010000000",
    "0000000000000000",
  ],
  ninja2: [
    "0000088880000000",
    "0000888888000000",
    "0000838838000000",
    "0000888888000000",
    "0000088880000000",
    "0000018100000000",
    "0001111110000000",
    "0011111111000000",
    "0001111110000000",
    "0000111100000000",
    "0000111100000000",
    "0000011000000000",
    "0000010100000000",
    "0000010100000000",
    "0000010001000000",
    "0000000000000000",
  ],
  // Ninja throw pose
  ninja_throw: [
    "0000088880000000",
    "0000888888000000",
    "0000838838000000",
    "0000888888000000",
    "0000088880000000",
    "0000018100000000",
    "0001111111100000",
    "00111111111B0000",
    "000111111BB00000",
    "0000111100000000",
    "0000111100000000",
    "0000011000000000",
    "0000110100000000",
    "0000100100000000",
    "0000100010000000",
    "0000000000000000",
  ],

  // ── Samurai frames (armored, with katana) ──
  samurai1: [
    "0000044444000000",
    "0000444544400000",
    "0004444444400000",
    "0000BBBBBB000000",
    "0000B3BB3B000000",
    "0000BBBBBB000000",
    "000BBB22BBB00000",
    "00BBBBBBBBB00000",
    "00BBBB22BBB00067",
    "000BBBBBBB006770",
    "0000BBBBB0067000",
    "0000BBBB00700000",
    "00000BB000000000",
    "0000BB0BB0000000",
    "0000B000B0000000",
    "0000B000B0000000",
  ],
  samurai2: [
    "0000044444000000",
    "0000444544400000",
    "0004444444400000",
    "0000BBBBBB000000",
    "0000B3BB3B000000",
    "0000BBBBBB000000",
    "000BBB22BBB00000",
    "00BBBBBBBBB00000",
    "00BBBB22BBB00000",
    "000BBBBBBB000000",
    "0000BBBBB0000000",
    "0000BBBB00000000",
    "00000BB000000000",
    "00000B0BB0000000",
    "0000B000B0000000",
    "00000000B0000000",
  ],
  // Samurai block pose
  samurai_block: [
    "0000044444000000",
    "0000444544400000",
    "0004444444400000",
    "0000BBBBBB000000",
    "0000B3BB3B000000",
    "0000BBBBBB000670",
    "000BBB22BB006700",
    "00BBBBBBB0067000",
    "00BBBB22B6700000",
    "000BBBBB67000000",
    "0000BBBBB0000000",
    "0000BBBB00000000",
    "00000BB000000000",
    "0000BB0BB0000000",
    "0000B000B0000000",
    "0000B000B0000000",
  ],
  // Samurai attack pose
  samurai_atk: [
    "0000044444000000",
    "0000444544400000",
    "0004444444400000",
    "0670BBBBBB000000",
    "6770B3BB3B000000",
    "7000BBBBBB000000",
    "000BBB22BBB00000",
    "00BBBBBBBBB00000",
    "00BBBB22BBB00000",
    "000BBBBBBB000000",
    "0000BBBBB0000000",
    "0000BBBB00000000",
    "00000BB000000000",
    "0000BB0BB0000000",
    "0000B000B0000000",
    "0000B000B0000000",
  ],

  // Shuriken (3x3)
  shuriken: [
    "0B0",
    "B8B",
    "0B0",
  ],
};

// ═══ LEVEL SEGMENTS ═══
const SEGMENTS = [
  { w: 800, platforms: [{x:0,y:0,w:800}], enemies: [{type:"oni",x:500,y:0}], deco: [{type:"lantern",x:200},{type:"torii",x:600}] },
  { w: 900, platforms: [{x:0,y:0,w:300},{x:380,y:0,w:200},{x:660,y:0,w:240}], enemies: [{type:"oni",x:200,y:0},{type:"oni",x:700,y:0}], deco: [{type:"sign",x:100}] },
  { w: 1000, platforms: [{x:0,y:0,w:400},{x:250,y:-80,w:180},{x:500,y:-60,w:200},{x:780,y:0,w:220}], enemies: [{type:"oni",x:300,y:-80},{type:"ninja",x:550,y:-60}], deco: [{type:"lantern",x:150},{type:"lantern",x:850}] },
  { w: 800, platforms: [{x:0,y:0,w:800},{x:200,y:-100,w:120},{x:500,y:-120,w:120}], enemies: [{type:"ninja",x:250,y:-100},{type:"ninja",x:550,y:-120},{type:"oni",x:650,y:0}], deco: [{type:"torii",x:400}] },
  { w: 1100, platforms: [{x:0,y:0,w:200},{x:280,y:-40,w:160},{x:520,y:-80,w:160},{x:760,y:-40,w:160},{x:960,y:0,w:140}], enemies: [{type:"ninja",x:340,y:-40},{type:"oni",x:580,y:-80},{type:"ninja",x:820,y:-40}], deco: [{type:"sign",x:50},{type:"lantern",x:500}] },
  { w: 700, platforms: [{x:0,y:0,w:700}], enemies: [{type:"oni",x:250,y:0},{type:"samurai",x:500,y:0}], deco: [{type:"torii",x:350},{type:"lantern",x:600}] },
  { w: 900, platforms: [{x:0,y:0,w:250},{x:150,y:-90,w:150},{x:400,y:-50,w:200},{x:700,y:0,w:200}], enemies: [{type:"ninja",x:200,y:-90},{type:"samurai",x:450,y:-50},{type:"oni",x:750,y:0}], deco: [{type:"lantern",x:100}] },
  { w: 1000, platforms: [{x:0,y:0,w:150},{x:200,y:-20,w:600},{x:850,y:0,w:150}], enemies: [{type:"oni",x:350,y:-20},{type:"ninja",x:550,y:-20},{type:"samurai",x:700,y:-20}], deco: [{type:"sign",x:50},{type:"sign",x:900}] },
  { w: 1200, platforms: [{x:0,y:0,w:1200},{x:300,y:-80,w:100},{x:600,y:-80,w:100},{x:900,y:-80,w:100}], enemies: [{type:"oni",x:200,y:0},{type:"ninja",x:350,y:-80},{type:"oni",x:500,y:0},{type:"ninja",x:650,y:-80},{type:"samurai",x:800,y:0},{type:"oni",x:1000,y:0}], deco: [{type:"torii",x:100},{type:"torii",x:1100}] },
  { w: 800, platforms: [{x:0,y:0,w:800}], enemies: [{type:"samurai",x:300,y:0},{type:"samurai",x:500,y:0},{type:"samurai",x:650,y:0}], deco: [{type:"torii",x:100},{type:"torii",x:700},{type:"lantern",x:400}] },
];

// ═══ SPRITE CACHE ═══
const _spriteCache = {};
function getSprite(name, flip = false) {
  const key = name + (flip ? "_f" : "");
  if (_spriteCache[key]) return _spriteCache[key];
  const data = SPR[name];
  if (!data) return null;
  const h = data.length;
  const w = data[0].length;
  const c = document.createElement("canvas");
  c.width = w * SCALE;
  c.height = h * SCALE;
  const ctx = c.getContext("2d");
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const ch = data[row][flip ? w - 1 - col : col];
      const color = PAL[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(col * SCALE, row * SCALE, SCALE, SCALE);
    }
  }
  _spriteCache[key] = c;
  return c;
}

// ═══ HELPERS ═══
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function rnd(a, b) { return a + Math.random() * (b - a); }
function rndInt(a, b) { return Math.floor(rnd(a, b + 1)); }
// Deterministic hash for stable background elements
function hash(x, y) {
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}

// ═══ GAME COMPONENT ═══
export default function Game({ theme, c, isDesktop, SIDEBAR_W }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const rafRef = useRef(null);
  const [screen, setScreen] = useState("menu");
  const [score, setScore] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem("nihongo-game-highscore")) || 0; } catch { return 0; }
  });

  const font = '"JetBrains Mono","SF Mono","Fira Code",monospace';
  const uiFont = '"Noto Sans JP","Hiragino Sans",system-ui,sans-serif';

  // ═══ INIT GAME STATE ═══
  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const W = canvas.width;
    const H = canvas.height;
    const groundY = H * GROUND_Y;

    // Build level from segments — keep first and last, shuffle middle
    let levelW = 0;
    const platforms = [];
    const enemies = [];
    const decorations = [];
    const segOrder = SEGMENTS.map((_, i) => i);
    const mid = segOrder.slice(1, -1);
    for (let i = mid.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [mid[i], mid[j]] = [mid[j], mid[i]];
    }
    const order = [0, ...mid, segOrder[segOrder.length - 1]];

    for (const si of order) {
      const seg = SEGMENTS[si];
      for (const p of seg.platforms) {
        platforms.push({ x: levelW + p.x, y: groundY + p.y, w: p.w, h: 16 });
      }
      for (const e of seg.enemies) {
        enemies.push(makeEnemy(e.type, levelW + e.x, groundY + (e.y || 0)));
      }
      for (const d of (seg.deco || [])) {
        decorations.push({ type: d.type, x: levelW + d.x, y: groundY });
      }
      levelW += seg.w;
    }

    return {
      W, H, groundY, levelW,
      player: {
        x: 100, y: groundY - TILE * SCALE, vx: 0, vy: 0,
        facing: 1, state: "idle", frame: 0, frameTimer: 0,
        slashTimer: 0, dashTimer: 0, dashCooldown: 0, dead: false,
        grounded: false, invincible: 0,
        afterimages: [], // for dash trail
      },
      camera: { x: 0, y: 0, shakeX: 0, shakeY: 0, shakeTimer: 0 },
      platforms, enemies, decorations,
      particles: [],
      slashEffects: [],
      projectiles: [],
      slowMo: { active: false, meter: 100, max: 100 },
      input: { left: false, right: false, up: false, slash: false, slowmo: false, dash: false,
               slashPressed: false, jumpPressed: false, dashPressed: false },
      time: { last: performance.now(), dt: 0, scale: 1, elapsed: 0 },
      score: 0, combo: 0, comboTimer: 0, maxCombo: 0,
      hitStop: 0, flashTimer: 0,
      cleared: false,
    };
  }, []);

  function makeEnemy(type, x, platformY) {
    return {
      x, y: platformY - TILE * SCALE, vx: 0, vy: 0,
      type, facing: -1, state: "patrol", frame: 0, frameTimer: 0,
      hp: type === "samurai" ? 2 : 1,
      dead: false, deathTimer: 0,
      patrolOrigin: x, patrolRange: 80,
      alertRange: type === "ninja" ? 350 : 200,
      attackTimer: type === "ninja" ? 800 : 0,
      attackCooldown: type === "ninja" ? 1400 : 800,
      blocking: false, blockTimer: 0,
      platformY, throwAnim: 0,
    };
  }

  // ═══ GAME LOOP ═══
  useEffect(() => {
    if (screen !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Size canvas with DPR
    const resize = () => {
      const container = canvas.parentElement;
      if (!container) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = container.clientWidth;
      const h = container.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (gameRef.current) {
        gameRef.current.W = w;
        gameRef.current.H = h;
        gameRef.current.groundY = h * GROUND_Y;
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const g = initGame();
    if (!g) return;
    gameRef.current = g;

    // ── Keyboard ──
    const keys = {};
    const onKeyDown = (e) => {
      if (keys[e.code]) return;
      keys[e.code] = true;
      const inp = gameRef.current?.input;
      if (!inp) return;
      if (e.code === "ArrowLeft" || e.code === "KeyA") { inp.left = true; e.preventDefault(); }
      if (e.code === "ArrowRight" || e.code === "KeyD") { inp.right = true; e.preventDefault(); }
      if (e.code === "ArrowUp" || e.code === "KeyW" || e.code === "Space") { inp.up = true; inp.jumpPressed = true; e.preventDefault(); }
      if (e.code === "KeyJ" || e.code === "KeyZ") { inp.slash = true; inp.slashPressed = true; e.preventDefault(); }
      if (e.code === "KeyK" || e.code === "KeyX" || e.code === "ShiftLeft" || e.code === "ShiftRight") { inp.slowmo = true; e.preventDefault(); }
      if (e.code === "KeyL" || e.code === "KeyC") { inp.dash = true; inp.dashPressed = true; e.preventDefault(); }
      if (e.code === "Escape" || e.code === "KeyP") setScreen("paused");
    };
    const onKeyUp = (e) => {
      keys[e.code] = false;
      const inp = gameRef.current?.input;
      if (!inp) return;
      if (e.code === "ArrowLeft" || e.code === "KeyA") inp.left = false;
      if (e.code === "ArrowRight" || e.code === "KeyD") inp.right = false;
      if (e.code === "ArrowUp" || e.code === "KeyW" || e.code === "Space") inp.up = false;
      if (e.code === "KeyJ" || e.code === "KeyZ") inp.slash = false;
      if (e.code === "KeyK" || e.code === "KeyX" || e.code === "ShiftLeft" || e.code === "ShiftRight") inp.slowmo = false;
      if (e.code === "KeyL" || e.code === "KeyC") inp.dash = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // ── Touch ──
    const touches = {};
    const getTouchZone = (t) => {
      const rect = canvas.getBoundingClientRect();
      const x = t.clientX - rect.left;
      const y = t.clientY - rect.top;
      const w = rect.width;
      const h = rect.height;
      if (x > w * 0.75) {
        if (y > h * 0.6) return "slash";
        if (y > h * 0.3) return "dash";
        return "slowmo";
      }
      if (x < w * 0.2) return "left";
      if (x < w * 0.45) return "right";
      return "jump";
    };
    const onTouchStart = (e) => {
      e.preventDefault();
      const inp = gameRef.current?.input;
      if (!inp) return;
      for (const t of e.changedTouches) {
        const zone = getTouchZone(t);
        touches[t.identifier] = zone;
        if (zone === "left") inp.left = true;
        if (zone === "right") inp.right = true;
        if (zone === "jump") { inp.up = true; inp.jumpPressed = true; }
        if (zone === "slash") { inp.slash = true; inp.slashPressed = true; }
        if (zone === "slowmo") inp.slowmo = true;
        if (zone === "dash") { inp.dash = true; inp.dashPressed = true; }
      }
    };
    const onTouchEnd = (e) => {
      e.preventDefault();
      const inp = gameRef.current?.input;
      if (!inp) return;
      for (const t of e.changedTouches) {
        const zone = touches[t.identifier];
        delete touches[t.identifier];
        if (zone === "left") inp.left = false;
        if (zone === "right") inp.right = false;
        if (zone === "jump") inp.up = false;
        if (zone === "slash") inp.slash = false;
        if (zone === "slowmo") inp.slowmo = false;
        if (zone === "dash") inp.dash = false;
      }
    };
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });
    canvas.addEventListener("touchcancel", onTouchEnd, { passive: false });

    // ═══════════════════════
    // ═══ UPDATE FUNCTION ═══
    // ═══════════════════════
    function update(g) {
      const now = performance.now();
      let rawDt = Math.min(now - g.time.last, 33) / 1000;
      g.time.last = now;

      // Hit-stop: freeze game, keep rendering
      if (g.hitStop > 0) {
        g.hitStop -= rawDt * 1000;
        return;
      }

      // Slow-mo
      if (g.input.slowmo && g.slowMo.meter > 0) {
        g.slowMo.active = true;
        g.slowMo.meter = Math.max(0, g.slowMo.meter - 40 * rawDt);
        g.time.scale = 0.25;
        if (g.slowMo.meter <= 0) g.slowMo.active = false;
      } else {
        g.slowMo.active = false;
        g.time.scale = 1;
        g.slowMo.meter = Math.min(g.slowMo.max, g.slowMo.meter + 15 * rawDt);
      }

      const dt = rawDt * g.time.scale;
      g.time.dt = dt;
      g.time.elapsed += dt;

      const p = g.player;
      if (p.dead) return;

      // ── Player movement ──
      const moveDir = (g.input.left ? -1 : 0) + (g.input.right ? 1 : 0);

      // Dash
      if (g.input.dashPressed && p.dashCooldown <= 0 && p.dashTimer <= 0) {
        p.dashTimer = DASH_DURATION;
        p.dashCooldown = DASH_COOLDOWN;
        if (moveDir !== 0) p.facing = moveDir;
        p.vy = 0; // cancel vertical momentum during dash
        // Spawn afterimage at current position
        p.afterimages.push({ x: p.x, y: p.y, facing: p.facing, life: 200 });
      }
      g.input.dashPressed = false;

      if (p.dashTimer > 0) {
        p.dashTimer -= rawDt * 1000; // dash not affected by slow-mo
        p.vx = p.facing * DASH_SPEED;
        p.invincible = 100; // i-frames during dash
        // Spawn trail afterimages
        if (Math.floor(p.dashTimer / 30) !== Math.floor((p.dashTimer + rawDt * 1000) / 30)) {
          p.afterimages.push({ x: p.x, y: p.y, facing: p.facing, life: 150 });
        }
      } else if (p.slashTimer > 0) {
        p.vx *= 0.8;
      } else {
        p.vx = moveDir * MOVE_SPEED;
        if (moveDir !== 0) p.facing = moveDir;
      }

      if (p.dashCooldown > 0) p.dashCooldown -= rawDt * 1000;

      // Afterimage decay
      for (const ai of p.afterimages) ai.life -= rawDt * 1000;
      p.afterimages = p.afterimages.filter(ai => ai.life > 0);

      // Jump
      if (g.input.jumpPressed && p.grounded) {
        p.vy = JUMP_FORCE;
        p.grounded = false;
        spawnDust(g, p.x, p.y + TILE * SCALE);
      }
      g.input.jumpPressed = false;

      // Slash
      if (g.input.slashPressed && p.slashTimer <= 0) {
        p.slashTimer = SLASH_DURATION;
        p.frame = 0;
        g.slashEffects.push({
          x: p.x + p.facing * 24, y: p.y + 8,
          facing: p.facing, timer: 200, maxTimer: 200,
        });
      }
      g.input.slashPressed = false;

      // Gravity
      if (p.dashTimer <= 0) {
        p.vy += GRAVITY * dt;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Platform collision
      p.grounded = false;
      for (const plat of g.platforms) {
        const pw = TILE * SCALE * 0.6;
        if (p.x + pw > plat.x && p.x - pw < plat.x + plat.w &&
            p.y + TILE * SCALE > plat.y && p.y + TILE * SCALE < plat.y + plat.h + Math.abs(p.vy * dt) + 10 &&
            p.vy >= 0) {
          p.y = plat.y - TILE * SCALE;
          p.vy = 0;
          p.grounded = true;
        }
      }

      p.x = Math.max(10, Math.min(g.levelW - 10, p.x));

      // Fall death
      if (p.y > g.H + 100) killPlayer(g);

      // Update slash timer
      if (p.slashTimer > 0) p.slashTimer -= dt * 1000;

      // Player state machine
      if (p.dashTimer > 0) {
        p.state = "dash";
      } else if (p.slashTimer > 0) {
        const progress = 1 - p.slashTimer / SLASH_DURATION;
        p.state = progress < 0.33 ? "slash1" : progress < 0.66 ? "slash2" : "slash3";
      } else if (!p.grounded && p.vy < 0) {
        p.state = "jump";
      } else if (!p.grounded) {
        p.state = "fall";
      } else if (Math.abs(p.vx) > 10) {
        p.state = "run";
        p.frameTimer += dt * 1000;
        if (p.frameTimer > 100) { p.frame = (p.frame + 1) % 4; p.frameTimer = 0; }
      } else {
        p.state = "idle";
        p.frameTimer += dt * 1000;
        if (p.frameTimer > 500) { p.frame = (p.frame + 1) % 2; p.frameTimer = 0; }
      }

      if (p.invincible > 0) p.invincible -= rawDt * 1000;

      // ── Enemies ──
      for (const e of g.enemies) {
        if (e.dead) { e.deathTimer -= dt * 1000; continue; }

        const dx = p.x - e.x;
        const dist = Math.abs(dx);
        const toPlayer = dx > 0 ? 1 : -1;

        // Animation
        e.frameTimer += dt * 1000;
        if (e.frameTimer > 250) { e.frame = (e.frame + 1) % 2; e.frameTimer = 0; }

        // Block timer
        if (e.blockTimer > 0) {
          e.blockTimer -= dt * 1000;
          if (e.blockTimer <= 0) e.blocking = false;
        }
        // Throw animation timer
        if (e.throwAnim > 0) e.throwAnim -= dt * 1000;

        // ── AI ──
        if (e.type === "oni") {
          if (dist < e.alertRange && e.state !== "attack") {
            e.state = "chase";
            e.facing = toPlayer;
            e.vx = toPlayer * MOVE_SPEED * 0.55;
            if (dist < 50) { e.state = "attack"; e.attackTimer = 400; }
          } else if (e.state === "attack") {
            e.attackTimer -= dt * 1000;
            e.vx = 0;
            if (e.attackTimer <= 0) e.state = "patrol";
          } else {
            e.state = "patrol";
            if (Math.abs(e.x - e.patrolOrigin) > e.patrolRange) e.facing *= -1;
            e.vx = e.facing * 40;
          }
        } else if (e.type === "ninja") {
          e.facing = toPlayer;
          e.vx = 0;
          if (dist < e.alertRange) {
            e.attackTimer -= dt * 1000;
            if (e.attackTimer <= 0) {
              g.projectiles.push({
                x: e.x, y: e.y + 20, vx: toPlayer * 350, vy: 0,
                type: "shuriken", timer: 3000, rotation: 0,
              });
              e.attackTimer = e.attackCooldown;
              e.throwAnim = 300;
            }
            if (dist < 80) e.vx = -toPlayer * 120;
          } else {
            e.state = "patrol";
            if (Math.abs(e.x - e.patrolOrigin) > e.patrolRange) e.facing *= -1;
            e.vx = e.facing * 30;
          }
        } else if (e.type === "samurai") {
          if (dist < e.alertRange) {
            e.facing = toPlayer;
            e.vx = toPlayer * MOVE_SPEED * 0.4;
            if (dist < 55) {
              e.state = "attack";
              e.attackTimer -= dt * 1000;
              e.vx = 0;
              if (e.attackTimer <= 0) e.attackTimer = e.attackCooldown;
            }
          } else {
            e.state = "patrol";
            if (Math.abs(e.x - e.patrolOrigin) > e.patrolRange) e.facing *= -1;
            e.vx = e.facing * 30;
          }
        }

        e.x += e.vx * dt;

        // Keep on platform
        for (const plat of g.platforms) {
          if (e.x > plat.x && e.x < plat.x + plat.w &&
              e.y + TILE * SCALE > plat.y && e.y + TILE * SCALE < plat.y + 20) {
            e.y = plat.y - TILE * SCALE;
          }
        }

        // ── Slash collision (NO slashHit limit — can hit multiple enemies per slash) ──
        if (p.slashTimer > 0 && !e.dead && !e._hitThisSlash) {
          const slashX = p.x + p.facing * SLASH_RANGE / 2;
          const slashW = SLASH_RANGE;
          const ew = TILE * SCALE * 0.8;
          if (Math.abs(slashX - e.x) < (slashW + ew) / 2 &&
              Math.abs(p.y - e.y) < TILE * SCALE * 1.2) {
            e._hitThisSlash = true;
            if (e.type === "samurai" && e.hp > 1 && !e.blocking) {
              // Block — sparks, no kill
              e.hp--;
              e.blocking = true;
              e.blockTimer = 500;
              g.hitStop = 80;
              g.camera.shakeTimer = 100;
              for (let i = 0; i < 8; i++) {
                g.particles.push({
                  x: (p.x + e.x) / 2, y: p.y + 15,
                  vx: rnd(-250, 250), vy: rnd(-350, -50),
                  life: 350, maxLife: 350, color: "#ffe080", size: rndInt(2, 4),
                });
              }
            } else {
              // Kill
              e.dead = true;
              e.deathTimer = 400;
              g.hitStop = 50;
              g.camera.shakeTimer = 120;
              g.comboTimer = 2000;
              g.combo++;
              if (g.combo > g.maxCombo) g.maxCombo = g.combo;
              const pts = e.type === "samurai" ? 300 : e.type === "ninja" ? 150 : 100;
              g.score += pts * g.combo;
              setScore(g.score);
              setMaxCombo(g.maxCombo);
              g.slowMo.meter = Math.min(g.slowMo.max, g.slowMo.meter + 20);
              // Death particles
              const pColor = e.type === "oni" ? "#ff4444" : e.type === "ninja" ? "#8888ff" : "#ffaa44";
              for (let i = 0; i < 12; i++) {
                g.particles.push({
                  x: e.x + rnd(-8, 8), y: e.y + TILE * SCALE / 2 + rnd(-8, 8),
                  vx: rnd(-300, 300), vy: rnd(-450, -50),
                  life: 500, maxLife: 500, color: pColor, size: rndInt(2, 5),
                });
              }
              g.flashTimer = 60;
            }
          }
        }

        // Reset per-slash hit tracking when slash ends
        if (p.slashTimer <= 0) e._hitThisSlash = false;

        // ── Enemy attack → player ──
        if (e.state === "attack" && e.attackTimer > 200 && e.attackTimer < 350 &&
            !e.dead && !p.dead && p.invincible <= 0) {
          if (Math.abs(e.x - p.x) < 50 && Math.abs(e.y - p.y) < TILE * SCALE) {
            killPlayer(g);
          }
        }
      }

      g.enemies = g.enemies.filter(e => !e.dead || e.deathTimer > 0);

      // ── Projectiles ──
      for (const proj of g.projectiles) {
        proj.x += proj.vx * dt;
        proj.timer -= dt * 1000;
        proj.rotation = (proj.rotation || 0) + dt * 15;

        if (!p.dead && p.invincible <= 0 &&
            Math.abs(proj.x - p.x) < 20 && Math.abs(proj.y - p.y - 20) < 25) {
          // Deflect with slash
          if (p.slashTimer > 0 && Math.abs(proj.x - (p.x + p.facing * 30)) < 45) {
            proj.timer = 0;
            g.score += 150;
            setScore(g.score);
            g.hitStop = 30;
            for (let i = 0; i < 6; i++) {
              g.particles.push({
                x: proj.x, y: proj.y, vx: rnd(-250, 250), vy: rnd(-300, -100),
                life: 250, maxLife: 250, color: "#ffffff", size: rndInt(2, 3),
              });
            }
          } else {
            killPlayer(g);
          }
        }
      }
      g.projectiles = g.projectiles.filter(proj => proj.timer > 0);

      // ── Combo decay ──
      if (g.comboTimer > 0) {
        g.comboTimer -= dt * 1000;
        if (g.comboTimer <= 0) g.combo = 0;
      }

      // ── Particles ──
      for (const part of g.particles) {
        part.x += part.vx * dt;
        part.y += part.vy * dt;
        part.vy += 600 * dt;
        part.life -= dt * 1000;
      }
      g.particles = g.particles.filter(p => p.life > 0);

      // ── Slash effects ──
      for (const s of g.slashEffects) s.timer -= dt * 1000;
      g.slashEffects = g.slashEffects.filter(s => s.timer > 0);

      // ── Flash timer ──
      if (g.flashTimer > 0) g.flashTimer -= dt * 1000;

      // ── Camera (frame-rate independent lerp) ──
      const targetCX = p.x - g.W / 2 + (isDesktop ? SIDEBAR_W / 2 : 0);
      const camTarget = clamp(targetCX, 0, Math.max(0, g.levelW - g.W));
      const camSmooth = 1 - Math.pow(0.001, rawDt); // frame-rate independent
      g.camera.x = lerp(g.camera.x, camTarget, camSmooth);
      g.camera.y = 0;
      if (g.camera.shakeTimer > 0) {
        g.camera.shakeTimer -= rawDt * 1000;
        const amp = g.camera.shakeTimer > 80 ? 6 : 3;
        g.camera.shakeX = rnd(-amp, amp);
        g.camera.shakeY = rnd(-amp, amp);
      } else {
        g.camera.shakeX = 0;
        g.camera.shakeY = 0;
      }

      // ── Victory ──
      if (!g.cleared && g.enemies.filter(e => !e.dead).length === 0 && g.time.elapsed > 2) {
        g.cleared = true;
        const timeBonus = Math.max(0, Math.floor(5000 - g.time.elapsed * 10));
        g.score += 1000 + timeBonus;
        setScore(g.score);
        setMaxCombo(g.maxCombo);
        setTimeout(() => {
          if (g.score > highScore) {
            setHighScore(g.score);
            try { localStorage.setItem("nihongo-game-highscore", g.score); } catch {}
          }
          setScreen("victory");
        }, 1000);
      }
    }

    function killPlayer(g) {
      g.player.dead = true;
      g.camera.shakeTimer = 300;
      for (let i = 0; i < 15; i++) {
        g.particles.push({
          x: g.player.x + rnd(-5, 5), y: g.player.y + 20,
          vx: rnd(-300, 300), vy: rnd(-500, -100),
          life: 600, maxLife: 600, color: "#c0282a", size: rndInt(3, 6),
        });
      }
      setTimeout(() => {
        const gs = gameRef.current;
        if (gs && gs.score > highScore) {
          setHighScore(gs.score);
          try { localStorage.setItem("nihongo-game-highscore", gs.score); } catch {}
        }
        setMaxCombo(gs ? gs.maxCombo : 0);
        setScreen("dead");
      }, 800);
    }

    function spawnDust(g, x, y) {
      for (let i = 0; i < 4; i++) {
        g.particles.push({
          x: x + rnd(-10, 10), y,
          vx: rnd(-60, 60), vy: rnd(-80, -20),
          life: 300, maxLife: 300, color: "#888888", size: rndInt(2, 4),
        });
      }
    }

    // ═══════════════════════
    // ═══ RENDER FUNCTION ═══
    // ═══════════════════════
    function render(g, ctx) {
      const { W, H, camera: cam } = g;
      const cx = cam.x + cam.shakeX;
      const cy = cam.y + cam.shakeY;

      ctx.fillStyle = "#0a0a14";
      ctx.fillRect(0, 0, W, H);

      renderBackground(ctx, W, H, cx, g);

      ctx.save();
      ctx.translate(-cx, -cy);

      // Decorations
      for (const d of g.decorations) renderDeco(ctx, d, g.groundY, g.time.elapsed);

      // Platforms
      for (const plat of g.platforms) {
        if (plat.x + plat.w < cx - 50 || plat.x > cx + W + 50) continue;
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(plat.x, plat.y, plat.w, 12);
        ctx.fillStyle = "#c0282a44";
        ctx.fillRect(plat.x, plat.y, plat.w, 2);
        ctx.fillStyle = "#c0282a";
        ctx.fillRect(plat.x, plat.y, plat.w, 1);
        // Side edges
        ctx.fillStyle = "#c0282a33";
        ctx.fillRect(plat.x, plat.y, 1, 12);
        ctx.fillRect(plat.x + plat.w - 1, plat.y, 1, 12);
      }

      // Enemies
      for (const e of g.enemies) {
        if (e.x < cx - 100 || e.x > cx + W + 100) continue;
        if (e.dead) ctx.globalAlpha = e.deathTimer / 400;

        // Pick sprite based on enemy type + state
        let sprName;
        if (e.type === "oni") {
          sprName = e.frame === 0 ? "oni1" : "oni2";
        } else if (e.type === "ninja") {
          sprName = e.throwAnim > 0 ? "ninja_throw" : (e.frame === 0 ? "ninja1" : "ninja2");
        } else {
          if (e.blocking) sprName = "samurai_block";
          else if (e.state === "attack" && e.attackTimer > 200) sprName = "samurai_atk";
          else sprName = e.frame === 0 ? "samurai1" : "samurai2";
        }

        const spr = getSprite(sprName, e.facing > 0);
        if (spr) ctx.drawImage(spr, e.x - spr.width / 2, e.y, spr.width, spr.height);

        // Block shield effect
        if (e.blocking && !e.dead) {
          ctx.strokeStyle = "#ffe08088";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(e.x, e.y + TILE * SCALE / 2, 25, 0, Math.PI * 2);
          ctx.stroke();
        }
        // Attack telegraph
        if (e.state === "attack" && e.attackTimer > 200 && !e.dead) {
          const pulse = 0.3 + Math.sin(g.time.elapsed * 20) * 0.2;
          ctx.fillStyle = `rgba(255,60,60,${pulse})`;
          ctx.fillRect(e.x - 30, e.y, 60, TILE * SCALE);
        }
        ctx.globalAlpha = 1;
      }

      // Projectiles
      for (const proj of g.projectiles) {
        ctx.save();
        ctx.translate(proj.x, proj.y);
        ctx.rotate(proj.rotation);
        const spr = getSprite("shuriken");
        if (spr) ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
        ctx.restore();
      }

      // Player afterimages (dash trail)
      for (const ai of g.player.afterimages) {
        ctx.globalAlpha = (ai.life / 200) * 0.4;
        const spr = getSprite("dash", ai.facing < 0);
        if (spr) ctx.drawImage(spr, ai.x - spr.width / 2, ai.y, spr.width, spr.height);
      }
      ctx.globalAlpha = 1;

      // Player
      if (!g.player.dead) {
        const p = g.player;
        let sprName;
        if (p.state === "dash") sprName = "dash";
        else if (p.state.startsWith("slash")) sprName = p.state;
        else if (p.state === "run") sprName = "run" + (p.frame % 4 + 1);
        else if (p.state === "idle") sprName = "idle" + (p.frame % 2 + 1);
        else sprName = p.state;

        const flip = p.facing < 0;
        const spr = getSprite(sprName, flip);
        if (spr) {
          if (p.invincible > 0 && Math.floor(p.invincible / 50) % 2 === 0) ctx.globalAlpha = 0.4;
          // Dash tint
          if (p.dashTimer > 0) {
            ctx.globalAlpha = 0.85;
            ctx.shadowColor = "#c0282a";
            ctx.shadowBlur = 15;
          }
          ctx.drawImage(spr, p.x - spr.width / 2, p.y, spr.width, spr.height);
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }
      }

      // Slash effects
      for (const s of g.slashEffects) {
        const progress = 1 - s.timer / s.maxTimer;
        const alpha = (1 - progress) * 0.9;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.strokeStyle = `rgba(224,232,255,${alpha})`;
        ctx.lineWidth = 3.5 - progress * 2.5;
        ctx.shadowColor = "#e0e8ff";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        const start = s.facing > 0
          ? -Math.PI * 0.7 + progress * Math.PI * 0.5
          : Math.PI * 0.7 - progress * Math.PI * 0.5;
        const end = s.facing > 0
          ? Math.PI * 0.5 + progress * Math.PI * 0.3
          : -Math.PI * 0.5 - progress * Math.PI * 0.3;
        ctx.arc(0, 0, 28 + progress * 25, start, end);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // Particles
      for (const part of g.particles) {
        ctx.globalAlpha = part.life / part.maxLife;
        ctx.fillStyle = part.color;
        ctx.fillRect(part.x - part.size / 2, part.y - part.size / 2, part.size, part.size);
      }
      ctx.globalAlpha = 1;

      ctx.restore(); // end camera transform

      // ── Post-processing ──

      // Screen flash
      if (g.flashTimer > 0) {
        ctx.fillStyle = `rgba(255,255,255,${(g.flashTimer / 60) * 0.18})`;
        ctx.fillRect(0, 0, W, H);
      }

      // Slow-mo overlay
      if (g.slowMo.active) {
        ctx.fillStyle = "rgba(80,60,180,0.12)";
        ctx.fillRect(0, 0, W, H);
        // Chromatic aberration hint — subtle colored bars at edges
        ctx.fillStyle = "rgba(255,50,50,0.04)";
        ctx.fillRect(0, 0, 3, H);
        ctx.fillStyle = "rgba(50,50,255,0.04)";
        ctx.fillRect(W - 3, 0, 3, H);
      }

      // Scanlines
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);

      // Vignette
      const vg = ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.75);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.45)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);

      renderHUD(ctx, g, W);
    }

    function renderBackground(ctx, W, H, cx, g) {
      const groundY = g.groundY;

      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#05050e");
      sky.addColorStop(0.5, "#0a0a1e");
      sky.addColorStop(1, "#0d0a18");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Stars (deterministic)
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 50; i++) {
        const sx = ((i * 137.5 + 50) % (W + 200)) - (cx * 0.02) % (W + 200);
        const sy = (i * 73.7 + 20) % (H * 0.4);
        const twinkle = Math.sin(g.time.elapsed * (1.5 + hash(i, 0) * 2) + i * 0.7);
        ctx.globalAlpha = 0.2 + twinkle * 0.15 + hash(i, 1) * 0.2;
        const ss = 0.8 + hash(i, 2) * 1.2;
        ctx.fillRect(sx, sy, ss, ss);
      }
      ctx.globalAlpha = 1;

      // Far buildings (parallax 0.1) — deterministic
      const bx1 = -cx * 0.1;
      ctx.fillStyle = "#0e0e1c";
      for (let i = 0; i < 15; i++) {
        const bw = 40 + ((i * 31) % 60);
        const bh = 60 + ((i * 47) % 120);
        const x = ((i * 97 + bx1) % (W + 300) + W + 300) % (W + 300) - 50;
        ctx.fillRect(x, groundY - bh, bw, bh);
      }

      // Mid buildings with neon (parallax 0.3)
      const bx2 = -cx * 0.3;
      for (let i = 0; i < 12; i++) {
        const bw = 30 + ((i * 43) % 50);
        const bh = 40 + ((i * 67) % 100);
        const x = ((i * 130 + 20 + bx2) % (W + 400) + W + 400) % (W + 400) - 100;
        ctx.fillStyle = "#12121e";
        ctx.fillRect(x, groundY - bh, bw, bh);

        // Neon sign
        if (i % 3 === 0) {
          const neonColor = i % 2 === 0 ? "rgba(192,40,42,0.4)" : "rgba(155,142,207,0.4)";
          ctx.fillStyle = neonColor;
          ctx.fillRect(x + 5, groundY - bh + 10, bw - 10, 6);
        }
        // Windows (deterministic — hash-based, no Math.random)
        ctx.fillStyle = "rgba(255,200,100,0.25)";
        for (let wy = groundY - bh + 25; wy < groundY - 10; wy += 15) {
          for (let wx = x + 6; wx < x + bw - 6; wx += 10) {
            if (hash(i * 100 + Math.floor(wx), Math.floor(wy)) > 0.35) {
              ctx.fillRect(wx, wy, 4, 5);
            }
          }
        }
      }

      // Wires (parallax 0.7)
      ctx.strokeStyle = "#1a1a30";
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const wy = groundY - 150 - i * 40;
        ctx.beginPath();
        ctx.moveTo(0, wy);
        ctx.lineTo(W, wy + Math.sin(cx * 0.003 + i) * 5);
        ctx.stroke();
      }

      // Ground
      ctx.fillStyle = "#08080f";
      ctx.fillRect(0, groundY + 12, W, H - groundY);
    }

    function renderDeco(ctx, d, groundY, elapsed) {
      if (d.type === "lantern") {
        const glow = 0.5 + Math.sin(elapsed * 3 + d.x * 0.1) * 0.2;
        ctx.fillStyle = `rgba(255,100,50,${glow * 0.3})`;
        ctx.beginPath();
        ctx.arc(d.x, groundY - 60, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#c0282a";
        ctx.fillRect(d.x - 6, groundY - 70, 12, 18);
        ctx.strokeStyle = "#444";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(d.x, groundY - 70);
        ctx.lineTo(d.x, groundY - 90);
        ctx.stroke();
      } else if (d.type === "torii") {
        ctx.fillStyle = "#8b1a1a";
        ctx.fillRect(d.x - 30, groundY - 100, 6, 100);
        ctx.fillRect(d.x + 24, groundY - 100, 6, 100);
        ctx.fillRect(d.x - 36, groundY - 100, 72, 6);
        ctx.fillRect(d.x - 32, groundY - 85, 64, 4);
        ctx.fillStyle = "rgba(192,40,42,0.12)";
        ctx.fillRect(d.x - 40, groundY - 110, 80, 120);
      } else if (d.type === "sign") {
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(d.x - 15, groundY - 80, 30, 20);
        const glow = 0.7 + Math.sin(elapsed * 4 + d.x) * 0.3;
        ctx.fillStyle = `rgba(155,142,207,${glow})`;
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.fillText("酒", d.x, groundY - 65);
      }
    }

    function renderHUD(ctx, g, W) {
      // Score
      ctx.font = `bold 16px ${font}`;
      ctx.textAlign = "left";
      ctx.shadowColor = "#c0282a";
      ctx.shadowBlur = 8;
      ctx.fillStyle = "#c0282a";
      ctx.fillText(`SCORE: ${String(g.score).padStart(5, "0")}`, 16, 30);
      ctx.shadowBlur = 0;

      // Combo
      if (g.combo > 1) {
        const comboScale = Math.min(1.3, 1 + (g.comboTimer / 2000) * 0.3);
        ctx.save();
        ctx.translate(16, 56);
        ctx.scale(comboScale, comboScale);
        ctx.font = `bold 20px ${font}`;
        ctx.fillStyle = "#ffa040";
        ctx.shadowColor = "#ffa040";
        ctx.shadowBlur = 12;
        ctx.fillText(`x${g.combo} COMBO`, 0, 0);
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // Slow-mo meter
      const mW = 100, mH = 8, mX = W - mW - 16, mY = 20;
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(mX, mY, mW, mH);
      const fill = g.slowMo.meter / g.slowMo.max;
      ctx.fillStyle = g.slowMo.active ? "#b8a0ff" : "#6e3080";
      ctx.fillRect(mX, mY, mW * fill, mH);
      if (g.slowMo.active) {
        ctx.shadowColor = "#9b8ecf";
        ctx.shadowBlur = 10;
        ctx.fillRect(mX, mY, mW * fill, mH);
        ctx.shadowBlur = 0;
      }
      ctx.strokeStyle = "#3a3a5a";
      ctx.lineWidth = 1;
      ctx.strokeRect(mX, mY, mW, mH);
      ctx.font = `9px ${font}`;
      ctx.fillStyle = "#9b8ecf";
      ctx.textAlign = "right";
      ctx.fillText("FOCUS", mX - 6, mY + 8);

      // Dash cooldown indicator
      const p = g.player;
      if (p.dashCooldown > 0) {
        const dFill = 1 - p.dashCooldown / DASH_COOLDOWN;
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(mX, mY + 14, mW, 4);
        ctx.fillStyle = "#c0282a66";
        ctx.fillRect(mX, mY + 14, mW * dFill, 4);
      } else {
        ctx.font = `8px ${font}`;
        ctx.fillStyle = "#c0282a88";
        ctx.textAlign = "right";
        ctx.fillText("DASH READY", W - 16, mY + 24);
      }

      // Mobile touch hints
      if (!isDesktop) {
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = "#ffffff";
        ctx.font = "22px sans-serif";
        ctx.textAlign = "center";
        const bh = g.H;
        ctx.fillText("◀", W * 0.10, bh - 25);
        ctx.fillText("▶", W * 0.35, bh - 25);
        ctx.fillText("▲", W * 0.55, bh - 25);
        ctx.fillStyle = "#c0282a";
        ctx.globalAlpha = 0.25;
        ctx.fillText("⚔", W * 0.85, bh - 20);
        ctx.fillStyle = "#ffa040";
        ctx.fillText("→", W * 0.85, bh - 55);
        ctx.fillStyle = "#9b8ecf";
        ctx.fillText("◉", W * 0.85, bh - 90);
        ctx.globalAlpha = 1;
      }
    }

    // ═══ MAIN LOOP ═══
    function loop() {
      const g = gameRef.current;
      if (!g) return;
      update(g);
      render(g, ctx);
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [screen, initGame, isDesktop, SIDEBAR_W, highScore]);

  // Resume from pause
  useEffect(() => {
    if (screen !== "paused") return;
    const onKey = (e) => {
      if (e.code === "Escape" || e.code === "KeyP") {
        if (gameRef.current) gameRef.current.time.last = performance.now();
        setScreen("playing");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen]);

  const startGame = () => {
    setScore(0);
    setMaxCombo(0);
    // Clear sprite cache on new game in case window was resized
    setScreen("playing");
  };

  // ═══ STYLES ═══
  const overlay = {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    zIndex: 10,
  };
  const btn = {
    fontFamily: uiFont, cursor: "pointer", border: "none",
    padding: "12px 32px", borderRadius: 10, fontSize: 15, fontWeight: 700,
    letterSpacing: ".02em", transition: "all .15s",
  };
  const glowText = { textShadow: `0 0 20px ${c.a}, 0 0 60px ${c.a}40` };

  const cssFx = `@keyframes glitch{0%{text-shadow:2px 0 #c0282a,-2px 0 #4f8ec4}25%{text-shadow:-2px -1px #c0282a,2px 1px #4f8ec4}50%{text-shadow:1px 2px #c0282a,-1px -2px #4f8ec4}75%{text-shadow:-1px 1px #c0282a,1px -1px #4f8ec4}100%{text-shadow:2px 0 #c0282a,-2px 0 #4f8ec4}}@keyframes scanmove{0%{background-position:0 0}100%{background-position:0 100%}}@keyframes glitchBig{0%{transform:translate(0);opacity:1}10%{transform:translate(-3px,2px);opacity:.8}20%{transform:translate(3px,-1px);opacity:.9}30%{transform:translate(0);opacity:1}90%{transform:translate(0);opacity:1}95%{transform:translate(2px,1px);opacity:.7}100%{transform:translate(0);opacity:1}}`;

  // ═══ MENU ═══
  if (screen === "menu") {
    return (
      <div style={{ ...overlay, background: c.bg, gap: 20 }}>
        <style>{cssFx}</style>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)", pointerEvents: "none", animation: "scanmove 8s linear infinite" }} />
        <img src="/images/tinysenpai2.png" alt="TinySenpai" style={{ width: 96, height: 96, imageRendering: "pixelated", borderRadius: 12, filter: `drop-shadow(0 0 20px ${c.a}60)` }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, fontWeight: 900, fontFamily: font, color: c.a, letterSpacing: ".08em", ...glowText, animation: "glitch 3s ease-in-out infinite" }}>
            TINYSENPAI
          </div>
          <div style={{ fontSize: 48, color: c.tx, marginTop: 4, filter: `drop-shadow(0 0 10px ${c.a}40)` }}>斬</div>
          <div style={{ fontSize: 11, color: c.m, fontFamily: font, letterSpacing: ".1em", marginTop: 4 }}>KATANA ZERO TRIBUTE</div>
        </div>
        <button onClick={startGame} style={{ ...btn, background: c.a, color: "#fff", marginTop: 16, fontSize: 18, padding: "14px 48px" }}>
          START
        </button>
        <div style={{ fontSize: 11, color: c.m, fontFamily: font, textAlign: "center", lineHeight: 1.8, marginTop: 8 }}>
          {isDesktop ? (
            <>WASD / Arrows — Move &amp; Jump<br/>J / Z — Slash &nbsp;&nbsp; L / C — Dash<br/>K / X / Shift — Focus &nbsp;&nbsp; ESC — Pause</>
          ) : (
            <>Touch left/right to move<br/>Touch to jump, slash, dash &amp; focus</>
          )}
        </div>
        {highScore > 0 && (
          <div style={{ fontSize: 13, color: c.go, fontFamily: font, marginTop: 8, textShadow: `0 0 20px ${c.go}60` }}>
            HIGH SCORE: {String(highScore).padStart(5, "0")}
          </div>
        )}
      </div>
    );
  }

  // ═══ PAUSED ═══
  if (screen === "paused") {
    return (
      <div style={{ position: "relative", width: "100%", height: "100%", background: "#000" }}>
        <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
        <div style={{ ...overlay, background: "rgba(0,0,0,0.7)" }}>
          <div style={{ fontSize: 32, fontWeight: 900, fontFamily: font, color: c.tx, letterSpacing: ".1em" }}>PAUSED</div>
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button onClick={() => { if (gameRef.current) gameRef.current.time.last = performance.now(); setScreen("playing"); }} style={{ ...btn, background: c.a, color: "#fff" }}>
              RESUME
            </button>
            <button onClick={() => setScreen("menu")} style={{ ...btn, background: c.s2, color: c.tx, border: `1px solid ${c.b}` }}>
              QUIT
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══ DEAD ═══
  if (screen === "dead") {
    return (
      <div style={{ ...overlay, background: c.bg }}>
        <style>{cssFx}</style>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(192,40,42,0.08)", pointerEvents: "none" }} />
        <div style={{ fontSize: 36, fontWeight: 900, fontFamily: font, color: c.a, letterSpacing: ".12em", animation: "glitchBig 2s ease-in-out infinite", ...glowText }}>
          MISSION FAILED
        </div>
        <div style={{ fontSize: 18, fontFamily: font, color: c.tx, marginTop: 16 }}>
          SCORE: {String(score).padStart(5, "0")}
        </div>
        {maxCombo > 1 && <div style={{ fontSize: 13, color: "#ffa040", fontFamily: font, marginTop: 4 }}>MAX COMBO: x{maxCombo}</div>}
        {score > 0 && score >= highScore && (
          <div style={{ fontSize: 14, color: c.go, fontFamily: font, marginTop: 8 }}>NEW HIGH SCORE!</div>
        )}
        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button onClick={startGame} style={{ ...btn, background: c.a, color: "#fff" }}>RETRY</button>
          <button onClick={() => setScreen("menu")} style={{ ...btn, background: c.s2, color: c.tx, border: `1px solid ${c.b}` }}>QUIT</button>
        </div>
      </div>
    );
  }

  // ═══ VICTORY ═══
  if (screen === "victory") {
    return (
      <div style={{ ...overlay, background: c.bg }}>
        <div style={{ fontSize: 36, fontWeight: 900, fontFamily: font, color: c.go, letterSpacing: ".08em", textShadow: `0 0 30px ${c.go}60` }}>
          MISSION COMPLETE
        </div>
        <div style={{ fontSize: 14, fontFamily: font, color: c.m, marginTop: 8 }}>斬り捨て御免</div>
        <div style={{ marginTop: 20, textAlign: "center", fontFamily: font }}>
          <div style={{ fontSize: 22, color: c.tx }}>SCORE: {String(score).padStart(5, "0")}</div>
          {maxCombo > 1 && <div style={{ fontSize: 14, color: "#ffa040", marginTop: 6 }}>MAX COMBO: x{maxCombo}</div>}
          {score >= highScore && score > 0 && (
            <div style={{ fontSize: 14, color: c.go, marginTop: 8, fontWeight: 700 }}>NEW HIGH SCORE!</div>
          )}
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button onClick={startGame} style={{ ...btn, background: c.a, color: "#fff" }}>PLAY AGAIN</button>
          <button onClick={() => setScreen("menu")} style={{ ...btn, background: c.s2, color: c.tx, border: `1px solid ${c.b}` }}>BACK</button>
        </div>
      </div>
    );
  }

  // ═══ PLAYING ═══
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#0a0a14", overflow: "hidden", touchAction: "none" }}>
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}
