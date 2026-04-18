import { useEffect, useRef, useState } from "react";
import { fontJa, T, JP, mono } from "../../data/constants.js";
import { IconPlay, IconCheck, IconX } from "../Icons.jsx";
import { TypeLabel } from "../SessionParts.jsx";
import SceneIntro from "./SceneIntro.jsx";
import ShadowExercise from "../ShadowExercise.jsx";

/**
 * SceneRolePlay — fourth and final scene mode.
 *
 * User picks which speaker to play. App plays the other speaker's lines.
 * At the user's turn, a mic prompt lets them speak the line and get
 * pass/fail feedback via ShadowExercise.
 *
 * Completion criteria: ≥70% of user's lines matched.
 */
export default function SceneRolePlay({ scene, knownWords = [], onComplete, c, btn, card, isDesktop }) {
  const [phase, setPhase] = useState("intro"); // intro | select | play
  const [myRole, setMyRole] = useState("b"); // "a" or "b"
  const [lineIdx, setLineIdx] = useState(0);
  const [results, setResults] = useState([]); // only user's lines
  const [audioFinished, setAudioFinished] = useState(false);
  const audioRef = useRef(null);

  const myLineIndices = scene.lines.map((l, i) => l.speaker === myRole ? i : -1).filter(i => i >= 0);
  const myLineCount = myLineIndices.length;

  const playAppLine = (i) => {
    const pad = String(i).padStart(2, "0");
    setAudioFinished(false);
    if (audioRef.current) {
      audioRef.current.src = `/audio/scenes/${scene.id}-${pad}.mp3`;
      audioRef.current.onended = () => {
        setAudioFinished(true);
        // Auto-advance to next line after a beat
        setTimeout(() => advanceLine(), 600);
      };
      audioRef.current.play().catch(() => {
        // If audio fails, still advance after brief pause
        setTimeout(() => { setAudioFinished(true); advanceLine(); }, 800);
      });
    }
  };

  const advanceLine = () => {
    if (lineIdx + 1 >= scene.lines.length) {
      // All done
      finish();
    } else {
      setLineIdx(lineIdx + 1);
    }
  };

  const finish = () => {
    const correctCount = results.filter(Boolean).length;
    const pass = myLineCount === 0 || correctCount >= Math.ceil(myLineCount * 0.7);
    onComplete?.(pass, correctCount, myLineCount);
  };

  // When in play phase, if current line is app's, auto-play it
  useEffect(() => {
    if (phase !== "play") return;
    const line = scene.lines[lineIdx];
    if (!line) return;
    if (line.speaker !== myRole) {
      // App plays
      playAppLine(lineIdx);
    }
  }, [phase, lineIdx]);

  const handleMyLine = (matched) => {
    const next = [...results, matched];
    setResults(next);
    advanceLine();
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
      <TypeLabel c={c}>SCENE — ROLE PLAY</TypeLabel>
      <SceneIntro
        scene={scene}
        modeLabel="Role play"
        knownWords={knownWords}
        onStart={() => setPhase("select")}
        onPlayWord={playWord}
        c={c} btn={btn}
      />
      <audio ref={audioRef} preload="auto" />
    </>;
  }

  // ═══ ROLE SELECT ═══
  if (phase === "select") {
    const roleA = scene.lines.find(l => l.speaker === "a")?.role || "A";
    const roleB = scene.lines.find(l => l.speaker === "b")?.role || "B";
    const countA = scene.lines.filter(l => l.speaker === "a").length;
    const countB = scene.lines.filter(l => l.speaker === "b").length;

    const RoleBtn = ({ role, name, count, color }) => <button
      className="ts-btn"
      onClick={() => { setMyRole(role); setPhase("play"); }}
      style={{
        ...btn, flex: 1, padding: "18px 16px", borderRadius: 12,
        background: c.s2, border: `2px solid ${color}`, color: c.tx,
        display: "flex", flexDirection: "column", gap: 6, alignItems: "center",
      }}>
      <div style={{ fontSize: T.xs, fontWeight: 700, color, letterSpacing: 0.5 }}>PLAY AS</div>
      <div style={{ fontSize: T.lg, fontWeight: 700 }}>{name}</div>
      <div style={{ fontSize: T.xs, color: c.m }}>{count} line{count === 1 ? "" : "s"} to speak</div>
    </button>;

    return <>
      <TypeLabel c={c}>SCENE — PICK YOUR ROLE</TypeLabel>
      <div style={{ ...card, padding: 16, marginBottom: 12, textAlign: "center" }}>
        <div style={{ fontSize: T.base, fontWeight: 700, color: c.tx, marginBottom: 4 }}>
          {scene.emoji} {scene.title}
        </div>
        <div style={{ fontSize: T.sm, color: c.m }}>
          You'll speak one side of the conversation. The app plays the other.
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <RoleBtn role="a" name={roleA} count={countA} color="#f48fb1" />
        <RoleBtn role="b" name={roleB} count={countB} color="#64b5f6" />
      </div>
    </>;
  }

  // ═══ PLAY ═══
  const line = scene.lines[lineIdx];
  if (!line) return null;

  const isMyTurn = line.speaker === myRole;
  const isKonoha = line.speaker === "a";
  const accent = isKonoha ? "#f48fb1" : "#64b5f6";

  const header = <div style={{ ...card, padding: 14, marginBottom: 12 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
      <div style={{ fontSize: T.sm, fontWeight: 700, color: c.tx }}>{scene.emoji} {scene.title}</div>
      <div style={{ fontSize: T.xs, color: c.m }}>{lineIdx + 1} / {scene.lines.length}</div>
    </div>
    {/* Progress dots */}
    <div style={{ display: "flex", gap: 4 }}>
      {scene.lines.map((l, i) => {
        const mine = l.speaker === myRole;
        const myPos = myLineIndices.indexOf(i);
        const answered = mine && myPos >= 0 && myPos < results.length;
        return <div key={i} style={{
          flex: 1, height: 4, borderRadius: 2,
          background: answered ? (results[myPos] ? c.g : c.a)
            : i === lineIdx ? (mine ? c.ac : c.m)
            : c.b,
          opacity: mine ? 1 : 0.4,
        }} />;
      })}
    </div>
  </div>;

  const lineCard = <div style={{
    ...card, padding: "16px 20px", borderLeft: `3px solid ${accent}`,
    marginBottom: isMyTurn ? 12 : 14,
    background: isMyTurn ? accent + "10" : c.s,
  }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
      <span style={{ fontSize: T.xs, fontWeight: 700, color: accent, letterSpacing: 0.5 }}>
        {line.role.toUpperCase()}{isMyTurn ? " — YOU" : ""}
      </span>
      {isMyTurn && <span style={{ fontSize: T.xs, color: c.a, fontWeight: 700 }}>🎤 YOUR TURN</span>}
    </div>
    <div style={{
      fontSize: isDesktop ? JP.size.desktop : JP.size.mobile,
      fontFamily: fontJa, fontWeight: JP.weight, color: c.tx, lineHeight: JP.lineHeight,
    }}>
      {line.jp}
    </div>
    <div style={{ fontSize: T.xs, fontFamily: mono, color: c.ro, marginTop: 4 }}>{line.romaji}</div>
    <div style={{ fontSize: T.sm, color: c.m, fontStyle: "italic", marginTop: 4 }}>{line.en}</div>
  </div>;

  return <>
    <TypeLabel c={c}>SCENE — ROLE PLAY</TypeLabel>
    {header}
    {lineCard}

    {isMyTurn ? (
      <ShadowExercise
        key={lineIdx}
        targetJp={line.jp}
        onComplete={(matched) => handleMyLine(matched)}
        compact
        c={c} btn={btn} card={card}
      />
    ) : (
      <div style={{ ...card, padding: "14px 18px", textAlign: "center" }}>
        <div style={{ fontSize: T.sm, color: c.m }}>
          {audioFinished ? "→ next line…" : "🔊 playing..."}
        </div>
      </div>
    )}

    <audio ref={audioRef} preload="auto" />
  </>;
}
