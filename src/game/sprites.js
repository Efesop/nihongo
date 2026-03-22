import { PAL, SCALE } from "./constants.js";

// ═══ IMAGE LOADING ═══
// Load the actual mascot PNG and use it directly — no hand-coded pixel arrays.
let _mascotImg = null;
let _mascotLoaded = false;

export function loadMascotImage() {
  return new Promise((resolve) => {
    if (_mascotLoaded) { resolve(_mascotImg); return; }
    const img = new Image();
    img.onload = () => { _mascotImg = img; _mascotLoaded = true; resolve(img); };
    img.onerror = () => { _mascotLoaded = true; resolve(null); };
    img.src = "/images/tinysenpai2.png";
  });
}

export function getMascotImage() { return _mascotImg; }

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
