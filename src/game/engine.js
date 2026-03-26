import {
  GRAVITY, MOVE_SPEED, JUMP_FORCE, SLASH_DURATION, SLASH_RANGE,
  DASH_SPEED, DASH_DURATION, DASH_COOLDOWN, GROUND_POUND_SPEED, PARRY_WINDOW,
  TILE, SCALE, GROUND_Y, TOTAL_ROOMS, STAR_3, STAR_2,
  ENEMY_CONFIG, KILL_ZOOM, KILL_ZOOM_3RD, MILESTONE_ZOOM, LAST_KILL_FREEZE,
  lerp, clamp, rnd, rndInt,
} from "./constants.js";
import { updateEnemyAI, makeEnemy, makePlayer } from "./entities.js";
import { ROOMS } from "./levels.js";
import { playSound, playRandom, playRandomExclusive } from "./audio.js";

// ═══ ROOM MANAGEMENT ═══
export function loadRoom(g, roomIndex) {
  const room = ROOMS[roomIndex];
  if (!room) return;
  g.currentRoom = roomIndex;
  g._rooms = ROOMS; // expose for renderer theme lookup
  g.platforms = room.platforms.map(p => ({ x: p.x, y: g.groundY + p.y, w: p.w, h: p.h || 16, ...(p.wall && { wall: true }) }));
  g.enemies = room.enemies.map(e => makeEnemy(e.type, e.x, g.groundY + (e.y || 0), { passive: e.passive }));
  g.decorations = (room.deco || []).map(d => ({ type: d.type, x: d.x, y: g.groundY }));
  g.shadows = (room.shadows || []).map(s => ({ x: s.x, w: s.w, y: g.groundY }));
  // Hazards
  g.hazards = (room.hazards || []).map(h => ({
    ...h,
    y: g.groundY + (h.y || 0),
    timer: h.type === "firejet" ? (h.offset || 0) : 0,
    active: h.type !== "firejet",
    shaking: 0, fallen: false, respawnTimer: 0, // falling platform state
    originalY: g.groundY + (h.y || 0),
  }));
  g.levelW = Math.max(...room.platforms.map(p => p.x + p.w));
  g.player = makePlayer(g.groundY, room.playerStart || 100);
  g.particles = [];
  g.slashEffects = [];
  g.projectiles = [];
  g.floatingTexts = [];
  g.embers = [];
  g.camera.x = 0;
  g.camera.shakeTimer = 0;
  g.camera.shakeX = 0;
  g.camera.shakeY = 0;
  g.camera.zoom = 1;
  g.camera.zoomTarget = 1;
  g.camera.lookAhead = 0;
  g.slowMo.meter = g.slowMo.max;
  g.slowMo.active = false;
  // Reset input flags so held keys from previous life don't carry over
  g.input.left = false;
  g.input.right = false;
  g.input.up = false;
  g.input.down = false;
  g.input.slash = false;
  g.input.slowmo = false;
  g.input.dash = false;
  g.input.slashPressed = false;
  g.input.jumpPressed = false;
  g.input.dashPressed = false;
  g.input.downPressed = false;
  g.hitStop = 0;
  g.flashTimer = 0;
  g.roomTimer = 0;
  g.roomState = "playing";
  g.roomClearTimer = 0;
  g.combo = 0;
  g.comboTimer = 0;
  g.letterbox = 0;
  g.fadeOverlay = 1; // fade in from black
  // Act-aware room title with Japanese name
  const title = room.title;
  const titleText = title ? `${title.jp}  ${title.en}` : `ROOM ${roomIndex + 1}`;
  g.roomTitle = { text: titleText, timer: 1200 };
  // Tutorial system
  g.tutorials = (room.tutorials || []).map(t => ({ ...t, shown: false, dismissed: false, timer: 0 }));
  g.activeTutorial = null;
}

function restartRoom(g) {
  g.deaths++;
  g.deathFlash = 300;
  loadRoom(g, g.currentRoom);
}

function clearRoom(g, callbacks) {
  g.roomState = "cleared";
  g.roomClearTimer = 2200; // 2.2s pause to show rating
  playSound("roomClear");
  g.letterbox = 0; // will animate to 1
  // Calculate star rating
  const time = g.roomTimer;
  const stars = time < STAR_3 ? 3 : time < STAR_2 ? 2 : 1;
  g.roomStars[g.currentRoom] = stars;
  g.totalTime += time;
  // Big floating text
  const starText = "★".repeat(stars) + "☆".repeat(3 - stars);
  g.floatingTexts.push({
    x: g.W / 2 + g.camera.x, y: g.groundY - 80,
    text: `ROOM CLEAR  ${starText}`, color: stars === 3 ? "#ffdd44" : "#ffffff",
    life: 1800, maxLife: 1800,
  });
  g.floatingTexts.push({
    x: g.W / 2 + g.camera.x, y: g.groundY - 55,
    text: `${time.toFixed(1)}s`, color: "#aaaacc",
    life: 1800, maxLife: 1800,
  });
  // Auto-save progress after clearing a room
  saveProgress(g);
}

// ═══ SAVE SYSTEM ═══
const SAVE_KEY = "nihongo-game-save";

