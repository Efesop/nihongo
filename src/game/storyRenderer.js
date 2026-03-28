// ═══ CANVAS STORY RENDERER ═══
// Replaces the React JSX story overlay with canvas-rendered scenes.
// Characters stand in pixel-art environments, text box at bottom.
// Katana Zero-style: characters in scene, typing animation, voice blips, choices.

import { getImage } from "./sprites.js";
import { CHARACTERS, getSceneConfig, ROOM_CHOICES, TITLE_CARD_ROOMS } from "./story.js";
import { playVoiceBlip, playSound, stopMusic, crossfadeMusic } from "./audio.js";

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
    const vy = type === "embers" ? -(10 + Math.random() * 30)
      : type === "leaves" ? (8 + Math.random() * 15)
      : type === "ceilingDust" ? (5 + Math.random() * 12)
      : -(3 + Math.random() * 8);
    _particles.push({
      x: Math.random() * W,
      y: type === "ceilingDust" ? Math.random() * H * 0.15 : Math.random() * H * 0.8,
      vx: (Math.random() - 0.5) * (type === "ceilingDust" ? 8 : 15),
      vy,
      size: type === "leaves" ? 3 + Math.random() * 3 : 2 + Math.random() * 2,
      life: Math.random(),
      maxLife: type === "ceilingDust" ? 2 + Math.random() * 3 : 3 + Math.random() * 4,
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
      p.y = p.type === "embers" ? H + 10 : p.type === "leaves" ? -10 : p.type === "ceilingDust" ? Math.random() * H * 0.1 : H * 0.3 + Math.random() * H * 0.5;
      p.life = 0;
    }
  }
}

