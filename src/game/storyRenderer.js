// ═══ CANVAS STORY RENDERER ═══
// Replaces the React JSX story overlay with canvas-rendered scenes.
// Characters stand in pixel-art environments, text box at bottom.
// Katana Zero-style: characters in scene, typing animation, voice blips, choices.

import { getImage } from "./sprites.js";
import { CHARACTERS, getSceneConfig, ROOM_CHOICES } from "./story.js";
import { playVoiceBlip, playSound } from "./audio.js";

// ── Text wrapping helper ──
function wrapText(ctx, text, maxW) {
  const words = text.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// ── Particle system for story scenes ──
const _particles = [];
function ensureParticles(type, W, H) {
  if (_particles.length >= 20) return;
  for (let i = _particles.length; i < 20; i++) {
    _particles.push({
      x: Math.random() * W,
      y: Math.random() * H * 0.8,
      vx: (Math.random() - 0.3) * 15,
      vy: type === "embers" ? -(10 + Math.random() * 30) : (type === "leaves" ? (8 + Math.random() * 15) : -(3 + Math.random() * 8)),
      size: type === "leaves" ? 3 + Math.random() * 3 : 2 + Math.random() * 2,
      life: Math.random(),
      maxLife: 3 + Math.random() * 4,
      type,
    });
  }
}

function updateParticles(dt, W, H) {
  for (let i = _particles.length - 1; i >= 0; i--) {
    const p = _particles[i];
    p.life += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.life > p.maxLife || p.y < -20 || p.y > H + 20 || p.x < -20 || p.x > W + 20) {
      p.x = Math.random() * W;
      p.y = p.type === "embers" ? H + 10 : (p.type === "leaves" ? -10 : H * 0.3 + Math.random() * H * 0.5);
      p.life = 0;
    }
  }
}

