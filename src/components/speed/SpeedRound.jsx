import { useEffect, useRef, useState } from "react";
import { fontJa, mono, T, JP } from "../../data/constants.js";
import { PHRASES } from "../../data/phrases.js";
import { speakPhrase } from "../../utils/audio.js";
import { shuffle } from "../../utils/helpers.js";
import { ChoiceCard, TypeLabel, JpText } from "../SessionParts.jsx";
import { IconPlay } from "../Icons.jsx";
import { getDistractors } from "../../utils/sessionEngine.js";

/**
 * SpeedRound — fluency development exercise (Nation's 4th strand).
 *
 * Practises already-known material under time pressure to build automaticity.
 * Uses only phrases already at box ≥4 AND production-skill ≥2 (listen variant:
 * listen-skill ≥2). No new learning content — this is about moving items from
 * "retrievable with effort" → "automatic".
 *
 * Mechanics:
 *   - 6 cards per round.
 *   - Each card has a 3-second speed goal; 5-second hard timeout.
 *   - Correct within 3s → +fluency point (display only, no XP bump yet).
 *   - Miss or timeout → NO SRS penalty (doesn't decrement skills[id]).
 *     Purely a fluency display metric, not a mastery signal.
 *
 * Variants (chosen per card randomly):
 *   - listen  : hear phrase → pick English meaning (speed-round-listen)
 *   - produce : see English → pick Japanese phrase (speed-round-produce)
 *
 * Props:
 *   pool        — array of phrase rows to draw from (caller filters by skill)
 *   onComplete  — ({hits, total, fluent}) => void. fluent = answered ≤ 3s
 *   c, btn, card, isDesktop — theme
 */
const TIMEOUT_MS = 5000;
const FLUENT_MS = 3000;
const ROUND_SIZE = 6;

export default function SpeedRound({ pool, onComplete, c, btn, card, isDesktop }) {
  const [cards] = useState(() => buildRound(pool));
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [remaining, setRemaining] = useState(TIMEOUT_MS);
  const [results, setResults] = useState([]); // { correct, ms }
  const startRef = useRef(Date.now());
  const timerRef = useRef(null);

  const card_ = cards[idx];
  const isDone = idx >= cards.length;

  // Countdown tick
  useEffect(() => {
    if (isDone || picked) return;
    startRef.current = Date.now();
    setRemaining(TIMEOUT_MS);
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const left = TIMEOUT_MS - elapsed;
      if (left <= 0) {
        clearInterval(timerRef.current);
        handleAnswer(null);
      } else {
        setRemaining(left);
      }
    }, 50);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, isDone]);

  // Play audio on listen variant when card appears
  useEffect(() => {
    if (isDone || !card_) return;
    if (card_.variant === "listen") {
      const t = setTimeout(() => speakPhrase(card_.target[0], card_.target[1]), 150);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, isDone]);

  function handleAnswer(choice) {
    if (picked !== null) return;
    clearInterval(timerRef.current);
    const elapsed = Date.now() - startRef.current;
    const correct = choice && choice[0] === card_.target[0];
    setPicked(choice === null ? "__timeout__" : choice[0]);
    setResults(r => [...r, { correct, ms: elapsed, fluent: correct && elapsed <= FLUENT_MS }]);
    // Brief feedback pause then advance
    setTimeout(() => {
      setPicked(null);
      setIdx(i => i + 1);
    }, correct ? 500 : 900);
  }

  useEffect(() => {
    if (!isDone) return;
    const hits = results.filter(r => r.correct).length;
    const fluent = results.filter(r => r.fluent).length;
    onComplete?.({ hits, total: results.length, fluent });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDone]);

  if (!card_ || isDone) {
    return <div style={{ ...card, padding: 24, textAlign: "center" }}>
      <div style={{ fontSize: T.md, color: c.m }}>Speed round complete.</div>
    </div>;
  }

  const pct = Math.max(0, remaining / TIMEOUT_MS);
  const isFluentZone = remaining > (TIMEOUT_MS - FLUENT_MS);
  const ringColor = isFluentZone ? c.g : remaining > 1500 ? c.go : c.a;

  return (<>
    <TypeLabel c={c}>SPEED ROUND · {idx + 1}/{cards.length}</TypeLabel>

    {/* Countdown bar */}
    <div style={{
      height: 6, background: c.s2, borderRadius: 3, overflow: "hidden",
      marginBottom: 12, border: "1px solid " + c.b,
    }}>
      <div style={{
        width: (pct * 100) + "%", height: "100%",
        background: ringColor, transition: "width .08s linear, background .3s",
      }} />
    </div>

    {/* Prompt */}
    <div style={{ ...card, padding: "22px 20px", marginBottom: 14, textAlign: "center" }}>
      {card_.variant === "listen" ? (<>
        <div style={{ fontSize: T.xs, fontFamily: mono, color: c.m, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 10 }}>
          hear it · tap meaning
        </div>
        <button className="ts-icon-btn" onClick={() => speakPhrase(card_.target[0], card_.target[1])}
          style={{ ...btn, padding: "12px 20px", borderRadius: 10, background: c.s2, border: "1px solid " + c.b, color: c.tx, fontSize: T.base, display: "inline-flex", alignItems: "center", gap: 8 }}>
          <IconPlay size={16}/> replay
        </button>
      </>) : (<>
        <div style={{ fontSize: T.xs, fontFamily: mono, color: c.m, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 8 }}>
          tap the Japanese
        </div>
        <div style={{ fontSize: isDesktop ? T.xxl : T.xl, fontWeight: 700, color: c.tx, lineHeight: 1.3 }}>{card_.target[3]}</div>
      </>)}
    </div>

    {/* Choices */}
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {card_.choices.map((choice, i) => {
        const isCorrect = choice[0] === card_.target[0];
        const isPicked = picked === choice[0];
        const isTimeout = picked === "__timeout__";
        const state = picked
          ? (isCorrect ? "correct" : isPicked && !isCorrect ? "wrong" : "dim")
          : "idle";
        return (
          <ChoiceCard key={choice[0]} c={c} btn={btn} disabled={!!picked} state={state} onClick={() => handleAnswer(choice)}>
            {card_.variant === "listen" ? (
              <span style={{ fontSize: T.md, fontWeight: 600 }}>{choice[3]}</span>
            ) : (
              <JpText isDesktop={isDesktop}>{choice[1]}</JpText>
            )}
          </ChoiceCard>
        );
      })}
    </div>

    {/* Running score */}
    <div style={{
      marginTop: 14, padding: "8px 12px",
      display: "flex", justifyContent: "space-between",
      fontSize: T.xs, fontFamily: mono, color: c.m,
    }}>
      <span>✓ {results.filter(r => r.correct).length}/{results.length}</span>
      <span>⚡ fluent (&lt;3s): {results.filter(r => r.fluent).length}</span>
    </div>
  </>);
}

/**
 * Build a round of speed-round cards from the eligible pool.
 * Alternate listen/produce variants to hit both skills.
 */
function buildRound(pool) {
  const picks = shuffle([...pool]).slice(0, ROUND_SIZE);
  return picks.map((target, i) => {
    const variant = i % 2 === 0 ? "listen" : "produce";
    // 3 distractors from the full PHRASES pool (similarity-scored)
    const distractors = getDistractors(target, 3);
    const choices = shuffle([target, ...distractors]);
    return { target, choices, variant };
  });
}
