import { useRef, useState, useEffect } from "react";

/**
 * Tracks elapsed ms on the current card. Resets whenever `cardId` changes.
 * Returns { startMs, elapsedMs, reset } — components can read on advance to
 * report response time into the session engine.
 */
export function useCardTimer(cardId) {
  const startRef = useRef(Date.now());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    startRef.current = Date.now();
    setTick(0);
    const id = setInterval(() => setTick(t => t + 1), 250);
    return () => clearInterval(id);
  }, [cardId]);

  const elapsedMs = Date.now() - startRef.current;
  const reset = () => { startRef.current = Date.now(); setTick(0); };
  return { startMs: startRef.current, elapsedMs, tick, reset };
}
