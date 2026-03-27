import { sfxr } from "jsfxr";

// ═══ GAME AUDIO SYSTEM ═══
// ElevenLabs MP3 primary → jsfxr fallback → Web Audio API playback
// Three independent audio buses: SFX, Music, Ambient
// Pauses automatically when tab is hidden.

let _initialized = false;
let _muted = false;
let _sfxVolume = 0.25;
let _musicVolume = 0.18;
let _ambientVolume = 0.10;
let _ctx = null;
let _masterGain = null;   // SFX bus
let _musicGain = null;    // Music bus
let _ambientGain = null;  // Ambient bus
let _musicSource = null;
const _ambientSources = {};
const _buffers = {};
let _wantsMusic = false;
let _currentMusic = "music_forest"; // per-environment music key

// ═══ SOUND REGISTRY ═══
const SFX_CRITICAL = [
  "swoosh1", "swoosh2", "swoosh3", "swoosh4", "swoosh5", "swoosh6",
  "shing", "slash3_electric", "hit_impact", "hit_impact2", "hit_impact3",
  "kill", "blood_splatter", "clash", "deflect", "backstab", "samurai_block",
  "jump", "land", "dash", "menuStart", "death",
  "wall_grab", "wall_launch",
];
const SFX_GAMEPLAY = [
  "wallSlide", "step1", "step2", "step3",
  "oni_alert", "oni_alert2", "oni_attack", "oni_attack2",
  "oni_death", "oni_death2", "oni_death3",
  "ninja_alert", "ninja_alert2", "ninja_throw", "ninja_throw2",
  "ninja_death", "ninja_death2", "ninja_death3",
  "samurai_alert", "samurai_alert2", "samurai_attack", "samurai_attack2",
  "samurai_death", "samurai_death2", "samurai_death3",
  "shuriken", "slowmoOn", "slowmoOff", "roomClear", "comboMilestone",
  // Keep old slash sounds as backup
  "slash1", "slash2", "slash3",
];
const SFX_STORY = [
  "sfx_choice_appear", "sfx_choice_select", "sfx_choice_tick",
  "sfx_text_advance", "sfx_combo4_pierce",
  "crate_break", "pot_break", "lantern_break", "bamboo_break",
  "death_dramatic", "brush_wipe", "wave_incoming", "encounter", "text_type",
];
const SFX_NAMES = [...SFX_CRITICAL, ...SFX_GAMEPLAY, ...SFX_STORY];
const AMBIENT_NAMES = ["rain_loop", "forest_night"];
const MUSIC_NAMES = ["music_forest", "music_temple", "music_boss", "music_story_calm", "music_story_tension"];

// Sound variant groups — playRandom picks one at random
const VARIANTS = {
  step:           ["step1", "step2", "step3"],
  swoosh:         ["swoosh1", "swoosh2", "swoosh3", "swoosh4", "swoosh5", "swoosh6"],
  hit:            ["hit_impact", "hit_impact2", "hit_impact3"],
  oni_alert:      ["oni_alert", "oni_alert2"],
  oni_attack:     ["oni_attack", "oni_attack2"],
  oni_death:      ["oni_death", "oni_death2", "oni_death3"],
  ninja_alert:    ["ninja_alert", "ninja_alert2"],
  ninja_throw:    ["ninja_throw", "ninja_throw2"],
  ninja_death:    ["ninja_death", "ninja_death2", "ninja_death3"],
  samurai_alert:  ["samurai_alert", "samurai_alert2"],
  samurai_attack: ["samurai_attack", "samurai_attack2"],
  samurai_death:  ["samurai_death", "samurai_death2", "samurai_death3"],
};

// Track active "exclusive" sounds so new slash cancels old one
const _exclusive = {}; // channel → { source, gain }

