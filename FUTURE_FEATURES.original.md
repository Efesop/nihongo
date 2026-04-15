# Future Features (Backlog)

Research-backed improvements not yet implemented. Ranked by impact.

## High Impact

### 1. Progressive Romaji Hiding
After 5+ correct answers for an item, stop showing romaji on choices. Romaji creates fossilized pronunciation errors after 1-2 weeks (LEARNING_SCIENCE.md #18). The single most important feature for intermediate learners.

### 2. Hint System for Long Struggles
After 10-15 seconds on a question, show a "hint" button that reveals partial info (first word, grammar pattern, or category). Data shows users spending 44-94 seconds before getting wrong — that's frustration, not learning.

### 3. Struggling-Item Focus Mode
When 5+ phrases are at box 1, suppress new content introduction and focus on review + word-level drilling of weak items. Currently sessions can still introduce new items while a pile of struggling ones exists.

### 4. Special Exercise Rotation Tracking
Track which grammar patterns, confused pairs, and word quizzes have been shown. Use lightweight SRS to ensure even coverage instead of random selection that repeats some while missing others.

### 5. Interactive Grammar Patterns
After showing the pattern explanation, add a comprehension quiz — e.g., "In これをください, what does を do?" with 3 choices. Currently passive read-and-dismiss.

## Medium Impact

### 6. Phrase Reconstruction
Given phrase segments in wrong order, arrange them correctly. Different from phrase-build (fill blank) — tests understanding of sentence structure.

### 7. Audio-Only Production
Hear the English, speak/type the Japanese from memory with no visual choices. The hardest and most effective exercise type.

### 8. Weak Word Targeting
When a phrase is wrong, identify which WORD caused the confusion and drill that word specifically in the next session.

### 9. Session Focus Themes
"This session focuses on shopping" to build category-specific fluency rather than always mixing everything.

### 10. Adaptive Session Length
If many due items, extend to 12 cards. If few due, 8 cards is enough.

## Nice to Have

### 11. Streak Freeze
Miss one day without losing streak (reduces anxiety).

### 12. Bedtime Review Mode
3-minute audio-only review before sleep. Research: sleep consolidation is timing-dependent.

### 13. Character Tracing
Canvas-based kana tracing for motor memory. Handwriting > typing for retention.

### 14. Pitch Accent Indicators
Show high/low pitch on phrases.

### 15. Error Count Decay
Errors older than 30 days count as half, older than 90 days as zero.

### 16. Separate Leech Thresholds with Decay
5 for kana, 7-8 for phrases. Time-based decay so early struggles don't haunt forever.

### 17. Voice Input / Shadowing
Speak the phrase, compare to native (Web Speech API). Research: 25-40% improvement in 8 weeks.
