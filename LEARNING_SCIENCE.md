# Learning Science: What Actually Works

> **Fastest path to Japanese fluency, backed by science.** Every feature must accelerate learning. Every decision measured: "Does this help user understand Japanese faster?" If not, cut it.

---

## The Learning Journey

Each layer unlocks from progress — no manual gates:

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
| Confused phrase pairs | **Shipped** | **Strong** | Extension of Kornell & Bjork to sentence-level |
| Productive failure (try-first) | **Shipped** | **Strong** | Kapur 2014 — struggle before instruction → better outcomes |
| Desirable difficulties | **Shipped** | **Strong** | Bjork & Kroll 2015 — trick questions improve retention |
| Production > recognition | **Shipped** | **Strong** | Karpicke & Roediger 2008, MacLeod et al 2010 |
| Grammar pattern noticing | **Shipped** | **Strong** | Norris & Ortega 2000 — explicit d=1.13 vs implicit d=0.54 |
| Context sentences for vocab | **Shipped** | **Moderate-Strong** | Nation 2001, Hulstijn & Laufer 2001 |
| Dual coding (image + text) | **Shipped** | **Strong** | 89% better transfer |
| Pattern assembly (generative production) | **Shipped** | **Strong** | Novel recombination strengthens grammar acquisition |
| Emotional memory (stories) | **Shipped** | **Strong** | Zero forgetting at 1.5 months for emotional content |
| Streaks / gamification | **Shipped** | **Moderate** | Duolingo: 7-day streak → 2.4x retention |
| Leech detection + treatment | **Shipped** | **Strong** | Adaptive response, items with 5+ errors |
| Multi-dimensional skill tracking | **Shipped** | **Strong** | Adaptive Difficulty Engine — visual/listen/production per item |
| Interleaved daily mix | **Shipped** | **Strong** | 19% improvement, delayed tests (Ertekin 2023) |
| Conversation chains | **Shipped** | **Strong** | Contextual dialogue > isolated phrase practice |
| Badges / achievements | **Shipped** | **Moderate** | Medium effect on motivation (Sauro & Smith 2023) |
| Natural-speed listening | **Shipped** | **Moderate** | Chang & Millett 2014 — graduated approach |
| Response time tracking | **Shipped** | **Moderate** | Infrastructure for adaptive difficulty |
| Handwriting / motor memory | Not yet | **Moderate** | Naka & Naoi 1995 — helps, especially complex characters |
| Shadowing / voice input | Not yet | **Strong** | 25-40% improvement, 8 weeks |

---

## The Big Takeaways

### 1. Testing beats studying by >100%
Retrieval practice (quizzing yourself) produces more than **double** retention vs passive review. Not marginal — single most impactful thing. Every feature should prioritise RECALL, not recognise.

**For us:**
- Default to quiz/recall modes, not browse/read
- Multiple choice OK but free recall (typing) better
- Wrong answers help — act of trying strengthens memory
- Productive failure (try-first) leverages this: quiz BEFORE teaching ✓

### 2. Production > Recognition (substantially)
Producing language (typing, speaking, writing) creates stronger memories than recognising (multiple choice, reading). Free recall scored 75% vs 60% for elaboration.

**What we built:**
- `phrase-reverse`: English → pick Japanese (production) ✓
- `phrase-production`: English → pick from 8 Japanese ✓
- `kana-reverse`: romaji → pick character ✓
- `pattern-assembly`: tap-to-build sentences from grammar templates + vocab ✓
- Production softened at box 1 (15%), full ramp box 2-3 (85% accuracy target) ✓
- Production types get 15% FSRS stability bonus ✓
- Multi-dimensional skill tracking routes to weakest skill ✓
- **Todo**: voice input for speaking practice (Web Speech API)

### 3. Short daily sessions beat occasional long ones
20 min daily >> 2 hours weekly. Brain consolidates during sleep — spreading practice across days gives more cycles.

**For us:**
- Design 5-15 min sessions, not 30+ min marathons ✓
- Smart sessions 10 cards (~5-8 min) ✓
- Show session time so users know done enough ✓
- Streak rewards consistency over intensity ✓

### 4. Desirable difficulties improve learning
Making things HARDER (within reason) improves long-term retention. Counterintuitive but well-established.

**What we built:**
- "None of these" trick questions in phrase exercises ✓
- Interleaving categories (mix greetings + transport) ✓
- Confused pair drills (visually similar kana, structurally similar phrases) ✓
- Productive failure: quiz before teaching ✓
- Manual "Next →" button: user processes answer before moving ✓

### 5. Context dramatically improves retention
Phrases learned in realistic scenarios stick better than isolated word lists. Knowledge more easily acquired when tied to specific situations.

**What we built:**
- Scenario-based phrase practice, situational prompts ✓
- Fill-in-the-blank conversation dialogues ✓
- AI branching conversations, realistic settings ✓
- AI-generated stories using known phrases ✓
- Japan map connecting phrases to real places ✓
- Kana context words showing real vocab ✓

### 6. FSRS-5 targets optimal retention
Optimal review time individually calculated per item from stability + difficulty — not fixed intervals.

**What we built:**
- FSRS-5 adaptive: per-item stability + difficulty tracking ✓
- 85% target retention rate ✓
- Back-compat 6-box mapping via `stabilityToBox()` ✓
- Leech detection: 5+ errors get mnemonic treatment instead of more quizzing ✓
- Recently-learned window: 2-hour same-session reinforcement (was 24h — caused cross-session repetition) ✓

### 7. Streaks genuinely work (2.4x retention)
7-day streak users 2.4x more likely to continue. Gamification effect size on cognitive learning: 0.49-0.82 (medium to large).

