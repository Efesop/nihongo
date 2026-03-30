#!/usr/bin/env node
/**
 * Room Background Analyzer — Pixel-level surface detection
 *
 * Scans a painted background image to find walkable surfaces by detecting
 * horizontal edges where solid ground meets open space above.
 *
 * Usage: node scripts/analyze-room-bg.mjs <image_path>
 * Example: node scripts/analyze-room-bg.mjs public/images/tinysenpai/game/rooms/room_forest_06.png
 *
 * How it works:
 * 1. Loads image and converts to brightness/edge data
 * 2. Scans for horizontal edges (bright-to-dark or dark-to-bright transitions)
 * 3. Groups nearby edge pixels into platform rectangles
 * 4. Filters by minimum width (character needs ~40px to stand)
 * 5. Outputs platform data as percentages
 */
import sharp from 'sharp';
import { resolve } from 'path';

const imagePath = process.argv[2];
if (!imagePath) {
  console.error('Usage: node scripts/analyze-room-bg.mjs <image_path>');
  process.exit(1);
}

// Game constants
const VIEW_W = 1280;
const VIEW_H = 714;
const MIN_PLATFORM_WIDTH = 40; // minimum px width for a platform
const EDGE_THRESHOLD = 30; // brightness change that indicates an edge
const MERGE_DISTANCE_X = 8; // merge edge pixels within this horizontal distance
const MERGE_DISTANCE_Y = 12; // merge platforms within this vertical distance

