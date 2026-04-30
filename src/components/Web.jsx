import { useEffect, useMemo, useRef, useState } from "react";
import { PHRASES, CATS, CAT_COLORS } from "../data/phrases.js";
import { PHRASE_BREAKDOWNS } from "../data/phraseBreakdowns.js";
import { CONVERSATIONS } from "../data/conversations.js";
import { fontJa, mono, T, JP, GRAMMAR_COLORS } from "../data/constants.js";
import { speakPhraseWithEnglish, speak } from "../utils/audio.js";
import { track } from "../utils/telemetry.js";
import { IconPlay, IconX, IconRefresh } from "./Icons.jsx";
import PhraseSegments from "./PhraseSegments.jsx";
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

// ═══ Edge taxonomy ═══════════════════════════════════════════════════════════
// Each edge between phrases carries a `kind` (visual style + label colour) and
// a short `label` shown mid-edge when one of the endpoints is focused.
//
// Kinds:
//   shared    → they share a meaningful building block (e.g. ください)
//   template  → both end with the same verb / pattern segment
//   opposite  → curated antonym pair
//   answer    → curated question→answer pair
const EDGE_STYLE = {
  shared:   { color: "#5a9ec4", dash: "5 4" },     // muted blue, dashed
  template: { color: "#5ac48a", dash: "0" },       // green, solid
  opposite: { color: "#e8a838", dash: "0" },       // amber, solid (shorter spring)
  answer:   { color: "#c45a8b", dash: "3 3" },     // pink, dotted
  scene:    { color: "#9b8ecf", dash: "2 6" },     // soft violet, fine dotted
  family:   { color: "#5ac4b8", dash: "0" },       // teal, solid — topic/variant cluster
};

// Topic families — small clusters of phrases that belong together as
// variants/members of the same concept (greetings, days-of-week, time-of-day, etc).
// Every pair within a group gets a `family` edge.
const FAMILY_GROUPS = [
  ["g1", "g2", "g3", "g10"],         // hello / morning / evening / goodbye
  ["g13", "g17"],                    // hajimemashite + yoroshiku (the intro pair)
  ["g14", "g11", "g12"],             // what's your name? + I'm... variants
  ["g15", "g16"],                    // how are you? + I'm fine
  ["g18", "g19"],                    // where from? + I'm from...
  ["tm1", "tm2", "tm3"],             // today / tomorrow / yesterday
  ["tm8", "tm9", "tm4", "tm5"],      // morning / night / now / later
  ["d2", "d3", "d4"],                // right / left / straight
  ["dc1", "dc2"], ["dc3", "dc4"],    // big/small expensive/cheap (already opposites; family adds extra cohesion)
  ["s3", "s4"],                      // card / cash
  ["f8", "f9"],                      // 1 / 2 people
  ["e1", "e3"],                      // help / call police
];

// Manual antonym pairs. JP-only; expand as the dataset grows.
// Each pair links the two phrase ids with an "opposite" edge.
const ANTONYM_PAIRS = [
  ["dc1", "dc2"],   // おおきい (big)        ↔ ちいさい (small)
  ["dc3", "dc4"],   // たかい (expensive)    ↔ やすい (cheap)
  ["dc5", "dc6"],   // あつい (hot)          ↔ さむい (cold)
  ["dc7", "dc8"],   // とおい (far)          ↔ ちかい (close)
  ["dc9", "dc10"],  // あたらしい (new)      ↔ ふるい (old)
  ["d2",  "d3"],    // みぎ (right)          ↔ ひだり (left)
  ["g6",  "g7"],    // はい (yes)            ↔ いいえ (no)
  ["g1",  "g10"],   // こんにちは (hello)    ↔ さようなら (goodbye)
  ["g2",  "g3"],    // おはよう (morning)    ↔ こんばんは (evening)
  ["f5",  "f6"],    // いただきます (before) ↔ ごちそうさまでした (after)
  ["s3",  "s4"],    // カードで (card)       ↔ げんきんで (cash)
  ["tm1", "tm2"],   // きょう (today)        ↔ あした (tomorrow)
  ["tm2", "tm3"],   // あした (tomorrow)     ↔ きのう (yesterday)
  ["tm8", "tm9"],   // あさ (morning)        ↔ よる (night)
  ["f8",  "f9"],    // ひとりです (1 person) ↔ ふたりです (2 people)
];

