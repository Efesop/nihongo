import { useState, useRef, useEffect } from "react";
import { M, ROMAJI } from "../data/kana.js";
import { PHRASES, CATS, CAT_ICONS, CAT_COLORS } from "../data/phrases.js";
import { font, mono } from "../data/constants.js";
import { speak, speakPhrase, speakPhraseWithEnglish } from "../utils/audio.js";
import { shuffle } from "../utils/helpers.js";
import { buildSmartSession, getSessionSummary, matchRomaji, getDistractors } from "../utils/sessionEngine.js";

export default function SmartSession({
  data, save, c, inner, card, btn, isDesktop,
  updateKanaSRS, reviewPhr,
  stopAudio, speakStory, setTab,
}) {
  const [cards, setCards] = useState([]);
  const [ci, setCi] = useState(0);
  const [input, setInput] = useState("");
  const [fb, setFb] = useState(null); // null | "ok" | "no"
  const [score, setScore] = useState({ c: 0, w: 0 });
  const [done, setDone] = useState(false);
  const [struggled, setStruggled] = useState([]);
  const [startTime] = useState(Date.now());
  const [choiceAnswer, setChoiceAnswer] = useState(null);
  const [sessionFeedback, setSessionFeedback] = useState(null);
  const [coachingPlan, setCoachingPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  // Floating chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [senpaiMsg, setSenpaiMsg] = useState(null);
  const [senpaiHover, setSenpaiHover] = useState(false);
  const [hoverQuip, setHoverQuip] = useState("");
  const [typingText, setTypingText] = useState("");
  const [streak, setStreak] = useState(0);
  const inputRef = useRef(null);
  const chatInputRef = useRef(null);
  const typingRef = useRef(null);

  // Typewriter effect for senpai speech
  const typeOut = (text, displayMs = 3000) => {
    if (typingRef.current) clearInterval(typingRef.current);
    setSenpaiMsg(""); setTypingText("");
    let i = 0;
    typingRef.current = setInterval(() => {
      i++;
      setTypingText(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(typingRef.current);
        setSenpaiMsg(text);
      }
    }, 25);
  };

  // Senpai personality — harsh but firm sensei
  const senpaiReact = (correct) => {
    const newStreak = correct ? streak + 1 : 0;
    setStreak(newStreak);
    let msg = null;
    if (correct && newStreak === 3) msg = "Hmph. Not terrible, I suppose.";
    else if (correct && newStreak === 5) msg = "...Acceptable. Don't stop now.";
    else if (correct && newStreak === 7) msg = "Don't get cocky. You have far to go.";
    else if (correct && newStreak === 10) msg = "...Fine. You may have some potential after all.";
    else if (correct && newStreak >= 12) msg = "I see you've been practicing. Perhaps there's hope.";
    else if (!correct && streak >= 5) msg = "Careless. You were doing well. Focus.";
    else if (!correct && streak >= 3) msg = "Tch. You lost your concentration.";
    else if (!correct) {
      const wrongs = ["Try again. Properly this time.", "Sloppy. Pay attention.", "Focus. This is basic.", "Weak. You can do better.", "Think before you answer next time.", "Disappointing. Again.", "Did you even try? Do it again.", "Hmph. Pathetic."];
      if (Math.random() < 0.45) msg = wrongs[Math.floor(Math.random() * wrongs.length)];
    }
    if (correct && Math.random() < 0.15 && newStreak < 3) {
      const mild = ["...Fine. Barely acceptable.", "Took you long enough.", "Lucky guess, perhaps."];
      msg = mild[Math.floor(Math.random() * mild.length)];
    }
    if (msg) typeOut(msg, 3500);
  };

  const situations = { greet: "You meet someone.", food: "You're at a restaurant.", train: "You're navigating transport.", hotel: "You're at your hotel.", shop: "You're at a store.", dir: "You need directions.", sos: "It's an emergency." };

  // Build session on mount — call coaching API first
  useEffect(() => {
    if (cards.length === 0 && !done) {
      (async () => {
        try {
          const res = await fetch('/api/coach', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'plan', userData: data }),
          });
          const plan = await res.json();
          if (!plan.error) setCoachingPlan(plan);
          const session = buildSmartSession(data, 10, plan.difficulty || data.settings?.sessionDifficulty || 0);
          if (session.length > 0) setCards(session);
          else setDone(true);
        } catch {
          // Fallback: build session without AI coaching
          const session = buildSmartSession(data, 10, data.settings?.sessionDifficulty || 0);
          if (session.length > 0) setCards(session);
          else setDone(true);
        }
        setLoading(false);
      })();
    }
  }, []);

  // Focus input when needed + auto-play for listen exercises
  useEffect(() => {
    if (inputRef.current && !fb) inputRef.current.focus();
    if (cards[ci]?.type === "kana-listen" && !fb) {
      const t = setTimeout(() => speak(cards[ci].item), 300);
      return () => clearTimeout(t);
    }
  }, [ci, fb]);

  // Post-session AI review
  useEffect(() => {
    if (done && score.c + score.w > 0 && !sessionFeedback) {
      fetch('/api/coach', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'review', userId: data.onboarding?.name || 'user',
          sessionResults: { score, struggled: struggled.map(s => s.label), timeElapsed: Math.round((Date.now() - startTime) / 1000), totalCards: cards.length },
          userData: data,
        }),
      }).then(r => r.json()).then(review => {
        if (review.userCoaching) save({ settings: { ...data.settings, coaching: review.userCoaching, nextFocus: review.nextFocus } });
      }).catch(() => {});
    }
  }, [done]);

  // Floating chat send
  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages(m => [...m, { role: "user", content: userMsg }]);
    setChatLoading(true);
    try {
      const currentEx = cards[ci];
      const contextInfo = currentEx ? `User is currently practicing: ${currentEx.type}. Item: ${typeof currentEx.item === 'string' ? currentEx.item + ' (' + ROMAJI[currentEx.item] + ')' : currentEx.item[1] + ' - ' + currentEx.item[3]}` : 'Between exercises';
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: `You are Senpai, a helpful Japanese language tutor inside a learning session. Be brief and encouraging. The user is practicing Japanese and might ask about pronunciation, meaning, grammar, or usage. Context: ${contextInfo}. Keep responses under 3 sentences.`,
          messages: [...chatMessages.slice(-6), { role: "user", content: userMsg }],
        }),
      });
      const d = await res.json();
      const reply = d.content?.[0]?.text || "Sorry, I couldn't respond.";
      setChatMessages(m => [...m, { role: "assistant", content: reply }]);
    } catch { setChatMessages(m => [...m, { role: "assistant", content: "Connection error." }]); }
    setChatLoading(false);
  };

  // Loading timeout — fallback after 8 seconds
  useEffect(() => {
    if (loading) {
      const t = setTimeout(() => {
        if (cards.length === 0) {
          const session = buildSmartSession(data, 10, 0);
          if (session.length > 0) setCards(session);
          else setDone(true);
          setLoading(false);
        }
      }, 8000);
      return () => clearTimeout(t);
    }
  }, [loading]);

  // Loading state
  if (loading) return <div style={inner}>
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🧠</div>
      <div style={{ fontSize: 15, color: c.m }}>Building your session...</div>
      {coachingPlan?.sessionNotes && <div style={{ fontSize: 13, color: c.a, marginTop: 12, fontStyle: "italic" }}>{coachingPlan.sessionNotes}</div>}
      <button onClick={() => { stopAudio(); setTab("home"); }} style={{ ...btn, marginTop: 24, padding: "8px 20px", borderRadius: 8, border: "1px solid " + c.b, background: "transparent", color: c.m, fontSize: 12 }}>← cancel</button>
    </div>
  </div>;

  if (done) {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    const pct = score.c + score.w > 0 ? Math.round(score.c / (score.c + score.w) * 100) : 0;

    // Grade + mascot pose based on performance
    const grade = pct >= 90 ? { rank: "S", label: "Perfect!", img: "/images/tinysenpaistrike/4.png", color: c.go, note: "Making it harder next time", adj: -1 }
      : pct >= 70 ? { rank: "A", label: "Great job!", img: "/images/tinysenpaistrike/1.png", color: c.g, note: "Good balance — keeping this level", adj: 0 }
      : pct >= 50 ? { rank: "B", label: "Keep going!", img: "/images/tinysenpairun/ts1.png", color: c.a, note: "A bit tough — easing off slightly", adj: 1 }
      : { rank: "C", label: "Let's practice more", img: "/images/tinysenpai2.png", color: c.m, note: "Tough session — easing off next time", adj: 1 };

    // Auto-save difficulty adjustment
    if (!sessionFeedback) {
      setTimeout(() => {
        setSessionFeedback(grade.note);
        save({ settings: { ...data.settings, sessionDifficulty: (data.settings?.sessionDifficulty || 0) + grade.adj } });
      }, 0);
    }

    return <div style={inner}>
      <div style={{ textAlign: "center", padding: "30px 20px" }}>
        {/* Mascot + Grade */}
        <img src={grade.img} alt="TinySenpai" style={{ width: 160, height: 160, imageRendering: "pixelated", marginBottom: 12 }} />
        <div style={{ fontSize: 48, fontWeight: 900, color: grade.color, fontFamily: mono, letterSpacing: "-.02em" }}>{grade.rank}</div>
        <h3 style={{ fontSize: 22, fontWeight: 700, margin: "6px 0 4px" }}>{grade.label}</h3>
        <div style={{ fontSize: 14, color: c.m }}>{pct}% correct</div>

        {/* Stats */}
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 20, marginBottom: 20 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: c.g }}>{score.c}</div>
            <div style={{ fontSize: 10, color: c.m, fontFamily: mono }}>correct</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: c.a }}>{score.w}</div>
            <div style={{ fontSize: 10, color: c.m, fontFamily: mono }}>missed</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: c.m }}>{mins}:{secs.toString().padStart(2, "0")}</div>
            <div style={{ fontSize: 10, color: c.m, fontFamily: mono }}>time</div>
          </div>
        </div>

        {/* Difficulty note */}
        <div style={{ fontSize: 12, color: grade.color, marginBottom: 16 }}>{grade.note}</div>

        {/* Struggled items */}
        {struggled.length > 0 && <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: c.m, marginBottom: 6 }}>Struggled with:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, justifyContent: "center" }}>
            {struggled.map((item, i) => <span key={i} style={{ fontSize: 13, padding: "3px 8px", borderRadius: 6, background: c.go + "12", border: "1px solid " + c.go + "28", color: c.go }}>{item.label}</span>)}
          </div>
        </div>}

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
          <button onClick={() => { setCards([]); setDone(false); setCi(0); setScore({ c: 0, w: 0 }); setStruggled([]); setFb(null); setInput(""); setChoiceAnswer(null); setSessionFeedback(null); setLoading(true); }}
            style={{ ...btn, padding: 14, borderRadius: 10, background: c.a, color: "#fff", fontSize: 15, fontWeight: 600 }}>Continue (10 more)</button>
          <button onClick={() => { stopAudio(); setTab("home"); }}
            style={{ ...btn, padding: 14, borderRadius: 10, border: "1px solid " + c.b, background: "transparent", color: c.m, fontSize: 14 }}>Done for now</button>
        </div>
      </div>
    </div>;
  }

  if (cards.length === 0) return null;
  const ex = cards[ci];
  if (!ex) { setDone(true); return null; }

  const progress = ((ci + (fb ? 1 : 0)) / cards.length * 100);
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const mins = Math.floor(elapsed / 60);

  const advance = (correct) => {
    stopAudio(); // Prevent audio overlap between cards
    senpaiReact(correct);
    if (!correct) setStruggled(s => [...s, { label: typeof ex.item === 'string' ? ex.item : ex.item[1], type: ex.type }]);
    setFb(null); setInput(""); setChoiceAnswer(null);
    if (ci + 1 >= cards.length) setDone(true);
    else setCi(ci + 1);
  };

  // ═══ SENPAI — mascot circle + reactions + expandable chat ═══
  const hoverQuips = ["What do you need from me?", "Speak. I don't have all day.", "Don't waste my time, student.", "...You have a question?", "Hurry up and ask already.", "This better be important.", "You dare interrupt my meditation?"];

  const senpaiBar = <div style={{ marginTop: 20 }}>
    {/* Chat messages expand above when open */}
    {chatOpen && <div style={{ background: c.s2, borderRadius: "14px 14px 0 0", border: "1px solid " + c.b, borderBottom: "none", overflow: "hidden" }}>
      {chatMessages.length > 0 && <div style={{ maxHeight: 180, overflowY: "auto", padding: "10px 14px" }}>
        {chatMessages.slice(-4).map((m, i) => m.role === "user"
          ? <div key={i} style={{ textAlign: "right", marginBottom: 6 }}><span style={{ display: "inline-block", padding: "7px 11px", borderRadius: "10px 4px 10px 10px", background: c.a + "18", color: c.tx, fontSize: 12, maxWidth: "75%" }}>{m.content}</span></div>
          : <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 6 }}>
              <img src="/images/tinysenpai2.png" alt="" style={{ width: 18, height: 18, imageRendering: "pixelated", flexShrink: 0, marginTop: 2 }} />
              <span style={{ display: "inline-block", padding: "7px 11px", borderRadius: "4px 10px 10px 10px", background: c.s, color: c.tx, fontSize: 12, lineHeight: 1.4, maxWidth: "80%" }}>{m.content}</span>
            </div>
        )}
        {chatLoading && <div style={{ fontSize: 11, color: c.m, fontStyle: "italic", padding: "4px 14px" }}>Thinking...</div>}
      </div>}
      <div style={{ display: "flex", gap: 8, padding: "10px 14px", borderTop: chatMessages.length > 0 ? "1px solid " + c.b : "none" }}>
        <input ref={chatInputRef} value={chatInput} onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") sendChat(); if (e.key === "Escape") { setChatOpen(false); setChatInput(""); } }}
          placeholder="Ask Senpai anything..."
          style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid " + c.b, background: c.s, color: c.tx, fontSize: 13, outline: "none" }} />
        {chatInput.trim() && <button onClick={sendChat} disabled={chatLoading} style={{ ...btn, padding: "8px 14px", borderRadius: 8, background: c.a, color: "#fff", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>→</button>}
        <button onClick={() => { setChatOpen(false); setChatInput(""); }} style={{ ...btn, padding: "6px 10px", borderRadius: 8, background: "transparent", border: "1px solid " + c.b, color: c.m, fontSize: 12, flexShrink: 0 }}>✕</button>
      </div>
    </div>}
    {/* Mascot circle — always centered, speech bubble floats above */}
    {!chatOpen && <div style={{ display: "flex", justifyContent: "center" }}>
      <div style={{ position: "relative" }}>
        {/* Speech bubble — appears to the right */}
        {(typingText || senpaiMsg) && <div style={{ position: "absolute", left: "100%", top: "50%", transform: "translateY(-50%)", marginLeft: 12, padding: "8px 14px", borderRadius: "4px 12px 12px 12px", background: c.s2, border: "1px solid " + c.b, fontSize: 13, color: c.tx, fontWeight: 500, whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(0,0,0,.2)" }}>
          {typingText || senpaiMsg}
        </div>}
        {/* Mascot circle */}
        <div onClick={() => { setChatOpen(true); setTimeout(() => chatInputRef.current?.focus(), 150); }}
          onMouseEnter={() => { setSenpaiHover(true); typeOut(hoverQuips[Math.floor(Math.random() * hoverQuips.length)], 2000); }}
          onMouseLeave={() => { setSenpaiHover(false); if (typingRef.current) clearInterval(typingRef.current); setSenpaiMsg(null); setTypingText(""); }}
          style={{ width: 52, height: 52, borderRadius: 26, background: c.s2, border: "2px solid " + (senpaiHover ? c.a : c.b), display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "border-color .2s" }}>
          <img src={senpaiHover ? "/images/tinysenpaistrike/1.png" : "/images/tinysenpai2.png"} alt="Senpai"
            style={{ width: 40, height: 40, imageRendering: "pixelated" }} />
        </div>
      </div>
    </div>}
  </div>;

  // ═══ HEADER (shared across all exercise types) ═══
  const header = <>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
      <button onClick={() => { stopAudio(); setDone(true); }} style={{ ...btn, background: "none", color: c.m, fontFamily: mono, fontSize: 14, padding: "4px 0" }}>← exit</button>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {coachingPlan?.sessionNotes && <div style={{ fontSize: 10, color: c.a, maxWidth: 150, textAlign: "right", lineHeight: 1.3, opacity: .7 }}>{coachingPlan.sessionNotes}</div>}
        <div style={{ fontSize: 11, fontFamily: mono, color: c.m }}>{ci + 1}/{cards.length}</div>
        <div style={{ fontSize: 11, fontFamily: mono, color: c.m }}>⏱ {mins}m</div>
      </div>
    </div>
    <div style={{ height: 4, background: c.b, borderRadius: 4, marginBottom: 20, overflow: "hidden" }}>
      <div style={{ height: "100%", width: progress + "%", background: c.a, borderRadius: 4, transition: "width .3s" }} />
    </div>
  </>;

  const withSenpai = (content) => <div style={inner}>{header}{content}{senpaiBar}</div>;

  // ═══ EXERCISE: KANA VISUAL ═══
  if (ex.type === "kana-visual") {
    const submit = () => {
      if (fb || !input.trim()) return;
      const ok = input.trim().toLowerCase() === ex.romaji;
      setFb(ok ? "ok" : "no");
      setScore(s => ok ? { ...s, c: s.c + 1 } : { ...s, w: s.w + 1 });
      updateKanaSRS(ex.item, ok);
      setTimeout(() => speak(ex.item), 250);
      setTimeout(() => advance(ok), ok ? 1800 : 4000); // Longer for wrong — study the image
    };
    const isHira = ex.item.charCodeAt(0) >= 0x3040 && ex.item.charCodeAt(0) <= 0x309F;
    const imgPath = `/images/mnemonics/approved/${isHira ? "hiragana" : "katakana"}/${ex.item.codePointAt(0).toString(16)}.png`;
    const m = M[ex.item];
    return withSenpai(<>
      <div style={{ ...card, textAlign: "center", padding: "36px 20px", marginBottom: 16, background: fb === "ok" ? c.gs : fb === "no" ? c.rs : c.s, transition: "background .3s" }}>
        {!fb && <div style={{ fontSize: 11, fontFamily: mono, color: c.m, textTransform: "uppercase", marginBottom: 12 }}>What is this character?</div>}
        {fb ? <div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "center" }}>
            <div>
              <div style={{ fontSize: 100, lineHeight: 1, marginBottom: 8 }}>{ex.item}</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: fb === "ok" ? c.g : c.a, fontFamily: mono }}>{ex.romaji}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: fb === "ok" ? c.g : c.a, marginTop: 6 }}>{fb === "ok" ? "✓ Correct!" : "✗ Wrong"}</div>
            </div>
            <img src={imgPath} alt="" onError={e => { e.target.style.display = "none"; }} style={{ width: "45%", maxWidth: 200, borderRadius: 12 }} />
          </div>
          {fb === "no" && m && <div style={{ fontSize: 12, color: c.m, marginTop: 12, fontStyle: "italic" }}>{m[0]} {m[1]}: {m[2]}</div>}
        </div>
        : <div style={{ fontSize: 130, lineHeight: 1, marginBottom: 16 }}>{ex.item}</div>}
      </div>
      {!fb && <div style={{ display: "flex", gap: 8 }}>
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") submit(); }}
          placeholder="romaji..." autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false"
          style={{ flex: 1, padding: "14px 16px", borderRadius: 10, border: "1px solid " + c.b, background: c.s2, color: c.tx, fontFamily: mono, fontSize: 20, outline: "none", textAlign: "center" }} />
        <button onClick={submit} style={{ ...btn, padding: "14px 22px", borderRadius: 10, background: input.trim() ? c.a : c.b, color: input.trim() ? "#fff" : c.m, fontSize: 14, fontWeight: 600 }}>Go</button>
      </div>}
    </>);
  }

  // ═══ EXERCISE: KANA LISTEN ═══
  if (ex.type === "kana-listen") {
    // Auto-play audio for listen mode (only on mount/card change via useEffect above)
    const submit = () => {
      if (fb || !input.trim()) return;
      const ok = input.trim().toLowerCase() === ex.romaji;
      setFb(ok ? "ok" : "no");
      setScore(s => ok ? { ...s, c: s.c + 1 } : { ...s, w: s.w + 1 });
      updateKanaSRS(ex.item, ok);
      setTimeout(() => advance(ok), ok ? 1500 : 2500);
    };
    return withSenpai(<>
      <div style={{ ...card, textAlign: "center", padding: "40px 24px", marginBottom: 16, background: fb === "ok" ? c.gs : fb === "no" ? c.rs : c.s, transition: "background .3s" }}>
        <div style={{ fontSize: 11, fontFamily: mono, color: c.m, textTransform: "uppercase", marginBottom: 12 }}>What did you hear?</div>
        <div style={{ fontSize: 60, marginBottom: 16 }}>👂</div>
        <button onClick={() => speak(ex.item)} style={{ ...btn, padding: "8px 20px", borderRadius: 8, background: c.s2, border: "1px solid " + c.b, fontSize: 14, color: c.m }}>🔊 play again</button>
        {fb && <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
            <div>
              <div style={{ fontSize: 60, lineHeight: 1 }}>{ex.item}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: fb === "ok" ? c.g : c.a, fontFamily: mono, marginTop: 4 }}>{ex.romaji}</div>
              <div style={{ fontSize: 12, color: c.m, marginTop: 2 }}>{fb === "ok" ? "✓ Correct!" : "✗ Wrong"}</div>
            </div>
            {(()=>{const isH=ex.item.charCodeAt(0)>=0x3040&&ex.item.charCodeAt(0)<=0x309F;return <img src={`/images/mnemonics/approved/${isH?"hiragana":"katakana"}/${ex.item.codePointAt(0).toString(16)}.png`} alt="" onError={e=>{e.target.style.display="none";}} style={{width:"35%",maxWidth:130,borderRadius:10}}/>;})()}
          </div>
        </div>}
      </div>
      {!fb && <div style={{ display: "flex", gap: 8 }}>
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") submit(); }}
          placeholder="romaji..." autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false"
          style={{ flex: 1, padding: "14px 16px", borderRadius: 10, border: "1px solid " + c.b, background: c.s2, color: c.tx, fontFamily: mono, fontSize: 20, outline: "none", textAlign: "center" }} />
        <button onClick={submit} style={{ ...btn, padding: "14px 22px", borderRadius: 10, background: input.trim() ? c.a : c.b, color: input.trim() ? "#fff" : c.m, fontSize: 14, fontWeight: 600 }}>Go</button>
      </div>}
    </>);
  }

  // ═══ EXERCISE: PHRASE SCENARIO ═══
  if (ex.type === "phrase-scenario") {
    const p = ex.item;
    const catCol = CAT_COLORS[p[4]];
    if (!choiceAnswer) {
      const isTrick = Math.random() < 0.25;
      const choices = isTrick ? shuffle(getDistractors(p, 4)) : shuffle([p, ...getDistractors(p)]);
      setTimeout(() => setChoiceAnswer({ choices, selected: null, correct: null, isTrick }), 0);
      return null;
    }
    const answered = choiceAnswer.correct !== null && choiceAnswer.correct !== undefined;
    return withSenpai(<>
      <div style={{ ...card, padding: "20px", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 16 }}>{CAT_ICONS[p[4]]}</span>
          <span style={{ fontSize: 12, color: catCol, fontWeight: 600 }}>{CATS[p[4]]}</span>
        </div>
        <div style={{ fontSize: 13, color: c.m, marginBottom: 10 }}>{situations[p[4]]}</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: c.tx }}>{p[3]}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {choiceAnswer.choices.map((choice, i) => {
          const isCorrect = !choiceAnswer.isTrick && choice[0] === p[0];
          const isSelected = choiceAnswer.selected === choice[0];
          let bg = "transparent", border = c.b, col = c.tx;
          if (answered && isCorrect) { bg = c.gs; border = c.g + "60"; col = c.g; }
          if (answered && isSelected && !isCorrect) { bg = c.rs; border = c.a + "60"; col = c.a; }
          return <button key={i} onClick={() => {
            if (answered) return;
            const correct = isCorrect;
            setChoiceAnswer({ ...choiceAnswer, selected: choice[0], correct });
            setScore(s => correct ? { ...s, c: s.c + 1 } : { ...s, w: s.w + 1 });
            reviewPhr(p[0], correct);
            if (correct) speakPhraseWithEnglish(p[0], p[1], p[3]);
            setTimeout(() => advance(correct), correct ? 2500 : 1800);
          }} style={{ ...btn, padding: "14px 16px", borderRadius: 10, border: "1px solid " + border, background: bg, color: col, fontSize: isDesktop ? 20 : 17, fontWeight: 500, textAlign: "left", transition: "all .2s" }}>
            {choice[1]}
            <div style={{ fontSize: 11, fontFamily: mono, color: c.m, marginTop: 2, opacity: .6 }}>{choice[2]}</div>
          </button>;
        })}
        <button onClick={() => {
          if (answered) return;
          const correct = !!choiceAnswer.isTrick;
          setChoiceAnswer({ ...choiceAnswer, selected: "none", correct });
          setScore(s => correct ? { ...s, c: s.c + 1 } : { ...s, w: s.w + 1 });
          reviewPhr(p[0], correct);
          speakPhraseWithEnglish(p[0], p[1], p[3]);
          setTimeout(() => advance(correct), 2500);
        }} style={{ ...btn, padding: "12px 16px", borderRadius: 10, border: "1px solid " + c.b + "44", background: answered && choiceAnswer.isTrick ? c.gs : answered && choiceAnswer.selected === "none" ? c.rs : "transparent", color: c.m, fontSize: 14, textAlign: "center" }}>
          None of these
        </button>
        {answered && <div style={{ ...card, padding: "12px 16px", borderLeft: "3px solid " + c.g, marginTop: 4 }}>
          <div style={{ fontSize: 13, color: c.m, marginBottom: 4 }}>Correct answer:</div>
          <div style={{ fontSize: isDesktop ? 22 : 18, fontWeight: 700 }}>{p[1]}</div>
          <div style={{ fontSize: 12, fontFamily: mono, color: c.a, marginTop: 2 }}>{p[2]}</div>
        </div>}
      </div>
    </>);
  }

  // ═══ EXERCISE: PHRASE LISTEN ═══
  if (ex.type === "phrase-listen") {
    const p = ex.item;
    if (!choiceAnswer) {
      const isTrick = Math.random() < 0.2;
      const choices = isTrick ? shuffle(getDistractors(p, 4)) : shuffle([p, ...getDistractors(p)]);
      speakPhrase(p[0], p[1]);
      setTimeout(() => setChoiceAnswer({ choices, selected: null, correct: null, isTrick }), 0);
      return null;
    }
    const answered = choiceAnswer.correct !== null && choiceAnswer.correct !== undefined;
    return withSenpai(<>
      <div style={{ ...card, textAlign: "center", padding: "32px 20px", marginBottom: 14 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>👂</div>
        <div style={{ fontSize: 14, color: c.m, marginBottom: 14 }}>What did you hear?</div>
        <button onClick={() => speakPhrase(p[0], p[1])} style={{ ...btn, padding: "8px 20px", borderRadius: 8, background: c.s2, border: "1px solid " + c.b, fontSize: 14, color: c.m }}>🔊 play again</button>
        {answered && <><div style={{ marginTop: 14, fontSize: isDesktop ? 28 : 22, fontWeight: 700 }}>{p[1]}</div><div style={{ fontSize: 13, fontFamily: mono, color: c.a, marginTop: 4 }}>{p[2]}</div></>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {choiceAnswer.choices.map((choice, i) => {
          const isCorrect = !choiceAnswer.isTrick && choice[0] === p[0];
          const isSelected = choiceAnswer.selected === choice[0];
          let bg = "transparent", border = c.b, col = c.tx;
          if (answered && isCorrect) { bg = c.gs; border = c.g + "60"; col = c.g; }
          if (answered && isSelected && !isCorrect) { bg = c.rs; border = c.a + "60"; col = c.a; }
          return <button key={i} onClick={() => {
            if (answered) return;
            const correct = isCorrect;
            setChoiceAnswer({ ...choiceAnswer, selected: choice[0], correct });
            setScore(s => correct ? { ...s, c: s.c + 1 } : { ...s, w: s.w + 1 });
            reviewPhr(p[0], correct);
            setTimeout(() => advance(correct), correct ? 1800 : 1500);
          }} style={{ ...btn, padding: "14px 16px", borderRadius: 10, border: "1px solid " + border, background: bg, color: col, fontSize: 15, textAlign: "left", transition: "all .2s" }}>
            {choice[3]}
          </button>;
        })}
        <button onClick={() => {
          if (answered) return;
          const correct = !!choiceAnswer.isTrick;
          setChoiceAnswer({ ...choiceAnswer, selected: "none", correct });
          setScore(s => correct ? { ...s, c: s.c + 1 } : { ...s, w: s.w + 1 });
          reviewPhr(p[0], correct);
          setTimeout(() => advance(correct), 2000);
        }} style={{ ...btn, padding: "12px 16px", borderRadius: 10, border: "1px solid " + c.b + "44", background: "transparent", color: c.m, fontSize: 14, textAlign: "center" }}>None of these</button>
      </div>
    </>);
  }

  // ═══ EXERCISE: PHRASE PRODUCTION ═══
  if (ex.type === "phrase-production") {
    const p = ex.item;
    const catCol = CAT_COLORS[p[4]];
    const submit = () => {
      if (fb || !input.trim()) return;
      const ok = matchRomaji(input.trim(), p[2]);
      setFb(ok ? "ok" : "no");
      setScore(s => ok ? { ...s, c: s.c + 1 } : { ...s, w: s.w + 1 });
      reviewPhr(p[0], ok);
      setTimeout(() => speakPhrase(p[0], p[1]), 300);
      setTimeout(() => advance(ok), ok ? 2500 : 3000);
    };
    return withSenpai(<>
      <div style={{ ...card, padding: "24px 20px", marginBottom: 16, background: fb === "ok" ? c.gs : fb === "no" ? c.rs : c.s, transition: "background .3s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 14 }}>{CAT_ICONS[p[4]]}</span>
          <span style={{ fontSize: 11, color: catCol, fontWeight: 600 }}>Type in romaji</span>
        </div>
        <div style={{ fontSize: 20, fontWeight: 600, color: c.tx, lineHeight: 1.5, marginBottom: 8 }}>{p[3]}</div>
        {p[5] && <div style={{ fontSize: 12, color: c.m, fontStyle: "italic" }}>{p[5]}</div>}
        {fb && <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: isDesktop ? 28 : 22, fontWeight: 700 }}>{p[1]}</div>
          <div style={{ fontSize: 14, fontFamily: mono, color: c.a, marginTop: 4 }}>{p[2]}</div>
          {fb === "no" && <div style={{ fontSize: 12, color: c.m, marginTop: 6 }}>You typed: <span style={{ color: c.a, textDecoration: "line-through" }}>{input}</span></div>}
        </div>}
      </div>
      {!fb && <div style={{ display: "flex", gap: 8 }}>
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") submit(); }}
          placeholder="type the romaji..." autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false"
          style={{ flex: 1, padding: "14px 16px", borderRadius: 10, border: "1px solid " + c.b, background: c.s2, color: c.tx, fontFamily: mono, fontSize: 18, outline: "none" }} />
        <button onClick={submit} style={{ ...btn, padding: "14px 22px", borderRadius: 10, background: input.trim() ? c.a : c.b, color: input.trim() ? "#fff" : c.m, fontSize: 14, fontWeight: 600 }}>Go</button>
      </div>}
    </>);
  }

  // ═══ EXERCISE: LEARN CARD (new kana) ═══
  if (ex.type === "learn-card") {
    const m = ex.mnemonic;
    const isHiragana = ex.item.charCodeAt(0) >= 0x3040 && ex.item.charCodeAt(0) <= 0x309F;
    const imgPath = `/images/mnemonics/approved/${isHiragana ? "hiragana" : "katakana"}/${ex.item.codePointAt(0).toString(16)}.png`;
    return withSenpai(<>
      <div style={{ ...card, padding: "20px", marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontFamily: mono, color: c.g, textTransform: "uppercase", marginBottom: 12 }}>New character!</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: "1 1 40%", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: isDesktop ? 100 : 80, lineHeight: 1 }}>{ex.item}</div>
            <div style={{ fontSize: isDesktop ? 28 : 22, fontWeight: 700, color: c.a, fontFamily: mono }}>{ex.romaji}</div>
            <button onClick={() => speak(ex.item)} style={{ ...btn, padding: "5px 10px", borderRadius: 8, background: c.s2, border: "1px solid " + c.b, fontSize: 15, color: c.m }}>🔊</button>
          </div>
          <img src={imgPath} alt={m ? m[1] : ex.romaji} onError={e => { e.target.style.display = "none"; }}
            style={{ flex: "1 1 60%", maxWidth: "55%", borderRadius: 12, display: "block" }} />
        </div>
        {m && <div style={{ marginTop: 14, padding: "12px 16px", background: c.s2, borderRadius: 8, border: "1px solid " + c.b }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 20 }}>{m[0]}</span>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{m[1]}</span>
          </div>
          <div style={{ fontSize: 13, color: c.m, lineHeight: 1.5 }}>{m[3] || m[2]}</div>
        </div>}
      </div>
      <button onClick={() => { updateKanaSRS(ex.item, true); advance(true); setScore(s => ({ ...s, c: s.c + 1 })); }}
        style={{ ...btn, width: "100%", padding: 14, borderRadius: 10, background: c.a, color: "#fff", fontSize: 15, fontWeight: 600 }}>Got it — Next →</button>
    </>);
  }

  // ═══ EXERCISE: LEARN PHRASE (new phrase) ═══
  if (ex.type === "learn-phrase") {
    const p = ex.item;
    const catCol = CAT_COLORS[p[4]];
    return withSenpai(<>
      <div style={{ ...card, padding: 0, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ padding: "14px 20px", background: catCol + "12", borderBottom: "1px solid " + catCol + "22" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>{CAT_ICONS[p[4]]}</span>
            <span style={{ fontSize: 12, color: catCol, fontWeight: 600 }}>{CATS[p[4]]}</span>
          </div>
          <div style={{ fontSize: 11, fontFamily: mono, color: c.g, marginTop: 6 }}>New phrase!</div>
        </div>
        <div style={{ padding: "24px 20px" }}>
          <div style={{ fontSize: isDesktop ? 30 : 24, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>{p[1]}</div>
          <div style={{ fontSize: 14, fontFamily: mono, color: c.a, marginBottom: 6 }}>{p[2]}</div>
          <div style={{ fontSize: 16, color: c.tx, marginBottom: 4 }}>{p[3]}</div>
          {p[5] && <div style={{ fontSize: 12, color: c.m, fontStyle: "italic", marginTop: 8, padding: "8px 14px", background: c.s2, borderRadius: 8, borderLeft: "3px solid " + catCol }}>{p[5]}</div>}
          <button onClick={e => { e.stopPropagation(); speakPhraseWithEnglish(p[0], p[1], p[3]); }}
            style={{ ...btn, width: "100%", padding: "10px 16px", borderRadius: 8, background: c.s2, border: "1px solid " + c.b, fontSize: 14, color: c.m, marginTop: 14 }}>🔊 hear it</button>
        </div>
      </div>
      <button onClick={() => { reviewPhr(p[0], true); advance(true); setScore(s => ({ ...s, c: s.c + 1 })); }}
        style={{ ...btn, width: "100%", padding: 14, borderRadius: 10, background: c.a, color: "#fff", fontSize: 15, fontWeight: 600 }}>Got it — Next →</button>
    </>);
  }

  // Fallback
  return withSenpai(<div style={{ textAlign: "center", color: c.m, padding: 40 }}>Unknown exercise type</div>);
}
