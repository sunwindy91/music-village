/* ============================================================
 * 内容层：地图地点 + 关卡模板
 * 叔叔课程体系落地：
 *   L0 声音山谷（谁更高/小鼓手/听音找家）——先听先动
 *   L1 音阶山谷（认识音符·听音摘果）——叔叔大纲第 1 阶
 *   L2 旋律草原（网格作曲 + 五线谱出口 + 音乐人格）——创造表达
 * ============================================================ */
window.MV = window.MV || {};

MV.locations = [
  {
    id: 'valley',
    name: '声音山谷',
    subtitle: '先听一听 · 声音的高低长短',
    memory: '晓声最初的听觉',
    pos: [50, 21],          // 在地图场景中的百分比位置 [x%, y%]
    levels: ['highlow', 'drum', 'same']
  },
  {
    id: 'scale',
    name: '音阶山谷',
    subtitle: '认一认 · 音符的名字',
    memory: '晓声的歌喉',
    pos: [50, 56],
    levels: ['notes']
  },
  {
    id: 'meadow',
    name: '旋律草原',
    subtitle: '做一做 · 种出你自己的歌',
    memory: '晓声的梦',
    pos: [50, 84],
    levels: ['compose']
  }
];

MV.levels = [
  {
    id: 'highlow',
    loc: 'valley',
    title: '谁更高',
    type: 'highlow',
    icon: 'bird',
    brief: '听两个声音，谁高谁低',
    theory: '音高 · 听辨'
  },
  {
    id: 'drum',
    loc: 'valley',
    title: '小鼓手',
    type: 'drum',
    icon: 'drum',
    brief: '跟着走——走——走——停',
    theory: '节奏 · 时值'
  },
  {
    id: 'same',
    loc: 'valley',
    title: '听音找家',
    type: 'same',
    icon: 'nest',
    brief: '两个声音，一样还是不一样',
    theory: '音色 · 同异'
  },
  {
    id: 'notes',
    loc: 'scale',
    title: '认识音符',
    type: 'notes',
    icon: 'fruit',
    brief: '听音摘果，认识 1 2 3 4 5 6 7',
    theory: '唱名 · 音高对应'
  },
  {
    id: 'compose',
    loc: 'meadow',
    title: '旋律田',
    type: 'compose',
    icon: 'seed',
    brief: '把音符种进田里，变成真五线谱',
    theory: '创作 · 记谱'
  }
];

/* 认识音符关卡用的音级（唱名 + 简谱 + 起始 MIDI，C 大调 do 从 C4 开始） */
MV.solfa = [
  { sol: 'do',   num: 1, midi: 60 },
  { sol: 're',   num: 2, midi: 62 },
  { sol: 'mi',   num: 3, midi: 64 },
  { sol: 'fa',   num: 4, midi: 65 },
  { sol: 'sol',  num: 5, midi: 67 },
  { sol: 'la',   num: 6, midi: 69 },
  { sol: 'si',   num: 7, midi: 71 }
];

/* 网格作曲的行音高（低→高，C4..G4） */
MV.gridPitches = [60, 62, 64, 65, 67];