**What we built:**
- Streak tracking, day-based counting ✓
- 12 achievement badges (milestones, streaks, S-ranks, explorer) ✓
- XP/Level system (11 tiers) ✓
- S-rank tracking for perfect sessions ✓

### 8. For Japanese: combine audio + visual
Pure audio poor for adult learners. Visual reinforcement essential for new material.

**What we built:**
- Japanese text shown while hearing pronunciation ✓
- PhraseSegments: word-by-word breakdown with audio ✓
- Romaji shown as training wheels (future: progressively hidden)
- "Hear again" + "Next →" buttons: user controls audio pace ✓

### 9. Top learners use frequency, not intensity
Polyglots succeed through high-frequency engagement + social strategies, not willpower or long sessions.

**What we built:**
- Senpai roleplay is social strategy in disguise ✓
- Track + celebrate consistency via streaks/badges ✓
- Quick sessions (~5 min) lower daily practice barrier ✓

---

## Feature Implications

### Shipped (ranked by research impact):

**Highest impact (retrieval practice + production):**
1. ✅ **Smart Sessions** — adaptive quiz pulling from weakest items across kana + phrases, 5-15 min target
2. ✅ **Production exercises** — see English, pick/type Japanese (reverse + production modes)
3. ✅ **Adaptive difficulty** — multi-dimensional skill tracking (visual/listen/production), weakest skill routing

**High impact (spacing + context):**
4. ✅ **Leech detection** — flag items wrong 5+ times, special mnemonic treatment
5. ✅ **Interleaved practice** — kana/phrase alternation in sessions, cross-category variety
6. ✅ **Mini-conversations** — fill-in-the-blank dialogue + AI branching
7. ✅ **Productive failure** — try-first quiz BEFORE teaching

**Medium impact (gamification + habit):**
8. ✅ **Achievement badges** — 12 milestone rewards
9. ✅ **Session timer** — shows elapsed time

### Not yet built (still worth considering):

**High impact:**
1. **Voice input / shadowing** — speak phrase, compare to native (Web Speech API). 25-40% improvement, 8 weeks.
2. **Progressive romaji hiding** — auto-hide after X correct. Romaji creates pronunciation fossils after 1-2 weeks.

**Medium impact:**
3. **Streak freeze** — miss one day without losing streak (reduces anxiety)
4. **Bedtime review** — 3-min audio-only review before sleep (consolidation timing-dependent)
5. **Character tracing** — canvas-based kana tracing, motor memory (handwriting > typing)
6. **Pitch accent indicators** — show high/low pitch on phrases

**Lower impact:**
7. **Emergency quick-access** — large Japanese text for showing to Japanese people (offline, no quiz flow)
8. **Metacognition prompts** — "which phrases felt hardest? Why?" after sessions

---

## Deep Research: Additional Findings (March 2026)

### 10. Dual coding: visual + verbal = 89% better transfer
Images + words improved transfer test 89% over text-only. Why watercolor mnemonic images work — not decoration, dual coding in action.

### 11. Emotional memory shows ZERO forgetting over 1.5 months
Emotional arousal → no forgetting at 1.5-month delay. Neutral content substantial forgetting. Emotionally-charged L2 content improves vocab memory significantly.

### 12. Handwriting beats everything for character retention
Hand-written characters → better retention AND faster recall than typing. Typed character recognition decreased over 3 weeks; handwritten stable. Pen > stylus > keyboard.

### 13. Microlearning: 3-5 min modules = 20% better performance
Chunked learners performed 20% better, took 28% less time. Retention up to 80% with frequent repetition + spaced intervals. 3-5 min = optimal module length.

### 14. 1000 Japanese words = 80% of all conversations
Top 1000 words cover 76-80% of daily Japanese. Next 2000 add only 10% more. Our 100 phrases cover survival; building-block system (`BUILDING_BLOCKS` in sessionEngine) helps recognise shared patterns.

### 15. Shadowing: 25-40% improvement in 8 weeks
Simultaneous listening + repeating aloud → dramatic listening comprehension gains. Especially effective for Japanese pitch accent + natural rhythm.

### 16. Productive failure beats direct instruction ✅ IMPLEMENTED
Struggling with problems BEFORE instruction outperformed instruction-first — on immediate AND delayed tests. **Now shipping as `try-first-kana` and `try-first-phrase`.**

### 17. Sleep consolidation is timing-dependent
Procedural skills (speaking, listening) best learned evening before sleep. Declarative (vocab, grammar rules) better in afternoon. Sleep immediately after learning critical — can't be made up.

### 18. Romaji: useful bridge, becomes hindrance
Romaji creates fossilized pronunciation errors. Expert rec: 1-2 weeks on hiragana/katakana, then abandon. Our progressive romaji toggle (hide as learner improves) is right approach.

### 19. Japanese-specific: listening is hardest (78% agree)
No audible word boundaries in Japanese speech — sounds like continuous stream. Mora-based segmentation alien to English ears. Dedicated listening training essential + under-served.

### 20. The plateau hits at 6-12 months
Most learners stall at intermediate. Solution: change methods, force active production, increase immersion ratio.

---

## What NOT to do (anti-patterns):

- **Don't default to browsing** — passive, minimal learning
- **Don't rely on multiple choice alone** — free recall substantially better
- **Don't show answer too quickly** — struggle of trying to recall IS the learning (manual Next button helps)
- **Don't let users skip difficulty** — desirable difficulties improve outcomes
- **Don't gamify without substance** — points without retrieval practice = engaging but not effective
- **Don't do long sessions** — 15 min quizzing beats 60 min reading
- **Don't teach romaji-first** — creates pronunciation fossils
- **Don't ignore listening** — hardest skill, most under-served
- **Don't enforce silent period** — let beginners speak when they want
- **Don't auto-advance phrase exercises** — audio cut off, user doesn't process answer

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
