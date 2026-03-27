import { PAL, SCALE } from "./constants.js";

// ═══ IMAGE LOADING ═══
// All gray backgrounds removed offline via scripts/remove-gray-bg.mjs
// No runtime processing needed — just load PNGs directly.
const _images = {};

function loadImg(key, src) {
  return new Promise((resolve) => {
    if (_images[key]) { resolve(_images[key]); return; }
    const img = new Image();
    img.onload = () => { _images[key] = img; resolve(img); };
    img.onerror = () => { resolve(null); };
    img.src = src;
  });
}

// Spec helper — returns [key, src] pair, does NOT start loading
const gs = (key) => [key, `/images/tinysenpai/game/${key}.png`];
const ps = (key, src) => [key, src];

export function loadGameImages() {
  console.log("[sprites] loadGameImages called");

  // ── CRITICAL: Minimum to render room 0 (story scene + gameplay) ──
  const critical = [
    loadImg("player", "/images/tinysenpai/idle.png"),
    loadImg("bg_dojo", "/images/tinysenpai/game/bg_dojo.png"),
    loadImg("bg_dojo_story", "/images/tinysenpai/game/bg_dojo_story.png"),
    loadImg("story_sensei_idle", "/images/tinysenpai/game/story_sensei_idle.png"),
    loadImg("run1", "/images/tinysenpai/run/1.png"),
    loadImg("slash1", "/images/tinysenpai/slash/1.png"),
  ];

  // ── DEFERRED: Specs only — NOT loaded yet ──
  const deferredSpecs = [
    // Player — original sprite set
    ps("run2", "/images/tinysenpai/run/2.png"),
    ps("run3", "/images/tinysenpai/run/3.png"),
    ps("run4", "/images/tinysenpai/run/4.png"),
    ps("slash2", "/images/tinysenpai/slash/2.png"),
    ps("slash3", "/images/tinysenpai/slash/3.png"),
    ps("slash4", "/images/tinysenpai/slash/4.png"),
    ps("jump1", "/images/tinysenpai/jump/launch.png"),
    ps("jump2", "/images/tinysenpai/jump/airborne.png"),
    ps("fall", "/images/tinysenpai/fall.png"),
    ps("wallslide", "/images/tinysenpai/wallslide.png"),
    ps("dash", "/images/tinysenpai/dash.png"),
    ps("death1", "/images/tinysenpai/death/hit.png"),
    ps("death2", "/images/tinysenpai/death/fallen.png"),
    ps("wall_cling", "/images/tinysenpai/wall-cling.png"),
    ps("parry", "/images/tinysenpai/parry.png"),
    ps("land_heavy", "/images/tinysenpai/land-heavy.png"),
    ps("slash_through", "/images/tinysenpai/slash-through.png"),
    // Player — Gemini refresh set
    ...["idle","run1","run2","run3","run4","slash1","slash2","slash3","slash4",
        "jump1","jump2","fall","dash","wallslide","crouch","death1","death2"].map(s => gs(`player_${s}`)),
    // Oni
    ps("oni", "/images/oni/demon.png"),
    ps("oni_idle", "/images/oni/oni-idle.png"),
    ps("oni_walk1", "/images/oni/oni-walk1.png"),
    ps("oni_walk2", "/images/oni/oni-walk2.png"),
    ps("oni_alert", "/images/oni/oni-alert.png"),
    ps("oni_windup", "/images/oni/oni-windup.png"),
    ps("oni_attack", "/images/oni/oni-attack-lunge.png"),
    ps("oni_dazed", "/images/oni/oni-dazed.png"),
    ps("oni_hit", "/images/oni/oni-hit.png"),
    ps("oni_kneel", "/images/oni/oni-kneel-defeat.png"),
    ps("oni_dead", "/images/oni/oni-fallen-dead.png"),
    ps("oni_kb_back", "/images/oni/oni-knockback-back.png"),
    ps("oni_kb_tumble", "/images/oni/oni-knockback-tumble.png"),
    ps("oni_kb_seated", "/images/oni/oni-knockback-seated.png"),
    // Ninja
    ps("ninja", "/images/ninja/ninja.png"),
    ps("ninja_idle", "/images/ninja/ninja-idle.png"),
    ps("ninja_walk1", "/images/ninja/ninja-walk1.png"),
    ps("ninja_walk2", "/images/ninja/ninja-walk2.png"),
    ps("ninja_alert", "/images/ninja/ninja-alert.png"),
    ps("ninja_throw", "/images/ninja/ninja-throw.png"),
    ps("ninja_retreat", "/images/ninja/ninja-retreat.png"),
    ps("ninja_dazed", "/images/ninja/ninja-dazed.png"),
    ps("ninja_hit", "/images/ninja/ninja-hit.png"),
    ps("ninja_kneel", "/images/ninja/ninja-kneel.png"),
    ps("ninja_dead", "/images/ninja/ninja-dead.png"),
    ps("ninja_kb_back", "/images/ninja/ninja-knockback-back.png"),
    ps("ninja_kb_tumble", "/images/ninja/ninja-knockback-tumble.png"),
    ps("ninja_kb_seated", "/images/ninja/ninja-knockback-seated.png"),
    // Samurai
    ...["idle","walk1","walk2","alert","attack","dazed","hit","windup","kb_back","kb_tumble","kb_seated"].map(s => gs(`samurai_${s}`)),
    ps("samurai_kneel", "/images/samurai/samurai-kneel.png"),
    ps("samurai_dead", "/images/samurai/samurai-dead.png"),
    // Archer
    ...["idle","alert","draw_bow","fire","retreat","dazed","hit","kneel","dead","kb_back"].map(s => gs(`archer_${s}`)),
    // Brute
    ...["idle","alert","attack","charge","exhausted","hit","kneel","dead","kb_back"].map(s => gs(`brute_${s}`)),
    // Tengu
    ...["hover","swoop","attack","dazed","hit","dead"].map(s => gs(`tengu_${s}`)),
    // Ronin
    ...["idle","walk1","walk2","alert","attack","dazed","hit","kneel","dead","kb_back","kb_seated","kb_tumble"].map(s => gs(`ronin_${s}`)),
    // Cyber Ninja
    ...["idle","walk1","walk2","alert","attack","dazed","hit","kneel","dead","kb_back","kb_seated","kb_tumble"].map(s => gs(`cyber_ninja_${s}`)),
    // Bouncer
    ...["idle","walk1","walk2","alert","attack","charge","dazed","hit","kb_back","kb_seated"].map(s => gs(`bouncer_${s}`)),
    // Monk
    ...["idle","walk1","walk2","alert","attack","block","dazed","hit","kneel","dead","kb_back","kb_seated"].map(s => gs(`monk_${s}`)),
    // Spirit Fox
    ...["idle","alert","attack","dazed","hit","dead"].map(s => gs(`spirit_fox_${s}`)),
    // Cursed Ronin
    ...["idle","walk1","walk2","alert","attack","dash","dazed","hit","kneel","dead","kb_back","kb_seated"].map(s => gs(`cursed_ronin_${s}`)),
    // Backgrounds
    ps("bg_forest", "/images/forest.png"),
    ...["bg_dojo_story","bg_dojo_night_story","bg_forest_story","bg_temple_story",
        "bg_edo_story","bg_neon_story","bg_nightclub_story","bg_spirit_story"].map(k => gs(k)),
    ...["far","mid","near"].flatMap(layer =>
      ["edo","neon","spirit"].map(zone => gs(`bg_${zone}_${layer}`))),
    ...["far","mid"].map(layer => gs(`bg_nightclub_${layer}`)),
    // Story characters
    ...["idle","surprised","determined","kneeling","arm"].map(s => gs(`story_player_${s}`)),
    ...["idle","serious","amused","walk1","walk2"].map(s => gs(`story_sensei_${s}`)),
    ...["idle","angry","bitter","defeated","human","walk1","walk2"].map(s => gs(`story_shadow_${s}`)),
    ...["idle","concerned","walk1","walk2"].map(s => gs(`story_elder_${s}`)),
    ...["idle","smirk","serious","walk1","walk2"].map(s => gs(`story_kunoichi_${s}`)),
    ...["idle","angry"].map(s => gs(`story_katsura_${s}`)),
    ...["idle","walk1","walk2"].map(s => gs(`story_hacker_${s}`)),
    gs("story_fox_idle"),
    // Portraits
    ...["sensei","sensei_v2","player","shadow","elder","kunoichi","katsura","hacker","fox"].map(s => gs(`portrait_${s}`)),
  ];

  console.log(`[sprites] Loading ${critical.length} critical + ${deferredSpecs.length} deferred sprites`);

  // Wait for critical, then batch-load deferred (6 at a time, 50ms gaps)
  return Promise.all(critical).then(r => {
    console.log(`[sprites] Critical: ${r.filter(Boolean).length}/${critical.length}`);
    // Batch load deferred with yielding to main thread
    let loaded = 0;
    const BATCH = 6;
    function nextBatch(i) {
      if (i >= deferredSpecs.length) {
        console.log(`[sprites] Deferred: ${loaded}/${deferredSpecs.length}`);
        return;
      }
      const batch = deferredSpecs.slice(i, i + BATCH);
      Promise.all(batch.map(([k, s]) => loadImg(k, s))).then(results => {
        loaded += results.filter(Boolean).length;
        // Yield to let game loop run between batches
        requestAnimationFrame(() => nextBatch(i + BATCH));
      });
    }
    // Start first batch after game loop has started
    requestAnimationFrame(() => nextBatch(0));
  });
}

export function getImage(key) { return _images[key] || null; }
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
