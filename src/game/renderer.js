import { TILE, SCALE, DASH_COOLDOWN, TOTAL_ROOMS, JUMP_FORCE, hash } from "./constants.js";
import { getSprite, getMascotImage, getImage } from "./sprites.js";

const DRAW_SIZE = TILE * SCALE; // 60px — physics size (for positioning)
const SPRITE_SCALE = 1.35; // visual scale multiplier — makes character bigger without affecting physics

// ═══ MAIN RENDER ═══
export function render(g, ctx, isDesktop, font) {
  const { W, H, camera: cam } = g;
  // Round camera position to prevent subpixel jitter on all world objects
  const cx = Math.round(cam.x + cam.shakeX);
  const cy = Math.round(cam.y + cam.shakeY);

  ctx.fillStyle = "#0a0a14";
  ctx.fillRect(0, 0, W, H);

  // Apply camera zoom (centered on viewport)
  const zoom = cam.zoom || 1;
  if (zoom !== 1) {
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-W / 2, -H / 2);
  }

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
    } else if (em.type === "rain") {
      // Rain streak — bright diagonal line, more visible
      ctx.globalAlpha = lifeAlpha * 0.6;
      ctx.strokeStyle = em.color;
      ctx.lineWidth = em.size * 0.6;
      ctx.beginPath();
      ctx.moveTo(sx, em.y);
      ctx.lineTo(sx + 3, em.y - em.size * 16);
      ctx.stroke();
      // Subtle glow around rain
      ctx.globalAlpha = lifeAlpha * 0.15;
      ctx.lineWidth = em.size * 2;
      ctx.beginPath();
      ctx.moveTo(sx, em.y);
      ctx.lineTo(sx + 3, em.y - em.size * 16);
      ctx.stroke();
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

  // Platforms + walls
  for (const plat of g.platforms) {
    if (plat.x + (plat.w || 0) < cx - 50 || plat.x > cx + W + 50) continue;
    const hasBg = !!getImage("bg_forest");
    const accent = hasBg ? "#3a8a5a" : "#c0282a";

    if (plat.wall) {
      // Solid climbable wall — stone/brick texture
      const h = plat.h || 100;
      const w = plat.w;
      const wx = plat.x;
      const wy = plat.y;

      // Base fill — dark stone
      const wallGrad = ctx.createLinearGradient(wx, wy, wx + w, wy);
      wallGrad.addColorStop(0, hasBg ? "#141e18" : "#16162a");
      wallGrad.addColorStop(0.5, hasBg ? "#1a2820" : "#1c1c34");
      wallGrad.addColorStop(1, hasBg ? "#141e18" : "#16162a");
      ctx.fillStyle = wallGrad;
      ctx.fillRect(wx, wy, w, h);

      // Brick/stone rows
      const brickH = 16;
      for (let row = 0; row < Math.ceil(h / brickH); row++) {
        const by = wy + row * brickH;
        if (by > wy + h) break;
        const bh = Math.min(brickH, wy + h - by);
        // Offset every other row for brick pattern
        const offset = row % 2 === 0 ? 0 : w * 0.4;
        // Mortar line (horizontal)
        ctx.fillStyle = hasBg ? "#0a120e" : "#0e0e1a";
        ctx.fillRect(wx, by, w, 1);
        // Brick color variation per row using deterministic hash
        const rowHash = hash(wx + row * 7, wy + row * 13);
        const brightness = 0.7 + rowHash * 0.3;
        const r = Math.floor((hasBg ? 20 : 22) * brightness);
        const g = Math.floor((hasBg ? 32 : 22) * brightness);
        const b = Math.floor((hasBg ? 26 : 40) * brightness);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(wx + 1, by + 1, w - 2, bh - 1);
        // Vertical mortar line in each brick row
        const mx = wx + offset;
        if (mx > wx && mx < wx + w) {
          ctx.fillStyle = hasBg ? "#0a120e" : "#0e0e1a";
          ctx.fillRect(mx, by, 1, bh);
        }
      }

      // Edge highlights — mossy green accent on edges
      ctx.fillStyle = accent + "55";
      ctx.fillRect(wx, wy, 2, h);           // left edge
      ctx.fillRect(wx + w - 2, wy, 2, h);   // right edge
      ctx.fillStyle = accent + "88";
      ctx.fillRect(wx, wy, w, 2);           // top cap
      // Inner edge shadow
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(wx + 2, wy + 2, 1, h - 2);
      ctx.fillRect(wx + w - 3, wy + 2, 1, h - 2);
    } else {
      // Standard thin platform
      const grad = ctx.createLinearGradient(plat.x, plat.y, plat.x, plat.y + 14);
      grad.addColorStop(0, hasBg ? "#1a2a20" : "#1e1e30");
      grad.addColorStop(1, hasBg ? "#0e1a14" : "#12121e");
      ctx.fillStyle = grad;
      ctx.fillRect(plat.x, plat.y, plat.w, 14);
      ctx.fillStyle = accent;
      ctx.fillRect(plat.x, plat.y, plat.w, 1);
      ctx.fillStyle = accent + "55";
      ctx.fillRect(plat.x, plat.y + 1, plat.w, 1);
      ctx.fillStyle = accent + "22";
      ctx.fillRect(plat.x, plat.y, 1, 14);
      ctx.fillRect(plat.x + plat.w - 1, plat.y, 1, 14);
    }
  }

  // ── Shadow zones ──
  if (g.shadows) {
    for (const s of g.shadows) {
      // Dark overlay on platform
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(s.x, s.y - 50, s.w, 64);
      // Soft edges
      const edgeW = 15;
      const leftGrad = ctx.createLinearGradient(s.x - edgeW, 0, s.x, 0);
      leftGrad.addColorStop(0, "rgba(0,0,0,0)");
      leftGrad.addColorStop(1, "rgba(0,0,0,0.4)");
      ctx.fillStyle = leftGrad;
      ctx.fillRect(s.x - edgeW, s.y - 50, edgeW, 64);
      const rightGrad = ctx.createLinearGradient(s.x + s.w, 0, s.x + s.w + edgeW, 0);
      rightGrad.addColorStop(0, "rgba(0,0,0,0.4)");
      rightGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = rightGrad;
      ctx.fillRect(s.x + s.w, s.y - 50, edgeW, 64);
    }
  }

  // ── Enemies ──
  for (const e of g.enemies) {
    if (e.x < cx - 100 || e.x > cx + W + 100) continue;
    if (e.dead) {
      // Get the correct death sprite directly
      const map = ENEMY_SPRITE_MAP[e.type];
      const _drawDeathSprite = (spriteEntry) => {
        const key = spriteEntry?.key || map?.fallback;
        const img = key ? getImage(key) : null;
        if (!img) return;
        const facesR = spriteEntry?.R || false;
        if (facesR ? (e.facing < 0) : (e.facing > 0)) ctx.scale(-1, 1);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, EC.x, EC.y, EC.w, EC.h, -DRAW_W / 2, -DRAW_H + FOOT_NUDGE, DRAW_W, DRAW_H);
      };

      if (e.deathStyle === "knockback") {
        // ── Knockback: sliding along ground in random pose ──
        ctx.globalAlpha = Math.max(0.15, Math.min(1, e.deathTimer / 1200));
        ctx.save();
        ctx.translate(e.x, e.y + TILE * SCALE);

        const kbPose = e._kbPose || "kb_back";
        const kbSprite = map?.[kbPose] || map?.hit || map?.idle;
        const kbDir = e._kbDir || 1;

        // Flip: back/tumble sprites show body knocked to LEFT by default
        // Seated sprite faces LEFT (looking left). Different flip logic per pose:
        if (kbPose === "kb_seated") {
          // Seated: face toward the player who hit them
          if (kbDir < 0) ctx.scale(-1, 1);
        } else {
          // Back/tumble: body flies in knockback direction
          if (kbDir > 0) ctx.scale(-1, 1);
        }

        // Draw lower than standing sprites — lying-down bodies sit ON the ground
        // Extra nudge pushes sprite down so it looks like it's on the platform surface
        const groundNudge = kbPose === "kb_seated" ? 8 : 20;

        ctx.imageSmoothingEnabled = false;
        const key = kbSprite?.key || map?.fallback;
        const img = key ? getImage(key) : null;
        if (img) {
          ctx.drawImage(img, EC.x, EC.y, EC.w, EC.h, -DRAW_W / 2, -DRAW_H + FOOT_NUDGE + groundNudge, DRAW_W, DRAW_H);
        }

        ctx.restore();
        ctx.globalAlpha = 1;
        continue;
      }

      if (e.deathStyle === "cinematic") {
        // ── Cinematic: shock → kneel → face plant ──
        ctx.save();
        ctx.translate(e.x, e.y + TILE * SCALE);
        if (e.deathPhase === 0) {
          // Brief white flash fading out + hit sprite
          const flashAlpha = Math.max(0, (e.deathTimer - 1000) / 200); // fades in first 200ms
          if (flashAlpha > 0) {
            ctx.globalAlpha = flashAlpha * 0.7;
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(0, -DRAW_H * 0.5, 35, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
          _drawDeathSprite(map?.hit || map?.idle);
        } else if (e.deathPhase === 1) {
          // Kneeling sprite
          ctx.globalAlpha = 0.9;
          _drawDeathSprite(map?.kneel || map?.hit);
        } else {
          // Face-down dead sprite
          ctx.globalAlpha = Math.max(0.3, e.deathTimer / 400);
          _drawDeathSprite(map?.dead || map?.kneel);
        }
        ctx.restore();
        ctx.globalAlpha = 1;
        continue;
      }

      // Default fade
      ctx.globalAlpha = Math.max(0, e.deathTimer / 500);
    }
    drawEnemy(ctx, e, g.time.elapsed, font);
    ctx.globalAlpha = 1;
  }

  // Projectiles with glowing trails
  for (const proj of g.projectiles) {
    // Enhanced trail: glowing streak instead of squares
    if (proj.trail && proj.trail.length > 1) {
      ctx.lineCap = "round";
      for (let i = 1; i < proj.trail.length; i++) {
        const t0 = proj.trail[i - 1];
        const t1 = proj.trail[i];
        const p = i / proj.trail.length;
        // Outer glow
        ctx.globalAlpha = p * 0.2;
        ctx.strokeStyle = "#6644aa";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(t0.x, t0.y);
        ctx.lineTo(t1.x, t1.y);
        ctx.stroke();
        // Core streak
        ctx.globalAlpha = p * 0.6;
        ctx.strokeStyle = "#aa88dd";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(t0.x, t0.y);
        ctx.lineTo(t1.x, t1.y);
        ctx.stroke();
      }
      ctx.lineCap = "butt";
      ctx.globalAlpha = 1;
    }
    ctx.save();
    ctx.translate(proj.x, proj.y);
    // Glow aura around shuriken
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#6644aa";
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // Shuriken sprite with spin
    ctx.rotate(proj.rotation);
    const sprFrame = Math.floor(g.time.elapsed * 8) % 2 === 0 ? "shuriken" : "shuriken2";
    const spr = getSprite(sprFrame);
    if (spr) ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
    // Bright flash at 4 points as it spins (light catching edges)
    for (let i = 0; i < 4; i++) {
      const flashAngle = (proj.rotation || 0) + i * Math.PI / 2;
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(Math.cos(flashAngle) * 6, Math.sin(flashAngle) * 6, 1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Player afterimages (dash trail)
  const mascot = getMascotImage();
  if (mascot) {
    const ic = CROPS.idle;
    for (const ai of g.player.afterimages) {
      ctx.globalAlpha = (ai.life / 200) * 0.3;
      const aspect = ic.w / ic.h;
      const dw = DRAW_SIZE * aspect * 0.95;
      const dh = DRAW_SIZE * 0.95;
      ctx.save();
      ctx.translate(ai.x, ai.y + TILE * SCALE);
      if (ai.facing > 0) ctx.scale(-1, 1);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(mascot, ic.x, ic.y, ic.w, ic.h, -dw / 2, -dh, dw, dh);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  // ── Player (actual mascot PNG with transforms) ──
  if (mascot) {
    drawPlayer(ctx, g.player, mascot, g.time.elapsed);
  }

  // ── Slash blade trails — long, elegant, deadly ──
  ctx.globalCompositeOperation = "lighter";
  for (const s of g.slashEffects) {
    const progress = 1 - s.timer / s.maxTimer;
    const combo = s.combo || 1;
    const isThird = combo === 3;
    const dir = s.facing;

    const sweepProg = Math.min(1, progress * 3.5);
    const fadeProg = progress > 0.25 ? (progress - 0.25) / 0.75 : 0;
    const alpha = (1 - Math.pow(fadeProg, 0.4)) * (progress < 0.02 ? progress / 0.02 : 1);

    // LONG reach — sword trails that extend far past the enemy
    const reach = combo === 1 ? 200 : combo === 2 ? 240 : 320;
    // Thin blade width — elegant, not chunky
    const bladeW = combo === 1 ? 22 : combo === 2 ? 28 : 35;
    const swingAngle = combo === 1 ? -0.25 : combo === 2 ? 0.35 : -0.1;

    ctx.save();
    ctx.translate(s.x, s.y);

    const curReach = reach * sweepProg;
    const curW = bladeW * Math.min(1, sweepProg * 3);
    const tipX = dir * curReach;
    const tipY = swingAngle * curReach;

    // ── Layer 1: Wide outer glow (soft bloom) ──
    ctx.globalAlpha = alpha * 0.12;
    ctx.fillStyle = isThird ? "#2060cc" : combo === 2 ? "#cc8833" : "#8899cc";
    ctx.beginPath();
    ctx.moveTo(0, -curW * 1.5);
    ctx.quadraticCurveTo(dir * curReach * 0.5, tipY - curW * 1.2, tipX, tipY);
    ctx.quadraticCurveTo(dir * curReach * 0.5, tipY + curW * 1.2, 0, curW * 1.5);
    ctx.closePath();
    ctx.fill();

    // ── Layer 2: Mid blade shape ──
    ctx.globalAlpha = alpha * 0.35;
    ctx.fillStyle = isThird ? "#3090ee" : combo === 2 ? "#ffaa44" : "#bbccee";
    ctx.beginPath();
    ctx.moveTo(0, -curW * 0.7);
    ctx.quadraticCurveTo(dir * curReach * 0.5, tipY - curW * 0.5, tipX, tipY);
    ctx.quadraticCurveTo(dir * curReach * 0.5, tipY + curW * 0.5, 0, curW * 0.7);
    ctx.closePath();
    ctx.fill();

    // ── Layer 3: Bright core line — sharp, thin, white-hot ──
    ctx.globalAlpha = alpha * 0.9;
    ctx.strokeStyle = isThird ? "#80ddff" : combo === 2 ? "#ffeebb" : "#ffffff";
    ctx.lineWidth = isThird ? 3 : 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(dir * 5, 0);
    ctx.quadraticCurveTo(dir * curReach * 0.5, tipY * 0.7, tipX, tipY);
    ctx.stroke();

    // ── Bright tip flare ──
    if (sweepProg > 0.1 && sweepProg < 0.95) {
      ctx.globalAlpha = alpha * 0.8;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(tipX, tipY, isThird ? 4 : 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = alpha * 0.3;
      ctx.fillStyle = isThird ? "#40aaff" : "#ccddff";
      ctx.beginPath();
      ctx.arc(tipX, tipY, isThird ? 12 : 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── 3rd combo: ELECTRIC LIGHTNING along the blade ──
    if (isThird) {
      // Crackling bolts along the blade path
      for (let bolt = 0; bolt < 4; bolt++) {
        ctx.globalAlpha = alpha * (0.3 + Math.random() * 0.5);
        ctx.strokeStyle = bolt % 2 === 0 ? "#40aaff" : "#ffffff";
        ctx.lineWidth = 1 + Math.random();
        ctx.beginPath();
        let bx = dir * 10, by = 0;
        ctx.moveTo(bx, by);
        const segments = 6 + Math.floor(Math.random() * 4);
        for (let seg = 0; seg < segments; seg++) {
          const t = (seg + 1) / segments;
          bx = dir * curReach * t;
          by = tipY * t + (Math.random() - 0.5) * 30;
          ctx.lineTo(bx, by);
        }
        ctx.stroke();
      }
      // Electric sparks scattered along blade
      for (let i = 0; i < 8; i++) {
        const t = Math.random();
        const sx = dir * curReach * t;
        const sy = tipY * t + (Math.random() - 0.5) * 20;
        ctx.globalAlpha = alpha * (0.5 + Math.random() * 0.5);
        ctx.fillStyle = i % 3 === 0 ? "#ffffff" : "#60ccff";
        const ss = 1 + Math.random() * 2;
        ctx.fillRect(sx - ss, sy, ss * 2, 1);
        ctx.fillRect(sx, sy - ss, 1, ss * 2);
      }
      // Shockwave rings
      if (progress > 0.15) {
        const ringProg = (progress - 0.15) / 0.85;
        const ringR = 50 + ringProg * 180;
        ctx.globalAlpha = (1 - ringProg) * 0.25;
        ctx.strokeStyle = "#40aaff";
        ctx.lineWidth = 3 - ringProg * 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, ringR, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.lineCap = "butt";
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  ctx.globalCompositeOperation = "source-over";

  // Blood stains — larger organic puddle shapes
  for (const part of g.particles) {
    if (!part.isStain) continue;
    const stainAlpha = Math.min(0.7, part.life / part.maxLife);
    ctx.globalAlpha = stainAlpha;
    ctx.fillStyle = part.color;
    // Draw as ellipse for organic splatter look
    ctx.beginPath();
    ctx.ellipse(part.x, part.y + 1, part.size, part.size * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
    // Darker core
    ctx.globalAlpha = stainAlpha * 0.5;
    ctx.fillStyle = "#220000";
    ctx.beginPath();
    ctx.ellipse(part.x, part.y + 1, part.size * 0.5, part.size * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Regular particles (normal blend)
  for (const part of g.particles) {
    if (part.isStain || part.glow || part.isRipple) continue;
    ctx.globalAlpha = part.life / part.maxLife;
    ctx.fillStyle = part.color;
    if (part.isLine) {
      ctx.fillRect(part.x, part.y, part.size * 6, part.size);
    } else {
      ctx.fillRect(part.x - part.size / 2, part.y - part.size / 2, part.size, part.size);
    }
  }
  // Glow particles (additive blending — makes white flashes actually glow)
  ctx.globalCompositeOperation = "lighter";
  for (const part of g.particles) {
    if (!part.glow) continue;
    ctx.globalAlpha = part.life / part.maxLife;
    ctx.fillStyle = part.color;
    ctx.beginPath();
    ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
    ctx.fill();
    // Outer glow
    ctx.globalAlpha = (part.life / part.maxLife) * 0.3;
    ctx.beginPath();
    ctx.arc(part.x, part.y, part.size * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
  // Impact ripple rings
  for (const part of g.particles) {
    if (!part.isRipple) continue;
    const rippleProg = 1 - part.life / part.maxLife;
    const rippleR = 10 + rippleProg * 60;
    ctx.globalAlpha = (1 - rippleProg) * 0.5;
    ctx.strokeStyle = part.color;
    ctx.lineWidth = 2 - rippleProg * 1.5;
    ctx.beginPath();
    ctx.arc(part.x, part.y, rippleR, 0, Math.PI * 2);
    ctx.stroke();
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

  // End zoom transform (before HUD — HUD stays unzoomed)
  if (zoom !== 1) ctx.restore();

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

  // ── Letterbox bars (room clear cinematic) ──
  if (g.letterbox > 0) {
    const barH = Math.round(40 * g.letterbox);
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, W, barH);
    ctx.fillRect(0, H - barH, W, barH);
  }

  // ── Fade overlay (room transitions) ──
  if (g.fadeOverlay > 0) {
    ctx.fillStyle = `rgba(0,0,0,${g.fadeOverlay})`;
    ctx.fillRect(0, 0, W, H);
  }

  // ── Death flash (red tint) ──
  if (g.deathFlash > 0) {
    ctx.fillStyle = `rgba(200,20,20,${(g.deathFlash / 300) * 0.3})`;
    ctx.fillRect(0, 0, W, H);
  }

  // ── Room title ("ROOM X") ──
  if (g.roomTitle && g.roomTitle.timer > 0) {
    const t = g.roomTitle.timer;
    const maxT = 1200;
    // Slide in from left (first 300ms), hold, slide out right (last 300ms)
    let xOff = 0;
    let alpha = 1;
    if (t > maxT - 300) {
      // Sliding in
      const p = (t - (maxT - 300)) / 300;
      xOff = -W * 0.3 * p;
      alpha = 1 - p;
    } else if (t < 300) {
      // Sliding out
      const p = 1 - t / 300;
      xOff = W * 0.3 * p;
      alpha = 1 - p;
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `bold 28px ${font}`;
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(g.roomTitle.text, W / 2 + xOff, H * 0.35);
    ctx.font = `12px ${font}`;
    ctx.fillStyle = "#aaaacc";
    ctx.fillText("CLEAR ALL ENEMIES", W / 2 + xOff, H * 0.35 + 24);
    ctx.restore();
  }

  // Fog is now rendered as parallax mist layers inside renderBackground

  renderHUD(ctx, g, W, isDesktop, font);
}

// ═══════════════════════════════════════════
// ═══ DRAW PLAYER — actual mascot PNG ═══
// ═══════════════════════════════════════════
// The mascot PNG is 1024x1024 but the character only occupies the center.
// Source crop removes empty padding (character spans ~rows 6-24 in a 32-cell grid).
// Crop rects for player images (remove gray/transparent padding)
// Crop rects per sprite — fitted to actual character bounds
// R = faces right (AI-generated sprites), L = faces left (original mascot)
// Idle faces LEFT, all AI-generated action sprites face RIGHT
// R flag measured by pixel-weight analysis (not guessing).
// R:false = faces LEFT, R:true = faces RIGHT.
const F = { x: 20, y: 20, w: 984, h: 984 }; // full frame crop (gray bg removed on load)
const CROPS = {
  idle:      { ...F, R: false },
  run1:      { ...F, R: false },
  run2:      { ...F, R: false },
  run3:      { ...F, R: false },
  run4:      { ...F, R: false },
  slash1:    { ...F, R: false },
  slash2:    { ...F, R: false },
  slash3:    { ...F, R: false },
  slash4:    { x: 80, y: 100, w: 860, h: 800, R: true },
  jump1:     { ...F, R: false },
  jump2:     { ...F, R: true },
  fall:      { ...F, R: true },
  wallslide:     { ...F, R: true },
  wall_cling:    { ...F, R: false },  // faces left (clinging to right wall)
  dash:          { ...F, R: false },
  death1:        { ...F, R: false },
  death2:        { ...F, R: false },
  parry:         { ...F, R: false },
  land_heavy:    { ...F, R: false },
  slash_through: { ...F, R: true },   // faces right (dashing through enemy)
};

// Helper: draw a sprite image with crop and flip
// Per-sprite direction: R=true faces right (flip when facing left), R=false faces left (flip when facing right)
// All sprites draw at IDENTICAL size so character never grows/shrinks.
const DRAW_W = DRAW_SIZE * SPRITE_SCALE * (CROPS.idle.w / CROPS.idle.h); // ~109px visual width
const DRAW_H = DRAW_SIZE * SPRITE_SCALE; // ~81px visual height
const FOOT_NUDGE = 16; // push sprites down to compensate for empty space in generous crops
function drawSpriteFrame(ctx, img, cropKey, s, facing) {
  if (!img) return false;
  const crop = CROPS[cropKey];
  if (!crop) return false;
  if (crop.R ? (facing < 0) : (facing > 0)) ctx.scale(-1, 1);
  ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, -DRAW_W / 2, -DRAW_H + FOOT_NUDGE, DRAW_W, DRAW_H);
  return true;
}

function drawPlayer(ctx, p, mascot, elapsed) {
  const s = DRAW_SIZE;
  const isSlashing = p.state.startsWith("slash");

  ctx.save();
  ctx.translate(p.x, p.y + TILE * SCALE); // anchor at physics feet position
  // Squash/stretch
  if (p.scaleX !== undefined && (p.scaleX !== 1 || p.scaleY !== 1)) {
    ctx.scale(p.scaleX, p.scaleY);
  }

  if (p.invincible > 0 && Math.floor(p.invincible / 50) % 2 === 0) ctx.globalAlpha = 0.4;
  if (p.inShadow) ctx.globalAlpha = 0.35;
  ctx.imageSmoothingEnabled = false;

  // ── Pick the right sprite for the current state ──
  // Dead check FIRST — overrides all other states
  if (p.dead) {
    const key = (p.deathTimer || 0) > 200 ? "death1" : "death2";
    const img = getImage(key);
    if (drawSpriteFrame(ctx, img, key, s, p.facing)) { ctx.restore(); return; }
  }

  if (p.state === "run") {
    const frameIndex = (Math.floor(elapsed * 8) % 4) + 1;
    const img = getImage("run" + frameIndex);
    if (drawSpriteFrame(ctx, img, "run" + frameIndex, s, p.facing)) { ctx.restore(); return; }
  }

  if (p.state === "jump") {
    const key = p.vy < JUMP_FORCE * 0.5 ? "jump1" : "jump2";
    const img = getImage(key);
    if (drawSpriteFrame(ctx, img, key, s, p.facing)) { ctx.restore(); return; }
  }

  if (p.state === "fall") {
    const img = getImage("fall");
    if (drawSpriteFrame(ctx, img, "fall", s, p.facing)) { ctx.restore(); return; }
  }

  if (p.wallSliding) {
    // Prefer wall-cling sprite, fallback to wallslide
    const img = getImage("wall_cling") || getImage("wallslide");
    if (img) {
      const crop = CROPS.wallslide; // same crop works for both
      const wallFacing = -p.wallDir;
      if (crop.R ? (wallFacing < 0) : (wallFacing > 0)) ctx.scale(-1, 1);
      ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, -DRAW_W / 2, -DRAW_H + FOOT_NUDGE, DRAW_W, DRAW_H);
      ctx.restore();
      return;
    }
  }

  if (p.state === "dash") {
    const img = getImage("dash");
    if (drawSpriteFrame(ctx, img, "dash", s, p.facing)) { ctx.restore(); return; }
  }

  // ── Idle — use mascot with breathing ──
  if (p.state === "idle" && !isSlashing) {
    if (drawSpriteFrame(ctx, mascot, "idle", s, p.facing)) { ctx.restore(); return; }
  }

  if (isSlashing) {
    const combo = p.slashCombo;
    const isThird = combo === 3;

    // Pick sprite frame based on combo level + phase
    let slashImgKey;
    if (combo === 1) {
      slashImgKey = "slash1"; // horizontal cut — all phases
    } else if (combo === 2) {
      slashImgKey = p.state === "slash1" ? "slash1" : "slash2"; // wind-up → upward arc
    } else {
      // 3rd combo: spin wind-up → slash-through finisher (or slash4 fallback)
      if (p.state === "slash1") {
        slashImgKey = "slash3";
      } else {
        slashImgKey = getImage("slash_through") ? "slash_through" : "slash4";
      }
    }

    const slashImg = getImage(slashImgKey);
    if (slashImg) {
      // Per-frame flip using the slash crop's R flag
      const sc = CROPS[slashImgKey] || CROPS.slash1;
      if (sc.R ? (p.facing < 0) : (p.facing > 0)) ctx.scale(-1, 1);

      const sdw = DRAW_W * 1.05;
      const sdh = DRAW_H * 1.05;

      ctx.drawImage(slashImg, sc.x, sc.y, sc.w, sc.h, -sdw / 2, -sdh, sdw, sdh);

      // Blue lightning sparks — visible for entire 3rd combo attack
      if (isThird && slashImgKey === "slash4") {
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
      // Fallback if slash images not loaded — draw idle mascot
      drawSpriteFrame(ctx, mascot, "idle", s, p.facing);
    }
  } else {
    // Fallback for any unhandled state — draw idle mascot
    drawSpriteFrame(ctx, mascot, "idle", s, p.facing);
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
// ═══ ENEMY SPRITE SYSTEM ═══
// Each enemy type has per-state sprites with facing direction (R = faces right).
// All use full-frame crops with gray bg removed on load.
const EC = { x: 20, y: 20, w: 984, h: 984 }; // default full crop

// State → sprite key mapping per enemy type
// R: false = faces left, R: true = faces right
const ENEMY_SPRITE_MAP = {
  oni: {
    idle:    { key: "oni_idle", R: false },
    patrol:  { frames: ["oni_walk1", "oni_walk2"], R: false },
    chase:   { frames: ["oni_walk1", "oni_walk2"], R: false },
    alert:   { key: "oni_alert", R: false },
    attack_windup: { key: "oni_windup", R: false },
    attack_strike: { key: "oni_attack", R: false },
    dazed:   { key: "oni_dazed", R: false },
    cooldown:{ key: "oni_idle", R: false },
    // Death
    kneel:   { key: "oni_kneel", R: false },
    dead:    { key: "oni_dead", R: false },
    hit:     { key: "oni_hit", R: false },
    // Knockback variants (randomly assigned on kill)
    kb_back:   { key: "oni_kb_back", R: false },
    kb_tumble: { key: "oni_kb_tumble", R: false },
    kb_seated: { key: "oni_kb_seated", R: false },
    fallback: "oni",
  },
  ninja: {
    idle:    { key: "ninja_idle", R: false },
    patrol:  { frames: ["ninja_walk1", "ninja_walk2"], R: false },
    chase:   { key: "ninja_idle", R: false },
    alert:   { key: "ninja_alert", R: false },
    throw:   { key: "ninja_throw", R: false },
    retreat: { key: "ninja_retreat", R: false },
    dazed:   { key: "ninja_dazed", R: false },
    cooldown:{ key: "ninja_idle", R: false },
    kneel:   { key: "ninja_kneel", R: false },
    dead:    { key: "ninja_dead", R: false },
    hit:     { key: "ninja_hit", R: false },
    kb_back:   { key: "ninja_kb_back", R: false },
    kb_tumble: { key: "ninja_kb_tumble", R: false },
    kb_seated: { key: "ninja_kb_seated", R: false },
    fallback: "ninja",
  },
  samurai: {
    idle:    { key: "samurai_kneel", R: false }, // use kneel as temp idle
    patrol:  { key: "samurai_kneel", R: false },
    chase:   { key: "samurai_kneel", R: false },
    dazed:   { key: "samurai_kneel", R: false },
    cooldown:{ key: "samurai_kneel", R: false },
    kneel:   { key: "samurai_kneel", R: false },
    dead:    { key: "samurai_dead", R: false },
    fallback: null, // no single sprite fallback
  },
};

function _getEnemySpriteForState(e, elapsed) {
  const map = ENEMY_SPRITE_MAP[e.type];
  if (!map) return null;

  // Death states
  if (e.dead) {
    if (e.deathStyle === "cinematic") {
      if (e.deathPhase >= 2) return map.dead;
      if (e.deathPhase >= 1) return map.kneel;
      return map.hit || map.idle;
    }
    if (e.deathStyle === "knockback") return map.hit || map.idle;
    return map.dead || map.idle;
  }

  // Attack states (oni/samurai have windup→strike, ninja has throw)
  if (e.state === "attack") {
    if (e.type === "ninja" && e.throwAnim > 0) return map.throw || map.idle;
    const progress = e.attackTimer / (e.type === "samurai" ? 700 : 600);
    if (progress > 0.3) return map.attack_windup || map.alert || map.idle;
    return map.attack_strike || map.alert || map.idle;
  }

  // Ninja retreat
  if (e.type === "ninja" && e.vx !== 0 && e.state === "chase") {
    const toPlayer = e.facing;
    const movingAway = (e.vx > 0 && toPlayer < 0) || (e.vx < 0 && toPlayer > 0);
    if (movingAway && map.retreat) return map.retreat;
  }

  // Walk cycle for patrol/chase
  const stateEntry = map[e.state];
  if (stateEntry && stateEntry.frames) {
    const frameIdx = Math.floor(elapsed * 4) % stateEntry.frames.length;
    return { key: stateEntry.frames[frameIdx], R: stateEntry.R };
  }

  return stateEntry || map.idle;
}

function drawEnemyFromImage(ctx, e, elapsed) {
  const spriteInfo = _getEnemySpriteForState(e, elapsed);
  const map = ENEMY_SPRITE_MAP[e.type];

  // Try state-specific sprite first
  let img = spriteInfo ? getImage(spriteInfo.key) : null;
  let facesRight = spriteInfo ? spriteInfo.R : false;

  // Fallback to single sprite
  if (!img && map?.fallback) {
    img = getImage(map.fallback);
    facesRight = false;
  }
  if (!img) return false;

  ctx.save();
  ctx.translate(Math.round(e.x), Math.round(e.y + TILE * SCALE));

  // Flip: sprite faces left (R=false) → flip when enemy faces right (facing > 0)
  //       sprite faces right (R=true) → flip when enemy faces left (facing < 0)
  if (facesRight ? (e.facing < 0) : (e.facing > 0)) ctx.scale(-1, 1);

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, EC.x, EC.y, EC.w, EC.h,
    -DRAW_W / 2, -DRAW_H + FOOT_NUDGE, DRAW_W, DRAW_H);

  // ── VFX overlays (attack arcs, shield glow — drawn on top of sprites) ──
  if (e.state === "attack" && !e.dead) {
    if (e.type === "oni") {
      const progress = e.attackTimer / 600;
      // Red strike arc on impact
      if (progress < 0.3) {
        const sp = 1 - progress / 0.3;
        ctx.globalAlpha = (1 - sp) * 0.6;
        ctx.strokeStyle = "#ff4422";
        ctx.lineWidth = 8;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(0, -DRAW_H * 0.4, 35, -2.0, -2.0 + sp * 3.5);
        ctx.stroke();
        ctx.lineCap = "butt";
        ctx.globalAlpha = 1;
      }
      // Danger telegraph
      if (progress > 0.5) {
        ctx.globalAlpha = (progress - 0.5) * 0.3;
        ctx.fillStyle = "#ff3333";
        ctx.fillRect(-35, -2, 70, 4);
        ctx.globalAlpha = 1;
      }
    }
    if (e.type === "samurai") {
      const ap = e.attackTimer / 700;
      if (ap < 0.3) {
        const sp = 1 - ap / 0.3;
        ctx.globalAlpha = (1 - sp) * 0.5;
        ctx.strokeStyle = "#cc3322";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(0, -DRAW_H * 0.4, 35, -1.5, -1.5 + sp * 3);
        ctx.stroke();
        ctx.lineCap = "butt";
        ctx.globalAlpha = 1;
      }
    }
  }
  if (e.type === "samurai" && e.blocking && !e.dead) {
    const pulse = 0.5 + Math.sin(elapsed * 10) * 0.3;
    ctx.globalAlpha = pulse * 0.4;
    ctx.strokeStyle = "#88bbff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -DRAW_H * 0.4, 25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
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
  const t = g.time.elapsed;

  if (bgImg) {
    // ── Image-based parallax background ──
    const scaleW = W / bgImg.width;
    const scaleH = H / bgImg.height;
    const bgScale = Math.max(scaleW, scaleH);
    const bgW = bgImg.width * bgScale;
    const bgH = bgImg.height * bgScale;
    const panRange = Math.max(0, bgW - W);
    const maxCx = Math.max(1, g.levelW - W);
    const panX = panRange > 0 ? -(cx / maxCx) * panRange : 0;
    const panY = -(bgH - H) * 0.3;

    ctx.drawImage(bgImg, panX, panY, bgW, bgH);

    // Dark overlay for depth
    ctx.fillStyle = "rgba(5,8,15,0.2)";
    ctx.fillRect(0, 0, W, H);

    // ── Wind gusts — periodic sideways push affecting rain angle ──
    // Store wind state on game object for rain particles to access
    const windCycle = Math.sin(t * 0.3) * Math.sin(t * 0.7 + 1.3);
    g._wind = windCycle > 0.4 ? (windCycle - 0.4) * 80 : 0; // 0 to ~48px/s sideways

    // ── Parallax mist layers (between BG and foreground) ──
    for (let layer = 0; layer < 2; layer++) {
      const speed = layer === 0 ? 8 : 5;
      const alpha = layer === 0 ? 0.06 : 0.04;
      const yBase = groundY * (layer === 0 ? 0.55 : 0.75);
      const h = H * 0.2;
      ctx.globalAlpha = alpha;
      for (let i = -1; i < 5; i++) {
        const bx = (i * W * 0.45 + t * speed + cx * (layer === 0 ? -0.08 : -0.04)) % (W * 2.5) - W * 0.5;
        const by = yBase + Math.sin(t * 0.4 + i * 1.7) * 15;
        const bw = W * 0.4 + Math.sin(t * 0.2 + i) * 30;
        const grad = ctx.createRadialGradient(bx, by, 0, bx, by, bw);
        grad.addColorStop(0, "rgba(180,200,220,1)");
        grad.addColorStop(0.6, "rgba(180,200,220,0.4)");
        grad.addColorStop(1, "rgba(180,200,220,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(bx - bw, by - h / 2, bw * 2, h);
      }
    }
    ctx.globalAlpha = 1;

    // ── Ground-level puddles with rain ripples ──
    for (let i = 0; i < 6; i++) {
      const px = ((i * 317 + 100) % (W + 200)) - cx * 0.95 % (W + 200);
      const pw = 25 + hash(i, 42) * 30;
      if (px < -pw || px > W + pw) continue;
      // Dark puddle ellipse
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "#1a2a30";
      ctx.beginPath();
      ctx.ellipse(px, groundY + 6, pw, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      // Expanding ripple rings
      const ripplePhase = (t * 2 + i * 1.3) % 1.5;
      if (ripplePhase < 1) {
        const r = ripplePhase * pw * 0.8;
        ctx.globalAlpha = (1 - ripplePhase) * 0.15;
        ctx.strokeStyle = "#5588aa";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.ellipse(px + hash(i, 7) * 10 - 5, groundY + 6, r, r * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Second ripple offset in time
      const ripple2 = (t * 2 + i * 1.3 + 0.7) % 1.5;
      if (ripple2 < 1) {
        const r2 = ripple2 * pw * 0.6;
        ctx.globalAlpha = (1 - ripple2) * 0.12;
        ctx.strokeStyle = "#5588aa";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.ellipse(px + hash(i, 9) * 8 - 4, groundY + 6, r2, r2 * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

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
    const flicker = 0.8 + Math.sin(elapsed * 7 + d.x) * 0.1 + Math.sin(elapsed * 13 + d.x * 0.3) * 0.1;
    // Large ambient glow
    ctx.fillStyle = `rgba(255,140,50,${glow * 0.12})`;
    ctx.beginPath();
    ctx.arc(d.x, groundY - 60, 50, 0, Math.PI * 2);
    ctx.fill();
    // Medium warm glow
    ctx.fillStyle = `rgba(255,100,40,${glow * 0.25})`;
    ctx.beginPath();
    ctx.arc(d.x, groundY - 60, 22, 0, Math.PI * 2);
    ctx.fill();
    // Lantern body
    ctx.fillStyle = "#c0282a";
    ctx.fillRect(d.x - 6, groundY - 70, 12, 18);
    ctx.fillStyle = "#dd4444";
    ctx.fillRect(d.x - 5, groundY - 69, 10, 2);
    // Flame inside — flickering shape
    const flameH = 6 + Math.sin(elapsed * 9 + d.x) * 2;
    const flameW = 3 + Math.sin(elapsed * 11 + d.x * 0.7) * 1;
    ctx.fillStyle = `rgba(255,200,80,${flicker * 0.9})`;
    ctx.beginPath();
    ctx.ellipse(d.x, groundY - 61, flameW, flameH, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255,255,200,${flicker * 0.6})`;
    ctx.beginPath();
    ctx.ellipse(d.x, groundY - 61, flameW * 0.5, flameH * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    // Post
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
  // Death flash — red overlay
  if (g.deathFlash > 0) {
    ctx.fillStyle = `rgba(200,30,30,${g.deathFlash / 300 * 0.5})`;
    ctx.fillRect(0, 0, W, g.H);
  }

  // Room number + timer (top center)
  ctx.font = `bold 13px ${font}`;
  ctx.textAlign = "center";
  ctx.fillStyle = "#888899";
  const roomNum = (g.currentRoom || 0) + 1;
  ctx.fillText(`ROOM ${roomNum}/${TOTAL_ROOMS}`, W / 2, 20);
  if (g.roomState === "playing") {
    ctx.font = `11px ${font}`;
    ctx.fillStyle = "#666677";
    ctx.fillText(`${g.roomTimer.toFixed(1)}s`, W / 2, 36);
  }
  // Deaths counter (small, top center-right)
  if (g.deaths > 0) {
    ctx.font = `10px ${font}`;
    ctx.fillStyle = "#554444";
    ctx.textAlign = "center";
    ctx.fillText(`☠ ${g.deaths}`, W / 2 + 60, 20);
  }

  // Score (top left)
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
