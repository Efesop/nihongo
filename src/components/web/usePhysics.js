import { useEffect, useRef, useState } from "react";

/**
 * usePhysics — minimal velocity-Verlet force-directed sim, no deps.
 *
 * Forces per frame:
 *   1. Gentle gravity toward (cx, cy)
 *   2. Pairwise repulsion (Coulomb-like, 1/r² falloff) — O(n²)
 *   3. Edge spring toward `target` length
 *   4. Velocity damping
 *
 * Cool-down: when total kinetic energy stays under threshold for 30 frames,
 * stop the rAF loop. Wake on any interaction (call `wake()`).
 *
 * Nodes are mutated in place each frame. Component should re-render on a
 * tick counter so React picks up the new positions.
 *
 * Inputs:
 *   nodes         — [{ id, x, y, vx, vy, fixed?: bool }, ...]   (mutated in place)
 *   edges         — [{ a: nodeIdx, b: nodeIdx, target: number }]
 *   width, height — viewport size, used for centre + initial seeding
 *   enabled       — when false, don't tick at all
 *
 * Returns: { tick, wake, pin(idx, x, y), unpin(idx) }
 *   tick   — increments each rendered frame; use as a render dep
 *   wake   — call to resume sim after cool-down
 *   pin    — set a node's position + mark fixed (for drag)
 *   unpin  — release a fixed node
 */
export function usePhysics({ nodes, edges, width, height, enabled = true }) {
  const [tick, setTick] = useState(0);
  const idleFrames = useRef(0);
  const sleeping = useRef(false);
  const rafRef = useRef(null);

  const wake = () => {
    if (!sleeping.current) return;
    sleeping.current = false;
    idleFrames.current = 0;
  };

  const pin = (idx, x, y) => {
    if (!nodes[idx]) return;
    nodes[idx].x = x;
    nodes[idx].y = y;
    nodes[idx].fixed = true;
    wake();
  };

  const unpin = (idx) => {
    if (!nodes[idx]) return;
    nodes[idx].fixed = false;
    wake();
  };

  useEffect(() => {
    if (!enabled || nodes.length === 0) return;
    sleeping.current = false;
    idleFrames.current = 0;

    const cx = width / 2;
    const cy = height / 2;

    const loop = () => {
      if (sleeping.current) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // 1) Gravity toward centre
      for (const n of nodes) {
        if (n.fixed) continue;
        n.vx += (cx - n.x) * 0.0008;
        n.vy += (cy - n.y) * 0.0008;
      }

      // 2) Pairwise repulsion — O(n²); fine up to ~150 nodes
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d2 = dx * dx + dy * dy + 16;
          const f = 1500 / d2;
          const inv = 1 / Math.sqrt(d2);
          const fx = dx * inv * f;
          const fy = dy * inv * f;
          if (!a.fixed) { a.vx -= fx; a.vy -= fy; }
          if (!b.fixed) { b.vx += fx; b.vy += fy; }
        }
      }

      // 3) Edge springs
      for (const e of edges) {
        const a = nodes[e.a];
        const b = nodes[e.b];
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const f = (d - e.target) * 0.04;
        const fx = (dx / d) * f;
        const fy = (dy / d) * f;
        if (!a.fixed) { a.vx += fx; a.vy += fy; }
        if (!b.fixed) { b.vx -= fx; b.vy -= fy; }
      }

      // 4) Integrate + damp + measure kinetic energy
      let ke = 0;
      for (const n of nodes) {
        if (n.fixed) {
          n.vx = 0; n.vy = 0;
          continue;
        }
        n.vx *= 0.85;
        n.vy *= 0.85;
        // Slight perpetual jitter so a settled graph still feels alive
        n.vx += (Math.random() - 0.5) * 0.04;
        n.vy += (Math.random() - 0.5) * 0.04;
        n.x += n.vx;
        n.y += n.vy;
        ke += n.vx * n.vx + n.vy * n.vy;
      }

      if (ke < 0.5) idleFrames.current++; else idleFrames.current = 0;
      if (idleFrames.current > 60) sleeping.current = true;

      setTick(t => (t + 1) % 1000000);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, width, height, enabled]);

  return { tick, wake, pin, unpin };
}