// ═══ JSFXR FALLBACKS (only for core sounds — enemies/ambient have no fallback) ═══
const JSFXR = {
  slash1: { oldParams: true, wave_type: 1, p_env_sustain: 0.05, p_env_punch: 0.4, p_env_decay: 0.15, p_base_freq: 0.35, p_freq_ramp: -0.25, p_duty: 0.6, p_duty_ramp: -0.1, p_lpf_freq: 1, p_hpf_freq: 0.15, sound_vol: 0.3, sample_rate: 44100, sample_size: 8 },
  slash2: { oldParams: true, wave_type: 1, p_env_sustain: 0.06, p_env_punch: 0.5, p_env_decay: 0.18, p_base_freq: 0.42, p_freq_ramp: -0.3, p_arp_mod: 0.15, p_arp_speed: 0.5, p_duty: 0.5, p_duty_ramp: -0.15, p_lpf_freq: 1, p_hpf_freq: 0.1, sound_vol: 0.35, sample_rate: 44100, sample_size: 8 },
  slash3: { oldParams: true, wave_type: 0, p_env_sustain: 0.12, p_env_punch: 0.7, p_env_decay: 0.28, p_base_freq: 0.5, p_freq_ramp: -0.15, p_vib_strength: 0.15, p_vib_speed: 0.4, p_arp_mod: -0.2, p_arp_speed: 0.7, p_duty: 0.4, p_duty_ramp: 0.1, p_repeat_speed: 0.45, p_lpf_freq: 0.8, p_lpf_resonance: 0.3, p_hpf_freq: 0.05, sound_vol: 0.4, sample_rate: 44100, sample_size: 8 },
  kill: { oldParams: true, wave_type: 3, p_env_sustain: 0.08, p_env_punch: 0.6, p_env_decay: 0.25, p_base_freq: 0.15, p_freq_ramp: -0.1, p_lpf_freq: 0.6, p_lpf_ramp: -0.2, p_lpf_resonance: 0.4, sound_vol: 0.4, sample_rate: 44100, sample_size: 8 },
  death: { oldParams: true, wave_type: 3, p_env_sustain: 0.2, p_env_punch: 0.3, p_env_decay: 0.4, p_base_freq: 0.3, p_freq_ramp: -0.25, p_vib_strength: 0.2, p_vib_speed: 0.3, p_lpf_freq: 0.5, p_lpf_ramp: -0.3, p_lpf_resonance: 0.5, sound_vol: 0.35, sample_rate: 44100, sample_size: 8 },
  dash: { oldParams: true, wave_type: 3, p_env_sustain: 0.04, p_env_punch: 0.3, p_env_decay: 0.12, p_base_freq: 0.4, p_freq_ramp: 0.35, p_lpf_freq: 0.8, p_lpf_ramp: 0.2, p_hpf_freq: 0.3, p_hpf_ramp: 0.1, sound_vol: 0.25, sample_rate: 44100, sample_size: 8 },
  jump: { oldParams: true, wave_type: 0, p_env_sustain: 0.05, p_env_punch: 0.2, p_env_decay: 0.1, p_base_freq: 0.28, p_freq_ramp: 0.2, p_duty: 0.5, p_lpf_freq: 1, p_hpf_freq: 0.2, sound_vol: 0.2, sample_rate: 44100, sample_size: 8 },
  land: { oldParams: true, wave_type: 3, p_env_sustain: 0.03, p_env_punch: 0.4, p_env_decay: 0.08, p_base_freq: 0.12, p_freq_ramp: -0.15, p_lpf_freq: 0.4, sound_vol: 0.2, sample_rate: 44100, sample_size: 8 },
  deflect: { oldParams: true, wave_type: 0, p_env_sustain: 0.04, p_env_punch: 0.5, p_env_decay: 0.2, p_base_freq: 0.55, p_freq_ramp: 0.1, p_vib_strength: 0.1, p_vib_speed: 0.5, p_arp_mod: 0.3, p_arp_speed: 0.6, p_duty: 0.5, p_lpf_freq: 1, p_lpf_resonance: 0.2, p_hpf_freq: 0.2, sound_vol: 0.3, sample_rate: 44100, sample_size: 8 },
  clash: { oldParams: true, wave_type: 1, p_env_sustain: 0.1, p_env_punch: 0.8, p_env_decay: 0.35, p_base_freq: 0.5, p_freq_ramp: -0.05, p_vib_strength: 0.2, p_vib_speed: 0.6, p_arp_mod: 0.4, p_arp_speed: 0.5, p_duty: 0.3, p_duty_ramp: 0.1, p_repeat_speed: 0.3, p_pha_offset: 0.1, p_lpf_freq: 0.9, p_lpf_resonance: 0.3, p_hpf_freq: 0.1, sound_vol: 0.4, sample_rate: 44100, sample_size: 8 },
  roomClear: { oldParams: true, wave_type: 0, p_env_sustain: 0.15, p_env_punch: 0.3, p_env_decay: 0.4, p_base_freq: 0.4, p_freq_ramp: 0.2, p_vib_strength: 0.05, p_vib_speed: 0.3, p_arp_mod: 0.15, p_arp_speed: 0.4, p_duty: 0.5, p_repeat_speed: 0.5, p_lpf_freq: 1, p_hpf_freq: 0.1, sound_vol: 0.3, sample_rate: 44100, sample_size: 8 },
  shuriken: { oldParams: true, wave_type: 1, p_env_sustain: 0.1, p_env_punch: 0.2, p_env_decay: 0.15, p_base_freq: 0.6, p_freq_ramp: -0.1, p_vib_strength: 0.3, p_vib_speed: 0.8, p_duty: 0.2, p_duty_ramp: 0.1, p_repeat_speed: 0.6, p_lpf_freq: 0.7, p_hpf_freq: 0.3, sound_vol: 0.2, sample_rate: 44100, sample_size: 8 },
  slowmoOn: { oldParams: true, wave_type: 0, p_env_attack: 0.05, p_env_sustain: 0.15, p_env_decay: 0.2, p_base_freq: 0.5, p_freq_ramp: -0.3, p_duty: 0.5, p_lpf_freq: 0.6, p_lpf_ramp: -0.2, p_lpf_resonance: 0.2, sound_vol: 0.2, sample_rate: 44100, sample_size: 8 },
  slowmoOff: { oldParams: true, wave_type: 0, p_env_sustain: 0.1, p_env_punch: 0.2, p_env_decay: 0.15, p_base_freq: 0.3, p_freq_ramp: 0.35, p_duty: 0.5, p_lpf_freq: 0.7, p_lpf_ramp: 0.2, p_hpf_freq: 0.1, sound_vol: 0.2, sample_rate: 44100, sample_size: 8 },
  comboMilestone: { oldParams: true, wave_type: 0, p_env_sustain: 0.06, p_env_punch: 0.5, p_env_decay: 0.25, p_base_freq: 0.65, p_freq_ramp: 0.1, p_arp_mod: 0.25, p_arp_speed: 0.5, p_duty: 0.5, p_repeat_speed: 0.4, p_lpf_freq: 1, p_hpf_freq: 0.2, sound_vol: 0.3, sample_rate: 44100, sample_size: 8 },
  menuStart: { oldParams: true, wave_type: 1, p_env_sustain: 0.15, p_env_punch: 0.6, p_env_decay: 0.35, p_base_freq: 0.25, p_freq_ramp: -0.05, p_vib_strength: 0.1, p_vib_speed: 0.2, p_arp_mod: 0.2, p_arp_speed: 0.6, p_duty: 0.5, p_lpf_freq: 0.8, p_lpf_resonance: 0.2, sound_vol: 0.35, sample_rate: 44100, sample_size: 8 },
  wallSlide: { oldParams: true, wave_type: 3, p_env_attack: 0.05, p_env_sustain: 0.2, p_env_decay: 0.1, p_base_freq: 0.08, p_freq_ramp: 0.02, p_vib_strength: 0.15, p_vib_speed: 0.6, p_repeat_speed: 0.7, p_lpf_freq: 0.3, p_lpf_resonance: 0.4, p_hpf_freq: 0.05, sound_vol: 0.12, sample_rate: 44100, sample_size: 8 },
  footstep: { oldParams: true, wave_type: 3, p_env_sustain: 0.01, p_env_punch: 0.3, p_env_decay: 0.04, p_base_freq: 0.08, p_freq_ramp: -0.1, p_lpf_freq: 0.4, p_hpf_freq: 0.1, sound_vol: 0.08, sample_rate: 44100, sample_size: 8 },
  // Story UI sounds — soft clicks and tones for dialogue
  sfx_text_advance: { oldParams: true, wave_type: 0, p_env_sustain: 0.02, p_env_punch: 0.15, p_env_decay: 0.06, p_base_freq: 0.55, p_freq_ramp: 0.1, p_duty: 0.5, p_lpf_freq: 0.7, p_hpf_freq: 0.3, sound_vol: 0.12, sample_rate: 44100, sample_size: 8 },
  sfx_choice_appear: { oldParams: true, wave_type: 0, p_env_sustain: 0.04, p_env_punch: 0.2, p_env_decay: 0.12, p_base_freq: 0.45, p_freq_ramp: 0.15, p_arp_mod: 0.1, p_arp_speed: 0.5, p_duty: 0.5, p_lpf_freq: 0.8, p_hpf_freq: 0.2, sound_vol: 0.15, sample_rate: 44100, sample_size: 8 },
  sfx_choice_select: { oldParams: true, wave_type: 0, p_env_sustain: 0.03, p_env_punch: 0.25, p_env_decay: 0.1, p_base_freq: 0.5, p_freq_ramp: 0.2, p_duty: 0.5, p_lpf_freq: 0.9, p_hpf_freq: 0.2, sound_vol: 0.18, sample_rate: 44100, sample_size: 8 },
  sfx_choice_tick: { oldParams: true, wave_type: 0, p_env_sustain: 0.01, p_env_punch: 0.1, p_env_decay: 0.03, p_base_freq: 0.7, p_duty: 0.5, p_lpf_freq: 0.5, p_hpf_freq: 0.4, sound_vol: 0.08, sample_rate: 44100, sample_size: 8 },
  // Stealth sounds
  detection_suspicious: { oldParams: true, wave_type: 0, p_env_sustain: 0.08, p_env_punch: 0.2, p_env_decay: 0.15, p_base_freq: 0.4, p_freq_ramp: 0.15, p_duty: 0.5, p_lpf_freq: 0.6, p_hpf_freq: 0.2, sound_vol: 0.15, sample_rate: 44100, sample_size: 8 },
  detection_alert: { oldParams: true, wave_type: 1, p_env_sustain: 0.06, p_env_punch: 0.5, p_env_decay: 0.2, p_base_freq: 0.55, p_freq_ramp: 0.2, p_arp_mod: 0.2, p_arp_speed: 0.5, p_duty: 0.5, p_lpf_freq: 0.9, p_hpf_freq: 0.15, sound_vol: 0.25, sample_rate: 44100, sample_size: 8 },
  stealth_kill: { oldParams: true, wave_type: 3, p_env_sustain: 0.04, p_env_punch: 0.3, p_env_decay: 0.12, p_base_freq: 0.2, p_freq_ramp: -0.15, p_lpf_freq: 0.4, p_lpf_ramp: -0.2, sound_vol: 0.2, sample_rate: 44100, sample_size: 8 },
};

