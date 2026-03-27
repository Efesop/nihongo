// ═══ STORY DATA — "The Ink Curse" ═══
// Katana Zero-inspired narrative: every line earns its place.
// The tutorial IS the story. Training in the dojo IS character development.
// Show-don't-tell: the inciting incident is earned, not explained.

export const CHARACTERS = {
  sensei:   { name: "先生",     nameEn: "Sensei",       color: "#cc9933" },
  player:   { name: "主人公",   nameEn: "TinySenpai",   color: "#cc4444" },
  shadow:   { name: "影",       nameEn: "Shadow",       color: "#aa44cc" },
  elder:    { name: "長老",     nameEn: "Elder",        color: "#44aa66" },
  kunoichi: { name: "くノ一",   nameEn: "Kunoichi",     color: "#cc4488" },
  katsura:  { name: "桂",       nameEn: "Lord Katsura", color: "#aa8833" },
  hacker:   { name: "ハッカー", nameEn: "Hacker",       color: "#44ccaa" },
  fox:      { name: "狐",       nameEn: "Fox Spirit",   color: "#ff8844" },
  system:   { name: "",         nameEn: "",             color: "#888899" },
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
    { speaker: "sensei", textJp: "...また朝寝坊か。", text: "...Sleeping in again, I see.", emotion: "amused" },
    { speaker: "player", textJp: "先生！まだ星が出てますよ！", text: "Sensei! The stars are still out!", emotion: "surprised" },
    { speaker: "sensei", textJp: "それがどうした。茶を入れたぞ。飲んでから始めろ。", text: "So what? I made tea. Drink it before we start.", emotion: "idle" },
    { speaker: "player", textJp: "...いつも世話になってます。", text: "...Thank you. For everything.", emotion: "idle" },
    { speaker: "sensei", textJp: "礼は後だ。立て。あの的を斬ってみろ。", text: "Thank me later. Stand up. Strike down that target.", emotion: "serious" },
  ],

  1: [
    { speaker: "sensei", textJp: "足元を見るな。上を見ろ。", text: "Stop looking at your feet. Look up.", emotion: "serious" },
    { speaker: "player", textJp: "高すぎませんか？", text: "Isn't that too high?", emotion: "surprised" },
    { speaker: "sensei", textJp: "高すぎるかどうかは、跳んでから決めろ。", text: "You don't get to decide it's too high until after you've jumped.", emotion: "serious" },
    { speaker: "sensei", textJp: "何度落ちてもいい。恥じるな。", text: "Fall as many times as you need to. There's no shame in it.", emotion: "amused" },
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
    // Choice happens here (after index 3) — training_push or training_rest
    { speaker: "sensei", textJp: "いい心意気だ。限界は超えるためにある。", text: "Good spirit. Limits exist to be broken.", emotion: "amused", condition: { flag: "training_push" } },
    { speaker: "sensei", textJp: "...賢い判断だ。折れた刀は戦えん。", text: "...A wise choice. A broken blade can't fight.", emotion: "amused", condition: { flag: "training_rest" } },
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
    { speaker: "system", textJp: "修行の後 — 夕暮れの道場", text: "After training — the dojo at dusk" },
    { speaker: "sensei", textJp: "...今日はよくやった。成長してる。", text: "...You did well today. You're improving.", emotion: "amused" },
    { speaker: "player", textJp: "先生、褒めてくれるなんて珍しいですね。", text: "Sensei, it's rare for you to compliment me.", emotion: "surprised" },
    { speaker: "sensei", textJp: "ふん。図に乗るなよ。", text: "Hmph. Don't let it go to your head.", emotion: "amused" },
    { speaker: "sensei", textJp: "...ところで。腕を見せろ。", text: "...By the way. Show me your arm.", emotion: "serious" },
    { speaker: "player", textJp: "え？なんで—", text: "Huh? Why—", emotion: "surprised" },
    { speaker: "sensei", textJp: "...いつからある。この印は。", text: "...How long have you had this. This mark.", emotion: "serious" },
    { speaker: "player", textJp: "分からない。気づいたら...集中すると光るんです。", text: "I don't know. It just appeared... it glows when I focus.", emotion: "idle" },
    { speaker: "sensei", textJp: "...", text: "...", emotion: "serious" },
    { speaker: "player", textJp: "先生？顔色が悪いですよ。大丈夫ですか？", text: "Sensei? You've gone pale. Are you alright?", emotion: "concerned" },
    // Choice happens here (after index 9) — departure_demand or departure_trust
    { speaker: "sensei", textJp: "...説明している暇はない！信じろ！", text: "...There's no time to explain! Trust me!", emotion: "serious", condition: { flag: "departure_demand" } },
    { speaker: "sensei", textJp: "...お前は強い子だ。", text: "...You've always been strong.", emotion: "serious", condition: { flag: "departure_trust" } },
    { speaker: "sensei", textJp: "...聞け。今から言うことを全部覚えろ。", text: "...Listen. Remember everything I'm about to say.", emotion: "serious" },
    { speaker: "sensei", textJp: "今すぐ道場を出ろ。山寺の長老を探せ。", text: "Leave the dojo. Right now. Find the Elder at the mountain temple.", emotion: "serious" },
    { speaker: "player", textJp: "何を言って—一人で？先生は？", text: "What are you— alone? What about you?", emotion: "surprised" },
    { speaker: "sensei", textJp: "印を持つ者は...狙われる。もう来ている。", text: "Those who bear the mark... are hunted. They're already here.", emotion: "serious" },
    { speaker: "sensei", textJp: "お前を守るのは、もう俺の仕事じゃない。", text: "Protecting you... isn't my job anymore.", emotion: "serious" },
    { speaker: "sensei", textJp: "自分の足で立て。行け！！", text: "Stand on your own two feet. GO!!", emotion: "serious" },
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
    // Choice happens here (after index 11) — curse_accept_1 or curse_resist_1
    { speaker: "shadow", textJp: "...面白い。恐れないか。", text: "...Interesting. You're not afraid.", emotion: "bitter", condition: { flag: "curse_accept_1" } },
    { speaker: "shadow", textJp: "抑える？...無駄だ。でも面白い。", text: "Suppress it? ...Pointless. But interesting.", condition: { flag: "curse_resist_1" } },
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
    // Choice happens here (after index 2) — shadow_prove or shadow_empathy
    { speaker: "shadow", textJp: "言葉はいい。見せてみろ。", text: "Words are cheap. Show me.", condition: { flag: "shadow_prove" } },
    { speaker: "shadow", textJp: "...試す必要がないだと？甘いな。", text: "...No need to test you? How naive.", emotion: "bitter", condition: { flag: "shadow_empathy" } },
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
    // Choice happens here (after index 5) — shadow_help or shadow_duty
    { speaker: "shadow", textJp: "助ける...？誰もそんなこと言わなかった。", text: "Help me...? No one's ever said that.", emotion: "bitter", condition: { flag: "shadow_help" } },
    { speaker: "shadow", textJp: "義務か。お前も結局、あの老人と同じだ。", text: "Duty, huh. You're just like the old man after all.", emotion: "angry", condition: { flag: "shadow_duty" } },
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

  // ═══ ACT 1 FINALE (Room 11) — Shadow's test before the time rift ═══
  11: [
    { speaker: "shadow", textJp: "ここから先は...お前の知る世界じゃない。", text: "Beyond this point... isn't the world you know." },
    { speaker: "player", textJp: "どういう意味だ？", text: "What do you mean?" },
    { speaker: "shadow", textJp: "印は時を歪める。使いすぎると...時が裂ける。", text: "The mark warps time. Use it too much... and time itself tears." },
    { speaker: "shadow", textJp: "生き延びろ。次に会う時は...違う場所だ。", text: "Survive. Next time we meet... it'll be a different place." },
  ],

  // ═══ ACT 2: EDO CASTLE TOWN (Rooms 12-18) ═══
  // Time rift tears open. Player wakes in the Edo period.
  // New ally: Kunoichi. New antagonist: Lord Katsura.

  12: [
    { speaker: "system", textJp: "第二幕 — 江戸城下町", text: "Act 2 — Edo Castle Town" },
    { speaker: "system", textJp: "時が裂けた。見知らぬ街。見知らぬ時代。", text: "Time has torn. An unfamiliar city. An unfamiliar era." },
    { speaker: "player", textJp: "...ここはどこだ？建物が...全然違う。", text: "...Where am I? The buildings are... completely different." },
    { speaker: "player", textJp: "印が脈打っている。ここに引き寄せられた？", text: "The mark is pulsing. Was I drawn here?" },
    { speaker: "kunoichi", textJp: "おい。そこの。印持ちだな。", text: "Hey. You there. You bear the mark." },
    { speaker: "player", textJp: "誰だ？！", text: "Who are you?!" },
    { speaker: "kunoichi", textJp: "味方だ。今は。ついてこい、追手が来る前に。", text: "An ally. For now. Follow me, before the hunters arrive." },
  ],

  13: [
    { speaker: "kunoichi", textJp: "ここは安全だ。少し話そう。", text: "We're safe here. Let's talk." },
    { speaker: "kunoichi", textJp: "私はくノ一。印の研究をしている。", text: "I'm Kunoichi. I study the mark." },
    { speaker: "player", textJp: "研究？呪いだろう？", text: "Study? It's a curse, isn't it?" },
    { speaker: "kunoichi", textJp: "呪い？...それは片面だけの話だ。", text: "A curse? ...That's only half the story." },
    { speaker: "kunoichi", textJp: "印は元々、神からの贈り物だった。時を操る力。", text: "The mark was originally a gift from the gods. The power to control time." },
    { speaker: "kunoichi", textJp: "だが人の欲が力を歪めた。贈り物は呪いになった。", text: "But human greed twisted the power. The gift became a curse." },
  ],

  15: [
    { speaker: "kunoichi", textJp: "城の中に古い巻物がある。呪いの起源が書かれている。", text: "There's an ancient scroll inside the castle. It describes the curse's origin." },
    { speaker: "player", textJp: "城に忍び込むのか？", text: "We're sneaking into the castle?" },
    { speaker: "kunoichi", textJp: "見つかったら終わりだ。静かに、素早く。", text: "If we're spotted, it's over. Quiet and swift." },
    { speaker: "kunoichi", textJp: "あの衛兵たちの視線を避けろ。影に隠れて進め。", text: "Avoid the guards' line of sight. Move through the shadows." },
  ],

  17: [
    { speaker: "system", textJp: "城の最上階 — 桂の間", text: "Castle top floor — Katsura's chamber" },
    { speaker: "katsura", textJp: "印持ちが...また来たか。", text: "A mark-bearer... has come again." },
    { speaker: "player", textJp: "お前が桂公か。", text: "You're Lord Katsura." },
    { speaker: "katsura", textJp: "数百年前、俺も同じ印を持っていた。", text: "Centuries ago, I bore the same mark." },
    { speaker: "katsura", textJp: "俺は呪いを封じた。だが代償に...時に囚われた。", text: "I sealed the curse. But the price was... being trapped in time." },
    { speaker: "player", textJp: "封じる方法を教えてくれ！", text: "Tell me how to seal it!" },
    { speaker: "katsura", textJp: "方法は一つ。全ての時代を貫く印を集めろ。", text: "There is one way. Gather the marks across all eras." },
    { speaker: "katsura", textJp: "だが覚悟しろ。集めるたびに...時がさらに裂ける。", text: "But be warned. Each time you gather one... time tears further." },
  ],

  18: [
    { speaker: "kunoichi", textJp: "桂公の言葉...信じるのか？", text: "Lord Katsura's words... do you trust them?" },
    { speaker: "player", textJp: "選択肢がない。先に進むしかない。", text: "I don't have a choice. I have to keep going." },
    { speaker: "kunoichi", textJp: "...気をつけろ。次の裂け目が開く。", text: "...Be careful. The next rift is opening." },
    { speaker: "system", textJp: "印が激しく脈打つ。光が全てを飲み込む。", text: "The mark pulses violently. Light swallows everything." },
  ],

  // ═══ ACT 3: NEON TOKYO (Rooms 19-25) ═══
  // The curse tears through time again. Cyberpunk streets.

  19: [
    { speaker: "system", textJp: "第三幕 — ネオン東京", text: "Act 3 — Neon Tokyo" },
    { speaker: "system", textJp: "雨。ネオン。未来の東京。", text: "Rain. Neon. Future Tokyo." },
    { speaker: "player", textJp: "...また違う時代。ここは...東京？", text: "...Another era. This is... Tokyo?" },
    { speaker: "player", textJp: "看板が...日本語だけど、光っている。電気の光。", text: "The signs are... Japanese, but glowing. Electric light." },
    { speaker: "hacker", textJp: "おい、お前。時間の裂け目から来たな？", text: "Hey, you. You came through a time rift, right?" },
    { speaker: "player", textJp: "...なんで分かる。", text: "...How do you know." },
    { speaker: "hacker", textJp: "俺のセンサーが反応した。墨の呪いの波長だ。", text: "My sensors picked it up. The wavelength of the Ink Curse." },
    { speaker: "hacker", textJp: "ヤクザが印持ちを狩ってる。急いで隠れろ。", text: "The yakuza are hunting mark-bearers. Hide. Now." },
  ],

  21: [
    { speaker: "hacker", textJp: "この時代では、印の力は技術と融合している。", text: "In this era, the mark's power has fused with technology." },
    { speaker: "player", textJp: "サイバー忍者...印の力で瞬間移動する？", text: "Cyber ninjas... they teleport using the mark's power?" },
    { speaker: "hacker", textJp: "そうだ。呪いを兵器化した。", text: "Exactly. They weaponized the curse." },
    { speaker: "hacker", textJp: "高速道路を越えろ。向こう側に安全な場所がある。", text: "Cross the highway. There's a safe place on the other side." },
  ],

  22: [
    { speaker: "shadow", textJp: "また会ったな。", text: "We meet again." },
    { speaker: "player", textJp: "影...お前もここに？", text: "Shadow... you're here too?" },
    { speaker: "shadow", textJp: "印は俺も引き寄せる。どの時代にも。", text: "The mark draws me too. To every era.", emotion: "bitter" },
    { speaker: "shadow", textJp: "この街を見ろ。呪いが未来をどう変えたか。", text: "Look at this city. See what the curse did to the future." },
    { speaker: "shadow", textJp: "それでもまだ...封じたいのか？", text: "And you still... want to seal it?" },
  ],

  25: [
    { speaker: "hacker", textJp: "最後のデータを手に入れた。次の裂け目の座標だ。", text: "Got the last data. Coordinates for the next rift." },
    { speaker: "player", textJp: "...地下か。", text: "...Underground." },
    { speaker: "hacker", textJp: "気をつけろ。あそこは...ヤクザの本拠地だ。", text: "Be careful. That place... is yakuza headquarters." },
    { speaker: "system", textJp: "印が震える。地下深くに何かがある。", text: "The mark trembles. Something lies deep below." },
  ],

  // ═══ ACT 4: UNDERGROUND / NIGHTCLUB (Rooms 26-31) ═══

  26: [
    { speaker: "system", textJp: "第四幕 — 地下", text: "Act 4 — The Underground" },
    { speaker: "player", textJp: "暗い。見つからないように進まないと。", text: "Dark. I need to move without being seen." },
    { speaker: "player", textJp: "ここの敵は...強い。正面から戦うのは危険だ。", text: "The enemies here are... strong. A frontal fight would be suicide." },
  ],

  28: [
    { speaker: "system", textJp: "ナイトクラブ — 重低音が壁を震わせる", text: "Nightclub — bass shakes the walls" },
    { speaker: "player", textJp: "...ここに裂け目がある？こんな場所に？", text: "...The rift is here? In a place like this?" },
    { speaker: "hacker", textJp: "（通信）クラブの奥にVIPルームがある。裂け目の波長はそこからだ。", text: "(comms) There's a VIP room in the back. The rift signal is coming from there." },
    { speaker: "hacker", textJp: "バウンサーに見つかるな。ライトの動きに合わせて進め。", text: "Don't let the bouncers spot you. Move with the lights." },
  ],

  29: [
    { speaker: "system", textJp: "VIPルーム — DJメカが待ち構えている", text: "VIP Room — the DJ Mech awaits" },
    { speaker: "player", textJp: "あれは...機械と人間の融合体？", text: "That's... a fusion of machine and human?" },
    { speaker: "hacker", textJp: "DJメカ。呪いの力で音を兵器にした。気をつけろ。", text: "DJ Mech. It weaponized sound using the curse. Watch out." },
  ],

  31: [
    { speaker: "shadow", textJp: "...まだ生きているか。", text: "...Still alive?" },
    { speaker: "player", textJp: "影。もう一つの裂け目が開く。", text: "Shadow. Another rift is opening." },
    { speaker: "shadow", textJp: "次は...最初に始まった場所だ。", text: "Next is... where it all began.", emotion: "bitter" },
    { speaker: "shadow", textJp: "山寺。精霊の世界との境界。", text: "The mountain temple. The boundary with the spirit world." },
    { speaker: "system", textJp: "光が裂ける。桜の花びらが舞う。", text: "Light tears. Cherry blossoms dance." },
  ],

  // ═══ ACT 5: TEMPLE / SPIRIT REALM (Rooms 32-38) ═══

  32: [
    { speaker: "system", textJp: "第五幕 — 山寺・精霊の世界", text: "Act 5 — Mountain Temple / Spirit Realm" },
    { speaker: "elder", textJp: "お帰り。待っていた。", text: "Welcome back. I've been waiting." },
    { speaker: "player", textJp: "長老...全ての時代を旅してきた。", text: "Elder... I've traveled through every era." },
    { speaker: "elder", textJp: "印が集まっているな。最後の封印の準備ができた。", text: "The marks are gathering. The final seal is ready." },
    { speaker: "elder", textJp: "だが...影もここに来る。止めに。", text: "But... Shadow will come too. To stop it." },
  ],

  34: [
    { speaker: "system", textJp: "時が混ざる。全ての時代の敵が現れる。", text: "Time merges. Enemies from every era appear." },
    { speaker: "player", textJp: "侍も忍者も...サイバー戦士も。全部混ざっている。", text: "Samurai, ninja... cyber warriors. Everything is mixed." },
    { speaker: "elder", textJp: "時が崩壊し始めている。急げ。", text: "Time is beginning to collapse. Hurry." },
  ],

  35: [
    { speaker: "system", textJp: "精霊の世界 — 境界を越えて", text: "Spirit Realm — beyond the boundary" },
    { speaker: "fox", textJp: "印持ちよ。ここまで来たか。", text: "Mark-bearer. You've come this far." },
    { speaker: "player", textJp: "お前は...？", text: "You are...?" },
    { speaker: "fox", textJp: "私は狐。この力を最初に人に与えた者だ。", text: "I am Fox. The one who first gave this power to humans." },
    { speaker: "fox", textJp: "贈り物だった。時を超える力。だが人はそれを呪いに変えた。", text: "It was a gift. The power to transcend time. But humans turned it into a curse." },
    { speaker: "player", textJp: "元に戻せるのか？", text: "Can it be undone?" },
    { speaker: "fox", textJp: "お前次第だ。全ての印を集めたなら...選択がある。", text: "That depends on you. If you've gathered all the marks... there is a choice." },
  ],

  37: [
    { speaker: "shadow", textJp: "...ここで終わりにしよう。", text: "...Let's end this here." },
    { speaker: "player", textJp: "影。まだ戦うのか。", text: "Shadow. Are you still fighting?" },
    { speaker: "shadow", textJp: "全ての時代を見てきた。どこにも居場所がなかった。", text: "I've seen every era. I belonged in none of them.", emotion: "bitter" },
    { speaker: "shadow", textJp: "この力だけが...俺の唯一の存在理由だ。", text: "This power is... my only reason to exist." },
    { speaker: "player", textJp: "違う。お前の存在理由は先生との絆だ。力じゃない。", text: "No. Your reason to exist is your bond with Sensei. Not the power." },
    { speaker: "shadow", textJp: "...黙れ。", text: "...Shut up.", emotion: "angry" },
    // Choice: shadow_final_help or shadow_final_fight
    { speaker: "player", textJp: "一緒に帰ろう。先生が待っている。", text: "Let's go home together. Sensei is waiting.", condition: { flag: "shadow_final_help" } },
    { speaker: "player", textJp: "止められないなら...倒すしかない。", text: "If you won't stop... I'll have to stop you.", condition: { flag: "shadow_final_fight" } },
    { speaker: "shadow", textJp: "...先生の弟子と...最後の勝負だ。", text: "...Sensei's student versus... one last fight." },
  ],

  38: [
    { speaker: "system", textJp: "最終決戦 — 精霊の世界の中心", text: "Final Battle — Heart of the Spirit Realm" },
    { speaker: "shadow", textJp: "全力で来い。手加減はしない。", text: "Come at me with everything. I won't hold back.", emotion: "angry" },
    { speaker: "player", textJp: "分かった。...でも殺しはしない。", text: "Fine. ...But I won't kill you." },
    { speaker: "shadow", textJp: "甘いな...それが命取りだ。", text: "So naive... that will be your downfall." },
    { speaker: "system", textJp: "墨の呪いが暴走する。闇が形を取る。", text: "The Ink Curse erupts. Darkness takes shape." },
  ],

  // ═══ EPILOGUE (Rooms 39-41) ═══

  39: [
    { speaker: "system", textJp: "終章 — 帰還", text: "Epilogue — The Return" },
    { speaker: "system", textJp: "精霊の世界が消えていく。桜が舞い散る。", text: "The spirit world fades. Cherry blossoms scatter." },
    { speaker: "fox", textJp: "よくやった。呪いは...贈り物に戻った。", text: "Well done. The curse has... returned to being a gift." },
    { speaker: "player", textJp: "影は...？", text: "Shadow...?" },
    { speaker: "fox", textJp: "あなた次第だった。そしてあなたは選んだ。", text: "It was up to you. And you chose." },
    // Conditional based on accumulated choices
    { speaker: "fox", textJp: "慈悲を選んだ。影は救われた。", text: "You chose compassion. Shadow is saved.", condition: { flag: "shadow_final_help" } },
    { speaker: "fox", textJp: "力で決着をつけた。影は自由になった...別の形で。", text: "You settled it with strength. Shadow is free... in another way.", condition: { flag: "shadow_final_fight" } },
  ],

  40: [
    { speaker: "system", textJp: "山の道場 — 夜明け", text: "Mountain dojo — dawn" },
    { speaker: "sensei", textJp: "...帰ってきたか。", text: "...You came back.", emotion: "amused" },
    { speaker: "player", textJp: "先生。全部終わった。", text: "Sensei. It's all over." },
    { speaker: "sensei", textJp: "茶を入れた。飲んでから話せ。", text: "I made tea. Drink first, then talk.", emotion: "amused" },
    { speaker: "player", textJp: "...相変わらずですね。", text: "...You never change." },
    { speaker: "sensei", textJp: "お前が変わった。...強くなった。", text: "You've changed. ...You've become strong.", emotion: "serious" },
    // Shadow appears if saved
    { speaker: "shadow", textJp: "...俺にも茶をくれ。", text: "...Tea for me too.", condition: { flag: "shadow_final_help" } },
    { speaker: "sensei", textJp: "...二人とも。おかえり。", text: "...Both of you. Welcome home.", emotion: "amused", condition: { flag: "shadow_final_help" } },
  ],

  41: [
    { speaker: "system", textJp: "修行の始まり — 新たな夜明け", text: "The beginning of training — a new dawn" },
    { speaker: "sensei", textJp: "さあ。もう一度最初から。", text: "Now then. Once more, from the beginning.", emotion: "serious" },
    { speaker: "player", textJp: "...はい、先生。", text: "...Yes, Sensei." },
    { speaker: "system", textJp: "物語は終わり、修行は続く。", text: "The story ends. The training continues." },
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
  // Training personality — how do you approach training?
  3: {
    after: 3, // after "A wall isn't an obstacle"
    options: [
      { textJp: "もっと厳しく。", text: "Push me harder.", flag: "training_push" },
      { textJp: "...少し休みたい。", text: "...I need a moment.", flag: "training_rest" },
    ],
  },
  // The turning point — how do you react to being sent away?
  5: {
    after: 9, // after "What's happening?!"
    options: [
      { textJp: "説明してください！", text: "Tell me what's happening!", flag: "departure_demand" },
      { textJp: "...分かりました。信じます。", text: "...I understand. I trust you.", flag: "departure_trust" },
    ],
  },
  // Shadow's first encounter — embrace the curse?
  10: {
    after: 11,
    options: [
      { textJp: "力を受け入れる。", text: "Accept the power.", flag: "curse_accept_1", effect: { slowMoBonus: 30 } },
      { textJp: "印を抑え込む。", text: "Suppress the mark.", flag: "curse_resist_1", effect: null },
    ],
  },
  // Shadow's gate — prove yourself or appeal to empathy?
  14: {
    after: 1, // after "I'm not backing down"
    options: [
      { textJp: "証明してやる。", text: "I'll prove myself.", flag: "shadow_prove" },
      { textJp: "試す必要はない。", text: "You don't need to test me.", flag: "shadow_empathy" },
    ],
  },
  // Confrontation — help Shadow or do your duty?
  17: {
    after: 5,
    options: [
      { textJp: "助けたいんだ。", text: "I want to help you.", flag: "shadow_help" },
      { textJp: "やるべきことをやる。", text: "I'll do what I must.", flag: "shadow_duty" },
    ],
  },
  // Final — three approaches to the final battle (original Act 2)
  19: {
    after: 5,
    options: [
      { textJp: "全力で行く。", text: "I'll fight with everything.", flag: "final_aggressive" },
      { textJp: "傷つけたくない。", text: "I don't want to hurt you.", flag: "final_compassionate" },
      { textJp: "戦わなくていい。話そう。", text: "We don't have to fight. Let's talk.", flag: "final_talk" },
    ],
  },
  // Act 3: Shadow encounter in Neon Tokyo
  22: {
    after: 4,
    options: [
      { textJp: "封じる。全ての時代のために。", text: "I'll seal it. For every era.", flag: "curse_seal" },
      { textJp: "...分からない。まだ。", text: "...I don't know. Not yet.", flag: "curse_uncertain" },
    ],
  },
  // Act 5: Final Shadow confrontation
  37: {
    after: 5,
    options: [
      { textJp: "一緒に帰ろう。", text: "Let's go home together.", flag: "shadow_final_help" },
      { textJp: "止めるしかない。", text: "I have to stop you.", flag: "shadow_final_fight" },
    ],
  },
};

// ═══════════════════════════════════════════════════════
// STORY TRIGGERS — which rooms get pre-room story screens
// Only substantial multi-character dialogue gets a story screen.
// Single thoughts/reactions → in-game encounters (no interruption).
// ═══════════════════════════════════════════════════════
export const STORY_TRIGGERS = {
  // ── Prologue: Dojo (0-4) ──
  0: 0, 1: 1, 2: 2, 3: 3, 4: 4,
  // ── Act 1: Forest (5-19, existing rooms) ──
  5: 5,     // THE TURN — forced to flee
  8: 8,     // Solo — the mark burns
  10: 10,   // MAJOR — Shadow's entrance
  11: 11,   // Shadow warns about time rifts
  13: 13,   // Shadow — the mark calls pursuers
  14: 14,   // Shadow's gate test
  15: 15,   // Elder reveals the Ink Curse
  16: 16,   // Elder reveals Shadow's identity
  17: 17,   // Shadow confronts about removing curse
  18: 18,   // Elder — sealing technique
  19: 19,   // Original final battle (now mid-game)
  // ── Act 2: Edo Castle Town (20-26) ──
  20: 12,   // MAJOR — arrival in Edo, meet Kunoichi (uses dialogue key 12)
  21: 13,   // Kunoichi exposition
  23: 15,   // Castle infiltration briefing
  25: 17,   // MAJOR — Lord Katsura reveals the path
  26: 18,   // Kunoichi warns, rift opens
  // ── Act 3: Neon Tokyo (27-33) ──
  27: 19,   // MAJOR — Neon Tokyo arrival, meet Hacker (reuses key 19 for neon intro)
  29: 21,   // Hacker explains cyber ninjas
  30: 22,   // Shadow reappears
  33: 25,   // Hacker — next rift coordinates
  // ── Act 4: Underground (34-39) ──
  34: 26,   // Stealth briefing
  36: 28,   // Nightclub infiltration
  37: 29,   // DJ Mech boss
  39: 31,   // Shadow — final rift opening
  // ── Act 5: Spirit Realm (40-46) ──
  40: 32,   // MAJOR — Elder, final preparations
  42: 34,   // Time merging — mixed enemies
  43: 35,   // MAJOR — Fox Spirit reveals the truth
  45: 37,   // MAJOR — Shadow confrontation
  46: 38,   // Final battle
  // ── Epilogue (47-49) ──
  47: 39,   // Fox Spirit — resolution
  48: 40,   // Dojo return — sensei reunion
  49: 41,   // New beginning
};

// ═══════════════════════════════════════════════════════
// SCENE VISUAL CONFIG — environment per location
// ═══════════════════════════════════════════════════════
export function getSceneConfig(roomIndex) {
  // ── Prologue: Dojo (0-4) ──
  if (roomIndex <= 4) return {
    bgKey: 'bg_dojo_story', gradientColors: ['#1a1510', '#14100c', '#0e0a06'],
    label: '道場', labelEn: 'THE DOJO', particleType: 'dust', groundLevel: 0.68,
    characters: { left: 'player', right: 'sensei' },
    entrance: { left: 'walk_in', right: 'already_there' },
  };
  // ── The Turn (5) ──
  if (roomIndex === 5) return {
    bgKey: 'bg_dojo_night_story', gradientColors: ['#1a0808', '#140606', '#0a0404'],
    label: '転機', labelEn: 'THE TURNING POINT', particleType: 'embers', groundLevel: 0.68,
    characters: { left: 'player', right: 'sensei' },
    entrance: { left: 'already_there', right: 'already_there' },
  };
  // ── Forest solo scenes (6-9) ──
  if (roomIndex <= 9) return {
    bgKey: 'bg_forest_story', gradientColors: ['#081a12', '#061210', '#040a08'],
    label: '森', labelEn: 'THE FOREST', particleType: 'leaves', groundLevel: 0.68,
    characters: { left: 'player', right: null },
    entrance: { left: 'walk_in' },
  };
  // ── Shadow's entrance (10) ──
  if (roomIndex === 10) return {
    bgKey: 'bg_forest_story', gradientColors: ['#1a0a1a', '#140818', '#0a0410'],
    label: '出会い', labelEn: 'THE ENCOUNTER', particleType: 'embers', groundLevel: 0.68,
    characters: { left: 'player', right: 'shadow' },
    entrance: { left: 'already_there', right: 'fade_in' },
  };
  // ── Forest + Shadow (11) ──
  if (roomIndex === 11) return {
    bgKey: 'bg_forest_story', gradientColors: ['#1a0a1a', '#140818', '#0a0410'],
    label: '闇路', labelEn: 'THE DARK PATH', particleType: 'embers', groundLevel: 0.68,
    characters: { left: 'player', right: 'shadow' },
    entrance: { left: 'walk_in', right: 'already_there' },
  };
  // ── Act 2: Edo Castle Town (12-18) ──
  if (roomIndex >= 12 && roomIndex <= 14) return {
    bgKey: 'bg_edo_story', gradientColors: ['#1a1508', '#14100c', '#0e0a06'],
    label: '江戸', labelEn: 'EDO CASTLE TOWN', particleType: 'petals', groundLevel: 0.68,
    characters: { left: 'player', right: 'kunoichi' },
    entrance: { left: 'walk_in', right: roomIndex === 12 ? 'fade_in' : 'already_there' },
  };
  if (roomIndex >= 15 && roomIndex <= 16) return {
    bgKey: 'bg_edo_story', gradientColors: ['#1a1508', '#14100c', '#0e0a06'],
    label: '城', labelEn: 'THE CASTLE', particleType: 'dust', groundLevel: 0.68,
    characters: { left: 'player', right: 'kunoichi' },
    entrance: { left: 'walk_in', right: 'already_there' },
  };
  if (roomIndex >= 17 && roomIndex <= 18) return {
    bgKey: 'bg_edo_story', gradientColors: ['#1a1208', '#14100a', '#0e0a06'],
    label: '桂の間', labelEn: "KATSURA'S CHAMBER", particleType: 'embers', groundLevel: 0.68,
    characters: { left: 'player', right: roomIndex === 17 ? 'katsura' : 'kunoichi' },
    entrance: { left: 'walk_in', right: 'already_there' },
  };
  // ── Act 3: Neon Tokyo (19-25) ──
  if (roomIndex >= 19 && roomIndex <= 21) return {
    bgKey: 'bg_neon_story', gradientColors: ['#020210', '#040428', '#080840'],
    label: 'ネオン東京', labelEn: 'NEON TOKYO', particleType: 'embers', groundLevel: 0.68,
    characters: { left: 'player', right: roomIndex === 22 ? 'shadow' : 'hacker' },
    entrance: { left: 'walk_in', right: roomIndex === 19 ? 'fade_in' : 'already_there' },
  };
  if (roomIndex >= 22 && roomIndex <= 25) return {
    bgKey: 'bg_neon_story', gradientColors: ['#0a0420', '#140830', '#200c40'],
    label: '暗路', labelEn: 'DARK STREETS', particleType: 'embers', groundLevel: 0.68,
    characters: { left: 'player', right: roomIndex === 22 ? 'shadow' : 'hacker' },
    entrance: { left: 'walk_in', right: roomIndex === 22 ? 'fade_in' : 'already_there' },
  };
  // ── Act 4: Underground / Nightclub (26-31) ──
  if (roomIndex >= 26 && roomIndex <= 31) return {
    bgKey: 'bg_nightclub_story', gradientColors: ['#020008', '#040018', '#080028'],
    label: '地下', labelEn: 'THE UNDERGROUND', particleType: 'embers', groundLevel: 0.68,
    characters: { left: 'player', right: roomIndex === 31 ? 'shadow' : (roomIndex >= 28 ? 'hacker' : null) },
    entrance: { left: 'walk_in', right: roomIndex === 31 ? 'fade_in' : 'already_there' },
  };
  // ── Act 5: Spirit Realm (32-38) ──
  if (roomIndex >= 32 && roomIndex <= 34) return {
    bgKey: 'bg_spirit_story', gradientColors: ['#0a0812', '#140e20', '#1e1430'],
    label: '山寺', labelEn: 'MOUNTAIN TEMPLE', particleType: 'petals', groundLevel: 0.66,
    characters: { left: 'player', right: roomIndex === 32 ? 'elder' : null },
    entrance: { left: 'walk_in', right: 'already_there' },
  };
  if (roomIndex === 35) return {
    bgKey: 'bg_spirit_story', gradientColors: ['#0e0818', '#180e28', '#221438'],
    label: '精霊の世界', labelEn: 'SPIRIT REALM', particleType: 'petals', groundLevel: 0.66,
    characters: { left: 'player', right: 'fox' },
    entrance: { left: 'walk_in', right: 'fade_in' },
  };
  if (roomIndex >= 36 && roomIndex <= 38) return {
    bgKey: 'bg_spirit_story', gradientColors: ['#0e0818', '#180e28', '#221438'],
    label: '最終決戦', labelEn: 'FINAL BATTLE', particleType: 'embers', groundLevel: 0.66,
    characters: { left: 'player', right: 'shadow' },
    entrance: { left: 'walk_in', right: 'already_there' },
  };
  // ── Epilogue (39-41) ──
  if (roomIndex === 39) return {
    bgKey: 'bg_spirit_story', gradientColors: ['#140e20', '#1e1430', '#281a40'],
    label: '帰還', labelEn: 'THE RETURN', particleType: 'petals', groundLevel: 0.66,
    characters: { left: 'player', right: 'fox' },
    entrance: { left: 'already_there', right: 'fade_in' },
  };
  if (roomIndex >= 40) return {
    bgKey: 'bg_dojo_story', gradientColors: ['#1a1510', '#14100c', '#0e0a06'],
    label: '新しい夜明け', labelEn: 'A NEW DAWN', particleType: 'petals', groundLevel: 0.68,
    characters: { left: 'player', right: 'sensei' },
    entrance: { left: 'walk_in', right: 'already_there' },
  };
  // Fallback
  return {
    bgKey: 'bg_forest_story', gradientColors: ['#081a12', '#061210', '#040a08'],
    label: '', labelEn: '', particleType: 'dust', groundLevel: 0.68,
    characters: { left: 'player', right: null },
    entrance: { left: 'walk_in' },
  };
}

// Default choices state
export function getDefaultChoices() {
  return {
    // Prologue
    training_push: false, training_rest: false,
    departure_demand: false, departure_trust: false,
    // Act 1: Forest
    curse_accept_1: false, curse_resist_1: false,
    shadow_prove: false, shadow_empathy: false,
    shadow_help: false, shadow_duty: false,
    // Act 2: Edo (original Act 2 choices kept for backward compat)
    final_aggressive: false, final_compassionate: false, final_talk: false,
    // Act 3: Neon Tokyo
    curse_seal: false, curse_uncertain: false,
    // Act 5: Spirit Realm — final Shadow choice
    shadow_final_help: false, shadow_final_fight: false,
  };
}

// ═══ EPILOGUE DIALOGUE BUILDER ═══
// Called after final boss to compute ending-specific dialogue
export function getEpilogueDialogue(choices) {
  const compassionate = choices.shadow_final_help || choices.final_compassionate || choices.shadow_help;
  if (compassionate) {
    return [
      { speaker: "system", textJp: "影が崩れ落ちる。呪いの印が消えていく。", text: "Shadow collapses. The curse marks fade away." },
      { speaker: "shadow", textJp: "なぜ...なぜ助けた...", text: "Why... why did you save me..." },
      { speaker: "player", textJp: "先生が俺たち二人を愛していたから。", text: "Because Sensei loved us both." },
      { speaker: "system", textJp: "封印の儀式が始まる。墨が雨のように溶けていく。", text: "The sealing ritual begins. Ink dissolves like rain." },
      { speaker: "shadow", textJp: "...ありがとう。", text: "...Thank you." },
      { speaker: "system", textJp: "数週間後 — 山の道場、再建", text: "Weeks later — the mountain dojo, rebuilt" },
      { speaker: "sensei", textJp: "帰ってきたか。", text: "You came back.", emotion: "amused" },
      { speaker: "player", textJp: "約束しただろ。", text: "I promised I would." },
      { speaker: "sensei", textJp: "...二人とも、おかえり。", text: "...Both of you. Welcome home.", emotion: "amused" },
      { speaker: "player", textJp: "茶でも飲むか。", text: "How about some tea?" },
    ];
  }
  return [
    { speaker: "system", textJp: "影が倒れる。呪いが砕け散る。", text: "Shadow falls. The curse shatters." },
    { speaker: "player", textJp: "終わった。", text: "It's over." },
    { speaker: "system", textJp: "呪いは消えた。だが影は立ち上がらない。", text: "The curse is gone. But Shadow doesn't rise." },
    { speaker: "shadow", textJp: "あの老人に...分かったと...伝えてくれ。", text: "Tell the old man... I understand now..." },
    { speaker: "system", textJp: "数ヶ月後 — 山の道場", text: "Months later — the mountain dojo" },
    { speaker: "sensei", textJp: "俺にできなかったことを...お前がやった。", text: "You did... what I couldn't.", emotion: "serious" },
    { speaker: "player", textJp: "...刀掛けに、余分な刀が。", text: "...There's an extra sword on the rack." },
    { speaker: "sensei", textJp: "あいつが...お前に持っていてほしかったはずだ。", text: "He would have... wanted you to have it.", emotion: "serious" },
  ];
}
