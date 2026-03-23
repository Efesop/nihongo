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
  stopAudio, speakStory,
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
  const inputRef = useRef(null);

  const situations = { greet: "You meet someone.", food: "You're at a restaurant.", train: "You're navigating transport.", hotel: "You're at your hotel.", shop: "You're at a store.", dir: "You need directions.", sos: "It's an emergency." };

  // Build session on mount
  useEffect(() => {
    if (cards.length === 0 && !done) {
      const session = buildSmartSession(data, 10, data.settings?.sessionDifficulty || 0);
      if (session.length > 0) setCards(session);
      else setDone(true);
    }
  }, []);

  // Focus input when needed
  useEffect(() => {
    if (inputRef.current && !fb) inputRef.current.focus();
  }, [ci, fb]);

  if (done) {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    return <div style={inner}>
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>🎌</div>
        <h3 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 8px" }}>Session Complete!</h3>

        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 24, marginBottom: 24 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: c.g }}>{score.c}</div>
            <div style={{ fontSize: 11, color: c.m, fontFamily: mono }}>correct</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: c.a }}>{score.w}</div>
            <div style={{ fontSize: 11, color: c.m, fontFamily: mono }}>missed</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: c.m }}>{mins}:{secs.toString().padStart(2, "0")}</div>
            <div style={{ fontSize: 11, color: c.m, fontFamily: mono }}>time</div>
          </div>
        </div>

        {/* Session feedback */}
        {!sessionFeedback ? <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, color: c.m, marginBottom: 10 }}>How was that?</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            {[["Too easy", -1], ["Just right", 0], ["Too hard", 1]].map(([label, adj]) =>
              <button key={label} onClick={() => {
                setSessionFeedback(label);
                save({ settings: { ...data.settings, sessionDifficulty: (data.settings?.sessionDifficulty || 0) + adj } });
              }} style={{ ...btn, padding: "8px 16px", borderRadius: 8, border: "1px solid " + c.b, background: c.s2, color: c.tx, fontSize: 12 }}>{label}</button>
            )}
          </div>
        </div> : <div style={{ fontSize: 13, color: c.g, marginBottom: 24 }}>Thanks! Next session adjusted.</div>}

        {struggled.length > 0 && <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: c.m, marginBottom: 8 }}>Struggled with:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
            {struggled.map((item, i) => <span key={i} style={{ fontSize: 14, padding: "4px 10px", borderRadius: 6, background: c.go + "15", border: "1px solid " + c.go + "33", color: c.go }}>{typeof item === "string" ? item : item[1]}</span>)}
          </div>
        </div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
          <button onClick={() => { setCards([]); setDone(false); setCi(0); setScore({ c: 0, w: 0 }); setStruggled([]); setFb(null); setInput(""); setChoiceAnswer(null); setSessionFeedback(null); }}
            style={{ ...btn, padding: 14, borderRadius: 10, background: c.a, color: "#fff", fontSize: 15, fontWeight: 600 }}>Continue (10 more)</button>
          <button onClick={() => { stopAudio(); window.history.back(); }}
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
    if (!correct) setStruggled(s => [...s, ex.item]);
    setFb(null); setInput(""); setChoiceAnswer(null);
    if (ci + 1 >= cards.length) setDone(true);
    else setCi(ci + 1);
  };

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

  // ═══ EXERCISE: KANA VISUAL ═══
  if (ex.type === "kana-visual") {
    const submit = () => {
      if (fb || !input.trim()) return;
      const ok = input.trim().toLowerCase() === ex.romaji;
      setFb(ok ? "ok" : "no");
      setScore(s => ok ? { ...s, c: s.c + 1 } : { ...s, w: s.w + 1 });
      updateKanaSRS(ex.item, ok);
      setTimeout(() => speak(ex.item), 250);
      setTimeout(() => advance(ok), ok ? 1500 : 2500);
    };
    return <div style={inner}>{header}
      <div style={{ ...card, textAlign: "center", padding: "40px 24px", marginBottom: 16, background: fb === "ok" ? c.gs : fb === "no" ? c.rs : c.s, transition: "background .3s" }}>
        <div style={{ fontSize: 11, fontFamily: mono, color: c.m, textTransform: "uppercase", marginBottom: 12 }}>What is this character?</div>
        <div style={{ fontSize: 120, lineHeight: 1, marginBottom: 16 }}>{ex.item}</div>
        {fb === "no" && <div style={{ fontSize: 24, fontWeight: 700, color: c.a, fontFamily: mono }}>{ex.romaji}</div>}
      </div>
      {!fb && <div style={{ display: "flex", gap: 8 }}>
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") submit(); }}
          placeholder="romaji..." autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false"
          style={{ flex: 1, padding: "14px 16px", borderRadius: 10, border: "1px solid " + c.b, background: c.s2, color: c.tx, fontFamily: mono, fontSize: 20, outline: "none", textAlign: "center" }} />
        <button onClick={submit} style={{ ...btn, padding: "14px 22px", borderRadius: 10, background: input.trim() ? c.a : c.b, color: input.trim() ? "#fff" : c.m, fontSize: 14, fontWeight: 600 }}>Go</button>
      </div>}
    </div>;
  }

  // ═══ EXERCISE: KANA LISTEN ═══
  if (ex.type === "kana-listen") {
    if (!fb && ci === cards.indexOf(ex)) setTimeout(() => speak(ex.item), 300);
    const submit = () => {
      if (fb || !input.trim()) return;
      const ok = input.trim().toLowerCase() === ex.romaji;
      setFb(ok ? "ok" : "no");
      setScore(s => ok ? { ...s, c: s.c + 1 } : { ...s, w: s.w + 1 });
      updateKanaSRS(ex.item, ok);
      setTimeout(() => advance(ok), ok ? 1500 : 2500);
    };
    return <div style={inner}>{header}
      <div style={{ ...card, textAlign: "center", padding: "40px 24px", marginBottom: 16, background: fb === "ok" ? c.gs : fb === "no" ? c.rs : c.s, transition: "background .3s" }}>
        <div style={{ fontSize: 11, fontFamily: mono, color: c.m, textTransform: "uppercase", marginBottom: 12 }}>What did you hear?</div>
        <div style={{ fontSize: 60, marginBottom: 16 }}>👂</div>
        <button onClick={() => speak(ex.item)} style={{ ...btn, padding: "8px 20px", borderRadius: 8, background: c.s2, border: "1px solid " + c.b, fontSize: 14, color: c.m }}>🔊 play again</button>
        {fb && <div style={{ fontSize: 80, lineHeight: 1, marginTop: 16 }}>{ex.item}</div>}
        {fb === "no" && <div style={{ fontSize: 24, fontWeight: 700, color: c.a, fontFamily: mono, marginTop: 8 }}>{ex.romaji}</div>}
      </div>
      {!fb && <div style={{ display: "flex", gap: 8 }}>
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") submit(); }}
          placeholder="romaji..." autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false"
          style={{ flex: 1, padding: "14px 16px", borderRadius: 10, border: "1px solid " + c.b, background: c.s2, color: c.tx, fontFamily: mono, fontSize: 20, outline: "none", textAlign: "center" }} />
        <button onClick={submit} style={{ ...btn, padding: "14px 22px", borderRadius: 10, background: input.trim() ? c.a : c.b, color: input.trim() ? "#fff" : c.m, fontSize: 14, fontWeight: 600 }}>Go</button>
      </div>}
    </div>;
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
    return <div style={inner}>{header}
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
          }} style={{ ...btn, padding: "14px 16px", borderRadius: 10, border: "1px solid " + border, background: bg, color: col, fontSize: isDesktop ? 18 : 16, fontWeight: 500, textAlign: "left", transition: "all .2s" }}>
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
    </div>;
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
    return <div style={inner}>{header}
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
    </div>;
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
    return <div style={inner}>{header}
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
    </div>;
  }

  // ═══ EXERCISE: LEARN CARD (new kana) ═══
  if (ex.type === "learn-card") {
    const m = ex.mnemonic;
    const isHiragana = ex.item.charCodeAt(0) >= 0x3040 && ex.item.charCodeAt(0) <= 0x309F;
    const imgPath = `/images/mnemonics/approved/${isHiragana ? "hiragana" : "katakana"}/${ex.item.codePointAt(0).toString(16)}.png`;
    return <div style={inner}>{header}
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
    </div>;
  }

  // ═══ EXERCISE: LEARN PHRASE (new phrase) ═══
  if (ex.type === "learn-phrase") {
    const p = ex.item;
    const catCol = CAT_COLORS[p[4]];
    return <div style={inner}>{header}
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
    </div>;
  }

  // Fallback
  return <div style={inner}>{header}<div style={{ textAlign: "center", color: c.m, padding: 40 }}>Unknown exercise type</div></div>;
}
