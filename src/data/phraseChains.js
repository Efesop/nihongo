/**
 * Phrase Chains — connected speech scenarios where the user chains
 * multiple phrases in the correct conversational order.
 *
 * Each chain is a real-world scenario sequence. The user sees the
 * situation context and must pick the right phrase for each step.
 * Getting the ORDER right is the exercise — not just knowing individual phrases.
 *
 * Format:
 *   id: unique chain ID
 *   title: scenario title
 *   emoji: scene emoji
 *   description: brief scenario setup
 *   requires: minimum phrase IDs needed (all must be box >= 1)
 *   steps: ordered array of { context, correctId, distractorIds }
 *     context = what's happening right now (English)
 *     correctId = the right phrase for this moment
 *     distractorIds = wrong phrases to show as options
 */
export const PHRASE_CHAINS = [
  // ── RESTAURANT: Full meal flow ──
  {
    id: "chain-restaurant-solo",
    title: "Solo Restaurant Visit",
    emoji: "🍜",
    description: "You walk into a ramen shop alone. Complete each step of the meal.",
    requires: ["f8", "f3", "f1", "f5", "f4", "f2", "f6"],
    steps: [
      { context: "Staff asks how many people", correctId: "f8", distractorIds: ["f9", "g6", "g8"] },
      { context: "You sit down and want water", correctId: "f3", distractorIds: ["f1", "f4", "dl2"] },
      { context: "You're ready to order from the menu", correctId: "f1", distractorIds: ["f7", "f3", "s1"] },
      { context: "Your food arrives — time to eat!", correctId: "f5", distractorIds: ["f4", "f6", "g4"] },
      { context: "The ramen is amazing", correctId: "f4", distractorIds: ["f5", "g9", "dl10"] },
      { context: "You're done and want to pay", correctId: "f2", distractorIds: ["f6", "s3", "g8"] },
      { context: "Leaving the restaurant", correctId: "f6", distractorIds: ["g10", "g4", "f2"] },
    ],
  },
  {
    id: "chain-restaurant-duo",
    title: "Dinner for Two",
    emoji: "🍣",
    description: "You and a friend arrive at a sushi restaurant. Navigate the whole experience.",
    requires: ["f9", "f7", "f1", "f3", "f5", "f2", "f6"],
    steps: [
      { context: "Staff greets you — how many?", correctId: "f9", distractorIds: ["f8", "g6", "g1"] },
      { context: "You want a recommendation", correctId: "f7", distractorIds: ["f1", "s1", "f3"] },
      { context: "You've decided — point at the menu", correctId: "f1", distractorIds: ["f7", "s6", "f3"] },
      { context: "You also need water", correctId: "f3", distractorIds: ["dl2", "f1", "f4"] },
      { context: "Food arrives — before eating", correctId: "f5", distractorIds: ["f4", "f6", "g8"] },
      { context: "Time to pay", correctId: "f2", distractorIds: ["s3", "f6", "g4"] },
      { context: "Thank the chef as you leave", correctId: "f6", distractorIds: ["g4", "g10", "f2"] },
    ],
  },

  // ── SHOPPING: Convenience store / shop flow ──
  {
    id: "chain-conbini",
    title: "Convenience Store Run",
    emoji: "🏪",
    description: "You pop into a konbini to buy a snack and a drink.",
    requires: ["s1", "s2", "s3", "g4"],
    steps: [
      { context: "You find something interesting — check the price", correctId: "s1", distractorIds: ["f1", "g5", "s6"] },
      { context: "Cashier scans your items — you don't want a bag", correctId: "s2", distractorIds: ["s7", "g9", "g7"] },
      { context: "Time to pay — you'll use card", correctId: "s3", distractorIds: ["s4", "g8", "f2"] },
      { context: "Transaction complete", correctId: "g4", distractorIds: ["g10", "g8", "g9"] },
    ],
  },
  {
    id: "chain-shopping",
    title: "Souvenir Shopping",
    emoji: "🛍️",
    description: "You're buying gifts in a department store.",
    requires: ["g5", "s1", "s6", "s4", "s7", "g4"],
    steps: [
      { context: "Get the clerk's attention", correctId: "g5", distractorIds: ["g1", "g8", "g6"] },
      { context: "Ask how much the item costs", correctId: "s1", distractorIds: ["s6", "f1", "f7"] },
      { context: "You want two of them", correctId: "s6", distractorIds: ["f9", "s1", "f1"] },
      { context: "Pay with cash", correctId: "s4", distractorIds: ["s3", "f2", "g8"] },
      { context: "Decline the receipt", correctId: "s7", distractorIds: ["s2", "g9", "g7"] },
      { context: "Thank them as you leave", correctId: "g4", distractorIds: ["g10", "g8", "f6"] },
    ],
  },

  // ── HOTEL: Check-in flow ──
  {
    id: "chain-hotel-checkin",
    title: "Hotel Check-in",
    emoji: "🏨",
    description: "You arrive at your hotel after a long flight. Check in and get settled.",
    requires: ["g1", "h1", "h2", "h4", "g4"],
    steps: [
      { context: "Approach the front desk", correctId: "g1", distractorIds: ["g2", "g3", "g5"] },
      { context: "Tell them you want to check in", correctId: "h1", distractorIds: ["h2", "h3", "g8"] },
      { context: "Confirm your reservation", correctId: "h2", distractorIds: ["h1", "h6", "h3"] },
      { context: "You need the WiFi password", correctId: "h4", distractorIds: ["h5", "h3", "h6"] },
      { context: "All set — thank the receptionist", correctId: "g4", distractorIds: ["g10", "g8", "g9"] },
    ],
  },

  // ── TRANSPORT: Train journey ──
  {
    id: "chain-train",
    title: "Taking the Train",
    emoji: "🚃",
    description: "You need to get across Tokyo by train. Navigate from station to destination.",
    requires: ["g5", "t1", "t2", "t4", "g4"],
    steps: [
      { context: "You need to find the right station", correctId: "t1", distractorIds: ["d1", "t4", "t3"] },
      { context: "Check how much the ticket costs", correctId: "t2", distractorIds: ["s1", "t1", "n13"] },
      { context: "On the train — where to change?", correctId: "t4", distractorIds: ["t3", "t1", "t6"] },
      { context: "Arrived safely — thank the helper", correctId: "g4", distractorIds: ["g10", "g8", "g5"] },
    ],
  },
  {
    id: "chain-taxi",
    title: "Taxi Ride",
    emoji: "🚕",
    description: "You need a taxi to your hotel. Give directions and pay.",
    requires: ["t5", "t6", "s3", "g4"],
    steps: [
      { context: "Tell the driver your destination", correctId: "t5", distractorIds: ["t1", "d1", "t4"] },
      { context: "You see your hotel — stop here!", correctId: "t6", distractorIds: ["t5", "g5", "d4"] },
      { context: "Pay by card", correctId: "s3", distractorIds: ["s4", "f2", "g8"] },
      { context: "Thank the driver", correctId: "g4", distractorIds: ["g10", "g5", "g9"] },
    ],
  },

  // ── DIRECTIONS: Getting around ──
  {
    id: "chain-lost",
    title: "Finding the Toilet",
    emoji: "🗺️",
    description: "You desperately need to find a toilet in a shopping mall.",
    requires: ["g5", "d8", "d2", "d4", "g4"],
    steps: [
      { context: "Get someone's attention", correctId: "g5", distractorIds: ["g1", "g8", "e4"] },
      { context: "Ask where the toilet is", correctId: "d8", distractorIds: ["d1", "t1", "e2"] },
      { context: "They say turn right then...", correctId: "d4", distractorIds: ["d2", "d3", "d5"] },
      { context: "Thank them!", correctId: "g4", distractorIds: ["g10", "g9", "g8"] },
    ],
  },

  // ── EMERGENCY: Getting help ──
  {
    id: "chain-emergency",
    title: "Language Barrier",
    emoji: "🆘",
    description: "You're lost and can't understand anyone. Time to get creative.",
    requires: ["g5", "e5", "e4", "e6", "d7"],
    steps: [
      { context: "Approach someone for help", correctId: "g5", distractorIds: ["g1", "e1", "g8"] },
      { context: "Explain you don't understand Japanese", correctId: "e5", distractorIds: ["e4", "e6", "g9"] },
      { context: "Ask if they speak English", correctId: "e4", distractorIds: ["e5", "e6", "dl5"] },
      { context: "They try Japanese again — ask to repeat", correctId: "e6", distractorIds: ["e5", "e4", "g5"] },
      { context: "Show them your phone map", correctId: "d7", distractorIds: ["d1", "d8", "s1"] },
    ],
  },

  // ── DAILY LIFE: Making friends ──
  {
    id: "chain-new-friend",
    title: "Meeting Someone New",
    emoji: "🌸",
    description: "You meet a friendly local at a cafe. Have a basic conversation.",
    requires: ["g1", "dl7", "dl5", "dl4", "dl10"],
    steps: [
      { context: "Start with a greeting", correctId: "g1", distractorIds: ["g2", "g3", "g5"] },
      { context: "They ask where you're from — ask them back", correctId: "dl7", distractorIds: ["dl6", "dl5", "dl9"] },
      { context: "Tell them what you're studying", correctId: "dl5", distractorIds: ["dl8", "dl4", "dl6"] },
      { context: "You're enjoying the conversation", correctId: "dl10", distractorIds: ["dl11", "g9", "dl4"] },
    ],
  },

  // ── NUMBERS + TIME: Practical scenarios ──
  {
    id: "chain-time-day",
    title: "Planning Tomorrow",
    emoji: "⏰",
    description: "You're talking about your plans for today and tomorrow.",
    requires: ["tm1", "tm2", "tm4", "dl3", "dl1"],
    steps: [
      { context: "Talk about today", correctId: "tm1", distractorIds: ["tm2", "tm3", "tm4"] },
      { context: "You want to go somewhere now", correctId: "dl3", distractorIds: ["dl1", "dl2", "dl4"] },
      { context: "Then talk about tomorrow's plans", correctId: "tm2", distractorIds: ["tm1", "tm3", "tm5"] },
      { context: "Tomorrow you want to eat something special", correctId: "dl1", distractorIds: ["dl2", "dl3", "dl4"] },
    ],
  },
];
