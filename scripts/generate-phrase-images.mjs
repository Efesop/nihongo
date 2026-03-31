/**
 * Generate watercolor scene images for phrases using Gemini 3.1 Flash Image Preview.
 * Each image depicts the real-world situation where the phrase would be used.
 *
 * Usage:
 *   GEMINI_API_KEY=xxx node scripts/generate-phrase-images.mjs [--all] [--ids f1,f2,t1]
 *
 * By default generates 5 test images. Use --all for all 100 phrases.
 * Use --ids to generate specific phrase IDs.
 */

import fs from "fs";
import path from "path";

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error("Set GEMINI_API_KEY"); process.exit(1); }

const MODEL = "gemini-3.1-flash-image-preview";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
const OUT_DIR = path.join(process.cwd(), "public/images/phrases/scenes");

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// ═══ PHRASE SCENE DEFINITIONS ═══
// Each phrase gets a specific scene description depicting when/where you'd use it.
// The art style matches the existing category banners: warm watercolor, ink outlines, Japanese setting.
const SCENES = {
  // Greetings
  g1: "Two people meeting and greeting on a traditional Japanese shopping street with wooden storefronts, one bowing slightly. Cherry blossom petals in the air. Daytime, warm light.",
  g2: "Early morning at a Japanese home entrance (genkan). A person in casual clothes greeting their neighbor across a low fence. Soft golden sunrise light, dewy garden.",
  g3: "A quiet Japanese residential street at dusk, paper lanterns glowing warm orange. Two people meeting near a small izakaya. Evening sky in purple-blue gradients.",
  g4: "A traveler receiving directions from a kind elderly Japanese person on a street corner. The traveler is bowing gratefully. Small shops and vending machines in background.",
  g5: "A busy Japanese train station concourse, a person politely getting someone's attention by lightly raising their hand. Crowd flowing around them. Station signs visible.",
  g6: "Close-up scene at a Japanese convenience store counter. A cashier behind the register and a customer nodding. Bright clean interior, snack shelves behind.",
  g7: "A polite refusal scene — a person gently waving their hand 'no' at an outdoor market stall. The vendor is offering samples. Colorful market goods around.",
  g8: "A person at a department store information desk, hands together in a requesting gesture. Elegant Japanese department store interior with warm lighting.",
  g9: "A person politely declining offered tea at a traditional Japanese inn (ryokan). Tatami floor, low table, sliding paper doors (shoji). Gentle, calm atmosphere.",
  g10: "Two people at a Japanese airport departure gate saying farewell. One waving. Large windows showing a plane on the tarmac. Clean, modern interior.",

  // Restaurant
  f1: "A person at a small ramen counter pointing at a dish on the illustrated menu on the wall. Steam rising from bowls. Red paper lanterns. Chef behind counter.",
  f2: "End of a meal at a cozy izakaya. A person making a writing-in-air gesture to the server. Empty plates and glasses on a wooden counter. Warm amber lighting.",
  f3: "A person seated at a Japanese restaurant table, an empty glass in front of them, gesturing politely to a passing server. Clean, minimal Japanese interior.",
  f4: "A person at a sushi counter with a big smile, hands clasped together in delight. Beautiful sushi pieces on a wooden board in front of them. Chef smiling behind counter.",
  f5: "Hands pressed together over a beautifully arranged Japanese meal — tempura, rice, miso soup, pickles. Wooden tray on a lacquered table. Warm overhead lighting.",
  f6: "A person standing up from their seat at a traditional Japanese restaurant, bowing slightly to the chef. Empty bowls stacked neatly. Noren curtain at the door.",
  f7: "A curious diner leaning toward a friendly chef at a yakitori counter, asking a question. Skewers grilling in background, smoke rising. Intimate evening atmosphere.",
  f8: "A solo traveler entering a small Japanese restaurant, holding up one finger. A hostess at the entrance with a seating chart. Noren curtain partially pulled aside.",
  f9: "Two people entering a bustling Japanese restaurant together, the host counting '2' with their fingers. Warm interior, other diners visible at tables.",
  f10: "A concerned person at a restaurant showing their phone screen to a waiter (implying allergy info). Clean modern Japanese cafe interior.",

  // Transport
  t1: "A traveler with a backpack looking at a complex Japanese train station map, another person helpfully pointing toward a platform. JR-style station signs.",
  t2: "A person at a Japanese train ticket machine, looking at the price display. The colorful route map above the machine. Other commuters rushing past.",
  t3: "Inside a Japanese train car, a passenger looking up at the LED display showing station names. Clean interior, other passengers seated quietly.",
  t4: "A confused traveler on a Japanese train platform looking at overhead signs showing transfer routes. Multiple colored train lines indicated. Platform edge visible.",
  t5: "A person getting into a Japanese taxi (white with automatic door), leaning forward to speak to the driver. City street at night, neon lights reflected on wet pavement.",
  t6: "A passenger in the back of a Japanese taxi pointing out the window at a specific building. Driver looking in rearview mirror. Urban Japanese street scene.",
  t7: "A hand tapping a Suica/PASMO card on a Japanese train gate reader. The green light glowing. Blurred commuters passing through other gates.",
  t8: "Late night at a Japanese train station, a worried traveler checking the departure board showing last train times. Platform nearly empty, fluorescent lighting.",

  // Hotel
  h1: "A traveler with luggage at a clean Japanese hotel reception desk, handing over a passport. Receptionist in uniform behind a polished counter. Modern lobby.",
  h2: "A person at a ryokan (traditional inn) check-in, speaking to a kimono-clad hostess at a wooden reception area. Flower arrangement on the counter. Warm lighting.",
  h3: "A hotel guest at the front desk in the morning, pointing at a clock. Bright lobby, suitcase nearby. Receptionist checking the computer.",
  h4: "A hotel guest in their room holding a phone, looking at the WiFi router on the desk. Modern Japanese hotel room with city view through the window.",
  h5: "A guest at the hotel front desk, the receptionist handing over a room key card. Clean, minimal Japanese hotel lobby.",
  h6: "A happy guest at the hotel desk, gesturing 'one more' with a finger. Suitcase beside them. Evening lobby lighting.",

  // Shopping
  s1: "A person in a Japanese shop holding up a small item (ceramic cup) and looking at the shopkeeper questioningly. Traditional craft shop with shelves of pottery.",
  s2: "A person at a Japanese convenience store checkout, waving off the plastic bag the cashier is about to grab. Bright fluorescent store interior, snacks on shelves.",
  s3: "A person at a Japanese store counter holding out a credit card. The cashier operating a card terminal. Clean, modern store interior.",
  s4: "A person counting out Japanese yen bills and coins at a shop counter. A small cash tray (change plate) on the counter. Items being bagged.",
  s5: "A convenience store worker holding a bento box near a microwave, looking at the customer questioningly. Bright konbini interior, food display cases.",
  s6: "A person at a Japanese street food stall pointing at two items and holding up two fingers. Taiyaki or takoyaki stall with steam rising.",
  s7: "A person at a konbini checkout waving away the receipt the cashier is about to print. Quick, efficient transaction scene.",

  // Directions
  d1: "A lost-looking traveler on a Japanese street asking a local person for directions. Traditional and modern buildings mixed. Street signs in Japanese.",
  d2: "A helpful Japanese person pointing to the right on a street corner. Clear gesture, kind expression. Intersection with a traffic light and shops.",
  d3: "A person pointing left at a Japanese intersection. A small shrine torii gate visible down the left street. Pedestrian crossing in foreground.",
  d4: "A person gesturing straight ahead down a long Japanese shopping arcade (shotengai). Covered arcade with shops on both sides, lanterns hanging.",
  d5: "Two people talking on a Japanese sidewalk, one shrugging with a 'close? far?' expression. Neighborhood with small houses and a distant temple roof.",
  d6: "A person looking down a Japanese street, considering whether to walk. A destination building visible but far in the distance. Hilly Kyoto-like terrain.",
  d7: "A person holding their phone out to a local, showing a map on screen. Both looking at the phone. Japanese park or temple grounds in background.",
  d8: "A person in a Japanese department store looking around for restroom signs. Hallway with Japanese signage. The universal restroom pictogram visible in the distance.",

  // Emergency
  e1: "A distressed person on a Japanese street reaching out for help. Concerned passerby stopping to assist. Urban setting, dramatic lighting.",
  e2: "A person looking unwell, asking a local for hospital directions. The local pointing toward a building with a red cross sign. Japanese residential area.",
  e3: "A worried person on the phone near a Japanese koban (small police box). The koban's distinctive architecture visible with its sign. Night scene.",
  e4: "A traveler approaching a Japanese information desk at a tourist spot, looking hopeful. Staff member behind the counter. Tourist pamphlets visible.",
  e5: "A confused traveler in a Japanese office or shop, hands up in a 'don't understand' gesture. The Japanese person looking patient and kind.",
  e6: "A person cupping their ear and leaning forward, asking someone to repeat themselves on a busy Japanese street. Market or shopping area background.",

  // Numbers
  n1: "A single item — one beautiful Japanese wagashi sweet — on a small ceramic plate. Minimalist presentation on a dark wooden surface.",
  n2: "Two chopsticks resting on a ceramic hashioki (chopstick rest). Simple, elegant Japanese table setting.",
  n3: "Three small cups of different Japanese tea varieties arranged in a triangle on a wooden tray. Steam rising.",
  n4: "Four folded Japanese furoshiki wrapping cloths in different colors stacked neatly.",
  n5: "Five yen coins arranged in a line on a wooden surface. The distinctive hole in each coin visible.",
  n6: "Six small Japanese ceramic dishes with different condiments/pickles arranged in two rows.",
  n7: "Seven traditional Japanese daruma dolls of increasing size arranged in a row. Red with painted faces.",
  n8: "Eight pieces of nigiri sushi arranged on a long wooden board. Each with a different fish.",
  n9: "Nine paper fortune strips (omikuji) tied to a wire at a Japanese shrine. Some fluttering in the breeze.",
  n10: "Ten fingers spread out — two hands shown against a Japanese garden backdrop. Simple counting gesture.",
  n11: "A Japanese price tag showing ¥100 at a 100-yen shop. Colorful items blurred in background.",
  n12: "A Japanese price tag showing ¥1000. A crisp thousand-yen bill (Hokusai wave) beside it.",
  n13: "A Japanese price tag showing ¥10,000. The distinctive brown ten-thousand yen bill visible.",

  // Time & Days
  tm1: "A close-up of a Japanese train station clock showing the time. The platform and tracks blurred behind it.",
  tm2: "A Japanese calendar page showing days of the week in Japanese. Cherry blossom branch in the corner. Desk setting.",
  tm3: "Early morning scene — a Japanese convenience store glowing in dawn light. Street still quiet. Clock on the storefront.",
  tm4: "A Japanese person pointing at their watch on a busy Shibuya-like intersection. Afternoon bustle around them.",
  tm5: "A Japanese wall clock in a train station showing evening time. The station quieting down as it gets late.",
  tm6: "A Monday morning scene — Japanese salarymen walking purposefully across a bridge toward office buildings. Fresh week energy.",
  tm7: "A Japanese weekend market scene — relaxed people browsing stalls on a Saturday. Tents, fresh produce, crafts. Laid-back atmosphere.",
  tm8: "A person checking their phone for the time in front of a Japanese temple. Morning light through trees.",
  tm9: "Yesterday vs today concept — a Japanese garden scene split between rain (yesterday) and sunshine (today). Poetic.",
  tm10: "Tomorrow concept — a Japanese shinkansen (bullet train) pointing forward on tracks stretching into a bright horizon. Forward motion.",

  // Daily Life
  dl1: "A person waking up and stretching in a Japanese apartment. Futon on tatami floor. Morning light through the window. Simple, cozy room.",
  dl2: "A person saying 'I'm off!' at the genkan (entrance) of a Japanese home, putting on shoes. Umbrella stand, shoe shelf visible.",
  dl3: "A person arriving home at a Japanese apartment, taking off shoes at the genkan. Warm interior light. 'Tadaima' feeling.",
  dl4: "A tired person in a Japanese office stretching at their desk. Computer screen, green tea cup, documents. Late afternoon light.",
  dl5: "A person studying Japanese at a desk in their apartment. Textbooks, flashcards, a cup of tea. Focused, determined expression.",
  dl6: "Two friends at a Japanese cafe laughing together. Matcha lattes on the table. Cozy, modern interior with plants.",
  dl7: "A person walking a dog in a Japanese neighborhood park. Cherry trees, a small pond, benches. Peaceful afternoon.",
  dl8: "A person at a Japanese supermarket looking at food labels. Colorful packaging, neat shelves. Basket in hand.",
  dl9: "A person cooking in a small Japanese kitchen. Rice cooker steaming, cutting board with vegetables. Compact but organized.",
  dl10: "A person relaxing in a Japanese onsen (hot spring). Steam rising, rocks around the pool. Mountains or garden visible. Blissful expression.",
  dl11: "A person riding a bicycle through a Japanese residential street. Houses with small gardens, power lines, a distant mountain.",
  dl12: "A person at a Japanese post office, handing a package to the clerk. Clean, organized interior with postal signs.",

  // Describing
  dc1: "A person reacting to hot weather on a Japanese summer street, fanning themselves. Cicadas implied, bright harsh sunlight, vending machines.",
  dc2: "A person bundled up in winter on a Japanese street, breath visible. Snow on rooftops, bare trees. Cold, crisp atmosphere.",
  dc3: "A person looking at an expensive item in a Japanese department store, checking the price tag with wide eyes. Luxury goods display.",
  dc4: "A person happily finding a bargain at a Japanese flea market. Holding up an item triumphantly. Colorful stalls around.",
  dc5: "A Japanese street scene with a person pointing at something far away in the distance — a mountain or distant landmark. Long road stretching ahead.",
  dc6: "Two people standing close together at a Japanese train station, one pointing at something nearby. The destination is right there, just steps away.",
  dc7: "A person looking up at a tall Japanese skyscraper or Tokyo Tower. Dramatic upward perspective. Clear blue sky.",
  dc8: "A cute Japanese scene — a person admiring a small shop cat sleeping in a sunny window. Kawaii atmosphere. Warm, gentle mood.",
  dc9: "A person looking at a beautiful Japanese garden with an expression of awe. Autumn maple leaves, carefully raked gravel, stone lantern.",
  dc10: "A lively Japanese festival scene (matsuri). People in yukata, food stalls, paper lanterns, taiko drums. Energetic, colorful, fun.",
};

