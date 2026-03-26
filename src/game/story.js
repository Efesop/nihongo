// ═══ STORY DATA — "The Ink Curse" ═══
// Katana Zero-inspired narrative: every line earns its place.
// The tutorial IS the story. Training in the dojo IS character development.
// Show-don't-tell: the inciting incident is earned, not explained.

export const CHARACTERS = {
  sensei:  { name: "先生", nameEn: "Sensei", color: "#cc9933" },
  player:  { name: "主人公", nameEn: "TinySenpai", color: "#cc4444" },
  shadow:  { name: "影", nameEn: "Shadow", color: "#aa44cc" },
  elder:   { name: "長老", nameEn: "Elder", color: "#44aa66" },
  system:  { name: "", nameEn: "", color: "#888899" },
};

// ═══════════════════════════════════════════════════════
// ROOM DIALOGUE — plays BEFORE entering each room
// The story unfolds through gameplay, not despite it.
// ═══════════════════════════════════════════════════════
export const ROOM_DIALOGUE = {

  // ═══ PROLOGUE — THE DOJO (Rooms 0-4) ═══
  // This is happening NOW. Morning. Training day.
  // The dialogue IS the tutorial. The player bonds with Sensei
  // through the act of learning — not through exposition.

  0: [
    { speaker: "system", textJp: "山の道場 — 夜明け前", text: "Mountain dojo — before dawn" },
    { speaker: "sensei", textJp: "起きたか。立て。", text: "You're awake. Stand." },
    { speaker: "player", textJp: "...まだ暗いですけど。", text: "...It's still dark out." },
    { speaker: "sensei", textJp: "敵は暗闇を待たない。お前もだ。", text: "Your enemies won't wait for daylight. Neither will you." },
    { speaker: "sensei", textJp: "まず動け。案山子まで走れ。そして斬れ。", text: "Move first. Run to the practice dummy. Then cut it down." },
  ],

  1: [
    { speaker: "sensei", textJp: "足元を見るな。上を見ろ。", text: "Stop looking at your feet. Look up." },
    { speaker: "player", textJp: "高すぎませんか？", text: "Isn't that too high?" },
    { speaker: "sensei", textJp: "高すぎるかどうかは、跳んでから決めろ。", text: "You don't get to decide it's too high until after you've jumped." },
    { speaker: "sensei", textJp: "何度落ちてもいい。恥じるな。", text: "Fall as many times as you need to. There's no shame in it." },
  ],

  2: [
    { speaker: "sensei", textJp: "今日は速さを教える。", text: "Today, I'll teach you speed." },
    { speaker: "sensei", textJp: "気を足に集中しろ。一瞬で距離を詰める。", text: "Focus your ki into your legs. Close the distance in an instant." },
    { speaker: "player", textJp: "あの...斬りながら突っ込んだらどうなります？", text: "Uh... what happens if I slash while dashing?" },
    { speaker: "sensei", textJp: "...やってみろ。", text: "...Try it and find out.", emotion: "amused" },
  ],

  3: [
    { speaker: "sensei", textJp: "壁に追い込まれたとする。どうする？", text: "Say you're backed against a wall. What do you do?" },
    { speaker: "player", textJp: "...斬り返す？", text: "...Cut my way out?" },
    { speaker: "sensei", textJp: "壁を登れ。", text: "Climb the wall.", emotion: "serious" },
    { speaker: "player", textJp: "え？", text: "Huh?" },
    { speaker: "sensei", textJp: "壁は障害じゃない。道だ。飛び移れ。", text: "A wall isn't an obstacle. It's a path. Jump between them." },
  ],

  4: [
    { speaker: "sensei", textJp: "最後の技だ。目を閉じろ。", text: "One last technique. Close your eyes." },
    { speaker: "sensei", textJp: "呼吸を...止めるな。遅くしろ。", text: "Your breathing... don't stop it. Slow it down." },
    { speaker: "player", textJp: "...先生、何ですか、これ。全部が遅く見える。", text: "...Sensei, what is this? Everything looks... slow." },
    { speaker: "sensei", textJp: "集中の極み。時の隙間に入る力だ。", text: "The peak of focus. The power to step between moments." },
    { speaker: "player", textJp: "すごい...！", text: "That's incredible...!" },
    { speaker: "sensei", textJp: "...使いすぎるな。", text: "...Don't overuse it.", emotion: "serious" },
  ],

  // ═══ THE INCITING INCIDENT (Room 5) ═══
  // After training, Sensei notices the mark. Everything changes.
  // The player is FORCED out — they don't choose to leave.

  5: [
    { speaker: "system", textJp: "修行の後 — 道場の外", text: "After training — outside the dojo" },
    { speaker: "sensei", textJp: "腕を見せろ。", text: "Show me your arm.", emotion: "serious" },
    { speaker: "player", textJp: "え？何が—", text: "Huh? What's—" },
    { speaker: "sensei", textJp: "...いつからある。この印は。", text: "...How long have you had this. This mark." },
    { speaker: "player", textJp: "分からない。気づいたら...集中すると光るんです。", text: "I don't know. It just appeared... it glows when I focus." },
    { speaker: "sensei", textJp: "...", text: "..." },
    { speaker: "player", textJp: "先生？大丈夫ですか？", text: "Sensei? Are you alright?" },
    { speaker: "sensei", textJp: "聞け。今すぐ道場を出ろ。", text: "Listen to me. Leave the dojo. Right now.", emotion: "serious" },
    { speaker: "player", textJp: "何を言って—", text: "What are you talk—" },
    { speaker: "sensei", textJp: "山寺の長老を探せ。あの人が全てを説明する。", text: "Find the Elder at the mountain temple. He'll explain everything." },
    { speaker: "player", textJp: "先生！何が起きてるんですか！", text: "Sensei! What's happening?!" },
    { speaker: "sensei", textJp: "印を持つ者は...狙われる。もう来ている。", text: "Those who bear the mark... are hunted. They're already here." },
    { speaker: "sensei", textJp: "行け！！", text: "GO!!" },
  ],

  // ═══ ACT 1: THE FOREST (Rooms 6-9) ═══
  // The player is fleeing. They're hunted, scared, alone.
  // The enemies aren't random — they're pursuers.

  // Room 6: no pre-dialogue (in-game encounter instead — keeps pace)
  // Room 7: no pre-dialogue (in-game encounter)

  8: [
    { speaker: "system", textJp: "森の奥 — 屋根伝い", text: "Deep forest — across the rooftops" },
    { speaker: "player", textJp: "止まるな。止まったら追いつかれる。", text: "Don't stop. If I stop, they'll catch me." },
    { speaker: "player", textJp: "先生が教えてくれた。速さが武器だって。", text: "Sensei taught me. Speed is the weapon." },
  ],

  // ═══ SHADOW'S ENTRANCE (Room 10) ═══
  // The antagonist is NOT a villain — he's someone who went through
  // the same thing the player is going through. He's bitter, not evil.

  10: [
    { speaker: "system", textJp: "森の奥地 — 月が昇る", text: "Deep in the forest — the moon rises" },
    { speaker: "shadow", textJp: "走るのをやめろ。無駄だ。", text: "Stop running. It's pointless." },
    { speaker: "player", textJp: "...誰だ。", text: "...Who's there." },
    { speaker: "shadow", textJp: "その腕の印。俺にも見覚えがある。", text: "That mark on your arm. I've seen it before." },
    { speaker: "player", textJp: "お前も先生の—", text: "Are you also Sensei's—" },
    { speaker: "shadow", textJp: "弟子？...昔はな。", text: "Student? ...Once upon a time.", emotion: "bitter" },
    { speaker: "shadow", textJp: "あの老人は何も教えなかっただろう。印のことも。", text: "The old man didn't tell you anything, did he. Not about the mark." },
    { speaker: "player", textJp: "印って何なんだ？！", text: "What IS the mark?!" },
    { speaker: "shadow", textJp: "力だ。そして代償だ。", text: "Power. And a price." },
    { speaker: "shadow", textJp: "時を遅くする力...お前も使っているだろう？", text: "The power to slow time... you've been using it too, right?" },
    { speaker: "shadow", textJp: "使うたびに印は広がる。やがて—", text: "Every time you use it, the mark spreads. Eventually—" },
    { speaker: "shadow", textJp: "...まあいい。生き延びろ。", text: "...Never mind. Just survive this." },
    { speaker: "shadow", textJp: "長老に辿り着けたら...続きを教えてやる。", text: "If you reach the Elder... I'll tell you the rest." },
  ],

  // ═══ ACT 1 CONTINUED (Rooms 11-14) ═══
  // The player now has a mystery: what is the mark? Why does
  // slow-mo have a cost? Shadow isn't blocking the path — he's testing.

  13: [
    { speaker: "shadow", textJp: "まだ生きてるか。", text: "Still alive, huh." },
    { speaker: "player", textJp: "お前が追手を送ってるのか？", text: "Are you the one sending these pursuers?" },
    { speaker: "shadow", textJp: "俺じゃない。印が呼んでいる。", text: "It's not me. The mark calls to them." },
    { speaker: "shadow", textJp: "強く使うほど、匂いが濃くなる。", text: "The more you use it, the stronger the scent." },
  ],

  14: [
    { speaker: "shadow", textJp: "ここから先は山道だ。", text: "The mountain path starts here." },
    { speaker: "player", textJp: "退くつもりはない。", text: "I'm not backing down." },
    { speaker: "shadow", textJp: "...いいだろう。最後の試験だ。", text: "...Fine. One last test." },
    { speaker: "shadow", textJp: "ここを越えられなければ、山は越えられない。", text: "If you can't get past this, you won't survive the mountain." },
  ],

  // ═══ ACT 2: THE TEMPLE (Rooms 15-19) ═══
  // The Elder reveals the truth. The mark is "the Ink Curse."
  // Shadow is Sensei's first student who was consumed by it.
  // The gameplay mechanic (slow-mo) IS the curse.

  15: [
    { speaker: "system", textJp: "第二幕 — 山寺", text: "Act 2 — The Mountain Temple" },
    { speaker: "elder", textJp: "来たか。先生から連絡があった。", text: "You made it. Sensei sent word ahead." },
    { speaker: "player", textJp: "先生は無事ですか！？", text: "Is Sensei alright?!" },
    { speaker: "elder", textJp: "...その話は後だ。まず聞け。", text: "...We'll discuss that later. First, listen." },
    { speaker: "elder", textJp: "お前の腕の印。『墨の呪い』と呼ばれている。", text: "The mark on your arm. It's called the Ink Curse." },
    { speaker: "player", textJp: "呪い...？", text: "A curse...?" },
    { speaker: "elder", textJp: "時を遅くする力。お前はもう使っているだろう。", text: "The power to slow time. You've been using it already." },
    { speaker: "elder", textJp: "だが使うたびに、呪いは体に広がる。", text: "But every time you use it, the curse spreads through your body." },
    { speaker: "player", textJp: "...それを知っていて、先生は教えたんですか？", text: "...And Sensei taught me this knowing that?" },
    { speaker: "elder", textJp: "お前を守るためだ。力がなければ、追手に殺される。", text: "To protect you. Without it, the hunters would have killed you." },
  ],

  16: [
    { speaker: "elder", textJp: "先生にはかつて二人の弟子がいた。", text: "Sensei once had two students." },
    { speaker: "player", textJp: "...影。あいつのことですか。", text: "...Shadow. You mean him." },
    { speaker: "elder", textJp: "そうだ。最初の弟子。お前と同じ印を持っていた。", text: "Yes. The first student. He bore the same mark as you." },
    { speaker: "elder", textJp: "力に溺れた。使いすぎた。呪いに飲まれた。", text: "He drowned in the power. Used it too much. The curse consumed him." },
    { speaker: "elder", textJp: "あの姿は...もう人間とは言えない。", text: "What he's become... can hardly be called human anymore." },
    { speaker: "player", textJp: "...俺もそうなるんですか。", text: "...Will that happen to me too?" },
    { speaker: "elder", textJp: "まだ間に合う。だが—", text: "There's still time. But—" },
  ],

  17: [
    { speaker: "shadow", textJp: "長老に何を聞いた？", text: "What did the Elder tell you?" },
    { speaker: "player", textJp: "全部だ。お前のことも。印のことも。", text: "Everything. About you. About the mark." },
    { speaker: "shadow", textJp: "...そうか。", text: "...I see." },
    { speaker: "shadow", textJp: "なら分かるだろう。この力は手放せない。", text: "Then you understand. This power can't be given up." },
    { speaker: "player", textJp: "長老は消せると言った。", text: "The Elder said it can be removed." },
    { speaker: "shadow", textJp: "消す？俺からこれを奪うのか？", text: "Remove it? You'd take this from me?", emotion: "angry" },
    { speaker: "shadow", textJp: "この力は...先生がくれた唯一のものだ。", text: "This power is... the only thing Sensei ever gave me." },
  ],

  18: [
    { speaker: "elder", textJp: "奥の間に封印の術がある。呪いを消せる。", text: "In the inner chamber, there's a sealing technique. It can remove the curse." },
    { speaker: "elder", textJp: "だが影は許さないだろう。", text: "But Shadow won't allow it." },
    { speaker: "player", textJp: "影は...先生を恨んでいるんですか？", text: "Does Shadow... resent Sensei?" },
    { speaker: "elder", textJp: "恨んでなどいない。", text: "He doesn't resent him." },
    { speaker: "elder", textJp: "愛しているからこそ、手放せないのだ。", text: "He can't let go precisely because he loved him." },
    { speaker: "elder", textJp: "呪いは先生との絆だと思っている。", text: "He sees the curse as his bond with Sensei." },
  ],

  19: [
    { speaker: "shadow", textJp: "ここまで来たか。", text: "So you made it this far." },
    { speaker: "player", textJp: "影。もう戦わなくていい。", text: "Shadow. You don't have to fight anymore." },
    { speaker: "shadow", textJp: "...お前に何が分かる。", text: "...What would you know about it." },
    { speaker: "shadow", textJp: "先生が俺を捨てた。新しい弟子を取った。", text: "Sensei abandoned me. Took a new student." },
    { speaker: "player", textJp: "捨てたんじゃない。助けられなかったんだ。", text: "He didn't abandon you. He couldn't save you." },
    { speaker: "shadow", textJp: "...黙れ。", text: "...Shut up.", emotion: "angry" },
    { speaker: "shadow", textJp: "この印を消すというなら、俺を倒してからにしろ。", text: "If you want to break this curse, you'll have to go through me first." },
    { speaker: "shadow", textJp: "先生の最初の弟子と、最後の弟子。決着をつけよう。", text: "Sensei's first student versus his last. Let's end this." },
  ],
};

