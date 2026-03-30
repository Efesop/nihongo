// ═══ GAME LOGGER ═══
// Structured logging with categories, levels, and color coding.
// Toggle categories on/off via console: gameLog.enable("combat"), gameLog.disable("audio")
// Show all: gameLog.all(true). Show none: gameLog.all(false).
// Log history accessible via gameLog.history (last 500 entries).

const CATEGORIES = {
  engine:  { color: "#4fc3f7", icon: "E" },  // game loop, physics, collisions
  combat:  { color: "#ef5350", icon: "X" },  // hits, kills, damage, combos
  audio:   { color: "#ab47bc", icon: "A" },  // music, sfx, ambient
  sprites: { color: "#66bb6a", icon: "S" },  // sprite loading, zones
  story:   { color: "#ffa726", icon: "T" },  // story scenes, dialogue
  input:   { color: "#78909c", icon: "I" },  // keyboard, touch, gamepad
  ai:      { color: "#ffca28", icon: "AI" }, // enemy AI, detection, state changes
  room:    { color: "#26c6da", icon: "R" },  // room loading, transitions, exits
  wall:    { color: "#8d6e63", icon: "W" },  // wall run, wall slide, backflip
  player:  { color: "#7e57c2", icon: "P" },  // player state, dash, jump
};

const _enabled = {};
const _history = [];
const MAX_HISTORY = 500;

// Default: only critical categories on in production
const DEFAULT_ON = ["engine", "audio", "room", "story"];
for (const cat of Object.keys(CATEGORIES)) {
  _enabled[cat] = DEFAULT_ON.includes(cat);
}

function _log(cat, level, ...args) {
  const entry = { t: performance.now(), cat, level, msg: args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ") };
  _history.push(entry);
  if (_history.length > MAX_HISTORY) _history.shift();

  if (!_enabled[cat]) return;

  const cfg = CATEGORIES[cat] || { color: "#999", icon: "?" };
  const prefix = `%c[${cfg.icon}]`;
  const style = `color:${cfg.color};font-weight:bold`;

  if (level === "warn") {
    console.warn(prefix, style, ...args);
  } else if (level === "error") {
    console.error(prefix, style, ...args);
  } else {
    console.log(prefix, style, ...args);
  }
}

// Public API — one function per category for clean usage
const log = {};
for (const cat of Object.keys(CATEGORIES)) {
  log[cat] = (...args) => _log(cat, "info", ...args);
  log[cat].warn = (...args) => _log(cat, "warn", ...args);
  log[cat].error = (...args) => _log(cat, "error", ...args);
}

// Control API (accessible via window.gameLog in browser console)
log.enable = (cat) => { _enabled[cat] = true; };
log.disable = (cat) => { _enabled[cat] = false; };
log.all = (on) => { for (const k of Object.keys(_enabled)) _enabled[k] = on; };
log.status = () => {
  const lines = Object.entries(_enabled).map(([k, v]) => `  ${v ? "ON " : "off"} ${k}`);
  console.log("gameLog categories:\n" + lines.join("\n"));
};
log.history = _history;
log.dump = (cat, n = 50) => {
  const filtered = cat ? _history.filter(e => e.cat === cat) : _history;
  const recent = filtered.slice(-n);
  console.table(recent.map(e => ({ time: (e.t / 1000).toFixed(2) + "s", cat: e.cat, level: e.level, msg: e.msg })));
};

// Expose on window for debug console access
if (typeof window !== "undefined") {
  window.gameLog = log;
}

export default log;
