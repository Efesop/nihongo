// ═══ STORY DATA — "The Last Stroke" ═══
// Full Katana Zero-style dialogue for every room + character definitions + choices

export const CHARACTERS = {
  sensei:  { name: "先生", nameEn: "Sensei", color: "#cc9933" },
  player:  { name: "主人公", nameEn: "TinySenpai", color: "#cc4444" },
  shadow:  { name: "影", nameEn: "Shadow", color: "#aa44cc" },
  elder:   { name: "長老", nameEn: "Elder", color: "#44aa66" },
  system:  { name: "", nameEn: "", color: "#888899" },
};

// Story dialogue keyed by room number — plays BEFORE entering that room
export const ROOM_DIALOGUE = {
  // ═══ ACT 1: FOREST — Rooms 0-14 ═══

  // Rooms 0-4: Flashback — Sensei's final training
  0: [
    { speaker: "system", textJp: "記憶の中で...", text: "In the memory..." },
    { speaker: "sensei", textJp: "構えを見せろ。", text: "Show me your stance.", emotion: "serious" },
    { speaker: "player", textJp: "はい、先生。", text: "Yes, Sensei." },
    { speaker: "sensei", textJp: "刀は体の延長だ。力ではなく、流れを感じろ。", text: "The blade is an extension of your body. Feel the flow, not the force." },
    { speaker: "sensei", textJp: "行け。", text: "Go." },
  ],
  1: [
    { speaker: "sensei", textJp: "跳べ。高く。恐れるな。", text: "Jump. Higher. Don't be afraid." },
    { speaker: "player", textJp: "落ちたら...？", text: "What if I fall...?" },
    { speaker: "sensei", textJp: "何度でも立ち上がれ。", text: "Get up. Every time." },
  ],
  2: [
    { speaker: "sensei", textJp: "速さは力だ。一瞬で抜けろ。", text: "Speed is power. Phase through in an instant." },
    { speaker: "player", textJp: "先生、これは...速すぎて見えない。", text: "Sensei, this is... too fast to see." },
    { speaker: "sensei", textJp: "見るな。感じろ。", text: "Don't look. Feel." },
  ],
  3: [
    { speaker: "sensei", textJp: "壁を恐れるな。壁は味方だ。", text: "Don't fear walls. Walls are allies." },
  ],
  4: [
    { speaker: "sensei", textJp: "集中しろ。時が遅くなる。", text: "Focus. Time will slow." },
    { speaker: "player", textJp: "先生、この力は何ですか？", text: "Sensei, what is this power?" },
    { speaker: "sensei", textJp: "...いつか分かる。今はただ使え。", text: "...You'll understand someday. For now, just use it." },
  ],

  // Rooms 5-9: Forest pursuit — TinySenpai alone
  5: [
    { speaker: "system", textJp: "現在 — 森の中", text: "Present day — in the forest" },
    { speaker: "player", textJp: "先生...約束は守る。", text: "Sensei... I'll keep my promise." },
    { speaker: "player", textJp: "山城の巻物を見つける。何があっても。", text: "I'll find the scroll at the mountain castle. No matter what." },
  ],
  6: [
    { speaker: "player", textJp: "高い場所に敵がいる。慎重に行こう。", text: "Enemies on the high ground. I'll be careful." },
  ],
  7: [
    { speaker: "player", textJp: "この壁...登れるはず。先生が教えてくれた通りに。", text: "This wall... I should be able to climb it. Just like Sensei taught me." },
  ],
  8: [
    { speaker: "player", textJp: "屋根を走れ。止まるな。", text: "Run across the rooftops. Don't stop." },
    { speaker: "player", textJp: "速さだけが武器だ。", text: "Speed is my only weapon." },
  ],
  9: [
    { speaker: "player", textJp: "塔の上に何かがある...先生のメモだ！", text: "There's something at the top of the tower... Sensei's notes!" },
  ],

  // Room 10: Shadow appears
  10: [
    { speaker: "shadow", textJp: "見事な刀さばきだ。", text: "Impressive swordwork.", emotion: "amused" },
    { speaker: "player", textJp: "誰だ！", text: "Who's there?!" },
    { speaker: "shadow", textJp: "お前の腕の印...見覚えがある。", text: "That mark on your arm... I recognize it." },
    { speaker: "shadow", textJp: "あの老人がまた弟子を取ったか。", text: "So the old man took another student." },
    { speaker: "player", textJp: "先生を知っているのか？", text: "You know Sensei?" },
    { speaker: "shadow", textJp: "...生き延びろ。また会おう。", text: "...Survive. We'll meet again." },
  ],

  // Rooms 11-13: Shadow grows bolder
  11: [
    { speaker: "player", textJp: "あの声...影のような存在。先生の何を知っている？", text: "That voice... a shadow-like presence. What does he know about Sensei?" },
  ],
  12: [
    { speaker: "player", textJp: "要塞か。正面から行くしかない。", text: "A fortress. I have no choice but to go through the front." },
  ],
  13: [
    { speaker: "shadow", textJp: "まだ諦めないのか。", text: "Still not giving up?", emotion: "impressed" },
    { speaker: "player", textJp: "先生との約束だ。", text: "It's my promise to Sensei." },
    { speaker: "shadow", textJp: "約束...か。面白い。", text: "A promise... Interesting." },
  ],

  // Room 14: Boss room
  14: [
    { speaker: "shadow", textJp: "ここからは本当の試練だ。", text: "From here, the real trial begins." },
    { speaker: "player", textJp: "退かない。", text: "I won't back down." },
    { speaker: "shadow", textJp: "お前は先生じゃない。", text: "You're not your Sensei." },
    { speaker: "player", textJp: "...知ってる。", text: "...I know." },
  ],

  // ═══ ACT 2: TEMPLE GARDENS — Rooms 15-19 ═══
  15: [
    { speaker: "system", textJp: "第二幕 — 寺院庭園", text: "Act 2 — Temple Gardens" },
    { speaker: "elder", textJp: "若い剣士よ。ここは聖なる場所だった。", text: "Young swordsman. This was once sacred ground." },
    { speaker: "player", textJp: "長老...ここに来た理由を知っていますか？", text: "Elder... do you know why I'm here?" },
    { speaker: "elder", textJp: "巻物を探しているのだろう。先生の最後の弟子。", text: "You seek the scroll. Sensei's last student." },
    { speaker: "elder", textJp: "先に進むがいい。だが気をつけろ。", text: "Go ahead. But be careful." },
  ],
  16: [
    { speaker: "elder", textJp: "この庭は先生が若い頃に作った。", text: "Sensei built this garden when he was young." },
    { speaker: "player", textJp: "先生が...？", text: "Sensei did...?" },
    { speaker: "elder", textJp: "強い剣士は、花も育てる。覚えておけ。", text: "A strong swordsman also grows flowers. Remember that." },
  ],
  17: [
    { speaker: "shadow", textJp: "印が広がっている。感じるだろう？", text: "The mark is spreading. You can feel it, can't you?" },
    { speaker: "player", textJp: "...関係ない。止まらない。", text: "...It doesn't matter. I won't stop." },
    { speaker: "shadow", textJp: "その力を使うたびに、印は深くなる。", text: "Every time you use that power, the mark deepens." },
  ],
  18: [
    { speaker: "elder", textJp: "先生はかつて二人の弟子を持っていた。", text: "Sensei once had two students." },
    { speaker: "player", textJp: "二人...？もう一人は誰ですか？", text: "Two...? Who was the other?" },
    { speaker: "elder", textJp: "...先に進めば分かる。", text: "...You'll understand if you go further." },
  ],
  19: [
    { speaker: "shadow", textJp: "ここが終わりだ。お前にとっても、私にとっても。", text: "This is the end. For you, and for me." },
    { speaker: "player", textJp: "お前は何者だ。", text: "Who are you." },
    { speaker: "shadow", textJp: "...先生の最初の弟子だ。", text: "...Sensei's first student." },
    { speaker: "player", textJp: "！！！", text: "!!!" },
    { speaker: "shadow", textJp: "同じ印を持つ者同士...決着をつけよう。", text: "Two who bear the same mark... let's settle this." },
  ],
};

