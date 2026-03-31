# Learning Science: What Actually Works

> **The fastest path to Japanese fluency, backed by science.** Every feature must accelerate learning. Every decision is measured against: "Does this help the user understand Japanese faster?" If it doesn't, cut it.

---

## The Learning Journey

Each layer unlocks naturally based on progress — no manual gates:

```
Week 1-2:  Base kana (learn cards + visual quiz + listen grid)
  ↓ 20+ kana
Week 2-3:  Confused pairs unlock (シ/ツ, は/ほ side-by-side drilling)
  ↓ 30+ kana
Week 3-4:  Dakuten in sessions + first phrases + context words on kana cards
  ↓ 5+ phrases
Week 4-5:  Confused phrase pairs + grammar patterns emerge + conversations
  ↓ 10+ phrases + box 1+
Week 5-6:  Reverse exercises (English → pick Japanese) + phrase production
  ↓ 60+ kana
Week 6-8:  Yōon + sentence listening at natural speed + AI stories
  ↓ Ongoing
Always:    Map connects language to places, SRS reviews everything,
           leech detection catches stuck items, skill tracking routes
           exercises to weakest dimension
```

---

## Evidence Base for Current Features

| Feature | Status | Evidence | Key Study |
|---------|--------|----------|-----------|
| Retrieval practice (quizzing) | **Shipped** | **Strong** | Roediger & Karpicke 2006 — 100%+ better than restudying |
| FSRS-5 spaced repetition | **Shipped** | **Strong** | Ebbinghaus curve, Murre & Dros 2015 replication |
| Confused pairs interleaving (kana) | **Shipped** | **Strong** | Kornell & Bjork 2008 — 43% better discrimination |
| Confused phrase pairs | **Shipped** | **Strong** | Extension of Kornell & Bjork to sentence-level structures |
| Productive failure (try-first) | **Shipped** | **Strong** | Kapur 2014 — struggle before instruction → better outcomes |
| Desirable difficulties | **Shipped** | **Strong** | Bjork & Kroll 2015 — trick questions improve retention |
| Production > recognition | **Shipped** | **Strong** | Karpicke & Roediger 2008, MacLeod et al 2010 |
| Grammar pattern noticing | **Shipped** | **Strong** | Norris & Ortega 2000 — explicit d=1.13 vs implicit d=0.54 |
| Context sentences for vocab | **Shipped** | **Moderate-Strong** | Nation 2001, Hulstijn & Laufer 2001 |
| Dual coding (image + text) | **Shipped** | **Strong** | 89% better transfer in dual coding studies |
| Pattern assembly (generative production) | **Shipped** | **Strong** | Novel recombination strengthens grammar acquisition |
| Emotional memory (stories) | **Shipped** | **Strong** | Zero forgetting at 1.5 months for emotional content |
| Streaks / gamification | **Shipped** | **Moderate** | Duolingo: 7-day streak → 2.4x retention |
| Leech detection + treatment | **Shipped** | **Strong** | Adaptive response to items with 5+ errors |
| Multi-dimensional skill tracking | **Shipped** | **Strong** | Adaptive Difficulty Engine — visual/listen/production per item |
| Interleaved daily mix | **Shipped** | **Strong** | 19% improvement on delayed tests (Ertekin 2023) |
| Conversation chains | **Shipped** | **Strong** | Contextual dialogue > isolated phrase practice |
| Badges / achievements | **Shipped** | **Moderate** | Medium effect on motivation (Sauro & Smith 2023) |
| Natural-speed listening | **Shipped** | **Moderate** | Chang & Millett 2014 — graduated approach |
| Response time tracking | **Shipped** | **Moderate** | Infrastructure for future adaptive difficulty |
| Handwriting / motor memory | Not yet | **Moderate** | Naka & Naoi 1995 — helps, especially complex characters |
| Shadowing / voice input | Not yet | **Strong** | 25-40% improvement in 8 weeks |