// Curated question → answer mappings. Each question phrase id maps to the
// answer phrase ids it is naturally paired with. Edges are bidirectional in
// graph terms but the label always reads "question ↔ answer".
const QNA_PAIRS = [
  // どこですか → directional answers (every Q matches every direction)
  ["d1",  "d2"],    // ...はどこですか → みぎ
  ["d1",  "d3"],    // ...はどこですか → ひだり
  ["d1",  "d4"],    // ...はどこですか → まっすぐ
  ["d8",  "d2"],    // トイレはどこですか → みぎ
  ["d8",  "d3"],    // トイレはどこですか → ひだり
  ["d8",  "d4"],    // トイレはどこですか → まっすぐ
  ["t1",  "d2"],    // ...えきはどこですか → みぎ
  ["t1",  "d3"],    // ...えきはどこですか → ひだり
  ["t1",  "d4"],    // ...えきはどこですか → まっすぐ
  ["e2",  "d2"],    // びょういんはどこですか → みぎ
  ["e2",  "d3"],    // びょういんはどこですか → ひだり
  ["e2",  "d4"],    // びょういんはどこですか → まっすぐ
  // いくらですか → it costs ...
  ["s1",  "n11"],   // これはいくらですか → ひゃくえんです
  ["s1",  "n12"],   // これはいくらですか → せんえんです
  ["t2",  "n11"],
  ["t2",  "n12"],
  // なんじですか → time
  ["n13", "tm8"],   // なんじですか → あさ
  ["n13", "tm9"],   // なんじですか → よる
  ["n13", "tm4"],   // なんじですか → いま
  // yes/no questions
  ["e4",  "g6"],    // えいごをはなせますか → はい
  ["e4",  "g7"],    // えいごをはなせますか → いいえ
  ["d5",  "g6"],    // ちかいですか → はい
  ["d5",  "g7"],    // ちかいですか → いいえ
  ["d6",  "g6"],    // あるいていけますか → はい
  ["d6",  "g7"],    // あるいていけますか → いいえ
  ["s5",  "g6"],    // あたためますか → はい
  ["s5",  "g9"],    // あたためますか → だいじょうぶです
  // hotel: do you have a reservation? → I have a reservation
  ["h2",  "g6"],
  // intros — natural Q ↔ A flow
  ["g14", "g11"],   // what's your name? → my name is... (formal)
  ["g14", "g12"],   // what's your name? → I'm... (casual)
  ["g15", "g16"],   // how are you? → I'm fine
  ["g15", "g9"],    // how are you? → daijoubu desu (so-so / I'm fine, polite)
  ["g13", "g17"],   // hajimemashite ↔ yoroshiku onegaishimasu (set pair)
  ["g18", "g19"],   // where are you from? → I'm from England
  // day/time questions → answer hubs
  ["tm6", "tm1"],   // what day is it? → today (often answered with day name)
  ["tm6", "tm7"],   // what day is it? → Monday
];

// Family edges — pairs derived from FAMILY_GROUPS. Generated once; complete-graph
// within each group.
function buildFamilyEdges() {
  const out = [];
  for (const group of FAMILY_GROUPS) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        out.push({ a: group[i], b: group[j] });
      }
    }
  }
  return out;
}

// Find the longest matching trailing run of segments shared by two phrases.
// "Interesting" if joined kana ≥ 3 chars AND not a pure copula/particle tail.
// Returns { length, label } or null.
function sharedEnding(a, b) {
  const A = (PHRASE_BREAKDOWNS[a] || []).map(s => s[0]);
  const B = (PHRASE_BREAKDOWNS[b] || []).map(s => s[0]);
  let n = 0;
  while (n < A.length && n < B.length && A[A.length - 1 - n] === B[B.length - 1 - n]) n++;
  if (n === 0) return null;
  const tail = A.slice(A.length - n);
  const joined = tail.join("");
  if (joined.length < 3) return null;
  // If the entire ending is just trivial tokens (です / ですか / は / を / etc),
  // it's not a real template. Require at least one non-trivial segment in the run.
  if (tail.every(seg => TRIVIAL_SEGMENTS.has(seg))) return null;
  return { length: n, label: "～" + joined };
}

