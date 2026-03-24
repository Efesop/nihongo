import { sfxr } from "jsfxr";

// ═══ GAME AUDIO SYSTEM ═══
// Uses jsfxr to generate retro 8-bit SFX at runtime.
// All sounds are pre-generated as Audio elements on init for instant playback.

let _initialized = false;
let _muted = false;
let _sfxVolume = 0.5;
const _audioCache = {};  // name → Audio element
const _activePool = [];  // currently playing Audio elements
const MAX_SIMULTANEOUS = 10;

// ═══ SOUND DEFINITIONS ═══
// Each sound is a jsfxr parameter object or preset string.
// Tuned for Katana Zero-inspired action game feel.

const SOUNDS = {
  // ── Slash combo (progressively more intense) ──
  slash1: {
    oldParams: true, wave_type: 1,
    p_env_attack: 0, p_env_sustain: 0.05, p_env_punch: 0.4, p_env_decay: 0.15,
    p_base_freq: 0.35, p_freq_limit: 0, p_freq_ramp: -0.25,
    p_freq_dramp: 0, p_vib_strength: 0, p_vib_speed: 0,
    p_arp_mod: 0, p_arp_speed: 0, p_duty: 0.6, p_duty_ramp: -0.1,
    p_repeat_speed: 0, p_pha_offset: 0, p_pha_ramp: 0,
    p_lpf_freq: 1, p_lpf_ramp: 0, p_lpf_resonance: 0,
    p_hpf_freq: 0.15, p_hpf_ramp: 0, sound_vol: 0.3, sample_rate: 44100, sample_size: 8,
  },
  slash2: {
    oldParams: true, wave_type: 1,
    p_env_attack: 0, p_env_sustain: 0.06, p_env_punch: 0.5, p_env_decay: 0.18,
    p_base_freq: 0.42, p_freq_limit: 0, p_freq_ramp: -0.3,
    p_freq_dramp: 0, p_vib_strength: 0, p_vib_speed: 0,
    p_arp_mod: 0.15, p_arp_speed: 0.5, p_duty: 0.5, p_duty_ramp: -0.15,
    p_repeat_speed: 0, p_pha_offset: 0, p_pha_ramp: 0,
    p_lpf_freq: 1, p_lpf_ramp: 0, p_lpf_resonance: 0,
    p_hpf_freq: 0.1, p_hpf_ramp: 0, sound_vol: 0.35, sample_rate: 44100, sample_size: 8,
  },
  slash3: {
    oldParams: true, wave_type: 0,
    p_env_attack: 0, p_env_sustain: 0.12, p_env_punch: 0.7, p_env_decay: 0.28,
    p_base_freq: 0.5, p_freq_limit: 0, p_freq_ramp: -0.15,
    p_freq_dramp: 0, p_vib_strength: 0.15, p_vib_speed: 0.4,
    p_arp_mod: -0.2, p_arp_speed: 0.7, p_duty: 0.4, p_duty_ramp: 0.1,
    p_repeat_speed: 0.45, p_pha_offset: 0, p_pha_ramp: 0,
    p_lpf_freq: 0.8, p_lpf_ramp: 0, p_lpf_resonance: 0.3,
    p_hpf_freq: 0.05, p_hpf_ramp: 0, sound_vol: 0.4, sample_rate: 44100, sample_size: 8,
  },

  // ── Kill — bass thump with crunch ──
  kill: {
    oldParams: true, wave_type: 3,
    p_env_attack: 0, p_env_sustain: 0.08, p_env_punch: 0.6, p_env_decay: 0.25,
    p_base_freq: 0.15, p_freq_limit: 0, p_freq_ramp: -0.1,
    p_freq_dramp: 0, p_vib_strength: 0, p_vib_speed: 0,
    p_arp_mod: 0, p_arp_speed: 0, p_duty: 0, p_duty_ramp: 0,
    p_repeat_speed: 0, p_pha_offset: 0, p_pha_ramp: 0,
    p_lpf_freq: 0.6, p_lpf_ramp: -0.2, p_lpf_resonance: 0.4,
    p_hpf_freq: 0, p_hpf_ramp: 0, sound_vol: 0.4, sample_rate: 44100, sample_size: 8,
  },

  // ── Death — discordant descending tone ──
  death: {
    oldParams: true, wave_type: 3,
    p_env_attack: 0, p_env_sustain: 0.2, p_env_punch: 0.3, p_env_decay: 0.4,
    p_base_freq: 0.3, p_freq_limit: 0, p_freq_ramp: -0.25,
    p_freq_dramp: 0, p_vib_strength: 0.2, p_vib_speed: 0.3,
    p_arp_mod: 0, p_arp_speed: 0, p_duty: 0, p_duty_ramp: 0,
    p_repeat_speed: 0, p_pha_offset: 0, p_pha_ramp: 0,
    p_lpf_freq: 0.5, p_lpf_ramp: -0.3, p_lpf_resonance: 0.5,
    p_hpf_freq: 0, p_hpf_ramp: 0, sound_vol: 0.35, sample_rate: 44100, sample_size: 8,
  },

  // ── Dash — quick whoosh ──
  dash: {
    oldParams: true, wave_type: 3,
    p_env_attack: 0, p_env_sustain: 0.04, p_env_punch: 0.3, p_env_decay: 0.12,
    p_base_freq: 0.4, p_freq_limit: 0, p_freq_ramp: 0.35,
    p_freq_dramp: 0, p_vib_strength: 0, p_vib_speed: 0,
    p_arp_mod: 0, p_arp_speed: 0, p_duty: 0, p_duty_ramp: 0,
    p_repeat_speed: 0, p_pha_offset: 0, p_pha_ramp: 0,
    p_lpf_freq: 0.8, p_lpf_ramp: 0.2, p_lpf_resonance: 0,
    p_hpf_freq: 0.3, p_hpf_ramp: 0.1, sound_vol: 0.25, sample_rate: 44100, sample_size: 8,
  },

  // ── Jump — light pop ──
  jump: {
    oldParams: true, wave_type: 0,
    p_env_attack: 0, p_env_sustain: 0.05, p_env_punch: 0.2, p_env_decay: 0.1,
    p_base_freq: 0.28, p_freq_limit: 0, p_freq_ramp: 0.2,
    p_freq_dramp: 0, p_vib_strength: 0, p_vib_speed: 0,
    p_arp_mod: 0, p_arp_speed: 0, p_duty: 0.5, p_duty_ramp: 0,
    p_repeat_speed: 0, p_pha_offset: 0, p_pha_ramp: 0,
    p_lpf_freq: 1, p_lpf_ramp: 0, p_lpf_resonance: 0,
    p_hpf_freq: 0.2, p_hpf_ramp: 0, sound_vol: 0.2, sample_rate: 44100, sample_size: 8,
  },

  // ── Land — soft thud ──
  land: {
    oldParams: true, wave_type: 3,
    p_env_attack: 0, p_env_sustain: 0.03, p_env_punch: 0.4, p_env_decay: 0.08,
    p_base_freq: 0.12, p_freq_limit: 0, p_freq_ramp: -0.15,
    p_freq_dramp: 0, p_vib_strength: 0, p_vib_speed: 0,
    p_arp_mod: 0, p_arp_speed: 0, p_duty: 0, p_duty_ramp: 0,
    p_repeat_speed: 0, p_pha_offset: 0, p_pha_ramp: 0,
    p_lpf_freq: 0.4, p_lpf_ramp: 0, p_lpf_resonance: 0,
    p_hpf_freq: 0, p_hpf_ramp: 0, sound_vol: 0.2, sample_rate: 44100, sample_size: 8,
  },

  // ── Deflect — metallic ping ──
  deflect: {
    oldParams: true, wave_type: 0,
    p_env_attack: 0, p_env_sustain: 0.04, p_env_punch: 0.5, p_env_decay: 0.2,
    p_base_freq: 0.55, p_freq_limit: 0, p_freq_ramp: 0.1,
    p_freq_dramp: 0, p_vib_strength: 0.1, p_vib_speed: 0.5,
    p_arp_mod: 0.3, p_arp_speed: 0.6, p_duty: 0.5, p_duty_ramp: 0,
    p_repeat_speed: 0, p_pha_offset: 0, p_pha_ramp: 0,
    p_lpf_freq: 1, p_lpf_ramp: 0, p_lpf_resonance: 0.2,
    p_hpf_freq: 0.2, p_hpf_ramp: 0, sound_vol: 0.3, sample_rate: 44100, sample_size: 8,
  },

  // ── Clash — metal ring with sparks ──
  clash: {
    oldParams: true, wave_type: 1,
    p_env_attack: 0, p_env_sustain: 0.1, p_env_punch: 0.8, p_env_decay: 0.35,
    p_base_freq: 0.5, p_freq_limit: 0, p_freq_ramp: -0.05,
    p_freq_dramp: 0, p_vib_strength: 0.2, p_vib_speed: 0.6,
    p_arp_mod: 0.4, p_arp_speed: 0.5, p_duty: 0.3, p_duty_ramp: 0.1,
    p_repeat_speed: 0.3, p_pha_offset: 0.1, p_pha_ramp: 0,
    p_lpf_freq: 0.9, p_lpf_ramp: 0, p_lpf_resonance: 0.3,
    p_hpf_freq: 0.1, p_hpf_ramp: 0, sound_vol: 0.4, sample_rate: 44100, sample_size: 8,
  },

  // ── Room clear — rising chime cascade ──
  roomClear: {
    oldParams: true, wave_type: 0,
    p_env_attack: 0, p_env_sustain: 0.15, p_env_punch: 0.3, p_env_decay: 0.4,
    p_base_freq: 0.4, p_freq_limit: 0, p_freq_ramp: 0.2,
    p_freq_dramp: 0, p_vib_strength: 0.05, p_vib_speed: 0.3,
    p_arp_mod: 0.15, p_arp_speed: 0.4, p_duty: 0.5, p_duty_ramp: 0,
    p_repeat_speed: 0.5, p_pha_offset: 0, p_pha_ramp: 0,
    p_lpf_freq: 1, p_lpf_ramp: 0, p_lpf_resonance: 0,
    p_hpf_freq: 0.1, p_hpf_ramp: 0, sound_vol: 0.3, sample_rate: 44100, sample_size: 8,
  },

  // ── Shuriken throw — spinning whistle ──
  shuriken: {
    oldParams: true, wave_type: 1,
    p_env_attack: 0, p_env_sustain: 0.1, p_env_punch: 0.2, p_env_decay: 0.15,
    p_base_freq: 0.6, p_freq_limit: 0, p_freq_ramp: -0.1,
    p_freq_dramp: 0, p_vib_strength: 0.3, p_vib_speed: 0.8,
    p_arp_mod: 0, p_arp_speed: 0, p_duty: 0.2, p_duty_ramp: 0.1,
    p_repeat_speed: 0.6, p_pha_offset: 0, p_pha_ramp: 0,
    p_lpf_freq: 0.7, p_lpf_ramp: 0, p_lpf_resonance: 0,
    p_hpf_freq: 0.3, p_hpf_ramp: 0, sound_vol: 0.2, sample_rate: 44100, sample_size: 8,
  },

  // ── Slow-mo on — pitch-down sweep ──
  slowmoOn: {
    oldParams: true, wave_type: 0,
    p_env_attack: 0.05, p_env_sustain: 0.15, p_env_punch: 0, p_env_decay: 0.2,
    p_base_freq: 0.5, p_freq_limit: 0, p_freq_ramp: -0.3,
    p_freq_dramp: 0, p_vib_strength: 0, p_vib_speed: 0,
    p_arp_mod: 0, p_arp_speed: 0, p_duty: 0.5, p_duty_ramp: 0,
    p_repeat_speed: 0, p_pha_offset: 0, p_pha_ramp: 0,
    p_lpf_freq: 0.6, p_lpf_ramp: -0.2, p_lpf_resonance: 0.2,
    p_hpf_freq: 0, p_hpf_ramp: 0, sound_vol: 0.2, sample_rate: 44100, sample_size: 8,
  },

  // ── Slow-mo off — pitch-up sweep ──
  slowmoOff: {
    oldParams: true, wave_type: 0,
    p_env_attack: 0, p_env_sustain: 0.1, p_env_punch: 0.2, p_env_decay: 0.15,
    p_base_freq: 0.3, p_freq_limit: 0, p_freq_ramp: 0.35,
    p_freq_dramp: 0, p_vib_strength: 0, p_vib_speed: 0,
    p_arp_mod: 0, p_arp_speed: 0, p_duty: 0.5, p_duty_ramp: 0,
    p_repeat_speed: 0, p_pha_offset: 0, p_pha_ramp: 0,
    p_lpf_freq: 0.7, p_lpf_ramp: 0.2, p_lpf_resonance: 0,
    p_hpf_freq: 0.1, p_hpf_ramp: 0, sound_vol: 0.2, sample_rate: 44100, sample_size: 8,
  },

  // ── Combo milestone ping ──
  comboMilestone: {
    oldParams: true, wave_type: 0,
    p_env_attack: 0, p_env_sustain: 0.06, p_env_punch: 0.5, p_env_decay: 0.25,
    p_base_freq: 0.65, p_freq_limit: 0, p_freq_ramp: 0.1,
    p_freq_dramp: 0, p_vib_strength: 0, p_vib_speed: 0,
    p_arp_mod: 0.25, p_arp_speed: 0.5, p_duty: 0.5, p_duty_ramp: 0,
    p_repeat_speed: 0.4, p_pha_offset: 0, p_pha_ramp: 0,
    p_lpf_freq: 1, p_lpf_ramp: 0, p_lpf_resonance: 0,
    p_hpf_freq: 0.2, p_hpf_ramp: 0, sound_vol: 0.3, sample_rate: 44100, sample_size: 8,
  },

  // ── Menu start — dramatic stab ──
  menuStart: {
    oldParams: true, wave_type: 1,
    p_env_attack: 0, p_env_sustain: 0.15, p_env_punch: 0.6, p_env_decay: 0.35,
    p_base_freq: 0.25, p_freq_limit: 0, p_freq_ramp: -0.05,
    p_freq_dramp: 0, p_vib_strength: 0.1, p_vib_speed: 0.2,
    p_arp_mod: 0.2, p_arp_speed: 0.6, p_duty: 0.5, p_duty_ramp: 0,
    p_repeat_speed: 0, p_pha_offset: 0, p_pha_ramp: 0,
    p_lpf_freq: 0.8, p_lpf_ramp: 0, p_lpf_resonance: 0.2,
    p_hpf_freq: 0, p_hpf_ramp: 0, sound_vol: 0.35, sample_rate: 44100, sample_size: 8,
  },

  // ── Wall slide — friction scrape ──
  wallSlide: {
    oldParams: true, wave_type: 3,
    p_env_attack: 0.05, p_env_sustain: 0.2, p_env_punch: 0, p_env_decay: 0.1,
    p_base_freq: 0.08, p_freq_limit: 0, p_freq_ramp: 0.02,
    p_freq_dramp: 0, p_vib_strength: 0.15, p_vib_speed: 0.6,
    p_arp_mod: 0, p_arp_speed: 0, p_duty: 0, p_duty_ramp: 0,
    p_repeat_speed: 0.7, p_pha_offset: 0, p_pha_ramp: 0,
    p_lpf_freq: 0.3, p_lpf_ramp: 0, p_lpf_resonance: 0.4,
    p_hpf_freq: 0.05, p_hpf_ramp: 0, sound_vol: 0.12, sample_rate: 44100, sample_size: 8,
  },

  // ── Footstep — light crunch ──
  footstep: {
    oldParams: true, wave_type: 3,
    p_env_attack: 0, p_env_sustain: 0.01, p_env_punch: 0.3, p_env_decay: 0.04,
    p_base_freq: 0.08, p_freq_limit: 0, p_freq_ramp: -0.1,
    p_freq_dramp: 0, p_vib_strength: 0, p_vib_speed: 0,
    p_arp_mod: 0, p_arp_speed: 0, p_duty: 0, p_duty_ramp: 0,
    p_repeat_speed: 0, p_pha_offset: 0, p_pha_ramp: 0,
    p_lpf_freq: 0.4, p_lpf_ramp: 0, p_lpf_resonance: 0,
    p_hpf_freq: 0.1, p_hpf_ramp: 0, sound_vol: 0.08, sample_rate: 44100, sample_size: 8,
  },
};