---

## The Big Takeaways

### 1. Testing beats studying by >100%
Retrieval practice (quizzing yourself) produces more than **double** the retention of passive review. This isn't marginal — it's the single most impactful thing we can do. Every feature should prioritise getting the user to RECALL, not just recognise.

**What this means for us:**
- Default to quiz/recall modes, not browse/read modes
- Multiple choice is OK but free recall (typing) is better
- Even wrong answers help — the act of trying to recall strengthens memory
- Productive failure (try-first exercises) leverages this: quiz BEFORE teaching ✓

### 2. Production > Recognition (substantially)
Producing language (typing, speaking, writing) creates stronger memories than recognising it (multiple choice, reading). Free recall scored 75% vs 60% for elaboration in studies.

**What we've built:**
- `phrase-reverse`: see English → pick Japanese (production) ✓
- `phrase-production`: English → pick from 8 Japanese options ✓
- `kana-reverse`: see romaji → pick character ✓
- `pattern-assembly`: tap-to-build sentences from grammar templates + vocabulary ✓
- Production exercises softened at box 1 (15%), full ramp at box 2-3 (85% accuracy target) ✓
- Production types get 15% FSRS stability bonus (stronger evidence of learning) ✓
- Multi-dimensional skill tracking routes to weakest skill (visual/listen/production) ✓
- **Still to do**: voice input for speaking practice (Web Speech API)

### 3. Short daily sessions beat occasional long ones
20 minutes daily >> 2 hours weekly. The brain consolidates during sleep — spreading practice across days gives more consolidation cycles.

**What this means for us:**
- Design for 5-15 minute sessions, not 30+ minute marathons ✓
- Smart sessions are 10 cards (~5-8 minutes) ✓
- Show session time so users know they've done enough ✓
- Streak system rewards consistency over intensity ✓

### 4. Desirable difficulties improve learning
Making things HARDER (within reason) improves long-term retention. This seems counterintuitive but is well-established.

**What we've built:**
- "None of these" trick questions in phrase exercises ✓
- Interleaving categories in practice (mix greetings + transport) ✓
- Confused pair drills (visually similar kana AND structurally similar phrases) ✓
- Productive failure: quiz before teaching ✓
- Manual "Next →" button: user must process the answer before moving on ✓

### 5. Context dramatically improves retention
Phrases learned in realistic scenarios stick far better than isolated word lists. Knowledge is more easily acquired when associated with specific situations.

**What we've built:**
- Scenario-based phrase practice with situational prompts ✓
- Fill-in-the-blank conversation dialogues ✓
- AI branching conversations in realistic settings ✓
- AI-generated stories using known phrases ✓
- Japan map connecting phrases to real places ✓
- Kana context words showing real vocabulary ✓

### 6. FSRS-5 targets optimal retention
The optimal review time is individually calculated per item based on stability and difficulty — not fixed intervals.

**What we've built:**
- FSRS-5 adaptive algorithm: per-item stability + difficulty tracking ✓
- 85% target retention rate ✓
- Backward-compatible 6-box mapping via `stabilityToBox()` ✓
- Leech detection: items with 5+ errors get special mnemonic treatment instead of more quizzing ✓
- Recently-learned window: 2-hour same-session reinforcement (was 24h — caused cross-session repetition) ✓

### 7. Streaks genuinely work (2.4x retention)
Users who maintain a 7-day streak are 2.4x more likely to continue. Gamification effect size on cognitive learning: 0.49-0.82 (medium to large).

**What we've built:**
- Streak tracking with day-based counting ✓
- 12 achievement badges (milestones, streaks, S-ranks, explorer) ✓
- XP/Level system (11 tiers) ✓
- S-rank tracking for perfect sessions ✓

### 8. For Japanese: combine audio + visual
Pure audio doesn't work well for adult learners. For learning new material, visual reinforcement is essential.

