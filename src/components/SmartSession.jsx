import { useState, useRef, useEffect } from "react";
import { M, ROMAJI, YOON_PARTS } from "../data/kana.js";
import { PHRASES, CATS, CAT_ICONS, CAT_COLORS } from "../data/phrases.js";
import { font, fontJa, mono, T } from "../data/constants.js";
import { speak, speakPhrase, speakPhraseWithEnglish } from "../utils/audio.js";
import { shuffle } from "../utils/helpers.js";

/**
 * Deterministic ordering for MCQ choices — prevents jarring position shuffles between
 * cards. Same items → same slot positions every time. Distractor variance still prevents
 * pure position-memorization cheating since the correct answer's absolute slot depends
 * on alphabet-order of whatever distractors landed in the pool this round.
 */
function stableChoices(arr) {
  return [...arr].sort((a, b) => {
    const keyOf = x => Array.isArray(x) ? String(x[1] ?? x[0] ?? "") : String(x);
    return keyOf(a).localeCompare(keyOf(b));
  });
}
import { buildSmartSession, getDistractors } from "../utils/sessionEngine.js";
import PhraseSegments from "./PhraseSegments.jsx";
import { CONVERSATIONS } from "../data/conversations.js";
import { KANA_WORDS } from "../data/kanaWords.js";
import { CONFUSED_PHRASES } from "../data/confusedPhrases.js";
import { PHRASE_BREAKDOWNS } from "../data/phraseBreakdowns.js";
import { KEY_WORDS, WORD_CATS } from "../data/keyWords.js";
import { ActionBar, HintChip, RomajiReveal, TypeLabel, PlayButton, ResultMark, NoneOfThese, ChoiceCard, ensureSessionStyles } from "./SessionParts.jsx";
import { IconPlay, IconSlowPlay, IconEar, IconBulb, IconBlock, IconEye, IconSkip, IconBackspace, IconCheck, IconX, IconArrowRight, IconMic, IconSparkle, IconRefresh } from "./Icons.jsx";
import { track as telemetryTrack, flush as telemetryFlush } from "../utils/telemetry.js";

