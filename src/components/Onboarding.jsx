import { useState } from "react";
import { font, mono, T } from "../data/constants.js";
import { daysUntil } from "../utils/helpers.js";
import { ProgressBar, Badge } from "./SessionParts.jsx";

const WHY_OPTIONS = [
  { id: "travel",  icon: "🗾", label: "Travelling to Japan" },
  { id: "anime",   icon: "🎌", label: "Anime & culture" },
  { id: "work",    icon: "💼", label: "Work or study" },
  { id: "moving",  icon: "🏠", label: "Living / moving there" },
  { id: "curious", icon: "✨", label: "Just curious" },
];
const LEVEL_OPTIONS = [
  { id: "beginner",     label: "Complete beginner — I know nothing yet" },
  { id: "basics",       label: "I know a few words or phrases" },
  { id: "refresh",      label: "Studied before, need a refresh" },
  { id: "intermediate", label: "Intermediate — want to level up" },
];

const FOCUS_MAX = 200;

export default function Onboarding({
  c, theme, card, btn,
  onboardStep, setOnboardStep, onboardAnswers, setOnboardAnswers,
  save, setTab, setStartIntent,
}) {
  const [celebrating, setCelebrating] = useState(false);
  const todayISO = new Date().toISOString().slice(0, 10);

  const finishOnboarding = () => {
    const why   = onboardAnswers.why   || "curious";
    const level = onboardAnswers.level || "beginner";
    const trip  = onboardAnswers.tripDate || "";
    const focus = (onboardAnswers.focus || "").slice(0, FOCUS_MAX);

    // Inference: new travelers with trip <30d away → Focus Mode + Tourist Mode on.
    // Aligns session builder with survival-phrase depth per plan decision #4.
    const tripDaysOut = trip ? daysUntil(trip) : null;
    const shouldFocusInfer = why === "travel" && tripDaysOut != null && tripDaysOut > 0 && tripDaysOut < 30;

    const ob = { why, level, tripDate: trip, focus, completedAt: new Date().toISOString() };
    const next = { onboarded: true, onboarding: ob };
    if (shouldFocusInfer) {
      next.settings = { focusMode: true };
    }
    save(next);

    setCelebrating(true);
    setTimeout(() => {
      if (setStartIntent) setStartIntent({ source: "onboarding" });
      if (setTab) setTab("smart");
    }, 1400);
  };

  const stepCount = 3;
  const progressPct = Math.round((onboardStep / stepCount) * 100);
  const ans = onboardAnswers;
  const trip = ans.tripDate || "";
  const tripInPast = trip && trip < todayISO;
  const focusLen = (ans.focus || "").length;

  // ─── Completion celebration ───
  if (celebrating) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: theme === "dark"
          ? `radial-gradient(ellipse 80% 50% at 50% 110%, rgba(192,40,42,0.28) 0%, transparent 70%), ${c.bg}`
          : c.bg,
        padding: 24, color: c.tx, fontFamily: font,
      }}>
        <div className="ts-reveal" style={{ textAlign: "center" }}>
          <div style={{ fontSize: T.huge, fontFamily: font, fontWeight: 800, marginBottom: 12 }}>日本語</div>
          <div style={{ fontSize: T.md, fontWeight: 600, color: c.a, marginBottom: 6 }}>
            You're set
          </div>
          <div style={{ fontSize: T.sm, color: c.m, fontFamily: mono, letterSpacing: ".05em" }}>
            Starting your first session…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: theme === "dark"
        ? `radial-gradient(ellipse 80% 50% at 50% 110%, rgba(192,40,42,0.16) 0%, transparent 70%), ${c.bg}`
        : c.bg,
      padding: 24, color: c.tx, fontFamily: font,
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: T.huge, fontWeight: 800, letterSpacing: "-.02em", marginBottom: 4 }}>日本語</div>
          <div style={{
            fontSize: T.xs, color: c.m, fontFamily: mono,
            textTransform: "uppercase", letterSpacing: ".08em",
          }}>TinySenpai</div>
        </div>

        {/* progress bar */}
        <div style={{ marginBottom: 32 }}>
          <ProgressBar pct={progressPct} color={c.a} c={c} height={3} track={c.b} radius={2} />
        </div>

        {onboardStep === 0 && (
          <div className="ts-reveal">
            <div style={{ fontSize: T.lg, fontWeight: 700, marginBottom: 6 }}>Why are you learning Japanese?</div>
            <div style={{ fontSize: T.sm, color: c.m, marginBottom: 20 }}>We'll personalise your experience around your goal.</div>
            {WHY_OPTIONS.map(o => (
              <div
                key={o.id}
                onClick={() => { setOnboardAnswers(a => ({ ...a, why: o.id })); setOnboardStep(1); }}
                className="ts-btn"
                style={{
                  ...card, padding: "14px 18px", marginBottom: 8, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 14,
                  border: "1px solid " + (ans.why === o.id ? c.a : c.b),
                  transition: "border .15s",
                }}
              >
                <span style={{ fontSize: T.lg }}>{o.icon}</span>
                <span style={{ fontSize: T.base, fontWeight: 500, color: c.tx }}>{o.label}</span>
              </div>
            ))}
            <button onClick={() => setOnboardStep(1)} style={{
              ...btn, width: "100%", padding: 12, marginTop: 8,
              background: "transparent", color: c.m, fontSize: T.sm,
            }}>Skip</button>
          </div>
        )}

        {onboardStep === 1 && (
          <div className="ts-reveal">
            <div style={{ fontSize: T.lg, fontWeight: 700, marginBottom: 6 }}>What's your current level?</div>
            <div style={{ fontSize: T.sm, color: c.m, marginBottom: 20 }}>Be honest — this helps your AI tutor pitch things right.</div>
            {LEVEL_OPTIONS.map(o => (
              <div
                key={o.id}
                onClick={() => { setOnboardAnswers(a => ({ ...a, level: o.id })); setOnboardStep(2); }}
                className="ts-btn"
                style={{
                  ...card, padding: "14px 18px", marginBottom: 8, cursor: "pointer",
                  border: "1px solid " + (ans.level === o.id ? c.a : c.b),
                  transition: "border .15s",
                }}
              >
                <span style={{ fontSize: T.sm, fontWeight: 500, color: c.tx }}>{o.label}</span>
              </div>
            ))}
            <button onClick={() => setOnboardStep(2)} style={{
              ...btn, width: "100%", padding: 12, marginTop: 8,
              background: "transparent", color: c.m, fontSize: T.sm,
            }}>Skip</button>
          </div>
        )}

        {onboardStep === 2 && (
          <div className="ts-reveal">
            <div style={{ fontSize: T.lg, fontWeight: 700, marginBottom: 6 }}>Anything else to know?</div>
            <div style={{ fontSize: T.sm, color: c.m, marginBottom: 20 }}>Optional — helps your Senpai give better answers.</div>

            {ans.why === "travel" && (
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  fontSize: T.xs, color: c.m, fontFamily: mono,
                  textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6,
                }}>Trip date (optional)</div>
                <input
                  type="date"
                  value={trip}
                  min={todayISO}
                  onChange={e => setOnboardAnswers(a => ({ ...a, tripDate: e.target.value }))}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: 8,
                    border: "1px solid " + (tripInPast ? c.a : c.b),
                    background: c.s2, color: c.tx, fontFamily: font,
                    fontSize: T.sm, outline: "none", boxSizing: "border-box", marginBottom: 6,
                  }}
                />
                {tripInPast && (
                  <div style={{ marginBottom: 8 }}>
                    <Badge icon="⚠️" label="date is in the past" color={c.a} c={c} />
                  </div>
                )}
                {trip && !tripInPast && daysUntil(trip) < 30 && (
                  <div style={{ fontSize: T.xs, color: c.g, marginBottom: 8 }}>
                    ✈️ {daysUntil(trip)} days out — we'll enable Focus Mode + travel phrases for you.
                  </div>
                )}
              </div>
            )}

            <div style={{
              fontSize: T.xs, color: c.m, fontFamily: mono,
              textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6,
            }}>Anything to focus on? (optional)</div>
            <textarea
              value={ans.focus || ""}
              onChange={e => setOnboardAnswers(a => ({ ...a, focus: e.target.value.slice(0, FOCUS_MAX) }))}
              placeholder="e.g. ordering food, reading menus, anime without subtitles, business meetings..."
              rows={3}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8,
                border: "1px solid " + c.b, background: c.s2, color: c.tx,
                fontFamily: font, fontSize: T.sm, outline: "none",
                resize: "none", boxSizing: "border-box", lineHeight: 1.5, marginBottom: 6,
              }}
            />
            <div style={{
              fontSize: T.xs, color: focusLen >= FOCUS_MAX ? c.a : c.m,
              fontFamily: mono, textAlign: "right", marginBottom: 16,
            }}>{focusLen}/{FOCUS_MAX}</div>

            <button
              onClick={finishOnboarding}
              className="ts-btn"
              style={{
                ...btn, width: "100%", padding: 14, borderRadius: 10,
                background: c.a, color: "#fff",
                fontSize: T.base, fontWeight: 600,
              }}
            >Let's go →</button>
          </div>
        )}
      </div>
    </div>
  );
}
