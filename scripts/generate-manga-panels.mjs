#!/usr/bin/env node
/**
 * Generate manga-style panel images for graded reader stories.
 * Each story gets a single wide panel showing the scene with speech bubbles.
 *
 * Usage:
 *   GEMINI_API_KEY=xxx node scripts/generate-manga-panels.mjs
 *   GEMINI_API_KEY=xxx node scripts/generate-manga-panels.mjs --ids=gs1,gs4
 *   GEMINI_API_KEY=xxx node scripts/generate-manga-panels.mjs --force   # regenerate all
 */

import fs from "fs";
import path from "path";
import { GRADED_STORIES } from "../src/data/gradedStories.js";

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error("Set GEMINI_API_KEY"); process.exit(1); }

const MODEL = "gemini-3.1-flash-image-preview";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
const OUT_DIR = path.join(process.cwd(), "public/images/graded");
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const STYLE = `Watercolor and ink manga panel illustration in a warm Japanese art style. Soft washes of color with visible brushstrokes and ink outlines. Cream/warm white background bleeding through. The style matches traditional Japanese watercolor painting — delicate, atmospheric, with muted warm tones (soft reds, amber, sage green, dusty blue). NO TEXT, NO SPEECH BUBBLES, NO JAPANESE CHARACTERS, NO WRITTEN WORDS of any kind. Horizontal composition (landscape, 16:9). Show the characters and setting clearly so a language learner can understand the scene context visually.`;

// Scene descriptions for each graded story
const STORY_SCENES = {
  gs1: {
    title: "First Morning in Tokyo",
    scene: "A young Western traveler at a cozy Japanese hotel breakfast area in the morning, bowing politely to a friendly hotel staff member who is serving coffee. Warm morning light streaming through windows, cherry blossoms visible outside. The traveler looks grateful and fresh-faced. Traditional Japanese breakfast items visible on the table.",
  },
  gs2: {
    title: "At the Convenience Store",
    scene: "Interior of a bright, clean Japanese convenience store (konbini). A Western traveler at the checkout counter handing items to a friendly clerk in uniform. The clerk is holding up a plastic bag with a questioning expression. Shelves of colorful snacks and drinks visible behind them. Warm fluorescent lighting.",
  },
  gs3: {
    title: "Lunch at the Ramen Shop",
    scene: "A small cozy ramen shop counter in Japan. A solo Western traveler sitting on a stool at the counter, pointing at a menu while a chef in a headband stands behind the counter near steaming pots. A bowl of ramen and a glass of water on the counter. Warm steam and red lanterns.",
  },
  gs4: {
    title: "Restaurant for Two",
    scene: "A welcoming Japanese restaurant entrance. Two Western travelers being greeted by a bowing restaurant host/staff. The restaurant interior is visible behind — warm wood tones, paper lanterns, a fish display case. One traveler holds up two fingers. Cozy evening atmosphere.",
  },
  gs5: {
    title: "Finding the Station",
    scene: "A Western traveler on a Japanese street asking directions from a kind elderly local. The traveler looks slightly lost, holding a phone. The local is pointing straight ahead down a tree-lined street where a train station is barely visible in the distance. Afternoon light, typical Japanese residential street.",
  },
  gs6: {
    title: "Taxi to the Hotel",
    scene: "A Japanese taxi (clean white sedan with open rear door) with a traveler getting in. Through the windshield, a hotel is visible in the distance. The driver is turning back with a polite smile. Cherry blossom-lined street, evening golden hour light.",
  },
  gs7: {
    title: "Shopping in Akihabara",
    scene: "A traveler in a colorful Akihabara electronics/anime shop, holding up two items comparing prices. One item has a clearly expensive look (fancy box), the other is simpler/cheaper. A patient shop clerk watches. Bright store with shelves of figurines and gadgets.",
  },
  gs8: {
    title: "Buying Souvenirs",
    scene: "A traveler at a Japanese souvenir shop counter, pointing at cute traditional souvenirs (daruma dolls, fans, charms). The clerk is wrapping two items in tissue paper. Cash visible on the counter. Warm shop interior with hanging decorations.",
  },
  gs9: {
    title: "Making Friends at a Café",
    scene: "Two people at a small Japanese café table — a Western traveler and a friendly Japanese person having an animated conversation. The traveler is gesturing enthusiastically. Coffee cups on the table. A small world map doodle on a napkin between them. Cozy café atmosphere with plants and warm lighting.",
  },
  gs10: {
    title: "A Long Day in Kyoto",
    scene: "A tired but happy traveler slumped on a bench in front of a beautiful Kyoto temple gate (torii). They're holding their stomach and looking toward a nearby food stall with steam rising from it. Golden hour light, temple garden in background. Expression of exhaustion mixed with hunger.",
  },
  gs11: {
    title: "Lost in Shinjuku",
    scene: "A confused Western traveler in the middle of busy Shinjuku at night, looking at their phone with a worried expression. A kind Japanese passerby has stopped and is leaning in to help, pointing at something on the phone screen. Neon signs blurred in the background, busy crosswalk.",
  },
  gs12: {
    title: "A Full Day: Morning to Night",
    scene: "A split-scene showing morning and evening in Japan — left side has warm sunrise with a person waking up stretching, right side has the same person at an izakaya at night with a beer, both connected by a winding Japanese street. Day-to-night gradient across the image.",
  },
  gs13: {
    title: "The Perfect Restaurant Visit",
    scene: "A panoramic view of a complete Japanese restaurant experience — a traveler being seated, ordering from a menu, eating tempura with chopsticks (saying itadakimasu), and paying at the register — suggested through a single warm scene of a restaurant interior with the traveler mid-meal, staff nearby, bill on table.",
  },
  gs14: {
    title: "Weather Talk",
    scene: "Two people standing outside in Japan, looking up at the sky. One is fanning themselves in the heat (it's clearly hot and sunny). The other points toward dark clouds on the horizon suggesting cold weather coming. A contrast of hot present and cold future in one image.",
  },
  gs15: {
    title: "Exploring a New City",
    scene: "A traveler on a Japanese street corner looking around at multiple signs — one pointing right toward a restroom symbol, another left toward a convenience store (konbini). A helpful local is gesturing directions. Clean Japanese cityscape, pedestrian-friendly street.",
  },
};

async function generateImage(id, config) {
  const outPath = path.join(OUT_DIR, `${id}.png`);

  if (!process.argv.includes("--force") && fs.existsSync(outPath)) {
    console.log(`  · ${id} — exists, skip`);
    return true;
  }

  const prompt = `${STYLE}\n\nScene: ${config.scene}`;
  console.log(`  🎨 ${id} — "${config.title}"`);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
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
  // Parse --ids filter
  const idsArg = process.argv.find(a => a.startsWith("--ids="));
  const filterIds = idsArg ? idsArg.split("=")[1].split(",") : null;

  const entries = Object.entries(STORY_SCENES)
    .filter(([id]) => !filterIds || filterIds.includes(id));

  console.log(`\n🎬 Generating ${entries.length} manga panels for graded readers…\n`);

  let ok = 0, fail = 0;
  for (const [id, config] of entries) {
    const success = await generateImage(id, config);
    if (success) ok++; else fail++;
    // Rate limit — 1.5s between requests
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n✅ Done! ${ok} generated, ${fail} failed.`);
  console.log(`   Output: public/images/graded/\n`);
}

main().catch(e => { console.error("\n❌", e.message); process.exit(1); });
