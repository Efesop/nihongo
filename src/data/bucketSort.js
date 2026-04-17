// Bucket-sort exercises: sort Japanese words into function buckets.
// 4 variants: particle, question-word, politeness, part-of-speech.
// Each variant returns { title, subtitle, buckets, words } ready for render.

import { PHRASE_BREAKDOWNS } from "./phraseBreakdowns.js";
import { shuffle } from "../utils/helpers.js";

// ═══ VARIANT 1: PARTICLES ═══
// Most common particles + their grammatical function.
const PARTICLE_BUCKETS = [
  { id: "topic", label: "Topic", hint: "marks what the sentence is about" },
  { id: "object", label: "Object", hint: "marks the thing acted on" },
  { id: "subject", label: "Subject", hint: "marks who/what does the action" },
  { id: "location", label: "At / By / With", hint: "place of action, means" },
  { id: "possessive", label: "Possessive / of", hint: "connects nouns" },
  { id: "question", label: "Question", hint: "turns a sentence into a question" },
  { id: "to", label: "To / Until", hint: "destination or limit" },
];

const PARTICLE_WORDS = [
  { jp: "は", romaji: "wa", en: "topic marker", bucket: "topic" },
  { jp: "を", romaji: "o", en: "direct object marker", bucket: "object" },
  { jp: "が", romaji: "ga", en: "subject marker", bucket: "subject" },
  { jp: "で", romaji: "de", en: "at / by / with", bucket: "location" },
  { jp: "の", romaji: "no", en: "'s (possessive)", bucket: "possessive" },
  { jp: "か", romaji: "ka", en: "question marker", bucket: "question" },
  { jp: "まで", romaji: "made", en: "to / until", bucket: "to" },
];

// ═══ VARIANT 2: QUESTION WORDS ═══
const QUESTION_BUCKETS = [
  { id: "where", label: "Where" },
  { id: "what", label: "What" },
  { id: "howmuch", label: "How much" },
  { id: "when", label: "When / What time" },
  { id: "who", label: "Who" },
  { id: "how", label: "How" },
];

const QUESTION_WORDS = [
  { jp: "どこ", romaji: "doko", en: "where", bucket: "where" },
  { jp: "なに", romaji: "nani", en: "what", bucket: "what" },
  { jp: "なん", romaji: "nan", en: "what (before です/じ)", bucket: "what" },
  { jp: "いくら", romaji: "ikura", en: "how much (price)", bucket: "howmuch" },
  { jp: "なんじ", romaji: "nanji", en: "what time", bucket: "when" },
  { jp: "いつ", romaji: "itsu", en: "when", bucket: "when" },
  { jp: "だれ", romaji: "dare", en: "who", bucket: "who" },
  { jp: "どう", romaji: "dou", en: "how", bucket: "how" },
];

// ═══ VARIANT 3: POLITENESS ═══
const POLITENESS_BUCKETS = [
  { id: "request", label: "Request / Please" },
  { id: "pleasegive", label: "Please give me" },
  { id: "excuse", label: "Excuse me / Sorry" },
  { id: "thanks", label: "Thanks" },
  { id: "booster", label: "Polite booster" },
  { id: "copula", label: "Is / am (polite)" },
];

const POLITENESS_WORDS = [
  { jp: "おねがいします", romaji: "onegaishimasu", en: "please (for requests)", bucket: "request" },
  { jp: "ください", romaji: "kudasai", en: "please give me", bucket: "pleasegive" },
  { jp: "すみません", romaji: "sumimasen", en: "excuse me / sorry", bucket: "excuse" },
  { jp: "ありがとう", romaji: "arigatou", en: "thank you", bucket: "thanks" },
  { jp: "ございます", romaji: "gozaimasu", en: "makes previous word more polite", bucket: "booster" },
  { jp: "です", romaji: "desu", en: "polite 'is / am'", bucket: "copula" },
];

// ═══ VARIANT 4: PART OF SPEECH ═══
// Built dynamically from PHRASE_BREAKDOWNS of known phrases.
const POS_BUCKETS = [
  { id: "noun", label: "Noun", hint: "thing / person / place" },
  { id: "verb", label: "Verb", hint: "action" },
  { id: "particle", label: "Particle", hint: "grammar glue" },
  { id: "copula", label: "Copula", hint: "is / was" },
  { id: "adjective", label: "Adjective", hint: "describes" },
];

// POS tags we expose to the user (collapse counter → noun for simplicity).
const POS_MAP = {
  noun: "noun",
  verb: "verb",
  particle: "particle",
  copula: "copula",
  adjective: "adjective",
  counter: "noun",
};

function buildPosWords(knownPhraseIds) {
  const seen = new Set();
  const out = [];
  for (const id of knownPhraseIds) {
    const bd = PHRASE_BREAKDOWNS[id];
    if (!bd) continue;
    for (const [jp, romaji, en, type] of bd) {
      if (!jp || jp === "..." || jp === "/ ") continue;
      const bucket = POS_MAP[type];
      if (!bucket) continue;
      const key = jp;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ jp, romaji, en, bucket });
    }
  }
  return out;
}

// ═══ PUBLIC API ═══
// Returns {variant, title, subtitle, buckets, words} or null if not enough data.
export function buildBucketSort({ phrasesLearned, knownPhraseIds = [], variant }) {
  // Pick variant if not given — bias toward particle (highest value).
  if (!variant) {
    const pool = [];
    if (phrasesLearned >= 5) pool.push("particle", "particle"); // weight 2
    if (phrasesLearned >= 5) pool.push("question");
    if (phrasesLearned >= 3) pool.push("politeness");
    if (phrasesLearned >= 6) pool.push("pos");
    if (pool.length === 0) return null;
    variant = pool[Math.floor(Math.random() * pool.length)];
  }

  if (variant === "particle") {
    return {
      variant,
      title: "Sort the particles",
      subtitle: "Each little word has a job. Drop it in the right bucket.",
      buckets: PARTICLE_BUCKETS,
      words: shuffle(PARTICLE_WORDS),
    };
  }
  if (variant === "question") {
    return {
      variant,
      title: "Sort the question words",
      subtitle: "Which question does each word ask?",
      buckets: QUESTION_BUCKETS,
      words: shuffle(QUESTION_WORDS),
    };
  }
  if (variant === "politeness") {
    return {
      variant,
      title: "Sort the polite words",
      subtitle: "Each does a different social job.",
      buckets: POLITENESS_BUCKETS,
      words: shuffle(POLITENESS_WORDS),
    };
  }
  if (variant === "pos") {
    const all = buildPosWords(knownPhraseIds);
    if (all.length < 6) return null;
    // Sample up to 8, biased toward one per bucket.
    const byBucket = {};
    for (const w of all) (byBucket[w.bucket] ||= []).push(w);
    const picked = [];
    for (const b of POS_BUCKETS) {
      const pool = byBucket[b.id];
      if (pool && pool.length) picked.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    // Add extras until we hit 8
    const rest = all.filter(w => !picked.includes(w));
    while (picked.length < 8 && rest.length) {
      const i = Math.floor(Math.random() * rest.length);
      picked.push(rest.splice(i, 1)[0]);
    }
    if (picked.length < 5) return null;
    return {
      variant,
      title: "Sort by word type",
      subtitle: "Is each word a noun, verb, particle, copula, or adjective?",
      buckets: POS_BUCKETS,
      words: shuffle(picked),
    };
  }
  return null;
}
