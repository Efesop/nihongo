import { useEffect, useState } from "react";
import { T, mono } from "../data/constants.js";

/**
 * MetacognitionTap — one-second reflection prompt after a wrong answer.
 *
 * Based on Slamecka & Graf (1978) generation effect: a brief act of
 * self-explanation strengthens encoding more than passive re-reading the
 * correct answer. We keep it to 3 options to avoid stealing attention from
 * the corrective feedback itself. Auto-advances after 4 seconds if ignored.
 *
 * Records to `data.errorReasons[id] = { sounded, similar, unknown }` via the
 * `onRecord` callback. This is additive data — the existing `data.errors[id]`
 * leech counter stays untouched. Reason data can later feed smarter leech
 * routing (e.g. "looks similar" items → confused-pair drills; "didn't know"
 * → mnemonic re-teach).
 *
 * Props:
 *   itemId      — string (phrase id or kana char) the user just missed
 *   onRecord    — (itemId, reason) => void. reason ∈ {"sounded","similar","unknown"}
 *   onAutoAdvance — optional () => void. Fires after 4s if no tap. Caller decides whether to auto-next.
 *   c, btn      — theme
 */
export default function MetacognitionTap({ itemId, onRecord, onAutoAdvance, c, btn }) {
  const [picked, setPicked] = useState(null);

  // Auto-advance after 4s if user ignores
  useEffect(() => {
    if (picked || !onAutoAdvance) return;
    const t = setTimeout(() => onAutoAdvance(), 4000);
    return () => clearTimeout(t);
  }, [picked, onAutoAdvance]);

  const handle = (reason) => {
    if (picked) return;
    setPicked(reason);
    onRecord?.(itemId, reason);
  };

  const opts = [
    { key: "sounded", icon: "🎯", label: "sounded right" },
    { key: "similar", icon: "👯", label: "looked similar" },
    { key: "unknown", icon: "❓", label: "didn't know" },
  ];

  return (
    <div style={{
      marginTop: 10, padding: "10px 12px",
      background: c.s2, borderRadius: 10,
      border: "1px solid " + c.b + "44",
    }}>
      <div style={{ fontSize: T.xs, fontFamily: mono, color: c.m, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 6 }}>
        Why did you miss it?
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {opts.map(o => {
          const isPicked = picked === o.key;
          return (
            <button key={o.key}
              onClick={() => handle(o.key)}
              disabled={!!picked}
              className="ts-btn"
              style={{
                ...btn,
                flex: 1, padding: "8px 6px", borderRadius: 8,
                background: isPicked ? c.a + "22" : "transparent",
                border: "1px solid " + (isPicked ? c.a + "66" : c.b + "44"),
                color: isPicked ? c.a : c.tx,
                fontSize: T.xs, fontWeight: 500, lineHeight: 1.3,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                cursor: picked ? "default" : "pointer",
                opacity: picked && !isPicked ? 0.5 : 1,
                transition: "all .15s",
              }}>
              <span style={{ fontSize: 18 }}>{o.icon}</span>
              <span>{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