**What we've built:**
- Japanese text shown while hearing pronunciation ✓
- PhraseSegments: interactive word-by-word breakdown with audio ✓
- Romaji shown as training wheels (future: progressively hidden)
- "Hear again" + "Next →" buttons: user controls audio pace ✓

### 9. Top learners use frequency, not intensity
Polyglots succeed through high-frequency engagement and social strategies, not through willpower or long study sessions.

**What we've built:**
- Senpai roleplay is social strategy in disguise ✓
- Track and celebrate consistency via streaks/badges ✓
- Quick sessions (~5 min) lower the barrier to daily practice ✓

---

## Feature Implications

### Shipped (ranked by research impact):

**Highest impact (retrieval practice + production):**
1. ✅ **Smart Sessions** — adaptive quiz pulling from weakest items across kana + phrases, 5-15 min target
2. ✅ **Production exercises** — see English, pick/type the Japanese (reverse + production modes)
3. ✅ **Adaptive difficulty** — multi-dimensional skill tracking (visual/listen/production), weakest skill routing

**High impact (spacing + context):**
4. ✅ **Leech detection** — flag items wrong 5+ times, show special mnemonic treatment
5. ✅ **Interleaved practice** — kana/phrase alternation in sessions, cross-category variety
6. ✅ **Mini-conversations** — fill-in-the-blank dialogue + AI branching conversations
7. ✅ **Productive failure** — try-first exercises quiz BEFORE teaching

**Medium impact (gamification + habit):**
8. ✅ **Achievement badges** — 12 milestone rewards
9. ✅ **Session timer** — shows elapsed time during session

### Not yet built (still worth considering):

**High impact:**
1. **Voice input / shadowing** — speak the phrase, compare to native (Web Speech API). Research shows 25-40% improvement in 8 weeks.
2. **Progressive romaji hiding** — auto-hide romaji after X correct answers. Romaji creates pronunciation fossils after 1-2 weeks.

**Medium impact:**
3. **Streak freeze** — miss one day without losing streak (reduces anxiety)
4. **Bedtime review** — 3-minute audio-only review before sleep (consolidation is timing-dependent)
5. **Character tracing** — canvas-based kana tracing for motor memory (handwriting > typing for retention)
6. **Pitch accent indicators** — show high/low pitch on phrases

**Lower impact:**
7. **Emergency quick-access** — large Japanese text for showing to Japanese people (offline, no quiz flow)
8. **Metacognition prompts** — "which phrases felt hardest? Why?" after sessions

---

## Deep Research: Additional Findings (March 2026)

### 10. Dual coding: visual + verbal = 89% better transfer
Combining images with words improved transfer test performance by 89% over text-only. This is why our watercolor mnemonic images work — they're not decoration, they're dual coding in action.

### 11. Emotional memory shows ZERO forgetting over 1.5 months
Participants exposed to emotional arousal showed no forgetting over a 1.5-month delay. Neutral content showed substantial forgetting. Emotionally-charged content in foreign languages improves vocabulary memory significantly.

### 12. Handwriting beats everything for character retention
Students who wrote characters by hand demonstrated better memory retention AND faster recall than typing. Recognition for typed characters gradually decreased over 3 weeks; handwritten recognition remained stable. Pen > stylus > keyboard.

### 13. Microlearning: 3-5 min modules = 20% better performance
Students with chunked learning performed 20% better and took 28% less time. Knowledge retention improved up to 80% with frequent repetition + spaced intervals. 3-5 minutes is the optimal module length.

### 14. 1000 Japanese words = 80% of all conversations
Top 1000 words cover 76-80% of daily Japanese. The next 2000 words add only 10% more. Our 100 phrases cover survival needs; the building-block system (`BUILDING_BLOCKS` in sessionEngine) helps learners recognise shared patterns across phrases.

### 15. Shadowing: 25-40% improvement in 8 weeks
Simultaneous listening + repeating aloud produces dramatic listening comprehension gains. Especially effective for Japanese pitch accent and natural rhythm.

