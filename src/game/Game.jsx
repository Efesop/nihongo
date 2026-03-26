import { useState, useEffect, useRef, useCallback } from "react";
import { TILE, SCALE, GROUND_Y, TOTAL_ROOMS } from "./constants.js";
import { getSprite, loadMascotImage } from "./sprites.js";
import { ROOMS } from "./levels.js";
import { makePlayer, makeEnemy } from "./entities.js";
import { update, loadRoom, loadSave, deleteSave } from "./engine.js";
import { render } from "./renderer.js";
import { setupKeyboard, setupTouch } from "./input.js";
import { initAudio, playSound, playRandom, toggleMute, isMuted, startMusic, stopMusic, isAudioReady } from "./audio.js";

// ═══ STORY BEATS ═══
const STORY = {
  intro: [
    { speaker: "???", text: "The village burns. The oni have returned." },
    { speaker: "先生", text: "You are the last blade standing. Take this katana." },
    { speaker: "先生", text: "Cut through the forest. Find the temple. End this." },
  ],
  act1End: [
    { speaker: "主人公", text: "The forest is clear... but the corruption runs deeper." },
    { speaker: "先生", text: "The temple gardens ahead were once sacred ground." },
    { speaker: "先生", text: "Now the tengu have claimed them. Be ready." },
  ],
  act2End: [
    { speaker: "主人公", text: "The Great Tengu falls... but I feel a darker presence." },
    { speaker: "先生", text: "You have proven yourself worthy, warrior." },
    { speaker: "先生", text: "The path ahead leads to the neon city. Rest now..." },
  ],
};

// Map: which story plays before which room
const STORY_TRIGGERS = {
  0: "intro",       // before first room
  15: "act1End",    // before Act 2
};

export default function Game({ theme, c, isDesktop, SIDEBAR_W }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const rafRef = useRef(null);
  const startRoomRef = useRef(0); // which room to start from (for continue)
  const [screen, setScreen] = useState("menu");
  const [hasSave, setHasSave] = useState(() => !!loadSave());
  const [storyLines, setStoryLines] = useState([]);
  const [storyIndex, setStoryIndex] = useState(0);
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

    const g = initGame();
    if (!g) return;
    gameRef.current = g;

    const cleanupKeys = setupKeyboard(gameRef, setScreen);
    const cleanupTouch = setupTouch(canvas, gameRef);

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

  // Load story from engine trigger (mid-game story between acts)
  useEffect(() => {
    if (screen !== "story" || storyLines.length > 0) return;
    const g = gameRef.current;
    if (g && g._pendingStoryKey && STORY[g._pendingStoryKey]) {
      setStoryLines(STORY[g._pendingStoryKey]);
      setStoryIndex(0);
      g._pendingStoryKey = null;
    }
  }, [screen, storyLines.length]);

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
    startMusic();
    setScore(0);
    setMaxCombo(0);
    // Check if there's a story trigger for this room
    const storyKey = STORY_TRIGGERS[fromRoom];
    if (storyKey && STORY[storyKey]) {
      setStoryLines(STORY[storyKey]);
      setStoryIndex(0);
      setScreen("story");
    } else {
      setScreen("playing");
    }
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

  // ═══ STORY ═══
  if (screen === "story" && storyLines.length > 0) {
    const line = storyLines[storyIndex] || storyLines[storyLines.length - 1];
    const isLast = storyIndex >= storyLines.length - 1;
    const advanceStory = () => {
      if (isLast) {
        setStoryLines([]);
        setStoryIndex(0);
        // If we have a pending room from mid-game story trigger, load it
        const g = gameRef.current;
        if (g && g._pendingRoom !== null && g._pendingRoom !== undefined) {
          loadRoom(g, g._pendingRoom);
          g._pendingRoom = null;
          g.time.last = performance.now();
        }
        setScreen("playing");
      } else {
        setStoryIndex(i => i + 1);
      }
    };
    return (
      <div style={{ ...overlay, background: "#0a0a14", cursor: "pointer" }} onClick={advanceStory}>
        <style>{cssFx}</style>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)", pointerEvents: "none", animation: "scanmove 8s linear infinite" }} />
        <div style={{ maxWidth: 500, padding: "0 24px", textAlign: "center" }}>
          <div style={{ fontSize: 13, fontFamily: font, color: c.a, letterSpacing: ".15em", marginBottom: 16 }}>
            {line.speaker}
          </div>
          <div style={{ fontSize: 18, fontFamily: uiFont, color: c.tx, lineHeight: 1.7, minHeight: 60 }}>
            {line.text}
          </div>
          <div style={{ fontSize: 11, fontFamily: font, color: c.m, marginTop: 32, letterSpacing: ".08em", animation: "glitch 4s ease-in-out infinite" }}>
            {isLast ? "CLICK TO BEGIN" : "CLICK TO CONTINUE"}
          </div>
          <div style={{ fontSize: 10, fontFamily: font, color: c.m + "80", marginTop: 8 }}>
            {storyIndex + 1} / {storyLines.length}
          </div>
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

  // ═══ PLAYING ═══
  return (
    <div style={{ ...gameContainer, background: "#0a0a14", overflow: "hidden", touchAction: "none" }}>
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}
