# Side-Scrolling Action Game Level Design Research

Deep research on what makes GREAT level design in games like Katana Zero, Hotline Miami, Dead Cells, and Celeste. Synthesized from 15+ sources including GDC talks, game design books, developer articles, and game analyses.

---

## Table of Contents

1. [The Room as Puzzle: Katana Zero's Core Design](#1-the-room-as-puzzle-katana-zeros-core-design)
2. [Dan Taylor's Principles for Good Level Design (GDC)](#2-dan-taylors-principles-for-good-level-design-gdc)
3. [Nintendo's 4-Step Level Design (Kishotenketsu)](#3-nintendos-4-step-level-design-kishotenketsu)
4. [The Language of Teaching Without Words](#4-the-language-of-teaching-without-words)
5. [Enemy Design and Forced Skill Usage](#5-enemy-design-and-forced-skill-usage)
6. [Encounter Design: Composing Enemy Groups](#6-encounter-design-composing-enemy-groups)
7. [Pacing: Tension, Release, and Safe Zones](#7-pacing-tension-release-and-safe-zones)
8. [Verticality and Elevation](#8-verticality-and-elevation)
9. [Environmental Storytelling: Places, Not Obstacle Courses](#9-environmental-storytelling-places-not-obstacle-courses)
10. [Difficulty Progression Across Levels](#10-difficulty-progression-across-levels)
11. [Forgiveness Mechanics: Hard but Fair](#11-forgiveness-mechanics-hard-but-fair)
12. [Dead Cells: Hybrid Procedural/Handcrafted Rooms](#12-dead-cells-hybrid-proceduralhandcrafted-rooms)
13. [Six Core Level Design Patterns](#13-six-core-level-design-patterns)
14. [Actionable Principles for Our Game](#14-actionable-principles-for-our-game)

---

## 1. The Room as Puzzle: Katana Zero's Core Design

Katana Zero's fundamental design insight: **every room is a puzzle, not a reflex test**.

### The Core Loop

Levels are split into rooms. The player must kill every enemy in a room using their sword, throwable objects (lamps, pots), or environmental hazards (lasers). Both the player AND enemies die in one hit. This creates a symmetry that makes every encounter feel like a puzzle to solve rather than a health bar to deplete.

### Death as Planning Tool

When the player dies, the screen reads "No, that won't work" -- the protagonist is mentally planning the best approach. Death resets the room to its initial state, and aside from which direction some enemies walk, each attempt plays out the same. The player's job is to **work out the ideal sequence** to clear the room.

This reframes failure as iteration. You're not "dying" -- you're ruling out bad plans. This keeps frustration low despite extreme difficulty.

### Room Composition

Each room is a self-contained puzzle with:
- **Fixed enemy positions** that create specific tactical problems
- **Environmental tools** (throwable objects, lasers, explosive barrels) that provide alternative solutions
- **Multiple valid approaches** -- you can slash through, deflect bullets, use the environment, or combine all three
- **Clear entry and exit points** that frame the challenge

### The Replay/VHS Mechanic

After clearing all enemies in a room, the game replays your successful run as a continuous VHS tape -- showing what would have happened in "real time" without the planning phase. This is brilliant because it makes the player feel like an action movie hero, even though the actual gameplay was methodical puzzle-solving.

**Key Takeaway:** One-hit-death rooms work because they turn combat into puzzles. Every enemy is a problem to solve, not a sponge to hack through.

Sources: [Katana Zero Wikipedia](https://en.wikipedia.org/wiki/Katana_Zero), [Big Boss Battle Review](https://bigbossbattle.com/katana-zero-hotline-samurai/), [Game Escape Review](https://gamerescape.com/2019/04/18/review-katana-zero/), [The Gamer Beginner's Guide](https://www.thegamer.com/katana-zero-beginners-tips-guide/)

---

## 2. Dan Taylor's Principles for Good Level Design (GDC)

From Dan Taylor's influential 2013 GDC talk at Square Enix Montreal, modeled after Dieter Rams' principles of good design:

### Principle 1: Good Level Design is Fun to Navigate

The player's core interaction is **navigation** -- physically moving through the space. Layout, lighting, signage, and visual cues should create a natural "flow" that guides players instinctively. The level itself should feel good to move through, independent of combat.

Example: Mirror's Edge uses art direction (bright red objects against white/grey) to intuitively show the path. Modern Warfare 2's Favela creates tension through maze-like verticality.

### Principle 2: Good Level Design Does Not Rely on Words

Three narrative layers:
- **Explicit**: Text, speech, UI
- **Implicit**: Environmental storytelling (props, architecture, lighting)
- **Emergent**: Player-driven stories from gameplay

Use mise en scene -- environmental props like posters, corpses, damage, debris -- to stimulate the player's imagination. The environment should tell a story without a single line of dialogue.

### Principle 3: Tell What, Not How

Objectives should be crystal clear (through visual distinction, waypoints, or level geometry). But HOW the player accomplishes the objective should be flexible and player-determined. Don't railroad -- present multiple concurrent paths.

### Principle 4: Constantly Teach Something New

Every level should introduce a fresh mechanic or reimagine an existing one. This prevents mastery-induced boredom. Like Zelda dungeons serving as tutorials for new equipment -- the level teaches you the tool, then tests you with it.

### Principle 5: Empower the Player

Create moments where players feel their actions have meaningful consequences. Destructible environments, world reactions to player choices, or dramatic set pieces that make the player feel powerful.

### Principle 6: Let Players Control Difficulty

Rather than a menu slider, design levels with a baseline path for moderate players, optional high-risk/high-reward alternatives for skilled players, and easier routes for newcomers. Visual language should communicate these choices clearly.

### Principle 7: Be Efficient

Maximize limited resources through modular design -- reusable encounter building blocks that combine across levels. Reuse spaces through bi-directional gameplay (traversing an area both ways). Collectibles and secondary objectives extend value without proportional production cost.

### Principle 8: Create Emotion

Levels should produce aesthetic experiences beyond ordinary significance. Architecture, lighting, music, and pacing work together to create emotional responses -- awe, dread, relief, triumph.

Source: [GDC Vault](https://www.gdcvault.com/play/1017803/Ten-Principles-for-Good-Level), [Game Developer Part 1](https://www.gamedeveloper.com/design/ten-principles-of-good-level-design-part-1-), [Game Developer Part 2](https://www.gamedeveloper.com/design/ten-principles-of-good-level-design-part-2-)

---

## 3. Nintendo's 4-Step Level Design (Kishotenketsu)

Nintendo's approach, introduced by Miyamoto and used extensively in Super Mario 3D World, follows a Japanese narrative structure called Kishotenketsu:

### Step 1: Introduction (Ki)
Introduce a concept in a **completely safe environment**. The player can experiment with no risk of death. They discover what the mechanic does naturally through play.

### Step 2: Development (Sho)
Present the same mechanic in a **slightly dangerous situation**. Now there's consequence for failure, but the challenge is manageable. The player applies what they learned safely.

### Step 3: Twist (Ten)
This is the critical step Miyamoto always emphasizes -- the **surprise**. Take the mechanic the player now understands and show it from a completely different perspective. Combine it with another threat, invert expectations, or present a scenario that requires creative application.

"You have to think about what is that twist that really surprises people -- that's something that has always been very close to our philosophy of level design."

### Step 4: Conclusion (Ketsu)
A final challenge that combines everything learned, often at the level's climax (the flagpole moment). The player demonstrates mastery and feels rewarded.

### Applied to Combat Rooms

This maps directly to room-based action games:
1. **Room 1**: Meet new enemy type alone, in open space
2. **Room 2**: Face that enemy with basic hazards (a pit, a ledge)
3. **Room 3**: That enemy combined with another type, or in a constrained space, or with environmental twist
4. **Room 4**: Full combination -- multiple enemy types, hazards, and the new mechanic all at once

Source: [School of Game Design](https://schoolofgamedesign.com/project/super-mario-4-step-level-design/), [Nintendo Life](https://www.nintendolife.com/news/2015/03/video_nintendos_four_step_stage_design_is_why_you_love_super_mario_games_so_much), [NYFA](https://www.nyfa.edu/student-resources/nintendo-can-teach-us-game-design/)

---

## 4. The Language of Teaching Without Words

How great games communicate mechanics and intent without tutorials or text:

### Visual Affordances (from Super Mario Bros.)

When Super Mario Bros. launched in 1985, it established a design language where players see the configuration of blocks and platforms and **intuit** what to do. Coins show where to jump. Gaps show where not to fall. The initial screen creates "affordance" -- a non-verbal indication of action.

**Players should never take blind leaps of faith.** It's the designer's job to communicate the level's intent to the player.

### The Teach-Test-Challenge Model (from Celeste)

Celeste structures every new mechanic through a clear progression:

1. **Safe introduction**: New mechanic in a space where death is impossible. Player experiments freely.
2. **First challenge**: Same mechanic, now with consequences. Manageable difficulty.
3. **Escalation**: The obstacle becomes faster, timing windows shrink, or it appears multiple times.
4. **Combination**: New mechanic combined with established ones for maximum challenge.

Each level is a "very small, self-contained story" with multiple approaches for different player types.

### Visual Hierarchy in Katana Zero

Katana Zero demonstrates critical visual communication:
- **Walkable platforms** are lighter and bolder colors than backgrounds
- **Enemy silhouettes** are immediately distinct -- suited men vs. wider brawlers vs. blue-uniformed shotgunners
- **Laser detection ranges** displayed as visible red lines
- **Interactive objects** (throwable lamps, pots) visually distinct from decoration

The player can read the entire room at a glance and start planning before acting.

### Key Principle: Isolation Before Combination

Every source agrees: **introduce new elements in isolation first**. A new enemy type appears alone. A new hazard appears without enemies. Only after the player understands each element individually do you combine them.

Source: [Tadeas Jun](https://www.tadeasjun.com/blog/2d-level-design/), [GDC Celeste Talk](https://www.gdcvault.com/play/1024307/Level-Design-Workshop-Designing-Celeste), [Katana Zero Analysis](https://sites.wsagames.com/xedr1g23/2024/12/21/katana-zero-analysis-of-gameplay-art/)

---

## 5. Enemy Design and Forced Skill Usage

### Katana Zero's Enemy Roster and Forced Tactics

Every enemy type in Katana Zero requires a **different approach**, preventing the player from spamming a single strategy:

| Enemy | Behavior | Required Tactic |
|-------|----------|-----------------|
| **Strong Terries** | Patrol, punch when close | Basic slash -- the tutorial enemy |
| **Gunmen** | Shoot continuously from range | Close distance quickly OR deflect bullets back |
| **Skinny Rickies** | Deflect your attacks, then counterattack | Wait for their strike, counter during cooldown window |
| **Shotgunners** | Fire pellet spread (can't deflect all) | MUST dodge-roll through -- deflection doesn't work |
| **Shield Officers** | Block all frontal attacks and projectiles | Slide to their unshielded side -- requires lateral movement |
| **Automated Turrets** | Fire on detection, cooldown between shots | Wait for cooldown window, then destroy |
| **Drones** | Airborne, can be knocked into enemies | Use as throwable weapons against other enemies |
| **Police Gunmen** | Faster reaction time than regular gunmen | Requires faster approach or better timing |
| **Karate Rickies** (Hard) | Ignore dodge-roll invincibility | Can't rely on rolling -- must find alternate evasion |
| **Machinegunners** (Hard) | Sustained automatic fire | Wait for reload window -- only vulnerability |

**Critical insight**: Each enemy type invalidates at least one player strategy. Shotgunners make deflection useless. Shield Officers make frontal assault useless. Skinny Rickies make aggressive rushing useless. The player MUST adapt.

### General Enemy Design Principles (from The Level Design Book)

**Orthogonal differentiation**: Vary enemies across multiple dimensions simultaneously:
- Behavior type (patrol, guard, chase)
- Attack method (melee, ranged, area)
- Speed (slow tanks, fast swarms)
- Range (sniper, mid-range, close)
- NOT just health and damage (that's the laziest way to create variety)

**Visual readability**: Every enemy must be recognizable from a distance through distinct silhouettes. Players should identify threat types at a glance, not after getting hit.

**Roles in the combat ecosystem**:
- **Grunt**: Close-range, easy to kill -- the baseline
- **Squad**: Mid-range, works in groups -- creates crossfire
- **Tank**: Slow, armored, high damage -- must be prioritized or avoided
- **Swarm**: Fast, weak alone, dangerous in numbers -- tests crowd control
- **Sniper**: Long-range, vulnerable up close -- forces movement
- **Leader**: Buffs nearby allies -- must be eliminated first

Source: [Katana Zero Wiki](https://katanazero.wiki.gg/wiki/Enemies), [Level Design Book - Enemy](https://book.leveldesignbook.com/process/combat/enemy), [Enemy Categorization](https://deliberategamedesign.com/enemy-categorization/)

---

## 6. Encounter Design: Composing Enemy Groups

### The Complexity Curve (from The Level Design Book)

Enemy type count in a single encounter creates predictable complexity:

| Count | Function | Effect |
|-------|----------|--------|
| 1 type | Tutorial / rest | Focused, comfortable |
| 2 types | Regular combat | Two types interact meaningfully, player balances priorities |
| 3 types | Complex | Multiple relationships can overwhelm -- use carefully |
| 4+ types | Chaos / brawl | Player will isolate a subset anyway -- diminishing returns |

**"Using too many enemy types is like making a movie with too many characters -- it lacks focus."**

### Three Encounter Opening Patterns

**1. Player Ambushes Enemies (Best for puzzle-rooms)**
Enemies are unaware and visually exposed. Player has time to plan. Reinforce with hidden enemies to maintain tension after the first few are dispatched.

**2. Enemies Ambush Player (Shock value)**
Empty arena draws player into a trigger point, then enemies spawn or emerge. Works for surprise but loses impact on repeated attempts. Best used sparingly.

**3. Vista with One-Way Entrance (The "fair fight")**
Player sees the arena from an elevated vantage point. Can observe enemy positions and plan. Then drops in through a one-way entrance (a drop, a door that locks behind them). Closest to a fair fight -- player has information but is now committed.

### Enemy Composition in Mixed Groups

From the "Enemy-Based Level Design" article:
- **Introduce stronger enemies alone first**, then combine them with weaker ones
- **Alternate combat encounters with non-combat sections** -- prevent fatigue
- **Different enemies in one space force different strategies** -- the player must prioritize and switch tactics mid-fight
- **Wider spaces** support ranged enemies and multiple simultaneous threats
- **Narrow spaces** favor melee encounters and forced engagement
- **Patrol paths and sight lines** shape navigational choice

### Hotline Miami's Anti-Baiting Philosophy

A critical Hotline Miami design principle: **playtest with multiple approaches, not just the one you're used to**. If a room can be trivially cleared by baiting enemies through a single doorway, the design has failed.

Solutions:
- Use glass walls (enemies see through, bullets pass through)
- Place enemies to cover each other's blind spots
- Use offscreen enemies that force level memorization
- Make doorways strategic tools (knock enemies down with doors) rather than cheese points

Source: [Level Design Book - Encounter](https://book.leveldesignbook.com/process/combat/encounter), [Enemy-Based Level Design](https://medium.com/@varunbajaj/enemy-based-level-design-7fe352e6a637), [Hotline Miami Level Design Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3305685660)

---

## 7. Pacing: Tension, Release, and Safe Zones

### The Dramatic Arc of a Level

Dead Cells' developers explicitly modeled their pacing on Left 4 Dead's AI Director concept: alternate **dramatic peaks** (intense combat) with **relaxing breaks** (exploration, rewards, safe traversal).

The body adapts to stress and relief in a chemical loop. Without breaks, intensity becomes numbing. Without peaks, calm becomes boring.

### Six Patterns from 2D Game Research

From Ahmed Khalifa's research across 30+ games:

1. **Guidance**: Environmental cues directing player movement
2. **Safe Zone**: Areas free from threats -- breathing room
3. **Foreshadowing**: Subtle preview of upcoming challenges
4. **Layering**: Gradual complexity increase through stacked mechanics
5. **Branching**: Multiple paths offering choice and replay value
6. **Pace Breaking**: Calm moments interrupting intense sequences

### The Safe Zone Principle

From Castlevania: Symphony of the Night analysis:
- **Early levels have many safe zones** so players learn controls comfortably
- **Later levels reduce safe zones** but introduce non-combat challenges (exploration, puzzle)
- **Checkpoints in safe zones** are a universal pattern
- **Post-boss safe zones** let rewards "sink in" before the next challenge

### Rhythm in Room-Based Games

For games like Katana Zero where each room is an intense puzzle:
- **Between-room transitions** serve as natural pacing breaks
- **Story/dialogue segments** between levels provide macro-pacing
- **Room complexity should oscillate** -- a hard room followed by an easier one, not constant escalation
- **Occasional "free" rooms** (minimal enemies, simple layout) let the player feel powerful before the next challenge

Source: [Dead Cells Level Design](https://deepnight.net/tutorial/the-level-design-of-dead-cells-a-hybrid-approach/), [Level Design Patterns in 2D Games](https://www.gamedeveloper.com/design/level-design-patterns-in-2d-games)

---

## 8. Verticality and Elevation

### The Three-Plane Framework (from The Level Design Book)

Design around **three elevation layers maximum** -- bottom, middle, and top. More layers create complexity without meaningful new gameplay dynamics.

### Downward vs. Upward Flow

**Downward = Natural**: Gravity makes descent easy. One-way drops prevent backtracking, force forward progression, and signal "that area is done." Drops also create commitment -- you can't go back, so think before you jump.

**Upward = Intentional**: Ascent requires designed architecture -- stairs, ladders, wall-jumps, platforms. These take significant space and create natural difficulty (you must earn the high ground).

### Elevation as Strategic Advantage

- **High ground gives vision** -- the player can see enemies below and plan
- **Low ground means vulnerability** -- enemies above are harder to reach, especially ranged ones
- **Elevation changes force movement variety** -- wall-jumps, dashes, slides add mechanical diversity
- **Height communicates progress** -- climbing a mountain or descending into a dungeon is immediately readable narrative

### In Katana Zero

Verticality is used to:
- Create **vantage points** where the player can read the room before engaging
- Place **gunmen on elevated platforms** that can't be reached directly -- requiring wall-jumps or environmental solutions
- Create **drop-in encounters** where the player enters from above and must clear downward
- Force **wall-jump sequences** between combat rooms as skill checks

Source: [Level Design Book - Verticality](https://book.leveldesignbook.com/process/layout/flow/verticality), [LinkedIn Level Design](https://www.linkedin.com/advice/0/what-some-effective-ways-use-verticality-platformer)

---

## 9. Environmental Storytelling: Places, Not Obstacle Courses

### Katana Zero's Worldbuilding Through Space

Katana Zero creates a noir dystopia called New Mecca through environmental design alone:

- **The psychiatrist's office** is "well-kept" -- a sanctuary that creates psychological safety and trust (that's later subverted)
- **The apartment** is run-down, in the slums -- establishing the protagonist's desperate circumstances
- **The nightclub level** has unique stealth mechanics -- the environment dictates the gameplay
- **Government buildings** are sterile and clinical -- contrasting with the grimy streets
- **Level variety** includes neon-lit streets, mansions, factories, hotels -- each with distinct visual identity and gameplay implications

The contrast between what the player knows mechanically (they can see everything) and what they understand narratively (the mystery is deep) creates cognitive tension that drives engagement.

### How to Make Levels Feel Like Places

From multiple sources on environmental storytelling:

**Composing Visual Layers**:
- **Foreground**: Interactive elements (platforms, enemies, objects)
- **Midground**: The playable space itself
- **Background**: Scenery that tells stories (ruins, activity, weather, architecture)
- Each layer adds depth and communicates narrative without words

**Contextual Platforms**:
- Platforms should look like they belong: tree branches in forests, rooftops in cities, scaffolding in construction sites, broken stairs in ruins
- "Clever puzzles emerge from natural environments -- falling logs, tilted branches, dangling wires"
- Never use floating blocks unless the game's aesthetic justifies them (like Mario's explicitly game-like world)

**Environmental Details That Tell Stories**:
- Broken furniture suggests a fight happened here
- Empty bottles suggest someone lives here
- Blood trails suggest danger ahead
- Locked doors with visible keys suggest a puzzle
- Propaganda posters suggest political context
- The environment should make the player ask "what happened here?"

**Architecture as Narrative**:
- A crumbling bridge tells you this area is neglected
- A heavily fortified door tells you something important is behind it
- An opulent room with shattered windows tells you this place fell from grace
- The physical space should be a character in the story

Source: [Mechanics of Magic - Katana Zero](https://mechanicsofmagic.com/2025/05/16/worldbuilding-in-katana-zero/), [Retro Style Games](https://retrostylegames.com/blog/platformer-level-design-tips/), [Sandro Maglione Guide](https://www.sandromaglione.com/articles/pixel-art-platformer-level-design-full-guide)

---

## 10. Difficulty Progression Across Levels

### The Macro Curve

Difficulty should follow an **oscillating upward curve**, not a straight line:

```
Difficulty
    ^
    |        /\    /\      /\
    |   /\  /  \  /  \    /  \
    |  /  \/    \/    \  /    \
    | /                \/      \___  (rest before next area)
    |/
    +---------------------------------> Time
```

Peaks of difficulty followed by valleys. Each valley is higher than the last (overall upward trend), but there's always relief.

### The Compartmentalization Principle

**Focus each level on ONE defining feature or mechanic.** One level centers on precise platforming, another on puzzle-solving, another on a specific enemy type. This compartmentalization:
- Lets players appreciate each mechanic fully
- Prevents overwhelm
- Creates variety across levels rather than within a single one
- Makes each level memorable for its unique identity

### How Katana Zero Progresses

1. **Early levels**: Simple rooms, basic enemies (Terries), introduce slash and deflect
2. **Mid-game**: Gunmen introduced, requiring deflection mastery. Then Rickies requiring timing patience.
3. **Late-game**: Shield officers, shotgunners, turrets, lasers -- each requiring specific counters
4. **Hardest rooms**: Multiple enemy types combined with environmental hazards -- the player must use everything they've learned

The game never introduces two new enemy types in the same level. Each new threat gets its own introduction before being mixed with others.

### Hotline Miami's Approach

Each level in Hotline Miami 2 is balanced around character abilities:
- **Swans** (dual-wielding) allows more open levels with high enemy counts
- **Beard** (soldier) needs careful ammo box placement
- **Evan** (pacifist) needs throw-based level design

The level design adapts to what the player CAN do, then challenges the limits of those abilities.

Source: [ModDB Challenges](https://www.moddb.com/news/the-challenges-of-level-design-in-platformer-and-side-scroller-games), [Difficulty Curves](http://www.davetech.co.uk/difficultycurves), [Hotline Miami Design Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3305685660)

---

## 11. Forgiveness Mechanics: Hard but Fair

### Celeste's Philosophy (from Maddy Thorson)

Celeste is brutally difficult but never feels unfair. The secret is **widening timing and positioning windows** so everything is fudged slightly in the player's favor:

- **Coyote time (5 frames)**: Jump briefly after leaving a ledge -- the game still considers you "on ground"
- **Jump buffering**: Press jump before landing; it executes on the exact landing frame
- **Half gravity at jump peak**: Holding jump applies reduced gravity at the apex, giving more time to adjust
- **Corner correction**: Bonking a corner nudges you sideways around it instead of blocking you
- **Dash corner correction**: Dashing into a corner pops you onto the ledge
- **Semi-solid popping**: Dashing through semi-solid platforms pushes you up onto them
- **Wall-jump windows**: Can wall-jump from 2 pixels away (5 pixels for super wall-jumps)
- **Stamina refunds**: Converting wall-jump types retroactively refunds stamina

**"All are centered around widening timing/positioning windows."** The game is still hard, but by widening these windows, it keeps difficulty from feeling frustrating.

### Katana Zero's Forgiveness

- **Instant restart**: Death sends you immediately to the room's start -- no loading, no menus
- **Short rooms**: Each puzzle is small enough that redoing it doesn't waste time
- **Narrative framing**: "No, that won't work" makes death feel like planning, not failure
- **Generous deflection windows**: Bullet deflection has forgiving timing
- **Slow-motion ability**: Available to any player struggling with timing

### The General Principle

Hard games work when:
1. **Death is instant** and restart is instant -- no punishment delay
2. **Rooms/challenges are short** -- minimal progress loss per death
3. **The player feels responsible** for their death (clear visual communication)
4. **The game never feels "cheap"** -- every death should be learnable

Source: [Celeste & Forgiveness](https://maddythorson.medium.com/celeste-forgiveness-31e4a40399f1), [Game Rant Celeste Analysis](https://gamerant.com/celeste-coyote-time-mechanic-platforming-impact-hidden-mechanics/)

---

## 12. Dead Cells: Hybrid Procedural/Handcrafted Rooms

Dead Cells' approach is relevant because it shows how to make **individually hand-crafted rooms** work within a larger system:

### The 6-Step Process

1. **Fixed world framework**: Overall map structure is hand-designed and consistent
2. **Hand-crafted room tiles**: Each room is a carefully designed "chunk" with a specific purpose (combat, treasure, merchant, traversal)
3. **Concept graphs**: Blueprints defining level length, special room quantity, labyrinth density, entrance-to-exit distance
4. **Algorithmic selection**: Rooms are selected to match graph requirements
5. **Monster distribution**: Enemy count derived from total combat tile length. Each enemy type has danger ratings, placement restrictions, spatial requirements, and frequency caps
6. **Loot placement**: Rewards distributed based on difficulty

### Key Insight for Hand-Crafted Games

Even in a non-procedural game, the concept of **room tiles with specific purposes** is powerful:
- **Combat rooms**: Designed around specific enemy encounters
- **Traversal rooms**: Test platforming/movement skills with minimal enemies
- **Reward rooms**: Safe spaces with items, story beats, or rest
- **Transition rooms**: Connect areas, establish atmosphere, pace the experience
- **Boss rooms**: Climactic encounters with unique design rules

Each biome uses exclusively its own tile set to maintain identity. A prison doesn't reuse dungeon rooms.

Source: [Deepnight - Dead Cells Level Design](https://deepnight.net/tutorial/the-level-design-of-dead-cells-a-hybrid-approach/), [Game Developer Article](https://www.gamedeveloper.com/design/building-the-level-design-of-a-procedurally-generated-metroidvania-a-hybrid-approach-)

---

## 13. Six Core Level Design Patterns

From Ahmed Khalifa's research across 30+ 2D games, six patterns appear universally:

### 1. Guidance
Direct players toward objectives through environmental cues -- lighting, architecture, camera framing, coin/collectible placement. Never let the player feel lost unless confusion is the intentional design.

### 2. Safe Zone
Areas free from threats where players recover, absorb rewards, and prepare for the next challenge. Critical after boss fights and between difficulty spikes. Checkpoints almost always live in safe zones.

### 3. Foreshadowing
Subtle previews of upcoming challenges. Seeing an enemy through a window before you fight it. Hearing a boss roar before you reach it. Background details that hint at what's coming.

### 4. Layering
Building complexity gradually by stacking challenges. First you learn to jump. Then to jump over pits. Then to jump over pits with enemies. Then to jump over pits with enemies while a timer counts down. Each layer adds one thing.

### 5. Branching
Multiple paths offering choice and replay value. One path might be harder but shorter. Another might have better rewards. This accommodates different skill levels organically (Dan Taylor's Principle 6).

### 6. Pace Breaking
Calm moments interrupting intense sequences. A beautiful vista after a hard fight. A story moment between action levels. An easy room after three hard ones. Without pace breaks, intensity becomes monotonous.

Source: [Level Design Patterns in 2D Games](https://www.gamedeveloper.com/design/level-design-patterns-in-2d-games)

---

## 14. Actionable Principles for Our Game

Synthesized from all research, here are the concrete takeaways:

### Room Design

1. **Every room is a puzzle, not a brawl.** The player should be able to read the room, plan an approach, and execute it. Enemies have fixed positions that create specific tactical problems.

2. **One-hit death creates symmetry.** If both player and enemies die in one hit, every encounter is a puzzle of "how do I hit them before they hit me?"

3. **Multiple solutions per room.** A room should be clearable by pure combat, by using the environment, by clever movement, or by combining approaches. Never exactly one solution.

4. **Room complexity oscillates.** Hard room, easier room, hard room. Not constant escalation within a level.

5. **Rooms have clear visual hierarchy.** Walkable surfaces are distinct from backgrounds. Enemies are instantly readable. Hazards are visible. Interactive objects stand out.

### Enemy Placement

6. **Introduce new enemy types alone.** First encounter with any enemy should be 1-on-1 in a forgiving space. Then gradually add complexity.

7. **Each enemy type invalidates at least one strategy.** Shields block frontal attacks. Shotgunners can't be deflected. Fast enemies can't be outrun. This forces the player to adapt.

8. **Max 2-3 enemy types per room.** More than that loses focus. The player will just isolate a subset anyway.

9. **Enemies should cover each other.** A gunner behind a melee enemy. A shielded enemy protecting a sniper. Compositions that require the player to think about order of operations.

10. **Never let the player cheese.** If a room can be cleared by standing in a doorway and baiting, the design has failed. Use glass walls, patrol paths, and enemy awareness to prevent degenerate strategies.

### Teaching and Progression

11. **Follow the 4-step pattern: Introduce, Develop, Twist, Conclude.** Safe introduction, basic challenge, surprising twist, climactic combination.

12. **Never introduce two new things simultaneously.** New enemy + new hazard = confusion. New enemy alone, THEN that enemy + familiar hazard.

13. **Foreshadow before challenging.** Let the player see a new enemy type through a window or in a cutscene before they have to fight it.

14. **Each level has ONE defining identity.** "The shotgunner level." "The laser level." "The verticality level." Not "the everything level."

### Environment

15. **Platforms must be contextual.** Rooftops in urban areas. Tree branches in forests. Scaffolding in construction. Broken stairs in ruins. Never floating blocks.

16. **Backgrounds tell stories.** Every background should answer "what is this place?" and "what happened here?" through environmental details.

17. **Lighting and color guide navigation.** Bright areas are destinations. Dark areas are dangerous. Distinctive colors mark interactive elements.

18. **Architecture matches the fiction.** A dojo has tatami mats and sliding doors. A factory has conveyor belts and machinery. A nightclub has neon and dance floors. The gameplay space IS the narrative space.

### Pacing and Feel

19. **Death must be instant, restart must be instant.** Zero punishment delay. The loop is: die, restart, try again. Any friction in this loop destroys the flow.

20. **Forgiveness is invisible.** Coyote time, input buffering, corner correction -- all widening windows slightly in the player's favor without the player knowing.

21. **Alternate intensity with rest.** Combat rooms interspersed with traversal, story, or simple rooms. Dramatic peaks followed by valleys.

22. **The successful run should look cinematic.** Even if the actual gameplay was methodical, the executed plan should feel like an action movie when replayed.

---

## Key Sources Referenced

- [The Level Design Book - Encounter Design](https://book.leveldesignbook.com/process/combat/encounter)
- [The Level Design Book - Enemy Design](https://book.leveldesignbook.com/process/combat/enemy)
- [The Level Design Book - Verticality](https://book.leveldesignbook.com/process/layout/flow/verticality)
- [GDC: Ten Principles for Good Level Design (Dan Taylor)](https://www.gdcvault.com/play/1017803/Ten-Principles-for-Good-Level)
- [GDC: Level Design Workshop: Designing Celeste (Maddy Thorson)](https://www.gdcvault.com/play/1024307/Level-Design-Workshop-Designing-Celeste)
- [Celeste & Forgiveness (Maddy Thorson)](https://maddythorson.medium.com/celeste-forgiveness-31e4a40399f1)
- [Dead Cells Hybrid Level Design (Deepnight)](https://deepnight.net/tutorial/the-level-design-of-dead-cells-a-hybrid-approach/)
- [Katana Zero Gameplay Analysis](https://sites.wsagames.com/xedr1g23/2024/12/21/katana-zero-analysis-of-gameplay-art/)
- [Worldbuilding in Katana Zero (Mechanics of Magic)](https://mechanicsofmagic.com/2025/05/16/worldbuilding-in-katana-zero/)
- [Level Design Patterns in 2D Games (Gamedeveloper.com)](https://www.gamedeveloper.com/design/level-design-patterns-in-2d-games)
- [How to Design 2D Platformer Levels (Tadeas Jun)](https://www.tadeasjun.com/blog/2d-level-design/)
- [Enemy-Based Level Design (Varun Bajaj)](https://medium.com/@varunbajaj/enemy-based-level-design-7fe352e6a637)
- [Hotline Miami Essential Level Design Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3305685660)
- [Nintendo's 4-Step Level Design](https://www.nintendolife.com/news/2015/03/video_nintendos_four_step_stage_design_is_why_you_love_super_mario_games_so_much)
- [Katana Zero Enemy Types (Wiki)](https://katanazero.wiki.gg/wiki/Enemies)
