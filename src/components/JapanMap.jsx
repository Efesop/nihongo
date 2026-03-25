import { useState } from "react";
import { REGIONS, REGION_ORDER, REGION_PATHS, LABEL_POS, CURRENT_SEASON, PREFECTURE_DATA } from "../data/regions.js";
import { PHRASES } from "../data/phrases.js";
import { font, mono } from "../data/constants.js";

export default function JapanMap({ data, c, inner, card, btn, isDesktop }) {
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [infoTab, setInfoTab] = useState("overview");
  const [zoomedRegion, setZoomedRegion] = useState(null);
  const [hoveredPref, setHoveredPref] = useState(null);

  // On desktop, hover shows info. On mobile, tap selects.
  const activeRegion = isDesktop ? (hovered || selected) : selected;
  const region = activeRegion ? REGIONS[activeRegion] : null;
  const phrData = data?.phr || {};

  // Calculate phrase progress for selected region
  const getRegionProgress = (id) => {
    if (!id) return { known: 0, total: 0 };
    const rp = REGIONS[id].usefulPhrases || [];
    const known = rp.filter(pid => (phrData[pid]?.box || 0) >= 1).length;
    return { known, total: rp.length };
  };

  const tabBtn = (id, label) => ({
    ...btn,
    padding: "6px 12px",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: infoTab === id ? 700 : 400,
    background: infoTab === id ? (region?.color || c.a) + "22" : "transparent",
    color: infoTab === id ? (region?.color || c.a) : c.m,
    border: "1px solid " + (infoTab === id ? (region?.color || c.a) + "44" : "transparent"),
  });

  const senpaiMsg = region
    ? region.senpaiQuote
    : "Tap a region to explore Japan. I'll tell you what you need to know... if you're worthy.";

  // ═══ PREFECTURE DATA FOR ZOOMED REGION ═══
  const regionPrefs = zoomedRegion ? Object.entries(PREFECTURE_DATA || {}).filter(([, p]) => p.region === zoomedRegion) : [];

  // Calculate bounding box for zoomed region
  const getRegionBBox = (regionId) => {
    const prefs = Object.entries(PREFECTURE_DATA || {}).filter(([, p]) => p.region === regionId);
    if (prefs.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    prefs.forEach(([, p]) => {
      const coords = p.path.match(/(\d+),(\d+)/g) || [];
      coords.forEach(c => { const [x, y] = c.split(",").map(Number); minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); });
    });
    const pad = 30;
    return { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 };
  };

  // ═══ MAP SVG ═══
  const zoomBBox = zoomedRegion ? getRegionBBox(zoomedRegion) : null;
  const zoomedColor = zoomedRegion ? REGIONS[zoomedRegion]?.color : c.a;

  const mapSvg = zoomedRegion && zoomBBox ? (
    // ZOOMED VIEW — show prefectures
    <svg viewBox={`${zoomBBox.x} ${zoomBBox.y} ${zoomBBox.w} ${zoomBBox.h}`} style={{ width: "100%", height: "auto" }}>
      {regionPrefs.map(([id, pref]) => {
        const isHovered = hoveredPref === id;
        return <path key={id} d={pref.path}
          fill={isHovered ? zoomedColor + "55" : zoomedColor + "18"}
          stroke={isHovered ? zoomedColor : c.b + "88"}
          strokeWidth={isHovered ? 1.5 : 0.5}
          strokeLinejoin="round"
          style={{ cursor: "pointer", transition: "all .15s" }}
          onMouseEnter={() => { setHoveredPref(id); setHovered(zoomedRegion); }}
          onMouseLeave={() => setHoveredPref(null)}
        />;
      })}
      {/* Only show label for hovered prefecture */}
      {hoveredPref && PREFECTURE_DATA?.[hoveredPref] && <text
        x={PREFECTURE_DATA[hoveredPref].center.x} y={PREFECTURE_DATA[hoveredPref].center.y}
        textAnchor="middle" fontSize={Math.max(10, zoomBBox.w / 30)}
        fill={c.tx} style={{ pointerEvents: "none", fontFamily: font, fontWeight: 800 }}>
        {PREFECTURE_DATA[hoveredPref].name}
      </text>}
      {hoveredPref && PREFECTURE_DATA?.[hoveredPref] && <text
        x={PREFECTURE_DATA[hoveredPref].center.x} y={PREFECTURE_DATA[hoveredPref].center.y + Math.max(12, zoomBBox.w / 25)}
        textAnchor="middle" fontSize={Math.max(7, zoomBBox.w / 45)}
        fill={zoomedColor} style={{ pointerEvents: "none", fontFamily: mono, fontWeight: 600 }}>
        {PREFECTURE_DATA[hoveredPref].romaji}
      </text>}
    </svg>
  ) : (
    // OVERVIEW — show regions
    <svg viewBox="80 20 940 980" style={{ width: "100%", height: "auto" }}>
      {REGION_ORDER.map(id => {
        const r = REGIONS[id];
        const isActive = activeRegion === id;
        return <path key={id}
          d={REGION_PATHS[id]}
          fill={isActive ? r.color + "44" : c.s2}
          stroke={isActive ? r.color : c.b}
          strokeWidth={isActive ? 2 : 1}
          strokeLinejoin="round"
          style={{ cursor: "pointer", transition: "all .25s" }}
          onMouseEnter={() => setHovered(id)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => { setZoomedRegion(id); setSelected(id); setInfoTab("overview"); setHoveredPref(null); }}
        />;
      })}
      {REGION_ORDER.map(id => {
        const r = REGIONS[id];
        const pos = LABEL_POS[id];
        const isActive = activeRegion === id;
        return <text key={"l-" + id} x={pos.x} y={pos.y}
          textAnchor="middle" fontSize={isActive ? 13 : 10}
          fill={isActive ? r.color : c.m + "aa"}
          style={{ pointerEvents: "none", fontFamily: font, fontWeight: 700, transition: "all .2s" }}>
          {r.name}
        </text>;
      })}
    </svg>
  );

  // ═══ REGION SELECTOR BUTTONS + BACK BUTTON ═══
  const regionButtons = <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center", marginTop: 8, alignItems: "center" }}>
    {zoomedRegion && <button onClick={() => { setZoomedRegion(null); setHoveredPref(null); setSelected(null); }}
      style={{ ...btn, padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: c.a + "18", color: c.a, border: "1px solid " + c.a + "33" }}>
      ← All regions
    </button>}
    {!zoomedRegion && REGION_ORDER.map(id => {
      const r = REGIONS[id];
      const isActive = activeRegion === id;
      return <button key={id}
        onClick={() => { setZoomedRegion(id); setSelected(id); setInfoTab("overview"); setHoveredPref(null); }}
        onMouseEnter={isDesktop ? () => setHovered(id) : undefined}
        onMouseLeave={isDesktop ? () => setHovered(null) : undefined}
        style={{ ...btn, padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: isActive ? 700 : 400,
          background: isActive ? r.color + "22" : "transparent", color: isActive ? r.color : c.m,
          border: "1px solid " + (isActive ? r.color + "44" : c.b + "44") }}>
        {r.name}
      </button>;
    })}
    {zoomedRegion && <span style={{ fontSize: 12, color: zoomedColor, fontWeight: 700, marginLeft: 8 }}>
      {REGIONS[zoomedRegion]?.name} — hover over prefectures
    </span>}
  </div>;

  // ═══ INFO PANEL ═══
  const infoPanel = region ? <div style={{ flex: 1, minWidth: 0 }}>
    {/* Senpai */}
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
      <img src="/images/tinysenpai/tinysenpai2.png" alt="Senpai"
        style={{ width: 48, height: 48, imageRendering: "pixelated", flexShrink: 0 }} />
      <div style={{ padding: "8px 12px", borderRadius: "4px 12px 12px 12px",
        background: c.s2, border: "1px solid " + c.b,
        fontSize: 13, color: c.tx, lineHeight: 1.5, fontStyle: "italic" }}>
        {senpaiMsg}
      </div>
    </div>

    {/* Region header */}
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 32, fontWeight: 800, color: region.color, lineHeight: 1 }}>{region.name}</div>
      <div style={{ fontSize: 14, fontFamily: mono, color: c.m, marginTop: 4 }}>{region.romaji} · {region.english}</div>
      {hoveredPref && PREFECTURE_DATA?.[hoveredPref] && <div style={{ marginTop: 6, padding: "6px 10px", background: region.color + "12", borderRadius: 6, border: "1px solid " + region.color + "22", display: "inline-block" }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: c.tx }}>{PREFECTURE_DATA[hoveredPref].name}</span>
        <span style={{ fontSize: 12, fontFamily: mono, color: region.color, marginLeft: 8 }}>{PREFECTURE_DATA[hoveredPref].romaji}</span>
      </div>}
      {/* Progress */}
      {(() => {
        const { known, total } = getRegionProgress(activeRegion);
        if (total === 0) return null;
        const pct = Math.round(known / total * 100);
        return <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, height: 4, background: c.s2, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: pct + "%", height: "100%", background: region.color, borderRadius: 2, transition: "width .3s" }} />
          </div>
          <span style={{ fontSize: 11, color: region.color, fontWeight: 600 }}>{known}/{total} phrases</span>
        </div>;
      })()}
    </div>

    {/* Tabs */}
    <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
      <button onClick={() => setInfoTab("overview")} style={tabBtn("overview", "Overview")}>Overview</button>
      <button onClick={() => setInfoTab("food")} style={tabBtn("food", "Food")}>Food</button>
      <button onClick={() => setInfoTab("culture")} style={tabBtn("culture", "Culture")}>Culture</button>
      <button onClick={() => setInfoTab("phrases")} style={tabBtn("phrases", "Phrases")}>Phrases</button>
    </div>

    {/* Tab content */}
    <div style={{ ...card, padding: "16px 18px" }}>
      {infoTab === "overview" && <>
        {/* Cities */}
        <div style={{ fontSize: 11, color: c.m, textTransform: "uppercase", fontFamily: mono, marginBottom: 8 }}>Cities</div>
        {region.cities.map((city, i) => <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: c.tx }}>{city.name}</span>
          <span style={{ fontSize: 11, fontFamily: mono, color: region.color }}>{city.romaji}</span>
          <span style={{ fontSize: 11, color: c.m, marginLeft: "auto", textAlign: "right", maxWidth: "50%" }}>{city.desc}</span>
        </div>)}

        {/* Landmarks */}
        <div style={{ fontSize: 11, color: c.m, textTransform: "uppercase", fontFamily: mono, marginTop: 14, marginBottom: 8 }}>Landmarks</div>
        {region.landmarks.map((lm, i) => <div key={i} style={{ fontSize: 13, color: c.tx, marginBottom: 4, paddingLeft: 10, borderLeft: "2px solid " + region.color + "44" }}>{lm}</div>)}

        {/* Travel tip */}
        <div style={{ marginTop: 14, padding: "10px 12px", background: region.color + "10", borderRadius: 8, border: "1px solid " + region.color + "20" }}>
          <div style={{ fontSize: 11, color: region.color, fontWeight: 700, marginBottom: 4 }}>Travel tip</div>
          <div style={{ fontSize: 12, color: c.tx, lineHeight: 1.5 }}>{region.travelTip}</div>
        </div>
      </>}

      {infoTab === "food" && <>
        {region.food.map((f, i) => <div key={i} style={{ marginBottom: i < region.food.length - 1 ? 14 : 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: c.tx }}>{f.name}</span>
            <span style={{ fontSize: 11, fontFamily: mono, color: region.color }}>{f.romaji}</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: c.m, marginTop: 2 }}>{f.english}</div>
          <div style={{ fontSize: 12, color: c.tx, marginTop: 4, lineHeight: 1.5 }}>{f.desc}</div>
        </div>)}
      </>}

      {infoTab === "culture" && <>
        <div style={{ fontSize: 13, color: c.tx, lineHeight: 1.7, marginBottom: 14 }}>{region.culture}</div>

        {/* Festival */}
        <div style={{ padding: "10px 12px", background: region.color + "10", borderRadius: 8, marginBottom: 14, border: "1px solid " + region.color + "20" }}>
          <div style={{ fontSize: 11, color: region.color, fontWeight: 700, marginBottom: 4 }}>Festival</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: c.tx }}>{region.festival.name}</div>
          <div style={{ fontSize: 12, color: c.m }}>{region.festival.romaji} · {region.festival.english} · {region.festival.when}</div>
        </div>

        {/* Anime */}
        {region.anime.length > 0 && <>
          <div style={{ fontSize: 11, color: c.m, textTransform: "uppercase", fontFamily: mono, marginBottom: 6 }}>Set here</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {region.anime.map((a, i) => <span key={i} style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, background: c.s2, color: c.tx, border: "1px solid " + c.b }}>{a}</span>)}
          </div>
        </>}
      </>}

      {infoTab === "phrases" && <>
        {(() => {
          const phraseIds = region.usefulPhrases || [];
          if (phraseIds.length === 0) return <div style={{ fontSize: 13, color: c.m }}>No phrases linked to this region yet.</div>;
          return <>
            <div style={{ fontSize: 12, color: c.m, marginBottom: 10 }}>Phrases useful when visiting {region.english}:</div>
            {phraseIds.map((pid, i) => {
              const p = PHRASES.find(pp => pp[0] === pid);
              if (!p) return null;
              const box = phrData[pid]?.box || 0;
              const known = box >= 1;
              return <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "8px 10px", borderRadius: 8, background: known ? region.color + "08" : c.s2, border: "1px solid " + (known ? region.color + "22" : c.b) }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: c.tx, flex: 1 }}>{p[1]}</span>
                <span style={{ fontSize: 11, color: c.m, maxWidth: "40%", textAlign: "right" }}>{p[3]}</span>
                {known && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: region.color + "22", color: region.color, fontWeight: 700 }}>✓</span>}
              </div>;
            })}
          </>;
        })()}
      </>}
    </div>
  </div> : null;

  // ═══ DEFAULT VIEW (no region selected) ═══
  const defaultPanel = !region ? <div style={{ textAlign: "center", padding: isDesktop ? "20px" : "10px 0" }}>
    {/* Senpai */}
    <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: 16 }}>
      <img src="/images/tinysenpai/tinysenpai2.png" alt="Senpai"
        style={{ width: 48, height: 48, imageRendering: "pixelated" }} />
      <div style={{ padding: "8px 12px", borderRadius: "4px 12px 12px 12px",
        background: c.s2, border: "1px solid " + c.b,
        fontSize: 13, color: c.tx, lineHeight: 1.5, fontStyle: "italic", textAlign: "left" }}>
        {senpaiMsg}
      </div>
    </div>

    {/* Season */}
    <div style={{ ...card, padding: "12px 16px", display: "inline-flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 24 }}>{CURRENT_SEASON.icon}</span>
      <div style={{ textAlign: "left" }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: c.tx }}>{CURRENT_SEASON.name} <span style={{ fontSize: 12, fontFamily: mono, color: c.m }}>{CURRENT_SEASON.romaji} · {CURRENT_SEASON.english}</span></div>
        <div style={{ fontSize: 11, color: c.m, lineHeight: 1.5, marginTop: 2 }}>{CURRENT_SEASON.tip}</div>
      </div>
    </div>
  </div> : null;

  // ═══ RENDER ═══
  return <div style={{ ...inner, maxWidth: isDesktop ? 1100 : inner.maxWidth }}>
    {/* Header */}
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
      <span style={{ fontSize: 22 }}>🗾</span>
      <div>
        <span style={{ fontSize: 18, fontWeight: 800, color: c.tx }}>日本地図</span>
        <span style={{ fontSize: 12, fontFamily: mono, color: c.m, marginLeft: 8 }}>Nihon Chizu · Japan Map</span>
      </div>
    </div>

    {isDesktop ? (
      /* Desktop: side by side, wider than normal inner container */
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        <div style={{ flex: "0 0 55%", minWidth: 0 }}>
          {mapSvg}
          {regionButtons}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {region ? infoPanel : defaultPanel}
        </div>
      </div>
    ) : (
      /* Mobile: stacked */
      <>
        {mapSvg}
        {regionButtons}
        <div style={{ marginTop: 16 }}>
          {region ? infoPanel : defaultPanel}
        </div>
      </>
    )}
  </div>;
}
