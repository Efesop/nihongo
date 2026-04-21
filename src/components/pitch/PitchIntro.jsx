import { useState } from "react";
import { fontJa, mono, T } from "../../data/constants.js";
import { PITCH_PAIRS, PITCH_INTRO_COPY } from "../../data/pitchAccentIntro.js";
import { TypeLabel } from "../SessionParts.jsx";
import { IconPlay } from "../Icons.jsx";
import { _playAudio } from "../../utils/audio.js";

/**
 * PitchIntro — one-shot teaching card that introduces atamadaka vs heiban
 * via three minimal pairs. Marks `data.pitchIntroSeen = true` on completion.
 * Surfaced once, unlocks `pitch-pair` exercise thereafter.
 *
 * Props:
 *   onComplete — () => void — parent marks pitchIntroSeen and advances session
 *   c, btn, card, isDesktop
 */
export default function PitchIntro({ onComplete, c, btn, card, isDesktop }) {
  const [played, setPlayed] = useState(new Set());
  const play = (pairId, variant) => {
    const url = `/audio/pitch/${pairId}-${variant}.mp3`;
    _playAudio(url, 1).catch(() => {});
    setPlayed(s => new Set([...s, `${pairId}-${variant}`]));
  };

  return (<>
    <TypeLabel c={c}>PITCH ACCENT · INTRO</TypeLabel>
    <div style={{ ...card, padding: "22px 20px", marginBottom: 14 }}>
      <div style={{ fontSize: T.xl, fontWeight: 700, color: c.tx, marginBottom: 10, lineHeight: 1.3 }}>
        {PITCH_INTRO_COPY.title}
      </div>
      <div style={{ fontSize: T.base, color: c.tx, lineHeight: 1.55 }}>
        {PITCH_INTRO_COPY.body}
      </div>
    </div>

    <div style={{ fontSize: T.xs, fontFamily: mono, color: c.m, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 8 }}>
      Three canonical pairs
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
      {PITCH_PAIRS.map(pair => (
        <div key={pair.id} style={{ ...card, padding: "14px 16px" }}>
          <div style={{ fontSize: isDesktop ? T.xxl : T.xl, fontWeight: 700, fontFamily: fontJa, color: c.tx, marginBottom: 8 }}>
            {pair.kana}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {pair.meanings.map(m => {
              const key = `${pair.id}-${m.pattern}`;
              const didPlay = played.has(key);
              return (
                <div key={m.pattern} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 10px", borderRadius: 8,
                  background: didPlay ? c.gs : c.s2,
                  border: "1px solid " + (didPlay ? c.g + "33" : c.b + "33"),
                }}>
                  <button className="ts-icon-btn" onClick={() => play(pair.id, m.pattern)}
                    style={{ ...btn, padding: "8px 12px", borderRadius: 8, background: c.s, border: "1px solid " + c.b, color: c.tx, fontSize: T.sm }}>
                    <IconPlay size={14}/>
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: T.md, fontWeight: 700, fontFamily: fontJa, color: c.tx }}>{m.word}</span>
                      <span style={{ fontSize: T.sm, color: c.m2 }}>{m.en}</span>
                    </div>
                    <div style={{ fontSize: T.xs, fontFamily: mono, color: c.m, marginTop: 2 }}>
                      {m.pattern} · {m.note}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>

    <button className="ts-btn" onClick={() => onComplete?.()}
      style={{ ...btn, width: "100%", padding: 14, borderRadius: 10, background: c.a, color: "#fff", fontSize: T.base, fontWeight: 600 }}>
      Got it — Next →
    </button>
  </>);
}