async function analyzeImage() {
  console.log(`🔍 Analyzing: ${imagePath}`);
  console.log(`   Target resolution: ${VIEW_W}x${VIEW_H}\n`);

  // Load and resize to game resolution
  const img = sharp(resolve(imagePath)).resize(VIEW_W, VIEW_H, { fit: 'fill' });
  const { data, info } = await img.raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  console.log(`   Loaded: ${width}x${height}, ${channels} channels`);

  // Convert to brightness map
  const brightness = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = data[i * channels];
    const g = data[i * channels + 1];
    const b = data[i * channels + 2];
    brightness[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }

  // Detect horizontal edges: scan each column top-to-bottom
  // A "platform top" is where we transition from lighter/open space to darker/solid surface
  // We look for strong vertical brightness gradients
  const edgePoints = []; // {x, y, strength}

  for (let x = 0; x < width; x++) {
    for (let y = 2; y < height - 2; y++) {
      // Compare pixels above vs below this point (3px window)
      const above = (brightness[(y - 2) * width + x] + brightness[(y - 1) * width + x]) / 2;
      const at = brightness[y * width + x];
      const below = (brightness[(y + 1) * width + x] + brightness[(y + 2) * width + x]) / 2;

      // Strong downward edge: bright above, darker below (top of solid surface)
      const edgeStrength = above - below;

      // Also check for structural edges using Sobel-like vertical gradient
      const sobelV = -brightness[Math.max(0, y - 2) * width + x]
                    + brightness[Math.min(height - 1, y + 2) * width + x];

      if (edgeStrength > EDGE_THRESHOLD && sobelV > EDGE_THRESHOLD * 0.5) {
        // Check that the area BELOW is consistently solid (not just noise)
        let solidBelow = 0;
        for (let dy = 1; dy <= 6; dy++) {
          if (y + dy < height) {
            const b = brightness[(y + dy) * width + x];
            if (b < at + 10) solidBelow++; // darker or similar = solid
          }
        }
        if (solidBelow >= 3) {
          edgePoints.push({ x, y, strength: edgeStrength });
        }
      }
    }
  }

  console.log(`   Found ${edgePoints.length} edge points`);

  // Group edge points into horizontal runs (connected platform segments)
  // Sort by y, then x
  edgePoints.sort((a, b) => a.y - b.y || a.x - b.x);

  const segments = []; // {x, y, w}

  let currentSeg = null;
  for (const pt of edgePoints) {
    if (currentSeg &&
        Math.abs(pt.y - currentSeg.y) <= MERGE_DISTANCE_Y &&
        pt.x <= currentSeg.x + currentSeg.w + MERGE_DISTANCE_X) {
      // Extend current segment
      const newRight = Math.max(currentSeg.x + currentSeg.w, pt.x + 1);
      currentSeg.w = newRight - currentSeg.x;
      currentSeg.y = Math.round((currentSeg.y + pt.y) / 2); // average y
      currentSeg.count++;
    } else {
      if (currentSeg && currentSeg.w >= MIN_PLATFORM_WIDTH) {
        segments.push(currentSeg);
      }
      currentSeg = { x: pt.x, y: pt.y, w: 1, count: 1 };
    }
  }
  if (currentSeg && currentSeg.w >= MIN_PLATFORM_WIDTH) {
    segments.push(currentSeg);
  }

  console.log(`   Grouped into ${segments.length} segments (≥${MIN_PLATFORM_WIDTH}px wide)\n`);

  // Merge overlapping/adjacent segments at similar heights
  const merged = [];
  const used = new Set();

  // Sort by area (larger first) to prioritize big platforms
  segments.sort((a, b) => b.w - a.w);

  for (let i = 0; i < segments.length; i++) {
    if (used.has(i)) continue;
    let seg = { ...segments[i] };
    used.add(i);

    for (let j = i + 1; j < segments.length; j++) {
      if (used.has(j)) continue;
      const other = segments[j];

      // Merge if vertically close and horizontally overlapping/adjacent
      if (Math.abs(seg.y - other.y) <= MERGE_DISTANCE_Y * 2) {
        const segRight = seg.x + seg.w;
        const otherRight = other.x + other.w;
        const overlap = Math.min(segRight, otherRight) - Math.max(seg.x, other.x);

        if (overlap > -MERGE_DISTANCE_X * 2) {
          // Merge
          const newX = Math.min(seg.x, other.x);
          const newRight = Math.max(segRight, otherRight);
          seg.x = newX;
          seg.w = newRight - newX;
          seg.y = Math.round((seg.y * seg.count + other.y * other.count) / (seg.count + other.count));
          seg.count += other.count;
          used.add(j);
        }
      }
    }

    merged.push(seg);
  }

  // Sort by y position (top to bottom), then x
  merged.sort((a, b) => a.y - b.y || a.x - b.x);

  // Filter out very thin segments and duplicates at similar positions
  const final = [];
  for (const seg of merged) {
    if (seg.w < MIN_PLATFORM_WIDTH) continue;

    // Skip if too close to an existing platform
    const duplicate = final.find(f =>
      Math.abs(f.y - seg.y) < 20 &&
      Math.abs(f.x - seg.x) < 30 &&
      Math.abs(f.w - seg.w) < 50
    );
    if (duplicate) continue;

    final.push(seg);
  }

  console.log(`   Final platforms: ${final.length}\n`);

  // Output results
  console.log('═══ DETECTED PLATFORMS ═══\n');
  console.log('   Pixel coordinates (for reference):');
  for (const p of final) {
    const pctX = (p.x / VIEW_W).toFixed(3);
    const pctY = (p.y / VIEW_H).toFixed(3);
    const pctW = (p.w / VIEW_W).toFixed(3);
    console.log(`   x=${p.x.toString().padStart(4)} y=${p.y.toString().padStart(3)} w=${p.w.toString().padStart(4)} | pct: x=${pctX} y=${pctY} w=${pctW} | density=${p.count}`);
  }

  console.log('\n   Percentage format for levels.js:');
  console.log('   platforms: [');
  for (const p of final) {
    const pctX = (p.x / VIEW_W).toFixed(3);
    const pctY = (p.y / VIEW_H).toFixed(3);
    const pctW = (p.w / VIEW_W).toFixed(3);
    console.log(`     { x: ${pctX}, y: ${pctY}, w: ${pctW}, pct: true }, // ${p.count} edge points`);
  }
  console.log('   ]');

  // Also output a visual ASCII map of platform positions
  console.log('\n═══ VISUAL MAP (80x40 chars) ═══\n');
  const mapW = 80, mapH = 40;
  const map = Array.from({ length: mapH }, () => Array(mapW).fill(' '));

  for (const p of final) {
    const startCol = Math.floor((p.x / VIEW_W) * mapW);
    const endCol = Math.min(mapW - 1, Math.floor(((p.x + p.w) / VIEW_W) * mapW));
    const row = Math.floor((p.y / VIEW_H) * mapH);
    if (row >= 0 && row < mapH) {
      for (let c = startCol; c <= endCol; c++) {
        if (c >= 0 && c < mapW) map[row][c] = '█';
      }
    }
  }

  // Add border
  for (let r = 0; r < mapH; r++) {
    map[r][0] = '│';
    map[r][mapW - 1] = '│';
  }
  console.log('   ┌' + '─'.repeat(mapW - 2) + '┐');
  for (const row of map) {
    console.log('   ' + row.join(''));
  }
  console.log('   └' + '─'.repeat(mapW - 2) + '┘');

  return final;
}

analyzeImage().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
