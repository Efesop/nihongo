import { useState } from "react";
import { T, JP, fontJa } from "../../../data/constants.js";

/**
 * Tap-to-reveal recall card.
 * Shows English prompt → click → shows Japanese answer.
 * Used in learn-phrase / pre-session revival lists.
 */
export default function RecallCard({ english, japanese, c, isDesktop, onReveal }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div
      onClick={() => { if (!revealed) { setRevealed(true); onReveal?.(); } }}
      style={{
        padding: "10px 14px", borderRadius: 8, marginBottom: 6,
        cursor: revealed ? "default" : "pointer",
        background: revealed ? c.g + "12" : c.s2,
        border: "1px solid " + (revealed ? c.g + "33" : c.b),
        transition: "all .2s",
      }}
    >
      <div style={{ fontSize: T.sm, color: c.m, marginBottom: revealed ? 4 : 0 }}>{english}</div>
      {revealed && (
        <div style={{
          fontSize: isDesktop ? T.xl : T.lg,
          fontWeight: JP.weight, fontFamily: fontJa, color: c.tx,
        }}>{japanese}</div>
      )}
      {!revealed && (
        <div style={{ fontSize: T.xs, color: c.go, fontStyle: "italic" }}>tap to reveal →</div>
      )}
    </div>
  );
}
