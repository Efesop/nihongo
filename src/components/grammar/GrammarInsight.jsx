import { useEffect, useRef, useState } from "react";
import { fontJa, mono, T, JP } from "../../data/constants.js";
import { speakPhraseWithEnglish, speakGrammarExplain } from "../../utils/audio.js";
import { shuffle } from "../../utils/helpers.js";
import { PHRASE_BREAKDOWNS } from "../../data/phraseBreakdowns.js";
import PhraseSegments from "../PhraseSegments.jsx";
import { IconPlay } from "../Icons.jsx";

/**
 * GrammarInsight — plain-English explanation of a single grammar pattern.
 *
 * Replaces the inline grammar-pattern render that used to live in SmartSession.jsx.
 * Improvements over the old card:
 *   - Big jargon-free headline (gp.shortTitle) instead of "possessive / linking ('s / of)"
 *   - One-liner "what a friend would tell you" hook before the detail
 *   - Visual diagram: [noun] [particle] [noun] → [English gloss] with colour coding
 *   - Audio button: plays an English narration of the one-liner then the Japanese example
 *     (falls back to Google TTS if pre-recorded file at /audio/grammar/{id}-en.mp3 is missing)
 *   - Same comprehension quiz pattern as before, but reusable
 *
 * Props:
 *   gp              — pattern object from GRAMMAR_PATTERNS
 *   c, btn, mono    — theme / button style / mono font (from SmartSession)
 *   isDesktop       — layout flag
 *   PHRASES         — full phrase list (for example-phrase lookup)
 *   data            — user SRS data (to filter example phrases to the learner's known ones)
 *   card            — base card style
 *   onAdvance       — called when user taps "Next"
 *   setScore        — optional score updater for the quick-check quiz
 */
export default function GrammarInsight({ gp, c, btn, isDesktop, PHRASES, data, card, onAdvance, setScore }) {
  const [quizPicked, setQuizPicked] = useState(null);
  const quizShuffledRef = useRef({ key: null, options: [] });

  // Reset quiz when pattern changes
  useEffect(() => { setQuizPicked(null); quizShuffledRef.current = { key: null, options: [] }; }, [gp.id]);

  const exPhraseIds = (gp.examples || []).filter(id => data.phr?.[id]);
  const exPhrases = exPhraseIds.map(id => PHRASES.find(p => p[0] === id)).filter(Boolean).slice(0, 3);

  // Quiz: from first example phrase, ask what role the target particle plays
  const quizPhrase = exPhrases[0];
  const quizSegs = quizPhrase ? PHRASE_BREAKDOWNS[quizPhrase[0]] : null;
  const patternKey = gp.pattern.replace(/~/g, "").replace(/\.\.\./g, "").replace(/～/g, "");
  const targetSeg = quizSegs?.find(s => patternKey.includes(s[0]) || (s[0] && patternKey.charAt(0) && s[0].includes(patternKey.charAt(0))));
  const quizOptions = quizSegs && targetSeg ? (() => {
    const key = `${quizPhrase[0]}:${targetSeg[0]}`;
    if (quizShuffledRef.current.key !== key) {
      const correct = `${targetSeg[2]} (${targetSeg[3]})`;
      const otherSegs = quizSegs.filter(s => s !== targetSeg).map(s => `${s[2]} (${s[3]})`);
      quizShuffledRef.current = { key, options: shuffle([correct, ...otherSegs.slice(0, 2)]) };
    }
    return quizShuffledRef.current.options;
  })() : null;
  const correctAnswer = targetSeg ? `${targetSeg[2]} (${targetSeg[3]})` : null;
  const quizAnswered = quizPicked !== null;

  const d = gp.diagram || {};

  const handleHear = () => {
    const enSay = gp.oneLiner || gp.explanation || "";
    const jaSay = gp.speakExample || "";
    speakGrammarExplain(gp.id, enSay, jaSay);
  };

  return (<>
    {/* ── HEADER: big particle, short title, one-liner ─────────── */}
    <div style={{ ...card, padding: isDesktop ? "28px 24px" : "22px 18px", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 14 }}>
        <div style={{ fontSize: isDesktop ? 56 : 44, fontWeight: 800, color: c.a, fontFamily: fontJa, lineHeight: 1, flexShrink: 0 }}>{gp.pattern}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: T.xl, fontWeight: 700, color: c.tx, lineHeight: 1.25, marginBottom: 4 }}>{gp.shortTitle || gp.meaning}</div>
          <div style={{ fontSize: T.sm, fontFamily: mono, color: c.m, textTransform: "uppercase", letterSpacing: 0.5 }}>{gp.meaning}</div>
        </div>
        <button className="ts-icon-btn" onClick={handleHear}
          style={{ ...btn, padding: "10px 14px", borderRadius: 10, background: c.s2, border: "1px solid " + c.b, color: c.tx, fontSize: T.sm, display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0 }}
          aria-label="Hear explanation"
        ><IconPlay size={14}/> hear it</button>
      </div>

      {/* One-liner hook */}
      {gp.oneLiner && <div style={{
        fontSize: T.md, color: c.tx, lineHeight: 1.5, marginBottom: 18,
        padding: "12px 14px", background: c.s2, borderRadius: 10,
        borderLeft: "3px solid " + c.go,
      }}>{gp.oneLiner}</div>}

      {/* ── DIAGRAM BLOCK ────────────────────────────────────────── */}
      {d.left && <Diagram d={d} c={c} />}

      {/* Longer explanation — collapsed by default on mobile to reduce wall-of-text */}
      {gp.explanation && gp.explanation !== gp.oneLiner &&
        <details style={{ marginTop: 14 }}>
          <summary style={{ cursor: "pointer", fontSize: T.sm, color: c.m, fontFamily: mono }}>read more</summary>
          <div style={{ fontSize: T.sm, color: c.tx, lineHeight: 1.6, marginTop: 8 }}>{gp.explanation}</div>
        </details>}
    </div>

    {/* ── KNOWN EXAMPLES ───────────────────────────────────────── */}
    {exPhrases.length > 0 && <div style={{ ...card, padding: "16px 18px", marginBottom: 14 }}>
      <div style={{ fontSize: T.xs, fontFamily: mono, color: c.m, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>You already know these</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {exPhrases.map(p => <div key={p[0]} style={{ padding: "10px 14px", borderRadius: 10, background: c.s2, border: "1px solid " + c.b }}>
          <PhraseSegments phraseId={p[0]} c={c} fontSize={isDesktop ? T.xl : T.lg} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6, gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: T.sm, fontFamily: mono, color: c.ro }}>{p[2]}</div>
              <div style={{ fontSize: T.base, color: c.tx, fontWeight: 500 }}>{p[3]}</div>
            </div>
            <button className="ts-icon-btn" onClick={() => speakPhraseWithEnglish(p[0], p[1], p[3])}
              style={{ ...btn, padding: "6px 12px", borderRadius: 6, background: c.s, border: "1px solid " + c.b, fontSize: T.sm, color: c.tx, flexShrink: 0 }}
              aria-label="Play phrase"
            ><IconPlay size={14}/></button>
          </div>
        </div>)}
      </div>
    </div>}

    {/* ── QUICK CHECK QUIZ ─────────────────────────────────────── */}
    {quizPhrase && targetSeg && quizOptions &&
      <div style={{ ...card, padding: "16px 20px", marginBottom: 14, borderLeft: "3px solid " + c.go }}>
        <div style={{ fontSize: T.xs, fontFamily: mono, color: c.go, textTransform: "uppercase", marginBottom: 8 }}>Quick check</div>
        <div style={{ fontSize: T.base, color: c.tx, marginBottom: 12 }}>
          In <span style={{ fontWeight: 700, fontFamily: fontJa }}>{quizPhrase[1]}</span>, what role does <span style={{ fontWeight: 700, color: c.a, fontFamily: fontJa }}>{targetSeg[0]}</span> play?
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {quizOptions.map((opt, i) => {
            const isCorrect = opt === correctAnswer;
            const isPicked = quizPicked === i;
            let bg = "transparent", border = c.b, col = c.tx;
            if (quizAnswered && isCorrect) { bg = c.gs; border = c.g + "55"; col = c.g; }
            if (quizAnswered && isPicked && !isCorrect) { bg = c.rs; border = c.a + "55"; col = c.a; }
            return <button key={i} className="ts-btn" disabled={quizAnswered} onClick={() => {
              if (quizAnswered) return;
              setQuizPicked(i);
              if (setScore) setScore(s => isCorrect ? { ...s, c: s.c + 1 } : { ...s, w: s.w + 1 });
            }} style={{ ...btn, padding: "10px 14px", borderRadius: 8, border: "1px solid " + border, background: bg, color: col, fontSize: T.sm, textAlign: "left" }}>{opt}</button>;
          })}
        </div>
      </div>}

    <button onClick={() => onAdvance(true)} className="ts-btn"
      style={{ ...btn, width: "100%", padding: 14, borderRadius: 10, background: c.a, color: "#fff", fontSize: T.base, fontWeight: 600 }}>
      {quizPhrase && targetSeg && !quizAnswered ? "Skip quiz — Next →" : "Got it — Next →"}
    </button>
  </>);
}

