import { TILE, SCALE, DASH_COOLDOWN, hash } from "./constants.js";
import { getSprite, getMascotImage, getImage } from "./sprites.js";

const DRAW_SIZE = TILE * SCALE; // 60px

// ═══ MAIN RENDER ═══
export function render(g, ctx, isDesktop, font) {
  const { W, H, camera: cam } = g;
  // Round camera position to prevent subpixel jitter on all world objects
  const cx = Math.round(cam.x + cam.shakeX);
  const cy = Math.round(cam.y + cam.shakeY);

  ctx.fillStyle = "#0a0a14";
  ctx.fillRect(0, 0, W, H);
  renderBackground(ctx, W, H, cx, g);

  // Ambient particles (behind world objects)
  for (const em of g.embers) {
    const sx = em.x - cx;
    if (sx < -20 || sx > W + 20) continue;
    const lifeAlpha = Math.min(1, em.life / em.maxLife);

    if (em.type === "firefly") {
      // Pulsing glow orb
      const pulse = 0.4 + Math.sin(g.time.elapsed * 4 + em.phase) * 0.3;
      ctx.globalAlpha = lifeAlpha * pulse;
      // Outer glow
      ctx.fillStyle = em.color;
      ctx.beginPath();
      ctx.arc(sx, em.y, em.size * 1.5, 0, Math.PI * 2);
      ctx.fill();
      // Bright core
      ctx.globalAlpha = lifeAlpha * pulse * 1.5;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(sx, em.y, em.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (em.type === "leaf") {
      // Rotating leaf shape
      ctx.globalAlpha = lifeAlpha * 0.5;
      ctx.fillStyle = em.color;
      ctx.save();
      ctx.translate(sx, em.y);
      ctx.rotate(em.phase);
      ctx.fillRect(-em.size, -em.size * 0.3, em.size * 2, em.size * 0.6);
      ctx.restore();
    } else {
      // Dust mote
      ctx.globalAlpha = lifeAlpha * 0.25;
      ctx.fillStyle = em.color;
      ctx.beginPath();
      ctx.arc(sx, em.y, em.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  ctx.save();
  ctx.translate(-cx, -cy);

  // Decorations
  for (const d of g.decorations) renderDeco(ctx, d, g.groundY, g.time.elapsed);

  // Platforms
  for (const plat of g.platforms) {
    if (plat.x + plat.w < cx - 50 || plat.x > cx + W + 50) continue;
    const hasBg = !!getImage("bg_forest");
    const grad = ctx.createLinearGradient(plat.x, plat.y, plat.x, plat.y + 14);
    grad.addColorStop(0, hasBg ? "#1a2a20" : "#1e1e30");
    grad.addColorStop(1, hasBg ? "#0e1a14" : "#12121e");
    ctx.fillStyle = grad;
    ctx.fillRect(plat.x, plat.y, plat.w, 14);
    const accent = hasBg ? "#3a8a5a" : "#c0282a";
    ctx.fillStyle = accent;
    ctx.fillRect(plat.x, plat.y, plat.w, 1);
    ctx.fillStyle = accent + "55";
    ctx.fillRect(plat.x, plat.y + 1, plat.w, 1);
    ctx.fillStyle = accent + "18";
    ctx.fillRect(plat.x, plat.y + 2, plat.w, 3);
    ctx.fillStyle = accent + "22";
    ctx.fillRect(plat.x, plat.y, 1, 14);
    ctx.fillRect(plat.x + plat.w - 1, plat.y, 1, 14);
  }

  // ── Enemies (procedural shapes) ──
  for (const e of g.enemies) {
    if (e.x < cx - 100 || e.x > cx + W + 100) continue;
    if (e.dead) {
      if (e.deathTimer > 400) {
        // Bright white flash on death frame
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = (e.deathTimer - 400) / 100;
        ctx.fillRect(e.x - 25, e.y, 50, 60);
        ctx.globalAlpha = 1;
        continue;
      }
      // Fade out
      ctx.globalAlpha = Math.max(0, e.deathTimer / 400);
    }
    drawEnemy(ctx, e, g.time.elapsed, font);
    ctx.globalAlpha = 1;
  }

  // Projectiles with trails
  for (const proj of g.projectiles) {
    if (proj.trail && proj.trail.length > 1) {
      for (let i = 0; i < proj.trail.length - 1; i++) {
        ctx.globalAlpha = (i / proj.trail.length) * 0.4;
        ctx.fillStyle = "#8888cc";
        const t = proj.trail[i];
        const size = 2 + (i / proj.trail.length) * 3;
        ctx.fillRect(t.x - size / 2, t.y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
    }
    ctx.save();
    ctx.translate(proj.x, proj.y);
    ctx.rotate(proj.rotation);
    const sprFrame = Math.floor(g.time.elapsed * 8) % 2 === 0 ? "shuriken" : "shuriken2";
    const spr = getSprite(sprFrame);
    if (spr) ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
    ctx.restore();
  }

  // Player afterimages (dash trail)
  const mascot = getMascotImage();
  if (mascot) {
    for (const ai of g.player.afterimages) {
      ctx.globalAlpha = (ai.life / 200) * 0.3;
      const aspect = SRC_W / SRC_H;
      const dw = DRAW_SIZE * aspect * 0.95;
      const dh = DRAW_SIZE * 0.95;
      ctx.save();
      ctx.translate(ai.x, ai.y + DRAW_SIZE);
      if (ai.facing > 0) ctx.scale(-1, 1);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(mascot, SRC_X, SRC_Y, SRC_W, SRC_H, -dw / 2, -dh, dw, dh);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  // ── Player (actual mascot PNG with transforms) ──
  if (!g.player.dead && mascot) {
    drawPlayer(ctx, g.player, mascot, g.time.elapsed);
  }

  // ── Slash trails — tear/rip shapes, not rectangles ──
  for (const s of g.slashEffects) {
    const progress = 1 - s.timer / s.maxTimer;
    const alpha = progress < 0.08 ? progress / 0.08 : Math.pow(1 - progress, 0.5);
    const dir = s.facing;
    const combo = s.combo || 1;
    const isThird = combo === 3;

    let len, angle;
    if (combo === 1) { len = 75; angle = -0.5; }
    else if (combo === 2) { len = 85; angle = 0.4; }
    else { len = 110; angle = -0.12; }

    const x1 = s.x - dir * 5;
    const y1 = s.y;
    const x2 = x1 + dir * Math.cos(angle) * len;
    const y2 = y1 + Math.sin(angle) * len;

    const glowCol = isThird ? "#2070cc" : "#aabbee";
    const midCol = isThird ? "#40aaff" : "#dde4ff";
    const coreCol = isThird ? "#80ddff" : "#ffffff";

    ctx.save();

    // Draw tear/rip shape — tapered: thick at start, thin at tip
    // Outer glow tear
    ctx.globalAlpha = alpha * 0.25;
    ctx.fillStyle = glowCol;
    ctx.beginPath();
    const perpX = Math.sin(angle) * (isThird ? 14 : 10);
    const perpY = -Math.cos(angle) * (isThird ? 14 : 10);
    ctx.moveTo(x1 + perpX, y1 + perpY);
    ctx.lineTo(x1 - perpX, y1 - perpY);
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.fill();

    // Mid tear
    ctx.globalAlpha = alpha * 0.6;
    ctx.fillStyle = midCol;
    ctx.beginPath();
    const mp = 0.5;
    ctx.moveTo(x1 + perpX * mp, y1 + perpY * mp);
    ctx.lineTo(x1 - perpX * mp, y1 - perpY * mp);
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.fill();

    // Core tear — brightest, thinnest
    ctx.globalAlpha = alpha * 0.9;
    ctx.fillStyle = coreCol;
    ctx.beginPath();
    const cp = 0.2;
    ctx.moveTo(x1 + perpX * cp, y1 + perpY * cp);
    ctx.lineTo(x1 - perpX * cp, y1 - perpY * cp);
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.fill();

    ctx.lineCap = "round";
    // Thin core line through center for sharpness
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = coreCol;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.lineCap = "butt";
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Particles
  for (const part of g.particles) {
    ctx.globalAlpha = part.life / part.maxLife;
    ctx.fillStyle = part.color;
    if (part.isLine) {
      ctx.fillRect(part.x, part.y, part.size * 6, part.size);
    } else {
      ctx.fillRect(part.x - part.size / 2, part.y - part.size / 2, part.size, part.size);
    }
  }
  ctx.globalAlpha = 1;

  // Floating texts
  for (const ft of g.floatingTexts) {
    const alpha = ft.life / ft.maxLife;
    const scale = 1 + (1 - alpha) * 0.3;
    ctx.save();
    ctx.translate(ft.x, ft.y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;
    ctx.font = `bold 13px ${font}`;
    ctx.textAlign = "center";
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, 0, 0);
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  ctx.restore(); // end camera

  // Post-processing
  if (g.flashTimer > 0) {
    ctx.fillStyle = `rgba(255,255,255,${(g.flashTimer / 60) * 0.2})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (g.slowMo.active) {
    ctx.fillStyle = "rgba(80,60,180,0.12)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,50,50,0.04)";
    ctx.fillRect(0, 0, 3, H);
    ctx.fillStyle = "rgba(50,50,255,0.04)";
    ctx.fillRect(W - 3, 0, 3, H);
  }

  // Scanlines
  ctx.fillStyle = "rgba(0,0,0,0.05)";
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);

  // Vignette
  const vg = ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.75);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  renderHUD(ctx, g, W, isDesktop, font);
}

// ═══════════════════════════════════════════
// ═══ DRAW PLAYER — actual mascot PNG ═══
// ═══════════════════════════════════════════
// The mascot PNG is 1024x1024 but the character only occupies the center.
// Source crop removes empty padding (character spans ~rows 6-24 in a 32-cell grid).
// Crop rects for player images (remove gray/transparent padding)
const SRC_X = 64, SRC_Y = 160, SRC_W = 896, SRC_H = 660; // idle mascot
const RUN_CROP = { x: 140, y: 140, w: 750, h: 730 }; // run frames
const SLASH_CROP = { x: 80, y: 100, w: 860, h: 800 }; // slash frames (generous)

function drawPlayer(ctx, p, mascot, elapsed) {
  const s = DRAW_SIZE;
  const isSlashing = p.state.startsWith("slash");

  ctx.save();
  ctx.translate(p.x, p.y + DRAW_SIZE);

  if (p.invincible > 0 && Math.floor(p.invincible / 50) % 2 === 0) ctx.globalAlpha = 0.4;
  ctx.imageSmoothingEnabled = false;

  // ── RUN — use actual sprite frames ──
  if (p.state === "run") {
    const frameIndex = (Math.floor(elapsed * 8) % 4) + 1;
    const runImg = getImage("run" + frameIndex);
    if (runImg) {
      // Run frames face LEFT in the source images — flip for right
      if (p.facing < 0) ctx.scale(-1, 1);
      const rc = RUN_CROP;
      const aspect = rc.w / rc.h;
      const dw = s * aspect * 0.95;
      const dh = s * 0.95;
      ctx.drawImage(runImg, rc.x, rc.y, rc.w, rc.h, -dw / 2, -dh, dw, dh);
      ctx.globalAlpha = 1;
      ctx.restore();
      return;
    }
  }

  // Idle mascot faces left — flip for right
  if (p.facing > 0) ctx.scale(-1, 1);

  // ── All other states — use mascot + transforms ──
  const aspect = SRC_W / SRC_H;
  const drawW = s * aspect * 0.95;
  const drawH = s * 0.95;
  let oy = 0;

  if (p.state === "idle") {
    oy = Math.sin(elapsed * 2) * 0.8;
  } else if (p.state === "dash") {
    ctx.scale(1.12, 0.92);
  }

  if (isSlashing) {
    const combo = p.slashCombo;
    const isThird = combo === 3;

    // Pick which sprite frame to show based on combo + slash phase
    let slashImgKey;
    if (p.state === "slash1") {
      // Wind-up: use the previous combo's cut frame or frame 1
      slashImgKey = combo <= 1 ? "slash1" : combo === 2 ? "slash1" : "slash3";
    } else if (p.state === "slash2") {
      // THE CUT — each combo level uses a different frame
      if (combo === 1) slashImgKey = "slash1";      // horizontal cut
      else if (combo === 2) slashImgKey = "slash2";  // upward arc
      else slashImgKey = "slash4";                   // lightning slide
    } else {
      // Follow-through — hold the cut frame briefly
      if (combo === 1) slashImgKey = "slash1";
      else if (combo === 2) slashImgKey = "slash2";
      else slashImgKey = "slash4";
    }

    const slashImg = getImage(slashImgKey);
    if (slashImg) {
      // Slash frames face LEFT — flip for right (same as run)
      if (p.facing < 0) ctx.scale(-1, 1);

      // Blue lightning glow on 3rd hit
      if (isThird) {
        ctx.fillStyle = "rgba(40,120,255,0.12)";
        ctx.fillRect(-drawW, -drawH - 10, drawW * 2.5, drawH + 30);
      }

      const sc = SLASH_CROP;
      const sa = sc.w / sc.h;
      const sdw = s * sa * 1.05; // slightly larger for slash poses
      const sdh = s * 1.05;
      ctx.drawImage(slashImg, sc.x, sc.y, sc.w, sc.h, -sdw / 2, -sdh, sdw, sdh);

      // Blue lightning sparks on 3rd hit — tiny, fast
      if (isThird && (p.state === "slash2" || p.state === "slash3")) {
        ctx.globalAlpha = 0.8;
        for (let i = 0; i < 10; i++) {
          const lx = -sdw * 0.3 + Math.sin(elapsed * 30 + i * 0.9) * sdw * 0.4;
          const ly = -sdh * 0.5 + Math.cos(elapsed * 22 + i * 1.3) * sdh * 0.2;
          ctx.fillStyle = i % 3 === 0 ? "#ffffff" : i % 3 === 1 ? "#40aaff" : "#80ddff";
          // Tiny spark crosses
          ctx.fillRect(lx, ly - 2, 1, 4);
          ctx.fillRect(lx - 2, ly, 4, 1);
        }
        ctx.globalAlpha = 1;
      }
    } else {
      // Fallback if images not loaded
      ctx.drawImage(mascot, SRC_X, SRC_Y, SRC_W, SRC_H, -drawW / 2, -drawH, drawW, drawH);
    }
  } else {
    // Normal draw for all other states
    ctx.drawImage(mascot, SRC_X, SRC_Y, SRC_W, SRC_H, -drawW / 2, -drawH + oy, drawW, drawH);
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

// Helper: draw a katana blade at position with angle
function drawBlade(ctx, x, y, angle, len, bladeColor, edgeColor) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  // Handle
  ctx.fillStyle = "#3a2818";
  ctx.fillRect(-1, 0, 4, 8);
  // Tsuba
  ctx.fillStyle = "#bb8833";
  ctx.fillRect(-3, -1, 8, 3);
  // Blade
  ctx.fillStyle = bladeColor;
  ctx.fillRect(0, -len, 3, len);
  // Edge highlight
  ctx.fillStyle = edgeColor;
  ctx.fillRect(0, -len, 1.5, len);
  // Tip
  ctx.beginPath();
  ctx.moveTo(0, -len);
  ctx.lineTo(1.5, -len - 5);
  ctx.lineTo(3, -len);
  ctx.fill();
  ctx.restore();
}

// ═══════════════════════════════════════════════
// ═══ DRAW ENEMY — clean procedural characters ═══
// ═══════════════════════════════════════════════
// Source crop rects for enemy images (remove background padding)
const ENEMY_CROPS = {
  oni: { x: 170, y: 160, w: 690, h: 670 },
  ninja: { x: 150, y: 230, w: 780, h: 570 },
  // samurai: { x: ..., y: ..., w: ..., h: ... },
};

function drawEnemyFromImage(ctx, e, elapsed) {
  const img = getImage(e.type);
  const crop = ENEMY_CROPS[e.type];
  if (!img || !crop) return false;

  const s = DRAW_SIZE;
  const aspect = crop.w / crop.h;
  const drawW = s * aspect;
  const drawH = s;

  ctx.save();
  ctx.translate(Math.round(e.x), Math.round(e.y + DRAW_SIZE));

  // Flip based on facing
  if (e.facing > 0) ctx.scale(-1, 1);

  // Minimal transforms — don't distort static images
  let oy = 0;
  if (e.state === "patrol") {
    oy = Math.abs(Math.sin(elapsed * 4 + e.patrolOrigin * 0.1)) * -1.5;
  } else if (e.state === "chase") {
    oy = Math.abs(Math.sin(elapsed * 7 + e.patrolOrigin * 0.1)) * -2;
  }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, Math.round(-drawW / 2), Math.round(-drawH + oy), Math.round(drawW), Math.round(drawH));

  // ── Oni: club swing ──
  if (e.type === "oni" && (e.state === "attack" || e.state === "chase")) {
    const isAttacking = e.state === "attack";
    const progress = isAttacking ? e.attackTimer / 600 : 1;
    let clubAngle;
    if (!isAttacking) clubAngle = 1.2;            // held at side while chasing
    else if (progress > 0.5) clubAngle = -1.8;    // raised overhead
    else clubAngle = 0.6;                         // smashed down

    ctx.save();
    ctx.translate(6, -drawH * 0.4 + oy);
    ctx.rotate(clubAngle);
    // Handle
    ctx.fillStyle = "#6b4830";
    ctx.fillRect(-2, 0, 4, 28);
    // Club head — iron kanabō
    ctx.fillStyle = "#4a4a4a";
    ctx.fillRect(-5, -8, 10, 10);
    ctx.fillStyle = "#666";
    ctx.fillRect(-4, -7, 2, 2);
    ctx.fillRect(2, -7, 2, 2);
    ctx.fillRect(-1, -4, 2, 2);
    // Impact on strike frame
    if (isAttacking && progress < 0.3) {
      ctx.fillStyle = "rgba(255,200,50,0.5)";
      ctx.fillRect(-8, -12, 16, 14);
    }
    ctx.restore();
  }

  // ── Ninja: throwing motion ──
  if (e.type === "ninja" && e.throwAnim > 0) {
    const tp = e.throwAnim / 500;
    ctx.save();
    ctx.translate(4, -drawH * 0.45 + oy);
    // Arm sweeps out
    const armAngle = (1 - tp) * 1.5 - 0.5;
    ctx.rotate(armAngle);
    ctx.fillStyle = "#3a2a50";
    ctx.fillRect(0, -2, 22, 4);
    // Star visible at start of throw
    if (tp > 0.4) {
      ctx.fillStyle = "#aaaadd";
      ctx.save();
      ctx.translate(24, 0);
      ctx.rotate(elapsed * 15);
      ctx.fillRect(-4, -1, 8, 2);
      ctx.fillRect(-1, -4, 2, 8);
      ctx.restore();
    }
    ctx.restore();
  }

  ctx.restore();
  return true;
}

function drawEnemy(ctx, e, elapsed, font) {
  // Try image-based rendering first
  if (drawEnemyFromImage(ctx, e, elapsed)) {
    // Draw overlays (alert, HP pips, etc.) after image
    drawEnemyOverlays(ctx, e, elapsed, font);
    return;
  }

  // Fallback: procedural shapes for enemies without images
  const x = e.x;
  const y = e.y;
  const f = e.facing;
  const bobY = Math.sin(elapsed * 3 + x * 0.1) * 2;
  const walkCycle = elapsed * 5;
  const legSwing = e.state === "patrol" || e.state === "chase" ? Math.sin(walkCycle) * 4 : 0;

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  if (e.type === "oni") {
    // ── BANDIT — round head, headband, staff ──
    const bodyColor = "#6b4830";
    const skinColor = "#e8c090";
    const headbandColor = "#cc9933";

    // Body
    ctx.fillStyle = bodyColor;
    ctx.fillRect(-12, 22, 24, 22);
    ctx.fillStyle = "#5a3a24";
    ctx.fillRect(-10, 30, 20, 4); // belt

    // Legs
    ctx.fillStyle = bodyColor;
    ctx.fillRect(-8, 44, 6, 14 + legSwing);
    ctx.fillRect(2, 44, 6, 14 - legSwing);

    // Head
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(0, 14, 14, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = "#000000";
    ctx.fillRect(-6, 12, 3, 3);
    ctx.fillRect(3, 12, 3, 3);
    // Angry brow
    ctx.fillRect(-7, 9, 5, 2);
    ctx.fillRect(2, 9, 5, 2);

    // Headband
    ctx.fillStyle = headbandColor;
    ctx.fillRect(-15, 4, 30, 5);
    // Headband tail
    ctx.fillStyle = headbandColor;
    ctx.fillRect(14, 4, 8, 3);
    ctx.fillRect(18, 7, 6, 2);

    // Staff
    ctx.fillStyle = "#8b6840";
    ctx.fillRect(f * 16, 8, 3, 48);
    ctx.fillStyle = "#a08050";
    ctx.fillRect(f * 16, 8, 3, 2);

    // Arms
    ctx.fillStyle = skinColor;
    ctx.fillRect(-14, 24, 5, 12);
    ctx.fillRect(9, 24, 5, 12);

  } else if (e.type === "ninja") {
    // ── ARCHER — conical hat, bow, green outfit ──
    const outfitColor = "#2a5040";
    const hatColor = "#8b7340";
    const skinColor = "#e8c090";

    // Body
    ctx.fillStyle = outfitColor;
    ctx.fillRect(-10, 22, 20, 20);
    ctx.fillStyle = "#1e3a2e";
    ctx.fillRect(-8, 30, 16, 3); // belt

    // Legs
    ctx.fillStyle = outfitColor;
    ctx.fillRect(-7, 42, 5, 14 + legSwing);
    ctx.fillRect(2, 42, 5, 14 - legSwing);

    // Head
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(0, 16, 12, 0, Math.PI * 2);
    ctx.fill();

    // Mask (lower face cover)
    ctx.fillStyle = "#1e3a2e";
    ctx.fillRect(-8, 18, 16, 8);

    // Eyes
    ctx.fillStyle = "#000000";
    ctx.fillRect(-5, 13, 3, 2);
    ctx.fillRect(2, 13, 3, 2);

    // Conical hat
    ctx.fillStyle = hatColor;
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(-18, 10);
    ctx.lineTo(18, 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#766030";
    ctx.fillRect(-16, 8, 32, 2);

    // Bow (on the side)
    ctx.strokeStyle = "#6b4830";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(f * 18, 28, 16, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.stroke();
    // Bowstring
    ctx.strokeStyle = "#aaa";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(f * 18, 28 - 14);
    ctx.lineTo(f * 18, 28 + 14);
    ctx.stroke();

    // Throw animation — arm extended
    if (e.throwAnim > 0) {
      ctx.fillStyle = skinColor;
      ctx.fillRect(f * 10, 22, f * 18, 4);
    }

  } else if (e.type === "samurai") {
    // ── GUARD — armored, helmet with crest, sword ──
    const armorColor = "#4a3858";
    const armorLight = "#6a5078";
    const goldColor = "#cc9933";
    const skinColor = "#e8c090";

    // Body (armored)
    ctx.fillStyle = armorColor;
    ctx.fillRect(-13, 22, 26, 24);
    // Shoulder plates
    ctx.fillStyle = armorLight;
    ctx.fillRect(-16, 22, 8, 8);
    ctx.fillRect(8, 22, 8, 8);
    // Gold trim
    ctx.fillStyle = goldColor;
    ctx.fillRect(-13, 22, 26, 2);
    ctx.fillRect(-13, 32, 26, 2);

    // Legs (armored)
    ctx.fillStyle = armorColor;
    ctx.fillRect(-8, 46, 6, 14 + legSwing);
    ctx.fillRect(2, 46, 6, 14 - legSwing);

    // Head
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(0, 14, 13, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = "#000000";
    ctx.fillRect(-5, 12, 3, 3);
    ctx.fillRect(2, 12, 3, 3);

    // Helmet
    ctx.fillStyle = armorColor;
    ctx.fillRect(-14, 0, 28, 12);
    ctx.fillStyle = armorLight;
    ctx.fillRect(-14, 0, 28, 3);
    // Crest
    ctx.fillStyle = goldColor;
    ctx.fillRect(-2, -8, 4, 10);
    ctx.fillRect(-4, -8, 8, 3);

    // Face guard
    ctx.fillStyle = armorColor;
    ctx.fillRect(-10, 12, 4, 6);
    ctx.fillRect(6, 12, 4, 6);

    // Katana
    if (e.blocking) {
      // Held horizontally (blocking)
      ctx.fillStyle = "#a0b0c8";
      ctx.fillRect(-25, 18, 50, 2);
      ctx.fillStyle = "#e0e8ff";
      ctx.fillRect(-25, 18, 50, 1);
    } else {
      // Held at side
      ctx.fillStyle = "#a0b0c8";
      ctx.fillRect(f * 16, 10, 2, 40);
      ctx.fillStyle = "#e0e8ff";
      ctx.fillRect(f * 16, 10, 1, 40);
      // Handle
      ctx.fillStyle = "#4a3020";
      ctx.fillRect(f * 16 - 1, 38, 4, 10);
    }
  }

  drawEnemyOverlays(ctx, e, elapsed, font);
  ctx.restore();
}

function drawEnemyOverlays(ctx, e, elapsed, font) {
  ctx.save();
  ctx.translate(Math.round(e.x), Math.round(e.y));

  // Alert "!"
  if (e.alert > 0 && !e.dead) {
    const alertAlpha = Math.min(1, e.alert / 200);
    ctx.globalAlpha = alertAlpha;
    ctx.fillStyle = "#ff4444";
    ctx.font = `bold 16px ${font}`;
    ctx.textAlign = "center";
    ctx.fillText("!", 0, -8);
    ctx.globalAlpha = 1;
  }

  // Samurai HP pips
  if (e.type === "samurai" && !e.dead) {
    for (let i = 0; i < 2; i++) {
      ctx.fillStyle = i < e.hp ? "#cc9933" : "#333344";
      ctx.fillRect(-6 + i * 12, -12, 8, 4);
      if (i < e.hp) {
        ctx.fillStyle = "#ffcc66";
        ctx.fillRect(-6 + i * 12, -12, 8, 1);
      }
    }
  }

  // Block shield
  if (e.blocking && !e.dead) {
    ctx.strokeStyle = "#ffe08066";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 30, 30, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Attack telegraph — subtle red glow, no ugly box
  if (e.state === "attack" && !e.dead) {
    const progress = e.attackTimer / 600;
    if (progress > 0.4) {
      // Red "!" warning above head
      const pulse = 0.6 + Math.sin(elapsed * 20) * 0.3;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = "#ff3333";
      ctx.font = `bold 14px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText("!", 0, -8);
      ctx.globalAlpha = 1;
    }
  }

  // Dazed — spinning stars above head
  if (e.dazed > 0 && !e.dead) {
    const t = elapsed * 6;
    for (let i = 0; i < 3; i++) {
      const angle = t + i * (Math.PI * 2 / 3);
      const sx = Math.cos(angle) * 14;
      const sy = Math.sin(angle) * 5 - 15;
      ctx.fillStyle = "#ffdd44";
      // 4-pointed star shape
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(t * 2 + i);
      ctx.fillRect(-3, -1, 6, 2);
      ctx.fillRect(-1, -3, 2, 6);
      ctx.restore();
    }
    // Dizzy swirl lines
    ctx.strokeStyle = "rgba(255,220,70,0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, -12, 16, t, t + Math.PI * 1.2);
    ctx.stroke();
  }

  ctx.restore();
}

// ═══ BACKGROUND ═══
function renderBackground(ctx, W, H, cx, g) {
  const groundY = g.groundY;
  const bgImg = getImage("bg_forest");

  if (bgImg) {
    // ── Image-based parallax background ──
    // Fill entire viewport — stretch width to cover, no black bars
    // Scale to fill: use the larger of width-fit or height-fit
    const scaleW = W / bgImg.width;
    const scaleH = H / bgImg.height;
    const bgScale = Math.max(scaleW, scaleH);
    const bgW = bgImg.width * bgScale;
    const bgH = bgImg.height * bgScale;
    // Slow parallax pan
    const panRange = Math.max(0, bgW - W);
    const maxCx = Math.max(1, g.levelW - W);
    const panX = panRange > 0 ? -(cx / maxCx) * panRange : 0;
    const panY = -(bgH - H) * 0.3; // slight vertical offset to show more sky

    ctx.drawImage(bgImg, panX, panY, bgW, bgH);

    // Subtle dark overlay for depth + so characters pop
    ctx.fillStyle = "rgba(5,8,15,0.2)";
    ctx.fillRect(0, 0, W, H);

    // Fog at ground level blending into platforms
    const fogGrad = ctx.createLinearGradient(0, groundY - 40, 0, groundY + 14);
    fogGrad.addColorStop(0, "rgba(8,12,18,0)");
    fogGrad.addColorStop(0.5, "rgba(8,12,18,0.6)");
    fogGrad.addColorStop(1, "rgba(6,8,12,0.95)");
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, groundY - 40, W, 54);

  } else {
    // ── Fallback: procedural background ──
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#05050e");
    sky.addColorStop(0.4, "#0a0a1e");
    sky.addColorStop(0.8, "#0e0a20");
    sky.addColorStop(1, "#0d0a18");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Stars
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 60; i++) {
      const sx = ((i * 137.5 + 50) % (W + 200)) - (cx * 0.02) % (W + 200);
      const sy = (i * 73.7 + 20) % (H * 0.4);
      const twinkle = Math.sin(g.time.elapsed * (1.5 + hash(i, 0) * 2) + i * 0.7);
      ctx.globalAlpha = 0.15 + twinkle * 0.15 + hash(i, 1) * 0.25;
      const ss = 0.6 + hash(i, 2) * 1.5;
      ctx.fillRect(sx, sy, ss, ss);
    }
    ctx.globalAlpha = 1;

    // Far buildings (parallax 0.1)
    const bx1 = -cx * 0.1;
    for (let i = 0; i < 18; i++) {
      const bw = 35 + ((i * 31) % 65);
      const bh = 50 + ((i * 47) % 130);
      const x = ((i * 97 + bx1) % (W + 300) + W + 300) % (W + 300) - 50;
      ctx.fillStyle = "#0c0c1a";
      ctx.fillRect(x, groundY - bh, bw, bh);
    }

    // Mid buildings (parallax 0.3)
    const bx2 = -cx * 0.3;
    for (let i = 0; i < 14; i++) {
      const bw = 28 + ((i * 43) % 55);
      const bh = 35 + ((i * 67) % 110);
      const x = ((i * 130 + 20 + bx2) % (W + 400) + W + 400) % (W + 400) - 100;
      ctx.fillStyle = "#10101e";
      ctx.fillRect(x, groundY - bh, bw, bh);
      ctx.fillStyle = "rgba(255,200,100,0.2)";
      for (let wy = groundY - bh + 22; wy < groundY - 8; wy += 14) {
        for (let wx = x + 5; wx < x + bw - 5; wx += 9) {
          if (hash(i * 100 + Math.floor(wx), Math.floor(wy)) > 0.4) ctx.fillRect(wx, wy, 4, 5);
        }
      }
    }
  }

  // Ground (shared by both)
  ctx.fillStyle = "#08080f";
  ctx.fillRect(0, groundY + 14, W, H - groundY);
  // Subtle ground-edge glow
  ctx.fillStyle = "rgba(40,80,60,0.12)";
  ctx.fillRect(0, groundY + 14, W, 2);
}

// ═══ DECORATIONS ═══
function renderDeco(ctx, d, groundY, elapsed) {
  if (d.type === "lantern") {
    const glow = 0.5 + Math.sin(elapsed * 3 + d.x * 0.1) * 0.2;
    ctx.fillStyle = `rgba(255,100,50,${glow * 0.15})`;
    ctx.beginPath();
    ctx.arc(d.x, groundY - 60, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255,100,50,${glow * 0.35})`;
    ctx.beginPath();
    ctx.arc(d.x, groundY - 60, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#c0282a";
    ctx.fillRect(d.x - 6, groundY - 70, 12, 18);
    ctx.fillStyle = "#dd4444";
    ctx.fillRect(d.x - 5, groundY - 69, 10, 2);
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
    ctx.fillStyle = "#aa2222";
    ctx.fillRect(d.x - 36, groundY - 100, 72, 2);
    ctx.fillStyle = "rgba(192,40,42,0.08)";
    ctx.fillRect(d.x - 40, groundY - 110, 80, 120);
  } else if (d.type === "sign") {
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(d.x - 18, groundY - 85, 36, 24);
    ctx.strokeStyle = "#2a2a3e";
    ctx.lineWidth = 1;
    ctx.strokeRect(d.x - 18, groundY - 85, 36, 24);
    const glow = 0.7 + Math.sin(elapsed * 4 + d.x) * 0.3;
    const kanji = ["酒", "茶", "刀", "忍"][Math.floor(hash(d.x, 0) * 4)];
    ctx.fillStyle = `rgba(155,142,207,${glow})`;
    ctx.font = "14px monospace";
    ctx.textAlign = "center";
    ctx.fillText(kanji, d.x, groundY - 68);
  }
}

// ═══ HUD ═══
function renderHUD(ctx, g, W, isDesktop, font) {
  ctx.font = `bold 16px ${font}`;
  ctx.textAlign = "left";
  ctx.fillStyle = "#c0282a";
  ctx.fillText(`SCORE: ${String(g.score).padStart(5, "0")}`, 16, 30);

  if (g.combo > 1) {
    const comboScale = Math.min(1.4, 1 + (g.comboTimer / 2000) * 0.4);
    ctx.save();
    ctx.translate(16, 56);
    ctx.scale(comboScale, comboScale);
    ctx.font = `bold 20px ${font}`;
    ctx.fillStyle = "#ffa040";
    ctx.fillText(`x${g.combo} COMBO`, 0, 0);
    ctx.restore();
  }

  const mW = 100, mH = 8, mX = W - mW - 16, mY = 20;
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(mX, mY, mW, mH);
  const fill = g.slowMo.meter / g.slowMo.max;
  ctx.fillStyle = g.slowMo.active ? "#b8a0ff" : "#6e3080";
  ctx.fillRect(mX, mY, mW * fill, mH);
  if (g.slowMo.active) {
    ctx.fillRect(mX, mY, mW * fill, mH);
  }
  ctx.strokeStyle = "#3a3a5a";
  ctx.lineWidth = 1;
  ctx.strokeRect(mX, mY, mW, mH);
  ctx.font = `9px ${font}`;
  ctx.fillStyle = "#9b8ecf";
  ctx.textAlign = "right";
  ctx.fillText("FOCUS", mX - 6, mY + 8);

  const p = g.player;
  if (p.dashCooldown > 0) {
    const dFill = 1 - p.dashCooldown / DASH_COOLDOWN;
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(mX, mY + 14, mW, 4);
    ctx.fillStyle = "#c0282a55";
    ctx.fillRect(mX, mY + 14, mW * dFill, 4);
  } else {
    ctx.font = `8px ${font}`;
    ctx.fillStyle = "#c0282a88";
    ctx.textAlign = "right";
    ctx.fillText("DASH READY", W - 16, mY + 24);
  }

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
