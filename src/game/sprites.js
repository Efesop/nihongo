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
    loadImg("player", "/images/tinysenpai2.png", true),
    loadImg("oni", "/images/demon.png", true),
    loadImg("ninja", "/images/ninja.png", true),
    loadImg("run1", "/images/tinysenpairun/ts1.png", true),
    loadImg("run2", "/images/tinysenpairun/ts2.png", true),
    loadImg("run3", "/images/tinysenpairun/ts3.png", true),
    loadImg("run4", "/images/tinysenpairun/ts4.png", true),
    loadImg("slash1", "/images/tinysenpaistrike/1.png", true),
    loadImg("slash2", "/images/tinysenpaistrike/2.png", true),
    loadImg("slash3", "/images/tinysenpaistrike/3.png", true),
    loadImg("slash4", "/images/tinysenpaistrike/4.png", true),
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
