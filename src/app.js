/* ============================================================
 * 应用核心：状态机 / 路由 / 进度 / 积分 / 关卡分派
 * 视图流：Splash → 山谷地图 → 地点总览 → 关卡舞台 → 庆祝 → 地图
 * ============================================================ */
(function () {
  'use strict';

  const C = MV.config;
  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => [...(root || document).querySelectorAll(sel)];
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  /* ---------------- 应用状态 ---------------- */
  const App = {
    state: {
      view: 'splash',
      points: 0,
      completed: {},      // { levelId: true }
      works: [],          // 作品 [{name, notes, bpm, inst, personality, ts}]
      currentLevel: null,
      currentLoc: null
    }
  };
  MV.App = App;

  /* ---------------- 进度存取 ---------------- */
  function loadProgress() {
    try {
      const raw = localStorage.getItem(C.storageKey);
      if (raw) {
        const d = JSON.parse(raw);
        App.state.points = d.points || 0;
        App.state.completed = d.completed || {};
        App.state.works = d.works || [];
        return true;
      }
    } catch (e) { /* 忽略损坏数据 */ }
    return false;
  }
  function saveProgress() {
    try {
      localStorage.setItem(C.storageKey, JSON.stringify({
        points: App.state.points,
        completed: App.state.completed,
        works: App.state.works
      }));
    } catch (e) { /* 隐私模式等 */ }
  }

  /* ---------------- 积分 ---------------- */
  function refreshPoints() {
    ['map-points', 'stage-points', 'concert-points'].forEach(id => {
      const el = $('#' + id);
      if (el) el.textContent = App.state.points;
    });
  }
  function toastPoints(n) {
    const el = $('#points-toast');
    if (!el) return;
    el.textContent = '积分 +' + n;
    el.classList.remove('show');
    void el.offsetWidth; // 重启动画
    el.classList.add('show');
  }
  function addPoints(n) {
    App.state.points += n;
    refreshPoints();
    saveProgress();
    toastPoints(n);
  }

  /* ---------------- 视图路由 ---------------- */
  function showView(name) {
    $$('.view').forEach(v => v.classList.remove('active'));
    const el = $('#view-' + name);
    if (el) el.classList.add('active');
    App.state.view = name;
    window.scrollTo(0, 0);
  }

  /* ---------------- 晓声挂载 ---------------- */
  function mountXs(id, opts = {}) {
    const el = $('#' + id);
    if (!el) return;
    MV.VoiceCore.mount(el, opts);
    if (opts.breathe) el.classList.add('xs-breathe');
    if (opts.float) el.classList.add('xs-float');
    return el;
  }
  const xsStage = () => $('#stage-xs');
  function xsSay(text, opts) {
    if (!xsStage()) return;
    MV.VoiceCore.say(text, opts);
  }

  /* ---------------- Splash ---------------- */
  let splashBooted = false;
  function bootSplash() {
    if (splashBooted) return;
    splashBooted = true;
    const had = loadProgress();
    refreshPoints();
    mountXs('splash-xs', { exp: had ? 'happy' : 'calm', breathe: true });

    const go = () => {
      if (App.state.view !== 'splash') return; // 防重复触发
      try { MV.MusicCore.start(); } catch (e) { /* 音频初始化失败也不能卡住进入地图 */ }
      MV.VoiceCore.stopTyping();
      showView('map');
      bootMap();
      try { MV.MusicCore.playMidi(60, { dur: .3 }); } catch (e) { /* 欢迎音失败不阻塞 */ }
    };

    if (had) {
      // 老朋友：简短招呼后进入
      MV.VoiceCore.say('欢迎回来，音乐寻宝家。', { done: () => setTimeout(go, 700) });
      setTimeout(go, 2200);
    } else {
      // 新朋友：开场白 + 手动/自动进入
      let i = 0;
      const lines = MV.lines.splash;
      const next = () => {
        if (i < lines.length && App.state.view === 'splash') {
          MV.VoiceCore.say(lines[i], { done: () => setTimeout(() => { i++; next(); }, 420) });
        } else if (i >= lines.length) {
          setTimeout(go, 700);
        }
      };
      setTimeout(next, 600);
      setTimeout(go, 9000); // 兜底自动进入
    }

    $('.splash-go').addEventListener('pointerdown', go);
    const skipEl = $('.splash-skip');
    skipEl.addEventListener('pointerdown', go);
    skipEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });
  }

  /* ---------------- 山谷地图 ---------------- */
  function stageNum() {
    return Math.min(5, Object.keys(App.state.completed).length);
  }
  /* 地图晓声脚下：当前成长形态小标签 */
  function updateXsForm() {
    MV.VoiceCore.applyGrowth(stageNum());
    const holder = $('#map-xs');
    if (!holder) return;
    const f = MV.VoiceCore.currentForm();
    let tag = holder.querySelector('.xs-form-tag');
    if (!tag) {
      tag = document.createElement('div');
      tag.className = 'xs-form-tag';
      holder.appendChild(tag);
    }
    tag.textContent = f.name + ' · 点亮 ' + stageNum() + '/5';
    tag.dataset.stage = String(stageNum());
  }
  function bootMap() {
    mountXs('map-xs', { exp: 'calm', float: true, breathe: true });
    updateXsForm();
    MV.VoiceCore.fireflies($('#map-fireflies'), 14);
    renderLocs();

    if (!sessionStorage.getItem('mv-greeted')) {
      sessionStorage.setItem('mv-greeted', '1');
      MV.VoiceCore.say(Object.keys(App.state.completed).length ? MV.lines.mapWelcomeBack : pick(MV.lines.mapHello));
    }
    refreshPoints();
  }

  function renderLocs() {
    updateXsForm(); // 每次回到地图都刷新晓声形态
    const wrap = $('#map-locs');
    wrap.innerHTML = '';
    MV.locations.forEach(loc => {
      const allDone = loc.levels.every(id => App.state.completed[id]);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'loc-node' + (allDone ? ' completed' : '');
      btn.style.left = loc.pos[0] + '%';
      btn.style.top = loc.pos[1] + '%';
      btn.setAttribute('aria-label', loc.name + (allDone ? '（已完成）' : ''));
      btn.innerHTML =
        '<span class="loc-dot" aria-hidden="true">' + (allDone ? '✓' : '♪') + '</span>' +
        '<span class="loc-label">' + loc.name + '</span>' +
        '<span class="loc-sub">' + loc.subtitle + '</span>';
      btn.addEventListener('pointerdown', () => openLocation(loc.id));
      wrap.appendChild(btn);
    });

    // 底部：我的音乐会入口
    const footer = $('#map-footer');
    footer.innerHTML = '';
    const concertBtn = document.createElement('button');
    concertBtn.type = 'button';
    concertBtn.className = 'btn btn-gold map-concert-btn';
    concertBtn.textContent = App.state.works.length ? '我的音乐会（' + App.state.works.length + ' 首）' : '我的音乐会';
    concertBtn.addEventListener('pointerdown', () => openConcert());
    footer.appendChild(concertBtn);
  }

  /* ---------------- 地点总览（关卡 chips） ---------------- */
  function openLocation(locId) {
    const loc = MV.locations.find(l => l.id === locId);
    if (!loc) return;
    App.state.currentLoc = loc;
    $('#loc-overlay') && $('#loc-overlay').remove();

    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.id = 'loc-overlay';
    overlay.innerHTML =
      '<div class="loc-panel">' +
        '<div class="loc-panel-head">' +
          '<div><h2 class="loc-panel-title">' + loc.name + '</h2>' +
          '<p class="loc-panel-sub">' + loc.memory + '</p></div>' +
          '<button class="icon-btn loc-panel-close" type="button" aria-label="关闭">✕</button>' +
        '</div>' +
        '<div class="loc-levels"></div>' +
      '</div>';
    $('#view-map').appendChild(overlay);
    $('.loc-panel-close', overlay).addEventListener('pointerdown', () => overlay.remove());

    const list = $('.loc-levels', overlay);
    loc.levels.forEach(id => {
      const lv = MV.levels.find(x => x.id === id);
      if (!lv) return;
      const done = !!App.state.completed[id];
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'loc-level' + (done ? ' done' : '');
      chip.innerHTML =
        '<span class="loc-level-ico" aria-hidden="true">' + (done ? '✓' : '♪') + '</span>' +
        '<span class="loc-level-txt"><b>' + lv.title + '</b><small>' + lv.brief + '</small></span>' +
        '<span class="loc-level-theory">' + lv.theory + '</span>' +
        '<span class="loc-level-go" aria-hidden="true">→</span>';
      chip.addEventListener('pointerdown', () => openLevel(id));
      list.appendChild(chip);
    });

    // 面板自带记忆文案，避免地图气泡被遮罩遮挡
  }

  /* ---------------- 关卡舞台 ---------------- */
  /* 关卡会话令牌：在任何离开/切换关卡的时刻使令牌失效，
     防止上一关遗留的播放/台词链继续占用晓声气泡打断新关卡 */
  function invalidateSession() {
    MV._session = (MV._session || 0) + 1;
  }

  function openLevel(id) {
    const lv = MV.levels.find(x => x.id === id);
    if (!lv) return;
    invalidateSession();
    App.state.currentLevel = lv;
    const ov = $('#loc-overlay'); if (ov) ov.remove();
    $('#stage-title').textContent = lv.title;
    mountXs('stage-xs', { exp: 'calm', breathe: true });
    MV.VoiceCore.applyGrowth(stageNum());
    showView('stage');
    refreshPoints();
    MV.VoiceCore.say(MV.lines.levelIntro[lv.type] || '准备好了吗？', { done: () => startLevel(lv) });
  }

  /* 关卡执行器注册表（各模块按块注册） */
  const runners = {};
  MV.runners = runners;

  function startLevel(lv) {
    const body = $('#stage-body');
    body.innerHTML = '';
    invalidateSession();   // 关卡会话令牌：离开即失效
    if (MV._drumCleanup) { MV._drumCleanup(); MV._drumCleanup = null; }
    MV.VoiceCore.hideBubble();
    if (runners[lv.type]) runners[lv.type](lv, body);
    else {
      body.innerHTML = '<p class="stage-intro">这个关卡还在路上，先去别的山谷玩吧！</p>';
    }
  }

  /* ============ P0-2 音之梯 · 真实听辨 ============ */

  function stepDots(count, done) {
    const box = document.createElement('div');
    box.className = 'stage-progress';
    for (let i = 0; i < count; i++) {
      const d = document.createElement('span');
      d.className = 'step-dot' + (i < done ? ' done' : i === done ? ' current' : '');
      d.textContent = i + 1;
      box.appendChild(d);
    }
    return box;
  }

  const BIRD_SVG =
    '<svg class="nv-bird" viewBox="0 0 44 44" aria-hidden="true">' +
      '<circle class="bird-body" cx="22" cy="27" r="14"/>' +
      '<path class="bird-beak" d="M30 25 L41 21 L30 29 Z"/>' +
      '<circle class="bird-eye" cx="26" cy="23" r="2.6"/>' +
    '</svg>';

  const randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));

  /* —— 关卡 1：谁更高（真实音高 · tonal 判题） —— */
  runners.highlow = function (lv, body) {
    const low = 60, high = 67;                 // C4–G4
    const spans = C.highlowSpans.slice();      // 跨度递进 7→5→3
    let round = 0, correct = 0, a = 0, b = 0, wrong = 0;
    let answered = false, playing = false;
    let buttons, birdEls, labels;
    const sess = MV._session;
    const alive = () => sess === MV._session;

    body.innerHTML =
      '<div class="stage-panel stage-scene">' +
        '<div class="stage-intro" id="hl-intro">第 1 题 · 竖起耳朵听</div>' +
        '<div id="hl-progress"></div>' +
        '<div class="note-visual" id="hl-visual">' +
          '<div class="nv-item"><span id="hl-bird0">' + BIRD_SVG + '</span><span class="nv-label" id="hl-lab0">第一个音</span></div>' +
          '<div class="nv-item"><span id="hl-bird1">' + BIRD_SVG + '</span><span class="nv-label" id="hl-lab1">第二个音</span></div>' +
        '</div>' +
        '<div class="listen-row">' +
          '<button class="answer-btn up" type="button" data-ans="up">第二个更高<span class="answer-sub">声音往上飞</span></button>' +
          '<button class="answer-btn down" type="button" data-ans="down">第二个更低<span class="answer-sub">声音往下落</span></button>' +
        '</div>' +
        '<div class="compose-actions" style="justify-content:center">' +
          '<button class="btn btn-ghost" id="hl-replay" type="button">再听一次</button>' +
        '</div>' +
      '</div>';

    const intro = $('#hl-intro');
    const progBox = $('#hl-progress');
    buttons = $$('[data-ans]', body);
    birdEls = [$('#hl-bird0'), $('#hl-bird1')];
    labels = [$('#hl-lab0'), $('#hl-lab1')];

    function renderProgress() { progBox.replaceChildren(stepDots(3, correct)); }

    function setBird(i, midi, playState) {
      birdEls[i].querySelector('.nv-bird').style.transform = 'translateY(' + (-(midi - 60) * 5) + 'px)';
      labels[i].classList.toggle('playing', !!playState);
    }

    function pickPair(span) {
      let x, y;
      if (Math.random() < 0.5) {
        x = randInt(low, high - span);
        y = x + span;
      } else {
        x = randInt(low + span, high);
        y = x - span;
      }
      return [x, y];
    }

    function playRound(generate) {
      if (!alive()) return;
      answered = false;
      playing = true;
      buttons.forEach(bt => bt.disabled = true);
      if (generate) {
        const p = pickPair(spans[Math.min(round, spans.length - 1)]);
        a = p[0]; b = p[1];
      }
      intro.textContent = '第 ' + (round + 1) + ' 题 · 竖起耳朵听';
      setBird(0, a, false);
      setBird(1, b, false);
      MV.VoiceCore.say('先听第一个音', { done: () => {
        if (!alive()) return;
        setBird(0, a, true);
        MV.MusicCore.playMidi(a, { dur: .55 });
        setTimeout(() => {
          if (!alive()) return;
          MV.VoiceCore.say('再听第二个音', { done: () => {
            if (!alive()) return;
            labels[0].classList.remove('playing');
            setBird(1, b, true);
            MV.MusicCore.playMidi(b, { dur: .6 });
            setTimeout(() => {
              if (!alive()) return;
              labels[1].classList.remove('playing');
              playing = false;
              buttons.forEach(bt => bt.disabled = false);
            }, 650);
          }});
        }, 300);
      }});
    }

    function answer(dir) {
      if (answered || playing) return;
      answered = true;
      const isUp = b > a;
      const ok = dir === (isUp ? 'up' : 'down');
      if (ok) {
        MV.MusicCore.sfx('correct');
        correct++;
        wrong = 0;
        renderProgress();
        MV.VoiceCore.say(pick(MV.lines.highlow.correct), { done: () => {
          if (!alive()) return;
          if (correct >= C.correctToPass) {
            MV.VoiceCore.say(MV.lines.highlow.done, { done: () => { if (!alive()) return; setTimeout(() => celebrate(lv), 400); } });
          } else {
            round++;
            setTimeout(() => { if (alive()) playRound(true); }, 500);
          }
        }});
      } else {
        MV.MusicCore.sfx('wrong');
        wrong++;
        if (wrong >= 2) { // 卡关陪伴：连续错 2 次，降难度 + 换话术重播（不判死）
          wrong = 0;
          MV.VoiceCore.say(pick(MV.lines.stumble.highlow), { done: () => { if (!alive()) return; setTimeout(() => { if (alive()) playRound(false); }, 450); } });
        } else {
          MV.VoiceCore.say(pick(MV.lines.highlow.wrong), { done: () => { if (!alive()) return; setTimeout(() => { if (alive()) playRound(false); }, 400); } });
        }
      }
    }

    buttons.forEach(bt => bt.addEventListener('pointerdown', () => answer(bt.dataset.ans)));
    $('#hl-replay').addEventListener('pointerdown', () => { if (!playing) playRound(false); });
    renderProgress();
    setTimeout(() => { if (alive()) playRound(true); }, 600);
  };

  /* —— 关卡 2：小鼓手（节奏判拍 · 拍点窗口 ≤250ms） —— */
  runners.drum = function (lv, body) {
    const bpm = 88;
    const pattern = 'xxx-'.repeat(4);            // 走 走 走 停 × 4 轮
    const soundBeats = [...pattern].filter(v => v === 'x').length; // 12
    const win = C.drumWindowMs / 1000;
    let active = false, hitIdx = new Set(), hitCount = 0, centers = [], slotCursor = 0;
    let slots = [];
    let abandoned = false;
    const sess = MV._session;
    const alive = () => sess === MV._session && !abandoned;

    body.innerHTML =
      '<div class="stage-panel">' +
        '<div class="stage-intro">小鼓手 · 跟着“走 走 走 停”</div>' +
        '<div class="drum-pad" id="drum-pad" role="button" tabindex="0" aria-label="大鼓，拍这里">' +
          '<span class="drum-label" id="drum-label">走</span>' +
        '</div>' +
        '<div class="drum-beats" id="drum-beats"></div>' +
        '<div class="compose-actions" style="justify-content:center">' +
          '<button class="btn btn-gold" id="drum-start" type="button">开始</button>' +
          '<button class="btn btn-ghost" id="drum-replay" type="button" disabled>再拍一次</button>' +
        '</div>' +
        '<p class="staff-note">金色鼓点落下的那一刻拍下去，四轮拍中六成就过关。</p>' +
      '</div>';

    const pad = $('#drum-pad');
    const label = $('#drum-label');
    const beatsBox = $('#drum-beats');
    [...pattern].forEach(v => {
      if (v === 'x') {
        const s = document.createElement('span');
        s.className = 'beat-slot';
        beatsBox.appendChild(s);
      }
    });
    slots = [...beatsBox.children];

    function reset() {
      active = false; hitIdx.clear(); hitCount = 0; centers = []; slotCursor = 0;
      slots.forEach(s => s.classList.remove('hit'));
      label.textContent = '走';
    }

    function tap(t) {
      if (!active) return;
      pad.classList.add('beat');
      setTimeout(() => pad.classList.remove('beat'), 170);
      let best = -1, bestD = win;
      centers.forEach((c, i) => {
        if (hitIdx.has(i)) return;
        const d = Math.abs(t - c);
        if (d < bestD) { bestD = d; best = i; }
      });
      if (best >= 0) {
        hitIdx.add(best);
        hitCount++;
        const s = slots[slotCursor++];
        if (s) s.classList.add('hit');
        MV.MusicCore.sfx('tap');
      }
    }

    function drumKey(e) {
      if (e.code === 'Space') {
        e.preventDefault();
        tap(MV.MusicCore.contextNow());
      }
    }

    function finish() {
      active = false;
      if (MV._drumKey) document.removeEventListener('keydown', MV._drumKey);
      MV._drumKey = null;
      MV._drumCleanup = null;
      if (!alive()) return;
      const rate = hitCount / soundBeats;
      if (rate >= C.drumHitRate) {
        MV.VoiceCore.say(MV.lines.drum.pass, { done: () => { if (!alive()) return; setTimeout(() => celebrate(lv), 350); } });
      } else {
        MV.MusicCore.sfx('wrong');
        MV.VoiceCore.say(MV.lines.drum.fail, { done: () => { if (alive()) $('#drum-replay').disabled = false; } });
      }
    }

    function run() {
      reset();
      MV.MusicCore.start();
      $('#drum-start').disabled = true;
      $('#drum-replay').disabled = true;
      document.addEventListener('keydown', drumKey);
      MV._drumKey = drumKey;
      MV._drumCleanup = () => { abandoned = true; document.removeEventListener('keydown', drumKey); };
      MV.VoiceCore.say('先听四拍“嗒 嗒 嗒”——走！', { done: () => {
        if (!alive()) return;
        MV.MusicCore.countIn({ bpm, onDone: () => {
          if (!alive()) return;
          active = true;
          MV.VoiceCore.say('走！走！走！停！跟着拍！');
          MV.MusicCore.playRhythm(pattern, {
            bpm,
            onBeat: (i, v, abs) => {
              if (!alive()) return;
              if (v === 'x') {
                label.textContent = '走';
                centers.push(abs);
                pad.classList.add('beat');
                setTimeout(() => pad.classList.remove('beat'), 230);
              } else {
                label.textContent = '停';
              }
            },
            onDone: finish
          });
        }});
      }});
    }

    pad.addEventListener('pointerdown', () => tap(MV.MusicCore.contextNow()));
    pad.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(MV.MusicCore.contextNow()); }
    });
    $('#drum-start').addEventListener('pointerdown', run);
    $('#drum-replay').addEventListener('pointerdown', run);
  };

  /* —— 关卡 3：听音找家（同音/不同音） —— */
  runners.same = function (lv, body) {
    const low = 60, high = 67;
    let round = 0, correct = 0, a = 0, b = 0, wrong = 0;
    let answered = false, playing = false;
    let buttons, birdEls, labels;
    const sess = MV._session;
    const alive = () => sess === MV._session;

    body.innerHTML =
      '<div class="stage-panel stage-scene">' +
        '<div class="stage-intro" id="sm-intro">第 1 题 · 听一听</div>' +
        '<div id="sm-progress"></div>' +
        '<div class="note-visual" id="sm-visual">' +
          '<div class="nv-item"><span id="sm-bird0">' + BIRD_SVG + '</span><span class="nv-label" id="sm-lab0">第一个音</span></div>' +
          '<div class="nv-item"><span id="sm-bird1">' + BIRD_SVG + '</span><span class="nv-label" id="sm-lab1">第二个音</span></div>' +
        '</div>' +
        '<div class="listen-row">' +
          '<button class="answer-btn up" type="button" data-ans="same">一样<span class="answer-sub">回同一个窝</span></button>' +
          '<button class="answer-btn berry" type="button" data-ans="diff">不一样<span class="answer-sub">两个不同的家</span></button>' +
        '</div>' +
        '<div class="compose-actions" style="justify-content:center">' +
          '<button class="btn btn-ghost" id="sm-replay" type="button">再听一次</button>' +
        '</div>' +
      '</div>';

    const intro = $('#sm-intro');
    const progBox = $('#sm-progress');
    buttons = $$('[data-ans]', body);
    birdEls = [$('#sm-bird0'), $('#sm-bird1')];
    labels = [$('#sm-lab0'), $('#sm-lab1')];

    function renderProgress() { progBox.replaceChildren(stepDots(3, correct)); }

    function setBird(i, midi, playState) {
      birdEls[i].querySelector('.nv-bird').style.transform = 'translateY(' + (-(midi - 60) * 6) + 'px)';
      labels[i].classList.toggle('playing', !!playState);
    }

    function pick() {
      if (Math.random() < 0.5) {
        const m = randInt(low, high);
        a = b = m;
      } else {
        do { a = randInt(low, high); b = randInt(low, high); } while (a === b);
      }
    }

    function playRound(generate) {
      if (!alive()) return;
      answered = false;
      playing = true;
      buttons.forEach(bt => bt.disabled = true);
      if (generate) pick();
      intro.textContent = '第 ' + (round + 1) + ' 题 · 听一听';
      setBird(0, a, false);
      setBird(1, b, false);
      MV.VoiceCore.say('先听第一个音', { done: () => {
        if (!alive()) return;
        setBird(0, a, true);
        MV.MusicCore.playMidi(a, { dur: .55 });
        setTimeout(() => {
          if (!alive()) return;
          MV.VoiceCore.say('再听第二个音', { done: () => {
            if (!alive()) return;
            labels[0].classList.remove('playing');
            setBird(1, b, true);
            MV.MusicCore.playMidi(b, { dur: .6 });
            setTimeout(() => {
              if (!alive()) return;
              labels[1].classList.remove('playing');
              playing = false;
              buttons.forEach(bt => bt.disabled = false);
            }, 650);
          }});
        }, 300);
      }});
    }

    function answer(dir) {
      if (answered || playing) return;
      answered = true;
      const same = a === b;
      const ok = dir === (same ? 'same' : 'diff');
      if (ok) {
        MV.MusicCore.sfx('correct');
        correct++;
        wrong = 0;
        renderProgress();
        MV.VoiceCore.say(pick(MV.lines.same.correct), { done: () => {
          if (!alive()) return;
          if (correct >= C.correctToPass) {
            MV.VoiceCore.say(MV.lines.same.done, { done: () => { if (!alive()) return; setTimeout(() => celebrate(lv), 400); } });
          } else {
            round++;
            setTimeout(() => { if (alive()) playRound(true); }, 500);
          }
        }});
      } else {
        MV.MusicCore.sfx('wrong');
        wrong++;
        if (wrong >= 2) { // 卡关陪伴：连续错 2 次，换话术重播（不判死）
          wrong = 0;
          MV.VoiceCore.say(pick(MV.lines.stumble.same), { done: () => { if (!alive()) return; setTimeout(() => { if (alive()) playRound(false); }, 450); } });
        } else {
          MV.VoiceCore.say(pick(MV.lines.same.wrong), { done: () => { if (!alive()) return; setTimeout(() => { if (alive()) playRound(false); }, 400); } });
        }
      }
    }

    buttons.forEach(bt => bt.addEventListener('pointerdown', () => answer(bt.dataset.ans)));
    $('#sm-replay').addEventListener('pointerdown', () => { if (!playing) playRound(false); });
    renderProgress();
    setTimeout(() => { if (alive()) playRound(true); }, 600);
  };

  /* —— 关卡 4：认识音符（听音摘果 · 唱名+简谱渐进） —— */
  runners.notes = function (lv, body) {
    const solfa = MV.solfa;
    // 渐进解锁：先 do re mi → 加 fa sol → 全 7 音
    const stages = [[0, 1, 2], [0, 1, 2, 3, 4], [0, 1, 2, 3, 4, 5, 6]];
    let stage = 0, round = 0, correct = 0, wrong = 0;
    let playing = false, target = 0;
    let fruits = [];
    const sess = MV._session;
    const alive = () => sess === MV._session;

    body.innerHTML =
      '<div class="stage-panel stage-scene">' +
        '<div class="stage-intro" id="nt-intro">第 1 题 · 竖起耳朵听</div>' +
        '<div id="nt-progress"></div>' +
        '<p class="staff-note">山上的果子都有自己的声音，听一听它是谁，就点哪一个。</p>' +
        '<div class="note-fireflies" aria-hidden="true">' +
          '<img src="assets/note_eighth.webp" alt="">' +
          '<img src="assets/note_quarter.webp" alt="">' +
          '<img src="assets/note_full.webp" alt="">' +
        '</div>' +
        '<div class="fruit-row" id="nt-fruits"></div>' +
        '<div class="compose-actions" style="justify-content:center">' +
          '<button class="btn btn-ghost" id="nt-replay" type="button">再听一次</button>' +
        '</div>' +
      '</div>';

    const intro = $('#nt-intro');
    const progBox = $('#nt-progress');
    const fruitBox = $('#nt-fruits');

    function renderProgress() { progBox.replaceChildren(stepDots(3, correct)); }

    function renderFruits() {
      fruitBox.innerHTML = '';
      fruits = [];
      stages[stage].forEach(idx => {
        const s = solfa[idx];
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'fruit';
        b.dataset.idx = idx;
        b.innerHTML = '<span class="fruit-dot">' + s.num + '</span><span class="fruit-sol">' + s.sol + '</span>';
        b.addEventListener('pointerdown', () => answer(idx));
        fruitBox.appendChild(b);
        fruits.push(b);
      });
    }

    function playRound(generate) {
      if (!alive()) return;
      playing = true;
      if (generate) {
        const set = stages[stage];
        target = set[randInt(0, set.length - 1)];
      }
      const s = solfa[target];
      intro.textContent = '第 ' + (round + 1) + ' 题 · 这是谁的声音？';
      fruits.forEach(f => f.classList.remove('correct', 'wrong'));
      MV.VoiceCore.say('听——', { done: () => {
        if (!alive()) return;
        MV.MusicCore.playMidi(s.midi, { dur: .6, inst: 'bell' });
        setTimeout(() => { if (alive()) playing = false; }, 750);
      }});
    }

    function answer(idx) {
      if (!alive() || playing) return;
      playing = true;
      const s = solfa[target];
      if (idx === target) {
        MV.MusicCore.sfx('correct');
        fruits[idx].classList.add('correct');
        addPoints(C.pointsPerCorrect);
        correct++;
        wrong = 0;
        renderProgress();
        MV.VoiceCore.say(
          pick(MV.lines.notes.correct).replace('{name}', '第' + s.num + '个果子').replace('{sol}', s.sol),
          { done: () => {
            if (!alive()) return;
            if (correct >= C.correctToPass) {
              MV.VoiceCore.say(MV.lines.notes.done, { done: () => { if (!alive()) return; setTimeout(() => celebrate(lv), 400); } });
            } else {
              round++;
              if (round >= 3 && stage < stages.length - 1) { stage++; renderFruits(); }
              setTimeout(() => { if (alive()) playRound(true); }, 500);
            }
          }});
      } else {
        MV.MusicCore.sfx('wrong');
        fruits[idx].classList.add('wrong');
        wrong++;
        const stumble = wrong >= 2;   // 卡关陪伴：连续错 2 次，先安抚再进学习闭环
        if (stumble) wrong = 0;
        MV.VoiceCore.say((stumble ? pick(MV.lines.stumble.notes) + ' ' : '') + pick(MV.lines.notes.wrong), { done: () => {
          if (!alive()) return;
          // 学习闭环：报出正确答案 + 再播一次该音
          MV.VoiceCore.say('这个果子是 ' + s.sol + '，唱作 ' + s.num + '。再听一次它的声音。', { done: () => {
            if (!alive()) return;
            MV.MusicCore.playMidi(s.midi, { dur: .6, inst: 'bell' });
            setTimeout(() => { if (alive()) playRound(false); }, 550);
          }});
        }});
      }
    }

    $('#nt-replay').addEventListener('pointerdown', () => { if (!playing) playRound(false); });
    renderProgress();
    renderFruits();
    setTimeout(() => { if (alive()) playRound(true); }, 600);
  };

  /* —— 关卡 5：旋律田（网格作曲 · 五线谱出口 · 音乐人格） —— */
  function analyzePersonality(notes) {
    const seq = notes.slice().sort((a, b) => a.start - b.start).map(n => n.midi);
    if (seq.length < 2) return 'star';
    const lo = Math.min.apply(null, seq), hi = Math.max.apply(null, seq);
    const range = hi - lo;
    let up = 0, down = 0, jumps = 0;
    for (let i = 1; i < seq.length; i++) {
      const d = seq[i] - seq[i - 1];
      if (d > 0) up++; else if (d < 0) down++;
      if (Math.abs(d) >= 4) jumps++;
    }
    const n = seq.length - 1;
    if (jumps / n >= 0.45) return 'bird';        // 蹦蹦跳跳
    if (range >= 5 || up > down) return 'star';  // 往高处飞
    return 'stream';                              // 缓缓流动
  }

  runners.compose = function (lv, body) {
    const pitches = MV.gridPitches.slice();       // [60,62,64,65,67] 低→高
    const rows = pitches.length, cols = C.gridCols;
    const solfaOf = {};
    MV.solfa.forEach(s => { solfaOf[s.midi] = s; });
    let inst = 'bird';
    let cells = [];                               // cells[r][c]
    const sess = MV._session;
    const alive = () => sess === MV._session;

    body.innerHTML =
      '<div class="stage-panel">' +
        '<div class="stage-intro">把音符当种子，种进田里，长成你的歌</div>' +
        '<div class="compose-tools">' +
          '<div class="chip-row" id="cz-inst" aria-label="选择音色">' +
            C.instruments.map(ins =>
              '<button type="button" class="chip' + (ins.id === 'bird' ? ' on' : '') + '" data-inst="' + ins.id + '">' +
              ins.label + '</button>').join('') +
          '</div>' +
        '</div>' +
        '<div class="grid" aria-label="旋律田，八拍五音">' +
          '<div class="grid-inner" id="cz-grid"></div>' +
        '</div>' +
        '<div class="compose-actions">' +
          '<button class="btn btn-primary" id="cz-play" type="button">▶ 听一听</button>' +
          '<button class="btn btn-ghost" id="cz-clear" type="button">清空</button>' +
          '<button class="btn btn-gold" id="cz-staff" type="button">变成五线谱</button>' +
        '</div>' +
        '<div id="cz-result"></div>' +
      '</div>';

    const gridBox = $('#cz-grid');

    // 建网格：顶部高音（sol），底部低音（do）
    for (let r = 0; r < rows; r++) {
      const midi = pitches[rows - 1 - r];
      const sf = solfaOf[midi];
      const row = document.createElement('div');
      row.className = 'grid-row';
      row.innerHTML = '<span class="grid-note">' + sf.sol + '<small> ' + sf.num + '</small></span>';
      const rowCells = [];
      for (let c = 0; c < cols; c++) {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'grid-cell';
        cell.dataset.r = r;
        cell.dataset.c = c;
        cell.setAttribute('aria-pressed', 'false');
        cell.setAttribute('aria-label', '第 ' + (c + 1) + ' 拍，' + sf.sol);
        cell.addEventListener('pointerdown', () => toggle(cell, r, c));
        row.appendChild(cell);
        rowCells.push(cell);
      }
      gridBox.appendChild(row);
      cells.push(rowCells);
    }

    function toggle(cell, r, c) {
      MV.MusicCore.start();
      if (cell.classList.toggle('on')) {
        cell.setAttribute('aria-pressed', 'true');
        MV.MusicCore.playMidi(pitches[rows - 1 - r], { dur: .3, inst });
      } else {
        cell.setAttribute('aria-pressed', 'false');
      }
    }

    function collectNotes() {
      const out = [];
      cells.forEach((rowArr, r) => rowArr.forEach((cell, c) => {
        if (cell.classList.contains('on')) {
          out.push({ midi: pitches[rows - 1 - r], start: c, dur: 1 });
        }
      }));
      return out;
    }

    function pulseCell(col) {
      cells.forEach(rowArr => {
        const cell = rowArr[col];
        if (cell && cell.classList.contains('on')) {
          cell.classList.remove('playing');
          void cell.offsetWidth; // 重启动画
          cell.classList.add('playing');
        }
      });
    }

    function play() {
      const notes = collectNotes();
      if (!notes.length) { MV.VoiceCore.say(MV.lines.compose.empty); return; }
      MV.MusicCore.start();
      MV.MusicCore.playSequence(notes, { bpm: C.gridBpm, inst, onNote: n => pulseCell(n.start) });
      MV.VoiceCore.say(MV.lines.compose.play);
    }

    function showPersonality(key) {
      const p = MV.lines.personality[key];
      if (!p) return;
      const box = $('#cz-result');
      box.innerHTML =
        '<div class="personality-card">' +
          '<div class="personality-icon" aria-hidden="true"><img src="assets/person_' + key + '.webp" alt="" loading="lazy"></div>' +
          '<div class="personality-name">你的歌 · ' + p.name + '</div>' +
          '<p class="personality-desc">' + p.desc + '</p>' +
          '<span class="personality-vision">' + p.vision + '</span>' +
        '</div>';
      if (box.scrollIntoView) box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function toStaff() {
      const notes = collectNotes();
      if (!notes.length) { MV.VoiceCore.say(MV.lines.compose.empty); return; }
      MV.MusicCore.stopAll();
      const personality = analyzePersonality(notes);
      const work = {
        name: '我的小曲 ' + (App.state.works.length + 1),
        notes, bpm: C.gridBpm, inst, personality, ts: Date.now()
      };
      App.state.works.push(work);
      saveProgress();
      addPoints(C.pointsPerCompose);
      const first = !App.state.completed['compose'];
      if (first) {
        App.state.completed['compose'] = true;
        MV.VoiceCore.applyGrowth(stageNum());
      }
      showPersonality(personality);
      MV.VoiceCore.say(first ? MV.lines.compose.first : MV.lines.compose.saved, {
        done: () => { if (alive()) openStaff(work); }
      });
    }

    $$('[data-inst]', body).forEach(chip => {
      chip.addEventListener('pointerdown', () => {
        $$('[data-inst]', body).forEach(x => x.classList.remove('on'));
        chip.classList.add('on');
        inst = chip.dataset.inst;
      });
    });
    $('#cz-play').addEventListener('pointerdown', play);
    $('#cz-clear').addEventListener('pointerdown', () => {
      cells.forEach(rowArr => rowArr.forEach(cell => {
        cell.classList.remove('on');
        cell.setAttribute('aria-pressed', 'false');
      }));
      MV.VoiceCore.say('田里空了，重新种吧。');
    });
    $('#cz-staff').addEventListener('pointerdown', toStaff);
  };

  /* ---------------- 通关庆祝 ---------------- */
  function celebrate(lv, extra) {
    invalidateSession();
    MV.MusicCore.sfx('win');
    showView('celebrate');
    const firstClear = !App.state.completed[lv.id];
    if (!App.state.completed[lv.id]) {
      App.state.completed[lv.id] = true;
      addPoints(C.pointsPerClear);
      MV.VoiceCore.applyGrowth(stageNum());
    }
    mountXs('celebrate-xs', { exp: 'happy', float: true, breathe: true });
    $('#celebrate-title').textContent = lv.title + ' · 通关啦！';
    const line = firstClear ? pick(MV.lines.grow.lit)
      : (extra && extra.line ? extra.line : pick(MV.lines.grow.spark));
    $('#celebrate-line').textContent = line;
    $('#celebrate-points').textContent = '积分 +' + C.pointsPerClear;
    spawnConfetti(26);
    MV.VoiceCore.say(line);
    // 主题曲：全部关卡点亮后自动响起（旋律/歌词由你谱好填进 config.themeSong）
    const song = MV.config.themeSong;
    const songBox = $('#celebrate-song');
    if (songBox) {
      if (Object.keys(App.state.completed).length >= 5 && song) {
        songBox.classList.remove('hidden');
        $('#celebrate-song-name').textContent = song.name;
        const lyr = $('#celebrate-song-lyrics');
        if (song.lyrics && song.lyrics.length) { lyr.textContent = song.lyrics.join('　'); lyr.classList.remove('hidden'); }
        else lyr.classList.add('hidden');
        try { MV.MusicCore.start(); MV.MusicCore.playSequence(song.notes, { bpm: song.bpm, inst: song.inst }); } catch (e) { /* 播放失败不阻塞 */ }
      } else {
        songBox.classList.add('hidden');
      }
    }
    $('#celebrate-next').onclick = () => { showView('map'); renderLocs(); };
  }

  function spawnConfetti(n) {
    const box = $('#confetti');
    box.innerHTML = '';
    const colors = ['#e8b04b', '#d97a8e', '#6fb7e8', '#8fc49a', '#f3c878'];
    for (let i = 0; i < n; i++) {
      const c = document.createElement('i');
      c.style.left = Math.random() * 100 + '%';
      c.style.background = pick(colors);
      c.style.animationDelay = (Math.random() * 2.4) + 's';
      c.style.animationDuration = (2.6 + Math.random() * 2) + 's';
      box.appendChild(c);
    }
  }
  MV.App.celebrate = celebrate;

  /* ---------------- 我的音乐会 ---------------- */
  function openConcert() {
    invalidateSession();
    showView('concert');
    refreshPoints();
    const body = $('#concert-body');
    body.innerHTML = '';
    if (!App.state.works.length) {
      body.innerHTML =
        '<div class="concert-empty">还没有作品。<br>去「旋律草原」种一首歌，<br>它会变成真正的五线谱，住进你的音乐会。</div>';
      return;
    }
    App.state.works.slice().reverse().forEach((w, i) => {
      const card = document.createElement('div');
      card.className = 'work-card';
      const p = MV.lines.personality[w.personality];
      card.innerHTML =
        '<div class="work-card-head">' +
          '<span class="work-title">第 ' + (App.state.works.length - i) + ' 首 · 我的小曲</span>' +
          (p ? '<span class="work-badge">' + p.name + '</span>' : '') +
        '</div>' +
        '<div class="work-staff" data-work="' + i + '"></div>' +
        '<div class="work-actions">' +
          '<button class="btn btn-ghost" data-play="' + i + '" type="button" aria-label="播放这首作品">▶ 播放</button>' +
          '<button class="btn btn-ghost" data-staff="' + i + '" type="button">看五线谱</button>' +
          '<button class="btn btn-ghost" data-save="' + i + '" type="button">保存图片</button>' +
        '</div>';
      body.appendChild(card);
      const staffBox = $('[data-work="' + i + '"]', card);
      MV.Staff.render(w.notes, staffBox, { bpm: w.bpm, compact: true });
      $('[data-play="' + i + '"]', card).addEventListener('pointerdown', () => {
        MV.MusicCore.start();
        MV.MusicCore.playSequence(w.notes, { bpm: w.bpm, inst: w.inst });
      });
      $('[data-staff="' + i + '"]', card).addEventListener('pointerdown', () => openStaff(w));
      $('[data-save="' + i + '"]', card).addEventListener('pointerdown', () => MV.Staff.exportPNG($('[data-work="' + i + '"]', card), w.name || '我的小曲'));
    });
  }

  /* ---------------- 五线谱出口面板 ---------------- */
  function openStaff(piece) {
    const overlay = $('#staff-overlay');
    overlay.hidden = false;
    mountXs('staff-xs', { exp: 'happy', breathe: true });
    MV.Staff.render(piece.notes, $('#staff-canvas'), { bpm: piece.bpm });
    MV.VoiceCore.say(MV.lines.staffReady);
    $('#staff-play').onclick = () => {
      MV.MusicCore.start();
      MV.MusicCore.playSequence(piece.notes, { bpm: piece.bpm, inst: piece.inst });
    };
    $('#staff-save').onclick = () => MV.Staff.exportPNG($('#staff-canvas'), piece.name || '我的小曲');
    $('#staff-midi').onclick = () => MV.Staff.exportMIDI(piece.notes, piece.bpm, piece.name || '我的小曲');
  }
  function closeStaff() {
    $('#staff-overlay').hidden = true;
    MV.VoiceCore.stopTyping();
  }
  MV.openStaff = openStaff;
  MV.closeStaff = closeStaff;

  /* ---------------- 全局事件 ---------------- */
  function bindGlobal() {
    $('#stage-back').addEventListener('pointerdown', () => {
      invalidateSession();
      MV.MusicCore.stopAll();
      MV.VoiceCore.stopTyping();
      if (MV._drumKey) document.removeEventListener('keydown', MV._drumKey);
      showView('map');
      renderLocs();
    });
    $('#concert-back').addEventListener('pointerdown', () => { showView('map'); renderLocs(); });
    $('#staff-close').addEventListener('pointerdown', closeStaff);
    $('#staff-overlay').addEventListener('pointerdown', e => { if (e.target === e.currentTarget) closeStaff(); });
    $('#btn-reset').addEventListener('pointerdown', () => {
      if (confirm('确定要重新开始吗？积分和作品都会清空。')) {
        localStorage.removeItem(C.storageKey);
        sessionStorage.removeItem('mv-greeted');
        location.reload();
      }
    });
  }

  /* ---------------- 启动 ---------------- */
  function boot() {
    bindGlobal();
    showView('splash');   // 关键：激活开场视图，否则 .view 默认 display:none 会白屏
    bootSplash();
    // 引擎就绪检测
    const miss = [];
    if (typeof Tonal === 'undefined') miss.push('乐理引擎');
    if (typeof Tone === 'undefined') miss.push('音频引擎');
    if (typeof Vex === 'undefined') miss.push('记谱引擎');
    if (miss.length) {
      setTimeout(() => {
        MV.VoiceCore.say('哎呀，' + miss.join('、') + '没有加载好。请检查网络后再试试。');
      }, 1200);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
