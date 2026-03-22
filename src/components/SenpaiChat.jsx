import { PHRASES } from "../data/phrases.js";
import { RP_SCENARIOS, font, mono } from "../data/constants.js";
import { daysUntil } from "../utils/helpers.js";

export default function SenpaiChat({
  data, c, btn,
  isDesktop, SIDEBAR_W, hov, setHov,
  profile,
  msgs, setMsgs, chatIn, setChatIn, loading, setLoading,
  chatEndRef,
  learnedPhr, dueCount,
  sendToSensei, startRolePlay,
}) {
  const chatW=isDesktop?800:540;
  return <div style={{fontFamily:font,background:c.bg,color:c.tx,display:"flex",flexDirection:"column",position:"fixed",top:0,right:0,bottom:0,left:isDesktop?SIDEBAR_W:0}}>
    <style>{`@keyframes pulse{0%,100%{opacity:.2}50%{opacity:.9}}.dot1{animation:pulse 1.4s ease-in-out infinite}.dot2{animation:pulse 1.4s ease-in-out .22s infinite}.dot3{animation:pulse 1.4s ease-in-out .44s infinite}`}</style>
    <div style={{padding:"18px 24px 14px",borderBottom:"1px solid "+c.b,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{fontSize:26}}>🎌</div>
        <div>
          <div style={{fontSize:16,fontWeight:700}}>Senpai{profile.name?` · ${profile.name}`:""}</div>
          <div style={{fontSize:11,color:c.m}}>AI Japanese tutor · {data.streak||1} day streak</div>
        </div>
      </div>
      {msgs.length>0&&<button onClick={()=>setMsgs([])} style={{...btn,padding:"5px 10px",borderRadius:7,background:c.s2,border:"1px solid "+c.b,fontSize:12,color:c.m}}>New</button>}
    </div>
    <div style={{flex:1,overflow:"auto",padding:"20px 24px"}}>
      {msgs.length===0&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"60%",textAlign:"center",padding:"40px 20px"}}>
        <div style={{fontSize:52,marginBottom:16}}>🎌</div>
        <div style={{fontSize:18,fontWeight:600,marginBottom:6}}>Hey{profile.name?`, ${profile.name}`:""}. I'm your Senpai.</div>
        <div style={{fontSize:13,color:c.m,marginBottom:24,lineHeight:1.6}}>I know your progress and trip details.</div>
        {/* Role-play scenarios */}
        <div style={{width:"100%",maxWidth:460,marginBottom:20}}>
          <div style={{fontSize:11,fontFamily:mono,color:c.m,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10,textAlign:"left"}}>Role-play a scenario</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {RP_SCENARIOS.map((sc,i)=>
              <button key={sc.id} onClick={()=>startRolePlay(sc)}
                onMouseEnter={()=>setHov("rp"+i)} onMouseLeave={()=>setHov(null)}
                style={{...btn,padding:"11px 14px",borderRadius:10,background:hov==="rp"+i?c.s2:c.s,border:"1px solid "+c.b,color:c.tx,fontSize:13,textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center",transition:"all .15s"}}>
                <span>{sc.icon} {sc.name}</span><span style={{color:c.m,opacity:.4,fontSize:16}}>→</span>
              </button>
            )}
          </div>
        </div>
        {/* Free questions */}
        <div style={{width:"100%",maxWidth:460}}>
          <div style={{fontSize:11,fontFamily:mono,color:c.m,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10,textAlign:"left"}}>Or ask a question</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {["Quiz me on what I've learned","Explain how to count in Japanese","What phrases should I focus on?",data.onboarding?.why==="travel"?"Cultural tips for Japan":data.onboarding?.why==="anime"?"Anime phrases I should know":"What should I learn next?"].map((s,i)=>
              <button key={i} onClick={()=>setChatIn(s)}
                onMouseEnter={()=>setHov("sg"+i)} onMouseLeave={()=>setHov(null)}
                style={{...btn,padding:"11px 14px",borderRadius:10,background:hov==="sg"+i?c.s2:c.s,border:"1px solid "+c.b,color:c.tx,fontSize:13,textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center",transition:"all .15s"}}>
                <span>{s}</span><span style={{color:c.m,opacity:.4,fontSize:16}}>→</span>
              </button>
            )}
          </div>
        </div>
      </div>}
      <div style={{maxWidth:chatW,margin:"0 auto"}}>
        {msgs.map((m,i)=>m.role!=="user"||!m.content.startsWith("Let's role-play")&&!m.content.startsWith("Let's do a role-play")?<div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:10}}>
          <div style={{
            maxWidth:"80%",padding:"10px 14px",
            borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",
            background:m.role==="user"?c.a+"18":c.s,
            border:"1px solid "+(m.role==="user"?c.a+"30":c.b),
            fontSize:14,lineHeight:1.65,whiteSpace:"pre-wrap",
          }}>{m.content}</div>
        </div>:null)}
        {loading&&<div style={{display:"flex",marginBottom:10}}>
          <div style={{padding:"12px 18px",borderRadius:"14px 14px 14px 4px",background:c.s,border:"1px solid "+c.b,display:"flex",gap:5,alignItems:"center"}}>
            <span className="dot1" style={{fontSize:22,color:c.m,lineHeight:1}}>·</span>
            <span className="dot2" style={{fontSize:22,color:c.m,lineHeight:1}}>·</span>
            <span className="dot3" style={{fontSize:22,color:c.m,lineHeight:1}}>·</span>
          </div>
        </div>}
        <div ref={chatEndRef}/>
      </div>
    </div>
    <div style={{padding:"12px 24px",borderTop:"1px solid "+c.b,paddingBottom:"max(14px, env(safe-area-inset-bottom))",background:c.bg}}>
      <div style={{maxWidth:chatW,margin:"0 auto",display:"flex",gap:8}}>
        <input value={chatIn} onChange={e=>setChatIn(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendToSensei();}}}
          placeholder="Ask senpai..." style={{flex:1,padding:"11px 16px",borderRadius:10,border:"1px solid "+c.b,background:c.s2,color:c.tx,fontFamily:font,fontSize:14,outline:"none"}}/>
        <button onClick={()=>sendToSensei()} disabled={!chatIn.trim()||loading} style={{...btn,padding:"11px 20px",borderRadius:10,background:chatIn.trim()&&!loading?c.a:c.b,color:chatIn.trim()&&!loading?"#fff":c.m,fontSize:14,fontWeight:600}}>Send</button>
      </div>
    </div>
  </div>;
}
