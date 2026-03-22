import { TILE, SCALE, DASH_COOLDOWN, hash } from "./constants.js";
import { getSprite } from "./sprites.js";

// ═══ MAIN RENDER ═══
export function render(g, ctx, isDesktop, font) {
  const { W, H, camera: cam } = g;
  const cx = cam.x + cam.shakeX;
  const cy = cam.y + cam.shakeY;

  ctx.fillStyle = "#0a0a14";
  ctx.fillRect(0, 0, W, H);

  renderBackground(ctx, W, H, cx, g);

  // ── Ambient embers (behind world) ──
  for (const em of g.embers) {
    const sx = em.x - cx;
    if (sx < -10 || sx > W + 10) continue;
    ctx.globalAlpha = Math.min(1, em.life / em.maxLife) * 0.6;
    ctx.fillStyle = em.color;
    ctx.beginPath();
    ctx.arc(sx, em.y, em.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.save();
  ctx.translate(-cx, -cy);

  // Decorations
  for (const d of g.decorations) renderDeco(ctx, d, g.groundY, g.time.elapsed);

  // Platforms
  for (const plat of g.platforms) {
    if (plat.x + plat.w < cx - 50 || plat.x > cx + W + 50) continue;
    // Platform body
    const grad = ctx.createLinearGradient(plat.x, plat.y, plat.x, plat.y + 14);
    grad.addColorStop(0, "#1e1e30");
    grad.addColorStop(1, "#12121e");
    ctx.fillStyle = grad;
    ctx.fillRect(plat.x, plat.y, plat.w, 14);
    // Neon top edge
    ctx.fillStyle = "#c0282a";
    ctx.fillRect(plat.x, plat.y, plat.w, 1);
    ctx.fillStyle = "#c0282a55";
    ctx.fillRect(plat.x, plat.y + 1, plat.w, 1);
    // Subtle glow under edge
    ctx.fillStyle = "#c0282a18";
    ctx.fillRect(plat.x, plat.y + 2, plat.w, 3);
    // Side edges
    ctx.fillStyle = "#c0282a22";
    ctx.fillRect(plat.x, plat.y, 1, 14);
    ctx.fillRect(plat.x + plat.w - 1, plat.y, 1, 14);
  }

  // ── Enemies ──
  for (const e of g.enemies) {
    if (e.x < cx - 100 || e.x > cx + W + 100) continue;

    // Enemy glow (colored outline)
    if (!e.dead) {
      const glowColor = e.type === "oni" ? "rgba(255,68,68," : e.type === "ninja" ? "rgba(100,100,200," : "rgba(255,170,68,";
      ctx.shadowColor = glowColor + "0.4)";
      ctx.shadowBlur = 8;
    }

    if (e.dead) {
      ctx.globalAlpha = e.deathTimer / 400;
      // White flash at start of death
      if (e.deathTimer > 300) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(e.x - TILE * SCALE / 2, e.y, TILE * SCALE, TILE * SCALE);
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        continue;
      }
    }

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
    ctx.shadowBlur = 0;

    // ── Alert "!" indicator ──
    if (e.alert > 0 && !e.dead) {
      const alertAlpha = Math.min(1, e.alert / 200);
      const bounce = Math.sin(e.alert * 0.02) * 3;
      ctx.globalAlpha = alertAlpha;
      ctx.fillStyle = "#ff4444";
      ctx.font = `bold 14px ${font}`;
      ctx.textAlign = "center";
      ctx.shadowColor = "#ff4444";
      ctx.shadowBlur = 6;
      ctx.fillText("!", e.x, e.y - 8 + bounce);
      ctx.shadowBlur = 0;
    }

    // ── Samurai HP pips ──
    if (e.type === "samurai" && !e.dead && e.hp > 0) {
      const pipY = e.y - 6;
      for (let i = 0; i < 2; i++) {
        const px = e.x - 6 + i * 12;
        ctx.fillStyle = i < e.hp ? "#ffaa44" : "#333344";
        ctx.fillRect(px - 3, pipY, 6, 3);
        if (i < e.hp) {
          ctx.fillStyle = "#ffdd88";
          ctx.fillRect(px - 3, pipY, 6, 1);
        }
      }
    }

    // Block shield
    if (e.blocking && !e.dead) {
      ctx.strokeStyle = "#ffe08066";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#ffe080";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(e.x, e.y + TILE * SCALE / 2, 28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Attack telegraph
    if (e.state === "attack" && e.attackTimer > 200 && !e.dead) {
      const pulse = 0.25 + Math.sin(g.time.elapsed * 20) * 0.15;
      ctx.fillStyle = `rgba(255,60,60,${pulse})`;
      ctx.fillRect(e.x - 30, e.y, 60, TILE * SCALE);
    }
    ctx.globalAlpha = 1;
  }

  // ── Projectiles with trails ──
  for (const proj of g.projectiles) {
    // Trail
    if (proj.trail && proj.trail.length > 1) {
      for (let i = 0; i < proj.trail.length - 1; i++) {
        const alpha = (i / proj.trail.length) * 0.4;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "#8888cc";
        const t = proj.trail[i];
        const size = 2 + (i / proj.trail.length) * 3;
        ctx.fillRect(t.x - size / 2, t.y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
    }

    // Shuriken with glow
    ctx.save();
    ctx.translate(proj.x, proj.y);
    ctx.rotate(proj.rotation);
    ctx.shadowColor = "#8888ff";
    ctx.shadowBlur = 6;
    const sprFrame = Math.floor(g.time.elapsed * 8) % 2 === 0 ? "shuriken" : "shuriken2";
    const spr = getSprite(sprFrame);
    if (spr) ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ── Player afterimages (dash trail) ──
  for (const ai of g.player.afterimages) {
    ctx.globalAlpha = (ai.life / 200) * 0.35;
    const spr = getSprite("dash", ai.facing < 0);
    if (spr) ctx.drawImage(spr, ai.x - spr.width / 2, ai.y, spr.width, spr.height);
  }
  ctx.globalAlpha = 1;

  // ── Player ──
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
      if (p.dashTimer > 0) {
        ctx.shadowColor = "#c0282a";
        ctx.shadowBlur = 15;
      }
      ctx.drawImage(spr, p.x - spr.width / 2, p.y, spr.width, spr.height);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
  }

  // ── Slash effects ──
  for (const s of g.slashEffects) {
    const progress = 1 - s.timer / s.maxTimer;
    const alpha = (1 - progress) * 0.9;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.strokeStyle = `rgba(224,232,255,${alpha})`;
    ctx.lineWidth = 4 - progress * 3;
    ctx.shadowColor = "#e0e8ff";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    const start = s.facing > 0
      ? -Math.PI * 0.7 + progress * Math.PI * 0.5
      : Math.PI * 0.7 - progress * Math.PI * 0.5;
    const end = s.facing > 0
      ? Math.PI * 0.5 + progress * Math.PI * 0.3
      : -Math.PI * 0.5 - progress * Math.PI * 0.3;
    ctx.arc(0, 0, 30 + progress * 28, start, end);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ── Particles ──
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

  // ── Floating texts ──
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
    ctx.shadowColor = ft.color;
    ctx.shadowBlur = 6;
    ctx.fillText(ft.text, 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  ctx.restore(); // end camera

  // ── Post-processing ──
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

// ═══ BACKGROUND ═══
function renderBackground(ctx, W, H, cx, g) {
  const groundY = g.groundY;

  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#05050e");
  sky.addColorStop(0.4, "#0a0a1e");
  sky.addColorStop(0.8, "#0e0a20");
  sky.addColorStop(1, "#0d0a18");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Moon
  ctx.fillStyle = "#1a1a30";
  ctx.beginPath();
  ctx.arc(W * 0.8 - cx * 0.02, H * 0.15, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#222240";
  ctx.beginPath();
  ctx.arc(W * 0.8 - cx * 0.02, H * 0.15, 28, 0, Math.PI * 2);
  ctx.fill();

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
    // Antenna/spire on some
    if (i % 4 === 0) {
      ctx.fillRect(x + bw / 2 - 1, groundY - bh - 15, 2, 15);
      ctx.fillStyle = "#ff2020";
      ctx.globalAlpha = 0.5 + Math.sin(g.time.elapsed * 3 + i) * 0.3;
      ctx.fillRect(x + bw / 2 - 1, groundY - bh - 15, 2, 2);
      ctx.globalAlpha = 1;
    }
  }

  // Mid buildings with neon (parallax 0.3)
  const bx2 = -cx * 0.3;
  for (let i = 0; i < 14; i++) {
    const bw = 28 + ((i * 43) % 55);
    const bh = 35 + ((i * 67) % 110);
    const x = ((i * 130 + 20 + bx2) % (W + 400) + W + 400) % (W + 400) - 100;
    ctx.fillStyle = "#10101e";
    ctx.fillRect(x, groundY - bh, bw, bh);

    // Neon signs
    if (i % 3 === 0) {
      const colors = ["rgba(192,40,42,", "rgba(155,142,207,", "rgba(79,142,196,"];
      const neonColor = colors[i % 3];
      const glow = 0.4 + Math.sin(g.time.elapsed * 3 + i * 1.5) * 0.2;
      ctx.fillStyle = neonColor + glow + ")";
      ctx.fillRect(x + 4, groundY - bh + 8, bw - 8, 5);
      // Glow bloom
      ctx.fillStyle = neonColor + (glow * 0.15) + ")";
      ctx.fillRect(x + 2, groundY - bh + 5, bw - 4, 11);
    }
    // Windows (deterministic)
    ctx.fillStyle = "rgba(255,200,100,0.2)";
    for (let wy = groundY - bh + 22; wy < groundY - 8; wy += 14) {
      for (let wx = x + 5; wx < x + bw - 5; wx += 9) {
        if (hash(i * 100 + Math.floor(wx), Math.floor(wy)) > 0.4) {
          ctx.fillRect(wx, wy, 4, 5);
        }
      }
    }
  }

  // Wires (parallax 0.7)
  ctx.strokeStyle = "#1a1a30";
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const wy = groundY - 140 - i * 35;
    ctx.beginPath();
    ctx.moveTo(0, wy);
    ctx.lineTo(W, wy + Math.sin(cx * 0.003 + i) * 5);
    ctx.stroke();
  }

  // Ground
  ctx.fillStyle = "#08080f";
  ctx.fillRect(0, groundY + 14, W, H - groundY);
  // Ground edge glow
  ctx.fillStyle = "#c0282a0a";
  ctx.fillRect(0, groundY + 14, W, 3);
}

// ═══ DECORATIONS ═══
function renderDeco(ctx, d, groundY, elapsed) {
  if (d.type === "lantern") {
    const glow = 0.5 + Math.sin(elapsed * 3 + d.x * 0.1) * 0.2;
    // Outer glow
    ctx.fillStyle = `rgba(255,100,50,${glow * 0.15})`;
    ctx.beginPath();
    ctx.arc(d.x, groundY - 60, 30, 0, Math.PI * 2);
    ctx.fill();
    // Inner glow
    ctx.fillStyle = `rgba(255,100,50,${glow * 0.35})`;
    ctx.beginPath();
    ctx.arc(d.x, groundY - 60, 14, 0, Math.PI * 2);
    ctx.fill();
    // Lantern body
    ctx.fillStyle = "#c0282a";
    ctx.fillRect(d.x - 6, groundY - 70, 12, 18);
    ctx.fillStyle = "#dd4444";
    ctx.fillRect(d.x - 5, groundY - 69, 10, 2);
    // String
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
    // Highlights
    ctx.fillStyle = "#aa2222";
    ctx.fillRect(d.x - 36, groundY - 100, 72, 2);
    ctx.fillRect(d.x - 30, groundY - 100, 2, 100);
    ctx.fillRect(d.x + 24, groundY - 100, 2, 100);
    // Glow
    ctx.fillStyle = "rgba(192,40,42,0.08)";
    ctx.fillRect(d.x - 40, groundY - 110, 80, 120);
  } else if (d.type === "sign") {
    // Neon sign with kanji
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(d.x - 18, groundY - 85, 36, 24);
    ctx.strokeStyle = "#2a2a3e";
    ctx.lineWidth = 1;
    ctx.strokeRect(d.x - 18, groundY - 85, 36, 24);
    const glow = 0.7 + Math.sin(elapsed * 4 + d.x) * 0.3;
    const kanji = ["酒", "茶", "刀", "忍"][Math.floor(hash(d.x, 0) * 4)];
    ctx.fillStyle = `rgba(155,142,207,${glow})`;
    ctx.shadowColor = "rgba(155,142,207,0.5)";
    ctx.shadowBlur = 8;
    ctx.font = "14px monospace";
    ctx.textAlign = "center";
    ctx.fillText(kanji, d.x, groundY - 68);
    ctx.shadowBlur = 0;
  }
}

// ═══ HUD ═══
function renderHUD(ctx, g, W, isDesktop, font) {
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
    const comboScale = Math.min(1.4, 1 + (g.comboTimer / 2000) * 0.4);
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

  // Focus meter
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

  // Dash indicator
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
