import { useEffect, useMemo, useRef, useState } from "react";
import { PHRASES, CATS, CAT_COLORS } from "../data/phrases.js";
import { PHRASE_BREAKDOWNS } from "../data/phraseBreakdowns.js";
import { fontJa, mono, T, JP, GRAMMAR_COLORS } from "../data/constants.js";
import { speakPhraseWithEnglish, speak } from "../utils/audio.js";
import { track } from "../utils/telemetry.js";
import { IconPlay, IconX, IconRefresh } from "./Icons.jsx";
import { usePhysics } from "./web/usePhysics.js";

/**
 * Web — full-bleed force-directed graph of the user's learned content.
 *
 * Two view modes (toggle in header):
 *   • Phrases: nodes = phrases. Edges = pairs sharing a non-trivial segment
 *     (segment used in 2..6 phrases). Node colour = category, brightness = SRS box.
 *   • Blocks: nodes = unique segments (particles, verbs, expressions, ...) appearing
 *     in 2+ learned phrases. Node size = usage count, colour = grammar type, brightness
 *     = avg box of containing phrases. Edges = co-occurrence in same phrase.
 *
 * Physics: requestAnimationFrame loop, settles in ~3s, gentle drift at rest, sleeps
 * when kinetic energy is low and wakes on interaction. See ./web/usePhysics.js.
 *
 * Pan + zoom: wheel zooms anchored at cursor; drag empty space pans; drag node pins it.
 *
 * Focus: tap a node → pull toward viewport centre, dim non-connected, animate connected
 * edges via stroke-dasharray. Detail panel shows JP/EN/box/next-review/weak-skill +
 * shared-with list.
 */

// ─── JP labels for category nodes — no emojis ─────────────────────────────────
const CAT_JP = {
  greet:    "あいさつ",
  food:     "しょくじ",
  train:    "こうつう",
  hotel:    "やど",
  shop:     "かいもの",
  dir:      "みち",
  sos:      "きんきゅう",
  numbers:  "かず",
  time:     "じかん",
  daily:    "にちじょう",
  describe: "ようす",
};

// Filter for "interesting" segments — too-common ones (です, は, が, を) inflate edges.
const TRIVIAL_SEGMENTS = new Set(["です", "ます", "は", "が", "を", "に", "の", "で", "と", "か", "...", "/"]);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isLearned = (data, id) => (data?.phr?.[id]?.box || 0) >= 1;

// Map SRS box (0..5) to alpha hex string. Box 0 = dim (22), box 5 = full (ff).
const alphaForBox = (b) => {
  const a = Math.max(0x33, Math.min(0xff, 0x33 + Math.round((b / 5) * (0xff - 0x33))));
  return a.toString(16).padStart(2, "0");
};

const fmtRelative = (ts) => {
  if (!ts) return "—";
  const ms = Date.now() - ts;
  const past = ms >= 0;
  const a = Math.abs(ms);
  const m = Math.round(a / 60000);
  if (m < 60) return past ? `${m}m ago` : `in ${m}m`;
  const h = Math.round(a / 3600000);
  if (h < 24) return past ? `${h}h ago` : `in ${h}h`;
  const d = Math.round(a / 86400000);
  return past ? `${d}d ago` : `in ${d}d`;
};

const weakestSkill = (skills) => {
  if (!skills) return null;
  const dims = ["visual", "listen", "production"];
  const min = Math.min(...dims.map(d => skills[d] || 0));
  const which = dims.find(d => (skills[d] || 0) === min);
  return { dim: which, score: min };
};

