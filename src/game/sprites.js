import { PAL, SCALE } from "./constants.js";

// ═══ IMAGE LOADING ═══
// Gray backgrounds removed offline. No runtime processing.
// Images load on-demand by zone to avoid OOM (225 sprites × 4MB = 900MB).
const _images = {};
const _loading = {}; // track in-flight loads to avoid duplicates

function loadImg(key, src) {
  if (_images[key]) return Promise.resolve(_images[key]);
  if (_loading[key]) return _loading[key];
  const p = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { _images[key] = img; delete _loading[key]; resolve(img); };
    img.onerror = () => { delete _loading[key]; resolve(null); };
    img.src = src;
  });
  _loading[key] = p;
  return p;
}

// Sprite spec helpers
const gs = (key) => [key, `/images/tinysenpai/game/${key}.png`];
const ps = (key, src) => [key, src];

// ═══ ZONE-BASED SPRITE DEFINITIONS ═══
// Only loaded when player reaches the relevant zone

const PLAYER_CORE = [
  ps("player", "/images/tinysenpai/idle.png"),
  ps("run1", "/images/tinysenpai/run/1.png"), ps("run2", "/images/tinysenpai/run/2.png"),
  ps("run3", "/images/tinysenpai/run/3.png"), ps("run4", "/images/tinysenpai/run/4.png"),
  ps("slash1", "/images/tinysenpai/slash/1.png"), ps("slash2", "/images/tinysenpai/slash/2.png"),
  ps("slash3", "/images/tinysenpai/slash/3.png"), ps("slash4", "/images/tinysenpai/slash/4.png"),
  ps("jump1", "/images/tinysenpai/jump/launch.png"), ps("jump2", "/images/tinysenpai/jump/airborne.png"),
  ps("fall", "/images/tinysenpai/fall.png"), ps("wallslide", "/images/tinysenpai/wallslide.png"),
  ps("dash", "/images/tinysenpai/dash.png"),
  ps("death1", "/images/tinysenpai/death/hit.png"), ps("death2", "/images/tinysenpai/death/fallen.png"),
  ps("wall_cling", "/images/tinysenpai/wall-cling.png"), ps("parry", "/images/tinysenpai/parry.png"),
  ps("land_heavy", "/images/tinysenpai/land-heavy.png"), ps("slash_through", "/images/tinysenpai/slash-through.png"),
];

const ZONE_SPRITES = {
  dojo: [
    gs("bg_dojo"), gs("bg_dojo_story"), gs("bg_dojo_night_story"),
    // Training dummies (dojo rooms 0-4)
    gs("dummy_idle"), gs("dummy_hit"), gs("dummy_dead"),
    // Oni (room 5 — the attack)
    ps("oni", "/images/oni/demon.png"), ps("oni_idle", "/images/oni/oni-idle.png"),
    ps("oni_walk1", "/images/oni/oni-walk1.png"), ps("oni_walk2", "/images/oni/oni-walk2.png"),
    ps("oni_alert", "/images/oni/oni-alert.png"), ps("oni_windup", "/images/oni/oni-windup.png"),
    ps("oni_attack", "/images/oni/oni-attack-lunge.png"), ps("oni_dazed", "/images/oni/oni-dazed.png"),
    ps("oni_hit", "/images/oni/oni-hit.png"), ps("oni_kneel", "/images/oni/oni-kneel-defeat.png"),
    ps("oni_dead", "/images/oni/oni-fallen-dead.png"),
    ps("oni_kb_back", "/images/oni/oni-knockback-back.png"), ps("oni_kb_tumble", "/images/oni/oni-knockback-tumble.png"),
    ps("oni_kb_seated", "/images/oni/oni-knockback-seated.png"),
    // Samurai (dojo boss)
    ...["idle","walk1","walk2","alert","attack","dazed","hit","windup","kb_back","kb_tumble","kb_seated"].map(s => gs(`samurai_${s}`)),
    ps("samurai_kneel", "/images/samurai/samurai-kneel.png"), ps("samurai_dead", "/images/samurai/samurai-dead.png"),
    // Ninja
    ps("ninja", "/images/ninja/ninja.png"), ps("ninja_idle", "/images/ninja/ninja-idle.png"),
    ps("ninja_walk1", "/images/ninja/ninja-walk1.png"), ps("ninja_walk2", "/images/ninja/ninja-walk2.png"),
    ps("ninja_alert", "/images/ninja/ninja-alert.png"), ps("ninja_throw", "/images/ninja/ninja-throw.png"),
    ps("ninja_retreat", "/images/ninja/ninja-retreat.png"), ps("ninja_dazed", "/images/ninja/ninja-dazed.png"),
    ps("ninja_hit", "/images/ninja/ninja-hit.png"), ps("ninja_kneel", "/images/ninja/ninja-kneel.png"),
    ps("ninja_dead", "/images/ninja/ninja-dead.png"),
    ps("ninja_kb_back", "/images/ninja/ninja-knockback-back.png"), ps("ninja_kb_tumble", "/images/ninja/ninja-knockback-tumble.png"),
    ps("ninja_kb_seated", "/images/ninja/ninja-knockback-seated.png"),
    // Story characters for dojo scenes
    gs("story_sensei_idle"), gs("story_sensei_serious"), gs("story_sensei_amused"),
    gs("story_sensei_walk1"), gs("story_sensei_walk2"),
    gs("story_player_idle"), gs("story_player_surprised"), gs("story_player_determined"),
    // Portraits
    gs("portrait_sensei"), gs("portrait_sensei_v2"), gs("portrait_player"),
  ],
  forest: [
    ps("bg_forest", "/images/forest.png"), gs("bg_forest_story"), gs("bg_temple_story"),
    // Archer
    ...["idle","alert","draw_bow","fire","retreat","dazed","hit","kneel","dead","kb_back"].map(s => gs(`archer_${s}`)),
    // Brute
    ...["idle","alert","attack","charge","exhausted","hit","kneel","dead","kb_back"].map(s => gs(`brute_${s}`)),
    // Tengu
    ...["hover","swoop","attack","dazed","hit","dead"].map(s => gs(`tengu_${s}`)),
    // Story — shadow, elder
    ...["idle","angry","bitter","walk1","walk2"].map(s => gs(`story_shadow_${s}`)),
    ...["idle","concerned","walk1","walk2"].map(s => gs(`story_elder_${s}`)),
    gs("story_player_kneeling"), gs("story_player_arm"),
    gs("portrait_shadow"), gs("portrait_elder"),
  ],
  edo: [
    gs("bg_edo_story"), ...["far","mid","near"].map(l => gs(`bg_edo_${l}`)),
    ...["idle","walk1","walk2","alert","attack","dazed","hit","kneel","dead","kb_back","kb_seated","kb_tumble"].map(s => gs(`ronin_${s}`)),
    ...["idle","smirk","serious","walk1","walk2"].map(s => gs(`story_kunoichi_${s}`)),
    ...["idle","angry"].map(s => gs(`story_katsura_${s}`)),
    gs("portrait_kunoichi"), gs("portrait_katsura"),
  ],
  neonTokyo: [
    gs("bg_neon_story"), ...["far","mid","near"].map(l => gs(`bg_neon_${l}`)),
    ...["idle","walk1","walk2","alert","attack","dazed","hit","kneel","dead","kb_back","kb_seated","kb_tumble"].map(s => gs(`cyber_ninja_${s}`)),
    ...["idle","walk1","walk2"].map(s => gs(`story_hacker_${s}`)),
    gs("portrait_hacker"),
  ],
  nightclub: [
    gs("bg_nightclub_story"), ...["far","mid"].map(l => gs(`bg_nightclub_${l}`)),
    ...["idle","walk1","walk2","alert","attack","charge","dazed","hit","kb_back","kb_seated"].map(s => gs(`bouncer_${s}`)),
  ],
  spirit: [
    gs("bg_spirit_story"), ...["far","mid","near"].map(l => gs(`bg_spirit_${l}`)),
    ...["idle","walk1","walk2","alert","attack","block","dazed","hit","kneel","dead","kb_back","kb_seated"].map(s => gs(`monk_${s}`)),
    ...["idle","alert","attack","dazed","hit","dead"].map(s => gs(`spirit_fox_${s}`)),
    ...["idle","walk1","walk2","alert","attack","dash","dazed","hit","kneel","dead","kb_back","kb_seated"].map(s => gs(`cursed_ronin_${s}`)),
    ...["defeated","human"].map(s => gs(`story_shadow_${s}`)),
    gs("story_fox_idle"), gs("portrait_fox"),
  ],
};