export default function SmartSession({
  data, save, c, inner, card, btn, isDesktop,
  updateKanaSRS, reviewPhr,
  stopAudio, speakStory, setTab,
  LEVEL_THRESHOLDS, getLevel, getXPForNext,
  BADGE_DEFS, checkBadges,
}) {
  const [cards, setCards] = useState([]);
  const [ci, setCi] = useState(0);
  const [input, setInput] = useState("");
  const [fb, setFb] = useState(null); // null | "ok" | "no"
  const [score, setScore] = useState({ c: 0, w: 0 });
  const [done, setDone] = useState(false);
  const [struggled, setStruggled] = useState([]);
  const cardStartTime = useRef(Date.now());
  const [startTime] = useState(Date.now());
  const [choiceAnswer, setChoiceAnswer] = useState(null);
  const [sessionFeedback, setSessionFeedback] = useState(null);
  const [coachingPlan, setCoachingPlan] = useState(null);
  const [coachDismissed, setCoachDismissed] = useState(false);
  const [reviewCoaching, setReviewCoaching] = useState(null);
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
  const [leechPhase, setLeechPhase] = useState("study"); // "study" | "quiz"
  const [leechInput, setLeechInput] = useState("");
  const [leechFb, setLeechFb] = useState(null); // null | "ok" | "no"
  const [leechChoices, setLeechChoices] = useState([]);
  const [leechPicked, setLeechPicked] = useState(null);
  const [assemblySlots, setAssemblySlots] = useState([]); // user's placed pieces
  const [assemblyPool, setAssemblyPool] = useState([]); // available pieces to pick from
  const [assemblySubmitted, setAssemblySubmitted] = useState(false);
  const [romajiRevealed, setRomajiRevealed] = useState(false); // tap-to-reveal for hidden romaji
  const [chainStep, setChainStep] = useState(0); // current step in phrase-chain exercise
  const [chainAnswers, setChainAnswers] = useState([]); // array of { correct: bool } per step
  const [chainPicked, setChainPicked] = useState(null); // currently selected option (before confirming)
  const [kanaTyped, setKanaTyped] = useState([]); // characters typed so far in kana-type exercise
  const [kanaSubmitted, setKanaSubmitted] = useState(false); // whether answer has been checked
  const [kanaPrePhase, setKanaPrePhase] = useState("meaning"); // "meaning" | "spell" — scaffold for phrase-kana-type
  const [kanaMeaningWrong, setKanaMeaningWrong] = useState(false);
  const [kbTab, setKbTab] = useState(0); // kana keyboard tab: 0=basic, 1=dakuten, 2=katakana
  const [shadowState, setShadowState] = useState("idle"); // idle | listening | done
  const [shadowResult, setShadowResult] = useState(null); // { transcript, correct }
  const [matchPicked, setMatchPicked] = useState(null); // number-match: currently selected left item
  const [matchPairs, setMatchPairs] = useState([]); // number-match: completed {leftId, rightVal, correct}
  const [matchWrong, setMatchWrong] = useState(null); // flash for wrong pair
  const [hintAvailable, setHintAvailable] = useState(false); // 15s timer for hint chip
  const [hintShown, _setHintShown] = useState(false); // user tapped hint
  const setHintShown = (v) => {
    if (v === true && !hintShown) {
      const ex = cards[ci];
      const item = typeof ex?.item === "string" ? ex.item : ex?.item?.[0];
      telemetryTrack("hint_revealed", { type: ex?.type, item });
    }
    _setHintShown(v);
  };
  const hintTimer = useRef(null);
  const [immersionIdx, setImmersionIdx] = useState(-1); // immersion: current phrase index
  const [immersionTaps, setImmersionTaps] = useState([]); // immersion: user tap timestamps
  const [immersionDone, setImmersionDone] = useState(false);
  const [immersionPlaying, setImmersionPlaying] = useState(false);
  const immersionTimers = useRef([]);
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

  // Build session IMMEDIATELY, then optionally fetch coaching in background
  useEffect(() => {
    if (cards.length === 0 && !done) {
      // Build session right away — no waiting for API
      try {
        ensureSessionStyles();
        const session = buildSmartSession(data, 10, data.settings?.sessionDifficulty || 0);
        if (session.length > 0) {
          setCards(session);
          telemetryTrack("session_start", {
            cards: session.length,
            types: session.map(c => c.type),
            phrasesKnown: Object.keys(data.phr || {}).length,
            kanaKnown: Object.keys(data.kana || {}).length,
            sessionCount: data.settings?.sessionCount || 0,
            difficulty: data.settings?.sessionDifficulty || 0,
          });
        }
        else setDone(true);
      } catch (e) {
        console.error("Session build failed:", e);
        setDone(true);
      }
      setLoading(false);

      // Coaching in background (non-blocking)
      fetch('/api/coach', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'plan', userData: data }),
      }).then(r => r.json()).then(plan => {
        if (!plan.error) setCoachingPlan(plan);
      }).catch(() => {});
    }
  }, []);

  // Focus input when needed + auto-play for listen exercises
  useEffect(() => {
    if (leechPhase === "quiz" && !leechFb && inputRef.current) inputRef.current.focus();
    if (inputRef.current && !fb) inputRef.current.focus();
    if (cards[ci]?.type === "kana-listen" && !fb) {
      const t = setTimeout(() => speak(cards[ci].item), 300);
      return () => clearTimeout(t);
    }
  }, [ci, fb]);

  // Post-session AI review + error pattern analysis every 10 sessions
  useEffect(() => {
    if (done && score.c + score.w > 0 && !sessionFeedback) {
      // Session count — computed once for use in both review and error analysis
      const sessionCount = (data.settings?.sessionCount || 0) + 1;
      telemetryTrack("session_end", {
        c: score.c, w: score.w,
        accuracy: Math.round(score.c / Math.max(1, score.c + score.w) * 100),
        elapsedSec: Math.round((Date.now() - startTime) / 1000),
        totalCards: cards.length,
        struggled: struggled.map(s => s.label),
        sessionCount,
      });
      telemetryFlush();

      // Regular post-session review
      fetch('/api/coach', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'review', userId: data.onboarding?.name || 'user',
          sessionResults: { score, struggled: struggled.map(s => s.label), timeElapsed: Math.round((Date.now() - startTime) / 1000), totalCards: cards.length },
          userData: data,
        }),
      }).then(r => r.json()).then(review => {
        if (review.userCoaching) {
          save({ settings: { ...data.settings, coaching: review.userCoaching, nextFocus: review.nextFocus, sessionCount } });
          setReviewCoaching(review.userCoaching);
        }
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
  const runFrames = ["/images/tinysenpai/run/1.png", "/images/tinysenpai/run/2.png", "/images/tinysenpai/run/3.png", "/images/tinysenpai/run/4.png"];
  // Auto-scroll to reveal Next button when an answer is submitted — avoids the "have to
  // scroll down" frustration when the reveal card pushes the Next button out of viewport.
  useEffect(() => {
    if (choiceAnswer && (choiceAnswer.correct !== null && choiceAnswer.correct !== undefined)) {
      const id = requestAnimationFrame(() => {
        const el = document.querySelector('[data-ts-next="true"]');
        if (el) el.scrollIntoView({ behavior: "smooth", block: "end" });
        else window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      });
      return () => cancelAnimationFrame(id);
    }
  }, [choiceAnswer?.correct]);

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
      <img src={runFrames[loadingFrame % 4]} alt="Senpai"
        style={{ width: 80, height: 80, imageRendering: "pixelated", marginBottom: 16 }} />
      <div style={{ fontSize: T.base, color: c.m }}>{loadingMsg}</div>
      <button onClick={() => { stopAudio(); setTab("home"); }} style={{ ...btn, marginTop: 24, padding: "8px 20px", borderRadius: 8, border: "1px solid " + c.b, background: "transparent", color: c.m, fontSize: T.sm }}>← cancel</button>
    </div>
  </div>;

  if (done) {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    const pct = score.c + score.w > 0 ? Math.round(score.c / (score.c + score.w) * 100) : 0;

    // Grade + mascot pose based on performance
    const grade = pct >= 90 ? { rank: "S", label: "Perfect!", img: "/images/tinysenpai/grades-strike/4.png", color: c.go }
      : pct >= 70 ? { rank: "A", label: "Great job!", img: "/images/tinysenpai/grades-strike/1.png", color: c.g }
      : pct >= 50 ? { rank: "B", label: "Keep going!", img: "/images/tinysenpai/grades-run/ts1.png", color: c.a }
      : { rank: "C", label: "Let's practice more", img: "/images/tinysenpai/tinysenpai2.png", color: c.m };

    // XP calculation
    const xpForRank = grade.rank === "S" ? 100 : grade.rank === "A" ? 60 : grade.rank === "B" ? 30 : 10;
    const xpForCorrect = score.c * 5;
    const xpGained = xpForRank + xpForCorrect;
    const prevXP = data.settings?.xp || 0;
    const newXP = prevXP + xpGained;
    const prevLevel = getLevel ? getLevel(prevXP) : 1;
    const newLevel = getLevel ? getLevel(newXP) : 1;
    const leveledUp = newLevel > prevLevel;

    // Auto-save difficulty adjustment + XP + S rank count + badges
    // Rolling accuracy tracking: keep last 5 session accuracies, target ~85%
    if (!sessionFeedback) {
      setTimeout(() => {
        const sRanks = (data.settings?.sRanks || 0) + (grade.rank === "S" ? 1 : 0);
        const sessionCount = (data.settings?.sessionCount || 0) + 1;

        // Rolling accuracy → adaptive difficulty (target: 80-88%, based on 85% rule)
        const recentAccuracy = [...(data.settings?.recentAccuracy || []), pct].slice(-5);
        const avgAccuracy = recentAccuracy.reduce((a, b) => a + b, 0) / recentAccuracy.length;
        // Smooth adjustment: too easy (>88%) → harder, too hard (<80%) → easier, in zone → no change
        let diffAdj = 0;
        let diffNote = "Right in the zone — optimal challenge level";
        if (avgAccuracy > 92) { diffAdj = -2; diffNote = "Too easy — increasing difficulty"; }
        else if (avgAccuracy > 88) { diffAdj = -1; diffNote = "Making it a bit harder next time"; }
        else if (avgAccuracy < 70) { diffAdj = 2; diffNote = "Tough stretch — easing off to rebuild confidence"; }
        else if (avgAccuracy < 80) { diffAdj = 1; diffNote = "Slightly too hard — adjusting down"; }

        setSessionFeedback(diffNote);

        const updatedSettings = { ...data.settings, sessionDifficulty: (data.settings?.sessionDifficulty || 0) + diffAdj, xp: newXP, sRanks, sessionCount, recentAccuracy };
        save({ settings: updatedSettings });
        // Check for new badges
        if (checkBadges) {
          const newBadges = checkBadges({ ...data, settings: updatedSettings });
          if (newBadges) save({ settings: { ...updatedSettings, badges: newBadges } });
        }
      }, 0);
    }

    return <div style={inner}>
      <div style={{ textAlign: "center", padding: "30px 20px" }}>
        {/* Mascot + Grade */}
        <img src={grade.img} alt="TinySenpai" style={{ width: 160, height: 160, imageRendering: "pixelated", marginBottom: 12 }} />
        <div style={{ fontSize: T.huge, fontWeight: 900, color: grade.color, fontFamily: mono, letterSpacing: "-.02em" }}>{grade.rank}</div>
        <h3 style={{ fontSize: T.xl, fontWeight: 700, margin: "6px 0 4px" }}>{grade.label}</h3>
        <div style={{ fontSize: T.sm, color: c.m }}>{pct}% correct</div>

        {/* Stats */}
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 20, marginBottom: 20 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: T.xxl, fontWeight: 700, color: c.g }}>{score.c}</div>
            <div style={{ fontSize: 10, color: c.m, fontFamily: mono }}>correct</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: T.xxl, fontWeight: 700, color: c.a }}>{score.w}</div>
            <div style={{ fontSize: 10, color: c.m, fontFamily: mono }}>missed</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: T.xxl, fontWeight: 700, color: c.m }}>{mins}:{secs.toString().padStart(2, "0")}</div>
            <div style={{ fontSize: 10, color: c.m, fontFamily: mono }}>time</div>
          </div>
        </div>

        {/* XP + Level */}
        <div style={{ marginTop: 4, marginBottom: 16 }}>
          <div style={{ fontSize: T.lg, fontWeight: 800, color: c.go, fontFamily: mono }}>+{xpGained} XP</div>
          {leveledUp && <div style={{ fontSize: T.sm, fontWeight: 700, color: c.a, marginTop: 4 }}>Level up! → Level {newLevel}</div>}
          {getXPForNext && <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
            <span style={{ fontSize: T.sm, color: c.m }}>Lv.{newLevel}</span>
            <div style={{ width: 120, height: 6, background: c.s2, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: (getXPForNext(newXP) ? Math.round((newXP - (LEVEL_THRESHOLDS?.[newLevel - 1] || 0)) / (getXPForNext(newXP) - (LEVEL_THRESHOLDS?.[newLevel - 1] || 0)) * 100) : 100) + "%", height: "100%", background: c.go, borderRadius: 3, transition: "width .5s" }} />
            </div>
            <span style={{ fontSize: T.sm, color: c.m }}>{getXPForNext(newXP) ? getXPForNext(newXP) - newXP + " to next" : "MAX"}</span>
          </div>}
        </div>

        {/* Difficulty note */}
        {sessionFeedback && <div style={{ fontSize: T.sm, color: grade.color, marginBottom: 16 }}>{sessionFeedback}</div>}

        {/* Struggled items */}
        {struggled.length > 0 && <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: T.sm, color: c.m, marginBottom: 6 }}>Struggled with:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, justifyContent: "center" }}>
            {struggled.map((item, i) => <span key={i} style={{ fontSize: T.base, padding: "3px 8px", borderRadius: 6, background: c.go + "12", border: "1px solid " + c.go + "28", color: c.go }}>{item.label}</span>)}
          </div>
        </div>}

        {/* MC focus prompt — show unmastered survival phrases */}
        {(() => {
          const mcUnmastered = PHRASES.filter(p => p[6] && (data.phr?.[p[0]]?.box || 0) < 3);
          if (mcUnmastered.length === 0) return null;
          const showSlice = mcUnmastered.slice(0, 4);
          return <div style={{ marginBottom: 16, padding: "12px 16px", background: c.go + "12", borderRadius: 10, border: "1px solid " + c.go + "33", textAlign: "left" }}>
            <div style={{ fontSize: T.xs, fontFamily: mono, color: c.go, textTransform: "uppercase", marginBottom: 8, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}><IconSparkle size={12}/> Survival phrases to focus on</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {showSlice.map(p => <span key={p[0]} style={{ fontSize: T.sm, padding: "4px 10px", borderRadius: 6, background: c.s, border: "1px solid " + c.b, color: c.tx }}>
                <span style={{ fontWeight: 600 }}>{p[1]}</span>
                <span style={{ color: c.m, marginLeft: 6 }}>{p[3]}</span>
              </span>)}
              {mcUnmastered.length > showSlice.length && <span style={{ fontSize: T.sm, color: c.m, padding: "4px 8px" }}>+{mcUnmastered.length - showSlice.length} more</span>}
            </div>
            <div style={{ fontSize: T.xs, color: c.m, marginTop: 8 }}>These are mission-critical for travel. Next session will keep drilling them.</div>
          </div>;
        })()}

        {/* AI coaching feedback */}
        {reviewCoaching && <div style={{ marginBottom: 16, padding: "12px 16px", background: c.s2, borderRadius: 10, border: "1px solid " + c.b, textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <img src="/images/tinysenpai/tinysenpai2.png" alt="" style={{ width: 24, height: 24, imageRendering: "pixelated" }} />
            <div style={{ fontSize: T.xs, fontFamily: mono, color: c.m, textTransform: "uppercase" }}>Senpai's feedback</div>
          </div>
          <div style={{ fontSize: T.base, color: c.tx, lineHeight: 1.6 }}>{reviewCoaching}</div>
        </div>}

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
          <button onClick={() => {
            // Build new session immediately
            setDone(false); setCi(0); setScore({ c: 0, w: 0 }); setStruggled([]); setFb(null); setInput(""); setChoiceAnswer(null); setSessionFeedback(null);
            setConvoAnswers({}); setConvoSubmitted(false); setStoryData(null); setBranchData(null);
            setLeechPhase("study"); setLeechInput(""); setLeechFb(null); setLeechPicked(null); setLeechChoices([]);
            setAssemblySlots([]); setAssemblyPool([]); setAssemblySubmitted(false);
            try {
              const session = buildSmartSession(data, 10, data.settings?.sessionDifficulty || 0);
              setCards(session.length > 0 ? session : []);
              if (session.length === 0) setDone(true);
            } catch (e) { console.error("Session build failed:", e); setDone(true); }
            setLoading(false);
          }}
            style={{ ...btn, padding: 14, borderRadius: 10, background: c.a, color: "#fff", fontSize: T.base, fontWeight: 600 }}>Continue →</button>
          <button onClick={() => { stopAudio(); setTab("home"); }}
            style={{ ...btn, padding: 14, borderRadius: 10, border: "1px solid " + c.b, background: "transparent", color: c.m, fontSize: T.sm }}>Done for now</button>
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

  // Response time — how long the user took to answer this card
  const getResponseMs = () => Date.now() - cardStartTime.current;

  const advance = (correct) => {
    stopAudio();
    senpaiReact(correct);
    if (!correct && ex.item) setStruggled(s => [...s, { label: typeof ex.item === 'string' ? ex.item : ex.item?.[1] || ex.type, type: ex.type }]);
    setFb(null); setInput(""); setChoiceAnswer(null);
    setConvoAnswers({}); setConvoSubmitted(false); setSelectedBlank(null); setDraggingId(null);
    setStoryData(null); setStoryAnswer(null); setStoryLoading(false);
    setBranchData(null); setBranchHistory([]); setBranchTurn(1); setBranchScore(0); setBranchLoading(false);
    setLeechPhase("study"); setLeechInput(""); setLeechFb(null); setLeechPicked(null); setLeechChoices([]);
    setAssemblySlots([]); setAssemblyPool([]); setAssemblySubmitted(false);
    setRomajiRevealed(false);
    setChainStep(0); setChainAnswers([]); setChainPicked(null);
    setKanaTyped([]); setKanaSubmitted(false); setKbTab(0); setKanaPrePhase("meaning"); setKanaMeaningWrong(false);
    setShadowState("idle"); setShadowResult(null);
    setMatchPicked(null); setMatchPairs([]); setMatchWrong(null);
    setHintAvailable(false); setHintShown(false);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHintAvailable(true), 15000);
    immersionTimers.current.forEach(t => clearTimeout(t)); immersionTimers.current = [];
    setImmersionIdx(-1); setImmersionTaps([]); setImmersionDone(false); setImmersionPlaying(false);
    cardStartTime.current = Date.now(); // Reset timer for next card
    if (ci + 1 >= cards.length) setDone(true);
    else setCi(ci + 1);
  };

  // ═══ SENPAI — mascot circle + reactions + expandable chat ═══
  const hoverQuips = ["What do you need from me?", "Speak. I don't have all day.", "Don't waste my time, student.", "...You have a question?", "Hurry up and ask already.", "This better be important.", "You dare interrupt my meditation?"];

  const senpaiBar = <div style={{ marginTop: 20 }}>
    {/* Chat panel — opens below mascot */}
    {chatOpen && <div style={{ background: c.s2, borderRadius: 14, border: "1px solid " + c.b, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid " + c.b }}>
        <img src="/images/tinysenpai/tinysenpai2.png" alt="Senpai" style={{ width: 32, height: 32, imageRendering: "pixelated" }} />
        <div style={{ flex: 1, fontSize: T.base, fontWeight: 600 }}>Senpai</div>
        <button onClick={() => { setChatOpen(false); setChatInput(""); }} style={{ ...btn, padding: "4px 8px", borderRadius: 6, background: "transparent", color: c.m, fontSize: T.sm }}>✕</button>
      </div>
      {chatMessages.length > 0 && <div style={{ maxHeight: 200, overflowY: "auto", padding: "12px 14px" }}>
        {chatMessages.slice(-4).map((m, i) => m.role === "user"
          ? <div key={i} style={{ textAlign: "right", marginBottom: 8 }}><span style={{ display: "inline-block", padding: "8px 12px", borderRadius: "10px 4px 10px 10px", background: c.a + "18", color: c.tx, fontSize: T.base, maxWidth: "75%" }}>{m.content}</span></div>
          : <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
              <img src="/images/tinysenpai/tinysenpai2.png" alt="" style={{ width: 28, height: 28, imageRendering: "pixelated", flexShrink: 0, marginTop: 2 }} />
              <span style={{ display: "inline-block", padding: "8px 12px", borderRadius: "4px 10px 10px 10px", background: c.s, color: c.tx, fontSize: T.base, lineHeight: 1.5, maxWidth: "80%" }}>{m.content}</span>
            </div>
        )}
        {chatLoading && <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "4px 0" }}>
          <img src="/images/tinysenpai/tinysenpai2.png" alt="" style={{ width: 24, height: 24, imageRendering: "pixelated" }} />
          <span style={{ fontSize: T.sm, color: c.m, fontStyle: "italic" }}>Thinking...</span>
        </div>}
      </div>}
      <div style={{ display: "flex", gap: 8, padding: "10px 14px", borderTop: chatMessages.length > 0 ? "1px solid " + c.b : "none" }}>
        <input ref={chatInputRef} value={chatInput} onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") sendChat(); if (e.key === "Escape") { setChatOpen(false); setChatInput(""); } }}
          placeholder="Ask Senpai anything..."
          style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid " + c.b, background: c.s, color: c.tx, fontSize: T.base, outline: "none" }} />
        <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} style={{ ...btn, padding: "8px 14px", borderRadius: 8, background: chatInput.trim() ? c.a : c.b, color: chatInput.trim() ? "#fff" : c.m, fontSize: T.sm, fontWeight: 600, flexShrink: 0 }}>→</button>
      </div>
    </div>}
    {/* Mascot circle — only when chat is closed */}
    {!chatOpen && <div style={{ display: "flex", justifyContent: "center" }}>
      <div style={{ position: "relative" }}>
        {(typingText || senpaiMsg) && <div style={{ position: "absolute", left: "100%", top: "50%", transform: "translateY(-50%)", marginLeft: 12, padding: "8px 14px", borderRadius: "4px 12px 12px 12px", background: c.s2, border: "1px solid " + c.b, fontSize: T.base, color: c.tx, fontWeight: 500, whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(0,0,0,.2)" }}>
          {typingText || senpaiMsg}
        </div>}
        <div onClick={() => { setChatOpen(true); setTimeout(() => chatInputRef.current?.focus(), 150); }}
          onMouseEnter={() => { setSenpaiHover(true); typeOut(hoverQuips[Math.floor(Math.random() * hoverQuips.length)]); }}
          onMouseLeave={() => { setSenpaiHover(false); if (typingRef.current) { clearInterval(typingRef.current); setSenpaiMsg(null); setTypingText(""); } }}
          style={{ width: 56, height: 56, borderRadius: 28, background: c.s2, border: "2px solid " + (senpaiHover ? c.a : c.b), display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "border-color .2s" }}>
          <img src={senpaiHover ? "/images/tinysenpai/grades-strike/1.png" : "/images/tinysenpai/tinysenpai2.png"} alt="Senpai"
            style={{ width: 44, height: 44, imageRendering: "pixelated" }} />
        </div>
      </div>
    </div>}
  </div>;

  // ═══ HEADER (shared across all exercise types) ═══
  const header = <>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
      <button onClick={() => { stopAudio(); setDone(true); }} style={{ ...btn, background: "none", color: c.m, fontFamily: mono, fontSize: T.sm, padding: "4px 0" }}>← exit</button>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: T.xs, fontFamily: mono, color: c.m }}>{ci + 1}/{cards.length}</div>
        <div style={{ fontSize: T.xs, fontFamily: mono, color: c.m }}>⏱ {mins}m</div>
      </div>
    </div>
    <div style={{ height: 4, background: c.b, borderRadius: 4, marginBottom: 20, overflow: "hidden" }}>
      <div style={{ height: "100%", width: progress + "%", background: c.a, borderRadius: 4, transition: "width .3s" }} />
    </div>
  </>;

  // Coaching plan banner — shown on first card only, dismissible
  const coachBanner = (ci === 0 && !coachDismissed && coachingPlan?.focus) ? <div style={{ marginBottom: 14, padding: "10px 14px", background: c.s2, borderRadius: 10, border: "1px solid " + c.b, display: "flex", alignItems: "center", gap: 10 }}>
    <img src="/images/tinysenpai/tinysenpai2.png" alt="" style={{ width: 28, height: 28, imageRendering: "pixelated", flexShrink: 0 }} />
    <div style={{ flex: 1, fontSize: T.base, color: c.tx, lineHeight: 1.4 }}>{coachingPlan.focus}</div>
    <button onClick={() => setCoachDismissed(true)} style={{ ...btn, padding: "2px 6px", borderRadius: 4, background: "transparent", color: c.m, fontSize: T.base, flexShrink: 0 }}>✕</button>
  </div> : null;

  const withSenpai = (content) => <div className="ts-session" style={inner}>{header}{coachBanner}{content}{senpaiBar}</div>;

  const EXERCISE_LABELS = {
    "learn-card": "NEW KANA",
    "learn-phrase": "NEW PHRASE",
    "try-first-kana": "CHALLENGE \u2014 TRY FIRST",
    "try-first-phrase": "CHALLENGE \u2014 TRY FIRST",
    "kana-visual": "READING PRACTICE",
    "kana-listen": "LISTENING PRACTICE",
    "kana-reverse": "PRODUCTION PRACTICE",
    "kana-pair": "VISUAL DISCRIMINATION",
    "phrase-scenario": "COMPREHENSION",
    "phrase-listen": "LISTENING PRACTICE",
    "phrase-reverse": "PRODUCTION PRACTICE",
    "phrase-production": "PRODUCTION PRACTICE",
    "phrase-pair": "PHRASE DISCRIMINATION",
    "phrase-build": "SENTENCE BUILDING",
    "pattern-assembly": "PATTERN BUILDING",
    "word-quiz": "VOCABULARY",
    "grammar-pattern": "GRAMMAR INSIGHT",
    "conversation": "CONVERSATION",
    "story": "READING COMPREHENSION",
    "graded-reader": "GRADED READER",
    "phrase-chain": "CONNECTED SPEECH",
    "phrase-kana-type": "KANA TYPING",
    "phrase-shadow": "SHADOW MODE",
    "phrase-dj": "PHRASE REMIX",
    "mistake-memory": "MISTAKE ANALYSIS",
    "immersion": "IMMERSION LISTENING",
    "number-match": "NUMBER MATCHING",
    "branch-convo": "CONVERSATION",
    "leech-review": "EXTRA REVIEW",
  };
  const typeLabel = <TypeLabel c={c}>{EXERCISE_LABELS[ex.type] || ex.type}</TypeLabel>;

  // Build hint text from the current exercise
  const buildHint = () => {
    if (ex.type === "phrase-scenario" || ex.type === "phrase-reverse" || ex.type === "phrase-production") {
      const p = ex.item;
      const segs = PHRASE_BREAKDOWNS[p?.[0]];
      if (segs?.[0]) return `Starts with ${segs[0][0]} (${segs[0][2]})`;
      return p?.[1]?.charAt(0) ? `Starts with ${p[1].charAt(0)}` : "Look at the scene image";
    }
    if (ex.type === "pattern-assembly") {
      return `Build the sentence meaning: "${ex.translation || ex.item?.[3] || ""}"`;
    }
    if (ex.type === "phrase-listen") {
      const p = ex.item;
      const segs = PHRASE_BREAKDOWNS[p?.[0]];
      if (segs?.[0]) return `First word: ${segs[0][0]} = ${segs[0][2]}`;
      return "Replay slowly and listen for familiar sounds";
    }
    if (ex.type === "phrase-kana-type") {
      const p = ex.item;
      const segs = PHRASE_BREAKDOWNS[p?.[0]];
      if (segs?.[0]) return `Starts with ${segs[0][0]}`;
      return p?.[1]?.charAt(0) || "Try the first character";
    }
    if (ex.type === "kana-visual" || ex.type === "kana-listen" || ex.type === "kana-reverse") {
      const m = M[ex.item];
      if (m) return `${m[0]} ${m[1]}`;
      return ex.romaji ? `Sounds like "${ex.romaji[0]}..."` : "Replay it";
    }
    return "Take your time and break it down";
  };

  // Romaji fading — progressive removal to force reading Japanese text directly
  // hideRomaji flag comes from sessionEngine based on SRS box level
  // Applied to choice buttons in phrase-scenario and phrase-reverse (where reading Japanese matters)
  const shouldHideRomaji = ex.hideRomaji && !romajiRevealed && !fb;

  // ═══ EXERCISE: KANA VISUAL ═══
  if (ex.type === "kana-visual") {
    const submit = () => {
      if (fb || !input.trim()) return;
      const ok = input.trim().toLowerCase() === ex.romaji;
      setFb(ok ? "ok" : "no");
      setScore(s => ok ? { ...s, c: s.c + 1 } : { ...s, w: s.w + 1 });
      updateKanaSRS(ex.item, ok, "kana-visual", getResponseMs());
      setTimeout(() => speak(ex.item), 250);
      setTimeout(() => advance(ok), ok ? (getResponseMs() < 1500 ? 1000 : 2000) : 4000); // Longer for wrong — study the image
    };
    const isHira = ex.item.charCodeAt(0) >= 0x3040 && ex.item.charCodeAt(0) <= 0x309F;
    const imgPath = `/images/mnemonics/approved/${isHira ? "hiragana" : "katakana"}/${ex.item.codePointAt(0).toString(16)}.png`;
    const m = M[ex.item];
    return withSenpai(<>
      {typeLabel}
      <div style={{ ...card, textAlign: "center", padding: "36px 20px", marginBottom: 16, background: fb === "ok" ? c.gs : fb === "no" ? c.rs : c.s, transition: "background .3s" }}>
        {!fb && <div style={{ fontSize: T.xs, fontFamily: mono, color: c.m, textTransform: "uppercase", marginBottom: 12 }}>What is this character?</div>}
        {fb ? <div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "center" }}>
            <div>
              <div style={{ fontSize: 100, lineHeight: 1, marginBottom: 8 }}>{ex.item}</div>
              <div style={{ fontSize: T.xxl, fontWeight: 700, color: fb === "ok" ? c.g : c.a, fontFamily: mono }}>{ex.romaji}</div>
              <div style={{ fontSize: T.sm, fontWeight: 600, color: fb === "ok" ? c.g : c.a, marginTop: 6 }}>{fb === "ok" ? "✓ Correct!" : "✗ Wrong"}</div>
            </div>
            <img src={imgPath} alt="" onError={e => { e.target.style.display = "none"; }} style={{ width: "45%", maxWidth: 200, borderRadius: 12 }} />
          </div>
          {m && <div style={{ fontSize: T.sm, color: c.m, marginTop: 12, fontStyle: "italic" }}>{m[0]} {m[1]}: {m[2]}</div>}
        </div>
        : <div style={{ fontSize: 130, lineHeight: 1, marginBottom: 16 }}>{ex.item}</div>}
      </div>
      {!fb && <div style={{ display: "flex", gap: 8 }}>
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") submit(); }}
          placeholder="romaji..." autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false"
          style={{ flex: 1, padding: "14px 16px", borderRadius: 10, border: "1px solid " + c.b, background: c.s2, color: c.tx, fontFamily: mono, fontSize: T.lg, outline: "none", textAlign: "center" }} />
        <button onClick={submit} style={{ ...btn, padding: "14px 22px", borderRadius: 10, background: input.trim() ? c.a : c.b, color: input.trim() ? "#fff" : c.m, fontSize: T.sm, fontWeight: 600 }}>Go</button>
      </div>}
    </>);
  }

  // ═══ EXERCISE: KANA LISTEN ═══
  if (ex.type === "kana-listen") {
    // Build character grid choices (stable — set once via choiceAnswer)
    if (!choiceAnswer) {
      const allKana = Object.keys(ROMAJI).filter(ch => ch !== ex.item);
      // Pick 7 distractors (mix of same script + different)
      const isHira = ex.item.charCodeAt(0) >= 0x3040 && ex.item.charCodeAt(0) <= 0x309F;
      const sameScript = allKana.filter(ch => isHira ? ch.charCodeAt(0) >= 0x3040 && ch.charCodeAt(0) <= 0x309F : ch.charCodeAt(0) >= 0x30A0);
      const distractors = shuffle(sameScript).slice(0, 7);
      const choices = stableChoices([ex.item, ...distractors]);
      setTimeout(() => setChoiceAnswer({ choices, selected: null }), 0);
      return null;
    }
    const answered = choiceAnswer.selected !== null;
    return withSenpai(<>
      {typeLabel}
      <div style={{ ...card, textAlign: "center", padding: "32px 24px", marginBottom: 16 }}>
        <div style={{ fontSize: T.xs, fontFamily: mono, color: c.m, textTransform: "uppercase", marginBottom: 10 }}>What did you hear?</div>
        <div style={{ fontSize: 52, marginBottom: 14 }}>👂</div>
        <button className="ts-icon-btn" onClick={() => speak(ex.item)} style={{ ...btn, padding: "8px 20px", borderRadius: 8, background: c.s2, border: "1px solid " + c.b, fontSize: T.sm, color: c.tx }}><IconPlay size={14}/> play again</button>
        {answered && <div style={{ marginTop: 16, borderTop: "1px solid " + c.b, paddingTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
            <div>
              <div style={{ fontSize: T.huge, lineHeight: 1 }}>{ex.item}</div>
              <div style={{ fontSize: T.lg, fontWeight: 700, color: choiceAnswer.selected === ex.item ? c.g : c.a, fontFamily: mono, marginTop: 4 }}>{ex.romaji}</div>
              <div style={{ fontSize: T.sm, color: c.m, marginTop: 2 }}>{choiceAnswer.selected === ex.item ? "✓ Correct!" : "✗ Wrong"}</div>
            </div>
            {(()=>{const isH=ex.item.charCodeAt(0)>=0x3040&&ex.item.charCodeAt(0)<=0x309F;return <img src={`/images/mnemonics/approved/${isH?"hiragana":"katakana"}/${ex.item.codePointAt(0).toString(16)}.png`} alt="" onError={e=>{e.target.style.display="none";}} style={{width:"35%",maxWidth:130,borderRadius:10}}/>;})()}
          </div>
        </div>}
      </div>
      {!answered && <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {choiceAnswer.choices.map((ch, i) => (
          <ChoiceCard key={i} c={c} btn={btn} align="center" onClick={() => {
            const ok = ch === ex.item;
            setChoiceAnswer({ ...choiceAnswer, selected: ch });
            setFb(ok ? "ok" : "no");
            setScore(s => ok ? { ...s, c: s.c + 1 } : { ...s, w: s.w + 1 });
            updateKanaSRS(ex.item, ok, "kana-listen", getResponseMs());
            setTimeout(() => advance(ok), ok ? (getResponseMs() < 1500 ? 1500 : 2500) : 4000);
          }}>
            <span style={{ fontSize: T.xxl, fontFamily: fontJa }}>{ch}</span>
          </ChoiceCard>
        ))}
      </div>}
      {answered && <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {choiceAnswer.choices.map((ch, i) => {
          const isCorrect = ch === ex.item;
          const isSelected = ch === choiceAnswer.selected;
          const bg = isCorrect ? c.g + "22" : isSelected ? c.a + "18" : "transparent";
          const border = isCorrect ? "2px solid " + c.g : isSelected ? "2px solid " + c.a : "1px solid " + c.b;
          const col = isCorrect ? c.g : isSelected ? c.a : c.m2 || c.m;
          return <div key={i} style={{ padding: "14px 8px", borderRadius: 10, border, background: bg, fontSize: T.xxl, fontFamily: fontJa, textAlign: "center", color: col }}>
            {ch}
          </div>;
        })}
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
      {typeLabel}
      <div style={{ ...card, padding: 0, marginBottom: 14 }}>
        {/* Scene image as situational context — reinforces dual coding during review */}
        <img src={`/images/phrases/scenes/${p[0]}.png`} alt={p[3]}
          style={{ width: "100%", height: isDesktop ? 200 : 160, objectFit: "cover", display: "block", borderRadius: "12px 12px 0 0" }}
          onError={e => { e.target.src = `/images/phrases/${p[4]}.png`; e.target.onerror = () => { e.target.style.display = "none"; }; }} />
        <div style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: T.base }}>{CAT_ICONS[p[4]]}</span>
            <span style={{ fontSize: T.sm, color: catCol, fontWeight: 600 }}>{CATS[p[4]]}</span>
          </div>
          <div style={{ fontSize: T.base, color: c.m2, marginBottom: 8 }}>{situations[p[4]]}</div>
          <div style={{ fontSize: T.lg, fontWeight: 600, color: c.tx }}>{p[3]}</div>
          {!answered && <div style={{ marginTop: 4 }}>
            <HintChip visible={hintAvailable} shown={hintShown} onReveal={() => setHintShown(true)} hintText={buildHint()} c={c} btn={btn} />
          </div>}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {choiceAnswer.choices.map((choice, i) => {
          const isCorrect = !choiceAnswer.isTrick && choice[0] === p[0];
          const isSelected = choiceAnswer.selected === choice[0];
          const state = answered && isCorrect ? "correct" : answered && isSelected && !isCorrect ? "wrong" : answered ? "dim" : "idle";
          return <ChoiceCard key={i} c={c} btn={btn} disabled={answered} state={state} onClick={() => {
            if (answered) return;
            const correct = isCorrect;
            setChoiceAnswer({ ...choiceAnswer, selected: choice[0], correct });
            setScore(s => correct ? { ...s, c: s.c + 1 } : { ...s, w: s.w + 1 });
            reviewPhr(p[0], correct, "phrase-scenario", getResponseMs());
            if (correct) speakPhraseWithEnglish(p[0], p[1], p[3]);
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: isDesktop ? T.xl : T.lg, fontFamily: fontJa, fontWeight: 700, lineHeight: 1.3 }}>{choice[1]}</div>
                {(answered || !shouldHideRomaji) && <div style={{ fontSize: T.sm, fontFamily: mono, color: answered ? (isCorrect ? c.g : c.m2) : c.ro, marginTop: 3, opacity: .9 }}>{choice[2]}</div>}
                {answered && <div style={{ fontSize: T.sm, color: c.m2, marginTop: 2 }}>{choice[3]}</div>}
              </div>
              {answered && <span onClick={(e) => { e.stopPropagation(); speakPhraseWithEnglish(choice[0], choice[1], choice[3]); }} className="ts-icon-btn"
                style={{ padding: "6px 10px", borderRadius: 8, background: c.s2, border: "1px solid " + c.b, color: c.tx, cursor: "pointer", flexShrink: 0, display: "inline-flex", alignItems: "center" }}><IconPlay size={14} /></span>}
            </div>
          </ChoiceCard>;
        })}
        <button onClick={() => {
          if (answered) return;
          const correct = !!choiceAnswer.isTrick;
          setChoiceAnswer({ ...choiceAnswer, selected: "none", correct });
          setScore(s => correct ? { ...s, c: s.c + 1 } : { ...s, w: s.w + 1 });
          reviewPhr(p[0], correct, ex.type, getResponseMs());
          speakPhraseWithEnglish(p[0], p[1], p[3]);
        }} className="ts-choice" disabled={answered} style={{ ...btn, padding: "14px 16px", borderRadius: 10, border: "2px dashed " + (answered ? c.b : c.a) + "66", background: answered && choiceAnswer.isTrick ? c.gs : answered && choiceAnswer.selected === "none" ? c.rs : c.a + "10", color: answered ? c.m2 : c.a, fontSize: T.base, fontWeight: 600, textAlign: "center", marginTop: 4, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <IconBlock size={16} /> <span>None of these match</span>
        </button>
        {answered && <div style={{ ...card, padding: "16px 20px", borderLeft: "3px solid " + c.g, marginTop: 8, overflow: "visible" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: T.xs, fontFamily: mono, color: c.g, marginBottom: 8, fontWeight: 600 }}><IconCheck size={12} /> <span>Correct answer</span></div>
          <PhraseSegments phraseId={p[0]} c={c} fontSize={isDesktop ? T.xl : T.lg} />
          <div style={{ fontSize: T.sm, fontFamily: mono, color: c.ro, marginTop: 8 }}>{p[2]}</div>
          <div style={{ fontSize: T.base, color: c.tx, marginTop: 4, fontWeight: 500 }}>{p[3]}</div>
        </div>}
        {answered && <ActionBar
          onPlay={() => speakPhraseWithEnglish(p[0], p[1], p[3])}
          onSlow={() => speakPhrase(p[0], p[1], { slow: true })}
          onNext={() => advance(choiceAnswer.correct)}
          c={c} btn={btn}
        />}
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
      {typeLabel}
      <div style={{ ...card, padding: 0, marginBottom: 14, overflow: "hidden" }}>
        {/* Scene image — full bleed when answered, hidden until then so it doesn't give away the phrase */}
        {answered && <img src={`/images/phrases/scenes/${p[0]}.png`} alt={p[3]}
          style={{ width: "100%", height: isDesktop ? 200 : 160, objectFit: "cover", display: "block" }}
          onError={e => { e.target.style.display = "none"; }} />}
        <div style={{ padding: "28px 20px", textAlign: "center", borderBottom: answered ? "1px solid " + c.b : "none" }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "radial-gradient(circle at 30% 30%, " + c.a + "22, " + c.a + "08)",
            border: "1px solid " + c.a + "33",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            color: c.a, marginBottom: 10,
          }}>
            <IconEar size={32} />
          </div>
          <div style={{ fontSize: T.md, color: c.tx, fontWeight: 600, marginBottom: 2 }}>What did you hear?</div>
          <div style={{ fontSize: T.sm, color: c.m2, marginBottom: 14 }}>Listen carefully, then pick the meaning.</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button onClick={() => speakPhrase(p[0], p[1])} className="ts-btn" style={{ ...btn, padding: "8px 16px", borderRadius: 999, background: c.s2, border: "1px solid " + c.b, fontSize: T.sm, color: c.tx, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <IconPlay size={14} /> play again
            </button>
            <button onClick={() => speakPhrase(p[0], p[1], { slow: true })} className="ts-btn" style={{ ...btn, padding: "8px 16px", borderRadius: 999, background: c.s2, border: "1px solid " + c.b, fontSize: T.sm, color: c.tx, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <IconSlowPlay size={14} /> slow
            </button>
          </div>
          {!answered && <div style={{ marginTop: 10 }}>
            <HintChip visible={hintAvailable} shown={hintShown} onReveal={() => setHintShown(true)} hintText={buildHint()} c={c} btn={btn} />
          </div>}
        </div>
        {answered && <div style={{ padding: "16px 20px" }}>
          <PhraseSegments phraseId={p[0]} c={c} fontSize={isDesktop ? T.xl : T.lg} />
          <div style={{ fontSize: T.sm, fontFamily: mono, color: c.ro, marginTop: 8 }}>{p[2]}</div>
          <div style={{ fontSize: T.base, color: c.tx, marginTop: 4 }}>{p[3]}</div>
        </div>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {choiceAnswer.choices.map((choice, i) => {
          const isCorrect = !choiceAnswer.isTrick && choice[0] === p[0];
          const isSelected = choiceAnswer.selected === choice[0];
          const state = answered && isCorrect ? "correct" : answered && isSelected && !isCorrect ? "wrong" : answered ? "dim" : "idle";
          return <ChoiceCard key={i} c={c} btn={btn} disabled={answered} state={state} onClick={() => {
            if (answered) return;
            const correct = isCorrect;
            setChoiceAnswer({ ...choiceAnswer, selected: choice[0], correct });
            setScore(s => correct ? { ...s, c: s.c + 1 } : { ...s, w: s.w + 1 });
            reviewPhr(p[0], correct, "phrase-listen", getResponseMs());
            if (correct) speakPhraseWithEnglish(p[0], p[1], p[3]);
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 500 }}>{choice[3]}</div>
                {answered && <div style={{ fontSize: T.md, color: c.m2, fontFamily: fontJa, marginTop: 3, fontWeight: 600 }}>{choice[1]}</div>}
              </div>
              {answered && <span onClick={(e) => { e.stopPropagation(); speakPhraseWithEnglish(choice[0], choice[1], choice[3]); }} className="ts-icon-btn"
                style={{ padding: "6px 10px", borderRadius: 8, background: c.s2, border: "1px solid " + c.b, color: c.tx, cursor: "pointer", flexShrink: 0, display: "inline-flex", alignItems: "center" }}><IconPlay size={14} /></span>}
            </div>
          </ChoiceCard>;
        })}
        <button onClick={() => {
          if (answered) return;
          const correct = !!choiceAnswer.isTrick;
          setChoiceAnswer({ ...choiceAnswer, selected: "none", correct });
          setScore(s => correct ? { ...s, c: s.c + 1 } : { ...s, w: s.w + 1 });
          reviewPhr(p[0], correct, "phrase-scenario", getResponseMs());
        }} className="ts-choice" disabled={answered} style={{ ...btn, padding: "14px 16px", borderRadius: 10, border: "2px dashed " + (answered ? c.b : c.a) + "66", background: answered ? "transparent" : c.a + "10", color: answered ? c.m2 : c.a, fontSize: T.base, fontWeight: 600, textAlign: "center", marginTop: 4, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <IconBlock size={16} /> <span>None of these match</span>
        </button>
        {answered && <ActionBar
          onPlay={() => speakPhraseWithEnglish(p[0], p[1], p[3])}
          onSlow={() => speakPhrase(p[0], p[1], { slow: true })}
          onNext={() => advance(choiceAnswer.correct)}
          c={c} btn={btn}
        />}
      </div>
    </>);
  }

  // ═══ EXERCISE: PHRASE PRODUCTION (8-choice multiple choice) ═══
  if (ex.type === "phrase-production") {
    const p = ex.item;
    const catCol = CAT_COLORS[p[4]];
    if (!choiceAnswer) {
      // Production requires the correct answer to be present — retrieval needs a target.
      // No trick mode here (unlike phrase-scenario, where absence tests situational robustness).
      const distractors = getDistractors(p, 7);
      const choices = stableChoices([p, ...distractors.slice(0, 7)]);
      setTimeout(() => setChoiceAnswer({ choices, selected: null, correct: null, isTrick: false }), 0);
      return null;
    }
    const answered = choiceAnswer.correct !== null && choiceAnswer.correct !== undefined;
    return withSenpai(<>
      {typeLabel}
      <div style={{ ...card, padding: "20px", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: T.sm }}>{CAT_ICONS[p[4]]}</span>
          <span style={{ fontSize: T.sm, color: catCol, fontWeight: 600 }}>Which phrase means...</span>
        </div>
        <div style={{ fontSize: T.lg, fontWeight: 600, color: c.tx, lineHeight: 1.5 }}>{p[3]}</div>
        {p[5] && <div style={{ fontSize: T.sm, color: c.m, fontStyle: "italic", marginTop: 6 }}>{p[5]}</div>}
        {!answered && <HintChip visible={hintAvailable} shown={hintShown} onReveal={() => setHintShown(true)} hintText={buildHint()} c={c} btn={btn} />}
      </div>
      {/* Before answer: full 8-choice grid. After answer: collapse to just correct + user's
         wrong pick (if any) — keeps the height stable so the Next button doesn't jump offscreen. */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {(answered
          ? choiceAnswer.choices.filter(choice => choice[0] === p[0] || choice[0] === choiceAnswer.selected)
          : choiceAnswer.choices
        ).map((choice, i) => {
          const isCorrect = !choiceAnswer.isTrick && choice[0] === p[0];
          const isSelected = choiceAnswer.selected === choice[0];
          const state = answered && isCorrect ? "correct" : answered && isSelected && !isCorrect ? "wrong" : answered ? "dim" : "idle";
          return <ChoiceCard key={choice[0]} c={c} btn={btn} disabled={answered} state={state} onClick={() => {
            if (answered) return;
            const correct = isCorrect;
            setChoiceAnswer({ ...choiceAnswer, selected: choice[0], correct });
            setScore(s => correct ? { ...s, c: s.c + 1 } : { ...s, w: s.w + 1 });
            reviewPhr(p[0], correct, ex.type, getResponseMs());
            if (correct) speakPhraseWithEnglish(p[0], p[1], p[3]);
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: fontJa, fontSize: isDesktop ? T.xl : T.lg, fontWeight: 700, lineHeight: 1.3 }}>{choice[1]}</div>
                {(answered || !shouldHideRomaji) && <div style={{ fontSize: T.sm, fontFamily: mono, color: c.ro, marginTop: 3 }}>{choice[2]}</div>}
                {answered && <div style={{ fontSize: T.sm, color: c.m2, marginTop: 2 }}>{choice[3]}</div>}
              </div>
              {answered && <span onClick={(e) => { e.stopPropagation(); speakPhraseWithEnglish(choice[0], choice[1], choice[3]); }} className="ts-icon-btn"
                style={{ padding: "4px 8px", borderRadius: 6, background: c.s2, border: "1px solid " + c.b, fontSize: T.sm, color: c.tx }}><IconPlay size={14}/></span>}
            </div>
          </ChoiceCard>;
        })}
      </div>
      {answered && <div style={{ ...card, padding: 0, borderLeft: "3px solid " + c.g, marginTop: 8, overflow: "hidden" }}>
        <img src={`/images/phrases/scenes/${p[0]}.png`} alt={p[3]}
          style={{ width: "100%", height: isDesktop ? 160 : 130, objectFit: "cover", display: "block" }}
          onError={e => { e.target.style.display = "none"; }} />
        <div style={{ padding: "14px 18px" }}>
          <div style={{ fontSize: T.xs, fontFamily: mono, color: c.g, marginBottom: 8 }}>✓ Correct answer</div>
          <PhraseSegments phraseId={p[0]} c={c} fontSize={isDesktop ? T.xl : T.lg} />
          <div style={{ fontSize: T.sm, fontFamily: mono, color: c.ro, marginTop: 6 }}>{p[2]}</div>
          <div style={{ fontSize: T.base, color: c.m, marginTop: 2 }}>{p[3]}</div>
        </div>
      </div>}
      {/* Show confused-word diff when wrong */}
      {answered && choiceAnswer.selected && choiceAnswer.selected !== "none" && choiceAnswer.selected !== p[0] && !choiceAnswer.isTrick && (() => {
        const wrongPhrase = PHRASES.find(pp => pp[0] === choiceAnswer.selected);
        const correctSegs = PHRASE_BREAKDOWNS[p[0]] || [];
        const wrongSegs = wrongPhrase ? (PHRASE_BREAKDOWNS[wrongPhrase[0]] || []) : [];
        const correctWords = correctSegs.map(s => s[0]);
        const wrongWords = wrongSegs.map(s => s[0]);
        const onlyInWrong = wrongSegs.filter(s => !correctWords.includes(s[0]));
        const onlyInCorrect = correctSegs.filter(s => !wrongWords.includes(s[0]));
        if (!onlyInWrong.length && !onlyInCorrect.length) return null;
        return <div style={{ ...card, padding: "12px 16px", marginTop: 8, borderLeft: "3px solid " + c.a }}>
          <div style={{ fontSize: T.xs, fontFamily: mono, color: c.ro, marginBottom: 6 }}>You picked: {wrongPhrase?.[3]}</div>
          <div style={{ fontSize: T.sm, color: c.m }}>
            <span style={{ color: c.a }}>Differs in: </span>
            {onlyInWrong.map(s => <span key={s[0]} style={{ background: c.a + "22", padding: "1px 5px", borderRadius: 4, marginRight: 4, color: c.a }}>{s[0]} ({s[2]})</span>)}
            {onlyInCorrect.length > 0 && <>
              <span style={{ color: c.g, marginLeft: 6 }}>vs correct: </span>
              {onlyInCorrect.map(s => <span key={s[0]} style={{ background: c.gs, padding: "1px 5px", borderRadius: 4, marginRight: 4, color: c.g }}>{s[0]} ({s[2]})</span>)}
            </>}
          </div>
        </div>;
      })()}
      {answered && <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button className="ts-icon-btn" onClick={() => speakPhraseWithEnglish(p[0], p[1], p[3])}
          style={{ ...btn, padding: 12, borderRadius: 10, background: c.s2, border: "1px solid " + c.b, color: c.tx, fontSize: T.sm }}><IconPlay size={14}/></button>
        <button className="ts-icon-btn" onClick={() => speakPhrase(p[0], p[1], { slow: true })}
          style={{ ...btn, padding: 12, borderRadius: 10, background: c.s2, border: "1px solid " + c.b, color: c.tx, fontSize: T.sm }}><IconSlowPlay size={14}/></button>
        <button className="ts-btn" onClick={() => advance(choiceAnswer.correct)}
          style={{ ...btn, flex: 2, padding: 12, borderRadius: 10, background: c.a, color: "#fff", fontSize: T.base, fontWeight: 600 }}>Next →</button>
      </div>}
    </>);
  }

  // ═══ EXERCISE: LEARN CARD (new kana) ═══
  if (ex.type === "learn-card") {
    const m = ex.mnemonic;
    const isHiragana = ex.item.charCodeAt(0) >= 0x3040 && ex.item.charCodeAt(0) <= 0x309F;
    const imgPath = `/images/mnemonics/approved/${isHiragana ? "hiragana" : "katakana"}/${ex.item.codePointAt(0).toString(16)}.png`;
    return withSenpai(<>
      {typeLabel}
      <div style={{ ...card, padding: "20px", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: "1 1 40%", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: isDesktop ? 100 : 80, lineHeight: 1 }}>{ex.item}</div>
            <div style={{ fontSize: isDesktop ? T.xxl : T.xl, fontWeight: 700, color: c.ro, fontFamily: mono }}>{ex.romaji}</div>
            <button className="ts-icon-btn" onClick={() => speak(ex.item)} style={{ ...btn, padding: "5px 10px", borderRadius: 8, background: c.s2, border: "1px solid " + c.b, fontSize: T.base, color: c.tx }}><IconPlay size={14}/></button>
          </div>
          <img src={imgPath} alt={m ? m[1] : ex.romaji} onError={e => { e.target.style.display = "none"; }}
            style={{ flex: "1 1 60%", maxWidth: "55%", borderRadius: 12, display: "block" }} />
        </div>
        {m && <div style={{ marginTop: 14, padding: "12px 16px", background: c.s2, borderRadius: 8, border: "1px solid " + c.b }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: T.lg }}>{m[0]}</span>
            <span style={{ fontSize: T.sm, fontWeight: 700 }}>{m[1]}</span>
          </div>
          <div style={{ fontSize: T.base, color: c.m, lineHeight: 1.5 }}>{m[3] || m[2]}</div>
        </div>}
        {KANA_WORDS[ex.item] && <div style={{ marginTop: 10, padding: "10px 14px", background: c.a + "08", borderRadius: 8, border: "1px solid " + c.a + "15" }}>
          <div style={{ fontSize: T.sm, color: c.a, fontWeight: 600, marginBottom: 6 }}>Words with {ex.item}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {KANA_WORDS[ex.item].map((w, i) => <span key={i} style={{ fontSize: T.base, color: c.tx }}>
              <span style={{ fontWeight: 600 }}>{w.word}</span> <span style={{ fontSize: T.sm, color: c.m }}>({w.meaning})</span>
            </span>)}
          </div>
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
      }} style={{ ...btn, width: "100%", padding: "8px 16px", borderRadius: 8, border: "1px solid " + c.b + "44", background: "transparent", color: c.m, fontSize: T.sm, marginBottom: 10 }}>✨ Make this mnemonic personal to me</button>}
      <div id="personal-mnemonic"></div>
      <button onClick={() => { updateKanaSRS(ex.item, true, "learn-card"); advance(true); setScore(s => ({ ...s, c: s.c + 1 })); }}
        style={{ ...btn, width: "100%", padding: 14, borderRadius: 10, background: c.a, color: "#fff", fontSize: T.base, fontWeight: 600 }}>Got it — Next →</button>
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
    // Detect yōon combinations and foreign loanword combos in this phrase
    // e.g. きょ (kyo), しゅ (shu), チェ (che) — explain them on first encounter
    const FOREIGN_COMBOS = { 'チェ': 'che', 'ティ': 'ti', 'ディ': 'di', 'ファ': 'fa', 'フィ': 'fi', 'フェ': 'fe', 'フォ': 'fo', 'ウィ': 'wi', 'ウェ': 'we', 'ウォ': 'wo' };
    const yoonInPhrase = [];
    Object.keys(YOON_PARTS).forEach(combo => {
      if (p[1].includes(combo)) yoonInPhrase.push({ combo, romaji: ROMAJI[combo] });
    });
    Object.entries(FOREIGN_COMBOS).forEach(([combo, rom]) => {
      if (p[1].includes(combo) && !yoonInPhrase.find(y => y.combo === combo)) {
        yoonInPhrase.push({ combo, romaji: rom, isSpecial: true });
      }
    });
    // Find confused pairs — show "don't mix up with..." when user already knows the partner
    const confusionNote = (() => {
      const phrData = data.phr || {};
      for (const cp of CONFUSED_PHRASES) {
        const idx = cp.ids.indexOf(p[0]);
        if (idx === -1) continue;
        const otherId = cp.ids[1 - idx];
        if (!phrData[otherId]) continue; // user hasn't learned the other phrase yet
        const otherP = PHRASES.find(pp => pp[0] === otherId);
        if (!otherP) continue;
        return { hint: cp.hint, other: otherP };
      }
      return null;
    })();
    // Autoplay on mount
    if (!fb) setTimeout(() => speakPhraseWithEnglish(p[0], p[1], p[3]), 500);
    return withSenpai(<>
      {typeLabel}
      <div style={{ ...card, padding: 0, marginBottom: 14 }}>
        {/* Phrase scene image — specific to this phrase, falls back to category */}
        <img src={`/images/phrases/scenes/${p[0]}.png`} alt={p[3]}
          style={{ width: "100%", height: isDesktop ? 200 : 160, objectFit: "cover", display: "block", borderRadius: "12px 12px 0 0" }}
          onError={e => { e.target.src = `/images/phrases/${p[4]}.png`; e.target.onerror = () => { e.target.style.display = "none"; }; }} />
        <div style={{ padding: "16px 20px", background: catCol + "12", borderBottom: "1px solid " + catCol + "22" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: T.base }}>{CAT_ICONS[p[4]]}</span>
            <span style={{ fontSize: T.base, color: catCol, fontWeight: 600 }}>{CATS[p[4]]}</span>
          </div>
          <div style={{ fontSize: T.sm, fontFamily: mono, color: c.tx, marginTop: 4 }}>Learn this phrase</div>
        </div>
        <div style={{ padding: "20px 20px" }}>
          <PhraseSegments phraseId={p[0]} c={c} fontSize={isDesktop ? T.xxl : T.xl} />
          <div style={{ fontSize: T.sm, fontFamily: mono, color: c.ro, marginTop: 8, marginBottom: 6 }}>{p[2]}</div>
          <div style={{ fontSize: T.base, color: c.tx, marginBottom: 4 }}>{p[3]}</div>
          {p[5] && <div style={{ fontSize: T.base, color: c.tx, marginTop: 10, padding: "10px 14px", background: c.s2, borderRadius: 8, borderLeft: "3px solid " + catCol }}>{p[5]}</div>}
          {familiarParts.length > 0 && <div style={{ marginTop: 10, padding: "10px 14px", background: c.as, borderRadius: 8, border: "1px solid " + c.a + "20" }}>
            <div style={{ fontSize: T.sm, color: c.a, fontWeight: 700, marginBottom: 6 }}>Familiar patterns</div>
            {familiarParts.slice(0, 2).map((fp, i) => <div key={i} style={{ fontSize: T.base, color: c.tx, marginBottom: 4 }}>
              <span style={{ fontWeight: 700, color: c.a, padding: "1px 5px", borderRadius: 4, background: c.a + "18" }}>{fp.block}</span>
              {blockMeaning[fp.block] && <span style={{ color: c.tx, fontSize: T.sm, marginLeft: 4 }}>{blockMeaning[fp.block]}</span>}
              <span style={{ color: c.m, fontSize: T.sm, marginLeft: 4 }}>— from "{fp.from}"</span>
            </div>)}
          </div>}
          {yoonInPhrase.length > 0 && <div style={{ marginTop: 10, padding: "10px 14px", background: c.s2, borderRadius: 8, border: "1px solid " + c.b }}>
            <div style={{ fontSize: T.sm, fontWeight: 700, color: c.tx, marginBottom: 8 }}>Combined kana in this phrase</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
              {yoonInPhrase.map(({ combo, romaji, isSpecial }) => <div key={combo} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: c.a + "10", border: "1px solid " + c.a + "22" }}>
                <span style={{ fontSize: T.xl, fontWeight: 700 }}>{combo}</span>
                <span style={{ fontSize: T.sm, fontFamily: mono, color: c.ro, fontWeight: 600 }}>{romaji}</span>
                {isSpecial && <span style={{ fontSize: T.xs, color: c.m, fontStyle: "italic" }}>loanword</span>}
              </div>)}
            </div>
            <div style={{ fontSize: T.xs, color: c.m, lineHeight: 1.5 }}>
              {yoonInPhrase.some(y => !y.isSpecial) && "Two kana that blend into one sound — a large kana + small や/ゆ/よ. "}
              {yoonInPhrase.some(y => y.isSpecial) && "Loanword combos use a large + small vowel kana for foreign sounds."}
            </div>
          </div>}
          {confusionNote && <div style={{ marginTop: 10, padding: "12px 14px", background: "#ff980008", borderRadius: 8, border: "1px solid #ff980025" }}>
            <div style={{ fontSize: T.sm, fontWeight: 700, color: "#ff9800", marginBottom: 8 }}>Don't mix up with...</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, padding: "8px 12px", background: c.s2, borderRadius: 8, border: "1px solid " + c.b }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: T.base, fontWeight: 600, color: c.tx }}>{confusionNote.other[1]}</div>
                <div style={{ fontSize: T.sm, color: c.m }}>{confusionNote.other[3]}</div>
              </div>
              <button onClick={e => { e.stopPropagation(); speakPhrase(confusionNote.other[0], confusionNote.other[1]); }}
                style={{ ...btn, padding: "4px 8px", borderRadius: 6, background: c.s2, border: "1px solid " + c.b, fontSize: T.sm, color: c.tx }}><IconPlay size={14}/></button>
            </div>
            <div style={{ fontSize: T.sm, color: c.tx, lineHeight: 1.5 }}>{confusionNote.hint}</div>
          </div>}
          <div style={{ fontSize: T.sm, color: c.m, marginTop: 10 }}>Tap each word to see what it means</div>
          <button onClick={e => { e.stopPropagation(); speakPhraseWithEnglish(p[0], p[1], p[3]); }}
            style={{ ...btn, width: "100%", padding: "10px 16px", borderRadius: 8, background: c.s2, border: "1px solid " + c.b, fontSize: T.sm, color: c.tx }}><IconPlay size={14}/> hear again</button>
        </div>
      </div>
      {/* Inline retrieval check — pick the right English meaning */}
      {(() => {
        const quizAnswered = storyAnswer !== null;
        // 2 distractor English meanings from same category
        const sameCat = PHRASES.filter(pp => pp[4] === p[4] && pp[0] !== p[0]);
        const distractors = shuffle(sameCat).slice(0, 1);
        if (distractors.length === 0) return null;
        const choices = (() => {
          if (!ex._learnQuizChoices) ex._learnQuizChoices = shuffle([p, ...distractors]);
          return ex._learnQuizChoices;
        })();
        return <div style={{ ...card, padding: "16px 20px", marginBottom: 12, borderLeft: "3px solid " + c.go }}>
          <div style={{ fontSize: T.xs, fontFamily: mono, color: c.go, textTransform: "uppercase", marginBottom: 8 }}>Quick check</div>
          <div style={{ fontSize: T.base, color: c.tx, marginBottom: 10 }}>What does <span style={{ fontWeight: 700 }}>{p[1]}</span> mean?</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {choices.map((choice, i) => {
              const isCorrect = choice[0] === p[0];
              const isPicked = storyAnswer === i;
              const state = quizAnswered && isCorrect ? "correct" : quizAnswered && isPicked && !isCorrect ? "wrong" : quizAnswered ? "dim" : "idle";
              return <ChoiceCard key={i} c={c} btn={btn} disabled={quizAnswered} state={state} onClick={() => {
                if (quizAnswered) return;
                setStoryAnswer(i);
              }}>{choice[3]}</ChoiceCard>;
            })}
          </div>
        </div>;
      })()}
      <button onClick={() => {
        const quizAnswered = storyAnswer !== null;
        const choices = ex._learnQuizChoices;
        const wasCorrect = quizAnswered && choices && choices[storyAnswer]?.[0] === p[0];
        reviewPhr(p[0], wasCorrect || !quizAnswered, "learn-phrase");
        setStoryAnswer(null);
        advance(true);
        setScore(s => ({ ...s, c: s.c + 1 }));
      }} style={{ ...btn, width: "100%", padding: 14, borderRadius: 10, background: c.a, color: "#fff", fontSize: T.base, fontWeight: 600 }}>Got it — Next →</button>
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
        <img src={runFrames[loadingFrame % 4]} alt="" style={{ width: 60, height: 60, imageRendering: "pixelated", marginBottom: 12 }} />
        <div style={{ fontSize: T.base, color: c.m }}>Setting the scene...</div>
      </div>
    </>);

    if (!branchData) return null;

    // Conversation ended
    if (branchData.isEnd) {
      return withSenpai(<>
        {typeLabel}
        <div style={{ ...card, padding: "24px 20px", marginBottom: 14 }}>
          <div style={{ fontSize: T.xs, fontFamily: mono, color: c.g, textTransform: "uppercase", marginBottom: 10 }}>Conversation Complete</div>
          {branchData.summary && <div style={{ fontSize: T.sm, color: c.tx, lineHeight: 1.6, marginBottom: 14 }}>{branchData.summary}</div>}
          {/* Show history */}
          {branchHistory.map((h, i) => <div key={i} style={{ marginBottom: 8, padding: "8px 12px", borderRadius: 8, background: h.quality === "best" ? c.gs : h.quality === "okay" ? c.go + "15" : c.rs, border: "1px solid " + (h.quality === "best" ? c.g + "33" : h.quality === "okay" ? c.go + "33" : c.a + "33") }}>
            <div style={{ fontSize: T.sm, fontWeight: 500 }}>{h.japanese}</div>
            <div style={{ fontSize: T.sm, color: c.m }}>{h.english} — {h.quality === "best" ? "✓ Perfect" : h.quality === "okay" ? "~ Okay" : "✗ Wrong"}</div>
          </div>)}
          <div style={{ textAlign: "center", marginTop: 12, fontSize: T.base, fontWeight: 700, color: c.a }}>{branchScore}/{branchHistory.length} best choices</div>
        </div>
        <button onClick={() => {
          setScore(s => ({ ...s, c: s.c + branchScore, w: s.w + (branchHistory.length - branchScore) }));
          setBranchData(null); setBranchHistory([]); setBranchTurn(1); setBranchScore(0);
          advance(branchScore >= branchHistory.length / 2);
        }} style={{ ...btn, width: "100%", padding: 14, borderRadius: 10, background: c.a, color: "#fff", fontSize: T.base, fontWeight: 600 }}>Continue →</button>
      </>);
    }

    return withSenpai(<>
      {typeLabel}
      <div style={{ ...card, padding: "20px", marginBottom: 14 }}>
        <div style={{ fontSize: T.xs, fontFamily: mono, color: c.go, textTransform: "uppercase", marginBottom: 10 }}>{scenario} — Turn {branchTurn}</div>
        {/* Scene description */}
        <div style={{ fontSize: T.base, color: c.m, marginBottom: 14, fontStyle: "italic" }}>{branchData.scene}</div>
        {/* NPC line */}
        {branchData.npcLine && <div style={{ padding: "12px 16px", background: c.s2, borderRadius: "4px 12px 12px 12px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ fontSize: T.xs, color: c.m, fontFamily: mono }}>{branchData.npcLine.speaker}</div>
            <div style={{ display: "flex", gap: 4 }}>
              <button className="ts-icon-btn" onClick={() => speak(branchData.npcLine.japanese)}
                style={{ ...btn, padding: "2px 8px", borderRadius: 6, background: "transparent", border: "1px solid " + c.b, fontSize: T.xs, color: c.tx }}><IconPlay size={14}/></button>
              <button onClick={() => { /* slow via playbackRate */
                const utt = new SpeechSynthesisUtterance(branchData.npcLine.japanese);
                utt.lang = "ja-JP"; utt.rate = 0.7;
                window.speechSynthesis?.speak(utt);
              }} style={{ ...btn, padding: "2px 8px", borderRadius: 6, background: "transparent", border: "1px solid " + c.b, fontSize: T.xs, color: c.tx }}><IconPlay size={14}/></button>
            </div>
          </div>
          <div style={{ fontSize: isDesktop ? T.xl : T.lg, fontWeight: 600, marginBottom: 4 }}>{branchData.npcLine.japanese}</div>
          <div style={{ fontSize: T.sm, fontFamily: mono, color: c.ro }}>{branchData.npcLine.romaji}</div>
          <div style={{ fontSize: T.base, color: c.m, marginTop: 4 }}>{branchData.npcLine.english}</div>
        </div>}
        <div style={{ fontSize: T.base, fontWeight: 600, color: c.tx, marginBottom: 10 }}>What do you say?</div>
      </div>
      {/* Response options — show feedback before advancing */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {branchData.options?.map((opt, i) => {
          const picked = branchHistory.length > 0 && branchHistory[branchHistory.length - 1] === opt;
          const anyPicked = branchData._picked !== undefined;
          const isThisPicked = branchData._picked === i;
          const qualityCol = opt.quality === "best" ? c.g : opt.quality === "okay" ? c.go : c.a;
          const qualityLabel = opt.quality === "best" ? "✓ Perfect" : opt.quality === "okay" ? "~ Okay — works but not ideal" : "✗ Not quite right";
          let bg = "transparent", border = c.b;
          if (anyPicked && isThisPicked) { bg = opt.quality === "best" ? c.gs : opt.quality === "okay" ? c.go + "15" : c.rs; border = qualityCol + "55"; }
          if (anyPicked && !isThisPicked && opt.quality === "best") { bg = c.gs; border = c.g + "44"; }
          return <button key={i} onClick={() => {
            if (anyPicked) return;
            // Show feedback on this turn before advancing
            setBranchData(d => ({ ...d, _picked: i }));
            if (opt.quality === "best") setBranchScore(s => s + 1);
            speak(opt.japanese);
          }} style={{ ...btn, padding: "14px 16px", borderRadius: 10, border: "1px solid " + border, background: bg, color: c.tx, textAlign: "left", transition: "all .15s", opacity: anyPicked && !isThisPicked && opt.quality !== "best" ? 0.5 : 1 }}>
            <div style={{ fontSize: isDesktop ? T.lg : T.base, fontWeight: 500, marginBottom: 4 }}>{opt.japanese}</div>
            <div style={{ fontSize: T.sm, fontFamily: mono, color: c.ro }}>{opt.romaji}</div>
            <div style={{ fontSize: T.sm, color: c.m, marginTop: 2 }}>{opt.english}</div>
            {anyPicked && (isThisPicked || opt.quality === "best") && <div style={{ fontSize: T.xs, fontWeight: 600, color: qualityCol, marginTop: 6 }}>{qualityLabel}</div>}
            {anyPicked && isThisPicked && opt.why && <div style={{ fontSize: T.sm, color: c.m, marginTop: 4, fontStyle: "italic" }}>{opt.why}</div>}
          </button>;
        })}
      </div>
      {branchData._picked !== undefined && <button onClick={() => {
        const opt = branchData.options[branchData._picked];
        setBranchHistory(h => [...h, opt]);
        setBranchData(null);
        setBranchTurn(t => t + 1);
      }} style={{ ...btn, width: "100%", padding: 14, borderRadius: 12, background: c.a, color: "#fff", fontSize: T.md, fontWeight: 600, marginTop: 12 }}>Next turn →</button>}
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
        <img src={runFrames[loadingFrame % 4]} alt="" style={{ width: 60, height: 60, imageRendering: "pixelated", marginBottom: 12 }} />
        <div style={{ fontSize: T.base, color: c.m }}>Senpai is writing a story for you...</div>
      </div>
    </>);

    if (!storyData) return null;

    const answered = storyAnswer !== null;
    const isCorrect = storyAnswer === storyData.comprehensionQuestion?.correctIndex;

    return withSenpai(<>
      {typeLabel}
      <div style={{ ...card, padding: "20px", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: T.xs, fontFamily: mono, color: c.g, textTransform: "uppercase" }}>{storyData.title}</div>
          <button onClick={() => {
            // Play all sentences sequentially
            let i = 0;
            const playNext = () => {
              if (i >= (storyData.sentences?.length || 0)) return;
              speak(storyData.sentences[i].japanese);
              i++;
              setTimeout(playNext, 3000);
            };
            playNext();
          }} style={{ ...btn, padding: "4px 12px", borderRadius: 8, background: c.s2, border: "1px solid " + c.b, fontSize: T.xs, color: c.tx }}><IconPlay size={14}/> read all</button>
        </div>
        {storyData.sentences?.map((s, i) => <div key={i} style={{ marginBottom: 14, display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: isDesktop ? T.xl : T.lg, fontWeight: 600, lineHeight: 1.5, marginBottom: 4 }}>{s.japanese}</div>
            <div style={{ fontSize: T.sm, fontFamily: mono, color: c.ro, marginBottom: 2 }}>{s.romaji}</div>
            <div style={{ fontSize: T.base, color: c.m }}>{s.english}</div>
          </div>
          <button className="ts-icon-btn" onClick={() => speak(s.japanese)} style={{ ...btn, padding: "6px 10px", borderRadius: 6, background: c.s2, border: "1px solid " + c.b, fontSize: T.sm, color: c.m, flexShrink: 0, marginTop: 4 }} aria-label="Play sentence"><IconPlay size={14}/></button>
        </div>)}
      </div>
      {/* Comprehension question */}
      {storyData.comprehensionQuestion && <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: T.sm, fontWeight: 600, color: c.tx, marginBottom: 10 }}>{storyData.comprehensionQuestion.question}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {storyData.comprehensionQuestion.options?.map((opt, i) => {
            const isThisCorrect = i === storyData.comprehensionQuestion.correctIndex;
            let bg = "transparent", border = c.b, col = c.tx;
            if (answered && isThisCorrect) { bg = c.gs; border = c.g + "60"; col = c.g; }
            if (answered && storyAnswer === i && !isCorrect) { bg = c.rs; border = c.a + "60"; col = c.a; }
            return <button key={i} onClick={() => {
              if (answered) return;
              setStoryAnswer(i);
              setFb(i === storyData.comprehensionQuestion.correctIndex ? "ok" : "no");
              setScore(s => (i === storyData.comprehensionQuestion.correctIndex) ? { ...s, c: s.c + 1 } : { ...s, w: s.w + 1 });
            }} style={{ ...btn, padding: "12px 16px", borderRadius: 10, border: "1px solid " + border, background: bg, color: col, fontSize: T.sm, textAlign: "left", transition: "all .2s" }}>
              {opt}
            </button>;
          })}
        </div>
        {/* Show explanation after answering — no more silent auto-advance */}
        {answered && <div style={{ ...card, padding: "14px 18px", marginTop: 12, borderLeft: "3px solid " + (isCorrect ? c.g : c.a) }}>
          <div style={{ fontSize: T.sm, fontWeight: 600, color: isCorrect ? c.g : c.a, marginBottom: 6 }}>
            {isCorrect ? "✓ Correct!" : "✗ The answer was: " + storyData.comprehensionQuestion.options[storyData.comprehensionQuestion.correctIndex]}
          </div>
          {storyData.comprehensionQuestion.explanation && <div style={{ fontSize: T.sm, color: c.m, lineHeight: 1.5 }}>{storyData.comprehensionQuestion.explanation}</div>}
          {!isCorrect && <div style={{ fontSize: T.sm, color: c.m, marginTop: 6, fontStyle: "italic" }}>Re-read the story above — the answer comes from the Japanese text.</div>}
        </div>}
        {answered && <button onClick={() => { setStoryData(null); setStoryAnswer(null); advance(isCorrect); }}
          style={{ ...btn, width: "100%", padding: 14, borderRadius: 12, background: c.a, color: "#fff", fontSize: T.md, fontWeight: 600, marginTop: 12 }}>Next →</button>}
      </div>}
    </>);
  }

  // ═══ EXERCISE: GRADED READER (pre-built stories) ═══
  if (ex.type === "graded-reader") {
    const gs = ex.story;
    const answered = storyAnswer !== null;
    const isCorrect = answered && storyAnswer === gs.comprehension.correctIndex;

    // Mark as seen on first render
    if (!storyData) {
      setStoryData(gs); // reuse storyData state to prevent re-marking
      const seen = data.gradedStoriesSeen || [];
      if (!seen.includes(gs.id)) {
        save({ gradedStoriesSeen: [...seen, gs.id] });
      }
    }

    // Play all sentences in sequence using TTS
    const playAll = () => {
      let i = 0;
      const playNext = () => {
        if (i >= gs.sentences.length) return;
        const s = gs.sentences[i];
        // Find matching phrase for pre-recorded audio
        const matchedPhrase = PHRASES.find(p => s.jp.replace(/[。？！、]/g, '').includes(p[1]));
        if (matchedPhrase) {
          speakPhrase(matchedPhrase[0], matchedPhrase[1]);
        } else {
          speak(s.jp);
        }
        i++;
        setTimeout(playNext, 2500);
      };
      playNext();
    };

    return withSenpai(<>
      {typeLabel}
      <div style={{ ...card, padding: "16px 20px", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: T.base }}>📖</span>
            <span style={{ fontSize: T.xs, fontFamily: mono, color: c.g, textTransform: "uppercase", fontWeight: 600 }}>{gs.title}</span>
          </div>
          <button onClick={playAll} style={{ ...btn, padding: "6px 14px", borderRadius: 8, background: c.s2, border: "1px solid " + c.b, fontSize: T.sm, color: c.tx }}><IconPlay size={14}/> hear it</button>
        </div>
        {/* Conversation-style bubbles */}
        {gs.sentences.map((s, i) => {
          const isEven = i % 2 === 0;
          return <div key={i} style={{ display: "flex", justifyContent: isEven ? "flex-start" : "flex-end", marginBottom: 10 }}>
            <div style={{
              maxWidth: "85%", padding: "12px 16px", borderRadius: 16,
              borderBottomLeftRadius: isEven ? 4 : 16,
              borderBottomRightRadius: isEven ? 16 : 4,
              background: isEven ? c.s2 : c.ac + "18",
              border: "1px solid " + (isEven ? c.b : c.ac + "30"),
            }}>
              <div style={{ fontSize: isDesktop ? T.lg : T.base, fontWeight: 600, lineHeight: 1.5, color: c.tx }}>{s.jp}</div>
              <div style={{ fontSize: T.xs, fontFamily: mono, color: c.ro, marginTop: 3 }}>{s.romaji}</div>
              <div style={{ fontSize: T.sm, color: c.m, marginTop: 2 }}>{s.en}</div>
            </div>
          </div>;
        })}
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: T.sm, fontWeight: 600, color: c.tx, marginBottom: 10 }}>{gs.comprehension.question}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {gs.comprehension.options.map((opt, i) => {
            const isThisCorrect = i === gs.comprehension.correctIndex;
            const state = answered && isThisCorrect ? "correct" : answered && storyAnswer === i && !isCorrect ? "wrong" : answered ? "dim" : "idle";
            return <ChoiceCard key={i} c={c} btn={btn} disabled={answered} state={state} onClick={() => {
              if (answered) return;
              setStoryAnswer(i);
              const ok = i === gs.comprehension.correctIndex;
              setScore(s => ok ? { ...s, c: s.c + 1 } : { ...s, w: s.w + 1 });
            }}>{opt}</ChoiceCard>;
          })}
        </div>
        {answered && <div style={{ ...card, padding: "14px 18px", marginTop: 12, borderLeft: "3px solid " + (isCorrect ? c.g : c.a) }}>
          <div style={{ fontSize: T.sm, fontWeight: 600, color: isCorrect ? c.g : c.a, marginBottom: 6 }}>
            {isCorrect ? "✓ Correct!" : "✗ The answer was: " + gs.comprehension.options[gs.comprehension.correctIndex]}
          </div>
          {gs.comprehension.explanation && <div style={{ fontSize: T.sm, color: c.m, lineHeight: 1.5 }}>{gs.comprehension.explanation}</div>}
        </div>}
        {/* Story continuation: after answering, pick a phrase to continue the story */}
        {answered && !convoSubmitted && (() => {
          // Pick 4 random known phrases as continuation options
          const knownIds = Object.keys(data.phr || {}).filter(id => (data.phr[id]?.box || 0) >= 1);
          const knownPhrases = PHRASES.filter(p => knownIds.includes(p[0]));
          if (knownPhrases.length < 3) return null;
          const options = shuffle(knownPhrases).slice(0, 4);
          return <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: T.xs, fontFamily: mono, color: c.ac, textTransform: "uppercase", marginBottom: 8 }}>✍️ What would you say next?</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {options.map((p, i) => (
                <ChoiceCard key={i} c={c} btn={btn} onClick={() => {
                  setConvoSubmitted(true);
                  speakPhrase(p[0], p[1]);
                }}>
                  <div style={{ fontFamily: fontJa, fontWeight: 700, fontSize: T.lg, lineHeight: 1.3 }}>{p[1]}</div>
                  <div style={{ fontSize: T.sm, color: c.m2, marginTop: 2 }}>{p[3]}</div>
                </ChoiceCard>
              ))}
            </div>
          </div>;
        })()}
        {answered && (convoSubmitted || !Object.keys(data.phr || {}).filter(id => (data.phr[id]?.box || 0) >= 1).length) && <button onClick={() => { setStoryData(null); setStoryAnswer(null); advance(isCorrect); }}
          style={{ ...btn, width: "100%", padding: 14, borderRadius: 12, background: c.a, color: "#fff", fontSize: T.md, fontWeight: 600, marginTop: 12 }}>Next →</button>}
        {answered && !convoSubmitted && Object.keys(data.phr || {}).filter(id => (data.phr[id]?.box || 0) >= 1).length >= 3 && <button onClick={() => { setStoryData(null); setStoryAnswer(null); advance(isCorrect); }}
          style={{ ...btn, width: "100%", padding: 10, borderRadius: 10, background: "transparent", border: "1px solid " + c.b + "44", color: c.m, fontSize: T.sm, marginTop: 8 }}>Skip →</button>}
      </div>
    </>);
  }

  // ═══ EXERCISE: SHADOW MODE (speak the phrase) ═══
  if (ex.type === "phrase-shadow") {
    const p = ex.item;
    // Safari has SpeechRecognition API but ja-JP support is unreliable — treat as unsupported
    const isSafari = typeof navigator !== "undefined" && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const hasAPI = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
    const supported = hasAPI && !isSafari;

    const startListening = () => {
      if (!supported) return;
      setShadowResult(null); // clear any prior error
      setShadowState("listening");
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = "ja-JP";
      recognition.interimResults = false;
      recognition.maxAlternatives = 3;
      let hasResult = false;
      recognition.onresult = (event) => {
        hasResult = true;
        const results = event.results[0];
        let bestTranscript = results[0].transcript;
        let matched = false;
        const target = p[1].replace(/[。？！、\s]/g, "");
        for (let i = 0; i < results.length; i++) {
          const t = results[i].transcript.replace(/[。？！、\s]/g, "");
          if (t === target || t.includes(target) || target.includes(t)) {
            bestTranscript = results[i].transcript;
            matched = true;
            break;
          }
        }
        if (!matched) {
          const targetChars = [...target];
          const spokenChars = [...bestTranscript.replace(/[。？！、\s]/g, "")];
          let matchCount = 0;
          for (const ch of spokenChars) {
            if (targetChars.includes(ch)) matchCount++;
          }
          matched = matchCount >= targetChars.length * 0.6;
        }
        setShadowResult({ transcript: bestTranscript, correct: matched, graded: true });
        setShadowState("done");
        setScore(s => matched ? { ...s, c: s.c + 1 } : { ...s, w: s.w + 1 });
        reviewPhr(p[0], matched, "phrase-shadow", getResponseMs());
        senpaiReact(matched);
        if (matched) speakPhrase(p[0], p[1]);
      };
      recognition.onerror = (e) => {
        // Don't mark wrong — mic errors, no speech etc shouldn't hurt SRS
        setShadowState("done");
        setShadowResult({
          transcript: e.error === "no-speech" ? "didn't hear you" : e.error === "not-allowed" ? "mic blocked" : "recognition error",
          correct: false, graded: false, errorType: e.error,
        });
      };
      recognition.onend = () => {
        if (!hasResult) {
          setShadowState("done");
          setShadowResult(r => r || { transcript: "didn't hear you", correct: false, graded: false });
        }
      };
      recognition.start();
      setTimeout(() => { try { recognition.stop(); } catch (e) {} }, 8000);
    };

    return withSenpai(<>
      {typeLabel}
      <div style={{ ...card, padding: "24px 20px", marginBottom: 14, textAlign: "center" }}>
        <div style={{ fontSize: T.xs, fontFamily: mono, color: c.m, textTransform: "uppercase", marginBottom: 10 }}>Listen, then say it out loud</div>
        <div style={{ fontSize: isDesktop ? T.xxl : T.xl, fontWeight: 700, lineHeight: 1.5, color: c.tx, marginBottom: 6 }}>{p[1]}</div>
        <div style={{ fontSize: T.sm, fontFamily: mono, color: c.ro, marginBottom: 4 }}>{p[2]}</div>
        <div style={{ fontSize: T.base, color: c.m, marginBottom: 16 }}>{p[3]}</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <button className="ts-icon-btn" onClick={() => speakPhrase(p[0], p[1])} style={{ ...btn, padding: "8px 20px", borderRadius: 8, background: c.s2, border: "1px solid " + c.b, fontSize: T.sm, color: c.tx }}><IconPlay size={14}/> hear it</button>
          <button className="ts-icon-btn" onClick={() => speakPhrase(p[0], p[1], { slow: true })} style={{ ...btn, padding: "8px 20px", borderRadius: 8, background: c.s2, border: "1px solid " + c.b, fontSize: T.sm, color: c.tx }}><IconSlowPlay size={14}/> slow</button>
        </div>
      </div>

      {/* Unsupported browser */}
      {!supported && <div style={{ ...card, padding: "16px 20px", textAlign: "center" }}>
        <div style={{ fontSize: T.sm, color: c.m, marginBottom: 12 }}>
          {isSafari ? "Safari doesn't support Japanese speech recognition. Open in Chrome for shadow mode, or skip."
            : "Speech recognition not supported. Use Chrome for shadow mode, or skip."}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { setScore(s => ({ ...s, c: s.c + 1 })); reviewPhr(p[0], true, "phrase-shadow", 3000); advance(true); }}
            style={{ ...btn, flex: 1, padding: "12px 24px", borderRadius: 10, background: c.a, color: "#fff", fontSize: T.base, fontWeight: 600 }}>I said it →</button>
          <button onClick={() => save({ settings: { ...data.settings, shadowDisabled: true } })}
            style={{ ...btn, padding: "12px 16px", borderRadius: 10, background: c.s2, border: "1px solid " + c.b, color: c.m, fontSize: T.sm }}>Turn off shadow mode</button>
        </div>
      </div>}

      {supported && shadowState === "idle" && !shadowResult && <>
        <button onClick={startListening}
          style={{ ...btn, width: "100%", padding: "18px 20px", borderRadius: 14, background: c.a, color: "#fff", fontSize: T.lg, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          🎤 Tap and say it
        </button>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button onClick={() => { setScore(s => ({ ...s, c: s.c + 1 })); reviewPhr(p[0], true, "phrase-shadow", 3000); advance(true); }}
            style={{ ...btn, flex: 1, padding: "10px 16px", borderRadius: 10, background: "transparent", border: "1px solid " + c.b + "44", color: c.m, fontSize: T.sm }}>Skip (I said it)</button>
          <button onClick={() => save({ settings: { ...data.settings, shadowDisabled: true } })}
            style={{ ...btn, padding: "10px 14px", borderRadius: 10, background: "transparent", border: "1px solid " + c.b + "44", color: c.m, fontSize: T.sm }}>🔕 turn off</button>
        </div>
      </>}

      {shadowState === "listening" && <div style={{ ...card, padding: "24px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 8, animation: "pulse 1.5s infinite" }}>🎤</div>
        <div style={{ fontSize: T.base, color: c.a, fontWeight: 600 }}>Listening...</div>
        <div style={{ fontSize: T.sm, color: c.m, marginTop: 6 }}>Say the phrase now</div>
      </div>}

      {shadowResult && shadowResult.graded && <div style={{ ...card, padding: "20px", textAlign: "center", borderLeft: "3px solid " + (shadowResult.correct ? c.g : c.a) }}>
        <div style={{ fontSize: T.lg, fontWeight: 700, color: shadowResult.correct ? c.g : c.a, marginBottom: 8 }}>
          {shadowResult.correct ? "✓ Great pronunciation!" : "✗ Not quite — try again"}
        </div>
        <div style={{ fontSize: T.sm, color: c.m, marginBottom: 4 }}>You said:</div>
        <div style={{ fontSize: T.lg, color: c.tx, marginBottom: 12 }}>{shadowResult.transcript}</div>
        {!shadowResult.correct && <div style={{ fontSize: T.sm, color: c.m }}>
          Target: <span style={{ color: c.g, fontWeight: 600 }}>{p[1]}</span>
        </div>}
      </div>}

      {/* Non-graded error: didn't hear, mic blocked, etc. No SRS impact. */}
      {shadowResult && !shadowResult.graded && <div style={{ ...card, padding: "18px 20px", textAlign: "center", borderLeft: "3px solid " + c.m }}>
        <div style={{ fontSize: T.base, fontWeight: 600, color: c.m, marginBottom: 6 }}>⚠️ {shadowResult.transcript}</div>
        <div style={{ fontSize: T.sm, color: c.m }}>
          {shadowResult.errorType === "not-allowed" ? "Allow mic access in browser settings, or skip below."
            : "Tap retry and speak right after the mic appears."}
        </div>
      </div>}

      {shadowResult && <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {supported && <button onClick={() => { setShadowResult(null); setShadowState("idle"); }}
          style={{ ...btn, padding: 12, borderRadius: 10, background: c.s2, border: "1px solid " + c.b, color: c.m, fontSize: T.sm }}>🔄 retry</button>}
        <button className="ts-icon-btn" onClick={() => speakPhrase(p[0], p[1], { slow: true })}
          style={{ ...btn, padding: 12, borderRadius: 10, background: c.s2, border: "1px solid " + c.b, color: c.tx, fontSize: T.sm }}><IconSlowPlay size={14}/></button>
        <button className="ts-btn" onClick={() => advance(shadowResult.correct)}
          style={{ ...btn, flex: 2, padding: 12, borderRadius: 10, background: c.a, color: "#fff", fontSize: T.base, fontWeight: 600 }}>{shadowResult.graded ? "Next →" : "Skip →"}</button>
      </div>}
    </>);
  }

  // ═══ EXERCISE: KANA TYPING (spell phrase with on-screen keyboard) ═══
  if (ex.type === "phrase-kana-type") {
    const p = ex.item;
    // Tokenize phrase into individual kana characters (skip non-kana like spaces, ？, ...)
    const targetChars = [...p[1]].filter(ch => /[\u3040-\u30FF]/.test(ch));

    // Scaffold: when user hasn't mastered this phrase yet (box < 4), first ask them
    // to recognize the meaning by picking English from 3 choices.
    // This primes recall + confirms they know what they're about to spell.
    const currentBox = data.phr?.[p[0]]?.box || 0;
    const needsScaffold = currentBox < 4;
    const showMeaningPick = needsScaffold && kanaPrePhase === "meaning";

    if (showMeaningPick) {
      // Build 3 English choices: correct + 2 distractors from same category
      const distractors = shuffle(
        PHRASES.filter(q => q[4] === p[4] && q[0] !== p[0])
      ).slice(0, 2);
      const choices = stableChoices([p, ...distractors]);

      const pickMeaning = (choice) => {
        if (choice[0] === p[0]) {
          setKanaPrePhase("spell");
          setKanaMeaningWrong(false);
        } else {
          setKanaMeaningWrong(true);
          // reveal correct then advance after 1.5s
          setTimeout(() => { setKanaPrePhase("spell"); setKanaMeaningWrong(false); }, 1500);
        }
      };

      return withSenpai(<>
        {typeLabel}
        <div style={{ ...card, padding: "20px", marginBottom: 14, textAlign: "center" }}>
          <div style={{ fontSize: T.xs, fontFamily: mono, color: c.m, textTransform: "uppercase", marginBottom: 8 }}>First — what does this mean?</div>
          <div style={{ fontSize: T.xxl, fontWeight: 700, color: c.tx, marginBottom: 8, fontFamily: font, lineHeight: 1.3 }}>{p[1]}</div>
          <div style={{ fontSize: T.base, fontFamily: mono, color: c.m }}>{p[2]}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {choices.map(q => {
            const isCorrect = q[0] === p[0];
            const state = kanaMeaningWrong && isCorrect ? "revealed" : kanaMeaningWrong ? "dim" : "idle";
            return <ChoiceCard key={q[0]} c={c} btn={btn} disabled={kanaMeaningWrong} state={state} onClick={() => pickMeaning(q)}>
              <span style={{ fontSize: T.md, fontWeight: 600 }}>{q[3]}</span>
            </ChoiceCard>;
          })}
        </div>
        {kanaMeaningWrong && <div style={{ textAlign: "center", marginTop: 10, fontSize: T.sm, color: c.m }}>
          Got it — now spell it out.
        </div>}
      </>);
    }

    // Leniency: compare with flexibility for common variations
    const isMatch = (typed, target) => {
      if (typed.length !== target.length) return false;
      for (let i = 0; i < typed.length; i++) {
        if (typed[i] === target[i]) continue;
        // は/わ leniency (particle は reads as wa)
        if (target[i] === "は" && typed[i] === "わ") continue;
        if (target[i] === "わ" && typed[i] === "は") continue;
        // を/お leniency (particle を sounds like o)
        if (target[i] === "を" && typed[i] === "お") continue;
        if (target[i] === "お" && typed[i] === "を") continue;
        // へ/え leniency (particle へ reads as e)
        if (target[i] === "へ" && typed[i] === "え") continue;
        if (target[i] === "え" && typed[i] === "へ") continue;
        // じ/ぢ (both "ji")
        if ((target[i] === "じ" || target[i] === "ぢ") && (typed[i] === "じ" || typed[i] === "ぢ")) continue;
        // ず/づ (both "zu")
        if ((target[i] === "ず" || target[i] === "づ") && (typed[i] === "ず" || typed[i] === "づ")) continue;
        return false;
      }
      return true;
    };

    // Build a flat character pool: all needed chars + distractors from same rows
    // No tabs — everything in one horizontal flowing grid
    const allHiragana = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん";
    const allDakuten = "がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ";
    const allKatakana = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";
    const allSpecial = "っー";

    // Get unique target characters
    const uniqueTarget = [...new Set(targetChars)];
    // Find row-mates for distractors (same consonant family)
    const hiraganaRows = ["あいうえお","かきくけこ","さしすせそ","たちつてと","なにぬねの","はひふへほ","まみむめも","やゆよ","らりるれろ","わをん"];
    const dakutenRowsArr = ["がぎぐげご","ざじずぜぞ","だぢづでど","ばびぶべぼ","ぱぴぷぺぽ"];
    const katakanaRowsArr = ["アイウエオ","カキクケコ","サシスセソ","タチツテト","ナニヌネノ","ハヒフヘホ","マミムメモ","ヤユヨ","ラリルレロ","ワヲン"];

    const getRowMates = (ch) => {
      for (const row of [...hiraganaRows, ...dakutenRowsArr, ...katakanaRowsArr]) {
        if (row.includes(ch)) return [...row].filter(c => c !== ch);
      }
      return [];
    };

    // Build pool: target chars + row-mates as distractors + some random extras
    const poolSet = new Set(uniqueTarget);
    // Add row-mates for each target char
    uniqueTarget.forEach(ch => getRowMates(ch).forEach(m => poolSet.add(m)));
    // Add special chars if needed
    if (targetChars.includes("っ")) poolSet.add("っ");
    if (targetChars.includes("ー")) poolSet.add("ー");
    // Ensure minimum pool size (~30 chars) by adding random hiragana
    const allChars = allHiragana + allDakuten + allKatakana + allSpecial;
    const shuffledAll = shuffle([...allChars]);
    for (const ch of shuffledAll) {
      if (poolSet.size >= 35) break;
      poolSet.add(ch);
    }
    // Sort by script order for clean layout
    const charPool = [...poolSet].sort((a, b) => {
      const order = allHiragana + allSpecial + allDakuten + allKatakana;
      return order.indexOf(a) - order.indexOf(b);
    });

    const handleSubmit = () => {
      if (kanaSubmitted || kanaTyped.length === 0) return;
      const ok = isMatch(kanaTyped, targetChars);
      setKanaSubmitted(true);
      setFb(ok ? "ok" : "no");
      setScore(s => ok ? { ...s, c: s.c + 1 } : { ...s, w: s.w + 1 });
      reviewPhr(p[0], ok, "phrase-kana-type", getResponseMs());
      if (ok) speakPhraseWithEnglish(p[0], p[1], p[3]);
      senpaiReact(ok);
    };

    return withSenpai(<>
      {typeLabel}
      {/* Prompt */}
      <div style={{ ...card, padding: "20px", marginBottom: 14, textAlign: "center" }}>
        <div style={{ fontSize: T.xs, fontFamily: mono, color: c.m, textTransform: "uppercase", marginBottom: 8 }}>Spell this phrase in kana</div>
        <div style={{ fontSize: T.lg, fontWeight: 700, color: c.tx, marginBottom: 4 }}>{p[3]}</div>
        <div style={{ fontSize: T.sm, fontFamily: mono, color: c.ro }}>{p[2]}</div>
      </div>

      {/* Typed characters display */}
      <div style={{ ...card, padding: "16px 12px", marginBottom: 12, minHeight: 56 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center", alignItems: "center", minHeight: 36 }}>
          {kanaTyped.length === 0 && !kanaSubmitted && <span style={{ fontSize: T.sm, color: c.m + "66" }}>tap kana below to spell...</span>}
          {kanaTyped.map((ch, i) => {
            let charColor = c.tx;
            if (kanaSubmitted) {
              charColor = i < targetChars.length && (ch === targetChars[i] || isMatch([ch], [targetChars[i]])) ? c.g : c.a;
            }
            return <span key={i} style={{
              display: "inline-block", padding: "4px 8px", borderRadius: 6,
              background: kanaSubmitted ? (charColor === c.g ? c.gs : c.rs) : c.s2,
              border: "1px solid " + (kanaSubmitted ? charColor + "40" : c.b),
              fontSize: T.xl, color: charColor, fontWeight: 600,
              transition: "all .2s",
            }}>{ch}</span>;
          })}
        </div>
        {/* Show correct answer when wrong */}
        {kanaSubmitted && fb === "no" && <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid " + c.b }}>
          <div style={{ fontSize: T.xs, fontFamily: mono, color: c.g, marginBottom: 6 }}>Correct:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center" }}>
            {targetChars.map((ch, i) => <span key={i} style={{ display: "inline-block", padding: "4px 8px", borderRadius: 6, background: c.gs, fontSize: T.xl, color: c.g, fontWeight: 600 }}>{ch}</span>)}
          </div>
        </div>}
      </div>

      {/* On-screen keyboard — horizontal flow, no tabs */}
      {!kanaSubmitted && <>
        {/* Hint chip — shows after 15s */}
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <HintChip visible={hintAvailable} shown={hintShown} onReveal={() => setHintShown(true)} hintText={buildHint()} c={c} btn={btn} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center" }}>
          {charPool.map((ch, i) =>
            <button key={i} onClick={() => setKanaTyped(t => [...t, ch])} style={{
              ...btn, width: isDesktop ? 46 : 40, height: isDesktop ? 44 : 40,
              borderRadius: 8, border: "1px solid " + c.b,
              background: uniqueTarget.includes(ch) ? c.s : c.s2,
              color: c.tx, fontSize: isDesktop ? T.lg : T.base,
              fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center",
            }}>{ch}</button>
          )}
        </div>
        {/* Action row */}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button onClick={() => setKanaTyped(t => t.slice(0, -1))} disabled={kanaTyped.length === 0}
            style={{ ...btn, flex: 1, padding: "12px 8px", borderRadius: 10, background: c.s2, border: "1px solid " + c.b, color: kanaTyped.length > 0 ? c.tx : c.m, fontSize: T.sm, fontWeight: 600, opacity: kanaTyped.length > 0 ? 1 : 0.4 }}>⌫ delete</button>
          <button onClick={handleSubmit} disabled={kanaTyped.length === 0}
            style={{ ...btn, flex: 2, padding: "12px 8px", borderRadius: 10, background: kanaTyped.length > 0 ? c.a : c.b, color: kanaTyped.length > 0 ? "#fff" : c.m, fontSize: T.base, fontWeight: 700, opacity: kanaTyped.length > 0 ? 1 : 0.5 }}>Check ✓</button>
        </div>
        {/* Escape hatch — show me + skip */}
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button onClick={() => { setKanaTyped(targetChars); setHintShown(true); }}
            style={{ ...btn, flex: 1, padding: "8px", borderRadius: 8, background: "transparent", border: "1px dashed " + c.b, color: c.m, fontSize: T.sm }}>👁 show answer</button>
          <button onClick={() => { setKanaSubmitted(true); setFb("no"); setScore(s => ({ ...s, w: s.w + 1 })); reviewPhr(p[0], false, "phrase-kana-type", getResponseMs()); }}
            style={{ ...btn, flex: 1, padding: "8px", borderRadius: 8, background: "transparent", border: "1px dashed " + c.b, color: c.m, fontSize: T.sm }}>⏭ skip this one</button>
        </div>
      </>}

      {/* Result + next button */}
      {kanaSubmitted && <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button className="ts-icon-btn" onClick={() => speakPhrase(p[0], p[1], { slow: true })}
          style={{ ...btn, padding: 12, borderRadius: 10, background: c.s2, border: "1px solid " + c.b, color: c.tx, fontSize: T.sm }}><IconSlowPlay size={14}/></button>
        <button className="ts-icon-btn" onClick={() => speakPhraseWithEnglish(p[0], p[1], p[3])}
          style={{ ...btn, padding: 12, borderRadius: 10, background: c.s2, border: "1px solid " + c.b, color: c.tx, fontSize: T.sm }}><IconPlay size={14}/></button>
        <button className="ts-btn" onClick={() => advance(fb === "ok")}
          style={{ ...btn, flex: 2, padding: 12, borderRadius: 10, background: c.a, color: "#fff", fontSize: T.base, fontWeight: 600 }}>Next →</button>
      </div>}
    </>);
  }

  // ═══ EXERCISE: NUMBER MATCH (tap-to-pair Japanese numbers ↔ numerals) ═══
  if (ex.type === "number-match") {
    // Build pool: known numbers + 1-2 distractors from unknowns to make harder
    const NUMERAL_MAP = { n1: "1", n2: "2", n3: "3", n4: "4", n5: "5", n6: "6", n7: "7", n8: "8", n9: "9", n10: "10" };
    const allNums = ["n1","n2","n3","n4","n5","n6","n7","n8","n9","n10"];
    const known = ex.numberIds || [];
    const unknown = allNums.filter(id => !known.includes(id));
    // Use up to 6 known + up to 2 distractors (to challenge)
    const roundIds = [...known.slice(0, 6), ...shuffle(unknown).slice(0, Math.min(2, 6 - Math.min(known.length, 6) + 2))].slice(0, 6);
    if (roundIds.length === 0) { advance(true); return null; }

    const phraseFor = id => PHRASES.find(p => p[0] === id);
    const matchedLeftIds = new Set(matchPairs.map(m => m.leftId));
    const matchedRightVals = new Set(matchPairs.map(m => m.rightVal));
    const allMatched = matchedLeftIds.size >= roundIds.length;

    // Stable shuffles per round (use roundIds as key)
    const leftItems = roundIds.map(id => ({ id, jp: phraseFor(id)?.[1] || id, romaji: phraseFor(id)?.[2] || "" }));
    const rightItems = shuffle([...roundIds]).map(id => ({ id, val: NUMERAL_MAP[id] }));

    const tryPair = (leftId, rightId) => {
      if (matchedLeftIds.has(leftId) || matchedRightVals.has(NUMERAL_MAP[rightId])) return;
      const correct = leftId === rightId;
      if (correct) {
        const phrase = phraseFor(leftId);
        if (phrase) speakPhrase(leftId, phrase[1]);
        setMatchPairs(p => [...p, { leftId, rightVal: NUMERAL_MAP[rightId], correct: true }]);
        setMatchPicked(null);
        reviewPhr(leftId, true, "number-match", getResponseMs());
        // All done?
        if (matchedLeftIds.size + 1 >= roundIds.length) {
          setScore(s => ({ ...s, c: s.c + 1 }));
          senpaiReact(true);
        }
      } else {
        setMatchWrong({ leftId, rightId });
        reviewPhr(leftId, false, "number-match", getResponseMs());
        setTimeout(() => { setMatchWrong(null); setMatchPicked(null); }, 800);
      }
    };

    return withSenpai(<>
      {typeLabel}
      <div style={{ ...card, padding: "16px 20px", marginBottom: 12, textAlign: "center" }}>
        <div style={{ fontSize: T.xl, marginBottom: 6 }}>🔢</div>
        <div style={{ fontSize: T.base, fontWeight: 700, color: c.tx, marginBottom: 4 }}>Match the numbers</div>
        <div style={{ fontSize: T.sm, color: c.m }}>Tap a Japanese word, then its number</div>
      </div>

      {!allMatched && <div style={{ display: "flex", gap: 10 }}>
        {/* Left column — Japanese */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          {leftItems.map(item => {
            const matched = matchedLeftIds.has(item.id);
            const picked = matchPicked === item.id;
            const wrong = matchWrong?.leftId === item.id;
            let bg = c.s2, border = c.b, col = c.tx;
            if (matched) { bg = c.gs; border = c.g + "60"; col = c.g; }
            if (picked) { bg = c.ac + "20"; border = c.ac; col = c.ac; }
            if (wrong) { bg = c.rs; border = c.a; col = c.a; }
            return <button key={item.id} disabled={matched}
              onClick={() => { if (!matched) setMatchPicked(item.id); }}
              style={{ ...btn, padding: "14px 12px", borderRadius: 10, border: "2px solid " + border, background: bg, color: col, fontSize: T.lg, fontWeight: 600, transition: "all .15s", opacity: matched ? 0.5 : 1 }}>
              <div>{item.jp}</div>
              {matched && <div style={{ fontSize: T.xs, fontFamily: mono, marginTop: 2, opacity: 0.7 }}>{item.romaji}</div>}
            </button>;
          })}
        </div>

        {/* Right column — numerals */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          {rightItems.map(item => {
            const matched = matchedRightVals.has(item.val);
            const wrong = matchWrong?.rightId === item.id;
            let bg = c.s2, border = c.b, col = c.tx;
            if (matched) { bg = c.gs; border = c.g + "60"; col = c.g; }
            if (wrong) { bg = c.rs; border = c.a; col = c.a; }
            return <button key={item.id + item.val} disabled={matched || !matchPicked}
              onClick={() => { if (matchPicked && !matched) tryPair(matchPicked, item.id); }}
              style={{ ...btn, padding: "14px 12px", borderRadius: 10, border: "2px solid " + border, background: bg, color: col, fontSize: T.xxl, fontWeight: 700, transition: "all .15s", opacity: matched ? 0.5 : matchPicked ? 1 : 0.6 }}>
              {item.val}
            </button>;
          })}
        </div>
      </div>}

      {/* Progress */}
      <div style={{ marginTop: 12, fontSize: T.sm, color: c.m, textAlign: "center" }}>
        {matchPairs.length} / {roundIds.length} matched
      </div>

      {allMatched && <div style={{ ...card, padding: "20px", marginTop: 14, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
        <div style={{ fontSize: T.lg, fontWeight: 700, color: c.tx, marginBottom: 4 }}>All matched!</div>
        <div style={{ fontSize: T.sm, color: c.m, marginBottom: 14 }}>Numbers are sticking. Keep going.</div>
        <button className="ts-btn" onClick={() => advance(true)}
          style={{ ...btn, width: "100%", padding: 14, borderRadius: 12, background: c.a, color: "#fff", fontSize: T.md, fontWeight: 600 }}>Next →</button>
      </div>}
    </>);
  }

  // ═══ EXERCISE: IMMERSION (contextual listening) ═══
  if (ex.type === "immersion") {
    const scene = ex.scene;
    const knownIds = new Set(Object.keys(data.phr || {}).filter(id => (data.phr[id]?.box || 0) >= 1));
    const currentPhrase = immersionIdx >= 0 && immersionIdx < scene.phraseIds.length
      ? PHRASES.find(p => p[0] === scene.phraseIds[immersionIdx]) : null;
    const currentTap = immersionTaps.find(t => t.idx === immersionIdx);
    const totalSteps = scene.phraseIds.length;
    const tappedCount = immersionTaps.filter(t => t.correct).length;
    const totalKnown = scene.phraseIds.filter(id => knownIds.has(id)).length;

    // Play current phrase
    const playCurrent = () => {
      if (!currentPhrase) return;
      speakPhrase(currentPhrase[0], currentPhrase[1]);
    };

    // Start scene — auto-plays first phrase
    const startScene = () => {
      setImmersionPlaying(true);
      setImmersionIdx(0);
      setTimeout(() => {
        const first = PHRASES.find(p => p[0] === scene.phraseIds[0]);
        if (first) speakPhrase(first[0], first[1]);
      }, 400);
    };

    // Respond: did I know this?
    const respond = (knew) => {
      const phraseId = scene.phraseIds[immersionIdx];
      const wasKnown = knownIds.has(phraseId);
      // Correct tap = said "yes I knew it" AND actually knows it (box >= 1)
      const correct = knew === wasKnown;
      setImmersionTaps(t => [...t, { idx: immersionIdx, knew, correct }]);
      // Don't auto-advance — user sees the answer then taps next
    };

    const advanceImmersion = () => {
      if (immersionIdx + 1 >= totalSteps) {
        setImmersionDone(true);
        setImmersionPlaying(false);
      } else {
        const nextIdx = immersionIdx + 1;
        setImmersionIdx(nextIdx);
        setTimeout(() => {
          const next = PHRASES.find(p => p[0] === scene.phraseIds[nextIdx]);
          if (next) speakPhrase(next[0], next[1]);
        }, 400);
      }
    };

    return withSenpai(<>
      <div style={{ fontSize: T.xs, fontFamily: mono, color: c.m, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>IMMERSION LISTENING</div>

      {/* Scene header */}
      <div style={{ ...card, padding: "16px 20px", marginBottom: 12, textAlign: "center" }}>
        <div style={{ fontSize: T.xl, marginBottom: 4 }}>{scene.emoji}</div>
        <div style={{ fontSize: T.base, fontWeight: 700, color: c.tx }}>{scene.title}</div>
      </div>

      {/* Setup — before starting */}
      {!immersionPlaying && !immersionDone && <>
        <div style={{ ...card, padding: "18px 20px", marginBottom: 12, borderLeft: "3px solid " + c.ac }}>
          <div style={{ fontSize: T.sm, fontWeight: 700, color: c.tx, marginBottom: 8, display: "inline-flex", alignItems: "center", gap: 6 }}><IconBulb size={14}/> How this works:</div>
          <div style={{ fontSize: T.sm, color: c.m2 || c.m, lineHeight: 1.6 }}>
            1. Listen to each phrase played out loud<br/>
            2. Before reveal, say if you recognized it<br/>
            3. Text appears after your answer — so you actually hear first<br/>
            4. Tap play anytime to replay
          </div>
        </div>
        <button onClick={startScene}
          style={{ ...btn, width: "100%", padding: "16px 32px", borderRadius: 14, background: c.a, color: "#fff", fontSize: T.lg, fontWeight: 700 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><IconPlay size={18}/> Start Scene</span>
        </button>
      </>}

      {/* Playing */}
      {immersionPlaying && currentPhrase && <>
        {/* Progress */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: T.xs, fontFamily: mono, color: c.m, marginBottom: 6 }}>
            <span>PHRASE {immersionIdx + 1} OF {totalSteps}</span>
            <span>✓ {tappedCount}</span>
          </div>
          <div style={{ width: "100%", height: 4, background: c.b, borderRadius: 2 }}>
            <div style={{ width: ((immersionIdx) / totalSteps * 100) + "%", height: "100%", background: c.ac, borderRadius: 2, transition: "width .3s" }} />
          </div>
        </div>

        {/* Audio card — hides text until answered */}
        <div style={{ ...card, padding: "28px 20px", marginBottom: 12, textAlign: "center" }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>👂</div>
          <div style={{ fontSize: T.sm, color: c.m, marginBottom: 16 }}>What did you hear?</div>
          <button onClick={playCurrent} className="ts-btn"
            style={{ ...btn, padding: "10px 28px", borderRadius: 10, background: c.s2, border: "1px solid " + c.b, fontSize: T.base, color: c.tx, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 8 }}>
            <IconPlay size={16}/> Play again
          </button>

          {/* Reveal text after answer */}
          {currentTap && <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid " + c.b }}>
            <div style={{ fontSize: isDesktop ? T.xl : T.lg, fontWeight: 700, color: c.tx, marginBottom: 4 }}>{currentPhrase[1]}</div>
            <div style={{ fontSize: T.sm, fontFamily: mono, color: c.ro, marginBottom: 2 }}>{currentPhrase[2]}</div>
            <div style={{ fontSize: T.base, color: c.m }}>{currentPhrase[3]}</div>
            <div style={{ fontSize: T.sm, marginTop: 10, color: currentTap.correct ? c.g : c.a, fontWeight: 600 }}>
              {currentTap.correct
                ? (currentTap.knew ? "✓ Right — you knew it!" : "✓ Right — you hadn't learned it yet")
                : (currentTap.knew ? "✗ You've seen this but it needed review" : "✗ Actually you do know this one")}
            </div>
          </div>}
        </div>

        {/* Response buttons — before answer */}
        {!currentTap && <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => respond(true)}
            style={{ ...btn, flex: 1, padding: "16px", borderRadius: 12, background: c.g + "18", border: "2px solid " + c.g + "40", color: c.g, fontSize: T.base, fontWeight: 700 }}>
            ✓ I know this one
          </button>
          <button onClick={() => respond(false)}
            style={{ ...btn, flex: 1, padding: "16px", borderRadius: 12, background: c.s2, border: "2px solid " + c.b, color: c.m, fontSize: T.base, fontWeight: 700 }}>
            ? Don't know
          </button>
        </div>}

        {/* Next button — after answer */}
        {currentTap && <button onClick={advanceImmersion}
          style={{ ...btn, width: "100%", padding: 14, borderRadius: 12, background: c.a, color: "#fff", fontSize: T.md, fontWeight: 600 }}>
          {immersionIdx + 1 >= totalSteps ? "Finish →" : "Next phrase →"}
        </button>}
      </>}

      {/* Results */}
      {immersionDone && <>
        <div style={{ ...card, padding: "20px", marginBottom: 14, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>
            {tappedCount >= totalSteps * 0.7 ? "🎉" : tappedCount >= totalSteps * 0.4 ? "👏" : "💪"}
          </div>
          <div style={{ fontSize: T.lg, fontWeight: 700, color: c.tx, marginBottom: 4 }}>
            {tappedCount}/{totalSteps} correct
          </div>
          <div style={{ fontSize: T.sm, color: c.m }}>
            You know {totalKnown} of {totalSteps} phrases in this scene
          </div>
        </div>
        <div style={{ ...card, padding: "16px 20px", marginBottom: 12 }}>
          <div style={{ fontSize: T.xs, fontFamily: mono, color: c.m, textTransform: "uppercase", marginBottom: 10 }}>All phrases in scene:</div>
          {scene.phraseIds.map((id, i) => {
            const phrase = PHRASES.find(p => p[0] === id);
            if (!phrase) return null;
            const known = knownIds.has(id);
            return <div key={i} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 12px", marginBottom: 4, borderRadius: 8,
              background: known ? c.gs : c.s2,
              borderLeft: "3px solid " + (known ? c.g : c.m + "44"),
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: T.base, fontWeight: 600, color: c.tx }}>{phrase[1]}</div>
                <div style={{ fontSize: T.sm, fontFamily: mono, color: c.ro }}>{phrase[2]}</div>
                <div style={{ fontSize: T.sm, color: c.m }}>{phrase[3]}</div>
              </div>
              <button className="ts-icon-btn" onClick={() => speakPhrase(id, phrase[1])}
                style={{ ...btn, padding: "8px 12px", borderRadius: 6, background: c.s, border: "1px solid " + c.b, fontSize: T.base, color: c.tx }}><IconPlay size={14}/></button>
            </div>;
          })}
        </div>
        <button className="ts-btn" onClick={() => advance(tappedCount >= totalSteps * 0.5)}
          style={{ ...btn, width: "100%", padding: 14, borderRadius: 12, background: c.a, color: "#fff", fontSize: T.md, fontWeight: 600 }}>Next →</button>
      </>}
    </>);
  }

  // ═══ EXERCISE: PHRASE DJ (AI remixed phrases) ═══
  if (ex.type === "phrase-dj") {
    if (!storyData && !storyLoading) {
      setStoryLoading(true);
      fetch('/api/remix', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ knownPhrases: ex.knownPhrases }),
      }).then(r => r.json()).then(result => {
        if (result.remixes) setStoryData(result);
        else advance(true);
        setStoryLoading(false);
      }).catch(() => { advance(true); setStoryLoading(false); });
    }

    if (storyLoading) return withSenpai(<>
      <div style={{ ...card, textAlign: "center", padding: "40px 20px" }}>
        <img src={runFrames[loadingFrame % 4]} alt="" style={{ width: 60, height: 60, imageRendering: "pixelated", marginBottom: 12 }} />
        <div style={{ fontSize: T.base, color: c.m }}>Senpai is remixing your vocabulary...</div>
      </div>
    </>);

    if (!storyData?.remixes) return null;

    // Quiz on first remix (active retrieval, not passive read)
    const quizRemix = storyData.remixes[0];
    const quizDistractors = storyData.remixes.slice(1, 4).map(r => r.jp);
    while (quizDistractors.length < 3) {
      const random = ex.knownPhrases?.[Math.floor(Math.random() * ex.knownPhrases.length)];
      if (random && !quizDistractors.includes(random.jp) && random.jp !== quizRemix.jp) quizDistractors.push(random.jp);
      else break;
    }
    const quizChoices = (() => {
      // Stable shuffle per render — use storyData reference
      if (!storyData._quizChoices) storyData._quizChoices = shuffle([quizRemix.jp, ...quizDistractors]);
      return storyData._quizChoices;
    })();
    const quizAnswered = storyAnswer !== null;

    return withSenpai(<>
      {typeLabel}
      <div style={{ ...card, padding: "16px 20px", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: T.xl }}>🎧</span>
          <div>
            <div style={{ fontSize: T.base, fontWeight: 700, color: c.tx }}>Phrase Remix</div>
            <div style={{ fontSize: T.sm, color: c.m }}>New phrases built from words you know</div>
          </div>
        </div>
        {storyData.remixes.map((remix, i) => <div key={i} style={{
          padding: "14px 16px", marginBottom: 10, borderRadius: 12,
          background: c.s2, border: "1px solid " + c.b,
        }}>
          <div style={{ fontSize: isDesktop ? T.xl : T.lg, fontWeight: 600, lineHeight: 1.5, color: c.tx, marginBottom: 4 }}>{remix.jp}</div>
          <div style={{ fontSize: T.sm, fontFamily: mono, color: c.ro, marginBottom: 2 }}>{remix.romaji}</div>
          <div style={{ fontSize: T.base, color: c.m }}>{remix.en}</div>
          {remix.components && <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
            {remix.components.map((comp, j) => <span key={j} style={{ padding: "2px 8px", borderRadius: 6, background: c.ac + "18", fontSize: T.xs, color: c.ac }}>{comp}</span>)}
          </div>}
          <button className="ts-icon-btn" onClick={() => speak(remix.jp)} style={{ ...btn, marginTop: 8, padding: "4px 14px", borderRadius: 6, background: c.s, border: "1px solid " + c.b, fontSize: T.sm, color: c.tx }}><IconPlay size={14}/></button>
        </div>)}
      </div>

      {/* Active retrieval quiz on the first remix */}
      <div style={{ ...card, padding: "16px 20px", marginBottom: 14, borderLeft: "3px solid " + c.go }}>
        <div style={{ fontSize: T.xs, fontFamily: mono, color: c.go, textTransform: "uppercase", marginBottom: 8 }}>Quick check</div>
        <div style={{ fontSize: T.base, color: c.tx, marginBottom: 12 }}>How would you say: <span style={{ fontWeight: 700 }}>"{quizRemix.en}"</span>?</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {quizChoices.map((choice, i) => {
            const isCorrect = choice === quizRemix.jp;
            const isPicked = storyAnswer === i;
            let bg = "transparent", border = c.b, col = c.tx;
            if (quizAnswered && isCorrect) { bg = c.gs; border = c.g + "55"; col = c.g; }
            if (quizAnswered && isPicked && !isCorrect) { bg = c.rs; border = c.a + "55"; col = c.a; }
            return <button key={i} onClick={() => {
              if (quizAnswered) return;
              setStoryAnswer(i);
              setScore(s => isCorrect ? { ...s, c: s.c + 1 } : { ...s, w: s.w + 1 });
              if (isCorrect) speak(choice);
            }} style={{ ...btn, padding: "12px 16px", borderRadius: 8, border: "1px solid " + border, background: bg, color: col, fontSize: T.base, textAlign: "left" }}>{choice}</button>;
          })}
        </div>
      </div>

      <button onClick={() => { setStoryData(null); setStoryLoading(false); setStoryAnswer(null); advance(true); }}
        style={{ ...btn, width: "100%", padding: 14, borderRadius: 12, background: c.a, color: "#fff", fontSize: T.md, fontWeight: 600 }}>{quizAnswered ? "Next →" : "Skip quiz — Next →"}</button>
    </>);
  }

  // ═══ EXERCISE: MISTAKE MEMORY (AI error analysis) ═══
  if (ex.type === "mistake-memory") {
    if (!storyData && !storyLoading) {
      setStoryLoading(true);
      const errorPatterns = ex.errorItems.map(e => ({
        item: e.item, correct: e.correct, wrong: "unknown", count: e.count,
      }));
      fetch('/api/remix', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errorPatterns }),
      }).then(r => r.json()).then(result => {
        if (result.analysis || result.tip) setStoryData(result);
        else advance(true);
        setStoryLoading(false);
      }).catch(() => { advance(true); setStoryLoading(false); });
    }

    if (storyLoading) return withSenpai(<>
      <div style={{ ...card, textAlign: "center", padding: "40px 20px" }}>
        <img src={runFrames[loadingFrame % 4]} alt="" style={{ width: 60, height: 60, imageRendering: "pixelated", marginBottom: 12 }} />
        <div style={{ fontSize: T.base, color: c.m }}>Senpai is analyzing your mistakes...</div>
      </div>
    </>);

    if (!storyData) return null;

    return withSenpai(<>
      <div style={{ fontSize: T.xs, fontFamily: mono, color: c.ro, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>MISTAKE ANALYSIS</div>
      <div style={{ ...card, padding: "20px", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: T.xl }}>🧠</span>
          <div style={{ fontSize: T.base, fontWeight: 700, color: c.tx }}>Senpai noticed a pattern</div>
        </div>
        {/* Error items */}
        <div style={{ marginBottom: 14 }}>
          {ex.errorItems.map((e, i) => <div key={i} style={{
            padding: "8px 12px", marginBottom: 6, borderRadius: 8,
            background: c.rs, border: "1px solid " + c.a + "30",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <span style={{ fontSize: T.base, fontWeight: 600, color: c.tx }}>{e.item}</span>
              <span style={{ fontSize: T.sm, color: c.m, marginLeft: 8 }}>{e.correct}</span>
            </div>
            <span style={{ fontSize: T.xs, color: c.a }}>{e.count} errors</span>
          </div>)}
        </div>
        {/* AI Analysis */}
        {storyData.analysis && <div style={{ fontSize: T.sm, color: c.tx, lineHeight: 1.7, marginBottom: 14, whiteSpace: "pre-wrap" }}>
          {storyData.analysis}
        </div>}
        {storyData.tip && <div style={{
          padding: "12px 16px", borderRadius: 10, background: c.ac + "12",
          border: "1px solid " + c.ac + "30",
        }}>
          <div style={{ fontSize: T.xs, fontFamily: mono, color: c.go, marginBottom: 4, display: "inline-flex", alignItems: "center", gap: 4 }}><IconBulb size={12}/> TIP</div>
          <div style={{ fontSize: T.base, color: c.tx, fontWeight: 600 }}>{storyData.tip}</div>
        </div>}
      </div>
      <button onClick={() => { setStoryData(null); setStoryLoading(false); advance(true); }}
        style={{ ...btn, width: "100%", padding: 14, borderRadius: 12, background: c.a, color: "#fff", fontSize: T.md, fontWeight: 600 }}>I understand — Next →</button>
    </>);
  }

  // ═══ EXERCISE: PHRASE CHAIN (connected speech) ═══
  if (ex.type === "phrase-chain") {
    const chain = ex.chain;
    const totalSteps = chain.steps.length;
    const allDone = chainStep >= totalSteps;
    const currentStep = !allDone ? chain.steps[chainStep] : null;
    const correctCount = chainAnswers.filter(a => a.correct).length;

    // Build shuffled choices for current step (stable per step via chainStep as key)
    const choices = currentStep ? (() => {
      const correctPhrase = PHRASES.find(p => p[0] === currentStep.correctId);
      const distractors = currentStep.distractorIds.map(id => PHRASES.find(p => p[0] === id)).filter(Boolean);
      return shuffle([correctPhrase, ...distractors]);
    })() : [];

    const stepAnswered = chainPicked !== null;

    return withSenpai(<>
      {typeLabel}
      {/* Scenario header */}
      <div style={{ ...card, padding: "16px 20px", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: T.xl }}>{chain.emoji}</span>
          <div>
            <div style={{ fontSize: T.base, fontWeight: 700, color: c.tx }}>{chain.title}</div>
            <div style={{ fontSize: T.sm, color: c.m }}>{chain.description}</div>
          </div>
        </div>
        {/* Progress dots */}
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          {chain.steps.map((_, i) => {
            const done = i < chainAnswers.length;
            const isCorrect = done && chainAnswers[i]?.correct;
            const isCurrent = i === chainStep && !allDone;
            return <div key={i} style={{
              width: 24, height: 6, borderRadius: 3,
              background: done ? (isCorrect ? c.g : c.a) : isCurrent ? c.ac : c.b,
              transition: "all .3s",
            }} />;
          })}
        </div>
      </div>

      {/* Completed steps trail */}
      {chainAnswers.length > 0 && <div style={{ marginBottom: 12 }}>
        {chainAnswers.map((ans, i) => {
          const step = chain.steps[i];
          const phrase = PHRASES.find(p => p[0] === step.correctId);
          return <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", marginBottom: 4, borderRadius: 8, background: ans.correct ? c.gs : c.rs, opacity: 0.8 }}>
            <span style={{ fontSize: T.sm }}>{ans.correct ? "✓" : "✗"}</span>
            <div>
              <div style={{ fontSize: T.sm, fontWeight: 600, color: c.tx }}>{phrase?.[1]}</div>
              <div style={{ fontSize: T.xs, color: c.m }}>{step.context}</div>
            </div>
          </div>;
        })}
      </div>}

      {/* Current step */}
      {!allDone && currentStep && <>
        <div style={{ ...card, padding: "16px 20px", marginBottom: 12, borderLeft: "3px solid " + c.ac }}>
          <div style={{ fontSize: T.xs, fontFamily: mono, color: c.ac, marginBottom: 6 }}>STEP {chainStep + 1} OF {totalSteps}</div>
          <div style={{ fontSize: T.base, fontWeight: 600, color: c.tx }}>{currentStep.context}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {choices.map((phrase, i) => {
            if (!phrase) return null;
            const isCorrect = phrase[0] === currentStep.correctId;
            const isPicked = chainPicked === phrase[0];
            const state = stepAnswered && isCorrect ? "correct" : stepAnswered && isPicked && !isCorrect ? "wrong" : stepAnswered ? "dim" : "idle";
            return <ChoiceCard key={i} c={c} btn={btn} disabled={stepAnswered} state={state} onClick={() => {
              if (stepAnswered) return;
              setChainPicked(phrase[0]);
              const ok = isCorrect;
              if (ok) { speakPhrase(phrase[0], phrase[1]); senpaiReact(true); }
              else senpaiReact(false);
              const newAnswers = [...chainAnswers, { correct: ok, phraseId: phrase[0] }];
              setChainAnswers(newAnswers);
              reviewPhr(currentStep.correctId, ok, "phrase-chain", getResponseMs());
              setTimeout(() => {
                setChainPicked(null);
                setChainStep(chainStep + 1);
              }, ok ? 1200 : 2500);
            }}>
              <div style={{ fontFamily: fontJa, fontWeight: 700, fontSize: T.lg, lineHeight: 1.3 }}>{phrase[1]}</div>
              <div style={{ fontSize: T.sm, fontFamily: mono, color: c.ro, marginTop: 2 }}>{phrase[2]}</div>
              {stepAnswered && <div style={{ fontSize: T.sm, color: isCorrect ? c.g : c.m2, marginTop: 2 }}>{phrase[3]}</div>}
            </ChoiceCard>;
          })}
        </div>
      </>}

      {/* Chain complete — summary */}
      {allDone && <div style={{ ...card, padding: "24px 20px", textAlign: "center" }}>
        <div style={{ fontSize: T.xxl, marginBottom: 8 }}>{correctCount === totalSteps ? "🎉" : correctCount >= totalSteps * 0.7 ? "👏" : "💪"}</div>
        <div style={{ fontSize: T.lg, fontWeight: 700, color: c.tx, marginBottom: 4 }}>
          {correctCount === totalSteps ? "Perfect chain!" : `${correctCount}/${totalSteps} correct`}
        </div>
        <div style={{ fontSize: T.sm, color: c.m, marginBottom: 16 }}>
          {correctCount === totalSteps ? "You nailed every step of the conversation!"
            : correctCount >= totalSteps * 0.7 ? "Great job! A few stumbles but you got through it."
            : "Keep practising — you'll get the flow down!"}
        </div>
        {/* Continuous play of full chain for listening practice */}
        <button onClick={() => {
          let i = 0;
          const playNext = () => {
            if (i >= chain.steps.length) return;
            const phrase = PHRASES.find(p => p[0] === chain.steps[i].correctId);
            if (phrase) speakPhrase(phrase[0], phrase[1]);
            i++;
            setTimeout(playNext, 2500);
          };
          playNext();
        }} className="ts-btn" style={{ ...btn, width: "100%", padding: 12, borderRadius: 10, background: c.s2, border: "1px solid " + c.b, color: c.tx, fontSize: T.sm, marginBottom: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <IconPlay size={14}/> Hear the whole conversation again
        </button>
        <button className="ts-btn" onClick={() => advance(correctCount >= totalSteps * 0.5)}
          style={{ ...btn, width: "100%", padding: 14, borderRadius: 12, background: c.a, color: "#fff", fontSize: T.md, fontWeight: 600 }}>Next →</button>
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

      // Autoplay all NPC lines up to the first blank for context
      const playUpToBlank = () => {
        const firstBlankIdx = convo.lines.findIndex(l => l.blank);
        const linesToPlay = firstBlankIdx === -1 ? convo.lines : convo.lines.slice(0, firstBlankIdx);
        let i = 0;
        const playNext = () => {
          if (i >= linesToPlay.length) return;
          const line = linesToPlay[i];
          if (line.text) speak(line.text);
          i++;
          setTimeout(playNext, 2500);
        };
        playNext();
      };

      return withSenpai(<>
        {typeLabel}
        <div style={{ ...card, padding: "20px", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: T.lg }}>{convo.icon}</span>
              <span style={{ fontSize: T.sm, fontWeight: 600 }}>{convo.setting}</span>
            </div>
            <button onClick={playUpToBlank}
              style={{ ...btn, padding: "4px 12px", borderRadius: 8, background: c.s2, border: "1px solid " + c.b, fontSize: T.xs, color: c.tx }}><IconPlay size={14}/> hear setup</button>
          </div>
          {convo.lines.map((line, li) => {
            if (!line.blank) {
              return <div key={li} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                <div style={{ fontSize: 10, color: c.m, fontFamily: mono, width: 40, flexShrink: 0, textAlign: "right", marginTop: 4 }}>{line.speaker}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ fontSize: T.base, fontWeight: 500, flex: 1 }}>{line.text}</div>
                    <button className="ts-icon-btn" onClick={() => speak(line.text)} style={{ ...btn, padding: "2px 6px", borderRadius: 4, background: "transparent", border: "1px solid " + c.b, fontSize: T.sm, color: c.tx }}><IconPlay size={14}/></button>
                  </div>
                </div>
              </div>;
            }
            const blankIdx = blanks.indexOf(line);
            const selected = convoAnswers[blankIdx];
            const selectedPhrase = selected ? phraseById(selected) : null;
            const isTarget = selectedBlank === blankIdx;
            const isDragOver = draggingId && !selectedPhrase;
            return <div key={li} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
              <div style={{ fontSize: 10, color: c.ro, fontFamily: mono, width: 40, flexShrink: 0, textAlign: "right", marginTop: 4 }}>you</div>
              <div style={{ flex: 1 }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); if (draggingId) { handleDrop(blankIdx, draggingId); setDraggingId(null); } }}>
                {selectedPhrase
                  ? <div onClick={() => { setConvoAnswers(a => { const n = { ...a }; delete n[blankIdx]; return n; }); setSelectedBlank(blankIdx); }}
                      draggable onDragStart={() => setDraggingId(selected)}
                      style={{ padding: "8px 14px", borderRadius: 8, background: c.a + "18", border: "1px solid " + c.a + "44", cursor: "grab", fontSize: T.base, fontWeight: 500, transition: "all .15s" }}>
                      {selectedPhrase[1]}
                    </div>
                  : <div onClick={() => setSelectedBlank(isTarget ? null : blankIdx)}
                      style={{ padding: "10px 14px", borderRadius: 8, border: "2px dashed " + (isTarget ? c.a : c.b), background: isTarget ? c.a + "08" : "transparent", color: isTarget ? c.a : c.m, fontSize: T.base, cursor: "pointer", transition: "all .15s" }}>
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
              style={{ ...btn, padding: "12px 10px", borderRadius: 8, border: "1px solid " + (draggingId === optId ? c.a : c.b), background: used ? c.s2 : "transparent", color: used ? c.m : c.tx, fontSize: T.base, textAlign: "left", opacity: used ? .4 : 1, cursor: used ? "default" : "grab", transition: "all .15s" }}>
              {p[1]}
            </button>;
          })}
        </div>
        {allFilled && <button onClick={() => setConvoSubmitted(true)}
          style={{ ...btn, width: "100%", padding: 14, borderRadius: 10, background: c.a, color: "#fff", fontSize: T.base, fontWeight: 600 }}>Check my answers</button>}
      </>);
    }

    // Submitted — show results
    const correct = blanks.filter((b, i) => convoAnswers[i] === b.correctId).length;
    const total = blanks.length;
    let blankNum = 0;
    return withSenpai(<>
      {typeLabel}
      <div style={{ ...card, padding: "20px", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: T.lg }}>{convo.icon}</span>
          <span style={{ fontSize: T.sm, fontWeight: 600 }}>{convo.setting}</span>
          <span style={{ marginLeft: "auto", fontSize: T.base, fontWeight: 700, color: correct === total ? c.g : c.a }}>{correct}/{total}</span>
        </div>
        {convo.lines.map((line, li) => {
          if (!line.blank) {
            return <div key={li} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
              <div style={{ fontSize: 10, color: c.m, fontFamily: mono, width: 28, flexShrink: 0, textAlign: "right", marginTop: 4 }}>{line.speaker}</div>
              <div>
                <div style={{ fontSize: T.base, fontWeight: 500 }}>{line.text}</div>
                <div style={{ fontSize: T.sm, color: c.m }}>{line.translation}</div>
              </div>
            </div>;
          }
          const blankIdx = blanks.indexOf(line);
          blankNum++;
          const answered = convoAnswers[blankIdx];
          const isCorrect = answered === line.correctId;
          const answeredPhrase = phraseById(answered);
          const correctPhrase = phraseById(line.correctId);
          const resultCol = isCorrect ? c.g : c.a;
          return <div key={li} style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "flex-start" }}>
            <div style={{ fontSize: 10, fontFamily: mono, width: 28, flexShrink: 0, textAlign: "right", marginTop: 6 }}>
              <span style={{ display: "inline-block", width: 20, height: 20, lineHeight: "20px", borderRadius: "50%", textAlign: "center", fontSize: T.xs, fontWeight: 700, background: resultCol + "22", color: resultCol, border: "1px solid " + resultCol + "44" }}>{blankNum}</span>
            </div>
            <div style={{ flex: 1 }}>
              {/* Your answer */}
              <div style={{ padding: "10px 14px", borderRadius: 8, background: isCorrect ? c.g + "18" : c.rs, border: "1px solid " + resultCol + "33", marginBottom: isCorrect ? 0 : 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: T.base, fontWeight: 600, color: resultCol }}>{isCorrect ? "✓" : "✗"}</span>
                  <span style={{ fontSize: T.base, fontWeight: 500 }}>{answeredPhrase?.[1]}</span>
                  <span style={{ fontSize: T.sm, color: c.m }}>{answeredPhrase?.[3]}</span>
                  <button className="ts-icon-btn" onClick={() => speakPhrase(answered, answeredPhrase?.[1])}
                    style={{ ...btn, marginLeft: "auto", padding: "2px 8px", borderRadius: 6, background: "transparent", border: "1px solid " + c.b, fontSize: T.sm, color: c.tx }}><IconPlay size={14}/></button>
                </div>
              </div>
              {/* Correct answer if wrong */}
              {!isCorrect && <div style={{ padding: "8px 14px", borderRadius: 8, background: c.g + "12", border: "1px solid " + c.g + "22" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: T.sm, color: c.g, fontWeight: 600 }}>correct:</span>
                  <span style={{ fontSize: T.sm, fontWeight: 500, color: c.g }}>{correctPhrase?.[1]}</span>
                  <span style={{ fontSize: T.sm, color: c.m }}>{correctPhrase?.[3]}</span>
                  <button className="ts-icon-btn" onClick={() => speakPhrase(line.correctId, correctPhrase?.[1])}
                    style={{ ...btn, marginLeft: "auto", padding: "2px 8px", borderRadius: 6, background: "transparent", border: "1px solid " + c.b, fontSize: T.sm, color: c.tx }}><IconPlay size={14}/></button>
                </div>
              </div>}
            </div>
          </div>;
        })}
      </div>
      <button onClick={() => {
        blanks.forEach((b, i) => reviewPhr(b.correctId, convoAnswers[i] === b.correctId, "conversation"));
        setScore(s => ({ ...s, c: s.c + correct, w: s.w + (total - correct) }));
        setConvoAnswers({}); setConvoSubmitted(false);
        advance(correct >= total / 2);
      }} style={{ ...btn, width: "100%", padding: 14, borderRadius: 10, background: c.a, color: "#fff", fontSize: T.base, fontWeight: 600 }}>Continue →</button>
    </>);
  }

  // ═══ EXERCISE: CONFUSED PAIRS ═══
  if (ex.type === "kana-pair") {
    const pair = ex.pair;
    const targetIdx = choiceAnswer?.targetIdx ?? Math.floor(Math.random() * 2);
    const targetChar = pair.chars[targetIdx];
    const targetRomaji = pair.romaji[targetIdx];
    if (!choiceAnswer) {
      speak(targetChar);
      setTimeout(() => setChoiceAnswer({ targetIdx, selected: null }), 0);
      return null;
    }
    const answered = choiceAnswer.selected !== null;
    return withSenpai(<>
      {typeLabel}
      <div style={{ ...card, padding: "28px 20px", marginBottom: 14, textAlign: "center" }}>
        <div style={{ fontSize: T.base, color: c.m, marginBottom: 20 }}>Which one is <span style={{ fontWeight: 700, color: c.tx, fontFamily: mono }}>{targetRomaji}</span>?</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
          {pair.chars.map((ch, i) => {
            const isTarget = i === targetIdx;
            const isSelected = choiceAnswer.selected === i;
            let bg = c.s2, border = c.b, col = c.tx;
            if (answered && isTarget) { bg = c.g + "20"; border = c.g + "55"; col = c.g; }
            if (answered && isSelected && !isTarget) { bg = c.rs; border = c.a + "55"; col = c.a; }
            return <button key={i} onClick={() => {
              if (answered) return;
              const ok = i === targetIdx;
              setChoiceAnswer({ ...choiceAnswer, selected: i });
              setFb(ok ? "ok" : "no");
              setScore(s => ok ? { ...s, c: s.c + 1 } : { ...s, w: s.w + 1 });
              updateKanaSRS(targetChar, ok, "kana-pair", getResponseMs());
              setTimeout(() => advance(ok), ok ? (getResponseMs() < 1500 ? 1000 : 2000) : 3500);
            }} style={{ ...btn, width: 120, height: 120, borderRadius: 16, border: "2px solid " + border, background: bg, fontSize: T.huge, color: col, transition: "all .2s" }}>
              {ch}
            </button>;
          })}
        </div>
        <button className="ts-icon-btn" onClick={() => speak(targetChar)} style={{ ...btn, marginTop: 12, padding: "6px 16px", borderRadius: 6, background: c.s2, border: "1px solid " + c.b, fontSize: T.base, color: c.tx }}><IconPlay size={14}/> hear again</button>
        {answered && <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 8, background: c.s2, border: "1px solid " + c.b }}>
          <div style={{ fontSize: T.base, color: c.tx }}>{pair.hint}</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 8 }}>
            {pair.chars.map((ch, i) => <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: T.xxl }}>{ch}</div>
              <div style={{ fontSize: T.xs, fontFamily: mono, color: c.ro }}>{pair.romaji[i]}</div>
            </div>)}
          </div>
        </div>}
      </div>
    </>);
  }

  // ═══ EXERCISE: GRAMMAR PATTERN ═══
  if (ex.type === "grammar-pattern") {
    const gp = ex.pattern;
    const exPhraseIds = (gp.examples || []).filter(id => data.phr?.[id]);
    const exPhrases = exPhraseIds.map(id => PHRASES.find(p => p[0] === id)).filter(Boolean).slice(0, 3);

    // Quiz answered via storyAnswer (reuse state)
    const quizAnswered = storyAnswer !== null;
    // Pick first example phrase for quiz, find target word
    const quizPhrase = exPhrases[0];
    const quizSegs = quizPhrase ? PHRASE_BREAKDOWNS[quizPhrase[0]] : null;
    // Find the segment that's part of the pattern (matches gp.pattern minus ~)
    const patternKey = gp.pattern.replace(/~/g, "").replace(/\.\.\./g, "");
    const targetSeg = quizSegs?.find(s => patternKey.includes(s[0]) || s[0].includes(patternKey.charAt(0)));
    const quizOptions = quizSegs && targetSeg ? (() => {
      const correct = `${targetSeg[2]} (${targetSeg[3]})`;
      const otherSegs = quizSegs.filter(s => s !== targetSeg).map(s => `${s[2]} (${s[3]})`);
      return shuffle([correct, ...otherSegs.slice(0, 2)]);
    })() : null;
    const correctAnswer = targetSeg ? `${targetSeg[2]} (${targetSeg[3]})` : null;

    return withSenpai(<>
      {typeLabel}
      <div style={{ ...card, padding: "24px 20px", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 40, fontWeight: 800, color: c.a }}>{gp.pattern}</div>
          <div style={{ fontSize: T.lg, color: c.tx, fontWeight: 600 }}>{gp.meaning}</div>
        </div>
        <div style={{ fontSize: T.sm, color: c.tx, lineHeight: 1.7, marginBottom: 16 }}>{gp.explanation}</div>
        {exPhrases.length > 0 && <>
          <div style={{ fontSize: T.xs, fontFamily: mono, color: c.m, marginBottom: 8 }}>You already know these:</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {exPhrases.map(p => <div key={p[0]} style={{ padding: "10px 14px", borderRadius: 8, background: c.s2, border: "1px solid " + c.b }}>
              <PhraseSegments phraseId={p[0]} c={c} fontSize={isDesktop ? T.lg : T.md} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                <div>
                  <div style={{ fontSize: T.sm, fontFamily: mono, color: c.ro }}>{p[2]}</div>
                  <div style={{ fontSize: T.base, color: c.tx, fontWeight: 500 }}>{p[3]}</div>
                </div>
                <button className="ts-icon-btn" onClick={() => speakPhraseWithEnglish(p[0], p[1], p[3])}
                  style={{ ...btn, padding: "6px 12px", borderRadius: 6, background: c.s, border: "1px solid " + c.b, fontSize: T.sm, color: c.tx }}><IconPlay size={14}/></button>
              </div>
            </div>)}
          </div>
        </>}
      </div>

      {/* Comprehension quiz — active not passive */}
      {quizPhrase && targetSeg && quizOptions && <div style={{ ...card, padding: "16px 20px", marginBottom: 14, borderLeft: "3px solid " + c.go }}>
        <div style={{ fontSize: T.xs, fontFamily: mono, color: c.go, textTransform: "uppercase", marginBottom: 8 }}>Quick check</div>
        <div style={{ fontSize: T.base, color: c.tx, marginBottom: 12 }}>
          In <span style={{ fontWeight: 700 }}>{quizPhrase[1]}</span>, what role does <span style={{ fontWeight: 700, color: c.a }}>{targetSeg[0]}</span> play?
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {quizOptions.map((opt, i) => {
            const isCorrect = opt === correctAnswer;
            const isPicked = storyAnswer === i;
            let bg = "transparent", border = c.b, col = c.tx;
            if (quizAnswered && isCorrect) { bg = c.gs; border = c.g + "55"; col = c.g; }
            if (quizAnswered && isPicked && !isCorrect) { bg = c.rs; border = c.a + "55"; col = c.a; }
            return <button key={i} onClick={() => {
              if (quizAnswered) return;
              setStoryAnswer(i);
              setScore(s => isCorrect ? { ...s, c: s.c + 1 } : { ...s, w: s.w + 1 });
            }} style={{ ...btn, padding: "10px 14px", borderRadius: 8, border: "1px solid " + border, background: bg, color: col, fontSize: T.sm, textAlign: "left" }}>{opt}</button>;
          })}
        </div>
      </div>}

      <button onClick={() => { setStoryAnswer(null); advance(true); }}
        style={{ ...btn, width: "100%", padding: 14, borderRadius: 10, background: c.a, color: "#fff", fontSize: T.base, fontWeight: 600 }}>
        {quizPhrase && targetSeg && !quizAnswered ? "Skip quiz — Next →" : "Got it — Next →"}
      </button>
    </>);
  }

  // ═══ EXERCISE: WORD QUIZ (learn building block words individually) ═══
  if (ex.type === "word-quiz") {
    const word = ex.word; // [japanese, romaji, meaning, category, phraseExamples[]]
    const isReverse = ex.reverse; // English meaning → pick Japanese (production)
    const catInfo = WORD_CATS[word[3]] || { label: "Word", color: c.m };
    if (!choiceAnswer) {
      const sameCat = KEY_WORDS.filter(w => w[3] === word[3] && w[0] !== word[0]);
      const otherCat = KEY_WORDS.filter(w => w[3] !== word[3] && w[0] !== word[0]);
      const distractorPool = [...sameCat, ...shuffle(otherCat)].slice(0, 8);
      const distractors = shuffle(distractorPool).slice(0, 3);
      const choices = stableChoices([word, ...distractors]);
      if (!isReverse) speak(word[0]);
      setTimeout(() => setChoiceAnswer({ choices, selected: null }), 0);
      return null;
    }
    const answered = choiceAnswer.selected !== null;
    const exIds = (word[4] || []).filter(id => data.phr?.[id]);
    const exPhrases = exIds.map(id => PHRASES.find(p => p[0] === id)).filter(Boolean).slice(0, 2);
    return withSenpai(<>
      {typeLabel}
      <div style={{ ...card, padding: "24px 20px", marginBottom: 14, textAlign: "center" }}>
        {isReverse ? <>
          {/* Reverse: show English, user picks Japanese */}
          <div style={{ fontSize: T.xs, fontFamily: mono, color: c.m, textTransform: "uppercase", marginBottom: 8 }}>Pick the Japanese word for:</div>
          <div style={{ fontSize: T.xxl, fontWeight: 700, color: c.tx, marginBottom: 4 }}>{word[2]}</div>
        </> : <>
          {/* Normal: show Japanese, user picks English meaning */}
          <div style={{ fontSize: T.huge, fontWeight: 800, color: c.tx, marginBottom: 4 }}>{word[0]}</div>
          <div style={{ fontSize: T.sm, fontFamily: mono, color: c.ro, marginBottom: 4 }}>{word[1]}</div>
          <button className="ts-icon-btn" onClick={() => speak(word[0])} style={{ ...btn, padding: "4px 14px", borderRadius: 6, background: c.s2, border: "1px solid " + c.b, fontSize: T.sm, color: c.tx }}><IconPlay size={14}/> hear it</button>
        </>}
      </div>
      <div style={{ fontSize: T.base, color: c.m, marginBottom: 8, textAlign: "center" }}>{isReverse ? "Which Japanese word?" : "What does this mean?"}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {choiceAnswer.choices.map((w, i) => {
          const isCorrect = w[0] === word[0];
          const isSelected = choiceAnswer.selected === w[0];
          const state = answered && isCorrect ? "correct" : answered && isSelected && !isCorrect ? "wrong" : answered ? "dim" : "idle";
          return <ChoiceCard key={i} c={c} btn={btn} disabled={answered} state={state} onClick={() => {
            if (answered) return;
            const ok = w[0] === word[0];
            setChoiceAnswer({ ...choiceAnswer, selected: w[0], correct: ok });
            setFb(ok ? "ok" : "no");
            setScore(s => ok ? { ...s, c: s.c + 1 } : { ...s, w: s.w + 1 });
            if (isReverse && ok) speak(w[0]);
          }}>
            <span style={{ fontSize: isReverse ? T.xl : T.base, fontWeight: isReverse ? 700 : 500, fontFamily: isReverse ? fontJa : "inherit", lineHeight: 1.3 }}>{isReverse ? w[0] : w[2]}</span>
            {isReverse && answered && <div style={{ fontSize: T.sm, color: c.m2, marginTop: 2 }}>{w[2]}</div>}
          </ChoiceCard>;
        })}
      </div>
      {answered && <>
        {exPhrases.length > 0 && <div style={{ ...card, padding: "12px 16px", marginTop: 12, borderLeft: "3px solid " + catInfo.color }}>
          <div style={{ fontSize: T.sm, color: c.m, marginBottom: 6 }}>You know this from:</div>
          {exPhrases.map(p => {
            const segs = PHRASE_BREAKDOWNS[p[0]];
            if (!segs) return null;
            return <div key={p[0]} style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3, alignItems: "baseline" }}>
                {segs.map((seg, si) => {
                  const isTarget = seg[0] === word[0];
                  return <span key={si} style={{
                    fontSize: T.base, fontWeight: isTarget ? 700 : 400,
                    color: isTarget ? catInfo.color : c.tx,
                    background: isTarget ? catInfo.color + "18" : "transparent",
                    padding: isTarget ? "2px 5px" : "2px 1px", borderRadius: 4,
                  }}>{seg[0]}</span>;
                })}
              </div>
              <div style={{ fontSize: T.sm, color: c.m }}>{p[3]}</div>
            </div>;
          })}
        </div>}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="ts-icon-btn" onClick={() => speak(word[0])}
            style={{ ...btn, flex: 1, padding: 12, borderRadius: 10, background: c.s2, border: "1px solid " + c.b, color: c.tx, fontSize: T.sm }}><IconPlay size={14}/> hear again</button>
          <button className="ts-btn" onClick={() => advance(choiceAnswer.correct)}
            style={{ ...btn, flex: 2, padding: 12, borderRadius: 10, background: c.a, color: "#fff", fontSize: T.base, fontWeight: 600 }}>Next →</button>
        </div>
      </>}
    </>);
  }

  // ═══ EXERCISE: PHRASE BUILD (fill-in-the-blank at segment level) ═══
  if (ex.type === "phrase-build") {
    const p = ex.item;
    const segments = PHRASE_BREAKDOWNS[p[0]];
    const blankIdx = ex.blankIdx;
    const blankSeg = segments[blankIdx];
    if (!segments || !blankSeg) { advance(true); return null; }

    if (!choiceAnswer) {
      // Build distractors from same grammar type across all phrases
      const sameType = [];
      for (const [, segs] of Object.entries(PHRASE_BREAKDOWNS)) {
        for (const seg of segs) {
          if (seg[3] === blankSeg[3] && seg[0] !== blankSeg[0] && !sameType.includes(seg[0])) {
            sameType.push(seg[0]);
          }
        }
      }
      const choices = stableChoices([blankSeg[0], ...shuffle(sameType).slice(0, 3)]);
      setTimeout(() => setChoiceAnswer({ choices, selected: null }), 0);
      return null;
    }
    const answered = choiceAnswer.selected !== null;
    // Build the phrase with a blank
    const gramCol = { particle: c.go, noun: "#5a9ec4", verb: c.g, adjective: "#c45a9e", expression: c.m, counter: "#c49a5a", copula: c.m, suffix: c.m, question: c.go };
    return withSenpai(<>
      {typeLabel}
      <div style={{ ...card, padding: "24px 20px", marginBottom: 14 }}>
        <div style={{ fontSize: T.base, color: c.m, marginBottom: 12 }}>{p[3]}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: 8 }}>
          {segments.map((seg, i) => {
            if (i === blankIdx) {
              const showAnswer = answered;
              return <div key={i} style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{
                  padding: "8px 14px", borderRadius: 8, fontSize: isDesktop ? T.xl : T.lg, fontWeight: 700,
                  background: showAnswer ? (choiceAnswer.correct ? c.g + "20" : c.rs) : c.s2,
                  border: "2px dashed " + (showAnswer ? (choiceAnswer.correct ? c.g : c.a) : c.a),
                  color: showAnswer ? (choiceAnswer.correct ? c.g : c.a) : c.a,
                  minWidth: 40, textAlign: "center"
                }}>
                  {showAnswer ? blankSeg[0] : "?"}
                </div>
                <div style={{ fontSize: T.xs, color: gramCol[blankSeg[3]] || c.m, fontFamily: mono, marginTop: 2 }}>{blankSeg[2]}</div>
              </div>;
            }
            return <div key={i} style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ padding: "8px 10px", fontSize: isDesktop ? T.xl : T.lg, fontWeight: 600, color: c.tx }}>{seg[0]}</div>
              {answered && <div style={{ fontSize: T.xs, color: gramCol[seg[3]] || c.m, fontFamily: mono, marginTop: 2 }}>{seg[2]}</div>}
            </div>;
          })}
        </div>
        {!answered && <div style={{ fontSize: T.sm, color: c.m, fontStyle: "italic", marginTop: 4 }}>
          Fill in the missing <span style={{ color: gramCol[blankSeg[3]] || c.a, fontWeight: 600 }}>{blankSeg[3]}</span>
        </div>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {choiceAnswer.choices.map((choice, i) => {
          const isCorrect = choice === blankSeg[0];
          const isSelected = choiceAnswer.selected === choice;
          const state = answered && isCorrect ? "correct" : answered && isSelected && !isCorrect ? "wrong" : answered ? "dim" : "idle";
          let choiceMeaning = "";
          if (answered) {
            for (const [, segs] of Object.entries(PHRASE_BREAKDOWNS)) {
              const found = segs.find(s => s[0] === choice);
              if (found) { choiceMeaning = found[2]; break; }
            }
          }
          return <ChoiceCard key={i} c={c} btn={btn} disabled={answered} state={state} onClick={() => {
            if (answered) return;
            const ok = choice === blankSeg[0];
            setChoiceAnswer({ ...choiceAnswer, selected: choice, correct: ok });
            setFb(ok ? "ok" : "no");
            setScore(s => ok ? { ...s, c: s.c + 1 } : { ...s, w: s.w + 1 });
            reviewPhr(p[0], ok, "phrase-build", getResponseMs());
            if (ok) speakPhrase(p[0], p[1]);
          }}>
            <span style={{ fontSize: T.xl, fontWeight: 700, fontFamily: fontJa, lineHeight: 1.3 }}>{choice}</span>
            {answered && choiceMeaning && <span style={{ fontSize: T.sm, color: c.m2, fontWeight: 400, marginLeft: 8 }}>({choiceMeaning})</span>}
          </ChoiceCard>;
        })}
      </div>
      {answered && <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button className="ts-icon-btn" onClick={() => speakPhrase(p[0], p[1])}
          style={{ ...btn, flex: 1, padding: 12, borderRadius: 10, background: c.s2, border: "1px solid " + c.b, color: c.tx, fontSize: T.sm }}><IconPlay size={14}/> hear again</button>
        <button className="ts-btn" onClick={() => advance(choiceAnswer.correct)}
          style={{ ...btn, flex: 2, padding: 12, borderRadius: 10, background: c.a, color: "#fff", fontSize: T.base, fontWeight: 600 }}>Next →</button>
      </div>}
    </>);
  }

  // ═══ EXERCISE: PATTERN ASSEMBLY (build sentence from pieces) ═══
  if (ex.type === "pattern-assembly") {
    const ch = ex.challenge;
    if (!ch) { advance(true); return null; }

    // Initialize the pool on first render of this card
    if (assemblyPool.length === 0 && assemblySlots.length === 0 && !assemblySubmitted) {
      const pieces = [...ch.correctPieces, ...ch.distractors].map((p, i) => ({ ...p, id: i }));
      // Shuffle
      for (let i = pieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
      }
      setTimeout(() => setAssemblyPool(pieces), 0);
      return null;
    }

    const correctOrder = ch.correctPieces.map(p => p.japanese);
    const isCorrectAnswer = assemblySlots.length === correctOrder.length &&
      assemblySlots.every((s, i) => s.japanese === correctOrder[i]);

    const gramCol = { particle: "#c49a5a", noun: "#5a9ec4", verb: c.g, question: "#ff9800", copula: c.m, suffix: "#9c27b0", adjective: "#c45a9e" };

    // Build the full correct sentence for TTS
    const correctSentence = ch.correctPieces.map(p => p.japanese).join("");

    const handleSubmit = () => {
      if (assemblySubmitted || assemblySlots.length === 0) return;
      setAssemblySubmitted(true);
      const ok = isCorrectAnswer;
      setFb(ok ? "ok" : "no");
      setScore(s => ok ? { ...s, c: s.c + 1 } : { ...s, w: s.w + 1 });
      // Always speak the actual generated sentence, not the template's example phrase
      speak(correctSentence);
      // Credit SRS for the actual slot's source phrase (not the template's example)
      const creditId = ch.slotSourcePhrase || ch.examplePhraseId;
      if (creditId && data.phr?.[creditId]) {
        reviewPhr(creditId, ok, "pattern-assembly", getResponseMs());
      }
    };

    const addPiece = (piece) => {
      if (assemblySubmitted) return;
      setAssemblySlots(s => [...s, piece]);
      setAssemblyPool(p => p.filter(pp => pp.id !== piece.id));
    };

    const removePiece = (piece) => {
      if (assemblySubmitted) return;
      setAssemblySlots(s => s.filter(pp => pp.id !== piece.id));
      setAssemblyPool(p => [...p, piece]);
    };

    return withSenpai(<>
      {typeLabel}
      {/* Prompt card — clean hierarchy: context → what to build */}
      <div style={{ ...card, padding: isDesktop ? "28px 24px" : "22px 18px", marginBottom: 16 }}>
        <div style={{ fontSize: T.base, color: c.m, marginBottom: 12 }}>{ch.situation}</div>
        <div style={{ fontSize: isDesktop ? T.xl : T.lg, fontWeight: 700, color: c.tx, lineHeight: 1.3 }}>"{ch.englishPrompt}"</div>
        <div style={{ fontSize: T.sm, color: c.m, marginTop: 8 }}>Tap pieces below in the right order to build this sentence in Japanese.</div>
        {ch.isNovel && !assemblySubmitted && <div style={{ fontSize: T.sm, color: c.a, marginTop: 8, opacity: 0.8 }}>✨ New combination</div>}
        {!assemblySubmitted && <HintChip visible={hintAvailable} shown={hintShown} onReveal={() => setHintShown(true)} hintText={`First piece: ${ch.correctPieces[0]?.japanese || ""}`} c={c} btn={btn} />}
      </div>

      {/* Drop zone — where pieces go */}
      <div style={{ minHeight: 64, padding: "14px 16px", borderRadius: 14, border: "2px dashed " + (assemblySubmitted ? (isCorrectAnswer ? c.g : c.a) : c.b + "88"), background: assemblySubmitted ? (isCorrectAnswer ? c.g + "12" : c.rs) : c.s2, marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        {assemblySlots.length === 0 && !assemblySubmitted && <div style={{ color: c.m, fontSize: T.base, fontStyle: "italic", width: "100%", textAlign: "center", padding: "8px 0" }}>Tap pieces below to build the sentence</div>}
        {assemblySlots.map((piece, i) => {
          let pieceColor = c.tx;
          let pieceBg = c.s;
          let pieceBorder = c.b;
          if (assemblySubmitted) {
            if (i < correctOrder.length && piece.japanese === correctOrder[i]) {
              pieceColor = c.g; pieceBg = c.g + "20"; pieceBorder = c.g + "55";
            } else {
              pieceColor = c.a; pieceBg = c.rs; pieceBorder = c.a + "55";
            }
          }
          return <button key={piece.id} onClick={() => removePiece(piece)}
            style={{ ...btn, padding: "10px 16px", borderRadius: 10, fontSize: isDesktop ? T.xl : T.lg, fontWeight: 700, color: pieceColor, background: pieceBg, border: "1px solid " + pieceBorder, cursor: assemblySubmitted ? "default" : "pointer", transition: "all .15s" }}>
            {piece.japanese}
          </button>;
        })}
      </div>

      {/* Correct answer — always show the actual generated pieces, not the template's example phrase */}
      {assemblySubmitted && <div style={{ ...card, padding: "14px 18px", marginBottom: 16, borderLeft: "3px solid " + c.g }}>
        <div style={{ fontSize: T.sm, color: isCorrectAnswer ? c.g : c.m, marginBottom: 8, fontWeight: 600 }}>{isCorrectAnswer ? "✓ Correct!" : "Correct answer:"}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          {ch.correctPieces.map((p, i) => <div key={i} style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: isDesktop ? T.xl : T.lg, fontWeight: 700, color: c.tx, padding: "4px 8px" }}>{p.japanese}</span>
            <span style={{ fontSize: T.xs, color: c.m }}>{p.meaning}</span>
          </div>)}
        </div>
        <div style={{ fontSize: T.sm, color: c.m, marginTop: 10 }}>Pattern: <span style={{ fontWeight: 600, color: c.a }}>{ch.pattern}</span> = {ch.patternMeaning}</div>
        {ch.keyWord && <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: c.a + "12", border: "1px solid " + c.a + "33" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: isDesktop ? T.xl : T.lg, fontWeight: 800, color: c.a }}>{ch.keyWord.japanese}</span>
            <span style={{ fontSize: T.base, color: c.m, fontWeight: 600 }}>{ch.keyWord.meaning}</span>
          </div>
          <div style={{ fontSize: T.sm, color: c.m, lineHeight: 1.4 }}>{ch.keyWord.tip}</div>
        </div>}
      </div>}

      {/* Available pieces — NO English hints before submit */}
      {!assemblySubmitted && <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginBottom: 16 }}>
        {assemblyPool.map(piece => <button key={piece.id} onClick={() => addPiece(piece)}
          style={{ ...btn, padding: "12px 18px", borderRadius: 12, fontSize: isDesktop ? T.xl : T.lg, fontWeight: 600, color: c.tx, background: c.s, border: "1px solid " + c.b, cursor: "pointer", transition: "all .15s" }}>
          {piece.japanese}
        </button>)}
      </div>}

      {/* Submit / Clear / Next buttons */}
      {!assemblySubmitted && assemblySlots.length > 0 && <button onClick={handleSubmit}
        style={{ ...btn, width: "100%", padding: 16, borderRadius: 12, background: c.a, color: "#fff", fontSize: T.md, fontWeight: 600, marginBottom: 8 }}>Check answer</button>}
      {!assemblySubmitted && assemblySlots.length > 0 && <button onClick={() => { setAssemblySlots([]); setAssemblyPool(p => [...p, ...assemblySlots]); }}
        style={{ ...btn, width: "100%", padding: 12, borderRadius: 12, background: "transparent", border: "1px solid " + c.b, color: c.m, fontSize: T.base }}>Clear</button>}

      {assemblySubmitted && <>
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button className="ts-icon-btn" onClick={() => speak(correctSentence)}
            style={{ ...btn, flex: 1, padding: 14, borderRadius: 12, background: c.s2, border: "1px solid " + c.b, color: c.tx, fontSize: T.sm }}><IconPlay size={14}/> hear it</button>
          <button className="ts-btn" onClick={() => advance(isCorrectAnswer)}
            style={{ ...btn, flex: 2, padding: 14, borderRadius: 12, background: c.a, color: "#fff", fontSize: T.md, fontWeight: 600 }}>Next →</button>
        </div>
      </>}
    </>);
  }

  // ═══ EXERCISE: KANA REVERSE (see romaji → pick character) ═══
  if (ex.type === "kana-reverse") {
    if (!choiceAnswer) {
      const allKana = Object.keys(ROMAJI).filter(ch => ch !== ex.item);
      const isHira = ex.item.charCodeAt(0) >= 0x3040 && ex.item.charCodeAt(0) <= 0x309F;
      const sameScript = allKana.filter(ch => isHira ? ch.charCodeAt(0) >= 0x3040 && ch.charCodeAt(0) <= 0x309F : ch.charCodeAt(0) >= 0x30A0);
      const choices = stableChoices([ex.item, ...shuffle(sameScript).slice(0, 7)]);
      setTimeout(() => setChoiceAnswer({ choices, selected: null }), 0);
      return null;
    }
    const answered = choiceAnswer.selected !== null;
    return withSenpai(<>
      {typeLabel}
      <div style={{ ...card, textAlign: "center", padding: "28px 20px", marginBottom: 14 }}>
        <div style={{ fontSize: T.xs, fontFamily: mono, color: c.m, textTransform: "uppercase", marginBottom: 8 }}>Pick the character</div>
        <div style={{ fontSize: 40, fontWeight: 800, fontFamily: mono, color: c.ro, marginBottom: 20 }}>{ex.romaji}</div>
        {answered && (() => {
          const isHira = ex.item.charCodeAt(0) >= 0x3040 && ex.item.charCodeAt(0) <= 0x309F;
          const imgPath = `/images/mnemonics/approved/${isHira ? "hiragana" : "katakana"}/${ex.item.codePointAt(0).toString(16)}.png`;
          const m = M[ex.item];
          const wasCorrect = choiceAnswer.selected === ex.item;
          return <div style={{ marginTop: 12, borderTop: "1px solid " + c.b, paddingTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "center" }}>
              <div>
                <div style={{ fontSize: T.huge, lineHeight: 1 }}>{ex.item}</div>
                <div style={{ fontSize: T.lg, fontWeight: 700, color: wasCorrect ? c.g : c.a, fontFamily: mono, marginTop: 4 }}>{ex.romaji}</div>
                <div style={{ fontSize: T.sm, color: wasCorrect ? c.g : c.a, marginTop: 2 }}>{wasCorrect ? "✓ Correct!" : "✗ Wrong"}</div>
              </div>
              <img src={imgPath} alt="" onError={e => { e.target.style.display = "none"; }} style={{ width: "35%", maxWidth: 130, borderRadius: 10 }} />
            </div>
            {!wasCorrect && m && <div style={{ fontSize: T.sm, color: c.m, marginTop: 10, fontStyle: "italic" }}>{m[0]} {m[1]}: {m[2]}</div>}
          </div>;
        })()}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {choiceAnswer.choices.map((ch, i) => {
          const isCorrect = ch === ex.item;
          const isSelected = choiceAnswer.selected === ch;
          const state = answered && isCorrect ? "correct" : answered && isSelected && !isCorrect ? "wrong" : answered ? "dim" : "idle";
          return <ChoiceCard key={i} c={c} btn={btn} disabled={answered} state={state} align="center" onClick={() => {
            if (answered) return;
            const ok = ch === ex.item;
            setChoiceAnswer({ ...choiceAnswer, selected: ch });
            setFb(ok ? "ok" : "no");
            setScore(s => ok ? { ...s, c: s.c + 1 } : { ...s, w: s.w + 1 });
            updateKanaSRS(ex.item, ok, "kana-reverse", getResponseMs());
            setTimeout(() => advance(ok), ok ? (getResponseMs() < 1500 ? 1000 : 2000) : 4000);
          }}>
            <span style={{ fontSize: T.xxl, fontFamily: fontJa }}>{ch}</span>
          </ChoiceCard>;
        })}
      </div>
    </>);
  }

  // ═══ EXERCISE: CONFUSED PHRASE PAIR ═══
  if (ex.type === "phrase-pair") {
    const pair = ex.pair; // { ids, hint, diff }
    const p1 = PHRASES.find(p => p[0] === pair.ids[0]);
    const p2 = PHRASES.find(p => p[0] === pair.ids[1]);
    if (!p1 || !p2) { advance(true); return null; }
    const phrases = [p1, p2];
    const targetIdx = choiceAnswer?.targetIdx ?? Math.floor(Math.random() * 2);
    const target = phrases[targetIdx];
    if (!choiceAnswer) {
      speakPhrase(target[0], target[1]);
      setTimeout(() => setChoiceAnswer({ targetIdx, selected: null }), 0);
      return null;
    }
    const answered = choiceAnswer.selected !== null;
    return withSenpai(<>
      {typeLabel}
      <div style={{ ...card, padding: "24px 20px", marginBottom: 14, textAlign: "center" }}>
        <div style={{ fontSize: T.base, color: c.m, marginBottom: 6 }}>Which one means:</div>
        <div style={{ fontSize: T.lg, fontWeight: 700, color: c.tx, marginBottom: 4 }}>{target[3]}</div>
        {target[5] && <div style={{ fontSize: T.sm, color: c.m, fontStyle: "italic" }}>{target[5]}</div>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {phrases.map((p, i) => {
          const isTarget = i === targetIdx;
          const isSelected = choiceAnswer.selected === i;
          let bg = c.s2, border = c.b, col = c.tx;
          if (answered && isTarget) { bg = c.g + "18"; border = c.g + "55"; col = c.g; }
          if (answered && isSelected && !isTarget) { bg = c.rs; border = c.a + "55"; col = c.a; }
          return <button key={i} onClick={() => {
            if (answered) return;
            const ok = i === targetIdx;
            setChoiceAnswer({ ...choiceAnswer, selected: i, correct: ok });
            setFb(ok ? "ok" : "no");
            setScore(s => ok ? { ...s, c: s.c + 1 } : { ...s, w: s.w + 1 });
            reviewPhr(target[0], ok, "phrase-pair", getResponseMs());
            speakPhraseWithEnglish(target[0], target[1], target[3]);
          }} style={{ ...btn, padding: "16px", borderRadius: 12, border: "2px solid " + border, background: bg, textAlign: "left", transition: "all .2s" }}>
            <div style={{ fontSize: isDesktop ? T.xl : T.lg, fontWeight: 600, color: col }}>{p[1]}</div>
            <div style={{ fontSize: T.sm, fontFamily: mono, color: c.m, marginTop: 4 }}>{p[2]}</div>
            {answered && <div style={{ fontSize: T.base, color: isTarget ? c.g : c.m, marginTop: 4, fontWeight: isTarget ? 600 : 400 }}>{p[3]}</div>}
          </button>;
        })}
      </div>
      {answered && <>
        {/* Show both phrases with segment breakdowns, highlighting differences */}
        <div style={{ ...card, padding: "14px 16px", marginTop: 12, borderLeft: "3px solid #ff9800" }}>
          {phrases.map((p, pi) => {
            const segs = PHRASE_BREAKDOWNS[p[0]];
            if (!segs) return null;
            const otherSegs = PHRASE_BREAKDOWNS[phrases[1 - pi][0]];
            const otherTexts = otherSegs ? otherSegs.map(s => s[0]) : [];
            return <div key={pi} style={{ marginBottom: pi === 0 ? 12 : 0 }}>
              <div style={{ fontSize: T.sm, color: c.m, marginBottom: 4 }}>{p[3]}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "baseline" }}>
                {segs.map((seg, si) => {
                  const isDiff = !otherTexts.includes(seg[0]);
                  const segCol = { particle: c.go, noun: "#5a9ec4", verb: c.g, adjective: "#c45a9e", expression: c.m, counter: "#c49a5a", copula: c.m, suffix: c.m }[seg[3]] || c.m;
                  return <span key={si} style={{
                    display: "inline-flex", flexDirection: "column", alignItems: "center",
                    padding: "4px 6px", borderRadius: 6,
                    background: isDiff ? "#ff980018" : c.s2,
                    border: isDiff ? "1px solid #ff980055" : "1px solid " + c.b + "44",
                  }}>
                    <span style={{ fontSize: T.lg, fontWeight: isDiff ? 700 : 500, color: isDiff ? "#ff9800" : c.tx }}>{seg[0]}</span>
                    <span style={{ fontSize: T.xs, color: isDiff ? "#ff9800" : segCol, fontWeight: 400, fontFamily: mono }}>{seg[2]}</span>
                  </span>;
                })}
              </div>
            </div>;
          })}
          <div style={{ fontSize: T.base, color: c.tx, lineHeight: 1.6, marginTop: 10, paddingTop: 10, borderTop: "1px solid " + c.b }}>{pair.hint}</div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="ts-icon-btn" onClick={() => speakPhraseWithEnglish(target[0], target[1], target[3])}
            style={{ ...btn, flex: 1, padding: 12, borderRadius: 10, background: c.s2, border: "1px solid " + c.b, color: c.tx, fontSize: T.sm }}><IconPlay size={14}/> hear again</button>
          <button className="ts-btn" onClick={() => advance(choiceAnswer.correct)}
            style={{ ...btn, flex: 2, padding: 12, borderRadius: 10, background: c.a, color: "#fff", fontSize: T.base, fontWeight: 600 }}>Next →</button>
        </div>
      </>}
    </>);
  }

  // ═══ EXERCISE: PHRASE REVERSE (see English → pick Japanese) ═══
  if (ex.type === "phrase-reverse") {
    const p = ex.item;
    if (!choiceAnswer) {
      // 5 choices at box 3+ for harder retrieval, 4 below
      const box = data.phr?.[p[0]]?.box || 0;
      const distractorCount = box >= 3 ? 4 : 3;
      const distractors = getDistractors(p, distractorCount);
      const choices = stableChoices([p, ...distractors]);
      setTimeout(() => setChoiceAnswer({ choices, selected: null }), 0);
      return null;
    }
    const answered = choiceAnswer.selected !== null;
    return withSenpai(<>
      {typeLabel}
      <div style={{ ...card, padding: "24px 20px", marginBottom: 14 }}>
        <div style={{ fontSize: T.xs, fontFamily: mono, color: c.m, textTransform: "uppercase", marginBottom: 8 }}>Find the Japanese</div>
        <div style={{ fontSize: T.xl, fontWeight: 700, color: c.tx, marginBottom: 6 }}>{p[3]}</div>
        <div style={{ fontSize: T.base, color: c.m, fontStyle: "italic" }}>{p[5]}</div>
        {!answered && <HintChip visible={hintAvailable} shown={hintShown} onReveal={() => setHintShown(true)} hintText={buildHint()} c={c} btn={btn} />}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {choiceAnswer.choices.map((choice, i) => {
          const isCorrect = choice[0] === p[0];
          const isSelected = choiceAnswer.selected === choice[0];
          const state = answered && isCorrect ? "correct" : answered && isSelected && !isCorrect ? "wrong" : answered ? "dim" : "idle";
          return <ChoiceCard key={i} c={c} btn={btn} disabled={answered} state={state} onClick={() => {
            if (answered) return;
            const ok = choice[0] === p[0];
            setChoiceAnswer({ ...choiceAnswer, selected: choice[0] });
            setFb(ok ? "ok" : "no");
            setScore(s => ok ? { ...s, c: s.c + 1 } : { ...s, w: s.w + 1 });
            reviewPhr(p[0], ok, "phrase-reverse", getResponseMs());
            if (ok) speakPhraseWithEnglish(p[0], p[1], p[3]);
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: isDesktop ? T.xl : T.lg, fontWeight: 700, fontFamily: fontJa, lineHeight: 1.3 }}>{choice[1]}</div>
                {answered && <div style={{ fontSize: T.sm, color: c.m2, marginTop: 3 }}>{choice[3]}</div>}
              </div>
              {answered && <span onClick={(e) => { e.stopPropagation(); speakPhraseWithEnglish(choice[0], choice[1], choice[3]); }} className="ts-icon-btn"
                style={{ padding: "6px 10px", borderRadius: 6, background: c.s2, border: "1px solid " + c.b, fontSize: T.sm, color: c.tx }}><IconPlay size={14}/></span>}
            </div>
          </ChoiceCard>;
        })}
      </div>
      {answered && <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button className="ts-icon-btn" onClick={() => speakPhraseWithEnglish(p[0], p[1], p[3])}
          style={{ ...btn, padding: 12, borderRadius: 10, background: c.s2, border: "1px solid " + c.b, color: c.tx, fontSize: T.sm }}><IconPlay size={14}/></button>
        <button className="ts-icon-btn" onClick={() => speakPhrase(p[0], p[1], { slow: true })}
          style={{ ...btn, padding: 12, borderRadius: 10, background: c.s2, border: "1px solid " + c.b, color: c.tx, fontSize: T.sm }}><IconSlowPlay size={14}/></button>
        <button className="ts-btn" onClick={() => advance(fb === "ok")}
          style={{ ...btn, flex: 2, padding: 12, borderRadius: 10, background: c.a, color: "#fff", fontSize: T.base, fontWeight: 600 }}>Next →</button>
      </div>}
    </>);
  }

  // ═══ EXERCISE: TRY FIRST — KANA (productive failure) ═══
  if (ex.type === "try-first-kana") {
    if (!fb) setTimeout(() => speak(ex.item), 300);
    const submit = () => {
      if (fb || !input.trim()) return;
      const ok = input.trim().toLowerCase() === ex.romaji;
      setFb(ok ? "ok" : "no");
      // Don't update SRS here — the learn card after will handle it
      setTimeout(() => advance(true), ok ? 2500 : 3000);
    };
    return withSenpai(<>
      {typeLabel}
      <div style={{ ...card, textAlign: "center", padding: "28px 20px", marginBottom: 14, background: fb === "ok" ? c.g + "18" : fb === "no" ? c.rs : c.s }}>
        <div style={{ fontSize: T.xs, fontFamily: mono, color: c.m, textTransform: "uppercase", marginBottom: 8 }}>What sound does this make?</div>
        <div style={{ fontSize: isDesktop ? 120 : 90, lineHeight: 1, marginBottom: 12 }}>{ex.item}</div>
        <button className="ts-icon-btn" onClick={() => speak(ex.item)} style={{ ...btn, padding: "6px 16px", borderRadius: 8, background: c.s2, border: "1px solid " + c.b, fontSize: T.sm, color: c.tx }}><IconPlay size={14}/> hear it</button>
        {fb && <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: T.xl, fontWeight: 700, fontFamily: mono, color: fb === "ok" ? c.g : c.a }}>{ex.romaji}</div>
          <div style={{ fontSize: T.base, color: c.m, marginTop: 4 }}>{fb === "ok" ? "You already knew this!" : "No worries — you'll learn it next"}</div>
        </div>}
      </div>
      {!fb && <div style={{ display: "flex", gap: 8 }}>
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") submit(); }}
          placeholder="guess..." autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false"
          style={{ flex: 1, padding: "14px 16px", borderRadius: 10, border: "1px solid " + c.b, background: c.s2, color: c.tx, fontFamily: mono, fontSize: T.lg, outline: "none", textAlign: "center" }} />
        <button onClick={submit} style={{ ...btn, padding: "14px 22px", borderRadius: 10, background: c.a, color: "#fff", fontSize: T.sm, fontWeight: 600 }}>Go</button>
      </div>}
      {!fb && <button onClick={() => { setFb("no"); setTimeout(() => advance(true), 1500); }}
        style={{ ...btn, width: "100%", marginTop: 8, padding: "10px", borderRadius: 8, background: "transparent", border: "1px solid " + c.b + "44", color: c.m, fontSize: T.sm }}>I don't know yet →</button>}
    </>);
  }

  // ═══ EXERCISE: TRY FIRST — PHRASE (productive failure) ═══
  if (ex.type === "try-first-phrase") {
    const p = ex.item;
    const catCol = CAT_COLORS[p[4]];
    if (!choiceAnswer) {
      const distractors = getDistractors(p, 3);
      const choices = stableChoices([p, ...distractors]);
      setTimeout(() => setChoiceAnswer({ choices, selected: null }), 0);
      return null;
    }
    const answered = choiceAnswer.selected !== null;
    const wasCorrect = choiceAnswer.selected === p[0];
    return withSenpai(<>
      {typeLabel}
      <div style={{ ...card, padding: 0, marginBottom: 14 }}>
        {/* Scene image — large for visual association / dual coding */}
        <img src={`/images/phrases/scenes/${p[0]}.png`} alt=""
          style={{ width: "100%", height: isDesktop ? 220 : 180, objectFit: "cover", display: "block", borderRadius: "12px 12px 0 0" }}
          onError={e => { e.target.style.display = "none"; }} />
        <div style={{ padding: "16px 20px" }}>
        <div style={{ fontSize: T.xs, fontFamily: mono, color: c.m, textTransform: "uppercase", marginBottom: 8 }}>What would you say?</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: T.base }}>{CAT_ICONS[p[4]]}</span>
          <span style={{ fontSize: T.base, color: catCol, fontWeight: 600 }}>{CATS[p[4]]}</span>
        </div>
        {p[5] && <div style={{ fontSize: T.sm, color: c.tx, marginBottom: 10, padding: "8px 12px", background: c.s2, borderRadius: 8, borderLeft: "3px solid " + catCol }}>{p[5]}</div>}
        <div style={{ fontSize: T.lg, fontWeight: 700, color: c.tx }}>{p[3]}</div>
        {answered && <div style={{ marginTop: 12, fontSize: T.base, color: wasCorrect ? c.g : c.a }}>
          {wasCorrect ? "You already knew this!" : "Good try — you'll learn this phrase next"}
        </div>}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {choiceAnswer.choices.map((choice, i) => {
          const isCorrect = choice[0] === p[0];
          const isSelected = choiceAnswer.selected === choice[0];
          const state = answered && isCorrect ? "correct" : answered && isSelected && !isCorrect ? "wrong" : answered ? "dim" : "idle";
          return <ChoiceCard key={i} c={c} btn={btn} disabled={answered} state={state} onClick={() => {
            if (answered) return;
            setChoiceAnswer({ ...choiceAnswer, selected: choice[0] });
            setFb(choice[0] === p[0] ? "ok" : "no");
            speakPhrase(p[0], p[1]);
          }}>
            <span style={{ fontSize: T.xl, fontFamily: fontJa, fontWeight: 700, lineHeight: 1.3 }}>{choice[1]}</span>
            {answered && isCorrect && <span style={{ fontSize: T.sm, color: c.g, marginLeft: 8 }}>= {p[3]}</span>}
          </ChoiceCard>;
        })}
      </div>
      {answered && <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button className="ts-icon-btn" onClick={() => speakPhrase(p[0], p[1])}
          style={{ ...btn, flex: 1, padding: 12, borderRadius: 10, background: c.s2, border: "1px solid " + c.b, color: c.tx, fontSize: T.sm }}><IconPlay size={14}/> hear it</button>
        <button className="ts-btn" onClick={() => advance(true)}
          style={{ ...btn, flex: 2, padding: 12, borderRadius: 10, background: c.a, color: "#fff", fontSize: T.base, fontWeight: 600 }}>Next →</button>
      </div>}
    </>);
  }

  // ═══ EXERCISE: LEECH REVIEW (special treatment for hard items) ═══
  if (ex.type === "leech-review") {
    // Two-phase leech review: study the mnemonic, then prove recall
    if (ex.isKana) {
      const m = ex.mnemonic;
      const isHiragana = ex.item.charCodeAt(0) >= 0x3040 && ex.item.charCodeAt(0) <= 0x309F;
      const imgPath = `/images/mnemonics/approved/${isHiragana ? "hiragana" : "katakana"}/${ex.item.codePointAt(0).toString(16)}.png`;

      // Phase 1: Study the mnemonic
      if (leechPhase === "study") {
        return withSenpai(<>
          {typeLabel}
          <div style={{ ...card, padding: "20px", marginBottom: 14 }}>
            <div style={{ fontSize: T.xs, fontFamily: mono, color: c.ro, marginBottom: 8 }}>This one keeps tripping you up ({ex.errorCount} mistakes) -- study it, then prove you know it</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ flex: "1 1 40%", textAlign: "center" }}>
                <div style={{ fontSize: 90, lineHeight: 1 }}>{ex.item}</div>
                <div style={{ fontSize: T.xxl, fontWeight: 700, color: c.ro, fontFamily: mono, marginTop: 8 }}>{ex.romaji}</div>
                <button className="ts-icon-btn" onClick={() => speak(ex.item)} style={{ ...btn, marginTop: 8, padding: "5px 12px", borderRadius: 8, background: c.s2, border: "1px solid " + c.b, fontSize: T.sm, color: c.tx }}><IconPlay size={14}/></button>
              </div>
              <img src={imgPath} alt="" onError={e => { e.target.style.display = "none"; }}
                style={{ flex: "1 1 60%", maxWidth: "50%", borderRadius: 12 }} />
            </div>
            {m && <div style={{ marginTop: 14, padding: "12px 16px", background: c.a + "10", borderRadius: 8, border: "1px solid " + c.a + "22" }}>
              <div style={{ fontSize: T.sm, color: c.a, fontWeight: 700, marginBottom: 4 }}>Remember it like this:</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: T.lg }}>{m[0]}</span>
                <span style={{ fontSize: T.sm, fontWeight: 700 }}>{m[1]}</span>
              </div>
              <div style={{ fontSize: T.base, color: c.tx, lineHeight: 1.5 }}>{m[3] || m[2]}</div>
            </div>}
            {KANA_WORDS[ex.item] && <div style={{ marginTop: 10, padding: "10px 14px", background: c.s2, borderRadius: 8 }}>
              <div style={{ fontSize: T.sm, color: c.m, marginBottom: 4 }}>Used in real words:</div>
              {KANA_WORDS[ex.item].map((w, i) => <span key={i} style={{ fontSize: T.base, color: c.tx, marginRight: 12 }}>
                <span style={{ fontWeight: 600 }}>{w.word}</span> <span style={{ color: c.m }}>({w.meaning})</span>
              </span>)}
            </div>}
          </div>
          <button onClick={() => { setLeechPhase("quiz"); setLeechInput(""); setLeechFb(null); cardStartTime.current = Date.now(); }}
            style={{ ...btn, width: "100%", padding: 14, borderRadius: 10, background: c.a, color: "#fff", fontSize: T.base, fontWeight: 600 }}>I've studied it — quiz me →</button>
        </>);
      }

      // Phase 2: Quiz — type the romaji
      const submitLeechKana = () => {
        if (leechFb || !leechInput.trim()) return;
        const ok = leechInput.trim().toLowerCase() === ex.romaji;
        setLeechFb(ok ? "ok" : "no");
        updateKanaSRS(ex.item, ok, "leech-review", getResponseMs());
        if (ok) { setScore(s => ({ ...s, c: s.c + 1 })); senpaiReact(true); }
        else { setScore(s => ({ ...s, w: s.w + 1 })); senpaiReact(false); setStruggled(s => [...s, { label: ex.item, type: "leech-review" }]); }
        setTimeout(() => speak(ex.item), 250);
      };
      return withSenpai(<>
        {typeLabel}
        <div style={{ ...card, padding: "20px", marginBottom: 14 }}>
          <div style={{ fontSize: T.xs, fontFamily: mono, color: c.go, marginBottom: 12 }}>Now prove it -- what is this character?</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 100, lineHeight: 1, marginBottom: 16 }}>{ex.item}</div>
            <input ref={inputRef} value={leechInput} onChange={e => setLeechInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") submitLeechKana(); }}
              placeholder="type romaji..."
              disabled={!!leechFb}
              style={{ width: "100%", maxWidth: 200, padding: "12px 16px", fontSize: T.lg, textAlign: "center", fontFamily: mono, background: leechFb === "ok" ? c.g + "18" : leechFb === "no" ? c.a + "18" : c.s, color: c.tx, border: "1px solid " + (leechFb === "ok" ? c.g : leechFb === "no" ? c.a : c.b), borderRadius: 10, outline: "none" }} />
            {leechFb === "no" && <div style={{ fontSize: T.base, fontWeight: 700, color: c.a, marginTop: 10 }}>It's <span style={{ color: c.g }}>{ex.romaji}</span></div>}
          </div>
        </div>
        {!leechFb
          ? <button onClick={submitLeechKana} disabled={!leechInput.trim()}
              style={{ ...btn, width: "100%", padding: 14, borderRadius: 10, background: leechInput.trim() ? c.a : c.b, color: leechInput.trim() ? "#fff" : c.m, fontSize: T.base, fontWeight: 600 }}>Check</button>
          : <button className="ts-btn" onClick={() => advance(leechFb === "ok")}
              style={{ ...btn, width: "100%", padding: 14, borderRadius: 10, background: c.a, color: "#fff", fontSize: T.base, fontWeight: 600 }}>Next →</button>
        }
      </>);
    }

    // Phrase leech — two-phase: study then pick from choices
    const p = ex.item;

    if (leechPhase === "study") {
      return withSenpai(<>
        {typeLabel}
        <div style={{ ...card, padding: 0, marginBottom: 14 }}>
          {/* Scene image for re-encoding */}
          <img src={`/images/phrases/scenes/${p[0]}.png`} alt="" style={{ width: "100%", height: isDesktop ? 180 : 140, objectFit: "cover", display: "block", borderRadius: "12px 12px 0 0" }} onError={e => { e.target.style.display = "none"; }} />
          <div style={{ padding: "16px 20px" }}>
          <div style={{ fontSize: T.xs, fontFamily: mono, color: c.ro, marginBottom: 12 }}>This phrase keeps tripping you up ({ex.errorCount} mistakes) — study it, then prove you know it</div>
          <PhraseSegments phraseId={p[0]} c={c} fontSize={isDesktop ? T.xxl : T.xl} />
          <div style={{ fontSize: T.sm, fontFamily: mono, color: c.ro, marginTop: 8 }}>{p[2]}</div>
          <div style={{ fontSize: T.lg, fontWeight: 600, color: c.tx, marginTop: 4 }}>{p[3]}</div>
          {p[5] && <div style={{ fontSize: T.base, color: c.tx, marginTop: 10, padding: "10px 14px", background: c.s2, borderRadius: 8, borderLeft: "3px solid " + c.a }}>{p[5]}</div>}
          <div style={{ marginTop: 12, padding: "10px 14px", background: c.a + "10", borderRadius: 8, border: "1px solid " + c.a + "22" }}>
            <div style={{ fontSize: T.sm, color: c.a, fontWeight: 700, marginBottom: 4 }}>Break it down:</div>
            <div style={{ fontSize: T.base, color: c.tx }}>Tap each word above to see what it means. Listen carefully to the pronunciation.</div>
          </div>
          <button className="ts-icon-btn" onClick={() => speakPhraseWithEnglish(p[0], p[1], p[3])}
            style={{ ...btn, width: "100%", marginTop: 10, padding: "10px 16px", borderRadius: 8, background: c.s2, border: "1px solid " + c.b, fontSize: T.sm, color: c.tx }}><IconSlowPlay size={14}/> hear it slowly</button>
          </div>
        </div>
        <button onClick={() => {
          // Set up the quiz: show English, pick the Japanese from 4 choices
          const distractors = getDistractors(p, 3);
          const choices = stableChoices([p, ...distractors]);
          setLeechChoices(choices);
          setLeechPhase("quiz");
          setLeechPicked(null);
          setLeechFb(null);
          cardStartTime.current = Date.now();
        }}
          style={{ ...btn, width: "100%", padding: 14, borderRadius: 10, background: c.a, color: "#fff", fontSize: T.base, fontWeight: 600 }}>I've studied it — quiz me →</button>
      </>);
    }

    // Phase 2: Quiz — see English, pick the Japanese
    const handleLeechPhrasePick = (choice) => {
      if (leechFb) return;
      const ok = choice[0] === p[0];
      setLeechPicked(choice[0]);
      setLeechFb(ok ? "ok" : "no");
      reviewPhr(p[0], ok, "leech-review", getResponseMs());
      if (ok) { setScore(s => ({ ...s, c: s.c + 1 })); senpaiReact(true); speakPhrase(p[0], p[1]); }
      else { setScore(s => ({ ...s, w: s.w + 1 })); senpaiReact(false); setStruggled(s => [...s, { label: p[1], type: "leech-review" }]); }
    };
    return withSenpai(<>
      {typeLabel}
      <div style={{ ...card, padding: "20px", marginBottom: 14 }}>
        <div style={{ fontSize: T.xs, fontFamily: mono, color: c.go, marginBottom: 12 }}>Now prove it -- which phrase means:</div>
        <div style={{ fontSize: T.lg, fontWeight: 700, color: c.tx, marginBottom: 16 }}>{p[3]}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {leechChoices.map(ch => {
            const isCorrect = ch[0] === p[0];
            const isPicked = leechPicked === ch[0];
            const bg = leechFb ? (isCorrect ? c.g + "18" : isPicked ? c.a + "18" : c.s) : c.s;
            const border = leechFb ? (isCorrect ? c.g : isPicked && !isCorrect ? c.a : c.b) : c.b;
            return <button key={ch[0]} onClick={() => handleLeechPhrasePick(ch)}
              disabled={!!leechFb}
              style={{ ...btn, padding: "12px 16px", borderRadius: 10, background: bg, border: "1px solid " + border, color: c.tx, fontSize: T.base, fontWeight: 500, textAlign: "left", cursor: leechFb ? "default" : "pointer" }}>
              {ch[1]}
            </button>;
          })}
        </div>
      </div>
      {leechFb && <button className="ts-btn" onClick={() => advance(leechFb === "ok")}
        style={{ ...btn, width: "100%", padding: 14, borderRadius: 10, background: c.a, color: "#fff", fontSize: T.base, fontWeight: 600 }}>Next →</button>}
    </>);
  }

  // Fallback
  return withSenpai(<div style={{ textAlign: "center", color: c.m, padding: 40 }}>Unknown exercise type</div>);
}
