import { sfxr } from "jsfxr";

// ═══ GAME AUDIO SYSTEM ═══
// Primary: ElevenLabs-generated MP3 files (high quality)
// Fallback: jsfxr-generated 8-bit sounds (instant, no network)
// Playback: Web Audio API for reliability

let _initialized = false;
let _muted = false;
let _sfxVolume = 0.25;    // ElevenLabs MP3s are loud — keep this low
let _musicVolume = 0.15;
let _ambientVolume = 0.12;
let _ctx = null;
let _masterGain = null;
let _musicGain = null;
let _ambientGain = null;
let _musicSource = null;
const _ambientSources = {};  // name → BufferSourceNode
const _buffers = {};
let _wantsMusic = false;     // set true when game starts, so music plays once loaded

// ═══ SOUND NAMES ═══
const SFX_NAMES = [
  "slash1", "slash2", "slash3", "kill", "clash", "deflect",
  "jump", "land", "dash", "wallSlide", "footstep",
  "shuriken", "slowmoOn", "slowmoOff", "roomClear",
  "comboMilestone", "menuStart", "death",
  "enemy_alert", "enemy_attack",
];

const AMBIENT_NAMES = ["rain_loop", "forest_loop"];
const MUSIC_NAMES = ["bgm_ambient"];

// ═══ JSFXR FALLBACK DEFINITIONS ═══
const JSFXR_FALLBACK = {
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
};

// ═══ INITIALIZATION ═══
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

  _loadAllSounds();
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
  } catch { /* not available */ }
  return false;
}

async function _loadAllSounds() {
  let mp3 = 0, fallback = 0;

  // Load SFX — MP3 first, jsfxr fallback
  for (const name of SFX_NAMES) {
    if (await _loadMP3(name)) { mp3++; continue; }
    const def = JSFXR_FALLBACK[name];
    if (!def) continue;
    try {
      if (_ctx && typeof sfxr.toWebAudio === "function") {
        const s = sfxr.toWebAudio(def, _ctx);
        if (s?.buffer) { _buffers[name] = s.buffer; fallback++; continue; }
      }
      const a = sfxr.toAudio(def);
      if (a?.src) { _buffers[name] = a.src; fallback++; }
    } catch { /* skip */ }
  }
  console.log(`[audio] SFX: ${mp3} MP3, ${fallback} jsfxr`);

  // Load ambient loops
  for (const name of AMBIENT_NAMES) await _loadMP3(name);

  // Load music
  for (const name of MUSIC_NAMES) await _loadMP3(name);

  // Auto-start music + ambient if game already requested it
  if (_wantsMusic) {
    _startMusicNow();
    _startAmbientNow();
  }
}

// ═══ PLAY SOUND ═══
export function playSound(name, opts = {}) {
  if (_muted) return;
  const buf = _buffers[name];
  if (!buf) return;

  try {
    if (typeof buf === "object" && _ctx && _masterGain) {
      if (_ctx.state === "suspended") _ctx.resume();
      const source = _ctx.createBufferSource();
      source.buffer = buf;
      const gain = _ctx.createGain();
      gain.gain.value = Math.max(0, Math.min(1, (opts.volume ?? 1) * _sfxVolume));
      source.connect(gain);
      gain.connect(_masterGain);
      if (opts.playbackRate) source.playbackRate.value = opts.playbackRate;
      source.start(0);
    } else if (typeof buf === "string") {
      const audio = new Audio(buf);
      audio.volume = Math.max(0, Math.min(1, (opts.volume ?? 1) * _sfxVolume));
      if (opts.playbackRate) audio.playbackRate = opts.playbackRate;
      audio.play().catch(() => {});
    }
  } catch { /* never crash */ }
}

// ═══ MUSIC + AMBIENT ═══
function _startMusicNow() {
  if (!_ctx || !_musicGain || _musicSource) return;
  const buf = _buffers.bgm_ambient;
  if (!buf || typeof buf !== "object") return;
  try {
    _musicSource = _ctx.createBufferSource();
    _musicSource.buffer = buf;
    _musicSource.loop = true;
    _musicSource.connect(_musicGain);
    _musicSource.start(0);
    console.log("[audio] Music started");
  } catch { /* */ }
}

function _startAmbientNow() {
  if (!_ctx || !_ambientGain) return;
  for (const name of AMBIENT_NAMES) {
    if (_ambientSources[name]) continue;
    const buf = _buffers[name];
    if (!buf || typeof buf !== "object") continue;
    try {
      const source = _ctx.createBufferSource();
      source.buffer = buf;
      source.loop = true;
      source.connect(_ambientGain);
      source.start(0);
      _ambientSources[name] = source;
      console.log(`[audio] Ambient "${name}" started`);
    } catch { /* */ }
  }
}

export function startMusic() {
  _wantsMusic = true;
  _startMusicNow();
  _startAmbientNow();
}

export function stopMusic() {
  _wantsMusic = false;
  if (_musicSource) {
    try { _musicSource.stop(); } catch { /* */ }
    _musicSource = null;
  }
  for (const [name, source] of Object.entries(_ambientSources)) {
    try { source.stop(); } catch { /* */ }
    delete _ambientSources[name];
  }
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

export function setSfxVolume(v) { _sfxVolume = Math.max(0, Math.min(1, v)); }
export function setMusicVolume(v) {
  _musicVolume = Math.max(0, Math.min(1, v));
  if (_musicGain && !_muted) _musicGain.gain.value = _musicVolume;
}