// Build a full registry of all known sprite paths for lazy loading
const _registry = {};
function registerSpecs(specs) {
  for (const [k, s] of specs) _registry[k] = s;
}
// Register everything
registerSpecs(PLAYER_CORE);
for (const specs of Object.values(ZONE_SPRITES)) registerSpecs(specs);

// Track which zones have been queued
const _loadedZones = new Set();

// Load sprites for a zone: ONE AT A TIME using setTimeout (not RAF)
// This prevents blocking the main thread
function loadZoneSprites(zone) {
  if (_loadedZones.has(zone)) return;
  _loadedZones.add(zone);
  const specs = ZONE_SPRITES[zone] || [];
  console.log(`[sprites] Loading zone '${zone}': ${specs.length} sprites`);
  let i = 0;
  function loadNext() {
    if (i >= specs.length) {
      console.log(`[sprites] Zone '${zone}' complete`);
      return;
    }
    const [k, s] = specs[i++];
    loadImg(k, s).then(() => setTimeout(loadNext, 10)); // 10ms gap between each
  }
  loadNext();
}

// ═══ PUBLIC API ═══

export function loadGameImages() {
  console.log("[sprites] loadGameImages called");
  const corePromises = PLAYER_CORE.map(([k, s]) => loadImg(k, s));
  console.log(`[sprites] Loading ${corePromises.length} core player sprites`);
  return Promise.all(corePromises).then(r => {
    console.log(`[sprites] Core: ${r.filter(Boolean).length}/${corePromises.length}`);
    // Start loading dojo zone one-by-one in background
    loadZoneSprites("dojo");
  });
}

export function preloadZone(zone) {
  loadZoneSprites(zone);
  const zoneOrder = ["dojo", "forest", "edo", "neonTokyo", "nightclub", "spirit"];
  const idx = zoneOrder.indexOf(zone);
  if (idx >= 0 && idx < zoneOrder.length - 1) {
    setTimeout(() => loadZoneSprites(zoneOrder[idx + 1]), 5000);
  }
}

// getImage: returns cached image, or triggers lazy load if known
export function getImage(key) {
  if (_images[key]) return _images[key];
  // Lazy load: if we know this sprite exists, start loading it
  if (_registry[key] && !_loading[key]) {
    loadImg(key, _registry[key]); // fire and forget — will be available next frame
  }
  return null;
}
export function getMascotImage() { return _images["player"] || null; }
export function loadMascotImage() { return loadGameImages(); }

// ═══ MINIMAL SPRITE DATA — only for small projectiles ═══
const SPR = {
  shuriken: ["00W00","0WWW0","WWUWW","0WWW0","00W00"],
  shuriken2: ["0WVW0","WVVVW","VVUVV","WVVVW","0WVW0"],
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
