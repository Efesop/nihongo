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
    img.onerror = () => { console.warn(`[sprites] FAILED: ${key} (${src})`); resolve(null); };
    img.src = src;
  });
}

export function loadGameImages() {
  console.log("[sprites] loadGameImages called");
  // Load CRITICAL sprites first (player + oni + ninja — needed for room 0)
  // Then load everything else in background (non-blocking)
  // CRITICAL: What's needed to render room 0 gameplay (NPC system, not story overlay)
  const critical = [
    loadImg("player", "/images/tinysenpai/idle.png"),
    loadImg("bg_dojo", "/images/tinysenpai/game/bg_dojo.png"),
    loadImg("story_sensei_idle", "/images/tinysenpai/game/story_sensei_idle.png"),
    loadImg("story_sensei_walk1", "/images/tinysenpai/game/story_sensei_walk1.png"),
    loadImg("run1", "/images/tinysenpai/run/1.png"),
    loadImg("slash1", "/images/tinysenpai/slash/1.png"),
    loadImg("jump1", "/images/tinysenpai/jump/launch.png"),
  ];

  // EVERYTHING else loads in background
  const deferred = [
    loadImg("oni_idle", "/images/oni/oni-idle.png"),
    loadImg("bg_dojo_story", "/images/tinysenpai/game/bg_dojo_story.png"),
    loadImg("story_player_idle", "/images/tinysenpai/game/story_player_idle.png"),
    loadImg("story_sensei_serious", "/images/tinysenpai/game/story_sensei_serious.png"),
    loadImg("story_sensei_amused", "/images/tinysenpai/game/story_sensei_amused.png"),
    // Player — full set
    loadImg("run1", "/images/tinysenpai/run/1.png"),
    loadImg("run2", "/images/tinysenpai/run/2.png"),
    loadImg("run3", "/images/tinysenpai/run/3.png"),
    loadImg("run4", "/images/tinysenpai/run/4.png"),
    loadImg("slash1", "/images/tinysenpai/slash/1.png"),
    loadImg("slash2", "/images/tinysenpai/slash/2.png"),
    loadImg("slash3", "/images/tinysenpai/slash/3.png"),
    loadImg("slash4", "/images/tinysenpai/slash/4.png"),
    loadImg("jump1", "/images/tinysenpai/jump/launch.png"),
    loadImg("jump2", "/images/tinysenpai/jump/airborne.png"),
    loadImg("fall", "/images/tinysenpai/fall.png"),
    loadImg("wallslide", "/images/tinysenpai/wallslide.png"),
    loadImg("dash", "/images/tinysenpai/dash.png"),
    loadImg("death1", "/images/tinysenpai/death/hit.png"),
    loadImg("death2", "/images/tinysenpai/death/fallen.png"),
    loadImg("wall_cling", "/images/tinysenpai/wall-cling.png"),
    loadImg("parry", "/images/tinysenpai/parry.png"),
    loadImg("land_heavy", "/images/tinysenpai/land-heavy.png"),
    loadImg("slash_through", "/images/tinysenpai/slash-through.png"),
    // Oni — remaining states
    loadImg("oni", "/images/oni/demon.png"),
    loadImg("oni_walk1", "/images/oni/oni-walk1.png"),
    loadImg("oni_walk2", "/images/oni/oni-walk2.png"),
    loadImg("oni_alert", "/images/oni/oni-alert.png"),
    loadImg("oni_windup", "/images/oni/oni-windup.png"),
    loadImg("oni_attack", "/images/oni/oni-attack-lunge.png"),
    loadImg("oni_dazed", "/images/oni/oni-dazed.png"),
    loadImg("oni_hit", "/images/oni/oni-hit.png"),
    loadImg("oni_kneel", "/images/oni/oni-kneel-defeat.png"),
    loadImg("oni_dead", "/images/oni/oni-fallen-dead.png"),
    loadImg("oni_kb_back", "/images/oni/oni-knockback-back.png"),
    loadImg("oni_kb_tumble", "/images/oni/oni-knockback-tumble.png"),
    loadImg("oni_kb_seated", "/images/oni/oni-knockback-seated.png"),
    // Ninja
    loadImg("ninja", "/images/ninja/ninja.png"),
    loadImg("ninja_idle", "/images/ninja/ninja-idle.png"),
    loadImg("ninja_walk1", "/images/ninja/ninja-walk1.png"),
    loadImg("ninja_walk2", "/images/ninja/ninja-walk2.png"),
    loadImg("ninja_alert", "/images/ninja/ninja-alert.png"),
    loadImg("ninja_throw", "/images/ninja/ninja-throw.png"),
    loadImg("ninja_retreat", "/images/ninja/ninja-retreat.png"),
    loadImg("ninja_dazed", "/images/ninja/ninja-dazed.png"),
    loadImg("ninja_hit", "/images/ninja/ninja-hit.png"),
    loadImg("ninja_kneel", "/images/ninja/ninja-kneel.png"),
    loadImg("ninja_dead", "/images/ninja/ninja-dead.png"),
    loadImg("ninja_kb_back", "/images/ninja/ninja-knockback-back.png"),
    loadImg("ninja_kb_tumble", "/images/ninja/ninja-knockback-tumble.png"),
    loadImg("ninja_kb_seated", "/images/ninja/ninja-knockback-seated.png"),
    // Backgrounds
    loadImg("bg_forest", "/images/forest.png"),
    loadImg("bg_dojo_night_story", "/images/tinysenpai/game/bg_dojo_night_story.png"),
    // Samurai — full set from generated sprites
    ...["idle","walk1","walk2","alert","attack","dazed","hit","windup","kb_back","kb_tumble","kb_seated"].map(s =>
      loadImg(`samurai_${s}`, `/images/tinysenpai/game/samurai_${s}.png`, true)),
    loadImg("samurai_kneel", "/images/samurai/samurai-kneel.png"),
    loadImg("samurai_dead", "/images/samurai/samurai-dead.png"),
    // Ronin — Edo Castle Town enemy
    ...["idle","walk1","walk2","alert","attack","dazed","hit","kneel","dead","kb_back","kb_tumble","kb_seated"].map(s =>
      loadImg(`ronin_${s}`, `/images/tinysenpai/game/ronin_${s}.png`, true)),
    // Cyber Ninja — Neon Tokyo enemy
    ...["idle","walk1","walk2","alert","attack","dazed","hit","kneel","dead","kb_back","kb_tumble","kb_seated"].map(s =>
      loadImg(`cyber_ninja_${s}`, `/images/tinysenpai/game/cyber_ninja_${s}.png`, true)),
    // Bouncer — Nightclub enemy
    ...["idle","walk1","walk2","alert","attack","charge","dazed","hit","kneel","dead","kb_back","kb_seated"].map(s =>
      loadImg(`bouncer_${s}`, `/images/tinysenpai/game/bouncer_${s}.png`, true)),
    // Monk Guardian — Spirit Realm enemy
    ...["idle","walk1","walk2","alert","attack","block","dazed","hit","kneel","dead","kb_back","kb_seated"].map(s =>
      loadImg(`monk_${s}`, `/images/tinysenpai/game/monk_${s}.png`, true)),
    // Spirit Fox — Spirit Realm enemy
    ...["idle","alert","attack","dazed","hit","dead"].map(s =>
      loadImg(`spirit_fox_${s}`, `/images/tinysenpai/game/spirit_fox_${s}.png`, true)),
    // Cursed Ronin — Spirit Realm dark mirror of player
    ...["idle","walk1","walk2","alert","attack","dash","dazed","hit","kneel","dead","kb_back","kb_seated"].map(s =>
      loadImg(`cursed_ronin_${s}`, `/images/tinysenpai/game/cursed_ronin_${s}.png`, true)),
    // Player refresh sprites (new Gemini-generated set)
    ...["idle","run1","run2","run3","run4","slash1","slash2","slash3","slash4","jump1","jump2","fall","dash","wallslide","crouch","death1","death2"].map(s =>
      loadImg(`player_${s}`, `/images/tinysenpai/game/player_${s}.png`, true)),
    // Backgrounds — story scenes (dojo ones loaded in critical, skip dupes)
    loadImg("bg_forest_story", "/images/tinysenpai/game/bg_forest_story.png"),
    loadImg("bg_temple_story", "/images/tinysenpai/game/bg_temple_story.png"),
    // New zone story backgrounds
    loadImg("bg_edo_story", "/images/tinysenpai/game/bg_edo_story.png"),
    loadImg("bg_neon_story", "/images/tinysenpai/game/bg_neon_story.png"),
    loadImg("bg_nightclub_story", "/images/tinysenpai/game/bg_nightclub_story.png"),
    loadImg("bg_spirit_story", "/images/tinysenpai/game/bg_spirit_story.png"),
    // Multi-layer parallax backgrounds
    ...["far","mid","near"].flatMap(layer =>
      ["edo","neon","nightclub","spirit"].map(zone =>
        loadImg(`bg_${zone}_${layer}`, `/images/tinysenpai/game/bg_${zone}_${layer}.png`))),
    // Story character sprites — existing
    loadImg("story_player_idle", "/images/tinysenpai/game/story_player_idle.png"),
    loadImg("story_player_surprised", "/images/tinysenpai/game/story_player_surprised.png"),
    loadImg("story_player_determined", "/images/tinysenpai/game/story_player_determined.png"),
    loadImg("story_player_kneeling", "/images/tinysenpai/game/story_player_kneeling.png"),
    loadImg("story_sensei_idle", "/images/tinysenpai/game/story_sensei_idle.png"),
    loadImg("story_sensei_serious", "/images/tinysenpai/game/story_sensei_serious.png"),
    loadImg("story_sensei_amused", "/images/tinysenpai/game/story_sensei_amused.png"),
    loadImg("story_shadow_idle", "/images/tinysenpai/game/story_shadow_idle.png"),
    loadImg("story_shadow_angry", "/images/tinysenpai/game/story_shadow_angry.png"),
    loadImg("story_shadow_bitter", "/images/tinysenpai/game/story_shadow_bitter.png"),
    loadImg("story_elder_idle", "/images/tinysenpai/game/story_elder_idle.png"),
    loadImg("story_elder_concerned", "/images/tinysenpai/game/story_elder_concerned.png"),
    // New story characters
    ...["idle","smirk","serious"].map(s =>
      loadImg(`story_kunoichi_${s}`, `/images/tinysenpai/game/story_kunoichi_${s}.png`, true)),
    ...["idle","angry"].map(s =>
      loadImg(`story_katsura_${s}`, `/images/tinysenpai/game/story_katsura_${s}.png`, true)),
    loadImg("story_hacker_idle", "/images/tinysenpai/game/story_hacker_idle.png"),
    loadImg("story_fox_idle", "/images/tinysenpai/game/story_fox_idle.png"),
    loadImg("story_shadow_defeated", "/images/tinysenpai/game/story_shadow_defeated.png"),
    loadImg("story_shadow_human", "/images/tinysenpai/game/story_shadow_human.png"),
    loadImg("story_player_arm", "/images/tinysenpai/game/story_player_arm.png"),
    // Portraits — existing + new
    loadImg("portrait_sensei_v2", "/images/tinysenpai/game/portrait_sensei_v2.png"),
    loadImg("portrait_kunoichi", "/images/tinysenpai/game/portrait_kunoichi.png"),
    loadImg("portrait_katsura", "/images/tinysenpai/game/portrait_katsura.png"),
    loadImg("portrait_hacker", "/images/tinysenpai/game/portrait_hacker.png"),
    loadImg("portrait_fox", "/images/tinysenpai/game/portrait_fox.png"),
  ];

  // Wait only for critical sprites, then start game immediately
  // Deferred sprites load in background — procedural fallback handles missing
  console.log(`[sprites] Loading ${critical.length} critical + ${deferred.length} deferred sprites`);
  // Wait for critical sprites (with 5s timeout) — these are needed for room 0
  // Deferred sprites load in background
  Promise.all(deferred).then(r => console.log(`[sprites] Deferred: ${r.filter(Boolean).length}/${deferred.length}`)).catch(() => {});
  const timeout = new Promise(r => setTimeout(() => { console.warn("[sprites] Critical timeout"); r(); }, 5000));
  return Promise.race([
    Promise.all(critical).then(r => console.log(`[sprites] Critical: ${r.filter(Boolean).length}/${critical.length}`)),
    timeout,
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
