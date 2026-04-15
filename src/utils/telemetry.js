// Lightweight telemetry: buffer events client-side, batch-flush to /api/telemetry.
// Call configureTelemetry({ getToken }) once at app boot.
// Then call track(event, payload) anywhere — debounced flush handles the rest.

let _getToken = null;
let _buffer = [];
let _flushTimer = null;
const FLUSH_DELAY_MS = 5000;
const MAX_BUFFER = 50;
const STORAGE_KEY = "ts_telemetry_pending";

// hydrate from localStorage on load (recover failed sends)
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) _buffer = JSON.parse(saved) || [];
} catch {}

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_buffer)); } catch {}
}

export function configureTelemetry({ getToken }) {
  _getToken = getToken;
  // try flush any pending events from previous session
  if (_buffer.length > 0) scheduleFlush(100);
}

export function track(event, payload = {}) {
  _buffer.push({ event, payload, ts: Date.now() });
  if (_buffer.length > MAX_BUFFER) _buffer = _buffer.slice(-MAX_BUFFER);
  persist();
  scheduleFlush();
}

function scheduleFlush(delay = FLUSH_DELAY_MS) {
  if (_flushTimer) clearTimeout(_flushTimer);
  _flushTimer = setTimeout(flush, delay);
}

export async function flush() {
  if (_flushTimer) { clearTimeout(_flushTimer); _flushTimer = null; }
  if (_buffer.length === 0 || !_getToken) return;
  const batch = _buffer.slice();
  try {
    const token = await _getToken();
    if (!token) return;
    const r = await fetch("/api/telemetry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ events: batch }),
    });
    if (r.ok) {
      // remove sent events from buffer
      _buffer = _buffer.slice(batch.length);
      persist();
    }
  } catch {
    // network failure — keep buffer, retry on next track()
  }
}

// flush on page hide / unload
if (typeof window !== "undefined") {
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
  window.addEventListener("beforeunload", () => {
    // sync best-effort via sendBeacon — token is async so just persist
    persist();
  });
}
