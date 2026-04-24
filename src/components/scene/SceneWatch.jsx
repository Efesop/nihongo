import { useEffect, useRef, useState } from "react";
import { fontJa, T, JP, mono, SPEAKER_COLORS } from "../../data/constants.js";
import { IconPlay, IconRefresh, IconCheck, IconX } from "../Icons.jsx";
import { TypeLabel } from "../SessionParts.jsx";
import SceneIntro from "./SceneIntro.jsx";
import KaraokeText from "./KaraokeText.jsx";

/**
 * SceneWatch — first-encounter scene mode.
 * Renders the full scene-watch exercise: intro card → auto-play scene → comprehension Q.
 *
 * Phases:
 *   "intro"  — preview card (title, known/new words, "I'm ready")
 *   "play"   — auto-plays each line sequentially, karaoke highlight, speaker bubbles
 *   "quiz"   — 1 comprehension question
 *   "done"   — result card, "Next" to advance
 *
 * Props:
 *   scene          — SCENE_STUDIES entry
 *   knownWords     — pre-computed list of vocab user already knows from scene
 *   onComplete     — (correct: boolean) => void  (marks scene progression + advance)
 *   c, btn, card, isDesktop
 */
export default function SceneWatch({ scene, knownWords = [], onComplete, c, btn, card, isDesktop }) {
  const [phase, setPhase] = useState("intro");
  const [lineIdx, setLineIdx] = useState(-1);
  const [showEn, setShowEn] = useState(false);
  const [showRomaji, setShowRomaji] = useState(false);
  const [quizPicked, setQuizPicked] = useState(null);
  const [alignments, setAlignments] = useState({}); // {lineIdx: alignment}
  const audioRef = useRef(null);
  const advanceTimerRef = useRef(null);

  // Pre-load alignment JSONs for all lines (karaoke data)
  useEffect(() => {
    if (phase !== "play") return;
    let cancelled = false;
    (async () => {
      const next = {};
      for (let i = 0; i < scene.lines.length; i++) {
        const pad = String(i).padStart(2, "0");
        try {
          const res = await fetch(`/audio/scenes/${scene.id}-${pad}.json`);
          if (res.ok) next[i] = await res.json();
        } catch { /* missing alignment = no karaoke, still works */ }
      }
      if (!cancelled) setAlignments(next);
    })();
    return () => { cancelled = true; };
  }, [phase, scene.id]);

  const playLine = (i) => {
    if (i >= scene.lines.length) {
      setLineIdx(scene.lines.length); // freeze past end
      // Move to quiz after short pause
      advanceTimerRef.current = setTimeout(() => setPhase("quiz"), 500);
      return;
    }
    setLineIdx(i);
    const pad = String(i).padStart(2, "0");
    const src = `/audio/scenes/${scene.id}-${pad}.mp3`;
    if (audioRef.current) {
      audioRef.current.src = src;
      audioRef.current.play().catch(() => {});
      audioRef.current.onended = () => {
        advanceTimerRef.current = setTimeout(() => playLine(i + 1), 400);
      };
    }
  };

  const playWord = (jp) => {
    // Scene-intro tap: play the word using the existing phrase audio proxy (Google TTS)
    // We don't have per-word audio; use speech synthesis fallback.
    const utter = new SpeechSynthesisUtterance(jp);
    utter.lang = "ja-JP";
    speechSynthesis.speak(utter);
  };

  const startPlay = () => {
    setPhase("play");
    setLineIdx(-1);
    setTimeout(() => playLine(0), 300);
  };

  const replayLine = (i) => {
    if (audioRef.current) {
      clearTimeout(advanceTimerRef.current);
      audioRef.current.onended = null;
      playLine(i);
    }
  };

  // Cleanup on unmount
  useEffect(() => () => {
    clearTimeout(advanceTimerRef.current);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.onended = null; }
  }, []);

  // ═══ INTRO PHASE ═══
  if (phase === "intro") {
    return <>
      <TypeLabel c={c}>SCENE — WATCH</TypeLabel>
      <SceneIntro
        scene={scene}
        modeLabel="Watch"
        knownWords={knownWords}
        onStart={startPlay}
        onPlayWord={playWord}
        c={c} btn={btn}
      />
      <audio ref={audioRef} preload="auto" />
    </>;
  }

  // ═══ PLAY PHASE ═══
  if (phase === "play") {
    const visibleLines = scene.lines.slice(0, Math.max(0, lineIdx + 1));
    return <>
      <TypeLabel c={c}>SCENE — WATCH</TypeLabel>
      <div style={{ ...card, padding: 14, marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: T.sm, fontWeight: 700, color: c.tx }}>{scene.emoji} {scene.title}</div>
          <div style={{ fontSize: T.xs, color: c.m }}>{Math.min(lineIdx + 1, scene.lines.length)} / {scene.lines.length}</div>
        </div>
        {/* Toggle strip */}
        <div style={{ display: "flex", gap: 6, fontSize: T.xs }}>
          <button className="ts-btn" onClick={() => setShowRomaji(v => !v)}
            style={{ ...btn, padding: "4px 10px", borderRadius: 6, background: showRomaji ? c.ac + "30" : c.s2, color: showRomaji ? c.ac : c.m, border: "1px solid " + c.b }}>
            Romaji {showRomaji ? "ON" : "OFF"}
          </button>
          <button className="ts-btn" onClick={() => setShowEn(v => !v)}
            style={{ ...btn, padding: "4px 10px", borderRadius: 6, background: showEn ? c.ac + "30" : c.s2, color: showEn ? c.ac : c.m, border: "1px solid " + c.b }}>
            English {showEn ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* Bubbles */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
        {visibleLines.map((ln, i) => {
          const isKonoha = ln.speaker === "a";
          const accent = isKonoha ? SPEAKER_COLORS.konoha : SPEAKER_COLORS.akira;
          const active = i === lineIdx;
          return <div key={i} className="ts-reveal" style={{
            background: c.s, border: "1px solid " + c.b, borderRadius: 12,
            padding: "12px 14px",
            borderLeft: `3px solid ${accent}`,
            opacity: active ? 1 : 0.85,
            transition: "opacity .3s ease-out",
            display: "flex", flexDirection: "column", gap: 4,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: T.xs, fontWeight: 700, color: accent, letterSpacing: 0.5 }}>
                {ln.role.toUpperCase()}
              </span>
              <button className="ts-btn" onClick={() => replayLine(i)}
                style={{ ...btn, padding: "4px 8px", borderRadius: 6, background: "transparent", border: "1px solid " + c.b, color: c.m, fontSize: T.xs, display: "flex", alignItems: "center", gap: 4 }}>
                <IconRefresh size={12} /> replay
              </button>
            </div>
            <div style={{ fontSize: isDesktop ? JP.size.desktop : JP.size.mobile, fontFamily: fontJa, fontWeight: JP.weight, color: c.tx, lineHeight: JP.lineHeight }}>
              {active && alignments[i]
                ? <KaraokeText text={ln.jp} alignment={alignments[i]} audioRef={audioRef} fontSize={isDesktop ? JP.size.desktop : JP.size.mobile} color={c.tx} activeColor={accent} />
                : ln.jp}
            </div>
            {showRomaji && <div style={{ fontSize: T.xs, fontFamily: mono, color: c.m }}>{ln.romaji}</div>}
            {showEn && <div style={{ fontSize: T.sm, color: c.m, fontStyle: "italic" }}>{ln.en}</div>}
          </div>;
        })}
      </div>
      <audio ref={audioRef} preload="auto" />
    </>;
  }

  // ═══ QUIZ PHASE ═══
  if (phase === "quiz") {
    const q = scene.comprehension?.[0];
    if (!q) { setPhase("done"); return null; }

    const pick = (idx) => {
      setQuizPicked(idx);
      const correct = idx === q.correct;
      setTimeout(() => onComplete?.(correct), 1200);
    };

    return <>
      <TypeLabel c={c}>SCENE — QUICK CHECK</TypeLabel>
      <div style={{ ...card, padding: 20, marginBottom: 12 }}>
        <div style={{ fontSize: T.md, fontWeight: 700, color: c.tx, marginBottom: 14 }}>
          {q.q}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {q.options.map((opt, i) => {
            const picked = quizPicked === i;
            const isCorrect = picked && i === q.correct;
            const isWrong = picked && i !== q.correct;
            let bg = c.s2, border = c.b, col = c.tx;
            if (isCorrect) { bg = c.gs; border = c.g; col = c.g; }
            if (isWrong) { bg = c.rs; border = c.a; col = c.a; }
            return <button key={i} className="ts-btn"
              onClick={() => !quizPicked && pick(i)}
              disabled={quizPicked !== null}
              style={{
                ...btn, padding: "14px 16px", borderRadius: 10,
                border: "2px solid " + border, background: bg, color: col,
                fontSize: T.base, fontWeight: 600,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                transition: "all .15s",
              }}>
              <span>{opt}</span>
              {isCorrect && <IconCheck size={18} />}
              {isWrong && <IconX size={18} />}
            </button>;
          })}
        </div>
        {quizPicked !== null && q.explanation && <div style={{
          marginTop: 12, padding: "10px 12px", borderRadius: 8,
          background: c.s2, fontSize: T.sm, color: c.m, lineHeight: 1.5,
        }}>
          {q.explanation}
        </div>}
      </div>
    </>;
  }

  return null;
}
