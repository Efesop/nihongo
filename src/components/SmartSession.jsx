import { useState, useRef, useEffect } from "react";
import { M, ROMAJI } from "../data/kana.js";
import { PHRASES, CATS, CAT_ICONS, CAT_COLORS } from "../data/phrases.js";
import { font, mono } from "../data/constants.js";
import { speak, speakPhrase, speakPhraseWithEnglish } from "../utils/audio.js";
import { shuffle } from "../utils/helpers.js";
import { buildSmartSession, getSessionSummary, matchRomaji, getDistractors } from "../utils/sessionEngine.js";
import PhraseSegments from "./PhraseSegments.jsx";
import { CONVERSATIONS } from "../data/conversations.js";

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
  const [convoAnswers, setConvoAnswers] = useState({});
  const [convoSubmitted, setConvoSubmitted] = useState(false);
  const [selectedBlank, setSelectedBlank] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [storyData, setStoryData] = useState(null);
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyAnswer, setStoryAnswer] = useState(null);
  const [branchData, setBranchData] = useState(null);
  const [branchLoading, setBranchLoading] = useState(false);
  const [branchHistory, setBranchHistory] = useState([]);
  const [branchTurn, setBranchTurn] = useState(1);
  const [branchScore, setBranchScore] = useState(0);
  const inputRef = useRef(null);
  const chatInputRef = useRef(null);
  const typingRef = useRef(null);
  const convoShuffledRef = useRef({ blankIdx: -1, options: [] });

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

  // Post-session AI review + error pattern analysis every 10 sessions
  useEffect(() => {
    if (done && score.c + score.w > 0 && !sessionFeedback) {
      // Track session count
      const sessionCount = (data.settings?.sessionCount || 0) + 1;
      save({ settings: { ...data.settings, sessionCount } });

      // Regular post-session review
      fetch('/api/coach', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'review', userId: data.onboarding?.name || 'user',
          sessionResults: { score, struggled: struggled.map(s => s.label), timeElapsed: Math.round((Date.now() - startTime) / 1000), totalCards: cards.length },
          userData: data,
        }),
      }).then(r => r.json()).then(review => {
        if (review.userCoaching) save({ settings: { ...data.settings, coaching: review.userCoaching, nextFocus: review.nextFocus, sessionCount } });
      }).catch(() => {});

      // Error pattern analysis every 10 sessions
      if (sessionCount % 10 === 0) {
        const allMistakes = struggled.map(s => s.label);
        const helpItems = data.settings?.helpRequested || [];
        const lowBoxKana = Object.entries(data.kana || {}).filter(([_, v]) => v.box <= 1 && v.stability).map(([ch]) => ch);
        const lowBoxPhr = Object.entries(data.phr || {}).filter(([_, v]) => v.box <= 1 && v.stability).map(([id]) => id);

        fetch('/api/coach', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'review',
            sessionResults: {
              errorPatternAnalysis: true,
              recentMistakes: allMistakes,
              helpRequested: helpItems,
              persistentlyWeak: { kana: lowBoxKana.slice(0, 15), phrases: lowBoxPhr.slice(0, 10) },
              totalSessions: sessionCount,
            },
            userData: data,
          }),
        }).then(r => r.json()).then(analysis => {
          if (analysis.platformInsight) {
            save({ settings: { ...data.settings, errorAnalysis: analysis.userCoaching, sessionCount } });
          }
        }).catch(() => {});
      }
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
      const contextInfo = currentEx ? `User is currently practicing: ${currentEx.type}. Item: ${typeof currentEx.item === 'string' ? currentEx.item + ' (' + ROMAJI[currentEx.item] + ')' : currentEx.item[1] + ' - ' + currentEx.item[3]}. They asked for help so mark this as something they struggle with.` : 'Between exercises';
      // Track that user needed help on this item
      if (currentEx) {
        const helpItem = typeof currentEx.item === 'string' ? currentEx.item : currentEx.item?.[0];
        if (helpItem) save({ settings: { ...data.settings, helpRequested: [...(data.settings?.helpRequested || []), helpItem].slice(-20) } });
      }
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

  // Loading state — animated running mascot
  const loadingMessages = ["Preparing your training...", "Sharpening the blade...", "Setting up the dojo...", "Evaluating your weakness..."];
  const [loadingMsg] = useState(() => loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
  const [loadingFrame, setLoadingFrame] = useState(0);
  useEffect(() => {
    if (loading) {
      const t = setInterval(() => setLoadingFrame(f => (f + 1) % 4), 150);
      return () => clearInterval(t);
    }
  }, [loading]);

  if (loading) return <div style={inner}>
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <img src={`/images/tinysenpairun/ts${(loadingFrame % 4) + 1}.png`} alt="Senpai"
        style={{ width: 80, height: 80, imageRendering: "pixelated", marginBottom: 16 }} />
      <div style={{ fontSize: 15, color: c.m }}>{loadingMsg}</div>
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
    {/* Chat panel — opens below mascot */}
    {chatOpen && <div style={{ background: c.s2, borderRadius: 14, border: "1px solid " + c.b, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid " + c.b }}>
        <img src="/images/tinysenpai2.png" alt="Senpai" style={{ width: 32, height: 32, imageRendering: "pixelated" }} />
        <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>Senpai</div>
        <button onClick={() => { setChatOpen(false); setChatInput(""); }} style={{ ...btn, padding: "4px 8px", borderRadius: 6, background: "transparent", color: c.m, fontSize: 14 }}>✕</button>
      </div>
      {chatMessages.length > 0 && <div style={{ maxHeight: 200, overflowY: "auto", padding: "12px 14px" }}>
        {chatMessages.slice(-4).map((m, i) => m.role === "user"
          ? <div key={i} style={{ textAlign: "right", marginBottom: 8 }}><span style={{ display: "inline-block", padding: "8px 12px", borderRadius: "10px 4px 10px 10px", background: c.a + "18", color: c.tx, fontSize: 13, maxWidth: "75%" }}>{m.content}</span></div>
          : <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
              <img src="/images/tinysenpai2.png" alt="" style={{ width: 28, height: 28, imageRendering: "pixelated", flexShrink: 0, marginTop: 2 }} />
              <span style={{ display: "inline-block", padding: "8px 12px", borderRadius: "4px 10px 10px 10px", background: c.s, color: c.tx, fontSize: 13, lineHeight: 1.5, maxWidth: "80%" }}>{m.content}</span>
            </div>
        )}
        {chatLoading && <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "4px 0" }}>
          <img src="/images/tinysenpai2.png" alt="" style={{ width: 24, height: 24, imageRendering: "pixelated" }} />
          <span style={{ fontSize: 12, color: c.m, fontStyle: "italic" }}>Thinking...</span>
        </div>}
      </div>}
      <div style={{ display: "flex", gap: 8, padding: "10px 14px", borderTop: chatMessages.length > 0 ? "1px solid " + c.b : "none" }}>
        <input ref={chatInputRef} value={chatInput} onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") sendChat(); if (e.key === "Escape") { setChatOpen(false); setChatInput(""); } }}
          placeholder="Ask Senpai anything..."
          style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid " + c.b, background: c.s, color: c.tx, fontSize: 13, outline: "none" }} />
        <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} style={{ ...btn, padding: "8px 14px", borderRadius: 8, background: chatInput.trim() ? c.a : c.b, color: chatInput.trim() ? "#fff" : c.m, fontSize: 12, fontWeight: 600, flexShrink: 0 }}>→</button>
      </div>
    </div>}
    {/* Mascot circle — only when chat is closed */}
    {!chatOpen && <div style={{ display: "flex", justifyContent: "center" }}>
      <div style={{ position: "relative" }}>
        {(typingText || senpaiMsg) && <div style={{ position: "absolute", left: "100%", top: "50%", transform: "translateY(-50%)", marginLeft: 12, padding: "8px 14px", borderRadius: "4px 12px 12px 12px", background: c.s2, border: "1px solid " + c.b, fontSize: 13, color: c.tx, fontWeight: 500, whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(0,0,0,.2)" }}>
          {typingText || senpaiMsg}
        </div>}
        <div onClick={() => { setChatOpen(true); setTimeout(() => chatInputRef.current?.focus(), 150); }}
          onMouseEnter={() => { setSenpaiHover(true); typeOut(hoverQuips[Math.floor(Math.random() * hoverQuips.length)]); }}
          onMouseLeave={() => { setSenpaiHover(false); if (typingRef.current) { clearInterval(typingRef.current); setSenpaiMsg(null); setTypingText(""); } }}
          style={{ width: 56, height: 56, borderRadius: 28, background: c.s2, border: "2px solid " + (senpaiHover ? c.a : c.b), display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "border-color .2s" }}>
          <img src={senpaiHover ? "/images/tinysenpaistrike/1.png" : "/images/tinysenpai2.png"} alt="Senpai"
            style={{ width: 44, height: 44, imageRendering: "pixelated" }} />
        </div>
      </div>
    </div>}
  </div>;

  // ═══ HEADER (shared across all exercise types) ═══
  const header = <>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
      <button onClick={() => { stopAudio(); setDone(true); }} style={{ ...btn, background: "none", color: c.m, fontFamily: mono, fontSize: 14, padding: "4px 0" }}>← exit</button>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
            setTimeout(() => advance(correct), correct ? 4000 : 2200);
          }} style={{ ...btn, padding: "14px 16px", borderRadius: 10, border: "1px solid " + border, background: bg, color: col, fontSize: isDesktop ? 20 : 17, fontWeight: 500, textAlign: "left", transition: "all .2s" }}>
            {choice[1]}
            <div style={{ fontSize: 12, fontFamily: mono, color: c.a, marginTop: 3, opacity: .8 }}>{choice[2]}</div>
          </button>;
        })}
        <button onClick={() => {
          if (answered) return;
          const correct = !!choiceAnswer.isTrick;
          setChoiceAnswer({ ...choiceAnswer, selected: "none", correct });
          setScore(s => correct ? { ...s, c: s.c + 1 } : { ...s, w: s.w + 1 });
          reviewPhr(p[0], correct);
          speakPhraseWithEnglish(p[0], p[1], p[3]);
          setTimeout(() => advance(correct), 3500);
        }} style={{ ...btn, padding: "12px 16px", borderRadius: 10, border: "1px solid " + c.b + "44", background: answered && choiceAnswer.isTrick ? c.gs : answered && choiceAnswer.selected === "none" ? c.rs : "transparent", color: c.m, fontSize: 14, textAlign: "center" }}>
          None of these
        </button>
        {answered && <div style={{ ...card, padding: "16px 20px", borderLeft: "3px solid " + c.g, marginTop: 8, overflow: "visible" }}>
          <div style={{ fontSize: 11, fontFamily: mono, color: c.g, marginBottom: 8 }}>✓ Correct answer</div>
          <PhraseSegments phraseId={p[0]} c={c} fontSize={isDesktop ? 24 : 20} />
          <div style={{ fontSize: 13, fontFamily: mono, color: c.a, marginTop: 8 }}>{p[2]}</div>
          <div style={{ fontSize: 14, color: c.m, marginTop: 4 }}>{p[3]}</div>
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
      <div style={{ ...card, padding: "24px 20px", marginBottom: 14 }}>
        <div style={{ textAlign: "center", marginBottom: answered ? 16 : 0 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>👂</div>
          <div style={{ fontSize: 14, color: c.m, marginBottom: 12 }}>What did you hear?</div>
          <button onClick={() => speakPhrase(p[0], p[1])} style={{ ...btn, padding: "8px 20px", borderRadius: 8, background: c.s2, border: "1px solid " + c.b, fontSize: 14, color: c.m }}>🔊 play again</button>
        </div>
        {answered && <div style={{ borderTop: "1px solid " + c.b, paddingTop: 16 }}>
          <PhraseSegments phraseId={p[0]} c={c} fontSize={isDesktop ? 24 : 20} />
          <div style={{ fontSize: 13, fontFamily: mono, color: c.a, marginTop: 8 }}>{p[2]}</div>
          <div style={{ fontSize: 15, color: c.tx, marginTop: 4 }}>{p[3]}</div>
        </div>}
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
            setTimeout(() => advance(correct), correct ? 4000 : 2000);
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
          setTimeout(() => advance(correct), 3000);
        }} style={{ ...btn, padding: "12px 16px", borderRadius: 10, border: "1px solid " + c.b + "44", background: "transparent", color: c.m, fontSize: 14, textAlign: "center" }}>None of these</button>
      </div>
    </>);
  }

  // ═══ EXERCISE: PHRASE PRODUCTION (8-choice multiple choice) ═══
  if (ex.type === "phrase-production") {
    const p = ex.item;
    const catCol = CAT_COLORS[p[4]];
    if (!choiceAnswer) {
      const isTrick = Math.random() < 0.15;
      const distractors = getDistractors(p, 7);
      const choices = isTrick ? shuffle(distractors).slice(0, 8) : shuffle([p, ...distractors.slice(0, 7)]);
      setTimeout(() => setChoiceAnswer({ choices, selected: null, correct: null, isTrick }), 0);
      return null;
    }
    const answered = choiceAnswer.correct !== null && choiceAnswer.correct !== undefined;
    return withSenpai(<>
      <div style={{ ...card, padding: "20px", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 14 }}>{CAT_ICONS[p[4]]}</span>
          <span style={{ fontSize: 11, color: catCol, fontWeight: 600 }}>Which phrase means...</span>
        </div>
        <div style={{ fontSize: 20, fontWeight: 600, color: c.tx, lineHeight: 1.5 }}>{p[3]}</div>
        {p[5] && <div style={{ fontSize: 12, color: c.m, fontStyle: "italic", marginTop: 6 }}>{p[5]}</div>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
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
            setTimeout(() => advance(correct), correct ? 4000 : 2200);
          }} style={{ ...btn, padding: "12px 10px", borderRadius: 10, border: "1px solid " + border, background: bg, color: col, fontSize: isDesktop ? 16 : 14, fontWeight: 500, textAlign: "left", transition: "all .2s", lineHeight: 1.3 }}>
            {choice[1]}
            <div style={{ fontSize: 11, fontFamily: mono, color: c.m, marginTop: 3 }}>{choice[2]}</div>
          </button>;
        })}
      </div>
      {!answered && <button onClick={() => {
        const correct = !!choiceAnswer.isTrick;
        setChoiceAnswer({ ...choiceAnswer, selected: "none", correct });
        setScore(s => correct ? { ...s, c: s.c + 1 } : { ...s, w: s.w + 1 });
        reviewPhr(p[0], correct);
        speakPhraseWithEnglish(p[0], p[1], p[3]);
        setTimeout(() => advance(correct), 3500);
      }} style={{ ...btn, width: "100%", padding: "10px 16px", borderRadius: 10, border: "1px solid " + c.b + "44", background: "transparent", color: c.m, fontSize: 13, textAlign: "center", marginTop: 8 }}>None of these</button>}
      {answered && <div style={{ ...card, padding: "16px 20px", borderLeft: "3px solid " + c.g, marginTop: 8, overflow: "visible" }}>
        <div style={{ fontSize: 11, fontFamily: mono, color: c.g, marginBottom: 8 }}>✓ Correct answer</div>
        <PhraseSegments phraseId={p[0]} c={c} fontSize={isDesktop ? 22 : 18} />
        <div style={{ fontSize: 13, fontFamily: mono, color: c.a, marginTop: 6 }}>{p[2]}</div>
        <div style={{ fontSize: 14, color: c.m, marginTop: 2 }}>{p[3]}</div>
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
      {/* Personalise mnemonic button */}
      {data.onboarding?.why && <button onClick={async () => {
        try {
          const res = await fetch('/api/mnemonic', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ character: ex.item, romaji: ex.romaji, currentMnemonic: m ? m[2] : '', interests: [data.onboarding.why, data.onboarding.focus].filter(Boolean) }),
          });
          const pm = await res.json();
          if (pm.mnemonic) {
            // Show personalised mnemonic inline
            const el = document.getElementById('personal-mnemonic');
            if (el) el.innerHTML = `<div style="margin-top:10px;padding:10px 14px;background:${c.a}15;border:1px solid ${c.a}33;border-radius:8px"><div style="font-size:13px;color:${c.a};font-weight:600">${pm.emoji} ${pm.title}</div><div style="font-size:12px;color:${c.tx};margin-top:4px">${pm.mnemonic}</div></div>`;
          }
        } catch {}
      }} style={{ ...btn, width: "100%", padding: "8px 16px", borderRadius: 8, border: "1px solid " + c.b + "44", background: "transparent", color: c.m, fontSize: 11, marginBottom: 10 }}>✨ Make this mnemonic personal to me</button>}
      <div id="personal-mnemonic"></div>
      <button onClick={() => { updateKanaSRS(ex.item, true); advance(true); setScore(s => ({ ...s, c: s.c + 1 })); }}
        style={{ ...btn, width: "100%", padding: 14, borderRadius: 10, background: c.a, color: "#fff", fontSize: 15, fontWeight: 600 }}>Got it — Next →</button>
    </>);
  }

  // ═══ EXERCISE: LEARN PHRASE (new phrase) ═══
  if (ex.type === "learn-phrase") {
    const p = ex.item;
    const catCol = CAT_COLORS[p[4]];
    // Find familiar building blocks from already-learned phrases
    const knownPhraseTexts = PHRASES.filter(pp => (data.phr || {})[pp[0]]).map(pp => [pp[1], pp[3]]);
    const familiarParts = [];
    const blocks = ["ください", "おねがいします", "です", "ですか", "ません", "はどこ", "があります"];
    const blockMeaning = { "ください": "please (give me)", "おねがいします": "please (request)", "です": "is/am/are", "ですか": "is it? (question)", "ません": "not (negative)", "はどこ": "where is...?", "があります": "there is..." };
    blocks.forEach(b => {
      if (p[1].includes(b) && knownPhraseTexts.some(([jp]) => jp.includes(b) && jp !== p[1])) {
        const source = knownPhraseTexts.find(([jp]) => jp.includes(b) && jp !== p[1]);
        if (source) familiarParts.push({ block: b, from: source[1] });
      }
    });
    // Autoplay on mount
    if (!fb) setTimeout(() => speakPhraseWithEnglish(p[0], p[1], p[3]), 500);
    return withSenpai(<>
      <div style={{ ...card, padding: 0, marginBottom: 14 }}>
        {/* Category image */}
        <img src={`/images/phrases/${p[4]}.png`} alt={CATS[p[4]]}
          style={{ width: "100%", height: isDesktop ? 120 : 80, objectFit: "cover", display: "block", borderRadius: "12px 12px 0 0" }}
          onError={e => { e.target.style.display = "none"; }} />
        <div style={{ padding: "16px 20px", background: catCol + "12", borderBottom: "1px solid " + catCol + "22" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>{CAT_ICONS[p[4]]}</span>
            <span style={{ fontSize: 13, color: catCol, fontWeight: 600 }}>{CATS[p[4]]}</span>
          </div>
          <div style={{ fontSize: 13, fontFamily: mono, color: c.tx, marginTop: 4 }}>New phrase!</div>
        </div>
        <div style={{ padding: "20px 20px" }}>
          <PhraseSegments phraseId={p[0]} c={c} fontSize={isDesktop ? 28 : 22} />
          <div style={{ fontSize: 14, fontFamily: mono, color: c.a, marginTop: 8, marginBottom: 6 }}>{p[2]}</div>
          <div style={{ fontSize: 16, color: c.tx, marginBottom: 4 }}>{p[3]}</div>
          {p[5] && <div style={{ fontSize: 13, color: c.tx, marginTop: 10, padding: "10px 14px", background: c.s2, borderRadius: 8, borderLeft: "3px solid " + catCol }}>{p[5]}</div>}
          {familiarParts.length > 0 && <div style={{ marginTop: 10, padding: "10px 14px", background: c.as, borderRadius: 8, border: "1px solid " + c.a + "20" }}>
            <div style={{ fontSize: 12, color: c.a, fontWeight: 700, marginBottom: 6 }}>Familiar patterns</div>
            {familiarParts.slice(0, 2).map((fp, i) => <div key={i} style={{ fontSize: 13, color: c.tx, marginBottom: 4 }}>
              <span style={{ fontWeight: 700, color: c.a, padding: "1px 5px", borderRadius: 4, background: c.a + "18" }}>{fp.block}</span>
              {blockMeaning[fp.block] && <span style={{ color: c.tx, fontSize: 12, marginLeft: 4 }}>{blockMeaning[fp.block]}</span>}
              <span style={{ color: c.m, fontSize: 12, marginLeft: 4 }}>— from "{fp.from}"</span>
            </div>)}
          </div>}
          <div style={{ fontSize: 11, color: c.m, marginTop: 10 }}>Tap each word to see what it means</div>
          <button onClick={e => { e.stopPropagation(); speakPhraseWithEnglish(p[0], p[1], p[3]); }}
            style={{ ...btn, width: "100%", padding: "10px 16px", borderRadius: 8, background: c.s2, border: "1px solid " + c.b, fontSize: 14, color: c.m, marginTop: 10 }}>🔊 hear again</button>
        </div>
      </div>
      <button onClick={() => { reviewPhr(p[0], true); advance(true); setScore(s => ({ ...s, c: s.c + 1 })); }}
        style={{ ...btn, width: "100%", padding: 14, borderRadius: 10, background: c.a, color: "#fff", fontSize: 15, fontWeight: 600 }}>Got it — Next →</button>
    </>);
  }

  // ═══ EXERCISE: BRANCHING CONVERSATION ═══
  if (ex.type === "branch-convo") {
    const scenarios = ["restaurant", "hotel", "train station", "convenience store", "asking directions"];
    const scenario = ex.scenario || scenarios[Math.floor(Math.random() * scenarios.length)];

    // Fetch next turn
    if (!branchData && !branchLoading) {
      setBranchLoading(true);
      const knownPhraseIds = Object.keys(data.phr || {});
      const knownPhrases = PHRASES.filter(p => knownPhraseIds.includes(p[0])).map(p => ({ jp: p[1], en: p[3] }));
      const lastChoice = branchHistory.length > 0 ? branchHistory[branchHistory.length - 1] : null;
      fetch('/api/conversation', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ knownPhrases, scenario, previousChoice: lastChoice, turnNumber: branchTurn }),
      }).then(r => r.json()).then(turn => {
        if (!turn.error) setBranchData(turn);
        else { advance(true); }
        setBranchLoading(false);
      }).catch(() => { advance(true); setBranchLoading(false); });
    }

    if (branchLoading) return withSenpai(<>
      <div style={{ ...card, textAlign: "center", padding: "40px 20px" }}>
        <img src={`/images/tinysenpairun/ts${(loadingFrame % 4) + 1}.png`} alt="" style={{ width: 60, height: 60, imageRendering: "pixelated", marginBottom: 12 }} />
        <div style={{ fontSize: 13, color: c.m }}>Setting the scene...</div>
      </div>
    </>);

    if (!branchData) return null;

    // Conversation ended
    if (branchData.isEnd) {
      return withSenpai(<>
        <div style={{ ...card, padding: "24px 20px", marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontFamily: mono, color: c.g, textTransform: "uppercase", marginBottom: 10 }}>🎭 Conversation Complete</div>
          {branchData.summary && <div style={{ fontSize: 14, color: c.tx, lineHeight: 1.6, marginBottom: 14 }}>{branchData.summary}</div>}
          {/* Show history */}
          {branchHistory.map((h, i) => <div key={i} style={{ marginBottom: 8, padding: "8px 12px", borderRadius: 8, background: h.quality === "best" ? c.gs : h.quality === "okay" ? c.go + "15" : c.rs, border: "1px solid " + (h.quality === "best" ? c.g + "33" : h.quality === "okay" ? c.go + "33" : c.a + "33") }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{h.japanese}</div>
            <div style={{ fontSize: 11, color: c.m }}>{h.english} — {h.quality === "best" ? "✓ Perfect" : h.quality === "okay" ? "~ Okay" : "✗ Wrong"}</div>
          </div>)}
          <div style={{ textAlign: "center", marginTop: 12, fontSize: 15, fontWeight: 700, color: c.a }}>{branchScore}/{branchHistory.length} best choices</div>
        </div>
        <button onClick={() => {
          setScore(s => ({ ...s, c: s.c + branchScore, w: s.w + (branchHistory.length - branchScore) }));
          setBranchData(null); setBranchHistory([]); setBranchTurn(1); setBranchScore(0);
          advance(branchScore >= branchHistory.length / 2);
        }} style={{ ...btn, width: "100%", padding: 14, borderRadius: 10, background: c.a, color: "#fff", fontSize: 15, fontWeight: 600 }}>Continue →</button>
      </>);
    }

    return withSenpai(<>
      <div style={{ ...card, padding: "20px", marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontFamily: mono, color: c.go, textTransform: "uppercase", marginBottom: 10 }}>🎭 {scenario} — Turn {branchTurn}</div>
        {/* Scene description */}
        <div style={{ fontSize: 13, color: c.m, marginBottom: 14, fontStyle: "italic" }}>{branchData.scene}</div>
        {/* NPC line */}
        {branchData.npcLine && <div style={{ padding: "12px 16px", background: c.s2, borderRadius: "4px 12px 12px 12px", marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: c.m, fontFamily: mono, marginBottom: 4 }}>{branchData.npcLine.speaker}</div>
          <div style={{ fontSize: isDesktop ? 22 : 18, fontWeight: 600, marginBottom: 4 }}>{branchData.npcLine.japanese}</div>
          <div style={{ fontSize: 12, fontFamily: mono, color: c.a }}>{branchData.npcLine.romaji}</div>
          <div style={{ fontSize: 13, color: c.m, marginTop: 4 }}>{branchData.npcLine.english}</div>
        </div>}
        <div style={{ fontSize: 13, fontWeight: 600, color: c.tx, marginBottom: 10 }}>What do you say?</div>
      </div>
      {/* Response options */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {branchData.options?.map((opt, i) => <button key={i} onClick={() => {
          setBranchHistory(h => [...h, opt]);
          if (opt.quality === "best") setBranchScore(s => s + 1);
          setBranchData(null);
          setBranchTurn(t => t + 1);
          // Play the chosen phrase
          speak(opt.japanese);
        }} style={{ ...btn, padding: "14px 16px", borderRadius: 10, border: "1px solid " + c.b, background: "transparent", color: c.tx, textAlign: "left", transition: "all .15s" }}>
          <div style={{ fontSize: isDesktop ? 18 : 16, fontWeight: 500, marginBottom: 4 }}>{opt.japanese}</div>
          <div style={{ fontSize: 12, fontFamily: mono, color: c.a }}>{opt.romaji}</div>
          <div style={{ fontSize: 12, color: c.m, marginTop: 2 }}>{opt.english}</div>
        </button>)}
      </div>
    </>);
  }

  // ═══ EXERCISE: AI-GENERATED STORY ═══
  if (ex.type === "story") {
    // Fetch story on first render
    if (!storyData && !storyLoading) {
      setStoryLoading(true);
      const knownPhraseIds = Object.keys(data.phr || {});
      const knownPhrases = PHRASES.filter(p => knownPhraseIds.includes(p[0])).map(p => ({ id: p[0], jp: p[1], en: p[3] }));
      const kanaCount = Object.keys(data.kana || {}).filter(ch => (data.kana[ch]?.box || 0) >= 1).length;
      fetch('/api/story', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ knownPhrases, knownKana: kanaCount, level: data.onboarding?.level || 'beginner', interests: data.onboarding?.why ? [data.onboarding.why] : [] }),
      }).then(r => r.json()).then(story => {
        if (!story.error) setStoryData(story);
        else { advance(true); } // Skip if story generation fails
        setStoryLoading(false);
      }).catch(() => { advance(true); setStoryLoading(false); });
    }

    if (storyLoading) return withSenpai(<>
      <div style={{ ...card, textAlign: "center", padding: "40px 20px" }}>
        <img src={`/images/tinysenpairun/ts${(loadingFrame % 4) + 1}.png`} alt="" style={{ width: 60, height: 60, imageRendering: "pixelated", marginBottom: 12 }} />
        <div style={{ fontSize: 13, color: c.m }}>Senpai is writing a story for you...</div>
      </div>
    </>);

    if (!storyData) return null;

    const answered = storyAnswer !== null;
    const isCorrect = storyAnswer === storyData.comprehensionQuestion?.correctIndex;

    return withSenpai(<>
      <div style={{ ...card, padding: "20px", marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontFamily: mono, color: c.g, textTransform: "uppercase", marginBottom: 10 }}>📖 Story — {storyData.title}</div>
        {storyData.sentences?.map((s, i) => <div key={i} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: isDesktop ? 22 : 18, fontWeight: 600, lineHeight: 1.5, marginBottom: 4 }}>{s.japanese}</div>
          <div style={{ fontSize: 12, fontFamily: mono, color: c.a, marginBottom: 2 }}>{s.romaji}</div>
          <div style={{ fontSize: 13, color: c.m }}>{s.english}</div>
        </div>)}
      </div>
      {/* Comprehension question */}
      {storyData.comprehensionQuestion && <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: c.tx, marginBottom: 10 }}>{storyData.comprehensionQuestion.question}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {storyData.comprehensionQuestion.options?.map((opt, i) => {
            let bg = "transparent", border = c.b, col = c.tx;
            if (answered && i === storyData.comprehensionQuestion.correctIndex) { bg = c.gs; border = c.g + "60"; col = c.g; }
            if (answered && storyAnswer === i && !isCorrect) { bg = c.rs; border = c.a + "60"; col = c.a; }
            return <button key={i} onClick={() => {
              if (answered) return;
              setStoryAnswer(i);
              const correct = i === storyData.comprehensionQuestion.correctIndex;
              setScore(s => correct ? { ...s, c: s.c + 1 } : { ...s, w: s.w + 1 });
              setTimeout(() => { setStoryData(null); setStoryAnswer(null); advance(correct); }, 2000);
            }} style={{ ...btn, padding: "12px 16px", borderRadius: 10, border: "1px solid " + border, background: bg, color: col, fontSize: 14, textAlign: "left", transition: "all .2s" }}>
              {opt}
            </button>;
          })}
        </div>
      </div>}
    </>);
  }

  // ═══ EXERCISE: CONVERSATION FILL-IN-THE-BLANK ═══
  if (ex.type === "conversation") {
    const convo = ex.conversation;
    const blanks = convo.lines.filter(l => l.blank);
    const allFilled = blanks.every((_, i) => convoAnswers[i] !== undefined);
    const phraseById = (id) => PHRASES.find(p => p[0] === id);

    if (!convoSubmitted) {
      // Collect ALL unique options across all blanks, shuffle once
      if (convoShuffledRef.current.blankIdx !== ci) {
        const allOpts = [...new Set(blanks.flatMap(b => b.options))];
        convoShuffledRef.current = { blankIdx: ci, options: shuffle([...allOpts]) };
      }
      const allOptions = convoShuffledRef.current.options;
      const usedIds = Object.values(convoAnswers);
      // Which blank to fill next (selected or first empty)
      const targetBlank = selectedBlank !== null ? selectedBlank : blanks.findIndex((_, i) => convoAnswers[i] === undefined);

      const handleDrop = (blankIdx, optId) => {
        // If this option was in another blank, remove it from there first
        setConvoAnswers(a => {
          const n = { ...a };
          Object.keys(n).forEach(k => { if (n[k] === optId) delete n[k]; });
          n[blankIdx] = optId;
          return n;
        });
        setSelectedBlank(null);
      };

      return withSenpai(<>
        <div style={{ ...card, padding: "20px", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 18 }}>{convo.icon}</span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{convo.setting}</span>
          </div>
          {convo.lines.map((line, li) => {
            if (!line.blank) {
              return <div key={li} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                <div style={{ fontSize: 10, color: c.m, fontFamily: mono, width: 40, flexShrink: 0, textAlign: "right", marginTop: 4 }}>{line.speaker}</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>{line.text}</div>
                  <div style={{ fontSize: 11, color: c.m }}>{line.translation}</div>
                </div>
              </div>;
            }
            const blankIdx = blanks.indexOf(line);
            const selected = convoAnswers[blankIdx];
            const selectedPhrase = selected ? phraseById(selected) : null;
            const isTarget = selectedBlank === blankIdx;
            const isDragOver = draggingId && !selectedPhrase;
            return <div key={li} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
              <div style={{ fontSize: 10, color: c.a, fontFamily: mono, width: 40, flexShrink: 0, textAlign: "right", marginTop: 4 }}>you</div>
              <div style={{ flex: 1 }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); if (draggingId) { handleDrop(blankIdx, draggingId); setDraggingId(null); } }}>
                {selectedPhrase
                  ? <div onClick={() => { setConvoAnswers(a => { const n = { ...a }; delete n[blankIdx]; return n; }); setSelectedBlank(blankIdx); }}
                      draggable onDragStart={() => setDraggingId(selected)}
                      style={{ padding: "8px 14px", borderRadius: 8, background: c.a + "18", border: "1px solid " + c.a + "44", cursor: "grab", fontSize: 15, fontWeight: 500, transition: "all .15s" }}>
                      {selectedPhrase[1]}
                    </div>
                  : <div onClick={() => setSelectedBlank(isTarget ? null : blankIdx)}
                      style={{ padding: "10px 14px", borderRadius: 8, border: "2px dashed " + (isTarget ? c.a : c.b), background: isTarget ? c.a + "08" : "transparent", color: isTarget ? c.a : c.m, fontSize: 13, cursor: "pointer", transition: "all .15s" }}>
                      {isTarget ? "← pick an option" : "tap to select..."}
                    </div>
                }
              </div>
            </div>;
          })}
        </div>
        {/* All options — drag or tap to place */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 14 }}>
          {allOptions.map((optId, i) => {
            const p = phraseById(optId);
            if (!p) return null;
            const used = usedIds.includes(optId);
            return <button key={optId} draggable={!used}
              onDragStart={() => setDraggingId(optId)}
              onDragEnd={() => setDraggingId(null)}
              onClick={() => {
                if (used) return;
                if (targetBlank >= 0) handleDrop(targetBlank, optId);
              }}
              disabled={used}
              style={{ ...btn, padding: "10px 10px", borderRadius: 8, border: "1px solid " + (draggingId === optId ? c.a : c.b), background: used ? c.s2 : "transparent", color: used ? c.m : c.tx, fontSize: 14, textAlign: "left", opacity: used ? .4 : 1, cursor: used ? "default" : "grab", transition: "all .15s" }}>
              {p[1]}
            </button>;
          })}
        </div>
        {allFilled && <button onClick={() => setConvoSubmitted(true)}
          style={{ ...btn, width: "100%", padding: 14, borderRadius: 10, background: c.a, color: "#fff", fontSize: 15, fontWeight: 600 }}>Check my answers</button>}
      </>);
    }

    // Submitted — show results
    const correct = blanks.filter((b, i) => convoAnswers[i] === b.correctId).length;
    const total = blanks.length;
    let blankNum = 0;
    return withSenpai(<>
      <div style={{ ...card, padding: "20px", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 18 }}>{convo.icon}</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{convo.setting}</span>
          <span style={{ marginLeft: "auto", fontSize: 16, fontWeight: 700, color: correct === total ? "#4caf50" : c.a }}>{correct}/{total}</span>
        </div>
        {convo.lines.map((line, li) => {
          if (!line.blank) {
            return <div key={li} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
              <div style={{ fontSize: 10, color: c.m, fontFamily: mono, width: 28, flexShrink: 0, textAlign: "right", marginTop: 4 }}>{line.speaker}</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>{line.text}</div>
                <div style={{ fontSize: 11, color: c.m }}>{line.translation}</div>
              </div>
            </div>;
          }
          const blankIdx = blanks.indexOf(line);
          blankNum++;
          const answered = convoAnswers[blankIdx];
          const isCorrect = answered === line.correctId;
          const answeredPhrase = phraseById(answered);
          const correctPhrase = phraseById(line.correctId);
          const resultCol = isCorrect ? "#4caf50" : c.a;
          return <div key={li} style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "flex-start" }}>
            <div style={{ fontSize: 10, fontFamily: mono, width: 28, flexShrink: 0, textAlign: "right", marginTop: 6 }}>
              <span style={{ display: "inline-block", width: 20, height: 20, lineHeight: "20px", borderRadius: "50%", textAlign: "center", fontSize: 10, fontWeight: 700, background: resultCol + "22", color: resultCol, border: "1px solid " + resultCol + "44" }}>{blankNum}</span>
            </div>
            <div style={{ flex: 1 }}>
              {/* Your answer */}
              <div style={{ padding: "10px 14px", borderRadius: 8, background: isCorrect ? "#4caf5012" : c.rs, border: "1px solid " + resultCol + "33", marginBottom: isCorrect ? 0 : 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: resultCol }}>{isCorrect ? "✓" : "✗"}</span>
                  <span style={{ fontSize: 15, fontWeight: 500 }}>{answeredPhrase?.[1]}</span>
                  <span style={{ fontSize: 12, color: c.m }}>{answeredPhrase?.[3]}</span>
                  <button onClick={() => speakPhrase(answered, answeredPhrase?.[1])}
                    style={{ ...btn, marginLeft: "auto", padding: "2px 8px", borderRadius: 6, background: "transparent", border: "1px solid " + c.b, fontSize: 11, color: c.m, flexShrink: 0 }}>🔊</button>
                </div>
              </div>
              {/* Correct answer if wrong */}
              {!isCorrect && <div style={{ padding: "8px 14px", borderRadius: 8, background: "#4caf5010", border: "1px solid #4caf5022" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "#4caf50", fontWeight: 600 }}>correct:</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#4caf50" }}>{correctPhrase?.[1]}</span>
                  <span style={{ fontSize: 12, color: c.m }}>{correctPhrase?.[3]}</span>
                  <button onClick={() => speakPhrase(line.correctId, correctPhrase?.[1])}
                    style={{ ...btn, marginLeft: "auto", padding: "2px 8px", borderRadius: 6, background: "transparent", border: "1px solid " + c.b, fontSize: 11, color: c.m, flexShrink: 0 }}>🔊</button>
                </div>
              </div>}
            </div>
          </div>;
        })}
      </div>
      <button onClick={() => {
        blanks.forEach((b, i) => reviewPhr(b.correctId, convoAnswers[i] === b.correctId));
        setScore(s => ({ ...s, c: s.c + correct, w: s.w + (total - correct) }));
        setConvoAnswers({}); setConvoSubmitted(false);
        advance(correct >= total / 2);
      }} style={{ ...btn, width: "100%", padding: 14, borderRadius: 10, background: c.a, color: "#fff", fontSize: 15, fontWeight: 600 }}>Continue →</button>
    </>);
  }

  // Fallback
  return withSenpai(<div style={{ textAlign: "center", color: c.m, padding: 40 }}>Unknown exercise type</div>);
}
