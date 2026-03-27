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
    img.onerror = () => { resolve(null); }; // silent fail — procedural fallback handles missing
    img.src = src;
  });
}

// Helper: load a batch of sprites from /images/tinysenpai/game/
const g = (key) => loadImg(key, `/images/tinysenpai/game/${key}.png`);

export function loadGameImages() {
  console.log("[sprites] loadGameImages called");

  // ── CRITICAL: Minimum to render room 0 (player + dojo bg + sensei NPC) ──
  const critical = [
    loadImg("player", "/images/tinysenpai/idle.png"),
    g("bg_dojo"),
    g("story_sensei_idle"),
    loadImg("run1", "/images/tinysenpai/run/1.png"),
    loadImg("slash1", "/images/tinysenpai/slash/1.png"),
  ];

  // ── DEFERRED: Everything else loads in background ──
  const deferred = [
    // Player — original sprite set
    loadImg("run2", "/images/tinysenpai/run/2.png"),
    loadImg("run3", "/images/tinysenpai/run/3.png"),
    loadImg("run4", "/images/tinysenpai/run/4.png"),
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
    // Player — Gemini-generated refresh set
    ...["idle","run1","run2","run3","run4","slash1","slash2","slash3","slash4",
        "jump1","jump2","fall","dash","wallslide","crouch","death1","death2"].map(s => g(`player_${s}`)),
    // Oni
    loadImg("oni", "/images/oni/demon.png"),
    loadImg("oni_idle", "/images/oni/oni-idle.png"),
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
    // Samurai
    ...["idle","walk1","walk2","alert","attack","dazed","hit","windup","kb_back","kb_tumble","kb_seated"].map(s => g(`samurai_${s}`)),
    loadImg("samurai_kneel", "/images/samurai/samurai-kneel.png"),
    loadImg("samurai_dead", "/images/samurai/samurai-dead.png"),
    // Archer
    ...["idle","alert","draw_bow","fire","retreat","dazed","hit","kneel","dead","kb_back"].map(s => g(`archer_${s}`)),
    // Brute
    ...["idle","alert","attack","charge","exhausted","hit","kneel","dead","kb_back"].map(s => g(`brute_${s}`)),
    // Tengu
    ...["hover","swoop","attack","dazed","hit","dead"].map(s => g(`tengu_${s}`)),
    // Ronin (Edo)
    ...["idle","walk1","walk2","alert","attack","dazed","hit","kneel","dead","kb_back","kb_seated","kb_tumble"].map(s => g(`ronin_${s}`)),
    // Cyber Ninja (Neon Tokyo)
    ...["idle","walk1","walk2","alert","attack","dazed","hit","kneel","dead","kb_back","kb_seated","kb_tumble"].map(s => g(`cyber_ninja_${s}`)),
    // Bouncer (Nightclub)
    ...["idle","walk1","walk2","alert","attack","charge","dazed","hit","kb_back","kb_seated"].map(s => g(`bouncer_${s}`)),
    // Monk Guardian (Spirit)
    ...["idle","walk1","walk2","alert","attack","block","dazed","hit","kneel","dead","kb_back","kb_seated"].map(s => g(`monk_${s}`)),
    // Spirit Fox
    ...["idle","alert","attack","dazed","hit","dead"].map(s => g(`spirit_fox_${s}`)),
    // Cursed Ronin (Spirit — dark mirror)
    ...["idle","walk1","walk2","alert","attack","dash","dazed","hit","kneel","dead","kb_back","kb_seated"].map(s => g(`cursed_ronin_${s}`)),
    // Backgrounds — gameplay
    loadImg("bg_forest", "/images/forest.png"),
    // Backgrounds — story scenes
    ...["bg_dojo_story","bg_dojo_night_story","bg_forest_story","bg_temple_story",
        "bg_edo_story","bg_neon_story","bg_nightclub_story","bg_spirit_story"].map(k => g(k)),
    // Backgrounds — multi-layer parallax
    ...["far","mid","near"].flatMap(layer =>
      ["edo","neon","spirit"].map(zone => g(`bg_${zone}_${layer}`))),
    ...["far","mid"].map(layer => g(`bg_nightclub_${layer}`)),
    // Story characters — player poses
    ...["idle","surprised","determined","kneeling","arm"].map(s => g(`story_player_${s}`)),
    // Story characters — sensei
    ...["idle","serious","amused","walk1","walk2"].map(s => g(`story_sensei_${s}`)),
    // Story characters — shadow
    ...["idle","angry","bitter","defeated","human","walk1","walk2"].map(s => g(`story_shadow_${s}`)),
    // Story characters — elder
    ...["idle","concerned","walk1","walk2"].map(s => g(`story_elder_${s}`)),
    // Story characters — kunoichi
    ...["idle","smirk","serious","walk1","walk2"].map(s => g(`story_kunoichi_${s}`)),
    // Story characters — katsura
    ...["idle","angry"].map(s => g(`story_katsura_${s}`)),
    // Story characters — hacker
    ...["idle","walk1","walk2"].map(s => g(`story_hacker_${s}`)),
    // Story characters — fox spirit
    g("story_fox_idle"),
    // Portraits
    ...["sensei","sensei_v2","player","shadow","elder","kunoichi","katsura","hacker","fox"].map(s => g(`portrait_${s}`)),
  ];

  console.log(`[sprites] Loading ${critical.length} critical + ${deferred.length} deferred sprites`);
  // Fire deferred in background — don't await
  Promise.all(deferred).then(r => {
    const loaded = r.filter(Boolean).length;
    console.log(`[sprites] Deferred: ${loaded}/${deferred.length}`);
  }).catch(() => {});
  // Only wait for critical (with 3s timeout)
  const timeout = new Promise(r => setTimeout(() => { console.warn("[sprites] Critical timeout"); r(); }, 3000));
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
