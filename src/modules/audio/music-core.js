/* ============================================================
 * MusicCore · 音频引擎（Tone.js）
 * 温柔音色（三角波 + 缓起缓落 + 山谷轻混响）· 旋律/节奏/音效
 * 接口（与接口契约一致）：
 *   start() / playMidi() / playSequence() / playPair()
 *   playRhythm() / sfx() / stopAll()
 * ============================================================ */
window.MV = window.MV || {};

MV.MusicCore = (() => {
  const C = () => MV.config;

  let ready = false;
  let audioError = null;
  let limiter = null;
  let reverb = null;
  let mainSynth = null;
  let drum = null;
  let tick = null;
  let instruments = {};
  let scheduled = [];

  function init() {
    if (ready) return;
    if (typeof Tone === 'undefined') { audioError = 'Tone 引擎未加载'; return; }
    const guard = (label, fn) => {
      try { return fn(); }
      catch (e) { console.warn('[MusicCore] ' + label + ' 创建失败：' + (e && e.message)); return null; }
    };
    limiter = guard('limiter', () => new Tone.Limiter(-2).toDestination());
    reverb = guard('reverb', () => new Tone.Freeverb({ roomSize: .55, dampening: 2800, wet: .2 }));
    if (reverb) { try { reverb.connect(limiter); } catch (e) { /* noop */ } }
    const chain = reverb || limiter;   // 混响失败也能响（直连限幅器）

    // 听辨主音色：三角波，柔和（核心音色，优先保证）
    mainSynth = guard('mainSynth', () => new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: .012, decay: .3, sustain: .18, release: .6 }
    }));
    if (mainSynth) { try { mainSynth.connect(chain); } catch (e) { /* noop */ } }

    // 创作四音色（逐个独立，失败不影响其他）
    instruments.bird = guard('bird', () => new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: .005, decay: .16, sustain: .04, release: .28 }
    }));
    instruments.bell = guard('bell', () => new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: .002, decay: .55, sustain: 0, release: .6 }
    }));
    instruments.water = guard('water', () => new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: .002, decay: .12, sustain: 0, release: .2 }   // 水滴感：快速衰减，保证发声（原 PluckSynth 在 PolySynth 下不可靠）
    }));
    instruments.piano = guard('piano', () => new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: .008, decay: .5, sustain: .22, release: .9 }
    }));
    for (const k in instruments) {
      if (!instruments[k]) continue;
      try { instruments[k].connect(chain); } catch (e) { /* noop */ }
      try { instruments[k].volume.value = -4; } catch (e) { /* noop */ }
    }

    // 大鼓（小鼓手关卡）
    drum = guard('drum', () => new Tone.MembraneSynth({
      pitchDecay: .04, octaves: 3,
      envelope: { attack: .001, decay: .3, sustain: .01, release: .45 }
    }));
    if (drum) {
      try { drum.volume.value = -8; drum.connect(chain); } catch (e) { /* noop */ }
    }

    // 木鱼「嗒」（准备/节拍器）
    tick = guard('tick', () => new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: .002, decay: .09, sustain: 0, release: .12 }
    }));
    if (tick) {
      try { tick.volume.value = -18; tick.connect(chain); } catch (e) { /* noop */ }
    }

    ready = true;
    if (audioError) console.warn('[MusicCore] ' + audioError);
  }

  /* —— 首次用户手势解锁音频（幂等，可重复调用） —— */
  function start() {
    if (typeof Tone === 'undefined') return Promise.resolve();
    try { init(); } catch (e) { console.warn('[MusicCore] init', e); }
    try { return Tone.start(); } catch (e) { console.warn('[MusicCore] start', e); return Promise.resolve(); }
  }

  /* —— 确保音频上下文在运行（每次发声前调用，幂等） —— */
  function ensureRunning() {
    if (!ready || typeof Tone === 'undefined') return;
    try { Tone.start(); } catch (e) { /* 忽略 */ }
  }

  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  /* —— 调度工具（基于全局 Transport，可整体取消） —— */
  function scheduleAt(sec, fn) {
    if (typeof Tone === 'undefined') return;
    const id = Tone.getTransport().scheduleOnce(fn, sec);
    scheduled.push(id);
    return id;
  }
  function clearScheduled() {
    if (typeof Tone === 'undefined') return;
    scheduled.forEach(id => Tone.getTransport().clear(id));
    scheduled = [];
  }
  function stopTransport() {
    if (typeof Tone === 'undefined') return;
    try { Tone.getTransport().stop(); } catch (e) { /* noop */ }
    clearScheduled();
  }
  function resetTransport() {
    // cancel() 清空全部事件并把 Transport position 归零，避免上一轮（如 countIn）残留导致鼓点/拍点时间错位
    try { Tone.getTransport().cancel(); } catch (e) { try { Tone.getTransport().stop(); } catch (e2) { /* noop */ } }
    clearScheduled();
  }

  /* —— 单音 —— */
  function playMidi(midi, opts = {}) {
    if (!ready || midi == null) return;
    ensureRunning();
    const dur = opts.dur != null ? opts.dur : 0.4;
    const inst = opts.inst || 'main';
    if (inst === 'main') mainSynth.triggerAttackRelease(mtof(midi), dur);
    else if (instruments[inst]) {
      if (inst === 'water') instruments[inst].triggerAttack(mtof(midi)); // PluckSynth 无 triggerAttackRelease，只能用 triggerAttack
      else instruments[inst].triggerAttackRelease(mtof(midi), dur);
    }
  }

  /* —— 按拍序列（作曲/示范） notes: [{midi, start, dur}]（单位：拍） —— */
  function playSequence(notes, opts = {}) {
    if (!ready || !notes.length) { if (opts.onEnd) opts.onEnd(); return; }
    ensureRunning();
    const bpm = opts.bpm || C().gridBpm;
    const beat = 60 / bpm;
    const inst = opts.inst || 'piano';
    resetTransport();
    notes.forEach(n => {
      scheduleAt(Math.max(n.start, 0) * beat, () => {
        playMidi(n.midi, { dur: Math.max(n.dur * beat * .92, .12), inst });
        if (opts.onNote) opts.onNote(n);
      });
    });
    let total = 0;
    notes.forEach(n => { total = Math.max(total, n.start + n.dur); });
    scheduleAt((total + 0.25) * beat, () => {
      stopTransport();
      if (opts.onEnd) opts.onEnd();
    });
    Tone.getTransport().start();
  }

  /* —— 双音听辨（谁更高 / 听音找家） —— */
  function playPair(a, b, opts = {}) {
    if (!ready) return;
    const gap = opts.gap != null ? opts.gap : 0.95;
    resetTransport();
    playMidi(a, { dur: .55 });
    scheduleAt(gap, () => playMidi(b, { dur: .6 }));
    scheduleAt(gap + 1.0, () => {
      stopTransport();
      if (opts.onDone) opts.onDone();
    });
    Tone.getTransport().start();
  }

  /* —— 节奏关卡：pattern = 'x' 走 / '-' 停 —— */
  function playRhythm(pattern, opts = {}) {
    if (!ready) return;
    ensureRunning();
    const bpm = opts.bpm || 88;
    const beat = 60 / bpm;
    resetTransport();
    [...pattern].forEach((v, i) => {
      scheduleAt(i * beat, () => {
        // abs 用事件实际触发时刻的音频时间，与 tap(contextNow) 同一时钟基准，鼓点判定才准
        const abs = Tone.getContext().currentTime;
        if (v === 'x') {
          drum.triggerAttackRelease('C2', .26);
          if (opts.onHit) opts.onHit(i, abs);
        } else if (opts.onRest) {
          opts.onRest(i, abs);
        }
        if (opts.onBeat) opts.onBeat(i, v, abs);
      });
    });
    scheduleAt(pattern.length * beat + .1, () => {
      stopTransport();
      if (opts.onDone) opts.onDone();
    });
    Tone.getTransport().start();
  }

  /* —— 准备拍（嗒·嗒·嗒·走） —— */
  function countIn(opts = {}) {
    if (!ready) return;
    ensureRunning();
    const bpm = opts.bpm || 88;
    const beat = 60 / bpm;
    resetTransport();
    for (let i = 0; i < 3; i++) {
      scheduleAt(i * beat, () => tick.triggerAttackRelease('C6', .08));
    }
    scheduleAt(3 * beat, () => {
      stopTransport();
      if (opts.onDone) opts.onDone();
    });
    Tone.getTransport().start();
  }

  /* —— 音效 —— */
  function sfx(name) {
    if (!ready) return;
    ensureRunning();
    const now = () => 0;
    switch (name) {
      case 'correct': {
        // 上行三音：亮晶晶
        const seq = [72, 76, 79];
        seq.forEach((m, i) => scheduleAt(i * .09, () => mainSynth.triggerAttackRelease(mtof(m), .22)));
        scheduleAt(seq.length * .09 + .3, stopTransport);
        Tone.getTransport().start();
        break;
      }
      case 'wrong': {
        // 温柔下行两音（不说教，只“再听一次”）
        scheduleAt(0, () => mainSynth.triggerAttackRelease(mtof(64), .3));
        scheduleAt(.22, () => mainSynth.triggerAttackRelease(mtof(60), .42));
        scheduleAt(.8, stopTransport);
        Tone.getTransport().start();
        break;
      }
      case 'win': {
        const seq = [72, 76, 79, 84];
        seq.forEach((m, i) => scheduleAt(i * .12, () => mainSynth.triggerAttackRelease(mtof(m), .28)));
        scheduleAt(seq.length * .12 + .5, stopTransport);
        Tone.getTransport().start();
        break;
      }
      case 'click':
        tick.triggerAttackRelease('C6', .06);
        break;
      case 'tap': // 鼓点命中的反馈音
        drum.triggerAttackRelease('C2', .2);
        break;
      case 'pop': // 摘果
        instruments.bell.triggerAttackRelease(mtof(80), .3);
        break;
      default: break;
    }
  }

  function stopAll() { stopTransport(); }

  /* 当前音频上下文时间（拍点判题用） */
  function contextNow() {
    return (typeof Tone !== 'undefined') ? Tone.getContext().currentTime : performance.now() / 1000;
  }

  return {
    init, start, ensureRunning, playMidi, playSequence, playPair, playRhythm, countIn, sfx, stopAll,
    contextNow,
    isReady: () => ready,
    lastError: () => audioError
  };
})();
