import { useState, useEffect, useRef, useCallback } from "react";
import { TILE, SCALE, GROUND_Y, TOTAL_ROOMS } from "./constants.js";
import { getSprite, loadMascotImage } from "./sprites.js";
import { ROOMS } from "./levels.js";
import { makePlayer, makeEnemy } from "./entities.js";
import { update } from "./engine.js";
import { render } from "./renderer.js";
import { setupKeyboard, setupTouch } from "./input.js";
import { initAudio, playSound, toggleMute, isMuted, startMusic, stopMusic } from "./audio.js";

export default function Game({ theme, c, isDesktop, SIDEBAR_W }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const rafRef = useRef(null);
  const [screen, setScreen] = useState("menu");
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

    // Load room 0
    const room = ROOMS[0];
    const platforms = room.platforms.map(p => ({ x: p.x, y: groundY + p.y, w: p.w, h: p.h || 16, ...(p.wall && { wall: true }) }));
    const enemies = room.enemies.map(e => makeEnemy(e.type, e.x, groundY + (e.y || 0)));
    const decorations = (room.deco || []).map(d => ({ type: d.type, x: d.x, y: groundY }));
    const shadows = (room.shadows || []).map(s => ({ x: s.x, w: s.w, y: groundY }));
    const levelW = Math.max(...room.platforms.map(p => p.x + p.w));

    return {
      W, H, groundY, levelW,
      player: makePlayer(groundY, room.playerStart || 100),
      camera: { x: 0, y: 0, shakeX: 0, shakeY: 0, shakeTimer: 0, zoom: 1, zoomTarget: 1, lookAhead: 0 },
      platforms, enemies, decorations, shadows,
      particles: [], slashEffects: [], projectiles: [],
      embers: [], floatingTexts: [],
      slowMo: { active: false, meter: 100, max: 100 },
      input: { left: false, right: false, up: false, slash: false, slowmo: false, dash: false,
               slashPressed: false, jumpPressed: false, dashPressed: false },
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
      letterbox: 0, // 0-1 progress of letterbox bars
      fadeOverlay: 0, // 0-1 opacity of black fade
      roomTitle: null, // { text, timer } for "ROOM X" display
    };
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

  const startGame = async () => {
    initAudio();
    await loadMascotImage();
    playSound("menuStart");
    startMusic();
    setScore(0);
    setMaxCombo(0);
    setScreen("playing");
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

  // ═══ MENU ═══
  if (screen === "menu") {
    return (
      <div style={{ ...overlay, background: c.bg, gap: 20 }}>
        <style>{cssFx}</style>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)", pointerEvents: "none", animation: "scanmove 8s linear infinite" }} />
        <img src="/images/tinysenpai2.png" alt="TinySenpai" style={{ width: 96, height: 96, imageRendering: "pixelated", borderRadius: 12, filter: `drop-shadow(0 0 20px ${c.a}60)` }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, fontWeight: 900, fontFamily: font, color: c.a, letterSpacing: ".08em", ...glowText, animation: "glitch 3s ease-in-out infinite" }}>
            TINYSENPAI
          </div>
          <div style={{ fontSize: 48, color: c.tx, marginTop: 4, filter: `drop-shadow(0 0 10px ${c.a}40)` }}>斬</div>
          <div style={{ fontSize: 11, color: c.m, fontFamily: font, letterSpacing: ".1em", marginTop: 4 }}>スラッシュ・アクション</div>
        </div>
        <button onClick={startGame} style={{ ...btn, background: c.a, color: "#fff", marginTop: 16, fontSize: 18, padding: "14px 48px" }}>
          START
        </button>
        <div style={{ fontSize: 11, color: c.m, fontFamily: font, textAlign: "center", lineHeight: 1.8, marginTop: 8 }}>
          {isDesktop ? (
            <>WASD / Arrows — Move &amp; Jump<br/>J / Z — Slash &nbsp;&nbsp; L / C — Dash<br/>K / X / Shift — Focus &nbsp;&nbsp; ESC — Pause</>
          ) : (
            <>Touch left/right to move<br/>Touch to jump, slash, dash &amp; focus</>
          )}
        </div>
        {highScore > 0 && (
          <div style={{ fontSize: 13, color: c.go, fontFamily: font, marginTop: 8, textShadow: `0 0 20px ${c.go}60` }}>
            HIGH SCORE: {String(highScore).padStart(5, "0")}
          </div>
        )}
        <button onClick={handleToggleMute} style={{ ...btn, background: "transparent", color: c.m, fontSize: 12, padding: "8px 16px", marginTop: 12, border: `1px solid ${c.b}` }}>
          {muted ? "UNMUTE" : "MUTE"} SFX
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
          <button onClick={startGame} style={{ ...btn, background: c.a, color: "#fff" }}>PLAY AGAIN</button>
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