// ═══ STYLE PROMPT ═══
const STYLE = `Watercolor and ink illustration in a warm Japanese art style. Soft washes of color with visible brushstrokes and ink outlines. Cream/warm white background bleeding through. The style should match traditional Japanese watercolor painting — delicate, atmospheric, with muted warm tones (soft reds, amber, sage green, dusty blue). No text, no speech bubbles, no Japanese characters. Horizontal composition (landscape orientation, roughly 16:9 aspect ratio). The scene should feel like a gentle, inviting illustration from a travel journal.`;

// ═══ GENERATION ═══
async function generateImage(phraseId, sceneDesc) {
  const prompt = `${STYLE}\n\nScene: ${sceneDesc}`;

  const outPath = path.join(OUT_DIR, `${phraseId}.png`);
  if (fs.existsSync(outPath)) {
    console.log(`  ⏭  ${phraseId} — already exists, skipping`);
    return true;
  }

  console.log(`  🎨 ${phraseId} — generating...`);

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
      console.error(`  ✗ ${phraseId} — API error ${res.status}: ${err}`);
      return false;
    }

    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imgPart = parts.find(p => p.inlineData);

    if (!imgPart) {
      console.error(`  ✗ ${phraseId} — no image in response`);
      return false;
    }

    const buf = Buffer.from(imgPart.inlineData.data, "base64");
    fs.writeFileSync(outPath, buf);
    console.log(`  ✓ ${phraseId} — saved (${Math.round(buf.length / 1024)}KB)`);
    return true;
  } catch (e) {
    console.error(`  ✗ ${phraseId} — ${e.message}${e.cause ? ' | cause: ' + e.cause : ''}`);
    if (e.cause) console.error(`     Cause:`, e.cause);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const doAll = args.includes("--all");
  const idsFlag = args.find(a => a.startsWith("--ids="));

  let ids;
  if (idsFlag) {
    ids = idsFlag.replace("--ids=", "").split(",");
  } else if (doAll) {
    ids = Object.keys(SCENES);
  } else {
    // Default: 5 test images across different categories
    ids = ["f1", "t1", "h1", "g5", "d8"];
  }

  console.log(`\n🖌  Generating ${ids.length} phrase scene images\n`);
  console.log(`   Model: ${MODEL}`);
  console.log(`   Output: ${OUT_DIR}\n`);

  let ok = 0, fail = 0;
  for (const id of ids) {
    if (!SCENES[id]) {
      console.error(`  ✗ ${id} — no scene defined, skipping`);
      fail++;
      continue;
    }
    // Rate limit + retry: wait between requests, retry once on failure
    if (ok + fail > 0) await new Promise(r => setTimeout(r, 2500));
    let success = await generateImage(id, SCENES[id]);
    if (!success) {
      console.log(`  ↻ ${id} — retrying in 5s...`);
      await new Promise(r => setTimeout(r, 5000));
      success = await generateImage(id, SCENES[id]);
    }
    if (success) ok++; else fail++;
  }

  console.log(`\n✅ Done: ${ok} generated, ${fail} failed\n`);
}

main();
