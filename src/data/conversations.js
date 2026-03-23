// Mini conversation scenarios with blanks for fill-in-the-blank exercises
// Each conversation has a setting, lines of dialogue, and blanks to fill
// blank: { position, correct: phraseId, options: [phraseId, ...] }

export const CONVERSATIONS = [
  {
    id: "restaurant1",
    setting: "You walk into a restaurant...",
    icon: "🍜",
    lines: [
      { speaker: "staff", text: "いらっしゃいませ！" , translation: "Welcome!" },
      { speaker: "you", blank: true, correctId: "f8", options: ["f8", "f1", "g5", "g8"] },
      { speaker: "staff", text: "こちらへどうぞ。", translation: "This way please." },
      { speaker: "you", blank: true, correctId: "g4", options: ["g4", "g10", "g7", "f4"] },
      { speaker: "staff", text: "ご注文は？", translation: "Your order?" },
      { speaker: "you", blank: true, correctId: "f1", options: ["f1", "f2", "f3", "s1"] },
    ]
  },
  {
    id: "restaurant2",
    setting: "You've finished eating...",
    icon: "🍜",
    lines: [
      { speaker: "you", blank: true, correctId: "f6", options: ["f6", "f5", "f4", "g4"] },
      { speaker: "you", blank: true, correctId: "f2", options: ["f2", "f1", "f3", "s3"] },
      { speaker: "staff", text: "3,500円です。", translation: "That'll be 3,500 yen." },
      { speaker: "you", blank: true, correctId: "s3", options: ["s3", "s4", "s1", "g8"] },
    ]
  },
  {
    id: "hotel1",
    setting: "You arrive at your hotel...",
    icon: "🏨",
    lines: [
      { speaker: "you", blank: true, correctId: "g5", options: ["g5", "g1", "g4", "g10"] },
      { speaker: "you", blank: true, correctId: "h1", options: ["h1", "h2", "h3", "g8"] },
      { speaker: "staff", text: "お名前は？", translation: "Your name?" },
      { speaker: "you", blank: true, correctId: "h2", options: ["h2", "h1", "h4", "h6"] },
    ]
  },
  {
    id: "directions1",
    setting: "You're lost and need to find the station...",
    icon: "🗺️",
    lines: [
      { speaker: "you", blank: true, correctId: "g5", options: ["g5", "g1", "g8", "e4"] },
      { speaker: "you", blank: true, correctId: "t1", options: ["t1", "d1", "d8", "t2"] },
      { speaker: "local", text: "あ、まっすぐ行って、みぎです。", translation: "Ah, go straight, then right." },
      { speaker: "you", blank: true, correctId: "g4", options: ["g4", "g5", "g1", "d5"] },
    ]
  },
  {
    id: "shopping1",
    setting: "You're at a convenience store...",
    icon: "🏪",
    lines: [
      { speaker: "staff", text: "いらっしゃいませ！", translation: "Welcome!" },
      { speaker: "you", blank: true, correctId: "s1", options: ["s1", "s6", "f1", "f3"] },
      { speaker: "staff", text: "200円です。", translation: "200 yen." },
      { speaker: "you", blank: true, correctId: "s2", options: ["s2", "s3", "s4", "s7"] },
      { speaker: "staff", text: "ありがとうございます！", translation: "Thank you!" },
    ]
  },
  {
    id: "emergency1",
    setting: "You need help...",
    icon: "🆘",
    lines: [
      { speaker: "you", blank: true, correctId: "g5", options: ["g5", "g1", "e1", "e4"] },
      { speaker: "you", blank: true, correctId: "e4", options: ["e4", "e5", "e6", "g1"] },
      { speaker: "local", text: "少しだけ...", translation: "Just a little..." },
      { speaker: "you", blank: true, correctId: "e6", options: ["e6", "e5", "e4", "g8"] },
    ]
  },
];
