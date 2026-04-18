import { useState } from "react";
import { T } from "../data/constants.js";
import { IconSlowPlay } from "./Icons.jsx";

/**
 * ShadowExercise — reusable mic-repeat primitive.
 *
 * Handles browser/OS mic compat, Japanese speech recognition, fuzzy matching
 * against a target phrase, and rendering the mic UI + listening state +
 * result card.
 *
 * Props:
 *   targetJp   — Japanese text to match (required)
 *   onComplete — (matched: boolean, graded: boolean) => void — required.
 *                `graded=false` means non-critical error (no SRS penalty).
 *   onDisable  — () => void — optional: user taps "turn off shadow mode"
 *   onSlowPlay — () => void — optional: user taps slow replay after result
 *   children   — optional content rendered above the mic button
 *                (typically the phrase/line to repeat)
 *   compact    — bool — smaller layout for embedding in scene flow
 *   c, btn, card — theme tokens
 *
 * Usage (phrase-shadow):
 *   <ShadowExercise targetJp={p[1]} onComplete={m => advance(m)} c={c} btn={btn} card={card}>
 *     <PhraseHero phrase={p} />
 *   </ShadowExercise>
 *
 * Browser support: Chrome/Edge work reliably with ja-JP. Safari has the API
 * but its Japanese recognition is unreliable — treated as unsupported with
 * a "skip" fallback.
 */
