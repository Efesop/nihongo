import { useState, useEffect } from "react";

/**
 * Gates a hint chip until `delayMs` has passed on the current card, then lets
 * the user manually reveal it. Used by any exercise that offers progressive
 * help (romaji reveal, distractor hints, etc).
 *
 * `cardId` resets both `visible` and `revealed` to false. Change it on card advance.
 */
export function useHintReveal(cardId, delayMs = 15000) {
  const [visible, setVisible] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setVisible(false);
    setRevealed(false);
    const id = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(id);
  }, [cardId, delayMs]);

  return {
    visible,
    revealed,
    reveal: () => setRevealed(true),
  };
}
