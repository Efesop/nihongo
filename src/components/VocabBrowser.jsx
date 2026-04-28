import { useEffect, useMemo, useRef, useState } from "react";
import { PHRASES, CATS, CAT_ICONS, CAT_COLORS } from "../data/phrases.js";
import { font, fontJa, mono, T, JP } from "../data/constants.js";
import { speakPhrase, speakPhraseWithEnglish } from "../utils/audio.js";
import { shuffle } from "../utils/helpers.js";
import { track } from "../utils/telemetry.js";
import { ProgressBar, PlayButton, ensureSessionStyles } from "./SessionParts.jsx";
import { IconPlay, IconCheck, IconX, IconRefresh, IconArrowRight } from "./Icons.jsx";

/**
 * VocabBrowser — calm review tab.
 *
 * Two modes share the same screen via a Browse / Test toggle:
 *
 *  - Browse: scannable list of every phrase the learner has reached box ≥ 1.
 *    Grouped by category. Each row: JP hero + romaji + EN + listen affordance
 *    (low-opacity on desktop, full opacity on hover; full opacity on mobile).
 *
 *  - Test: EN → JP self-test. Active flashcard is centered in the viewport via
 *    `position: sticky; bottom: 30vh`. Answered cards append to a history list
 *    above. Telemetry only — never writes FSRS / box state, so this stays a
 *    confidence-building tool, not another graded surface.
 */

// One-shot CSS — scoped to this component, no shared sheet pollution.
function ensureVocabStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("vocab-browser-styles")) return;
  const s = document.createElement("style");
  s.id = "vocab-browser-styles";
  s.textContent = `
    .vocab-row { transition: border-color .15s, background .15s; }
    .vocab-row .vocab-listen { opacity: .35; transition: opacity .15s, transform .15s; }
    .vocab-row:hover .vocab-listen,
    .vocab-row:focus-within .vocab-listen { opacity: 1; }
    @media (hover: none) {
      .vocab-row .vocab-listen { opacity: 1; }
    }
    /* Flip reveal — no animation. User found the rotateX float effect distracting. */
  `;
  document.head.appendChild(s);
}

// Predicates — match Home.jsx convention.
const isLearned = (data, id) => (data.phr?.[id]?.box || 0) >= 1;
const isMastered = (data, id) => (data.phr?.[id]?.box || 0) >= 3;
const isLearningOnly = (data, id) => {
  const b = data.phr?.[id]?.box || 0;
  return b >= 1 && b < 3;
};

const FILTERS = [
  { id: "all",      label: "All" },
  { id: "learning", label: "Learning" },
  { id: "mastered", label: "Mastered" },
];

