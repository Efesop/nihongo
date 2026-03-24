# Game Sprites — Complete Asset List

All sprites: 1024x1024 PNG, pixel art chibi style, gray background (auto-removed on load).
Generated with Gemini Pro. Gray bg removal in `sprites.js` (avg > 100, maxDiff < 35 → transparent).

---

## TINYSENPAI (Player) — `public/images/tinysenpai/`

**Active (20 sprites):**
| Sprite | File | R flag | Notes |
|--------|------|--------|-------|
| Idle | `idle.png` | false | Straw kasa hat, black outfit, red sash |
| Run 1-4 | `run/1-4.png` | false | 4-frame walk cycle |
| Slash 1 | `slash/1.png` | false | Horizontal cut |
| Slash 2 | `slash/2.png` | true | Upward arc |
| Slash 3 | `slash/3.png` | false | Spin wind-up |
| Slash 4 | `slash/4.png` | true | Lightning follow-through |
| Slash Through | `slash-through.png` | true | Combo 3 finisher pose |
| Jump Launch | `jump/launch.png` | false | |
| Jump Airborne | `jump/airborne.png` | true | |
| Fall | `fall.png` | true | |
| Wall Cling | `wall-cling.png` | false | Pressed against wall |
| Wallslide | `wallslide.png` | true | Old version (fallback) |
| Dash | `dash.png` | false | |
| Death Hit | `death/hit.png` | false | |
| Death Fallen | `death/fallen.png` | false | |
| Parry | `parry.png` | false | Ready for future mechanic |
| Land Heavy | `land-heavy.png` | false | Ready for future use |

**UI/Grades:**
| File | Used by |
|------|---------|
| `tinysenpai1.png` | unused/ (original icon) |
| `tinysenpai2.png` | Game menu, Layout sidebar, SmartSession |
| `grades-run/ts1-4.png` | SmartSession grade display |
| `grades-strike/1-4.png` | SmartSession grade display |

---

## ONI (Red Demon) — `public/images/oni/`

13 sprites. Bright red skin, two golden horns, fangs, grey spiked iron kanabo club, dark tattered loincloth.

| Sprite | File | State |
|--------|------|-------|
| Original | `demon.png` | Fallback if new sprites missing |
| Idle | `oni-idle.png` | Standing ready |
| Walk 1 | `oni-walk1.png` | Walk cycle frame 1 |
| Walk 2 | `oni-walk2.png` | Walk cycle frame 2 |
| Alert | `oni-alert.png` | Spotted player |
| Windup | `oni-windup.png` | Club raised overhead |
| Attack | `oni-attack-lunge.png` | Club smash strike |
| Dazed | `oni-dazed.png` | Stunned wobble |
| Hit | `oni-hit.png` | Recoiling from slash |
| Kneel | `oni-kneel-defeat.png` | Cinematic death phase 1 |
| Dead | `oni-fallen-dead.png` | Cinematic death phase 2 |
| KB Back | `oni-knockback-back.png` | Knockback: flat on back |
| KB Tumble | `oni-knockback-tumble.png` | Knockback: face-down slide |
| KB Seated | `oni-knockback-seated.png` | Knockback: on butt sliding |

---

## NINJA (Purple Assassin) — `public/images/ninja/`

13 sprites. Dark purple-black cloth, oversized round head, amber glowing eyes through mask slit, two long scarf tails.

| Sprite | File | State |
|--------|------|-------|
| Original | `ninja.png` | Fallback |
| Idle | `ninja-idle.png` | Stealthy ready pose |
| Walk 1 | `ninja-walk1.png` | Walk cycle frame 1 |
| Walk 2 | `ninja-walk2.png` | Walk cycle frame 2 |
| Alert | `ninja-alert.png` | Spotted player |
| Throw | `ninja-throw.png` | Shuriken throw pose |
| Retreat | `ninja-retreat.png` | Evasive backward jump |
| Dazed | `ninja-dazed.png` | Stunned |
| Hit | `ninja-hit.png` | Recoiling from slash |
| Kneel | `ninja-kneel.png` | Cinematic death phase 1 |
| Dead | `ninja-dead.png` | Cinematic death phase 2 |
| KB Back | `ninja-knockback-back.png` | Knockback: on back |
| KB Tumble | `ninja-knockback-tumble.png` | Knockback: face-down |
| KB Seated | `ninja-knockback-seated.png` | Knockback: on butt |

---

## SAMURAI (Armored Elite) — `public/images/samurai/`

2 sprites (NEEDS FULL SET). Dark purple/gold armor, horned kabuto helmet, katana.

| Sprite | File | State |
|--------|------|-------|
| Kneel | `samurai-kneel.png` | Death phase 1 (also temp idle) |
| Dead | `samurai-dead.png` | Death phase 2 |

**Still needed:** idle, walk1/2, alert, windup, strike, block, dazed, hit, 3 knockback poses

---

## Backgrounds — `public/images/`

| Asset | File | Notes |
|-------|------|-------|
| Forest | `forest.png` | Dark night forest, parallax pan |
| Temple | *not yet* | |
| Neon Tokyo | *not yet* | |

---

## Audio — `public/audio/game/`

48 MP3 files generated via ElevenLabs Sound Effects API.
Generation script: `scripts/generate-game-sfx.mjs`

**Combat:** swoosh1-6, shing, slash3_electric, hit_impact1-3, kill, blood_splatter, clash, deflect
**Movement:** jump, land, dash, wall_grab, wall_launch, wallSlide, step1-3
**Enemies:** oni_alert/2, oni_attack/2, oni_death/2/3, ninja_alert/2, ninja_throw/2, ninja_death/2/3, samurai_alert/2, samurai_attack/2, samurai_death/2/3
**UI:** menuStart, death, roomClear, comboMilestone, slowmoOn, slowmoOff
**Ambient:** rain_loop, forest_night
**Music:** music_forest (taiko/shamisen/koto loop)
