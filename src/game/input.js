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
    // Debug hotkeys (work on live site too)
    if (e.code === "F2") { inp._toggleDebug = true; e.preventDefault(); }
    if (e.code === "F3") { inp._skipRoom = true; e.preventDefault(); }
    if (e.code === "F4") { inp._godMode = true; e.preventDefault(); }
    if (e.code === "F5") { inp._fillMeter = true; e.preventDefault(); }
    // Export platform data in debug mode — outputs percentage coords for bg rooms
    if (e.code === "KeyE" && gameRef.current?._debugCollision) {
      const g = gameRef.current;
      const isPct = g.platforms[0]?._pct;
      const json = g.platforms.map((p, i) => {
        if (isPct) {
          return `      { x: ${(p.x/g.W).toFixed(3)}, y: ${(p.y/g.H).toFixed(3)}, w: ${(p.w/g.W).toFixed(3)}, pct: true },`;
        }
        return `      { x: ${Math.round(p.x)}, y: ${Math.round(p.y - g.groundY)}, w: ${Math.round(p.w)} },`;
      }).join('\n');
      console.log('═══ PLATFORM DATA ═══\n    platforms: [\n' + json + '\n    ],');
      e.preventDefault();
    }
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

  // ═══ COLLISION EDITOR — mouse drag/resize platforms in debug mode (F2) ═══
  const onMouseDown = (e) => {
    const g = gameRef.current;
    if (!g || !g._debugCollision) return;
    const rect = e.target.getBoundingClientRect();
    const mx = e.clientX - rect.left + (g.camera?.x || 0);
    const my = e.clientY - rect.top + (g.camera?.y || 0);
    // Find which platform was clicked
    for (let i = 0; i < g.platforms.length; i++) {
      const p = g.platforms[i];
      const ph = p.h || 16;
      if (mx >= p.x && mx <= p.x + p.w && my >= p.y && my <= p.y + ph) {
        // Check if clicking near right edge (resize) or body (move)
        const nearRight = mx > p.x + p.w - 15;
        g._editPlatform = { index: i, mode: nearRight ? 'resize' : 'move', startMX: mx, startMY: my, origX: p.x, origY: p.y, origW: p.w };
        e.preventDefault();
        return;
      }
    }
    // Click on empty space: deselect
    g._editPlatform = null;
  };
  const onMouseMove = (e) => {
    const g = gameRef.current;
    if (!g || !g._editPlatform) return;
    const rect = e.target.getBoundingClientRect();
    const mx = e.clientX - rect.left + (g.camera?.x || 0);
    const my = e.clientY - rect.top + (g.camera?.y || 0);
    const ep = g._editPlatform;
    const p = g.platforms[ep.index];
    if (ep.mode === 'move') {
      p.x = ep.origX + (mx - ep.startMX);
      p.y = ep.origY + (my - ep.startMY);
    } else if (ep.mode === 'resize') {
      p.w = Math.max(30, ep.origW + (mx - ep.startMX));
    }
  };
  const onMouseUp = (e) => {
    const g = gameRef.current;
    if (!g) return;
    if (g._editPlatform) {
      // Log updated platform data on release
      const p = g.platforms[g._editPlatform.index];
      console.log(`Platform ${g._editPlatform.index}: { x: ${Math.round(p.x)}, y: ${Math.round(p.y - g.groundY)}, w: ${Math.round(p.w)} }`);
    }
    if (g._editPlatform) g._editPlatform = null;
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  // Mouse events on canvas for collision editor
  const canvas = document.querySelector('canvas');
  if (canvas) {
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
  }

  return () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    if (canvas) {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
    }
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
