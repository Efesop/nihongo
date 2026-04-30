// "Stuck" queue — phrase ids the user missed in Vocab Test.
//
// Vocab Test itself is telemetry-only (never writes FSRS / boxes), so misses
// would be lost signal otherwise. We persist them here in localStorage and
// the smart-session builder picks them up as adaptive priority — front of the
// queue, regardless of due-date — so the next Learn session works the gaps.
//
// Capped so a long Vocab Test session doesn't drown out due reviews.
const KEY = "vocab-stuck";
const CAP = 30;

const _read = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
  catch { return []; }
};

const _write = (arr) => {
  try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch {}
};

export const getStuck = () => _read();

export const addStuck = (id) => {
  if (!id) return;
  const arr = _read();
  // Move to front (most recent first), dedupe, cap.
  const next = [id, ...arr.filter(x => x !== id)].slice(0, CAP);
  _write(next);
};

export const removeStuck = (id) => {
  if (!id) return;
  const arr = _read();
  const next = arr.filter(x => x !== id);
  if (next.length !== arr.length) _write(next);
};

export const isStuck = (id) => _read().includes(id);

// ─── SRS write throttling ────────────────────────────────────────────────────
// Vocab Test self-judge can write to SRS — but only Misses, and only once per
// phrase per cooldown window. This stops a single grind session from
// collapsing the whole schedule (every phrase nuked to box 1) when the user
// just doesn't feel sharp that day. Recovery credits use the same cooldown.
const COOLDOWN_KEY = "vocab-srs-cooldown";
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
const SESSION_DEMOTE_CAP = 5;            // hard cap per fresh entry to Test

const _readMap = () => {
  try { return JSON.parse(localStorage.getItem(COOLDOWN_KEY) || "{}") || {}; }
  catch { return {}; }
};
const _writeMap = (m) => {
  try { localStorage.setItem(COOLDOWN_KEY, JSON.stringify(m)); } catch {}
};

// Returns true if it's been more than COOLDOWN_MS since the last SRS write
// from Vocab Test for this phrase id.
export const canTouchSrs = (id, now = Date.now()) => {
  const m = _readMap();
  const last = m[id] || 0;
  return (now - last) > COOLDOWN_MS;
};

export const stampTouch = (id, now = Date.now()) => {
  const m = _readMap();
  m[id] = now;
  _writeMap(m);
};

export const SESSION_DEMOTE_CAP_VALUE = SESSION_DEMOTE_CAP;