// ═══ INIT ═══
export function initAudio() {
  if (_initialized) return;
  _initialized = true;
  _muted = localStorage.getItem("nihongo-game-muted") === "true";

  try {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (_ctx.state === "suspended") _ctx.resume();
    _masterGain = _ctx.createGain();
    _masterGain.gain.value = _muted ? 0 : 1;
    _masterGain.connect(_ctx.destination);
    _musicGain = _ctx.createGain();
    _musicGain.gain.value = _muted ? 0 : _musicVolume;
    _musicGain.connect(_ctx.destination);
    _ambientGain = _ctx.createGain();
    _ambientGain.gain.value = _muted ? 0 : _ambientVolume;
    _ambientGain.connect(_ctx.destination);
  } catch (e) {
    console.warn("[audio] No AudioContext:", e);
    _ctx = null;
  }

  // Pause audio when tab is hidden, resume when visible
  document.addEventListener("visibilitychange", () => {
    if (!_ctx) return;
    if (document.hidden) {
      _ctx.suspend();
    } else {
      _ctx.resume();
    }
  });

  return _loadAllSounds(); // returns promise — game can await this
}

async function _loadMP3(name) {
  if (!_ctx) return false;
  try {
    const res = await fetch(`/audio/game/${name}.mp3`);
    if (res.ok) {
      const ab = await res.arrayBuffer();
      _buffers[name] = await _ctx.decodeAudioData(ab);
      return true;
    }
  } catch { /* */ }
  return false;
}

