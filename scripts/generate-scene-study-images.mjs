#!/usr/bin/env node
/**
 * Generate manga-panel illustrations for every Scene Study (SCENE_STUDIES).
 *
 * Style: watercolor + ink brushstroke, warm Japanese palette, no text,
 * matches existing TinySenpai scene-illustration style.
 * Outputs to: public/images/scenes/ss{N}.jpg
 *
 * Usage:
 *   GEMINI_API_KEY=xxx node scripts/generate-scene-study-images.mjs           # All 25
 *   GEMINI_API_KEY=xxx node scripts/generate-scene-study-images.mjs ss1 ss3   # Specific IDs
 *
 * Cost: ~25 × $0.03 = ~$0.75 total via Gemini 2.5 Flash Image.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dir, "..");

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error("Set GEMINI_API_KEY env var"); process.exit(1); }

const MODEL = "gemini-3.1-flash-image-preview";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
const OUT_DIR = path.join(ROOT, "public/images/scenes");
fs.mkdirSync(OUT_DIR, { recursive: true });

const STYLE = `Watercolor and ink illustration in a warm Japanese art style. Soft washes of color with visible brushstrokes and delicate ink outlines. Cream/warm-white background bleeding through. Muted warm palette — soft reds, amber, sage green, dusty blue. No text, no speech bubbles, no Japanese characters, no letters. Horizontal composition (16:9 landscape). The scene should feel like a gentle, inviting illustration from a travel journal — atmospheric, nostalgic, inviting. Focus on setting and mood rather than character faces.`;

// Per-scene prompts tuned to the scenario.
const PROMPTS = {
  ss1:  "Interior of a small Japanese ramen shop at night, steam rising from a bowl on a wooden counter, red noren curtain visible at entrance, warm amber lantern light, one empty stool next to a seated customer's silhouette, a chef in a white headband visible through a serving window.",
  ss2:  "A young traveler waiting near the Hachiko statue at Shibuya station exit, light rain falling, umbrellas, neon billboards reflecting off wet pavement in the background, a friend approaching with an apologetic wave.",
  ss3:  "Inside a modern Japanese convenience store (conbini) at night, rows of colorful bento boxes and onigiri under bright fluorescent light, a clerk at the counter with a slight bow, warm microwaved dinner steam rising from a plastic tray.",
  ss4:  "A cozy Japanese cafe interior, two ceramic coffee cups on a wooden table, a slice of cake on a plate, large window with soft afternoon light, potted plants, two chairs facing each other across the table.",
  ss5:  "Two friends browsing a 100-yen shop aisle together, shelves packed with colorful ceramic bowls, plushies, snacks, one holding up a cute mug to show the other, bright fluorescent overhead lighting, festive atmosphere.",
  ss6:  "A foreign tourist with a map and backpack standing on a narrow residential Tokyo side street, asking an elderly local who is pointing down the road, quiet neighborhood, potted plants by house entrances, late afternoon shadows.",
  ss7:  "Two friends walking under a single umbrella down a Japanese neighborhood street on a humid summer afternoon, cicadas visible in the trees, heat shimmer above the pavement, they are chatting about the weather, back view.",
  ss8:  "Two friends at a cafe table with a notebook and phone showing a Tokyo map, planning a weekend trip, coffee cups half-empty, the Shibuya skyline visible through the window, bright cheerful atmosphere.",
  ss9:  "Interior of a traditional Japanese onsen bath house, wooden walls, steam rising off the water, warm wooden buckets by a tap, a small mountain scene painted on the back wall, a tall bottle of sake sitting on the tiled edge.",
  ss10: "A modern Japanese apartment in the evening, a tired figure slumped at a low kotatsu table with books scattered, a friend bringing a cup of tea to them, warm paper-lamp light, soft autumn atmosphere.",

  ss11: "Front desk of a traditional Japanese ryokan hotel, polished wooden counter, a staff member in kimono bowing while handing over a room key, a neat suitcase beside a guest, shoji screens and a flower arrangement in the background.",
  ss12: "Interior of a Japanese taxi at night, back seat view with the white-gloved driver's silhouette in front, Tokyo neon lights streaking past the window, small digital meter glowing on the dash, immaculate lace seat covers.",
  ss13: "A formal Japanese restaurant reception area, a hostess in apron holding a reservation book behind a sleek wooden podium, warm pendant lighting, a glimpse of a dining room with white tablecloths behind her.",
  ss14: "Interior of a Japanese pharmacy (yakkyoku), clean white shelves stocked with colorful medicine boxes, a pharmacist in white coat handing a small paper bag across the counter to a customer, bright professional lighting.",
  ss15: "Interior of a small Japanese police box (koban), a uniformed officer seated at a simple wooden desk taking notes from a distressed-looking tourist, bulletin board covered in maps and notices, late-afternoon light through the window.",
  ss16: "A foreign tourist on a tree-lined quiet Tokyo street asking an elderly local in a cardigan for directions, map unfolded between them, the local pointing down a side street, afternoon dappled sunlight through cherry-tree leaves.",
  ss17: "A modern JR Shinkansen ticket booth, a polite attendant behind a glass window handing a ticket, signs in stylized characters, a traveler with a rolling suitcase, beige station architecture, warm morning light.",
  ss18: "Interior of a small private clinic examination room in Japan, a doctor in a white coat sitting across from a patient on a consultation chair, medical charts on the wall, crisp daylight from a window, reassuring atmosphere.",
  ss19: "Waiting area of an embassy consulate, a traveler filling out paperwork at a desk, official-looking room with flags and seals, a clerk behind bulletproof glass offering a clipboard, nervous but hopeful atmosphere.",
  ss20: "Interior of an elegant upscale Tokyo restaurant, dim mood lighting, a waiter in a black vest presenting a wine list at a beautifully set table for two, candles, a skyline view through floor-to-ceiling windows.",

  ss21: "Inside a bustling izakaya at night, a polite waiter taking an order at a wooden counter, the customer's hand holding up two fingers (ordering two beers), smoke and light from yakitori grills, colorful lanterns.",
  ss22: "A young couple in a small Tokyo shop picking out cute trinkets together, giggling as they hold up matching items, shopkeeper smiling behind the counter, cheerful cluttered shelves.",
  ss23: "An elderly woman running a small traditional wagashi sweet shop, handing a paper-wrapped mochi to a young customer across a glass counter full of colorful seasonal sweets, wooden beams and a kettle steaming in the background.",
  ss24: "Front entrance of a Tokyo apartment, a tenant at the door talking with the landlord in work clothes carrying a toolbox, broken air conditioner visible inside the apartment through the open door, late afternoon light.",
  ss25: "Pediatrician or general clinic office, a kindly doctor sitting on a rolling stool across from a young patient on an exam table, the doctor making a reassuring hand gesture, bright medical equipment arranged neatly, soft warm colors.",
};

async function main() {
  const argIds = process.argv.slice(2).filter(a => /^ss\d+/.test(a));
  const ids = argIds.length ? argIds : Object.keys(PROMPTS);

  // Cross-check against actual SCENE_STUDIES
  const { SCENE_STUDIES } = await import(path.join(ROOT, "src/data/sceneStudies.js"));
  const byId = Object.fromEntries(SCENE_STUDIES.map(s => [s.id, s]));

  for (const id of ids) {
    const scene = byId[id];
    const specificPrompt = PROMPTS[id];
    if (!scene || !specificPrompt) { console.warn(`  ⚠ skipping ${id} — not found`); continue; }

    const outPath = path.join(OUT_DIR, `${id}.jpg`);
    if (fs.existsSync(outPath) && !process.env.FORCE) { console.log(`  · ${id}.jpg already exists (set FORCE=1 to overwrite)`); continue; }

    const fullPrompt = `${specificPrompt}\n\nStyle: ${STYLE}`;
    console.log(`\n  ${id} — ${scene.title} [${scene.register}]`);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { responseModalities: ["IMAGE"] },
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        console.error(`    ✗ ${res.status}: ${err.slice(0, 200)}`);
        continue;
      }
      const data = await res.json();
      const b64 = data?.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      if (!b64) { console.error("    ✗ no image in response"); continue; }
      fs.writeFileSync(outPath, Buffer.from(b64, "base64"));
      console.log(`    ✓ ${outPath.replace(ROOT + "/", "")}`);
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.error(`    ✗ ${e.message}`);
    }
  }

  console.log("\n✅ Done.");
}

main().catch(e => { console.error(e); process.exit(1); });
