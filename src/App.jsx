import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useUser as _useUser, useAuth as _useAuth, useClerk as _useClerk, SignIn, SignUp } from "@clerk/clerk-react";

// Dev mode: mock Clerk hooks on localhost so game loads without auth
const isLocalDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const mockUser = { id: "dev_user", firstName: "Dev", fullName: "Dev User", imageUrl: "" };
const useUser = isLocalDev ? () => ({ user: mockUser, isLoaded: true }) : _useUser;
const useAuth = isLocalDev ? () => ({ getToken: async () => "dev_token" }) : _useAuth;
const useClerk = isLocalDev ? () => ({ signOut: () => {} }) : _useClerk;
import Game from "./game/Game.jsx";
import SmartSession from "./components/SmartSession.jsx";

// Data
import { M, H_GROUPS, K_GROUPS, ROMAJI, YOON_PARTS, DAKUTEN_BASE } from "./data/kana.js";
import { PHRASES, CATS, CAT_ICONS, CAT_COLORS } from "./data/phrases.js";
import { THEMES } from "./data/themes.js";
import { SRS_DAYS, KEY, font, mono, RP_SCENARIOS, SKILL_MAP } from "./data/constants.js";
import { fsrsUpdate, stabilityToBox, capBoxBySkills } from "./utils/fsrs.js";

// Utils
import { store, syncLoad, syncSave, defaultD, migrate } from "./utils/storage.js";
import { configureTelemetry, track as telemetryTrack } from "./utils/telemetry.js";
import { makeRecordRetrieval } from "./utils/retrieval.js";
import { _ttsAudio, setTtsAudio, _playAudio, speak, speakPhrase } from "./utils/audio.js";
import { shuffle, daysUntil } from "./utils/helpers.js";

// Components
import Home from "./components/Home.jsx";
import VocabBrowser from "./components/VocabBrowser.jsx";
import Web from "./components/Web.jsx";
import { Skeleton } from "./components/SessionParts.jsx";
import KanaTrainer from "./components/KanaTrainer.jsx";
import PhraseBank from "./components/PhraseBank.jsx";
import SenpaiChat from "./components/SenpaiChat.jsx";
import DailyDrill from "./components/DailyDrill.jsx";
import Onboarding from "./components/Onboarding.jsx";
import Profile from "./components/Profile.jsx";
import Layout from "./components/Layout.jsx";
import JapanMap from "./components/JapanMap.jsx";

