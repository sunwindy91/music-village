/**
 * ============================================================
 *  MusicCore · 音频核心（module-audio 领地 · 邹翔）
 * ============================================================
 *  接口契约 v1.0 实现：
 *   - playNote(midi, duration?)      播放单音
 *   - playMelody([{midi,dur}])       播放旋律
 *   - playChord(rootMidi, type)      和弦
 *   - stopAll()                      停止所有声音
 *   - sfx.correct/wrong/win/stone/click  游戏音效
 *   - getScore() / resetScore()      积分
 * ============================================================
 */
(function () {
  'use strict';

  let ctx = null;
  let master = null;
  const active = new Set();
  let score = 0;

  // 懒初始化 AudioContext（浏览器要求用户手势后）
  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // midi → 频率
  function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  // 温柔音色：三角波 + 快速起音 + 缓落音尾（不刺耳）
  function tone(freq, start, dur, vol) {
    const c = ensureCtx();
    if (!c) return;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;

    const t0 = c.currentTime + start;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(g); g.connect(master);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
    active.add(osc);
    osc.onended = function () { active.delete(osc); };
  }

  const MusicCore = {
    playNote: function (midi, duration) {
      duration = duration || 0.6;
      tone(midiToFreq(midi), 0, duration, 0.5);
    },

    playMelody: function (melody) {
      let t = 0;
      melody.forEach(function (n) {
        tone(midiToFreq(n.midi), t, n.dur || 0.5, 0.5);
        t += (n.dur || 0.5) * 0.95;
      });
    },

    playChord: function (rootMidi, type) {
      const offsets = { major: [0, 4, 7], minor: [0, 3, 7], dim: [0, 3, 6] }[type] || [0, 4, 7];
      offsets.forEach(function (o) { tone(midiToFreq(rootMidi + o), 0, 1.2, 0.3); });
    },

    stopAll: function () {
      active.forEach(function (o) { try { o.stop(); } catch (e) {} });
      active.clear();
    },

    getScore: function () { return score; },
    resetScore: function () { score = 0; },
    addScore: function (n) { score += n; },

    startLevel: function (levelId, opts) {
      opts = opts || {};
      if (window.VoiceCore && window.VoiceCore.onLevelEvent) {
        window.VoiceCore.onLevelEvent({ type: 'level_start', payload: { levelId: levelId } });
      }
      return { levelId: levelId, ok: true };
    },

    playGuidance: function (script) {
      script = script || [];
      script.forEach(function (s, i) {
        if (s.type === 'note') {
          setTimeout(function () { MusicCore.playNote(s.value); }, i * 500);
        }
      });
    },

    // 供关卡渲染器使用的音频辅助
    _tone: tone,
    _ensureCtx: ensureCtx,

    // —— 游戏音效（孩子化·温柔）——
    sfx: {
      click: function () { tone(660, 0, 0.08, 0.25); },
      correct: function () {
        tone(midiToFreq(64), 0, 0.18, 0.4);
        tone(midiToFreq(67), 0.12, 0.18, 0.4);
        tone(midiToFreq(72), 0.24, 0.3, 0.42);
      },
      wrong: function () {
        tone(midiToFreq(55), 0, 0.2, 0.3);
        tone(midiToFreq(52), 0.16, 0.26, 0.3);
      },
      win: function () {
        const seq = [[60, 0], [60, 0], [67, 0], [67, 0], [69, 0], [69, 0], [67, 0.55],
                     [65, 0], [65, 0], [64, 0], [64, 0], [62, 0], [62, 0], [60, 0.6]];
        let t = 0;
        seq.forEach(function (n) {
          tone(midiToFreq(n[0]), t, 0.3, 0.42);
          t += n[1] + 0.18;
        });
      },
      stone: function () {
        tone(midiToFreq(60), 0, 0.9, 0.3);
        tone(midiToFreq(64), 0.1, 0.9, 0.3);
        tone(midiToFreq(67), 0.2, 1.0, 0.32);
        tone(midiToFreq(72), 0.3, 1.2, 0.28);
      },
      drum: function () {          // 鼓点（低频）
        tone(160, 0, 0.1, 0.5);
        tone(95, 0.02, 0.14, 0.42);
      },
    },
  };

  window.MusicCore = MusicCore;
})();
