import { PHRASES, CATS, CAT_ICONS, CAT_COLORS } from "../data/phrases.js";
import { font, mono } from "../data/constants.js";
import { speakPhrase } from "../utils/audio.js";
import { shuffle } from "../utils/helpers.js";

export default function PhraseBank({
  data, c, inner, card, btn, chip,
  isDesktop, hov, setHov,
  pCat, setPCat, pMode, setPMode, pCards, setPCards, pI, setPI,
  pFlip, setPFlip, pDone, setPDone, pRecall, setPRecall,
  fastTrack, setFastTrack,
  reviewPhr, getPhrBox, isPhrDue, dueCount, learnedPhr, mcLeft,
}) {
  const MC_PHRASES=PHRASES.filter(p=>p[6]);

  if(pMode==="review"&&!pDone){
    let reviewable=fastTrack?MC_PHRASES:pCat?PHRASES.filter(p=>p[4]===pCat):PHRASES;
    let due=reviewable.filter(p=>isPhrDue(p[0]));
    if(due.length===0)due=reviewable.filter(p=>!data.phr[p[0]]).slice(0,5);
    if(pCards.length===0&&due.length>0){setPCards(shuffle(due));setPI(0);setPFlip(false);return null;}
    if(pCards.length===0)return <div style={inner}>
      <button onClick={()=>{setPMode("browse");setPCards([]);setFastTrack(false);}} style={{...btn,background:"none",color:c.m,fontFamily:mono,fontSize:12,padding:0,marginBottom:20}}>← back</button>
      <div style={{textAlign:"center",padding:48}}><div style={{fontSize:52,marginBottom:14}}>✅</div><h3 style={{fontSize:20,fontWeight:600}}>All caught up!</h3><div style={{fontSize:13,color:c.m,marginTop:8}}>No phrases due. Check back later.</div></div>
    </div>;
    const p=pCards[pI];if(!p){setPDone(true);return null;}
    const catCol=CAT_COLORS[p[4]];
    // Situation prompts per category
    const situations={greet:"You meet someone. What do you say?",food:"You're at a restaurant.",train:"You're navigating transport.",hotel:"You're at your hotel.",shop:"You're at a store.",dir:"You need directions.",sos:"It's an emergency."};
    return <div style={inner}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <button onClick={()=>{setPMode("browse");setPCards([]);setFastTrack(false);}} style={{...btn,background:"none",color:c.m,fontFamily:mono,fontSize:14,padding:"4px 0"}}>← back</button>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {fastTrack&&<span style={chip(c.a)}>⚡ Survival</span>}
          <div style={{fontFamily:mono,fontSize:12,color:c.m}}>{pI+1}/{pCards.length}</div>
        </div>
      </div>
      <div style={{height:4,background:c.b,borderRadius:4,marginBottom:20,overflow:"hidden"}}><div style={{height:"100%",width:((pI+1)/pCards.length*100)+"%",background:catCol,borderRadius:4,transition:"width .3s"}}/></div>

      <div onClick={()=>{if(!pFlip){setPFlip(true);setTimeout(()=>speakPhrase(p[0],p[1]),300);}}} style={{...card,padding:0,overflow:"hidden",cursor:!pFlip?"pointer":"default",minHeight:240}}>
        {/* Situation header */}
        <div style={{padding:"14px 20px",background:catCol+"12",borderBottom:"1px solid "+catCol+"22"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:18}}>{CAT_ICONS[p[4]]}</span>
            <span style={{fontSize:12,color:catCol,fontWeight:600}}>{CATS[p[4]]}</span>
          </div>
          <div style={{fontSize:13,color:c.m,marginTop:4}}>{situations[p[4]]||""}</div>
        </div>

        {!pFlip
          ? <div style={{padding:"32px 24px",textAlign:"center"}}>
              <div style={{fontSize:20,fontWeight:600,color:c.tx,lineHeight:1.5,marginBottom:16}}>{p[3]}</div>
              {p[5]&&<div style={{fontSize:13,color:c.m,fontStyle:"italic",marginBottom:16}}>{p[5]}</div>}
              <div style={{fontSize:13,color:c.m,opacity:.6}}>tap to see the Japanese</div>
            </div>
          : <div style={{padding:"24px 24px 20px"}}>
              <div style={{fontSize:isDesktop?34:28,fontWeight:700,lineHeight:1.3,marginBottom:8}}>{p[1]}</div>
              <div style={{fontSize:14,fontFamily:mono,color:c.a,marginBottom:6,opacity:.7}}>{p[2]}</div>
              <div style={{fontSize:15,color:c.tx,marginBottom:4}}>{p[3]}</div>
              {p[5]&&<div style={{fontSize:12,color:c.m,fontStyle:"italic",marginTop:8,padding:"8px 14px",background:c.s2,borderRadius:8,borderLeft:"3px solid "+catCol}}>{p[5]}</div>}
              <button onClick={e=>{e.stopPropagation();speakPhrase(p[0],p[1]);}} style={{...btn,width:"100%",padding:"10px 16px",borderRadius:8,background:c.s2,border:"1px solid "+c.b,fontSize:14,color:c.m,marginTop:14}}>🔊 hear again</button>
            </div>
        }
      </div>

      {pFlip&&<div style={{display:"flex",gap:10,marginTop:14}}>
        <button onClick={()=>{reviewPhr(p[0],false);if(pI+1>=pCards.length)setPDone(true);else{setPI(pI+1);setPFlip(false);}}} style={{...btn,flex:1,padding:14,borderRadius:10,background:c.rs,border:"1px solid "+c.a+"40",color:c.a,fontSize:14,fontWeight:600}}>Not yet</button>
        <button onClick={()=>{reviewPhr(p[0],true);if(pI+1>=pCards.length)setPDone(true);else{setPI(pI+1);setPFlip(false);}}} style={{...btn,flex:1,padding:14,borderRadius:10,background:c.gs,border:"1px solid "+c.g+"40",color:c.g,fontSize:14,fontWeight:600}}>Got it</button>
      </div>}
    </div>;
  }
  if(pDone)return <div style={inner}>
    <div style={{textAlign:"center",padding:40}}>
      <div style={{fontSize:60,marginBottom:14}}>🎌</div>
      <h3 style={{fontSize:24,fontWeight:600,margin:"0 0 8px"}}>Well done!</h3>
      <div style={{fontSize:14,color:c.m,marginTop:6}}>You've reviewed all phrases in this session.</div>
      <div style={{display:"flex",gap:10,marginTop:28}}>
        <button onClick={()=>{setPMode("browse");setPCards([]);setPDone(false);setPFlip(false);setPI(0);setFastTrack(false);}} style={{...btn,flex:1,padding:14,borderRadius:10,border:"1px solid "+c.b,background:"transparent",color:c.tx,fontSize:14}}>Browse</button>
        <button onClick={()=>{setPCards([]);setPDone(false);setPFlip(false);setPI(0);}} style={{...btn,flex:1,padding:14,borderRadius:10,background:c.g,color:"#fff",fontSize:14,fontWeight:600}}>Practice more</button>
      </div>
    </div>
  </div>;
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
      <button onClick={()=>{setPMode("review");setPCards([]);setPDone(false);setPFlip(false);setPI(0);}} style={{...btn,width:"100%",padding:14,borderRadius:10,background:catCol,color:"#fff",fontSize:15,fontWeight:600,marginBottom:18}}>Practice ({phrases.length})</button>
      {phrases.map((p,i)=>{const box=getPhrBox(p[0]);
        const srsColor=box>=4?c.g:box>=1?c.go:"transparent";
        return <div key={i} onClick={()=>speakPhrase(p[0],p[1])} style={{...card,marginBottom:8,padding:0,cursor:"pointer",display:"flex",overflow:"hidden",transition:"background .15s"}}
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
  return <div style={inner}>
    <div style={{marginBottom:20}}>
      <div style={{fontSize:11,fontFamily:mono,color:c.m,textTransform:"uppercase",letterSpacing:".08em",marginBottom:6}}>Travel Phrases</div>
      <h2 style={{fontSize:26,fontWeight:700,margin:0,letterSpacing:"-.01em"}}>Scenarios</h2>
      <div style={{fontSize:13,color:c.m,marginTop:4}}>{learnedPhr}/{PHRASES.length} phrases learned</div>
    </div>
    {mcLeft>0&&<div onClick={()=>{setFastTrack(true);setPMode("review");setPCards([]);setPDone(false);setPFlip(false);setPI(0);}}
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
    {dueCount>0&&<div onClick={()=>{setFastTrack(false);setPCat(null);setPMode("review");setPCards([]);setPDone(false);setPFlip(false);setPI(0);}}
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