/**
 * Diagram — colour-coded three-block visual: left noun + particle + right noun.
 * Underneath: the arrow and the English gloss on one line.
 */
function Diagram({ d, c }) {
  const pill = (text, gloss, tone) => (
    <div style={{
      flex: "1 1 auto", minWidth: 0,
      padding: "14px 12px",
      borderRadius: 12,
      background: tone === "particle" ? c.a + "18" : c.s2,
      border: "1px solid " + (tone === "particle" ? c.a + "55" : c.b),
      textAlign: "center",
    }}>
      <div style={{ fontSize: 26, fontWeight: 700, color: tone === "particle" ? c.a : c.tx, fontFamily: fontJa, lineHeight: 1.2, marginBottom: 4 }}>{text}</div>
      {gloss && <div style={{ fontSize: T.xs, fontFamily: mono, color: c.m, lineHeight: 1.2 }}>{gloss}</div>}
    </div>
  );
  const connector = (sym) => (
    <div style={{ fontSize: 20, color: c.m, fontFamily: mono, padding: "0 4px", flexShrink: 0, alignSelf: "center" }}>{sym}</div>
  );
  return (
    <div>
      <div style={{ display: "flex", alignItems: "stretch", gap: 6, flexWrap: "nowrap" }}>
        {d.left && pill(d.left, d.leftGloss, "noun")}
        {d.connector && <>{connector(d.arrow || "+")}{pill(d.connector, d.connectorGloss, "particle")}</>}
        {d.right && <>{connector(d.arrow === "=" ? "=" : "+")}{pill(d.right, d.rightGloss, "noun")}</>}
      </div>
      {d.gloss && <div style={{
        marginTop: 10, textAlign: "center",
        fontSize: T.md, color: c.tx, fontWeight: 600,
        padding: "8px 12px", background: c.gs, borderRadius: 8,
        border: "1px solid " + c.g + "33",
      }}>
        <span style={{ color: c.g, fontFamily: "monospace", marginRight: 8 }}>=</span>
        {d.gloss}
      </div>}
    </div>
  );
}
