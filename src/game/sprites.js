import { PAL, SCALE } from "./constants.js";

// ═══ IMAGE LOADING ═══
// Load character PNGs directly — way better than hand-coded pixel arrays.
const _images = {};

function loadImg(key, src) {
  return new Promise((resolve) => {
    if (_images[key]) { resolve(_images[key]); return; }
    const img = new Image();
    img.onload = () => { _images[key] = img; resolve(img); };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function loadGameImages() {
  return Promise.all([
    loadImg("player", "/images/tinysenpai2.png"),
    loadImg("oni", "/images/demon.png"),
    loadImg("ninja", "/images/ninja.png"),
    loadImg("bg_forest", "/images/forest.png"),
    // Add more as PNGs are created:
    // loadImg("samurai", "/images/ronin.png"),
    // loadImg("bg_temple", "/images/temple.png"),
    // loadImg("bg_neon", "/images/neon.png"),
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
