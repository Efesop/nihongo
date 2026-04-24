import { fontJa, GRAMMAR_COLORS } from "../../../data/constants.js";
import { PHRASE_BREAKDOWNS } from "../../../data/phraseBreakdowns.js";

/**
 * Inline Japanese text with per-segment underline tint by grammar type.
 * Falls back to plain text when no breakdown exists for the phrase id.
 */
export default function ColoredJP({ phraseId, fallbackText, fontSize, fontWeight = 700 }) {
  const breakdown = PHRASE_BREAKDOWNS[phraseId];
  if (!breakdown) {
    return (
      <span style={{ fontFamily: fontJa, fontSize, fontWeight, lineHeight: 1.3 }}>
        {fallbackText}
      </span>
    );
  }
  return (
    <span style={{
      display: "inline-flex", flexWrap: "wrap",
      gap: 2, alignItems: "baseline", lineHeight: 1.3,
    }}>
      {breakdown.map((seg, i) => {
        const [jp, , , type] = seg;
        const col = GRAMMAR_COLORS[type] || "#888";
        return (
          <span key={i} style={{
            fontFamily: fontJa, fontSize, fontWeight,
            borderBottom: "2px solid " + col + "40", padding: "0 1px",
          }}>{jp}</span>
        );
      })}
    </span>
  );
}
