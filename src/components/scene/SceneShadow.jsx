import { useEffect, useRef, useState } from "react";
import { fontJa, T, JP, mono, SPEAKER_COLORS } from "../../data/constants.js";
import { IconPlay, IconCheck, IconX } from "../Icons.jsx";
import { TypeLabel } from "../SessionParts.jsx";
import SceneIntro from "./SceneIntro.jsx";
import ShadowExercise from "../ShadowExercise.jsx";

/**
 * SceneShadow — third scene encounter.
 *
 * For each line in the scene: hear it, then repeat. Uses shared ShadowExercise
 * primitive. Completion: ≥70% correct passes the scene.
 *
 * Phases:
 *   "intro" — preview card
 *   "play"  — line-by-line shadow
 *   (no separate done phase; last onComplete triggers parent advance)
 */
export default function SceneShadow({ scene, knownWords = [], onComplete, c, btn, card, isDesktop, silentMode = false }) {
  const [phase, setPhase] = useState("intro");
  const [lineIdx, setLineIdx] = useState(0);
  const [results, setResults] = useState([]); // array of bool per line
  const [showPrompt, setShowPrompt] = useState(false); // true once user hears the line
  const audioRef = useRef(null);

  const playLine = (i) => {
    const pad = String(i).padStart(2, "0");
    if (audioRef.current) {
      audioRef.current.src = `/audio/scenes/${scene.id}-${pad}.mp3`;
      audioRef.current.onended = () => setShowPrompt(true);
      audioRef.current.play().catch(() => setShowPrompt(true));
    } else {
      setShowPrompt(true);
    }
  };

  useEffect(() => {
    if (phase !== "play") return;
    setShowPrompt(false);
    playLine(lineIdx);
  }, [phase, lineIdx]);

  const handleLineComplete = (matched, graded) => {
    const next = [...results, matched];
    setResults(next);
    if (lineIdx + 1 >= scene.lines.length) {
      const correctCount = next.filter(Boolean).length;
      const pass = correctCount >= Math.ceil(scene.lines.length * 0.7);
      onComplete?.(pass, correctCount, scene.lines.length);
    } else {
      setLineIdx(lineIdx + 1);
    }
  };

  const playWord = (jp) => {
    const utter = new SpeechSynthesisUtterance(jp);
    utter.lang = "ja-JP";
    speechSynthesis.speak(utter);
  };

  useEffect(() => () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.onended = null; }
  }, []);

  // ═══ INTRO ═══
  if (phase === "intro") {
    return <>
      <TypeLabel c={c}>SCENE — REPEAT AFTER ME</TypeLabel>
      <SceneIntro
        scene={scene}
        modeLabel="Repeat after me"
        knownWords={knownWords}
        onStart={() => setPhase("play")}
        onPlayWord={playWord}
        c={c} btn={btn}
      />
      <audio ref={audioRef} preload="auto" />
    </>;
  }

  // ═══ PLAY ═══
  const line = scene.lines[lineIdx];
  const isKonoha = line.speaker === "a";
  const accent = isKonoha ? SPEAKER_COLORS.konoha : SPEAKER_COLORS.akira;

  const lineHero = <>
    {/* Header */}
    <div style={{ ...card, padding: 14, marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: T.sm, fontWeight: 700, color: c.tx }}>{scene.emoji} {scene.title}</div>
        <div style={{ fontSize: T.xs, color: c.m }}>{lineIdx + 1} / {scene.lines.length}</div>
      </div>
      {/* Progress dots */}
      <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
        {scene.lines.map((_, i) => <div key={i} style={{
          flex: 1, height: 4, borderRadius: 2,
          background: i < results.length ? (results[i] ? c.g : c.a) : i === lineIdx ? c.ac : c.b,
        }} />)}
      </div>
    </div>

    {/* Line card */}
    <div style={{ ...card, padding: "18px 20px", borderLeft: `3px solid ${accent}`, marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: T.xs, fontWeight: 700, color: accent, letterSpacing: 0.5 }}>{line.role.toUpperCase()}</span>
        <button className="ts-btn" onClick={() => playLine(lineIdx)}
          style={{ ...btn, padding: "4px 10px", borderRadius: 6, background: "transparent", border: "1px solid " + c.b, color: c.m, fontSize: T.xs, display: "flex", alignItems: "center", gap: 4 }}>
          <IconPlay size={12} /> hear again
        </button>
      </div>
      <div style={{
        fontSize: isDesktop ? JP.size.desktop : JP.size.mobile,
        fontFamily: fontJa, fontWeight: JP.weight,
        color: showPrompt ? c.tx : c.m, opacity: showPrompt ? 1 : 0.5,
        lineHeight: JP.lineHeight, marginBottom: 6,
        transition: "all .3s",
      }}>
        {line.jp}
      </div>
      <div style={{ fontSize: T.xs, fontFamily: mono, color: c.ro }}>{line.romaji}</div>
      <div style={{ fontSize: T.sm, color: c.m, fontStyle: "italic", marginTop: 4 }}>{line.en}</div>
    </div>
  </>;

  return <>
    <TypeLabel c={c}>SCENE — REPEAT AFTER ME</TypeLabel>
    {showPrompt ? (
      <ShadowExercise
        key={lineIdx}
        targetJp={line.jp}
        silentMode={silentMode}
        onComplete={handleLineComplete}
        onSlowPlay={() => playLine(lineIdx)}
        compact
        c={c} btn={btn} card={card}
      >
        {lineHero}
      </ShadowExercise>
    ) : (
      <>{lineHero}
        <div style={{ ...card, padding: "18px 20px", textAlign: "center", marginTop: 4 }}>
          <div style={{ fontSize: T.base, color: c.m }}>👂 Listen first...</div>
        </div>
      </>
    )}
    <audio ref={audioRef} preload="auto" />
  </>;
}
