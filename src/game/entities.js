import { TILE, SCALE, MOVE_SPEED, ENEMY_CONFIG } from "./constants.js";
import { playSound, playRandom } from "./audio.js";
import log from "./logger.js";

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
    // ── Stealth system ──
    crouching: false,    // reduced speed + detection range
    hidden: false,       // inside a hide spot (invisible)
    hideSpot: null,      // reference to active hide object
    visibility: 1,       // 0 = invisible, 1 = fully visible (computed each frame)
    noiseLevel: 0,       // decays over time, spikes on actions (0-1)
  };
}

// ═══ NPC FACTORY — friendly characters in the game world ═══
export function makeNPC(charKey, x, platformY, opts = {}) {
  return {
    x, y: platformY - TILE * SCALE, vx: 0, vy: 0,
    charKey,                          // "sensei", "kunoichi", "shadow", etc.
    facing: opts.facing || -1,        // face left by default
    state: "idle",                    // "idle", "walking_in", "walking_out", "talking"
    frame: 0, frameTimer: 0,
    spriteKey: opts.spriteKey || `story_${charKey}_idle`, // sprite to render
    triggerRange: opts.triggerRange || 80,  // how close player must be to trigger dialogue
    dialogueKey: opts.dialogueKey || null,  // key into ROOM_DIALOGUE for this NPC's lines
    triggered: false,                 // has dialogue been triggered?
    dialogueDone: false,              // has dialogue finished?
    // Post-dialogue behavior
    exitAfter: opts.exitAfter || false,     // walk offscreen after dialogue?
    exitDirection: opts.exitDirection || 1,  // 1 = right, -1 = left
    stayForever: opts.stayForever || false, // remains in room after dialogue
    // Walking animation
    walkSpeed: opts.walkSpeed || 60,
    walkTarget: opts.walkTarget || null,    // x position to walk to (for walking_in)
    startX: opts.startX || x,              // where NPC starts (for walk-in entrance)
  };
}

// ═══ NPC AI — simple state machine ═══
export function updateNPC(npc, player, dt) {
  npc.frameTimer += dt * 1000;
  if (npc.frameTimer > 250) { npc.frame = (npc.frame + 1) % 2; npc.frameTimer = 0; }

  if (npc.state === "walking_in") {
    // Walk toward target position
    if (npc.walkTarget !== null) {
      const dx = npc.walkTarget - npc.x;
      if (Math.abs(dx) > 5) {
        npc.facing = dx > 0 ? 1 : -1;
        npc.vx = npc.facing * npc.walkSpeed;
      } else {
        npc.x = npc.walkTarget;
        npc.vx = 0;
        npc.state = "idle";
      }
    } else {
      npc.state = "idle";
    }
  } else if (npc.state === "walking_out") {
    // Walk offscreen
    npc.facing = npc.exitDirection;
    npc.vx = npc.exitDirection * npc.walkSpeed * 1.5;
  } else if (npc.state === "idle" || npc.state === "talking") {
    npc.vx = 0;
    // Face the player when talking or when player is close
    if (npc.state === "talking" || (!npc.triggered && Math.abs(player.x - npc.x) < npc.triggerRange * 1.5)) {
      npc.facing = player.x > npc.x ? 1 : -1;
    }
  }

  // Apply movement
  npc.x += npc.vx * dt;
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
    shielded: opts.shielded || false, // blocks normal slash, only dash-slash works
    windupTimer: 0, // telegraph before attacking
    // ── Stealth detection ──
    detection: "unaware",  // "unaware" → "suspicious" → "alert"
    suspicion: 0,          // 0-100, thresholds at 50 (suspicious) and 100 (alert)
    searchTimer: 0,        // time spent searching when suspicious/lost sight
    lastKnownX: null,      // where player was last seen
    lastKnownY: null,
  };
}