### 16. Productive failure beats direct instruction ✅ IMPLEMENTED
Students who struggled with problems BEFORE receiving instruction outperformed those who received instruction first — on both immediate and delayed tests. **Now shipping as `try-first-kana` and `try-first-phrase` exercises.**

### 17. Sleep consolidation is timing-dependent
Procedural skills (speaking, listening) best learned in evening before sleep. Declarative knowledge (vocabulary, grammar rules) better in afternoon. Sleep immediately after learning is critical — can't be made up.

### 18. Romaji: useful bridge, becomes hindrance
Romaji creates fossilized pronunciation errors. Expert recommendation: 1-2 weeks on hiragana/katakana, then abandon romaji. Our progressive romaji toggle (hide as learner improves) is the right approach.

### 19. Japanese-specific: listening is hardest (78% agree)
No audible word boundaries in Japanese speech — it sounds like one continuous stream. Mora-based segmentation is alien to English ears. Dedicated listening training is essential and under-served.

### 20. The plateau hits at 6-12 months
Most learners stall at intermediate level. Solution: change methods (don't keep doing the same thing), force active production, and increase immersion ratio.

---

## What NOT to do (anti-patterns from research):

- **Don't make browsing the default** — it's passive and produces minimal learning
- **Don't rely on multiple choice alone** — free recall is substantially better
- **Don't show the answer too quickly** — the struggle of trying to recall IS the learning (manual Next button helps here)
- **Don't let users skip difficulty** — desirable difficulties improve outcomes
- **Don't gamify without substance** — points without retrieval practice = engaging but not effective
- **Don't do long sessions** — 15 minutes of quizzing beats 60 minutes of reading
- **Don't teach romaji-first** — it creates pronunciation fossils
- **Don't ignore listening** — it's the hardest skill and most under-served
- **Don't enforce a silent period** — let beginners speak when they want to
- **Don't auto-advance phrase exercises** — audio gets cut off, user doesn't process the answer

---

## Sources

**Core learning science:**
- Roediger & Karpicke (2006): The Power of Testing Memory
- Rowland (2014): Meta-analysis of retrieval practice (159 studies, g = 0.50)
- Ebbinghaus Forgetting Curve (replicated in Murre & Dros, 2015)
- Bjork & Kroll (2015): Desirable Difficulties in Vocabulary Learning
- Kapur (2014): Productive Failure in Learning Math / Science
- Sauro & Smith (2023): Gamification meta-analysis (g = 0.822)
- Kornell & Bjork (2008): Interleaving for perceptual discrimination

**Language-specific:**
- Duolingo Research: 7-day streak → 2.4x retention
- Ertekin (2023): Interleaving vs blocking in L2 (19% improvement)
- Norris & Ortega (2000): Explicit vs implicit grammar instruction (d=1.13 vs d=0.54)
- Schmidt (1990): Noticing Hypothesis for grammar acquisition
- Nation (2001): Vocabulary learning through context sentences
- PMC studies on production effect in second language acquisition
- Shadowing for Japanese pronunciation (25-40% improvement, 8 weeks)

**Cognitive science:**
- Dual coding theory (89% improvement in transfer tests)
- Emotional memory (zero forgetting at 1.5 months)
- Sleep consolidation timing (procedural evening, declarative afternoon)
- Handwriting vs typing (motor memory persistence over 3 weeks)
- Productive failure framework (PF > direct instruction)
- Microlearning effectiveness (20% better, 28% faster)
- Cognitive load theory and language app design
- Flow state and optimal experience in L2 learning
- Metacognition and self-regulated learning

**Japanese-specific:**
- 80/20 frequency analysis (1000 words = 80% coverage)
- Listening difficulty research (78% hardest skill)
- Romaji interference studies
- Pitch accent importance for beginners
- Kanji method comparison (RTK, KKLC, WaniKani)
- Silent period research for Japanese learners
