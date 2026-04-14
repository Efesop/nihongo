import { font, mono } from "../data/constants.js";

export default function Profile({
  c, card, btn,
  user, data, save, profile, saveProfile,
  syncStatus, showProfile, setShowProfile, signOut,
}) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setShowProfile(false)}>
      <div style={{...card,width:"100%",maxWidth:360,padding:24}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
          <div style={{fontSize:16,fontWeight:700}}>Your Profile</div>
          <div style={{fontSize:11,color:c.m}}>{user.primaryEmailAddress?.emailAddress}</div>
        </div>
        <div style={{fontSize:12,color:c.m,marginBottom:18}}>Changes save automatically to the cloud</div>

        <div style={{fontSize:11,color:c.m,marginBottom:4,fontFamily:mono,textTransform:"uppercase"}}>Display Name</div>
        <input value={profile.name} onChange={e=>saveProfile({name:e.target.value})} placeholder="e.g. Ollie"
          style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid "+c.b,background:c.s2,color:c.tx,fontFamily:font,fontSize:14,outline:"none",marginBottom:14,boxSizing:"border-box"}}/>

        <div style={{fontSize:11,color:c.m,marginBottom:4,fontFamily:mono,textTransform:"uppercase"}}>Why learning Japanese</div>
        <select value={data.onboarding?.why||""} onChange={e=>save({onboarding:{...data.onboarding,why:e.target.value}})}
          style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid "+c.b,background:c.s2,color:c.tx,fontFamily:font,fontSize:14,outline:"none",marginBottom:12,boxSizing:"border-box"}}>
          <option value="">Select a reason...</option>
          <option value="travel">Travelling to Japan</option>
          <option value="anime">Anime & culture</option>
          <option value="work">Work or study</option>
          <option value="moving">Living / moving there</option>
          <option value="curious">Just curious</option>
        </select>
        <div style={{fontSize:11,color:c.m,marginBottom:4,fontFamily:mono,textTransform:"uppercase"}}>Trip date (optional)</div>
        <input type="date" value={data.onboarding?.tripDate||""} onChange={e=>save({onboarding:{...data.onboarding,tripDate:e.target.value}})}
          style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid "+c.b,background:c.s2,color:c.tx,fontFamily:font,fontSize:14,outline:"none",marginBottom:12,boxSizing:"border-box"}}/>
        <div style={{fontSize:11,color:c.m,marginBottom:4,fontFamily:mono,textTransform:"uppercase"}}>Extra context for Senpai</div>
        <textarea value={profile.notes} onChange={e=>saveProfile({notes:e.target.value.slice(0,200)})} placeholder="e.g. vegetarian, solo traveller, interested in anime, need business phrases..."
          rows={2} style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid "+c.b,background:c.s2,color:c.tx,fontFamily:font,fontSize:13,outline:"none",resize:"none",boxSizing:"border-box",lineHeight:1.5}}/>
        <div style={{fontSize:10,color:c.m,fontFamily:mono,textAlign:"right",marginBottom:16}}>{(profile.notes||"").length}/200</div>

        <div style={{fontSize:11,color:c.m,marginBottom:4,fontFamily:mono,textTransform:"uppercase"}}>Learn settings</div>
        <div style={{padding:"10px 12px",background:c.s2,borderRadius:8,marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
          <div>
            <div style={{fontSize:13,fontWeight:600}}>🎤 Shadow mode (speaking)</div>
            <div style={{fontSize:11,color:c.m,marginTop:2}}>Turn off when in public or can't speak aloud</div>
          </div>
          <button onClick={()=>save({settings:{...data.settings,shadowDisabled:!data.settings?.shadowDisabled}})}
            style={{...btn,padding:"6px 14px",borderRadius:20,background:data.settings?.shadowDisabled?c.s:c.a,color:data.settings?.shadowDisabled?c.m:"#fff",fontSize:12,fontWeight:600,border:"1px solid "+c.b}}>
            {data.settings?.shadowDisabled?"Off":"On"}
          </button>
        </div>

        <div style={{display:"flex",gap:8,fontSize:12,color:c.m,marginBottom:18,padding:"10px 12px",background:c.s2,borderRadius:8}}>
          <span>🔥 {data.streak||1} day streak</span>
          <span style={{marginLeft:"auto"}}>📚 {data.sessions} sessions</span>
          <span>✅ {data.totalC} correct</span>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setShowProfile(false)} style={{...btn,flex:1,padding:11,borderRadius:9,background:c.a,color:"#fff",fontSize:14,fontWeight:600}}>Done</button>
          <button onClick={()=>signOut()} style={{...btn,padding:"11px 14px",borderRadius:9,background:"transparent",border:"1px solid "+c.b,color:c.m,fontSize:13}}>Sign out</button>
        </div>
      </div>
    </div>
  );
}
