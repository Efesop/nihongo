import { font, mono } from "../data/constants.js";

const WHY_OPTIONS=[
  {id:"travel",icon:"🗾",label:"Travelling to Japan"},
  {id:"anime",icon:"🎌",label:"Anime & culture"},
  {id:"work",icon:"💼",label:"Work or study"},
  {id:"moving",icon:"🏠",label:"Living / moving there"},
  {id:"curious",icon:"✨",label:"Just curious"},
];
const LEVEL_OPTIONS=[
  {id:"beginner",label:"Complete beginner — I know nothing yet"},
  {id:"basics",label:"I know a few words or phrases"},
  {id:"refresh",label:"Studied before, need a refresh"},
  {id:"intermediate",label:"Intermediate — want to level up"},
];

export default function Onboarding({
  c, theme, card, btn,
  onboardStep, setOnboardStep, onboardAnswers, setOnboardAnswers,
  save,
}) {
  const finishOnboarding=()=>{
    const ob={...onboardAnswers,completedAt:new Date().toISOString()};
    save({onboarded:true,onboarding:ob});
  };

  const stepCount=3;
  const progressPct=Math.round((onboardStep/stepCount)*100);
  const ans=onboardAnswers;
  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:theme==="dark"?`radial-gradient(ellipse 80% 50% at 50% 110%, rgba(192,40,42,0.16) 0%, transparent 70%), ${c.bg}`:c.bg,padding:24,color:c.tx,fontFamily:font}}>
      <div style={{width:"100%",maxWidth:420}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:36,fontWeight:800,letterSpacing:"-.02em",marginBottom:4}}>日本語</div>
          <div style={{fontSize:12,color:c.m,fontFamily:mono,textTransform:"uppercase",letterSpacing:".08em"}}>TinySenpai</div>
        </div>
        {/* progress bar */}
        <div style={{height:3,background:c.b,borderRadius:2,marginBottom:32}}>
          <div style={{height:3,width:progressPct+"%",background:c.a,borderRadius:2,transition:"width .3s"}}/>
        </div>

        {onboardStep===0&&(
          <div>
            <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>Why are you learning Japanese?</div>
            <div style={{fontSize:14,color:c.m,marginBottom:20}}>We'll personalise your experience around your goal.</div>
            {WHY_OPTIONS.map(o=>(
              <div key={o.id} onClick={()=>{setOnboardAnswers(a=>({...a,why:o.id}));setOnboardStep(1);}}
                style={{...card,padding:"14px 18px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:14,border:"1px solid "+(ans.why===o.id?c.a:c.b),transition:"border .15s"}}>
                <span style={{fontSize:22}}>{o.icon}</span>
                <span style={{fontSize:15,fontWeight:500,color:c.tx}}>{o.label}</span>
              </div>
            ))}
            <button onClick={()=>setOnboardStep(1)} style={{...btn,width:"100%",padding:12,marginTop:8,background:"transparent",color:c.m,fontSize:13}}>Skip</button>
          </div>
        )}

        {onboardStep===1&&(
          <div>
            <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>What's your current level?</div>
            <div style={{fontSize:14,color:c.m,marginBottom:20}}>Be honest — this helps your AI tutor pitch things right.</div>
            {LEVEL_OPTIONS.map(o=>(
              <div key={o.id} onClick={()=>{setOnboardAnswers(a=>({...a,level:o.id}));setOnboardStep(2);}}
                style={{...card,padding:"14px 18px",marginBottom:8,cursor:"pointer",border:"1px solid "+(ans.level===o.id?c.a:c.b),transition:"border .15s"}}>
                <span style={{fontSize:14,fontWeight:500,color:c.tx}}>{o.label}</span>
              </div>
            ))}
            <button onClick={()=>setOnboardStep(2)} style={{...btn,width:"100%",padding:12,marginTop:8,background:"transparent",color:c.m,fontSize:13}}>Skip</button>
          </div>
        )}

        {onboardStep===2&&(
          <div>
            <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>Anything else to know?</div>
            <div style={{fontSize:14,color:c.m,marginBottom:20}}>Optional — helps your Senpai give better answers.</div>
            {ans.why==="travel"&&(
              <div style={{marginBottom:16}}>
                <div style={{fontSize:12,color:c.m,fontFamily:mono,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>Trip date (optional)</div>
                <input type="date" value={ans.tripDate||""} onChange={e=>setOnboardAnswers(a=>({...a,tripDate:e.target.value}))}
                  style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid "+c.b,background:c.s2,color:c.tx,fontFamily:font,fontSize:14,outline:"none",boxSizing:"border-box",marginBottom:12}}/>
              </div>
            )}
            <div style={{fontSize:12,color:c.m,fontFamily:mono,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>Anything to focus on? (optional)</div>
            <textarea value={ans.focus||""} onChange={e=>setOnboardAnswers(a=>({...a,focus:e.target.value.slice(0,200)}))}
              placeholder="e.g. ordering food, reading menus, anime without subtitles, business meetings..."
              rows={3} style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid "+c.b,background:c.s2,color:c.tx,fontFamily:font,fontSize:13,outline:"none",resize:"none",boxSizing:"border-box",lineHeight:1.5,marginBottom:16}}/>
            <button onClick={finishOnboarding} style={{...btn,width:"100%",padding:14,borderRadius:10,background:c.a,color:"#fff",fontSize:15,fontWeight:600}}>Let's go →</button>
          </div>
        )}
      </div>
    </div>
  );
}
