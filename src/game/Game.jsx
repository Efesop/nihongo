import { useState, useEffect, useRef, useCallback } from "react";
import { TILE, SCALE, GROUND_Y, TOTAL_ROOMS } from "./constants.js";
import { getSprite, loadMascotImage } from "./sprites.js";
import { ROOMS } from "./levels.js";
import { makePlayer, makeEnemy } from "./entities.js";
import { update, loadRoom, loadSave, deleteSave } from "./engine.js";
import { render } from "./renderer.js";
import { setupKeyboard, setupTouch } from "./input.js";
import { initAudio, playSound, playRandom, toggleMute, isMuted, startMusic, startMusicFadeIn, stopMusic, isAudioReady, playVoiceBlip } from "./audio.js";
import { CHARACTERS, ROOM_DIALOGUE, ROOM_ENCOUNTERS, STORY_TRIGGERS, getDefaultChoices, getSceneConfig } from "./story.js";
import { initStoryState } from "./storyRenderer.js";
import { crossfadeMusic } from "./audio.js";

export default function Game({ theme, c, isDesktop, SIDEBAR_W }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const rafRef = useRef(null);
  const startRoomRef = useRef(0); // which room to start from (for continue)
  const resumeFromStoryRef = useRef(false); // survives StrictMode double-mount
  const [screen, setScreen] = useState("menu");
  const [hasSave, setHasSave] = useState(() => !!loadSave());
  const [score, setScore] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem("nihongo-game-highscore")) || 0; } catch { return 0; }
  });

  const font = '"JetBrains Mono","SF Mono","Fira Code",monospace';
  const uiFont = '"Noto Sans JP","Hiragino Sans",system-ui,sans-serif';

  // ═══ INIT GAME STATE ═══
  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const container = canvas.parentElement;
    const W = container ? container.clientWidth : canvas.clientWidth;
    const H = container ? container.clientHeight : canvas.clientHeight;
    const groundY = H * GROUND_Y;

    // Create game state shell — loadRoom will populate room-specific fields
    const g = {
      W, H, groundY, levelW: 0,
      player: null,
      camera: { x: 0, y: 0, shakeX: 0, shakeY: 0, shakeTimer: 0, zoom: 1, zoomTarget: 1, lookAhead: 0 },
      platforms: [], enemies: [], decorations: [], shadows: [],
      particles: [], slashEffects: [], projectiles: [],
      embers: [], floatingTexts: [],
      slowMo: { active: false, meter: 100, max: 100 },
      input: { left: false, right: false, up: false, down: false, slash: false, slowmo: false, dash: false,
               slashPressed: false, jumpPressed: false, dashPressed: false, downPressed: false },
      time: { last: performance.now(), dt: 0, scale: 1, elapsed: 0 },
      score: 0, combo: 0, comboTimer: 0, maxCombo: 0,
      hitStop: 0, flashTimer: 0, cleared: false,
      // Room system
      currentRoom: 0, roomTimer: 0, roomStars: [],
      deaths: 0, totalTime: 0,
      roomState: "playing",
      roomClearTimer: 0,
      deathFlash: 0,
      // Transitions
      letterbox: 0,
      fadeOverlay: 0,
      roomTitle: null,
      // Tutorials
      tutorials: [], activeTutorial: null,
      // Story system
      _storyTriggers: STORY_TRIGGERS,
      _pendingRoom: null,
      // Choice system
      choices: getDefaultChoices(),
      // Encounter system
      _encounters: [],
      encounterActive: false,
      encounterText: null,
    };

    // Load saved progress if continuing
    const startRoom = startRoomRef.current;
    const save = startRoom > 0 ? loadSave() : null;
    if (save) {
      g.score = save.score || 0;
      g.deaths = save.deaths || 0;
      g.roomStars = save.roomStars || [];
      g.totalTime = save.totalTime || 0;
    }
    loadRoom(g, startRoom);
    return g;
  }, []);

  // ═══ GAME LOOP ═══
  useEffect(() => {
    if (screen !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      const container = canvas.parentElement;
      if (!container) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = container.clientWidth;
      const h = container.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (gameRef.current) {
        gameRef.current.W = w;
        gameRef.current.H = h;
        gameRef.current.groundY = h * GROUND_Y;
      }
    };
    resize();
    window.addEventListener("resize", resize);

    // Reuse existing game state when returning from mid-game story
    // Uses ref (not game state flag) to survive React StrictMode double-mount
    let g = gameRef.current;
    if (g && resumeFromStoryRef.current) {
      resumeFromStoryRef.current = false;
      g.time.last = performance.now();
      // Re-sync canvas size
      g.W = canvas.parentElement?.clientWidth || canvas.clientWidth;
      g.H = canvas.parentElement?.clientHeight || canvas.clientHeight;
      g.groundY = g.H * GROUND_Y;
    } else {
      g = initGame();
      if (!g) return;
      gameRef.current = g;
    }

    const cleanupKeys = setupKeyboard(gameRef, setScreen);
    const cleanupTouch = setupTouch(canvas, gameRef);

    // Fade combat music in gradually (not jarring after story screens)
    startMusicFadeIn(1.5);

    const callbacks = { setScore, setMaxCombo, setScreen, isDesktop, SIDEBAR_W, highScore, setHighScore };

    function loop() {
      const g = gameRef.current;
      if (!g) return;
      update(g, callbacks);
      render(g, ctx, isDesktop, font);
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      cleanupKeys();
      cleanupTouch();
      window.removeEventListener("resize", resize);
    };
  }, [screen, initGame, isDesktop, SIDEBAR_W, highScore]);

  // Story is now handled by the canvas renderer (storyRenderer.js)
  // No React story state or effects needed.

  // Resume from pause
  useEffect(() => {
    if (screen !== "paused") return;
    const onKey = (e) => {
      if (e.code === "Escape" || e.code === "KeyP") {
        if (gameRef.current) gameRef.current.time.last = performance.now();
        setScreen("playing");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen]);

  const [muted, setMutedState] = useState(() => isMuted());

  const startGame = async (fromRoom = 0) => {
    startRoomRef.current = fromRoom;
    setScreen("loading");
    const audioPromise = initAudio();
    await loadMascotImage();
    await audioPromise;
    let waited = 0;
    while (!isAudioReady() && waited < 3000) {
      await new Promise(r => setTimeout(r, 100));
      waited += 100;
    }
    playSound("menuStart");
    stopMusic();
    setScore(0);
    setMaxCombo(0);
    // Always go to "playing" — story scenes are now canvas-rendered within the game loop
    setScreen("playing");
    // After game state initializes, check for story trigger
    setTimeout(() => {
      const g = gameRef.current;
      if (!g) return;
      const storyKey = STORY_TRIGGERS[fromRoom];
      const dialogue = storyKey !== undefined ? ROOM_DIALOGUE[storyKey] : null;
      if (dialogue) {
        g._pendingRoom = fromRoom;
        crossfadeMusic("music_story_calm", 0.5);
        initStoryState(g, fromRoom, dialogue);
      }
    }, 50);
  };

  const handleNewGame = () => {
    deleteSave();
    setHasSave(false);
    startGame(0);
  };

  const handleContinue = () => {
    const save = loadSave();
    if (save) startGame(save.currentRoom || 0);
    else startGame(0);
  };

  const handleToggleMute = () => {
    const nowMuted = toggleMute();
    setMutedState(nowMuted);
  };

  // ═══ STYLES ═══
  const gameContainer = {
    position: "fixed",
    top: 0,
    left: isDesktop ? SIDEBAR_W : 0,
    right: 0,
    bottom: isDesktop ? 0 : 70,
    zIndex: 10,
  };
  const overlay = {
    ...gameContainer,
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  };
  const btn = {
    fontFamily: uiFont, cursor: "pointer", border: "none",
    padding: "12px 32px", borderRadius: 10, fontSize: 15, fontWeight: 700,
    letterSpacing: ".02em", transition: "all .15s",
  };
  const glowText = { textShadow: `0 0 20px ${c.a}, 0 0 60px ${c.a}40` };

  const cssFx = `@keyframes glitch{0%{text-shadow:2px 0 #c0282a,-2px 0 #4f8ec4}25%{text-shadow:-2px -1px #c0282a,2px 1px #4f8ec4}50%{text-shadow:1px 2px #c0282a,-1px -2px #4f8ec4}75%{text-shadow:-1px 1px #c0282a,1px -1px #4f8ec4}100%{text-shadow:2px 0 #c0282a,-2px 0 #4f8ec4}}@keyframes scanmove{0%{background-position:0 0}100%{background-position:0 100%}}@keyframes glitchBig{0%{transform:translate(0);opacity:1}10%{transform:translate(-3px,2px);opacity:.8}20%{transform:translate(3px,-1px);opacity:.9}30%{transform:translate(0);opacity:1}90%{transform:translate(0);opacity:1}95%{transform:translate(2px,1px);opacity:.7}100%{transform:translate(0);opacity:1}}`;

  // ═══ LOADING ═══
  if (screen === "loading") {
    return (
      <div style={{ ...overlay, background: "#0a0a14" }}>
        <style>{cssFx}</style>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)", pointerEvents: "none", animation: "scanmove 8s linear infinite" }} />
        <div style={{ fontSize: 48, color: c.tx, filter: `drop-shadow(0 0 10px ${c.a}40)` }}>斬</div>
        <div style={{ fontSize: 14, fontFamily: font, color: c.a, letterSpacing: ".15em", marginTop: 16, animation: "glitch 2s ease-in-out infinite" }}>
          LOADING
        </div>
        <div style={{ width: 120, height: 2, background: c.s2, borderRadius: 2, marginTop: 12, overflow: "hidden" }}>
          <div style={{ width: "100%", height: "100%", background: c.a, animation: "scanmove 1s linear infinite", transformOrigin: "left" }} />
        </div>
        <div style={{ fontSize: 10, fontFamily: font, color: c.m, marginTop: 12, letterSpacing: ".08em" }}>
          準備中...
        </div>
      </div>
    );
  }

  // Story scenes are now rendered on canvas (storyRenderer.js) — no React JSX needed.
  // When g.gameState === "story", the canvas loop renders the story scene.
  if (false && screen === "story") {
    const line = storyLines[storyIndex] || storyLines[storyLines.length - 1];
    const isLast = storyIndex >= storyLines.length - 1;
    const char = CHARACTERS[line.speaker] || CHARACTERS.system;
    const fullText = line.text || "";
    const displayText = typingDone ? fullText : fullText.slice(0, typedChars);
    // Determine scene from pending room or current room
    const sceneRoom = gameRef.current?._pendingRoom ?? gameRef.current?.currentRoom ?? startRoomRef.current;
    const scene = getSceneConfig(sceneRoom);
    const advanceStory = () => {
      if (!typingDone) {
        clearTimeout(typingRef.current);
        setTypedChars(fullText.length);
        setTypingDone(true);
        return;
      }
      if (isLast) {
        setStoryLines([]);
        setStoryIndex(0);
        const g = gameRef.current;
        if (g && g._pendingRoom !== null && g._pendingRoom !== undefined) {
          loadRoom(g, g._pendingRoom);
          g._pendingRoom = null;
          resumeFromStoryRef.current = true; // ref survives StrictMode double-mount
          g.time.last = performance.now();
        }
        setScreen("playing");
      } else {
        setStoryIndex(i => i + 1);
        setTypedChars(0);
        setTypingDone(false);
      }
    };
    const isSystem = line.speaker === "system";

    // ── Derive characters in scene — player LEFT, others RIGHT ──
    const sceneSpeakers = [...new Set(storyLines.map(l => l.speaker).filter(s => s !== "system"))];
    const leftChar = sceneSpeakers.includes("player") ? "player" : null;
    const rightChar = sceneSpeakers.find(s => s !== "player") || null;
    const leftInfo = leftChar ? CHARACTERS[leftChar] : null;
    const rightInfo = rightChar ? CHARACTERS[rightChar] : null;
    const activeSide = line.speaker === "player" ? "left" : (line.speaker !== "system" ? "right" : null);

    // Character sprite renderer
    const CharSprite = ({ side, charKey, charInfo, isActive }) => {
      if (!charInfo) return null;
      const kanji = charInfo.name?.[0] || "?";
      const sideStyle = side === "left"
        ? { left: isDesktop ? 40 : 16, alignItems: "flex-start" }
        : { right: isDesktop ? 40 : 16, alignItems: "flex-end" };
      return (
        <div style={{
          position: "absolute", bottom: isDesktop ? 180 : 160, ...sideStyle,
          display: "flex", flexDirection: "column", gap: 6,
          transition: "all 0.4s ease",
          opacity: isActive ? 1 : 0.3,
          filter: isActive ? "none" : "brightness(0.4) grayscale(0.6)",
          transform: isActive ? "scale(1) translateY(0)" : "scale(0.92) translateY(8px)",
          zIndex: isActive ? 5 : 4,
        }}>
          {/* Character sprite image (pixel art portrait) */}
          <div style={{
            width: isDesktop ? 140 : 100, height: isDesktop ? 140 : 100,
            position: "relative",
            imageRendering: "pixelated",
          }}>
            <img
              src={`/images/tinysenpai/game/portrait_${charKey}.png`}
              alt=""
              style={{
                width: "100%", height: "100%", objectFit: "contain",
                imageRendering: "pixelated",
                filter: isActive ? `drop-shadow(0 0 16px ${charInfo.color}80)` : "none",
              }}
              onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
            />
            {/* Fallback: large kanji in a styled container */}
            <div style={{
              display: "none", width: "100%", height: "100%",
              alignItems: "center", justifyContent: "center",
              background: `radial-gradient(circle, ${charInfo.color}15 0%, transparent 70%)`,
              border: `2px solid ${charInfo.color}${isActive ? "50" : "20"}`,
              borderRadius: 12,
            }}>
              <span style={{
                fontSize: isDesktop ? 64 : 48, color: charInfo.color,
                filter: isActive ? `drop-shadow(0 0 12px ${charInfo.color})` : "none",
                fontFamily: uiFont,
              }}>{kanji}</span>
            </div>
          </div>
          {/* Name plate below sprite */}
          <div style={{
            textAlign: side === "left" ? "left" : "right",
            opacity: isActive ? 1 : 0.5,
          }}>
            <div style={{ fontSize: 13, fontFamily: uiFont, fontWeight: 700, color: charInfo.color, letterSpacing: ".06em" }}>
              {charInfo.name}
            </div>
            <div style={{ fontSize: 9, fontFamily: font, color: charInfo.color + "66", letterSpacing: ".08em" }}>
              {charInfo.nameEn}
            </div>
          </div>
        </div>
      );
    };

    return (
      <div style={{ ...overlay, background: scene.bg, cursor: "pointer", justifyContent: "flex-end" }} onClick={advanceStory}>
        <style>{cssFx}{`
          @keyframes charBreathe{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
          @keyframes dustDrift{0%{transform:translateY(0) translateX(0);opacity:0}10%{opacity:0.4}90%{opacity:0.3}100%{transform:translateY(-80px) translateX(30px);opacity:0}}
          @keyframes leafFall{0%{transform:translateY(-20px) rotate(0deg);opacity:0}10%{opacity:0.5}100%{transform:translateY(60px) rotate(180deg);opacity:0}}
          @keyframes emberRise{0%{transform:translateY(0) scale(1);opacity:0.7}100%{transform:translateY(-100px) scale(0.3);opacity:0}}
        `}</style>

        {/* ── Scene background layers ── */}
        {/* Scanline overlay */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)", pointerEvents: "none", animation: "scanmove 8s linear infinite", zIndex: 6 }} />
        {/* Vignette */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)", pointerEvents: "none", zIndex: 3 }} />
        {/* Scene filter (sepia for flashbacks) */}
        {scene.filter && <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backdropFilter: scene.filter, WebkitBackdropFilter: scene.filter, pointerEvents: "none", zIndex: 1 }} />}

        {/* ── Atmospheric particles ── */}
        {Array.from({ length: 12 }).map((_, i) => {
          const pType = scene.particles || "dust";
          const anim = pType === "leaves" ? "leafFall" : pType === "embers" ? "emberRise" : "dustDrift";
          const colors = { dust: "#aa9966", leaves: "#44aa44", embers: "#ff6622", petals: "#ff88aa" };
          return (
            <div key={i} style={{
              position: "absolute",
              left: `${8 + Math.random() * 84}%`,
              top: `${10 + Math.random() * 70}%`,
              width: pType === "embers" ? 4 : pType === "leaves" ? 8 : 3,
              height: pType === "leaves" ? 4 : pType === "embers" ? 4 : 3,
              borderRadius: pType === "leaves" ? "40% 60%" : "50%",
              background: colors[pType] || colors.dust,
              opacity: 0,
              animation: `${anim} ${3 + Math.random() * 4}s ease-in-out ${i * 0.5}s infinite`,
              pointerEvents: "none", zIndex: 2,
            }} />
          );
        })}

        {/* ── Scene label (watermark-style, centered) ── */}
        <div style={{
          position: "absolute", top: isDesktop ? 40 : 24, left: 0, right: 0,
          textAlign: "center", zIndex: 4, pointerEvents: "none",
        }}>
          <div style={{ fontSize: isDesktop ? 36 : 24, color: "rgba(255,255,255,0.06)", fontFamily: uiFont, letterSpacing: ".4em" }}>
            {scene.label}
          </div>
          <div style={{ fontSize: 10, fontFamily: font, color: "rgba(255,255,255,0.12)", letterSpacing: ".2em", marginTop: 2 }}>
            {scene.labelEn}
          </div>
        </div>

        {/* ── Character sprites — left (player) and right (NPC) ── */}
        {leftChar && <CharSprite side="left" charKey={leftChar} charInfo={leftInfo} isActive={activeSide === "left"} />}
        {rightChar && <CharSprite side="right" charKey={rightChar} charInfo={rightInfo} isActive={activeSide === "right"} />}

        {/* ── Ground line (subtle) ── */}
        <div style={{
          position: "absolute", bottom: isDesktop ? 178 : 158, left: 0, right: 0, height: 1,
          background: "linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.06) 70%, transparent 95%)",
          zIndex: 3, pointerEvents: "none",
        }} />

        {/* ── Dialogue box — bottom panel ── */}
        <div style={{
          width: "100%", maxWidth: 700, alignSelf: "center",
          padding: isDesktop ? "18px 28px 28px" : "14px 20px 24px",
          background: "linear-gradient(to bottom, rgba(6,6,14,0.92), rgba(6,6,14,0.97))",
          borderTop: `2px solid ${isSystem ? "#888899" : char.color}25`,
          position: "relative", zIndex: 7,
        }}>
          {/* Speaker name tag (inline, color-coded) */}
          {!isSystem && (
            <div style={{
              fontSize: 11, fontFamily: font, fontWeight: 700,
              color: char.color, letterSpacing: ".1em", marginBottom: 6,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ width: 8, height: 2, background: char.color, display: "inline-block" }} />
              {char.nameEn?.toUpperCase() || char.name}
              <span style={{ flex: 1, height: 1, background: char.color + "15" }} />
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.15)", fontWeight: 400 }}>
                {storyIndex + 1}/{storyLines.length}
              </span>
            </div>
          )}

          {/* System text — centered, italic */}
          {isSystem ? (
            <div style={{
              fontSize: 15, fontFamily: uiFont, color: "#888899",
              lineHeight: 1.8, textAlign: "center", fontStyle: "italic",
            }}>
              {line.textJp && <div style={{ fontSize: 14, color: "#888899aa", marginBottom: 4 }}>{typingDone ? line.textJp : line.textJp.slice(0, Math.floor(typedChars * (line.textJp.length / Math.max(1, fullText.length))))}</div>}
              {displayText}
              {!typingDone && <span style={{ opacity: 0.5 }}>▌</span>}
            </div>
          ) : (
            <>
              {/* Japanese text (smaller, above) */}
              {line.textJp && (
                <div style={{
                  fontSize: 13, fontFamily: uiFont, color: char.color + "77",
                  lineHeight: 1.5, marginBottom: 4, minHeight: 18,
                }}>
                  {typingDone ? line.textJp : line.textJp.slice(0, Math.floor(typedChars * (line.textJp.length / Math.max(1, fullText.length))))}
                </div>
              )}
              {/* English text (main, larger) */}
              <div style={{
                fontSize: isDesktop ? 18 : 16, fontFamily: uiFont, color: "#e8e6e0",
                lineHeight: 1.7, minHeight: 36,
              }}>
                {displayText}
                {!typingDone && <span style={{ opacity: 0.5, animation: "glitch 1s ease-in-out infinite" }}>▌</span>}
              </div>
            </>
          )}
          {/* Advance prompt */}
          {typingDone && (
            <div style={{
              fontSize: 10, fontFamily: font, color: "rgba(255,255,255,0.2)",
              letterSpacing: ".08em", marginTop: 10, textAlign: "right",
            }}>
              {isLast ? "▶ BEGIN" : "▶"}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══ MENU ═══
  if (screen === "menu") {
    return (
      <div style={{ ...overlay, background: c.bg, gap: 20 }}>
        <style>{cssFx}</style>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)", pointerEvents: "none", animation: "scanmove 8s linear infinite" }} />
        <img src="/images/tinysenpai/tinysenpai2.png" alt="TinySenpai" style={{ width: 96, height: 96, imageRendering: "pixelated", borderRadius: 12, filter: `drop-shadow(0 0 20px ${c.a}60)` }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, fontWeight: 900, fontFamily: font, color: c.a, letterSpacing: ".08em", ...glowText, animation: "glitch 3s ease-in-out infinite" }}>
            TINYSENPAI
          </div>
          <div style={{ fontSize: 48, color: c.tx, marginTop: 4, filter: `drop-shadow(0 0 10px ${c.a}40)` }}>斬</div>
          <div style={{ fontSize: 11, color: c.m, fontFamily: font, letterSpacing: ".1em", marginTop: 4 }}>スラッシュ・アクション</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16, alignItems: "center" }}>
          {hasSave && (
            <button onClick={handleContinue} style={{ ...btn, background: c.a, color: "#fff", fontSize: 18, padding: "14px 48px", minWidth: 200 }}>
              CONTINUE
            </button>
          )}
          <button onClick={handleNewGame} style={{ ...btn, background: hasSave ? c.s2 : c.a, color: hasSave ? c.tx : "#fff", fontSize: hasSave ? 14 : 18, padding: hasSave ? "10px 32px" : "14px 48px", minWidth: 200, border: hasSave ? `1px solid ${c.b}` : "none" }}>
            NEW GAME
          </button>
        </div>
        <div style={{ fontSize: 11, color: c.m, fontFamily: font, textAlign: "center", lineHeight: 1.8, marginTop: 8 }}>
          {isDesktop ? (
            <>WASD / Arrows — Move &amp; Jump<br/>J / Z — Slash &nbsp;&nbsp; L / C — Dash<br/>K / X / Shift — Focus &nbsp;&nbsp; S / ↓ — Ground Pound<br/>Slash during dash = Phase Through &nbsp;&nbsp; ESC — Pause</>
          ) : (
            <>Touch left/right to move<br/>Tap zones: Jump, Slash, Dash, Focus, Ground Pound</>
          )}
        </div>
        {highScore > 0 && (
          <div style={{ fontSize: 13, color: c.go, fontFamily: font, marginTop: 8, textShadow: `0 0 20px ${c.go}60` }}>
            HIGH SCORE: {String(highScore).padStart(5, "0")}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {hasSave && (
            <button onClick={() => setScreen("stageSelect")} style={{ ...btn, background: "transparent", color: c.m, fontSize: 12, padding: "8px 16px", border: `1px solid ${c.b}` }}>
              STAGE SELECT
            </button>
          )}
          <button onClick={handleToggleMute} style={{ ...btn, background: "transparent", color: c.m, fontSize: 12, padding: "8px 16px", border: `1px solid ${c.b}` }}>
            {muted ? "UNMUTE" : "MUTE"} SFX
          </button>
        </div>
      </div>
    );
  }

  // ═══ STAGE SELECT ═══
  if (screen === "stageSelect") {
    const save = loadSave();
    const maxRoom = save ? save.currentRoom : 0;
    const stars = save ? (save.roomStars || []) : [];
    return (
      <div style={{ ...overlay, background: c.bg, gap: 12, padding: 20 }}>
        <style>{cssFx}</style>
        <div style={{ fontSize: 22, fontWeight: 900, fontFamily: font, color: c.a, letterSpacing: ".08em" }}>
          STAGE SELECT
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, maxWidth: 400, width: "100%", marginTop: 12, maxHeight: isDesktop ? 400 : 280, overflowY: "auto" }}>
          {ROOMS.slice(0, maxRoom + 1).map((room, i) => {
            const starCount = stars[i] || 0;
            const title = room.title ? room.title.jp : `${i + 1}`;
            return (
              <button
                key={i}
                onClick={() => startGame(i)}
                style={{
                  ...btn,
                  background: i === maxRoom ? c.a + "30" : c.s2,
                  color: c.tx,
                  padding: "8px 4px",
                  fontSize: 11,
                  border: `1px solid ${i < maxRoom ? c.b : c.a}`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                  minHeight: 50,
                }}
              >
                <div style={{ fontSize: 14 }}>{title}</div>
                <div style={{ fontSize: 9, color: c.m }}>{i + 1}</div>
                {starCount > 0 && (
                  <div style={{ fontSize: 10, color: "#ffdd44" }}>
                    {"★".repeat(starCount)}{"☆".repeat(3 - starCount)}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <button onClick={() => setScreen("menu")} style={{ ...btn, background: c.s2, color: c.tx, border: `1px solid ${c.b}`, marginTop: 12 }}>
          BACK
        </button>
      </div>
    );
  }

  // ═══ PAUSED ═══
  if (screen === "paused") {
    return (
      <div style={{ ...gameContainer, background: "#000" }}>
        <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)" }}>
          <div style={{ fontSize: 32, fontWeight: 900, fontFamily: font, color: c.tx, letterSpacing: ".1em" }}>PAUSED</div>
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button onClick={() => { if (gameRef.current) gameRef.current.time.last = performance.now(); setScreen("playing"); }} style={{ ...btn, background: c.a, color: "#fff" }}>RESUME</button>
            <button onClick={() => setScreen("menu")} style={{ ...btn, background: c.s2, color: c.tx, border: `1px solid ${c.b}` }}>QUIT</button>
          </div>
        </div>
      </div>
    );
  }

  // No dead screen — instant restart handles death in-game

  // ═══ VICTORY ═══
  if (screen === "victory") {
    return (
      <div style={{ ...overlay, background: c.bg }}>
        <div style={{ fontSize: 36, fontWeight: 900, fontFamily: font, color: c.go, letterSpacing: ".08em", textShadow: `0 0 30px ${c.go}60` }}>
          MISSION COMPLETE
        </div>
        <div style={{ fontSize: 14, fontFamily: font, color: c.m, marginTop: 8 }}>斬り捨て御免</div>
        <div style={{ marginTop: 20, textAlign: "center", fontFamily: font }}>
          <div style={{ fontSize: 22, color: c.tx }}>SCORE: {String(score).padStart(5, "0")}</div>
          {maxCombo > 1 && <div style={{ fontSize: 14, color: "#ffa040", marginTop: 6 }}>MAX COMBO: x{maxCombo}</div>}
          {score >= highScore && score > 0 && (
            <div style={{ fontSize: 14, color: c.go, marginTop: 8, fontWeight: 700 }}>NEW HIGH SCORE!</div>
          )}
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button onClick={handleNewGame} style={{ ...btn, background: c.a, color: "#fff" }}>PLAY AGAIN</button>
          <button onClick={() => setScreen("menu")} style={{ ...btn, background: c.s2, color: c.tx, border: `1px solid ${c.b}` }}>BACK</button>
        </div>
      </div>
    );
  }

  // ═══ PLAYING (also handles story scenes on canvas) ═══
  const handleCanvasClick = () => {
    const g = gameRef.current;
    if (g && g.gameState === "story" && g.input) {
      g.input.storyAdvance = true;
    }
  };
  return (
    <div style={{ ...gameContainer, background: "#0a0a14", overflow: "hidden", touchAction: "none" }}>
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%", cursor: gameRef.current?.gameState === "story" ? "pointer" : "default" }}
        onClick={handleCanvasClick}
      />
    </div>
  );
}
