/**
 * Standalone game test page — bypasses Clerk auth.
 * Access via: http://localhost:5173/game-test
 * Add route in vite config or just import directly.
 */
import React from "react";
import ReactDOM from "react-dom/client";
import Game from "./game/Game.jsx";

// Mock theme (dark mode)
const theme = "dark";
const c = {
  bg: "#0d0d10", fg: "#f0eee9", a: "#c0282a", b: "#1a1a20",
  c2: "#161619", c3: "#1e1e23", t2: "#64646a", border: "#2e2e36",
};

function GameTestPage() {
  return (
    <div style={{ width: "100vw", height: "100vh", background: c.bg, overflow: "hidden" }}>
      <Game theme={theme} c={c} isDesktop={true} SIDEBAR_W={0} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GameTestPage />
  </React.StrictMode>
);
