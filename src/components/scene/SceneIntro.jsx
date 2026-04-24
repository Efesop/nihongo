import { fontJa, T, JP, mono, SPEAKER_COLORS } from "../../data/constants.js";

const REGISTER_LABELS = {
  casual: { label: "CASUAL", color: SPEAKER_COLORS.konoha, warning: "For friends only — use polite versions at hotels, taxis, and business contexts." },
  polite: { label: "POLITE", color: SPEAKER_COLORS.akira,  warning: null },
  mixed:  { label: "MIXED",  color: "#b08fd7",             warning: "Service staff speak polite, customers casual. Notice the difference." },
};

/**
 * SceneIntro — the card shown at the start of every scene mode.
 *
 * Purpose:
 *   1. Set expectations (title, illustration, register)
 *   2. Celebrate known vocab ("you know these already")
 *   3. Pre-teach new words (≤4) before the scene plays
 *   4. Button to start
 *
 * Props:
 *   scene       — full scene object from SCENE_STUDIES
 *   modeLabel   — "Watch" | "Fill the blanks" | "Repeat after me" | "Role-play"
 *   knownWords  — array of {jp, romaji, en} from scene's requires phrases
 *   onStart     — () => void
 *   onPlayWord  — (jp) => void  (for tapping newWord chips to hear)
 *   c, btn
 */
export default function SceneIntro({ scene, modeLabel, knownWords = [], onStart, onPlayWord, c, btn }) {
  const reg = REGISTER_LABELS[scene.register] || REGISTER_LABELS.casual;

  return <div>
    {/* Mode label */}
    <div style={{ textAlign: "center", fontSize: T.xs, fontWeight: 700, color: c.m, letterSpacing: 1.5, marginBottom: 8 }}>
      SCENE — {modeLabel.toUpperCase()}
    </div>

    {/* Hero card */}
    <div style={{ background: c.s, border: "1px solid " + c.b, borderRadius: 16, overflow: "hidden", marginBottom: 12 }}>
      {/* Illustration */}
      {scene.illustration && <div style={{
        height: 160,
        background: `url(${scene.illustration}) center/cover, ${c.s2}`,
        backgroundBlendMode: "normal",
        position: "relative",
      }}>
        {/* fallback emoji while image loads */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 64, opacity: 0.35,
        }}>{scene.emoji}</div>
      </div>}

      {/* Title + register */}
      <div style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{
            fontSize: T.xs, fontWeight: 700, letterSpacing: 0.5,
            padding: "3px 8px", borderRadius: 6,
            background: reg.color + "22", color: reg.color,
          }}>{reg.label}</div>
          {scene.tags?.slice(0, 2).map(t => <div key={t} style={{
            fontSize: T.xs, color: c.m, padding: "3px 8px", borderRadius: 6, background: c.s2,
          }}>{t}</div>)}
        </div>
        <div style={{ fontSize: T.lg, fontWeight: 700, color: c.tx, marginBottom: 4 }}>
          {scene.emoji} {scene.title}
        </div>
        {reg.warning && <div style={{
          marginTop: 10, padding: "10px 12px", borderRadius: 10,
          background: reg.color + "15", border: "1px solid " + reg.color + "40",
          fontSize: T.sm, color: c.tx, lineHeight: 1.45,
        }}>
          <span style={{ marginRight: 6 }}>⚠️</span>{reg.warning}
        </div>}
      </div>
    </div>

    {/* Known words */}
    {knownWords.length > 0 && <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: T.xs, fontWeight: 700, color: c.m, letterSpacing: 1.2, marginBottom: 6 }}>
        YOU KNOW THESE
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {knownWords.map((w, i) => <div key={i} style={{
          padding: "6px 10px", borderRadius: 8,
          background: c.gs, border: "1px solid " + c.g + "40",
          fontSize: T.sm, fontFamily: fontJa, fontWeight: JP.weight, color: c.g,
        }}>
          {w.jp}
          <span style={{ fontSize: T.xs, fontFamily: mono, marginLeft: 6, opacity: 0.7 }}>{w.en}</span>
        </div>)}
      </div>
    </div>}

    {/* New words — intentional i+1 */}
    {scene.newWords?.length > 0 && <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: T.xs, fontWeight: 700, color: c.a, letterSpacing: 1.2, marginBottom: 6 }}>
        NEW TODAY — TAP TO HEAR
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {scene.newWords.map((w, i) => <button key={i}
          className="ts-btn"
          onClick={() => onPlayWord?.(w.jp)}
          style={{
            ...btn,
            padding: "8px 12px", borderRadius: 10,
            background: c.rs, border: "1px solid " + c.a + "50",
            fontSize: T.sm, fontFamily: fontJa, fontWeight: JP.weight, color: c.tx,
            display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2,
          }}>
          <span style={{ fontSize: T.base, color: c.a, fontWeight: 700 }}>{w.jp}</span>
          <span style={{ fontSize: T.xs, fontFamily: mono, opacity: 0.7, color: c.m }}>{w.romaji} · {w.en}</span>
        </button>)}
      </div>
    </div>}

    {/* Start button */}
    <button className="ts-btn" onClick={onStart}
      style={{
        ...btn, width: "100%", padding: 16, borderRadius: 12,
        background: c.a, color: "#fff",
        fontSize: T.md, fontWeight: 700,
      }}>
      I'm ready →
    </button>
  </div>;
}