// Load a batch of MP3s in PARALLEL (much faster than sequential)
async function _loadBatchParallel(names) {
  const results = await Promise.allSettled(names.map(n => _loadMP3(n)));
  let mp3 = 0;
  for (let i = 0; i < names.length; i++) {
    if (results[i].status === "fulfilled" && results[i].value) { mp3++; continue; }
    // Fallback to jsfxr for failed loads
    const def = JSFXR[names[i]];
    if (!def) continue;
    try {
      if (_ctx && typeof sfxr.toWebAudio === "function") {
        const s = sfxr.toWebAudio(def, _ctx);
        if (s?.buffer) { _buffers[names[i]] = s.buffer; continue; }
      }
    } catch { /* */ }
  }
  return mp3;
}

async function _loadAllSounds() {
  // All SFX + music + ambient loaded in parallel — much faster than sequential
  const allNames = [...SFX_NAMES, ...MUSIC_NAMES, ...AMBIENT_NAMES];
  const mp3 = await _loadBatchParallel(allNames);
  console.log(`[audio] Loaded ${mp3}/${allNames.length} MP3s`);
  if (_wantsMusic) { _startMusicNow(); _startAmbientNow(); }
}

// ═══ PLAY SFX ═══
export function playSound(name, opts = {}) {
  if (_muted) return;
  const buf = _buffers[name];
  if (!buf) return;
  try {
    if (typeof buf === "object" && _ctx && _masterGain) {
      if (_ctx.state === "suspended") _ctx.resume();
      const src = _ctx.createBufferSource();
      src.buffer = buf;
      const g = _ctx.createGain();
      g.gain.value = Math.max(0, Math.min(1, (opts.volume ?? 1) * _sfxVolume));
      src.connect(g);
      g.connect(_masterGain);
      if (opts.playbackRate) src.playbackRate.value = opts.playbackRate;
      src.start(0);
    } else if (typeof buf === "string") {
      const a = new Audio(buf);
      a.volume = Math.max(0, Math.min(1, (opts.volume ?? 1) * _sfxVolume));
      if (opts.playbackRate) a.playbackRate = opts.playbackRate;
      a.play().catch(() => {});
    }
  } catch { /* */ }
}