export default function ShadowExercise({
  targetJp,
  onComplete,
  onDisable,
  onSlowPlay,
  children,
  compact = false,
  c,
  btn,
  card,
}) {
  const [state, setState] = useState("idle"); // idle | listening | done
  const [result, setResult] = useState(null); // { transcript, correct, graded, errorType }

  const isSafari = typeof navigator !== "undefined" && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const hasAPI = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  const supported = hasAPI && !isSafari;

  const normalize = (s) => s.replace(/[。？！、\s]/g, "");

  const startListening = () => {
    if (!supported) return;
    setResult(null);
    setState("listening");
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    let hasResult = false;

    recognition.onresult = (event) => {
      hasResult = true;
      const results = event.results[0];
      let bestTranscript = results[0].transcript;
      let matched = false;
      const target = normalize(targetJp);

      // Exact / substring match in any alternative
      for (let i = 0; i < results.length; i++) {
        const t = normalize(results[i].transcript);
        if (t === target || t.includes(target) || target.includes(t)) {
          bestTranscript = results[i].transcript;
          matched = true;
          break;
        }
      }

      // Fallback: ≥60% character overlap
      if (!matched) {
        const targetChars = [...target];
        const spokenChars = [...normalize(bestTranscript)];
        let matchCount = 0;
        for (const ch of spokenChars) if (targetChars.includes(ch)) matchCount++;
        matched = matchCount >= targetChars.length * 0.6;
      }

      setResult({ transcript: bestTranscript, correct: matched, graded: true });
      setState("done");
    };

    recognition.onerror = (e) => {
      setState("done");
      setResult({
        transcript: e.error === "no-speech" ? "didn't hear you"
          : e.error === "not-allowed" ? "mic blocked"
          : "recognition error",
        correct: false, graded: false, errorType: e.error,
      });
    };

    recognition.onend = () => {
      if (!hasResult) {
        setState("done");
        setResult(r => r || { transcript: "didn't hear you", correct: false, graded: false });
      }
    };

    recognition.start();
    setTimeout(() => { try { recognition.stop(); } catch {} }, 8000);
  };

  const retry = () => { setResult(null); setState("idle"); };
  const finish = () => { onComplete?.(result?.correct || false, result?.graded || false); };
  const skipAsCorrect = () => { onComplete?.(true, true); };

  return <>
    {children}

    {/* Unsupported browser */}
    {!supported && <div style={{ ...card, padding: "16px 20px", textAlign: "center" }}>
      <div style={{ fontSize: T.sm, color: c.m, marginBottom: 12 }}>
        {isSafari ? "Safari doesn't support Japanese speech recognition. Open in Chrome for shadow mode, or skip."
          : "Speech recognition not supported. Use Chrome for shadow mode, or skip."}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={skipAsCorrect}
          style={{ ...btn, flex: 1, padding: "12px 24px", borderRadius: 10, background: c.a, color: "#fff", fontSize: T.base, fontWeight: 600 }}>
          I said it →
        </button>
        {onDisable && <button onClick={onDisable}
          style={{ ...btn, padding: "12px 16px", borderRadius: 10, background: c.s2, border: "1px solid " + c.b, color: c.m, fontSize: T.sm }}>
          Turn off shadow
        </button>}
      </div>
    </div>}

    {/* Idle — tap to start */}
    {supported && state === "idle" && !result && <>
      <button onClick={startListening}
        style={{
          ...btn, width: "100%",
          padding: compact ? "14px 16px" : "18px 20px",
          borderRadius: 14, background: c.a, color: "#fff",
          fontSize: compact ? T.base : T.lg, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        }}>
        🎤 Tap and say it
      </button>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={skipAsCorrect}
          style={{ ...btn, flex: 1, padding: "10px 16px", borderRadius: 10, background: "transparent", border: "1px solid " + c.b + "44", color: c.m, fontSize: T.sm }}>
          Skip (I said it)
        </button>
        {onDisable && <button onClick={onDisable}
          style={{ ...btn, padding: "10px 14px", borderRadius: 10, background: "transparent", border: "1px solid " + c.b + "44", color: c.m, fontSize: T.sm }}>
          🔕 turn off
        </button>}
      </div>
    </>}

    {/* Listening state */}
    {state === "listening" && <div style={{ ...card, padding: "24px 20px", textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 8, animation: "pulse 1.5s infinite" }}>🎤</div>
      <div style={{ fontSize: T.base, color: c.a, fontWeight: 600 }}>Listening...</div>
      <div style={{ fontSize: T.sm, color: c.m, marginTop: 6 }}>Say it now</div>
    </div>}

    {/* Graded result */}
    {result && result.graded && <div style={{
      ...card, padding: 20, textAlign: "center",
      borderLeft: "3px solid " + (result.correct ? c.g : c.a),
    }}>
      <div style={{ fontSize: T.lg, fontWeight: 700, color: result.correct ? c.g : c.a, marginBottom: 8 }}>
        {result.correct ? "✓ Great pronunciation!" : "✗ Not quite — try again"}
      </div>
      <div style={{ fontSize: T.sm, color: c.m, marginBottom: 4 }}>You said:</div>
      <div style={{ fontSize: T.lg, color: c.tx, marginBottom: 12 }}>{result.transcript}</div>
      {!result.correct && <div style={{ fontSize: T.sm, color: c.m }}>
        Target: <span style={{ color: c.g, fontWeight: 600 }}>{targetJp}</span>
      </div>}
    </div>}

    {/* Non-graded error (mic blocked / no speech) */}
    {result && !result.graded && <div style={{
      ...card, padding: "18px 20px", textAlign: "center",
      borderLeft: "3px solid " + c.m,
    }}>
      <div style={{ fontSize: T.base, fontWeight: 600, color: c.m, marginBottom: 6 }}>⚠️ {result.transcript}</div>
      <div style={{ fontSize: T.sm, color: c.m }}>
        {result.errorType === "not-allowed"
          ? "Allow mic access in browser settings, or skip below."
          : "Tap retry and speak right after the mic appears."}
      </div>
    </div>}

    {/* Result action row */}
    {result && <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
      {supported && <button onClick={retry}
        style={{ ...btn, padding: 12, borderRadius: 10, background: c.s2, border: "1px solid " + c.b, color: c.m, fontSize: T.sm }}>
        🔄 retry
      </button>}
      {onSlowPlay && <button className="ts-icon-btn" onClick={onSlowPlay}
        style={{ ...btn, padding: 12, borderRadius: 10, background: c.s2, border: "1px solid " + c.b, color: c.tx, fontSize: T.sm }}>
        <IconSlowPlay size={14} />
      </button>}
      <button className="ts-btn" onClick={finish}
        style={{ ...btn, flex: 2, padding: 12, borderRadius: 10, background: c.a, color: "#fff", fontSize: T.base, fontWeight: 600 }}>
        {result.graded ? "Next →" : "Skip →"}
      </button>
    </div>}
  </>;
}
