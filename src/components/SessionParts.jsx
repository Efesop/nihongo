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
import { useState, useRef, useEffect, useCallback } from "react";
import { T, mono, fontJa, JP, SCENE_IMG } from "../data/constants.js";
import {
  IconPlay, IconSlowPlay, IconBulb, IconEye, IconArrowRight,
  IconCheck, IconX, IconBlock,
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
    @keyframes tapPulse { 0%,100% { opacity: 1; } 50% { opacity: .6; transform: scale(1.03); } }
    .ts-tap-reveal { animation: tapPulse 2s ease-in-out infinite; }

    /* Audio orb — liquid glass with morphing blobs */
    @keyframes orbFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
    @keyframes orbGlow  { 0%,100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.85; transform: scale(1.15); } }
    @keyframes orbHue   { 0% { filter: hue-rotate(0deg); } 50% { filter: hue-rotate(20deg); } 100% { filter: hue-rotate(0deg); } }
    @keyframes orbWobble {
      0%   { border-radius: 50%; }
      12%  { border-radius: 47% 53% 51% 49% / 51% 49% 53% 47%; }
      25%  { border-radius: 53% 47% 48% 52% / 48% 52% 50% 50%; }
      37%  { border-radius: 49% 51% 53% 47% / 52% 48% 47% 53%; }
      50%  { border-radius: 52% 48% 47% 53% / 47% 53% 52% 48%; }
      62%  { border-radius: 48% 52% 52% 48% / 53% 47% 48% 52%; }
      75%  { border-radius: 51% 49% 48% 52% / 49% 51% 53% 47%; }
      100% { border-radius: 50%; }
    }
    /* Idle blobs — slow calm drift */
    @keyframes idleB1{0%{border-radius:40% 60% 55% 45%/55% 45% 60% 40%;transform:translate(0,0) scale(1)}33%{border-radius:55% 45% 40% 60%/45% 60% 45% 55%;transform:translate(8px,-5px) scale(1.05)}66%{border-radius:45% 55% 60% 40%/60% 40% 55% 45%;transform:translate(-5px,7px) scale(0.95)}100%{border-radius:40% 60% 55% 45%/55% 45% 60% 40%;transform:translate(0,0) scale(1)}}
    @keyframes idleB2{0%{border-radius:50% 50% 45% 55%/55% 45% 50% 50%;transform:translate(0,0) scale(1)}33%{border-radius:45% 55% 50% 50%/50% 50% 55% 45%;transform:translate(-6px,8px) scale(0.95)}66%{border-radius:55% 45% 50% 50%/45% 55% 50% 50%;transform:translate(7px,-6px) scale(1.05)}100%{border-radius:50% 50% 45% 55%/55% 45% 50% 50%;transform:translate(0,0) scale(1)}}
    @keyframes idleB3{0%{border-radius:55% 45% 50% 50%/45% 55% 50% 50%;transform:translate(0,0) scale(1)}50%{border-radius:45% 55% 55% 45%/55% 45% 45% 55%;transform:translate(5px,5px) scale(1.08)}100%{border-radius:55% 45% 50% 50%/45% 55% 50% 50%;transform:translate(0,0) scale(1)}}
    /* Listening blobs — medium pulse */
    @keyframes listenB1{0%{border-radius:40% 60% 55% 45%/55% 45% 60% 40%;transform:translate(0,0) scale(1)}25%{border-radius:55% 45% 40% 60%/40% 60% 45% 55%;transform:translate(12px,-8px) scale(1.15)}50%{border-radius:45% 55% 60% 40%/60% 40% 55% 45%;transform:translate(-8px,12px) scale(0.9)}75%{border-radius:60% 40% 45% 55%/45% 55% 60% 40%;transform:translate(10px,6px) scale(1.08)}100%{border-radius:40% 60% 55% 45%/55% 45% 60% 40%;transform:translate(0,0) scale(1)}}
    @keyframes listenB2{0%{border-radius:50% 50% 45% 55%/55% 45% 50% 50%;transform:translate(0,0) scale(1)}33%{border-radius:42% 58% 55% 45%/48% 52% 58% 42%;transform:translate(-10px,10px) scale(0.92)}66%{border-radius:58% 42% 48% 52%/42% 58% 45% 55%;transform:translate(10px,-8px) scale(1.1)}100%{border-radius:50% 50% 45% 55%/55% 45% 50% 50%;transform:translate(0,0) scale(1)}}
    @keyframes listenB3{0%{border-radius:55% 45% 50% 50%/45% 55% 50% 50%;transform:translate(0,0) scale(1.02)}50%{border-radius:45% 55% 55% 45%/55% 45% 45% 55%;transform:translate(8px,8px) scale(1.12)}100%{border-radius:55% 45% 50% 50%/45% 55% 50% 50%;transform:translate(0,0) scale(1.02)}}
    /* Speaking blobs — chaotic fast */
    @keyframes speakB1{0%{border-radius:30% 70% 60% 40%/65% 35% 70% 30%;transform:translate(0,0) scale(1)}12%{border-radius:65% 35% 30% 70%/35% 65% 40% 60%;transform:translate(22px,-18px) scale(1.4)}25%{border-radius:40% 60% 70% 30%/50% 50% 35% 65%;transform:translate(-18px,22px) scale(0.6)}37%{border-radius:70% 30% 40% 60%/30% 70% 60% 40%;transform:translate(15px,12px) scale(1.3)}50%{border-radius:35% 65% 55% 45%/60% 40% 45% 55%;transform:translate(-22px,-14px) scale(0.75)}62%{border-radius:60% 40% 35% 65%/40% 60% 65% 35%;transform:translate(18px,-22px) scale(1.35)}75%{border-radius:45% 55% 65% 35%/55% 45% 35% 65%;transform:translate(-12px,18px) scale(0.7)}87%{border-radius:55% 45% 40% 60%/35% 65% 55% 45%;transform:translate(20px,8px) scale(1.25)}100%{border-radius:30% 70% 60% 40%/65% 35% 70% 30%;transform:translate(0,0) scale(1)}}
    @keyframes speakB2{0%{border-radius:50% 50% 40% 60%/60% 40% 50% 50%;transform:translate(0,0) scale(1)}16%{border-radius:35% 65% 60% 40%/40% 60% 35% 65%;transform:translate(-20px,15px) scale(1.35)}33%{border-radius:60% 40% 35% 65%/55% 45% 65% 35%;transform:translate(18px,-20px) scale(0.65)}50%{border-radius:40% 60% 55% 45%/35% 65% 45% 55%;transform:translate(-14px,-18px) scale(1.3)}66%{border-radius:65% 35% 45% 55%/60% 40% 55% 45%;transform:translate(22px,10px) scale(0.7)}83%{border-radius:45% 55% 65% 35%/45% 55% 40% 60%;transform:translate(-18px,20px) scale(1.25)}100%{border-radius:50% 50% 40% 60%/60% 40% 50% 50%;transform:translate(0,0) scale(1)}}
    @keyframes speakB3{0%{border-radius:55% 45% 50% 50%/45% 55% 50% 50%;transform:translate(0,0) scale(1.1)}20%{border-radius:40% 60% 65% 35%/60% 40% 35% 65%;transform:translate(15px,20px) scale(0.6)}40%{border-radius:65% 35% 40% 60%/35% 65% 60% 40%;transform:translate(-20px,-15px) scale(1.4)}60%{border-radius:45% 55% 55% 45%/55% 45% 45% 55%;transform:translate(18px,-18px) scale(0.75)}80%{border-radius:55% 45% 35% 65%/40% 60% 55% 45%;transform:translate(-10px,14px) scale(1.3)}100%{border-radius:55% 45% 50% 50%/45% 55% 50% 50%;transform:translate(0,0) scale(1.1)}}
    @keyframes speakB4{0%{border-radius:60% 40% 50% 50%;transform:translate(0,0) scale(0.8);opacity:0.8}25%{border-radius:40% 60% 45% 55%;transform:translate(-15px,-20px) scale(1.5);opacity:1}50%{border-radius:55% 45% 60% 40%;transform:translate(20px,15px) scale(0.5);opacity:0.6}75%{border-radius:35% 65% 45% 55%;transform:translate(12px,20px) scale(1.4);opacity:1}100%{border-radius:60% 40% 50% 50%;transform:translate(0,0) scale(0.8);opacity:0.8}}
    /* Particles flying off orb */
    @keyframes pFly1{0%{transform:translate(0,0) scale(1);opacity:.8}100%{transform:translate(-35px,-50px) scale(0);opacity:0}}
    @keyframes pFly2{0%{transform:translate(0,0) scale(1);opacity:.8}100%{transform:translate(45px,-30px) scale(0);opacity:0}}
    @keyframes pFly3{0%{transform:translate(0,0) scale(1);opacity:.7}100%{transform:translate(-25px,45px) scale(0);opacity:0}}
    @keyframes pFly4{0%{transform:translate(0,0) scale(1);opacity:.7}100%{transform:translate(40px,35px) scale(0);opacity:0}}
    @keyframes pFly5{0%{transform:translate(0,0) scale(1);opacity:.8}100%{transform:translate(-50px,-8px) scale(0);opacity:0}}
    @keyframes pFly6{0%{transform:translate(0,0) scale(1);opacity:.75}100%{transform:translate(20px,-55px) scale(0);opacity:0}}
    @keyframes pFly7{0%{transform:translate(0,0) scale(1);opacity:.65}100%{transform:translate(50px,5px) scale(0);opacity:0}}
    @keyframes pFly8{0%{transform:translate(0,0) scale(1);opacity:.7}100%{transform:translate(-10px,50px) scale(0);opacity:0}}
    @keyframes ringPulse{0%{transform:scale(1);opacity:.35}100%{transform:scale(1.6);opacity:0}}

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
  // Always render to prevent layout shift — use opacity/visibility to hide before ready
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
    <button onClick={visible ? onReveal : undefined} className="ts-chip" style={{
      ...btn, padding: "6px 12px", borderRadius: 999,
      background: c.go + "12", border: "1px dashed " + c.go + "55",
      color: c.go, fontSize: T.sm, fontWeight: 500,
      marginTop: 8,
      display: "inline-flex", alignItems: "center", gap: 6,
      opacity: visible ? 1 : 0,
      pointerEvents: visible ? "auto" : "none",
      transition: "opacity 0.4s ease-in",
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
 * ChoiceCard — uniform answer choice button.
 * state: "idle" | "correct" | "wrong" | "dim" | "revealed"
 * Use for multi-choice exercises (phrase-listen, phrase-scenario, kana-reverse, etc).
 */
export function ChoiceCard({ onClick, disabled, state = "idle", c, btn, children, title, subtitle, meta, align = "left" }) {
  const bg = {
    idle: c.s2,
    correct: c.g + "22",
    wrong: c.a + "18",
    dim: c.s,
    revealed: c.g + "18",
  }[state];
  const border = {
    idle: "1px solid " + c.b,
    correct: "2px solid " + c.g,
    wrong: "2px solid " + c.a,
    dim: "1px solid " + c.b,
    revealed: "2px solid " + c.g + "88",
  }[state];
  const textCol = state === "dim" ? c.m : c.tx;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="ts-choice"
      style={{
        ...btn, width: "100%", padding: "12px 14px", borderRadius: 10,
        background: bg, border: border, color: textCol,
        fontSize: T.base, fontWeight: 500,
        textAlign: align,
        display: "block",
        opacity: state === "dim" ? 0.55 : 1,
      }}
    >
      {title !== undefined ? (
        <>
          <div style={{ fontSize: T.base, fontWeight: 600, color: textCol }}>{title}</div>
          {subtitle && <div style={{ fontSize: T.sm, color: c.m2 || c.m, marginTop: 2 }}>{subtitle}</div>}
          {meta && <div style={{ fontSize: T.xs, fontFamily: mono, color: c.m2 || c.m, marginTop: 4 }}>{meta}</div>}
        </>
      ) : children}
    </button>
  );
}

/**
 * PlayButton — standard audio replay button.
 * size: "sm" (compact pill) | "md" (default) | "lg" (prominent)
 * slow: true → turtle/slow-play icon
 * label: optional text after icon ("hear it", "play again", etc)
 */
export function PlayButton({ onClick, slow = false, size = "md", label, c, btn, ariaLabel }) {
  const sizes = {
    sm: { padding: "4px 10px", borderRadius: 6, fontSize: T.xs, icon: 12 },
    md: { padding: "8px 14px", borderRadius: 8, fontSize: T.sm, icon: 16 },
    lg: { padding: "10px 18px", borderRadius: 10, fontSize: T.base, icon: 18 },
  };
  const s = sizes[size] || sizes.md;
  const Icon = slow ? IconSlowPlay : IconPlay;
  return (
    <button
      onClick={onClick}
      className="ts-icon-btn"
      aria-label={ariaLabel || (slow ? "Play slowly" : "Play")}
      style={{
        ...btn,
        padding: s.padding,
        borderRadius: s.borderRadius,
        background: c.s2,
        border: "1px solid " + c.b,
        color: c.tx,
        fontSize: s.fontSize,
        display: "inline-flex",
        alignItems: "center",
        gap: label ? 6 : 0,
      }}
    >
      <Icon size={s.icon} />
      {label && <span>{label}</span>}
    </button>
  );
}

/**
 * ResultMark — inline ✓/✗ with optional label, themed colors.
 */
export function ResultMark({ correct, label, c, size = 14 }) {
  const col = correct ? c.g : c.a;
  const Icon = correct ? IconCheck : IconX;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      color: col, fontSize: T.sm, fontWeight: 600,
    }}>
      <Icon size={size} />
      {label && <span>{label}</span>}
    </span>
  );
}

