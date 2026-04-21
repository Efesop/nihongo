import { useEffect, useState } from "react";
import { fontJa, mono, T } from "../../data/constants.js";
import { PITCH_PAIRS } from "../../data/pitchAccentIntro.js";
import { TypeLabel, ChoiceCard } from "../SessionParts.jsx";
import { IconPlay } from "../Icons.jsx";
import { _playAudio } from "../../utils/audio.js";
import { shuffle } from "../../utils/helpers.js";

/**
 * PitchPair — minimal-pair discrimination drill.
 *
 * Plays ONE variant from a pair (atamadaka or heiban). User picks which
 * meaning it was. Two options only — simple binary discrimination to train
 * the ear. Over sessions this widens the categorical-perception boundary
 * (Minagawa-Kawai et al. 2002).
 *
 * No SRS entry — pitch discrimination is a perceptual skill, not an item.
 * Correct/wrong just flows to session score.
 *
 * Props:
 *   pair       — one of PITCH_PAIRS
 *   onComplete — (correct: bool) => void
 */
export default function PitchPair({ pair: forcedPair, onComplete, c, btn, card, isDesktop }) {
  const [pair] = useState(() => forcedPair || PITCH_PAIRS[Math.floor(Math.random() * PITCH_PAIRS.length)]);
  const [correctIdx] = useState(() => Math.floor(Math.random() * pair.meanings.length));
  const [choices] = useState(() => shuffle([...pair.meanings]));
  const [picked, setPicked] = useState(null);
  const correct = pair.meanings[correctIdx];

  const play = () => {
    _playAudio(`/audio/pitch/${pair.id}-${correct.pattern}.mp3`, 1).catch(() => {});
  };

  // Auto-play on mount
  useEffect(() => {
    const t = setTimeout(play, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handle = (m) => {
    if (picked !== null) return;
    const isRight = m.pattern === correct.pattern;
    setPicked(m.pattern);
    setTimeout(() => onComplete?.(isRight), isRight ? 800 : 1500);
  };
  const answered = picked !== null;

  return (<>
    <TypeLabel c={c}>PITCH ACCENT · WHICH WORD?</TypeLabel>
    <div style={{ ...card, padding: "26px 20px", marginBottom: 14, textAlign: "center" }}>
      <div style={{ fontSize: T.xs, fontFamily: mono, color: c.m, textTransform: "uppercase", marginBottom: 10 }}>
        listen · pick the meaning
      </div>
      <div style={{ fontSize: isDesktop ? 56 : 44, fontWeight: 700, fontFamily: fontJa, color: c.tx, lineHeight: 1.1, marginBottom: 14 }}>
        {pair.kana}
      </div>
      <button className="ts-icon-btn" onClick={play}
        style={{ ...btn, padding: "10px 20px", borderRadius: 10, background: c.s2, border: "1px solid " + c.b, color: c.tx, fontSize: T.base, display: "inline-flex", alignItems: "center", gap: 8 }}>
        <IconPlay size={16}/> replay
      </button>
    </div>

    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {choices.map(m => {
        const isRight = m.pattern === correct.pattern;
        const isPicked = picked === m.pattern;
        const state = answered
          ? (isRight ? "correct" : isPicked && !isRight ? "wrong" : "dim")
          : "idle";
        return (
          <ChoiceCard key={m.pattern} c={c} btn={btn} disabled={answered} state={state} onClick={() => handle(m)}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: T.lg, fontWeight: 700, fontFamily: fontJa }}>{m.word}</span>
              <span style={{ fontSize: T.sm, color: c.m2 }}>{m.en}</span>
              {answered && <span style={{ fontSize: T.xs, fontFamily: mono, color: c.m }}>· {m.pattern}</span>}
            </div>
          </ChoiceCard>
        );
      })}
    </div>
  </>);
}
