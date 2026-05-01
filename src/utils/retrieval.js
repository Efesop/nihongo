// ═══ Unified retrieval contract ═══════════════════════════════════════════
//
// Every SRS-writing surface in the app (Learn / SmartSession, Vocab Test,
// PhraseBank, DailyDrill, Web tab quiz mode) routes its writes through
// `recordRetrieval`. Throttle policy, box-floor rule, session-cap, stuck-list
// add/remove, and telemetry all live in one place.
//
// `recordRetrieval` itself is React-free — App.jsx instantiates it via the
// makeRecordRetrieval factory which closes over the actual SRS writer
// (`reviewPhr`) and a phrase-box reader (`getPhrBox`). That keeps this module
// pure and testable.
//
// Surface policies (RETRIEVAL_POLICY) intentionally differ:
//   - `learn`      — no throttle, no caps. Authoritative practice surface.
//   - `vocab-test` — 2h cooldown / kind, box-≥-2 floor for demotes, session
//                    demote cap of 5. Self-judge bias + grind protection.
//   - `web-quiz`   — 4h cooldown, box-≥-1 floor, session demote cap of 3.
//                    Lowest-effort retrieval — strictest throttle.
//   - `phrasebank` — no throttle (real MCQ with timer + distractors).
//   - `drill`      — no throttle (Daily Drill is recall-from-EN, real signal).

import { track } from "./telemetry.js";
import { getStuck, addStuck, removeStuck, isStuck } from "./vocabStuck.js";

// Re-export stuck-list helpers so callers (sessionEngine, future surfaces)
// have one import point for everything retrieval-related.
export { getStuck, addStuck, removeStuck, isStuck };

export const RETRIEVAL_POLICY = {
  "learn":      { cooldownMs: 0,                demoteFloorBox: 0, sessionDemoteCap: Infinity, addStuckOnMiss: false },
  "vocab-test": { cooldownMs: 2 * 60 * 60 * 1000, demoteFloorBox: 2, sessionDemoteCap: 5,        addStuckOnMiss: true  },
  "web-quiz":   { cooldownMs: 4 * 60 * 60 * 1000, demoteFloorBox: 1, sessionDemoteCap: 3,        addStuckOnMiss: true  },
  "phrasebank": { cooldownMs: 0,                demoteFloorBox: 0, sessionDemoteCap: Infinity, addStuckOnMiss: false },
  "drill":      { cooldownMs: 0,                demoteFloorBox: 0, sessionDemoteCap: Infinity, addStuckOnMiss: false },
};

const COOLDOWN_KEY = "vocab-srs-cooldown"; // shape: { [id]: { demote?: ts, credit?: ts } }
const FALLBACK_POLICY = RETRIEVAL_POLICY["learn"];

// ─── Cooldown storage (shared across surfaces) ────────────────────────────
// Storage shape kept identical to the previous vocabStuck.js so existing
// users' cooldown state survives the migration with zero data loss.
const _readCooldownMap = () => {
  try { return JSON.parse(localStorage.getItem(COOLDOWN_KEY) || "{}") || {}; }
  catch { return {}; }
};
const _writeCooldownMap = (m) => {
  try { localStorage.setItem(COOLDOWN_KEY, JSON.stringify(m)); } catch {}
};

const _lastTouch = (id, kind) => {
  const m = _readCooldownMap();
  const entry = m[id];
  if (typeof entry === "number") return entry; // legacy flat shape
  return (entry && entry[kind]) || 0;
};

const _stampTouch = (id, kind, now) => {
  const m = _readCooldownMap();
  const cur = m[id];
  const next = (typeof cur === "number") ? { demote: cur } : { ...(cur || {}) };
  next[kind] = now;
  m[id] = next;
  _writeCooldownMap(m);
};

// ─── Factory ──────────────────────────────────────────────────────────────
// `sessionCounters` is a plain object the caller owns (typically a ref):
//   { demotes: { [surface]: number } }
// Reset semantics live with the caller — passing in a fresh object resets
// per-surface caps. App.jsx uses a useRef that resets on App mount, matching
// today's per-mount session-cap behaviour.
export function makeRecordRetrieval({ reviewPhr, getPhrBox, sessionCounters }) {
  if (!reviewPhr) throw new Error("makeRecordRetrieval: reviewPhr is required");
  if (!sessionCounters) sessionCounters = { demotes: {} };
  if (!sessionCounters.demotes) sessionCounters.demotes = {};

  return function recordRetrieval(id, correct, exerciseType, responseMs, surface, opts = {}) {
    const now = Date.now();
    const policy = RETRIEVAL_POLICY[surface] || FALLBACK_POLICY;
    const kind = correct ? "credit" : "demote";

    // ── Stuck-list bookkeeping (cheap signal, runs regardless of throttle) ──
    if (policy.addStuckOnMiss && !correct) addStuck(id);
    if (correct) removeStuck(id); // any correct answer trusts this phrase

    // ── Throttle: same-surface same-kind cooldown per phrase ──
    if (policy.cooldownMs > 0) {
      const last = _lastTouch(id, kind);
      if (now - last < policy.cooldownMs) {
        track("retrieval_attempt", { surface, exerciseType, correct, wrote: false, reason: "throttled", responseMs });
        return { wrote: false, reason: "throttled" };
      }
    }

    // ── Box floor: don't demote phrases that haven't been learned yet ──
    if (!correct && policy.demoteFloorBox > 0) {
      const box = (typeof getPhrBox === "function") ? (getPhrBox(id) || 0) : 0;
      if (box < policy.demoteFloorBox) {
        track("retrieval_attempt", { surface, exerciseType, correct, wrote: false, reason: "box-too-low", responseMs });
        return { wrote: false, reason: "box-too-low" };
      }
    }

    // ── Session cap: hard limit on demotes per session for this surface ──
    if (!correct && policy.sessionDemoteCap !== Infinity) {
      const used = sessionCounters.demotes[surface] || 0;
      if (used >= policy.sessionDemoteCap) {
        track("retrieval_attempt", { surface, exerciseType, correct, wrote: false, reason: "session-cap", responseMs });
        return { wrote: false, reason: "session-cap" };
      }
    }

    // ── All gates passed: write SRS, stamp cooldown, count session ──
    reviewPhr(id, correct, exerciseType, responseMs);
    if (policy.cooldownMs > 0) _stampTouch(id, kind, now);
    if (!correct) sessionCounters.demotes[surface] = (sessionCounters.demotes[surface] || 0) + 1;

    track("retrieval_attempt", { surface, exerciseType, correct, wrote: true, reason: "ok", responseMs });
    return { wrote: true, reason: "ok" };
  };
}