// ═══════════════════════════════════════════════════════
// IN-GAME ENCOUNTERS — speech bubbles during gameplay
// These don't pause the game, just slow it slightly.
// Used for short thoughts, reactions, and environmental storytelling.
// ═══════════════════════════════════════════════════════
export const ROOM_ENCOUNTERS = {
  // Rooms 6-7: Player fleeing, processing what happened
  6: [
    { triggerX: 200, speaker: "player", textJp: "道場が...先生が...", text: "The dojo... Sensei...", duration: 2000 },
    { triggerX: 1000, speaker: "player", textJp: "追手だ。先生の言う通りだった。", text: "Pursuers. Sensei was right.", duration: 2000 },
  ],
  7: [
    { triggerX: 200, speaker: "player", textJp: "壁を登れ。先生がそう教えた。", text: "Climb the walls. That's what Sensei taught me.", duration: 2500 },
  ],
  8: [
    { triggerX: 1500, speaker: "player", textJp: "腕の印が...熱い。", text: "The mark on my arm... it's burning.", duration: 2000 },
  ],
  9: [
    { triggerX: 300, speaker: "player", textJp: "山寺はもうすぐのはず...", text: "The mountain temple should be close...", duration: 2000 },
  ],
  // Shadow watches from afar after his appearance
  11: [
    { triggerX: 200, speaker: "player", textJp: "影の言ったこと...「力と代償」...", text: "What Shadow said... 'power and a price'...", duration: 2500 },
    { triggerX: 1200, speaker: "shadow", textJp: "印を使え。でなければ死ぬぞ。", text: "Use the mark. Or you'll die here.", duration: 2000 },
  ],
  12: [
    { triggerX: 200, speaker: "player", textJp: "集中すると...印が脈打つ。", text: "When I focus... the mark pulses.", duration: 2000 },
  ],
  14: [
    { triggerX: 500, speaker: "shadow", textJp: "全力で来い。", text: "Come at me with everything.", duration: 1500 },
  ],
  // Temple — the truth weighs heavy
  16: [
    { triggerX: 400, speaker: "player", textJp: "影も...先生の弟子だった。", text: "Shadow was... Sensei's student too.", duration: 2500 },
  ],
  17: [
    { triggerX: 600, speaker: "player", textJp: "集中の力を使うたびに呪いが広がる...でも使わないと死ぬ。", text: "The curse spreads every time I use focus... but I'll die without it.", duration: 3000 },
  ],
  19: [
    { triggerX: 500, speaker: "shadow", textJp: "手加減はしない。", text: "I won't hold back.", duration: 1500 },
    { triggerX: 1200, speaker: "shadow", textJp: "...先生、見ているか。", text: "...Sensei, are you watching?", duration: 2000 },
  ],
};

