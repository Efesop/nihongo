import { useEffect, useMemo, useRef, useState } from "react";
import { PHRASES, CATS, CAT_ICONS, CAT_COLORS } from "../data/phrases.js";
import { PHRASE_BREAKDOWNS } from "../data/phraseBreakdowns.js";
import { GRAMMAR_PATTERNS, getUnlockedPatterns } from "../data/grammarPatterns.js";
import { fontJa, mono, T, JP, GRAMMAR_COLORS } from "../data/constants.js";
import { speakPhraseWithEnglish } from "../utils/audio.js";
import { track } from "../utils/telemetry.js";
import { IconPlay, IconRefresh, IconX } from "./Icons.jsx";

/**
 * Web — interactive radial node graph of the user's learned content.
 *
 * Layout (deterministic, hand-laid — no force-directed deps):
 *   • Center node: 日本語
 *   • Ring 1: one node per category that has at least one learned phrase
 *   • Ring 2: each learned phrase orbits its category node
 *   • Edges:
 *       - phrase → its category (always drawn, faint)
 *       - phrase ↔ phrase when they share a key building block (segment that
 *         appears in 3+ phrases — particles, common verbs, です, ください, etc).
 *         These are the "connection" lines that show grammar transferring between
 *         phrases the user already knows.
 *
 * Interaction:
 *   • Tap a phrase node → focus mode. The selected node scales up, its connected
 *     edges bold, related phrases highlight, everything else dims. Detail panel
 *     opens at bottom-right with JP/EN/romaji + a play button + "what connects".
 *   • Tap empty space → exit focus.
 *   • Tap a category node → toggle that category's phrases between "show all" and
 *     "show only this category".
 *
 * SVG-based, viewBox-scaled, pan-friendly. Performance is fine up to ~150
 * learned phrases — beyond that, edge-rendering dominates and we'd want to
 * memo + simplify.
 */

// ─── Layout math ──────────────────────────────────────────────────────────────
const VB = { w: 1000, h: 1000, cx: 500, cy: 500 };
const CAT_RADIUS = 200;        // ring 1 distance from center
const PHRASE_RADIUS = 120;     // ring 2 distance from each category
const PHRASE_NODE_R = 18;
const CAT_NODE_R = 36;
const CENTER_NODE_R = 44;

// Place categories evenly around the center.
function placeCategories(catKeys) {
  const positions = {};
  const n = catKeys.length;
  catKeys.forEach((k, i) => {
    const angle = (i / Math.max(n, 1)) * Math.PI * 2 - Math.PI / 2;
    positions[k] = {
      x: VB.cx + Math.cos(angle) * CAT_RADIUS,
      y: VB.cy + Math.sin(angle) * CAT_RADIUS,
      angle,
    };
  });
  return positions;
}

// Place phrases in a fan around their category node.
function placePhrasesAroundCategory(catPos, phrases) {
  const positions = {};
  const n = phrases.length;
  // Bias the fan outward (away from the center) so phrases don't pile up over center.
  const baseAngle = catPos.angle;
  const arcSpan = Math.min(Math.PI * 1.4, 0.45 + n * 0.18);
  phrases.forEach((id, i) => {
    const t = n === 1 ? 0 : (i / (n - 1)) - 0.5;
    const angle = baseAngle + t * arcSpan;
    positions[id] = {
      x: catPos.x + Math.cos(angle) * PHRASE_RADIUS,
      y: catPos.y + Math.sin(angle) * PHRASE_RADIUS,
    };
  });
  return positions;
}

