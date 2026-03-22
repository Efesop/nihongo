import { TILE, SCALE, MOVE_SPEED } from "./constants.js";

// ═══ PLAYER FACTORY ═══
export function makePlayer(groundY) {
  return {
    x: 100, y: groundY - TILE * SCALE, vx: 0, vy: 0,
    facing: 1, state: "idle", frame: 0, frameTimer: 0,
    slashTimer: 0, slashDuration: 0, dashTimer: 0, dashCooldown: 0, dead: false,
    grounded: false, invincible: 0,
    afterimages: [],
    slashCombo: 0, comboWindow: 0,
  };
}

// ═══ ENEMY FACTORY ═══
export function makeEnemy(type, x, platformY) {
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
    throwAnim: 0,
    alert: 0,
    dazed: 0, // stun timer — can't act while > 0
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
      e.vx = 0;
      if (e.attackTimer <= 0) { e.state = "cooldown"; e.attackTimer = 500; }
    } else if (e.state === "cooldown") {
      e.attackTimer -= dt * 1000;
      e.vx = 0;
      if (e.attackTimer <= 0) e.state = "patrol";
    } else if (dist < e.alertRange) {
      if (e.state === "patrol") e.alert = 600;
      e.state = "chase";
      e.facing = toPlayer;
      e.vx = toPlayer * MOVE_SPEED * 0.55;
      if (dist < 50) { e.state = "attack"; e.attackTimer = 800; }
    } else {
      e.state = "patrol";
      if (Math.abs(e.x - e.patrolOrigin) > e.patrolRange) e.facing *= -1;
      e.vx = e.facing * 40;
    }
  } else if (e.type === "ninja") {
    // Only update facing when player is clearly to one side (dead zone prevents flicker)
    if (dist > 20) e.facing = toPlayer;
    e.vx = 0;
    if (dist < e.alertRange) {
      if (e.state === "patrol") e.alert = 600;
      e.state = "chase";
      e.attackTimer -= dt * 1000;
      if (e.attackTimer <= 0) {
        projectiles.push({
          x: e.x, y: e.y + 24, vx: toPlayer * 350, vy: 0,
          type: "shuriken", timer: 3000, rotation: 0, trail: [],
        });
        e.attackTimer = e.attackCooldown;
        e.throwAnim = 500;
      }
      if (dist < 80) e.vx = -toPlayer * 120;
    } else {
      e.state = "patrol";
      if (Math.abs(e.x - e.patrolOrigin) > e.patrolRange) e.facing *= -1;
      e.vx = e.facing * 30;
    }
  } else if (e.type === "samurai") {
    if (e.state === "attack") {
      e.attackTimer -= dt * 1000;
      e.vx = 0;
      if (e.attackTimer <= 0) { e.state = "cooldown"; e.attackTimer = 600; }
    } else if (e.state === "cooldown") {
      e.attackTimer -= dt * 1000;
      e.vx = 0;
      if (e.attackTimer <= 0) e.state = "patrol";
    } else if (dist < e.alertRange) {
      if (e.state === "patrol") e.alert = 600;
      e.facing = toPlayer;
      e.vx = toPlayer * MOVE_SPEED * 0.4;
      if (dist < 55) { e.state = "attack"; e.attackTimer = e.attackCooldown; }
    } else {
      e.state = "patrol";
      if (Math.abs(e.x - e.patrolOrigin) > e.patrolRange) e.facing *= -1;
      e.vx = e.facing * 30;
    }
  }

  // Movement is handled by engine.js (after AI, before platform clamping)
}