// ═══════════════════════════════════════════════════════
// CHOICE DEFINITIONS — keyed by room number
// Each choice has real gameplay consequences.
// ═══════════════════════════════════════════════════════
export const ROOM_CHOICES = {
  // After Shadow's first encounter — do you embrace the curse for power?
  10: {
    after: 11, // after the last shadow line
    speaker: "system",
    textJp: "印が脈打っている。力が流れ込んでくる。",
    text: "The mark is pulsing. Power flows through you.",
    options: [
      { textJp: "力を受け入れる。", text: "Accept the power.", flag: "curse_accept_1", effect: { slowMoBonus: 30 } },
      { textJp: "印を抑え込む。", text: "Suppress the mark.", flag: "curse_resist_1", effect: null },
    ],
  },
};

// ═══════════════════════════════════════════════════════
// STORY TRIGGERS — which rooms get pre-room story screens
// Only substantial multi-character dialogue gets a story screen.
// Single thoughts/reactions → in-game encounters (no interruption).
// ═══════════════════════════════════════════════════════
export const STORY_TRIGGERS = {
  0: 0,    // Dojo — wake up, first training (5 lines)
  1: 1,    // Dojo — jump training (4 lines)
  2: 2,    // Dojo — dash training (4 lines)
  3: 3,    // Dojo — wall training (5 lines)
  4: 4,    // Dojo — focus/slow-mo, "don't overuse it" (6 lines)
  5: 5,    // THE TURN — Sensei sees the mark, forces player to flee (13 lines)
  // 6: encounter only (fleeing, no time to stop)
  // 7: encounter only
  8: 8,    // Brief — player running, scared (2 lines)
  // 9: encounter only
  10: 10,  // MAJOR — Shadow's entrance + exposition (13 lines)
  // 11: encounter only
  // 12: encounter only
  13: 13,  // Shadow dialogue — the mark calls pursuers (4 lines)
  14: 14,  // Shadow's test — gate to the mountain (4 lines)
  15: 15,  // MAJOR — Elder reveals the Ink Curse (10 lines)
  16: 16,  // Elder reveals Shadow's identity (7 lines)
  17: 17,  // Shadow confronts player about removing curse (7 lines)
  18: 18,  // Elder — the sealing technique + Shadow's love (6 lines)
  19: 19,  // FINAL — Shadow vs Player, earned confrontation (8 lines)
};

