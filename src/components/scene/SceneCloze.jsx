import { useEffect, useMemo, useRef, useState } from "react";
import { fontJa, T, JP, mono, SPEAKER_COLORS } from "../../data/constants.js";
import { IconPlay, IconRefresh, IconCheck, IconX } from "../Icons.jsx";
import { TypeLabel } from "../SessionParts.jsx";
import { shuffle } from "../../utils/helpers.js";
import SceneIntro from "./SceneIntro.jsx";

/**
 * SceneCloze — second encounter with a scene.
 *
 * The user has already watched the scene. Now 1–2 key words per line are
 * blanked; the user taps the correct choice from 3 options (correct + 2
 * distractors from other scene lines). Audio plays per line.
 *
 * Phases:
 *   "intro"   — preview card
 *   "play"    — line-by-line, tap to fill blank
 *   "done"    — score + advance
 */
export default function SceneCloze({ scene, knownWords = [], onComplete, c, btn, card, isDesktop }) {
  const [phase, setPhase] = useState("intro");
  const [lineIdx, setLineIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [results, setResults] = useState([]); // array of bool per line
  const audioRef = useRef(null);

  // Pick a "blankable" word per line. Heuristic: pick a noun/verb/content word.
  // We parse the JP line char-by-char against scene.newWords + common vocab
  // we know is interesting: prefer 2+ char hiragana runs, skip particles.
  // Keep it simple: hard-code a blank word per line based on scene data if
  // provided, else default to the last content-y segment.
  const blanks = useMemo(() => buildBlanks(scene), [scene.id]);

  // Build distractor options for each blank from other scene lines
  const options = useMemo(() => {
    return blanks.map((b, i) => {
      const pool = blanks.filter((x, j) => j !== i && x.word !== b.word).map(x => x.word);
      const distractors = shuffle([...new Set(pool)]).slice(0, 2);
      // Pad with fallback distractors from a small static pool if not enough
      while (distractors.length < 2) distractors.push(FALLBACK_DISTRACTORS[distractors.length]);
      return shuffle([b.word, ...distractors]);
    });
  }, [scene.id, blanks]);

  // Play the SCENE LINE audio (not the blank index). `i` must be the index
  // into scene.lines (the real line), not into the blanks[] array. Blanks skip
  // lines that had no blankable word, so blank index != scene-line index.
  const playSceneLine = (sceneLineIdx) => {
    const pad = String(sceneLineIdx).padStart(2, "0");
    if (audioRef.current) {
      audioRef.current.src = `/audio/scenes/${scene.id}-${pad}.mp3`;
      audioRef.current.play().catch(() => {});
    }
  };

  // Auto-play line audio when we enter it. Map blank-index → scene-line-index.
  useEffect(() => {
    if (phase !== "play") return;
    const blank = blanks[lineIdx];
    if (blank) playSceneLine(blank.lineIdx);
    setPicked(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, lineIdx]);

  const pick = (word) => {
    if (picked) return;
    setPicked(word);
    const correct = word === blanks[lineIdx].word;
    const next = [...results, correct];
    setResults(next);
    setTimeout(() => {
      if (lineIdx + 1 >= blanks.length) {
        // Done
        const correctCount = next.filter(Boolean).length;
        const pass = correctCount >= Math.ceil(blanks.length * 0.6);
        onComplete?.(pass, correctCount, blanks.length);
      } else {
        setLineIdx(lineIdx + 1);
      }
    }, 1100);
  };

  const playWord = (jp) => {
    const utter = new SpeechSynthesisUtterance(jp);
    utter.lang = "ja-JP";
    speechSynthesis.speak(utter);
  };

  // Cleanup
  useEffect(() => () => {
    if (audioRef.current) { audioRef.current.pause(); }
  }, []);

  // ═══ INTRO ═══
  if (phase === "intro") {
    return <>
      <TypeLabel c={c}>SCENE — FILL THE BLANKS</TypeLabel>
      <SceneIntro
        scene={scene}
        modeLabel="Fill the blanks"
        knownWords={knownWords}
        onStart={() => setPhase("play")}
        onPlayWord={playWord}
        c={c} btn={btn}
      />
      <audio ref={audioRef} preload="auto" />
    </>;
  }

  // ═══ PLAY ═══
  if (phase === "play") {
    const blank = blanks[lineIdx];
    const line = scene.lines[blank.lineIdx];
    const opts = options[lineIdx];
    const isKonoha = line.speaker === "a";
    const accent = isKonoha ? SPEAKER_COLORS.konoha : SPEAKER_COLORS.akira;

    // Build the line with the blank rendered as ____
    const beforeBlank = line.jp.slice(0, blank.start);
    const afterBlank = line.jp.slice(blank.start + blank.word.length);

    return <>
      <TypeLabel c={c}>SCENE — FILL THE BLANKS</TypeLabel>
      <div style={{ ...card, padding: 14, marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ fontSize: T.sm, fontWeight: 700, color: c.tx }}>{scene.emoji} {scene.title}</div>
          <div style={{ fontSize: T.xs, color: c.m }}>{lineIdx + 1} / {blanks.length}</div>
        </div>
      </div>

      {/* Line bubble with blank */}
      <div style={{
        ...card, padding: "16px 18px", borderLeft: `3px solid ${accent}`, marginBottom: 12,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: T.xs, fontWeight: 700, color: accent, letterSpacing: 0.5 }}>{line.role.toUpperCase()}</span>
          <button className="ts-btn" onClick={() => playSceneLine(blank.lineIdx)}
            style={{ ...btn, padding: "4px 10px", borderRadius: 6, background: "transparent", border: "1px solid " + c.b, color: c.m, fontSize: T.xs, display: "flex", alignItems: "center", gap: 4 }}>
            <IconPlay size={12} /> replay
          </button>
        </div>
        <div style={{ fontSize: isDesktop ? JP.size.desktop : JP.size.mobile, fontFamily: fontJa, fontWeight: JP.weight, color: c.tx, lineHeight: JP.lineHeight }}>
          <span>{beforeBlank}</span>
          <span style={{
            display: "inline-block", minWidth: 80, padding: "2px 10px", margin: "0 4px",
            borderRadius: 8,
            background: picked ? (picked === blank.word ? c.gs : c.rs) : c.s2,
            border: "2px solid " + (picked ? (picked === blank.word ? c.g : c.a) : c.ac),
            color: picked ? (picked === blank.word ? c.g : c.a) : c.m,
            fontWeight: 700,
            textAlign: "center",
          }}>
            {picked || "　？　"}
          </span>
          <span>{afterBlank}</span>
        </div>
        <div style={{ fontSize: T.sm, color: c.m, fontStyle: "italic", marginTop: 8 }}>{line.en}</div>
      </div>

      {/* Options */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {opts.map((opt, i) => {
          const isPickedOpt = picked === opt;
          const isCorrect = picked && opt === blank.word;
          const isWrongPicked = isPickedOpt && opt !== blank.word;
          let bg = c.s2, border = c.b, col = c.tx;
          if (isCorrect) { bg = c.gs; border = c.g; col = c.g; }
          if (isWrongPicked) { bg = c.rs; border = c.a; col = c.a; }
          if (picked && opt === blank.word && !isPickedOpt) { border = c.g; col = c.g; } // reveal correct
          return <button key={i} className="ts-btn"
            disabled={picked !== null}
            onClick={() => pick(opt)}
            style={{
              ...btn, padding: "14px 10px", borderRadius: 10,
              border: "2px solid " + border, background: bg, color: col,
              fontFamily: fontJa, fontSize: T.lg, fontWeight: 700,
              transition: "all .15s",
            }}>
            {opt}
          </button>;
        })}
      </div>

      <audio ref={audioRef} preload="auto" />
    </>;
  }

  return null;
}

// ═══ HELPERS ═══

const FALLBACK_DISTRACTORS = ["それ", "あれ"];

/**
 * Pick blankable words per line. Heuristic:
 *   1. Prefer scene.newWords (intentional vocab)
 *   2. Otherwise find longest hiragana/katakana content token 3+ chars
 *   3. Skip lines too short to blank
 * Returns [{ lineIdx, start, word }]
 */
function buildBlanks(scene) {
  const out = [];
  const newWordSet = new Set((scene.newWords || []).map(w => w.jp));

  for (let i = 0; i < scene.lines.length; i++) {
    const jp = scene.lines[i].jp;

    // Try a newWord first
    let hit = null;
    for (const w of newWordSet) {
      const pos = jp.indexOf(w);
      if (pos >= 0) { hit = { start: pos, word: w }; break; }
    }

    // Fallback: longest 2-3 char kana/kanji segment that's not a particle
    if (!hit) {
      const matches = [...jp.matchAll(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+/g)];
      const filtered = matches
        .filter(m => m[0].length >= 2 && m[0].length <= 6)
        .filter(m => !SKIP_PARTICLES.has(m[0]));
      filtered.sort((a, b) => b[0].length - a[0].length);
      if (filtered.length) hit = { start: filtered[0].index, word: filtered[0][0] };
    }

    if (hit && jp.length > 3) out.push({ lineIdx: i, ...hit });

    if (out.length >= 5) break; // cap at 5 blanks per scene
  }

  return out.length > 0 ? out : [{ lineIdx: 0, start: 0, word: scene.lines[0].jp }];
}

const SKIP_PARTICLES = new Set(["です", "ます", "から", "まで", "でも", "けど", "のに", "のは"]);
