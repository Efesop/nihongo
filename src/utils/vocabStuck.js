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
