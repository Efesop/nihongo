import { TILE, SCALE, MOVE_SPEED, ENEMY_CONFIG } from "./constants.js";
import { playSound } from "./audio.js";

// ═══ PLAYER FACTORY ═══
export function makePlayer(groundY, startX = 100) {
  return {
    x: startX, y: groundY - TILE * SCALE, vx: 0, vy: 0,
    facing: 1, state: "idle", frame: 0, frameTimer: 0,
    slashTimer: 0, slashDuration: 0, dashTimer: 0, dashCooldown: 0, dead: false,
    grounded: false, wallSliding: false, wallDir: 0, wallJumpCooldown: 0, invincible: 0,
    afterimages: [],
    slashCombo: 0, comboWindow: 0,
    scaleX: 1, scaleY: 1,
  };
}

// ═══ ENEMY FACTORY ═══
export function makeEnemy(type, x, platformY) {
  const cfg = ENEMY_CONFIG[type] || ENEMY_CONFIG.oni;
  return {
    x, y: platformY - TILE * SCALE, vx: 0, vy: 0,
    type, facing: -1, state: "patrol", frame: 0, frameTimer: 0,
    hp: cfg.hp,
    dead: false, deathTimer: 0,
    patrolOrigin: x, patrolRange: 80,
    alertRange: cfg.alertRange,
    attackTimer: type === "ninja" ? 800 : 0,
    attackCooldown: cfg.cooldown || (type === "ninja" ? 1400 : 800),
    blocking: false, blockTimer: 0,
    throwAnim: 0,
    alert: 0,
    dazed: 0,
    _hitThisSlash: false,
  };
}

// ═══ ENEMY AI ═══
export function updateEnemyAI(e, player, dt, projectiles) {
  // Dazed — can't do anything
  if (e.dazed > 0) {
    e.dazed -= dt * 1000;
    e.vx = 0;
    if (e.dazed <= 0) { e.dazed = 0; e.state = "patrol"; }
    return;
  }

  const dx = player.x - e.x;
  const dist = Math.abs(dx);
  const toPlayer = dx > 0 ? 1 : -1;

  // Can't see player if they're in shadow or enemy is facing away
  const playerVisible = !player.inShadow && (e.facing === toPlayer || dist < 40);
  if (!playerVisible && e.state === "chase") {
    // Lost sight — return to patrol after brief delay
    e.state = "patrol";
    e.vx = e.facing * 30;
  }

  // Animation cycling
  e.frameTimer += dt * 1000;
  if (e.frameTimer > 250) { e.frame = (e.frame + 1) % 2; e.frameTimer = 0; }

  // Block timer
  if (e.blockTimer > 0) {
    e.blockTimer -= dt * 1000;
    if (e.blockTimer <= 0) e.blocking = false;
  }
  if (e.throwAnim > 0) e.throwAnim -= dt * 1000;
  if (e.alert > 0) e.alert -= dt * 1000;

  if (e.type === "oni") {
    if (e.state === "attack") {
      e.attackTimer -= dt * 1000;
      // Lunge forward during strike
      if (e.attackTimer < 300) e.vx = e.facing * MOVE_SPEED * 0.8;
      else e.vx = 0;
      if (e.attackTimer <= 0) { e.state = "cooldown"; e.attackTimer = 300; }
    } else if (e.state === "cooldown") {
      e.attackTimer -= dt * 1000;
      e.vx = 0;
      if (e.attackTimer <= 0) e.state = "chase";
    } else if (dist < e.alertRange && playerVisible) {
      if (e.state === "patrol") { e.alert = 400; playSound("enemy_alert", { volume: 0.5 }); }
      e.state = "chase";
      e.facing = toPlayer;
      e.vx = toPlayer * MOVE_SPEED * 0.7;
      if (dist < 65) { e.state = "attack"; e.attackTimer = 600; playSound("enemy_attack", { volume: 0.6 }); }
    } else {
      e.state = "patrol";
      if (Math.abs(e.x - e.patrolOrigin) > e.patrolRange) e.facing *= -1;
      e.vx = e.facing * 50;
    }
  } else if (e.type === "ninja") {
    if (dist > 20 && playerVisible) e.facing = toPlayer;
    e.vx = 0;
    if (dist < e.alertRange && playerVisible) {
      if (e.state === "patrol") e.alert = 400;
      e.state = "chase";
      e.attackTimer -= dt * 1000;
      if (e.attackTimer <= 0) {
        // Faster shuriken
        projectiles.push({
          x: e.x, y: e.y + 24, vx: toPlayer * 450, vy: 0,
          type: "shuriken", timer: 3000, rotation: 0, trail: [],
        });
        e.attackTimer = 900; // fires more often
        e.throwAnim = 400;
        playSound("shuriken");
      }
      if (dist < 100) e.vx = -toPlayer * 150; // retreats faster
    } else {
      e.state = "patrol";
      if (Math.abs(e.x - e.patrolOrigin) > e.patrolRange) e.facing *= -1;
      e.vx = e.facing * 35;
    }
  } else if (e.type === "samurai") {
    if (e.state === "attack") {
      e.attackTimer -= dt * 1000;
      if (e.attackTimer < 250) e.vx = e.facing * MOVE_SPEED * 0.6;
      else e.vx = 0;
      if (e.attackTimer <= 0) { e.state = "cooldown"; e.attackTimer = 400; }
    } else if (e.state === "cooldown") {
      e.attackTimer -= dt * 1000;
      e.vx = 0;
      if (e.attackTimer <= 0) e.state = "chase";
    } else if (dist < e.alertRange && playerVisible) {
      if (e.state === "patrol") { e.alert = 400; playSound("enemy_alert", { volume: 0.6 }); }
      e.facing = toPlayer;
      e.vx = toPlayer * MOVE_SPEED * 0.5;
      if (dist < 60) { e.state = "attack"; e.attackTimer = 700; playSound("enemy_attack", { volume: 0.7 }); }
    } else {
      e.state = "patrol";
      if (Math.abs(e.x - e.patrolOrigin) > e.patrolRange) e.facing *= -1;
      e.vx = e.facing * 35;
    }
  }

  // Movement is handled by engine.js (after AI, before platform clamping)
}