// In-game encounters — speech bubbles during gameplay
// Includes converted single-line dialogues from rooms 6, 7, 9, 11, 12
export const ROOM_ENCOUNTERS = {
  5: [
    { triggerX: 800, speaker: "player", textJp: "先生のメモ...「前に進め」", text: "Sensei's note... 'Keep moving forward'", duration: 2000 },
  ],
  6: [
    { triggerX: 180, speaker: "player", textJp: "高い場所に敵がいる。慎重に行こう。", text: "Enemies on the high ground. I'll be careful.", duration: 2500 },
  ],
  7: [
    { triggerX: 180, speaker: "player", textJp: "この壁...登れるはず。先生が教えてくれた通りに。", text: "This wall... I should be able to climb it. Just like Sensei taught me.", duration: 2500 },
  ],
  9: [
    { triggerX: 500, speaker: "player", textJp: "塔の上に何かがある...先生のメモだ！", text: "There's something at the top of the tower... Sensei's notes!", duration: 2500 },
  ],
  10: [
    { triggerX: 400, speaker: "shadow", textJp: "見ているぞ。", text: "I'm watching.", duration: 1500 },
  ],
  11: [
    { triggerX: 180, speaker: "player", textJp: "あの声...影のような存在。先生の何を知っている？", text: "That voice... a shadow-like presence. What does he know about Sensei?", duration: 3000 },
  ],
  12: [
    { triggerX: 180, speaker: "player", textJp: "要塞か。正面から行くしかない。", text: "A fortress. I have no choice but to go through the front.", duration: 2500 },
  ],
  14: [
    { triggerX: 600, speaker: "shadow", textJp: "力を見せろ。", text: "Show me your strength.", duration: 1500 },
  ],
  19: [
    { triggerX: 800, speaker: "shadow", textJp: "もっと速く。", text: "Faster.", duration: 1500 },
  ],
};

