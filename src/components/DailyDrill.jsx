import { M, ROMAJI } from "../data/kana.js";
import { CATS, CAT_ICONS, CAT_COLORS } from "../data/phrases.js";
import { font, mono } from "../data/constants.js";
import { speak, speakPhrase } from "../utils/audio.js";

export default function DailyDrill({
  c, inner, card, btn, chip, speakBtn,
  isDesktop,
  drillCards, setDrillCards, drillI, setDrillI,
  drillFlip, setDrillFlip, drillInput, setDrillInput,
  drillFb, setDrillFb, drillScore, setDrillScore,
  drillDone, setDrillDone,
  drillRef,
  submitDrillKana, advanceDrill, startDrill, reviewPhr,
  setTab,
}) {
  if(drillDone||drillCards.length===0){
    const total=drillCards.length;
    const pct=total>0?Math.round(drillScore.c/total*100):0;
    return <div style={inner}>
      <div style={{textAlign:"center",padding:"40px 20px"}}>
        <div style={{fontSize:60,marginBottom:14}}>{pct>=80?"🔥":pct>=60?"👍":"🔄"}</div>
        <h2 style={{fontSize:26,fontWeight:700,margin:"0 0 6px"}}>Drill complete!</h2>
        <div style={{fontSize:44,fontWeight:800,fontFamily:mono,color:pct>=80?c.g:c.go,marginBottom:24}}>{pct}%</div>
        <div style={{fontSize:13,color:c.m,marginBottom:24}}>{drillScore.c} correct · {drillScore.w} missed</div>
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <button onClick={()=>setTab("home")} style={{...btn,flex:1,maxWidth:160,padding:13,borderRadius:10,border:"1px solid "+c.b,background:"transparent",color:c.tx,fontSize:14}}>Home</button>
          <button onClick={startDrill} style={{...btn,flex:1,maxWidth:160,padding:13,borderRadius:10,background:c.a,color:"#fff",fontSize:14,fontWeight:600}}>Again</button>
        </div>
      </div>
    </div>;
  }
  const card_=drillCards[drillI];
  const progress=(drillI/(drillCards.length))*100;
  if(card_.type==="kana"){
    const ch=card_.ch;const rom=ROMAJI[ch];const m=M[ch];
    return <div style={inner}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <button onClick={()=>setTab("home")} style={{...btn,background:"none",color:c.m,fontFamily:mono,fontSize:12,padding:0}}>← exit</button>
        <span style={chip(c.a)}>🔥 Daily Drill</span>
        <div style={{fontFamily:mono,fontSize:12,color:c.m}}>{drillI+1}/{drillCards.length}</div>
      </div>
      <div style={{height:4,background:c.b,borderRadius:4,marginBottom:36,overflow:"hidden"}}><div style={{height:"100%",width:progress+"%",background:c.a,borderRadius:4,transition:"width .3s"}}/></div>
      <div style={{textAlign:"center",marginBottom:drillFb?8:28}}>
        <div style={{fontSize:12,fontFamily:mono,color:c.m,marginBottom:8}}>Kana</div>
        <div style={{fontSize:108,lineHeight:1,marginBottom:10,color:drillFb==="ok"?c.g:drillFb==="no"?c.a:c.tx}}>{ch}</div>
      </div>
      {!drillFb?<>
        <div style={{display:"flex",gap:8}}>
          <input ref={drillRef} value={drillInput} onChange={e=>setDrillInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")submitDrillKana();}}
            placeholder="romaji..." autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false"
            style={{flex:1,padding:"13px 16px",borderRadius:10,border:"1px solid "+c.b,background:c.s2,color:c.tx,fontFamily:mono,fontSize:20,outline:"none",textAlign:"center"}}/>
          <button onClick={submitDrillKana} style={{...btn,padding:"13px 22px",borderRadius:10,background:drillInput.trim()?c.a:c.b,color:drillInput.trim()?"#fff":c.m,fontSize:14,fontWeight:600}}>Go</button>
        </div>
      </>:<>
        <div style={{...card,textAlign:"center",marginTop:14,background:drillFb==="ok"?c.gs:c.rs,border:"1px solid "+(drillFb==="ok"?c.g+"50":c.a+"50")}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:14,marginBottom:10}}>
            <span style={{fontSize:48}}>{ch}</span>{m&&<span style={{fontSize:32}}>{m[0]}</span>}
          </div>
          <div style={{fontFamily:mono,fontSize:22,fontWeight:700,color:drillFb==="ok"?c.g:c.a}}>{rom}</div>
          {m&&<div style={{fontSize:14,color:c.tx,marginTop:6}}>{m[1]}</div>}
          {drillFb==="no"&&<div style={{fontSize:12,color:c.m,marginTop:4}}>you typed: <span style={{color:c.a,textDecoration:"line-through"}}>{drillInput}</span></div>}
          <div style={{marginTop:8}}>{speakBtn(ch)}</div>
        </div>
        <button onClick={advanceDrill} style={{...btn,width:"100%",padding:13,borderRadius:10,marginTop:12,background:c.a,color:"#fff",fontSize:14,fontWeight:600}}>{drillI+1>=drillCards.length?"Finish":"Next →"}</button>
      </>}
    </div>;
  }
  // phrase card in drill
  const p=card_.p;
  return <div style={inner}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
      <button onClick={()=>setTab("home")} style={{...btn,background:"none",color:c.m,fontFamily:mono,fontSize:12,padding:0}}>← exit</button>
      <span style={chip(c.g)}>🔥 Daily Drill</span>
      <div style={{fontFamily:mono,fontSize:12,color:c.m}}>{drillI+1}/{drillCards.length}</div>
    </div>
    <div style={{height:4,background:c.b,borderRadius:4,marginBottom:28,overflow:"hidden"}}><div style={{height:"100%",width:progress+"%",background:c.a,borderRadius:4,transition:"width .3s"}}/></div>
    <div style={{...card,padding:"36px 24px",textAlign:"center",minHeight:220,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:!drillFlip?"pointer":"default"}} onClick={()=>!drillFlip&&setDrillFlip(true)}>
      {!drillFlip
        ?<><span style={{...chip(CAT_COLORS[p[4]]),marginBottom:12}}>{CAT_ICONS[p[4]]} {CATS[p[4]]}</span>
          <div style={{fontSize:19,fontWeight:600,marginBottom:14,lineHeight:1.4}}>{p[3]}</div>
          <div style={{fontSize:12,color:c.m}}>think of it... then tap to reveal</div></>
        :<><span style={{...chip(CAT_COLORS[p[4]]),marginBottom:12}}>{CAT_ICONS[p[4]]} {CATS[p[4]]}</span>
          <div style={{fontSize:30,fontWeight:700,marginBottom:6,lineHeight:1.3}}>{p[1]}</div>
          <button onClick={e=>{e.stopPropagation();speakPhrase(p[0],p[1]);}} style={{...btn,padding:"5px 10px",borderRadius:8,background:c.s2,border:"1px solid "+c.b,fontSize:15,color:c.m,marginTop:8,flexShrink:0}} title="Listen">🔊</button>
          <div style={{fontSize:19,fontFamily:mono,color:c.a,marginTop:6,marginBottom:8}}>{p[2]}</div>
          <div style={{fontSize:14,color:c.m}}>{p[3]}</div></>}
    </div>
    {drillFlip&&<div style={{display:"flex",gap:10,marginTop:16}}>
      <button onClick={()=>{reviewPhr(p[0],false);setDrillScore(s=>({...s,w:s.w+1}));advanceDrill();}} style={{...btn,flex:1,padding:14,borderRadius:10,background:c.rs,border:"1px solid "+c.a+"40",color:c.a,fontSize:14,fontWeight:600}}>Missed it</button>
      <button onClick={()=>{reviewPhr(p[0],true);setDrillScore(s=>({...s,c:s.c+1}));advanceDrill();}} style={{...btn,flex:1,padding:14,borderRadius:10,background:c.gs,border:"1px solid "+c.g+"40",color:c.g,fontSize:14,fontWeight:600}}>Got it</button>
    </div>}
  </div>;
}