// Pair-wise template edges: phrases sharing a meaningful multi-segment ending.
// Replaces the old last-segment whitelist (which missed frames like ～はどこですか).
function findTemplateEdges(learnedIds) {
  const out = [];
  for (let i = 0; i < learnedIds.length; i++) {
    for (let j = i + 1; j < learnedIds.length; j++) {
      const r = sharedEnding(learnedIds[i], learnedIds[j]);
      if (!r) continue;
      out.push({ a: learnedIds[i], b: learnedIds[j], kind: "template", label: r.label });
    }
  }
  return out;
}

// Scene edges: pairs of phrases that co-appear in the same conversation
// scenario (CONVERSATIONS). One edge per shared conversation, labelled with
// that conversation's id. Reveals which phrases naturally cluster in
// real-life scenes (restaurant, conbini, asking directions, etc).
function buildScenePairs(learnedIds) {
  const ids = new Set(learnedIds);
  const pairs = [];
  const seen = new Set();
  for (const convo of CONVERSATIONS) {
    const used = new Set();
    for (const line of convo.lines) {
      if (!line.blank) continue;
      const candidates = [line.correctId, ...(line.alsoOkIds || [])];
      for (const id of candidates) if (ids.has(id)) used.add(id);
    }
    const arr = [...used];
    if (arr.length < 2 || arr.length > 6) continue;
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const k = arr[i] < arr[j] ? arr[i] + "|" + arr[j] : arr[j] + "|" + arr[i];
        const sceneKey = k + "|" + convo.id;
        if (seen.has(sceneKey)) continue;
        seen.add(sceneKey);
        pairs.push({ a: arr[i], b: arr[j], label: convo.id });
      }
    }
  }
  return pairs;
}

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

  // Edges from multiple typed sources (deduped, with kind + label).
  // Use a Set keyed on "a|b|kind" so the same pair can carry several reasons.
  const seenKey = new Set();
  const edges = [];
  const pushEdge = (idA, idB, kind, label, target) => {
    if (idxOf[idA] === undefined || idxOf[idB] === undefined) return;
    const lo = idA < idB ? idA : idB;
    const hi = idA < idB ? idB : idA;
    const k = lo + "|" + hi + "|" + kind;
    if (seenKey.has(k)) return;
    seenKey.add(k);
    edges.push({
      a: idxOf[lo], b: idxOf[hi], kind, label, target,
    });
  };

  // 1) Shared building-block edges
  for (const jp of Object.keys(segUsage)) {
    const list = segUsage[jp];
    if (list.length < 2 || list.length > 6) continue;
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        pushEdge(list[i], list[j], "shared", jp, 140);
      }
    }
  }

  // 2) Same-template edges (matching verb endings)
  const learnedSet = new Set(ids);
  for (const e of findTemplateEdges(ids).filter(e => learnedSet.has(e.a) && learnedSet.has(e.b))) {
    pushEdge(e.a, e.b, "template", e.label, 110);
  }

  // 3) Antonym edges (curated)
  for (const [a, b] of ANTONYM_PAIRS) {
    if (!learnedSet.has(a) || !learnedSet.has(b)) continue;
    pushEdge(a, b, "opposite", "opposite", 80);
  }

  // 4) Question ↔ answer edges (curated)
  for (const [q, a] of QNA_PAIRS) {
    if (!learnedSet.has(q) || !learnedSet.has(a)) continue;
    pushEdge(q, a, "answer", "Q ↔ A", 130);
  }

  // 5) Scene edges — pairs that co-appear in the same conversation
  for (const e of buildScenePairs(ids)) {
    pushEdge(e.a, e.b, "scene", e.label, 150);
  }

  // 6) Family edges — topic clusters (greetings, time-of-day, intros, etc)
  for (const e of buildFamilyEdges()) {
    if (!learnedSet.has(e.a) || !learnedSet.has(e.b)) continue;
    pushEdge(e.a, e.b, "family", "family", 100);
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

  // Hover state for node tooltips + grow-on-hover affordance
  const [hoverIdx, setHoverIdx] = useState(null);

  // ─── Background pan (svg-level pointer down on empty space) ───
  // We use window-level pointermove/up listeners (NOT setPointerCapture) so the
  // node click events still get delivered to their original SVG targets.
  const bgDragRef = useRef(null);

  useEffect(() => {
    const onWinMove = (e) => {
      if (bgDragRef.current) {
        const s = bgDragRef.current;
        panZoom.setTx(s.startTx + (e.clientX - s.startX));
        panZoom.setTy(s.startTy + (e.clientY - s.startY));
        wake();
      }
    };
    const onWinUp = () => { bgDragRef.current = null; };
    window.addEventListener("pointermove", onWinMove);
    window.addEventListener("pointerup", onWinUp);
    window.addEventListener("pointercancel", onWinUp);
    return () => {
      window.removeEventListener("pointermove", onWinMove);
      window.removeEventListener("pointerup", onWinUp);
      window.removeEventListener("pointercancel", onWinUp);
    };
  }, [panZoom, wake]);

  const onSvgPointerDown = (e) => {
    // Only start a bg pan when the press is on the SVG itself (not on a node).
    if (e.target.closest("[data-node-idx]")) return;
    bgDragRef.current = { startX: e.clientX, startY: e.clientY, startTx: panZoom.tx, startTy: panZoom.ty };
  };

  const onSvgClick = (e) => {
    // Background click → clear focus. Node clicks are handled per-node below.
    if (e.target.closest("[data-node-idx]")) return;
    setFocusId(null);
  };

  // ─── Per-node interaction ───
  // Each node g handles its own pointerdown for drag + click for focus. Click
  // is only fired when the pointer didn't move past a small threshold, so a
  // drag-then-release doesn't accidentally also trigger focus.
  const nodeDragRef = useRef(null);

  const onNodePointerDown = (e, idx) => {
    e.stopPropagation();
    const rect = svgRef.current.getBoundingClientRect();
    const startScreenX = e.clientX;
    const startScreenY = e.clientY;
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const gx = (sx - panZoom.tx) / panZoom.k;
    const gy = (sy - panZoom.ty) / panZoom.k;
    const node = graph.nodes[idx];
    if (!node) return;
    const ox = node.x - gx;
    const oy = node.y - gy;

    nodeDragRef.current = { idx, ox, oy, moved: false };

    const onMove = (ev) => {
      const mvx = ev.clientX - startScreenX;
      const mvy = ev.clientY - startScreenY;
      if (Math.abs(mvx) > 4 || Math.abs(mvy) > 4) nodeDragRef.current.moved = true;
      const nrect = svgRef.current.getBoundingClientRect();
      const nsx = ev.clientX - nrect.left;
      const nsy = ev.clientY - nrect.top;
      const ngx = (nsx - panZoom.tx) / panZoom.k;
      const ngy = (nsy - panZoom.ty) / panZoom.k;
      pin(idx, ngx + ox, ngy + oy);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      const moved = nodeDragRef.current?.moved;
      // Always release the pin so physics breathes again
      unpin(idx);
      // If pointer barely moved, treat as a click → focus the node
      if (!moved) {
        setFocusId(node.id);
        track("web_node_click", { mode, id: node.id });
      }
      nodeDragRef.current = null;
      wake();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
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
        onPointerDown={onSvgPointerDown}
        onClick={onSvgClick}
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
            const style = EDGE_STYLE[e.kind] || { color: c.b, dash: "0" };
            const strokeColor = isFocusEdge ? style.color : (e.kind && e.kind !== "shared" ? style.color : c.b);
            return (
              <line
                key={i}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                className={"web-edge" + (isFocusEdge ? " web-edge-focus" : "")}
                stroke={strokeColor}
                strokeWidth={isFocusEdge ? 2.5 : 1}
                strokeDasharray={isFocusEdge ? undefined : style.dash}
                opacity={dim ? 0.05 : isFocusEdge ? 0.95 : (e.kind === "shared" ? 0.18 : 0.45)}
              />
            );
          })}

          {/* Edge labels — only render for edges connected to the focused node,
              and only when zoomed in enough to read them. */}
          {focusId && graph.edges.map((e, i) => {
            const a = graph.nodes[e.a];
            const b = graph.nodes[e.b];
            if (!a || !b) return null;
            const isFocusEdge = (connectedIdxs.has(e.a) && connectedIdxs.has(e.b)) && (e.a === graph.idxOf[focusId] || e.b === graph.idxOf[focusId]);
            if (!isFocusEdge || !e.label) return null;
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            const style = EDGE_STYLE[e.kind] || { color: c.tx };
            return (
              <g key={"lbl-" + i} style={{ pointerEvents: "none" }}>
                <foreignObject x={mx - 70} y={my - 12} width={140} height={24}>
                  <div xmlns="http://www.w3.org/1999/xhtml" style={{
                    fontFamily: fontJa, fontSize: 13,
                    color: style.color, textAlign: "center",
                    background: c.bg + "ee", display: "inline-block",
                    padding: "1px 8px", borderRadius: 6,
                    border: "1px solid " + style.color + "55",
                    width: "fit-content", margin: "0 auto",
                    maxWidth: "100%",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>{e.label}</div>
                </foreignObject>
              </g>
            );
          })}

          {/* Nodes */}
          {graph.nodes.map((n, i) => {
            const isFocus = focusId === n.id;
            const isConnected = connectedIdxs && connectedIdxs.has(i);
            const dim = focusId && !isConnected;

            const isHover = hoverIdx === i;

            if (n.kind === "phrase") {
              const col = CAT_COLORS[n.cat] || c.a;
              const fillAlpha = alphaForBox(n.box);
              const baseR = 20;
              const r = isFocus ? 26 : isHover ? baseR + 3 : baseR;
              const isDue = n.next && n.next < Date.now();
              return (
                <g
                  key={n.id}
                  data-node-idx={i}
                  className="web-node"
                  onPointerDown={(e) => onNodePointerDown(e, i)}
                  onPointerEnter={() => setHoverIdx(i)}
                  onPointerLeave={() => setHoverIdx(prev => prev === i ? null : prev)}
                  style={{
                    opacity: dim ? 0.18 : 1,
                    filter: isFocus ? "drop-shadow(0 0 12px " + col + ")"
                          : isHover ? "drop-shadow(0 0 6px " + col + "aa)" : "none",
                    transition: "filter .15s",
                  }}
                >
                  {isDue && (
                    <circle className="web-due-ring"
                      cx={n.x} cy={n.y} r={r + 6}
                      fill="none" stroke={c.go} strokeWidth={1.5} opacity={.6} />
                  )}
                  <circle cx={n.x} cy={n.y} r={r}
                    fill={col + fillAlpha}
                    stroke={col}
                    strokeWidth={isFocus ? 3 : isHover ? 2.5 : 1.5}
                  />
                  {/* JP text inside node — visible on focus/hover, ramps in at higher zoom */}
                  <text
                    x={n.x} y={n.y + 4}
                    textAnchor="middle"
                    className="web-node-text"
                    fontFamily={fontJa}
                    fontSize={isFocus || isHover ? 14 : 11}
                    fill={n.box >= 3 ? "#fff" : c.tx}
                    fontWeight={JP.weight}
                    opacity={isFocus || isHover ? 1 : Math.min(1, Math.max(0, (panZoom.k - 0.9) * 1.5))}
                  >
                    {n.jp.length > 5 ? n.jp.slice(0, 5) + "…" : n.jp}
                  </text>
                </g>
              );
            }

            // Block node
            const tcol = GRAMMAR_COLORS[n.type] || c.m;
            const fillAlpha = alphaForBox(n.avgBox);
            const baseR = 6 + 4 * Math.sqrt(n.usage);
            const r = isFocus ? baseR + 4 : isHover ? baseR + 2 : baseR;
            return (
              <g
                key={n.id}
                data-node-idx={i}
                className="web-node"
                onPointerDown={(e) => onNodePointerDown(e, i)}
                onPointerEnter={() => setHoverIdx(i)}
                onPointerLeave={() => setHoverIdx(prev => prev === i ? null : prev)}
                style={{
                  opacity: dim ? 0.18 : 1,
                  filter: isFocus ? "drop-shadow(0 0 14px " + tcol + ")"
                        : isHover ? "drop-shadow(0 0 8px " + tcol + "aa)" : "none",
                  transition: "filter .15s",
                }}
              >
                <circle cx={n.x} cy={n.y} r={r}
                  fill={tcol + fillAlpha}
                  stroke={tcol}
                  strokeWidth={isFocus ? 3 : isHover ? 2.5 : 1.5}
                />
                <text
                  x={n.x} y={n.y + 4}
                  textAnchor="middle"
                  className="web-node-text"
                  fontFamily={fontJa}
                  fontSize={isFocus || isHover ? 14 : Math.min(13, 8 + Math.sqrt(n.usage))}
                  fill="#fff"
                  fontWeight={JP.weight}
                >
                  {n.jp.length > 4 ? n.jp.slice(0, 3) + "…" : n.jp}
                </text>
              </g>
            );
          })}

          {/* Hover tooltip — drawn on top */}
          {hoverIdx !== null && graph.nodes[hoverIdx] && !focusId && (() => {
            const n = graph.nodes[hoverIdx];
            const label = n.kind === "phrase" ? n.jp : n.jp;
            const sub = n.kind === "phrase" ? n.en : (n.meaning || "");
            const tipX = n.x;
            const tipY = n.y - (n.kind === "phrase" ? 32 : 18);
            return (
              <g style={{ pointerEvents: "none" }}>
                <foreignObject x={tipX - 110} y={tipY - 50} width={220} height={50}>
                  <div xmlns="http://www.w3.org/1999/xhtml" style={{
                    fontFamily: fontJa, fontSize: 12,
                    background: c.s + "ee", border: "1px solid " + c.b,
                    borderRadius: 8, padding: "5px 9px",
                    color: c.tx, textAlign: "center",
                    backdropFilter: "blur(8px)",
                    boxShadow: "0 4px 14px rgba(0,0,0,.4)",
                  }}>
                    <div style={{ fontWeight: 600 }}>{label}</div>
                    {sub && <div style={{ fontSize: 10, color: c.m, marginTop: 1 }}>{sub}</div>}
                  </div>
                </foreignObject>
              </g>
            );
          })()}
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
const KIND_LABELS = {
  shared:   "Shares",
  template: "Same template",
  opposite: "Opposite",
  answer:   "Q ↔ A",
  scene:    "Same scene",
  family:   "Same topic",
};

// Small thumbnail using the existing per-phrase scene image asset.
// Hides itself if the file doesn't exist.
function PhraseThumb({ id, size = 56, c, style = {} }) {
  return (
    <img
      src={`/images/phrases/scenes/${id}.png`}
      alt=""
      loading="lazy"
      onError={(e) => { e.target.style.display = "none"; }}
      style={{
        width: size, height: size, borderRadius: 8,
        objectFit: "cover", flexShrink: 0,
        border: "1px solid " + c.b,
        background: c.s2,
        ...style,
      }}
    />
  );
}

function DetailPanel({ node, data, c, btn, isDesktop, mode, allNodes, edges, idxOf, onClose, onJumpTo }) {
  // SRS pills hidden per user request — Web tab is a connection-discovery surface,
  // not a study-state surface. Box / last review / next review live on the Learn
  // tab where they belong. Variables kept for future toggle.
  // const phrInfo = mode === "phrase" ? data?.phr?.[node.id] : null;
  // const skills = mode === "phrase" ? data?.skills?.[node.id] : null;
  // const weak = weakestSkill(skills);

  // Scroll the connection list back to the top whenever a new node gets focus,
  // otherwise the previous node's scroll position bleeds into the new context.
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [node.id]);

  // Group related phrases by edge `kind` so the panel can show distinct
  // "Same template", "Opposite", "Shares" sections instead of one flat list.
  const grouped = useMemo(() => {
    if (mode !== "phrase") {
      // Block view: list phrases that contain this segment
      return [{
        kind: "uses",
        items: (node.phraseIds || []).map(pid => {
          const p = PHRASES.find(x => x[0] === pid);
          return p ? { id: pid, jp: p[1], en: p[3] } : null;
        }).filter(Boolean).slice(0, 8),
      }];
    }
    const myIdx = idxOf[node.id];
    const buckets = {};
    for (const e of edges) {
      if (e.a !== myIdx && e.b !== myIdx) continue;
      const otherIdx = e.a === myIdx ? e.b : e.a;
      const other = allNodes[otherIdx];
      if (!other) continue;
      const kind = e.kind || "shared";
      (buckets[kind] ||= []).push({ id: other.id, jp: other.jp, en: other.en, label: e.label });
    }
    const order = ["opposite", "answer", "family", "template", "scene", "shared"];
    return order
      .filter(k => buckets[k] && buckets[k].length)
      .map(k => ({ kind: k, items: buckets[k].slice(0, 8) }));
  }, [mode, node, allNodes, edges, idxOf]);

  return (
    <div className="ts-reveal" style={{
      position: "absolute",
      bottom: 16, right: 16,
      left: isDesktop ? "auto" : 16,
      width: isDesktop ? 440 : "auto",
      background: c.s + "f2",
      backdropFilter: "blur(14px)",
      border: "1px solid " + c.b,
      borderRadius: 14,
      boxShadow: "0 16px 50px rgba(0,0,0,.55)",
      zIndex: 3,
      maxHeight: isDesktop ? "82vh" : "68vh",
      // overflow visible at root so PhraseSegments tooltips can escape the
      // panel bounds. Inner connection list scrolls instead — see below.
      overflow: "visible",
      display: "flex", flexDirection: "column",
    }}>
      {/* Big thumbnail hero — full-width banner at the top of the card */}
      {mode === "phrase" && (
        <div style={{
          position: "relative",
          borderTopLeftRadius: 14, borderTopRightRadius: 14,
          overflow: "hidden",
          height: isDesktop ? 180 : 140,
          background: c.s2,
        }}>
          <img
            src={`/images/phrases/scenes/${node.id}.png`}
            alt=""
            loading="lazy"
            onError={(e) => { e.target.style.display = "none"; }}
            style={{
              width: "100%", height: "100%", objectFit: "cover", display: "block",
            }}
          />
          {/* Soft fade at bottom so the JP hero below sits cleanly */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: `linear-gradient(to bottom, transparent 60%, ${c.s} 100%)`,
          }}/>
          {/* Close + play float over the image */}
          <button
            onClick={(e) => { e.stopPropagation(); speakPhraseWithEnglish(node.id, node.jp, node.en); }}
            aria-label="Hear it"
            style={{
              ...btn, position: "absolute", top: 10, right: 52,
              padding: "9px 13px", borderRadius: 10,
              background: c.a, color: "#fff", border: "none",
              fontSize: T.sm, fontWeight: 600, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}><IconPlay size={16}/></button>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }}
            aria-label="Close"
            style={{
              ...btn, position: "absolute", top: 10, right: 10,
              padding: "9px 10px", borderRadius: 10,
              background: c.s + "cc", border: "1px solid " + c.b, color: c.tx,
              cursor: "pointer", backdropFilter: "blur(6px)",
            }}><IconX size={14}/></button>
        </div>
      )}

      {/* Header text block */}
      <div style={{ padding: "14px 20px 10px", display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {mode === "phrase" ? (
            <PhraseSegments
              phraseId={node.id}
              c={c}
              fontSize={isDesktop ? T.xxl : T.xl}
              fontWeight={JP.weight}
            />
          ) : (
            <div style={{
              fontFamily: fontJa, fontSize: isDesktop ? T.xxl : T.xl,
              fontWeight: JP.weight, color: c.tx, lineHeight: JP.lineHeight,
            }}>{node.jp}</div>
          )}
          {node.romaji && (
            <div style={{ fontFamily: mono, fontSize: T.sm, color: c.ro, marginTop: 6 }}>{node.romaji}</div>
          )}
          <div style={{ fontSize: T.md, color: c.m2 || c.m, marginTop: 6, lineHeight: 1.4 }}>
            {mode === "phrase" ? node.en : (node.meaning || "—")}
          </div>
        </div>
        {/* In block mode there's no banner image, so play + close need to live here. */}
        {mode === "block" && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); speak(node.jp); }}
              aria-label="Hear it"
              style={{
                ...btn, padding: "10px 14px", borderRadius: 10,
                background: c.a, color: "#fff", border: "none", flexShrink: 0,
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: T.sm, fontWeight: 600, cursor: "pointer",
              }}><IconPlay size={16}/></button>
            <button onClick={(e) => { e.stopPropagation(); onClose(); }}
              aria-label="Close"
              style={{
                ...btn, padding: "10px 11px", borderRadius: 10,
                background: "transparent", border: "1px solid " + c.b, color: c.m,
                flexShrink: 0, cursor: "pointer",
              }}><IconX size={14}/></button>
          </>
        )}
      </div>

      {/* Block-mode meta pills — kept (they describe what the segment is) */}
      {mode === "block" && (
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 8,
          padding: "10px 20px 14px",
          borderBottom: "1px solid " + c.b,
        }}>
          <Pill label={node.type} color={GRAMMAR_COLORS[node.type] || c.m} c={c} />
          <Pill label={`${node.usage} phrases`} color={c.go} c={c} />
        </div>
      )}

      {/* Why connected? — grouped by edge kind. Inner scroll region so the
          panel root can keep `overflow: visible` (lets PhraseSegments tooltips
          escape the panel bounds). Scroll resets to top on focus change via
          scrollRef + useEffect on node.id. */}
      {grouped.length > 0 && (
        <div ref={scrollRef} style={{
          display: "flex", flexDirection: "column", gap: 14,
          overflowY: "auto", flex: 1, minHeight: 0,
          padding: "4px 20px 18px",
        }}>
          {grouped.map(({ kind, items }) => {
            const style = EDGE_STYLE[kind] || { color: c.a };
            const heading = mode === "phrase"
              ? (KIND_LABELS[kind] || "Related")
              : "Used in";
            return (
              <div key={kind}>
                <div style={{
                  fontSize: T.sm, fontFamily: mono, fontWeight: 700,
                  color: style.color, marginBottom: 8,
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}>
                  <span style={{
                    width: 10, height: 10, borderRadius: 999,
                    background: style.color, display: "inline-block",
                  }}/>
                  {heading.toUpperCase()}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {items.map((r, i) => (
                    <button
                      key={r.id + i}
                      onClick={(e) => { e.stopPropagation(); onJumpTo(r.id); }}
                      style={{
                        ...btn, padding: "8px 10px", borderRadius: 10,
                        background: "transparent",
                        border: "1px solid " + style.color + "44",
                        color: c.tx, textAlign: "left", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-start",
                      }}>
                      {mode === "phrase" && (
                        <PhraseThumb id={r.id} size={36} c={c} />
                      )}
                      <span style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                        <span style={{
                          fontFamily: fontJa, fontSize: isDesktop ? T.lg : T.md,
                          fontWeight: JP.weight, color: c.tx,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>{r.jp}</span>
                        <span style={{
                          fontSize: T.sm, color: c.m, marginTop: 2,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>{r.en}</span>
                      </span>
                      {r.label && r.label !== "opposite" && (
                        <span style={{
                          fontFamily: fontJa, fontSize: T.sm, color: style.color,
                          background: style.color + "1c", padding: "3px 8px",
                          borderRadius: 6, flexShrink: 0,
                        }}>{r.label}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {grouped.length === 0 && mode === "phrase" && (
        <div style={{ fontSize: T.sm, color: c.m, fontStyle: "italic", textAlign: "center", padding: "20px 24px 24px" }}>
          No connections found yet — learn related phrases (opposites, same template, similar topic) and they'll appear here.
        </div>
      )}
    </div>
  );
}

function Pill({ label, color, c }) {
  return (
    <span style={{
      fontSize: T.sm, fontFamily: mono, fontWeight: 600,
      padding: "5px 10px", borderRadius: 999,
      background: color + "20",
      border: "1px solid " + color + "55",
      color, letterSpacing: ".02em",
    }}>{label}</span>
  );
}
