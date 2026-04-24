/**
 * scaffolding.js — single source of truth for how much help to show a learner
 * based on the SRS box of the item being practiced.
 *
 * The rule: scaffolding fades with box, not on/off at arbitrary thresholds.
 *
 *   Box 0: always visible — learner has never seen this; give everything.
 *   Box 1: visible EN, romaji on tap — start requiring production intent.
 *   Box 2: EN on tap, romaji hidden — real recall under mild pressure.
 *   Box 3+: post-answer only — pure production/recognition.
 *
 * Usage:
 *   const s = scaffoldForBox(card.box);
 *   // s.en === "always" | "tap" | "post" | "hide"
 *   // s.romaji === "always" | "tap" | "post" | "hide"
 *   // s.hint === "pre" | "idle" | "wrong" | "post"
 *
 * Callers:
 *   - ChoiceGloss uses s.en and s.romaji to decide what to render under each option
 *   - HintChip uses s.hint to decide when to expose a hint
 *   - Post-answer reveal blocks always render (they're post-answer by definition)
 */
export function scaffoldForBox(box) {
  const b = Number(box) || 0;
  if (b <= 0) return { en: "always", romaji: "always", hint: "pre",   level: 0 };
  if (b === 1) return { en: "always", romaji: "tap",    hint: "idle",  level: 1 };
  if (b === 2) return { en: "tap",    romaji: "hide",   hint: "wrong", level: 2 };
  return           { en: "post",   romaji: "hide",   hint: "post",  level: 3 };
}

/**
 * Convenience: the box of a phrase/kana given user data.
 * Returns 0 when the item has never been seen.
 */
export function boxOfPhrase(data, phraseId) {
  return data?.phr?.[phraseId]?.box ?? 0;
}
export function boxOfKana(data, ch) {
  return data?.kana?.[ch]?.box ?? 0;
}