// ═══ INITIALIZATION ═══
export function initAudio() {
  if (_initialized) return;
  _initialized = true;
  _muted = localStorage.getItem("nihongo-game-muted") === "true";

  // Pre-generate all sounds as Audio elements
  for (const [name, def] of Object.entries(SOUNDS)) {
    try {
      _audioCache[name] = sfxr.toAudio(def);
    } catch {
      // Silently skip sounds that fail to generate
    }
  }
}

// ═══ PLAY SOUND ═══
export function playSound(name, opts = {}) {
  if (_muted || !_initialized) return;
  const cached = _audioCache[name];
  if (!cached) return;

  // Clean up finished sounds from pool
  for (let i = _activePool.length - 1; i >= 0; i--) {
    if (_activePool[i].ended || _activePool[i].paused) {
      _activePool.splice(i, 1);
    }
  }

  // Limit simultaneous sounds
  if (_activePool.length >= MAX_SIMULTANEOUS) return;

  try {
    // Clone the audio for overlapping playback
    const audio = cached.cloneNode();
    const vol = (opts.volume ?? 1) * _sfxVolume;
    audio.volume = Math.max(0, Math.min(1, vol));
    if (opts.playbackRate) audio.playbackRate = opts.playbackRate;
    audio.play().catch(() => {});
    _activePool.push(audio);
  } catch {
    // Audio playback can fail in many browser contexts — never crash
  }
}

// ═══ CONTROLS ═══
export function toggleMute() {
  _muted = !_muted;
  localStorage.setItem("nihongo-game-muted", _muted);
  // Stop all active sounds when muting
  if (_muted) {
    for (const a of _activePool) {
      try { a.pause(); } catch {}
    }
    _activePool.length = 0;
  }
  return _muted;
}

export function isMuted() { return _muted; }

export function setSfxVolume(v) {
  _sfxVolume = Math.max(0, Math.min(1, v));
}