function drawParticles(ctx) {
  const colors = { dust: "#aa996680", leaves: "#44aa4460", embers: "#ff662280", petals: "#ff88aa60", ceilingDust: "#ccbbaa50" };
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

  // ═══ ALWAYS UPDATE EFFECTS (before any early returns) ═══
  // Flash, overlay, centerImage must fade even during beat processing
  if (s._flash) {
    s._flash.alpha -= rawDt / s._flash.duration;
    if (s._flash.alpha <= 0) s._flash = null;
  }
  if (s._overlay) {
    s._overlay.alpha = Math.min(s._overlay.targetAlpha, s._overlay.alpha + rawDt * s._overlay.fadeSpeed);
  }
  if (s._centerImage) {
    s._centerImage.alpha = Math.min(s._centerImage.targetAlpha, s._centerImage.alpha + rawDt * s._centerImage.fadeSpeed);
  }

  const line = s.lines[s.index];
  if (!line) return;

  // Fade-out transition — darken screen then end story
  if (s._fadeOut !== undefined) {
    s._fadeOut += rawDt * 1.5; // ~0.7s fade
    if (s._fadeOut >= 1) {
      advanceStory(g, callbacks);
    }
    return;
  }

  // ═══ CINEMATIC BEAT SYSTEM ═══
  // Non-dialogue lines execute instantly and auto-advance
  if (line.type && line.type !== "dialogue") {
    // Check conditions on beats (e.g. shake only during defiant path)
    if (line.condition) {
      const flag = line.condition.flag;
      const met = flag.startsWith("!") ? !g.choices[flag.slice(1)] : !!g.choices[flag];
      if (!met) {
        s.index++;
        if (s.index >= s.lines.length) { g.story = null; g.gameState = "playing"; g._resumeFromStory = true; return; }
        s.typedChars = 0; s.typingDone = false; s.timer = 0;
        s._beatCooldown = 0.05;
        return;
      }
    }
    // Process cinematic beat
    if (line.type === "bgSwap") {
      s.sceneConfig.bgKey = line.to;
      if (line.transition === "flash") {
        s._flash = { color: line.color || "#ffffff", alpha: 1, duration: line.duration || 0.15 };
      } else {
        // Brief fade-through-black for smooth transitions (0.2s)
        s._flash = { color: "#000000", alpha: 0.8, duration: 0.2 };
      }
    } else if (line.type === "sfx") {
      playSound(line.sound);
    } else if (line.type === "musicStop") {
      stopMusic();
    } else if (line.type === "shake") {
      g.camera.shakeTimer = (line.duration || 0.5) * 1000;
      g._cinematicShakeIntensity = line.intensity || 5;
      s._shakeOccurred = true; // enables flickering light + ceiling dust
    } else if (line.type === "flash") {
      s._flash = { color: line.color || "#ffffff", alpha: 1, duration: line.duration || 0.15 };
    } else if (line.type === "pause") {
      // Timed pause — wait before advancing, but skippable with click
      if (!s._pauseTimer) {
        s._pauseTimer = line.duration || 1.0;
      }
      s._pauseTimer -= rawDt;
      // Allow click/space to skip pause
      if (g.input.storyAdvance) {
        g.input.storyAdvance = false;
        s._pauseTimer = 0;
      }
      if (s._pauseTimer > 0) return; // still pausing
      s._pauseTimer = null; // done pausing
    } else if (line.type === "blackout") {
      s._flash = { color: "#000000", alpha: 1, duration: line.duration || 0.5 };
    } else if (line.type === "overlay") {
      s._overlay = { key: line.image, alpha: 0, targetAlpha: 1, fadeSpeed: 1 / (line.fade || 1.0) };
    } else if (line.type === "charSwap") {
      if (line.left !== undefined) s._charOverrideLeft = line.left;
      if (line.right !== undefined) s._charOverrideRight = line.right;
    } else if (line.type === "centerImage") {
      // Show an image centered on screen (not as bg replacement)
      s._centerImage = { key: line.image, alpha: 0, targetAlpha: 1, fadeSpeed: 1 / (line.fade || 0.3), scale: line.scale || 0.5 };
    } else if (line.type === "clearCenter") {
      s._centerImage = null;
    } else if (line.type === "musicChange") {
      try { crossfadeMusic(line.to, line.fade || 1.0); } catch {}
    } else if (line.type === "characterExit") {
      // Animate a character running off screen
      if (!s._characterExit) {
        s._characterExit = {
          char: line.char || "player",
          direction: line.direction || "left",
          timer: 0,
          duration: line.duration || 1.2,
        };
        playSound("sfx_running_footsteps");
      }
      s._characterExit.timer += rawDt;
      if (s._characterExit.timer < s._characterExit.duration) return; // still animating
      // Animation done — mark character as hidden
      if (s._characterExit.char === "player") s._hideLeft = true;
      else s._hideRight = true;
      s._characterExit = null;
    }
    // Advance to next line — but WAIT one frame before processing next beat
    // This prevents multiple SFX/effects from stacking on the same frame
    s.index++;
    if (s.index >= s.lines.length) {
      g.story = null;
      g.gameState = "playing";
      if (g._pendingRoom !== null && g._pendingRoom !== undefined) {
        g._loadRoomAfterStory = g._pendingRoom;
        g._pendingRoom = null;
      }
      g._resumeFromStory = true;
      return;
    }
    s.typedChars = 0; s.typingDone = false; s.timer = 0;
    // If next line is ALSO a beat, wait one frame before processing it
    const nextLine = s.lines[s.index];
    if (nextLine && nextLine.type && nextLine.type !== "dialogue") {
      s._beatCooldown = 0.05; // 50ms gap between consecutive beats
    }
    return;
  }

  // Beat cooldown — prevents rapid-fire stacking
  if (s._beatCooldown > 0) {
    s._beatCooldown -= rawDt;
    return;
  }

  // (Effects updated at top of function — before any early returns)

  // Title card phase — dramatic kanji intro before everything
  if (s.titleCard && s.titleCard.active) {
    s.titleCard.timer += rawDt;
    // Play shamisen — direct Audio fallback if WebAudio buffer not loaded
    if (!s.titleCard.played && s.titleCard.timer > 0.05) {
      playSound("sfx_shamisen_sting");
      try { const a = new Audio("/audio/game/sfx_shamisen_sting.mp3"); a.volume = 0.6; a.play().catch(() => {}); } catch {}
      s.titleCard.played = true;
    }
    // Allow click/space to skip after 0.8 second
    if (s.titleCard.timer > 0.8 && g.input.storyAdvance) {
      g.input.storyAdvance = false;
      s.titleCard.timer = s.titleCard.duration;
    }
    if (s.titleCard.timer >= s.titleCard.duration) {
      s.titleCard.active = false;
      s.entrance.active = true;
    }
    updateParticles(rawDt, g.W, g.H);
    return;
  }

  // Entrance animation — block everything until characters are in position
  if (s.entrance && s.entrance.active) {
    s.entrance.timer += rawDt;
    // Footstep sounds during walk-in (softer + slower than gameplay, no double-play)
    s.entrance._stepTimer = (s.entrance._stepTimer || 0) + rawDt;
    if (s.entrance._stepTimer > 0.35) {
      s.entrance._stepTimer = 0;
      try { const a = new Audio("/audio/game/footstep.mp3"); a.volume = 0.12; a.play().catch(() => {}); } catch {}
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
    // Supports both single choice object and array of choices per room
    const roomChoices = ROOM_CHOICES[g._storyRoomIndex];
    if (roomChoices) {
      const choiceList = Array.isArray(roomChoices) ? roomChoices : [roomChoices];
      const matchingChoice = choiceList.find(c => c.after === s.index);
      if (matchingChoice) {
        s.choices = matchingChoice.options;
        s.choiceIndex = 0;
        s.choiceTimer = 8; // 8 second timer
        s._choiceAnim = 0; // reset slide-in animation
        playSound("sfx_choice_appear");
      }
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

  // ── 2. Vignette (flickers after shake events) ──
  const flickerAmount = s._shakeOccurred ? Math.sin(Date.now() * 0.008) * 0.08 + Math.sin(Date.now() * 0.013) * 0.04 : 0;
  const vGrad = ctx.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, W * 0.7);
  vGrad.addColorStop(0, "transparent");
  vGrad.addColorStop(1, `rgba(0,0,0,${0.6 + flickerAmount})`);
  ctx.fillStyle = vGrad;
  ctx.fillRect(0, 0, W, H);

  // ── 3. Atmospheric particles ──
  // Switch to ceiling dust after shakes (debris falling)
  const particleType = s._shakeOccurred ? "ceilingDust" : (scene.particleType || "dust");
  ensureParticles(particleType, W, H);
  drawParticles(ctx);

  // ── 4. Scanlines ──
  ctx.fillStyle = "rgba(0,0,0,0.04)";
  for (let y = 0; y < H; y += 4) {
    ctx.fillRect(0, y, W, 2);
  }

  // ── 5. Title card OR scene label watermark ──
  // Cinematic anime style: bold crimson kanji, no outline, instant appear, clean.
  // Inspired by Demon Slayer / Blue Eye Samurai chapter cards.
  if (s.titleCard && s.titleCard.active) {
    const tc = s.titleCard;
    const t = tc.timer / tc.duration; // 0→1 progress

    // Title card background art (dark anime) — draw OVER the scene bg
    const tcKey = scene._titleCardImage;
    const tcImg = tcKey ? getImage(tcKey) : null;
    if (tcImg) {
      const imgAspect = tcImg.width / tcImg.height;
      const screenAspect = W / H;
      let dw, dh, dx, dy;
      if (screenAspect > imgAspect) { dw = W; dh = W / imgAspect; dx = 0; dy = (H - dh) / 2; }
      else { dh = H; dw = H * imgAspect; dx = (W - dw) / 2; dy = 0; }
      ctx.drawImage(tcImg, dx, dy, dw, dh);
    }

    // Dark overlay — cinematic
    ctx.fillStyle = `rgba(0,0,0,0.5)`;
    ctx.fillRect(0, 0, W, H);

    // Fade: instant appear, text stays visible until screen fades at very end
    const fadeIn = Math.min(1, t / 0.06);
    const fadeOut = Math.min(1, (1 - t) / 0.08); // very fast fade at the end only
    const alpha = Math.min(fadeIn, fadeOut);

    // ── Vertical crimson kanji — brush calligraphy font, cinematic ──
    const kanji = scene.label || "";
    const kanjiChars = [...kanji];
    const kanjiSize = Math.min(H * 0.28, W * 0.22);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const totalKanjiH = kanjiChars.length * kanjiSize * 0.85;
    const startY = (H - totalKanjiH) / 2 - H * 0.02;

    for (let i = 0; i < kanjiChars.length; i++) {
      const cy = startY + i * kanjiSize * 0.85;

      ctx.save();
      ctx.globalAlpha = alpha;
      // Yuji Boku = Japanese brush calligraphy font, falls back to serif
      ctx.font = `${kanjiSize}px "Yuji Boku",serif`;

      // Subtle dark shadow for depth
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillText(kanjiChars[i], W / 2 + 3, cy + 3);

      // Bold crimson — clean, cinematic
      ctx.fillStyle = "#cc1a1a";
      ctx.fillText(kanjiChars[i], W / 2, cy);

      ctx.restore();
    }

    // ── English subtitle — clean, spaced, below kanji ──
    const enLabel = scene.labelEn || "";
    if (enLabel) {
      const enSize = Math.min(14, W * 0.02);
      ctx.save();
      ctx.globalAlpha = alpha * 0.85;
      ctx.textAlign = "center";
      ctx.font = `400 ${enSize}px ${font}`;
      ctx.letterSpacing = "6px";
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillText(enLabel, W / 2 + 1, startY + totalKanjiH + kanjiSize * 0.45 + 1);
      ctx.fillStyle = "rgba(220,210,200,0.75)";
      ctx.fillText(enLabel, W / 2, startY + totalKanjiH + kanjiSize * 0.45);
      ctx.letterSpacing = "0px";
      ctx.textAlign = "left";
      ctx.restore();
    }

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    return; // title card covers everything — don't render characters/dialogue
  } else if (scene.label && !(s.titleCard)) {
    // Normal watermark for rooms without title cards
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
  // Hide characters during cutscene-only backgrounds (approaching shadows, blood on doors, etc.)
  const isCutsceneBg = scene.bgKey && scene.bgKey.startsWith("cutscene_");

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
      const emotionMap = { serious: "serious", amused: "amused", angry: "angry", alarmed: "alarmed", bitter: "bitter", concerned: "concerned" };
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

    // Character hidden after exit animation
    if (side === "left" && s._hideLeft) return;
    if (side === "right" && s._hideRight) return;

    // Position: centered in each half, with entrance slide-in
    const finalX = side === "left" ? W * 0.32 : W * 0.72;
    const startX = side === "left" ? W * -0.1 : W * 1.1;
    // Check if this character should already be in place
    const charEntrance = scene.entrance?.[side === "left" ? "left" : "right"];
    const shouldAnimate = charEntrance !== "already_there" && charEntrance !== "fade_in";
    let x = shouldAnimate ? startX + (finalX - startX) * easeT : finalX;
    // Fade-in for characters with fade entrance
    if (charEntrance === "fade_in" && entranceT < 1) {
      ctx.globalAlpha = Math.min(ctx.globalAlpha, easeT);
    }

    // Character exit animation — override position to move off screen
    const exitAnim = s._characterExit;
    const isExiting = exitAnim && exitAnim.char === charKey;
    if (isExiting) {
      const exitT = Math.min(1, exitAnim.timer / exitAnim.duration);
      const easeExitT = exitT * exitT; // easeIn — accelerates away
      const exitX = exitAnim.direction === "left" ? W * -0.15 : W * 1.15;
      x = finalX + (exitX - finalX) * easeExitT;
    }

    const emotion = isActive ? line.emotion : null;
    // During walk-in entrance OR exit, use run sprites
    const isWalking = (shouldAnimate && s.entrance?.active && entranceT < 1) || isExiting;
    let sprite;
    if (isWalking) {
      if (charKey === "player") {
        const animTimer = isExiting ? exitAnim.timer : (s.entrance?.timer || 0);
        const runFrame = (Math.floor(animTimer * 8) % 4) + 1;
        sprite = getImage("run" + runFrame) || getImage("player");
      } else {
        const animTimer = isExiting ? exitAnim.timer : (s.entrance?.timer || 0);
        const walkFrame = Math.floor(animTimer * 6) % 2 === 0 ? "walk1" : "walk2";
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
      // During exit animation, face the exit direction instead
      ctx.imageSmoothingEnabled = false;
      const exitingLeft = isExiting && exitAnim.direction === "left";
      const exitingRight = isExiting && exitAnim.direction === "right";
      const shouldFlip = (side === "left" && !exitingLeft) || exitingRight;
      if (shouldFlip) {
        // Face right — flip horizontally
        ctx.save();
        ctx.translate(drawX + drawW, drawY);
        ctx.scale(-1, 1);
        if (isActive) { ctx.shadowColor = charInfo.color; ctx.shadowBlur = 20; }
        ctx.drawImage(sprite, 0, 0, drawW, drawH);
        ctx.restore();
      } else {
        // Face left (default sprite direction)
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

  if (!isCutsceneBg) {
    drawChar(leftChar, "left", activeSide === "left" || activeSide === "both");
    drawChar(rightChar, "right", activeSide === "right" || activeSide === "both");
  }

  // Ground line removed — characters stand on background floor naturally

  // ── 9. Dialogue panel (hidden during cutscene-only shots) ──
  if (isCutsceneBg && !line.text) {
    // During cutscene pauses, show just the image — no panel, no text
    // (skip to effects rendering below)
  } else {
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

  } // end dialogue panel conditional

  // ── 13. Choices — centered, clean text, no boxes ──
  if (s.choices && s.typingDone) {
    const choices = s.choices;
    const choiceItemH = 36;
    const choiceGap = 10;
    const totalChoiceH = choices.length * choiceItemH + (choices.length - 1) * choiceGap;
    const choiceY = panelY - 20 - totalChoiceH;

    // Slide-in animation
    s._choiceAnim = Math.min(1, (s._choiceAnim || 0) + 0.06);
    const slideT = 1 - Math.pow(1 - s._choiceAnim, 3);

    for (let i = 0; i < choices.length; i++) {
      const rawY = choiceY + i * (choiceItemH + choiceGap);
      const itemT = Math.max(0, Math.min(1, slideT * 3 - i * 0.3));
      const slideOffset = (1 - itemT) * 30;
      const cy = rawY + slideOffset;
      const isHighlighted = (s.choiceIndex || 0) === i;

      ctx.save();
      ctx.globalAlpha = itemT;
      ctx.textAlign = "center";

      // Choice text — centered on screen, clean with text shadow
      const fontSize = Math.min(15, W * 0.022);
      ctx.font = `${isHighlighted ? "bold " : ""}${fontSize}px "Noto Sans JP",sans-serif`;
      const label = `${i + 1}.  ${choices[i].text || ""}`;

      // Text shadow for readability
      ctx.fillStyle = "rgba(0,0,0,0.8)";
      ctx.fillText(label, W / 2 + 1, cy + choiceItemH / 2 + 1);

      // Main text
      ctx.fillStyle = isHighlighted ? "#ffffff" : "rgba(200,195,185,0.7)";
      if (isHighlighted) {
        ctx.shadowColor = "rgba(255,255,255,0.5)";
        ctx.shadowBlur = 10;
      }
      ctx.fillText(label, W / 2, cy + choiceItemH / 2);
      ctx.shadowBlur = 0;

      // Subtle underline for highlighted
      if (isHighlighted) {
        const textW = ctx.measureText(label).width;
        ctx.strokeStyle = "rgba(200,60,40,0.7)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(W / 2 - textW / 2, cy + choiceItemH / 2 + 8);
        ctx.lineTo(W / 2 + textW / 2, cy + choiceItemH / 2 + 8);
        ctx.stroke();
      }

      ctx.textAlign = "left";
      ctx.restore();
    }

    // Timer bar — centered below choices
    if (s.choiceTimer > 0) {
      const progress = Math.max(0, s.choiceTimer / 8);
      const barW = Math.min(300, W * 0.4);
      const barX = (W - barW) / 2;
      const barY = choiceY + totalChoiceH + 10;
      const barH = 2;

      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 1);
      ctx.fill();

      let barColor;
      if (progress > 0.5) barColor = `rgba(80,140,255,${0.6 + progress * 0.4})`;
      else if (progress > 0.25) barColor = `rgba(255,200,50,0.8)`;
      else barColor = `rgba(255,60,40,0.9)`;
      ctx.fillStyle = barColor;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW * progress, barH, 1);
      ctx.fill();

      if (s.choiceTimer < 3 && s.choiceTimer > 0 && Math.floor(s.choiceTimer * 2) !== Math.floor((s.choiceTimer + 0.016) * 2)) {
        playSound("sfx_choice_tick");
      }
    }
  }

  // ── Center image (e.g. arm close-up — centered, not full bg) ──
  if (s._centerImage) {
    const cImg = getImage(s._centerImage.key);
    if (cImg) {
      ctx.globalAlpha = s._centerImage.alpha;
      const scale = s._centerImage.scale;
      const cw = W * scale;
      const ch = cw * (cImg.height / cImg.width);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(cImg, (W - cw) / 2, (H * 0.35 - ch / 2), cw, ch);
      ctx.imageSmoothingEnabled = true;
      ctx.globalAlpha = 1;
    }
  }

  // ── Cinematic overlay image (e.g. approaching shadows over bg) ──
  if (s._overlay) {
    const oImg = getImage(s._overlay.key);
    if (oImg) {
      ctx.globalAlpha = s._overlay.alpha;
      // COVER mode
      const ia = oImg.width / oImg.height;
      const sa = W / H;
      let dw, dh, dx, dy;
      if (sa > ia) { dw = W; dh = W / ia; dx = 0; dy = (H - dh) / 2; }
      else { dh = H; dw = H * ia; dx = (W - dw) / 2; dy = 0; }
      ctx.drawImage(oImg, dx, dy, dw, dh);
      ctx.globalAlpha = 1;
    }
  }

  // ── Flash effect (white flash, red flash, hard cut) ──
  if (s._flash) {
    ctx.fillStyle = s._flash.color;
    ctx.globalAlpha = Math.max(0, s._flash.alpha);
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
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

  // Title card for major zone transitions (plays before dialogue)
  const showTitleCard = TITLE_CARD_ROOMS.has(roomIndex) && canvasConfig.label;

  // Title card background art (dark anime style) — keyed by room
  const TITLE_CARD_IMAGES = { 0: "titlecard_dojo", 5: "titlecard_turning", 8: "titlecard_forest", 10: "titlecard_encounter", 12: "titlecard_edo", 27: "titlecard_neon", 34: "titlecard_underground", 40: "titlecard_spirit", 47: "titlecard_return" };
  if (showTitleCard && TITLE_CARD_IMAGES[roomIndex]) {
    canvasConfig._titleCardImage = TITLE_CARD_IMAGES[roomIndex];
    getImage(TITLE_CARD_IMAGES[roomIndex]); // trigger lazy-load
  }

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
    // Title card phase — before entrance, big vertical kanji + shamisen sting
    titleCard: showTitleCard ? { active: true, timer: 0, duration: 3.2, played: false } : null,
    // Entrance animation — characters walk in from offscreen (starts after title card)
    entrance: { active: !showTitleCard, timer: 0, duration: 1.5 },
  };
  g._storyRoomIndex = roomIndex;
  g.gameState = "story";

  // Pre-load any images referenced in cinematic beats
  for (const line of lines) {
    if (line.type === "bgSwap" && line.to) getImage(line.to); // triggers lazy-load
    if (line.type === "overlay" && line.image) getImage(line.image);
    if (line.type === "centerImage" && line.image) getImage(line.image);
  }

  // Clear particles for fresh scene
  _particles.length = 0;
}
