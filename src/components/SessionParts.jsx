/**
 * SessionParts — shared UI components for SmartSession exercises.
 *
 * Conventions:
 * - Always use theme tokens from `c` (c.g, c.a, c.m2 for labels, etc) — never hardcode
 * - Use Icons.jsx SVG icons, not emoji
 * - Use ts-btn / ts-btn-primary / ts-btn-ghost classes for consistent hover states
 * - Action bar pattern: [Play][Slow][Next →] — use ActionBar
 *
 * All components take theme `c`, button base `btn`, card base `card`, T sizes.
 */
import { T, mono } from "../data/constants.js";
import {
  IconPlay, IconSlowPlay, IconBulb, IconEye, IconArrowRight,
} from "./Icons.jsx";

/**
 * Ensure global stylesheet is injected once. Provides hover + focus + transition
 * states that inline styles can't express.
 *
 * Classes:
 *   .ts-btn         — generic button base, subtle hover lift + bg shift
 *   .ts-btn-primary — primary CTA, brighter hover
 *   .ts-btn-ghost   — transparent/outlined, fills on hover
 *   .ts-icon-btn    — square icon button, scales on hover
 *   .ts-choice      — choice card button (phrase list, kana pick) with hover ring
 *   .ts-chip        — small pill chip with hover lift
 */
export function ensureSessionStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("ts-session-styles")) return;
  const s = document.createElement("style");
  s.id = "ts-session-styles";
  s.textContent = `
    @keyframes fadeIn { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: none; } }
    @keyframes pulse  { 0%,100% { opacity: 1; } 50% { opacity: .5; } }

    .ts-btn, .ts-icon-btn, .ts-choice, .ts-chip {
      transition: transform .12s ease, background-color .15s ease,
                  border-color .15s ease, color .15s ease, box-shadow .15s ease, opacity .15s ease;
      cursor: pointer;
    }
    .ts-btn:hover:not(:disabled)         { transform: translateY(-1px); filter: brightness(1.08); }
    .ts-btn:active:not(:disabled)        { transform: translateY(0);    filter: brightness(.95); }
    .ts-btn:disabled                     { cursor: not-allowed; opacity: .5; }

    .ts-icon-btn:hover:not(:disabled)    { transform: translateY(-1px) scale(1.03); filter: brightness(1.15); }
    .ts-icon-btn:active:not(:disabled)   { transform: scale(.96); }

    .ts-choice:hover:not(:disabled)      { transform: translateY(-1px); box-shadow: 0 2px 12px rgba(0,0,0,.18); filter: brightness(1.05); }
    .ts-choice:active:not(:disabled)     { transform: translateY(0); }

    .ts-chip:hover:not(:disabled)        { transform: translateY(-1px); filter: brightness(1.15); }

    .ts-btn:focus-visible,
    .ts-icon-btn:focus-visible,
    .ts-choice:focus-visible,
    .ts-chip:focus-visible               { outline: 2px solid currentColor; outline-offset: 2px; }

    /* Fallback: any button inside a session that hasn't opted into a specific class
       still gets a subtle hover so nothing feels dead. */
    .ts-session button                   { transition: transform .12s ease, background-color .15s ease, border-color .15s ease, color .15s ease, filter .15s ease; }
    .ts-session button:not(:disabled):hover  { filter: brightness(1.08); }
    .ts-session button:not(:disabled):active { filter: brightness(.95); }
  `;
  document.head.appendChild(s);
}

/**
 * Standard bottom action bar for exercises.
 * Renders [▶ normal][▶▶ slow][Next →] with consistent sizing + hover.
 */
export function ActionBar({ onPlay, onSlow, onNext, nextLabel = "Next", c, btn }) {
  const iconBtn = {
    ...btn, padding: "10px 14px", borderRadius: 10,
    background: c.s2, border: "1px solid " + c.b,
    color: c.tx,
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    minWidth: 48,
  };
  const nextBtn = {
    ...btn, flex: 2, padding: "12px 16px", borderRadius: 10,
    background: c.a, color: "#fff", fontSize: T.base, fontWeight: 600,
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    border: "1px solid transparent",
  };
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
      {onPlay && (
        <button onClick={onPlay} className="ts-icon-btn" style={iconBtn} aria-label="Play">
          <IconPlay size={18} />
        </button>
      )}
      {onSlow && (
        <button onClick={onSlow} className="ts-icon-btn" style={iconBtn} aria-label="Play slowly">
          <IconSlowPlay size={18} />
        </button>
      )}
      <button onClick={onNext} className="ts-btn" style={nextBtn}>
        <span>{nextLabel}</span>
        <IconArrowRight size={16} />
      </button>
    </div>
  );
}

/**
 * Hint chip — appears after 15s if user is stuck.
 */
export function HintChip({ visible, shown, onReveal, hintText, c, btn }) {
  if (!visible) return null;
  if (shown) {
    return (
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "6px 12px", borderRadius: 999,
        background: c.go + "1a", border: "1px solid " + c.go + "55",
        color: c.go, fontSize: T.sm, fontWeight: 600,
        marginTop: 8, animation: "fadeIn 0.3s ease-in",
      }}>
        <IconBulb size={14} />
        <span>{hintText}</span>
      </div>
    );
  }
  return (
    <button onClick={onReveal} className="ts-chip" style={{
      ...btn, padding: "6px 12px", borderRadius: 999,
      background: c.go + "12", border: "1px dashed " + c.go + "55",
      color: c.go, fontSize: T.sm, fontWeight: 500,
      marginTop: 8, animation: "fadeIn 0.5s ease-in",
      display: "inline-flex", alignItems: "center", gap: 6,
    }}>
      <IconBulb size={14} />
      <span>Need a hint?</span>
    </button>
  );
}

/**
 * Romaji reveal chip.
 */
export function RomajiReveal({ visible, revealed, onReveal, romaji, c, btn }) {
  if (!visible) return null;
  if (revealed) {
    return (
      <div style={{
        fontSize: T.sm, fontFamily: mono, color: c.ro,
        marginTop: 6, opacity: 0.9,
      }}>
        {romaji}
      </div>
    );
  }
  return (
    <button onClick={onReveal} className="ts-chip" style={{
      ...btn, padding: "4px 10px", borderRadius: 999,
      background: "transparent", border: "1px dashed " + c.b,
      color: c.m2 || c.m, fontSize: T.xs, fontWeight: 500,
      marginTop: 6, fontFamily: mono,
      display: "inline-flex", alignItems: "center", gap: 6,
    }}>
      <IconEye size={12} />
      <span>reveal romaji</span>
    </button>
  );
}

/**
 * Exercise type label — consistent uppercase mono header.
 */
export function TypeLabel({ children, c }) {
  return (
    <div style={{
      fontSize: T.xs, fontFamily: mono, color: c.m2 || c.m,
      textTransform: "uppercase", letterSpacing: "0.6px",
      marginBottom: 10, fontWeight: 600,
    }}>{children}</div>
  );
}

/**
 * Color tokens:
 *   c.g    — success green
 *   c.gs   — success surface
 *   c.a    — accent red
 *   c.ro   — romaji (soft coral dark / dark red light)
 *   c.rs   — error surface
 *   c.go   — gold (hints)
 *   c.m    — muted (secondary)
 *   c.m2   — muted-light (label text, readable on dark)
 *   c.tx   — primary text
 *   c.b    — border
 *   c.s    — surface (card bg)
 *   c.s2   — surface 2 (raised)
 *   c.bg   — page background
 */
