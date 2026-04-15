/**
 * SessionParts — shared UI components for SmartSession exercises.
 *
 * Conventions:
 * - Always use theme tokens from `c` (c.g, c.a, c.m, etc) — never hardcode colors
 * - Action bar pattern: [🔊][🐢][Next →] — use ActionBar
 * - Hint chip pattern: 15s timer → fade-in chip → reveal partial info
 * - Romaji reveal pattern: when romaji hidden, show ◯ chip
 *
 * All components take theme `c`, button base `btn`, card base `card`, T sizes.
 */
import { T, mono } from "../data/constants.js";

/**
 * Standard bottom action bar for exercises.
 * Renders [🔊 normal][🐢 slow][Next →] with consistent sizing.
 *
 * Props:
 *   onPlay      — function called for normal speed playback (omit to hide button)
 *   onSlow      — function called for slow playback (omit to hide button)
 *   onNext      — function called for advance (required)
 *   nextLabel   — text on the Next button (default "Next →")
 *   c, btn      — theme tokens
 */
export function ActionBar({ onPlay, onSlow, onNext, nextLabel = "Next →", c, btn }) {
  const iconBtn = {
    ...btn, padding: 12, borderRadius: 10,
    background: c.s2, border: "1px solid " + c.b,
    color: c.m, fontSize: T.sm,
  };
  const nextBtn = {
    ...btn, flex: 2, padding: 12, borderRadius: 10,
    background: c.a, color: "#fff", fontSize: T.base, fontWeight: 600,
  };
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
      {onPlay && <button onClick={onPlay} style={iconBtn} aria-label="Play">🔊</button>}
      {onSlow && <button onClick={onSlow} style={iconBtn} aria-label="Slow">🐢</button>}
      <button onClick={onNext} style={nextBtn}>{nextLabel}</button>
    </div>
  );
}

/**
 * Hint chip — appears after 15s if user is stuck.
 * Tapping reveals partial info (caller-supplied content).
 *
 * Props:
 *   visible    — whether chip should render (true after 15s)
 *   shown      — whether hint has been revealed (changes label)
 *   onReveal   — function called when user taps chip
 *   hintText   — text to display when revealed (e.g. "Starts with み")
 *   c, btn
 */
export function HintChip({ visible, shown, onReveal, hintText, c, btn }) {
  if (!visible) return null;
  if (shown) {
    return (
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "6px 12px", borderRadius: 14,
        background: c.go + "18", border: "1px solid " + c.go + "40",
        color: c.go, fontSize: T.sm, fontWeight: 600,
        marginTop: 8, animation: "fadeIn 0.3s ease-in",
      }}>
        💡 {hintText}
      </div>
    );
  }
  return (
    <button onClick={onReveal} style={{
      ...btn, padding: "6px 12px", borderRadius: 14,
      background: c.go + "12", border: "1px dashed " + c.go + "55",
      color: c.go, fontSize: T.sm, fontWeight: 500,
      marginTop: 8, animation: "fadeIn 0.5s ease-in",
    }}>
      💡 Need a hint?
    </button>
  );
}

/**
 * Romaji reveal chip — when romaji is hidden, allow user to see it.
 * Tapping = partial miss (caller decides SRS impact).
 *
 * Props:
 *   visible   — true when romaji is hidden and user might be stuck
 *   revealed  — whether romaji has been shown
 *   onReveal  — callback when user taps
 *   romaji    — the romaji text to show once revealed
 */
export function RomajiReveal({ visible, revealed, onReveal, romaji, c, btn }) {
  if (!visible) return null;
  if (revealed) {
    return (
      <div style={{
        fontSize: T.sm, fontFamily: mono, color: c.a,
        marginTop: 6, opacity: 0.85,
      }}>
        {romaji}
      </div>
    );
  }
  return (
    <button onClick={onReveal} style={{
      ...btn, padding: "4px 10px", borderRadius: 12,
      background: "transparent", border: "1px dashed " + c.b,
      color: c.m, fontSize: T.xs, fontWeight: 500,
      marginTop: 6, fontFamily: mono,
    }}>
      ◯ reveal romaji
    </button>
  );
}

/**
 * Color tokens — replace hardcoded literals with these from theme c object.
 * Use directly: `color: c.g` instead of `color: "#4caf50"`.
 *
 * Standard tokens:
 *   c.g    — success green
 *   c.gs   — success surface (light green bg)
 *   c.a    — accent red (also error/wrong)
 *   c.rs   — error surface (light red bg)
 *   c.go   — gold (XP, hints, highlights)
 *   c.ac   — accent (focused/active)
 *   c.m    — muted text
 *   c.tx   — primary text
 *   c.b    — border
 *   c.s    — surface (card bg)
 *   c.s2   — surface 2 (raised)
 *   c.bg   — page background
 */
