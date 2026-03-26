import { TILE, SCALE, MOVE_SPEED, ENEMY_CONFIG } from "./constants.js";
import { playSound, playRandom } from "./audio.js";

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
    dashSlashing: false, parryTimer: 0, groundPounding: false,
  };
}

// ═══ ENEMY FACTORY ═══
export function makeEnemy(type, x, platformY, opts = {}) {
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
    passive: opts.passive || false, // tutorial: doesn't attack until player is close
    windupTimer: 0, // telegraph before attacking
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
  // But close proximity (80px) alerts them even from behind (they hear you)
  const playerVisible = !player.inShadow && (e.facing === toPlayer || dist < 80);
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
    // Passive enemies only react when player is very close
    const effectiveAlertRange = e.passive ? 50 : e.alertRange;

    if (e.state === "windup") {
      // Telegraph: oni pauses with visible "!" before attacking
      e.windupTimer -= dt * 1000;
      e.vx = 0;
      if (e.windupTimer <= 0) {
        e.state = "attack"; e.attackTimer = 400;
        playRandom("oni_attack", { volume: 0.6 });
      }
    } else if (e.state === "attack") {
      e.attackTimer -= dt * 1000;
      // Lunge forward during strike
      if (e.attackTimer < 300) e.vx = e.facing * MOVE_SPEED * 0.8;
      else e.vx = 0;
      if (e.attackTimer <= 0) { e.state = "cooldown"; e.attackTimer = 300; }
    } else if (e.state === "cooldown") {
      e.attackTimer -= dt * 1000;
      e.vx = 0;
      if (e.attackTimer <= 0) e.state = "chase";
    } else if (dist < effectiveAlertRange && playerVisible) {
      if (e.state === "patrol") { e.alert = 400; playRandom("oni_alert", { volume: 0.5 }); }
      e.state = "chase";
      e.facing = toPlayer;
      e.vx = toPlayer * MOVE_SPEED * 0.7;
      if (dist < 65) {
        // Windup telegraph — 300ms pause before attacking
        e.state = "windup"; e.windupTimer = 300;
        e.facing = toPlayer;
      }
    } else {
      e.state = "patrol";
      if (Math.abs(e.x - e.patrolOrigin) > e.patrolRange) e.facing *= -1;
      e.vx = e.facing * 50;
    }
  } else if (e.type === "ninja") {
    if (dist > 20 && playerVisible) e.facing = toPlayer;
    e.vx = 0;
    if (dist < e.alertRange && playerVisible) {
      if (e.state === "patrol") { e.alert = 400; playRandom("ninja_alert", { volume: 0.4 }); }
      e.state = "chase";
      e.attackTimer -= dt * 1000;
      if (e.attackTimer <= 0) {
        projectiles.push({
          x: e.x, y: e.y + 24, vx: toPlayer * 450, vy: 0,
          type: "shuriken", timer: 3000, rotation: 0, trail: [],
        });
        e.attackTimer = 900;
        e.throwAnim = 400;
        playRandom("ninja_throw");
      }
      if (dist < 100) e.vx = -toPlayer * 150;
    } else {
      e.state = "patrol";
      if (Math.abs(e.x - e.patrolOrigin) > e.patrolRange) e.facing *= -1;
      e.vx = e.facing * 35;
    }
  } else if (e.type === "samurai") {
    // Samurai: elite enemy — lethal frontal attack, must dash through and backstab
    if (e._turnDelay > 0) e._turnDelay -= dt * 1000;

    if (e.state === "attack") {
      e.attackTimer -= dt * 1000;
      if (e.attackTimer < 250) e.vx = e.facing * MOVE_SPEED * 0.6;
      else e.vx = 0;
      if (e.attackTimer <= 0) { e.state = "cooldown"; e.attackTimer = 500; }
    } else if (e.state === "cooldown") {
      e.attackTimer -= dt * 1000;
      e.vx = 0;
      if (e.attackTimer <= 0) e.state = "chase";
    } else if (dist < e.alertRange && playerVisible) {
      if (e.state === "patrol") { e.alert = 400; playRandom("samurai_alert", { volume: 0.6 }); }
      e.state = "chase";
      if (e.facing !== toPlayer && (e._turnDelay || 0) <= 0) {
        e._turnDelay = 400;
        e.facing = toPlayer;
      }
      e.vx = e.facing * MOVE_SPEED * 0.4;
      if (dist < 60 && e.facing === toPlayer) {
        e.state = "attack"; e.attackTimer = 700;
        playRandom("samurai_attack", { volume: 0.7 });
      }
    } else {
      e.state = "patrol";
      if (Math.abs(e.x - e.patrolOrigin) > e.patrolRange) e.facing *= -1;
      e.vx = e.facing * 30;
    }
  } else if (e.type === "archer") {
    // Archer: elevated sniper, fires parabolic arrows, retreats when close
    if (dist > 20 && playerVisible) e.facing = toPlayer;
    e.vx = 0;
    if (dist < e.alertRange && playerVisible) {
      if (e.state === "patrol") { e.alert = 400; playRandom("ninja_alert", { volume: 0.4 }); }
      e.state = "chase";
      e.attackTimer -= dt * 1000;
      if (e.attackTimer <= 0) {
        // Parabolic arrow — gravity-affected projectile
        const arcVy = -300 - Math.min(dist * 0.5, 200);
        projectiles.push({
          x: e.x, y: e.y + 20, vx: toPlayer * 250, vy: arcVy,
          type: "arrow", timer: 4000, gravity: true, rotation: 0, trail: [],
        });
        e.attackTimer = (ENEMY_CONFIG.archer.fireRate || 1200);
        e.throwAnim = 400;
        playRandom("ninja_throw", { volume: 0.5, playbackRate: 0.7 });
      }
      // Retreat if player gets close
      if (dist < 120) e.vx = -toPlayer * 120;
    } else {
      e.state = "patrol";
      if (Math.abs(e.x - e.patrolOrigin) > e.patrolRange) e.facing *= -1;
      e.vx = e.facing * 25;
    }
  } else if (e.type === "brute") {
    // Brute: large, 3HP, charges when spots player, exhausted after charge
    if (e.state === "charge") {
      e.attackTimer -= dt * 1000;
      e.vx = e.facing * MOVE_SPEED * 2.0;
      if (e.attackTimer <= 0 || Math.abs(e.x - e.patrolOrigin) > 400) {
        e.state = "exhausted";
        e.dazed = 1500; // vulnerable
        e.vx = 0;
        playSound("land", { volume: 0.7, playbackRate: 0.5 });
      }
    } else if (e.state === "exhausted") {
      e.dazed -= dt * 1000;
      e.vx = 0;
      if (e.dazed <= 0) { e.dazed = 0; e.state = "patrol"; }
    } else if (dist < e.alertRange && playerVisible) {
      if (e.state === "patrol") {
        e.alert = 400;
        playRandom("oni_alert", { volume: 0.7 });
      }
      e.state = "chase";
      e.facing = toPlayer;
      e.vx = toPlayer * MOVE_SPEED * 0.4;
      // Start charge when close enough
      if (dist < 150) {
        e.state = "charge";
        e.attackTimer = 600; // charge duration
        e.facing = toPlayer;
        playRandom("oni_attack", { volume: 0.8 });
      }
    } else {
      e.state = "patrol";
      if (Math.abs(e.x - e.patrolOrigin) > e.patrolRange) e.facing *= -1;
      e.vx = e.facing * 25;
    }
  } else if (e.type === "tengu") {
    // Tengu: flying enemy, hovers with sine-wave bob, swoops to attack
    e._baseY = e._baseY || e.y;
    e._swoopTimer = (e._swoopTimer || 0) + dt * 1000;
    e.vx = 0;

    if (e.state === "swoop") {
      // Diving at player
      e.attackTimer -= dt * 1000;
      if (e.attackTimer > 200) {
        // Dive down
        e.vy = 400;
        e.vx = e.facing * 200;
      } else {
        // Pull back up
        e.vy = -300;
      }
      if (e.attackTimer <= 0) {
        e.state = "hover";
        e.vy = 0;
      }
    } else {
      // Hover with sine bob
      e.y = e._baseY + Math.sin(e._swoopTimer * 0.003) * 15;
      e.vy = 0;
      if (dist < e.alertRange && playerVisible) {
        if (e.state === "patrol") { e.alert = 400; }
        e.state = "hover";
        e.facing = toPlayer;
        // Swoop every 2s
        if (e._swoopTimer > (ENEMY_CONFIG.tengu.swoopInterval || 2000)) {
          e.state = "swoop";
          e.attackTimer = 600;
          e.facing = toPlayer;
          e._swoopTimer = 0;
          playRandom("oni_attack", { volume: 0.5, playbackRate: 1.3 });
        }
      } else {
        e.state = "patrol";
        if (Math.abs(e.x - e.patrolOrigin) > e.patrolRange) e.facing *= -1;
        e.vx = e.facing * 30;
      }
    }
  }

  // Movement is handled by engine.js (after AI, before platform clamping)
}