// ─── Graph builders ───────────────────────────────────────────────────────────
function buildPhraseGraph(data) {
  const phrData = data?.phr || {};
  const ids = PHRASES.filter(p => isLearned(data, p[0])).map(p => p[0]);
  const idxOf = {};
  const nodes = ids.map((id, i) => {
    const p = PHRASES.find(x => x[0] === id);
    idxOf[id] = i;
    const angle = (i / ids.length) * Math.PI * 2;
    return {
      id, kind: "phrase",
      jp: p[1], romaji: p[2], en: p[3], cat: p[4],
      box: phrData[id]?.box || 0,
      next: phrData[id]?.next || 0,
      // Initial position — small random ring around centre to prevent NaN explosions
      x: 500 + Math.cos(angle) * 80 + (Math.random() - 0.5) * 40,
      y: 500 + Math.sin(angle) * 80 + (Math.random() - 0.5) * 40,
      vx: 0, vy: 0,
    };
  });

  // Index segments → which phrases use them (deduped per phrase)
  const segUsage = {};
  for (const id of ids) {
    const segs = PHRASE_BREAKDOWNS[id] || [];
    const seen = new Set();
    for (const seg of segs) {
      const jp = seg[0];
      if (!jp || jp.length === 0 || jp === "..." || jp === "/") continue;
      if (TRIVIAL_SEGMENTS.has(jp)) continue;
      if (seen.has(jp)) continue;
      seen.add(jp);
      (segUsage[jp] ||= []).push(id);
    }
  }

  // Edges: pairs sharing a segment used in 2..6 phrases
  const seenPair = new Set();
  const edges = [];
  for (const jp of Object.keys(segUsage)) {
    const list = segUsage[jp];
    if (list.length < 2 || list.length > 6) continue;
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const k = list[i] < list[j] ? list[i] + "|" + list[j] : list[j] + "|" + list[i];
        if (seenPair.has(k)) continue;
        seenPair.add(k);
        edges.push({ a: idxOf[list[i]], b: idxOf[list[j]], target: 130, via: jp });
      }
    }
  }

  return { nodes, edges, idxOf };
}

function buildBlockGraph(data) {
  const ids = PHRASES.filter(p => isLearned(data, p[0])).map(p => p[0]);
  const phrData = data?.phr || {};

  // Aggregate segments across learned phrases
  const segMap = {}; // jp → { meaning, type, romaji, phraseIds: Set }
  for (const id of ids) {
    const segs = PHRASE_BREAKDOWNS[id] || [];
    for (const seg of segs) {
      const [jp, romaji, meaning, type] = seg;
      if (!jp || jp === "..." || jp === "/") continue;
      const k = jp;
      if (!segMap[k]) segMap[k] = { jp, romaji, meaning, type: type || "noun", phraseIds: new Set() };
      segMap[k].phraseIds.add(id);
    }
  }

  // Keep only segments used in at least 2 learned phrases
  const segs = Object.values(segMap).filter(s => s.phraseIds.size >= 2);
  const idxOf = {};
  const nodes = segs.map((s, i) => {
    idxOf[s.jp] = i;
    const angle = (i / segs.length) * Math.PI * 2;
    const phraseList = [...s.phraseIds];
    const avgBox = phraseList.reduce((sum, pid) => sum + (phrData[pid]?.box || 0), 0) / phraseList.length;
    return {
      id: s.jp, kind: "block",
      jp: s.jp, romaji: s.romaji, meaning: s.meaning, type: s.type,
      usage: phraseList.length,
      avgBox,
      phraseIds: phraseList,
      x: 500 + Math.cos(angle) * 100 + (Math.random() - 0.5) * 40,
      y: 500 + Math.sin(angle) * 100 + (Math.random() - 0.5) * 40,
      vx: 0, vy: 0,
    };
  });

  // Co-occurrence edges: two segments that appear together in any phrase
  const seenPair = new Set();
  const edges = [];
  for (const id of ids) {
    const ssegs = (PHRASE_BREAKDOWNS[id] || [])
      .map(seg => seg[0])
      .filter(jp => idxOf[jp] !== undefined);
    const uniq = [...new Set(ssegs)];
    for (let i = 0; i < uniq.length; i++) {
      for (let j = i + 1; j < uniq.length; j++) {
        const k = uniq[i] < uniq[j] ? uniq[i] + "|" + uniq[j] : uniq[j] + "|" + uniq[i];
        if (seenPair.has(k)) continue;
        seenPair.add(k);
        edges.push({ a: idxOf[uniq[i]], b: idxOf[uniq[j]], target: 110 });
      }
    }
  }

  return { nodes, edges, idxOf };
}

