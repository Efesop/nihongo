import {
  GRAVITY, MOVE_SPEED, JUMP_FORCE, SLASH_DURATION, SLASH_RANGE,
  DASH_SPEED, DASH_DURATION, DASH_COOLDOWN,
  TILE, SCALE, GROUND_Y, TOTAL_ROOMS, STAR_3, STAR_2,
  lerp, clamp, rnd, rndInt,
} from "./constants.js";
import { updateEnemyAI, makeEnemy, makePlayer } from "./entities.js";
import { ROOMS } from "./levels.js";

// ═══ ROOM MANAGEMENT ═══
export function loadRoom(g, roomIndex) {
  const room = ROOMS[roomIndex];
  if (!room) return;
  g.currentRoom = roomIndex;
  g.platforms = room.platforms.map(p => ({ x: p.x, y: g.groundY + p.y, w: p.w, h: 16 }));
  g.enemies = room.enemies.map(e => makeEnemy(e.type, e.x, g.groundY + (e.y || 0)));
  g.decorations = (room.deco || []).map(d => ({ type: d.type, x: d.x, y: g.groundY }));
  g.shadows = (room.shadows || []).map(s => ({ x: s.x, w: s.w, y: g.groundY }));
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
  g.slowMo.meter = g.slowMo.max;
  g.slowMo.active = false;
  g.hitStop = 0;
  g.flashTimer = 0;
  g.roomTimer = 0;
  g.roomState = "playing";
  g.roomClearTimer = 0;
  g.combo = 0;
  g.comboTimer = 0;
}

function restartRoom(g) {
  g.deaths++;
  g.deathFlash = 300;
  loadRoom(g, g.currentRoom);
}

function clearRoom(g, callbacks) {
  g.roomState = "cleared";
  g.roomClearTimer = 2000; // 2s pause to show rating
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
}

