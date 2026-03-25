import { useState, memo } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { REGIONS, REGION_ORDER, CURRENT_SEASON } from "../data/regions.js";
import { PHRASES } from "../data/phrases.js";
import { font, mono } from "../data/constants.js";

const TOPO_URL = "/data/japan.topojson";

// Map prefecture ID → region
const PREF_TO_REGION = {};
const PREF_IDS = {
  1:"hokkaido",2:"tohoku",3:"tohoku",4:"tohoku",5:"tohoku",6:"tohoku",7:"tohoku",
  8:"kanto",9:"kanto",10:"kanto",11:"kanto",12:"kanto",13:"kanto",14:"kanto",
  15:"chubu",16:"chubu",17:"chubu",18:"chubu",19:"chubu",20:"chubu",21:"chubu",22:"chubu",23:"chubu",
  24:"kansai",25:"kansai",26:"kansai",27:"kansai",28:"kansai",29:"kansai",30:"kansai",
  31:"chugoku",32:"chugoku",33:"chugoku",34:"chugoku",35:"chugoku",
  36:"shikoku",37:"shikoku",38:"shikoku",39:"shikoku",
  40:"kyushu",41:"kyushu",42:"kyushu",43:"kyushu",44:"kyushu",45:"kyushu",46:"kyushu",47:"kyushu",
};