// Play a random variant from a group
export function playRandom(group, opts = {}) {
  const variants = VARIANTS[group];
  if (!variants) { playSound(group, opts); return; }
  const name = variants[Math.floor(Math.random() * variants.length)];
  playSound(name, opts);
}

// Play on an exclusive channel — stops previous sound on that channel first
// Use for slashes so new swing immediately cancels previous swing sound
export function playExclusive(channel, name, opts = {}) {
  if (_muted) return;
  // Stop previous sound on this channel
  const prev = _exclusive[channel];
  if (prev) {
    try { prev.gain.gain.linearRampToValueAtTime(0, _ctx.currentTime + 0.03); } catch { /* */ }
    try { prev.source.stop(_ctx.currentTime + 0.04); } catch { /* */ }
  }
  const buf = _buffers[name];
  if (!buf || typeof buf !== "object" || !_ctx || !_masterGain) {
    playSound(name, opts);
    return;
  }
  try {
    if (_ctx.state === "suspended") _ctx.resume();
    const src = _ctx.createBufferSource();
    src.buffer = buf;
    const g = _ctx.createGain();
    g.gain.value = Math.max(0, Math.min(1, (opts.volume ?? 1) * _sfxVolume));
    src.connect(g);
    g.connect(_masterGain);
    if (opts.playbackRate) src.playbackRate.value = opts.playbackRate;
    src.start(0);
    _exclusive[channel] = { source: src, gain: g };
    src.onended = () => { if (_exclusive[channel]?.source === src) delete _exclusive[channel]; };
  } catch { /* */ }
}

