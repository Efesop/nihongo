/**
 * Immersion scenes — contextual listening exercises.
 * User hears phrases embedded in a scene and must identify them.
 *
 * Each scene plays phrase audio clips in sequence with pauses.
 * User taps a button when they recognize a phrase they know.
 *
 * No pre-generated ambient audio needed — we play phrase audio
 * clips with scene context and timing to simulate immersion.
 */
export const IMMERSION_SCENES = [
  {
    id: "scene-restaurant",
    title: "Busy Restaurant",
    emoji: "🍜",
    description: "You're sitting in a busy restaurant. Listen carefully for phrases you know.",
    phraseIds: ["f8", "f3", "f1", "f5", "f4", "f2", "f6"],
    // Delays between phrases (ms) to simulate natural conversation pace
    delays: [2000, 2500, 3000, 2000, 3500, 2500, 2000],
    minKnown: 3, // user must know at least 3 of these to attempt
  },
  {
    id: "scene-station",
    title: "Train Station",
    emoji: "🚃",
    description: "You're at a busy train station. Can you catch the announcements?",
    phraseIds: ["g5", "t1", "t2", "t4", "t3", "g4"],
    delays: [1500, 3000, 2500, 3000, 2000, 2500],
    minKnown: 3,
  },
  {
    id: "scene-conbini",
    title: "Convenience Store",
    emoji: "🏪",
    description: "The cashier is talking to you. What are they saying?",
    phraseIds: ["s5", "s2", "s3", "g4", "s7"],
    delays: [2000, 2500, 2000, 1500, 2500],
    minKnown: 2,
  },
  {
    id: "scene-hotel",
    title: "Hotel Lobby",
    emoji: "🏨",
    description: "You hear the receptionist helping guests. Listen in.",
    phraseIds: ["g1", "h1", "h2", "h4", "h3", "g4"],
    delays: [2000, 3000, 2500, 3000, 2000, 2000],
    minKnown: 3,
  },
  {
    id: "scene-street",
    title: "Walking Around Town",
    emoji: "🗺️",
    description: "People are giving directions. Can you follow along?",
    phraseIds: ["g5", "d1", "d2", "d4", "d5", "d8"],
    delays: [1500, 2500, 2000, 2000, 2500, 2000],
    minKnown: 3,
  },
  {
    id: "scene-cafe",
    title: "Friendly Cafe Chat",
    emoji: "☕",
    description: "You overhear a conversation at a cafe. What are they talking about?",
    phraseIds: ["g1", "dl7", "dl5", "dl10", "dl4", "g4"],
    delays: [2000, 3000, 2500, 2000, 2500, 2000],
    minKnown: 3,
  },
];