/**
 * NoneOfThese — dashed red "none of these match" button.
 */
export function NoneOfThese({ onClick, c, btn, label = "None of these match" }) {
  return (
    <button
      onClick={onClick}
      className="ts-btn"
      style={{
        ...btn, width: "100%", padding: "14px 16px", borderRadius: 10,
        border: "2px dashed " + c.a + "66", background: c.a + "10",
        color: c.a, fontSize: T.base, fontWeight: 600,
        textAlign: "center", marginTop: 10,
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}
    >
      <IconBlock size={16} />
      <span>{label}</span>
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

/**
 * AudioOrb — liquid glass orb for listening/speaking exercises.
 *
 * Props:
 *   mode: "idle" | "listening" | "speaking" — controls animation intensity
 *   active: boolean — alias for speaking mode (back-compat)
 *   size: number — diameter in px (default 120)
 *   onClick: optional click handler
 *
 * Vibrant cyan/magenta/purple liquid blobs morph organically inside a glass sphere.
 * Speaking mode: chaotic fast blobs, wobbling boundary, particles flying off, ring pulses.
 * Listening mode: medium-speed blobs, inner glow breathing.
 * Idle: slow calm drift.
 */
export function AudioOrb({ mode: modeProp, active = false, size = 120, onClick }) {
  const mode = modeProp || (active ? "speaking" : "idle");
  const bp = mode === "idle" ? "idle" : mode === "listening" ? "listen" : "speak";
  const speeds = mode === "idle" ? [9, 11, 10] : mode === "listening" ? [4.5, 5.5, 5] : [1.2, 1.4, 1.6];
  const isSpeaking = mode === "speaking";
  const blur = size * 0.04;
  const cSize = size * 1.5;

  // Generate particles for speaking mode
  const particles = [];
  if (isSpeaking) {
    const pColors = [
      "rgba(0,220,255,0.8)","rgba(255,40,200,0.8)","rgba(180,120,255,0.75)",
      "rgba(220,200,255,0.7)","rgba(0,220,255,0.75)","rgba(255,40,200,0.7)",
      "rgba(180,120,255,0.8)","rgba(255,255,255,0.5)",
    ];
    for (let i = 0; i < 8; i++) {
      const ps = 2 + (i % 3);
      const angle = (i / 8) * Math.PI * 2;
      const px = Math.cos(angle) * size * 0.46;
      const py = Math.sin(angle) * size * 0.46;
      particles.push(
        <div key={`p${i}`} style={{
          position: "absolute", width: ps, height: ps, borderRadius: "50%",
          background: pColors[i], boxShadow: `0 0 ${ps * 2.5}px ${pColors[i]}`,
          left: `calc(50% + ${px}px)`, top: `calc(50% + ${py}px)`,
          animation: `pFly${i + 1} ${0.7 + (i % 4) * 0.15}s ease-out infinite`,
          animationDelay: `${i * 0.15}s`,
        }} />
      );
    }
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "12px 0" }}
      onClick={onClick} role={onClick ? "button" : undefined}>
      <div style={{
        width: cSize, height: cSize,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
        animation: `orbFloat ${isSpeaking ? "1.8s" : "5s"} ease-in-out infinite`,
        cursor: onClick ? "pointer" : "default",
      }}>
        {/* Ambient glow */}
        <div style={{
          position: "absolute",
          width: size * 1.3, height: size * 1.3, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(140,80,255,${isSpeaking ? 0.7 : mode === "listening" ? 0.45 : 0.3}) 0%, rgba(255,50,200,${isSpeaking ? 0.35 : 0.15}) 35%, rgba(0,180,255,${isSpeaking ? 0.2 : 0.1}) 55%, transparent 70%)`,
          filter: `blur(${size * 0.16}px)`,
          animation: `orbGlow ${isSpeaking ? "0.8s" : "3.5s"} ease-in-out infinite`,
        }} />
        {/* Ring pulses (speaking only) */}
        {isSpeaking && [0, 1, 2].map(i => (
          <div key={`r${i}`} style={{
            position: "absolute", width: size, height: size, borderRadius: "50%",
            border: "1px solid rgba(180,120,255,0.25)",
            animation: `ringPulse 2s ease-out infinite`,
            animationDelay: `${i * 0.65}s`,
          }} />
        ))}
        {/* Main sphere */}
        <div style={{
          position: "relative", width: size, height: size, overflow: "hidden",
          ...(isSpeaking
            ? { animation: "orbWobble 0.5s ease-in-out infinite, orbHue 2s ease-in-out infinite" }
            : { borderRadius: "50%", animation: `orbHue ${mode === "idle" ? "8s" : "5s"} ease-in-out infinite` }),
          background: "radial-gradient(circle at 30% 25%, rgba(60,30,90,0.6), rgba(25,10,50,0.9) 55%, rgba(12,5,30,1) 85%)",
          boxShadow: `inset 0 0 ${size * 0.25}px rgba(140,80,255,0.2), 0 0 ${size * 0.12}px rgba(140,80,255,0.15)`,
        }}>
          {/* Blob 1 — cyan */}
          <div style={{
            position: "absolute", width: "70%", height: "70%", top: "5%", left: "8%",
            background: "radial-gradient(circle, rgba(0,220,255,0.95) 0%, rgba(60,160,255,0.6) 30%, transparent 65%)",
            filter: `blur(${blur}px)`,
            animation: `${bp}B1 ${speeds[0]}s ease-in-out infinite`,
            mixBlendMode: "screen",
          }} />
          {/* Blob 2 — magenta */}
          <div style={{
            position: "absolute", width: "60%", height: "60%", bottom: "5%", right: "5%",
            background: "radial-gradient(circle, rgba(255,40,200,0.95) 0%, rgba(240,60,160,0.6) 30%, transparent 65%)",
            filter: `blur(${blur}px)`,
            animation: `${bp}B2 ${speeds[1]}s ease-in-out infinite`,
            mixBlendMode: "screen",
          }} />
          {/* Blob 3 — purple */}
          <div style={{
            position: "absolute", width: "50%", height: "50%", top: "22%", left: "22%",
            background: "radial-gradient(circle, rgba(180,120,255,0.95) 0%, rgba(155,100,240,0.5) 30%, transparent 60%)",
            filter: `blur(${blur * 0.85}px)`,
            animation: `${bp}B3 ${speeds[2]}s ease-in-out infinite`,
            mixBlendMode: "screen",
          }} />
          {/* Blob 4 — white-hot flash (speaking only) */}
          {isSpeaking && <div style={{
            position: "absolute", width: "35%", height: "35%", top: "18%", left: "38%",
            background: "radial-gradient(circle, rgba(220,200,255,0.9) 0%, rgba(180,160,255,0.4) 35%, transparent 60%)",
            filter: `blur(${blur * 0.6}px)`,
            animation: "speakB4 1s ease-in-out infinite",
            mixBlendMode: "screen",
          }} />}
          {/* Specular highlights */}
          <div style={{
            position: "absolute", width: "28%", height: "16%", top: "12%", left: "18%",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(255,255,255,0.5) 0%, transparent 70%)",
            transform: "rotate(-15deg)", pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", width: "8%", height: "6%", top: "20%", left: "55%",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(255,255,255,0.3) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
        </div>
        {/* Particles (speaking only) */}
        {particles}
      </div>
    </div>
  );
}

/**
 * SceneImage — phrase scene illustration, consistent sizing everywhere.
 * Change SCENE_IMG in constants.js to resize all scene images at once.
 * header: true → top of card (no border-radius bottom), false → standalone rounded
 */
export function SceneImage({ phraseId, isDesktop, header = true }) {
  return (
    <img
      src={`/images/phrases/scenes/${phraseId}.png`}
      alt=""
      style={{
        width: "100%",
        height: isDesktop ? SCENE_IMG.height.desktop : SCENE_IMG.height.mobile,
        objectFit: "cover",
        display: "block",
        borderRadius: header ? "12px 12px 0 0" : 12,
      }}
      onError={e => { e.target.style.display = "none"; }}
    />
  );
}

/**
 * JpText — Japanese text display with consistent font, size, weight.
 * Change JP in constants.js to resize all Japanese text at once.
 * size: "normal" (choice cards, prompts) | "big" (tiles, keyboard) | number (override)
 */
export function JpText({ children, isDesktop, size = "normal", style = {}, as: Tag = "div" }) {
  const sz = typeof size === "number" ? size
    : size === "big" ? (isDesktop ? JP.sizeBig.desktop : JP.sizeBig.mobile)
    : (isDesktop ? JP.size.desktop : JP.size.mobile);
  return (
    <Tag style={{
      fontFamily: fontJa,
      fontSize: sz,
      fontWeight: JP.weight,
      lineHeight: JP.lineHeight,
      ...style,
    }}>{children}</Tag>
  );
}
