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
    // Story complete — load room and resume gameplay
    playSound("sfx_text_advance");
    g.story = null;
    g.gameState = "playing";
    if (g._pendingRoom !== null && g._pendingRoom !== undefined) {
      // loadRoom is called by the engine when transitioning
      g._loadRoomAfterStory = g._pendingRoom;
      g._pendingRoom = null;
    }
    // Signal music crossfade (handled by engine)
    g._resumeFromStory = true;
  } else {
    playSound("sfx_text_advance");
    s.index++;
    s.typedChars = 0;
    s.typingDone = false;
    s.timer = 0;

    // Check if this line triggers a choice
    const roomChoices = ROOM_CHOICES[g._storyRoomIndex];
    if (roomChoices && roomChoices.after === s.index) {
      s.choices = roomChoices.options;
      s.choiceIndex = 0;
      s.choiceTimer = 8; // 8 second timer
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
    // Draw background scaled to fill, maintaining aspect ratio
    const imgAspect = bgImg.width / bgImg.height;
    const screenAspect = W / H;
    let sx = 0, sy = 0, sw = bgImg.width, sh = bgImg.height;
    if (imgAspect > screenAspect) {
      // Image wider — crop sides
      sw = bgImg.height * screenAspect;
      sx = (bgImg.width - sw) / 2;
    } else {
      // Image taller — crop top/bottom
      sh = bgImg.width / screenAspect;
      sy = (bgImg.height - sh) / 2;
    }
    ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, W, H);

    // Darken overlay for readability
    ctx.fillStyle = "rgba(0,0,0,0.35)";
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
  const panelH = H * 0.28;
  const groundY = H - panelH - 10;
  const charH = 80; // Medium size ~80px as user requested
  const bob = Math.sin((s.bobTimer || 0) * 2) * 2;

  // Determine who's in this scene
  const speakers = [...new Set(s.lines.map(l => l.speaker).filter(x => x !== "system"))];
  const leftChar = speakers.includes("player") ? "player" : speakers[0] || null;
  const rightChar = speakers.find(x => x !== leftChar) || null;
  const activeSide = line.speaker === leftChar ? "left" : (line.speaker === rightChar ? "right" : null);

  // Get emotion-based sprite key
  const getCharSpriteKey = (charKey, emotion) => {
    const emotionMap = {
      surprised: "surprised", serious: "serious", amused: "amused",
      angry: "angry", bitter: "bitter", concerned: "concerned",
      determined: "determined", sad: "sad",
    };
    const emotionSuffix = emotionMap[emotion] || "idle";
    return `story_${charKey}_${emotionSuffix}`;
  };

  const drawChar = (charKey, side, isActive) => {
    if (!charKey) return;
    const charInfo = CHARACTERS[charKey];
    if (!charInfo) return;

    const x = side === "left" ? W * 0.2 : W * 0.8;
    const y = groundY - charH + (isActive ? bob : 0);

    // Get sprite with emotion
    const emotion = isActive ? line.emotion : null;
    const spriteKey = getCharSpriteKey(charKey, emotion);
    const sprite = getImage(spriteKey) || getImage(`story_${charKey}_idle`);

    ctx.save();
    if (!isActive) ctx.globalAlpha = 0.4;

    if (sprite) {
      // Draw character sprite, maintain aspect ratio
      const aspect = sprite.width / sprite.height;
      const drawH = charH;
      const drawW = drawH * aspect;
      const drawX = x - drawW / 2;
      const drawY = y;

      // Glow effect for active speaker
      if (isActive) {
        ctx.shadowColor = charInfo.color;
        ctx.shadowBlur = 15;
      }

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sprite, drawX, drawY, drawW, drawH);
      ctx.imageSmoothingEnabled = true;
      ctx.shadowBlur = 0;
    } else {
      // Fallback: large kanji with color
      const kanji = charInfo.name?.[0] || "?";
      ctx.textAlign = "center";
      ctx.font = `bold ${charH * 0.5}px "Noto Sans JP",sans-serif`;
      if (isActive) {
        ctx.shadowColor = charInfo.color;
        ctx.shadowBlur = 20;
      }
      ctx.fillStyle = charInfo.color;
      ctx.fillText(kanji, x, y + charH * 0.6);
      ctx.shadowBlur = 0;
      ctx.textAlign = "left";

      // Name below
      ctx.font = `bold 11px "Noto Sans JP",sans-serif`;
      ctx.fillStyle = charInfo.color + "aa";
      ctx.textAlign = "center";
      ctx.fillText(charInfo.nameEn || "", x, y + charH + 14);
      ctx.textAlign = "left";
    }

    ctx.restore();
  };

  drawChar(leftChar, "left", activeSide === "left");
  drawChar(rightChar, "right", activeSide === "right");

  // ── 8. Ground line ──
  const gGrad = ctx.createLinearGradient(0, 0, W, 0);
  gGrad.addColorStop(0, "transparent");
  gGrad.addColorStop(0.3, "rgba(255,255,255,0.06)");
  gGrad.addColorStop(0.7, "rgba(255,255,255,0.06)");
  gGrad.addColorStop(1, "transparent");
  ctx.fillStyle = gGrad;
  ctx.fillRect(0, groundY + 2, W, 1);

  // ── 9. Dialogue panel ──
  const panelY = H - panelH;
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

  // ── 13. Choice boxes ──
  if (s.choices && s.typingDone) {
    const choices = s.choices;
    const choiceY = panelY - 8 - choices.length * 44;
    const choiceW = Math.min(400, W * 0.55);
    const choiceX = W - choiceW - 30;

    for (let i = 0; i < choices.length; i++) {
      const cy = choiceY + i * 44;
      const isHighlighted = (s.choiceIndex || 0) === i;

      // Box background
      ctx.fillStyle = isHighlighted ? "rgba(255,255,255,0.08)" : "rgba(6,6,14,0.85)";
      ctx.fillRect(choiceX, cy, choiceW, 38);

      // Border
      ctx.strokeStyle = isHighlighted ? "#ffffff40" : "#ffffff15";
      ctx.lineWidth = isHighlighted ? 2 : 1;
      ctx.strokeRect(choiceX, cy, choiceW, 38);

      // Glow for highlighted
      if (isHighlighted) {
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 8;
        ctx.strokeRect(choiceX, cy, choiceW, 38);
        ctx.shadowBlur = 0;
      }

      // Number label
      ctx.font = `bold 14px ${font}`;
      ctx.fillStyle = isHighlighted ? "#ffffff" : "#ffffff60";
      ctx.fillText(`${i + 1}`, choiceX + 12, cy + 24);

      // Choice text
      ctx.font = `14px "Noto Sans JP",sans-serif`;
      ctx.fillStyle = isHighlighted ? "#e8e6e0" : "#e8e6e0aa";
      ctx.fillText(choices[i].text || "", choiceX + 36, cy + 24);
    }

    // Timer bar
    if (s.choiceTimer > 0) {
      const timerW = choiceW;
      const progress = Math.max(0, s.choiceTimer / 8);
      const barY = choiceY - 8;

      // Background
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(choiceX, barY, timerW, 3);

      // Fill — color shifts from blue to yellow to red
      let barColor;
      if (progress > 0.5) barColor = `rgba(80,140,255,${0.6 + progress * 0.4})`;
      else if (progress > 0.25) barColor = `rgba(255,200,50,0.8)`;
      else barColor = `rgba(255,60,40,0.9)`;
      ctx.fillStyle = barColor;
      ctx.fillRect(choiceX, barY, timerW * progress, 3);

      // Tick sound in last 3 seconds
      if (s.choiceTimer < 3 && s.choiceTimer > 0 && Math.floor(s.choiceTimer * 2) !== Math.floor((s.choiceTimer + 0.016) * 2)) {
        playSound("sfx_choice_tick");
      }
    }
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
  };
  g._storyRoomIndex = roomIndex;
  g.gameState = "story";

  // Clear particles for fresh scene
  _particles.length = 0;
}