export default function App(){
  const { user, isLoaded: clerkLoaded } = useUser();
  const { getToken } = useAuth();

  // Show sign-in/sign-up screen if not authenticated
  // Detect Clerk verification callbacks (email link clicks redirect back with __clerk params)
  const hasClerkCallback = window.location.search.includes("__clerk") || window.location.hash.includes("__clerk");
  const [authMode, setAuthMode] = useState(() => {
    if (hasClerkCallback) return "sign-up";
    return window.location.hash.includes("sign-up") ? "sign-up" : "sign-in";
  });
  useEffect(() => {
    const onHash = () => {
      if (!window.location.href.includes("__clerk")) {
        setAuthMode(window.location.hash.includes("sign-up") ? "sign-up" : "sign-in");
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  if (!clerkLoaded) return null;
  if (!user) return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"radial-gradient(ellipse 80% 50% at 50% 110%, rgba(192,40,42,0.18) 0%, transparent 70%), #0d0d10",gap:24}}>
      <div style={{textAlign:"center",marginBottom:8}}>
        <div style={{fontSize:32,fontWeight:800,letterSpacing:"-.02em",color:"#f0eee9",textShadow:"0 0 40px rgba(192,40,42,0.4)"}}>日本語</div>
        <div style={{fontSize:12,color:"#64646a",letterSpacing:".08em",textTransform:"uppercase",fontFamily:"'SF Mono','Fira Mono',monospace"}}>TinySenpai</div>
      </div>
      {authMode === "sign-up"
        ? <SignUp routing="virtual" afterSignUpUrl="/" signInUrl="#sign-in" />
        : <SignIn routing="virtual" afterSignInUrl="/" signUpUrl="#sign-up" />}
    </div>
  );

  return <AuthedApp user={user} getToken={getToken} />;
}

function AuthedApp({ user, getToken }){
  const { signOut } = useClerk();
  // ?room=N auto-opens game tab at that room
  const _debugRoom = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('room') : null;
  const [tab,setTab]=useState(_debugRoom ? "game" : "kana");
  // startIntent — set by Home hero / Onboarding handoff to tell SmartSession to
  // start immediately (no landing card). Consumed once, cleared after use.
  const [startIntent,setStartIntent]=useState(null);
  const [d,setD]=useState(null);
  const [loaded,setLoaded]=useState(false);
  const [theme,setTheme]=useState(()=>localStorage.getItem("nihongo-theme")||"dark");
  // kana
  const [kScript,setKScript]=useState("h");
  const [kSel,setKSel]=useState([0]);
  const [kSelChars,setKSelChars]=useState(null); // null = use kSel rows, Set = individual chars
  const [kScreen,setKScreen]=useState("menu");
  const [kCards,setKCards]=useState([]);
  const [kI,setKI]=useState(0);
  const [kInput,setKInput]=useState("");
  const [kFb,setKFb]=useState(null);
  const [kScore,setKScore]=useState({c:0,w:0});
  const [kMistakes,setKMistakes]=useState([]);
  const [kPeek,setKPeek]=useState(false);
  const [storyPlaying,setStoryPlaying]=useState(false);
  const [kFlip,setKFlip]=useState(false);
  const [kLI,setKLI]=useState(0);
  const [kQuizMode,setKQuizMode]=useState("visual"); // "visual" | "listen"
  const [kShowGrid,setKShowGrid]=useState(false);
  const [kAutoReveal,setKAutoReveal]=useState(false);
  const [kAutoStory,setKAutoStory]=useState(true);
  const [kSpeakingChar,setKSpeakingChar]=useState(null);
  const [streakCelebrate,setStreakCelebrate]=useState(false);
  // phrases
  const [pCat,setPCat]=useState(null);
  const [pMode,setPMode]=useState("browse");
  const [pCards,setPCards]=useState([]);
  const [pI,setPI]=useState(0);
  const [pFlip,setPFlip]=useState(false);
  const [pDone,setPDone]=useState(false);
  const [pRecall,setPRecall]=useState(false);
  const [fastTrack,setFastTrack]=useState(false);
  // sensei
  const [msgs,setMsgs]=useState([]);
  const [chatIn,setChatIn]=useState("");
  const [loading,setLoading]=useState(false);
  // drill
  const [drillCards,setDrillCards]=useState([]);
  const [drillI,setDrillI]=useState(0);
  const [drillFlip,setDrillFlip]=useState(false);
  const [drillInput,setDrillInput]=useState("");
  const [drillFb,setDrillFb]=useState(null);
  const [drillScore,setDrillScore]=useState({c:0,w:0});
  const [drillDone,setDrillDone]=useState(false);
  // profile
  const [profile,setProfile]=useState(()=>{
    const local=store.get("nihongo-profile");
    return local||{name:"",notes:""};
  });
  const [showProfile,setShowProfile]=useState(false);
  const [onboardStep,setOnboardStep]=useState(0);
  const [onboardAnswers,setOnboardAnswers]=useState({});
  const [syncStatus,setSyncStatus]=useState("idle"); // idle | saving | saved | error
  const [accessGranted,setAccessGranted]=useState(false);
  const [accessCode,setAccessCode]=useState("");
  const [accessError,setAccessError]=useState("");
  const [accessChecking,setAccessChecking]=useState(false);
  const uid = user.id;
  // ui
  const [isDesktop,setIsDesktop]=useState(window.innerWidth>=768);
  const [hov,setHov]=useState(null);
  const inputRef=useRef(null);
  const drillRef=useRef(null);
  const chatEndRef=useRef(null);

  const c=THEMES[theme];
  const SIDEBAR_W=240;

  const toggleTheme=()=>{
    const next=theme==="dark"?"light":"dark";
    setTheme(next);
    localStorage.setItem("nihongo-theme",next);
  };

  const saveProfile=(u)=>{
    const np={...profile,...u};
    setProfile(np);
    store.set("nihongo-profile",np);
    save({profile:np}); // Also sync to DB so it persists across devices
  };

  useEffect(()=>{
    const onResize=()=>setIsDesktop(window.innerWidth>=768);
    window.addEventListener("resize",onResize);
    return()=>window.removeEventListener("resize",onResize);
  },[]);

  // Pre-warm TTS voices
  useEffect(()=>{
    if(window.speechSynthesis) window.speechSynthesis.getVoices();
    const h=()=>window.speechSynthesis.getVoices();
    window.speechSynthesis?.addEventListener?.("voiceschanged",h);
    return()=>window.speechSynthesis?.removeEventListener?.("voiceschanged",h);
  },[]);

  useEffect(()=>{
    configureTelemetry({ getToken });
  },[getToken]);

  useEffect(()=>{
    const init=async()=>{
      const token=await getToken();
      let loadedData=null;
      // 1. Try loading from DB (source of truth)
      const remote=await syncLoad(token);
      if(remote?.data){
        const oldStreak=remote.data.streak||1;
        const nd=migrate(remote.data);
        setD(nd);
        store.set(KEY,nd);
        loadedData=nd;
        setAccessGranted(true); // existing user — skip access code
        if(nd.streak>oldStreak){setStreakCelebrate(true);setTimeout(()=>setStreakCelebrate(false),3500);}
      } else {
        // 2. First sign-in — migrate any existing localStorage data up to DB
        const local=store.get(KEY);
        if(local){
          const oldStreak=local.streak||1;
          const nd=migrate(local);
          setD(nd);
          store.set(KEY,nd);
          syncSave(token,nd);
          loadedData=nd;
          setAccessGranted(true); // has local data — existing user
          if(nd.streak>oldStreak){setStreakCelebrate(true);setTimeout(()=>setStreakCelebrate(false),3500);}
        }
      }
      // Restore profile from DB if available (cross-device sync)
      if(loadedData?.profile){setProfile(p=>({...p,...loadedData.profile}));store.set("nihongo-profile",loadedData.profile);}
      setLoaded(true);
    };
    init();
  },[]);// eslint-disable-line

  const data=d||defaultD();

  // atomic save — localStorage + DB
  const syncTimer=useRef(null);
  const save=useCallback((u={})=>{
    setD(prev=>{
      const nd={...defaultD(),...prev,...u};
      store.set(KEY,nd);
      clearTimeout(syncTimer.current);
      setSyncStatus("saving");
      syncTimer.current=setTimeout(async()=>{
        const token=await getToken();
        syncSave(token,nd)
          .then(()=>setSyncStatus("saved"))
          .catch(()=>setSyncStatus("error"));
        setTimeout(()=>setSyncStatus("idle"),2000);
      },1500);
      return nd;
    });
  },[getToken]);

  const verifyAccessCode=async()=>{
    if(!accessCode.trim()){setAccessError("Please enter an access code");return;}
    setAccessChecking(true);
    setAccessError("");
    try{
      const r=await fetch("/api/verify-code",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:accessCode.trim()})});
      const j=await r.json();
      if(j.valid){setAccessGranted(true);}
      else{setAccessError("Invalid access code");}
    }catch{setAccessError("Something went wrong — try again");}
    setAccessChecking(false);
  };

  useEffect(()=>{
    if(kScreen==="quiz"&&!kFb&&inputRef.current)inputRef.current.focus();
  },[kI,kFb,kScreen]);
  useEffect(()=>{
    if(kScreen==="quiz"&&kQuizMode==="listen"&&!kFb&&kCards[kI])speak(kCards[kI]);
  },[kI,kFb,kScreen,kQuizMode]);// eslint-disable-line

  useEffect(()=>{
    if(drillFb===null&&tab==="drill"&&drillCards[drillI]?.type==="kana"&&drillRef.current)drillRef.current.focus();
  },[drillI,drillFb,tab]);

  useEffect(()=>{
    if(chatEndRef.current)chatEndRef.current.scrollIntoView({behavior:"smooth"});
  },[msgs]);

  useEffect(()=>{
    if(tab==="sensei"&&msgs.length===0&&loaded&&d)autoGreet();
  },[tab,msgs.length]);// eslint-disable-line

  // Global Enter key — advance through learn/quiz without touching mouse
  useEffect(()=>{
    const handler=(e)=>{
      if(e.key!=="Enter") return;
      if(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA") return;
      if(kScreen==="learn"){
        e.preventDefault();
        if(!kFlip){setKFlip(true);}
        else{
          const chars=(kScript==="h"?H_GROUPS:K_GROUPS).flatMap((_,i)=>kSel.includes(i)?(kScript==="h"?H_GROUPS:K_GROUPS)[i].c:[]);
          stopAudio();
          if(kLI<chars.length-1){setKLI(l=>l+1);setKFlip(false);}
          else startKanaQuiz();
        }
      }
      if(kScreen==="quiz"&&kFb){e.preventDefault();nextKana();}
    };
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  },[kScreen,kFlip,kLI,kFb,kSel,kScript]);// eslint-disable-line

  const groups=kScript==="h"?H_GROUPS:K_GROUPS;
  const allKana=kSelChars?[...kSelChars]:kSel.flatMap(i=>groups[i]?.c||[]);

  // kana SRS helpers
  const getKBox=(ch)=>data.kana[ch]?.box??0;
  const isKanaDue=(ch)=>Date.now()>=(data.kana[ch]?.next??0);
  const kMastered=Object.values(data.kana).filter(v=>(v?.box??0)>=3).length;
  const kDueCount=Object.keys(data.kana).filter(ch=>(data.kana[ch]?.box??0)>=1&&isKanaDue(ch)).length;

  // phrase helpers
  const getPhrBox=(id)=>data.phr[id]?.box||0;
  const isPhrDue=(id)=>Date.now()>=(data.phr[id]?.next||0);
  const dueCount=PHRASES.filter(p=>isPhrDue(p[0])).length;
  const learnedPhr=Object.keys(data.phr).length;

  // mission critical
  const MC_PHRASES=PHRASES.filter(p=>p[6]);
  const mcLeft=MC_PHRASES.filter(p=>getPhrBox(p[0])<4).length;

  // ═══ XP & LEVEL SYSTEM ═══
  const LEVEL_THRESHOLDS=[0,100,300,600,1000,1500,2200,3000,4000,5500,7500];
  const getLevel=(xp)=>{for(let i=LEVEL_THRESHOLDS.length-1;i>=0;i--){if(xp>=LEVEL_THRESHOLDS[i])return i+1;}return 1;};
  const getXPForNext=(xp)=>{const lv=getLevel(xp);return lv>=LEVEL_THRESHOLDS.length?null:LEVEL_THRESHOLDS[lv];};

  // ═══ BADGE DEFINITIONS ═══
  const BADGE_DEFS=[
    {id:"first-session",icon:"🎯",label:"First Steps",desc:"Complete your first session"},
    {id:"streak-3",icon:"🔥",label:"Consistent",desc:"3-day streak"},
    {id:"streak-7",icon:"💪",label:"Dedicated",desc:"7-day streak"},
    {id:"kana-10",icon:"あ",label:"Kana Beginner",desc:"Learn 10 kana"},
    {id:"kana-46",icon:"🌸",label:"Hiragana Master",desc:"Learn all hiragana"},
    {id:"kana-92",icon:"⭐",label:"Kana Master",desc:"Learn all 92 base kana"},
    {id:"phrase-10",icon:"💬",label:"Phrase Builder",desc:"Learn 10 phrases"},
    {id:"phrase-50",icon:"🗣️",label:"Conversationalist",desc:"Learn 50 phrases"},
    {id:"s-rank-1",icon:"🏅",label:"Perfectionist",desc:"Get your first S rank"},
    {id:"s-rank-5",icon:"🏆",label:"Elite",desc:"Get 5 S ranks"},
    {id:"s-rank-10",icon:"👑",label:"Senpai's Favourite",desc:"Get 10 S ranks"},
    {id:"explorer",icon:"🗾",label:"Explorer",desc:"Visit all 8 map regions"},
  ];

  const checkBadges=(d)=>{
    const badges=d.settings?.badges||[];
    const earned=[...badges];
    const sc=d.settings?.sessionCount||0;
    const sr=d.settings?.sRanks||0;
    const kn=Object.keys(d.kana||{}).filter(ch=>(d.kana[ch]?.box||0)>=1).length;
    const pn=Object.keys(d.phr||{}).filter(id=>(d.phr[id]?.box||0)>=1).length;
    const stk=d.streak||1;
    const visited=d.settings?.regionsVisited||[];
    const checks=[
      ["first-session",sc>=1],["streak-3",stk>=3],["streak-7",stk>=7],
      ["kana-10",kn>=10],["kana-46",kn>=46],["kana-92",kn>=92],
      ["phrase-10",pn>=10],["phrase-50",pn>=50],
      ["s-rank-1",sr>=1],["s-rank-5",sr>=5],["s-rank-10",sr>=10],
      ["explorer",visited.length>=8],
    ];
    let changed=false;
    checks.forEach(([id,cond])=>{if(cond&&!earned.includes(id)){earned.push(id);changed=true;}});
    return changed?earned:null;
  };

  // ═══ ANSWER LOGGING ═══
  const logAnswer=(prev,item,correct,type,responseMs)=>{
    const log=[...(prev.answerLog||[]),{item,correct,type,ts:Date.now(),ms:responseMs||0}];
    if(log.length>200)log.splice(0,log.length-200);
    return log;
  };

  // SKILL_MAP moved to src/data/constants.js so retrieval.js (and any future
  // wrapper) can import it directly without React-scope plumbing.

  const reviewPhr=(id,correct,exerciseType,responseMs)=>{
    setD(prev=>{
      const cur=prev.phr[id]||{box:0,next:0};
      const fsrsData=cur.stability?{stability:cur.stability,difficulty:cur.difficulty,lastReview:cur.lastReview}:null;
      const result=fsrsUpdate(fsrsData,correct,responseMs,exerciseType);
      const rawBox=stabilityToBox(result.stability);
      const errors=prev.errors||{};
      if(!correct){errors[id]=(errors[id]||0)+1;}
      else if(errors[id]>0){errors[id]=Math.max(0,errors[id]-2);} // Correct answers heal leech status (2x faster)
      // Multi-dimensional skill tracking
      const skills={...(prev.skills||{})};
      const skill=SKILL_MAP[exerciseType]||"visual";
      const curSkill={...(skills[id]||{visual:0,listen:0,production:0})};
      curSkill[skill]=correct?Math.min((curSkill[skill]||0)+1,5):Math.max((curSkill[skill]||0)-1,0);
      skills[id]=curSkill;
      // Anti-illusion-of-fluency: cap box by skill breadth, not just FSRS stability.
      const newBox=capBoxBySkills(rawBox,curSkill);
      // Pushed-output: track last production-mode retrieval for stale-bias selection
      const isProduction=skill==="production";
      const answerLog=logAnswer(prev,id,correct,exerciseType||"phrase",responseMs);
      telemetryTrack("attempt",{kind:"phrase",item:id,correct,type:exerciseType||"phrase",ms:responseMs||0,box:newBox,rawBox,skillCap:rawBox!==newBox});
      const phrRow={
        box:newBox,
        next:result.nextMs,
        stability:result.stability,
        difficulty:result.difficulty,
        lastReview:Date.now(),
        ...(isProduction&&correct?{lastProducedTs:Date.now()}:cur.lastProducedTs?{lastProducedTs:cur.lastProducedTs}:{}),
      };
      const nd={...prev,phr:{...prev.phr,[id]:phrRow},errors,answerLog,skills,totalC:correct?prev.totalC+1:prev.totalC};
      store.set(KEY,nd);
      clearTimeout(syncTimer.current);
      syncTimer.current=setTimeout(async()=>{const token=await getToken();syncSave(token,nd);},2000);
      return nd;
    });
  };

  // ── Unified retrieval contract — single SRS-write entry point ──
  // Every retrieval surface (Learn, Vocab Test, PhraseBank, Drill, Web quiz)
  // calls this instead of reviewPhr directly. Throttle + box-floor +
  // session-cap + stuck-list + telemetry all live in retrieval.js.
  // Session counters reset on App mount, matching prior per-mount semantics.
  const sessionCountersRef = useRef({ demotes: {} });
  const recordRetrieval = useMemo(
    () => makeRecordRetrieval({
      reviewPhr,
      getPhrBox,
      sessionCounters: sessionCountersRef.current,
    }),
    // reviewPhr/getPhrBox are stable references in this component scope —
    // including them satisfies the linter without causing re-creation.
    [reviewPhr, getPhrBox]
  );

  // Record a learner's metacognition on a wrong answer. Stored additively in
  // data.errorReasons[id] = { sounded: n, similar: n, unknown: n }. Leaves
  // data.errors[id] (the leech counter) untouched. Slamecka & Graf 1978
  // generation effect: the act of categorizing the mistake is itself a learning
  // moment. Data later feeds smarter leech routing.
  const recordErrorReason=(id,reason)=>{
    if(!id||!reason) return;
    setD(prev=>{
      const cur=(prev.errorReasons||{})[id]||{sounded:0,similar:0,unknown:0};
      const nd={...prev,errorReasons:{...(prev.errorReasons||{}),[id]:{...cur,[reason]:(cur[reason]||0)+1}}};
      store.set(KEY,nd);
      clearTimeout(syncTimer.current);
      syncTimer.current=setTimeout(async()=>{const token=await getToken();syncSave(token,nd);},2000);
      return nd;
    });
  };

  const updateKanaSRS=(ch,correct,exerciseType,responseMs)=>{
    setD(prev=>{
      const cur=prev.kana[ch]||{box:0,next:0};
      const fsrsData=cur.stability?{stability:cur.stability,difficulty:cur.difficulty,lastReview:cur.lastReview}:null;
      const result=fsrsUpdate(fsrsData,correct,responseMs,exerciseType);
      const rawBox=stabilityToBox(result.stability);
      const errors=prev.errors||{};
      if(!correct){errors[ch]=(errors[ch]||0)+1;}
      else if(errors[ch]>0){errors[ch]=Math.max(0,errors[ch]-2);} // Correct answers heal leech status
      const skills={...(prev.skills||{})};
      const skill=SKILL_MAP[exerciseType]||"visual";
      const curSkill={...(skills[ch]||{visual:0,listen:0,production:0})};
      curSkill[skill]=correct?Math.min((curSkill[skill]||0)+1,5):Math.max((curSkill[skill]||0)-1,0);
      skills[ch]=curSkill;
      const newBox=capBoxBySkills(rawBox,curSkill);
      const answerLog=logAnswer(prev,ch,correct,exerciseType||"kana",responseMs);
      telemetryTrack("attempt",{kind:"kana",item:ch,correct,type:exerciseType||"kana",ms:responseMs||0,box:newBox,rawBox,skillCap:rawBox!==newBox});
      const nd={...prev,kana:{...prev.kana,[ch]:{box:newBox,next:result.nextMs,stability:result.stability,difficulty:result.difficulty,lastReview:Date.now()}},errors,answerLog,skills};
      store.set(KEY,nd);
      clearTimeout(syncTimer.current);
      syncTimer.current=setTimeout(async()=>{const token=await getToken();syncSave(token,nd);},2000);
      return nd;
    });
  };

  const startKanaQuiz=(chars)=>{
    const pool=chars||allKana;
    setKCards(shuffle(pool));setKI(0);setKInput("");setKFb(null);
    setKScore({c:0,w:0});setKMistakes([]);setKPeek(false);setKScreen("quiz");
  };

  const submitKana=()=>{
    if(kFb||!kInput.trim())return;
    const ch=kCards[kI];const rom=ROMAJI[ch];
    const ok=kInput.trim().toLowerCase()===rom;
    const trueOk=ok&&!kPeek; // Peeked answers don't count as mastered
    if(ok){setKFb("ok");setKScore(s=>({...s,c:s.c+1}));}
    else{setKFb("no");setKScore(s=>({...s,w:s.w+1}));setKMistakes(m=>[...m,{ch,rom,ans:kInput.trim()}]);}
    updateKanaSRS(ch,trueOk);
    setTimeout(()=>speak(ch),250);
  };

  const nextKana=()=>{
    if(kI+1>=kCards.length){
      setKScreen("results");
      save({sessions:(data.sessions||0)+1});
    } else {setKI(kI+1);setKInput("");setKFb(null);setKPeek(false);}
  };

  const startDrill=()=>{
    // 5 kana: due first, then unseen
    const dueK=shuffle(Object.keys(data.kana).filter(ch=>isKanaDue(ch)&&(data.kana[ch]?.box??0)>=1)).slice(0,5);
    const newK=dueK.length<5?shuffle(Object.keys(M).filter(ch=>!data.kana[ch])).slice(0,5-dueK.length):[];
    const kanaSet=[...dueK,...newK].map(ch=>({type:"kana",ch}));
    // 5 phrases: due first, then unseen
    const dueP=shuffle(PHRASES.filter(p=>isPhrDue(p[0])&&data.phr[p[0]])).slice(0,5);
    const newP=dueP.length<5?shuffle(PHRASES.filter(p=>!data.phr[p[0]])).slice(0,5-dueP.length):[];
    const phrSet=[...dueP,...newP].map(p=>({type:"phrase",p}));
    const cards=shuffle([...kanaSet,...phrSet]);
    setDrillCards(cards);setDrillI(0);setDrillFlip(false);setDrillInput("");
    setDrillFb(null);setDrillScore({c:0,w:0});setDrillDone(false);
    setTab("drill");
  };

  const submitDrillKana=()=>{
    if(drillFb||!drillInput.trim())return;
    const ch=drillCards[drillI].ch;
    const rom=ROMAJI[ch];
    const ok=drillInput.trim().toLowerCase()===rom;
    if(ok){setDrillFb("ok");setDrillScore(s=>({...s,c:s.c+1}));}
    else{setDrillFb("no");setDrillScore(s=>({...s,w:s.w+1}));}
    updateKanaSRS(ch,ok);
  };

  const advanceDrill=()=>{
    if(drillI+1>=drillCards.length){setDrillDone(true);}
    else{setDrillI(drillI+1);setDrillFlip(false);setDrillInput("");setDrillFb(null);}
  };

  const sendToSensei=async(overrideMsgs)=>{
    const msgs_to_use=overrideMsgs||null;
    if(!msgs_to_use&&(!chatIn.trim()||loading))return;
    const userMsg=msgs_to_use?null:{role:"user",content:chatIn.trim()};
    const newMsgs=msgs_to_use||[...msgs,userMsg];
    setMsgs(newMsgs);setChatIn("");setLoading(true);

    const hMastered=Object.entries(data.kana).filter(([k])=>k.charCodeAt(0)>=0x3040&&k.charCodeAt(0)<=0x309F).filter(([_,v])=>(v?.box??0)>=3).length;
    const kaMastered=Object.entries(data.kana).filter(([k])=>k.charCodeAt(0)>=0x30A0&&k.charCodeAt(0)<=0x30FF).filter(([_,v])=>(v?.box??0)>=3).length;

    const nameLine=profile.name?`User's name is ${profile.name}. `:"";
    const notesLine=profile.notes?`User context: ${profile.notes.slice(0,200)}. `:"";
    const streakLine=`Streak: ${data.streak||1} day${(data.streak||1)!==1?"s":""}.`;

    const ob=data.onboarding||{};
    const whyMap={travel:"travelling to Japan",anime:"interested in anime and Japanese culture",work:"learning for work or study",moving:"planning to live in Japan",curious:"curious about Japanese"};
    const levelMap={beginner:"complete beginner",basics:"knows a few words and phrases",refresh:"studied before and is refreshing",intermediate:"intermediate level"};
    const whyLine=ob.why?`Reason for learning: ${whyMap[ob.why]||ob.why}. `:"";
    const levelLine=`Level: ${levelMap[ob.level]||"complete beginner"}. `;
    const focusLine=ob.focus?`Specific focus: ${ob.focus}. `:"";
    const tripLine=ob.tripDate&&daysUntil(ob.tripDate)>0?`Trip date: ${ob.tripDate} (${daysUntil(ob.tripDate)} days away). `:"";
    const sysPrompt=`You are Senpai, a friendly Japanese tutor built into a learning app.

${nameLine}${whyLine}${levelLine}${focusLine}${tripLine}${notesLine}
PROGRESS: Hiragana ${hMastered}/46 mastered. Katakana ${kaMastered}/46 mastered. Phrases ${learnedPhr}/${PHRASES.length} learned. ${dueCount} phrases due for review. ${streakLine}

RULES:
- Plain English, no jargon
- Pronunciations with syllable breaks using dashes (e.g. su-mi-ma-sen)
- Concise and practical, tailored to the user's goal above
- Roleplay scenarios fully when asked (you play the Japanese speaker, provide English in parentheses)
- Give cultural context naturally
- Adapt difficulty to the level and progress shown above
- Short focused responses, this is a chat not an essay
- Never use em dashes or special characters in prose`;

    try{
      const response=await fetch("/api/chat",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({system:sysPrompt,messages:newMsgs.slice(-20)})
      });
      const json=await response.json();
      const reply=json.content?.map(c=>c.text||"").join("\n")||json.error||"Couldn't get a response. Check your API key is set.";
      setMsgs([...newMsgs,{role:"assistant",content:reply}]);
    }catch(e){
      setMsgs([...newMsgs,{role:"assistant",content:"Connection error. Make sure ANTHROPIC_API_KEY is set in Vercel environment variables."}]);
    }
    setLoading(false);
  };

  const autoGreet=async()=>{
    setLoading(true);
    const hMastered=Object.entries(data.kana).filter(([k])=>k.charCodeAt(0)>=0x3040&&k.charCodeAt(0)<=0x309F).filter(([_,v])=>(v?.box??0)>=3).length;
    const ob=data.onboarding||{};
    const whyMap={travel:"travelling to Japan",anime:"interested in anime and Japanese culture",work:"learning for work or study",moving:"planning to live in Japan",curious:"curious about Japanese"};
    const levelMap={beginner:"complete beginner",basics:"knows a few words and phrases",refresh:"studied before and is refreshing",intermediate:"intermediate level"};
    const nameLine=profile.name?`User's name is ${profile.name}. `:"";
    const whyLine=ob.why?`Reason for learning: ${whyMap[ob.why]||ob.why}. `:"";
    const levelLine=`Level: ${levelMap[ob.level]||"complete beginner"}. `;
    const tripLine=ob.tripDate&&daysUntil(ob.tripDate)>0?`Trip in ${daysUntil(ob.tripDate)} days. `:"";
    const sysPrompt=`You are Senpai, a friendly Japanese tutor. ${nameLine}${whyLine}${levelLine}${tripLine}
STATS: Hiragana ${hMastered}/46 mastered. ${dueCount} phrases due for review. Streak: ${data.streak||1} day${(data.streak||1)!==1?"s":""}.
Give a SHORT proactive opening message: 2-3 sentences max. Mention their specific stats (kana count, phrases due, streak, or trip countdown if relevant). End with one concrete suggestion or question to get them started. Be warm and direct, like a tutor checking in.`;
    try{
      const response=await fetch("/api/chat",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({system:sysPrompt,messages:[{role:"user",content:"(opening — greet me proactively)"}],max_tokens:200})
      });
      const json=await response.json();
      const reply=json.content?.map(c=>c.text||"").join("\n")||json.error||"";
      if(reply)setMsgs([{role:"assistant",content:reply}]);
    }catch(e){}
    setLoading(false);
  };

  const startRolePlay=async(scenario)=>{
    if(loading)return;
    const kickoff=[{role:"user",content:scenario.prompt}];
    setMsgs(kickoff);setChatIn("");setLoading(true);
    const hM=Object.entries(data.kana).filter(([k])=>k.charCodeAt(0)>=0x3040&&k.charCodeAt(0)<=0x309F).filter(([_,v])=>(v?.box??0)>=3).length;
    const kaM=Object.entries(data.kana).filter(([k])=>k.charCodeAt(0)>=0x30A0&&k.charCodeAt(0)<=0x30FF).filter(([_,v])=>(v?.box??0)>=3).length;
    const nameLine=profile.name?`User's name is ${profile.name}. `:"";
    const ob2=data.onboarding||{};
    const levelMap2={beginner:"complete beginner",basics:"knows a few words",refresh:"studied before",intermediate:"intermediate"};
    const sysPrompt=`You are Senpai, a Japanese tutor doing a role-play scenario. ${nameLine}Level: ${levelMap2[ob2.level]||"beginner"}.
PROGRESS: Hiragana ${hM}/46. Katakana ${kaM}/46. Phrases ${learnedPhr}/${PHRASES.length}.
ROLE-PLAY RULES: You play the Japanese speaker. Always respond in Japanese first, then provide the English translation in parentheses. Keep turns short (1-3 sentences). After 2-3 exchanges, gently note if the user should use a specific phrase from their studies. Adapt difficulty to the user's level.`;
    try{
      const response=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system:sysPrompt,messages:kickoff.slice(-20)})});
      const json=await response.json();
      const reply=json.content?.map(c=>c.text||"").join("\n")||json.error||"Error";
      setMsgs([...kickoff,{role:"assistant",content:reply}]);
    }catch(e){
      setMsgs([...kickoff,{role:"assistant",content:"Connection error."}]);
    }
    setLoading(false);
  };

  // ═══ SHARED STYLES ═══
  const card={background:c.s,border:"1px solid "+c.b,borderRadius:12,padding:16};
  const btn={fontFamily:font,cursor:"pointer",border:"none",transition:"all .15s"};
  const chip=(color)=>({display:"inline-flex",alignItems:"center",padding:"3px 9px",borderRadius:20,fontSize:11,fontWeight:600,background:color+"22",color:color,border:"1px solid "+color+"44"});
  const speakBtnFn=(text)=><button onClick={e=>{e.stopPropagation();speak(text);}} style={{...btn,padding:"5px 10px",borderRadius:8,background:c.s2,border:"1px solid "+c.b,fontSize:15,color:c.m,marginTop:8,flexShrink:0}} title="Listen">🔊</button>;
  const kbHint=k=>isDesktop?<span style={{fontSize:10,opacity:0.3,fontFamily:mono,marginLeft:6}}>{k}</span>:null;
  const stopAudio=()=>{if(_ttsAudio){_ttsAudio.pause();setTtsAudio(null);}if(window.speechSynthesis)window.speechSynthesis.cancel();setStoryPlaying(false);};
  const speakYoon=(ch)=>{
    if(!ch||!YOON_PARTS[ch]) return;
    if(storyPlaying){stopAudio();return;}
    setStoryPlaying(true);
    const done=()=>setStoryPlaying(false);
    const [base]=YOON_PARTS[ch];
    const baseUrl=`/api/tts?lang=ja&q=${encodeURIComponent(base)}`;
    const bridgeUrl=`/audio/dakuten/bridge_yoon.mp3`;
    const comboUrl=`/api/tts?lang=ja&q=${encodeURIComponent(ch)}`;
    const a1=new Audio(baseUrl);a1.playbackRate=0.85;setTtsAudio(a1);
    a1.onended=()=>{const a2=new Audio(bridgeUrl);setTtsAudio(a2);a2.onended=()=>{const a3=new Audio(comboUrl);a3.playbackRate=0.85;setTtsAudio(a3);a3.onended=done;a3.onerror=done;a3.play().catch(done);};a2.onerror=done;a2.play().catch(done);};
    a1.onerror=done;a1.play().catch(done);
  };
  const speakDakuten=(ch)=>{
    if(!ch||!DAKUTEN_BASE[ch]) return;
    if(storyPlaying){stopAudio();return;}
    setStoryPlaying(true);
    const done=()=>setStoryPlaying(false);
    const baseCh=DAKUTEN_BASE[ch];
    const isHdk=["ぱ","ぴ","ぷ","ぺ","ぽ","パ","ピ","プ","ペ","ポ"].includes(ch);
    const bridgeUrl=`/audio/dakuten/bridge_${isHdk?"handakuten":"dakuten"}.mp3`;
    const baseUrl=`/api/tts?lang=ja&q=${encodeURIComponent(baseCh)}`;
    const modUrl=`/api/tts?lang=ja&q=${encodeURIComponent(ch)}`;
    const a1=new Audio(baseUrl);a1.playbackRate=0.85;setTtsAudio(a1);
    a1.onended=()=>{const a2=new Audio(bridgeUrl);setTtsAudio(a2);a2.onended=()=>{const a3=new Audio(modUrl);a3.playbackRate=0.85;setTtsAudio(a3);a3.onended=done;a3.onerror=done;a3.play().catch(done);};a2.onerror=done;a2.play().catch(done);};
    a1.onerror=done;a1.play().catch(done);
  };
  const speakStory=(m,ch)=>{
    if(!m||!ch) return;
    if(storyPlaying){stopAudio();return;}
    setStoryPlaying(true);
    const done=()=>setStoryPlaying(false);
    const cp=ch.codePointAt(0).toString(16);
    // Preload story + kana audio for minimal gaps
    const storyUrl=`/audio/story3/${cp}.mp3`;
    const kanaUrl=`/api/tts?lang=ja&q=${encodeURIComponent(ch)}`;
    const preStory=new Audio(storyUrl); preStory.playbackRate=1.1;
    const preKana2=new Audio(kanaUrl); preKana2.playbackRate=0.85;
    // Chain: JP kana -> English story -> JP kana again
    const playKana1=()=>{
      const k=new Audio(kanaUrl);
      k.playbackRate=0.85; setTtsAudio(k);
      k.onended=()=>{setTtsAudio(preStory);preStory.onended=()=>{setTtsAudio(preKana2);preKana2.onended=done;preKana2.onerror=done;preKana2.play().catch(done);};preStory.onerror=done;preStory.play().catch(done);};
      k.onerror=done;
      k.play().catch(done);
    };
    playKana1();
  };
  const storyBtnFn=(m,ch)=>m?<button onClick={e=>{e.stopPropagation();speakStory(m,ch);}} style={{...btn,padding:"10px 16px",borderRadius:8,background:storyPlaying?c.a+"22":c.s2,border:"1px solid "+(storyPlaying?c.a:c.b),fontSize:13,color:storyPlaying?c.a:c.m,width:"100%",flexShrink:0}}>
    {storyPlaying?"■ stop":"🔊 story"}
  </button>:null;

  const redGlow=theme==="dark"?"radial-gradient(ellipse 70% 35% at 50% 105%, rgba(192,40,42,0.13) 0%, transparent 100%)":"none";
  const wrap={fontFamily:font,background:theme==="dark"?`${redGlow}, ${c.bg}`:c.bg,color:c.tx,minHeight:"100vh",paddingBottom:isDesktop?0:70,paddingLeft:isDesktop?SIDEBAR_W:0};
  const inner={maxWidth:isDesktop?740:540,margin:"0 auto",padding:"28px 20px 36px"};

  if(!loaded)return(
    <div style={wrap}>
      <div style={inner}>
        <div style={{marginBottom:18}}>
          <Skeleton width="60%" height={32} radius={8} style={{marginBottom:10}}/>
          <div style={{display:"flex",gap:8}}>
            <Skeleton width={110} height={22} radius={999}/>
            <Skeleton width={90}  height={22} radius={999}/>
          </div>
        </div>
        <Skeleton height={72} radius={12} style={{marginBottom:16}}/>
        <div style={{display:"flex",gap:6,marginBottom:12}}>
          {Array.from({length:5}).map((_,i)=><Skeleton key={i} height={62} radius={12} style={{flex:1}}/>)}
        </div>
        <Skeleton height={46} radius={12} style={{marginBottom:10}}/>
        <Skeleton height={96} radius={12} style={{marginBottom:10}}/>
        <Skeleton height={160} radius={12}/>
      </div>
    </div>
  );

  // ═══ ACCESS CODE GATE (new users only) ═══
  if(loaded&&!accessGranted)return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:theme==="dark"?`radial-gradient(ellipse 80% 50% at 50% 110%, rgba(192,40,42,0.18) 0%, transparent 70%), ${c.bg}`:c.bg,padding:24,color:c.tx,fontFamily:font}}>
      <div style={{width:"100%",maxWidth:380,textAlign:"center"}}>
        <div style={{fontSize:36,fontWeight:800,letterSpacing:"-.02em",marginBottom:4}}>日本語</div>
        <div style={{fontSize:12,color:c.m,fontFamily:mono,textTransform:"uppercase",letterSpacing:".08em",marginBottom:32}}>TinySenpai</div>
        <div style={{fontSize:18,fontWeight:600,marginBottom:8}}>Early Access</div>
        <div style={{fontSize:14,color:c.m,marginBottom:24,lineHeight:1.5}}>TinySenpai is currently invite-only. Enter your access code to continue.</div>
        <input
          type="text"
          value={accessCode}
          onChange={e=>{setAccessCode(e.target.value);setAccessError("");}}
          onKeyDown={e=>{if(e.key==="Enter")verifyAccessCode();}}
          placeholder="Enter access code"
          style={{width:"100%",padding:"12px 16px",fontSize:15,background:c.s,color:c.tx,border:"1px solid "+(accessError?c.a:c.b),borderRadius:10,outline:"none",fontFamily:font,boxSizing:"border-box",marginBottom:8}}
        />
        {accessError&&<div style={{fontSize:13,color:c.a,marginBottom:8}}>{accessError}</div>}
        <button
          onClick={verifyAccessCode}
          disabled={accessChecking}
          style={{width:"100%",padding:"12px 0",fontSize:15,fontWeight:600,background:c.a,color:"#fff",border:"none",borderRadius:10,cursor:accessChecking?"wait":"pointer",opacity:accessChecking?0.7:1,fontFamily:font,marginTop:4}}
        >{accessChecking?"Checking...":"Continue"}</button>
        <div style={{fontSize:12,color:c.m,marginTop:16}}>Don't have a code? Contact the creator for access.</div>
      </div>
    </div>
  );

  const globalCSS=`@keyframes streakPop{0%{transform:scale(1)}30%{transform:scale(1.5)}60%{transform:scale(.9)}100%{transform:scale(1)}}@keyframes streakGlow{0%,100%{text-shadow:0 0 8px rgba(255,120,50,.2)}50%{text-shadow:0 0 28px rgba(255,120,50,.7)}}@keyframes fadeInUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`;

  // ═══ TABS & ROUTING ═══
  const tabs=[{id:"home",icon:"🏠",label:"Home"},{id:"smart",icon:"▶",label:"Learn"},{id:"kana",icon:"あ",label:"Kana"},{id:"phrases",icon:"💬",label:"Phrases"},{id:"vocab",icon:"📚",label:"Vocab"},{id:"web",icon:"🕸️",label:"Web"},{id:"map",icon:"🗾",label:"Map"},{id:"sensei",icon:"🎌",label:"Senpai"},{id:"game",icon:"⚔️",label:"Game"}];
  const handleTabClick=(id)=>{
    stopAudio(); // Stop any playing audio on tab switch
    setTab(id);
    if(id==="phrases"){setPMode("browse");setPCat(null);setPCards([]);setPDone(false);setFastTrack(false);}
    if(id==="kana")setKScreen("menu");
    if(id==="drill"){setDrillCards([]);setDrillI(0);setDrillFb(null);setDrillScore({c:0,w:0});setDrillDone(false);}
    if(id==="sensei"){}
  };

  if(loaded&&!data.onboarded)return <Onboarding
    c={c} theme={theme} card={card} btn={btn}
    onboardStep={onboardStep} setOnboardStep={setOnboardStep}
    onboardAnswers={onboardAnswers} setOnboardAnswers={setOnboardAnswers}
    save={save} setTab={setTab} setStartIntent={setStartIntent}
  />;

  return <div style={wrap}>
    <style>{globalCSS}</style>
    {tab==="home"&&<Home
      data={data} save={save} c={c} theme={theme} inner={inner} card={card} btn={btn} chip={chip} mono={mono}
      isDesktop={isDesktop} hov={hov} setHov={setHov} profile={profile} streakCelebrate={streakCelebrate}
      kMastered={kMastered} kDueCount={kDueCount} dueCount={dueCount} learnedPhr={learnedPhr} mcLeft={mcLeft}
      setTab={setTab} setPMode={setPMode} setPCat={setPCat} setPCards={setPCards} setPDone={setPDone} setPFlip={setPFlip} setPI={setPI} setFastTrack={setFastTrack}
      setKCards={setKCards} setKI={setKI} setKInput={setKInput} setKFb={setKFb} setKScore={setKScore} setKMistakes={setKMistakes} setKPeek={setKPeek} setKScreen={setKScreen}
      startDrill={startDrill} isKanaDue={isKanaDue} setStartIntent={setStartIntent}
      LEVEL_THRESHOLDS={LEVEL_THRESHOLDS} getLevel={getLevel} getXPForNext={getXPForNext}
      BADGE_DEFS={BADGE_DEFS}
    />}
    {tab==="kana"&&<KanaTrainer
      data={data} save={save} c={c} theme={theme} inner={inner} card={card} btn={btn} speakBtn={speakBtnFn} storyBtn={storyBtnFn} kbHint={kbHint}
      isDesktop={isDesktop}
      kScript={kScript} setKScript={setKScript} kSel={kSel} setKSel={setKSel} kSelChars={kSelChars} setKSelChars={setKSelChars}
      kScreen={kScreen} setKScreen={setKScreen} kCards={kCards} setKCards={setKCards} kI={kI} setKI={setKI} kInput={kInput} setKInput={setKInput}
      kFb={kFb} setKFb={setKFb} kScore={kScore} setKScore={setKScore} kMistakes={kMistakes} setKMistakes={setKMistakes} kPeek={kPeek} setKPeek={setKPeek}
      kFlip={kFlip} setKFlip={setKFlip} kLI={kLI} setKLI={setKLI} kQuizMode={kQuizMode} setKQuizMode={setKQuizMode}
      kShowGrid={kShowGrid} setKShowGrid={setKShowGrid} kAutoReveal={kAutoReveal} setKAutoReveal={setKAutoReveal} kAutoStory={kAutoStory} setKAutoStory={setKAutoStory}
      kSpeakingChar={kSpeakingChar} setKSpeakingChar={setKSpeakingChar}
      storyPlaying={storyPlaying} setStoryPlaying={setStoryPlaying}
      inputRef={inputRef} allKana={allKana}
      getKBox={getKBox} isKanaDue={isKanaDue} kMastered={kMastered} kDueCount={kDueCount}
      startKanaQuiz={startKanaQuiz} submitKana={submitKana} nextKana={nextKana} updateKanaSRS={updateKanaSRS}
      stopAudio={stopAudio} speakStory={speakStory} speakYoon={speakYoon} speakDakuten={speakDakuten}
    />}
    {tab==="phrases"&&<PhraseBank
      data={data} c={c} inner={inner} card={card} btn={btn} chip={chip}
      isDesktop={isDesktop} hov={hov} setHov={setHov}
      pCat={pCat} setPCat={setPCat} pMode={pMode} setPMode={setPMode} pCards={pCards} setPCards={setPCards} pI={pI} setPI={setPI}
      pFlip={pFlip} setPFlip={setPFlip} pDone={pDone} setPDone={setPDone} pRecall={pRecall} setPRecall={setPRecall}
      fastTrack={fastTrack} setFastTrack={setFastTrack}
      recordRetrieval={recordRetrieval} getPhrBox={getPhrBox} isPhrDue={isPhrDue} dueCount={dueCount} learnedPhr={learnedPhr} mcLeft={mcLeft}
    />}
    {tab==="vocab"&&<VocabBrowser
      data={data} c={c} inner={inner} card={card} btn={btn} isDesktop={isDesktop} theme={theme}
      recordRetrieval={recordRetrieval} getPhrBox={getPhrBox}
    />}
    {tab==="web"&&<Web
      data={data} c={c} inner={inner} btn={btn} isDesktop={isDesktop} theme={theme}
      recordRetrieval={recordRetrieval}
    />}
    {tab==="sensei"&&<SenpaiChat
      data={data} c={c} btn={btn}
      isDesktop={isDesktop} SIDEBAR_W={SIDEBAR_W} hov={hov} setHov={setHov}
      profile={profile}
      msgs={msgs} setMsgs={setMsgs} chatIn={chatIn} setChatIn={setChatIn} loading={loading} setLoading={setLoading}
      chatEndRef={chatEndRef}
      learnedPhr={learnedPhr} dueCount={dueCount}
      sendToSensei={sendToSensei} startRolePlay={startRolePlay}
    />}
    {tab==="drill"&&<DailyDrill
      c={c} inner={inner} card={card} btn={btn} chip={chip} speakBtn={speakBtnFn}
      isDesktop={isDesktop}
      drillCards={drillCards} setDrillCards={setDrillCards} drillI={drillI} setDrillI={setDrillI}
      drillFlip={drillFlip} setDrillFlip={setDrillFlip} drillInput={drillInput} setDrillInput={setDrillInput}
      drillFb={drillFb} setDrillFb={setDrillFb} drillScore={drillScore} setDrillScore={setDrillScore}
      drillDone={drillDone} setDrillDone={setDrillDone}
      drillRef={drillRef}
      submitDrillKana={submitDrillKana} advanceDrill={advanceDrill} startDrill={startDrill} recordRetrieval={recordRetrieval}
      setTab={setTab}
    />}
    {tab==="smart"&&<SmartSession
      data={data} save={save} c={c} inner={inner} card={card} btn={btn} isDesktop={isDesktop}
      updateKanaSRS={updateKanaSRS} recordRetrieval={recordRetrieval} recordErrorReason={recordErrorReason}
      stopAudio={stopAudio} speakStory={speakStory} setTab={setTab}
      startIntent={startIntent} clearStartIntent={()=>setStartIntent(null)}
      LEVEL_THRESHOLDS={LEVEL_THRESHOLDS} getLevel={getLevel} getXPForNext={getXPForNext}
      BADGE_DEFS={BADGE_DEFS} checkBadges={checkBadges}
    />}
    {tab==="map"&&<JapanMap data={data} c={c} inner={inner} card={card} btn={btn} isDesktop={isDesktop}/>}
    {tab==="game"&&<Game theme={theme} c={c} isDesktop={isDesktop} SIDEBAR_W={SIDEBAR_W}/>}
    {showProfile&&<Profile
      c={c} card={card} btn={btn}
      user={user} data={data} save={save} profile={profile} saveProfile={saveProfile}
      syncStatus={syncStatus} showProfile={showProfile} setShowProfile={setShowProfile} signOut={signOut}
    />}

    <Layout
      c={c} theme={theme} btn={btn}
      isDesktop={isDesktop} SIDEBAR_W={SIDEBAR_W}
      tab={tab} handleTabClick={handleTabClick} tabs={tabs}
      profile={profile} setShowProfile={setShowProfile}
      toggleTheme={toggleTheme} syncStatus={syncStatus} kDueCount={kDueCount}
      data={data}
    />
  </div>;
}
