// ═══ INPUT HANDLING ═══

export function setupKeyboard(gameRef, setScreen) {
  const keys = {};

  const onKeyDown = (e) => {
    if (keys[e.code]) return;
    keys[e.code] = true;
    const inp = gameRef.current?.input;
    if (!inp) return;
    if (e.code === "ArrowLeft" || e.code === "KeyA") { inp.left = true; e.preventDefault(); }
    if (e.code === "ArrowRight" || e.code === "KeyD") { inp.right = true; e.preventDefault(); }
    if (e.code === "ArrowUp" || e.code === "KeyW" || e.code === "Space") { inp.up = true; inp.jumpPressed = true; e.preventDefault(); }
    if (e.code === "ArrowDown" || e.code === "KeyS") { inp.down = true; inp.downPressed = true; e.preventDefault(); }
    if (e.code === "KeyJ" || e.code === "KeyZ") { inp.slash = true; inp.slashPressed = true; e.preventDefault(); }
    if (e.code === "KeyK" || e.code === "KeyX" || e.code === "ShiftLeft" || e.code === "ShiftRight") { inp.slowmo = true; e.preventDefault(); }
    if (e.code === "KeyL" || e.code === "KeyC") { inp.dash = true; inp.dashPressed = true; e.preventDefault(); }
    // Story mode inputs (story overlay OR in-world NPC dialogue)
    const inStory = gameRef.current?.gameState === "story";
    const inDialogue = !!gameRef.current?.activeDialogue;
    if (inStory || inDialogue) {
      if (e.code === "Space" || e.code === "Enter") { inp.storyAdvance = true; e.preventDefault(); }
      if (e.code === "Digit1" || e.code === "Numpad1") { inp.choice1 = true; e.preventDefault(); }
      if (e.code === "Digit2" || e.code === "Numpad2") { inp.choice2 = true; e.preventDefault(); }
      if (e.code === "Digit3" || e.code === "Numpad3") { inp.choice3 = true; e.preventDefault(); }
      if (e.code === "ArrowUp" || e.code === "KeyW") { inp.choiceUp = true; e.preventDefault(); }
      if (e.code === "ArrowDown" || e.code === "KeyS") { inp.choiceDown = true; e.preventDefault(); }
      if (e.code === "Enter") { inp.choiceConfirm = true; e.preventDefault(); }
      return; // Don't process game inputs during dialogue
    }
    if (e.code === "Escape" || e.code === "KeyP") setScreen("paused");
  };

  const onKeyUp = (e) => {
    keys[e.code] = false;
    const inp = gameRef.current?.input;
    if (!inp) return;
    if (e.code === "ArrowLeft" || e.code === "KeyA") inp.left = false;
    if (e.code === "ArrowRight" || e.code === "KeyD") inp.right = false;
    if (e.code === "ArrowUp" || e.code === "KeyW" || e.code === "Space") inp.up = false;
    if (e.code === "ArrowDown" || e.code === "KeyS") inp.down = false;
    if (e.code === "KeyJ" || e.code === "KeyZ") inp.slash = false;
    if (e.code === "KeyK" || e.code === "KeyX" || e.code === "ShiftLeft" || e.code === "ShiftRight") inp.slowmo = false;
    if (e.code === "KeyL" || e.code === "KeyC") inp.dash = false;
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  return () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
  };
}

export function setupTouch(canvas, gameRef) {
  const touches = {};

  const getTouchZone = (t) => {
    const rect = canvas.getBoundingClientRect();
    const x = t.clientX - rect.left;
    const y = t.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;
    if (x > w * 0.75) {
      if (y > h * 0.7) return "slash";
      if (y > h * 0.45) return "dash";
      if (y > h * 0.2) return "down"; // ground pound
      return "slowmo";
    }
    if (x < w * 0.2) return "left";
    if (x < w * 0.45) return "right";
    return "jump";
  };

  const getChoiceZone = (t) => {
    const rect = canvas.getBoundingClientRect();
    const x = t.clientX - rect.left;
    const y = t.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;
    // Choice boxes are in the right 55% of screen, above the dialogue panel
    // Panel starts at H * 0.72, choices above that
    if (x > w * 0.45 && y < h * 0.72 && y > h * 0.3) {
      // Map Y position to choice index (up to 3 choices)
      const choiceZoneH = h * 0.42; // 0.3 to 0.72
      const relY = y - h * 0.3;
      return Math.min(2, Math.floor(relY / (choiceZoneH / 3)));
    }
    return -1; // not in choice area
  };

  const onTouchStart = (e) => {
    e.preventDefault();
    const inp = gameRef.current?.input;
    if (!inp) return;

    // Story mode OR NPC dialogue — tap to advance, tap choice to select
    if (gameRef.current?.gameState === "story" || gameRef.current?.activeDialogue) {
      for (const t of e.changedTouches) {
        const choiceIdx = getChoiceZone(t);
        if (choiceIdx >= 0 && gameRef.current?.story?.choices) {
          // Tap on a choice
          if (choiceIdx === 0) inp.choice1 = true;
          if (choiceIdx === 1) inp.choice2 = true;
          if (choiceIdx === 2) inp.choice3 = true;
        } else {
          // Tap anywhere else to advance
          inp.storyAdvance = true;
        }
      }
      return; // Don't process gameplay touch during story
    }

    for (const t of e.changedTouches) {
      const zone = getTouchZone(t);
      touches[t.identifier] = zone;
      if (zone === "left") inp.left = true;
      if (zone === "right") inp.right = true;
      if (zone === "jump") { inp.up = true; inp.jumpPressed = true; }
      if (zone === "down") { inp.down = true; inp.downPressed = true; }
      if (zone === "slash") { inp.slash = true; inp.slashPressed = true; }
      if (zone === "slowmo") inp.slowmo = true;
      if (zone === "dash") { inp.dash = true; inp.dashPressed = true; }
    }
  };

  const onTouchEnd = (e) => {
    e.preventDefault();
    const inp = gameRef.current?.input;
    if (!inp) return;
    for (const t of e.changedTouches) {
      const zone = touches[t.identifier];
      delete touches[t.identifier];
      if (zone === "left") inp.left = false;
      if (zone === "right") inp.right = false;
      if (zone === "jump") inp.up = false;
      if (zone === "down") inp.down = false;
      if (zone === "slash") inp.slash = false;
      if (zone === "slowmo") inp.slowmo = false;
      if (zone === "dash") inp.dash = false;
    }
  };

  canvas.addEventListener("touchstart", onTouchStart, { passive: false });
  canvas.addEventListener("touchend", onTouchEnd, { passive: false });
  canvas.addEventListener("touchcancel", onTouchEnd, { passive: false });

  return () => {
    canvas.removeEventListener("touchstart", onTouchStart);
    canvas.removeEventListener("touchend", onTouchEnd);
    canvas.removeEventListener("touchcancel", onTouchEnd);
  };
}
