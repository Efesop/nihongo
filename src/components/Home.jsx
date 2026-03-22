import { PHRASES, CATS, CAT_ICONS, CAT_COLORS } from "../data/phrases.js";
import { font, mono } from "../data/constants.js";
import { daysUntil } from "../utils/helpers.js";
import { shuffle } from "../utils/helpers.js";

export default function Home({
  data, save, c, theme, inner, card, btn, chip, mono: _mono,
  isDesktop, hov, setHov, profile, streakCelebrate,
  kMastered, kDueCount, dueCount, learnedPhr, mcLeft,
  setTab, setPMode, setPCat, setPCards, setPDone, setPFlip, setPI, setFastTrack,
  setKCards, setKI, setKInput, setKFb, setKScore, setKMistakes, setKPeek, setKScreen,
  startDrill, isKanaDue, progressBar,
}) {
  const ob=data.onboarding||{};
  const dl=ob.tripDate?daysUntil(ob.tripDate):0;
  const kanaPct=Math.round(kMastered/92*100);
  const phrPct=Math.round(learnedPhr/PHRASES.length*100);
  const totalDue=kDueCount+dueCount;
  const stats=[
    {l:"Kana",v:kanaPct+"%",cl:c.a},
    {l:"Phrases",v:phrPct+"%",cl:c.g},
    {l:"Streak",v:(data.streak||1)+"🔥",cl:c.go},
    {l:"To Review",v:totalDue,cl:totalDue>0?c.go:c.g},
  ];
  const actions=[
    {id:"drill",icon:"🔥",title:"Daily Drill",desc:"5 kana + 5 phrases mixed",action:startDrill},
    {id:"study",icon:"💬",title:"Review Phrases",desc:dueCount>0?`${dueCount} phrases due`:"Learn new phrases",action:()=>{setTab("phrases");setPMode("review");}},
    {id:"kana",icon:"あ",title:"Kana Practice",desc:`${kMastered}/92 mastered${kDueCount>0?" · "+kDueCount+" due":""}`,action:()=>{setTab("kana");setKScreen("menu");}},
    {id:"sensei",icon:"🎌",title:"Ask Senpai",desc:"Roleplay, questions, grammar",action:()=>setTab("sensei")},
  ];
  return <div style={inner}>
    <div style={{marginBottom:24}}>
      <h1 style={{fontSize:28,fontWeight:700,margin:"0 0 6px",letterSpacing:"-.02em",textShadow:theme==="dark"?"0 0 30px rgba(192,40,42,0.35)":"none"}}>{profile.name?`こんにちは, ${profile.name}!`:"日本語 Journey"}</h1>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        {dl>0&&<span style={{fontSize:12,color:c.m,fontFamily:mono}}>{dl} days to go</span>}
        {(data.streak||1)>1&&<span style={{fontSize:12,color:c.a,fontFamily:mono,display:"inline-block",animation:streakCelebrate?"streakPop .6s ease-out, streakGlow 1.5s ease-in-out 3":"none"}}>🔥 {data.streak} day streak</span>}
      </div>
    </div>
    <div style={{display:"flex",gap:6,marginBottom:16}}>
      {stats.map((s,i)=><div key={i} style={{flex:1,...card,textAlign:"center",padding:"12px 6px"}}>
        <div style={{fontSize:19,fontWeight:800,fontFamily:mono,color:s.cl,marginBottom:3}}>{s.v}</div>
        <div style={{fontSize:10,color:c.m,textTransform:"uppercase",letterSpacing:".04em"}}>{s.l}</div>
      </div>)}
    </div>
    {(kDueCount>0||dueCount>0)&&<div style={{...card,marginBottom:8,padding:"14px 16px",background:c.go+"0d",border:"1px solid "+c.go+"33"}}>
      <div style={{fontSize:11,fontFamily:mono,color:c.go,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>🔔 Ready to review</div>
      <div style={{display:"flex",gap:8}}>
        {kDueCount>0&&<button onClick={()=>{
          const due=shuffle(Object.keys(data.kana).filter(ch=>(data.kana[ch]?.box??0)>=1&&isKanaDue(ch)));
          setKCards(due);setKI(0);setKInput("");setKFb(null);setKScore({c:0,w:0});setKMistakes([]);setKPeek(false);setKScreen("quiz");setTab("kana");
        }} onMouseEnter={()=>setHov("rk")} onMouseLeave={()=>setHov(null)}
          style={{...btn,flex:1,padding:"10px 14px",borderRadius:9,background:hov==="rk"?c.go+"33":c.go+"18",border:"1px solid "+c.go+"44",color:c.go,fontSize:13,fontWeight:600}}>あ {kDueCount} kana</button>}
        {dueCount>0&&<button onClick={()=>{setTab("phrases");setPMode("review");}}
          onMouseEnter={()=>setHov("rp")} onMouseLeave={()=>setHov(null)}
          style={{...btn,flex:1,padding:"10px 14px",borderRadius:9,background:hov==="rp"?c.go+"33":c.go+"18",border:"1px solid "+c.go+"44",color:c.go,fontSize:13,fontWeight:600}}>💬 {dueCount} phrases</button>}
      </div>
    </div>}
    {kMastered>=20&&learnedPhr===0&&!data.settings?.phrasesNudgeShown&&<div onClick={()=>{save({settings:{...data.settings,phrasesNudgeShown:true}});setTab("phrases");setFastTrack(true);setPMode("review");setPCards([]);setPDone(false);setPFlip(false);setPI(0);}}
      style={{...card,marginBottom:8,cursor:"pointer",padding:"14px 16px",background:c.g+"0d",border:"1px solid "+c.g+"33"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:20}}>🎯</span>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:600,color:c.g}}>Ready for phrases!</div>
          <div style={{fontSize:12,color:c.m,marginTop:2}}>You can read {kMastered} characters — time to learn survival phrases</div>
        </div>
        <span style={{color:c.g,opacity:.5}}>→</span>
      </div>
    </div>}
    {mcLeft>0&&<div onClick={()=>{setTab("phrases");setFastTrack(true);setPMode("review");setPCards([]);setPDone(false);setPFlip(false);setPI(0);}}
      onMouseEnter={()=>setHov("ft")} onMouseLeave={()=>setHov(null)}
      style={{...card,marginBottom:8,cursor:"pointer",padding:"11px 16px",background:hov==="ft"?c.as:c.s,border:"1px solid "+c.a+"50",transition:"background .15s"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:20,flexShrink:0}}>⚡</span>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:600,color:c.a}}>Fast Track</div>
          <div style={{fontSize:11,color:c.m,marginTop:1}}>{mcLeft} mission-critical phrases left</div>
        </div>
        <span style={{fontSize:14,color:c.m,opacity:.4}}>›</span>
      </div>
    </div>}
    {actions.map(item=><div key={item.id} onClick={item.action}
      onMouseEnter={()=>setHov(item.id)} onMouseLeave={()=>setHov(null)}
      style={{...card,marginBottom:8,cursor:"pointer",padding:"13px 16px",background:hov===item.id?c.s2:c.s,transition:"background .15s"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:22,lineHeight:1,flexShrink:0}}>{item.icon}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:600}}>{item.title}</div>
          <div style={{fontSize:12,color:c.m,marginTop:1}}>{item.desc}</div>
        </div>
        <span style={{fontSize:14,color:c.m,opacity:.4}}>›</span>
      </div>
    </div>)}
    <div style={{...card,marginTop:8,padding:"16px 18px"}}>
      <div style={{fontSize:11,color:c.m,textTransform:"uppercase",letterSpacing:".07em",fontFamily:mono,marginBottom:2}}>Scenarios</div>
      {Object.entries(CATS).map(([k,v],i,arr)=>{
        const total=PHRASES.filter(p=>p[4]===k).length;
        const done=PHRASES.filter(p=>p[4]===k&&(data.phr[p[0]]?.box||0)>=1).length;
        const pct=Math.round(done/total*100);
        const col=CAT_COLORS[k];
        return <div key={k} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<arr.length-1?"1px solid "+c.b+"88":"none"}}>
          <span style={{fontSize:15,width:22,flexShrink:0,textAlign:"center"}}>{CAT_ICONS[k]}</span>
          <span style={{fontSize:13,width:88,flexShrink:0,color:c.tx}}>{v}</span>
          {progressBar(pct,col)}
          <span style={{fontSize:11,fontFamily:mono,color:c.m,width:30,textAlign:"right",flexShrink:0}}>{done}/{total}</span>
        </div>;
      })}
    </div>
  </div>;
}