// Choice definitions — keyed by room number
export const ROOM_CHOICES = {
  // Room 5: First curse choice
  5: {
    after: 2, // appears after dialogue line index 2
    speaker: "shadow",
    textJp: "印の力を感じるだろう。受け入れるか？",
    text: "You feel the mark's power. Will you accept it?",
    options: [
      { textJp: "力をくれ。", text: "Give me the power.", flag: "curse_accept_1", effect: { slowMoBonus: 30 } },
      { textJp: "呪いはいらない。", text: "I don't need your curse.", flag: "curse_resist_1", effect: null },
    ],
  },
};

// Story triggers — which room number triggers story before entering
// Key = room number, value = room number to look up in ROOM_DIALOGUE
// Story triggers — only rooms with substantial dialogue get full story screens
// Single-line player monologues (6, 7, 9, 11, 12) are moved to in-game encounters
export const STORY_TRIGGERS = {
  0: 0,    // Sensei's training (5 lines)
  1: 1,    // Jump training (3 lines)
  2: 2,    // Dash training (3 lines)
  3: 3,    // Wall training (1 line, but part of tutorial sequence)
  4: 4,    // Focus training (3 lines)
  5: 5,    // Forest pursuit begins (3 lines)
  // 6: moved to encounter
  // 7: moved to encounter
  8: 8,    // Rooftop parkour (2 lines)
  // 9: moved to encounter
  10: 10,  // Shadow appears (6 lines — major story beat)
  // 11: moved to encounter
  // 12: moved to encounter
  13: 13,  // Gauntlet (3 lines)
  14: 14,  // Boss room (4 lines)
  15: 15,  // Act 2 — Temple (5 lines)
  16: 16,  // Garden (3 lines)
  17: 17,  // Bell tower — curse (3 lines)
  18: 18,  // Inner sanctum — reveal (3 lines)
  19: 19,  // Final boss (5 lines)
};

// Scene visual config — backgrounds, tints, labels per act/location
export function getSceneConfig(roomIndex) {
  if (roomIndex <= 4) return {
    bg: 'linear-gradient(180deg, #2a1f10 0%, #1a1208 40%, #0e0a04 100%)',
    label: '回想', labelEn: 'FLASHBACK',
    filter: 'sepia(0.35) brightness(0.85)',
    particles: 'dust', // warm floating dust motes
  };
  if (roomIndex <= 9) return {
    bg: 'linear-gradient(180deg, #081a12 0%, #061210 40%, #040a08 100%)',
    label: '森', labelEn: 'FOREST',
    filter: null,
    particles: 'leaves',
  };
  if (roomIndex <= 14) return {
    bg: 'linear-gradient(180deg, #1a0a1a 0%, #140818 40%, #0a0410 100%)',
    label: '闇', labelEn: 'CONFRONTATION',
    filter: null,
    particles: 'embers',
  };
  return {
    bg: 'linear-gradient(180deg, #1a1508 0%, #161008 40%, #0c0a06 100%)',
    label: '寺院', labelEn: 'TEMPLE GARDENS',
    filter: null,
    particles: 'petals',
  };
}

// Default choices state
export function getDefaultChoices() {
  return {
    curse_accept_1: false,
    curse_accept_2: false,
    curse_accept_3: false,
    spare_warlord: false,
    spare_tengu: false,
    helped_villager: false,
    helped_elder: false,
  };
}
