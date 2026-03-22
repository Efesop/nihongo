import { useState } from "react";
import { PHRASES, CATS, CAT_ICONS, CAT_COLORS } from "../data/phrases.js";
import { font, mono } from "../data/constants.js";
import { speakPhrase, speakPhraseWithEnglish } from "../utils/audio.js";
import { shuffle } from "../utils/helpers.js";

export default function PhraseBank({
  data, c, inner, card, btn,
  isDesktop, hov, setHov,
  pCat, setPCat, pMode, setPMode, pCards, setPCards, pI, setPI,
  pFlip, setPFlip, pDone, setPDone, pRecall, setPRecall,
  fastTrack, setFastTrack,
  reviewPhr, getPhrBox, isPhrDue, dueCount, learnedPhr, mcLeft,
}) {
  const MC_PHRASES=PHRASES.filter(p=>p[6]);
  const [quizAnswer,setQuizAnswer]=useState(null);
  const [quizMode,setQuizMode]=useState("situation"); // "situation" | "listen" | "match"
  const [showRomaji,setShowRomaji]=useState(true);
  const [matchPairs,setMatchPairs]=useState([]);
  const [matchSelected,setMatchSelected]=useState(null);
  const [matchMatched,setMatchMatched]=useState([]);

  const situations={greet:"You meet someone. What do you say?",food:"You're at a restaurant.",train:"You're navigating transport.",hotel:"You're at your hotel.",shop:"You're at a store.",dir:"You need directions.",sos:"It's an emergency."};

  // Get 3 wrong distractors from same category (or random if not enough)
  const getDistractors=(correct,count=3)=>{
    const sameCat=PHRASES.filter(p=>p[4]===correct[4]&&p[0]!==correct[0]);
    const others=PHRASES.filter(p=>p[4]!==correct[4]&&p[0]!==correct[0]);
    const pool=shuffle([...sameCat,...others]);
    return pool.slice(0,count);
  };

  // ═══ QUIZ / PRACTICE MODE ═══
  if(pMode==="review"&&!pDone){
    let reviewable=fastTrack?MC_PHRASES:pCat?PHRASES.filter(p=>p[4]===pCat):PHRASES;
    let due=reviewable.filter(p=>isPhrDue(p[0]));
    if(due.length===0)due=reviewable.filter(p=>!data.phr[p[0]]).slice(0,5);
    // If nothing due and nothing unseen, let user practice all anyway
    if(due.length===0)due=shuffle([...reviewable]);
    if(pCards.length===0&&due.length>0){setPCards(shuffle(due));setPI(0);setPFlip(false);setQuizAnswer(null);return null;}
    if(pCards.length===0)return <div style={inner}>
      <button onClick={()=>{setPMode("browse");setPCards([]);setFastTrack(false);}} style={{...btn,background:"none",color:c.m,fontFamily:mono,fontSize:14,padding:"4px 0",marginBottom:20}}>← back</button>
      <div style={{textAlign:"center",padding:48}}><div style={{fontSize:52,marginBottom:14}}>✅</div><h3 style={{fontSize:20,fontWeight:600}}>All caught up!</h3><div style={{fontSize:13,color:c.m,marginTop:8}}>No phrases due. Check back later.</div></div>
    </div>;
    const p=pCards[pI];if(!p){setPDone(true);return null;}
    const catCol=CAT_COLORS[p[4]];
    const advance=(correct)=>{reviewPhr(p[0],correct);setQuizAnswer(null);if(pI+1>=pCards.length)setPDone(true);else{setPI(pI+1);setPFlip(false);}};

    // Quiz mode selector + romaji toggle
    const modeSelector=<div style={{display:"flex",gap:4,marginBottom:14,alignItems:"center"}}>
      {[["situation","🎯 Scenario"],["listen","👂 Listen"],["match","🔗 Match"]].map(([m,label])=>
        <button key={m} onClick={()=>setQuizMode(m)} style={{...btn,flex:1,padding:"6px 4px",borderRadius:7,border:"1px solid "+(quizMode===m?catCol+"66":c.b),background:quizMode===m?catCol+"15":"transparent",color:quizMode===m?catCol:c.m,fontSize:11,fontWeight:600}}>{label}</button>
      )}
      <button onClick={()=>setShowRomaji(!showRomaji)} style={{...btn,padding:"6px 8px",borderRadius:7,border:"1px solid "+(showRomaji?c.a+"44":c.b),background:showRomaji?c.a+"11":"transparent",color:showRomaji?c.a:c.m,fontSize:10,fontWeight:600,flexShrink:0}}>Aa</button>
    </div>;

    // ─── SCENARIO MULTIPLE CHOICE ───
    if(quizMode==="situation"){
      const choices=quizAnswer?quizAnswer.choices:shuffle([p,...getDistractors(p)]);
      if(!quizAnswer)setTimeout(()=>setQuizAnswer({choices,selected:null,correct:null}),0);
      return <div style={inner}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <button onClick={()=>{setPMode("browse");setPCards([]);setFastTrack(false);setQuizAnswer(null);}} style={{...btn,background:"none",color:c.m,fontFamily:mono,fontSize:14,padding:"4px 0"}}>← back</button>
          <div style={{fontFamily:mono,fontSize:12,color:c.m}}>{pI+1}/{pCards.length}</div>
        </div>
        <div style={{height:4,background:c.b,borderRadius:4,marginBottom:16,overflow:"hidden"}}><div style={{height:"100%",width:((pI+1)/pCards.length*100)+"%",background:catCol,borderRadius:4,transition:"width .3s"}}/></div>
        {modeSelector}
        <div style={{...card,padding:"20px 20px",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <span style={{fontSize:16}}>{CAT_ICONS[p[4]]}</span>
            <span style={{fontSize:12,color:catCol,fontWeight:600}}>{CATS[p[4]]}</span>
          </div>
          <div style={{fontSize:13,color:c.m,marginBottom:14}}>{situations[p[4]]}</div>
          <div style={{fontSize:18,fontWeight:600,color:c.tx,lineHeight:1.5}}>{p[3]}</div>
          {p[5]&&<div style={{fontSize:12,color:c.m,fontStyle:"italic",marginTop:6}}>{p[5]}</div>}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {(quizAnswer?.choices||choices).map((choice,i)=>{
            const isCorrect=choice[0]===p[0];
            const isSelected=quizAnswer?.selected===choice[0];
            const answered=quizAnswer?.correct!==null&&quizAnswer?.correct!==undefined;
            let bg="transparent",border=c.b,col=c.tx;
            if(answered&&isCorrect){bg=c.gs;border=c.g+"60";col=c.g;}
            if(answered&&isSelected&&!isCorrect){bg=c.rs;border=c.a+"60";col=c.a;}
            return <button key={i} onClick={()=>{
              if(answered)return;
              const correct=isCorrect;
              setQuizAnswer({...quizAnswer,selected:choice[0],correct});
              if(correct)speakPhraseWithEnglish(p[0],p[1],p[3]);
              setTimeout(()=>advance(correct),correct?2500:1800);
            }} style={{...btn,padding:"14px 16px",borderRadius:10,border:"1px solid "+border,background:bg,color:col,fontSize:isDesktop?18:16,fontWeight:500,textAlign:"left",transition:"all .2s"}}>
              {choice[1]}
              {showRomaji&&<div style={{fontSize:11,fontFamily:mono,color:c.m,marginTop:2,opacity:.6}}>{choice[2]}</div>}
            </button>;
          })}
        </div>
      </div>;
    }

    // ─── LISTENING COMPREHENSION ───
    if(quizMode==="listen"){
      const choices=quizAnswer?quizAnswer.choices:shuffle([p,...getDistractors(p)]);
      if(!quizAnswer){speakPhrase(p[0],p[1]);setTimeout(()=>setQuizAnswer({choices,selected:null,correct:null}),0);}
      return <div style={inner}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <button onClick={()=>{setPMode("browse");setPCards([]);setFastTrack(false);setQuizAnswer(null);}} style={{...btn,background:"none",color:c.m,fontFamily:mono,fontSize:14,padding:"4px 0"}}>← back</button>
          <div style={{fontFamily:mono,fontSize:12,color:c.m}}>{pI+1}/{pCards.length}</div>
        </div>
        <div style={{height:4,background:c.b,borderRadius:4,marginBottom:16,overflow:"hidden"}}><div style={{height:"100%",width:((pI+1)/pCards.length*100)+"%",background:catCol,borderRadius:4,transition:"width .3s"}}/></div>
        {modeSelector}
        <div style={{...card,padding:"32px 20px",textAlign:"center",marginBottom:14}}>
          <div style={{fontSize:48,marginBottom:12}}>👂</div>
          <div style={{fontSize:14,color:c.m,marginBottom:16}}>What did you hear?</div>
          <button onClick={()=>speakPhrase(p[0],p[1])} style={{...btn,padding:"10px 24px",borderRadius:8,background:c.s2,border:"1px solid "+c.b,fontSize:14,color:c.m}}>🔊 play again</button>
          {quizAnswer?.correct!==null&&quizAnswer?.correct!==undefined&&<><div style={{marginTop:14,fontSize:isDesktop?28:22,fontWeight:700}}>{p[1]}</div>{showRomaji&&<div style={{fontSize:13,fontFamily:mono,color:c.a,marginTop:4,opacity:.7}}>{p[2]}</div>}</>}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {(quizAnswer?.choices||choices).map((choice,i)=>{
            const isCorrect=choice[0]===p[0];
            const isSelected=quizAnswer?.selected===choice[0];
            const answered=quizAnswer?.correct!==null&&quizAnswer?.correct!==undefined;
            let bg="transparent",border=c.b,col=c.tx;
            if(answered&&isCorrect){bg=c.gs;border=c.g+"60";col=c.g;}
            if(answered&&isSelected&&!isCorrect){bg=c.rs;border=c.a+"60";col=c.a;}
            return <button key={i} onClick={()=>{
              if(answered)return;
              const correct=isCorrect;
              setQuizAnswer({...quizAnswer,selected:choice[0],correct});
              setTimeout(()=>advance(correct),correct?1800:1500);
            }} style={{...btn,padding:"14px 16px",borderRadius:10,border:"1px solid "+border,background:bg,color:col,fontSize:15,fontWeight:500,textAlign:"left",transition:"all .2s"}}>
              {choice[3]}
            </button>;
          })}
        </div>
      </div>;
    }

    // ─── MATCH MODE ───
    if(quizMode==="match"){
      if(matchPairs.length===0){
        // Setup 4 pairs from current review queue
        const available=pCards.slice(pI,pI+4).length>=4?pCards.slice(pI,pI+4):shuffle([...PHRASES]).slice(0,4);
        const jpSide=shuffle(available.map((p,i)=>({id:p[0],text:p[1],type:"jp",pairIdx:i})));
        const enSide=shuffle(available.map((p,i)=>({id:p[0],text:p[3],type:"en",pairIdx:i})));
        setMatchPairs([...jpSide,...enSide]);
        setMatchSelected(null);
        setMatchMatched([]);
        return null;
      }
      const allMatched=matchMatched.length>=matchPairs.filter(p=>p.type==="jp").length;
      return <div style={inner}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <button onClick={()=>{setPMode("browse");setPCards([]);setFastTrack(false);setMatchPairs([]);}} style={{...btn,background:"none",color:c.m,fontFamily:mono,fontSize:14,padding:"4px 0"}}>← back</button>
          <div style={{fontFamily:mono,fontSize:12,color:c.m}}>{matchMatched.length}/{matchPairs.filter(p=>p.type==="jp").length} matched</div>
        </div>
        {modeSelector}
        <div style={{fontSize:14,color:c.m,marginBottom:14}}>Tap a Japanese phrase, then tap its English meaning</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {/* Japanese column */}
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {matchPairs.filter(p=>p.type==="jp").map((item,i)=>{
              const matched=matchMatched.includes(item.id);
              const selected=matchSelected?.id===item.id&&matchSelected?.type==="jp";
              return <button key={i} onClick={()=>{
                if(matched)return;
                if(!matchSelected){setMatchSelected(item);speakPhrase(item.id,item.text);}
                else if(matchSelected.type==="en"&&matchSelected.id===item.id){setMatchMatched([...matchMatched,item.id]);setMatchSelected(null);speakPhraseWithEnglish(item.id,item.text,matchPairs.find(p=>p.id===item.id&&p.type==="en")?.text||"");}
                else{setMatchSelected(item);speakPhrase(item.id,item.text);}
              }} style={{...btn,padding:"14px 12px",borderRadius:8,border:"1px solid "+(matched?c.g+"44":selected?c.a:c.b),background:matched?c.gs:selected?c.a+"15":"transparent",color:matched?c.g:c.tx,fontSize:isDesktop?20:18,fontWeight:500,opacity:matched?.6:1,transition:"all .15s",textAlign:"left"}}>
                {item.text}
                {showRomaji&&<div style={{fontSize:12,fontFamily:mono,color:c.m,marginTop:3}}>{PHRASES.find(p=>p[0]===item.id)?.[2]}</div>}
              </button>;
            })}
          </div>
          {/* English column */}
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {matchPairs.filter(p=>p.type==="en").map((item,i)=>{
              const matched=matchMatched.includes(item.id);
              const selected=matchSelected?.id===item.id&&matchSelected?.type==="en";
              return <button key={i} onClick={()=>{
                if(matched)return;
                if(!matchSelected){setMatchSelected(item);}
                else if(matchSelected.type==="jp"&&matchSelected.id===item.id){setMatchMatched([...matchMatched,item.id]);setMatchSelected(null);speakPhraseWithEnglish(item.id,matchPairs.find(p=>p.id===item.id&&p.type==="jp")?.text||"",item.text);}
                else{setMatchSelected(item);}
              }} style={{...btn,padding:"12px 10px",borderRadius:8,border:"1px solid "+(matched?c.g+"44":selected?c.a:c.b),background:matched?c.gs:selected?c.a+"15":"transparent",color:matched?c.g:c.tx,fontSize:13,fontWeight:500,opacity:matched?.6:1,transition:"all .15s"}}>
                {item.text}
              </button>;
            })}
          </div>
        </div>
        {allMatched&&<div style={{textAlign:"center",marginTop:20}}>
          <div style={{fontSize:32,marginBottom:8}}>🎉</div>
          <button onClick={()=>{matchMatched.forEach(id=>reviewPhr(id,true));setMatchPairs([]);setMatchMatched([]);setMatchSelected(null);const ni=Math.min(pI+4,pCards.length);if(ni>=pCards.length)setPDone(true);else setPI(ni);}} style={{...btn,padding:14,borderRadius:10,background:c.g,color:"#fff",fontSize:14,fontWeight:600,width:"100%"}}>Continue</button>
        </div>}
      </div>;
    }

    // ─── FALLBACK: FLASHCARD MODE (original) ───
    return <div style={inner}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <button onClick={()=>{setPMode("browse");setPCards([]);setFastTrack(false);}} style={{...btn,background:"none",color:c.m,fontFamily:mono,fontSize:14,padding:"4px 0"}}>← back</button>
        <div style={{fontFamily:mono,fontSize:12,color:c.m}}>{pI+1}/{pCards.length}</div>
      </div>
      <div style={{height:4,background:c.b,borderRadius:4,marginBottom:16,overflow:"hidden"}}><div style={{height:"100%",width:((pI+1)/pCards.length*100)+"%",background:catCol,borderRadius:4,transition:"width .3s"}}/></div>
      {modeSelector}
      <div onClick={()=>{if(!pFlip){setPFlip(true);speakPhraseWithEnglish(p[0],p[1],p[3]);}}} style={{...card,padding:0,overflow:"hidden",cursor:!pFlip?"pointer":"default",minHeight:220}}>
        <div style={{padding:"14px 20px",background:catCol+"12",borderBottom:"1px solid "+catCol+"22"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:16}}>{CAT_ICONS[p[4]]}</span>
            <span style={{fontSize:12,color:catCol,fontWeight:600}}>{CATS[p[4]]}</span>
          </div>
          <div style={{fontSize:13,color:c.m,marginTop:4}}>{situations[p[4]]}</div>
        </div>
        {!pFlip
          ? <div style={{padding:"32px 24px",textAlign:"center"}}>
              <div style={{fontSize:20,fontWeight:600,color:c.tx,lineHeight:1.5,marginBottom:16}}>{p[3]}</div>
              {p[5]&&<div style={{fontSize:12,color:c.m,fontStyle:"italic",marginBottom:16}}>{p[5]}</div>}
              <div style={{fontSize:13,color:c.m,opacity:.6}}>tap to reveal</div>
            </div>
          : <div style={{padding:"24px 24px 20px"}}>
              <div style={{fontSize:isDesktop?34:28,fontWeight:700,lineHeight:1.3,marginBottom:8}}>{p[1]}</div>
              {showRomaji&&<div style={{fontSize:14,fontFamily:mono,color:c.a,marginBottom:6}}>{p[2]}</div>}
              <div style={{fontSize:15,color:c.tx,marginBottom:4}}>{p[3]}</div>
              {p[5]&&<div style={{fontSize:12,color:c.m,fontStyle:"italic",marginTop:8,padding:"8px 14px",background:c.s2,borderRadius:8,borderLeft:"3px solid "+catCol}}>{p[5]}</div>}
              <button onClick={e=>{e.stopPropagation();speakPhraseWithEnglish(p[0],p[1],p[3]);}} style={{...btn,width:"100%",padding:"10px 16px",borderRadius:8,background:c.s2,border:"1px solid "+c.b,fontSize:14,color:c.m,marginTop:14}}>🔊 hear again</button>
            </div>
        }
      </div>
      {pFlip&&<div style={{display:"flex",gap:10,marginTop:14}}>
        <button onClick={()=>advance(false)} style={{...btn,flex:1,padding:14,borderRadius:10,background:c.rs,border:"1px solid "+c.a+"40",color:c.a,fontSize:14,fontWeight:600}}>Not yet</button>
        <button onClick={()=>advance(true)} style={{...btn,flex:1,padding:14,borderRadius:10,background:c.gs,border:"1px solid "+c.g+"40",color:c.g,fontSize:14,fontWeight:600}}>Got it</button>
      </div>}
    </div>;
  }

  // ═══ COMPLETION ═══
  if(pDone)return <div style={inner}>
    <div style={{textAlign:"center",padding:40}}>
      <div style={{fontSize:60,marginBottom:14}}>🎌</div>
      <h3 style={{fontSize:24,fontWeight:600,margin:"0 0 8px"}}>Well done!</h3>
      <div style={{fontSize:14,color:c.m,marginTop:6}}>Session complete. Try a different practice mode!</div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:24}}>
        {[["situation","🎯 Scenario Quiz"],["listen","👂 Listening"],["match","🔗 Match Pairs"]].map(([m,label])=>
          <button key={m} onClick={()=>{setQuizMode(m);setPCards([]);setPDone(false);setPFlip(false);setPI(0);setQuizAnswer(null);setMatchPairs([]);}} style={{...btn,padding:14,borderRadius:10,border:"1px solid "+c.b,background:c.s2,color:c.tx,fontSize:14,fontWeight:500}}>{label}</button>
        )}
        <button onClick={()=>{setPMode("browse");setPCards([]);setPDone(false);setPFlip(false);setPI(0);setFastTrack(false);}} style={{...btn,padding:14,borderRadius:10,border:"1px solid "+c.b,background:"transparent",color:c.m,fontSize:14}}>← Back to scenarios</button>
      </div>
    </div>
  </div>;

  // ═══ CATEGORY DETAIL ═══
  if(pCat){
    const phrases=PHRASES.filter(p=>p[4]===pCat);
    const catDone=phrases.filter(p=>(data.phr[p[0]]?.box||0)>=1).length;
    const catCol=CAT_COLORS[pCat];
    return <div style={inner}>
      <button onClick={()=>setPCat(null)} style={{...btn,background:"none",color:c.m,fontFamily:mono,fontSize:14,padding:"4px 0",marginBottom:14}}>← scenarios</button>
      <div style={{marginBottom:18}}>
        <h2 style={{fontSize:24,fontWeight:700,margin:"0 0 6px"}}>{CAT_ICONS[pCat]} {CATS[pCat]}</h2>
        <div style={{fontSize:12,color:c.m,fontFamily:mono}}>{catDone}/{phrases.length} learned</div>
      </div>
      <button onClick={()=>{setPMode("review");setPCards([]);setPDone(false);setPFlip(false);setPI(0);setQuizAnswer(null);setMatchPairs([]);}} style={{...btn,width:"100%",padding:14,borderRadius:10,background:catCol,color:"#fff",fontSize:15,fontWeight:600,marginBottom:18}}>Practice ({phrases.length})</button>
      {phrases.map((p,i)=>{const box=getPhrBox(p[0]);
        const srsColor=box>=4?c.g:box>=1?c.go:"transparent";
        return <div key={i} onClick={()=>speakPhraseWithEnglish(p[0],p[1],p[3])} style={{...card,marginBottom:8,padding:0,cursor:"pointer",display:"flex",overflow:"hidden",transition:"background .15s"}}
          onMouseEnter={e=>e.currentTarget.style.background=c.s2} onMouseLeave={e=>e.currentTarget.style.background=c.s}>
          <div style={{width:4,background:srsColor,flexShrink:0,borderRadius:"12px 0 0 12px"}}/>
          <div style={{flex:1,padding:"14px 16px"}}>
            <div style={{fontSize:isDesktop?28:24,fontWeight:600,marginBottom:6,lineHeight:1.3}}>{p[1]}</div>
            <div style={{fontSize:14,fontFamily:mono,color:c.a,marginBottom:4}}>{p[2]}</div>
            <div style={{fontSize:14,color:c.tx,marginBottom:2}}>{p[3]}</div>
            {p[5]&&<div style={{fontSize:12,color:c.m,fontStyle:"italic",marginTop:4}}>{p[5]}</div>}
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 14px",gap:6}}>
            <div style={{fontSize:16,color:c.m,opacity:.4}}>🔊</div>
            {p[6]&&<div style={{fontSize:9,color:c.go,fontWeight:600,display:"flex",alignItems:"center",gap:2}} title="Essential for first 48 hours">⚡<span style={{fontFamily:mono,fontSize:8}}>48h</span></div>}
          </div>
        </div>;
      })}
    </div>;
  }

  // ═══ CATEGORY DASHBOARD ═══
  return <div style={inner}>
    <div style={{marginBottom:20}}>
      <div style={{fontSize:11,fontFamily:mono,color:c.m,textTransform:"uppercase",letterSpacing:".08em",marginBottom:6}}>Travel Phrases</div>
      <h2 style={{fontSize:26,fontWeight:700,margin:0,letterSpacing:"-.01em"}}>Scenarios</h2>
      <div style={{fontSize:13,color:c.m,marginTop:4}}>{learnedPhr}/{PHRASES.length} phrases learned</div>
    </div>
    {mcLeft>0&&<div onClick={()=>{setFastTrack(true);setPMode("review");setPCards([]);setPDone(false);setPFlip(false);setPI(0);setQuizAnswer(null);setMatchPairs([]);}}
      style={{...card,marginBottom:10,padding:"16px 18px",cursor:"pointer",background:c.a+"0d",border:"1px solid "+c.a+"33"}}
      onMouseEnter={()=>setHov("ft")} onMouseLeave={()=>setHov(null)}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:22}}>⚡</span>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:600,color:c.a}}>Survival Phrases</div>
          <div style={{fontSize:12,color:c.m,marginTop:2}}>{mcLeft} essential phrases for your first 48 hours</div>
        </div>
        <span style={{color:c.a,opacity:.5}}>→</span>
      </div>
    </div>}
    {dueCount>0&&<div onClick={()=>{setFastTrack(false);setPCat(null);setPMode("review");setPCards([]);setPDone(false);setPFlip(false);setPI(0);setQuizAnswer(null);setMatchPairs([]);}}
      style={{...card,marginBottom:10,padding:"16px 18px",cursor:"pointer",background:c.go+"0d",border:"1px solid "+c.go+"33"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:22}}>🔔</span>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:600,color:c.go}}>Review {dueCount} phrases</div>
          <div style={{fontSize:12,color:c.m,marginTop:2}}>Phrases ready for practice</div>
        </div>
        <span style={{color:c.go,opacity:.5}}>→</span>
      </div>
    </div>}
    <div style={{display:"grid",gridTemplateColumns:isDesktop?"1fr 1fr":"1fr",gap:10,marginTop:6}}>
      {Object.entries(CATS).map(([k,v])=>{
        const total=PHRASES.filter(p=>p[4]===k).length;
        const done=PHRASES.filter(p=>p[4]===k&&(data.phr[p[0]]?.box||0)>=1).length;
        const pct=Math.round(done/total*100);
        const col=CAT_COLORS[k];
        const catDue=PHRASES.filter(p=>p[4]===k&&data.phr[p[0]]?.box>=1&&isPhrDue(p[0])).length;
        const mc=PHRASES.filter(p=>p[4]===k&&p[6]).length;
        return <div key={k} onClick={()=>setPCat(k)}
          onMouseEnter={()=>setHov("cat_"+k)} onMouseLeave={()=>setHov(null)}
          style={{...card,padding:0,cursor:"pointer",background:hov==="cat_"+k?c.s2:c.s,transition:"all .15s",overflow:"hidden"}}>
          <img src={`/images/phrases/${k}.png`} alt={v}
            style={{width:"100%",height:isDesktop?120:90,objectFit:"cover",display:"block"}}
            onError={e=>{e.target.style.display="none";}}/>
          <div style={{padding:"14px 16px 12px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:20}}>{CAT_ICONS[k]}</span>
                <div>
                  <div style={{fontSize:15,fontWeight:700}}>{v}</div>
                  <div style={{fontSize:10,color:c.m,fontFamily:mono,marginTop:2}}>{total} phrases{mc>0&&<span style={{color:c.go,marginLeft:4}}>⚡{mc} essential</span>}</div>
                </div>
              </div>
              {catDue>0&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:8,background:c.go+"22",color:c.go,fontWeight:600}}>{catDue} due</span>}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{flex:1,height:5,background:c.b,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:pct+"%",background:col,borderRadius:3,transition:"width .3s"}}/></div>
              <div style={{fontSize:11,fontFamily:mono,color:col,fontWeight:600,flexShrink:0}}>{done}/{total}</div>
            </div>
          </div>
        </div>;
      })}
    </div>
  </div>;
}
