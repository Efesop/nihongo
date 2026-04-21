#!/usr/bin/env node
/**
 * Build src/data/phraseClusters.js from src/data/phrases.js.
 *
 * Each phrase gets a `cluster` tag — a finer-grained grouping than `category`
 * that enables (a) semantic introduction bias in smartPhraseOrder
 * (Schmidt noticing + Lewis lexical approach) and (b) minimal-pair contrast
 * drills (Kornell & Bjork 2008).
 *
 * Strategy: start from `category` (col 4), split big buckets by English keyword
 * patterns. Deterministic — re-run any time phrases.js changes.
 *
 *   PATH="/usr/local/bin:$PATH" node scripts/build-clusters.mjs
 */
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');

const { PHRASES } = await import(join(ROOT, 'src/data/phrases.js'));

// ── RULES ─────────────────────────────────────────────────────────────────
// Order matters: first matching rule wins. Each rule: { match: (p) => bool, cluster: string }.
// p = [id, jp, romaji, en, category, tip, mcFlag].
const RULES = [
  // Greetings — split by function
  { match: p => p[4]==='greet' && /name is/i.test(p[3]), cluster: 'greet-selfintro' },
  { match: p => p[4]==='greet' && /thank|thanks/i.test(p[3]), cluster: 'greet-thanks' },
  { match: p => p[4]==='greet' && /(sorry|excuse)/i.test(p[3]), cluster: 'greet-apology' },
  { match: p => p[4]==='greet' && /(goodbye|bye)/i.test(p[3]), cluster: 'greet-bye' },
  { match: p => p[4]==='greet' && /(yes|no|okay|fine)/i.test(p[3]), cluster: 'greet-yesno' },
  { match: p => p[4]==='greet', cluster: 'greet-hello' },

  // Describe → adjective clusters
  { match: p => p[4]==='describe' && /(big|small|large|tiny)/i.test(p[3]), cluster: 'adj-size' },
  { match: p => p[4]==='describe' && /(hot|cold|warm|cool)/i.test(p[3]), cluster: 'adj-temp' },
  { match: p => p[4]==='describe' && /(cheap|expensive|price)/i.test(p[3]), cluster: 'adj-price' },
  { match: p => p[4]==='describe' && /(delicious|tasty|good|bad|yummy)/i.test(p[3]), cluster: 'adj-quality' },
  { match: p => p[4]==='describe', cluster: 'adj-general' },

  // Feelings → positive / negative
  { match: p => p[4]==='feel' && /(happy|fun|great|love|like|glad|excited|enjoy)/i.test(p[3]), cluster: 'feel-positive' },
  { match: p => p[4]==='feel' && /(sad|angry|tired|scared|worried|sick|hate|bad|upset)/i.test(p[3]), cluster: 'feel-negative' },
  { match: p => p[4]==='feel', cluster: 'feel-neutral' },

  // Verbs → semantic groups
  { match: p => p[4]==='verbs' && /(go|come|return|walk|run|take|bring|enter|exit|leave|arrive)/i.test(p[3]), cluster: 'verb-motion' },
  { match: p => p[4]==='verbs' && /(eat|drink|taste|cook)/i.test(p[3]), cluster: 'verb-consume' },
  { match: p => p[4]==='verbs' && /(give|receive|want|need|get|buy|sell)/i.test(p[3]), cluster: 'verb-exchange' },
  { match: p => p[4]==='verbs' && /(think|know|understand|see|hear|feel|remember|forget)/i.test(p[3]), cluster: 'verb-cognition' },
  { match: p => p[4]==='verbs' && /(say|talk|ask|answer|call|tell|speak)/i.test(p[3]), cluster: 'verb-communicate' },
  { match: p => p[4]==='verbs' && /(sleep|wake|rest|stand|sit|wait|work|study|play)/i.test(p[3]), cluster: 'verb-activity' },
  { match: p => p[4]==='verbs' && /(exist|have|is|are)/i.test(p[3]), cluster: 'verb-state' },
  { match: p => p[4]==='verbs', cluster: 'verb-general' },

  // Conversation glue → reaction / question / filler / agreement
  { match: p => p[4]==='convo' && /\?$|^(what|where|when|who|why|how)\b/i.test(p[3]), cluster: 'convo-question' },
  { match: p => p[4]==='convo' && /(yes|okay|sure|agree|right|exactly|indeed)/i.test(p[3]), cluster: 'convo-agreement' },
  { match: p => p[4]==='convo' && /(no|nope|disagree|but|however)/i.test(p[3]), cluster: 'convo-disagreement' },
  { match: p => p[4]==='convo' && /(um|uh|er|well|so|actually|you know|I mean|let me|hmm)/i.test(p[3]), cluster: 'convo-filler' },
  { match: p => p[4]==='convo' && /(wow|amazing|great|awesome|really|seriously|cute|cool)/i.test(p[3]), cluster: 'convo-reaction' },
  { match: p => p[4]==='convo' && /(maybe|probably|perhaps|might|could be)/i.test(p[3]), cluster: 'convo-hedge' },
  { match: p => p[4]==='convo' && /(me too|also|the same|as well)/i.test(p[3]), cluster: 'convo-agreement' },
  { match: p => p[4]==='convo' && /(sorry|excuse|pardon)/i.test(p[3]), cluster: 'convo-apology' },
  { match: p => p[4]==='convo' && /(please|thanks|thank you)/i.test(p[3]), cluster: 'convo-polite' },
  { match: p => p[4]==='convo', cluster: 'convo-misc' },

  // Complications → medical / lost / broken / delay
  { match: p => p[4]==='complications' && /(lost|missing|can't find|gone)/i.test(p[3]), cluster: 'compl-lost' },
  { match: p => p[4]==='complications' && /(sick|hurt|pain|doctor|hospital|medicine|feel)/i.test(p[3]), cluster: 'compl-medical' },
  { match: p => p[4]==='complications' && /(broken|doesn't work|not working|repair)/i.test(p[3]), cluster: 'compl-broken' },
  { match: p => p[4]==='complications' && /(late|delay|miss|wait|hurry)/i.test(p[3]), cluster: 'compl-timing' },
  { match: p => p[4]==='complications', cluster: 'compl-other' },

  // DateTime → days / times / durations
  { match: p => p[4]==='datetime' && /(monday|tuesday|wednesday|thursday|friday|saturday|sunday|weekday|weekend|today|tomorrow|yesterday)/i.test(p[3]), cluster: 'dt-day' },
  { match: p => p[4]==='datetime' && /(morning|afternoon|evening|night|am|pm|noon|midnight)/i.test(p[3]), cluster: 'dt-timeofday' },
  { match: p => p[4]==='datetime' && /(hour|minute|second|o'clock|half|quarter)/i.test(p[3]), cluster: 'dt-clock' },
  { match: p => p[4]==='datetime' && /(month|year|week|day)/i.test(p[3]), cluster: 'dt-period' },
  { match: p => p[4]==='datetime', cluster: 'dt-other' },

  // Shallow direct mappings — small enough to keep as-is
  { match: p => p[4]==='numExt' && /hundred|thousand/i.test(p[3]), cluster: 'num-big' },
  { match: p => p[4]==='numExt' && /(ty|teen)\b/i.test(p[3]), cluster: 'num-mid' },
  { match: p => p[4]==='numExt', cluster: 'num-counter' },
  { match: p => p[4]==='numbers', cluster: 'num-basic' },
  { match: p => p[4]==='time', cluster: 'time-basic' },
  { match: p => p[4]==='foodItem' && /(drink|water|tea|coffee|juice|beer|sake|milk)/i.test(p[3]), cluster: 'food-drink' },
  { match: p => p[4]==='foodItem', cluster: 'food-item' },
  { match: p => p[4]==='food', cluster: 'food-restaurant' },
  { match: p => p[4]==='train', cluster: 'transport' },
  { match: p => p[4]==='hotel', cluster: 'hotel' },
  { match: p => p[4]==='shop', cluster: 'shop' },
  { match: p => p[4]==='dir', cluster: 'directions' },
  { match: p => p[4]==='sos', cluster: 'emergency' },
  { match: p => p[4]==='daily', cluster: 'daily-life' },
  { match: p => p[4]==='body' && /(head|face|eye|ear|nose|mouth|tooth|teeth|hair)/i.test(p[3]), cluster: 'body-head' },
  { match: p => p[4]==='body', cluster: 'body-other' },
  { match: p => p[4]==='family', cluster: 'family' },
  { match: p => p[4]==='weather', cluster: 'weather' },
];

const FALLBACK = 'misc';

const result = {};
const unmatched = [];
for (const p of PHRASES) {
  let assigned = null;
  for (const rule of RULES) {
    if (rule.match(p)) { assigned = rule.cluster; break; }
  }
  if (!assigned) { assigned = FALLBACK; unmatched.push(p[0]); }
  result[p[0]] = assigned;
}

// Count cluster distribution
const counts = {};
for (const cl of Object.values(result)) counts[cl] = (counts[cl] || 0) + 1;
const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
console.log(`Tagged ${PHRASES.length} phrases into ${sorted.length} clusters:`);
for (const [cl, n] of sorted) console.log(`  ${cl.padEnd(22)} ${n}`);
if (unmatched.length) console.log(`\n⚠  ${unmatched.length} fell back to 'misc': ${unmatched.slice(0, 10).join(', ')}${unmatched.length > 10 ? '...' : ''}`);

const out = `// ═══ PHRASE CLUSTERS (auto-generated by scripts/build-clusters.mjs) ═══
// DO NOT EDIT BY HAND — re-run the script after changes to phrases.js.
// Each entry maps phrase id → cluster tag. Used for semantic introduction
// bias + minimal-pair contrast drills.
//
// Clusters: ${sorted.length}
// Total phrases tagged: ${PHRASES.length}

export const PHRASE_CLUSTERS = ${JSON.stringify(result, null, 2)};

export function clusterOf(phraseId) {
  return PHRASE_CLUSTERS[phraseId] || null;
}

export function phrasesInCluster(cluster) {
  return Object.entries(PHRASE_CLUSTERS)
    .filter(([, c]) => c === cluster)
    .map(([id]) => id);
}
`;

writeFileSync(join(ROOT, 'src/data/phraseClusters.js'), out);
console.log(`\n✅ wrote src/data/phraseClusters.js`);