// ═══ UPDATE ═══
export function update(g, callbacks) {
  const { setScore, setMaxCombo, setScreen, isDesktop, SIDEBAR_W, highScore, setHighScore } = callbacks;
  const now = performance.now();
  let rawDt = Math.min(now - g.time.last, 33) / 1000;
  g.time.last = now;

  // Hit-stop freeze
  if (g.hitStop > 0) { g.hitStop -= rawDt * 1000; return; }

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
  // Drifting leaves — fall slowly, sway side to side
  if (Math.random() < dt * 1.5) {
    g.embers.push({
      x: g.camera.x + rnd(0, g.W), y: -10,
      vx: rnd(-20, -5), vy: rnd(15, 35),
      life: rnd(5000, 10000), maxLife: 10000,
      size: rnd(2, 4), color: rnd(0, 1) > 0.6 ? "#3a6a40" : "#2a5030", type: "leaf",
      phase: rnd(0, Math.PI * 2),
    });
  }
  // Tiny dust motes — gentle float
  if (Math.random() < dt * 4) {
    g.embers.push({
      x: g.camera.x + rnd(0, g.W), y: rnd(g.H * 0.3, g.H * 0.8),
      vx: rnd(-5, 5), vy: rnd(-8, -2),
      life: rnd(3000, 6000), maxLife: 6000,
      size: rnd(0.5, 1.5), color: "#ffffff", type: "dust",
      phase: rnd(0, Math.PI * 2),
    });
  }

  for (const em of g.embers) {
    if (em.type === "firefly") {
      // Gentle drift with sine wave movement
      em.x += em.vx * dt + Math.sin(g.time.elapsed * 1.5 + em.phase) * dt * 15;
      em.y += em.vy * dt + Math.cos(g.time.elapsed * 1.2 + em.phase) * dt * 10;
    } else if (em.type === "leaf") {
      // Sway side to side while falling
      em.x += em.vx * dt + Math.sin(g.time.elapsed * 2 + em.phase) * dt * 25;
      em.y += em.vy * dt;
      em.phase += dt * 3; // rotation
    } else {
      // Dust — gentle float
      em.x += em.vx * dt + Math.sin(g.time.elapsed * 0.8 + em.phase) * dt * 5;
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
  } else if (p.slashTimer > 0) {
    // Keep momentum — character dashes through
    p.vx *= 0.96;
  } else {
    p.vx = moveDir * MOVE_SPEED;
    if (moveDir !== 0) p.facing = moveDir;
  }

  if (p.dashCooldown > 0) p.dashCooldown -= rawDt * 1000;

  // Afterimage decay
  for (const ai of p.afterimages) ai.life -= rawDt * 1000;
  p.afterimages = p.afterimages.filter(ai => ai.life > 0);

  // Running dust
  if (p.grounded && Math.abs(p.vx) > 100 && Math.random() < dt * 8) {
    g.particles.push({
      x: p.x + rnd(-6, 6), y: p.y + TILE * SCALE,
      vx: -p.facing * rnd(20, 50), vy: rnd(-30, -10),
      life: 250, maxLife: 250, color: "#666666", size: rndInt(2, 3),
    });
  }

  // Jump
  if (g.input.jumpPressed && p.grounded) {
    p.vy = JUMP_FORCE;
    p.grounded = false;
    spawnDust(g, p.x, p.y + TILE * SCALE);
  }
  g.input.jumpPressed = false;

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

    // Lunge — each hit goes further
    const lungeSpeed = combo === 1 ? DASH_SPEED * 0.8 : combo === 2 ? DASH_SPEED : DASH_SPEED * 1.3;
    p.vx = p.facing * lungeSpeed;

    // Slash trail — combo level passed through for visual variation
    g.slashEffects.push({
      x: p.x, y: p.y + TILE * SCALE * 0.4,
      facing: p.facing, timer: 300, maxTimer: 300,
      combo,
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

  // Platform collision
  const wasGrounded = p.grounded;
  p.grounded = false;
  for (const plat of g.platforms) {
    const pw = TILE * SCALE * 0.5;
    if (p.x + pw > plat.x && p.x - pw < plat.x + plat.w &&
        p.y + TILE * SCALE > plat.y && p.y + TILE * SCALE < plat.y + plat.h + Math.abs(p.vy * dt) + 10 &&
        p.vy >= 0) {
      p.y = plat.y - TILE * SCALE;
      // Landing impact — dust + small shake if falling fast
      if (!wasGrounded && p.vy > 300) {
        spawnDust(g, p.x, p.y + TILE * SCALE);
        if (p.vy > 500) g.camera.shakeTimer = 50;
      }
      p.vy = 0;
      p.grounded = true;
    }
  }

  p.x = Math.max(10, Math.min(g.levelW - 10, p.x));
  if (p.y > g.H + 100) killPlayer(g, callbacks);

  // Slash timer
  if (p.slashTimer > 0) p.slashTimer -= dt * 1000;

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

  // ── Enemies ──
  for (const e of g.enemies) {
    if (e.dead) { e.deathTimer -= dt * 1000; continue; }

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

    // Clamp to platform bounds
    if (onPlatform) {
      e.x = Math.max(platLeft, Math.min(platRight, e.x));
    }

    // ── Slash collision (can hit multiple per slash) ──
    if (p.slashTimer > 0 && !e.dead && !e._hitThisSlash) {
      const slashX = p.x + p.facing * SLASH_RANGE / 2;
      const ew = TILE * SCALE * 0.7;
      if (Math.abs(slashX - e.x) < (SLASH_RANGE + ew) / 2 &&
          Math.abs(p.y - e.y) < TILE * SCALE * 1.2) {
        e._hitThisSlash = true;
        if (e.type === "samurai" && e.hp > 1 && !e.blocking) {
          // Block — sparks, no kill
          e.hp--;
          e.blocking = true;
          e.blockTimer = 500;
          g.hitStop = 80;
          g.camera.shakeTimer = 100;
          for (let i = 0; i < 10; i++) {
            g.particles.push({
              x: (p.x + e.x) / 2, y: p.y + 15,
              vx: rnd(-300, 300), vy: rnd(-400, -50),
              life: 400, maxLife: 400, color: "#ffe080", size: rndInt(2, 4),
            });
          }
        } else {
          killEnemy(g, e, p, callbacks);
        }
      }
    }
    if (p.slashTimer <= 0) e._hitThisSlash = false;

    // Enemy attack → player (damage only in the strike window, not the wind-up)
    // Timer counts DOWN: 600→0. Wind-up = 600-250, Strike = 250-100, Recovery = 100-0
    if (e.state === "attack" && e.attackTimer > 80 && e.attackTimer < 250 &&
        !e.dead && !p.dead && p.invincible <= 0) {
      if (Math.abs(e.x - p.x) < 45 && Math.abs(e.y - p.y) < TILE * SCALE) {
        if (p.slashTimer > 0) {
          // Clash! Player is slashing too — daze the enemy instead
          e.dazed = 800;
          e.state = "dazed";
          e.vx = 0;
          g.hitStop = 100;
          g.camera.shakeTimer = 80;
          g.floatingTexts.push({
            x: (p.x + e.x) / 2, y: Math.min(p.y, e.y) - 15,
            text: "CLASH!", color: "#ffdd44", life: 900, maxLife: 900,
          });
          // Sparks
          for (let i = 0; i < 10; i++) {
            g.particles.push({
              x: (p.x + e.x) / 2, y: p.y + TILE * SCALE * 0.4,
              vx: rnd(-250, 250), vy: rnd(-350, -80),
              life: 350, maxLife: 350, color: i < 4 ? "#ffffff" : "#ffdd44", size: rndInt(2, 4),
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
    proj.timer -= dt * 1000;
    proj.rotation = (proj.rotation || 0) + dt * 15;

    if (!p.dead && p.invincible <= 0 &&
        Math.abs(proj.x - p.x) < 22 && Math.abs(proj.y - p.y - 24) < 28) {
      if (p.slashTimer > 0 && Math.abs(proj.x - (p.x + p.facing * 30)) < 45) {
        // Deflect
        proj.timer = 0;
        g.score += 150;
        setScore(g.score);
        g.hitStop = 30;
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
    part.x += part.vx * dt;
    part.y += part.vy * dt;
    if (!part.isLine) part.vy += 600 * dt;
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
  const targetCX = p.x - g.W / 2 + (isDesktop ? SIDEBAR_W / 2 : 0);
  const camTarget = clamp(targetCX, 0, Math.max(0, g.levelW - g.W));
  const camSmooth = 1 - Math.pow(0.001, rawDt);
  g.camera.x = lerp(g.camera.x, camTarget, camSmooth);
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

    // Check if all enemies dead → room clear
    if (g.enemies.filter(e => !e.dead).length === 0 && g.roomTimer > 0.5) {
      clearRoom(g, callbacks);
    }
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
        // Next room
        loadRoom(g, g.currentRoom + 1);
      }
    }
  }

  // Death flash countdown
  if (g.deathFlash > 0) g.deathFlash -= rawDt * 1000;

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
  e.deathTimer = 500;
  g.hitStop = 70;
  g.camera.shakeTimer = 150;
  g.comboTimer = 2000;
  g.combo++;
  if (g.combo > g.maxCombo) g.maxCombo = g.combo;
  const pts = e.type === "samurai" ? 300 : e.type === "ninja" ? 150 : 100;
  g.score += pts * g.combo;
  callbacks.setScore(g.score);
  callbacks.setMaxCombo(g.maxCombo);
  g.slowMo.meter = Math.min(g.slowMo.max, g.slowMo.meter + 20);

  // Brief auto-slow on kill for flow (aim next target)
  g.time.scale = Math.min(g.time.scale, 0.5);

  // Stealth kill bonus
  if (p.inShadow) {
    g.score += pts * g.combo; // double score from shadow
    g.floatingTexts.push({
      x: e.x, y: e.y - 35, text: "STEALTH", color: "#44ddaa", life: 800, maxLife: 800,
    });
  }

  // Kill text
  const killTexts = ["", "", "DOUBLE", "TRIPLE", "QUAD", "PENTA", "HEXA", "ULTRA"];
  if (g.combo >= 2) {
    const label = killTexts[Math.min(g.combo, killTexts.length - 1)] || `x${g.combo}`;
    g.floatingTexts.push({
      x: e.x, y: e.y - 20,
      text: `${label} KILL!`, color: "#ffa040",
      life: 1000, maxLife: 1000,
    });
  }

  // Death particles — flash white then burst
  const pColor = e.type === "oni" ? "#c4a060" : e.type === "ninja" ? "#4a8a60" : "#8a6090";
  for (let i = 0; i < 14; i++) {
    g.particles.push({
      x: e.x + rnd(-10, 10), y: e.y + TILE * SCALE / 2 + rnd(-10, 10),
      vx: rnd(-350, 350), vy: rnd(-500, -50),
      life: 550, maxLife: 550, color: i < 4 ? "#ffffff" : pColor, size: rndInt(2, 5),
    });
  }
  g.flashTimer = 80;
}

function killPlayer(g, callbacks) {
  // Instant restart — no death screen, just flash and reset
  restartRoom(g);
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
