import { TILE, SCALE, DASH_COOLDOWN, TOTAL_ROOMS, JUMP_FORCE, hash } from "./constants.js";
import { getSprite, getMascotImage, getImage } from "./sprites.js";
import { renderStoryScene } from "./storyRenderer.js";

const DRAW_SIZE = TILE * SCALE; // 60px — physics size (for positioning)
const SPRITE_SCALE = 1.35; // visual scale multiplier — makes character bigger without affecting physics

// ═══ MAIN RENDER ═══
export function render(g, ctx, isDesktop, font) {
  const { W, H, camera: cam } = g;

  // Story mode — render scene instead of gameplay
  if (g.gameState === "story") {
    try {
      renderStoryScene(ctx, g, W, H, font);
    } catch (e) {
      console.error("[story render]", e);
      // Draw minimal fallback so loop doesn't freeze
      ctx.fillStyle = "#0a0a14";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#888";
      ctx.font = "14px monospace";
      ctx.fillText("story render error — click to advance", 20, H / 2);
    }
    return;
  }

  // Round camera position to prevent subpixel jitter on all world objects
  const cx = Math.round(cam.x + cam.shakeX);
  const cy = Math.round(cam.y + cam.shakeY);

  ctx.fillStyle = "#0a0a14";
  ctx.fillRect(0, 0, W, H);

  // Slow-mo desaturation — applied before world render
  const isSlowMo = g.slowMo && g.slowMo.active;
  const isBackflipSlowMo = g.slowMo && g.slowMo._backflipSlowMo > 0;
  if (isSlowMo) {
    if (isBackflipSlowMo) {
      // Backflip: subtle desaturation matching the flat slow-mo curve
      const progress = 1 - g.slowMo._backflipSlowMo / 0.7;
      // Quick in, hold, ease out — matches time scale curve
      const intensity = progress < 0.08 ? progress / 0.08
        : progress < 0.7 ? 1
        : 1 - ((progress - 0.7) / 0.3) ** 2;
      ctx.filter = `saturate(${1 - intensity * 0.3})`; // 1.0→0.7→1.0
    } else {
      ctx.filter = "saturate(0.4)";
    }
  }

  // Apply camera zoom — backflip centers on player, otherwise viewport center
  const zoom = cam.zoom || 1;
  if (zoom !== 1) {
    ctx.save();
    const isBackflipZoom = cam._backflipZoom > 0 && g.player;
    const zoomCX = isBackflipZoom ? (g.player.x - (cam.x || 0)) : W / 2;
    const zoomCY = isBackflipZoom ? (g.player.y + DRAW_SIZE * 0.4) : H / 2;
    ctx.translate(zoomCX, zoomCY);
    ctx.scale(zoom, zoom);
    ctx.translate(-zoomCX, -zoomCY);
  }

  // Room background image — if exists, replaces ALL procedural background rendering
  const roomData = (g._rooms || [])[g.currentRoom];
  const roomBgKey = roomData?.background;
  const roomBgImg = roomBgKey ? getImage(roomBgKey) : null;
  if (roomBgImg) {
    // Draw scene image covering the full viewport
    ctx.drawImage(roomBgImg, 0, 0, W, H);
    // Subtle darkening for readability
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.fillRect(0, 0, W, H);
  } else {
    renderBackground(ctx, W, H, cx, g);
  }

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

  // Visible wall columns (stone pillars) — drawn as part of the environment
  for (const plat of g.platforms) {
    if (!plat.wall || !plat.visible) continue;
    const px = plat.x, py = plat.y, pw = plat.w, ph = plat.h || 16;
    // Stone pillar with dark texture
    ctx.fillStyle = "#2a221a";
    ctx.fillRect(px, py, pw, ph);
    // Lighter edge highlights
    ctx.fillStyle = "#3d3228";
    ctx.fillRect(px + 1, py, 2, ph);
    ctx.fillStyle = "#1a150f";
    ctx.fillRect(px + pw - 2, py, 2, ph);
    // Stone block lines every ~20px
    ctx.strokeStyle = "#1a150f";
    ctx.lineWidth = 1;
    for (let by = py; by < py + ph; by += 18) {
      ctx.beginPath();
      ctx.moveTo(px, by);
      ctx.lineTo(px + pw, by);
      ctx.stroke();
    }
    // Top cap
    ctx.fillStyle = "#3d3228";
    ctx.fillRect(px - 2, py - 3, pw + 4, 5);
    // Bottom cap
    ctx.fillRect(px - 2, py + ph - 2, pw + 4, 5);
  }

  // Doors — shoji panels that open/close
  if (g.doors) {
    for (const door of g.doors) {
      const dy = door.y || g.groundY;
      const openT = door.openTimer || 0;
      const doorH = 90;
      const doorW = 24;
      const slideOffset = openT * doorW * 0.8; // panels slide apart

      // Door frame
      ctx.fillStyle = "#3a2a1a";
      ctx.fillRect(door.x - doorW - 4, dy - doorH, 4, doorH);
      ctx.fillRect(door.x + doorW, dy - doorH, 4, doorH);
      ctx.fillRect(door.x - doorW - 4, dy - doorH, doorW * 2 + 8, 4);

      // Left panel (slides left when open)
      ctx.fillStyle = `rgba(200,195,180,${0.2 - openT * 0.1})`;
      ctx.fillRect(door.x - doorW + 2 - slideOffset, dy - doorH + 4, doorW - 2, doorH - 4);
      // Right panel (slides right when open)
      ctx.fillRect(door.x + slideOffset, dy - doorH + 4, doorW - 2, doorH - 4);

      // Grid lines on panels
      ctx.strokeStyle = `rgba(60,50,35,${0.2 - openT * 0.1})`;
      ctx.lineWidth = 0.5;
      // Left panel grid
      for (let i = 1; i < 3; i++) {
        const px = door.x - doorW + 2 - slideOffset + i * (doorW / 3);
        ctx.beginPath(); ctx.moveTo(px, dy - doorH + 4); ctx.lineTo(px, dy); ctx.stroke();
      }
      // Right panel grid
      for (let i = 1; i < 3; i++) {
        const px = door.x + slideOffset + i * (doorW / 3);
        ctx.beginPath(); ctx.moveTo(px, dy - doorH + 4); ctx.lineTo(px, dy); ctx.stroke();
      }

      // "↑ ENTER" prompt when close and not in transition
      if (openT > 0.5 && !g.doorTransition) {
        ctx.fillStyle = `rgba(200,180,140,${0.5 + Math.sin(g.time.elapsed * 3) * 0.3})`;
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        ctx.fillText("↑", door.x, dy - doorH - 8);
        ctx.textAlign = "left";
      }
    }
  }

  // Door transition blackout overlay
  if (g.doorTransition) {
    const dt2 = g.doorTransition;
    let alpha = 0;
    if (dt2.phase === "entering") alpha = Math.min(1, dt2.timer / 0.4);
    else if (dt2.phase === "black") alpha = 1;
    else if (dt2.phase === "exiting") alpha = Math.max(0, 1 - dt2.timer / 0.3);
    if (alpha > 0) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform to screen space
      ctx.fillStyle = `rgba(0,0,0,${alpha})`;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  // Platforms + walls — skip visual rendering when room has a scene background
  // (collision still works, just invisible — the background image shows the level)
  const hasRoomBg = !!roomBgImg;
  const platPal = getTheme(g);
  for (const plat of g.platforms) {
    if (hasRoomBg && !g._debugCollision) continue; // invisible — bg shows platforms
    // Debug mode: interactive collision editor
    if (hasRoomBg && g._debugCollision) {
      const isSelected = g._editPlatform && g._editPlatform.index === g.platforms.indexOf(plat);
      const ph = plat.h || 16;
      // Fill
      ctx.fillStyle = isSelected ? "rgba(255,255,100,0.4)" : (plat.wall ? "rgba(255,100,100,0.3)" : "rgba(100,255,100,0.3)");
      ctx.fillRect(plat.x, plat.y, plat.w, ph);
      // Border
      ctx.strokeStyle = isSelected ? "#ffff44" : (plat.wall ? "#ff4444" : "#44ff44");
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeRect(plat.x, plat.y, plat.w, ph);
      // Resize handle (right edge)
      ctx.fillStyle = isSelected ? "#ffff00" : "#44ff4488";
      ctx.fillRect(plat.x + plat.w - 8, plat.y, 8, ph);
      // Label: platform index + position
      ctx.fillStyle = "#ffffff";
      ctx.font = "9px monospace";
      ctx.fillText(`${g.platforms.indexOf(plat)}: y=${Math.round(plat.y - g.groundY)} w=${Math.round(plat.w)}`, plat.x + 4, plat.y + 12);
      continue;
    }
    if (plat.x + (plat.w || 0) < cx - 50 || plat.x > cx + W + 50) continue;
    const bgK = (roomData && roomData.theme === "dojo") ? "bg_dojo" : "bg_forest";
    const hasBg = !!getImage(bgK);
    const accent = hasBg ? "#3a8a5a" : platPal.platAccent;
    const isForest = roomData && (roomData.theme === "forest" || roomData.theme === "temple");

    if (plat.wall) {
      // Solid climbable wall
      const h = plat.h || 100;
      const w = plat.w;
      const wx = plat.x;
      const wy = plat.y;

      // Forest walls: use cliff sprite if available
      if (isForest) {
        const cliffImg = getImage("tile_forest_wall") || getImage("wall_cliff");
        if (cliffImg) {
          ctx.imageSmoothingEnabled = false;
          // Tile the cliff sprite vertically to fill the wall height
          const tileW = w;
          const tileH = cliffImg.height * (w / cliffImg.width);
          for (let ty = wy; ty < wy + h; ty += tileH) {
            const drawH = Math.min(tileH, wy + h - ty);
            ctx.drawImage(cliffImg, 0, 0, cliffImg.width, cliffImg.height * (drawH / tileH), wx, ty, tileW, drawH);
          }
          ctx.imageSmoothingEnabled = true;
          // Scratch marks for wall-jump hint
          ctx.strokeStyle = "#88aa6630";
          ctx.lineWidth = 1;
          for (let sy = wy + 20; sy < wy + h - 20; sy += 30) {
            ctx.beginPath(); ctx.moveTo(wx + 3, sy); ctx.lineTo(wx + w * 0.4, sy + 10); ctx.stroke();
          }
        } else {
          // Fallback to rock fill
          ctx.fillStyle = "#1a1e18";
          ctx.fillRect(wx, wy, w, h);
        }
      } else {
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

      // Edge highlights — warm amber accent (distinct from green platforms)
      ctx.fillStyle = "#cc883388";
      ctx.fillRect(wx, wy, 2, h);           // left edge
      ctx.fillRect(wx + w - 2, wy, 2, h);   // right edge
      ctx.fillStyle = "#cc8833";
      ctx.fillRect(wx, wy, w, 2);           // top cap — amber (platforms are green)
      // Inner edge shadow
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(wx + 2, wy + 2, 1, h - 2);
      ctx.fillRect(wx + w - 3, wy + 2, 1, h - 2);
      // Diagonal scratch marks — indicate wall is climbable
      ctx.strokeStyle = "#cc883330";
      ctx.lineWidth = 1;
      const scratchSpacing = 28;
      for (let sy = wy + 12; sy < wy + h - 12; sy += scratchSpacing) {
        ctx.beginPath();
        ctx.moveTo(wx + 3, sy);
        ctx.lineTo(wx + w * 0.4, sy + 12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(wx + w - 3, sy + 6);
        ctx.lineTo(wx + w * 0.6, sy + 18);
        ctx.stroke();
      }
      // Small upward arrow at bottom of wall
      const arrowY = wy + h - 16;
      const arrowX = wx + w / 2;
      ctx.fillStyle = "#cc883344";
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY - 6);
      ctx.lineTo(arrowX - 5, arrowY + 2);
      ctx.lineTo(arrowX + 5, arrowY + 2);
      ctx.closePath();
      ctx.fill();
      } // close non-forest wall else block
    } else if (plat.ceiling) {
      // Ceiling — dark wooden planks overhead with shadow beneath
      const grad = ctx.createLinearGradient(plat.x, plat.y, plat.x, plat.y + 14);
      grad.addColorStop(0, "#1a1208");
      grad.addColorStop(1, "#0e0a04");
      ctx.fillStyle = grad;
      ctx.fillRect(plat.x, plat.y, plat.w, 14);
      // Beam lines
      ctx.fillStyle = "#2a1a0a";
      for (let bx = plat.x; bx < plat.x + plat.w; bx += 40) {
        ctx.fillRect(bx, plat.y, 1, 14);
      }
      // Bottom edge highlight
      ctx.fillStyle = "#3a2a18";
      ctx.fillRect(plat.x, plat.y + 13, plat.w, 1);
      // Shadow gradient below ceiling
      const shadow = ctx.createLinearGradient(plat.x, plat.y + 14, plat.x, plat.y + 40);
      shadow.addColorStop(0, "rgba(0,0,0,0.3)");
      shadow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = shadow;
      ctx.fillRect(plat.x, plat.y + 14, plat.w, 26);
    } else if (plat.stair) {
      // Stair step — wooden block with edge detail
      ctx.fillStyle = "#2a1a0e";
      ctx.fillRect(plat.x, plat.y, plat.w, 10);
      ctx.fillStyle = "#3a2a18";
      ctx.fillRect(plat.x, plat.y, plat.w, 2);
      ctx.fillStyle = "#1a0e06";
      ctx.fillRect(plat.x, plat.y + 8, plat.w, 2);
    } else if (isForest && !plat.wall) {
      // Forest platform — tileset sprite, stretched to platform height
      const tileKey = plat.y < (g.groundY - 30) ? "tile_forest_branch" : "tile_forest_ground";
      const tile = getImage(tileKey);
      if (tile) {
        ctx.imageSmoothingEnabled = false;
        // Scale tile to match platform height (16px), tile horizontally
        const drawH = 20;
        const scaleX = drawH / tile.height;
        const tileW = tile.width * scaleX;
        for (let tx = plat.x; tx < plat.x + plat.w; tx += tileW) {
          const clipSrcW = Math.min(tile.width, (plat.x + plat.w - tx) / scaleX);
          const clipDrawW = clipSrcW * scaleX;
          ctx.drawImage(tile, 0, 0, clipSrcW, tile.height, tx, plat.y - 4, clipDrawW, drawH);
        }
        ctx.imageSmoothingEnabled = true;
      } else {
        // Procedural fallback
        ctx.fillStyle = "#2a1e12";
        ctx.fillRect(plat.x, plat.y, plat.w, 16);
        ctx.fillStyle = "#2a4a28";
        ctx.fillRect(plat.x, plat.y, plat.w, 2);
      }
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

  // ── Hazards ──
  if (g.hazards) {
    for (const h of g.hazards) {
      if (h.x + (h.w || 30) < cx - 50 || h.x > cx + W + 50) continue;
      if (h.type === "spikes") {
        // Metallic gray spike triangles
        const count = Math.floor(h.w / 16);
        for (let i = 0; i < count; i++) {
          const sx = h.x + i * 16 + 8;
          ctx.fillStyle = "#888899";
          ctx.beginPath();
          ctx.moveTo(sx, h.y - 14);
          ctx.lineTo(sx - 7, h.y);
          ctx.lineTo(sx + 7, h.y);
          ctx.closePath();
          ctx.fill();
          // Highlight
          ctx.fillStyle = "#aabbcc";
          ctx.beginPath();
          ctx.moveTo(sx, h.y - 14);
          ctx.lineTo(sx - 2, h.y - 4);
          ctx.lineTo(sx + 2, h.y - 4);
          ctx.closePath();
          ctx.fill();
        }
      } else if (h.type === "firejet") {
        // Base nozzle
        ctx.fillStyle = "#444455";
        ctx.fillRect(h.x, h.y - 8, h.w || 30, 8);
        // Telegraph glow
        if (h.telegraph && !h.active) {
          ctx.fillStyle = `rgba(255,60,20,${0.3 + Math.sin(g.time.elapsed * 20) * 0.2})`;
          ctx.fillRect(h.x, h.y - (h.h || 80), h.w || 30, h.h || 80);
        }
        // Active flame column
        if (h.active) {
          const flameH = h.h || 80;
          const grad = ctx.createLinearGradient(h.x, h.y - flameH, h.x, h.y);
          grad.addColorStop(0, "rgba(255,200,50,0)");
          grad.addColorStop(0.3, "rgba(255,120,20,0.7)");
          grad.addColorStop(0.7, "rgba(255,60,10,0.9)");
          grad.addColorStop(1, "rgba(255,40,0,0.6)");
          ctx.fillStyle = grad;
          ctx.fillRect(h.x, h.y - flameH, h.w || 30, flameH);
          // Bright core
          ctx.fillStyle = "rgba(255,255,200,0.4)";
          ctx.fillRect(h.x + (h.w || 30) * 0.3, h.y - flameH * 0.7, (h.w || 30) * 0.4, flameH * 0.5);
        }
      } else if (h.type === "falling") {
        if (h.fallen) continue;
        ctx.save();
        // Shake effect
        if (h.shaking > 0) {
          const shake = (Math.random() - 0.5) * 4;
          ctx.translate(shake, 0);
        }
        // Draw as cracked platform
        const grad = ctx.createLinearGradient(h.x, h.y, h.x, h.y + 14);
        grad.addColorStop(0, "#2a1a10");
        grad.addColorStop(1, "#1a0e08");
        ctx.fillStyle = grad;
        ctx.fillRect(h.x, h.y, h.w, 14);
        ctx.fillStyle = "#cc8833";
        ctx.fillRect(h.x, h.y, h.w, 1);
        // Crack lines
        ctx.strokeStyle = "#55331188";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(h.x + h.w * 0.3, h.y + 2);
        ctx.lineTo(h.x + h.w * 0.5, h.y + 10);
        ctx.moveTo(h.x + h.w * 0.7, h.y + 3);
        ctx.lineTo(h.x + h.w * 0.55, h.y + 12);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  // ── Breakable objects ──
  if (g.breakables) {
    for (const br of g.breakables) {
      if (br.broken) continue;
      const bw = br.w || 40;
      const bh = br.h || 40;
      const bx = br.x;
      const by = br.y - bh;
      if (bx + bw < cx - 50 || bx > cx + W + 50) continue;

      if (br.type === "crate") {
        // Brown wooden crate with cross-hatch
        ctx.fillStyle = "#6b4830";
        ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = "#8b6840";
        ctx.fillRect(bx + 2, by + 2, bw - 4, bh - 4);
        // Cross-hatch planks
        ctx.strokeStyle = "#5a3820";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx + 3, by + 3);
        ctx.lineTo(bx + bw - 3, by + bh - 3);
        ctx.moveTo(bx + bw - 3, by + 3);
        ctx.lineTo(bx + 3, by + bh - 3);
        ctx.stroke();
        // Horizontal plank line
        ctx.beginPath();
        ctx.moveTo(bx, by + bh / 2);
        ctx.lineTo(bx + bw, by + bh / 2);
        ctx.stroke();
        // Highlight edge
        ctx.fillStyle = "#c4a06044";
        ctx.fillRect(bx, by, bw, 2);
      } else if (br.type === "lantern") {
        // Paper lantern with warm glow
        const lcx = bx + bw / 2;
        const lcy = by + bh / 2;
        // Glow aura
        const glowR = bw * 1.5;
        const glow = ctx.createRadialGradient(lcx, lcy, 0, lcx, lcy, glowR);
        glow.addColorStop(0, "rgba(255,180,60,0.15)");
        glow.addColorStop(1, "rgba(255,180,60,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(lcx - glowR, lcy - glowR, glowR * 2, glowR * 2);
        // Lantern body (rounded rect via arcs)
        ctx.fillStyle = "#cc4422";
        ctx.beginPath();
        ctx.ellipse(lcx, lcy, bw / 2 - 2, bh / 2 - 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ee6644";
        ctx.beginPath();
        ctx.ellipse(lcx, lcy, bw / 2 - 5, bh / 2 - 5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Top/bottom cap
        ctx.fillStyle = "#444444";
        ctx.fillRect(lcx - 6, by, 12, 4);
        ctx.fillRect(lcx - 6, by + bh - 4, 12, 4);
        // Kanji character
        ctx.fillStyle = "#ffcc88";
        ctx.font = `${Math.floor(bh * 0.35)}px serif`;
        ctx.textAlign = "center";
        ctx.fillText("灯", lcx, lcy + bh * 0.12);
      } else if (br.type === "pot") {
        // Small ceramic pot
        const pcx = bx + bw / 2;
        ctx.fillStyle = "#887766";
        ctx.beginPath();
        ctx.ellipse(pcx, by + bh * 0.6, bw / 2, bh * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#aa9988";
        ctx.beginPath();
        ctx.ellipse(pcx, by + bh * 0.6, bw / 2 - 3, bh * 0.4 - 3, 0, 0, Math.PI * 2);
        ctx.fill();
        // Rim
        ctx.fillStyle = "#776655";
        ctx.beginPath();
        ctx.ellipse(pcx, by + bh * 0.25, bw * 0.35, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Highlight
        ctx.fillStyle = "#ccbb9944";
        ctx.beginPath();
        ctx.ellipse(pcx - 4, by + bh * 0.45, 3, bh * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (br.type === "bamboo") {
        // Bamboo screen — thin vertical slats
        ctx.fillStyle = "#3a5a2a";
        ctx.fillRect(bx, by, bw, bh);
        const slatW = 6;
        for (let sx = bx; sx < bx + bw; sx += slatW + 2) {
          ctx.fillStyle = "#4a6a3a";
          ctx.fillRect(sx, by, slatW, bh);
          // Node marks
          ctx.fillStyle = "#2a4a1a";
          ctx.fillRect(sx, by + bh * 0.3, slatW, 2);
          ctx.fillRect(sx, by + bh * 0.7, slatW, 2);
        }
        // Top/bottom frame
        ctx.fillStyle = "#5a3820";
        ctx.fillRect(bx, by, bw, 3);
        ctx.fillRect(bx, by + bh - 3, bw, 3);
      }
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

  // ── NPCs — friendly in-world story characters ──
  if (g.npcs) {
    for (const npc of g.npcs) {
      if (npc.x < cx - 100 || npc.x > cx + W + 100) continue;
      const nx = Math.round(npc.x);
      const ny = Math.round(npc.y);
      // Get sprite — use walk frames if walking, idle otherwise
      let spriteKey = `story_${npc.charKey}_idle`;
      if (npc.state === "walking_in" || npc.state === "walking_out") {
        const walkFrame = npc.frame % 2 === 0 ? "walk1" : "walk2";
        const walkKey = `story_${npc.charKey}_${walkFrame}`;
        if (getImage(walkKey)) spriteKey = walkKey;
      } else if (npc.state === "talking") {
        // Use emotion sprite if available from current dialogue line
        if (g.activeDialogue?.npc === npc) {
          const line = g.activeDialogue.lines[g.activeDialogue.index];
          if (line?.emotion) {
            const emotionKey = `story_${npc.charKey}_${line.emotion}`;
            if (getImage(emotionKey)) spriteKey = emotionKey;
          }
        }
      }
      const img = getImage(spriteKey);
      if (img) {
        const drawH = DRAW_SIZE * SPRITE_SCALE; // same size as player
        const drawW = drawH * (img.width / img.height);
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        // Flip based on facing direction (sprites face left by default)
        if (npc.facing === 1) {
          ctx.translate(nx + drawW / 2, ny + DRAW_SIZE - drawH);
          ctx.scale(-1, 1);
          ctx.drawImage(img, -drawW / 2, 0, drawW, drawH);
        } else {
          ctx.drawImage(img, nx - drawW / 2, ny + DRAW_SIZE - drawH, drawW, drawH);
        }
        ctx.imageSmoothingEnabled = true;
        ctx.restore();
      } else {
        // Fallback: colored circle with name
        ctx.fillStyle = npc.charKey === "sensei" ? "#cc9933" : "#cc4488";
        ctx.beginPath();
        ctx.arc(nx, ny + DRAW_SIZE * 0.5, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = `10px ${font}`;
        ctx.textAlign = "center";
        ctx.fillText(npc.charKey, nx, ny + DRAW_SIZE * 0.5 + 4);
        ctx.textAlign = "left";
      }
      // Interaction prompt when player is close and dialogue not triggered
      if (!npc.triggered && npc.dialogueKey !== null) {
        const playerDist = Math.abs((g.player?.x || 0) - npc.x);
        if (playerDist < npc.triggerRange * 2) {
          ctx.globalAlpha = 0.7;
          ctx.fillStyle = "#ffffff";
          ctx.font = `bold 10px ${font}`;
          ctx.textAlign = "center";
          ctx.fillText("▼", nx, ny - 8);
          ctx.textAlign = "left";
          ctx.globalAlpha = 1;
        }
      }
    }
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

  // ── Debris chunks (physics-based, spinning, can kill enemies) ──
  if (g.debris) {
    for (const d of g.debris) {
      const alpha = Math.min(1, d.life / d.maxLife);
      ctx.globalAlpha = alpha;
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rotation || 0);
      ctx.fillStyle = d.color;
      // Draw as rotated rectangle for chunky debris feel
      const s = d.size;
      ctx.fillRect(-s / 2, -s / 2, s, s * 0.7);
      // Fire debris gets a glow trail
      if (d.fire) {
        ctx.globalAlpha = alpha * 0.4;
        ctx.fillStyle = "#ff6622";
        ctx.beginPath();
        ctx.arc(0, 0, s * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

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

  // ── Exit zone — visual indicator (parkour mode OR "open" state after clearing) ──
  if (g.objective && g.objective.exitZone && (g.objective.type === "parkour" || g.roomState === "open")) {
    const ez = g.objective.exitZone;
    const pulse = 0.6 + Math.sin(g.time.elapsed * 4) * 0.2;
    if (ez.bgRoom) {
      // Background room: bright golden forest-path light (sunlight through trees)
      const cx = ez.x + ez.w / 2;
      const groundY = H * 0.87; // approximate ground for bg rooms
      // Wide warm light column — very visible
      const lightW = ez.w + 40;
      const lightGrad = ctx.createLinearGradient(cx, 0, cx, groundY);
      lightGrad.addColorStop(0, `rgba(255,220,120,0)`);
      lightGrad.addColorStop(0.15, `rgba(255,220,120,${0.1 * pulse})`);
      lightGrad.addColorStop(0.4, `rgba(255,200,100,${0.2 * pulse})`);
      lightGrad.addColorStop(0.7, `rgba(255,180,80,${0.3 * pulse})`);
      lightGrad.addColorStop(1, `rgba(255,160,60,${0.15 * pulse})`);
      ctx.fillStyle = lightGrad;
      ctx.fillRect(cx - lightW / 2, 0, lightW, groundY + 10);
      // Bright radial glow at ground level
      const glowR = ez.w * 1.5;
      const glowGrad = ctx.createRadialGradient(cx, groundY - 15, 8, cx, groundY - 15, glowR);
      glowGrad.addColorStop(0, `rgba(255,220,120,${0.4 * pulse})`);
      glowGrad.addColorStop(0.4, `rgba(255,200,100,${0.2 * pulse})`);
      glowGrad.addColorStop(1, "rgba(255,180,80,0)");
      ctx.fillStyle = glowGrad;
      ctx.fillRect(cx - glowR, groundY - glowR, glowR * 2, glowR * 2);
      // Ground path highlight
      ctx.fillStyle = `rgba(255,200,100,${0.2 * pulse})`;
      ctx.fillRect(ez.x - 5, groundY - 3, ez.w + 10, 6);
      // Floating light motes — more and brighter
      ctx.globalAlpha = pulse * 0.9;
      for (let i = 0; i < 8; i++) {
        const t = g.time.elapsed * 0.8 + i * 0.9;
        const mx = cx + Math.sin(t * 1.2 + i * 2.1) * (ez.w * 0.6);
        const my = groundY - 20 - (t * 25 % (groundY * 0.6));
        const mSize = 2 + Math.sin(t * 3) * 0.8;
        ctx.fillStyle = "#ffe888";
        ctx.beginPath();
        ctx.arc(mx, my, mSize, 0, Math.PI * 2);
        ctx.fill();
        // Glow halo
        ctx.fillStyle = `rgba(255,232,136,0.3)`;
        ctx.beginPath();
        ctx.arc(mx, my, mSize * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // Clear "EXIT →" text with backdrop
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "center";
      const txtY = groundY - 20;
      ctx.fillStyle = `rgba(0,0,0,${0.3 * pulse})`;
      ctx.fillRect(cx - 32, txtY - 11, 64, 16);
      ctx.fillStyle = `rgba(255,220,140,${0.85 * pulse})`;
      ctx.fillText("EXIT →", cx, txtY);
    } else {
      // Standard rooms: cool blue vertical beam
      const beamGrad = ctx.createLinearGradient(ez.x, 0, ez.x, g.groundY);
      beamGrad.addColorStop(0, `rgba(100,220,255,0)`);
      beamGrad.addColorStop(0.3, `rgba(100,220,255,${0.15 * pulse})`);
      beamGrad.addColorStop(0.7, `rgba(100,220,255,${0.25 * pulse})`);
      beamGrad.addColorStop(1, `rgba(100,220,255,${0.1 * pulse})`);
      ctx.fillStyle = beamGrad;
      ctx.fillRect(ez.x, 0, ez.w, g.groundY + 20);
      // Ground glow
      ctx.fillStyle = `rgba(100,220,255,${0.3 * pulse})`;
      ctx.fillRect(ez.x - 5, g.groundY - 2, ez.w + 10, 4);
      // "EXIT" text
      ctx.font = `bold 14px monospace`;
      ctx.textAlign = "center";
      ctx.fillStyle = `rgba(100,220,255,${0.7 * pulse})`;
      ctx.fillText("EXIT", ez.x + ez.w / 2, g.groundY - 10);
    }
  }

  // ── In-game encounter speech bubble ──
  if (g.encounterActive && g.encounterText) {
    const et = g.encounterText;
    const bubbleX = et.x;
    const bubbleY = et.y - 30;
    const maxW = 280;
    // Speech bubble background
    ctx.fillStyle = "rgba(10,10,20,0.9)";
    const bw = maxW;
    const bh = et.textJp ? 50 : 32;
    ctx.fillRect(bubbleX - bw / 2, bubbleY - bh / 2, bw, bh);
    ctx.strokeStyle = "#cc993366";
    ctx.lineWidth = 1;
    ctx.strokeRect(bubbleX - bw / 2, bubbleY - bh / 2, bw, bh);
    // Japanese text (smaller, above)
    if (et.textJp) {
      ctx.font = "11px 'Noto Sans JP',sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#aaaacc";
      ctx.fillText(et.textJp, bubbleX, bubbleY - 6);
    }
    // English text
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(et.text, bubbleX, bubbleY + (et.textJp ? 14 : 4));
  }

  // ── Foreground parallax layer (renders OVER world objects) ──
  if (g._fgLayerKey) {
    const fgImg = getImage(g._fgLayerKey);
    if (fgImg) {
      const fgScale = Math.max(W / fgImg.width, H / fgImg.height);
      const fgW = fgImg.width * fgScale;
      const fgH = fgImg.height * fgScale;
      const maxCxFg = Math.max(1, g.levelW - W);
      const fgPanRange = Math.max(0, fgW - W);
      const fgPanX = fgPanRange > 0 ? -(cx / maxCxFg) * fgPanRange * 1.2 : 0; // 1.2x = faster than camera
      ctx.globalAlpha = 0.6;
      ctx.drawImage(fgImg, fgPanX, -(fgH - H) * 0.3, fgW, fgH);
      ctx.globalAlpha = 1;
    }
  }

  ctx.restore(); // end camera

  // End zoom transform (before HUD — HUD stays unzoomed)
  if (zoom !== 1) ctx.restore();

  // Reset slow-mo desaturation filter before post-processing/HUD
  if (isSlowMo) ctx.filter = "none";

  // Post-processing
  if (g.flashTimer > 0) {
    ctx.fillStyle = `rgba(255,255,255,${(g.flashTimer / 60) * 0.2})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (g.slowMo.active) {
    if (isBackflipSlowMo) {
      // Backflip: clean cinematic vignette — no purple, just dramatic focus
      const progress = 1 - g.slowMo._backflipSlowMo / 0.7;
      const intensity = progress < 0.08 ? progress / 0.08
        : progress < 0.7 ? 1
        : 1 - ((progress - 0.7) / 0.3) ** 2;
      // Dark vignette (draws eye to center where the flip is)
      const vigAlpha = intensity * 0.45;
      const vigGrad = ctx.createRadialGradient(W / 2, H / 2, W * 0.25, W / 2, H / 2, W * 0.65);
      vigGrad.addColorStop(0, "rgba(0,0,0,0)");
      vigGrad.addColorStop(0.6, "rgba(0,0,0,0)");
      vigGrad.addColorStop(1, `rgba(0,0,0,${vigAlpha})`);
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, W, H);
      // Subtle warm tint (moonlit blade flash, not purple)
      ctx.fillStyle = `rgba(255,240,200,${intensity * 0.04})`;
      ctx.fillRect(0, 0, W, H);
    } else {
      // Regular slow-mo: purple overlay + chromatic aberration
      ctx.fillStyle = "rgba(60,40,160,0.25)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(255,50,50,0.08)";
      ctx.fillRect(0, 0, 8, H);
      ctx.fillStyle = "rgba(50,50,255,0.08)";
      ctx.fillRect(W - 8, 0, 8, H);
      // Radial zoom lines from center
      ctx.save();
      ctx.globalAlpha = 0.06;
      ctx.strokeStyle = "#8060cc";
      ctx.lineWidth = 1;
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(W / 2 + Math.cos(angle) * W * 0.15, H / 2 + Math.sin(angle) * H * 0.15);
        ctx.lineTo(W / 2 + Math.cos(angle) * W * 0.5, H / 2 + Math.sin(angle) * H * 0.5);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // Last kill cam visual effects
  if (g.lastKillCam) {
    const cam = g.lastKillCam;
    if (cam.phase === "hold") {
      // Chromatic aberration during hold
      ctx.fillStyle = "rgba(255,50,50,0.06)";
      ctx.fillRect(0, 0, 12, H);
      ctx.fillStyle = "rgba(50,50,255,0.06)";
      ctx.fillRect(W - 12, 0, 12, H);
      // Subtle dark vignette
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(0, 0, W, H);
    } else if (cam.phase === "resume") {
      // Speed lines radiating from kill point during resume
      const kx = cam.targetX - (g.camera.x || 0);
      const ky = cam.targetY;
      const t = (cam.timer - 700) / 500;
      ctx.save();
      ctx.globalAlpha = 0.15 * (1 - t); // fade out as time resumes
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const inner = 30 + t * 60;
        const outer = 80 + t * W * 0.4;
        ctx.beginPath();
        ctx.moveTo(kx + Math.cos(angle) * inner, ky + Math.sin(angle) * inner);
        ctx.lineTo(kx + Math.cos(angle) * outer, ky + Math.sin(angle) * outer);
        ctx.stroke();
      }
      ctx.restore();
    }
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

  // ── Monochrome freeze death effect ──
  if (g.player && g.player.dead && g.deathPhase !== undefined) {
    if (g.deathPhase === 0) {
      // Phase 0: white flash (fading out)
      const flashAlpha = Math.max(0, (g.deathPhaseTimer - 1700) / 300);
      ctx.fillStyle = `rgba(255,255,255,${flashAlpha * 0.5})`;
      ctx.fillRect(0, 0, W, H);
    } else if (g.deathPhase === 1) {
      // Phase 1: full grayscale — desaturate the scene
      ctx.fillStyle = "rgba(0,0,20,0.15)";
      ctx.fillRect(0, 0, W, H);
      // Draw grayscale overlay by compositing
      ctx.save();
      ctx.globalCompositeOperation = "saturation";
      ctx.fillStyle = "hsl(0,0%,50%)";
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    } else if (g.deathPhase === 2) {
      // Phase 2: grayscale + fade to black
      ctx.save();
      ctx.globalCompositeOperation = "saturation";
      ctx.fillStyle = "hsl(0,0%,50%)";
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      const fadeAlpha = 1 - Math.max(0, g.deathPhaseTimer / 400);
      ctx.fillStyle = `rgba(0,0,0,${fadeAlpha})`;
      ctx.fillRect(0, 0, W, H);
    } else if (g.deathPhase === 3) {
      // Phase 3: ink brush wipe — calligraphy stroke sweeps across screen
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, W, H); // black background behind wipe
      const wipeX = (g.brushWipe || 0);
      // Draw brush stroke sweeping left to right
      ctx.save();
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      const sweepW = W * wipeX;
      // Wavy brush stroke edge using quadratic curves
      ctx.moveTo(0, 0);
      ctx.lineTo(sweepW, 0);
      const edgeX = sweepW;
      for (let y = 0; y <= H; y += H / 4) {
        const wave = Math.sin(y * 0.02 + wipeX * 8) * 20;
        ctx.lineTo(edgeX + wave, y);
      }
      ctx.lineTo(edgeX, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // ── Room transition — ink brush wipe between rooms ──
  if (g.roomTransition) {
    const t = g.roomTransition;
    if (t.phase === "wipeIn") {
      // Brush stroke sweeps left to right, covering screen
      ctx.fillStyle = "#000000";
      const sweepW = W * t.progress;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(sweepW, 0);
      for (let y = 0; y <= H; y += H / 5) {
        const wave = Math.sin(y * 0.025 + t.progress * 10) * 25;
        ctx.lineTo(sweepW + wave, y);
      }
      ctx.lineTo(sweepW, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fill();
    } else if (t.phase === "hold") {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, W, H);
    } else if (t.phase === "wipeOut") {
      // Brush clears right to left, revealing new room
      ctx.fillStyle = "#000000";
      const clearW = W * (1 - t.progress);
      ctx.beginPath();
      ctx.moveTo(W, 0);
      ctx.lineTo(clearW, 0);
      for (let y = 0; y <= H; y += H / 5) {
        const wave = Math.sin(y * 0.025 + t.progress * 10) * 25;
        ctx.lineTo(clearW + wave, y);
      }
      ctx.lineTo(clearW, H);
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();
    }
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
    const objType = g.objective ? g.objective.type : "killAll";
    const objLabel = objType === "parkour" ? "REACH THE EXIT" : objType === "survive" ? "SURVIVE ALL WAVES" : "CLEAR ALL ENEMIES";
    const subtitle = `ROOM ${g.currentRoom + 1}  —  ${objLabel}`;
    ctx.fillText(subtitle, W / 2 + xOff, H * 0.35 + 24);
    ctx.restore();
  }

  // Fog is now rendered as parallax mist layers inside renderBackground

  // ── Tutorial prompt ──
  if (g.activeTutorial && g.activeTutorial.timer > 0) {
    const tut = g.activeTutorial;
    const fadeIn = Math.min(1, (4000 - tut.timer) / 300);
    const fadeOut = Math.min(1, tut.timer / 300);
    const alpha = Math.min(fadeIn, fadeOut);
    ctx.save();
    ctx.globalAlpha = alpha * 0.85;
    // Dark banner background
    const bannerY = H * 0.82;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, bannerY - 18, W, 36);
    // Tutorial text
    ctx.globalAlpha = alpha;
    ctx.font = `bold 14px ${font}`;
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffdd44";
    ctx.fillText(tut.text, W / 2, bannerY + 5);
    ctx.restore();
  }

  // ── In-world dialogue box (screen space, after all world rendering) ──
  if (g.activeDialogue) {
    const d = g.activeDialogue;
    const line = d.lines[d.index];
    if (line) {
      const CHAR_COLORS = { sensei: "#cc9933", player: "#cc4444", shadow: "#aa44cc", elder: "#44aa66", kunoichi: "#cc4488", katsura: "#aa8833", hacker: "#44ccaa", fox: "#ff8844", system: "#888899" };
      const CHAR_NAMES = { sensei: "SENSEI", player: "TINYSENPAI", shadow: "SHADOW", elder: "ELDER", kunoichi: "KUNOICHI", katsura: "LORD KATSURA", hacker: "HACKER", fox: "FOX SPIRIT" };
      const color = CHAR_COLORS[line.speaker] || "#888899";
      const isSystem = line.speaker === "system";
      const fullText = line.text || "";
      const displayText = d.typingDone ? fullText : fullText.slice(0, d.typedChars);
      const panelH = H * 0.2;
      const panelY = H - panelH;
      // Panel background
      const panelGrad = ctx.createLinearGradient(0, panelY, 0, H);
      panelGrad.addColorStop(0, "rgba(6,6,14,0.88)");
      panelGrad.addColorStop(1, "rgba(6,6,14,0.96)");
      ctx.fillStyle = panelGrad;
      ctx.fillRect(0, panelY, W, panelH);
      ctx.fillStyle = color + "30";
      ctx.fillRect(0, panelY, W, 2);
      const padX = Math.min(28, W * 0.04);
      const textW = Math.min(660, W - padX * 2);
      const textX = (W - textW) / 2;
      // Speaker name
      if (!isSystem) {
        ctx.font = `bold 11px ${font}`;
        ctx.fillStyle = color;
        ctx.fillText("— " + (CHAR_NAMES[line.speaker] || line.speaker.toUpperCase()), textX, panelY + 18);
        const nameW = ctx.measureText("— " + (CHAR_NAMES[line.speaker] || "")).width;
        ctx.fillStyle = color + "15";
        ctx.fillRect(textX + nameW + 10, panelY + 14, textW - nameW - 10, 1);
      }
      // Japanese text
      if (line.textJp) {
        ctx.font = `13px "Noto Sans JP",sans-serif`;
        ctx.fillStyle = color + "77";
        const jpDisplay = d.typingDone ? line.textJp : line.textJp.slice(0, Math.floor(d.typedChars * (line.textJp.length / Math.max(1, fullText.length))));
        ctx.fillText(jpDisplay, textX, panelY + 36);
      }
      // English text
      ctx.font = `16px "Noto Sans JP",sans-serif`;
      ctx.fillStyle = "#e8e6e0";
      ctx.fillText(displayText, textX, panelY + (line.textJp ? 56 : 40));
      // Cursor
      if (!d.typingDone) {
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.fillText("▌", textX + ctx.measureText(displayText).width + 3, panelY + (line.textJp ? 56 : 40));
      }
      // Progress + advance prompt
      if (d.typingDone) {
        ctx.textAlign = "right";
        ctx.font = `10px ${font}`;
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.fillText(`${d.index + 1}/${d.lines.length}  ▶`, textX + textW, panelY + panelH - 10);
        ctx.textAlign = "left";
      }
    }
  }

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
// Crops scaled for 256px sprites (were 1024px, now 256px — divide by 4)
const F = { x: 5, y: 5, w: 246, h: 246 }; // full frame crop
const CROPS = {
  idle:      { ...F, R: false },
  run1:      { ...F, R: false },
  run2:      { ...F, R: false },
  run3:      { ...F, R: false },
  run4:      { ...F, R: false },
  slash1:    { ...F, R: false },
  slash2:    { ...F, R: false },
  slash3:    { ...F, R: false },
  slash4:    { x: 20, y: 25, w: 215, h: 200, R: true },
  jump1:     { ...F, R: false },
  jump2:     { ...F, R: true },
  fall:      { ...F, R: true },
  wallslide:     { ...F, R: true },
  wall_cling:    { ...F, R: false },
  dash:          { ...F, R: false },
  death1:        { ...F, R: false },
  death2:        { ...F, R: false },
  parry:         { ...F, R: false },
  land_heavy:    { ...F, R: false },
  slash_through: { ...F, R: true },
  wall_climb1:   { ...F, R: true },
  wall_climb2:   { ...F, R: true },
  wall_pushoff:  { ...F, R: false },
  backflip:      { ...F, R: true },
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

  if (p.wallSliding && !p._wallRunning) {
    // Use wall_cling only — wallslide.png has baked-in wall texture (skip during wall run)
    const img = getImage("wall_cling") || getImage("jump1");
    if (img) {
      const crop = CROPS.wall_cling || CROPS.wallslide;
      const wallFacing = -p.wallDir;
      if (crop.R ? (wallFacing < 0) : (wallFacing > 0)) ctx.scale(-1, 1);
      ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, -DRAW_W / 2, -DRAW_H + FOOT_NUDGE, DRAW_W, DRAW_H);
      ctx.restore();
      return;
    }
  }

  // Wall run — climb sprites facing INTO the wall
  if (p.state === "wall_run") {
    // Alternate climb frames every 100ms for running-up-wall animation
    const climbFrame = Math.floor((p._wallRunTimer || 0) / 100) % 2 === 0 ? "wall_climb1" : "wall_climb2";
    const img = getImage(climbFrame) || getImage("wall_cling") || getImage("jump1");
    if (img) {
      const crop = CROPS[climbFrame] || CROPS.wall_cling || CROPS.wallslide;
      // Face INTO the wall (not away) — wallDir points toward wall
      const wallFacing = p.wallDir;
      if (crop.R ? (wallFacing < 0) : (wallFacing > 0)) ctx.scale(-1, 1);
      ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, -DRAW_W / 2, -DRAW_H + FOOT_NUDGE, DRAW_W, DRAW_H);
      ctx.restore();
      return;
    }
  }

  // Backflip — single clean 360° spin with locked facing direction
  if (p.state === "backflip") {
    const flipProgress = 1 - (p._backflipTimer || 0) / 700; // 0→1 (700ms flip)
    // Use locked facing from launch (prevents mid-flip direction change)
    const flipDir = p._backflipFacing || p.facing;
    const rotation = flipProgress * Math.PI * 2 * flipDir; // single 360° rotation
    ctx.rotate(rotation);
    const img = getImage("backflip") || getImage("jump2") || getImage("jump1");
    const cropKey = getImage("backflip") ? "backflip" : "jump2";
    if (drawSpriteFrame(ctx, img, cropKey, s, flipDir)) { ctx.restore(); return; }
  }

  if (p.state === "dash") {
    // Use slash-through sprite during dash-slash, regular dash otherwise
    if (p.dashSlashing) {
      const img = getImage("slash_through");
      if (drawSpriteFrame(ctx, img, "slash_through", s, p.facing)) { ctx.restore(); return; }
    }
    const img = getImage("dash");
    if (drawSpriteFrame(ctx, img, "dash", s, p.facing)) { ctx.restore(); return; }
  }

  // Parry flash — white overlay using parry sprite
  if (p.parryTimer > 0) {
    const img = getImage("parry");
    if (img) {
      ctx.globalAlpha = Math.min(1, p.parryTimer / 150);
      if (drawSpriteFrame(ctx, img, "parry", s, p.facing)) { ctx.restore(); return; }
    }
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
const EC = { x: 5, y: 5, w: 246, h: 246 }; // default full crop (256px sprites)

// State → sprite key mapping per enemy type
// R: false = faces left, R: true = faces right
const ENEMY_SPRITE_MAP = {
  dummy: {
    idle:    { key: "dummy_idle", R: true },
    patrol:  { key: "dummy_idle", R: true },
    chase:   { key: "dummy_idle", R: true },
    alert:   { key: "dummy_idle", R: true },
    attack_windup: { key: "dummy_idle", R: true },
    attack_strike: { key: "dummy_idle", R: true },
    dazed:   { key: "dummy_hit", R: true },
    cooldown:{ key: "dummy_idle", R: true },
    kneel:   { key: "dummy_hit", R: true },
    dead:    { key: "dummy_dead", R: true },
    hit:     { key: "dummy_hit", R: true },
    kb_back: { key: "dummy_dead", R: true },
    kb_tumble:{ key: "dummy_dead", R: true },
    kb_seated:{ key: "dummy_dead", R: true },
    fallback: "dummy_idle",
  },
  oni: {
    idle:    { key: "oni_idle", R: false },
    patrol:  { frames: ["oni_walk1", "oni_walk2"], R: false },
    chase:   { frames: ["oni_walk1", "oni_walk2"], R: false },
    alert:   { key: "oni_alert", R: false },
    block:   { key: "oni_windup", R: false }, // reuse windup sprite for block stance
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
    idle:    { key: "samurai_idle", R: false },
    patrol:  { frames: ["samurai_walk1", "samurai_walk2"], R: false },
    chase:   { frames: ["samurai_walk1", "samurai_walk2"], R: false },
    alert:   { key: "samurai_alert", R: false },
    attack_windup: { key: "samurai_windup", R: false },
    attack_strike: { key: "samurai_attack", R: false },
    dazed:   { key: "samurai_dazed", R: false },
    cooldown:{ key: "samurai_idle", R: false },
    kneel:   { key: "samurai_kneel", R: false },
    dead:    { key: "samurai_dead", R: false },
    hit:     { key: "samurai_hit", R: false },
    kb_back: { key: "samurai_kb_back", R: false },
    kb_tumble:{ key: "samurai_kb_tumble", R: false },
    kb_seated:{ key: "samurai_kb_seated", R: false },
    fallback: "samurai_idle",
  },
  // ── New enemy types ──
  ronin: {
    idle:    { key: "ronin_idle", R: false },
    patrol:  { frames: ["ronin_walk1", "ronin_walk2"], R: false },
    chase:   { frames: ["ronin_walk1", "ronin_walk2"], R: false },
    alert:   { key: "ronin_alert", R: false },
    attack_strike: { key: "ronin_attack", R: false },
    dazed:   { key: "ronin_dazed", R: false },
    cooldown:{ key: "ronin_idle", R: false },
    kneel:   { key: "ronin_kneel", R: false },
    dead:    { key: "ronin_dead", R: false },
    hit:     { key: "ronin_hit", R: false },
    kb_back: { key: "ronin_kb_back", R: false },
    kb_tumble:{ key: "ronin_kb_tumble", R: false },
    kb_seated:{ key: "ronin_kb_seated", R: false },
    fallback: "ronin_idle",
  },
  cyber_ninja: {
    idle:    { key: "cyber_ninja_idle", R: false },
    patrol:  { frames: ["cyber_ninja_walk1", "cyber_ninja_walk2"], R: false },
    chase:   { frames: ["cyber_ninja_walk1", "cyber_ninja_walk2"], R: false },
    alert:   { key: "cyber_ninja_alert", R: false },
    attack_strike: { key: "cyber_ninja_attack", R: false },
    dazed:   { key: "cyber_ninja_dazed", R: false },
    cooldown:{ key: "cyber_ninja_idle", R: false },
    kneel:   { key: "cyber_ninja_kneel", R: false },
    dead:    { key: "cyber_ninja_dead", R: false },
    hit:     { key: "cyber_ninja_hit", R: false },
    kb_back: { key: "cyber_ninja_kb_back", R: false },
    kb_tumble:{ key: "cyber_ninja_kb_tumble", R: false },
    kb_seated:{ key: "cyber_ninja_kb_seated", R: false },
    fallback: "cyber_ninja_idle",
  },
  bouncer: {
    idle:    { key: "bouncer_idle", R: false },
    patrol:  { frames: ["bouncer_walk1", "bouncer_walk2"], R: false },
    chase:   { frames: ["bouncer_walk1", "bouncer_walk2"], R: false },
    alert:   { key: "bouncer_alert", R: false },
    charge:  { key: "bouncer_charge", R: false },
    attack_strike: { key: "bouncer_attack", R: false },
    dazed:   { key: "bouncer_dazed", R: false },
    cooldown:{ key: "bouncer_idle", R: false },
    kneel:   { key: "bouncer_kneel", R: false },
    dead:    { key: "bouncer_dead", R: false },
    hit:     { key: "bouncer_hit", R: false },
    kb_back: { key: "bouncer_kb_back", R: false },
    kb_seated:{ key: "bouncer_kb_seated", R: false },
    fallback: "bouncer_idle",
  },
  monk: {
    idle:    { key: "monk_idle", R: false },
    patrol:  { frames: ["monk_walk1", "monk_walk2"], R: false },
    chase:   { frames: ["monk_walk1", "monk_walk2"], R: false },
    alert:   { key: "monk_alert", R: false },
    attack_strike: { key: "monk_attack", R: false },
    block:   { key: "monk_block", R: false },
    dazed:   { key: "monk_dazed", R: false },
    cooldown:{ key: "monk_idle", R: false },
    kneel:   { key: "monk_kneel", R: false },
    dead:    { key: "monk_dead", R: false },
    hit:     { key: "monk_hit", R: false },
    kb_back: { key: "monk_kb_back", R: false },
    kb_seated:{ key: "monk_kb_seated", R: false },
    fallback: "monk_idle",
  },
  spirit_fox: {
    idle:    { key: "spirit_fox_idle", R: false },
    patrol:  { key: "spirit_fox_idle", R: false },
    chase:   { key: "spirit_fox_idle", R: false },
    alert:   { key: "spirit_fox_alert", R: false },
    swoop:   { key: "spirit_fox_attack", R: false },
    hover:   { key: "spirit_fox_idle", R: false },
    dazed:   { key: "spirit_fox_dazed", R: false },
    hit:     { key: "spirit_fox_hit", R: false },
    dead:    { key: "spirit_fox_dead", R: false },
    fallback: "spirit_fox_idle",
  },
  cursed_ronin: {
    idle:    { key: "cursed_ronin_idle", R: false },
    patrol:  { frames: ["cursed_ronin_walk1", "cursed_ronin_walk2"], R: false },
    chase:   { frames: ["cursed_ronin_walk1", "cursed_ronin_walk2"], R: false },
    alert:   { key: "cursed_ronin_alert", R: false },
    attack_strike: { key: "cursed_ronin_attack", R: false },
    dash:    { key: "cursed_ronin_dash", R: false },
    dazed:   { key: "cursed_ronin_dazed", R: false },
    cooldown:{ key: "cursed_ronin_idle", R: false },
    kneel:   { key: "cursed_ronin_kneel", R: false },
    dead:    { key: "cursed_ronin_dead", R: false },
    hit:     { key: "cursed_ronin_hit", R: false },
    kb_back: { key: "cursed_ronin_kb_back", R: false },
    kb_seated:{ key: "cursed_ronin_kb_seated", R: false },
    fallback: "cursed_ronin_idle",
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
    const frame = stateEntry.frames[frameIdx];
    // Support per-frame R overrides: frame can be string or {key, R}
    if (typeof frame === "object") return { key: frame.key, R: frame.R };
    return { key: frame, R: stateEntry.R };
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
    drawEnemyOverlays(ctx, e, elapsed, font);
    // Hit flash — white overlay blink when wounded (non-lethal hit)
    if (e._hitFlash > 0) {
      const flashAlpha = Math.min(1, e._hitFlash / 150) * 0.6;
      ctx.save();
      ctx.globalAlpha = flashAlpha;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(e.x - DRAW_SIZE / 2, e.y, DRAW_SIZE, DRAW_SIZE);
      ctx.restore();
    }
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

  if (e.type === "dummy") {
    // ── TRAINING DUMMY — wooden post with straw target ──
    const woodColor = "#8B6914";
    const woodDark = "#5C4A0E";
    const strawColor = "#D4A854";
    const strawDark = "#A87A32";
    // Main post
    ctx.fillStyle = woodDark;
    ctx.fillRect(-6, -10, 12, 68);
    ctx.fillStyle = woodColor;
    ctx.fillRect(-4, -8, 8, 64);
    // Cross beam (arms)
    ctx.fillStyle = woodDark;
    ctx.fillRect(-22, 10, 44, 6);
    ctx.fillStyle = woodColor;
    ctx.fillRect(-20, 11, 40, 4);
    // Straw head/target (round)
    ctx.fillStyle = strawDark;
    ctx.beginPath();
    ctx.arc(0, -2, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = strawColor;
    ctx.beginPath();
    ctx.arc(0, -3, 12, 0, Math.PI * 2);
    ctx.fill();
    // Target circles
    ctx.strokeStyle = "#c44";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -3, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -3, 3, 0, Math.PI * 2);
    ctx.stroke();
    // Straw wrapping on body
    ctx.fillStyle = strawDark;
    ctx.fillRect(-10, 20, 20, 12);
    ctx.fillStyle = strawColor;
    ctx.fillRect(-8, 22, 16, 8);
    // Base
    ctx.fillStyle = woodDark;
    ctx.fillRect(-14, 54, 28, 6);
    // Hit reaction — lean back
    if (e._hitFlash > 0) {
      ctx.rotate(-0.15);
    }
    drawEnemyOverlays(ctx, e, elapsed, font);
    ctx.restore();
    return;
  }

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
  } else if (e.type === "archer") {
    // ── ARCHER — hooded, longbow, elevated sniper ──
    const cloakColor = "#2a4a3a";
    const skinColor = "#e8c090";

    // Body / cloak
    ctx.fillStyle = cloakColor;
    ctx.fillRect(-10, 22, 20, 22);
    ctx.fillStyle = "#1e3a2a";
    ctx.fillRect(-12, 20, 24, 4); // cloak shoulders

    // Legs
    ctx.fillStyle = "#1e3a2a";
    ctx.fillRect(-7, 44, 5, 14 + legSwing);
    ctx.fillRect(2, 44, 5, 14 - legSwing);

    // Head
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(0, 14, 11, 0, Math.PI * 2);
    ctx.fill();

    // Hood
    ctx.fillStyle = cloakColor;
    ctx.beginPath();
    ctx.moveTo(-14, 18);
    ctx.lineTo(0, -2);
    ctx.lineTo(14, 18);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-14, 14, 28, 6);

    // Eyes (glowing green)
    ctx.fillStyle = "#44ff66";
    ctx.fillRect(-4, 12, 3, 2);
    ctx.fillRect(1, 12, 3, 2);

    // Longbow
    ctx.strokeStyle = "#8b6840";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(f * 16, 25, 22, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.stroke();
    ctx.strokeStyle = "#ccccaa";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(f * 16, 25 - 20);
    ctx.lineTo(f * 16, 25 + 20);
    ctx.stroke();

    // Throw animation — arm extended with arrow
    if (e.throwAnim > 0) {
      ctx.fillStyle = skinColor;
      ctx.fillRect(f * 8, 22, f * 16, 3);
      ctx.fillStyle = "#8b6840";
      ctx.fillRect(f * 12, 23, f * 20, 1.5); // arrow
      ctx.fillStyle = "#aabbcc";
      ctx.beginPath();
      ctx.moveTo(f * 32, 23); ctx.lineTo(f * 28, 21); ctx.lineTo(f * 28, 26);
      ctx.closePath();
      ctx.fill();
    }

  } else if (e.type === "brute") {
    // ── BRUTE — huge, armored ogre, 3HP, charges ──
    const armorColor = "#3a2020";
    const skinColor = "#cc9977";

    // Large body
    ctx.fillStyle = armorColor;
    ctx.fillRect(-18, 16, 36, 32);
    // Chest plate
    ctx.fillStyle = "#552222";
    ctx.fillRect(-14, 18, 28, 12);
    ctx.fillStyle = "#884422";
    ctx.fillRect(-14, 18, 28, 2); // gold trim

    // Thick legs
    ctx.fillStyle = armorColor;
    ctx.fillRect(-12, 48, 10, 14 + legSwing);
    ctx.fillRect(2, 48, 10, 14 - legSwing);

    // Big head
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(0, 8, 16, 0, Math.PI * 2);
    ctx.fill();

    // Angry eyes (red)
    ctx.fillStyle = "#ff2222";
    ctx.fillRect(-7, 6, 4, 4);
    ctx.fillRect(3, 6, 4, 4);
    // Heavy brow
    ctx.fillStyle = "#332211";
    ctx.fillRect(-9, 2, 7, 3);
    ctx.fillRect(2, 2, 7, 3);

    // Horns
    ctx.fillStyle = "#aa8844";
    ctx.beginPath();
    ctx.moveTo(-12, 0); ctx.lineTo(-18, -14); ctx.lineTo(-8, -2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(12, 0); ctx.lineTo(18, -14); ctx.lineTo(8, -2);
    ctx.closePath();
    ctx.fill();

    // Big club/kanabo
    ctx.fillStyle = "#555555";
    ctx.fillRect(f * 18, 4, 6, 50);
    ctx.fillStyle = "#777777";
    ctx.fillRect(f * 18, 4, 6, 3);
    // Spikes on club
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = "#999999";
      ctx.fillRect(f * 18 + (f > 0 ? 5 : -2), 14 + i * 10, 3, 3);
    }

    // Arms
    ctx.fillStyle = skinColor;
    ctx.fillRect(-20, 20, 6, 16);
    ctx.fillRect(14, 20, 6, 16);

    // Charge effect — red aura
    if (e.state === "charge") {
      ctx.globalAlpha = 0.3 + Math.sin(elapsed * 20) * 0.15;
      ctx.fillStyle = "#ff2222";
      ctx.beginPath();
      ctx.arc(0, 28, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Exhausted — steam/sweat
    if (e.state === "exhausted" || e.dazed > 0) {
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = "#aaccff";
      for (let i = 0; i < 3; i++) {
        const sx = -10 + i * 10;
        const sy = -20 - Math.sin(elapsed * 4 + i) * 5;
        ctx.fillRect(sx, sy, 3, 3);
      }
      ctx.globalAlpha = 1;
    }

  } else if (e.type === "tengu") {
    // ── TENGU — flying crow demon, red face, black wings ──
    const bodyColor = "#1a1a2a";
    const faceColor = "#cc3333";
    const wingBob = Math.sin(elapsed * 8) * 8;

    // Wings (spread, flapping)
    ctx.fillStyle = bodyColor;
    // Left wing
    ctx.beginPath();
    ctx.moveTo(-8, 22);
    ctx.lineTo(-35, 10 + wingBob);
    ctx.lineTo(-30, 30 + wingBob * 0.5);
    ctx.lineTo(-8, 32);
    ctx.closePath();
    ctx.fill();
    // Right wing
    ctx.beginPath();
    ctx.moveTo(8, 22);
    ctx.lineTo(35, 10 + wingBob);
    ctx.lineTo(30, 30 + wingBob * 0.5);
    ctx.lineTo(8, 32);
    ctx.closePath();
    ctx.fill();

    // Body
    ctx.fillStyle = "#222238";
    ctx.fillRect(-10, 20, 20, 22);

    // Talons
    ctx.fillStyle = "#666";
    ctx.fillRect(-6, 42, 4, 8);
    ctx.fillRect(2, 42, 4, 8);

    // Head
    ctx.fillStyle = faceColor;
    ctx.beginPath();
    ctx.arc(0, 12, 12, 0, Math.PI * 2);
    ctx.fill();

    // Long nose (tengu trademark)
    ctx.fillStyle = "#dd4444";
    ctx.beginPath();
    ctx.moveTo(f * 6, 12);
    ctx.lineTo(f * 22, 14);
    ctx.lineTo(f * 6, 16);
    ctx.closePath();
    ctx.fill();

    // Eyes (yellow, menacing)
    ctx.fillStyle = "#ffff00";
    ctx.fillRect(-5, 9, 4, 3);
    ctx.fillRect(1, 9, 4, 3);
    ctx.fillStyle = "#000";
    ctx.fillRect(-4, 10, 2, 2);
    ctx.fillRect(2, 10, 2, 2);

    // Feathered head crest
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(-8, 4);
    ctx.lineTo(0, -10);
    ctx.lineTo(8, 4);
    ctx.closePath();
    ctx.fill();

    // Swoop dive trail
    if (e.state === "swoop") {
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = "#ff4444";
      ctx.beginPath();
      ctx.arc(0, 28, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  drawEnemyOverlays(ctx, e, elapsed, font);
  ctx.restore();
}

function drawEnemyOverlays(ctx, e, elapsed, font) {
  ctx.save();
  ctx.translate(Math.round(e.x), Math.round(e.y));

  // Detection state indicators (stealth system)
  if (!e.dead) {
    if (e.detection === "alert") {
      // Red "!" — fully alert, chasing
      const pulse = 0.7 + Math.sin(elapsed * 8) * 0.3;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = "#ff3333";
      ctx.font = `bold 20px ${font}`;
      ctx.textAlign = "center";
      ctx.shadowColor = "#ff0000";
      ctx.shadowBlur = 12;
      ctx.fillText("!", 0, -14);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    } else if (e.detection === "suspicious") {
      // Yellow "?" — searching, investigating
      const bob = Math.sin(elapsed * 4) * 3;
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = "#ffaa00";
      ctx.font = `bold 18px ${font}`;
      ctx.textAlign = "center";
      ctx.shadowColor = "#ffaa00";
      ctx.shadowBlur = 8;
      ctx.fillText("?", 0, -14 + bob);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    } else if (e.alert > 0) {
      // Legacy alert indicator (backward compat)
      const alertAlpha = Math.min(1, e.alert / 200);
      ctx.globalAlpha = alertAlpha;
      ctx.fillStyle = "#ff4444";
      ctx.font = `bold 16px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText("!", 0, -8);
      ctx.globalAlpha = 1;
    }
    // Suspicion bar (thin bar showing detection progress)
    if (e.suspicion > 0 && e.suspicion < 100 && e.detection !== "alert") {
      const barW = 30, barH = 3;
      const fill = e.suspicion / 100;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(-barW / 2, -20, barW, barH);
      ctx.fillStyle = fill > 0.5 ? "#ff6600" : "#ffaa00";
      ctx.fillRect(-barW / 2, -20, barW * fill, barH);
    }
  }

  // HP pips (samurai: 2HP, brute: 3HP)
  const maxHp = e.type === "brute" ? 3 : e.type === "samurai" ? 2 : 0;
  if (maxHp > 0 && !e.dead) {
    const pipW = 8, gap = maxHp === 3 ? 10 : 12;
    const startX = -(maxHp * gap) / 2;
    const pipColor = e.type === "brute" ? "#cc4422" : "#cc9933";
    const pipHighlight = e.type === "brute" ? "#ff6644" : "#ffcc66";
    for (let i = 0; i < maxHp; i++) {
      ctx.fillStyle = i < e.hp ? pipColor : "#333344";
      ctx.fillRect(startX + i * gap, -12, pipW, 4);
      if (i < e.hp) {
        ctx.fillStyle = pipHighlight;
        ctx.fillRect(startX + i * gap, -12, pipW, 1);
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

  // Windup telegraph — big "!" with red glow (oni pauses before attack)
  if (e.state === "windup" && !e.dead) {
    const pulse = 0.7 + Math.sin(elapsed * 25) * 0.3;
    // Red glow circle behind "!"
    ctx.globalAlpha = pulse * 0.3;
    ctx.fillStyle = "#ff2222";
    ctx.beginPath();
    ctx.arc(0, -14, 12, 0, Math.PI * 2);
    ctx.fill();
    // Big bold "!"
    ctx.globalAlpha = pulse;
    ctx.fillStyle = "#ff3333";
    ctx.font = `bold 20px ${font}`;
    ctx.textAlign = "center";
    ctx.fillText("!", 0, -6);
    ctx.globalAlpha = 1;
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

// ═══ THEME PALETTES ═══
const THEME_PALETTES = {
  forest: {
    sky: ["#05050e", "#0a0a1e", "#0e0a20", "#0d0a18"],
    ground: "#08080f", groundEdge: "rgba(40,80,60,0.12)",
    platAccent: "#3a8a5a", platBase: "#1a2a20", platDark: "#0e1a14",
    wallBase: "#141e18", wallDark: "#0a120e",
    star: "#ffffff", fogColor: "rgba(8,12,18,",
    farBldg: "#0c0c1a", midBldg: "#10101e", windowColor: "rgba(255,200,100,0.2)",
  },
  temple: {
    sky: ["#0a0508", "#1a0a14", "#200e18", "#180a10"],
    ground: "#0a0608", groundEdge: "rgba(120,40,60,0.15)",
    platAccent: "#aa4455", platBase: "#2a1a1e", platDark: "#1a0e12",
    wallBase: "#1e1418", wallDark: "#120a0e",
    star: "#ffddcc", fogColor: "rgba(18,8,12,",
    farBldg: "#120810", midBldg: "#1a0e16", windowColor: "rgba(255,160,80,0.15)",
  },
  neon: {
    sky: ["#020208", "#040418", "#080828", "#0a0820"],
    ground: "#040410", groundEdge: "rgba(60,40,160,0.2)",
    platAccent: "#6644cc", platBase: "#161630", platDark: "#0c0c1e",
    wallBase: "#14142a", wallDark: "#0a0a1a",
    star: "#aaccff", fogColor: "rgba(6,4,18,",
    farBldg: "#080818", midBldg: "#0c0c24", windowColor: "rgba(100,150,255,0.25)",
  },
  dojo: {
    sky: ["#0a0806", "#100c08", "#140e0a", "#0e0a06"],
    ground: "#0a0806", groundEdge: "rgba(100,70,40,0.15)",
    platAccent: "#8a6a3a", platBase: "#2a1e14", platDark: "#1a120c",
    wallBase: "#1e1610", wallDark: "#12100a",
    star: "#000000", // no stars — indoor
    fogColor: "rgba(14,10,6,",
    farBldg: "#0c0a06", midBldg: "#100e08", windowColor: "rgba(255,160,80,0.1)",
  },
  // ── New zones ──
  edo: {
    sky: ["#0c0806", "#1a1008", "#241810", "#1e140a"],
    ground: "#0c0806", groundEdge: "rgba(140,100,60,0.12)",
    platAccent: "#c4963a", platBase: "#2a1e14", platDark: "#1a120c",
    wallBase: "#201810", wallDark: "#14100a",
    star: "#ffeecc", fogColor: "rgba(14,10,6,",
    farBldg: "#100c06", midBldg: "#1a140a", windowColor: "rgba(255,180,80,0.2)",
  },
  neonTokyo: {
    sky: ["#020210", "#040428", "#080840", "#060630"],
    ground: "#040410", groundEdge: "rgba(80,40,200,0.25)",
    platAccent: "#ff44aa", platBase: "#1a1030", platDark: "#0e0820",
    wallBase: "#16102a", wallDark: "#0c081a",
    star: "#6688ff", fogColor: "rgba(4,2,16,",
    farBldg: "#080820", midBldg: "#0e0e30", windowColor: "rgba(255,60,180,0.3)",
  },
  nightclub: {
    sky: ["#020008", "#040018", "#080028", "#060020"],
    ground: "#020008", groundEdge: "rgba(200,40,200,0.2)",
    platAccent: "#aa22ff", platBase: "#18082a", platDark: "#0e041a",
    wallBase: "#140822", wallDark: "#0a0414",
    star: "#000000", // indoor — no stars
    fogColor: "rgba(4,0,12,",
    farBldg: "#060014", midBldg: "#0a0020", windowColor: "rgba(200,40,255,0.25)",
  },
  spirit: {
    sky: ["#0a0812", "#140e20", "#1e1430", "#181028"],
    ground: "#0a0810", groundEdge: "rgba(100,80,200,0.15)",
    platAccent: "#8866cc", platBase: "#1e1630", platDark: "#120e20",
    wallBase: "#181228", wallDark: "#0e0a1a",
    star: "#ccaaff", fogColor: "rgba(10,6,18,",
    farBldg: "#0c0818", midBldg: "#141028", windowColor: "rgba(150,100,255,0.2)",
  },
};

function getTheme(g) {
  // Check room-level theme first, then act theme
  const room = (g._rooms || [])[g.currentRoom];
  if (room && room.theme) return THEME_PALETTES[room.theme] || THEME_PALETTES.forest;
  // Derive from act
  if (g.currentRoom >= 15) return THEME_PALETTES.temple;
  return THEME_PALETTES.forest;
}

// ═══ BACKGROUND ═══
function renderBackground(ctx, W, H, cx, g) {
  const groundY = g.groundY;
  const pal = getTheme(g);
  const room = (g._rooms || [])[g.currentRoom];
  const t = g.time.elapsed;
  const maxCx = Math.max(1, g.levelW - W);

  // ── Multi-layer parallax system ──
  // Rooms can define bg: { far, mid, near, fg, tint } for 4-layer parallax
  // Falls back to single background image for backward compatibility
  const roomBg = room?.bg;

  if (roomBg && (roomBg.far || roomBg.mid || roomBg.near)) {
    // Multi-layer mode: each layer scrolls at different speed
    const layers = [
      { key: roomBg.far,  speed: 0.1 },  // slowest — distant mountains/skyline
      { key: roomBg.mid,  speed: 0.3 },  // medium — mid-ground buildings
      { key: roomBg.near, speed: 0.6 },  // fast — near objects
    ];
    for (const layer of layers) {
      const img = layer.key ? getImage(layer.key) : null;
      if (!img) continue;
      const scaleW = W / img.width;
      const scaleH = H / img.height;
      const bgScale = Math.max(scaleW, scaleH);
      const bgW = img.width * bgScale;
      const bgH = img.height * bgScale;
      const panRange = Math.max(0, bgW - W);
      const panX = panRange > 0 ? -(cx / maxCx) * panRange * layer.speed : 0;
      const panY = -(bgH - H) * 0.3;
      ctx.drawImage(img, panX, panY, bgW, bgH);
    }
    // Tint overlay
    if (roomBg.tint) {
      ctx.fillStyle = roomBg.tint;
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = "rgba(5,8,15,0.15)";
      ctx.fillRect(0, 0, W, H);
    }
  } else {
    // Single-image fallback (backward compatible with existing rooms)
    const bgKey = (room && room.theme === "dojo") ? "bg_dojo" : (g.currentRoom >= 15 ? "bg_temple" : "bg_forest");
    const bgImg = getImage(bgKey) || getImage("bg_forest");

    if (bgImg) {
      // Overscale by shake padding so camera shake never reveals edges
      const shakePad = 12;
      const scaleW = (W + shakePad * 2) / bgImg.width;
      const scaleH = (H + shakePad * 2) / bgImg.height;
      const bgScale = Math.max(scaleW, scaleH);
      const bgW = bgImg.width * bgScale;
      const bgH = bgImg.height * bgScale;
      const panRange = Math.max(0, bgW - W);
      const panX = (panRange > 0 ? -(cx / maxCx) * panRange : 0) - shakePad;
      const panY = -(bgH - H) * 0.3 - shakePad;
      ctx.drawImage(bgImg, panX, panY, bgW, bgH);
      ctx.fillStyle = "rgba(5,8,15,0.2)";
      ctx.fillRect(0, 0, W, H);
    }
  }

  // Store foreground layer key for rendering AFTER world objects
  g._fgLayerKey = roomBg?.fg || null;

  // Check if ANY background was drawn (image or multi-layer)
  const hasBg = roomBg ? !!(roomBg.far || roomBg.mid || roomBg.near) : !!getImage((room && room.theme === "dojo") ? "bg_dojo" : "bg_forest");
  if (hasBg) {

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
    // In bg rooms, use actual ground platform Y (not engine groundY which doesn't match)
    const isBgRoom = g.levelW <= W;
    const floorPlat = isBgRoom ? g.platforms.reduce((a, b) => (!a.wall && !b.wall && b.y > a.y) ? b : a, g.platforms[0]) : null;
    const floorY = floorPlat ? floorPlat.y : groundY;
    const floorMinX = floorPlat ? floorPlat.x : 0;
    const floorMaxX = floorPlat ? floorPlat.x + floorPlat.w : W;
    for (let i = 0; i < 6; i++) {
      const px = ((i * 317 + 100) % (W + 200)) - cx * 0.95 % (W + 200);
      const pw = 25 + hash(i, 42) * 30;
      if (px < -pw || px > W + pw) continue;
      // Skip puddles outside the ground platform (inside walls)
      if (isBgRoom && (px < floorMinX + 10 || px > floorMaxX - 10)) continue;
      // Dark puddle ellipse
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "#1a2a30";
      ctx.beginPath();
      ctx.ellipse(px, floorY + 6, pw, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      // Expanding ripple rings
      const ripplePhase = (t * 2 + i * 1.3) % 1.5;
      if (ripplePhase < 1) {
        const r = ripplePhase * pw * 0.8;
        ctx.globalAlpha = (1 - ripplePhase) * 0.15;
        ctx.strokeStyle = "#5588aa";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.ellipse(px + hash(i, 7) * 10 - 5, floorY + 6, r, r * 0.3, 0, 0, Math.PI * 2);
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
        ctx.ellipse(px + hash(i, 9) * 8 - 4, floorY + 6, r2, r2 * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    // Fog at ground level blending into platforms
    const fogGrad = ctx.createLinearGradient(0, floorY - 40, 0, floorY + 14);
    fogGrad.addColorStop(0, "rgba(8,12,18,0)");
    fogGrad.addColorStop(0.5, "rgba(8,12,18,0.6)");
    fogGrad.addColorStop(1, "rgba(6,8,12,0.95)");
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, floorY - 40, W, 54);

  } else {
    // ── Fallback: procedural background (theme-aware) ──
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, pal.sky[0]);
    sky.addColorStop(0.4, pal.sky[1]);
    sky.addColorStop(0.8, pal.sky[2]);
    sky.addColorStop(1, pal.sky[3]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Stars
    ctx.fillStyle = pal.star;
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
      ctx.fillStyle = pal.farBldg;
      ctx.fillRect(x, groundY - bh, bw, bh);
    }

    // Mid buildings (parallax 0.3)
    const bx2 = -cx * 0.3;
    for (let i = 0; i < 14; i++) {
      const bw = 28 + ((i * 43) % 55);
      const bh = 35 + ((i * 67) % 110);
      const x = ((i * 130 + 20 + bx2) % (W + 400) + W + 400) % (W + 400) - 100;
      ctx.fillStyle = pal.midBldg;
      ctx.fillRect(x, groundY - bh, bw, bh);
      ctx.fillStyle = pal.windowColor;
      for (let wy = groundY - bh + 22; wy < groundY - 8; wy += 14) {
        for (let wx = x + 5; wx < x + bw - 5; wx += 9) {
          if (hash(i * 100 + Math.floor(wx), Math.floor(wy)) > 0.4) ctx.fillRect(wx, wy, 4, 5);
        }
      }
    }
  }

  // Ground (shared by both, theme-aware)
  ctx.fillStyle = pal.ground;
  ctx.fillRect(0, groundY + 14, W, H - groundY);
  ctx.fillStyle = pal.groundEdge;
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
  } else if (d.type === "scroll") {
    // Hanging wall scroll with calligraphy
    ctx.fillStyle = "#2a2218";
    ctx.fillRect(d.x - 2, groundY - 95, 4, 55);
    // Scroll paper
    ctx.fillStyle = "#e8dcc8";
    ctx.fillRect(d.x - 10, groundY - 90, 20, 45);
    ctx.fillStyle = "#d4c8b0";
    ctx.fillRect(d.x - 10, groundY - 90, 20, 2);
    ctx.fillRect(d.x - 10, groundY - 47, 20, 2);
    // Calligraphy brush strokes
    const kanji = ["道", "武", "心", "忍", "気"][Math.floor(hash(d.x, 1) * 5)];
    ctx.fillStyle = "#1a1008";
    ctx.font = "16px serif";
    ctx.textAlign = "center";
    ctx.fillText(kanji, d.x, groundY - 62);
    // Wooden dowels top and bottom
    ctx.fillStyle = "#4a3828";
    ctx.fillRect(d.x - 12, groundY - 92, 24, 3);
    ctx.fillRect(d.x - 12, groundY - 46, 24, 3);
  } else if (d.type === "weapon_rack") {
    // Wooden weapon display stand
    ctx.fillStyle = "#3a2a1a";
    // Vertical posts
    ctx.fillRect(d.x - 18, groundY - 75, 4, 75);
    ctx.fillRect(d.x + 14, groundY - 75, 4, 75);
    // Horizontal bars
    ctx.fillStyle = "#4a3828";
    ctx.fillRect(d.x - 20, groundY - 70, 40, 3);
    ctx.fillRect(d.x - 20, groundY - 45, 40, 3);
    // Katana on upper rack (angled)
    ctx.save();
    ctx.translate(d.x, groundY - 63);
    ctx.rotate(-0.15);
    ctx.fillStyle = "#888899";
    ctx.fillRect(-14, -1, 28, 2); // blade
    ctx.fillStyle = "#332211";
    ctx.fillRect(-16, -2, 5, 4); // handle
    ctx.restore();
    // Shorter weapon on lower rack
    ctx.save();
    ctx.translate(d.x, groundY - 38);
    ctx.rotate(0.1);
    ctx.fillStyle = "#777788";
    ctx.fillRect(-10, -1, 20, 2);
    ctx.fillStyle = "#332211";
    ctx.fillRect(-12, -2, 5, 4);
    ctx.restore();
  } else if (d.type === "incense") {
    // Incense burner with smoke wisps
    ctx.fillStyle = "#554433";
    ctx.fillRect(d.x - 6, groundY - 12, 12, 12);
    ctx.fillStyle = "#665544";
    ctx.fillRect(d.x - 8, groundY - 14, 16, 4);
    // Smoke wisps rising
    const t = elapsed * 0.8 + d.x * 0.1;
    for (let i = 0; i < 3; i++) {
      const wy = groundY - 20 - i * 12 - (t * 8 % 40);
      const wx = d.x + Math.sin(t * 2 + i * 1.5) * 4;
      const alpha = Math.max(0, 0.2 - i * 0.06);
      ctx.fillStyle = `rgba(180,170,160,${alpha})`;
      ctx.beginPath();
      ctx.arc(wx, wy, 3 + i, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (d.type === "cushion") {
    // Zabuton floor cushion
    ctx.fillStyle = "#6a2233";
    ctx.fillRect(d.x - 10, groundY - 5, 20, 5);
    ctx.fillStyle = "#7a3344";
    ctx.fillRect(d.x - 9, groundY - 6, 18, 2);
  } else if (d.type === "sliding_door") {
    // Shoji sliding door frame
    ctx.fillStyle = "#3a2a1a";
    ctx.fillRect(d.x - 25, groundY - 95, 4, 95);
    ctx.fillRect(d.x + 21, groundY - 95, 4, 95);
    ctx.fillRect(d.x - 25, groundY - 95, 50, 3);
    // Paper panels
    ctx.fillStyle = "rgba(200,195,180,0.15)";
    ctx.fillRect(d.x - 21, groundY - 92, 42, 88);
    // Grid lines
    ctx.strokeStyle = "rgba(60,50,35,0.3)";
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(d.x - 21 + i * 14, groundY - 92);
      ctx.lineTo(d.x - 21 + i * 14, groundY - 4);
      ctx.stroke();
    }
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(d.x - 21, groundY - 92 + i * 22);
      ctx.lineTo(d.x + 21, groundY - 92 + i * 22);
      ctx.stroke();
    }
  } else if (d.type === "beam") {
    // Wooden ceiling beam (horizontal)
    ctx.fillStyle = "#3a2818";
    ctx.fillRect(d.x - 30, groundY - 100, 60, 6);
    ctx.fillStyle = "#2a1a0a";
    ctx.fillRect(d.x - 30, groundY - 94, 60, 2);
  }
}

// ═══ HUD ═══
function renderHUD(ctx, g, W, isDesktop, font) {
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
  // Objective-specific HUD
  const objType = g.objective ? g.objective.type : "killAll";
  if (objType === "parkour" && g.roomState === "playing") {
    // Big countdown timer
    const cd = Math.max(0, g.objective.countdown);
    const urgent = cd < 5;
    ctx.font = `bold ${urgent ? 32 : 24}px ${font}`;
    ctx.textAlign = "center";
    ctx.fillStyle = urgent ? "#ff4444" : "#44ddff";
    if (urgent) {
      ctx.shadowColor = "#ff4444";
      ctx.shadowBlur = 15;
    }
    ctx.fillText(`${cd.toFixed(1)}s`, W / 2, 60);
    ctx.shadowBlur = 0;
  } else if (objType === "survive") {
    const obj = g.objective;
    const waveText = obj.currentWave >= obj.totalWaves
      ? `FINAL WAVE` : `WAVE ${Math.min(obj.currentWave + 1, obj.totalWaves)}/${obj.totalWaves}`;
    ctx.font = `bold 14px ${font}`;
    ctx.textAlign = "center";
    ctx.fillStyle = "#ff6644";
    ctx.fillText(waveText, W / 2, 54);
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
    // ── Prominent combo display — center-right with glow + pulse ──
    const comboScale = Math.min(1.5, 1 + (g.comboTimer / 1500) * 0.5);
    const comboX = W - 80;
    const comboY = isDesktop ? 100 : 80;
    // Color progression: white → yellow → orange → red
    const comboColors = ["#ffffff", "#ffee44", "#ffaa30", "#ff6622", "#ff3311"];
    const colorIdx = Math.min(comboColors.length - 1, Math.floor((g.combo - 1) / 2));
    const comboColor = comboColors[colorIdx];
    // Glow
    ctx.save();
    ctx.translate(comboX, comboY);
    ctx.scale(comboScale, comboScale);
    ctx.shadowColor = comboColor;
    ctx.shadowBlur = 15 + g.combo * 2;
    ctx.font = `bold 48px ${font}`;
    ctx.textAlign = "center";
    ctx.fillStyle = comboColor;
    ctx.fillText(`${g.combo}`, 0, 0);
    ctx.shadowBlur = 0;
    // Japanese milestone names
    const milestones = { 2: "二連", 3: "三連", 5: "五連", 10: "十連", 15: "十五連", 20: "二十連" };
    const mName = milestones[g.combo];
    if (mName) {
      ctx.font = `bold 16px ${font}`;
      ctx.fillStyle = comboColor + "cc";
      ctx.fillText(mName, 0, 22);
    } else {
      ctx.font = `bold 12px ${font}`;
      ctx.fillStyle = comboColor + "88";
      ctx.fillText("COMBO", 0, 18);
    }
    // Decay bar
    const decayW = 60;
    const decayH = 3;
    const decayFill = Math.max(0, g.comboTimer / 2000);
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = "#333344";
    ctx.fillRect(-decayW / 2, 26, decayW, decayH);
    ctx.fillStyle = comboColor;
    ctx.fillRect(-decayW / 2, 26, decayW * decayFill, decayH);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Score multiplier indicator
  if (g.slowMo && g.slowMo.active) {
    ctx.font = `bold 18px ${font}`;
    ctx.textAlign = "left";
    ctx.shadowColor = "#b8a0ff";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#b8a0ff";
    ctx.fillText("1.5x", 16, 74);
    ctx.shadowBlur = 0;
  } else if (g.combo > 2) {
    ctx.font = `bold 14px ${font}`;
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffa04088";
    ctx.fillText(`x${g.combo} CHAIN`, 16, 74);
  }

  // Ink Curse meter — fueled by kills, spent on slow-mo
  const mW = 100, mH = 8, mX = W - mW - 16, mY = 20;
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(mX, mY, mW, mH);
  const fill = g.slowMo.meter / g.slowMo.max;
  // Meter color: empty=dark, has meter=purple glow, active=bright
  const meterPulse = fill > 0.2 ? 0.7 + Math.sin(g.time.elapsed * 4) * 0.3 : 0.5;
  ctx.fillStyle = g.slowMo.active ? `rgba(184,160,255,${meterPulse})` : fill > 0 ? "#6e3080" : "#2a1a30";
  ctx.fillRect(mX, mY, mW * fill, mH);
  // Glow when meter is available
  if (fill > 0.2 && !g.slowMo.active) {
    ctx.shadowColor = "#8844cc";
    ctx.shadowBlur = 8;
    ctx.fillRect(mX, mY, mW * fill, mH);
    ctx.shadowBlur = 0;
  }
  ctx.strokeStyle = "#3a3a5a";
  ctx.lineWidth = 1;
  ctx.strokeRect(mX, mY, mW, mH);
  ctx.font = `9px ${font}`;
  ctx.fillStyle = fill > 0.2 ? "#bb99ee" : "#5a4a6a";
  ctx.textAlign = "right";
  ctx.fillText("墨", mX - 6, mY + 8); // 墨 = ink (the curse)

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
