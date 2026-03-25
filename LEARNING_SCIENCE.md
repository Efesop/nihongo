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
  ↓ 10+ phrases
Week 4-5:  Grammar patterns emerge ("You've seen です in 6 phrases...")
  ↓ 15+ phrases + box 2+
Week 5-6:  Reverse exercises (English → pick Japanese, no romaji)
  ↓ 60+ kana
Week 6-8:  Yōon + sentence listening at natural speed
  ↓ Ongoing
Always:    Map connects language to places, SRS reviews everything
```

---

## Evidence Base for Current Features

| Feature | Evidence | Key Study |
|---------|----------|-----------|
| Retrieval practice (quizzing) | **Strong** | Roediger & Karpicke 2006 — 100%+ better than restudying |
| FSRS-5 spaced repetition | **Strong** | Ebbinghaus curve, Murre & Dros 2015 replication |
| Confused pairs interleaving | **Strong** | Kornell & Bjork 2008 — 43% better discrimination |
| Desirable difficulties | **Strong** | Bjork & Kroll 2015 — trick questions improve retention |
| Production > recognition | **Strong** | Karpicke & Roediger 2008, MacLeod et al 2010 |
| Grammar pattern noticing | **Strong** | Norris & Ortega 2000 — explicit d=1.13 vs implicit d=0.54 |
| Context sentences for vocab | **Moderate-Strong** | Nation 2001, Hulstijn & Laufer 2001 |
| Dual coding (image + text) | **Strong** | 89% better transfer in dual coding studies |
| Emotional memory (stories) | **Strong** | Zero forgetting at 1.5 months for emotional content |
| Streaks / gamification | **Moderate** | Duolingo: 7-day streak → 2.4x retention |
| Natural-speed listening | **Moderate** | Chang & Millett 2014 — graduated approach recommended |
| Handwriting / motor memory | **Moderate** | Naka & Naoi 1995 — helps, especially complex characters |

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
Top 1000 words cover 76-80% of daily Japanese. The next 2000 words add only 10% more. Our 56 phrases likely cover a huge chunk of travel needs, but are they the RIGHT phrases?

### 15. Shadowing: 25-40% improvement in 8 weeks
Simultaneous listening + repeating aloud produces dramatic listening comprehension gains. Especially effective for Japanese pitch accent and natural rhythm.

### 16. Productive failure beats direct instruction
Students who struggled with problems BEFORE receiving instruction outperformed those who received instruction first — on both immediate and delayed tests. The struggle IS the learning.

### 17. Sleep consolidation is timing-dependent
Procedural skills (speaking, listening) best learned in evening before sleep. Declarative knowledge (vocabulary, grammar rules) better in afternoon. Sleep immediately after learning is critical — can't be made up.

### 18. Romaji: useful bridge, becomes hindrance
Romaji creates fossilized pronunciation errors. Expert recommendation: 1-2 weeks on hiragana/katakana, then abandon romaji. Our progressive romaji toggle (hide as learner improves) is the right approach.

### 19. Japanese-specific: listening is hardest (78% agree)
No audible word boundaries in Japanese speech — it sounds like one continuous stream. Mora-based segmentation is alien to English ears. Dedicated listening training is essential and under-served.

### 20. The plateau hits at 6-12 months
Most learners stall at intermediate level. Solution: change methods (don't keep doing the same thing), force active production, and increase immersion ratio.

---

## New Feature Ideas (from research synthesis)

These aren't from user requests — they're concepts born from connecting research findings:

### Idea 1: "Situation First" Learning (Productive Failure)
**Research basis:** Productive failure produces better outcomes than instruction-first.

Instead of: teach phrase → test phrase
Do: show situation image + context → user TRIES to respond (with options or free input) → reveal correct phrase → practice it

The struggle of trying to figure out "what would I say here?" creates stronger memory than passively seeing the answer first. This flips the current learn→quiz flow on its head.

### Idea 2: Story Mode (Emotional Memory)
**Research basis:** Emotional content shows zero forgetting over 1.5 months.

A narrative experience: "Day 1 in Tokyo. You just landed at Narita. Your phone is dead. You need to find the train to Shinjuku." Each decision point requires using a real phrase. Wrong choices have consequences (you go to wrong platform). Emotional stakes make phrases stick.

Not gamification for gamification's sake — the emotion IS the memory mechanism.

### Idea 3: Shadowing Mode
**Research basis:** 25-40% improvement in listening in 8 weeks.

Play phrase at natural speed → pause → user repeats aloud (no grading, reduces anxiety) → play again at 0.7x speed → user repeats → play at natural speed once more.

No app currently does this well for Japanese phrases. Could use Web Speech API for basic pronunciation feedback without being harsh about it.

### Idea 4: Bedtime Review (Sleep Consolidation)
**Research basis:** Sleep immediately after learning is most critical. Procedural skills best in evening.

A "wind down" mode: 3-minute audio-only review. Plays English → Japanese for the day's learned phrases. User can close eyes and just listen. Designed for the exact moment before sleep when consolidation is highest.

Could be triggered by time-of-day: "It's 10pm — want to review today's phrases before bed? 🌙"

### Idea 5: Adaptive Difficulty Engine
**Research basis:** Optimal learning happens at 80% retention. Desirable difficulties improve long-term retention. Flow state requires skill-challenge balance.

Track performance per item AND per mode separately. If someone aces scenario quiz but fails listening, push more listening for those specific phrases. Current SRS tracks one "box" per item — should track: visual recognition, listening comprehension, production ability, and speed.

Auto-adjust: hide romaji after 3 consecutive correct answers. Increase speed. Add trick questions for items they're getting too easily.

### Idea 6: Emergency Quick-Access Cards
**Research basis:** Travel app research shows survival phrases need to be accessible instantly.

NOT behind a quiz flow. A separate "Show this to someone" mode: large Japanese text filling the screen, one-tap audio that plays LOUD, designed to literally show your phone to a Japanese person. For actual emergencies in Japan.

Swipe between essential phrases. Works offline. No learning — just communication.

### Idea 7: Character Tracing (Motor Memory)
**Research basis:** Handwriting creates more durable encoding. Pen > stylus > keyboard. Motor memory for characters remained stable over 3 weeks while typed recognition decreased.

Canvas-based kana tracing. Show the stroke order, user traces with finger. Even rough finger-on-glass tracing activates motor memory pathways that seeing/typing cannot.

### Idea 8: Conversation Chains
**Research basis:** Contextual learning dramatically better than isolated practice. Sentence patterns + vocabulary together beats either alone.

Instead of isolated phrases, learn natural dialogue sequences:
```
Staff: いらっしゃいませ！ (Welcome!)
You:   ふたりです (Two people)
Staff: こちらへどうぞ (This way please)
You:   ありがとうございます (Thank you)
```

Tests the FLOW of conversation, not just individual phrases. User learns what comes before and after their phrase.

### Idea 9: Metacognition Prompts
**Research basis:** Metacognitive strategies play MORE significant role than other learning strategies. Self-regulated learners learn faster.

After a quiz session, ask: "Which phrases felt hardest? Why do you think?" Just asking makes users think about their thinking, which research shows significantly improves subsequent learning. Show their performance data alongside.

### Idea 10: Interleaved Daily Mix
**Research basis:** Mixing topics during study > blocking single topic. 19% improvement on delayed tests.

A "Daily Mix" that pulls from EVERYTHING — some kana quiz, one listening comprehension, a phrase scenario, a dakuten pair — all shuffled together in one 5-minute session. The brain learns better when it has to switch between different types of challenges.

---

## What NOT to do (anti-patterns from research):

- **Don't make browsing the default** — it's passive and produces minimal learning
- **Don't rely on multiple choice alone** — free recall is substantially better
- **Don't show the answer too quickly** — the struggle of trying to recall IS the learning
- **Don't let users skip difficulty** — desirable difficulties improve outcomes
- **Don't gamify without substance** — points without retrieval practice = engaging but not effective
- **Don't do long sessions** — 15 minutes of quizzing beats 60 minutes of reading
- **Don't teach romaji-first** — it creates pronunciation fossils
- **Don't ignore listening** — it's the hardest skill and most under-served
- **Don't enforce a silent period** — let beginners speak when they want to

---

## Sources

**Core learning science:**
- Roediger & Karpicke (2006): The Power of Testing Memory
- Rowland (2014): Meta-analysis of retrieval practice (159 studies, g = 0.50)
- Ebbinghaus Forgetting Curve (replicated in Murre & Dros, 2015)
- Bjork & Kroll (2015): Desirable Difficulties in Vocabulary Learning
- Sauro & Smith (2023): Gamification meta-analysis (g = 0.822)

**Language-specific:**
- Duolingo Research: 7-day streak → 2.4x retention
- Ertekin (2023): Interleaving vs blocking in L2 (19% improvement)
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