// ═══════════════════════════════════════════════════════
// SCENE VISUAL CONFIG — environment per location
// ═══════════════════════════════════════════════════════
export function getSceneConfig(roomIndex) {
  if (roomIndex <= 4) return {
    bg: 'linear-gradient(180deg, #1a1510 0%, #14100c 40%, #0e0a06 100%)',
    label: '道場', labelEn: 'THE DOJO',
    filter: null, // no filter — this is happening NOW
    particles: 'dust',
  };
  if (roomIndex === 5) return {
    bg: 'linear-gradient(180deg, #1a0808 0%, #140606 40%, #0a0404 100%)',
    label: '転機', labelEn: 'THE TURNING POINT',
    filter: null,
    particles: 'embers', // tension, fire nearby
  };
  if (roomIndex <= 9) return {
    bg: 'linear-gradient(180deg, #081a12 0%, #061210 40%, #040a08 100%)',
    label: '森', labelEn: 'THE FOREST',
    filter: null,
    particles: 'leaves',
  };
  if (roomIndex <= 14) return {
    bg: 'linear-gradient(180deg, #1a0a1a 0%, #140818 40%, #0a0410 100%)',
    label: '闇路', labelEn: 'THE DARK PATH',
    filter: null,
    particles: 'embers',
  };
  return {
    bg: 'linear-gradient(180deg, #1a1508 0%, #161008 40%, #0c0a06 100%)',
    label: '山寺', labelEn: 'THE MOUNTAIN TEMPLE',
    filter: null,
    particles: 'petals',
  };
}

// Default choices state
export function getDefaultChoices() {
  return {
    curse_accept_1: false,
    curse_accept_2: false,
    curse_resist_1: false,
    curse_resist_2: false,
  };
}