// Play random on exclusive channel
export function playRandomExclusive(channel, group, opts = {}) {
  const variants = VARIANTS[group];
  const name = variants ? variants[Math.floor(Math.random() * variants.length)] : group;
  playExclusive(channel, name, opts);
}

// Returns true once all critical + music/ambient are loaded
export function isAudioReady() {
  // Check at least a few critical sounds + music loaded
  return !!_buffers.swoosh1 && !!_buffers.jump && (!!_buffers.music_forest || !_ctx);
}

// ═══ MUSIC + AMBIENT ═══
function _startMusicNow() {
  if (!_ctx || !_musicGain || _musicSource) return;
  const buf = _buffers[_currentMusic];
  if (!buf || typeof buf !== "object") return;
  try {
    _musicSource = _ctx.createBufferSource();
    _musicSource.buffer = buf;
    _musicSource.loop = true;
    _musicSource.connect(_musicGain);
    _musicSource.start(0);
  } catch { /* */ }
}

let _currentTheme = "forest"; // track which ambient set to play

function _startAmbientNow() {
  if (!_ctx || !_ambientGain) return;
  // Indoor themes (dojo) don't get rain
  const ambientForTheme = _currentTheme === "dojo" ? [] : AMBIENT_NAMES;
  for (const name of ambientForTheme) {
    if (_ambientSources[name]) continue;
    const buf = _buffers[name];
    if (!buf || typeof buf !== "object") continue;
    try {
      const src = _ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.connect(_ambientGain);
      src.start(0);
      _ambientSources[name] = src;
    } catch { /* */ }
  }
}

// Set the ambient theme (controls which ambient loops play)
export function setAmbientTheme(theme) {
  if (theme === _currentTheme) return;
  _currentTheme = theme;
  // Stop all current ambient
  for (const [k, s] of Object.entries(_ambientSources)) {
    try { s.stop(); } catch { /* */ }
    delete _ambientSources[k];
  }
  // Restart with new theme filter
  if (_wantsMusic) _startAmbientNow();
}

export function startMusic() {
  _wantsMusic = true;
  _startMusicNow();
  _startAmbientNow();
}

// Start music with a gradual fade-in (avoids jarring blast after story screens)
export function startMusicFadeIn(fadeSecs = 1.5) {
  _wantsMusic = true;
  if (_musicGain && _ctx) {
    _musicGain.gain.setValueAtTime(0, _ctx.currentTime);
    _startMusicNow();
    _startAmbientNow();
    try {
      _musicGain.gain.linearRampToValueAtTime(_muted ? 0 : _musicVolume, _ctx.currentTime + fadeSecs);
    } catch { /* fallback: already started */ }
  } else {
    _startMusicNow();
    _startAmbientNow();
  }
}

export function stopMusic() {
  _wantsMusic = false;
  try { _musicSource?.stop(); } catch { /* */ }
  _musicSource = null;
  for (const [k, s] of Object.entries(_ambientSources)) {
    try { s.stop(); } catch { /* */ }
    delete _ambientSources[k];
  }
}

// Switch music for different environments (call when entering new biome)
export function setMusic(key) {
  if (key === _currentMusic && _musicSource) return;
  _currentMusic = key;
  if (_wantsMusic && _musicSource) {
    try { _musicSource.stop(); } catch { /* */ }
    _musicSource = null;
    _startMusicNow();
  }
}

