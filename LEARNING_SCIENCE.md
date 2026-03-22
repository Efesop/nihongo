# Learning Science: What Actually Works

Research-backed findings that should drive every feature decision in TinySenpai.

---

## The Big Takeaways

### 1. Testing beats studying by >100%
Retrieval practice (quizzing yourself) produces more than **double** the retention of passive review. This isn't marginal — it's the single most impactful thing we can do. Every feature should prioritise getting the user to RECALL, not just recognise.

**What this means for us:**
- Default to quiz/recall modes, not browse/read modes
- Multiple choice is OK but free recall (typing) is better
- Even wrong answers help — the act of trying to recall strengthens memory
- "Hear again" buttons are passive — quizzing is active

### 2. Production > Recognition (substantially)
Producing language (typing, speaking, writing) creates stronger memories than recognising it (multiple choice, reading). Free recall scored 75% vs 60% for elaboration in studies.

**What this means for us:**
- Typing romaji for kana quiz: GOOD (production)
- Multiple choice for phrases: OK but not optimal
- We should add: see English → type Japanese romaji for phrases too
- Speaking practice would be even better (future: voice input?)

### 3. Short daily sessions beat occasional long ones
20 minutes daily >> 2 hours weekly. The brain consolidates during sleep — spreading practice across days gives more consolidation cycles.

**What this means for us:**
- Design for 5-15 minute sessions, not 30+ minute marathons
- "Daily 5" / quick quiz is the RIGHT direction
- Show session time so users know they've done enough
- Don't make the app feel like it needs an hour — people won't come back

### 4. Desirable difficulties improve learning
Making things HARDER (within reason) improves long-term retention. This seems counterintuitive but is well-established.

**What this means for us:**
- "None of these" trick questions: GOOD (desirable difficulty)
- Reducing cues over time (hide romaji as learner progresses): GOOD
- Interleaving categories in practice (mix greetings + transport): GOOD
- Speed pressure: GOOD for kana recognition
- DON'T make it frustrating — the difficulty should be achievable

### 5. Context dramatically improves retention
Phrases learned in realistic scenarios stick far better than isolated word lists. Knowledge is more easily acquired when associated with specific situations.

**What this means for us:**
- Scenario-based phrase practice: EXCELLENT (we have this)
- The situation prompts ("You're at a restaurant..."): KEEP and expand
- Real photos/images of Japanese scenarios: helps even more
- Consider mini-conversations (dialogue flow, not just single phrases)

### 6. Spacing should target 80% retention
The optimal review time is when you remember something at about 80% — not when you've completely forgotten, and not when you still remember perfectly.

**What this means for us:**
- Our SRS intervals (0.5d, 1d, 3d, 7d, 14d) are reasonable
- But fixed intervals aren't optimal — adaptive would be better
- Leeches (items wrong 10+ times) need special treatment:
  - Show them differently (mnemonic, breakdown, context)
  - Don't just keep quizzing the same way
  - Consider: "Why is this hard?" explanation

### 7. Streaks genuinely work (2.4x retention)
Users who maintain a 7-day streak are 2.4x more likely to continue. Gamification effect size on cognitive learning: 0.49-0.82 (medium to large).

**What this means for us:**
- Our streak system: KEEP and make more prominent
- Consider: streak freeze (don't lose streak for one missed day)
- Badges/achievements: worth adding (medium effect on motivation)
- But gamification supplements, doesn't replace, retrieval practice

### 8. For Japanese: combine audio + visual
Pure audio doesn't work well for adult learners. Japanese listeners are actually slower in audiovisual conditions vs auditory-only for simple recognition, BUT for learning new material, visual reinforcement is essential.

**What this means for us:**
- English → Japanese audio chain: GOOD
- Showing the kana/kanji while hearing it: ESSENTIAL
- Romaji as training wheels, progressively hidden: GOOD
- Consider: show Japanese text while hearing phrases

### 9. Top learners use frequency, not intensity
Polyglots succeed through high-frequency engagement and social strategies, not through willpower or long study sessions. "Small and efficient language networks" develop through consistent use.

**What this means for us:**
- Push notifications / reminders for daily practice
- Make opening the app → doing one quiz < 10 seconds
- Senpai roleplay is social strategy in disguise: EXPAND
- Track and celebrate consistency, not total time

---

## Feature Implications

### What we should build next (ranked by research impact):

**Highest impact (retrieval practice + production):**
1. **Daily Review** — adaptive quiz pulling from weakest items across kana + phrases, 5-15 min target
2. **Production quiz for phrases** — see English, TYPE the romaji (not multiple choice)
3. **Adaptive difficulty** — auto-hide romaji after X correct answers, harder quiz modes unlock progressively

**High impact (spacing + context):**
4. **Leech detection** — flag items wrong 5+ times, show special help (mnemonic, breakdown)
5. **Interleaved practice** — mix kana + phrases + listening in one session (not separate tabs)
6. **Mini-conversations** — phrase practice as 2-3 turn dialogues, not isolated phrases

**Medium impact (gamification + habit):**
7. **Streak freeze** — miss one day without losing streak (reduces anxiety)
8. **Achievement badges** — milestone rewards (already planned)
9. **Session timer** — show "3 minutes practiced today" so users feel accomplished

**Lower impact but worth considering:**
10. **Voice input** — speak the phrase, compare to native (Web Speech API)
11. **Handwriting practice** — trace kana on canvas
12. **Pitch accent indicators** — show high/low pitch on phrases

---

## What NOT to do (anti-patterns from research):

- **Don't make browsing the default** — it's passive and produces minimal learning
- **Don't rely on multiple choice alone** — free recall is substantially better
- **Don't show the answer too quickly** — the struggle of trying to recall IS the learning
- **Don't let users skip difficulty** — desirable difficulties improve outcomes
- **Don't gamify without substance** — points without retrieval practice = engaging but not effective
- **Don't do long sessions** — 15 minutes of quizzing beats 60 minutes of reading

---

## Sources

- Roediger & Karpicke (2006): The Power of Testing Memory
- Rowland (2014): Meta-analysis of retrieval practice (159 studies, g = 0.50)
- Ebbinghaus Forgetting Curve (replicated in Murre & Dros, 2015)
- Bjork & Kroll (2015): Desirable Difficulties in Vocabulary Learning
- Sauro & Smith (2023): Gamification meta-analysis (g = 0.822)
- Duolingo Research: 7-day streak → 2.4x retention
- Ertekin (2023): Interleaving vs blocking in L2 (19% improvement on delayed tests)
- PMC studies on production effect in second language acquisition
