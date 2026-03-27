# Game Assets — Complete Sprite & Audio Reference

## Generation Pipeline

### Sprites
- **Model**: Gemini 3.1 Flash Image Preview (`gemini-3.1-flash-image-preview`)
- **Script**: `scripts/generate-sprites.mjs`
- **Run**: `GEMINI_API_KEY=key node scripts/generate-sprites.mjs`
- **Output**: `public/images/tinysenpai/game/` (1024x1024 PNG)
- **2-pass self-referencing**: Pass 1 generates `_idle` for each character using game-wide references. Pass 2 generates all other poses using that character's OWN idle as primary reference.
- **Gray bg removal**: Done OFFLINE via `scripts/remove-gray-bg.mjs` (NOT runtime). Originals in `archive_originals/` and `archive_originals_safe/`.
- **Cost**: Free (Gemini preview model)

### Audio — SFX
- **Model**: ElevenLabs `eleven_text_to_sound_v2`
- **Script**: `scripts/generate-game-sfx.mjs`
- **Run**: `ELEVENLABS_API_KEY=key node scripts/generate-game-sfx.mjs`
- **Output**: `public/audio/game/` (MP3)
- **Fallback**: jsfxr synthesized sounds for any missing MP3

### Audio — Music & Ambient
- **Model**: Gemini Lyria 3 (`lyria-3-clip-preview`) — 30s clips
- **Script**: `scripts/generate-music-gemini.mjs`
- **Run**: `GEMINI_API_KEY=key node scripts/generate-music-gemini.mjs`
- **Cost**: Free (Gemini preview)

### Gray Background Removal (Offline)
- **Script**: `scripts/remove-gray-bg.mjs`
- **Run**: `node scripts/remove-gray-bg.mjs`
- **Requires**: `npm install @napi-rs/canvas`
- **ALWAYS backup first**: Script auto-copies to `archive_originals/` but do a manual backup too
- **Algorithm**: Pixel avg > 100 && maxDiff from avg < 35 → transparent. Near-gray with slight tint → fade out.

---

## Art Style Rules

**General**: Chibi pixel art, chunky black outlines, oversized head (40-50% body), ~32x32 logical rendered as 1024x1024. Rich saturated colors. All characters face LEFT by default.

### Character Descriptions (for Gemini prompts)

**TinySenpai (Player)**: Massive straw kasa hat (wider than body, golden-brown woven texture with dark band). Narrow eyes barely visible under hat brim. Black/dark gray ninja outfit. Bright red sash/belt at waist. Katana with white/silver blade. Compact stocky proportions. Hat is the silhouette identifier.

**Oni**: Bright vivid red skin, stocky muscular body. Two short golden horns. Angry scowling face, fangs, yellow-gold eyes. Grey spiked iron kanabo club. Dark tattered loincloth.

**Ninja**: Dark purple-black palette. Oversized round head wrapped in cloth, narrow eye slit with amber/gold glowing eyes. Two long flowing scarf tails (signature silhouette). Silver shuriken. Low crouching posture.

**Samurai**: Dark steel-grey and gold ornate armor. Horned kabuto helmet with golden crescent. Stoic expression. Red accent details. Long katana. Heavy upright posture. Purple-grey tones with gold trim.

**Ronin**: Tattered brown kimono, frayed edges. Smaller conical straw hat (different from player). Stubbled chin. Worn katana. Sandals. World-weary posture.

**Cyber Ninja**: Sleek black bodysuit with glowing neon blue circuit lines. Dark visor with blue glow. Energy katana. Futuristic ninja.

**Bouncer**: Massive muscular build. Black suit. Dark sunglasses. Brass knuckles. Earpiece. Intimidating scowl.

**Monk Guardian**: Shaved bald head. Serene expression. Flowing orange Buddhist robes. Wooden bo staff. Prayer beads.

**Spirit Fox**: Ethereal white-blue translucent ghostly body. Multiple flowing tails (3-5). Glowing golden eyes. Mystical kitsune.

**Cursed Ronin**: Dark mirror of TinySenpai. Same massive kasa hat but ink-BLACK with dark purple edges. Glowing red eyes under brim. All-black outfit with red ink marks spreading. Dark red sash. Cursed katana with dark blade.

---

## Complete Sprite Inventory

### Player — `public/images/tinysenpai/` (original) + `game/player_*` (refresh)
| Sprite | Original Path | Refresh Path |
|--------|--------------|--------------|
| Idle | `idle.png` | `game/player_idle.png` |
| Run 1-4 | `run/1-4.png` | `game/player_run1-4.png` |
| Slash 1-4 | `slash/1-4.png` | `game/player_slash1-4.png` |
| Jump 1-2 | `jump/launch.png`, `jump/airborne.png` | `game/player_jump1-2.png` |
| Fall | `fall.png` | `game/player_fall.png` |
| Dash | `dash.png` | `game/player_dash.png` |
| Wall Slide | `wallslide.png` | `game/player_wallslide.png` |
| Crouch | — | `game/player_crouch.png` |
| Death Hit | `death/hit.png` | `game/player_death1.png` |
| Death Fallen | `death/fallen.png` | `game/player_death2.png` |
| Wall Cling | `wall-cling.png` | — |
| Parry | `parry.png` | — |
| Land Heavy | `land-heavy.png` | — |
| Slash Through | `slash-through.png` | — |

