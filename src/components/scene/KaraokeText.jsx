import { useEffect, useRef, useState } from "react";
import { fontJa, JP, SPEAKER_COLORS } from "../../data/constants.js";

/**
 * Word-level karaoke highlight synced to an audio element.
 *
 * Props:
 *   text         — raw JP text (must match `characters` in alignment)
 *   alignment    — { characters: [], startMs: [], endMs: [] } from ElevenLabs /with-timestamps
 *   audioRef     — React ref to the <audio> element driving playback
 *   fontSize     — visual sizing (defaults to JP size)
 *   color        — base text color (default inherits)
 *   activeColor  — color/background for currently-playing chars
 *   onWordTap    — optional (charIndex) => void
 *
 * Design: we track `audio.currentTime` via rAF while playing and highlight
 * every char whose startMs ≤ now ≤ endMs. When alignment is missing, renders
 * plain text with no highlight (graceful degradation).
 */
export default function KaraokeText({
  text,
  alignment,
  audioRef,
  fontSize,
  color,
  activeColor = SPEAKER_COLORS.konoha,
  onWordTap,
  style = {},
}) {
  const [activeIdx, setActiveIdx] = useState(-1);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!audioRef?.current || !alignment?.startMs) return;

    const tick = () => {
      const a = audioRef.current;
      if (!a) return;
      const nowMs = a.currentTime * 1000;
      // Find first char where nowMs is within [startMs, endMs]
      let hit = -1;
      const starts = alignment.startMs;
      const ends = alignment.endMs;
      for (let i = 0; i < starts.length; i++) {
        if (nowMs >= starts[i] && nowMs <= ends[i]) { hit = i; break; }
        if (nowMs < starts[i]) break;
      }
      setActiveIdx(hit);
      if (!a.paused && !a.ended) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    const onPlay = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    const onPauseOrEnd = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setActiveIdx(-1);
    };

    const a = audioRef.current;
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPauseOrEnd);
    a.addEventListener("ended", onPauseOrEnd);
    return () => {
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPauseOrEnd);
      a.removeEventListener("ended", onPauseOrEnd);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [audioRef, alignment]);

  const size = fontSize || JP.size.mobile;
  const chars = alignment?.characters || [...text];

  return <span style={{
    fontFamily: fontJa,
    fontWeight: JP.weight,
    fontSize: size,
    lineHeight: JP.lineHeight,
    color: color,
    ...style,
  }}>
    {chars.map((ch, i) => {
      const isActive = i === activeIdx;
      const inPast = activeIdx >= 0 && i < activeIdx;
      return <span key={i}
        onClick={onWordTap ? () => onWordTap(i) : undefined}
        style={{
          color: isActive ? activeColor : inPast ? color : "inherit",
          fontWeight: isActive ? 700 : JP.weight,
          transition: "color .15s ease-out",
          cursor: onWordTap ? "pointer" : "inherit",
        }}>
        {ch}
      </span>;
    })}
  </span>;
}
