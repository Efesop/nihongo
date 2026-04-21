import { useState } from "react";
import { PHRASE_BREAKDOWNS } from "../data/phraseBreakdowns.js";
import { fontJa } from "../data/constants.js";

const GRAMMAR_COLORS = {
  particle: "#e8a838",
  noun: "#5a9ec4",
  verb: "#5ac48a",
  adjective: "#c45a8b",
  expression: "#8b8b8b",
  counter: "#8b6ec4",
  copula: "#c4985a",
  suffix: "#6e8bc4",
  question: "#e8a838",
};

/**
 * Renders Japanese phrase text with interactive word segments.
 * Each segment is color-coded by grammar type.
 * Hover/tap shows a tooltip with meaning and romaji.
 *
 * Pass either:
 *   - `phraseId` — looks up breakdown from PHRASE_BREAKDOWNS
 *   - `breakdown` — raw breakdown array [[jp, romaji, meaning, type], ...]
 *                   (used for scene lines, dynamic content)
 *
 * `chunk` prop (bool): when true, renders the full phrase as a single
 * unsegmented chunk with no interactions — plus a small "break it down" toggle
 * to opt-in. This supports Lewis's lexical-approach: above box 3, showing
 * auto-parsed segments becomes a retrieval crutch that slows native-like
 * chunked storage. Frozen expressions (g1-g10 greetings, etc.) should chunk
 * regardless of box.
 */
export default function PhraseSegments({ phraseId, breakdown: rawBreakdown, c, fontSize = 24, fontWeight = 700, chunk = false }) {
  const [activeSegment, setActiveSegment] = useState(null);
  const [chunkView, setChunkView] = useState(chunk);
  const breakdown = rawBreakdown || (phraseId ? PHRASE_BREAKDOWNS[phraseId] : null);

  if (!breakdown) return null;

  // Chunk mode — render concatenated phrase as one unit.
  if (chunkView) {
    const fullText = breakdown.map(seg => seg[0]).join("");
    return <div style={{ position: "relative" }}>
      <div style={{ fontSize, fontWeight, fontFamily: fontJa, lineHeight: 1.4, padding: "2px 6px" }}>{fullText}</div>
      <button onClick={() => setChunkView(false)}
        style={{
          marginTop: 6, padding: "3px 10px", borderRadius: 6,
          background: "transparent", border: "1px solid " + ((c && c.b) || "#444"),
          color: (c && c.m) || "#888", fontSize: 10, fontFamily: "monospace",
          cursor: "pointer", letterSpacing: ".03em",
        }}>
        break it down
      </button>
    </div>;
  }

  return <div style={{ position: "relative" }}>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "baseline", lineHeight: 1.4 }}>
      {breakdown.map((seg, i) => {
        // Fifth element (optional): accent pattern, array of 0/1 per mora.
        // 1 = high pitch. Length matches kana character count (mora count).
        // Nullable — old breakdowns work unchanged.
        const [jp, rom, meaning, type, accent] = seg;
        const isActive = activeSegment === i;
        const gramCol = GRAMMAR_COLORS[type] || c.m;

        return <span key={i}
          onClick={(e) => { e.stopPropagation(); setActiveSegment(isActive ? null : i); }}
          onMouseEnter={() => setActiveSegment(i)}
          onMouseLeave={() => setActiveSegment(null)}
          style={{
            fontSize, fontWeight, fontFamily: fontJa,
            cursor: "pointer",
            padding: "2px 6px",
            borderRadius: 6,
            background: isActive ? gramCol + "28" : gramCol + "0a",
            borderBottom: "2px solid " + (isActive ? gramCol : gramCol + "30"),
            transition: "all .15s",
            position: "relative",
            zIndex: isActive ? 20 : 10,
          }}>
          {accent && Array.isArray(accent) && accent.length === [...jp].length
            ? <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", lineHeight: 1 }}>
                <span style={{ display: "flex", gap: 1, marginBottom: 1 }}>
                  {[...jp].map((_, idx) => (
                    <span key={idx} style={{
                      width: fontSize * 0.4, height: 3,
                      borderRadius: 2,
                      background: accent[idx] === 1 ? gramCol : "transparent",
                      opacity: accent[idx] === 1 ? 0.75 : 0.15,
                    }}/>
                  ))}
                </span>
                <span>{jp}</span>
              </span>
            : jp}
          {isActive && <div style={{
            position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)",
            marginBottom: 4, padding: "8px 12px", borderRadius: 8,
            background: c.s2 || "#2a2a2a", border: "1px solid " + (c.b || "#444"),
            boxShadow: "0 4px 12px rgba(0,0,0,.3)",
            whiteSpace: "nowrap", zIndex: 50,
            fontSize: 12, fontWeight: 400, textAlign: "center",
            pointerEvents: "none",
          }}>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>{meaning}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
              <span style={{ fontSize: 11, fontFamily: "monospace", color: gramCol }}>{rom}</span>
              <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, background: gramCol + "22", color: gramCol, fontWeight: 600 }}>{type}</span>
            </div>
            {/* Arrow */}
            <div style={{ position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid " + (c.b || "#444") }} />
          </div>}
        </span>;
      })}
    </div>
    {/* Dismiss on tap elsewhere (mobile only — doesn't interfere with hover) */}
    {activeSegment !== null && <div onClick={() => setActiveSegment(null)}
      style={{ position: "fixed", inset: 0, zIndex: 1 }} />}
  </div>;
}
