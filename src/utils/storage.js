import { KEY } from "../data/constants.js";
import { normalizeBoxesBySkills } from "./fsrs.js";

// ═══ STORAGE HELPERS ═══
export const store = {
  get: (key) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch(e) { return null; } },
  set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {} },
  del: (key) => { try { localStorage.removeItem(key); } catch(e) {} },
};

// ═══ SYNC HELPERS ═══
export const syncLoad = async (token) => {
  try {
    const r = await fetch("/api/sync", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (r.status === 404) return null;
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
};

export const syncSave = async (token, data) => {
  try {
    await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ data }),
    });
  } catch { /* offline — localStorage still holds it */ }
};

export const defaultD=()=>({kana:{},phr:{},sessions:0,totalC:0,streak:1,lastDay:new Date().toDateString(),started:new Date().toISOString(),onboarded:false,onboarding:{},settings:{}});

export const migrate=(raw)=>{
  if(!raw) return null;
  const migratedKana={};
  Object.entries(raw.kana||{}).forEach(([ch,v])=>{
    migratedKana[ch]=typeof v==="number"?{box:Math.min(v,5),next:Date.now()}:v;
  });
  const today=new Date().toDateString();
  const yesterday=new Date(Date.now()-864e5).toDateString();
  const lastDay=raw.lastDay;
  const streak=lastDay===today?raw.streak||1:lastDay===yesterday?(raw.streak||0)+1:1;
  let next={...raw,kana:migratedKana,phr:raw.phr||{},streak,lastDay:today};

  // One-time skill-based recap migration. Items that climbed to box 4-5
  // before the cap rule was tightened (or before skill tracking was reliable)
  // get demoted to the level their skill profile actually justifies. Marked
  // by a flag so it only runs once per user.
  if (!next.settings?.recapMigrationV1) {
    const { phr, kana, capped } = normalizeBoxesBySkills(next);
    next = {
      ...next,
      phr,
      kana,
      settings: { ...(next.settings||{}), recapMigrationV1: true, recapMigrationV1Capped: capped },
    };
  }
  return next;
};