// Crossfade from current music to a new track (smooth transition for story ↔ combat)
let _crossfadeTimeout = null;
export function crossfadeMusic(toKey, duration = 1.0) {
  if (!_ctx || !_musicGain) return;
  // Cancel any in-progress crossfade to prevent race conditions
  if (_crossfadeTimeout) { clearTimeout(_crossfadeTimeout); _crossfadeTimeout = null; }
  // Fade out current music
  try {
    _musicGain.gain.cancelScheduledValues(_ctx.currentTime);
    _musicGain.gain.setValueAtTime(_musicGain.gain.value, _ctx.currentTime);
    _musicGain.gain.linearRampToValueAtTime(0, _ctx.currentTime + duration);
  } catch { /* */ }
  // After fade out, switch track and fade in
  _crossfadeTimeout = setTimeout(() => {
    _crossfadeTimeout = null;
    try { _musicSource?.stop(); } catch { /* */ }
    _musicSource = null;
    _currentMusic = toKey;
    _wantsMusic = true;
    if (_musicGain) _musicGain.gain.setValueAtTime(0, _ctx.currentTime);
    _startMusicNow();
    try {
      _musicGain.gain.linearRampToValueAtTime(_muted ? 0 : _musicVolume, _ctx.currentTime + duration);
    } catch { /* */ }
  }, duration * 1000);
}

// ═══ CONTROLS ═══
export function toggleMute() {
  _muted = !_muted;
  localStorage.setItem("nihongo-game-muted", _muted);
  if (_masterGain) _masterGain.gain.value = _muted ? 0 : 1;
  if (_musicGain) _musicGain.gain.value = _muted ? 0 : _musicVolume;
  if (_ambientGain) _ambientGain.gain.value = _muted ? 0 : _ambientVolume;
  return _muted;
}

export function isMuted() {
  if (!_initialized) return localStorage.getItem("nihongo-game-muted") === "true";
  return _muted;
}

// ═══ VOICE BLIPS (Undertale/Animal Crossing style character mumble voices) ═══
// Each character has a distinct pitch range and waveform for personality
const VOICE_CONFIG = {
  sensei:  { freqBase: 165, freqRange: 40, type: 'sine',     dur: 0.075, vol: 0.18, detune: 5 },   // deep, warm
  player:  { freqBase: 290, freqRange: 60, type: 'square',   dur: 0.05,  vol: 0.14, detune: 8 },   // bright, youthful
  shadow:  { freqBase: 110, freqRange: 30, type: 'sawtooth', dur: 0.085, vol: 0.16, detune: 12 },  // dark, menacing
  elder:   { freqBase: 200, freqRange: 35, type: 'triangle', dur: 0.06,  vol: 0.15, detune: 4 },   // calm, wise
  system:  { freqBase: 440, freqRange: 20, type: 'sine',     dur: 0.035, vol: 0.08, detune: 0 },   // neutral beep
};
let _lastBlipTime = 0;

export function playVoiceBlip(speaker) {
  if (_muted || !_ctx || !_masterGain) return;
  const now = _ctx.currentTime;
  if (now - _lastBlipTime < 0.03) return; // rate-limit
  _lastBlipTime = now;
  const v = VOICE_CONFIG[speaker] || VOICE_CONFIG.system;
  try {
    if (_ctx.state === 'suspended') _ctx.resume();
    const osc = _ctx.createOscillator();
    const gain = _ctx.createGain();
    osc.type = v.type;
    // Randomize pitch within character's range for natural mumbling
    osc.frequency.value = v.freqBase + (Math.random() - 0.5) * v.freqRange;
    osc.detune.value = (Math.random() - 0.5) * v.detune;
    // Attack → sustain → decay envelope
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(v.vol, now + 0.005); // 5ms attack
    gain.gain.setValueAtTime(v.vol, now + v.dur * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + v.dur);
    osc.connect(gain);
    gain.connect(_masterGain);
    osc.start(now);
    osc.stop(now + v.dur + 0.01);
  } catch { /* */ }
}

export function setSfxVolume(v) { _sfxVolume = Math.max(0, Math.min(1, v)); }
export function setMusicVolume(v) {
  _musicVolume = Math.max(0, Math.min(1, v));
  if (_musicGain && !_muted) _musicGain.gain.value = _musicVolume;
}
