import { PAL, SCALE } from "./constants.js";

// ═══ IMAGE LOADING ═══
// Load character PNGs directly — way better than hand-coded pixel arrays.
const _images = {};

function loadImg(key, src, removeGrayBg = false) {
  return new Promise((resolve) => {
    if (_images[key]) { resolve(_images[key]); return; }
    const img = new Image();
    img.onload = () => {
      if (removeGrayBg) {
        // Remove gray background by making gray pixels transparent
        const c = document.createElement("canvas");
        c.width = img.width; c.height = img.height;
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, c.width, c.height);
        const d = data.data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i+1], b = d[i+2];
          // Remove background: gray pixels AND near-gray with slight color tint
          const avg = (r + g + b) / 3;
          const maxDiff = Math.max(Math.abs(r - avg), Math.abs(g - avg), Math.abs(b - avg));
          if (avg > 100 && maxDiff < 35) {
            d[i+3] = 0; // pure gray or near-gray
          } else if (avg > 90 && maxDiff < 50 && r > 80 && g > 80) {
            // Slightly tinted gray (like blue glow on gray bg) — fade out
            d[i+3] = Math.min(d[i+3], Math.max(0, (maxDiff - 25) * 10));
          }
        }
        ctx.putImageData(data, 0, 0);
        // Store as new image from canvas
        const cleaned = new Image();
        cleaned.onload = () => { _images[key] = cleaned; resolve(cleaned); };
        cleaned.src = c.toDataURL();
      } else {
        _images[key] = img;
        resolve(img);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function loadGameImages() {
  return Promise.all([
    // Player — all with gray bg removal
    loadImg("player", "/images/tinysenpai/idle.png", true),
    loadImg("run1", "/images/tinysenpai/run/1.png", true),
    loadImg("run2", "/images/tinysenpai/run/2.png", true),
    loadImg("run3", "/images/tinysenpai/run/3.png", true),
    loadImg("run4", "/images/tinysenpai/run/4.png", true),
    loadImg("slash1", "/images/tinysenpai/slash/1.png", true),
    loadImg("slash2", "/images/tinysenpai/slash/2.png", true),
    loadImg("slash3", "/images/tinysenpai/slash/3.png", true),
    loadImg("slash4", "/images/tinysenpai/slash/4.png", true),
    loadImg("jump1", "/images/tinysenpai/jump/launch.png", true),
    loadImg("jump2", "/images/tinysenpai/jump/airborne.png", true),
    loadImg("fall", "/images/tinysenpai/fall.png", true),
    loadImg("wallslide", "/images/tinysenpai/wallslide.png", true),
    loadImg("dash", "/images/tinysenpai/dash.png", true),
    loadImg("death1", "/images/tinysenpai/death/hit.png", true),
    loadImg("death2", "/images/tinysenpai/death/fallen.png", true),
    // New player sprites
    loadImg("wall_cling", "/images/tinysenpai/wall-cling.png", true),
    loadImg("parry", "/images/tinysenpai/parry.png", true),
    loadImg("land_heavy", "/images/tinysenpai/land-heavy.png", true),
    loadImg("slash_through", "/images/tinysenpai/slash-through.png", true),
    // Oni — full animation set
    loadImg("oni", "/images/oni/demon.png", true),
    loadImg("oni_idle", "/images/oni/oni-idle.png", true),
    loadImg("oni_walk1", "/images/oni/oni-walk1.png", true),
    loadImg("oni_walk2", "/images/oni/oni-walk2.png", true),
    loadImg("oni_alert", "/images/oni/oni-alert.png", true),
    loadImg("oni_windup", "/images/oni/oni-windup.png", true),
    loadImg("oni_attack", "/images/oni/oni-attack-lunge.png", true),
    loadImg("oni_dazed", "/images/oni/oni-dazed.png", true),
    loadImg("oni_hit", "/images/oni/oni-hit.png", true),
    loadImg("oni_kneel", "/images/oni/oni-kneel-defeat.png", true),
    loadImg("oni_dead", "/images/oni/oni-fallen-dead.png", true),
    loadImg("oni_kb_back", "/images/oni/oni-knockback-back.png", true),
    loadImg("oni_kb_tumble", "/images/oni/oni-knockback-tumble.png", true),
    loadImg("oni_kb_seated", "/images/oni/oni-knockback-seated.png", true),
    // Ninja — full animation set
    loadImg("ninja", "/images/ninja/ninja.png", true),
    loadImg("ninja_idle", "/images/ninja/ninja-idle.png", true),
    loadImg("ninja_walk1", "/images/ninja/ninja-walk1.png", true),
    loadImg("ninja_walk2", "/images/ninja/ninja-walk2.png", true),
    loadImg("ninja_alert", "/images/ninja/ninja-alert.png", true),
    loadImg("ninja_throw", "/images/ninja/ninja-throw.png", true),
    loadImg("ninja_retreat", "/images/ninja/ninja-retreat.png", true),
    loadImg("ninja_dazed", "/images/ninja/ninja-dazed.png", true),
    loadImg("ninja_hit", "/images/ninja/ninja-hit.png", true),
    loadImg("ninja_kneel", "/images/ninja/ninja-kneel.png", true),
    loadImg("ninja_dead", "/images/ninja/ninja-dead.png", true),
    loadImg("ninja_kb_back", "/images/ninja/ninja-knockback-back.png", true),
    loadImg("ninja_kb_tumble", "/images/ninja/ninja-knockback-tumble.png", true),
    loadImg("ninja_kb_seated", "/images/ninja/ninja-knockback-seated.png", true),
    // Samurai — partial set (kneel + dead)
    loadImg("samurai_kneel", "/images/samurai/samurai-kneel.png", true),
    loadImg("samurai_dead", "/images/samurai/samurai-dead.png", true),
    // Backgrounds — gameplay
    loadImg("bg_forest", "/images/forest.png"),
    loadImg("bg_dojo", "/images/tinysenpai/game/bg_dojo.png"),
    // Backgrounds — story scenes
    loadImg("bg_dojo_story", "/images/tinysenpai/game/bg_dojo_story.png"),
    loadImg("bg_dojo_night_story", "/images/tinysenpai/game/bg_dojo_night_story.png"),
    loadImg("bg_forest_story", "/images/tinysenpai/game/bg_forest_story.png"),
    loadImg("bg_temple_story", "/images/tinysenpai/game/bg_temple_story.png"),
    // Story character sprites (full body, 64x128)
    loadImg("story_player_idle", "/images/tinysenpai/game/story_player_idle.png", true),
    loadImg("story_player_surprised", "/images/tinysenpai/game/story_player_surprised.png", true),
    loadImg("story_player_determined", "/images/tinysenpai/game/story_player_determined.png", true),
    loadImg("story_player_kneeling", "/images/tinysenpai/game/story_player_kneeling.png", true),
    loadImg("story_sensei_idle", "/images/tinysenpai/game/story_sensei_idle.png", true),
    loadImg("story_sensei_serious", "/images/tinysenpai/game/story_sensei_serious.png", true),
    loadImg("story_sensei_amused", "/images/tinysenpai/game/story_sensei_amused.png", true),
    loadImg("story_shadow_idle", "/images/tinysenpai/game/story_shadow_idle.png", true),
    loadImg("story_shadow_angry", "/images/tinysenpai/game/story_shadow_angry.png", true),
    loadImg("story_shadow_bitter", "/images/tinysenpai/game/story_shadow_bitter.png", true),
    loadImg("story_elder_idle", "/images/tinysenpai/game/story_elder_idle.png", true),
    loadImg("story_elder_concerned", "/images/tinysenpai/game/story_elder_concerned.png", true),
    // Redesigned sensei portrait
    loadImg("portrait_sensei_v2", "/images/tinysenpai/game/portrait_sensei_v2.png", true),
  ]);
}

export function getImage(key) { return _images[key] || null; }
// Backwards compat
export function getMascotImage() { return _images["player"] || null; }
export function loadMascotImage() { return loadGameImages(); }

// ═══ MINIMAL SPRITE DATA — only for small projectiles ═══
const SPR = {
  shuriken: [
    "00W00",
    "0WWW0",
    "WWUWW",
    "0WWW0",
    "00W00",
  ],
  shuriken2: [
    "0WVW0",
    "WVVVW",
    "VVUVV",
    "WVVVW",
    "0WVW0",
  ],
};

// ═══ SPRITE CACHE (for projectiles only) ═══
const _cache = {};

export function getSprite(name, flip = false) {
  const key = name + (flip ? "_f" : "");
  if (_cache[key]) return _cache[key];
  const data = SPR[name];
  if (!data) return null;
  const h = data.length;
  const w = data[0].length;
  const canvas = document.createElement("canvas");
  canvas.width = w * SCALE;
  canvas.height = h * SCALE;
  const ctx = canvas.getContext("2d");
  for (let row = 0; row < h; row++) {
    const rowData = data[row];
    const rowLen = rowData.length;
    for (let col = 0; col < rowLen; col++) {
      const ch = rowData[flip ? rowLen - 1 - col : col];
      const color = PAL[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(col * SCALE, row * SCALE, SCALE, SCALE);
    }
  }
  _cache[key] = canvas;
  return canvas;
}
