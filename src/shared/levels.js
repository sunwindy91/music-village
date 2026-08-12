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
    levels: ['highlow', 'drum', 'same', 'quiz0']
  },
  {
    id: 'scale',
    name: '音阶山谷',
    subtitle: '认一认 · 音符的名字',
    memory: '晓声的歌喉',
    pos: [50, 56],
    levels: ['notes', 'walkstop', 'fillgap', 'sightread', 'rhythmchain', 'interval', 'quiz1']
  },
  {
    id: 'meadow',
    name: '旋律草原',
    subtitle: '做一做 · 种出你自己的歌',
    memory: '晓声的梦',
    pos: [50, 84],
    levels: ['compose', 'timbre', 'quiz2']
  },
  {
    id: 'rhythm',
    name: '节奏小路',
    subtitle: '动一动 · 身体打节奏',
    memory: '晓声的脚步声',
    pos: [18, 40],
    levels: ['echo', 'sixteenth', 'quizr']
  },
  {
    id: 'chord',
    name: '和弦花园',
    subtitle: '听一听 · 声音的手拉手',
    memory: '晓声的梦之桥',
    pos: [82, 62],
    levels: ['rainbow', 'chordbud', 'quizc']
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
    lesson: '第 1 课',
    theory: '音高 · 听辨'
  },
  {
    id: 'drum',
    loc: 'valley',
    title: '小鼓手',
    type: 'drum',
    icon: 'drum',
    brief: '跟着走——走——走——停',
    lesson: '第 2 课',
    theory: '节奏 · 时值'
  },
  {
    id: 'same',
    loc: 'valley',
    title: '听音找家',
    type: 'same',
    icon: 'nest',
    brief: '两个声音，一样还是不一样',
    lesson: '第 3 课',
    theory: '音色 · 同异'
  },
  {
    id: 'notes',
    loc: 'scale',
    title: '认识音符',
    type: 'notes',
    icon: 'fruit',
    brief: '听音摘果，认识 1 2 3 4 5 6 7',
    lesson: '乐理课 第 1 课',
    theory: '唱名 · 音高对应'
  },
  {
    id: 'walkstop',
    loc: 'scale',
    title: '走走停停',
    type: 'walkstop',
    icon: 'foot',
    brief: '听声音长短，走了几步？',
    lesson: '乐理课 第 2 课',
    theory: '时值 · 音符长短'
  },
  {
    id: 'fillgap',
    loc: 'scale',
    title: '旋律填空',
    type: 'fillgap',
    icon: 'puzzle',
    brief: '听旋律，补上缺的音',
    lesson: '乐理课 第 3 课',
    theory: '旋律 · 音高序列'
  },
  {
    id: 'sightread',
    loc: 'scale',
    title: '看谱弹奏',
    type: 'sightread',
    icon: 'staff',
    brief: '看五线谱上的音符，把它弹出来',
    lesson: '乐理课 第 4 课',
    theory: '视谱 · 弹奏'
  },
  {
    id: 'rhythmchain',
    loc: 'scale',
    title: '节奏接龙',
    type: 'rhythmchain',
    icon: 'run',
    brief: '听一听，是走还是跑？',
    lesson: '乐理课 第 5 课',
    theory: '八分音符 · 快慢'
  },
  {
    id: 'interval',
    loc: 'scale',
    title: '音程梯子',
    type: 'interval',
    icon: 'stairs',
    brief: '听两个音，数数隔了几级台阶',
    lesson: '乐理课 第 6 课',
    theory: '音程 · 距离'
  },
  {
    id: 'echo',
    loc: 'rhythm',
    title: '回声谷',
    type: 'echo',
    icon: 'echo',
    brief: '听节奏，拍出来',
    lesson: '节奏课 第 1 课',
    theory: '节奏 · 回声'
  },
  {
    id: 'sixteenth',
    loc: 'rhythm',
    title: '十六分赛跑',
    type: 'sixteenth',
    icon: 'run2',
    brief: '走、跑、快快跑，选对节奏',
    lesson: '节奏课 第 2 课',
    theory: '十六分 · 更快'
  },
  {
    id: 'quizr',
    loc: 'rhythm',
    title: '乐理小测',
    type: 'quiz',
    icon: 'pencil',
    brief: '3 题验收 · 节奏',
    lesson: '复习课',
    theory: '评估 · 节奏',
    quiz: 'rhythm'
  },
  {
    id: 'rainbow',
    loc: 'chord',
    title: '彩虹和声',
    type: 'rainbow',
    icon: 'rainbow',
    brief: '听一听，是一个音还是手拉手？',
    lesson: '和声课 第 1 课',
    theory: '和弦 · 叠音'
  },
  {
    id: 'chordbud',
    loc: 'chord',
    title: '和声找朋友',
    type: 'chordbud',
    icon: 'friends',
    brief: '三个音手拉手，找到它们',
    lesson: '和声课 第 2 课',
    theory: '三和弦 · 音群'
  },
  {
    id: 'quizc',
    loc: 'chord',
    title: '乐理小测',
    type: 'quiz',
    icon: 'pencil',
    brief: '3 题验收 · 和声',
    lesson: '复习课',
    theory: '评估 · 和声',
    quiz: 'chord'
  },
  {
    id: 'compose',
    loc: 'meadow',
    title: '旋律田',
    type: 'compose',
    icon: 'seed',
    brief: '把音符种进田里，变成真五线谱',
    lesson: '创作课 第 1 课',
    theory: '创作 · 记谱'
  },
  {
    id: 'quiz0',
    loc: 'valley',
    title: '乐理小测',
    type: 'quiz',
    icon: 'pencil',
    brief: '3 题验收 · 检验你的耳朵',
    lesson: '复习课',
    theory: '评估 · 听辨',
    quiz: 'valley'
  },
  {
    id: 'quiz1',
    loc: 'scale',
    title: '乐理小测',
    type: 'quiz',
    icon: 'pencil',
    brief: '3 题验收 · 唱名与时值',
    lesson: '复习课',
    theory: '评估 · 乐理',
    quiz: 'scale'
  },
  {
    id: 'quiz2',
    loc: 'meadow',
    title: '乐理小测',
    type: 'quiz',
    icon: 'pencil',
    brief: '3 题验收 · 创作与记谱',
    lesson: '复习课',
    theory: '评估 · 创造',
    quiz: 'meadow'
  },
  {
    id: 'timbre',
    loc: 'meadow',
    title: '音色捉迷藏',
    type: 'timbre',
    icon: 'ear',
    brief: '听一听，是哪个乐器的声音？',
    lesson: '创作课 第 2 课',
    theory: '音色 · 乐器性格'
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

/* ============================================================
 * 聚类课程：理论导入（每个大聚类首进的「晓声小课堂」）
 * ============================================================ */
MV.theories = {
  valley: {
    title: '声音的小秘密',
    body: '声音有高有低——高的像小鸟飞上天，低的像溪水流下坡；还有长有短——短的叫「走」，长的叫「走——」。听的时候，耳朵就是最好的老师。',
    img: 'assets/theory_pitch.webp'
  },
  scale: {
    title: '音阶楼梯',
    body: '音乐家把七个声音排成楼梯，就是音阶：do re mi fa sol la si。音符还会走路：走一步是四分，走两步是二分，走四步是全音符。',
    img: 'assets/theory_scale.webp'
  },
  meadow: {
    title: '写你自己的歌',
    body: '把喜欢的音符排排队，就变成旋律——你的歌！写下来就是五线谱，谁都看得懂。歌有性格：跳来跳去是小鸟，缓缓流动是小溪，往高处飞是星星。',
    img: 'assets/theory_create.webp'
  },
  rhythm: {
    title: '节奏小路',
    body: '节奏就是声音走路的样子：走（四分）是一拍一步，跑（八分）快一倍，快快跑（十六分）再快一倍！身体跟得上节拍，就是最好的节拍器。',
    img: 'assets/theory_rhythm.webp'
  },
  chord: {
    title: '和弦花园',
    body: '几个音手拉手一起唱，就是和弦——像彩虹把颜色叠在一起！do mi sol 手拉手是明亮的彩虹，la do mi 手拉手是温柔的月光。'
  }
};

/* ============================================================
 * 聚类课程：乐理小测（形成性评估 · 乐理小达人式选择题）
 * ============================================================ */
MV.quizzes = {
  valley: {
    name: '声音山谷 · 乐理小测',
    questions: [
      { q: '高的音，像什么？', options: ['小鸟飞得高', '溪水流得低', '都一样'], ans: 0 },
      { q: '鼓点「走——走——走——停」，停的时候要？', options: ['拍手', '休息不动', '唱歌'], ans: 1 },
      { q: '声音的高和低，音乐里叫？', options: ['音高', '音色', '拍子'], ans: 0 }
    ]
  },
  scale: {
    name: '音阶山谷 · 乐理小测',
    questions: [
      { q: 'do re mi 之后，下一个是？', options: ['fa', 'sol', 'la'], ans: 0 },
      { q: '「走——」比「走」长？', options: ['一样长', '长一倍', '长三倍'], ans: 1 },
      { q: '1 2 3 4 5 6 7，最后一个数字是？', options: ['6', '7', '8'], ans: 1 }
    ]
  },
  meadow: {
    name: '旋律草原 · 乐理小测',
    questions: [
      { q: '五线谱上越往上，音越？', options: ['高', '低', '一样'], ans: 0 },
      { q: '把歌存成图片，是为了？', options: ['带回家给爸爸妈妈看', '删掉', '藏起来'], ans: 0 },
      { q: '蹦蹦跳跳的旋律，是哪种音乐人格？', options: ['小鸟型', '小溪型', '星星型'], ans: 0 }
    ]
  },
  rhythm: {
    name: '节奏小路 · 乐理小测',
    questions: [
      { q: '「走」和「跑」，谁更慢？', options: ['走', '跑', '一样快'], ans: 0 },
      { q: '十六分音符比八分音符？', options: ['更快', '更慢', '一样'], ans: 0 },
      { q: '跟着节拍动身体，音乐里叫？', options: ['节奏感', '音高', '音色'], ans: 0 }
    ]
  },
  chord: {
    name: '和弦花园 · 乐理小测',
    questions: [
      { q: '几个音手拉手一起唱，叫？', options: ['和弦', '音高', '节奏'], ans: 0 },
      { q: 'do mi sol 手拉手，像？', options: ['明亮的彩虹', '乌云', '石头'], ans: 0 },
      { q: '和弦最少是几个音手拉手？', options: ['三个', '一个', '十个'], ans: 0 }
    ]
  }
};
