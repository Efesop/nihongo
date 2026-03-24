import { sfxr } from "jsfxr";

// ═══ GAME AUDIO SYSTEM ═══
// Uses jsfxr + Web Audio API for reliable game SFX.
// All sounds pre-generated as AudioBuffers on init for instant playback.

let _initialized = false;
let _muted = false;
let _sfxVolume = 0.5;
let _ctx = null;        // AudioContext
let _masterGain = null;  // Master gain node for mute control
const _buffers = {};     // name → AudioBuffer

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

  // Create AudioContext (called during user gesture — START button click)
  try {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (_ctx.state === "suspended") _ctx.resume();
    _masterGain = _ctx.createGain();
    _masterGain.gain.value = _muted ? 0 : 1;
    _masterGain.connect(_ctx.destination);
  } catch (e) {
    console.warn("[audio] No AudioContext:", e);
    _ctx = null;
  }

  // Pre-generate all sounds — try Web Audio (AudioBuffer), fallback to HTML Audio (blob URL)
  let generated = 0;
  for (const [name, def] of Object.entries(SOUNDS)) {
    try {
      // Primary: Web Audio API via sfxr.toWebAudio
      if (_ctx && typeof sfxr.toWebAudio === "function") {
        const source = sfxr.toWebAudio(def, _ctx);
        if (source && source.buffer) {
          _buffers[name] = source.buffer; // AudioBuffer
          generated++;
          continue;
        }
      }
    } catch (e) {
      console.warn(`[audio] WebAudio failed for "${name}":`, e.message);
    }
    try {
      // Fallback: HTML Audio element — store blob URL
      const audio = sfxr.toAudio(def);
      if (audio && audio.src) {
        _buffers[name] = audio.src; // string (blob URL)
        generated++;
      }
    } catch (e) {
      console.warn(`[audio] Fallback failed for "${name}":`, e.message);
    }
  }
  console.log(`[audio] Generated ${generated}/${Object.keys(SOUNDS).length} sounds (mode: ${_ctx ? "WebAudio" : "HTMLAudio"})`);
}

// ═══ PLAY SOUND ═══
export function playSound(name, opts = {}) {
  if (_muted) return;
  const buf = _buffers[name];
  if (!buf) return;

  try {
    if (typeof buf === "object" && _ctx && _masterGain) {
      // Web Audio API path — AudioBuffer
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
      // HTML Audio fallback — create fresh Audio from blob URL
      const audio = new Audio(buf);
      audio.volume = Math.max(0, Math.min(1, (opts.volume ?? 1) * _sfxVolume));
      if (opts.playbackRate) audio.playbackRate = opts.playbackRate;
      audio.play().catch(() => {});
    }
  } catch {
    // Audio playback can fail in many browser contexts — never crash
  }
}

// ═══ CONTROLS ═══
export function toggleMute() {
  _muted = !_muted;
  localStorage.setItem("nihongo-game-muted", _muted);
  // Instant mute/unmute via master gain
  if (_masterGain) {
    _masterGain.gain.value = _muted ? 0 : 1;
  }
  return _muted;
}

export function isMuted() {
  // Read from localStorage if not yet initialized (so menu shows correct state)
  if (!_initialized) return localStorage.getItem("nihongo-game-muted") === "true";
  return _muted;
}

export function setSfxVolume(v) {
  _sfxVolume = Math.max(0, Math.min(1, v));
}