// Find building-block edges: pairs of phrases that share a non-trivial segment.
// "Non-trivial" = the segment shows up in fewer than `MAX_USES` phrases (so we
// don't draw 50 edges to every phrase containing です / は / が).
function buildEdges(learnedIds) {
  const segUsage = {};   // jp → [phraseId, ...]
  for (const id of learnedIds) {
    const segs = PHRASE_BREAKDOWNS[id] || [];
    const seen = new Set();
    for (const seg of segs) {
      const jp = seg[0];
      if (!jp || jp.trim() === "..." || jp.length === 0) continue;
      if (seen.has(jp)) continue;       // count each segment once per phrase
      seen.add(jp);
      (segUsage[jp] ||= []).push(id);
    }
  }
  // Edges: pairs sharing a segment used in 2..MAX_USES phrases.
  const MAX_USES = 6;
  const MIN_USES = 2;
  const seenPair = new Set();
  const edges = [];
  for (const jp of Object.keys(segUsage)) {
    const ids = segUsage[jp];
    if (ids.length < MIN_USES || ids.length > MAX_USES) continue;
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const key = ids[i] < ids[j] ? `${ids[i]}|${ids[j]}` : `${ids[j]}|${ids[i]}`;
        if (seenPair.has(key)) continue;
        seenPair.add(key);
        edges.push({ a: ids[i], b: ids[j], via: jp });
      }
    }
  }
  return edges;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Web({ data, c, inner, btn, isDesktop, theme }) {
  const [focusId, setFocusId] = useState(null);   // phrase id or null
  const [activeCat, setActiveCat] = useState(null); // cat key or null = show all

  useEffect(() => { track("web_open"); }, []);

  // Which phrases qualify as "learned" (box ≥ 1)
  const learnedIds = useMemo(() => {
    const phrData = data?.phr || {};
    return PHRASES.filter(p => (phrData[p[0]]?.box || 0) >= 1).map(p => p[0]);
  }, [data?.phr]);

  // Group learned by category (skip empty cats)
  const grouped = useMemo(() => {
    const byCat = {};
    for (const id of learnedIds) {
      const p = PHRASES.find(x => x[0] === id);
      if (!p) continue;
      const cat = p[4];
      (byCat[cat] ||= []).push(id);
    }
    return byCat;
  }, [learnedIds]);

  const activeCats = useMemo(
    () => Object.keys(CATS).filter(k => grouped[k] && grouped[k].length > 0),
    [grouped]
  );

  const catPositions = useMemo(() => placeCategories(activeCats), [activeCats]);
  const phrasePositions = useMemo(() => {
    const out = {};
    for (const cat of activeCats) {
      const positions = placePhrasesAroundCategory(catPositions[cat], grouped[cat]);
      Object.assign(out, positions);
    }
    return out;
  }, [activeCats, grouped, catPositions]);

  const edges = useMemo(() => buildEdges(learnedIds), [learnedIds]);

  // Helpers for focus state
  const focusedPhrase = focusId ? PHRASES.find(p => p[0] === focusId) : null;
  const connectedIds = useMemo(() => {
    if (!focusId) return new Set();
    const set = new Set([focusId]);
    for (const e of edges) {
      if (e.a === focusId) set.add(e.b);
      if (e.b === focusId) set.add(e.a);
    }
    return set;
  }, [focusId, edges]);

  // ─── Empty state ───
  if (learnedIds.length === 0) {
    return (
      <div style={inner}>
        <div style={{ marginBottom: 18 }}>
          <h1 style={{ fontSize: T.xxl, fontWeight: 700, margin: 0, letterSpacing: "-.02em" }}>Web</h1>
          <div style={{ fontSize: T.sm, color: c.m, marginTop: 6 }}>
            Visual map of how everything you've learned connects.
          </div>
        </div>
        <div style={{
          padding: "32px 24px", borderRadius: 12,
          background: c.s, border: "1px solid " + c.b,
          textAlign: "center",
        }}>
          <div style={{ fontSize: T.xxl, marginBottom: 8 }}>🕸️</div>
          <div style={{ fontSize: T.md, fontWeight: 700, marginBottom: 6 }}>Nothing to map yet</div>
          <div style={{ fontSize: T.sm, color: c.m, lineHeight: 1.5, maxWidth: 360, margin: "0 auto" }}>
            Learn some phrases first — once you have a few, this page will show how their building blocks connect to each other.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={inner}>
      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
          <h1 style={{ fontSize: T.xxl, fontWeight: 700, margin: 0, letterSpacing: "-.02em" }}>Web</h1>
          <span style={{ fontSize: T.sm, color: c.m, fontFamily: mono }}>
            {learnedIds.length} phrases · {edges.length} connections
          </span>
        </div>
        <div style={{ fontSize: T.xs, color: c.m, fontStyle: "italic" }}>
          Tap a phrase to see what it shares with others.
          {focusId && (
            <button onClick={() => setFocusId(null)}
              style={{
                marginLeft: 10, padding: "3px 9px", borderRadius: 6,
                background: "transparent", border: "1px solid " + c.b,
                color: c.m, fontSize: T.xs, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 4,
              }}>
              <IconX size={10}/> clear focus
            </button>
          )}
          {activeCat && (
            <button onClick={() => setActiveCat(null)}
              style={{
                marginLeft: 6, padding: "3px 9px", borderRadius: 6,
                background: "transparent", border: "1px solid " + c.b,
                color: c.m, fontSize: T.xs, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 4,
              }}>
              <IconRefresh size={10}/> show all categories
            </button>
          )}
        </div>
      </div>

      {/* Graph */}
      <div style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1 / 1",
        maxWidth: 720, margin: "0 auto",
        background: c.s, border: "1px solid " + c.b, borderRadius: 16,
        overflow: "hidden",
      }}>
        <svg
          viewBox={`0 0 ${VB.w} ${VB.h}`}
          width="100%" height="100%"
          onClick={() => setFocusId(null)}
          style={{ display: "block", cursor: focusId ? "zoom-out" : "default" }}
        >
          {/* Edges — building-block connections between phrases */}
          <g>
            {edges.map((e, i) => {
              const A = phrasePositions[e.a];
              const B = phrasePositions[e.b];
              if (!A || !B) return null;
              if (activeCat) {
                const aCat = PHRASES.find(p => p[0] === e.a)?.[4];
                const bCat = PHRASES.find(p => p[0] === e.b)?.[4];
                if (aCat !== activeCat && bCat !== activeCat) return null;
              }
              const focused = focusId && (e.a === focusId || e.b === focusId);
              const dim = focusId && !focused;
              return (
                <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y}
                  stroke={focused ? c.a : c.b}
                  strokeWidth={focused ? 2 : 1}
                  opacity={dim ? 0.08 : focused ? 0.85 : 0.3}
                  style={{ transition: "opacity .2s, stroke .2s, stroke-width .2s" }}
                />
              );
            })}
          </g>

          {/* Spokes from center to each category */}
          <g>
            {activeCats.map(cat => {
              const pos = catPositions[cat];
              const dim = activeCat && activeCat !== cat;
              return (
                <line key={cat}
                  x1={VB.cx} y1={VB.cy} x2={pos.x} y2={pos.y}
                  stroke={CAT_COLORS[cat] || c.m}
                  strokeWidth={1.5}
                  opacity={dim ? 0.1 : 0.45}
                  style={{ transition: "opacity .2s" }}
                />
              );
            })}
          </g>

          {/* Spokes from category to its phrases */}
          <g>
            {activeCats.map(cat => {
              const cPos = catPositions[cat];
              const dim = activeCat && activeCat !== cat;
              return (grouped[cat] || []).map(id => {
                const p = phrasePositions[id];
                if (!p) return null;
                const fade = focusId && !connectedIds.has(id);
                return (
                  <line key={cat + id}
                    x1={cPos.x} y1={cPos.y} x2={p.x} y2={p.y}
                    stroke={CAT_COLORS[cat] || c.m}
                    strokeWidth={1}
                    opacity={dim ? 0.08 : fade ? 0.1 : 0.4}
                    style={{ transition: "opacity .2s" }}
                  />
                );
              });
            })}
          </g>

          {/* Center node */}
          <g>
            <circle cx={VB.cx} cy={VB.cy} r={CENTER_NODE_R}
              fill={c.s2} stroke={c.a} strokeWidth={2} />
            <text x={VB.cx} y={VB.cy + 6} textAnchor="middle"
              fontSize="22" fontFamily="serif" fill={c.tx} fontWeight="700">日本語</text>
          </g>

          {/* Category nodes */}
          {activeCats.map(cat => {
            const pos = catPositions[cat];
            const col = CAT_COLORS[cat] || c.a;
            const isActive = activeCat === cat;
            const dim = activeCat && !isActive;
            return (
              <g key={cat}
                onClick={(ev) => { ev.stopPropagation(); setActiveCat(activeCat === cat ? null : cat); track("web_cat_click", { cat }); }}
                style={{ cursor: "pointer", opacity: dim ? 0.3 : 1, transition: "opacity .2s" }}>
                <circle cx={pos.x} cy={pos.y} r={CAT_NODE_R}
                  fill={col + "22"} stroke={col} strokeWidth={isActive ? 3 : 2} />
                <text x={pos.x} y={pos.y + 8} textAnchor="middle" fontSize="22" style={{ pointerEvents: "none" }}>{CAT_ICONS[cat]}</text>
              </g>
            );
          })}

          {/* Phrase nodes */}
          {Object.keys(phrasePositions).map(id => {
            const p = PHRASES.find(x => x[0] === id);
            if (!p) return null;
            const pos = phrasePositions[id];
            const cat = p[4];
            if (activeCat && cat !== activeCat) return null;
            const col = CAT_COLORS[cat] || c.a;
            const isFocus = focusId === id;
            const isConnected = focusId && connectedIds.has(id);
            const fade = focusId && !isConnected;
            const r = isFocus ? PHRASE_NODE_R + 6 : PHRASE_NODE_R;
            return (
              <g key={id}
                onClick={(ev) => { ev.stopPropagation(); setFocusId(id); track("web_phrase_click", { id }); }}
                style={{ cursor: "pointer", opacity: fade ? 0.18 : 1, transition: "opacity .2s" }}>
                <circle cx={pos.x} cy={pos.y} r={r}
                  fill={isFocus ? col : c.s2}
                  stroke={col}
                  strokeWidth={isFocus ? 3 : isConnected ? 2 : 1.5}
                  style={{ transition: "r .15s, fill .15s, stroke-width .15s" }}
                />
                {/* JP label inside the node — only readable on focus or larger nodes */}
                {(isFocus || isConnected || !focusId) && (
                  <text x={pos.x} y={pos.y + 4} textAnchor="middle"
                    fontSize={isFocus ? 14 : 11}
                    fontFamily={fontJa}
                    fill={isFocus ? "#fff" : c.tx}
                    fontWeight="600"
                    style={{ pointerEvents: "none" }}>
                    {p[1].length > 4 ? p[1].slice(0, 4) + "…" : p[1]}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Detail panel — appears when a phrase is focused */}
        {focusedPhrase && (
          <div className="ts-reveal" style={{
            position: "absolute",
            bottom: 12, right: 12, left: isDesktop ? "auto" : 12,
            maxWidth: isDesktop ? 320 : "auto",
            background: c.s, border: "1px solid " + c.b, borderRadius: 12,
            padding: "12px 14px",
            boxShadow: "0 10px 30px rgba(0,0,0,.35)",
            backdropFilter: "blur(6px)",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ fontSize: T.lg, lineHeight: 1 }}>{CAT_ICONS[focusedPhrase[4]]}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: fontJa, fontSize: isDesktop ? T.lg : T.md,
                  fontWeight: JP.weight, color: c.tx, lineHeight: JP.lineHeight,
                }}>{focusedPhrase[1]}</div>
                <div style={{ fontFamily: mono, fontSize: T.xs, color: c.ro, marginTop: 2 }}>{focusedPhrase[2]}</div>
                <div style={{ fontSize: T.sm, color: c.m, marginTop: 4 }}>{focusedPhrase[3]}</div>
              </div>
              <button
                onClick={(ev) => { ev.stopPropagation(); speakPhraseWithEnglish(focusedPhrase[0], focusedPhrase[1], focusedPhrase[3]); }}
                aria-label="Hear it"
                style={{
                  ...btn, padding: "6px 10px", borderRadius: 8,
                  background: c.s2, border: "1px solid " + c.b, color: c.tx,
                  flexShrink: 0,
                }}><IconPlay size={14}/></button>
            </div>

            {/* Connections list */}
            {(() => {
              const conns = edges.filter(e => e.a === focusId || e.b === focusId);
              if (conns.length === 0) {
                return (
                  <div style={{ fontSize: T.xs, color: c.m, marginTop: 10, fontStyle: "italic" }}>
                    No shared building blocks with other learned phrases yet.
                  </div>
                );
              }
              // Group by `via` so the list reads like "shares X with Y, Z, …"
              const byVia = {};
              for (const e of conns) {
                const otherId = e.a === focusId ? e.b : e.a;
                (byVia[e.via] ||= []).push(otherId);
              }
              return (
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{
                    fontSize: T.xs, fontFamily: mono, color: c.m,
                    textTransform: "uppercase", letterSpacing: ".06em",
                  }}>Shares with</div>
                  {Object.keys(byVia).slice(0, 4).map(via => (
                    <div key={via} style={{ fontSize: T.xs, color: c.tx, lineHeight: 1.5 }}>
                      <span style={{ fontFamily: fontJa, fontWeight: JP.weight, color: c.a }}>{via}</span>
                      <span style={{ color: c.m, marginLeft: 6 }}>
                        with {byVia[via].slice(0, 3).map(id => {
                          const p = PHRASES.find(x => x[0] === id);
                          return p ? p[1] : id;
                        }).join(", ")}
                        {byVia[via].length > 3 && ` +${byVia[via].length - 3}`}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
