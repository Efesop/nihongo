import { useEffect, useMemo, useRef, useState } from "react";
import { PHRASES, CATS, CAT_ICONS, CAT_COLORS } from "../data/phrases.js";
import { PHRASE_BREAKDOWNS } from "../data/phraseBreakdowns.js";
import { font, fontJa, mono, T, JP, GRAMMAR_COLORS } from "../data/constants.js";
import { speak, speakPhrase, speakPhraseWithEnglish } from "../utils/audio.js";
import { shuffle } from "../utils/helpers.js";
import { track } from "../utils/telemetry.js";
// Stuck-list, cooldown, box-floor, and session-cap all live inside
// recordRetrieval (utils/retrieval.js). Vocab Test no longer touches any of
// that machinery directly — it just calls recordRetrieval and trusts the
// surface policy ("vocab-test") for all the rules.
import { ProgressBar, PlayButton, ensureSessionStyles } from "./SessionParts.jsx";
import PhraseSegments from "./PhraseSegments.jsx";
import { IconPlay, IconCheck, IconX, IconRefresh, IconArrowRight, IconSparkle, IconBackspace } from "./Icons.jsx";

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
  data, c, inner, card, btn, isDesktop, theme, reviewPhr, recordRetrieval, getPhrBox,
}) {
  ensureSessionStyles();   // for .ts-reveal etc — already wired by other tabs but safe to re-call
  ensureVocabStyles();

  const [mode, setMode]         = useState("browse");
  const [filter, setFilter]     = useState("all");

  // Browse-mode: which category sections are collapsed. Persisted in localStorage
  // so the user's preference survives reloads.
  const [collapsed, setCollapsed] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("vocab-collapsed") || "[]")); }
    catch { return new Set(); }
  });
  const toggleCollapse = (catKey) => {
    setCollapsed(prev => {
      const n = new Set(prev);
      if (n.has(catKey)) n.delete(catKey); else n.add(catKey);
      try { localStorage.setItem("vocab-collapsed", JSON.stringify([...n])); } catch {}
      return n;
    });
  };

  // Test-mode state
  const [testQueue, setTestQueue] = useState([]);
  const [testIdx, setTestIdx]   = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [history, setHistory]   = useState([]); // [{ id, knewIt, taught? }]
  // Teaching mode — when user clicks Missed, we flip into a brief teach card
  // (scene image + segmented JP + auto audio) before advancing. Phrase id
  // also gets re-inserted ~3 cards later for forced retrieval.
  const [teaching, setTeaching] = useState(null);     // phrase id being taught
  const [retryIds, setRetryIds] = useState(new Set()); // ids that are on a retry pass
  // Per-phrase miss count in this sitting. Drives TeachCard escalation:
  //   1 miss  → standard teach
  //   2 miss  → escalated teach (bigger image, intensified copy)
  //   3+ miss → park: don't reinsert again, route the user to Learn tab.
  const [missCounts, setMissCounts] = useState({});

  // Build-mode state — chips dropped onto the canvas, in order
  const [builtChips, setBuiltChips] = useState([]); // [{ jp, romaji, meaning, type }]
  const [buildPoolType, setBuildPoolType] = useState("noun"); // grammar-type filter for the pool
  const [savedSentences, setSavedSentences] = useState(() => {
    try { return JSON.parse(localStorage.getItem("vocab-built-sentences") || "[]"); }
    catch { return []; }
  });

  // Track open per mode for telemetry. Fires once per entry.
  const lastModeRef = useRef(null);
  useEffect(() => {
    if (lastModeRef.current !== mode) {
      lastModeRef.current = mode;
      const ev = mode === "test" ? "vocab_test_open"
              : mode === "build" ? "vocab_build_open"
              : "vocab_browse_open";
      track(ev, { filter });
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
  // Restores a saved session from localStorage when the filter matches; otherwise
  // shuffles fresh. Lets the user close the tab / refresh / come back tomorrow
  // and pick up exactly where they left off.
  const TEST_SESSION_KEY = "vocab-test-session";
  useEffect(() => {
    if (mode !== "test") return;
    let restored = false;
    try {
      const raw = localStorage.getItem(TEST_SESSION_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        // Only restore if filter matches AND queue isn't already finished —
        // a fresh entry to a completed session should reshuffle.
        if (saved && saved.filter === filter
            && Array.isArray(saved.queue) && saved.queue.length > 0
            && saved.idx < saved.queue.length) {
          setTestQueue(saved.queue);
          setTestIdx(saved.idx || 0);
          setHistory(Array.isArray(saved.history) ? saved.history : []);
          setRetryIds(new Set(Array.isArray(saved.retryIds) ? saved.retryIds : []));
          setTeaching(saved.teaching || null);
          setMissCounts(saved.missCounts && typeof saved.missCounts === "object" ? saved.missCounts : {});
          setRevealed(false); // never restore mid-flip — feels disorienting
          restored = true;
        }
      }
    } catch {}
    if (!restored) {
      setTestQueue(shuffle(learnedPhrases.map(p => p[0])));
      setTestIdx(0);
      setRevealed(false);
      setHistory([]);
      setTeaching(null);
      setRetryIds(new Set());
    }
    // Cooldown map (per-phrase) + session demote counter live in retrieval.js.
    // Cooldown persists in localStorage; counter persists for App's lifetime.
    setMissCounts({});
  }, [mode, filter]);

  // Persist test session to localStorage on every state change. Cheap — small
  // JSON blob, fires only while in test mode.
  useEffect(() => {
    if (mode !== "test") return;
    if (testQueue.length === 0) return; // before first shuffle, don't overwrite
    try {
      localStorage.setItem(TEST_SESSION_KEY, JSON.stringify({
        filter,
        queue: testQueue,
        idx: testIdx,
        history,
        retryIds: [...retryIds],
        teaching,
        missCounts,
      }));
    } catch {}
  }, [mode, filter, testQueue, testIdx, history, retryIds, teaching, missCounts]);

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
          { id: "build",  label: "Build"  },
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
          const isCollapsed = collapsed.has(catKey);
          return (
            <section key={catKey} style={{ marginBottom: 22 }}>
              {/* Category header — entire row clickable to collapse/expand */}
              <button
                onClick={() => toggleCollapse(catKey)}
                aria-expanded={!isCollapsed}
                aria-controls={`vocab-cat-${catKey}`}
                className="ts-btn"
                style={{
                  ...btn, width: "100%",
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 6px", marginBottom: 10,
                  background: "transparent", border: "none",
                  cursor: "pointer", textAlign: "left",
                  borderRadius: 8,
                }}
              >
                <Chevron open={!isCollapsed} c={c} />
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
              </button>

              {/* Rows */}
              {!isCollapsed && (
                <div id={`vocab-cat-${catKey}`} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {items.map(p => (
                    <VocabRow key={p[0]} p={p} c={c} card={card} btn={btn} isDesktop={isDesktop} catCol={catCol} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    );
  }

  // ════════════════════════ BUILD MODE ════════════════════════════════════════
  if (mode === "build") {
    // Pool of every unique segment from learned phrases. Dedupe on jp+meaning so
    // identical building blocks (e.g. "です" appearing in 30 phrases) show once.
    const learnedIds = new Set(learnedPhrases.map(p => p[0]));
    const seen = new Set();
    const pool = [];
    for (const id of learnedIds) {
      const segs = PHRASE_BREAKDOWNS[id] || [];
      for (const seg of segs) {
        const [jp, romaji, meaning, type] = seg;
        if (!jp || jp.trim() === "..." || jp.trim() === "/") continue;
        const key = jp + "|" + (meaning || "");
        if (seen.has(key)) continue;
        seen.add(key);
        pool.push({ jp, romaji, meaning, type: type || "noun" });
      }
    }

    // Group pool by grammar type for the filter tabs
    const TYPES = [
      { id: "noun",       label: "Nouns" },
      { id: "verb",       label: "Verbs" },
      { id: "particle",   label: "Particles" },
      { id: "adjective",  label: "Adjectives" },
      { id: "expression", label: "Expressions" },
      { id: "counter",    label: "Counters" },
      { id: "copula",     label: "Copula" },
      { id: "suffix",     label: "Suffix" },
    ];
    const poolForType = pool.filter(p => p.type === buildPoolType);

    const builtJp = builtChips.map(c => c.jp).join("");
    const builtEn = builtChips.length === 0 ? "" : builtChips.map(c => c.meaning).filter(Boolean).join(" + ");

    const addChip = (chip) => {
      setBuiltChips(b => [...b, chip]);
      track("vocab_build_add", { jp: chip.jp, type: chip.type });
    };
    const removeChip = (idx) => setBuiltChips(b => b.filter((_, i) => i !== idx));
    const clearAll = () => setBuiltChips([]);
    const speakBuilt = () => {
      if (!builtJp) return;
      // No phrase id — use raw TTS via the kana speak helper.
      speak(builtJp);
      track("vocab_build_speak", { length: builtChips.length });
    };
    const saveSentence = () => {
      if (!builtJp) return;
      const next = [{ jp: builtJp, en: builtEn, ts: Date.now() }, ...savedSentences].slice(0, 20);
      setSavedSentences(next);
      try { localStorage.setItem("vocab-built-sentences", JSON.stringify(next)); } catch {}
      setBuiltChips([]);
      track("vocab_build_save");
    };

    if (pool.length === 0) {
      return (
        <div style={inner}>
          {Header}
          <div style={{ ...card, padding: "32px 24px", textAlign: "center" }}>
            <div style={{ fontSize: T.xxl, marginBottom: 8 }}>🧱</div>
            <div style={{ fontSize: T.md, fontWeight: 700, marginBottom: 6 }}>No building blocks yet</div>
            <div style={{ fontSize: T.sm, color: c.m, lineHeight: 1.5, maxWidth: 360, margin: "0 auto" }}>
              Learn a few phrases first. Their pieces (nouns, verbs, particles) will appear here for you to mix and match.
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={inner}>
        {Header}

        {/* Canvas — built sentence */}
        <div style={{
          ...card, padding: "16px 14px", marginBottom: 12,
          minHeight: 110, display: "flex", flexDirection: "column", gap: 10,
        }}>
          <div style={{
            fontSize: T.xs, fontFamily: mono, color: c.m,
            textTransform: "uppercase", letterSpacing: ".06em",
          }}>Your sentence</div>

          {builtChips.length === 0 ? (
            <div style={{
              fontSize: T.sm, color: c.m, fontStyle: "italic",
              padding: "20px 0", textAlign: "center",
            }}>Tap chips below to start building →</div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "baseline" }}>
              {builtChips.map((chip, i) => {
                const tint = GRAMMAR_COLORS[chip.type] || c.m;
                return (
                  <button key={i} onClick={() => removeChip(i)}
                    title="tap to remove"
                    className="ts-chip"
                    style={{
                      ...btn, padding: "6px 10px", borderRadius: 8,
                      background: tint + "18", border: "1px solid " + tint + "55",
                      color: c.tx, fontFamily: fontJa,
                      fontSize: isDesktop ? T.lg : T.md, fontWeight: JP.weight,
                      lineHeight: 1.2, cursor: "pointer",
                    }}>
                    {chip.jp}
                  </button>
                );
              })}
            </div>
          )}

          {/* Live EN gloss + actions */}
          {builtChips.length > 0 && (
            <>
              <div style={{ fontSize: T.sm, color: c.m, lineHeight: 1.4, marginTop: 2 }}>
                {builtEn || <span style={{ fontStyle: "italic", opacity: .6 }}>(no glosses)</span>}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                <button onClick={speakBuilt}
                  className="ts-btn"
                  style={{
                    ...btn, flex: "1 1 140px", padding: "10px 14px", borderRadius: 10,
                    background: c.a, color: "#fff", border: "none",
                    fontSize: T.sm, fontWeight: 700, cursor: "pointer",
                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}><IconPlay size={14}/> Hear it</button>
                <button onClick={saveSentence}
                  className="ts-btn"
                  style={{
                    ...btn, padding: "10px 14px", borderRadius: 10,
                    background: c.s2, color: c.tx, border: "1px solid " + c.b,
                    fontSize: T.sm, fontWeight: 600, cursor: "pointer",
                    display: "inline-flex", alignItems: "center", gap: 6,
                  }}><IconSparkle size={14}/> Save</button>
                <button onClick={clearAll}
                  className="ts-btn"
                  style={{
                    ...btn, padding: "10px 14px", borderRadius: 10,
                    background: "transparent", color: c.m, border: "1px solid " + c.b,
                    fontSize: T.sm, fontWeight: 600, cursor: "pointer",
                    display: "inline-flex", alignItems: "center", gap: 6,
                  }}><IconBackspace size={14}/> Clear</button>
              </div>
            </>
          )}
        </div>

        {/* Saved sentences (recent first) */}
        {savedSentences.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: T.xs, fontFamily: mono, color: c.m,
              textTransform: "uppercase", letterSpacing: ".06em",
              marginBottom: 6, padding: "0 4px",
            }}>Saved · {savedSentences.length}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {savedSentences.map((s, i) => (
                <div key={i} style={{
                  ...card, padding: "10px 12px",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                    <div style={{
                      fontFamily: fontJa, fontSize: isDesktop ? T.md : T.base,
                      fontWeight: JP.weight, color: c.tx, lineHeight: JP.lineHeight,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>{s.jp}</div>
                    {s.en && <div style={{
                      fontSize: T.xs, color: c.m, marginTop: 2,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>{s.en}</div>}
                  </div>
                  <button onClick={() => speak(s.jp)} aria-label="Replay"
                    style={{
                      ...btn, padding: "5px 9px", borderRadius: 6,
                      background: "transparent", border: "1px solid " + c.b,
                      color: c.m, flexShrink: 0,
                    }}><IconPlay size={12}/></button>
                  <button onClick={() => {
                      const next = savedSentences.filter((_, j) => j !== i);
                      setSavedSentences(next);
                      try { localStorage.setItem("vocab-built-sentences", JSON.stringify(next)); } catch {}
                    }} aria-label="Delete"
                    style={{
                      ...btn, padding: "5px 9px", borderRadius: 6,
                      background: "transparent", border: "1px solid " + c.b,
                      color: c.m, flexShrink: 0,
                    }}><IconX size={12}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pool — type tabs */}
        <div style={{
          display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap",
          position: "sticky", top: 0, background: c.bg, padding: "8px 0", zIndex: 1,
        }}>
          {TYPES.map(t => {
            const tint = GRAMMAR_COLORS[t.id] || c.m;
            const count = pool.filter(p => p.type === t.id).length;
            const active = buildPoolType === t.id;
            if (count === 0) return null;
            return (
              <button key={t.id}
                onClick={() => setBuildPoolType(t.id)}
                className="ts-chip"
                aria-pressed={active}
                style={{
                  ...btn, padding: "5px 11px", borderRadius: 999,
                  background: active ? tint + "22" : "transparent",
                  border: "1px solid " + (active ? tint + "66" : c.b),
                  color: active ? tint : c.m,
                  fontSize: T.xs, fontWeight: 600, cursor: "pointer",
                  fontFamily: mono, letterSpacing: ".03em",
                }}
              >{t.label} <span style={{ opacity: .6 }}>{count}</span></button>
            );
          })}
        </div>

        {/* Pool — chips grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isDesktop ? "repeat(auto-fill, minmax(140px, 1fr))" : "repeat(auto-fill, minmax(110px, 1fr))",
          gap: 8,
        }}>
          {poolForType.map((chip, i) => {
            const tint = GRAMMAR_COLORS[chip.type] || c.m;
            return (
              <button key={chip.jp + i}
                onClick={() => addChip(chip)}
                className="ts-btn"
                style={{
                  ...btn, padding: "10px 12px", borderRadius: 10,
                  background: c.s, border: "1px solid " + c.b,
                  borderLeft: "3px solid " + tint,
                  textAlign: "left", cursor: "pointer",
                }}>
                <div style={{
                  fontFamily: fontJa, fontSize: isDesktop ? T.lg : T.md,
                  fontWeight: JP.weight, color: c.tx, lineHeight: 1.2,
                }}>{chip.jp}</div>
                {chip.meaning && <div style={{
                  fontSize: T.xs, color: c.m, marginTop: 4,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{chip.meaning}</div>}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ════════════════════════ TEST MODE ═════════════════════════════════════════
  const totalInQueue = testQueue.length;
  const finished = testIdx >= totalInQueue;
  const currentId = !finished ? testQueue[testIdx] : null;
  const currentPhrase = currentId ? PHRASES.find(p => p[0] === currentId) : null;

  // Knew it — single SRS write through recordRetrieval. Surface "vocab-test"
  // policy throttles to one write per phrase per 2h (separate cooldown for
  // demotes and credits). Stuck-list removal happens automatically inside
  // recordRetrieval. Includes both first-attempt Knew it (small credit if
  // cooldown allows) and retry-after-teach Knew it (recovery credit).
  const handleKnewIt = () => {
    if (!currentPhrase) return;
    const id = currentPhrase[0];
    const wasRetry = retryIds.has(id);
    setHistory(h => [...h, { id, knewIt: true, taught: wasRetry }]);
    track("vocab_test_attempt", { id, knewIt: true, retry: wasRetry });
    setRetryIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    setMissCounts(m => { const n = { ...m }; delete n[id]; return n; });

    if (recordRetrieval) {
      recordRetrieval(id, true, "vocab-test", null, "vocab-test");
    } else if (reviewPhr) {
      reviewPhr(id, true, "vocab-test", null);
    }

    setRevealed(false);
    setTestIdx(i => i + 1);
  };

  // Missed — flip into in-place teaching. The single recordRetrieval call
  // handles all the gates: stuck-list add, 2h cooldown, box-≥-2 floor, and
  // session demote cap. We don't need to read getPhrBox or check anything
  // here — the contract owns those rules.
  const handleMissed = () => {
    if (!currentPhrase) return;
    const id = currentPhrase[0];
    setMissCounts(m => ({ ...m, [id]: (m[id] || 0) + 1 }));
    track("vocab_test_attempt", { id, knewIt: false, missCount: (missCounts[id] || 0) + 1 });

    if (recordRetrieval) {
      recordRetrieval(id, false, "vocab-test", null, "vocab-test");
    } else if (reviewPhr) {
      reviewPhr(id, false, "vocab-test", null);
    }

    setTeaching(id);
  };

  // Got it (after teach) — splice this phrase back into the queue ~3 cards
  // later for a forced retrieval attempt. Always reinserts, regardless of
  // how many times the user has missed it. They learn it here.
  const handleTaughtAdvance = () => {
    if (!currentPhrase) return;
    const id = currentPhrase[0];
    setHistory(h => [...h, { id, knewIt: false, taught: true }]);
    setTestQueue(q => {
      const remaining = q.length - testIdx - 1;
      const insertOffset = Math.min(3, remaining + 1); // +1 to land AFTER current
      const insertAt = testIdx + 1 + Math.max(insertOffset, 1);
      const next = [...q];
      next.splice(insertAt, 0, id);
      return next;
    });
    setRetryIds(prev => new Set(prev).add(id));
    setTeaching(null);
    setRevealed(false);
    setTestIdx(i => i + 1);
  };

  const restart = () => {
    try { localStorage.removeItem(TEST_SESSION_KEY); } catch {}
    setTestQueue(shuffle(learnedPhrases.map(p => p[0])));
    setTestIdx(0);
    setRevealed(false);
    setHistory([]);
    setTeaching(null);
    setRetryIds(new Set());
    setMissCounts({});
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
        ) : teaching ? (
          <TeachCard
            p={currentPhrase}
            isRetry={retryIds.has(currentPhrase[0])}
            missCount={missCounts[currentPhrase[0]] || 1}
            onContinue={handleTaughtAdvance}
            progress={`${testIdx + 1} / ${totalInQueue}`}
            c={c} card={card} btn={btn} isDesktop={isDesktop}
          />
        ) : (
          <ActiveFlashcard
            p={currentPhrase}
            revealed={revealed}
            isRetry={retryIds.has(currentPhrase[0])}
            onFlip={() => {
              if (revealed) return;
              setRevealed(true);
              speakPhraseWithEnglish(currentPhrase[0], currentPhrase[1], currentPhrase[3]);
            }}
            onMissed={handleMissed}
            onKnewIt={handleKnewIt}
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
function ActiveFlashcard({ p, revealed, isRetry, onFlip, onMissed, onKnewIt, onReplay, progress, c, card, btn, isDesktop }) {
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

// ─── Test: teach card ─────────────────────────────────────────────────────────
// Shown when the user clicks Missed. Auto-plays EN→JP, surfaces the scene
// image, and renders the JP segment-by-segment with per-word meanings via
// PhraseSegments — same pattern Learn-tab uses for active recall scaffolding.
// Phrase id then gets re-inserted ~3 cards later for forced retrieval.
function TeachCard({ p, isRetry, missCount = 1, onContinue, progress, c, card, btn, isDesktop }) {
  // Auto-play once on mount. On 2nd+ miss, play the JP a second time after
  // the chain finishes — escalated drilling for phrases the user keeps
  // bouncing off. Cancellation is handled by the playToken in audio.js.
  useEffect(() => {
    if (!p) return;
    speakPhraseWithEnglish(p[0], p[1], p[3]);
    if (missCount >= 2) {
      // Replay JP only after a delay — gives space after the EN→JP chain.
      const t = setTimeout(() => speakPhrase(p[0], p[1]), 2800);
      return () => clearTimeout(t);
    }
  }, [p?.[0], missCount]);

  if (!p) return null;
  const sceneSrc = `/images/phrases/scenes/${p[0]}.png`;
  // Silent visual escalation — image gets bigger when the user keeps
  // missing this phrase, no copy needed. Caps at the 3rd-miss tier.
  const imgHeight = isDesktop
    ? (missCount >= 3 ? 380 : missCount >= 2 ? 320 : 220)
    : (missCount >= 3 ? 280 : missCount >= 2 ? 240 : 180);

  return (
    <div className="ts-reveal" style={{
      ...card,
      padding: 0, overflow: "hidden",
      maxWidth: isDesktop ? 540 : "100%", margin: "0 auto",
      boxShadow: "0 12px 40px rgba(0,0,0,.32)",
      border: "1px solid " + (isEscalated ? c.a : c.go) + "55",
    }}>
      {/* Header strip — single, calm tag. No miss-count noise. */}
      <div style={{
        padding: "10px 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: c.go + "1a", borderBottom: "1px solid " + c.go + "33",
      }}>
        <span style={{
          fontSize: T.xs, fontFamily: mono, fontWeight: 700, letterSpacing: ".05em",
          color: c.go,
        }}>
          {progress} · TEACHING
        </span>
      </div>

      {/* Scene image — bigger on each subsequent miss to drill the
          picture-to-meaning bond harder. No accompanying copy. */}
      <img
        key={p[0] + ":" + missCount}
        src={sceneSrc}
        alt=""
        loading="lazy"
        onError={(e) => { e.target.style.display = "none"; }}
        style={{
          width: "100%", height: imgHeight,
          objectFit: "cover", display: "block",
          background: c.s2,
          transition: "height .25s ease",
        }}
      />

      {/* Body — segmented JP, romaji, EN */}
      <div style={{
        padding: isDesktop ? "20px 22px 18px" : "16px 18px 14px",
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        <div style={{ fontSize: T.xs, fontFamily: mono, color: c.m, textTransform: "uppercase", letterSpacing: ".08em" }}>
          {p[3]}
        </div>

        {/* Segmented JP — tap each chip for per-word meaning + romaji */}
        <PhraseSegments
          phraseId={p[0]}
          c={c}
          fontSize={isDesktop ? 28 : 22}
          fontWeight={JP.weight}
        />

        <div style={{ fontFamily: mono, fontSize: T.sm, color: c.ro, opacity: .9 }}>
          {p[2]}
        </div>

        <div style={{ fontSize: T.xs, color: c.m, fontStyle: "italic", marginTop: 2 }}>
          tap any word above to hear it broken down
        </div>
      </div>

      {/* Action row */}
      <div style={{
        display: "flex", gap: 8,
        padding: "12px 14px",
        borderTop: "1px solid " + c.b,
        background: c.s,
      }}>
        <button
          onClick={() => speakPhraseWithEnglish(p[0], p[1], p[3])}
          className="ts-btn"
          style={{
            ...btn, padding: "11px 14px", borderRadius: 10,
            background: c.s2, border: "1px solid " + c.b,
            color: c.tx, fontSize: T.sm, fontWeight: 600,
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        ><IconPlay size={14}/> Hear again</button>
        <button
          onClick={onContinue}
          className="ts-btn"
          style={{
            ...btn, flex: 1, padding: "11px 14px", borderRadius: 10,
            background: c.go, color: "#000", border: "none",
            fontSize: T.sm, fontWeight: 700, cursor: "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        ><IconArrowRight size={14}/> Got it — keep going</button>
      </div>
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
        }}>
          {p[3]}
          {h.taught && (
            <span style={{
              marginLeft: 6, padding: "1px 6px", borderRadius: 999,
              background: c.go + "22", color: c.go,
              fontSize: T.xs, fontWeight: 700, fontFamily: mono, letterSpacing: ".04em",
            }}>{h.knewIt ? "RECOVERED" : "TAUGHT"}</span>
          )}
        </div>
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

// ─── Chevron — small SVG, rotates between collapsed and expanded ──────────────
function Chevron({ open, c }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"
      style={{
        flexShrink: 0,
        transform: open ? "rotate(90deg)" : "rotate(0deg)",
        transition: "transform .15s ease",
        color: c.m,
      }}>
      <path d="M4 2 L8 6 L4 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
