#!/usr/bin/env node
/**
 * Remove gray (#808080) backgrounds from all game sprites OFFLINE.
 * Saves cleaned PNGs so runtime doesn't need to do canvas pixel processing.
 *
 * Run: node scripts/remove-gray-bg.mjs
 *
 * - Backs up originals to archive_originals/ first (never overwrites backups)
 * - Processes all PNGs with gray bg removal
 * - Skips backgrounds (bg_*) since they don't have gray backgrounds
 * - Skips already-processed files (checks if gray pixels exist)
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, copyFileSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { createCanvas, loadImage } from '@napi-rs/canvas';

const __dir = dirname(fileURLToPath(import.meta.url));

// All sprite directories that may have gray backgrounds
const SPRITE_DIRS = [
  join(__dir, '..', 'public', 'images', 'tinysenpai', 'game'),
  join(__dir, '..', 'public', 'images', 'tinysenpai'),
  join(__dir, '..', 'public', 'images', 'oni'),
  join(__dir, '..', 'public', 'images', 'ninja'),
  join(__dir, '..', 'public', 'images', 'samurai'),
];

const BACKUP_DIR = join(__dir, '..', 'public', 'images', 'tinysenpai', 'game', 'archive_originals');

async function processFile(filePath) {
  const name = basename(filePath);

  // Skip backgrounds and archives
  if (name.startsWith('bg_') || name.startsWith('archive')) return 'skip';
  if (!name.endsWith('.png')) return 'skip';

  const img = await loadImage(filePath);
  const w = img.width;
  const h = img.height;

  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const data = ctx.getImageData(0, 0, w, h);
  const d = data.data;

  let grayCount = 0;
  let totalPixels = w * h;

  // Count gray pixels first to check if processing is needed
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i+1], b = d[i+2], a = d[i+3];
    if (a === 0) continue; // already transparent
    const avg = (r + g + b) / 3;
    const maxDiff = Math.max(Math.abs(r - avg), Math.abs(g - avg), Math.abs(b - avg));
    if (avg > 100 && maxDiff < 35) grayCount++;
  }

  // If less than 5% gray pixels, skip (already clean or not a gray-bg sprite)
  if (grayCount / totalPixels < 0.05) return 'clean';

  // Remove gray background — same algorithm as runtime sprites.js
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i+1], b = d[i+2];
    const avg = (r + g + b) / 3;
    const maxDiff = Math.max(Math.abs(r - avg), Math.abs(g - avg), Math.abs(b - avg));
    if (avg > 100 && maxDiff < 35) {
      d[i+3] = 0; // pure gray or near-gray → transparent
    } else if (avg > 90 && maxDiff < 50 && r > 80 && g > 80) {
      // Slightly tinted gray — fade out
      d[i+3] = Math.min(d[i+3], Math.max(0, (maxDiff - 25) * 10));
    }
  }

  ctx.putImageData(data, 0, 0);

  // Save as PNG buffer
  const buf = canvas.toBuffer('image/png');
  writeFileSync(filePath, buf);

  return 'processed';
}

async function main() {
  // Create backup directory
  mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`\nBacking up originals to ${BACKUP_DIR}\n`);

  let processed = 0, skipped = 0, clean = 0, backed = 0;

  for (const dir of SPRITE_DIRS) {
    if (!existsSync(dir)) continue;
    const files = readdirSync(dir).filter(f => f.endsWith('.png'));

    for (const file of files) {
      const filePath = join(dir, file);
      const backupPath = join(BACKUP_DIR, `${basename(dir)}_${file}`);

      // Backup if not already backed up
      if (!existsSync(backupPath)) {
        copyFileSync(filePath, backupPath);
        backed++;
      }

      try {
        const result = await processFile(filePath);
        if (result === 'processed') {
          console.log(`  ✓ ${file} — gray bg removed`);
          processed++;
        } else if (result === 'clean') {
          clean++;
        } else {
          skipped++;
        }
      } catch (e) {
        console.log(`  ✗ ${file} — error: ${e.message}`);
        skipped++;
      }
    }
  }

  console.log(`\nDone! Processed: ${processed}, Already clean: ${clean}, Skipped: ${skipped}, Backed up: ${backed}\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
