// "Stuck" queue — phrase ids the user missed in any retrieval surface.
//
// Persisted in localStorage so misses outlive the session. The smart-session
// builder reads this list (via retrieval.js re-export) and merges it into
// adaptive priority — flagged phrases get force-included in the next Learn
// session regardless of due date.
//
// Capped so a long session doesn't drown out due reviews.
//
// SRS write throttling (cooldown + session cap + box floor) used to live
// here but moved to src/utils/retrieval.js when the unified retrieval
// contract landed. This file is now stuck-list bookkeeping only.
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
