import { useEffect, useState } from "react";
import { fontJa, mono, T } from "../data/constants.js";
import { PHRASES } from "../data/phrases.js";
import { ChoiceCard, TypeLabel, JpText } from "./SessionParts.jsx";
import { IconPlay } from "./Icons.jsx";
import { speakPhrase } from "../utils/audio.js";
import { shuffle } from "../utils/helpers.js";

/**
 * ClusterContrast — minimal-pair discrimination drill.
 *
 * Kornell & Bjork (2008): interleaved contrast between similar items yields
 * ~43% better discrimination vs blocked practice. Applied at sentence level
 * here: two cluster-mates (one correct, one contrast distractor) + two
 * out-of-cluster distractors. Forces the learner to actively distinguish
 * semantically-related phrases they might otherwise conflate (`やすい`/`たかい`
 * - cheap / expensive).
 *
 * Props:
 *   target       — phrase row [id, jp, romaji, en, cat, tip, mc]
 *   clusterMates — array of phrase rows from same cluster (correct excluded)
 *   farPool      — phrases from other clusters (pool for distractors)
 *   onComplete   — (correct: bool) => void
 */
export default function ClusterContrast({ target, clusterMates, farPool, onComplete, c, btn, card, isDesktop }) {
  const [picked, setPicked] = useState(null);
  const [choices] = useState(() => {
    // 1 cluster-mate + 2 out-of-cluster distractors
    const clusterDistractor = shuffle([...clusterMates])[0];
    const farDistractors = shuffle([...farPool]).slice(0, 2);
    const pool = [target];
    if (clusterDistractor) pool.push(clusterDistractor);
    pool.push(...farDistractors);
    return shuffle(pool);
  });

  const handle = (choice) => {
    if (picked !== null) return;
    const correct = choice[0] === target[0];
    setPicked(choice[0]);
    if (correct) speakPhrase(target[0], target[1]);
    setTimeout(() => onComplete?.(correct), correct ? 900 : 1600);
  };

  const answered = picked !== null;

  return (<>
    <TypeLabel c={c}>CONTRAST DRILL</TypeLabel>
    <div style={{ ...card, padding: "20px 20px", marginBottom: 14, textAlign: "center" }}>
      <div style={{ fontSize: T.xs, fontFamily: mono, color: c.m, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 8 }}>
        Which of these means…
      </div>
      <div style={{ fontSize: isDesktop ? T.xxl : T.xl, fontWeight: 700, color: c.tx, lineHeight: 1.3 }}>{target[3]}</div>
      <div style={{ fontSize: T.xs, color: c.m, marginTop: 6 }}>
        Easy to confuse with look-alikes — pay attention to details.
      </div>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {choices.map((choice) => {
        const isCorrect = choice[0] === target[0];
        const isPicked = picked === choice[0];
        const state = answered
          ? (isCorrect ? "correct" : isPicked && !isCorrect ? "wrong" : "dim")
          : "idle";
        return (
          <ChoiceCard key={choice[0]} c={c} btn={btn} disabled={answered} state={state} onClick={() => handle(choice)}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <JpText isDesktop={isDesktop}>{choice[1]}</JpText>
                {answered && <div style={{ fontSize: T.sm, color: c.m2, marginTop: 4 }}>{choice[3]}</div>}
              </div>
              {answered && (
                <span onClick={(e) => { e.stopPropagation(); speakPhrase(choice[0], choice[1]); }} className="ts-icon-btn"
                  style={{ padding: "6px 10px", borderRadius: 6, background: c.s2, border: "1px solid " + c.b, fontSize: T.sm, color: c.tx, flexShrink: 0 }}>
                  <IconPlay size={14}/>
                </span>
              )}
            </div>
          </ChoiceCard>
        );
      })}
    </div>
  </>);
}
