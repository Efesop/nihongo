import { M, H_GROUPS, K_GROUPS, ROMAJI, YOON_PARTS, DAKUTEN_BASE } from "../data/kana.js";
import { font, mono } from "../data/constants.js";
import { speak } from "../utils/audio.js";
import { _ttsAudio, setTtsAudio } from "../utils/audio.js";
import { shuffle } from "../utils/helpers.js";

export default function KanaTrainer({
  data, save, c, theme, inner, card, btn, speakBtn, storyBtn, kbHint,
  isDesktop,
  kScript, setKScript, kSel, setKSel, kSelChars, setKSelChars,
  kScreen, setKScreen, kCards, setKCards, kI, setKI, kInput, setKInput,
  kFb, setKFb, kScore, setKScore, kMistakes, setKMistakes, kPeek, setKPeek,
  kFlip, setKFlip, kLI, setKLI, kQuizMode, setKQuizMode,
  kShowGrid, setKShowGrid, kAutoReveal, setKAutoReveal, kAutoStory, setKAutoStory,
  kSpeakingChar, setKSpeakingChar,
  storyPlaying, setStoryPlaying,
  inputRef, allKana,
  getKBox, isKanaDue, kMastered, kDueCount,
  startKanaQuiz, submitKana, nextKana, updateKanaSRS,
  stopAudio, speakStory, speakYoon, speakDakuten,
}) {
  const groups=kScript==="h"?H_GROUPS:K_GROUPS;
  const tileSize=isDesktop?48:42;
  const tileFont=isDesktop?19:16;

  const ROW_AUDIO={"G゛":"dk_k_to_g","Z゛":"dk_s_to_z","D゛":"dk_t_to_d","B゛":"dk_h_to_b","P゜":"hdk_h_to_p","Ky":"yo_ky","Sh":"yo_sh","Ch":"yo_ch","Ny":"yo_ny","Hy":"yo_hy","My":"yo_my","Ry":"yo_ry","Gy":"yo_gy","Jy":"yo_jy","By":"yo_by","Py":"yo_py"};
  // Find which group a character belongs to
  const getCharGroup=(ch)=>groups.find(g=>g.c.includes(ch));
  const playRowChain=(g)=>{if(!g)return;
    setStoryPlaying(true);
    const items=g.dk?g.c.flatMap(gch=>[DAKUTEN_BASE[gch],gch]):g.c;
    let i=0;
    const playNext=()=>{if(i>=items.length){setStoryPlaying(false);setKSpeakingChar(null);return;}const t=items[i];const isBase=g.dk&&i%2===0;i++;setKSpeakingChar(t);const url=`/api/tts?lang=ja&q=${encodeURIComponent(t)}`;const a=new Audio(url);a.playbackRate=1;setTtsAudio(a);a.onended=()=>setTimeout(playNext,isBase?100:350);a.onerror=()=>{setStoryPlaying(false);setKSpeakingChar(null);};a.play().catch(()=>{setStoryPlaying(false);setKSpeakingChar(null);});};
    playNext();
  };
  const autoPlayForChar=(nch)=>{
    const ng=getCharGroup(nch);
    if(ng&&(ng.dk||ng.yo)){setTimeout(()=>playRowChain(ng),300);}
    else{const nm=M[nch];if(nm)setTimeout(()=>speakStory(nm,nch),300);}
  };

  if(kScreen==="learn"){
    const chars=allKana;const ch=chars[kLI];const m=M[ch];const rom=ROMAJI[ch];
    const isHiragana=kScript==="h";
    const mnemonicImg=`/images/mnemonics/approved/${isHiragana?"hiragana":"katakana"}/${ch.codePointAt(0).toString(16)}.png`;
    const swipeRef={startX:0,startY:0};
    const onTouchStart=e=>{swipeRef.startX=e.touches[0].clientX;swipeRef.startY=e.touches[0].clientY;};
    const onTouchEnd=e=>{
      const dx=e.changedTouches[0].clientX-swipeRef.startX;
      const dy=e.changedTouches[0].clientY-swipeRef.startY;
      if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>50){
        if(dx<0&&kLI<chars.length-1){stopAudio();setKSpeakingChar(null);
          const cg=getCharGroup(ch);let ni=kLI+1;
          if(cg&&(cg.dk||cg.yo)){const li=chars.indexOf(cg.c[cg.c.length-1]);if(li>=0)ni=li+1;}
          if(ni>=chars.length)ni=chars.length-1;setKLI(ni);setKFlip(false);
          if(kAutoStory)autoPlayForChar(chars[ni]);}
        if(dx>0&&kLI>0){stopAudio();setKSpeakingChar(null);
          let ni=kLI-1;if(ni>=0){const pg=getCharGroup(chars[ni]);if(pg&&(pg.dk||pg.yo))ni=Math.max(0,chars.indexOf(pg.c[0]));}
          setKLI(ni);setKFlip(false);
          if(kAutoStory)autoPlayForChar(chars[ni]);}
      }
    };
    const showRevealed=kAutoReveal||kFlip;
    return <div style={inner} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <button onClick={()=>setKScreen("menu")} style={{...btn,background:"none",color:c.m,fontFamily:mono,fontSize:14,padding:"4px 0"}}>← back</button>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <button onClick={()=>{const v=!kAutoReveal;setKAutoReveal(v);save({settings:{...data.settings,autoReveal:v}});}} style={{...btn,padding:"5px 10px",borderRadius:6,border:"1px solid "+(kAutoReveal?c.a+"44":c.b),background:kAutoReveal?c.a+"11":"transparent",color:kAutoReveal?c.a:c.m,fontSize:11}}>Auto-reveal {kAutoReveal?"on":"off"}</button>
          <button onClick={()=>{const v=!kAutoStory;setKAutoStory(v);if(v&&!kAutoReveal){setKAutoReveal(true);save({settings:{...data.settings,autoStory:v,autoReveal:true}});}else{save({settings:{...data.settings,autoStory:v}});}}} style={{...btn,padding:"5px 10px",borderRadius:6,border:"1px solid "+(kAutoStory?c.a+"44":c.b),background:kAutoStory?c.a+"11":"transparent",color:kAutoStory?c.a:c.m,fontSize:11}}>Auto-story {kAutoStory?"on":"off"}</button>
          <div style={{fontSize:12,fontFamily:mono,color:c.m}}>{kLI+1}/{chars.length}</div>
        </div>
      </div>
      <div style={{height:4,background:c.b,borderRadius:4,marginBottom:20,overflow:"hidden"}}><div style={{height:"100%",width:((kLI+1)/chars.length*100)+"%",background:c.a,borderRadius:4,transition:"width .3s"}}/></div>
      {(DAKUTEN_BASE[ch]||YOON_PARTS[ch])
        ? /* Dakuten/yoon always shows row — no reveal needed */
        (()=>{const g=getCharGroup(ch);if(!g)return null;
          return <div>
            <div style={{...card,padding:"20px 18px",marginBottom:14}}>
              <div style={{fontSize:16,fontWeight:700,color:c.a,marginBottom:6,fontFamily:mono}}>{g.n} row — {g.dk?(g.n.includes("P")?<>add <span style={{fontSize:22}}>゜</span></>:<>add <span style={{fontSize:22}}>゛</span></>):"combination sounds"}</div>
              <div style={{fontSize:13,color:c.m,marginBottom:16}}>{g.dk?(g.n.includes("P")?"Add the circle mark to make P sounds":"Add the two-dot mark to voice the consonant"):"Combine with small や ゆ よ to blend sounds"}</div>
              {g.c.map((gch,i)=>{const base=DAKUTEN_BASE[gch];const yp=YOON_PARTS[gch];const grom=ROMAJI[gch];const isSpeaking=kSpeakingChar===gch||kSpeakingChar===base;
                return <div key={i} onClick={()=>{setKSpeakingChar(gch);
                  if(base){const url1=`/api/tts?lang=ja&q=${encodeURIComponent(base)}`;const a1=new Audio(url1);a1.playbackRate=1;setTtsAudio(a1);a1.onended=()=>{setTimeout(()=>{const url2=`/api/tts?lang=ja&q=${encodeURIComponent(gch)}`;const a2=new Audio(url2);a2.playbackRate=1;setTtsAudio(a2);a2.onended=()=>setTimeout(()=>setKSpeakingChar(null),500);a2.play().catch(()=>{});},100);};a1.play().catch(()=>{});}
                  else{speak(gch);setTimeout(()=>setKSpeakingChar(null),1500);}}} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 6px",borderBottom:i<g.c.length-1?"1px solid "+c.b+"44":"none",background:isSpeaking?c.a+"18":"transparent",borderRadius:8,transition:"background .2s",cursor:"pointer"}}>
                  {base&&<><div style={{width:52,textAlign:"center"}}><div style={{fontSize:34,lineHeight:1,opacity:.5}}>{base}</div><div style={{fontSize:11,fontFamily:mono,color:c.m}}>{ROMAJI[base]}</div></div><div style={{fontSize:18,color:c.m}}>→</div></>}
                  {yp&&<><div style={{width:40,textAlign:"center"}}><div style={{fontSize:26,lineHeight:1,opacity:.5}}>{yp[0]}</div><div style={{fontSize:10,fontFamily:mono,color:c.m}}>{ROMAJI[yp[0]]}</div></div><div style={{fontSize:14,color:c.m}}>+</div><div style={{width:28,textAlign:"center"}}><div style={{fontSize:18,lineHeight:1,opacity:.5}}>{yp[1]}</div><div style={{fontSize:9,fontFamily:mono,color:c.m}}>small</div></div><div style={{fontSize:14,color:c.m}}>=</div></>}
                  <div style={{flex:1,display:"flex",alignItems:"center",gap:10}}><div style={{fontSize:42,lineHeight:1,color:c.a}}>{gch}</div><div style={{fontSize:22,fontWeight:700,fontFamily:mono,color:c.a}}>{grom}</div></div>
                  <div style={{fontSize:14,color:c.m,opacity:.5}}>🔊</div>
                </div>;
              })}
            </div>
            <button onClick={e=>{e.stopPropagation();
              if(storyPlaying){stopAudio();setKSpeakingChar(null);return;}
              playRowChain(g);
            }} style={{...btn,padding:"12px 16px",borderRadius:10,background:storyPlaying?c.a+"22":c.s2,border:"1px solid "+(storyPlaying?c.a:c.b),fontSize:14,color:storyPlaying?c.a:c.m,width:"100%",marginBottom:4}}>{storyPlaying?"■ stop":"🔊 hear all sounds"}</button>
          </div>;
        })()
        : !showRevealed
          ? <div onClick={()=>{setKFlip(true);if(kAutoStory&&m)setTimeout(()=>speakStory(m,ch),300);}} style={{...card,textAlign:"center",cursor:"pointer",padding:"48px 24px"}}>
              <div style={{fontSize:120,lineHeight:1,marginBottom:16}}>{ch}</div>
              <div style={{fontSize:12,color:c.m}}>tap to reveal</div>
            </div>
          : <div>
                <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:14}}>
                  <div style={{flex:"1 1 40%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8}}>
                    <div style={{fontSize:isDesktop?130:100,lineHeight:1}}>{ch}</div>
                    <div style={{fontSize:isDesktop?34:28,fontWeight:700,color:c.a,fontFamily:mono}}>{rom}</div>
                    {speakBtn(ch)}
                  </div>
                  <img src={mnemonicImg} alt={m?m[1]:rom}
                    onError={e=>{e.target.style.display="none";}}
                    style={{flex:"1 1 60%",maxWidth:"55%",borderRadius:12,display:"block"}}/>
                </div>
                {m&&<div style={{...card,padding:"16px 18px",border:"1px solid "+c.b,marginBottom:4}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                    <span style={{fontSize:22}}>{m[0]}</span>
                    <div style={{fontSize:15,fontWeight:700,color:c.tx}}>{m[1]}</div>
                  </div>
                  <div style={{fontSize:13,color:c.m,lineHeight:1.6,marginBottom:12}}>{m[3]||m[2]}</div>
                  <div style={{width:"100%"}}>{storyBtn(m,ch)}</div>
                </div>}
              </div>
      }
      <div style={{display:"flex",gap:10,marginTop:16}}>
        <button onClick={()=>{stopAudio();setKSpeakingChar(null);
          // Skip back past group if current is dakuten/yoon
          let ni=kLI-1;
          if(ni>=0){const pch=chars[ni];const pg=getCharGroup(pch);if(pg&&(pg.dk||pg.yo)){ni=Math.max(0,chars.indexOf(pg.c[0])-1);}}
          ni=Math.max(0,ni);setKLI(ni);setKFlip(false);
          if(kAutoStory)autoPlayForChar(chars[ni]);
        }} disabled={kLI===0} style={{...btn,flex:1,padding:13,borderRadius:10,border:"1px solid "+c.b,background:"transparent",color:kLI>0?c.tx:c.m,fontSize:14}}>← Prev</button>
        {kLI<chars.length-1
          ?<button onClick={()=>{stopAudio();setKSpeakingChar(null);
            // Skip past group if current is dakuten/yoon
            const cg=getCharGroup(ch);let ni=kLI+1;
            if(cg&&(cg.dk||cg.yo)){const lastInGroup=cg.c[cg.c.length-1];const lastIdx=chars.indexOf(lastInGroup);if(lastIdx>=0)ni=lastIdx+1;}
            if(ni>=chars.length)ni=chars.length-1;setKLI(ni);setKFlip(false);
            if(kAutoStory)autoPlayForChar(chars[ni]);
          }} style={{...btn,flex:1,padding:13,borderRadius:10,background:c.a,color:"#fff",fontSize:14,fontWeight:600}}>Next →{kbHint("↵")}</button>
          :<button onClick={startKanaQuiz} style={{...btn,flex:1,padding:13,borderRadius:10,background:c.g,color:"#fff",fontSize:14,fontWeight:600}}>Quiz</button>}
      </div>
    </div>;
  }

  if(kScreen==="quiz"){
    const ch=kCards[kI];const rom=ROMAJI[ch];const m=M[ch];
    const prog=kCards.length>0?((kI+(kFb?1:0))/kCards.length*100):0;
    return <div style={inner}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
        <button onClick={()=>setKScreen("menu")} style={{...btn,background:"none",color:c.m,fontFamily:mono,fontSize:12,padding:0}}>← back</button>
        <div style={{fontFamily:mono,fontSize:12,color:c.m}}><span style={{color:c.g}}>{kScore.c}</span>{" / "}<span style={{color:c.a}}>{kScore.w}</span></div>
      </div>
      <div style={{height:4,background:c.b,borderRadius:4,marginBottom:16,overflow:"hidden"}}><div style={{height:"100%",width:prog+"%",background:c.a,borderRadius:4,transition:"width .3s"}}/></div>
      <div style={{display:"flex",justifyContent:"center",gap:4,marginBottom:20}}>
        {[["visual","👁"],["listen","👂"]].map(([m,ico])=><button key={m} onClick={()=>setKQuizMode(m)} style={{...btn,padding:"4px 12px",borderRadius:6,border:"1px solid "+(kQuizMode===m?c.go+"66":c.b),background:kQuizMode===m?c.go+"18":"transparent",color:kQuizMode===m?c.go:c.m,fontSize:12}}>{ico}</button>)}
      </div>
      <div style={{textAlign:"center",marginBottom:kFb?8:28}}>
        {kQuizMode==="listen"&&!kFb
          ?<><div onClick={()=>speak(ch)} style={{fontSize:108,lineHeight:1,marginBottom:10,color:c.m,cursor:"pointer",userSelect:"none"}}>?</div>
            <button onClick={()=>speak(ch)} style={{...btn,padding:"6px 16px",borderRadius:8,background:c.s2,border:"1px solid "+c.b,fontSize:13,color:c.m}}>🔊 play again</button></>
          :<div onClick={()=>speak(ch)} title="Listen" style={{fontSize:108,lineHeight:1,marginBottom:10,color:kFb==="ok"?c.g:kFb==="no"?c.a:c.tx,cursor:"pointer"}}>{ch}</div>}
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginTop:6}}>
          <span style={{fontSize:12,fontFamily:mono,color:c.m}}>{kI+1} of {kCards.length}</span>
          {kQuizMode!=="listen"&&<button onClick={()=>speak(ch)} style={{...btn,padding:"3px 9px",borderRadius:6,background:c.s2,border:"1px solid "+c.b,fontSize:11,color:c.m}}>🔊 listen</button>}
        </div>
      </div>
      {!kFb?<>
        <div style={{display:"flex",gap:8}}>
          <input ref={inputRef} value={kInput} onChange={e=>setKInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")submitKana();}}
            placeholder="romaji..." autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false"
            style={{flex:1,padding:"13px 16px",borderRadius:10,border:"1px solid "+c.b,background:c.s2,color:c.tx,fontFamily:mono,fontSize:20,outline:"none",textAlign:"center"}}/>
          <button onClick={submitKana} style={{...btn,padding:"13px 22px",borderRadius:10,background:kInput.trim()?c.a:c.b,color:kInput.trim()?"#fff":c.m,fontSize:14,fontWeight:600}}>Go{kbHint("↵")}</button>
        </div>
        <button onClick={()=>setKPeek(!kPeek)} style={{...btn,display:"block",margin:"14px auto 0",background:"none",color:c.m,fontFamily:mono,fontSize:11,opacity:.55}}>{kPeek?`"${rom}"`:"peek"}</button>
      </>:<>
        <div style={{...card,marginTop:14,background:kFb==="ok"?c.gs:c.rs,border:"1px solid "+(kFb==="ok"?c.g+"50":c.a+"50"),position:"relative",overflow:"hidden"}}>
          {m&&<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:130,opacity:0.1,pointerEvents:"none",lineHeight:1,userSelect:"none"}}>{m[0]}</div>}
          <div style={{position:"relative",zIndex:1,textAlign:"center"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,marginBottom:6}}>
              <span style={{fontSize:56}}>{ch}</span>
              <div style={{fontFamily:mono,fontSize:26,fontWeight:700,color:kFb==="ok"?c.g:c.a,marginLeft:8}}>{rom}</div>
            </div>
            {kFb==="no"&&<div style={{fontSize:12,color:c.m,marginBottom:8}}>you typed: <span style={{color:c.a,textDecoration:"line-through"}}>{kInput}</span></div>}
            {m&&<div style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:kFb==="ok"?c.gs:c.rs,borderRadius:10,border:"1px solid "+(kFb==="ok"?c.g+"30":c.a+"30"),textAlign:"left",marginTop:4}}>
              <span style={{fontSize:32,flexShrink:0}}>{m[0]}</span>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:c.tx,marginBottom:2}}>{m[1]}</div>
                <div style={{fontSize:11,color:c.m,fontStyle:"italic",lineHeight:1.4}}>{m[2]}</div>
              </div>
            </div>}
            <div style={{marginTop:10,display:"flex",gap:8,justifyContent:"center"}}>{speakBtn(ch)}{storyBtn(m,ch)}</div>
          </div>
        </div>
        <button onClick={nextKana} style={{...btn,width:"100%",padding:13,borderRadius:10,marginTop:12,background:c.a,color:"#fff",fontSize:14,fontWeight:600}}>{kI+1>=kCards.length?"See results":"Next →"}{kbHint("↵")}</button>
      </>}
    </div>;
  }

  if(kScreen==="results"){
    const pct=kCards.length>0?Math.round(kScore.c/kCards.length*100):0;
    return <div style={inner}>
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{fontSize:60,marginBottom:14}}>{pct>=90?"🎌":pct>=70?"📖":"🔄"}</div>
        <h2 style={{fontSize:26,fontWeight:700,margin:"0 0 6px",letterSpacing:"-.01em"}}>{pct>=90?"Excellent!":pct>=70?"Good progress":"Keep going"}</h2>
        <div style={{fontSize:44,fontWeight:800,fontFamily:mono,color:pct>=70?c.g:c.go}}>{pct}%</div>
      </div>
      {kMistakes.length>0&&<div style={{...card,marginBottom:16}}>
        <div style={{fontSize:11,fontFamily:mono,color:c.m,textTransform:"uppercase",marginBottom:10}}>Review</div>
        {kMistakes.map((m,i)=>{const mn=M[m.ch];return <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 0",borderBottom:i<kMistakes.length-1?"1px solid "+c.b:"none"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:26}}>{m.ch}</span>{mn&&<span style={{fontSize:18}}>{mn[0]}</span>}<span style={{fontFamily:mono,fontWeight:700,color:c.g}}>{m.rom}</span></div>
          <span style={{fontFamily:mono,fontSize:12,color:c.a,textDecoration:"line-through"}}>{m.ans}</span>
        </div>;})}
      </div>}
      <div style={{display:"flex",gap:10}}>
        <button onClick={()=>setKScreen("menu")} style={{...btn,flex:1,padding:13,borderRadius:10,border:"1px solid "+c.b,background:"transparent",color:c.tx,fontSize:14}}>Back</button>
        <button onClick={()=>{if(kMistakes.length>0){setKCards(shuffle(kMistakes.map(m=>m.ch)));setKI(0);setKInput("");setKFb(null);setKScore({c:0,w:0});setKMistakes([]);setKScreen("quiz");}else startKanaQuiz();}} style={{...btn,flex:1,padding:13,borderRadius:10,background:kMistakes.length?c.go:c.a,color:"#fff",fontSize:14,fontWeight:600}}>{kMistakes.length?"Retry misses":"Again"}</button>
      </div>
    </div>;
  }

  // menu screen
  return <div style={inner}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
      <div>
        <div style={{fontSize:11,fontFamily:mono,color:c.m,textTransform:"uppercase",letterSpacing:".08em",marginBottom:4}}>Kana Trainer</div>
        <h2 style={{fontSize:26,fontWeight:700,margin:0,letterSpacing:"-.01em"}}>{kScript==="h"?"ひらがな Hiragana":"カタカナ Katakana"}</h2>
      </div>
      <div style={{display:"flex",background:c.s2,borderRadius:8,border:"1px solid "+c.b,overflow:"hidden"}}>
        {[["h","ひらがな","Hiragana"],["k","カタカナ","Katakana"]].map(([s,jp,en])=><button key={s} onClick={()=>{setKScript(s);setKSel([0]);setKSelChars(null);}} style={{...btn,padding:"7px 14px",borderRadius:0,border:"none",background:kScript===s?c.a+"22":"transparent",color:kScript===s?c.a:c.m,fontSize:12,fontWeight:600}}>{jp} <span style={{fontSize:10,opacity:.7,marginLeft:2}}>{en}</span></button>)}
      </div>
    </div>
    <div style={{...card,marginBottom:16,padding:"14px 16px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{fontSize:11,fontFamily:mono,color:c.m,textTransform:"uppercase"}}>Select rows</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {kDueCount>0&&<button onClick={()=>{
            const due=shuffle(Object.keys(data.kana).filter(ch=>(data.kana[ch]?.box??0)>=1&&isKanaDue(ch)));
            setKCards(due);setKI(0);setKInput("");setKFb(null);setKScore({c:0,w:0});setKMistakes([]);setKPeek(false);setKScreen("quiz");
          }} style={{...btn,padding:"4px 12px",borderRadius:6,background:c.go+"22",border:"1px solid "+c.go+"44",color:c.go,fontSize:11,fontWeight:600}}>🔔 Review {kDueCount} kana</button>}
          <button onClick={()=>{setKSel(groups.map((_,i)=>i));setKSelChars(null);}} style={{...btn,padding:"4px 10px",borderRadius:6,border:"1px solid "+c.a+"44",background:c.a+"11",color:c.a,fontSize:11,fontWeight:600}}>Select all</button>
        </div>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        {groups.map((g,i)=>{const sel=kSelChars?g.c.every(ch=>kSelChars.has(ch)):kSel.includes(i);const partial=kSelChars&&g.c.some(ch=>kSelChars.has(ch))&&!sel;const mas=g.c.every(ch=>getKBox(ch)>=3);const due=g.c.filter(ch=>data.kana[ch]?.box>=1&&isKanaDue(ch)).length;
          return <button key={i} onClick={()=>{
            setKSelChars(null);const newSel=kSel.includes(i)?kSel.filter(x=>x!==i):[...kSel,i];setKSel(newSel);
          }} style={{...btn,padding:"8px 14px",borderRadius:8,border:"1px solid "+((sel||partial)?c.a:c.b),background:sel?c.as:partial?c.a+"0d":"transparent",color:(sel||partial)?c.tx:c.m,fontSize:13,fontWeight:sel?600:400,minWidth:48}}>{g.n}{mas&&<span style={{marginLeft:4,color:c.g,fontSize:10}}>✓</span>}{due>0&&<span style={{marginLeft:4,fontSize:9,padding:"1px 5px",borderRadius:10,background:c.a+"22",color:c.a}}>{due}</span>}</button>;
        })}
      </div>
    </div>
    <div style={{display:"flex",gap:10,marginBottom:14}}>
      <button onClick={()=>{setKLI(0);setKFlip(false);setKScreen("learn");}} disabled={!allKana.length} style={{...btn,flex:1,padding:14,borderRadius:10,background:allKana.length?c.s2:c.b,border:"1px solid "+c.b,color:allKana.length?c.tx:c.m,fontSize:14,fontWeight:600}}>Learn ({allKana.length})</button>
      <button onClick={startKanaQuiz} disabled={!allKana.length} style={{...btn,flex:1,padding:14,borderRadius:10,background:allKana.length?c.a:c.b,color:allKana.length?"#fff":c.m,fontSize:14,fontWeight:600}}>Quiz ({allKana.length})</button>
    </div>
    {/* Base kana grid — individual tiles */}
    <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:4}}>
      {groups.filter(g=>!g.dk&&!g.yo).flatMap(g=>g.c).map((ch,i)=>{const box=getKBox(ch);const mastered=box>=3;const learning=box>=1&&box<3;const due=isKanaDue(ch)&&box>=1;const selected=allKana.includes(ch);
        return <div key={i} onClick={()=>{
          const current=new Set(allKana);
          if(selected){current.delete(ch);}else{current.add(ch);}
          setKSelChars(current.size?current:null);
          if(!current.size)setKSel([]);
        }} style={{
          width:tileSize,height:tileSize,cursor:"pointer",
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
          borderRadius:9,
          background:selected?(mastered?c.gs:learning?c.go+"1a":c.as):(c.s2+"66"),
          border:"1px solid "+(selected?(mastered?c.g+"55":learning?c.go+"44":c.a):c.b+"44"),
          outline:due?"2px solid "+c.a+"50":"none",
          position:"relative",
          opacity:selected?1:.4,
          transition:"opacity .15s",
        }}>
          <div style={{fontSize:tileFont,lineHeight:1}}>{ch}</div>
          <div style={{fontSize:8,color:c.m,marginTop:2}}>{ROMAJI[ch]}</div>
          {mastered&&<div style={{position:"absolute",top:2,right:4,fontSize:7,color:c.g}}>✓</div>}
          {learning&&<div style={{position:"absolute",top:2,right:4,fontSize:7,color:c.go,fontFamily:mono,fontWeight:700}}>{box}</div>}
        </div>;
      })}
    </div>
    {/* Dakuten/Yoon as compact selectable tiles */}
    {groups.filter(g=>g.dk||g.yo).length>0&&<>
      <div style={{fontSize:11,fontFamily:mono,color:c.m,textTransform:"uppercase",marginTop:14,marginBottom:6}}>Dakuten & Combinations</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
        {groups.filter(g=>g.dk||g.yo).map((g,gi)=>{
          const gIdx=groups.indexOf(g);const sel=kSel.includes(gIdx);
          return <button key={gi} onClick={()=>{setKSelChars(null);const newSel=kSel.includes(gIdx)?kSel.filter(x=>x!==gIdx):[...kSel,gIdx];setKSel(newSel);}} style={{...btn,padding:"6px 10px",borderRadius:8,border:"1px solid "+(sel?c.a:c.b+"44"),background:sel?c.as:"transparent",color:sel?c.a:c.m,fontSize:12,opacity:sel?1:.5}}>
            {g.c.map(ch=>ch).join(" ")}
          </button>;
        })}
      </div>
    </>}
  </div>;
}
