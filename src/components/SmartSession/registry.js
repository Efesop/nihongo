/**
 * Exercise registry for SmartSession.
 *
 * Each exercise type (kana-visual, phrase-listen, pattern-assembly, etc.) should
 * eventually be a single-file component in ./exercises/ that exports a default
 * component and a `meta` object.
 *
 * Contract (target shape):
 *
 *   export function meta() { return { type: "phrase-listen", skills: ["listen"] }; }
 *
 *   export default function PhraseListenExercise({
 *     card, c, btn, cardStyle, isDesktop, session,
 *     onAdvance,     // (result: { correct, timeMs, skipped }) => void
 *     onSkill,       // (dims: { visual?, listen?, production? }) => void
 *   }) {
 *     // render and wire ActionBar from SessionParts.
 *   }
 *
 * Registration:
 *
 *   import PhraseListen from "./exercises/PhraseListen.jsx";
 *   export const REGISTRY = { "phrase-listen": PhraseListen, ... };
 *
 * While migration is in progress, SmartSession.jsx continues to render every
 * exercise type via its internal if-chain. New exercise types MUST be added
 * here rather than extending SmartSession.jsx (per CLAUDE.md).
 */

export const REGISTRY = {
  // populate during per-exercise extraction PRs
};

export function resolveExercise(type) {
  return REGISTRY[type] || null;
}