export default function VocabBrowser({
  data, c, inner, card, btn, isDesktop, theme,
}) {
  ensureSessionStyles();   // for .ts-reveal etc — already wired by other tabs but safe to re-call
  ensureVocabStyles();

  const [mode, setMode]         = useState("browse");
  const [filter, setFilter]     = useState("all");

  // Test-mode state
  const [testQueue, setTestQueue] = useState([]);
  const [testIdx, setTestIdx]   = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [history, setHistory]   = useState([]); // [{ id, knewIt }]

  // Track open per mode for telemetry. Fires once per entry.
  const lastModeRef = useRef(null);
  useEffect(() => {
    if (lastModeRef.current !== mode) {
      lastModeRef.current = mode;
      track(mode === "test" ? "vocab_test_open" : "vocab_browse_open", { filter });
    }
  }, [mode, filter]);

  const filterMatches = (id) => {
    if (filter === "mastered") return isMastered(data, id);
    if (filter === "learning") return isLearningOnly(data, id);
    return isLearned(data, id);
  };

  const learnedPhrases = useMemo(
    () => PHRASES.filter(p => filterMatches(p[0])),
    [data.phr, filter]
  );

  const learnedCount = useMemo(() => PHRASES.filter(p => isLearned(data, p[0])).length, [data.phr]);
  const masteredCount = useMemo(() => PHRASES.filter(p => isMastered(data, p[0])).length, [data.phr]);

  // Build (or rebuild) the test queue when entering test mode or changing filter.
  // Only the user explicitly entering test reshuffles — switching filter mid-test
  // also rebuilds because the queue should reflect the chosen scope.
  useEffect(() => {
    if (mode !== "test") return;
    setTestQueue(shuffle(learnedPhrases.map(p => p[0])));
    setTestIdx(0);
    setRevealed(false);
    setHistory([]);
  }, [mode, filter]);

  // ─── Header (shared by both modes) ──────────────────────────────────────────
  const Header = (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <h1 style={{ fontSize: T.xxl, fontWeight: 700, margin: 0, letterSpacing: "-.02em" }}>Vocab</h1>
        <span style={{ fontSize: T.sm, color: c.m, fontFamily: mono }}>
          {learnedCount} learned · {masteredCount} mastered
        </span>
      </div>

      {/* Mode pill */}
      <div role="tablist" aria-label="Vocab view" style={{
        display: "inline-flex", padding: 4, borderRadius: 12,
        background: c.s2, border: "1px solid " + c.b, marginRight: 12, marginBottom: 8,
      }}>
        {[
          { id: "browse", label: "Browse" },
          { id: "test",   label: "Test"   },
        ].map(m => {
          const active = mode === m.id;
          return (
            <button key={m.id} role="tab" aria-selected={active} aria-pressed={active}
              onClick={() => setMode(m.id)}
              className="ts-btn"
              style={{
                ...btn, padding: "8px 16px", borderRadius: 9,
                background: active ? c.a : "transparent",
                color: active ? "#fff" : c.m,
                border: "none", fontSize: T.sm, fontWeight: 600,
                cursor: "pointer", transition: "background .15s, color .15s",
              }}
            >{m.label}</button>
          );
        })}
      </div>

      {/* Filter chips */}
      <div style={{ display: "inline-flex", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
        {FILTERS.map(f => {
          const active = filter === f.id;
          return (
            <button key={f.id} aria-pressed={active}
              onClick={() => setFilter(f.id)}
              className="ts-chip"
              style={{
                ...btn, padding: "5px 11px", borderRadius: 999,
                background: active ? c.a + "22" : "transparent",
                border: "1px solid " + (active ? c.a + "55" : c.b),
                color: active ? c.a : c.m, fontSize: T.xs, fontWeight: 600,
                cursor: "pointer", fontFamily: mono, letterSpacing: ".03em",
              }}
            >{f.label}</button>
          );
        })}
      </div>
    </div>
  );

  // ─── Empty state ────────────────────────────────────────────────────────────
  if (learnedCount === 0) {
    return (
      <div style={inner}>
        {Header}
        <div className="ts-reveal" style={{
          ...card, padding: "32px 24px", textAlign: "center",
          background: c.s, border: "1px solid " + c.b,
        }}>
          <div style={{ fontSize: T.xxl, marginBottom: 8 }}>📚</div>
          <div style={{ fontSize: T.md, fontWeight: 700, marginBottom: 6 }}>Nothing learned yet</div>
          <div style={{ fontSize: T.sm, color: c.m, lineHeight: 1.5, maxWidth: 360, margin: "0 auto" }}>
            Head to the Learn tab to study some phrases. Anything you practice will show up here for easy review.
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════ BROWSE MODE ═══════════════════════════════════════
  if (mode === "browse") {
    // Group learned phrases by category, in CATS order.
    const grouped = Object.keys(CATS).map(catKey => {
      const items = learnedPhrases.filter(p => p[4] === catKey);
      const totalInCat = PHRASES.filter(p => p[4] === catKey).length;
      const learnedInCat = PHRASES.filter(p => p[4] === catKey && isLearned(data, p[0])).length;
      return { catKey, items, totalInCat, learnedInCat };
    }).filter(g => g.items.length > 0);

    return (
      <div style={inner}>
        {Header}

        {grouped.length === 0 && (
          <div style={{ ...card, padding: 20, textAlign: "center", color: c.m, fontSize: T.sm }}>
            No phrases match this filter.
          </div>
        )}

        {grouped.map(({ catKey, items, totalInCat, learnedInCat }) => {
          const catCol = CAT_COLORS[catKey] || c.a;
          const pct = Math.round((learnedInCat / totalInCat) * 100);
          return (
            <section key={catKey} style={{ marginBottom: 22 }}>
              {/* Category header */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10, marginBottom: 10,
                padding: "0 4px",
              }}>
                <span style={{ fontSize: T.lg, lineHeight: 1 }}>{CAT_ICONS[catKey]}</span>
                <div style={{
                  fontSize: T.sm, fontWeight: 700, color: c.tx,
                  textTransform: "uppercase", letterSpacing: ".06em",
                }}>{CATS[catKey]}</div>
                <div style={{ flex: 1, marginLeft: 6, marginRight: 8 }}>
                  <ProgressBar pct={pct} color={catCol} c={c} height={4} track={c.s2} />
                </div>
                <div style={{ fontSize: T.xs, fontFamily: mono, color: c.m, fontWeight: 600 }}>
                  {learnedInCat}/{totalInCat}
                </div>
              </div>

              {/* Rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {items.map(p => (
                  <VocabRow key={p[0]} p={p} c={c} card={card} btn={btn} isDesktop={isDesktop} catCol={catCol} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  // ════════════════════════ TEST MODE ═════════════════════════════════════════
  const totalInQueue = testQueue.length;
  const finished = testIdx >= totalInQueue;
  const currentId = !finished ? testQueue[testIdx] : null;
  const currentPhrase = currentId ? PHRASES.find(p => p[0] === currentId) : null;

  const advance = (knewIt) => {
    if (!currentPhrase) return;
    setHistory(h => [...h, { id: currentPhrase[0], knewIt }]);
    track("vocab_test_attempt", { id: currentPhrase[0], knewIt });
    setRevealed(false);
    setTestIdx(i => i + 1);
  };

  const restart = () => {
    setTestQueue(shuffle(learnedPhrases.map(p => p[0])));
    setTestIdx(0);
    setRevealed(false);
    setHistory([]);
  };

  return (
    <div style={{ ...inner, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {Header}

      {/* History list — newest at the bottom (closest to the active card) */}
      {history.length > 0 && (
        <div style={{
          display: "flex", flexDirection: "column", gap: 6,
          marginBottom: 14,
        }}>
          <div style={{
            fontSize: T.xs, fontFamily: mono, color: c.m,
            textTransform: "uppercase", letterSpacing: ".06em",
            marginBottom: 4, padding: "0 4px",
          }}>Reviewed · {history.length}</div>
          {history.map((h, i) => {
            // Older rows fade slightly so the newest stays visually anchored to the card below.
            const age = history.length - 1 - i;
            const opacity = Math.max(0.5, 1 - age * 0.04);
            return <HistoryRow key={i} h={h} c={c} btn={btn} isDesktop={isDesktop} opacity={opacity} />;
          })}
        </div>
      )}

      {/* Spacer pushes the card toward viewport center on first render */}
      <div style={{ flex: 1, minHeight: 24 }} />

      {/* Active card or finished state — sticky-centered as user scrolls history above */}
      <div style={{
        position: "sticky",
        bottom: isDesktop ? "28vh" : "20vh",
        zIndex: 1,
        marginBottom: 12,
      }}>
        {finished ? (
          <FinishedCard count={history.length} correct={history.filter(h => h.knewIt).length}
            onRestart={restart} c={c} card={card} btn={btn} />
        ) : (
          <ActiveFlashcard
            p={currentPhrase}
            revealed={revealed}
            onFlip={() => {
              if (revealed) return;
              setRevealed(true);
              speakPhraseWithEnglish(currentPhrase[0], currentPhrase[1], currentPhrase[3]);
            }}
            onMissed={() => advance(false)}
            onKnewIt={() => advance(true)}
            onReplay={() => speakPhraseWithEnglish(currentPhrase[0], currentPhrase[1], currentPhrase[3])}
            progress={`${testIdx + 1} / ${totalInQueue}`}
            c={c} card={card} btn={btn} isDesktop={isDesktop}
          />
        )}
      </div>
    </div>
  );
}

// ─── Browse row ───────────────────────────────────────────────────────────────
function VocabRow({ p, c, card, btn, isDesktop, catCol }) {
  return (
    <div className="vocab-row" style={{
      ...card, padding: "16px 18px",
      display: "flex", alignItems: "center", gap: 14,
      borderLeft: "3px solid " + catCol + "55",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: fontJa, fontSize: isDesktop ? T.xxl : T.xl,
          fontWeight: JP.weight, color: c.tx, lineHeight: JP.lineHeight,
        }}>{p[1]}</div>
        <div style={{ fontFamily: mono, fontSize: T.sm, color: c.ro, marginTop: 4, opacity: .9 }}>{p[2]}</div>
        <div style={{ fontSize: T.md, color: c.m2 || c.m, marginTop: 6, lineHeight: 1.4 }}>{p[3]}</div>
      </div>
      <div className="vocab-listen" style={{ flexShrink: 0 }}>
        <PlayButton
          onClick={() => speakPhraseWithEnglish(p[0], p[1], p[3])}
          ariaLabel={`Hear ${p[3]} in Japanese`}
          c={c} btn={btn} size="lg"
        />
      </div>
    </div>
  );
}

// ─── Test: active flashcard ───────────────────────────────────────────────────
function ActiveFlashcard({ p, revealed, onFlip, onMissed, onKnewIt, onReplay, progress, c, card, btn, isDesktop }) {
  // Tap anywhere on the card to flip when not yet revealed.
  return (
    <div style={{
      ...card,
      padding: 0, overflow: "hidden",
      maxWidth: isDesktop ? 540 : "100%", margin: "0 auto",
      boxShadow: "0 12px 40px rgba(0,0,0,.32)",
    }}>
      {/* Progress strip */}
      <div style={{
        padding: "8px 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid " + c.b,
        background: c.s2,
      }}>
        <span style={{ fontSize: T.xs, fontFamily: mono, color: c.m, letterSpacing: ".05em" }}>
          {progress}
        </span>
        <span style={{ fontSize: T.xs, fontFamily: mono, color: c.m }}>
          {revealed ? "ANSWER" : "RECALL"}
        </span>
      </div>

      {/* Card body — clickable when not revealed */}
      <div
        onClick={onFlip}
        role={!revealed ? "button" : undefined}
        tabIndex={!revealed ? 0 : -1}
        onKeyDown={e => { if (!revealed && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onFlip(); } }}
        className={revealed ? undefined : "ts-tap-reveal"}
        style={{
          padding: isDesktop ? "44px 28px" : "36px 22px",
          textAlign: "center",
          cursor: revealed ? "default" : "pointer",
          minHeight: isDesktop ? 220 : 180,
          display: "flex", flexDirection: "column", justifyContent: "center", gap: 10,
        }}
      >
        {!revealed ? (
          <>
            <div style={{ fontSize: T.xs, fontFamily: mono, color: c.m, textTransform: "uppercase", letterSpacing: ".08em" }}>
              English
            </div>
            <div style={{ fontSize: isDesktop ? T.xl : T.lg, fontWeight: 700, color: c.tx, lineHeight: 1.35 }}>
              {p[3]}
            </div>
            <div style={{ fontSize: T.xs, color: c.go, marginTop: 6, fontStyle: "italic" }}>
              tap to reveal →
            </div>
          </>
        ) : (
          <>
            <div style={{
              fontFamily: fontJa, fontSize: isDesktop ? T.xxl : T.xl,
              fontWeight: JP.weight, color: c.tx, lineHeight: JP.lineHeight,
            }}>{p[1]}</div>
            <div style={{ fontFamily: mono, fontSize: T.sm, color: c.ro, opacity: .9 }}>{p[2]}</div>
            <div style={{ fontSize: T.sm, color: c.m, marginTop: 4 }}>{p[3]}</div>
          </>
        )}
      </div>

      {/* Action row */}
      {revealed && (
        <div style={{
          display: "flex", gap: 8,
          padding: "12px 14px",
          borderTop: "1px solid " + c.b,
          background: c.s,
        }}>
          <button
            onClick={onMissed}
            className="ts-btn"
            style={{
              ...btn, flex: 1, padding: "11px 12px", borderRadius: 10,
              background: "transparent", border: "1px solid " + c.b,
              color: c.m, fontSize: T.sm, fontWeight: 600,
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          ><IconX size={14}/> Missed</button>
          <button
            onClick={onReplay}
            className="ts-icon-btn"
            aria-label="Play again"
            style={{
              ...btn, padding: "11px 14px", borderRadius: 10,
              background: c.s2, border: "1px solid " + c.b,
              color: c.tx, fontSize: T.sm,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}
          ><IconPlay size={16}/></button>
          <button
            onClick={onKnewIt}
            className="ts-btn"
            style={{
              ...btn, flex: 2, padding: "11px 12px", borderRadius: 10,
              background: c.g, color: "#fff", border: "none",
              fontSize: T.sm, fontWeight: 700,
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          ><IconCheck size={14}/> Knew it</button>
        </div>
      )}
    </div>
  );
}

// ─── Test: history row (compact) ──────────────────────────────────────────────
function HistoryRow({ h, c, btn, isDesktop, opacity = 1 }) {
  const p = PHRASES.find(x => x[0] === h.id);
  if (!p) return null;
  const col = h.knewIt ? c.g : c.m;
  return (
    <div className="ts-reveal" style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "8px 12px", borderRadius: 10,
      background: c.s, border: "1px solid " + c.b,
      borderLeft: "3px solid " + (h.knewIt ? c.g : c.a) + "66",
      opacity,
    }}>
      <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 18, height: 18, borderRadius: "50%",
        background: col + "22", color: col, flexShrink: 0,
      }}>{h.knewIt ? <IconCheck size={11}/> : <IconX size={11}/>}</span>
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
        <div style={{
          fontFamily: fontJa, fontSize: isDesktop ? T.base : T.sm,
          fontWeight: JP.weight, color: c.tx,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{p[1]}</div>
        <div style={{
          fontSize: T.xs, color: c.m,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{p[3]}</div>
      </div>
      <button
        onClick={() => speakPhrase(p[0], p[1])}
        className="ts-icon-btn"
        aria-label="Replay audio"
        style={{
          ...btn, padding: "4px 8px", borderRadius: 6,
          background: "transparent", border: "1px solid " + c.b,
          color: c.m, flexShrink: 0,
        }}
      ><IconPlay size={11}/></button>
    </div>
  );
}

// ─── Test: finished card ──────────────────────────────────────────────────────
function FinishedCard({ count, correct, onRestart, c, card, btn }) {
  const pct = count === 0 ? 0 : Math.round((correct / count) * 100);
  return (
    <div className="ts-reveal" style={{
      ...card, padding: "28px 22px", textAlign: "center",
      maxWidth: 480, margin: "0 auto",
      boxShadow: "0 12px 40px rgba(0,0,0,.32)",
    }}>
      <div style={{ fontSize: T.xxl, marginBottom: 8 }}>🎌</div>
      <div style={{ fontSize: T.md, fontWeight: 700, marginBottom: 4 }}>Reviewed {count}</div>
      <div style={{ fontSize: T.sm, color: c.m, marginBottom: 16 }}>
        {correct} confident · {count - correct} to revisit · {pct}%
      </div>
      <button
        onClick={onRestart}
        className="ts-btn"
        style={{
          ...btn, padding: "11px 18px", borderRadius: 10,
          background: c.a, color: "#fff", border: "none",
          fontSize: T.sm, fontWeight: 700, cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 6,
        }}
      ><IconRefresh size={14}/> Shuffle and start over</button>
    </div>
  );
}