### Enemies — `public/images/tinysenpai/game/`

Each enemy has ~12 poses: idle, walk1, walk2, alert, attack, dazed, hit, kneel, dead, kb_back, kb_tumble, kb_seated

| Enemy | Prefix | Sprites | Zone |
|-------|--------|---------|------|
| Oni | `oni_*` (in `/images/oni/`) | 13 | All |
| Ninja | `ninja_*` (in `/images/ninja/`) | 13 | All |
| Samurai | `samurai_*` | 11 + 2 legacy | All |
| Archer | `archer_*` | 10 | All |
| Brute | `brute_*` | 9 | All |
| Tengu | `tengu_*` | 6 | All |
| Ronin | `ronin_*` | 12 | Edo |
| Cyber Ninja | `cyber_ninja_*` | 12 | Neon |
| Bouncer | `bouncer_*` | 10 (kneel/dead missing) | Nightclub |
| Monk | `monk_*` | 12 | Spirit |
| Spirit Fox | `spirit_fox_*` | 6 | Spirit |
| Cursed Ronin | `cursed_ronin_*` | 12 | Spirit |

### Story Characters — `public/images/tinysenpai/game/story_*`
| Character | Sprites |
|-----------|---------|
| Player | idle, surprised, determined, kneeling, arm (examining mark) |
| Sensei | idle, serious, amused |
| Shadow | idle, angry, bitter, defeated, human (redeemed) |
| Elder | idle, concerned |
| Kunoichi | idle, smirk, serious |
| Katsura | idle, angry |
| Hacker | idle |
| Fox Spirit | idle |

### Portraits — `public/images/tinysenpai/game/portrait_*`
sensei, sensei_v2, player, shadow, elder, kunoichi, katsura, hacker, fox

### Backgrounds — `public/images/tinysenpai/game/bg_*`

**Story scenes** (16:9): bg_dojo_story, bg_dojo_night_story, bg_forest_story, bg_temple_story, bg_edo_story, bg_neon_story, bg_nightclub_story, bg_spirit_story

**Gameplay parallax** (wide): bg_dojo, bg_forest (in `/images/`)

**Multi-layer parallax** (per zone, 3 layers each):
| Zone | Far | Mid | Near |
|------|-----|-----|------|
| Edo | bg_edo_far | bg_edo_mid | bg_edo_near |
| Neon | bg_neon_far | bg_neon_mid | bg_neon_near |
| Nightclub | bg_nightclub_far | bg_nightclub_mid | — |
| Spirit | bg_spirit_far | bg_spirit_mid | bg_spirit_near |

---

## Audio Inventory — `public/audio/game/`

### SFX (~50 files)
**Combat**: slash1-3, kill, blood_splatter, clash, deflect, backstab, samurai_block, sfx_combo4_pierce
**Movement**: jump, land, dash, wallSlide, footstep, step1-3
**Enemies (original)**: oni_alert/attack/death (×3 variants each), ninja_alert/throw/death (×3), samurai_alert/attack/death (×3), shuriken
**Enemies (new)**: cyber_teleport, pistol_shot, drone_hover, drone_laser, bouncer_slam, shockwave_bass, smoke_bomb, staff_strike, fox_cry, illusion_pop, time_rift
**Stealth**: stealth_kill, detection_suspicious, detection_alert
**Hazards**: laser_hum, electric_zap
**UI**: slowmoOn, slowmoOff, roomClear, comboMilestone, menuStart, death, death_dramatic
**Story**: sfx_choice_appear, sfx_choice_select, sfx_choice_tick, sfx_text_advance, brush_wipe, wave_incoming, encounter, text_type
**Objects**: crate_break, pot_break, lantern_break, bamboo_break

### Music (~11 tracks, 30s loops)
| Track | Zone | Generator |
|-------|------|-----------|
| music_forest | Forest/Dojo | ElevenLabs |
| music_temple | Temple | ElevenLabs |
| music_boss | Boss fights | ElevenLabs |
| music_story_calm | Story (calm) | ElevenLabs |
| music_story_tension | Story (tense) | ElevenLabs |
| music_edo | Edo Castle Town | ElevenLabs |
| music_neon | Neon Tokyo | Gemini Lyria 3 |
| music_nightclub | Underground | Gemini Lyria 3 |
| music_spirit | Spirit Realm | Gemini Lyria 3 |
| music_boss_shadow | Final battle | Gemini Lyria 3 |
| music_epilogue | Ending | Gemini Lyria 3 |

### Ambient (5 loops)
rain_loop, forest_night, city_hum, nightclub_bass, spirit_wind

### Zone → Ambient Mapping
| Zone | Ambient |
|------|---------|
| dojo | (none — indoor) |
| forest | rain_loop, forest_night |
| temple | rain_loop, forest_night |
| edo | forest_night |
| neonTokyo | city_hum |
| nightclub | nightclub_bass |
| spirit | spirit_wind |

---

## Archives (NEVER DELETE)
- `archive_v1/` — first generation batch
- `archive_v2/` — second generation (wrong model)
- `archive_v3/` — third generation (before self-referencing fix)
- `archive_originals/` — pre-gray-bg-removal originals
- `archive_originals_safe/` — duplicate backup of originals
