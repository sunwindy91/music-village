/* ============================================================
 * 大山里的音乐课 · 全局配置
 * 2026-08-12 · 推倒重来精工版
 * ============================================================ */
window.MV = window.MV || {};

/* 全局触控/点击事件工具：pointerdown 优先（触屏响应快），
   不支持 PointerEvent 的环境自动降级为 click，保证任何浏览器都能点 */
MV.Tap = {
  on(el, fn) {
    if (!el) return;
    if (window.PointerEvent) el.addEventListener('pointerdown', fn);
    else el.addEventListener('click', fn);
  }
};

/* 全局兼容层：若浏览器不支持 PointerEvent，
   把所有 addEventListener('pointerdown', ...) 自动变为 click。
   必须在其他脚本之前加载（config.js 最先） */
if (!window.PointerEvent) {
  const _origAdd = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (type, fn, opts) {
    if (type === 'pointerdown') type = 'click';
    return _origAdd.call(this, type, fn, opts);
  };
}

MV.config = {
  name: '大山里的音乐课',
  version: '2.0.0',
  debug: false,

  /* —— 积分（P1 闭环） —— */
  pointsPerCorrect: 10,   // 每答对一题
  pointsPerClear: 50,     // 每通关一关
  pointsPerCompose: 30,   // 完成一次作曲并变谱

  /* —— 听辨关卡 —— */
  correctToPass: 3,       // 连对/累计对几题过关（谁更高·听音找家·认识音符）
  listenRange: { low: 60, high: 67 }, // C4-G4（MIDI）
  highlowSpans: [7, 5, 3],           // 难度递进：两音跨度（半音）
  drumWindowMs: 400,       // 强拍判定容差（儿童反应节奏，放宽到 ±400ms）
  drumHitRate: 0.6,        // 命中率达标线

  /* —— 网格作曲 —— */
  gridRows: 5,             // C D E F G（行 = 音高）
  gridCols: 8,             // 8 拍
  gridBpm: 90,

  /* —— 晓声 —— */
  typeSpeed: 40,           // 打字机每字毫秒
  bubbleChars: 46,         // 气泡内每行约多少字（换行参考）

  /* —— 通关主题曲（等你来谱：旋律 + 歌词） ——
     全部关卡点亮后自动响起。气质参考：country road / Let It Go / 鹿 befree 的悠扬开阔。
     把 notes 换成你谱的旋律（{midi, start, dur}，start 是拍号），lyrics 填歌词即生效。 */
  themeSong: {
    name: '山谷的歌',
    bpm: 92,
    inst: 'bell',
    notes: [
      { midi: 60, start: 0,   dur: 1 }, { midi: 64, start: 1,   dur: 1 }, { midi: 67, start: 2,   dur: 1.5 }, { midi: 64, start: 3.5, dur: .5 },
      { midi: 62, start: 4,   dur: 1 }, { midi: 60, start: 5,   dur: 1 }, { midi: 62, start: 6,   dur: 2 },
      { midi: 60, start: 8,   dur: 1 }, { midi: 64, start: 9,   dur: 1 }, { midi: 69, start: 10,  dur: 1.5 }, { midi: 67, start: 11.5, dur: .5 },
      { midi: 64, start: 12,  dur: 1 }, { midi: 62, start: 13,  dur: 1 }, { midi: 60, start: 14,  dur: 2 }
    ],
    lyrics: [] // ← 歌词交给你写（留空则不显示歌词区）
  },

  /* —— 本地存储 —— */
  storageKey: 'mv-progress-v2',

  /* —— 音色 —— */
  instruments: [
    { id: 'bird',  label: '小鸟',  desc: '轻快啾啾' },
    { id: 'bell',  label: '风铃',  desc: '叮咚亮晶晶' },
    { id: 'water', label: '溪水',  desc: '咕噜咕噜流' },
    { id: 'piano', label: '木琴',  desc: '圆润咚咚' }
  ]
};
