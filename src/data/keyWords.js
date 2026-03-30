/**
 * Key building block words — the vocabulary that makes phrases work.
 * Learning these individually lets users decode ANY phrase and
 * distinguish similar ones (これをください vs これはいくらですか).
 *
 * Each word: [japanese, romaji, meaning, category, phraseExamples[]]
 * Categories: question, request, pointer, verb, connector
 */
export const KEY_WORDS = [
  // ═══ Question words — the "wh-" words of Japanese ═══
  ["どこ", "doko", "where", "question", ["d1", "d8", "t1", "t4", "e2"]],
  ["なに", "nani", "what", "question", ["f7", "dl6", "tm6"]],
  ["なん", "nan", "what (before d/n)", "question", ["f7", "t3", "dl6"]],
  ["なんじ", "nanji", "what time", "question", ["n13", "t8", "h3"]],
  ["いくら", "ikura", "how much", "question", ["s1", "t2"]],
  ["だれ", "dare", "who", "question", []],
  ["いつ", "itsu", "when", "question", []],
  ["どう", "dou", "how", "question", []],

  // ═══ Request words — how to ask for things ═══
  ["ください", "kudasai", "please give / please do", "request", ["f1", "f3", "e1", "e6", "d7", "t6", "s6"]],
  ["おねがいします", "onegaishimasu", "please (formal)", "request", ["h1", "t5", "s3", "s4", "f2", "h6"]],

  // ═══ Pointer words — this, that, here, there ═══
  ["これ", "kore", "this (thing)", "pointer", ["f1", "s1", "s6", "dl4"]],
  ["それ", "sore", "that (near you)", "pointer", []],
  ["あれ", "are", "that (over there)", "pointer", []],
  ["ここ", "koko", "here", "pointer", ["t6"]],
  ["そこ", "soko", "there (near you)", "pointer", []],

  // ═══ Common verbs / verb endings ═══
  ["あります", "arimasu", "exists / I have", "verb", ["h2", "f10"]],
  ["わかります", "wakarimasu", "understand", "verb", ["dl8"]],
  ["わかりません", "wakarimasen", "don't understand", "verb", ["e5"]],
  ["たべたい", "tabetai", "want to eat", "verb", ["dl1"]],
  ["のみたい", "nomitai", "want to drink", "verb", ["dl2"]],
  ["いきたい", "ikitai", "want to go", "verb", ["dl3"]],
  ["みせて", "misete", "show me", "verb", ["d7"]],

  // ═══ Key nouns that appear across many phrases ═══
  ["えき", "eki", "station", "noun", ["t1", "t3"]],
  ["みず", "mizu", "water", "noun", ["f3"]],
  ["トイレ", "toire", "toilet", "noun", ["d8"]],
  ["おかんじょう", "okanjou", "the bill", "noun", ["f2"]],
  ["よやく", "yoyaku", "reservation", "noun", ["h2"]],
  ["しゅうでん", "shuuden", "last train", "noun", ["t8"]],
  ["カード", "kaado", "card", "noun", ["s3"]],
  ["げんきん", "genkin", "cash", "noun", ["s4"]],

  // ═══ Particles (reinforcement — also in grammar patterns) ═══
  ["は", "wa", "about... / speaking of...", "particle", ["s1", "d8", "t8", "s2"]],
  ["を", "o", "the thing I want/need", "particle", ["f1", "f3", "d7", "e3"]],
  ["が", "ga", "what exists / who does it", "particle", ["h2", "f10", "dl4"]],
  ["で", "de", "by / with / at", "particle", ["s3", "s4", "t6"]],
  ["の", "no", "'s (possessive)", "particle", ["t3", "h4"]],
  ["から", "kara", "from", "particle", ["dl7"]],
  ["まで", "made", "to / until", "particle", ["t2", "t5"]],
  ["も", "mo", "also / even", "particle", ["dl9"]],

  // ═══ Descriptors ═══
  ["おおきい", "ookii", "big", "descriptor", ["dc1"]],
  ["ちいさい", "chiisai", "small", "descriptor", ["dc2"]],
  ["たかい", "takai", "expensive / tall", "descriptor", ["dc3"]],
  ["やすい", "yasui", "cheap", "descriptor", ["dc4"]],
  ["あつい", "atsui", "hot", "descriptor", ["dc5"]],
  ["さむい", "samui", "cold", "descriptor", ["dc6"]],
  ["ちかい", "chikai", "close / nearby", "descriptor", ["dc7", "d5"]],
  ["とおい", "tooi", "far", "descriptor", ["dc8"]],

  // ═══ Time words ═══
  ["きょう", "kyou", "today", "time", ["tm1"]],
  ["あした", "ashita", "tomorrow", "time", ["tm2"]],
  ["きのう", "kinou", "yesterday", "time", ["tm3"]],
  ["いま", "ima", "now", "time", ["tm4"]],
];

// Category colors and labels for the UI
export const WORD_CATS = {
  question: { label: "Question word", color: "#ff9800" },
  request: { label: "Request", color: "#4caf50" },
  pointer: { label: "Pointer", color: "#5a9ec4" },
  verb: { label: "Verb", color: "#4caf50" },
  noun: { label: "Noun", color: "#5a9ec4" },
  particle: { label: "Particle", color: "#c49a5a" },
  descriptor: { label: "Describing", color: "#c45a9e" },
  time: { label: "Time", color: "#5a7ec4" },
};