export default function JapanMap({ data, c, inner, card, btn, isDesktop }) {
  const [hovered, setHovered] = useState(null); // region id
  const [hoveredPref, setHoveredPref] = useState(null); // { name, nameJa, region }
  const [selected, setSelected] = useState(null); // region id (clicked)
  const [infoTab, setInfoTab] = useState("overview");
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState([137, 36]);

  const activeRegion = isDesktop ? (hovered || selected) : selected;
  const region = activeRegion ? REGIONS[activeRegion] : null;
  const phrData = data?.phr || {};

  const getRegionProgress = (id) => {
    if (!id) return { known: 0, total: 0 };
    const rp = REGIONS[id]?.usefulPhrases || [];
    const known = rp.filter(pid => (phrData[pid]?.box || 0) >= 1).length;
    return { known, total: rp.length };
  };

  const tabBtn = (id) => ({
    ...btn, padding: "6px 12px", borderRadius: 6, fontSize: 11,
    fontWeight: infoTab === id ? 700 : 400,
    background: infoTab === id ? (region?.color || c.a) + "22" : "transparent",
    color: infoTab === id ? (region?.color || c.a) : c.m,
    border: "1px solid " + (infoTab === id ? (region?.color || c.a) + "44" : "transparent"),
  });

  const senpaiMsg = region
    ? region.senpaiQuote
    : "Tap a region to explore Japan. I'll tell you what you need to know... if you're worthy.";

  // Region zoom centers
  const REGION_CENTERS = {
    hokkaido: [143.5, 43.5], tohoku: [140, 39.5], kanto: [139.8, 36],
    chubu: [137.5, 36.5], kansai: [135.5, 34.8], chugoku: [133, 34.8],
    shikoku: [133.5, 33.5], kyushu: [131, 32.5],
  };

  const handleRegionClick = (regionId) => {
    if (selected === regionId) {
      // Zoom back out
      setSelected(null); setZoom(1); setCenter([137, 36]);
    } else {
      setSelected(regionId); setInfoTab("overview");
      setZoom(4); setCenter(REGION_CENTERS[regionId] || [137, 38]);
    }
  };

  // ═══ MAP ═══
  const mapContent = <ComposableMap
    projection="geoMercator"
    projectionConfig={{ center, scale: 1500 * zoom }}
    width={500}
    height={700}
    style={{ width: "100%", height: "auto" }}
  >
    <Geographies geography={TOPO_URL}>
      {({ geographies }) => geographies.map(geo => {
        const prefId = geo.properties.id;
        const regionId = PREF_IDS[prefId];
        const r = REGIONS[regionId];
        if (!r) return null;
        const isRegionActive = activeRegion === regionId;
        const isPrefHovered = hoveredPref?.name === geo.properties.nam;
        return <Geography
          key={geo.rsmKey}
          geography={geo}
          onMouseEnter={() => {
            setHovered(regionId);
            setHoveredPref({ name: geo.properties.nam, nameJa: geo.properties.nam_ja, region: regionId });
          }}
          onMouseLeave={() => { setHovered(null); setHoveredPref(null); }}
          onClick={() => handleRegionClick(regionId)}
          style={{
            default: {
              fill: isRegionActive ? r.color + (isPrefHovered ? "66" : "33") : c.s2,
              stroke: isRegionActive ? r.color + "88" : c.b + "66",
              strokeWidth: isPrefHovered ? 1.5 : 0.5,
              outline: "none",
              transition: "all .15s",
              cursor: "pointer",
            },
            hover: {
              fill: r.color + "66",
              stroke: r.color,
              strokeWidth: 1.5,
              outline: "none",
              cursor: "pointer",
            },
            pressed: {
              fill: r.color + "88",
              stroke: r.color,
              strokeWidth: 2,
              outline: "none",
            },
          }}
        />;
      })}
    </Geographies>
    {/* Region labels */}
    {/* Region name labels on overview */}
    {zoom <= 1.5 && REGION_ORDER.map(id => {
      const r = REGIONS[id];
      const pos = REGION_CENTERS[id];
      const isActive = activeRegion === id;
      return <Marker key={"label-" + id} coordinates={pos}>
        <text textAnchor="middle" y={-3}
          style={{ fontFamily: font, fontSize: isActive ? 11 : 9, fontWeight: 800,
            fill: isActive ? r.color : c.tx + "bb",
            stroke: c.bg, strokeWidth: 3, paintOrder: "stroke",
            pointerEvents: "none" }}>
          {r.name}
        </text>
        <text textAnchor="middle" y={8}
          style={{ fontFamily: mono, fontSize: isActive ? 6 : 5, fontWeight: 600,
            fill: isActive ? r.color + "dd" : c.m + "aa",
            stroke: c.bg, strokeWidth: 2, paintOrder: "stroke",
            pointerEvents: "none" }}>
          {r.english}
        </text>
      </Marker>;
    })}
  </ComposableMap>;

  // ═══ REGION BUTTONS ═══
  const regionButtons = <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center", marginTop: 8 }}>
    {selected && <button onClick={() => { setSelected(null); setZoom(1); setCenter([137, 38]); setHoveredPref(null); }}
      style={{ ...btn, padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: c.a + "18", color: c.a, border: "1px solid " + c.a + "33" }}>
      ← All Japan
    </button>}
    {REGION_ORDER.map(id => {
      const r = REGIONS[id];
      const isActive = activeRegion === id;
      return <button key={id}
        onClick={() => handleRegionClick(id)}
        onMouseEnter={isDesktop ? () => setHovered(id) : undefined}
        onMouseLeave={isDesktop ? () => setHovered(null) : undefined}
        style={{ ...btn, padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: isActive ? 700 : 400,
          background: isActive ? r.color + "22" : "transparent", color: isActive ? r.color : c.m,
          border: "1px solid " + (isActive ? r.color + "44" : c.b + "44") }}>
        {r.name}
      </button>;
    })}
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
      {/* Hovered prefecture */}
      {hoveredPref && hoveredPref.region === activeRegion && <div style={{ marginTop: 6, padding: "5px 10px", background: region.color + "12", borderRadius: 6, border: "1px solid " + region.color + "22", display: "inline-block" }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: c.tx }}>{hoveredPref.nameJa}</span>
        <span style={{ fontSize: 12, fontFamily: mono, color: region.color, marginLeft: 6 }}>{hoveredPref.name?.replace(/ (Ken|Fu|To|Do)$/, "")}</span>
      </div>}
      {/* Progress */}
      {(() => {
        const { known, total } = getRegionProgress(activeRegion);
        if (total === 0) return null;
        const pct = Math.round(known / total * 100);
        return <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, height: 4, background: c.s2, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: pct + "%", height: "100%", background: region.color, borderRadius: 2 }} />
          </div>
          <span style={{ fontSize: 11, color: region.color, fontWeight: 600 }}>{known}/{total} phrases</span>
        </div>;
      })()}
    </div>

    {/* Tabs */}
    <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
      {["overview", "food", "culture", "phrases"].map(t => <button key={t} onClick={() => setInfoTab(t)} style={tabBtn(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>)}
    </div>

    {/* Tab content */}
    <div style={{ ...card, padding: "16px 18px" }}>
      {infoTab === "overview" && <>
        <div style={{ fontSize: 11, color: c.m, textTransform: "uppercase", fontFamily: mono, marginBottom: 8 }}>Cities</div>
        {region.cities.map((city, i) => <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: c.tx }}>{city.name}</span>
          <span style={{ fontSize: 11, fontFamily: mono, color: region.color }}>{city.romaji}</span>
          <span style={{ fontSize: 11, color: c.m, marginLeft: "auto", textAlign: "right", maxWidth: "50%" }}>{city.desc}</span>
        </div>)}
        <div style={{ fontSize: 11, color: c.m, textTransform: "uppercase", fontFamily: mono, marginTop: 14, marginBottom: 8 }}>Landmarks</div>
        {region.landmarks.map((lm, i) => <div key={i} style={{ fontSize: 13, color: c.tx, marginBottom: 4, paddingLeft: 10, borderLeft: "2px solid " + region.color + "44" }}>{lm}</div>)}
        <div style={{ marginTop: 14, padding: "10px 12px", background: region.color + "10", borderRadius: 8, border: "1px solid " + region.color + "20" }}>
          <div style={{ fontSize: 11, color: region.color, fontWeight: 700, marginBottom: 4 }}>Travel tip</div>
          <div style={{ fontSize: 12, color: c.tx, lineHeight: 1.5 }}>{region.travelTip}</div>
        </div>
      </>}
      {infoTab === "food" && region.food.map((f, i) => <div key={i} style={{ marginBottom: i < region.food.length - 1 ? 14 : 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: c.tx }}>{f.name}</span>
          <span style={{ fontSize: 11, fontFamily: mono, color: region.color }}>{f.romaji}</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: c.m, marginTop: 2 }}>{f.english}</div>
        <div style={{ fontSize: 12, color: c.tx, marginTop: 4, lineHeight: 1.5 }}>{f.desc}</div>
      </div>)}
      {infoTab === "culture" && <>
        <div style={{ fontSize: 13, color: c.tx, lineHeight: 1.7, marginBottom: 14 }}>{region.culture}</div>
        <div style={{ padding: "10px 12px", background: region.color + "10", borderRadius: 8, marginBottom: 14, border: "1px solid " + region.color + "20" }}>
          <div style={{ fontSize: 11, color: region.color, fontWeight: 700, marginBottom: 4 }}>Festival</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: c.tx }}>{region.festival.name}</div>
          <div style={{ fontSize: 12, color: c.m }}>{region.festival.romaji} · {region.festival.english} · {region.festival.when}</div>
        </div>
        {region.anime.length > 0 && <>
          <div style={{ fontSize: 11, color: c.m, textTransform: "uppercase", fontFamily: mono, marginBottom: 6 }}>Set here</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {region.anime.map((a, i) => <span key={i} style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, background: c.s2, color: c.tx, border: "1px solid " + c.b }}>{a}</span>)}
          </div>
        </>}
      </>}
      {infoTab === "phrases" && (() => {
        const phraseIds = region.usefulPhrases || [];
        if (phraseIds.length === 0) return <div style={{ fontSize: 13, color: c.m }}>No phrases linked yet.</div>;
        return <>
          <div style={{ fontSize: 12, color: c.m, marginBottom: 10 }}>Phrases useful in {region.english}:</div>
          {phraseIds.map((pid, i) => {
            const p = PHRASES.find(pp => pp[0] === pid);
            if (!p) return null;
            const known = (phrData[pid]?.box || 0) >= 1;
            return <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "8px 10px", borderRadius: 8, background: known ? region.color + "08" : c.s2, border: "1px solid " + (known ? region.color + "22" : c.b) }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: c.tx, flex: 1 }}>{p[1]}</span>
              <span style={{ fontSize: 11, color: c.m, maxWidth: "40%", textAlign: "right" }}>{p[3]}</span>
              {known && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: region.color + "22", color: region.color, fontWeight: 700 }}>✓</span>}
            </div>;
          })}
        </>;
      })()}
    </div>
  </div> : null;

  // ═══ DEFAULT (no region) ═══
  const defaultPanel = !region ? <div style={{ textAlign: "center", padding: isDesktop ? "20px" : "10px 0" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: 16 }}>
      <img src="/images/tinysenpai/tinysenpai2.png" alt="Senpai" style={{ width: 48, height: 48, imageRendering: "pixelated" }} />
      <div style={{ padding: "8px 12px", borderRadius: "4px 12px 12px 12px", background: c.s2, border: "1px solid " + c.b, fontSize: 13, color: c.tx, lineHeight: 1.5, fontStyle: "italic", textAlign: "left" }}>{senpaiMsg}</div>
    </div>
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
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
      <span style={{ fontSize: 22 }}>🗾</span>
      <div>
        <span style={{ fontSize: 18, fontWeight: 800, color: c.tx }}>日本地図</span>
        <span style={{ fontSize: 12, fontFamily: mono, color: c.m, marginLeft: 8 }}>Nihon Chizu · Japan Map</span>
      </div>
    </div>

    {isDesktop ? (
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        <div style={{ flex: "0 0 55%", minWidth: 0 }}>
          {mapContent}
          {regionButtons}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {region ? infoPanel : defaultPanel}
        </div>
      </div>
    ) : (
      <>
        {mapContent}
        {regionButtons}
        <div style={{ marginTop: 16 }}>
          {region ? infoPanel : defaultPanel}
        </div>
      </>
    )}
  </div>;
}
