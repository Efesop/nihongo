#!/usr/bin/env node
/**
 * Regenerate phrase scene images that don't match their phrases.
 * Uses the same Gemini API as generate-phrase-images.mjs.
 *
 * Usage:
 *   GEMINI_API_KEY=xxx node scripts/generate-scene-images.mjs              # All 38
 *   GEMINI_API_KEY=xxx node scripts/generate-scene-images.mjs --bad-only   # Worst 14
 *   GEMINI_API_KEY=xxx node scripts/generate-scene-images.mjs --ids=dl1,dl12,dc5
 */

import fs from "fs";
import path from "path";

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error("Set GEMINI_API_KEY"); process.exit(1); }

const MODEL = "gemini-3.1-flash-image-preview";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
const OUT_DIR = path.join(process.cwd(), "public/images/phrases/scenes");
const BACKUP_DIR = path.join(OUT_DIR, "backup");

const STYLE = `Watercolor and ink illustration in a warm Japanese art style. Soft washes of color with visible brushstrokes and ink outlines. Cream/warm white background bleeding through. The style should match traditional Japanese watercolor painting — delicate, atmospheric, with muted warm tones (soft reds, amber, sage green, dusty blue). No text, no speech bubbles, no Japanese characters. Horizontal composition (landscape orientation, roughly 16:9 aspect ratio). The scene should feel like a gentle, inviting illustration from a travel journal.`;