// ─── Scoped CSS (inject once) ─────────────────────────────────────────────────
function ensureWebStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("web-graph-styles")) return;
  const s = document.createElement("style");
  s.id = "web-graph-styles";
  s.textContent = `
    @keyframes webPulse { 0%,100% { opacity:.55; transform:scale(1); } 50% { opacity:.85; transform:scale(1.08); } }
    @keyframes webDashFlow { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -20; } }
    .web-due-ring { animation: webPulse 1.6s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
    .web-edge-focus { stroke-dasharray: 6 4; animation: webDashFlow 1s linear infinite; }
    .web-svg { touch-action: none; user-select: none; }
    .web-node { cursor: pointer; transition: opacity .25s ease, filter .25s ease; }
    .web-node-text { pointer-events: none; user-select: none; }
    .web-edge { transition: opacity .25s ease, stroke-width .2s ease; }
    .web-mode-btn[aria-pressed="true"] { color: #fff; }
  `;
  document.head.appendChild(s);
}

// ─── Pan + zoom hook ──────────────────────────────────────────────────────────
function usePanZoom(svgRef, onInteract) {
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [k, setK] = useState(1);
  const dragStateRef = useRef(null);

  const startBgPan = (clientX, clientY) => {
    dragStateRef.current = { kind: "bg", startX: clientX, startY: clientY, startTx: tx, startTy: ty };
  };
  const move = (clientX, clientY) => {
    const s = dragStateRef.current;
    if (!s || s.kind !== "bg") return;
    setTx(s.startTx + (clientX - s.startX));
    setTy(s.startTy + (clientY - s.startY));
    onInteract?.();
  };
  const end = () => { dragStateRef.current = null; };

  const onWheel = (e) => {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const dk = -e.deltaY * 0.0015;
    const newK = Math.max(0.4, Math.min(4, k * (1 + dk)));
    // Anchor zoom at cursor: world point (gx, gy) under cursor stays under cursor.
    const gx = (mx - tx) / k;
    const gy = (my - ty) / k;
    setTx(mx - gx * newK);
    setTy(my - gy * newK);
    setK(newK);
    onInteract?.();
  };

  return { tx, ty, k, setTx, setTy, setK, startBgPan, move, end, onWheel };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Web({ data, c, btn, isDesktop, theme }) {
  ensureWebStyles();

  const svgRef = useRef(null);
  const [size, setSize] = useState({ w: 1000, h: 700 });
  const [mode, setMode] = useState("phrase"); // "phrase" | "block"
  const [focusId, setFocusId] = useState(null);

  useEffect(() => { track("web_open"); }, []);

  // Track host element size for full-bleed canvas
  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ w: Math.max(320, r.width), h: Math.max(400, r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Build graph for the current mode. We rebuild when phr data or mode changes.
  // Memo keyed on a phr-snapshot so adding a learned phrase refreshes the graph.
  const phrKey = useMemo(() => {
    const phrData = data?.phr || {};
    return Object.keys(phrData).sort().map(k => k + ":" + (phrData[k]?.box || 0)).join(",");
  }, [data?.phr]);

  const graph = useMemo(() => {
    return mode === "phrase" ? buildPhraseGraph(data) : buildBlockGraph(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, phrKey]);

  // The physics hook mutates nodes in place. Re-seed when graph identity changes.
  const nodesRef = useRef([]);
  useEffect(() => { nodesRef.current = graph.nodes; }, [graph]);

  const { tick, wake, pin, unpin } = usePhysics({
    nodes: graph.nodes,
    edges: graph.edges,
    width: size.w,
    height: size.h,
    enabled: true,
  });

  // Pan/zoom
  const panZoom = usePanZoom(svgRef, wake);

  // Drag-node state (separate from bg pan)
  const dragNodeRef = useRef(null);

  const onPointerDown = (e) => {
    e.preventDefault();
    const target = e.target.closest("[data-node-idx]");
    if (target) {
      const idx = Number(target.getAttribute("data-node-idx"));
      const rect = svgRef.current.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const gx = (sx - panZoom.tx) / panZoom.k;
      const gy = (sy - panZoom.ty) / panZoom.k;
      dragNodeRef.current = { idx, ox: graph.nodes[idx].x - gx, oy: graph.nodes[idx].y - gy };
      pin(idx, gx + dragNodeRef.current.ox, gy + dragNodeRef.current.oy);
    } else {
      panZoom.startBgPan(e.clientX, e.clientY);
    }
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (dragNodeRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const gx = (sx - panZoom.tx) / panZoom.k;
      const gy = (sy - panZoom.ty) / panZoom.k;
      pin(dragNodeRef.current.idx, gx + dragNodeRef.current.ox, gy + dragNodeRef.current.oy);
      return;
    }
    panZoom.move(e.clientX, e.clientY);
  };

  const onPointerUp = () => {
    if (dragNodeRef.current) {
      // Stay pinned for a moment after release? Decision: instantly unpin so the
      // physics absorbs the position and the graph keeps breathing. Feels more alive.
      unpin(dragNodeRef.current.idx);
      dragNodeRef.current = null;
    }
    panZoom.end();
  };

  const onClickNode = (e) => {
    // Click only fires when no drag happened (browser convention)
    const t = e.target.closest("[data-node-idx]");
    if (!t) {
      // Background click clears focus
      setFocusId(null);
      return;
    }
    const idx = Number(t.getAttribute("data-node-idx"));
    const node = graph.nodes[idx];
    setFocusId(node.id);
    track("web_node_click", { mode, id: node.id });
    wake();
  };

  // Esc closes focus
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setFocusId(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Connection adjacency for focus highlighting
  const connectedIdxs = useMemo(() => {
    if (!focusId) return null;
    const idx = graph.idxOf[focusId];
    if (idx === undefined) return null;
    const set = new Set([idx]);
    for (const e of graph.edges) {
      if (e.a === idx) set.add(e.b);
      if (e.b === idx) set.add(e.a);
    }
    return set;
  }, [focusId, graph]);

  const focusedNode = focusId ? graph.nodes.find(n => n.id === focusId) : null;

  // ─── Empty state ───
  if (graph.nodes.length === 0) {
    return (
      <div style={{
        position: "fixed",
        top: 0, left: isDesktop ? 240 : 0, right: 0, bottom: isDesktop ? 0 : 70,
        background: c.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24, color: c.tx,
      }}>
        <div style={{ textAlign: "center", maxWidth: 380 }}>
          <div style={{
            fontFamily: fontJa, fontSize: T.huge, color: c.tx,
            opacity: .25, marginBottom: 16, fontWeight: 700,
          }}>日本語</div>
          <div style={{ fontSize: T.md, fontWeight: 700, marginBottom: 6 }}>Nothing to map yet</div>
          <div style={{ fontSize: T.sm, color: c.m, lineHeight: 1.5 }}>
            Learn a few phrases first — once you have a handful, this canvas will show how their building blocks weave together.
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ───
  return (
    <div style={{
      position: "fixed",
      top: 0, left: isDesktop ? 240 : 0, right: 0, bottom: isDesktop ? 0 : 70,
      background: `radial-gradient(circle at 50% 38%, ${c.s2} 0%, ${c.bg} 70%)`,
      overflow: "hidden",
      color: c.tx,
    }}>
      {/* Floating header — sits over the canvas, doesn't constrain it */}
      <div style={{
        position: "absolute", top: 16, left: 20, right: 20, zIndex: 2,
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        pointerEvents: "none",
      }}>
        <div style={{ pointerEvents: "auto" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <h1 style={{
              fontFamily: fontJa, fontSize: isDesktop ? T.xxl : T.xl, fontWeight: 700,
              margin: 0, letterSpacing: "-.02em", color: c.tx,
              textShadow: "0 2px 14px " + c.bg,
            }}>{mode === "phrase" ? "フレーズ" : "ぶひん"}</h1>
            <span style={{
              fontSize: T.xs, fontFamily: mono, color: c.m,
              textShadow: "0 1px 6px " + c.bg,
            }}>
              {graph.nodes.length} nodes · {graph.edges.length} links
            </span>
          </div>
        </div>

        {/* Mode toggle */}
        <div role="tablist" style={{
          marginLeft: "auto", pointerEvents: "auto",
          display: "inline-flex", padding: 4, borderRadius: 12,
          background: c.s + "cc", border: "1px solid " + c.b,
          backdropFilter: "blur(8px)",
        }}>
          {[
            { id: "phrase", label: "Phrases" },
            { id: "block",  label: "Blocks"  },
          ].map(m => {
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => { setMode(m.id); setFocusId(null); track("web_view_change", { from: mode, to: m.id }); }}
                aria-pressed={active}
                className="ts-btn web-mode-btn"
                style={{
                  ...btn, padding: "7px 16px", borderRadius: 9,
                  background: active ? c.a : "transparent",
                  color: active ? "#fff" : c.m,
                  border: "none", fontSize: T.sm, fontWeight: 600,
                  cursor: "pointer",
                }}
              >{m.label}</button>
            );
          })}
        </div>

        {focusId && (
          <button
            onClick={() => setFocusId(null)}
            style={{
              pointerEvents: "auto",
              padding: "6px 12px", borderRadius: 9,
              background: c.s + "cc", border: "1px solid " + c.b, color: c.m,
              fontSize: T.xs, cursor: "pointer", backdropFilter: "blur(8px)",
              display: "inline-flex", alignItems: "center", gap: 5,
            }}><IconX size={11}/> clear</button>
        )}
      </div>

      {/* Hint strip — fades out as user interacts */}
      <div style={{
        position: "absolute", bottom: 16, left: 20, zIndex: 2,
        fontSize: T.xs, color: c.m, fontFamily: mono,
        textShadow: "0 1px 6px " + c.bg,
        opacity: focusId ? 0 : .6, transition: "opacity .25s",
        pointerEvents: "none",
      }}>
        drag · scroll to zoom · tap a node
      </div>

      {/* Full-bleed SVG */}
      <svg
        ref={svgRef}
        width="100%" height="100%"
        className="web-svg"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={onClickNode}
        onWheel={panZoom.onWheel}
        data-tick={tick}
      >
        <g transform={`translate(${panZoom.tx}, ${panZoom.ty}) scale(${panZoom.k})`}>
          {/* Edges */}
          {graph.edges.map((e, i) => {
            const a = graph.nodes[e.a];
            const b = graph.nodes[e.b];
            if (!a || !b) return null;
            const isFocusEdge = connectedIdxs && (connectedIdxs.has(e.a) && connectedIdxs.has(e.b)) && (e.a === graph.idxOf[focusId] || e.b === graph.idxOf[focusId]);
            const dim = focusId && !isFocusEdge;
            return (
              <line
                key={i}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                className={"web-edge" + (isFocusEdge ? " web-edge-focus" : "")}
                stroke={isFocusEdge ? c.a : c.b}
                strokeWidth={isFocusEdge ? 2 : 1}
                opacity={dim ? 0.06 : isFocusEdge ? 0.95 : 0.22}
              />
            );
          })}

          {/* Nodes */}
          {graph.nodes.map((n, i) => {
            const isFocus = focusId === n.id;
            const isConnected = connectedIdxs && connectedIdxs.has(i);
            const dim = focusId && !isConnected;

            if (n.kind === "phrase") {
              const col = CAT_COLORS[n.cat] || c.a;
              const fillAlpha = alphaForBox(n.box);
              const r = isFocus ? 26 : 20;
              const isDue = n.next && n.next < Date.now();
              return (
                <g
                  key={n.id}
                  data-node-idx={i}
                  className="web-node"
                  style={{ opacity: dim ? 0.18 : 1, filter: isFocus ? "drop-shadow(0 0 12px " + col + ")" : "none" }}
                >
                  {isDue && (
                    <circle className="web-due-ring"
                      cx={n.x} cy={n.y} r={r + 6}
                      fill="none" stroke={c.go} strokeWidth={1.5} opacity={.6} />
                  )}
                  <circle cx={n.x} cy={n.y} r={r}
                    fill={col + fillAlpha}
                    stroke={col}
                    strokeWidth={isFocus ? 3 : 1.5}
                  />
                  {/* JP text inside node — opacity ramps in at higher zoom */}
                  <text
                    x={n.x} y={n.y + 4}
                    textAnchor="middle"
                    className="web-node-text"
                    fontFamily={fontJa}
                    fontSize={isFocus ? 14 : 11}
                    fill={n.box >= 3 ? "#fff" : c.tx}
                    fontWeight={JP.weight}
                    opacity={isFocus ? 1 : Math.min(1, Math.max(0, (panZoom.k - 0.9) * 1.5))}
                  >
                    {n.jp.length > 5 ? n.jp.slice(0, 5) + "…" : n.jp}
                  </text>
                </g>
              );
            }

            // Block node
            const tcol = GRAMMAR_COLORS[n.type] || c.m;
            const fillAlpha = alphaForBox(n.avgBox);
            const r = isFocus ? 8 + 5 * Math.sqrt(n.usage) : 6 + 4 * Math.sqrt(n.usage);
            return (
              <g
                key={n.id}
                data-node-idx={i}
                className="web-node"
                style={{ opacity: dim ? 0.18 : 1, filter: isFocus ? "drop-shadow(0 0 14px " + tcol + ")" : "none" }}
              >
                <circle cx={n.x} cy={n.y} r={r}
                  fill={tcol + fillAlpha}
                  stroke={tcol}
                  strokeWidth={isFocus ? 3 : 1.5}
                />
                <text
                  x={n.x} y={n.y + 4}
                  textAnchor="middle"
                  className="web-node-text"
                  fontFamily={fontJa}
                  fontSize={isFocus ? 14 : Math.min(13, 8 + Math.sqrt(n.usage))}
                  fill="#fff"
                  fontWeight={JP.weight}
                >
                  {n.jp.length > 4 ? n.jp.slice(0, 3) + "…" : n.jp}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Detail panel */}
      {focusedNode && (
        <DetailPanel
          node={focusedNode}
          data={data}
          c={c} btn={btn} isDesktop={isDesktop}
          mode={mode}
          allNodes={graph.nodes}
          edges={graph.edges}
          idxOf={graph.idxOf}
          onClose={() => setFocusId(null)}
          onJumpTo={(id) => setFocusId(id)}
        />
      )}
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────
function DetailPanel({ node, data, c, btn, isDesktop, mode, allNodes, edges, idxOf, onClose, onJumpTo }) {
  const phrInfo = mode === "phrase" ? data?.phr?.[node.id] : null;
  const skills = mode === "phrase" ? data?.skills?.[node.id] : null;
  const weak = weakestSkill(skills);
  const skillLabels = { visual: "reading", listen: "listening", production: "speaking" };

  // Build "shares with" / "used in" list
  const related = useMemo(() => {
    if (mode === "phrase") {
      const myIdx = idxOf[node.id];
      const out = [];
      for (const e of edges) {
        if (e.a !== myIdx && e.b !== myIdx) continue;
        const otherIdx = e.a === myIdx ? e.b : e.a;
        const other = allNodes[otherIdx];
        if (other) out.push({ id: other.id, jp: other.jp, en: other.en, via: e.via });
      }
      return out.slice(0, 8);
    }
    // Block view: list phrases that contain this segment
    return (node.phraseIds || []).map(pid => {
      const p = PHRASES.find(x => x[0] === pid);
      return p ? { id: pid, jp: p[1], en: p[3] } : null;
    }).filter(Boolean).slice(0, 8);
  }, [mode, node, allNodes, edges, idxOf]);

  return (
    <div className="ts-reveal" style={{
      position: "absolute",
      bottom: 16, right: 16,
      left: isDesktop ? "auto" : 16,
      maxWidth: isDesktop ? 360 : "auto",
      background: c.s + "ee",
      backdropFilter: "blur(12px)",
      border: "1px solid " + c.b,
      borderRadius: 12,
      padding: "14px 16px",
      boxShadow: "0 12px 40px rgba(0,0,0,.45)",
      zIndex: 3,
      maxHeight: isDesktop ? "70vh" : "55vh",
      overflowY: "auto",
    }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: fontJa, fontSize: isDesktop ? T.xl : T.lg,
            fontWeight: JP.weight, color: c.tx, lineHeight: JP.lineHeight,
          }}>{node.jp}</div>
          {node.romaji && (
            <div style={{ fontFamily: mono, fontSize: T.xs, color: c.ro, marginTop: 3 }}>{node.romaji}</div>
          )}
          <div style={{ fontSize: T.sm, color: c.m, marginTop: 5, lineHeight: 1.4 }}>
            {mode === "phrase" ? node.en : (node.meaning || "—")}
          </div>
        </div>
        {mode === "phrase" && (
          <button
            onClick={(e) => { e.stopPropagation(); speakPhraseWithEnglish(node.id, node.jp, node.en); }}
            aria-label="Hear it"
            style={{
              ...btn, padding: "6px 11px", borderRadius: 8,
              background: c.s2, border: "1px solid " + c.b, color: c.tx, flexShrink: 0,
            }}><IconPlay size={14}/></button>
        )}
        {mode === "block" && (
          <button
            onClick={(e) => { e.stopPropagation(); speak(node.jp); }}
            aria-label="Hear it"
            style={{
              ...btn, padding: "6px 11px", borderRadius: 8,
              background: c.s2, border: "1px solid " + c.b, color: c.tx, flexShrink: 0,
            }}><IconPlay size={14}/></button>
        )}
        <button onClick={(e) => { e.stopPropagation(); onClose(); }}
          aria-label="Close"
          style={{
            ...btn, padding: "6px 9px", borderRadius: 8,
            background: "transparent", border: "1px solid " + c.b, color: c.m, flexShrink: 0,
          }}><IconX size={12}/></button>
      </div>

      {/* SRS state row */}
      {mode === "phrase" && phrInfo && (
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 6,
          padding: "8px 0",
          borderTop: "1px solid " + c.b,
          borderBottom: "1px solid " + c.b,
          marginBottom: 10,
        }}>
          <Pill label={`box ${phrInfo.box || 0}`} color={c.go} c={c} />
          <Pill label={`last ${fmtRelative(phrInfo.lastReview)}`} color={c.m} c={c} />
          <Pill label={`next ${fmtRelative(phrInfo.next)}`} color={(phrInfo.next || 0) < Date.now() ? c.a : c.g} c={c} />
          {weak && weak.score < 3 && (
            <Pill label={`weak: ${skillLabels[weak.dim]}`} color={c.a} c={c} />
          )}
        </div>
      )}

      {mode === "block" && (
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 6,
          padding: "8px 0",
          borderTop: "1px solid " + c.b,
          borderBottom: "1px solid " + c.b,
          marginBottom: 10,
        }}>
          <Pill label={node.type} color={GRAMMAR_COLORS[node.type] || c.m} c={c} />
          <Pill label={`${node.usage} phrases`} color={c.go} c={c} />
          <Pill label={`avg box ${node.avgBox.toFixed(1)}`} color={c.g} c={c} />
        </div>
      )}

      {/* Related list */}
      {related.length > 0 && (
        <div>
          <div style={{
            fontSize: T.xs, fontFamily: mono, color: c.m,
            textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6,
          }}>{mode === "phrase" ? "shares with" : "used in"}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {related.map((r, i) => (
              <button
                key={r.id + i}
                onClick={(e) => { e.stopPropagation(); onJumpTo(r.id); }}
                style={{
                  ...btn, padding: "6px 9px", borderRadius: 8,
                  background: "transparent", border: "1px solid " + c.b,
                  color: c.tx, textAlign: "left", cursor: "pointer",
                  display: "flex", alignItems: "baseline", gap: 8, justifyContent: "space-between",
                }}>
                <span style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                  <span style={{
                    fontFamily: fontJa, fontSize: T.sm, fontWeight: JP.weight,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{r.jp}</span>
                  <span style={{
                    fontSize: T.xs, color: c.m,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{r.en}</span>
                </span>
                {r.via && (
                  <span style={{
                    fontFamily: fontJa, fontSize: T.xs, color: c.a,
                    background: c.a + "18", padding: "1px 6px", borderRadius: 4, flexShrink: 0,
                  }}>{r.via}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Pill({ label, color, c }) {
  return (
    <span style={{
      fontSize: T.xs, fontFamily: mono,
      padding: "3px 8px", borderRadius: 999,
      background: color + "1c",
      border: "1px solid " + color + "44",
      color, letterSpacing: ".02em",
    }}>{label}</span>
  );
}
