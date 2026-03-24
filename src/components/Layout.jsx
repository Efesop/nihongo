import { font, mono } from "../data/constants.js";
import { daysUntil } from "../utils/helpers.js";

export default function Layout({
  c, theme, btn,
  isDesktop, SIDEBAR_W,
  tab, handleTabClick, tabs,
  profile, setShowProfile,
  toggleTheme, syncStatus, kDueCount,
  data,
}) {
  const sideTabBtn=(active)=>({
    ...btn,width:"100%",padding:"9px 12px",
    background:active?c.as:"transparent",
    display:"flex",flexDirection:"row",alignItems:"center",gap:10,
    color:active?c.a:c.m,fontSize:14,fontWeight:active?600:400,
    borderRadius:8,border:"none",textAlign:"left",
  });

  const bottomTabBtn=(active)=>({
    ...btn,flex:1,padding:"10px 0 8px",background:"transparent",
    display:"flex",flexDirection:"column",alignItems:"center",gap:3,
    color:active?c.a:c.m,fontSize:10,fontWeight:active?600:400,
  });

  if(isDesktop){
    return <div style={{position:"fixed",top:0,left:0,bottom:0,width:SIDEBAR_W,background:c.s,borderRight:"1px solid "+c.b,display:"flex",flexDirection:"column",zIndex:100}}>
      <div style={{padding:"16px 16px 14px",borderBottom:"1px solid "+c.b,display:"flex",alignItems:"center",gap:10}}>
        <img src="/images/tinysenpai/tinysenpai2.png" alt="TinySenpai" style={{width:64,height:64,imageRendering:"pixelated",borderRadius:10}}/>
        <div>
          <div style={{fontSize:18,fontWeight:700,letterSpacing:"-.02em",lineHeight:1}}>日本語</div>
          <div style={{fontSize:11,color:c.m,marginTop:3,fontFamily:mono,letterSpacing:".02em"}}>TinySenpai</div>
        </div>
      </div>
      <div style={{flex:1,padding:"12px 8px"}}>
        {tabs.map(tb=><button key={tb.id} onClick={()=>handleTabClick(tb.id)} style={{...sideTabBtn(tab===tb.id||tab==="drill"&&tb.id==="home"),position:"relative"}}>
          <span style={{fontSize:18,lineHeight:1}}>{tb.icon}</span>
          <span>{tb.label}</span>
          {tb.id==="kana"&&kDueCount>0&&<span style={{marginLeft:"auto",fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:10,background:c.go+"22",color:c.go,fontFamily:mono}}>{kDueCount}</span>}
        </button>)}
      </div>
      <div style={{padding:"10px 8px",borderTop:"1px solid "+c.b}}>
        <button onClick={()=>setShowProfile(true)} style={{...sideTabBtn(false),gap:10,marginBottom:2}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.m} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          <span style={{fontSize:13}}>{profile.name||"Profile"}</span>
          <div style={{marginLeft:"auto",width:7,height:7,borderRadius:"50%",background:syncStatus==="saved"?c.g:syncStatus==="saving"?c.go:syncStatus==="error"?c.a:c.b,transition:"background .3s",flexShrink:0}}/>
        </button>
        <button onClick={toggleTheme} style={{...sideTabBtn(false),gap:10}}>
          {theme==="dark"
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.m} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.m} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
          <span style={{fontSize:13}}>{theme==="dark"?"Light mode":"Dark mode"}</span>
          {daysUntil(data.onboarding?.tripDate)>0&&<span style={{marginLeft:"auto",fontSize:10,fontFamily:mono,color:c.m,flexShrink:0}}>{daysUntil(data.onboarding?.tripDate)}d</span>}
        </button>
      </div>
    </div>;
  }

  // mobile bottom nav
  return <div style={{position:"fixed",bottom:0,left:0,right:0,background:c.s,borderTop:"1px solid "+c.b,display:"flex",zIndex:100,paddingBottom:"env(safe-area-inset-bottom)"}}>
    {tabs.map(tb=>{const active=tab===tb.id||(tab==="drill"&&tb.id==="home");return <button key={tb.id} onClick={()=>handleTabClick(tb.id)} style={{...bottomTabBtn(active),position:"relative"}}>
      <span style={{fontSize:20}}>{tb.icon}</span><span>{tb.label}</span>
      {active&&<div style={{width:4,height:4,borderRadius:2,background:c.a,marginTop:1}}/>}
      {tb.id==="kana"&&kDueCount>0&&<span style={{position:"absolute",top:4,right:"50%",transform:"translateX(14px)",fontSize:9,fontWeight:700,minWidth:16,padding:"1px 4px",borderRadius:8,background:c.go,color:"#fff",textAlign:"center",lineHeight:"14px"}}>{kDueCount}</span>}
    </button>;})}
  </div>;
}