// ═══ IMAGES TO REGENERATE ═══
// Each prompt is designed to create a clear visual association with the phrase meaning.
const REGEN = {
  // ══════════ BAD — completely wrong image (14) ══════════
  dl1:  { phrase: "I want to eat", priority: "bad",
    scene: "A young traveler in Japan standing outside a row of izakaya restaurants at dusk, looking longingly at the food displays in the windows, hand on their belly showing hunger. Warm lantern light spilling from the restaurants, delicious food visible in display cases." },

  dl2:  { phrase: "I want to drink", priority: "bad",
    scene: "A thirsty traveler on a hot summer day in Japan, wiping sweat from their forehead, reaching toward a colorful Japanese vending machine full of drinks. Bright sunshine, the person looks parched and eager." },

  dl3:  { phrase: "I want to go", priority: "bad",
    scene: "A person at a scenic overlook in Japan, pointing excitedly toward a beautiful distant mountain temple across a valley, with a travel backpack on. Their expression shows strong desire and wanderlust to visit that place." },

  dl4:  { phrase: "I like this", priority: "bad",
    scene: "A person in a Japanese craft shop holding up a beautiful ceramic tea cup with both hands, face lit up with delight and admiration, showing it to a smiling shopkeeper. Clear love for the item." },

  dl7:  { phrase: "Where are you from?", priority: "bad",
    scene: "Two people at a Japanese izakaya bar having a friendly conversation, one person pointing at a small world map posted on the wall while asking the other where they're from. Warm casual bar lighting, drinks on the counter." },

  dl8:  { phrase: "I understand", priority: "bad",
    scene: "A person in Japan having a clear lightbulb moment of comprehension — nodding with sudden understanding, while a Japanese person explains something with hand gestures. Relief and 'aha!' on their face." },

  dl9:  { phrase: "Can I take a photo?", priority: "bad",
    scene: "A tourist holding up a camera politely, making a questioning gesture toward a beautiful Japanese temple gate (torii), looking at a nearby shrine attendant for permission. Camera clearly visible in hands." },

  dl10: { phrase: "It's fun / I'm having fun", priority: "bad",
    scene: "A person at a lively Japanese summer matsuri festival, laughing joyfully while playing a goldfish scooping game (kingyo sukui), surrounded by festive food stalls with colorful paper lanterns. Pure happiness." },

  dl12: { phrase: "I'm hungry", priority: "bad",
    scene: "A person sitting on a park bench in Japan, clutching their growling stomach with both hands, eyes closed in hunger, while the delicious smell of nearby yakitori wafts from a food cart visible in the background." },

  tm2:  { phrase: "Tomorrow", priority: "bad",
    scene: "A person in a Japanese room at night, packing a bag and looking at a calendar on the wall with tomorrow's date circled. Moonlight through the window, excited anticipation for tomorrow's plans." },

  tm5:  { phrase: "Later", priority: "bad",
    scene: "A person at a Japanese train station waving goodbye to a friend while pointing at their watch, suggesting 'see you later!' The friend is walking away waving back. A 'see you soon' parting moment." },

  tm7:  { phrase: "Monday", priority: "bad",
    scene: "A Japanese Monday morning commuter scene — businesspeople in suits walking toward a train station entrance, some yawning, carrying briefcases. Start-of-work-week energy, early morning light." },

  tm10: { phrase: "Every day", priority: "bad",
    scene: "A montage-style scene showing the same person's daily routine in Japan — morning walk, buying coffee from a konbini, sitting at a familiar park bench — all in one image suggesting comforting daily repetition." },

  dc2:  { phrase: "Small", priority: "bad",
    scene: "A person in a traditional Japanese shop holding a tiny delicate miniature figurine (netsuke) between their fingertips, marveling at how incredibly small and detailed it is. Exaggerated size contrast between large hand and tiny object." },

  dc5:  { phrase: "Hot (weather)", priority: "bad",
    scene: "A person in Japan on a blazing hot summer day, fanning themselves desperately with a folding fan (sensu), visible sweat, harsh bright sunlight. Heat shimmer rising from the pavement. Scorching summer atmosphere." },

  // ══════════ WEAK — too generic to help learning (24) ══════════
  g5:   { phrase: "Excuse me / sorry", priority: "weak",
    scene: "A person accidentally bumping into someone on a crowded Japanese train platform, bowing apologetically with a sheepish sorry expression. The other person looking back. Busy station environment." },

  g6:   { phrase: "Yes", priority: "weak",
    scene: "A person at a Japanese restaurant nodding enthusiastically with a clear smile, giving a definite 'yes' to a waiter who is pointing at a menu item. Positive affirmation is the clear focus." },

  g7:   { phrase: "No", priority: "weak",
    scene: "A person politely waving both hands in front of them in the classic Japanese 'no no' refusal gesture, declining something offered by a friendly street vendor. Clear, gentle refusal body language." },

  d5:   { phrase: "Is it close?", priority: "weak",
    scene: "A tired traveler with a suitcase asking a local for directions. The local holds thumb and index finger close together indicating 'very close!' while pointing at a building just barely visible nearby." },

  e5:   { phrase: "I don't understand Japanese", priority: "weak",
    scene: "A confused foreign traveler at a Japanese train ticket machine surrounded by all-Japanese signs and text, looking bewildered with a helpless expression. A kind Japanese person approaching to help." },

  e6:   { phrase: "Please say that again", priority: "weak",
    scene: "A person leaning forward and cupping their ear toward a Japanese shopkeeper who is speaking, with a polite 'sorry, one more time please?' expression. The speaker gestures as if repeating patiently." },

  n9:   { phrase: "Nine", priority: "weak",
    scene: "Nine colorful Japanese daruma dolls arranged in a clear 3x3 grid pattern on a wooden shrine shelf, each a different vivid color. The number nine is immediately obvious from counting. Close-up view." },

  tm1:  { phrase: "Today", priority: "weak",
    scene: "A person in a Japanese room looking out a bright sunny window with energy and purpose. A calendar on the wall with today's date circled in bold red. Present-moment focus, morning energy." },

  tm3:  { phrase: "Yesterday", priority: "weak",
    scene: "A person sitting at a Japanese café looking nostalgically at photos on their phone from yesterday's adventure — the phone screen shows a temple visit. Yesterday's ticket stub on the café table. Looking-back mood." },

  tm4:  { phrase: "Now", priority: "weak",
    scene: "A person urgently checking their watch at a Japanese train platform with a train pulling in right now — capturing the immediate 'right now, this moment!' urgency. Clock showing the time prominently." },

  tm6:  { phrase: "What day is it?", priority: "weak",
    scene: "A jetlagged traveler in a Japanese hotel room looking confused at a calendar on the desk, scratching their head trying to figure out what day of the week it is. Disoriented expression." },

  tm9:  { phrase: "Night/evening", priority: "weak",
    scene: "A beautiful Japanese city alley at night — warm neon signs glowing, paper lanterns lit along a narrow street, a person walking under the lights. Stars and crescent moon visible in the dark sky above." },

  dl6:  { phrase: "What's your job?", priority: "weak",
    scene: "Two people at a Japanese business event exchanging business cards (meishi) with both hands in the traditional manner, professional attire. One person is looking curiously at the other's card, reading their job title." },

  dl11: { phrase: "I'm tired", priority: "weak",
    scene: "An exhausted traveler slumped on a bench at a quiet Japanese train station at night, head drooping with heavy eyelids, backpack beside them. Pure physical exhaustion visible. Other commuters walking past." },

  dc1:  { phrase: "Big", priority: "weak",
    scene: "A person standing at the base of the Great Buddha (Daibutsu) in Kamakura, looking absolutely tiny in comparison, craning their neck up at the enormous bronze statue. Dramatic size contrast — big is unmistakable." },

  dc3:  { phrase: "Expensive / tall", priority: "weak",
    scene: "A person in a fancy Japanese department store looking shocked at a price tag on a luxury item in an elegant glass display case, eyes wide, hand over mouth. The sticker-shock reaction is unmistakable." },

  dc4:  { phrase: "Cheap", priority: "weak",
    scene: "A delighted person at a Japanese 100-yen shop (Daiso) with arms full of items, grinning at the amazingly low prices. Prominent 100 yen price signs everywhere. Bargain-hunting happiness." },

  dc7:  { phrase: "Far", priority: "weak",
    scene: "A person standing on a Japanese hilltop, shielding their eyes from the sun while looking at something very far in the distance — a tiny town barely visible on the horizon. The vast distance is the main subject." },

  dc8:  { phrase: "Close/nearby", priority: "weak",
    scene: "A relieved traveler on a Japanese street being told by a helpful local that their destination is right there — the local pointing at a building literally steps away. Relief on the traveler's face." },

  dc9:  { phrase: "New", priority: "weak",
    scene: "A person excitedly holding up a brand new purchase at a Japanese electronics store, still in shiny pristine packaging with a visible price tag. Fresh, unused, just-bought excitement." },

  dc10: { phrase: "Old (things, not people)", priority: "weak",
    scene: "A person in a Japanese antique shop admiring a weathered, ancient-looking ceramic vase covered in beautiful patina and age marks. Dust motes floating in a sunbeam. The history and age of the objects is palpable." },
};