// ═══ STEALTH CONSTANTS ═══
const CROUCH_DETECT_MULT = 0.4;   // 40% detection range when crouched
const SHADOW_DETECT_MULT = 0.3;   // 30% detection range when in shadow
const NOISE_HEAR_RANGE = 200;     // enemies hear noise within this range
const SUSPICION_RATE = 80;        // suspicion gain per second when visible
const SUSPICION_DECAY = 20;       // suspicion decay per second when not visible
const SUSPICION_SUSPICIOUS = 50;  // threshold for "suspicious" state
const SUSPICION_ALERT = 100;      // threshold for "alert" state
const ALERT_PROPAGATE_RANGE = 300; // alert spreads to enemies within this range
const SEARCH_DURATION = 3000;     // ms to search before returning to unaware

// ═══ ENEMY AI ═══
export function updateEnemyAI(e, player, dt, projectiles, allEnemies) {
  // Dazed — can't do anything
  if (e.dazed > 0) {
    e.dazed -= dt * 1000;
    e.vx = 0;
    if (e.dazed <= 0) { e.dazed = 0; e.state = "patrol"; e.detection = "unaware"; e.suspicion = 0; }
    return;
  }

  const dx = player.x - e.x;
  const dy = player.y - e.y;
  const dist = Math.sqrt(dx * dx + dy * dy); // true 2D distance (not just horizontal)
  const toPlayer = dx > 0 ? 1 : -1;

  // ── Stealth detection system ──
  // Calculate effective detection range based on player stealth state
  const detectMult = (player.crouching ? CROUCH_DETECT_MULT : 1) * (player.inShadow ? SHADOW_DETECT_MULT : 1);
  const effectiveRange = (e.passive ? 50 : e.alertRange) * detectMult;

  // Vertical distance — enemies can't see through floors
  const absDy = Math.abs(dy);
  const sameFloor = absDy < 120; // within ~1.5 platform heights
  const canLookDown = dy > 0 && absDy < 200; // enemy above, player below (limited)

  // Can enemy see the player?
  const canSee = !player.hidden && player.visibility > 0.3 &&
    dist < effectiveRange && (e.facing === toPlayer || dist < 80 * detectMult) &&
    (sameFloor || canLookDown);

  // Can enemy hear the player? (noise-based, ignores facing)
  const canHear = player.noiseLevel > 0.4 && dist < NOISE_HEAR_RANGE;

  // Update suspicion based on detection
  if (canSee) {
    e.suspicion = Math.min(SUSPICION_ALERT, e.suspicion + SUSPICION_RATE * player.visibility * dt);
    e.lastKnownX = player.x;
    e.lastKnownY = player.y;
  } else if (canHear) {
    e.suspicion = Math.min(SUSPICION_ALERT, e.suspicion + 40 * player.noiseLevel * dt);
    e.lastKnownX = player.x;
    e.lastKnownY = player.y;
  } else {
    e.suspicion = Math.max(0, e.suspicion - SUSPICION_DECAY * dt);
  }

  // Update detection state based on suspicion thresholds
  const prevDetection = e.detection;
  if (e.suspicion >= SUSPICION_ALERT) {
    if (prevDetection !== "alert") log.ai(e.type, "→ ALERT (suspicion:", Math.round(e.suspicion), "dist:", Math.round(dist), "sameFloor:", sameFloor, ")");
    e.detection = "alert";
    e.searchTimer = SEARCH_DURATION;
    // Alert propagation — nearby enemies on SAME FLOOR gain suspicion
    if (prevDetection !== "alert" && allEnemies) {
      for (const other of allEnemies) {
        if (other === e || other.dead) continue;
        const eDx = other.x - e.x;
        const eDy = other.y - e.y;
        const e2dDist = Math.sqrt(eDx * eDx + eDy * eDy);
        const onSameFloor = Math.abs(eDy) < 100; // must be roughly same height
        if (e2dDist < ALERT_PROPAGATE_RANGE && onSameFloor) {
          other.suspicion = Math.min(SUSPICION_ALERT, other.suspicion + 40);
          other.lastKnownX = e.lastKnownX;
          other.lastKnownY = e.lastKnownY;
        }
      }
      playSound("detection_alert"); // jsfxr fallback handles missing mp3
    }
  } else if (e.suspicion >= SUSPICION_SUSPICIOUS) {
    if (e.detection === "unaware") {
      e.detection = "suspicious";
      e.searchTimer = SEARCH_DURATION;
      playSound("detection_suspicious");
    }
  } else if (e.detection === "suspicious") {
    e.searchTimer -= dt * 1000;
    if (e.searchTimer <= 0) {
      e.detection = "unaware";
      e.suspicion = 0;
      e.lastKnownX = null;
    }
  } else if (e.detection === "alert" && !canSee && !canHear) {
    // Alert but lost sight — search then calm down
    e.searchTimer -= dt * 1000;
    if (e.searchTimer <= 0) {
      e.detection = "suspicious";
      e.suspicion = SUSPICION_SUSPICIOUS - 1;
      e.searchTimer = SEARCH_DURATION;
    }
  }

  // Backward compat: playerVisible based on detection state
  const playerVisible = e.detection === "alert" || (canSee && e.detection === "suspicious");

  // Suspicious behavior: walk toward last known position
  if (e.detection === "suspicious" && !playerVisible && e.lastKnownX !== null) {
    const searchDx = e.lastKnownX - e.x;
    if (Math.abs(searchDx) > 20) {
      e.facing = searchDx > 0 ? 1 : -1;
      e.vx = e.facing * 40; // slow searching walk
    } else {
      e.vx = 0; // arrived at last known pos, look around
      e.lastKnownX = null;
    }
    // Don't override with combat AI while searching
    if (e.state === "chase") e.state = "patrol";
  }

  if (!playerVisible && e.state === "chase" && e.detection !== "alert") {
    // Lost sight — return to patrol
    e.state = "patrol";
    e.vx = e.facing * 30;
  }

  // Animation cycling
  e.frameTimer += dt * 1000;
  if (e.frameTimer > 250) { e.frame = (e.frame + 1) % 2; e.frameTimer = 0; }

  // Spawn delay — enemies don't detect player for first 1.5 seconds
  if (e._spawnDelay > 0) { e._spawnDelay -= dt * 1000; return; }

  // Block timer
  if (e.blockTimer > 0) {
    e.blockTimer -= dt * 1000;
    if (e.blockTimer <= 0) e.blocking = false;
  }
  if (e.throwAnim > 0) e.throwAnim -= dt * 1000;
  if (e.alert > 0) e.alert -= dt * 1000;
  if (e._dodgeCooldown > 0) e._dodgeCooldown -= dt * 1000;
  if (e._blockCooldown > 0) e._blockCooldown -= dt * 1000;

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
    } else if (e.state === "block") {
      // Oni block — holds ground, absorbs attack, then counter-strikes
      e.blockTimer -= dt * 1000;
      e.vx = 0;
      if (e.blockTimer <= 0) {
        // Counter-attack after block
        e.state = "windup"; e.windupTimer = 200; // faster counter-windup
        e.facing = toPlayer;
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
      // Oni block — when player approaches with slash, sometimes blocks instead of attacking
      if (dist < 90 && player.slashTimer > 0 && !e._blockCooldown && Math.random() < 0.28) {
        e.state = "block"; e.blockTimer = 500;
        e._blockCooldown = 1500;
        e.vx = 0;
        playRandom("parry", { volume: 0.4 });
      }
      // Oni dodge — backstep when player swings nearby
      else if (dist < 80 && player.slashTimer > 0 && !e._dodgeCooldown && Math.random() < 0.25) {
        e.vx = -toPlayer * 250; // quick dodge backward
        e._dodgeCooldown = 1200;
        e.state = "cooldown";
        e.attackTimer = 300;
      } else if (dist < 65) {
        // Windup telegraph — 300ms pause before attacking
        e.state = "windup"; e.windupTimer = 300;
        e.facing = toPlayer;
      }
    } else {
      e.state = "patrol";
      if (e.x > e.patrolOrigin + e.patrolRange) e.facing = -1;
      else if (e.x < e.patrolOrigin - e.patrolRange) e.facing = 1;
      e.vx = e.facing * 50;
    }
  } else if (e.type === "ninja") {
    // Don't flip facing during dodge cooldown (prevents rapid flipping)
    if (dist > 20 && playerVisible && !e._dodgeCooldown) e.facing = toPlayer;
    e.vx = 0;
    if (dist < e.alertRange && playerVisible) {
      if (e.state === "patrol") { e.alert = 400; playRandom("ninja_alert", { volume: 0.4 }); }
      e.state = "chase";
      e.attackTimer -= dt * 1000;
      if (e.attackTimer <= 0) {
        // Elevated ninjas throw downward at player + faster rate
        const elevated = (e.y + 30) < player.y;
        const throwVY = elevated ? 150 : 0;
        const throwSpeed = elevated ? 500 : 450;
        projectiles.push({
          x: e.x, y: e.y + 24, vx: toPlayer * throwSpeed, vy: throwVY,
          type: "shuriken", timer: 3000, rotation: 0, trail: [],
          gravity: elevated, // arrows/shurikens from above have gravity arc
        });
        // Varied throw timing — unpredictable rhythm (±200ms random)
        const baseCD = elevated ? 650 : 900;
        e.attackTimer = baseCD + (Math.random() * 400 - 200);
        e.throwAnim = 400;
        playRandom("ninja_throw");
      }
      // Ninja dodge roll — fast evasion when player slashes nearby
      if (dist < 60 && player.slashTimer > 0 && !e._dodgeCooldown && Math.random() < 0.4) {
        e.vx = -toPlayer * 350; // fast dodge roll
        e._dodgeCooldown = 1000;
        e.state = "retreat";
        e.alert = 200; // brief retreat display
        playRandom("dash", { volume: 0.3, playbackRate: 1.2 });
      }
      // Ninja backstep — retreats when player approaches
      else if (e._dodgeCooldown > 0) {
        // During dodge cooldown: keep retreating slowly (no flipping)
        e.vx = -e.facing * 100;
      } else if (dist < 70 && !((e.y + 30) < player.y)) {
        e.vx = -toPlayer * 160;
        if (dist < 40) {
          e._dodgeCooldown = 800;
          e.vx = -toPlayer * 280;
        }
      }
      // Ninja repositioning — tries to maintain ideal throw distance
      else if (dist > 200 && dist < e.alertRange && !e._dodgeCooldown) {
        e.vx = toPlayer * 60; // slowly close distance to ideal range
      }
    } else {
      e.state = "patrol";
      if (e.x > e.patrolOrigin + e.patrolRange) e.facing = -1;
      else if (e.x < e.patrolOrigin - e.patrolRange) e.facing = 1;
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
      if (e.x > e.patrolOrigin + e.patrolRange) e.facing = -1;
      else if (e.x < e.patrolOrigin - e.patrolRange) e.facing = 1;
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
      if (e.x > e.patrolOrigin + e.patrolRange) e.facing = -1;
      else if (e.x < e.patrolOrigin - e.patrolRange) e.facing = 1;
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
      if (e.x > e.patrolOrigin + e.patrolRange) e.facing = -1;
      else if (e.x < e.patrolOrigin - e.patrolRange) e.facing = 1;
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
        if (e.x > e.patrolOrigin + e.patrolRange) e.facing = -1;
      else if (e.x < e.patrolOrigin - e.patrolRange) e.facing = 1;
        e.vx = e.facing * 30;
      }
    }
  } else if (e.type === "ronin") {
    // Ronin: like oni but faster, 1HP, wider patrol, chance to block
    const effectiveAlertRange = e.passive ? 50 : e.alertRange;
    if (e.state === "attack") {
      e.attackTimer -= dt * 1000;
      if (e.attackTimer < 200) e.vx = e.facing * MOVE_SPEED * 0.9;
      else e.vx = 0;
      if (e.attackTimer <= 0) { e.state = "cooldown"; e.attackTimer = 300; }
    } else if (e.state === "cooldown") {
      e.attackTimer -= dt * 1000;
      e.vx = 0;
      if (e.attackTimer <= 0) e.state = "chase";
    } else if (dist < effectiveAlertRange && playerVisible) {
      if (e.state === "patrol") { e.alert = 400; playRandom("oni_alert", { volume: 0.4 }); }
      e.state = "chase";
      e.facing = toPlayer;
      e.vx = toPlayer * MOVE_SPEED * 0.8;
      if (dist < 60) { e.state = "attack"; e.attackTimer = 400; e.facing = toPlayer; }
    } else {
      e.state = "patrol";
      if (e.x > e.patrolOrigin + e.patrolRange) e.facing = -1;
      else if (e.x < e.patrolOrigin - e.patrolRange) e.facing = 1;
      e.vx = e.facing * 55;
    }
  } else if (e.type === "cyber_ninja") {
    // Cyber Ninja: like ninja but teleport-dashes before attacking
    if (dist > 20 && playerVisible) e.facing = toPlayer;
    e.vx = 0;
    if (dist < e.alertRange && playerVisible) {
      if (e.state === "patrol") { e.alert = 400; playSound("detection_alert"); }
      e.state = "chase";
      e.attackTimer -= dt * 1000;
      if (e.attackTimer <= 0) {
        // Teleport-dash toward player before throwing
        if (dist > 100) {
          e.x += toPlayer * Math.min(150, dist - 60); // instant teleport
          playSound("cyber_teleport");
        }
        projectiles.push({
          x: e.x, y: e.y + 24, vx: toPlayer * 500, vy: 0,
          type: "shuriken", timer: 3000, rotation: 0, trail: [],
        });
        e.attackTimer = 800;
        e.throwAnim = 400;
      }
      if (dist < 80) e.vx = -toPlayer * 180;
    } else {
      e.state = "patrol";
      if (e.x > e.patrolOrigin + e.patrolRange) e.facing = -1;
      else if (e.x < e.patrolOrigin - e.patrolRange) e.facing = 1;
      e.vx = e.facing * 40;
    }
  } else if (e.type === "bouncer") {
    // Bouncer: like brute but with grab mechanic
    if (e.state === "charge") {
      e.attackTimer -= dt * 1000;
      e.vx = e.facing * MOVE_SPEED * 2.2;
      if (e.attackTimer <= 0 || Math.abs(e.x - e.patrolOrigin) > 400) {
        e.state = "exhausted"; e.dazed = 1800; e.vx = 0;
        playSound("bouncer_slam");
      }
    } else if (e.state === "exhausted") {
      e.dazed -= dt * 1000; e.vx = 0;
      if (e.dazed <= 0) { e.dazed = 0; e.state = "patrol"; }
    } else if (dist < e.alertRange && playerVisible) {
      if (e.state === "patrol") { e.alert = 400; playRandom("oni_alert", { volume: 0.7 }); }
      e.state = "chase"; e.facing = toPlayer;
      e.vx = toPlayer * MOVE_SPEED * 0.3;
      if (dist < 130) {
        e.state = "charge"; e.attackTimer = 700; e.facing = toPlayer;
        playSound("bouncer_slam");
      }
    } else {
      e.state = "patrol";
      if (e.x > e.patrolOrigin + e.patrolRange) e.facing = -1;
      else if (e.x < e.patrolOrigin - e.patrolRange) e.facing = 1;
      e.vx = e.facing * 20;
    }
  } else if (e.type === "monk") {
    // Monk: blocks attacks with staff, must attack during slow attack animation
    if (e.state === "block") {
      e.blockTimer -= dt * 1000;
      e.blocking = true;
      e.vx = 0;
      if (e.blockTimer <= 0) { e.blocking = false; e.state = "attack"; e.attackTimer = 800; }
    } else if (e.state === "attack") {
      e.attackTimer -= dt * 1000;
      if (e.attackTimer < 400) e.vx = e.facing * MOVE_SPEED * 0.5;
      else e.vx = 0;
      if (e.attackTimer <= 0) { e.state = "cooldown"; e.attackTimer = 500; }
    } else if (e.state === "cooldown") {
      e.attackTimer -= dt * 1000; e.vx = 0;
      if (e.attackTimer <= 0) e.state = "chase";
    } else if (dist < e.alertRange && playerVisible) {
      if (e.state === "patrol") { e.alert = 400; playSound("staff_strike"); }
      e.state = "chase"; e.facing = toPlayer;
      e.vx = toPlayer * MOVE_SPEED * 0.4;
      if (dist < 55) {
        // Block first, then attack
        e.state = "block"; e.blockTimer = 600; e.blocking = true;
      }
    } else {
      e.state = "patrol";
      if (e.x > e.patrolOrigin + e.patrolRange) e.facing = -1;
      else if (e.x < e.patrolOrigin - e.patrolRange) e.facing = 1;
      e.vx = e.facing * 25;
    }
  } else if (e.type === "spirit_fox") {
    // Spirit Fox: like tengu but creates illusion clones on alert
    e._baseY = e._baseY || e.y;
    e._swoopTimer = (e._swoopTimer || 0) + dt * 1000;
    e.vx = 0;
    if (e.state === "swoop") {
      e.attackTimer -= dt * 1000;
      if (e.attackTimer > 200) { e.vy = 350; e.vx = e.facing * 180; }
      else { e.vy = -250; }
      if (e.attackTimer <= 0) { e.state = "hover"; e.vy = 0; }
    } else {
      e.y = e._baseY + Math.sin(e._swoopTimer * 0.003) * 12;
      e.vy = 0;
      if (dist < e.alertRange && playerVisible) {
        e.state = "hover"; e.facing = toPlayer;
        if (e._swoopTimer > 1800) {
          e.state = "swoop"; e.attackTimer = 500;
          e.facing = toPlayer; e._swoopTimer = 0;
          playSound("fox_cry");
        }
      } else {
        e.state = "patrol";
        if (e.x > e.patrolOrigin + e.patrolRange) e.facing = -1;
      else if (e.x < e.patrolOrigin - e.patrolRange) e.facing = 1;
        e.vx = e.facing * 25;
      }
    }
  } else if (e.type === "cursed_ronin") {
    // Cursed Ronin: mirror of player — has dash, combo, and slow-mo visual
    if (e.state === "attack") {
      e.attackTimer -= dt * 1000;
      if (e.attackTimer < 300) e.vx = e.facing * MOVE_SPEED * 1.0;
      else e.vx = 0;
      if (e.attackTimer <= 0) { e.state = "cooldown"; e.attackTimer = 400; }
    } else if (e.state === "cooldown") {
      e.attackTimer -= dt * 1000; e.vx = 0;
      if (e.attackTimer <= 0) e.state = "chase";
    } else if (dist < e.alertRange && playerVisible) {
      if (e.state === "patrol") { e.alert = 400; playRandom("samurai_alert", { volume: 0.6 }); }
      e.state = "chase"; e.facing = toPlayer;
      // Dash toward player if far enough
      if (dist > 120 && dist < 200 && Math.random() < 0.02) {
        e.x += toPlayer * 100; // quick dash
        playSound("dash", { volume: 0.5, playbackRate: 0.8 });
      }
      e.vx = toPlayer * MOVE_SPEED * 0.7;
      if (dist < 65) {
        e.state = "attack"; e.attackTimer = 500; e.facing = toPlayer;
        playRandom("samurai_attack", { volume: 0.6 });
      }
    } else {
      e.state = "patrol";
      if (e.x > e.patrolOrigin + e.patrolRange) e.facing = -1;
      else if (e.x < e.patrolOrigin - e.patrolRange) e.facing = 1;
      e.vx = e.facing * 35;
    }
  }

  // Movement is handled by engine.js (after AI, before platform clamping)
}
