#!/usr/bin/env node
/**
 * AI-Powered Room Designer
 *
 * Analyzes a painted background image and generates a complete room definition
 * with physics-validated platforms, smart enemy placement, and navigation graph.
 *
 * Usage: GEMINI_API_KEY=key node scripts/design-room.mjs <background_image> [room_number]
 * Example: GEMINI_API_KEY=key node scripts/design-room.mjs public/images/tinysenpai/game/rooms/room_forest_06.png 7
 *
 * What it does:
 * 1. Sends the background to Gemini Vision to detect walkable surfaces
 * 2. Calculates player physics (jump height, dash distance, etc.)
 * 3. Validates that every platform is reachable
 * 4. Places enemies intelligently based on level design rules
 * 5. Outputs a complete room definition for levels.js
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ═══ GAME PHYSICS CONSTANTS (from constants.js) ═══
const GRAVITY = 1800;
const MOVE_SPEED = 280;
const JUMP_FORCE = -560;
const DASH_SPEED = 700;
const DASH_DURATION = 0.23; // 230ms in seconds
const TILE = 20;
const SCALE = 3;
const PLAYER_H = TILE * SCALE; // 60px player height

// ═══ PHYSICS CALCULATIONS ═══
// Max jump height: v²/(2g) where v = |JUMP_FORCE|
const MAX_JUMP_HEIGHT = (JUMP_FORCE * JUMP_FORCE) / (2 * GRAVITY); // ~87px
// Time to apex: v/g
const TIME_TO_APEX = Math.abs(JUMP_FORCE) / GRAVITY; // ~0.31s
// Total airtime (up + down same height): 2 * time_to_apex
const TOTAL_AIRTIME = TIME_TO_APEX * 2; // ~0.62s
// Max horizontal distance during jump: speed * airtime
const MAX_JUMP_DISTANCE = MOVE_SPEED * TOTAL_AIRTIME; // ~174px
// Dash distance: speed * duration
const DASH_DISTANCE = DASH_SPEED * DASH_DURATION; // ~161px
// Wall jump: 0.9x jump force, 1.6x horizontal speed
const WALL_JUMP_HEIGHT = (JUMP_FORCE * 0.9) ** 2 / (2 * GRAVITY); // ~70px
const WALL_JUMP_HORIZONTAL = MOVE_SPEED * 1.6 * TIME_TO_APEX; // ~139px

// For percentage-based rooms (1280x714 viewport)
const VIEW_W = 1280;
const VIEW_H = 714;

function pxToPct(px, total) { return Math.round((px / total) * 1000) / 1000; }
function pctToPx(pct, total) { return pct * total; }

// Can the player jump from platform A to platform B?
function canReach(a, b) {
  // A and B are {x, y, w, h} in pixels
  const aCenter = a.x + a.w / 2;
  const bCenter = b.x + b.w / 2;
  const horizontalDist = Math.abs(aCenter - bCenter) - a.w / 2 - b.w / 2;
  const verticalDist = a.y - b.y; // positive = B is higher

  // Can walk to it (same height, overlapping or adjacent)
  if (Math.abs(verticalDist) < 20 && horizontalDist < 10) return { method: "walk", cost: 1 };

  // Can jump to it
  const maxReachUp = MAX_JUMP_HEIGHT;
  const maxReachHoriz = MAX_JUMP_DISTANCE + DASH_DISTANCE; // jump + dash combo
  if (verticalDist > 0 && verticalDist < maxReachUp && horizontalDist < maxReachHoriz) {
    return { method: "jump", cost: 2 };
  }

  // Can fall to it (B is lower)
  if (verticalDist < 0 && horizontalDist < maxReachHoriz) {
    return { method: "fall", cost: 1 };
  }

  // Can dash-jump to it (extended horizontal)
  if (verticalDist > 0 && verticalDist < maxReachUp * 0.7 && horizontalDist < maxReachHoriz * 1.3) {
    return { method: "dash-jump", cost: 3 };
  }

  return null; // unreachable
}

// ═══ GEMINI VISION ANALYSIS ═══
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error('Set GEMINI_API_KEY env var'); process.exit(1); }

const imagePath = process.argv[2];
const roomNum = parseInt(process.argv[3] || '7');
if (!imagePath) { console.error('Usage: node scripts/design-room.mjs <image_path> [room_number]'); process.exit(1); }

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const imageData = readFileSync(resolve(imagePath)).toString('base64');
const mimeType = imagePath.endsWith('.jpg') ? 'image/jpeg' : 'image/png';

const ANALYSIS_PROMPT = `You are analyzing a pixel art game background for a 2D side-scrolling action game. The image is ${VIEW_W}x${VIEW_H} pixels.

I need you to identify EVERY walkable surface in this image. A walkable surface is any horizontal-ish area where a character could stand: stone paths, tree branches, wooden platforms, bridges, cliff ledges, shrine floors, rooftops, etc.

For EACH walkable surface, provide:
- A descriptive name (e.g. "left ground path", "burning log bridge", "upper shrine ledge")
- The bounding box as pixel coordinates: x (left edge), y (TOP of the surface where feet would land), width, height (usually 10-20px for thin platforms)
- Whether it's a solid wall (vertical surface for wall-jumping) or a platform (horizontal surface for standing)

Also identify any VERTICAL surfaces suitable for wall-running/wall-jumping (tree trunks, cliff faces, pillars).

IMPORTANT:
- Be precise with coordinates. The image is exactly ${VIEW_W}x${VIEW_H}.
- y=0 is the TOP of the image, y=${VIEW_H} is the bottom.
- Include ALL surfaces, even small ones.
- A character is about 60px tall, so surfaces need to be at least ~40px wide to stand on.
- Look carefully at stone paths, branches, ledges, rooftops, bridges.

Respond in this EXACT JSON format (no markdown, no code blocks, just raw JSON):
{
  "platforms": [
    { "name": "description", "x": 0, "y": 0, "w": 100, "h": 16, "type": "ground" },
    { "name": "description", "x": 0, "y": 0, "w": 100, "h": 16, "type": "platform" }
  ],
  "walls": [
    { "name": "description", "x": 0, "y": 0, "w": 30, "h": 200, "type": "wall" }
  ],
  "spawn_suggestion": { "x": 0, "y": 0, "reason": "..." },
  "navigation_notes": "How a player would traverse this level from bottom to top"
}`;

async function analyzeImage() {
  console.log('🔍 Sending background to Gemini Vision for surface analysis...');
  console.log(`   Image: ${imagePath} (${VIEW_W}x${VIEW_H})`);
  console.log('   (This may take 15-30 seconds)\n');

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [
        { inlineData: { mimeType, data: imageData } },
        { text: ANALYSIS_PROMPT },
      ] }],
      generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
    }),
  });

  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.error('No response from Gemini:', JSON.stringify(json).slice(0, 500));
    process.exit(1);
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    // Try to extract JSON from response
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    console.error('Failed to parse Gemini response:', text.slice(0, 500));
    process.exit(1);
  }
}

function validateNavigation(platforms, walls) {
  console.log('📐 PHYSICS VALIDATION');
  console.log(`   Max jump height: ${MAX_JUMP_HEIGHT.toFixed(0)}px (${pxToPct(MAX_JUMP_HEIGHT, VIEW_H).toFixed(3)} pct)`);
  console.log(`   Max jump distance: ${MAX_JUMP_DISTANCE.toFixed(0)}px (${pxToPct(MAX_JUMP_DISTANCE, VIEW_W).toFixed(3)} pct)`);
  console.log(`   Dash distance: ${DASH_DISTANCE.toFixed(0)}px (${pxToPct(DASH_DISTANCE, VIEW_W).toFixed(3)} pct)`);
  console.log(`   Wall jump height: ${WALL_JUMP_HEIGHT.toFixed(0)}px`);
  console.log(`   Wall jump horizontal: ${WALL_JUMP_HORIZONTAL.toFixed(0)}px`);
  console.log(`   Player height: ${PLAYER_H}px\n`);

  // Build navigation graph
  console.log('🗺️  NAVIGATION GRAPH');
  const allPlatforms = platforms.filter(p => p.type !== 'wall');

  for (let i = 0; i < allPlatforms.length; i++) {
    const from = allPlatforms[i];
    const reachable = [];
    for (let j = 0; j < allPlatforms.length; j++) {
      if (i === j) continue;
      const result = canReach(from, allPlatforms[j]);
      if (result) reachable.push({ to: allPlatforms[j].name, ...result });
    }
    console.log(`   ${from.name} (${from.x},${from.y} ${from.w}w):`);
    if (reachable.length === 0) {
      console.log(`     ⚠️  ISOLATED — no reachable platforms!`);
    } else {
      for (const r of reachable) {
        console.log(`     → ${r.to} (${r.method})`);
      }
    }
  }

  // Check wall-jump connectivity
  if (walls.length > 0) {
    console.log(`\n   Wall-jumpable surfaces: ${walls.map(w => w.name).join(', ')}`);
    console.log(`   Wall-run can reach ~${(WALL_JUMP_HEIGHT * 3).toFixed(0)}px above grab point (multiple jumps)`);
  }

  return allPlatforms;
}

function placeEnemies(platforms) {
  console.log('\n⚔️  ENEMY PLACEMENT');
  const enemies = [];

  // Sort platforms by height (top to bottom)
  const sorted = [...platforms].sort((a, b) => a.y - b.y);

  // Design rules:
  // - Ninjas go on elevated positions (they throw shurikens down)
  // - Oni go on wide platforms (they need space to charge)
  // - At least one enemy per major platform
  // - 6-8 enemies total for a mid-game room
  // - No enemies at spawn point
  // - Boss/hard enemies at the highest point

  for (const plat of sorted) {
    if (plat.w < 50) continue; // too narrow for enemies

    const platCenterX = plat.x + plat.w / 2;
    const platTopY = plat.y - PLAYER_H; // enemy stands ON platform
    const isHigh = plat.y < VIEW_H * 0.4;
    const isWide = plat.w > 200;

    if (isHigh) {
      // High platforms get ninjas (they throw down)
      enemies.push({
        type: 'ninja',
        x: pxToPct(platCenterX, VIEW_W),
        y: pxToPct(platTopY, VIEW_H),
        platform: plat.name,
        reason: 'elevated position — throws shurikens down'
      });
      // If wide enough, add an oni guard too
      if (isWide) {
        enemies.push({
          type: 'oni',
          x: pxToPct(plat.x + plat.w * 0.25, VIEW_W),
          y: pxToPct(platTopY, VIEW_H),
          platform: plat.name,
          reason: 'wide platform — space for oni charge'
        });
      }
    } else if (isWide) {
      // Wide low platforms get oni patrol
      enemies.push({
        type: 'oni',
        x: pxToPct(plat.x + plat.w * 0.3, VIEW_W),
        y: pxToPct(platTopY, VIEW_H),
        platform: plat.name,
        reason: 'wide ground — oni patrol'
      });
      // Add a second if very wide
      if (plat.w > 350) {
        enemies.push({
          type: 'oni',
          x: pxToPct(plat.x + plat.w * 0.7, VIEW_W),
          y: pxToPct(platTopY, VIEW_H),
          platform: plat.name,
          reason: 'wide ground — second oni for crossfire'
        });
      }
    } else {
      // Medium platforms get one oni
      enemies.push({
        type: 'oni',
        x: pxToPct(platCenterX, VIEW_W),
        y: pxToPct(platTopY, VIEW_H),
        platform: plat.name,
        reason: 'medium platform — single guard'
      });
    }
  }

  // Cap at 8 enemies, keep the most interesting ones
  const final = enemies.slice(0, 8);

  for (const e of final) {
    console.log(`   ${e.type} at (${e.x.toFixed(3)}, ${e.y.toFixed(3)}) on "${e.platform}" — ${e.reason}`);
  }

  return final;
}

function generateRoomDefinition(analysis, enemies, roomNumber) {
  const allSurfaces = [...(analysis.platforms || []), ...(analysis.walls || [])];

  // Convert to game format
  const platforms = [];

  for (const s of analysis.platforms || []) {
    const p = {
      x: pxToPct(s.x, VIEW_W),
      y: pxToPct(s.y, VIEW_H),
      w: pxToPct(s.w, VIEW_W),
      pct: true,
    };
    if (s.type === 'oneWay') p.oneWay = true;
    platforms.push({ ...p, _name: s.name });
  }

  for (const w of analysis.walls || []) {
    platforms.push({
      x: pxToPct(w.x, VIEW_W),
      y: pxToPct(w.y, VIEW_H),
      w: pxToPct(w.w, VIEW_W),
      h: pxToPct(w.h, VIEW_H),
      wall: true,
      pct: true,
      _name: w.name,
    });
  }

  // Add invisible edge walls
  platforms.push({ x: 0, y: 0, w: 0.015, h: 1.0, wall: true, pct: true, _name: 'left edge wall' });
  platforms.push({ x: 0.985, y: 0, w: 0.015, h: 1.0, wall: true, pct: true, _name: 'right edge wall' });

  // Format output
  console.log('\n\n═══════════════════════════════════════');
  console.log('  GENERATED ROOM DEFINITION');
  console.log('═══════════════════════════════════════\n');

  console.log('// Paste this into levels.js:\n');
  console.log('{');
  console.log(`  title: { jp: "天空", en: "Sky Path" },`);
  console.log(`  theme: "forest",`);
  console.log(`  background: "room_forest_06",`);
  console.log('  platforms: [');
  for (const p of platforms) {
    const extras = [];
    if (p.wall) extras.push('wall: true');
    if (p.h) extras.push(`h: ${p.h}`);
    if (p.oneWay) extras.push('oneWay: true');
    extras.push('pct: true');
    const comment = p._name ? ` // ${p._name}` : '';
    console.log(`    { x: ${p.x}, y: ${p.y}, w: ${p.w}${p.h ? ', h: ' + p.h : ''}, ${extras.filter(e => e !== `h: ${p.h}`).join(', ')} },${comment}`);
  }
  console.log('  ],');
  console.log('  hazards: [],');
  console.log('  enemies: [');
  for (const e of enemies) {
    console.log(`    { type: "${e.type}", x: ${e.x.toFixed(3)}, y: ${e.y.toFixed(3)} }, // ${e.platform}: ${e.reason}`);
  }
  console.log('  ],');
  console.log('  shadows: [],');
  console.log('  playerStart: 100,');
  console.log('  hideSpots: [');
  console.log('    { type: "tallGrass", x: 0.06, y: 0.86, w: 0.06, pct: true },');
  console.log('  ],');
  console.log('  deco: [],');
  console.log('  breakables: [],');
  console.log('},');
}

// ═══ MAIN ═══
(async () => {
  console.log('🎮 ROOM DESIGNER — AI-Powered Level Design\n');
  console.log(`   Designing Room ${roomNum} from: ${imagePath}\n`);

  // Step 1: AI Vision Analysis
  const analysis = await analyzeImage();

  console.log(`\n🎨 DETECTED SURFACES:`);
  for (const p of (analysis.platforms || [])) {
    console.log(`   📦 ${p.name}: x=${p.x} y=${p.y} w=${p.w} h=${p.h} (${p.type})`);
  }
  for (const w of (analysis.walls || [])) {
    console.log(`   🧱 ${w.name}: x=${w.x} y=${w.y} w=${w.w} h=${w.h}`);
  }
  if (analysis.spawn_suggestion) {
    console.log(`   🏠 Spawn: (${analysis.spawn_suggestion.x}, ${analysis.spawn_suggestion.y}) — ${analysis.spawn_suggestion.reason}`);
  }
  if (analysis.navigation_notes) {
    console.log(`   🗺️  Navigation: ${analysis.navigation_notes}`);
  }

  // Step 2: Physics Validation
  const validPlatforms = validateNavigation(
    analysis.platforms || [],
    analysis.walls || []
  );

  // Step 3: Enemy Placement
  const enemies = placeEnemies(validPlatforms);

  // Step 4: Generate Room Definition
  generateRoomDefinition(analysis, enemies, roomNum);

  console.log('\n✅ Done! Review the output above and paste into levels.js.');
  console.log('   Then test with ?room=' + roomNum + ' and F2 debug overlay.');
})();