// ═══ GENERATION ═══
async function generateImage(id, config) {
  const outPath = path.join(OUT_DIR, `${id}.png`);
  const prompt = `${STYLE}\n\nScene: ${config.scene}`;

  // Back up existing image (never delete assets)
  if (fs.existsSync(outPath)) {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
    fs.copyFileSync(outPath, path.join(BACKUP_DIR, `${id}.png`));
  }

  console.log(`  🎨 ${id} — "${config.phrase}" [${config.priority}]`);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`  ✗ ${id} — API error ${res.status}: ${err.slice(0, 200)}`);
      return false;
    }

    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imgPart = parts.find(p => p.inlineData);

    if (!imgPart) {
      console.error(`  ✗ ${id} — no image in response`);
      return false;
    }

    const buf = Buffer.from(imgPart.inlineData.data, "base64");
    fs.writeFileSync(outPath, buf);
    console.log(`  ✓ ${id} — saved (${Math.round(buf.length / 1024)}KB)`);
    return true;
  } catch (e) {
    console.error(`  ✗ ${id} — ${e.message}`);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const badOnly = args.includes("--bad-only");
  const idsFlag = args.find(a => a.startsWith("--ids="));

  let entries = Object.entries(REGEN);

  if (idsFlag) {
    const ids = idsFlag.replace("--ids=", "").split(",");
    entries = entries.filter(([id]) => ids.includes(id));
  } else if (badOnly) {
    entries = entries.filter(([, c]) => c.priority === "bad");
  }

  const bad = entries.filter(([, c]) => c.priority === "bad").length;
  const weak = entries.filter(([, c]) => c.priority === "weak").length;

  console.log(`\n🖌  Regenerating ${entries.length} phrase scene images\n`);
  console.log(`   Model: ${MODEL}`);
  console.log(`   ❌ Bad:  ${bad}`);
  console.log(`   ⚠️  Weak: ${weak}`);
  console.log(`   Output: ${OUT_DIR}`);
  console.log(`   Backup: ${BACKUP_DIR}\n`);

  let ok = 0, fail = 0;
  for (const [id, config] of entries) {
    if (ok + fail > 0) await new Promise(r => setTimeout(r, 2500));
    let success = await generateImage(id, config);
    if (!success) {
      console.log(`  ↻ ${id} — retrying in 5s...`);
      await new Promise(r => setTimeout(r, 5000));
      success = await generateImage(id, config);
    }
    if (success) ok++; else fail++;
  }

  console.log(`\n✅ Done: ${ok} generated, ${fail} failed out of ${entries.length}\n`);
  if (fail > 0) {
    console.log(`Re-run failed ones with: --ids=id1,id2,...\n`);
  }
}

main();
