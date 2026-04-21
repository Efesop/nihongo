import { PHRASES, CATS, CAT_ICONS, CAT_COLORS } from "../data/phrases.js";
import { font, mono, T } from "../data/constants.js";
import { daysUntil } from "../utils/helpers.js";
import { touristModeActive } from "../utils/sessionEngine.js";
import { shuffle } from "../utils/helpers.js";
import { getSessionSummary } from "../utils/sessionEngine.js";
import { ROMAJI } from "../data/kana.js";
import { GRAMMAR_PATTERNS, getUnlockedPatterns } from "../data/grammarPatterns.js";
import { getUnlockedTemplates } from "../data/patternAssembly.js";

export default function Home({
  data, save, c, theme, inner, card, btn, chip, mono: _mono,
  isDesktop, hov, setHov, profile, streakCelebrate,
  kMastered, kDueCount, dueCount, learnedPhr, mcLeft,
  setTab, setPMode, setPCat, setPCards, setPDone, setPFlip, setPI, setFastTrack,
  setKCards, setKI, setKInput, setKFb, setKScore, setKMistakes, setKPeek, setKScreen,
  startDrill, isKanaDue, progressBar,
  LEVEL_THRESHOLDS, getLevel, getXPForNext, BADGE_DEFS,
}) {
  const ob=data.onboarding||{};
  const dl=ob.tripDate?daysUntil(ob.tripDate):0;
  const kanaPct=Math.round(kMastered/92*100);
  const phrPct=Math.round(learnedPhr/PHRASES.length*100);
  const totalDue=kDueCount+dueCount;
  const xp=data.settings?.xp||0;
  const level=getLevel?getLevel(xp):1;
  const nextXP=getXPForNext?getXPForNext(xp):null;
  const prevThreshold=LEVEL_THRESHOLDS?LEVEL_THRESHOLDS[level-1]||0:0;
  const xpPct=nextXP?Math.round((xp-prevThreshold)/(nextXP-prevThreshold)*100):100;
  const sRanks=data.settings?.sRanks||0;
  const badges=data.settings?.badges||[];
  const stats=[
    {l:"Level",v:level,cl:c.go},
    {l:"Kana",v:kanaPct+"%",cl:c.a},
    {l:"Phrases",v:phrPct+"%",cl:c.g},
    {l:"S Ranks",v:sRanks,cl:c.a},
    {l:"Streak",v:(data.streak||1)+"🔥",cl:c.go},
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
      <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        {dl>0&&<span style={{fontSize:12,color:c.m,fontFamily:mono}}>{dl} days to go</span>}
        {touristModeActive(data)&&<span style={{fontSize:11,color:c.go,fontFamily:mono,padding:"2px 8px",borderRadius:10,background:c.go+"18",border:"1px solid "+c.go+"44"}} title="New phrase intros restricted to 150 travel survival set">✈️ trip mode</span>}
        {(data.streak||1)>1&&<span style={{fontSize:12,color:c.a,fontFamily:mono,display:"inline-block",animation:streakCelebrate?"streakPop .6s ease-out, streakGlow 1.5s ease-in-out 3":"none"}}>🔥 {data.streak} day streak</span>}
        {/* Silent mode chip — quick toggle. When on, all speaking exercises route through tap-through (no mic) with no SRS penalty. */}
        <button onClick={()=>save({settings:{...data.settings,silentMode:!data.settings?.silentMode}})}
          title={data.settings?.silentMode?"Silent mode on — speaking cards skip mic":"Silent mode off — speaking cards use mic"}
          style={{marginLeft:"auto",padding:"4px 10px",borderRadius:14,border:"1px solid "+c.b,background:data.settings?.silentMode?c.a+"22":"transparent",color:data.settings?.silentMode?c.a:c.m,fontSize:11,fontFamily:mono,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4}}>
          🔇 {data.settings?.silentMode?"silent on":"silent"}
        </button>
      </div>
    </div>
    <div style={{display:"flex",gap:6,marginBottom:16}}>
      {stats.map((s,i)=><div key={i} style={{flex:1,...card,textAlign:"center",padding:"12px 6px"}}>
        <div style={{fontSize:19,fontWeight:800,fontFamily:mono,color:s.cl,marginBottom:3}}>{s.v}</div>
        <div style={{fontSize:10,color:c.m,textTransform:"uppercase",letterSpacing:".04em"}}>{s.l}</div>
      </div>)}
    </div>
    {/* XP Progress */}
    <div style={{...card,marginBottom:10,padding:"10px 16px"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
        <span style={{fontSize:13,fontWeight:700,color:c.go,fontFamily:mono}}>Lv.{level}</span>
        <div style={{flex:1,height:6,background:c.s2,borderRadius:3,overflow:"hidden"}}>
          <div style={{width:xpPct+"%",height:"100%",background:c.go,borderRadius:3,transition:"width .3s"}}/>
        </div>
        <span style={{fontSize:10,color:c.m,fontFamily:mono}}>{xp} XP{nextXP?" / "+nextXP:""}</span>
      </div>
    </div>
    {/* Badges */}
    {BADGE_DEFS&&BADGE_DEFS.length>0&&<div style={{...card,marginBottom:10,padding:"12px 16px"}}>
      <div style={{fontSize:10,color:c.m,textTransform:"uppercase",fontFamily:mono,letterSpacing:".06em",marginBottom:8}}>Badges · {badges.length}/{BADGE_DEFS.length}</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        {BADGE_DEFS.map(b=>{
          const earned=badges.includes(b.id);
          return <div key={b.id} title={b.desc} style={{padding:"4px 8px",borderRadius:6,fontSize:12,display:"flex",alignItems:"center",gap:4,
            background:earned?c.go+"15":c.s2,border:"1px solid "+(earned?c.go+"33":c.b+"44"),
            color:earned?c.tx:c.m+"66",opacity:earned?1:.5}}>
            <span style={{fontSize:14}}>{b.icon}</span>
            <span style={{fontSize:10,fontWeight:earned?600:400}}>{b.label}</span>
          </div>;
        })}
      </div>
    </div>}
    {/* ═══ Core Survival Phrases ═══ */}
    {(()=>{
      const mc=PHRASES.filter(p=>p[6]);
      const phrData=data.phr||{};
      const mastered=mc.filter(p=>(phrData[p[0]]?.box||0)>=3).length;
      const learning=mc.filter(p=>phrData[p[0]]&&(phrData[p[0]]?.box||0)<3);
      const unseen=mc.filter(p=>!phrData[p[0]]);
      const pct=Math.round(mastered/mc.length*100);
      const todo=[...learning,...unseen].slice(0,6);
      return <div style={{...card,marginBottom:10,padding:"12px 16px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <div style={{fontSize:T.xs,color:c.m,textTransform:"uppercase",fontFamily:mono,letterSpacing:".06em"}}>🎯 Core Survival Phrases</div>
          <div style={{fontSize:T.xs,fontFamily:mono,color:mastered===mc.length?c.g:c.a,fontWeight:700}}>{mastered}/{mc.length}</div>
        </div>
        <div style={{height:6,background:c.s2,borderRadius:3,overflow:"hidden",marginBottom:todo.length>0?10:0}}>
          <div style={{width:pct+"%",height:"100%",background:mastered===mc.length?c.g:c.a,borderRadius:3,transition:"width .3s"}}/>
        </div>
        {todo.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:5}}>
          {todo.map(p=>{
            const seen=!!phrData[p[0]];
            return <span key={p[0]} title={p[3]} style={{padding:"3px 8px",borderRadius:6,fontSize:T.xs,background:seen?c.s2:"transparent",border:"1px solid "+c.b,color:seen?c.tx:c.m+"99"}}>{p[1]}</span>;
          })}
          {(learning.length+unseen.length)>todo.length&&<span style={{padding:"3px 8px",borderRadius:6,fontSize:T.xs,color:c.m}}>+{(learning.length+unseen.length)-todo.length} more</span>}
        </div>}
      </div>;
    })()}
    {/* ═══ Struggling With ═══ */}
    {(()=>{
      const errors=data.errors||{};
      const kanaItems=Object.keys(data.kana||{}).filter(ch=>(errors[ch]||0)>=3).map(ch=>({key:ch,type:"kana",char:ch,romaji:ROMAJI[ch]||ch,errors:errors[ch]}));
      const phraseItems=PHRASES.filter(p=>(errors[p[0]]||0)>=3).map(p=>({key:p[0],type:"phrase",jp:p[1],en:p[3],errors:errors[p[0]]}));
      const all=[...kanaItems,...phraseItems].sort((a,b)=>b.errors-a.errors).slice(0,5);
      if(all.length===0)return null;
      return <div style={{...card,marginBottom:10,padding:"12px 16px"}}>
        <div style={{fontSize:T.xs,color:c.m,textTransform:"uppercase",fontFamily:mono,letterSpacing:".06em",marginBottom:8}}>Struggling With</div>
        {all.map(item=><div key={item.key} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:"1px solid "+c.b+"44"}}>
          {item.type==="kana"?<>
            <span style={{fontSize:T.lg,fontWeight:700,width:28,textAlign:"center",flexShrink:0}}>{item.char}</span>
            <span style={{fontSize:T.sm,color:c.m,flex:1,fontFamily:mono}}>{item.romaji}</span>
          </>:<>
            <span style={{fontSize:T.sm,fontWeight:600,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.jp}</span>
            <span style={{fontSize:T.xs,color:c.m,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.en}</span>
          </>}
          <span style={{fontSize:T.xs,fontWeight:700,color:c.a,background:c.a+"18",padding:"2px 7px",borderRadius:8,fontFamily:mono,flexShrink:0}}>{item.errors}x</span>
        </div>)}
      </div>;
    })()}
    {/* ═══ Coming Up ═══ */}
    {(()=>{
      const phrData=data.phr||{};
      const kanaData=data.kana||{};
      const phrasesLearned=PHRASES.filter(p=>(phrData[p[0]]?.box||0)>=1).length;
      const kanaLearned=Object.keys(kanaData).filter(ch=>(kanaData[ch]?.box||0)>=1).length;
      const unlocks=[];
      // Pattern Assembly — needs 5+ phrases AND specific required phrases per template
      if(phrasesLearned<5){
        unlocks.push({label:"Pattern Building",desc:`Learn ${5-phrasesLearned} more phrase${5-phrasesLearned===1?"":"s"}`,pct:Math.round(phrasesLearned/5*100),icon:"🧩"});
      } else if(getUnlockedTemplates(phrData).length===0){
        unlocks.push({label:"Pattern Building",desc:"Learn required phrases to unlock templates",pct:Math.round(phrasesLearned/5*100),icon:"🧩"});
      }
      // Confused Kana Pairs — needs 20+ kana
      if(kanaLearned<20){
        unlocks.push({label:"Kana Discrimination",desc:`Learn ${20-kanaLearned} more kana`,pct:Math.round(kanaLearned/20*100),icon:"👀"});
      }
      // Conversations — needs 5+ phrases
      if(phrasesLearned<5){
        unlocks.push({label:"Conversations",desc:`Learn ${5-phrasesLearned} more phrase${5-phrasesLearned===1?"":"s"}`,pct:Math.round(phrasesLearned/5*100),icon:"💬"});
      }
      // Grammar Patterns — show next unlockable one
      const unlockedGP=getUnlockedPatterns(phrData,PHRASES);
      const unlockedIds=new Set(unlockedGP.map(g=>g.id));
      const nextGP=GRAMMAR_PATTERNS.find(gp=>{
        if(unlockedIds.has(gp.id))return false;
        const matching=PHRASES.filter(p=>p[1].includes(gp.phrasePattern));
        const known=matching.filter(p=>(phrData[p[0]]?.box||0)>=1).length;
        return known>0&&known<gp.unlockAfter;
      });
      if(nextGP){
        const matching=PHRASES.filter(p=>p[1].includes(nextGP.phrasePattern));
        const known=matching.filter(p=>(phrData[p[0]]?.box||0)>=1).length;
        unlocks.push({label:`Grammar: ${nextGP.pattern}`,desc:`${nextGP.unlockAfter-known} more phrase${nextGP.unlockAfter-known===1?"":"s"} with ${nextGP.pattern}`,pct:Math.round(known/nextGP.unlockAfter*100),icon:"📖"});
      }
      if(unlocks.length===0)return null;
      const shown=unlocks.slice(0,3);
      return <div style={{...card,marginBottom:10,padding:"12px 16px"}}>
        <div style={{fontSize:T.xs,color:c.m,textTransform:"uppercase",fontFamily:mono,letterSpacing:".06em",marginBottom:8}}>Coming Up</div>
        {shown.map((u,i)=><div key={i} style={{marginBottom:i<shown.length-1?10:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
            <span style={{fontSize:T.sm}}>{u.icon}</span>
            <span style={{fontSize:T.sm,fontWeight:600,flex:1}}>{u.label}</span>
            <span style={{fontSize:T.xs,color:c.m,fontFamily:mono}}>{u.pct}%</span>
          </div>
          <div style={{height:5,background:c.s2,borderRadius:3,overflow:"hidden"}}>
            <div style={{width:u.pct+"%",height:"100%",background:c.g,borderRadius:3,transition:"width .3s"}}/>
          </div>
          <div style={{fontSize:T.xs,color:c.m,marginTop:3}}>{u.desc}</div>
        </div>)}
      </div>;
    })()}
    <div onClick={()=>setTab("smart")}
      onMouseEnter={()=>setHov("smart")} onMouseLeave={()=>setHov(null)}
      style={{...card,marginBottom:10,padding:"18px 20px",cursor:"pointer",background:hov==="smart"?c.a+"15":c.a+"0a",border:"1px solid "+c.a+"33",transition:"all .15s"}}>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <div style={{fontSize:28}}>▶</div>
        <div style={{flex:1}}>
          <div style={{fontSize:16,fontWeight:700,color:c.a}}>Start Learning</div>
          <div style={{fontSize:12,color:c.m,marginTop:3}}>{getSessionSummary(data)}</div>
        </div>
        <span style={{color:c.a,opacity:.5,fontSize:18}}>→</span>
      </div>
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
