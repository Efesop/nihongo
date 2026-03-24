import { sfxr } from "jsfxr";

// ═══ GAME AUDIO SYSTEM ═══
// Primary: ElevenLabs-generated MP3 files (high quality)
// Fallback: jsfxr-generated 8-bit sounds (instant, no network)
// Playback: Web Audio API for reliability

let _initialized = false;
let _muted = false;
let _sfxVolume = 0.5;
let _musicVolume = 0.3;
let _ctx = null;        // AudioContext
let _masterGain = null;  // Master gain node for SFX
let _musicGain = null;   // Separate gain for music
let _musicSource = null;  // Currently playing music
const _buffers = {};     // name → AudioBuffer

// ═══ SOUND NAMES ═══
const SFX_NAMES = [
  "slash1", "slash2", "slash3", "kill", "clash", "deflect",
  "jump", "land", "dash", "wallSlide", "footstep",
  "shuriken", "slowmoOn", "slowmoOff", "roomClear",
  "comboMilestone", "menuStart", "death",
];

// ═══ JSFXR FALLBACK DEFINITIONS ═══
const JSFXR_FALLBACK = {
  slash1: { oldParams: true, wave_type: 1, p_env_attack: 0, p_env_sustain: 0.05, p_env_punch: 0.4, p_env_decay: 0.15, p_base_freq: 0.35, p_freq_ramp: -0.25, p_duty: 0.6, p_duty_ramp: -0.1, p_lpf_freq: 1, p_hpf_freq: 0.15, sound_vol: 0.3, sample_rate: 44100, sample_size: 8 },
  slash2: { oldParams: true, wave_type: 1, p_env_attack: 0, p_env_sustain: 0.06, p_env_punch: 0.5, p_env_decay: 0.18, p_base_freq: 0.42, p_freq_ramp: -0.3, p_arp_mod: 0.15, p_arp_speed: 0.5, p_duty: 0.5, p_duty_ramp: -0.15, p_lpf_freq: 1, p_hpf_freq: 0.1, sound_vol: 0.35, sample_rate: 44100, sample_size: 8 },
  slash3: { oldParams: true, wave_type: 0, p_env_attack: 0, p_env_sustain: 0.12, p_env_punch: 0.7, p_env_decay: 0.28, p_base_freq: 0.5, p_freq_ramp: -0.15, p_vib_strength: 0.15, p_vib_speed: 0.4, p_arp_mod: -0.2, p_arp_speed: 0.7, p_duty: 0.4, p_duty_ramp: 0.1, p_repeat_speed: 0.45, p_lpf_freq: 0.8, p_lpf_resonance: 0.3, p_hpf_freq: 0.05, sound_vol: 0.4, sample_rate: 44100, sample_size: 8 },
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

  // Create AudioContext (called during user gesture — START button click)
  try {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (_ctx.state === "suspended") _ctx.resume();
    _masterGain = _ctx.createGain();
    _masterGain.gain.value = _muted ? 0 : 1;
    _masterGain.connect(_ctx.destination);
    _musicGain = _ctx.createGain();
    _musicGain.gain.value = _muted ? 0 : _musicVolume;
    _musicGain.connect(_ctx.destination);
  } catch (e) {
    console.warn("[audio] No AudioContext:", e);
    _ctx = null;
  }

  // Load sounds: try MP3 files first, fall back to jsfxr
  _loadAllSounds();
}

async function _loadAllSounds() {
  let mp3Count = 0;
  let jsfxrCount = 0;

  for (const name of SFX_NAMES) {
    // Try loading pre-generated MP3 from ElevenLabs
    if (_ctx) {
      try {
        const res = await fetch(`/audio/game/${name}.mp3`);
        if (res.ok) {
          const arrayBuf = await res.arrayBuffer();
          const audioBuf = await _ctx.decodeAudioData(arrayBuf);
          _buffers[name] = audioBuf;
          mp3Count++;
          continue;
        }
      } catch { /* MP3 not available, use fallback */ }
    }

    // Fallback: generate with jsfxr
    const def = JSFXR_FALLBACK[name];
    if (!def) continue;
    try {
      if (_ctx && typeof sfxr.toWebAudio === "function") {
        const source = sfxr.toWebAudio(def, _ctx);
        if (source?.buffer) { _buffers[name] = source.buffer; jsfxrCount++; continue; }
      }
      const audio = sfxr.toAudio(def);
      if (audio?.src) { _buffers[name] = audio.src; jsfxrCount++; }
    } catch { /* skip */ }
  }

  console.log(`[audio] Loaded ${mp3Count} MP3s, ${jsfxrCount} jsfxr fallbacks`);

  // Try loading background music
  if (_ctx) {
    try {
      const res = await fetch("/audio/game/bgm_ambient.mp3");
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        _buffers._bgm = await _ctx.decodeAudioData(arrayBuf);
        console.log("[audio] Background music loaded");
      }
    } catch { /* no music file yet */ }
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

// ═══ MUSIC ═══
export function startMusic() {
  if (!_ctx || !_musicGain || !_buffers._bgm || _musicSource) return;
  try {
    _musicSource = _ctx.createBufferSource();
    _musicSource.buffer = _buffers._bgm;
    _musicSource.loop = true;
    _musicSource.connect(_musicGain);
    _musicSource.start(0);
  } catch { /* */ }
}

export function stopMusic() {
  if (_musicSource) {
    try { _musicSource.stop(); } catch { /* */ }
    _musicSource = null;
  }
}

// ═══ CONTROLS ═══
export function toggleMute() {
  _muted = !_muted;
  localStorage.setItem("nihongo-game-muted", _muted);
  if (_masterGain) _masterGain.gain.value = _muted ? 0 : 1;
  if (_musicGain) _musicGain.gain.value = _muted ? 0 : _musicVolume;
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