function saveProgress(g) {
  try {
    const data = {
      currentRoom: g.currentRoom + 1, // save NEXT room (resume point)
      score: g.score, deaths: g.deaths,
      roomStars: g.roomStars, totalTime: g.totalTime,
      timestamp: Date.now(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {}
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export function deleteSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch {}
}

// ═══ UPDATE ═══
export function update(g, callbacks) {
  const { setScore, setMaxCombo, setScreen, isDesktop, SIDEBAR_W, highScore, setHighScore } = callbacks;
  const now = performance.now();
  let rawDt = Math.min(now - g.time.last, 33) / 1000;
  g.time.last = now;

  // Hit-stop freeze
  if (g.hitStop > 0) { g.hitStop -= rawDt * 1000; return; }

  // Slow-mo — require 20% meter to START (prevents rapid flicker when meter depletes)
  const wasSlowMo = g.slowMo.active;
  const canSlowMo = g.slowMo.active ? g.slowMo.meter > 0 : g.slowMo.meter > 20;
  if (g.input.slowmo && canSlowMo) {
    g.slowMo.active = true;
    g.slowMo.meter = Math.max(0, g.slowMo.meter - 40 * rawDt);
    g.time.scale = 0.25;
    if (g.slowMo.meter <= 0) g.slowMo.active = false;
  } else {
    g.slowMo.active = false;
    g.time.scale = 1;
    g.slowMo.meter = Math.min(g.slowMo.max, g.slowMo.meter + 15 * rawDt);
  }
  if (!wasSlowMo && g.slowMo.active) playSound("slowmoOn");
  if (wasSlowMo && !g.slowMo.active) playSound("slowmoOff");

  const dt = rawDt * g.time.scale;
  g.time.dt = dt;
  g.time.elapsed += dt;

  // ── Ambient particles ──

  // Fireflies / spirit orbs — float gently, pulse
  if (Math.random() < dt * 2) {
    g.embers.push({
      x: g.camera.x + rnd(-50, g.W + 50), y: rnd(g.H * 0.1, g.H * 0.7),
      vx: rnd(-8, 8), vy: rnd(-12, -4),
      life: rnd(4000, 8000), maxLife: 8000,
      size: rnd(1.5, 3), color: "#80ff80", type: "firefly",
      phase: rnd(0, Math.PI * 2),
    });
  }
  // Drifting leaves — fall slowly, sway side to side, pushed by wind
  if (Math.random() < dt * 1.5) {
    g.embers.push({
      x: g.camera.x + rnd(0, g.W), y: -10,
      vx: rnd(-20, -5) - (g._wind || 0) * 0.5, vy: rnd(15, 35),
      life: rnd(5000, 10000), maxLife: 10000,
      size: rnd(2, 4), color: rnd(0, 1) > 0.6 ? "#3a6a40" : "#2a5030", type: "leaf",
      phase: rnd(0, Math.PI * 2),
    });
  }
  // Tiny dust motes
  if (Math.random() < dt * 3) {
    g.embers.push({
      x: g.camera.x + rnd(0, g.W), y: rnd(g.H * 0.3, g.H * 0.8),
      vx: rnd(-5, 5), vy: rnd(-8, -2),
      life: rnd(3000, 6000), maxLife: 6000,
      size: rnd(0.5, 1.5), color: "#ffffff", type: "dust",
      phase: rnd(0, Math.PI * 2),
    });
  }
  // Rain — diagonal streaks, bent by periodic wind gusts
  const wind = g._wind || 0;
  for (let i = 0; i < 6; i++) {
    g.embers.push({
      x: g.camera.x + rnd(-100, g.W + 100), y: rnd(-20, -5),
      vx: rnd(-40, -20) - wind, vy: rnd(700, 1000),
      life: rnd(400, 700), maxLife: 700,
      size: rnd(1.5, 2.5), color: rnd(0,1) > 0.3 ? "#99aacc" : "#bbccee", type: "rain",
    });
  }

  for (const em of g.embers) {
    if (em.type === "firefly") {
      em.x += em.vx * dt + Math.sin(g.time.elapsed * 1.5 + em.phase) * dt * 15;
      em.y += em.vy * dt + Math.cos(g.time.elapsed * 1.2 + em.phase) * dt * 10;
    } else if (em.type === "leaf") {
      em.x += em.vx * dt + Math.sin(g.time.elapsed * 2 + em.phase) * dt * 25;
      em.y += em.vy * dt;
      em.phase += dt * 3;
    } else if (em.type === "rain") {
      em.x += em.vx * dt;
      em.y += em.vy * dt;
      // Splash when hitting platforms, player, or ground
      let splashed = false;
      // Check platform surfaces
      for (const plat of g.platforms) {
        if (!plat.wall && em.x > plat.x && em.x < plat.x + plat.w &&
            em.y > plat.y && em.y < plat.y + 8) {
          em.life = 0;
          splashed = true;
          // Visible splash on platform surface
          for (let j = 0; j < 3; j++) {
            g.particles.push({
              x: em.x + rnd(-3, 3), y: plat.y,
              vx: rnd(-35, 35), vy: rnd(-50, -15),
              life: 180, maxLife: 180, color: j === 0 ? "#bbccee" : "#99aacc", size: rnd(1, 2),
            });
          }
          break;
        }
      }
      // Splash on player
      if (!splashed && !g.player.dead) {
        const p = g.player;
        if (em.x > p.x - 20 && em.x < p.x + 20 && em.y > p.y && em.y < p.y + TILE * SCALE) {
          em.life = 0;
          splashed = true;
          g.particles.push({
            x: em.x, y: em.y,
            vx: rnd(-30, 30), vy: rnd(-40, -15),
            life: 80, maxLife: 80, color: "#bbccee", size: rnd(0.5, 1),
          });
        }
      }
      // Splash on ground
      if (!splashed && em.y > g.groundY) {
        em.life = 0;
        for (let j = 0; j < 3; j++) {
          g.particles.push({
            x: em.x + rnd(-3, 3), y: g.groundY,
            vx: rnd(-35, 35), vy: rnd(-50, -15),
            life: 180, maxLife: 180, color: j === 0 ? "#bbccee" : "#99aacc", size: rnd(1, 2),
          });
        }
      }
    } else {
      em.x += em.vx * dt + Math.sin(g.time.elapsed * 0.8 + (em.phase || 0)) * dt * 5;
      em.y += em.vy * dt;
    }
    em.life -= dt * 1000;
  }
  g.embers = g.embers.filter(em => em.life > 0);

  const p = g.player;
  if (p.dead) return;

  // ── Player movement ──
  const moveDir = (g.input.left ? -1 : 0) + (g.input.right ? 1 : 0);

  // Dash
  if (g.input.dashPressed && p.dashCooldown <= 0 && p.dashTimer <= 0) {
    p.dashTimer = DASH_DURATION;
    p.dashCooldown = DASH_COOLDOWN;
    if (moveDir !== 0) p.facing = moveDir;
    p.vy = 0;
    p.afterimages.push({ x: p.x, y: p.y, facing: p.facing, life: 200 });
    playSound("dash");
  }
  g.input.dashPressed = false;

  if (p.dashTimer > 0) {
    p.dashTimer -= rawDt * 1000;
    p.vx = p.facing * DASH_SPEED;
    p.invincible = 100;
    if (Math.floor(p.dashTimer / 25) !== Math.floor((p.dashTimer + rawDt * 1000) / 25)) {
      p.afterimages.push({ x: p.x, y: p.y, facing: p.facing, life: 150 });
    }
    // Speed lines during dash
    for (let i = 0; i < 2; i++) {
      g.particles.push({
        x: p.x - p.facing * rnd(10, 40), y: p.y + rnd(5, TILE * SCALE - 5),
        vx: -p.facing * rnd(100, 200), vy: rnd(-10, 10),
        life: 150, maxLife: 150, color: "#ffffff", size: rnd(1, 2), isLine: true,
      });
    }
    // ── DASH-SLASH: press slash during dash ──
    if (g.input.slashPressed) {
      p.dashSlashing = true;
      p.dashTimer = Math.max(p.dashTimer, 80); // extend dash slightly
      p.slashTimer = SLASH_DURATION;
      p.slashDuration = SLASH_DURATION;
      p.slashCombo = 1;
      p.invincible = 200; // extended i-frames during dash-slash
      playSound("backstab", { volume: 0.8 });
      playRandomExclusive("slash", "swoosh", { volume: 0.6 });
      // Purple speed-line burst
      for (let i = 0; i < 12; i++) {
        g.particles.push({
          x: p.x, y: p.y + rnd(5, TILE * SCALE - 5),
          vx: p.facing * rnd(200, 500), vy: rnd(-30, 30),
          life: 200, maxLife: 200, color: i % 2 === 0 ? "#aa55ff" : "#ffffff", size: rnd(1, 2), isLine: true,
        });
      }
      g.slashEffects.push({
        x: p.x, y: p.y + TILE * SCALE * 0.4,
        facing: p.facing, timer: 300, maxTimer: 300,
        combo: 1, startAngle: -0.8, endAngle: 0.8, radius: 80,
      });
      g.input.slashPressed = false;
    }
  } else if (p.slashTimer > 0) {
    // Keep momentum — long slide through enemies (less friction = further)
    p.vx *= 0.985;
  } else if (p.wallJumpCooldown > 0) {
    // During wall jump — preserve launch momentum, no air control override
    // Player automatically flies to opposite wall without needing to steer
    p.vx *= 0.99; // tiny drag so they don't overshoot
  } else {
    p.vx = moveDir * MOVE_SPEED;
    if (moveDir !== 0) p.facing = moveDir;
  }

  if (p.dashCooldown > 0) p.dashCooldown -= rawDt * 1000;

  // Afterimage decay
  for (const ai of p.afterimages) ai.life -= rawDt * 1000;
  p.afterimages = p.afterimages.filter(ai => ai.life > 0);

  // Running dust + footstep sounds — synced to animation frame changes
  if (p.grounded && Math.abs(p.vx) > 100) {
    p._stepTimer = (p._stepTimer || 0) + rawDt * 1000;
    // Play step every ~130ms (matches run animation feel)
    if (p._stepTimer > 130) {
      p._stepTimer = 0;
      g.particles.push({
        x: p.x + rnd(-6, 6), y: p.y + TILE * SCALE,
        vx: -p.facing * rnd(20, 50), vy: rnd(-30, -10),
        life: 250, maxLife: 250, color: "#666666", size: rndInt(2, 3),
      });
      playRandom("step", { volume: 0.8, playbackRate: rnd(0.9, 1.1) });
    }
  } else {
    p._stepTimer = 0;
  }

  // Jump + wall jump
  if (p.wallJumpCooldown > 0) p.wallJumpCooldown -= rawDt * 1000;
  if (g.input.jumpPressed) {
    if (p.grounded) {
      p.vy = JUMP_FORCE;
      p.grounded = false;
      spawnDust(g, p.x, p.y + TILE * SCALE);
      playSound("jump");
    } else if (p.wallSliding) {
      // Wall jump — launch away, track which wall we left
      p.vy = JUMP_FORCE * 0.9;
      p.vx = -p.wallDir * MOVE_SPEED * 1.6;
      p.facing = -p.wallDir;
      const halfW = TILE * SCALE * 0.5;
      p._lastWallX = p.wallDir === 1 ? p.x + halfW : p.x - halfW; // x of wall we jumped from
      p.wallSliding = false;
      p.wallJumpCooldown = 200;
      playSound("wall_launch");
      for (let i = 0; i < 4; i++) {
        g.particles.push({
          x: p.x + p.wallDir * 15, y: p.y + rnd(10, TILE * SCALE - 10),
          vx: -p.wallDir * rnd(30, 80), vy: rnd(-50, 50),
          life: 200, maxLife: 200, color: "#888888", size: rndInt(1, 3),
        });
      }
    }
  }
  g.input.jumpPressed = false;

  // ── Ground Pound — slam downward while airborne ──
  if (g.input.downPressed && !p.grounded && !p.groundPounding && p.dashTimer <= 0) {
    p.groundPounding = true;
    p.vy = GROUND_POUND_SPEED;
    p.vx = 0;
    playSound("dash", { volume: 0.7, playbackRate: 0.7 });
    // Downward speed lines
    for (let i = 0; i < 6; i++) {
      g.particles.push({
        x: p.x + rnd(-8, 8), y: p.y,
        vx: rnd(-30, 30), vy: -rnd(100, 250),
        life: 150, maxLife: 150, color: "#ffffff", size: rnd(1, 2), isLine: true,
      });
    }
  }
  g.input.downPressed = false;

  // Ground pound landing impact
  if (p.groundPounding && p.grounded) {
    p.groundPounding = false;
    g.camera.shakeTimer = 150;
    playSound("land", { volume: 1.0 });
    // Shockwave particles
    for (let i = 0; i < 10; i++) {
      g.particles.push({
        x: p.x + rnd(-5, 5), y: p.y + TILE * SCALE,
        vx: rnd(-200, 200), vy: rnd(-150, -40),
        life: 350, maxLife: 350, color: "#888888", size: rndInt(2, 4),
      });
    }
    // Damage enemies within range below
    for (const e of g.enemies) {
      if (e.dead) continue;
      const dx = Math.abs(e.x - p.x);
      const dy = e.y - p.y;
      if (dx < 80 && dy > -20 && dy < TILE * SCALE + 20) {
        if ((e.type === "samurai" || e.type === "brute") && !e.blocking) {
          // Ground pound dazes samurai/brute from above
          e.dazed = 1500;
          e.state = "dazed";
          g.floatingTexts.push({ x: e.x, y: e.y - 20, text: "STUNNED!", color: "#ffdd44", life: 800, maxLife: 800 });
        } else if (e.type !== "samurai" && e.type !== "brute") {
          killEnemy(g, e, p, callbacks);
        }
      }
    }
  }

  // ── Slash — 3-hit combo chain ──
  // Combo window: press slash again within 300ms of previous slash ending
  if (p.comboWindow > 0) p.comboWindow -= rawDt * 1000;
  if (p.comboWindow <= 0 && p.slashTimer <= 0) p.slashCombo = 0;

  if (g.input.slashPressed && p.slashTimer <= 0 && (p.slashCombo === 0 || p.comboWindow > 0)) {
    // Advance combo (0→1, 1→2, 2→3, max 3)
    p.slashCombo = Math.min(p.slashCombo + 1, 3);
    const combo = p.slashCombo;

    // Duration: 1st=normal, 2nd=normal, 3rd=held longer for dramatic pose
    const dur = combo === 3 ? SLASH_DURATION * 2.5 : SLASH_DURATION;
    p.slashTimer = dur;
    p.slashDuration = dur;
    p.frame = 0;
    p.comboWindow = 350; // ms to press next slash after this one ends

    // Afterimage
    p.afterimages.push({ x: p.x, y: p.y, facing: p.facing, life: combo === 3 ? 300 : 200 });
    // Sound per combo: shing for first draw, swoosh for follow-ups, electric for finisher
    if (combo === 1) {
      playRandomExclusive("slash", "shing", { volume: 0.6 }); // blade draw
    } else {
      playRandomExclusive("slash", "swoosh", { volume: combo === 3 ? 0.7 : 0.5 });
    }
    if (combo === 3) playSound("slash3_electric", { volume: 0.5 });

    // Lunge — each hit goes further, big slide
    const lungeSpeed = combo === 1 ? DASH_SPEED * 1.0 : combo === 2 ? DASH_SPEED * 1.2 : DASH_SPEED * 1.6;
    p.vx = p.facing * lungeSpeed;

    // Slash arc — animated sweeping crescent
    const arcDuration = combo === 3 ? 450 : 300;
    g.slashEffects.push({
      x: p.x, y: p.y + TILE * SCALE * 0.4,
      facing: p.facing, timer: arcDuration, maxTimer: arcDuration,
      combo,
      // Arc sweep parameters per combo level
      startAngle: combo === 1 ? -0.8 : combo === 2 ? -1.8 : -Math.PI,
      endAngle: combo === 1 ? 0.8 : combo === 2 ? 0.6 : Math.PI,
      radius: combo === 1 ? 70 : combo === 2 ? 80 : 100,
    });

    // Speed lines — more on higher combos
    const lineCount = combo === 1 ? 4 : combo === 2 ? 6 : 10;
    for (let i = 0; i < lineCount; i++) {
      const color = combo === 3 ? (i % 2 === 0 ? "#60bbff" : "#ffffff") : "#ffffff";
      g.particles.push({
        x: p.x - p.facing * rnd(5, 30), y: p.y + rnd(5, TILE * SCALE - 5),
        vx: p.facing * rnd(150, 400), vy: rnd(-20, 20),
        life: 140, maxLife: 140, color, size: rnd(1, 1.5), isLine: true,
      });
    }

    // 3rd hit: epic lightning burst — tiny sparks
    if (combo === 3) {
      // Blue spark shower
      for (let i = 0; i < 16; i++) {
        g.particles.push({
          x: p.x + p.facing * rnd(0, 30), y: p.y + TILE * SCALE / 2 + rnd(-10, 10),
          vx: p.facing * rnd(100, 450), vy: rnd(-220, -30),
          life: 400, maxLife: 400, color: rnd(0,1) > 0.5 ? "#40aaff" : "#80ddff", size: rnd(1, 2),
        });
      }
      // Red + yellow tiny sparks
      for (let i = 0; i < 8; i++) {
        const colors = ["#ff4444", "#ffaa30", "#ffdd40", "#ff6633"];
        g.particles.push({
          x: p.x + p.facing * rnd(5, 25), y: p.y + TILE * SCALE / 2 + rnd(-8, 8),
          vx: p.facing * rnd(50, 300), vy: rnd(-280, -60),
          life: 350, maxLife: 350, color: colors[i % 4], size: rnd(1, 2),
        });
      }
      // Blue lightning bolt lines
      for (let i = 0; i < 6; i++) {
        g.particles.push({
          x: p.x + p.facing * rnd(10, 40), y: p.y + rnd(5, TILE * SCALE - 5),
          vx: p.facing * rnd(250, 550), vy: rnd(-30, 30),
          life: 150, maxLife: 150, color: "#60ccff", size: rnd(0.8, 1.5), isLine: true,
        });
      }
    }
  }
  g.input.slashPressed = false;

  // Gravity
  if (p.dashTimer <= 0) p.vy += GRAVITY * dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;

  // ── Horizontal wall collision — walls are SOLID, player can't walk through ──
  // Skip during wall jump (player is being launched between walls)
  const pw = TILE * SCALE * 0.5;
  if (p.wallJumpCooldown <= 0) {
    for (const plat of g.platforms) {
      if (!plat.wall) continue;
      const playerBottom = p.y + TILE * SCALE;
      const playerTop = p.y;
      // Only collide if player overlaps the wall vertically
      if (playerBottom <= plat.y || playerTop >= plat.y + plat.h) continue;
      const playerRight = p.x + pw;
      const playerLeft = p.x - pw;
      if (playerRight > plat.x && playerLeft < plat.x + plat.w) {
        // Player overlaps wall — push out from nearest face
        const overlapLeft = playerRight - plat.x;
        const overlapRight = (plat.x + plat.w) - playerLeft;
        if (overlapLeft < overlapRight) {
          p.x = plat.x - pw;
          if (p.vx > 0) p.vx = 0;
        } else {
          p.x = plat.x + plat.w + pw;
          if (p.vx < 0) p.vx = 0;
        }
      }
    }
  }

  // ── Platform collision — landing on top of surfaces ──
  const wasGrounded = p.grounded;
  p.grounded = false;
  for (const plat of g.platforms) {
    // Can land on TOP of wall blocks (only the very top surface)
    const landH = plat.wall ? 6 : plat.h;
    if (p.x + pw > plat.x && p.x - pw < plat.x + plat.w &&
        p.y + TILE * SCALE > plat.y && p.y + TILE * SCALE < plat.y + landH + Math.abs(p.vy * dt) + 10 &&
        p.vy >= 0) {
      p.y = plat.y - TILE * SCALE;
      if (!wasGrounded && p.vy > 300) {
        spawnDust(g, p.x, p.y + TILE * SCALE);
        playSound("land", { volume: Math.min(1, p.vy / 600) });
        if (p.vy > 500) g.camera.shakeTimer = 50;
      }
      p.vy = 0;
      p.grounded = true;
    }
  }

  // ── Hazard updates + collision ──
  if (g.hazards) {
    for (const h of g.hazards) {
      if (h.type === "spikes") {
        // Static — check if player is touching
        if (!p.dead && p.x + 15 > h.x && p.x - 15 < h.x + h.w &&
            p.y + TILE * SCALE > h.y - 4 && p.y + TILE * SCALE < h.y + 12 && p.vy >= 0) {
          killPlayer(g, callbacks);
        }
      } else if (h.type === "firejet") {
        // Timer-based toggle: cycle = onTime + offTime
        h.timer += rawDt * 1000;
        const cycle = (h.onTime || 1500) + (h.offTime || 2000);
        const phase = h.timer % cycle;
        const wasActive = h.active;
        h.active = phase < (h.onTime || 1500);
        // Telegraph: 500ms glow before activating
        h.telegraph = !h.active && phase > cycle - 500;
        if (!wasActive && h.active) playSound("dash", { volume: 0.3, playbackRate: 1.5 });
        // Damage player if active and overlapping
        if (h.active && !p.dead && p.invincible <= 0 &&
            p.x + 10 > h.x && p.x - 10 < h.x + (h.w || 30) &&
            p.y + TILE * SCALE > h.y - (h.h || 80) && p.y < h.y) {
          killPlayer(g, callbacks);
        }
      } else if (h.type === "falling") {
        // Falling platform — shake when stood on, then drop
        if (h.fallen) {
          h.respawnTimer -= rawDt * 1000;
          if (h.respawnTimer <= 0) {
            h.fallen = false;
            h.y = h.originalY;
            h.shaking = 0;
          }
          continue;
        }
        // Check if player is standing on it
        const onPlat = p.grounded && p.x + 15 > h.x && p.x - 15 < h.x + h.w &&
                        Math.abs((p.y + TILE * SCALE) - h.y) < 8;
        if (onPlat && h.shaking === 0) h.shaking = 400; // start shake countdown
        if (h.shaking > 0) {
          h.shaking -= rawDt * 1000;
          if (h.shaking <= 0) {
            h.fallen = true;
            h.respawnTimer = 3000;
            h.y = g.H + 200; // move offscreen
            playSound("land", { volume: 0.6, playbackRate: 0.5 });
          }
        }
        // Act as platform (handled by renderer drawing it, engine checks collision)
        if (!h.fallen && p.x + 15 > h.x && p.x - 15 < h.x + h.w &&
            p.y + TILE * SCALE > h.y && p.y + TILE * SCALE < h.y + 12 + Math.abs(p.vy * dt) + 10 &&
            p.vy >= 0) {
          p.y = h.y - TILE * SCALE;
          p.vy = 0;
          p.grounded = true;
        }
      }
    }
  }

  p.x = Math.max(10, Math.min(g.levelW - 10, p.x));

  // ── Wall sliding — grab walls while airborne ──
  // During wallJumpCooldown: can grab OPPOSITE wall (not the one we jumped from)
  const wasWallSliding = p.wallSliding;
  p.wallSliding = false;
  p.wallDir = 0;
  if (!p.grounded) {
    for (const plat of g.platforms) {
      if (!plat.wall) continue;
      const playerBottom = p.y + TILE * SCALE;
      const playerTop = p.y;
      if (playerBottom <= plat.y || playerTop >= plat.y + plat.h) continue;

      // Player's right side against wall's left face
      if (Math.abs((p.x + pw) - plat.x) < 8) {
        // During cooldown, skip if this is the wall we just jumped from
        if (p.wallJumpCooldown > 0 && Math.abs(plat.x - (p._lastWallX || -999)) < 50) continue;
        p.wallSliding = true;
        p.wallDir = 1;
        if (p.vy > 0) p.vy = Math.min(p.vy, 100);
        p.x = plat.x - pw;
        p.wallJumpCooldown = 0; // grabbed a wall — clear cooldown
      }
      // Player's left side against wall's right face
      if (Math.abs((p.x - pw) - (plat.x + plat.w)) < 8) {
        if (p.wallJumpCooldown > 0 && Math.abs((plat.x + plat.w) - (p._lastWallX || -999)) < 50) continue;
        p.wallSliding = true;
        p.wallDir = -1;
        if (p.vy > 0) p.vy = Math.min(p.vy, 100);
        p.x = plat.x + plat.w + pw;
        p.wallJumpCooldown = 0;
      }
    }
  }
  // Wall-slide effects
  if (p.wallSliding && !wasWallSliding) playSound("wall_grab");
  if (p.wallSliding && p.vy > 0 && Math.random() < dt * 12) {
    g.particles.push({
      x: p.x + p.wallDir * pw, y: p.y + rnd(20, TILE * SCALE),
      vx: -p.wallDir * rnd(15, 40), vy: rnd(-30, -5),
      life: 200, maxLife: 200, color: "#888888", size: rndInt(1, 3),
    });
  }

  if (p.y > g.H + 100) killPlayer(g, callbacks);

  // Slash timer
  if (p.slashTimer > 0) p.slashTimer -= dt * 1000;
  if (p.slashTimer <= 0) p.dashSlashing = false;

  // Parry timer (used by renderer for parry sprite display)
  if (p.parryTimer > 0) p.parryTimer -= dt * 1000;

  // Player state machine
  if (p.dashTimer > 0) {
    p.state = "dash";
  } else if (p.slashTimer > 0) {
    const progress = 1 - p.slashTimer / (p.slashDuration || SLASH_DURATION);
    p.state = progress < 0.2 ? "slash1" : progress < 0.85 ? "slash2" : "slash3";
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

  // ── Squash/stretch — target scales based on state, lerp toward them ──
  let targetSX = 1, targetSY = 1;
  if (p.dashTimer > 0) { targetSX = 1.2; targetSY = 0.8; }
  else if (p.slashTimer > 0) {
    const slashProg = 1 - p.slashTimer / (p.slashDuration || SLASH_DURATION);
    if (slashProg < 0.2) { targetSX = 0.9; targetSY = 1.1; }
    else { targetSX = 1.15; targetSY = 0.85; }
  }
  else if (!p.grounded && p.vy < -200) { targetSX = 0.9; targetSY = 1.1; }
  else if (!p.grounded && p.vy > 200) { targetSX = 0.95; targetSY = 1.05; }
  else if (p.grounded && !wasGrounded) { targetSX = 1.15; targetSY = 0.85; } // landing squash
  const scaleSmooth = 1 - Math.pow(0.0001, rawDt); // fast ease
  p.scaleX = lerp(p.scaleX, targetSX, scaleSmooth);
  p.scaleY = lerp(p.scaleY, targetSY, scaleSmooth);

  // ── Enemies ──
  for (const e of g.enemies) {
    if (e.dead) {
      e.deathTimer -= dt * 1000;
      // Knockback death physics — fly back and slide along ground with blood trail
      if (e.deathStyle === "knockback") {
        // Check if still on a platform (re-check each frame — fall off edges)
        e._onGround = false;
        let groundPlat = null;
        for (const plat of g.platforms) {
          if (plat.wall) continue;
          // Must be within platform x bounds (not past edges)
          if (e.x > plat.x && e.x < plat.x + plat.w &&
              e.y + TILE * SCALE >= plat.y - 2 && e.y + TILE * SCALE <= plat.y + 20) {
            e._onGround = true;
            groundPlat = plat;
            e.y = plat.y - TILE * SCALE;
            e.vy = 0;
          }
        }

        // Gravity when airborne (fell off edge or launched)
        if (!e._onGround) {
          e.vy += GRAVITY * dt;
          e.y += e.vy * dt;
          // Land on platforms from above
          for (const plat of g.platforms) {
            if (plat.wall) continue;
            if (e.x > plat.x && e.x < plat.x + plat.w &&
                e.y + TILE * SCALE > plat.y && e.y + TILE * SCALE < plat.y + Math.abs(e.vy * dt) + 10 &&
                e.vy >= 0) {
              e.y = plat.y - TILE * SCALE;
              e.vy = 0;
              e._onGround = true;
              groundPlat = plat;
            }
          }
        }

        // Horizontal slide with friction
        e.x += e.vx * dt;
        e.vx *= e._onGround ? 0.96 : 0.99; // less friction = longer slide

        // Stop at walls
        const epw = TILE * SCALE * 0.3;
        for (const wall of g.platforms) {
          if (!wall.wall) continue;
          if (e.y + TILE * SCALE <= wall.y || e.y >= wall.y + wall.h) continue;
          if (e.x + epw > wall.x && e.x - epw < wall.x + wall.w) {
            if (e.vx > 0) e.x = wall.x - epw;
            else e.x = wall.x + wall.w + epw;
            e.vx = 0;
          }
        }

        // Kill if fallen off screen
        if (e.y > g.H + 200) { e.deathTimer = 0; }

        // Blood trail ONLY while on a platform and sliding
        if (e._onGround && Math.abs(e.vx) > 15 && groundPlat) {
          if (Math.random() < dt * 30) {
            g.particles.push({
              x: e.x + rnd(-5, 5), y: groundPlat.y - 1,
              vx: 0, vy: 0, life: 10000, maxLife: 10000,
              color: rnd(0,1) > 0.4 ? "#550000" : "#3a0000",
              size: rnd(4, 10), isStain: true,
            });
          }
          if (Math.random() < dt * 12) {
            g.particles.push({
              x: e.x + rnd(-6, 6), y: groundPlat.y - 4,
              vx: -e.vx * rnd(0.1, 0.3), vy: rnd(-80, -30),
              life: 300, maxLife: 300,
              color: rnd(0,1) > 0.5 ? "#cc1111" : "#aa0000", size: rnd(1, 3),
            });
          }
        }
      }
      // Cinematic death phases
      if (e.deathStyle === "cinematic") {
        if (e.deathTimer < 800 && e.deathPhase === 0) e.deathPhase = 1; // kneel
        if (e.deathTimer < 400 && e.deathPhase === 1) e.deathPhase = 2; // face plant
      }
      continue;
    }

    // Find which platform the enemy is on and store bounds BEFORE AI runs
    let onPlatform = false;
    let platLeft = -Infinity, platRight = Infinity;
    for (const plat of g.platforms) {
      if (e.x > plat.x - 5 && e.x < plat.x + plat.w + 5 &&
          e.y + TILE * SCALE >= plat.y && e.y + TILE * SCALE < plat.y + 22) {
        e.y = plat.y - TILE * SCALE;
        onPlatform = true;
        platLeft = plat.x + 15;
        platRight = plat.x + plat.w - 15;
      }
    }
    if (!onPlatform) {
      e.y += 400 * dt;
    }

    updateEnemyAI(e, p, dt, g.projectiles);

    // Move enemy AFTER AI sets velocity, BEFORE platform clamping
    e.x += e.vx * dt;
    if (e.type === "tengu" && e.vy) e.y += e.vy * dt; // tengu vertical movement (swoop)

    // Clamp to platform bounds + wall collision for enemies
    if (onPlatform) {
      e.x = Math.max(platLeft, Math.min(platRight, e.x));
    }
    // Enemies can't walk through walls either
    const epw = TILE * SCALE * 0.4;
    for (const wall of g.platforms) {
      if (!wall.wall) continue;
      const eBottom = e.y + TILE * SCALE;
      if (eBottom <= wall.y || e.y >= wall.y + wall.h) continue;
      if (e.x + epw > wall.x && e.x - epw < wall.x + wall.w) {
        if (e.x < wall.x + wall.w / 2) { e.x = wall.x - epw; }
        else { e.x = wall.x + wall.w + epw; }
        e.vx = 0;
      }
    }

    // ── Slash collision — vertical reach depends on combo ──
    // Combo 1 (horizontal): same level only. Combo 2 (upward arc): can reach above.
    // Combo 3 (big swing): wide reach. Air slash: wider below.
    if (p.slashTimer > 0 && !e.dead && !e._hitThisSlash) {
      const slashX = p.x + p.facing * SLASH_RANGE / 2;
      const ew = TILE * SCALE * 0.7;
      const dy = e.y - p.y; // negative = enemy is above
      const combo = p.slashCombo;
      const isAirSlash = !p.grounded && !p.wallSliding;
      // Vertical reach: air slash has more reach below, combo 2 reaches above
      const hitAbove = isAirSlash ? 20 : (combo === 1 ? 30 : combo === 2 ? 70 : 60);
      const hitBelow = isAirSlash ? 80 : (combo === 1 ? 30 : combo === 2 ? 20 : 60);
      if (Math.abs(slashX - e.x) < (SLASH_RANGE + ew) / 2 &&
          dy > -hitAbove && dy < hitBelow) {
        e._hitThisSlash = true;

        // Dash-slash bypasses all blocks (counts as backstab)
        const isDashSlash = p.dashSlashing;

        if ((e.type === "samurai" || (e.type === "brute" && e.state !== "exhausted")) && !isDashSlash) {
          // Samurai/Brute: blocks frontal attacks. Must backstab or dash-slash.
          const attackFromBehind = (p.x < e.x && e.facing > 0) || (p.x > e.x && e.facing < 0);
          if (attackFromBehind) {
            // Backstab — instant kill regardless of HP
            playSound("backstab", { volume: 0.8 });
            g.floatingTexts.push({
              x: e.x, y: e.y - 20, text: "BACKSTAB!", color: "#ff4444",
              life: 1000, maxLife: 1000,
            });
            killEnemy(g, e, p, callbacks);
            if (isAirSlash) { p.vy = JUMP_FORCE * 0.6; p.grounded = false; } // air slash bounce
          } else {
            // Frontal block — sparks, no damage, pushes player back
            e.blocking = true;
            e.blockTimer = 500;
            g.hitStop = 80;
            g.camera.shakeTimer = 100;
            playSound("samurai_block");
            p.vx = -p.facing * 250; // bounce back
            p.slashTimer = 0;
            p.comboWindow = 0;
            p.slashCombo = 0;
            for (let i = 0; i < 12; i++) {
              g.particles.push({
                x: (p.x + e.x) / 2, y: p.y + 15,
                vx: rnd(-300, 300), vy: rnd(-400, -50),
                life: 400, maxLife: 400, color: i < 4 ? "#ffffff" : "#ffe080", size: rndInt(2, 4),
              });
            }
            g.floatingTexts.push({
              x: (p.x + e.x) / 2, y: Math.min(p.y, e.y) - 15,
              text: "BLOCKED!", color: "#88bbff", life: 800, maxLife: 800,
            });
          }
        } else {
          // Dash-slash special handling
          if (isDashSlash) {
            playSound("backstab", { volume: 0.8 });
            g.floatingTexts.push({
              x: e.x, y: e.y - 25, text: "斬り抜け!", color: "#aa55ff",
              life: 1000, maxLife: 1000,
            });
            p.dashCooldown = 0; // reset dash cooldown — chain dash-slashes!
          } else {
            playRandom("hit", { volume: 0.6 });
          }
          killEnemy(g, e, p, callbacks);
          // Air slash: kill resets jump (chain aerial kills)
          if (isAirSlash) { p.vy = JUMP_FORCE * 0.6; p.grounded = false; }
        }
      }
    }
    if (p.slashTimer <= 0) e._hitThisSlash = false;

    // Enemy attack → player. Damage only during strike phase
    const isCharging = e.type === "brute" && e.state === "charge";
    const isSwooping = e.type === "tengu" && e.state === "swoop" && e.attackTimer > 200;
    const strikeWindow = e.type === "samurai" ? 210 : 200;
    const inStrike = (e.state === "attack" || e.state === "windup") && e.attackTimer < strikeWindow;
    if ((inStrike || isCharging || isSwooping) &&
        !e.dead && !p.dead && p.invincible <= 0) {
      if (Math.abs(e.x - p.x) < 60 && Math.abs(e.y - p.y) < TILE * SCALE) {
        // ── PARRY CHECK: if player just started slashing (within PARRY_WINDOW ms) ──
        const slashElapsed = p.slashTimer > 0 ? (p.slashDuration - p.slashTimer) : Infinity;
        if (p.slashTimer > 0 && slashElapsed < PARRY_WINDOW) {
          // PARRY! Player deflects the attack perfectly
          e.dazed = 1500;
          e.state = "dazed";
          e.vx = (e.x > p.x ? 1 : -1) * 150;
          p.invincible = 500;
          p.parryTimer = 300; // for parry sprite display
          g.hitStop = 150; // dramatic freeze
          g.camera.shakeTimer = 150;
          g.flashTimer = 200; // white flash
          g.score += 200;
          callbacks.setScore(g.score);
          playSound("deflect", { volume: 0.9 });
          g.floatingTexts.push({
            x: (p.x + e.x) / 2, y: Math.min(p.y, e.y) - 20,
            text: "受流!", color: "#ffffff", life: 1000, maxLife: 1000,
          });
          // White radial burst particles
          for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            g.particles.push({
              x: (p.x + e.x) / 2, y: p.y + TILE * SCALE * 0.3,
              vx: Math.cos(angle) * rnd(200, 400), vy: Math.sin(angle) * rnd(200, 400),
              life: 300, maxLife: 300, color: i % 2 === 0 ? "#ffffff" : "#ddddff", size: rnd(2, 4),
            });
          }
        } else if (e.type === "samurai" || e.type === "brute" || e.type === "tengu") {
          // Samurai/Brute/Tengu attacks are LETHAL — must parry, dash-slash, or use i-frames
          killPlayer(g, callbacks);
        } else if (p.slashTimer > 0 && (e.type === "oni" || e.type === "ninja" || e.type === "archer")) {
          // CLASH with oni — both knocked back, oni dazed, player stunned briefly
          const knockDir = p.x < e.x ? -1 : 1;
          p.vx = knockDir * -350;
          p.invincible = 500;
          p.slashTimer = 0;
          p.comboWindow = 0;
          p.slashCombo = 0;
          e.dazed = 1200;
          e.state = "dazed";
          e.vx = knockDir * 200;
          g.hitStop = 120;
          g.camera.shakeTimer = 120;
          g.floatingTexts.push({
            x: (p.x + e.x) / 2, y: Math.min(p.y, e.y) - 15,
            text: "CLASH!", color: "#ffdd44", life: 900, maxLife: 900,
          });
          playSound("clash");
          for (let i = 0; i < 12; i++) {
            g.particles.push({
              x: (p.x + e.x) / 2, y: p.y + TILE * SCALE * 0.4,
              vx: rnd(-300, 300), vy: rnd(-400, -80),
              life: 400, maxLife: 400, color: i < 4 ? "#ffffff" : "#ffdd44", size: rnd(1, 3),
            });
          }
        } else {
          killPlayer(g, callbacks);
        }
      }
    }
  }

  g.enemies = g.enemies.filter(e => !e.dead || e.deathTimer > 0);

  // ── Projectiles ──
  for (const proj of g.projectiles) {
    // Store trail positions
    if (!proj.trail) proj.trail = [];
    proj.trail.push({ x: proj.x, y: proj.y });
    if (proj.trail.length > 6) proj.trail.shift();

    proj.x += proj.vx * dt;
    if (proj.gravity) {
      proj.vy = (proj.vy || 0) + GRAVITY * 0.6 * dt; // lighter gravity for arrows
      proj.y += proj.vy * dt;
      // Arrow rotation follows trajectory
      proj.rotation = Math.atan2(proj.vy, proj.vx);
    } else {
      proj.rotation = (proj.rotation || 0) + dt * 15;
    }
    proj.timer -= dt * 1000;

    if (!p.dead && p.invincible <= 0 &&
        Math.abs(proj.x - p.x) < 22 && Math.abs(proj.y - p.y - 24) < 28) {
      if (p.slashTimer > 0 && Math.abs(proj.x - (p.x + p.facing * 30)) < 45) {
        // Deflect
        proj.timer = 0;
        g.score += 150;
        setScore(g.score);
        g.hitStop = 30;
        playSound("deflect");
        // Deflect text
        g.floatingTexts.push({ x: proj.x, y: proj.y - 20, text: "DEFLECT!", color: "#ffffff", life: 800, maxLife: 800 });
        for (let i = 0; i < 8; i++) {
          g.particles.push({
            x: proj.x, y: proj.y, vx: rnd(-300, 300), vy: rnd(-350, -100),
            life: 300, maxLife: 300, color: "#ffffff", size: rndInt(2, 3),
          });
        }
      } else {
        killPlayer(g, callbacks);
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
    if (!part.isStain) {
      part.x += part.vx * dt;
      part.y += part.vy * dt;
      if (!part.isLine) part.vy += 600 * dt;
    }
    part.life -= dt * 1000;
  }
  g.particles = g.particles.filter(p => p.life > 0);

  // ── Floating texts ──
  for (const ft of g.floatingTexts) {
    ft.y -= 40 * dt;
    ft.life -= dt * 1000;
  }
  g.floatingTexts = g.floatingTexts.filter(ft => ft.life > 0);

  // ── Slash effects ──
  for (const s of g.slashEffects) s.timer -= dt * 1000;
  g.slashEffects = g.slashEffects.filter(s => s.timer > 0);

  // ── Flash timer ──
  if (g.flashTimer > 0) g.flashTimer -= dt * 1000;

  // ── Camera (frame-rate independent) ──
  // Look-ahead: offset camera in player's facing direction
  const lookAheadTarget = Math.abs(p.vx) > 50 ? p.facing * 80 : 0;
  g.camera.lookAhead = lerp(g.camera.lookAhead, lookAheadTarget, 1 - Math.pow(0.01, rawDt));
  // Slow-mo: camera follows more slowly for cinematic feel
  const baseCamSmooth = g.slowMo.active ? 0.05 : 0.001;
  const camSmooth = 1 - Math.pow(baseCamSmooth, rawDt);
  const targetCX = p.x - g.W / 2 + g.camera.lookAhead + (isDesktop ? SIDEBAR_W / 2 : 0);
  const camTarget = clamp(targetCX, 0, Math.max(0, g.levelW - g.W));
  g.camera.x = lerp(g.camera.x, camTarget, camSmooth);
  // Zoom: lerp toward target zoom
  g.camera.zoom = lerp(g.camera.zoom, g.camera.zoomTarget, 1 - Math.pow(0.001, rawDt));
  // Slow-mo: slight zoom out for more visibility
  if (g.slowMo.active) g.camera.zoomTarget = 0.97;
  else if (g.camera.zoomTarget < 1) g.camera.zoomTarget = 1;

  if (g.camera.shakeTimer > 0) {
    g.camera.shakeTimer -= rawDt * 1000;
    const amp = g.camera.shakeTimer > 80 ? 6 : 3;
    g.camera.shakeX = rnd(-amp, amp);
    g.camera.shakeY = rnd(-amp, amp);
  } else {
    g.camera.shakeX = 0;
    g.camera.shakeY = 0;
  }

  // ── Room state machine ──
  if (g.roomState === "playing") {
    g.roomTimer += rawDt;

    // ── Tutorial trigger checking ──
    if (g.tutorials && g.tutorials.length > 0) {
      const p = g.player;
      const nearestEnemy = g.enemies.find(e => !e.dead && Math.abs(e.x - p.x) < 200);
      const nearWall = g.platforms.some(pl => pl.wall && Math.abs(pl.x - p.x) < 150);
      const nearGap = g.platforms.some((pl, i) => {
        const next = g.platforms[i + 1];
        return next && !pl.wall && !next.wall && next.x - (pl.x + pl.w) > 80 && Math.abs(p.x - (pl.x + pl.w)) < 150;
      });
      const hasShurikens = g.projectiles.length > 0;

      for (const tut of g.tutorials) {
        if (tut.shown || tut.dismissed) continue;
        let triggered = false;
        if (tut.trigger === "start" && g.roomTimer > 0.5) triggered = true;
        if (tut.trigger === "nearEnemy" && nearestEnemy) triggered = true;
        if (tut.trigger === "nearWall" && nearWall) triggered = true;
        if (tut.trigger === "nearGap" && nearGap) triggered = true;
        if (tut.trigger === "shurikens" && hasShurikens) triggered = true;
        if (triggered) {
          tut.shown = true;
          tut.timer = 4000; // show for 4 seconds
          g.activeTutorial = tut;
          break; // only one at a time
        }
      }
      // Decay active tutorial
      if (g.activeTutorial) {
        g.activeTutorial.timer -= rawDt * 1000;
        if (g.activeTutorial.timer <= 0) {
          g.activeTutorial.dismissed = true;
          g.activeTutorial = null;
          // Check if next tutorial should trigger
        }
      }
    }

    // Last-kill freeze is triggered in killEnemy — fallback for edge cases
    if (g.enemies.filter(e => !e.dead).length === 0 && g.roomTimer > 0.5) {
      if (g.roomState === "playing") clearRoom(g, callbacks);
    }
  } else if (g.roomState === "lastKillFreeze") {
    // Dramatic pause on last kill before room clear
    g.roomClearTimer -= rawDt * 1000;
    if (g.roomClearTimer <= 0) clearRoom(g, callbacks);
  } else if (g.roomState === "cleared") {
    g.roomClearTimer -= rawDt * 1000;
    if (g.roomClearTimer <= 0) {
      if (g.currentRoom + 1 >= TOTAL_ROOMS) {
        // All rooms done — victory!
        g.cleared = true;
        setScore(g.score);
        setMaxCombo(g.maxCombo);
        if (g.score > highScore) {
          setHighScore(g.score);
          try { localStorage.setItem("nihongo-game-highscore", g.score); } catch {}
        }
        setScreen("victory");
      } else {
        const nextRoom = g.currentRoom + 1;
        // Check if next room triggers a story screen
        const storyKey = g._storyTriggers && g._storyTriggers[nextRoom];
        if (storyKey) {
          g._pendingRoom = nextRoom;
          g._pendingStoryKey = storyKey;
          setScreen("story");
        } else {
          loadRoom(g, nextRoom);
        }
      }
    }
  }

  // Death flash countdown
  if (g.deathFlash > 0) g.deathFlash -= rawDt * 1000;

  // ── Transition animations ──
  // Letterbox: ease in during cleared, ease out otherwise
  if (g.roomState === "cleared" || g.roomState === "lastKillFreeze") {
    g.letterbox = Math.min(1, (g.letterbox || 0) + rawDt * 3); // ~330ms to full
  } else {
    if (g.letterbox > 0) g.letterbox = Math.max(0, g.letterbox - rawDt * 4);
  }
  // Fade overlay: fades out on room load
  if (g.fadeOverlay > 0) g.fadeOverlay = Math.max(0, g.fadeOverlay - rawDt * 4); // ~250ms fade-in
  // Room title countdown
  if (g.roomTitle && g.roomTitle.timer > 0) g.roomTitle.timer -= rawDt * 1000;

  // Shadow zone detection
  g.player.inShadow = false;
  if (g.shadows) {
    for (const s of g.shadows) {
      if (g.player.x > s.x && g.player.x < s.x + s.w && g.player.grounded) {
        g.player.inShadow = true;
      }
    }
  }
}

// ═══ HELPERS ═══
function killEnemy(g, e, p, callbacks) {
  e.dead = true;
  const combo = p.slashCombo;

  if (combo === 3) {
    // ── CINEMATIC DEATH: slash through → enemy falls to knees → face plant ──
    e.deathStyle = "cinematic";
    e.deathTimer = 1200; // longer for the full animation
    e.deathPhase = 0;    // 0=standing shock, 1=kneeling, 2=face plant
    e.vx = 0;
    g.hitStop = 120;     // longer freeze for dramatic effect
  } else {
    // ── KNOCKBACK DEATH: enemy sent FLYING back, slides along ground ──
    e.deathStyle = "knockback";
    e.deathTimer = 2500;
    e.vx = p.facing * rnd(600, 900); // faster launch
    e.vy = rnd(-80, -20);
    e._onGround = false;
    e._kbDir = p.facing;
    const kbPoses = ["kb_back", "kb_tumble", "kb_seated"];
    e._kbPose = kbPoses[Math.floor(Math.random() * kbPoses.length)];
    g.hitStop = 80;

    // ── IMPACT VFX at point of contact ──
    const impactX = (p.x + e.x) / 2;
    const impactY = e.y + TILE * SCALE * 0.4;
    // White flash ring
    g.particles.push({
      x: impactX, y: impactY, vx: 0, vy: 0,
      life: 250, maxLife: 250, color: "#ffffff", size: 2, isRipple: true,
    });
    // Directional impact sparks
    for (let i = 0; i < 12; i++) {
      g.particles.push({
        x: impactX + rnd(-5, 5), y: impactY + rnd(-8, 8),
        vx: p.facing * rnd(100, 500) + rnd(-80, 80), vy: rnd(-300, -50),
        life: 350, maxLife: 350,
        color: i < 4 ? "#ffffff" : i < 8 ? "#ffdd44" : "#ff8833",
        size: rnd(1.5, 3.5),
      });
    }
    // Slash line — bright white streak in slash direction
    for (let i = 0; i < 4; i++) {
      g.particles.push({
        x: impactX, y: impactY + rnd(-10, 10),
        vx: p.facing * rnd(300, 700), vy: rnd(-20, 20),
        life: 120, maxLife: 120, color: "#ffffff", size: rnd(1, 2), isLine: true,
      });
    }
  }
  g.camera.shakeTimer = 180;
  g.comboTimer = 2000;
  g.combo++;
  if (g.combo > g.maxCombo) g.maxCombo = g.combo;
  const pts = (ENEMY_CONFIG[e.type] || ENEMY_CONFIG.oni).score;
  let killScore = pts * g.combo;
  // Focus kill bonus — 1.5x score during slow-mo
  if (g.slowMo.active) {
    killScore = Math.floor(killScore * 1.5);
    g.floatingTexts.push({
      x: e.x, y: e.y - 40, text: "集中斬!", color: "#44ddff", life: 900, maxLife: 900,
    });
  }
  g.score += killScore;
  callbacks.setScore(g.score);
  callbacks.setMaxCombo(g.maxCombo);
  g.slowMo.meter = Math.min(g.slowMo.max, g.slowMo.meter + 20);
  playSound("kill", { playbackRate: e.type === "oni" ? 0.8 : e.type === "ninja" ? 1.2 : 1.0 });
  playSound("blood_splatter", { volume: 0.5 });
  // Per-type death sound (random variant)
  const deathGroup = { oni: "oni_death", ninja: "ninja_death", samurai: "samurai_death" };
  playRandom(deathGroup[e.type] || "oni_death", { volume: 0.6 });
  if (g.combo === 5 || g.combo === 10 || g.combo === 15) {
    playSound("comboMilestone");
    g.camera.zoom = MILESTONE_ZOOM;
  }
  // Kill zoom — 3rd combo kill gets extra zoom
  g.camera.zoom = Math.max(g.camera.zoom, p.slashCombo === 3 ? KILL_ZOOM_3RD : KILL_ZOOM);
  g.camera.zoomTarget = 1;

  // Last kill freeze — check if this was the final enemy
  const aliveEnemies = g.enemies.filter(en => !en.dead && en !== e).length;
  if (aliveEnemies === 0 && g.roomState === "playing" && g.roomTimer > 0.3) {
    g.roomState = "lastKillFreeze";
    g.roomClearTimer = LAST_KILL_FREEZE;
    g.camera.zoom = MILESTONE_ZOOM;
  }

  // Brief auto-slow on kill for flow (aim next target)
  g.time.scale = Math.min(g.time.scale, 0.5);

  // Stealth kill bonus
  if (p.inShadow) {
    g.score += pts * g.combo; // double score from shadow
    g.floatingTexts.push({
      x: e.x, y: e.y - 35, text: "STEALTH", color: "#44ddaa", life: 800, maxLife: 800,
    });
  }

  // Japanese kill text — random action words
  const jpKillTexts = [
    { jp: "斬", en: "zan", color: "#ff4444" },
    { jp: "斬", en: "zan", color: "#ff4444" },
    { jp: "討伐", en: "tobatsu", color: "#ff6644" },
    { jp: "一撃", en: "ichigeki", color: "#ffaa44" },
  ];
  // Special context-aware kill text
  if (p.dashSlashing) {
    g.floatingTexts.push({ x: e.x, y: e.y - 20, text: "閃光 senkou", color: "#cc44ff", life: 900, maxLife: 900 });
  } else if (!p.grounded) {
    g.floatingTexts.push({ x: e.x, y: e.y - 20, text: "空斬 kūzan", color: "#44aaff", life: 900, maxLife: 900 });
  } else if (g.combo >= 3) {
    g.floatingTexts.push({ x: e.x, y: e.y - 20, text: "連斬 renzan", color: "#ffa040", life: 900, maxLife: 900 });
  } else {
    const t = jpKillTexts[Math.floor(Math.random() * jpKillTexts.length)];
    g.floatingTexts.push({ x: e.x, y: e.y - 20, text: `${t.jp} ${t.en}`, color: t.color, life: 800, maxLife: 800 });
  }

  // Kill combo labels
  const killTexts = ["", "", "DOUBLE", "TRIPLE", "QUAD", "PENTA", "HEXA", "ULTRA"];
  if (g.combo >= 2) {
    const label = killTexts[Math.min(g.combo, killTexts.length - 1)] || `x${g.combo}`;
    g.floatingTexts.push({
      x: e.x, y: e.y - 40,
      text: `${label} KILL!`, color: "#ffa040",
      life: 1000, maxLife: 1000,
    });
  }

  // ── Kill streak milestones ──
  g.killStreak = (g.killStreak || 0) + 1;
  if (g.killStreak === 5) {
    g.floatingTexts.push({ x: p.x, y: p.y - 60, text: "無双 UNSTOPPABLE", color: "#ff4444", life: 1500, maxLife: 1500 });
    g.time.scale = Math.min(g.time.scale, 0.3);
    playSound("comboMilestone");
  } else if (g.killStreak === 10) {
    g.floatingTexts.push({ x: p.x, y: p.y - 60, text: "神技 GODLIKE", color: "#ffdd00", life: 1500, maxLife: 1500 });
    g.camera.shakeTimer = 200;
    playSound("comboMilestone");
    // Shockwave ring particles
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      g.particles.push({
        x: p.x, y: p.y + 30, vx: Math.cos(angle) * 300, vy: Math.sin(angle) * 300,
        life: 500, maxLife: 500, color: "#ffdd44", size: 3,
      });
    }
  } else if (g.killStreak === 15) {
    g.floatingTexts.push({ x: p.x, y: p.y - 60, text: "伝説 LEGENDARY", color: "#ff44ff", life: 2000, maxLife: 2000 });
    g.camera.shakeTimer = 300;
    g.flashTimer = 200;
    playSound("comboMilestone");
  }

  // ── MASSIVE blood burst — Katana Zero style ──
  const bloodColors = ["#cc1111", "#aa0000", "#ee2222", "#880000", "#ff3333", "#dd2020"];
  const slashDir = p.facing;
  const killCenter = { x: e.x, y: e.y + TILE * SCALE / 2 };

  // Main blood spray — big directional cone (40 particles, bigger, faster)
  for (let i = 0; i < 40; i++) {
    const baseVx = slashDir * rnd(150, 600);
    const spread = rnd(-200, 200);
    g.particles.push({
      x: killCenter.x + rnd(-10, 10), y: killCenter.y + rnd(-10, 10),
      vx: baseVx + spread, vy: rnd(-600, 50),
      life: 800, maxLife: 800, color: bloodColors[i % 6], size: rnd(2, 6),
    });
  }
  // Blood streak lines — long directional trails
  for (let i = 0; i < 8; i++) {
    g.particles.push({
      x: killCenter.x, y: killCenter.y + rnd(-15, 15),
      vx: slashDir * rnd(200, 700), vy: rnd(-200, 100),
      life: 500, maxLife: 500, color: bloodColors[i % 6], size: rnd(1.5, 3),
      isLine: true, // renders as horizontal streak
    });
  }
  // Upward blood fountain
  for (let i = 0; i < 10; i++) {
    g.particles.push({
      x: killCenter.x + rnd(-8, 8), y: killCenter.y,
      vx: rnd(-80, 80), vy: rnd(-700, -300),
      life: 700, maxLife: 700, color: bloodColors[i % 6], size: rnd(2, 5),
    });
  }
  // White flash particles (additive glow)
  for (let i = 0; i < 8; i++) {
    g.particles.push({
      x: killCenter.x + rnd(-10, 10), y: killCenter.y + rnd(-10, 10),
      vx: rnd(-300, 300), vy: rnd(-400, -100),
      life: 250, maxLife: 250, color: "#ffffff", size: rnd(3, 6),
      glow: true,
    });
  }
  // Impact ripple ring
  g.particles.push({
    x: killCenter.x, y: killCenter.y,
    vx: 0, vy: 0,
    life: 350, maxLife: 350, color: "#ffffff", size: 1,
    isRipple: true,
  });
  // Large blood stains on the ground — more, bigger, spread wider
  for (let i = 0; i < 8; i++) {
    g.particles.push({
      x: killCenter.x + slashDir * rnd(0, 80) + rnd(-40, 40),
      y: e.y + TILE * SCALE - 2,
      vx: 0, vy: 0,
      life: 10000, maxLife: 10000, color: i < 3 ? "#550000" : "#3a0000",
      size: rnd(4, 12),
      isStain: true,
    });
  }
  g.flashTimer = 120; // longer flash
}

function killPlayer(g, callbacks) {
  if (g.player.dead) return; // prevent double-kill
  // Dramatic death — extreme slow-mo, zoom to death point, red flash
  g.killStreak = 0;
  g.player.dead = true;
  g.player.deathTimer = 600;
  g.camera.shakeTimer = 300;
  g.time.scale = 0.15; // extreme slow-mo
  g.camera.zoomTarget = 1.25; // zoom into death
  g.flashTimer = 400;
  g.deathFlash = 600;
  playSound("death");
  // Blood burst from player (more particles, longer life for slow-mo drama)
  for (let i = 0; i < 18; i++) {
    g.particles.push({
      x: g.player.x + rnd(-5, 5), y: g.player.y + 20,
      vx: rnd(-300, 300), vy: rnd(-500, -80),
      life: 800, maxLife: 800, color: i < 12 ? "#cc1111" : "#880000", size: rnd(1.5, 4),
    });
  }
  // Hold dramatic slow-mo, then restart
  setTimeout(() => {
    g.time.scale = 1;
    g.camera.zoomTarget = 1;
    restartRoom(g);
  }, 600);
}

function spawnDust(g, x, y) {
  for (let i = 0; i < 5; i++) {
    g.particles.push({
      x: x + rnd(-12, 12), y,
      vx: rnd(-70, 70), vy: rnd(-90, -20),
      life: 350, maxLife: 350, color: "#777777", size: rndInt(2, 4),
    });
  }
}