function drawParticles(ctx) {
  const colors = { dust: "#aa996680", leaves: "#44aa4460", embers: "#ff662280", petals: "#ff88aa60" };
  for (const p of _particles) {
    const alpha = Math.sin((p.life / p.maxLife) * Math.PI);
    ctx.globalAlpha = alpha * 0.5;
    ctx.fillStyle = colors[p.type] || colors.dust;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ═══ UPDATE STORY STATE ═══
export function updateStory(g, rawDt, callbacks) {
  const s = g.story;
  if (!s || !s.lines || s.lines.length === 0) return;

  const line = s.lines[s.index];
  if (!line) return;

  // Fade-out transition — darken screen then end story
  if (s._fadeOut !== undefined) {
    s._fadeOut += rawDt * 1.5; // ~0.7s fade
    if (s._fadeOut >= 1) {
      advanceStory(g, callbacks); // will now proceed past the isLast check
    }
    return;
  }

  // Entrance animation — block everything until characters are in position
  if (s.entrance && s.entrance.active) {
    s.entrance.timer += rawDt;
    // Footstep sounds during walk-in (~4 steps per second)
    s.entrance._stepTimer = (s.entrance._stepTimer || 0) + rawDt;
    if (s.entrance._stepTimer > 0.25) {
      s.entrance._stepTimer = 0;
      playSound("footstep");
    }
    if (s.entrance.timer >= s.entrance.duration) {
      s.entrance.active = false;
    }
    updateParticles(rawDt, g.W, g.H);
    s.bobTimer = (s.bobTimer || 0) + rawDt;
    return; // don't type or accept input during entrance
  }

  const fullText = line.text || "";

  // Typing animation
  if (!s.typingDone) {
    s.timer += rawDt;
    const charsToShow = Math.floor(s.timer / 0.03);
    if (charsToShow > s.typedChars) {
      // Play voice blip for new chars
      for (let c = s.typedChars; c < Math.min(charsToShow, fullText.length); c++) {
        const ch = fullText[c];
        if (ch && ch !== ' ' && ch !== '.' && ch !== ',' && ch !== '…' && ch !== '!' && ch !== '?') {
          playVoiceBlip(line.speaker);
          break; // one blip per frame max
        }
      }
      s.typedChars = Math.min(charsToShow, fullText.length);
    }
    if (s.typedChars >= fullText.length) {
      s.typingDone = true;
    }
  }

  // Choice timer countdown
  if (s.choices && s.choiceTimer > 0 && s.typingDone) {
    s.choiceTimer -= rawDt;
    if (s.choiceTimer <= 0) {
      // Auto-select first choice
      selectChoice(g, 0, callbacks);
    }
  }

  // Character bob animation
  s.bobTimer = (s.bobTimer || 0) + rawDt;

  // Update particles
  updateParticles(rawDt, g.W, g.H);

  // Handle input
  const inp = g.input;
  if (inp.storyAdvance) {
    inp.storyAdvance = false;
    advanceStory(g, callbacks);
  }

  // Number key choice selection
  if (s.choices && s.typingDone) {
    if (inp.choice1) { inp.choice1 = false; selectChoice(g, 0, callbacks); }
    if (inp.choice2) { inp.choice2 = false; selectChoice(g, 1, callbacks); }
    if (inp.choice3) { inp.choice3 = false; selectChoice(g, 2, callbacks); }
    // Arrow keys navigate
    if (inp.choiceUp) {
      inp.choiceUp = false;
      s.choiceIndex = Math.max(0, (s.choiceIndex || 0) - 1);
    }
    if (inp.choiceDown) {
      inp.choiceDown = false;
      s.choiceIndex = Math.min((s.choices.length || 1) - 1, (s.choiceIndex || 0) + 1);
    }
    // Enter/space confirms highlighted
    if (inp.choiceConfirm) {
      inp.choiceConfirm = false;
      selectChoice(g, s.choiceIndex || 0, callbacks);
    }
  }
}

function selectChoice(g, index, callbacks) {
  const s = g.story;
  if (!s.choices || index >= s.choices.length) return;
  const choice = s.choices[index];
  playSound("sfx_choice_select");
  // Apply flag
  if (choice.flag) g.choices[choice.flag] = true;
  // Apply effect
  if (choice.effect) {
    for (const [k, v] of Object.entries(choice.effect)) {
      if (k === "slowMoBonus") g.slowMo.max += v;
    }
  }
  s.choices = null;
  s.choiceTimer = 0;
  // Advance to next line or end
  advanceStory(g, callbacks);
}

function advanceStory(g, callbacks) {
  const s = g.story;
  if (!s) return;

  // If not done typing, skip to end
  if (!s.typingDone) {
    s.typedChars = (s.lines[s.index]?.text || "").length;
    s.typingDone = true;
    return;
  }

  // If choices are active, don't advance
  if (s.choices) return;

  const isLast = s.index >= s.lines.length - 1;

  if (isLast) {
    // Story complete — start fade-out, then load room
    if (!s._fadeOut) {
      s._fadeOut = 0;
      playSound("sfx_text_advance");
      return; // don't end yet — let fade play
    }
    // Fade is handled in render — when it reaches 1.0, we proceed
    g.story = null;
    g.gameState = "playing";
    if (g._pendingRoom !== null && g._pendingRoom !== undefined) {
      g._loadRoomAfterStory = g._pendingRoom;
      g._pendingRoom = null;
    }
    g._resumeFromStory = true;
  } else {
    playSound("sfx_text_advance");
    s.index++;

    // Skip lines whose conditions aren't met
    while (s.index < s.lines.length) {
      const nextLine = s.lines[s.index];
      if (!nextLine.condition) break; // no condition — show it
      const flag = nextLine.condition.flag;
      if (flag.startsWith("!")) {
        // Negation: show if flag is NOT set
        if (!g.choices[flag.slice(1)]) break;
      } else {
        // Show if flag IS set
        if (g.choices[flag]) break;
      }
      s.index++; // condition not met, skip this line
    }

    // Check if we skipped past the end
    if (s.index >= s.lines.length) {
      playSound("sfx_text_advance");
      g.story = null;
      g.gameState = "playing";
      if (g._pendingRoom !== null && g._pendingRoom !== undefined) {
        g._loadRoomAfterStory = g._pendingRoom;
        g._pendingRoom = null;
      }
      g._resumeFromStory = true;
      return;
    }

    s.typedChars = 0;
    s.typingDone = false;
    s.timer = 0;

    // Check if this line triggers a choice
    const roomChoices = ROOM_CHOICES[g._storyRoomIndex];
    if (roomChoices && roomChoices.after === s.index) {
      s.choices = roomChoices.options;
      s.choiceIndex = 0;
      s.choiceTimer = 8; // 8 second timer
      s._choiceAnim = 0; // reset slide-in animation
      playSound("sfx_choice_appear");
    }
  }
}

// ═══ RENDER STORY SCENE ═══
export function renderStoryScene(ctx, g, W, H, font) {
  const s = g.story;
  if (!s || !s.lines) return;

  const line = s.lines[s.index];
  if (!line) return;

  const scene = s.sceneConfig;
  const char = CHARACTERS[line.speaker] || CHARACTERS.system;
  const isSystem = line.speaker === "system";
  const fullText = line.text || "";
  const displayText = s.typingDone ? fullText : fullText.slice(0, s.typedChars);

  // ── 1. Background image or gradient fallback ──
  const bgImg = scene.bgKey ? getImage(scene.bgKey) : null;
  if (bgImg) {
    // COVER mode: scale image to fill entire screen, crop excess
    const imgAspect = bgImg.width / bgImg.height;
    const screenAspect = W / H;
    let dw, dh, dx, dy;
    if (screenAspect > imgAspect) {
      // Screen is wider than image — scale to width, crop top/bottom
      dw = W;
      dh = W / imgAspect;
      dx = 0;
      dy = (H - dh) / 2;
    } else {
      // Screen is taller than image — scale to height, crop sides
      dh = H;
      dw = H * imgAspect;
      dx = (W - dw) / 2;
      dy = 0;
    }
    ctx.drawImage(bgImg, dx, dy, dw, dh);

    // Darken overlay for readability
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0, 0, W, H);
  } else {
    // Gradient fallback
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    const colors = scene.gradientColors || ["#1a1510", "#14100c", "#0e0a06"];
    colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // ── 2. Vignette ──
  const vGrad = ctx.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, W * 0.7);
  vGrad.addColorStop(0, "transparent");
  vGrad.addColorStop(1, "rgba(0,0,0,0.6)");
  ctx.fillStyle = vGrad;
  ctx.fillRect(0, 0, W, H);

  // ── 3. Atmospheric particles ──
  ensureParticles(scene.particleType || "dust", W, H);
  drawParticles(ctx);

  // ── 4. Scanlines ──
  ctx.fillStyle = "rgba(0,0,0,0.04)";
  for (let y = 0; y < H; y += 4) {
    ctx.fillRect(0, y, W, 2);
  }

  // ── 5. Scene label (watermark) ──
  if (scene.label) {
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.font = `${Math.min(36, W * 0.05)}px "Noto Sans JP",sans-serif`;
    ctx.fillText(scene.label, W / 2, H * 0.1);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.font = `${Math.min(11, W * 0.015)}px ${font}`;
    ctx.fillText(scene.labelEn || "", W / 2, H * 0.1 + 20);
    ctx.textAlign = "left";
  }

  // ── 6. Letterbox bars ──
  const barH = H * 0.06;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, barH);
  ctx.fillRect(0, H - barH, W, barH);

  // ── 7. Characters in scene ──
  // Use ACTUAL in-game sprites scaled up with pixelated rendering.
  const panelH = H * 0.22; // dialogue panel height
  const panelY = H - panelH;
  const groundLevel = scene.groundLevel || 0.78; // match background floor level
  const floorY = Math.min(H * groundLevel, panelY - 5); // feet on background floor, above panel
  const charH = Math.min(110, H * 0.17); // proportional to backgrounds
  const bob = 0; // no bobbing — characters stand still

  // Determine who's in this scene
  const speakers = [...new Set(s.lines.map(l => l.speaker).filter(x => x !== "system"))];
  const leftChar = speakers.includes("player") ? "player" : speakers[0] || null;
  const rightChar = speakers.find(x => x !== leftChar) || null;
  const activeSide = line.speaker === leftChar ? "left" : (line.speaker === rightChar ? "right" : "both");

  // Entrance animation progress (0→1)
  const entranceT = s.entrance && s.entrance.active
    ? Math.min(1, s.entrance.timer / s.entrance.duration)
    : 1;
  // easeOutCubic for natural deceleration
  const easeT = 1 - Math.pow(1 - entranceT, 3);

  // Map character keys to their ACTUAL in-game sprite keys
  const CHAR_SPRITE_MAP = {
    player: "player",       // the actual TinySenpai idle sprite
    sensei: "story_sensei_idle",
    shadow: "story_shadow_idle",
    elder:  "story_elder_idle",
  };
  // Emotion variants — try story sprite first, fallback to base
  const getCharSprite = (charKey, emotion) => {
    if (charKey === "player") {
      // Player always uses the ACTUAL in-game sprite for consistency
      return getImage("player");
    }
    // Try emotion variant first
    if (emotion) {
      const emotionMap = { serious: "serious", amused: "amused", angry: "angry", bitter: "bitter", concerned: "concerned" };
      if (emotionMap[emotion]) {
        const img = getImage(`story_${charKey}_${emotionMap[emotion]}`);
        if (img) return img;
      }
    }
    return getImage(CHAR_SPRITE_MAP[charKey]) || getImage(`story_${charKey}_idle`);
  };

  const drawChar = (charKey, side, isActive) => {
    if (!charKey) return;
    const charInfo = CHARACTERS[charKey];
    if (!charInfo) return;

    // Position: centered in each half, with entrance slide-in
    const finalX = side === "left" ? W * 0.32 : W * 0.72;
    const startX = side === "left" ? W * -0.1 : W * 1.1;
    // Check if this character should already be in place
    const charEntrance = scene.entrance?.[side === "left" ? "left" : "right"];
    const shouldAnimate = charEntrance !== "already_there" && charEntrance !== "fade_in";
    const x = shouldAnimate ? startX + (finalX - startX) * easeT : finalX;
    // Fade-in for characters with fade entrance
    if (charEntrance === "fade_in" && entranceT < 1) {
      ctx.globalAlpha = Math.min(ctx.globalAlpha, easeT);
    }
    const emotion = isActive ? line.emotion : null;
    // During walk-in entrance, use walk sprites instead of idle
    const isWalking = shouldAnimate && s.entrance?.active && entranceT < 1;
    let sprite;
    if (isWalking) {
      const walkFrame = Math.floor((s.entrance?.timer || 0) * 6) % 2 === 0 ? "walk1" : "walk2";
      if (charKey === "player") {
        // Player uses actual gameplay run sprites for walking
        const runFrame = (Math.floor((s.entrance?.timer || 0) * 8) % 4) + 1;
        sprite = getImage("run" + runFrame) || getImage("player");
      } else {
        sprite = getImage(`story_${charKey}_${walkFrame}`) || getCharSprite(charKey, emotion);
      }
    } else {
      sprite = getCharSprite(charKey, emotion);
    }

    ctx.save();
    if (!isActive) ctx.globalAlpha = 0.6;

    if (sprite) {
      const aspect = sprite.width / sprite.height;
      const drawH = charH;
      const drawW = drawH * aspect;
      const drawX = x - drawW / 2;
      const drawY = floorY - drawH + (isActive ? bob : 0);

      // Flip player sprite to face right (sprites face left by default)
      ctx.imageSmoothingEnabled = false;
      if (side === "left") {
        // Player faces right — flip horizontally
        ctx.save();
        ctx.translate(drawX + drawW, drawY);
        ctx.scale(-1, 1);
        // Glow for active speaker
        if (isActive) { ctx.shadowColor = charInfo.color; ctx.shadowBlur = 20; }
        ctx.drawImage(sprite, 0, 0, drawW, drawH);
        ctx.restore();
      } else {
        // NPC faces left (default sprite direction)
        if (isActive) { ctx.shadowColor = charInfo.color; ctx.shadowBlur = 20; }
        ctx.drawImage(sprite, drawX, drawY, drawW, drawH);
      }
      ctx.imageSmoothingEnabled = true;
      ctx.shadowBlur = 0;

      // Name plate below character
      ctx.textAlign = "center";
      ctx.font = `bold 12px "Noto Sans JP",sans-serif`;
      ctx.fillStyle = isActive ? charInfo.color : charInfo.color + "60";
      ctx.fillText(charInfo.nameEn || charInfo.name || "", x, floorY + 16);
      ctx.textAlign = "left";
    } else {
      // Fallback: large colored kanji silhouette
      const kanji = charInfo.name?.[0] || "?";
      const fy = floorY - charH * 0.6 + (isActive ? bob : 0);
      ctx.textAlign = "center";
      ctx.font = `bold ${charH * 0.6}px "Noto Sans JP",sans-serif`;
      if (isActive) { ctx.shadowColor = charInfo.color; ctx.shadowBlur = 25; }
      ctx.fillStyle = charInfo.color;
      ctx.fillText(kanji, x, fy + charH * 0.5);
      ctx.shadowBlur = 0;
      // Name
      ctx.font = `bold 12px "Noto Sans JP",sans-serif`;
      ctx.fillStyle = charInfo.color + "aa";
      ctx.fillText(charInfo.nameEn || "", x, fy + charH * 0.7);
      ctx.textAlign = "left";
    }

    ctx.restore();
  };

  drawChar(leftChar, "left", activeSide === "left" || activeSide === "both");
  drawChar(rightChar, "right", activeSide === "right" || activeSide === "both");

  // Ground line removed — characters stand on background floor naturally

  // ── 9. Dialogue panel ──
  // panelY already defined above
  const panelGrad = ctx.createLinearGradient(0, panelY, 0, H);
  panelGrad.addColorStop(0, "rgba(6,6,14,0.92)");
  panelGrad.addColorStop(1, "rgba(6,6,14,0.98)");
  ctx.fillStyle = panelGrad;
  ctx.fillRect(0, panelY, W, panelH);

  // Top border of panel
  ctx.fillStyle = (isSystem ? "#88889925" : char.color + "25");
  ctx.fillRect(0, panelY, W, 2);

  const padX = Math.min(28, W * 0.04);
  const padY = 14;
  const textAreaW = Math.min(660, W - padX * 2);
  const textStartX = (W - textAreaW) / 2;

  // ── 10. Speaker name ──
  if (!isSystem) {
    const nameY = panelY + padY + 12;
    ctx.font = `bold 11px ${font}`;
    ctx.fillStyle = char.color;
    const nameText = (char.nameEn || char.name || "").toUpperCase();
    ctx.fillText("— " + nameText, textStartX, nameY);

    // Decorative line
    const nameW = ctx.measureText("— " + nameText).width;
    ctx.fillStyle = char.color + "15";
    ctx.fillRect(textStartX + nameW + 10, nameY - 4, textAreaW - nameW - 10, 1);

    // Line counter
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.font = `9px ${font}`;
    ctx.textAlign = "right";
    ctx.fillText(`${s.index + 1}/${s.lines.length}`, textStartX + textAreaW, nameY);
    ctx.textAlign = "left";
  }

  // ── 11. Dialogue text ──
  const textY = panelY + padY + (isSystem ? 24 : 34);

  if (isSystem) {
    // System: centered, italic
    ctx.textAlign = "center";
    if (line.textJp) {
      ctx.font = `italic 13px "Noto Sans JP",sans-serif`;
      ctx.fillStyle = "#888899aa";
      const jpDisplay = s.typingDone ? line.textJp : line.textJp.slice(0, Math.floor(s.typedChars * (line.textJp.length / Math.max(1, fullText.length))));
      ctx.fillText(jpDisplay, W / 2, textY);
    }
    ctx.font = `italic 15px "Noto Sans JP",sans-serif`;
    ctx.fillStyle = "#888899";
    ctx.fillText(displayText, W / 2, textY + 22);
    if (!s.typingDone) {
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.fillText("▌", W / 2 + ctx.measureText(displayText).width / 2 + 4, textY + 22);
    }
    ctx.textAlign = "left";
  } else {
    // Japanese text (smaller, above)
    if (line.textJp) {
      ctx.font = `13px "Noto Sans JP",sans-serif`;
      ctx.fillStyle = char.color + "77";
      const jpDisplay = s.typingDone ? line.textJp : line.textJp.slice(0, Math.floor(s.typedChars * (line.textJp.length / Math.max(1, fullText.length))));
      const jpLines = wrapText(ctx, jpDisplay, textAreaW);
      let jpY = textY;
      for (const jl of jpLines) {
        ctx.fillText(jl, textStartX, jpY);
        jpY += 18;
      }
    }

    // English text (main, larger)
    const enY = textY + (line.textJp ? 22 : 0);
    ctx.font = `16px "Noto Sans JP",sans-serif`;
    ctx.fillStyle = "#e8e6e0";
    const enLines = wrapText(ctx, displayText, textAreaW);
    let curY = enY;
    for (const el of enLines) {
      ctx.fillText(el, textStartX, curY);
      curY += 24;
    }
    // Typing cursor
    if (!s.typingDone && enLines.length > 0) {
      const lastLine = enLines[enLines.length - 1];
      const cursorX = textStartX + ctx.measureText(lastLine).width + 3;
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.fillText("▌", cursorX, curY - 24);
    }
  }

  // ── 12. Advance prompt ──
  if (s.typingDone && !s.choices) {
    const isLast = s.index >= s.lines.length - 1;
    ctx.textAlign = "right";
    ctx.font = `10px ${font}`;
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillText(isLast ? "▶ BEGIN" : "▶", textStartX + textAreaW, H - barH - 8);
    ctx.textAlign = "left";
  }

  // ── 13. Choice boxes (polished with slide-in + better styling) ──
  if (s.choices && s.typingDone) {
    const choices = s.choices;
    const choiceItemH = 46;
    const choiceGap = 6;
    const totalChoiceH = choices.length * choiceItemH + (choices.length - 1) * choiceGap;
    const choiceY = panelY - 16 - totalChoiceH;
    const choiceW = Math.min(420, W * 0.55);
    const choiceX = W - choiceW - 30;

    // Slide-in animation based on how long choices have been visible
    s._choiceAnim = Math.min(1, (s._choiceAnim || 0) + 0.06); // ~200ms
    const slideT = 1 - Math.pow(1 - s._choiceAnim, 3); // easeOutCubic

    for (let i = 0; i < choices.length; i++) {
      const rawY = choiceY + i * (choiceItemH + choiceGap);
      // Staggered slide: each choice slides in slightly after the previous
      const itemT = Math.max(0, Math.min(1, slideT * 3 - i * 0.3));
      const slideOffset = (1 - itemT) * 40; // slide up from 40px below
      const cy = rawY + slideOffset;
      const itemAlpha = itemT;
      const isHighlighted = (s.choiceIndex || 0) === i;

      ctx.save();
      ctx.globalAlpha = itemAlpha;

      // Box background with rounded corners
      const r = 6;
      ctx.beginPath();
      ctx.roundRect(choiceX, cy, choiceW, choiceItemH - 2, r);
      ctx.fillStyle = isHighlighted ? "rgba(255,255,255,0.10)" : "rgba(6,6,14,0.88)";
      ctx.fill();

      // Border
      ctx.strokeStyle = isHighlighted ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.08)";
      ctx.lineWidth = isHighlighted ? 2 : 1;
      ctx.stroke();

      // Subtle glow for highlighted
      if (isHighlighted) {
        ctx.shadowColor = "rgba(255,255,255,0.4)";
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Number badge (rounded square)
      const badgeX = choiceX + 10;
      const badgeY = cy + 10;
      const badgeSize = choiceItemH - 22;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeSize, badgeSize, 4);
      ctx.fillStyle = isHighlighted ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)";
      ctx.fill();
      ctx.font = `bold 14px ${font}`;
      ctx.fillStyle = isHighlighted ? "#ffffff" : "#ffffff70";
      ctx.textAlign = "center";
      ctx.fillText(`${i + 1}`, badgeX + badgeSize / 2, badgeY + badgeSize / 2 + 5);
      ctx.textAlign = "left";

      // Choice text
      ctx.font = `14px "Noto Sans JP",sans-serif`;
      ctx.fillStyle = isHighlighted ? "#f0ece4" : "#c0bdb5";
      ctx.fillText(choices[i].text || "", choiceX + badgeSize + 22, cy + choiceItemH / 2 + 5);

      ctx.restore();
    }

    // Timer bar — integrated below last choice
    if (s.choiceTimer > 0) {
      const progress = Math.max(0, s.choiceTimer / 8);
      const lastChoiceBottom = choiceY + choices.length * (choiceItemH + choiceGap) - choiceGap;
      const barY = lastChoiceBottom + 6;
      const barH = 3;

      // Background track
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.beginPath();
      ctx.roundRect(choiceX, barY, choiceW, barH, 2);
      ctx.fill();

      // Fill — color shifts from blue to yellow to red
      let barColor;
      if (progress > 0.5) barColor = `rgba(80,140,255,${0.6 + progress * 0.4})`;
      else if (progress > 0.25) barColor = `rgba(255,200,50,0.8)`;
      else barColor = `rgba(255,60,40,0.9)`;
      ctx.fillStyle = barColor;
      ctx.beginPath();
      ctx.roundRect(choiceX, barY, choiceW * progress, barH, 2);
      ctx.fill();

      // Tick sound in last 3 seconds
      if (s.choiceTimer < 3 && s.choiceTimer > 0 && Math.floor(s.choiceTimer * 2) !== Math.floor((s.choiceTimer + 0.016) * 2)) {
        playSound("sfx_choice_tick");
      }
    }
  }

  // ── Fade-out overlay (when story is ending) ──
  if (s._fadeOut !== undefined) {
    ctx.fillStyle = `rgba(0,0,0,${Math.min(1, s._fadeOut)})`;
    ctx.fillRect(0, 0, W, H);
  }
}

// ═══ INITIALIZE STORY STATE ═══
export function initStoryState(g, roomIndex, lines) {
  const sceneConfig = getSceneConfig(roomIndex);
  // Convert CSS gradient config to canvas-compatible
  const canvasConfig = {
    bgKey: sceneConfig.bgKey || null,
    gradientColors: sceneConfig.gradientColors || null,
    label: sceneConfig.label,
    labelEn: sceneConfig.labelEn,
    particleType: sceneConfig.particles || sceneConfig.particleType || "dust",
    characters: sceneConfig.characters || {},
    groundLevel: sceneConfig.groundLevel || 0.75,
    entrance: sceneConfig.entrance || {},
  };

  g.story = {
    lines,
    index: 0,
    typedChars: 0,
    typingDone: false,
    timer: 0,
    bobTimer: 0,
    choices: null,
    choiceIndex: 0,
    choiceTimer: 0,
    sceneConfig: canvasConfig,
    // Entrance animation — characters walk in from offscreen
    entrance: { active: true, timer: 0, duration: 1.5 },
  };
  g._storyRoomIndex = roomIndex;
  g.gameState = "story";

  // Clear particles for fresh scene
  _particles.length = 0;
}
