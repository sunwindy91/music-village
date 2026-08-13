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
    // F-07：mount 后统一 成长形态 + 姿态（修复通关页/各视图回种子的缺口）
    try { MV.VoiceCore.applyGrowth(stageNum()); } catch (e) { /* noop */ }
    try { MV.VoiceCore.setPose(opts.pose || 'idle', opts.poseOpts); } catch (e) { /* noop */ }
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
    mountXs('splash-xs', { exp: had ? 'happy' : 'calm', breathe: true, pose: had ? 'idle' : 'welcome' });

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
      MV.VoiceCore.sayVoice('back1', '欢迎回来，音乐寻宝家。', { done: () => setTimeout(go, 700) });
      setTimeout(go, 2200);
    } else {
      // 新朋友：开场白 + 手动/自动进入
      let i = 0;
      const lines = MV.lines.splash;
      const next = () => {
        if (i < lines.length && App.state.view === 'splash') {
          MV.VoiceCore.sayVoice('welcome' + (i + 1), lines[i], { done: () => setTimeout(() => { i++; next(); }, 420) });
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
    // 主线成长：每点亮 3 关，晓声进阶一档（0种子→1小芽→2开花→3星光→4初鹿→5鹿全盛）
    // 修复：避免 5 关即满级过早全盛，也避免过一关毫无变化——每 3 关就有一次可见成长
    return Math.min(5, Math.floor(Object.keys(App.state.completed).length / 3));
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
    // 小鹿乱撞故事线：消费通关时挂起的故事标记（晓声在地图上说出，形态已更新为初鹿/鹿）
    if (App._pendingStory && MV.lines.story && MV.lines.story[App._pendingStory]) {
      const key = App._pendingStory;
      App._pendingStory = null;
      MV.VoiceCore.say(pick(MV.lines.story[key]));
    }
  }
  function bootMap() {
    mountXs('map-xs', { exp: 'calm', float: true, breathe: true });
    enableDrag($('#map-xs')); // 晓声可拖拽桌宠（白小纯式）
    updateXsForm();
    MV.VoiceCore.fireflies($('#map-fireflies'), 14);
    renderLocs();

    if (!sessionStorage.getItem('mv-greeted')) {
      sessionStorage.setItem('mv-greeted', '1');
      const hadAny = Object.keys(App.state.completed).length;
      MV.VoiceCore.sayVoice(hadAny ? 'back1' : 'welcome3', hadAny ? MV.lines.mapWelcomeBack : pick(MV.lines.mapHello));
    }
    refreshPoints();
  }

  function renderLocs() {
    updateXsForm(); // 每次回到地图都刷新晓声形态
    // 通关聚类后回地图：晓声主动引导去下一站
    if (App._pendingNext && MV.lines.nextStop[App._pendingNext]) {
      const nextKey = App._pendingNext;
      App._pendingNext = null;
      MV.VoiceCore.sayVoice('next_' + nextKey, pick(MV.lines.nextStop[nextKey]));
    }
    const wrap = $('#map-locs');
    wrap.innerHTML = '';
    // 流程动线：实线把 5 站串起来，通关逐段点亮（金=已通/浅金=已解锁/灰=未解锁）
    const ORDER = ['valley', 'rhythm', 'scale', 'chord', 'meadow']; // 主线流程顺序
    const links = $('#map-links');
    if (links) {
      links.innerHTML = '';
      const sceneEl = $('#map-scene');
      const sr = sceneEl ? sceneEl.getBoundingClientRect() : { width: 400, height: 640 };
      links.setAttribute('viewBox', '0 0 ' + sr.width + ' ' + sr.height);
      links.setAttribute('preserveAspectRatio', 'none');
      const pts = ORDER.map(id => {
        const l = MV.locations.find(x => x.id === id);
        return l ? [l.pos[0] / 100 * sr.width, l.pos[1] / 100 * sr.height] : [0, 0];
      });
      for (let i = 0; i < pts.length - 1; i++) {
        // 沿节点下缘弧线走（不斜穿画面中央），淡细虚线不破坏水彩主画面
        const x1 = pts[i][0], y1 = pts[i][1] + 38, x2 = pts[i + 1][0], y2 = pts[i + 1][1] + 38;
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + 22;
        const d = 'M' + x1 + ' ' + y1 + ' Q' + mx + ' ' + my + ' ' + x2 + ' ' + y2;
        const toLoc = MV.locations.find(x => x.id === ORDER[i + 1]);
        const toDone = toLoc && toLoc.levels.every(id => App.state.completed[id]);   // 下一站已通关
        const toOpen = clusterUnlocked(ORDER[i + 1]);                                 // 下一站已解锁
        const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p.setAttribute('d', d);
        p.setAttribute('fill', 'none');
        p.setAttribute('stroke', toDone ? '#d9ae62' : (toOpen ? '#e3cfa4' : '#c9d3cc'));
        p.setAttribute('stroke-width', '3');
        p.setAttribute('stroke-linecap', 'round');
        p.setAttribute('stroke-dasharray', '2 10');
        p.setAttribute('opacity', toDone ? '.6' : (toOpen ? '.45' : '.28'));
        links.appendChild(p);
      }
    }
    // —— 圆形节点按钮（画布式布局：山谷背景上散布 + 线穿着） ——
    MV.locations.forEach(loc => {
      const allDone = loc.levels.every(id => App.state.completed[id]);
      const unlocked = clusterUnlocked(loc.id);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'map-node' + (allDone ? ' completed' : '') + (unlocked ? '' : ' locked');
      btn.style.left = loc.pos[0] + '%';
      btn.style.top = loc.pos[1] + '%';
      btn.style.position = 'absolute';
      btn.style.transform = 'translate(-50%, -50%)';
      btn.style.filter = unlocked ? '' : 'grayscale(.55)';
      btn.setAttribute('aria-label', loc.name + (allDone ? '（已全部点亮）' : (unlocked ? '' : '（未解锁）')));
      const stepNo = ORDER.indexOf(loc.id) + 1; // 流程第几步（1→5）
      btn.innerHTML =
        '<span class="step-num" aria-hidden="true">' + stepNo + '</span>' +
        '<img src="assets/cluster_' + loc.id + '.webp" alt="" loading="lazy" onerror="this.style.display=\'none\'" style="width:100%;height:100%;object-fit:cover;display:block">' +
        '<span style="position:absolute;left:0;right:0;bottom:0;padding:3px 0;font-size:12px;font-weight:bold;color:#5b4632;background:rgba(255,253,247,.88);text-align:center">' + loc.name + '</span>' +
        (unlocked ? '' : '<span class="step-lock" aria-hidden="true">🔒</span>');
      btn.addEventListener('pointerdown', () => {
        if (unlocked) openLocation(loc.id);
        else MV.VoiceCore.say('先点亮前面的山谷，小路才会通到这里哦！');
      });
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

    const qaBtn = document.createElement('button');
    qaBtn.type = 'button';
    qaBtn.className = 'btn btn-ghost map-qa-btn';
    qaBtn.textContent = '问问晓声';
    qaBtn.addEventListener('pointerdown', () => openQa());
    footer.appendChild(qaBtn);
  }

  /* —— 晓声可拖拽桌宠（白小纯式：拖拽 + 范围限制 + 挣扎态） —— */
  function enableDrag(el) {
    if (!el) return;
    let sx = 0, sy = 0, dragging = false;
    let startX = 0, startY = 0, moved = false;
    const scene = el.parentElement;
    el.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const r = el.getBoundingClientRect();
      sx = e.clientX - r.left;
      sy = e.clientY - r.top;
      startX = e.clientX; startY = e.clientY;
      moved = false;
      dragging = true;
      if (el.setPointerCapture) { try { el.setPointerCapture(e.pointerId); } catch (err) { /* noop */ } }
    });
    el.addEventListener('pointermove', e => {
      if (!dragging || !scene) return;
      if (Math.abs(e.clientX - startX) + Math.abs(e.clientY - startY) > 8) moved = true;
      const sr = scene.getBoundingClientRect();
      const nx = e.clientX - sr.left - sx;
      const ny = e.clientY - sr.top - sy;
      el.style.left = Math.max(0, Math.min(sr.width - 30, nx)) + 'px';
      el.style.top = Math.max(0, Math.min(sr.height - 30, ny)) + 'px';
      el.classList.add('xs-dragging');
    });
    el.addEventListener('pointerup', () => {
      dragging = false;
      el.classList.remove('xs-dragging');
      if (!moved) openQa(); // 轻点晓声 → 打开对话盘（白小纯式）
    });
    el.addEventListener('pointercancel', () => { dragging = false; el.classList.remove('xs-dragging'); });
  }

  /* ---------------- 地点总览（关卡 chips） ---------------- */
  function openLocation(locId) {
    const loc = MV.locations.find(l => l.id === locId);
    if (!loc) return;
    App.state.currentLoc = loc;
    $('#loc-overlay') && $('#loc-overlay').remove();

    const clusterImg = 'assets/cluster_' + loc.id + '.webp';
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
        '<img src="' + clusterImg + '" alt="" loading="lazy" onerror="this.style.display=\'none\'" style="width:100%;max-height:150px;object-fit:cover;border-radius:14px;margin-bottom:12px">' +
        '<div class="loc-levels"></div>' +
      '</div>';
    $('#view-map').appendChild(overlay);
    $('.loc-panel-close', overlay).addEventListener('pointerdown', () => overlay.remove());

    const list = $('.loc-levels', overlay);
    const theory = MV.theories && MV.theories[loc.id];
    if (theory && !theorySeen(loc.id)) {
      // 聚类理论导入：先「晓声小课堂」再关卡（教学闭环：理论→练习）
      list.innerHTML =
        '<div class="theory-card" style="padding:6px 4px 2px">' +
          (theory.img ? '<img src="' + theory.img + '" alt="" loading="lazy" onerror="this.style.display=\'none\'" style="width:100%;max-height:160px;object-fit:cover;border-radius:16px;margin-bottom:12px">' : '') +
          '<h3 style="font-size:20px;margin:0 0 10px;color:#5b4632">' + theory.title + '</h3>' +
          '<p style="font-size:16px;line-height:1.7;margin:0 0 16px;color:#3d2f1f">' + theory.body + '</p>' +
          '<button class="btn btn-gold" id="theory-go" type="button" style="width:100%;min-height:48px">我知道了，开始闯关！</button>' +
        '</div>';
      $('#theory-go', list).addEventListener('pointerdown', () => {
        markTheorySeen(loc.id);
        renderLevelChips(loc, list);
      });
    } else {
      renderLevelChips(loc, list);
    }
    // 面板自带记忆文案，避免地图气泡被遮罩遮挡
  }

  /* —— 主线解锁链（聚类链沿 S 形动线 + 聚类内关卡链 + 演示全开） —— */
  const CLUSTER_CHAIN = ['valley', 'rhythm', 'scale', 'chord', 'meadow'];
  function allUnlocked() {
    try { return localStorage.getItem('mv-unlock-all') === '1'; } catch (e) { return false; }
  }
  function clusterUnlocked(id) {
    if (allUnlocked()) return true;
    const i = CLUSTER_CHAIN.indexOf(id);
    if (i <= 0) return true; // 声音山谷 = 起点
    const prev = CLUSTER_CHAIN[i - 1];
    const loc = MV.locations.find(l => l.id === prev);
    return loc.levels.every(lvId => !!App.state.completed[lvId]);
  }
  function levelUnlocked(lv) {
    if (allUnlocked()) return true;
    if (!clusterUnlocked(lv.loc)) return false;
    const loc = MV.locations.find(l => l.id === lv.loc);
    const idx = loc.levels.indexOf(lv.id);
    if (idx <= 0) return true; // 聚类内第一关
    return !!App.state.completed[loc.levels[idx - 1]];
  }

  /* 渲染聚类关卡列表（含乐理小测入口） */
  function renderLevelChips(loc, list) {
    list.innerHTML = '';
    loc.levels.forEach(id => {
      const lv = MV.levels.find(x => x.id === id);
      if (!lv) return;
      const done = !!App.state.completed[id];
      const unlocked = levelUnlocked(lv);
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'loc-level' + (done ? ' done' : '') + (unlocked ? '' : ' locked');
      chip.innerHTML =
        '<span class="loc-level-ico" aria-hidden="true">' + (done ? '✓' : (lv.type === 'quiz' ? '✎' : '♪')) + '</span>' +
        '<span class="loc-level-txt"><b>' + lv.title + '</b><small>' + lv.brief + '</small></span>' +
        '<span class="loc-level-theory">' + (lv.lesson ? lv.lesson + ' · ' : '') + lv.theory + '</span>' +
        (unlocked ? '<span class="loc-level-go" aria-hidden="true">→</span>' : '<span class="loc-level-go" aria-hidden="true">🔒</span>');
      chip.addEventListener('pointerdown', () => {
        if (unlocked) openLevel(id);
        else MV.VoiceCore.say('先完成前面的课，小路才会通到这里哦！');
      });
      list.appendChild(chip);
    });
  }

  /* 聚类理论已读标记（localStorage，独立 key，不污染进度） */
  function theorySeen(id) {
    try { const d = JSON.parse(localStorage.getItem('mv-theory-seen') || '{}'); return !!d[id]; } catch (e) { return false; }
  }
  function markTheorySeen(id) {
    try { const d = JSON.parse(localStorage.getItem('mv-theory-seen') || '{}'); d[id] = 1; localStorage.setItem('mv-theory-seen', JSON.stringify(d)); } catch (e) { /* 隐私模式忽略 */ }
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
        MV.VoiceCore.setPose('happy');
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
        MV.VoiceCore.setPose('comfort');
        wrong++;
        if (wrong >= 2) { // 卡关陪伴：连续错 2 次，降难度 + 换话术重播（不判死）
          wrong = 0;
          MV.VoiceCore.setPose('curious');
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
    let bpm = 88;
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
        MV.VoiceCore.setPose('comfort');
        MV.VoiceCore.say(MV.lines.drum.fail, { done: () => {
          if (alive()) {
            $('#drum-replay').disabled = false;
            if (bpm > 76) { bpm = Math.max(72, bpm - 12); $('#drum-replay').textContent = '慢一点再拍'; }
            else { $('#drum-replay').textContent = '再拍一次'; }
          }
        }});
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
        MV.VoiceCore.setPose('happy');
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
        MV.VoiceCore.setPose('comfort');
        wrong++;
        if (wrong >= 2) { // 卡关陪伴：连续错 2 次，换话术重播（不判死）
          wrong = 0;
          MV.VoiceCore.setPose('curious');
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
    let pool = [];      // 当前 stage 剩余待认的音（认一个少一个，认全才升级，不重复）
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

    function stagePool() {
      pool = stages[stage].slice().sort(() => Math.random() - .5);
    }
    function renderProgress() {
      // 本 stage 已认 N / 总 M 个音（认全才升级）
      const m = stages[stage].length, n = m - pool.length;
      progBox.replaceChildren(stepDots(m, n));
    }

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
        if (!pool.length) stagePool();   // 首次或上一 stage 认完后重建
        target = pool.pop();             // 认一个少一个，不重复
      }
      const s = solfa[target];
      intro.textContent = '第 ' + (correct + 1) + ' 题 · 认全' + stages[stage].length + '个音（' + s.sol + ' 等你）';
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
        MV.VoiceCore.setPose('happy');
        fruits[idx].classList.add('correct');
        addPoints(C.pointsPerCorrect);
        correct++;
        wrong = 0;
        renderProgress();
        MV.VoiceCore.say(
          pick(MV.lines.notes.correct).replace('{name}', '第' + s.num + '个果子').replace('{sol}', s.sol),
          { done: () => {
            if (!alive()) return;
            if (!pool.length) {
              // 本 stage 认全了 → 升级或通关
              if (stage < stages.length - 1) {
                stage++;
                stagePool();
                renderFruits();
                const names = stages[stage].map(i => solfa[i].sol).join('、');
                MV.VoiceCore.say('这组认全啦！接下来认：' + names, { done: () => { if (!alive()) return; setTimeout(() => { if (alive()) playRound(true); }, 500); } });
              } else {
                MV.VoiceCore.say(MV.lines.notes.done, { done: () => { if (!alive()) return; setTimeout(() => celebrate(lv), 400); } });
              }
            } else {
              setTimeout(() => { if (alive()) playRound(true); }, 500);
            }
          }});
      } else {
        MV.MusicCore.sfx('wrong');
        MV.VoiceCore.setPose('comfort');
        fruits[idx].classList.add('wrong');
        wrong++;
        const stumble = wrong >= 2;   // 卡关陪伴：连续错 2 次，先安抚再进学习闭环
        if (stumble) wrong = 0;
        if (stumble) MV.VoiceCore.setPose('curious');
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
    stagePool();
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

  /* —— 关卡：音符住址（认谱 · 看五线谱位置→认出唱名 · 补足视谱渐进链） —— */
  runners.stavenote = function (lv, body) {
    const solfa = MV.solfa;
    const order = [0, 2, 4, 1, 3];               // do→mi→sol→re→fa（先易后难，跨度递减）
    let round = 0, correct = 0, wrong = 0, answered = false;
    let target = 0;
    const sess = MV._session;
    const alive = () => sess === MV._session;

    body.innerHTML =
      '<div class="stage-panel stage-scene">' +
        '<div class="stage-intro" id="sn-intro">第 1 题 · 认认它住在几楼</div>' +
        '<div id="sn-progress"></div>' +
        '<div class="sn-staff" id="sn-staff" style="background:#fffdf7;border-radius:14px;padding:10px;margin:10px auto;max-width:300px;min-height:110px"></div>' +
        '<p class="sn-hint" id="sn-hint" style="text-align:center;font-size:14px;color:#8a7a63;margin:6px 0 10px">五线谱的小楼：越往上，音越高</p>' +
        '<div class="sn-keys" id="sn-keys" style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;max-width:420px;margin:0 auto"></div>' +
      '</div>';

    const intro = $('#sn-intro');
    const progBox = $('#sn-progress');
    const staffBox = $('#sn-staff');
    const hint = $('#sn-hint');
    const keyBox = $('#sn-keys');

    function renderProgress() { progBox.replaceChildren(stepDots(3, correct)); }

    function renderStaff(idx) {
      const notes = [{ midi: solfa[idx].midi, start: 0, dur: 1 }];
      staffBox.innerHTML = '';
      try { MV.Staff.render(notes, staffBox, { compact: true }); } catch (e) { staffBox.textContent = '（谱面渲染中…）'; }
    }

    function buildRound() {
      if (!alive()) return;
      answered = false;
      target = order[Math.min(round, order.length - 1)];
      intro.textContent = '第 ' + (round + 1) + ' 题 · 认出这个音符是谁';
      renderStaff(target);
      keyBox.innerHTML = '';
      [0, 1, 2, 3, 4].forEach(idx => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'answer-btn';
        b.innerHTML = '<b style="font-size:20px">' + solfa[idx].sol + '</b><small style="display:block;opacity:.85">' + solfa[idx].num + '</small>';
        b.style.minWidth = '64px';
        b.style.minHeight = '56px';
        b.addEventListener('pointerdown', () => answer(idx));
        keyBox.appendChild(b);
      });
      hint.textContent = '这个音符住在几楼？';
    }

    function answer(idx) {
      if (!alive() || answered) return;
      answered = true;
      if (idx === target) {
        MV.MusicCore.sfx('correct');
        MV.VoiceCore.setPose('happy');
        MV.MusicCore.playMidi(solfa[idx].midi, { dur: .5, inst: 'piano' });
        correct++; wrong = 0;
        renderProgress();
        MV.VoiceCore.say(pick(MV.lines.stavenote.correct), { done: () => {
          if (!alive()) return;
          if (correct >= C.correctToPass) {
            MV.VoiceCore.say(MV.lines.stavenote.done, { done: () => { if (!alive()) return; setTimeout(() => celebrate(lv), 400); } });
          } else { round++; setTimeout(() => { if (alive()) buildRound(); }, 450); }
        }});
      } else {
        MV.MusicCore.sfx('wrong');
        MV.VoiceCore.setPose('comfort');
        wrong++;
        const stumble = wrong >= 2;
        if (stumble) wrong = 0;
        if (stumble) MV.VoiceCore.setPose('curious');
        MV.VoiceCore.say((stumble ? pick(MV.lines.stumble.stavenote) + ' ' : '') + pick(MV.lines.stavenote.wrong), { done: () => {
          if (!alive()) return;
          setTimeout(() => { if (alive()) buildRound(); }, 400);
        }});
      }
    }

    renderProgress();
    buildRound();
  };

  /* —— 关卡：走走停停（时值听辨 · 叔叔大纲第 2 阶：四分/二分/全音符 = 走/走——/走————） —— */
  runners.walkstop = function (lv, body) {
    // 播放顺序：先最长(4)→最短(1)→中间(2)，先两极后中间（先宽后严）
    const order = [4, 1, 2];
    let round = 0, correct = 0, wrong = 0, playing = false, answered = false;
    const sess = MV._session;
    const alive = () => sess === MV._session;
    let cards, intro;

    body.innerHTML =
      '<div class="stage-panel stage-scene">' +
        '<div class="stage-intro" id="ws-intro">第 1 题 · 听声音走了几步</div>' +
        '<div id="ws-progress"></div>' +
        '<div class="ws-cards" style="display:flex;flex-wrap:wrap;justify-content:center;gap:14px;margin:14px auto;max-width:520px">' +
          '<button class="answer-btn ws-card" type="button" data-dur="1" style="flex:1 1 120px;min-height:88px"><span class="ws-feet" style="font-size:30px;display:block">🦶</span><b style="font-size:20px">走</b><small style="display:block;opacity:.85">短短 · 一拍</small></button>' +
          '<button class="answer-btn ws-card" type="button" data-dur="2" style="flex:1 1 120px;min-height:88px"><span class="ws-feet" style="font-size:30px;display:block">🦶🦶</span><b style="font-size:20px">走——</b><small style="display:block;opacity:.85">中等 · 两拍</small></button>' +
          '<button class="answer-btn ws-card" type="button" data-dur="4" style="flex:1 1 120px;min-height:88px"><span class="ws-feet" style="font-size:30px;display:block">🦶🦶🦶</span><b style="font-size:20px">走————</b><small style="display:block;opacity:.85">特别长 · 四拍</small></button>' +
        '</div>' +
        '<div class="compose-actions" style="justify-content:center">' +
          '<button class="btn btn-ghost" id="ws-replay" type="button">再听一次</button>' +
        '</div>' +
      '</div>';

    intro = $('#ws-intro');
    const progBox = $('#ws-progress');
    cards = $$('[data-dur]', body);

    function renderProgress() { progBox.replaceChildren(stepDots(3, correct)); }

    function playRound() {
      if (!alive()) return;
      answered = false;
      playing = true;
      cards.forEach(bt => bt.disabled = true);
      const dur = order[Math.min(round, order.length - 1)];
      intro.textContent = '第 ' + (round + 1) + ' 题 · 听这个声音走了几步';
      MV.MusicCore.playSequence([{ midi: 60, start: 0, dur: dur }], {
        bpm: 88, inst: 'piano',
        onEnd: () => {
          if (!alive()) return;
          playing = false;
          cards.forEach(bt => bt.disabled = false);
        }
      });
    }

    function answer(dur) {
      if (answered || playing) return;
      answered = true;
      const ok = dur === order[Math.min(round, order.length - 1)];
      if (ok) {
        MV.MusicCore.sfx('correct');
        MV.VoiceCore.setPose('happy');
        correct++;
        wrong = 0;
        renderProgress();
        MV.VoiceCore.say(pick(MV.lines.walkstop.correct), { done: () => {
          if (!alive()) return;
          if (correct >= C.correctToPass) {
            MV.VoiceCore.say(MV.lines.walkstop.done, { done: () => { if (!alive()) return; setTimeout(() => celebrate(lv), 400); } });
          } else {
            round++;
            setTimeout(() => { if (alive()) playRound(); }, 500);
          }
        }});
      } else {
        MV.MusicCore.sfx('wrong');
        MV.VoiceCore.setPose('comfort');
        wrong++;
        if (wrong >= 2) { // 卡关陪伴：连续错 2 次降难度重播，不判死
          wrong = 0;
          MV.VoiceCore.setPose('curious');
          MV.VoiceCore.say(pick(MV.lines.stumble.walkstop), { done: () => { if (!alive()) return; setTimeout(() => { if (alive()) playRound(); }, 450); } });
        } else {
          MV.VoiceCore.say(pick(MV.lines.walkstop.wrong), { done: () => { if (!alive()) return; setTimeout(() => { if (alive()) playRound(); }, 400); } });
        }
      }
    }

    cards.forEach(bt => bt.addEventListener('pointerdown', () => answer(parseInt(bt.dataset.dur, 10))));
    $('#ws-replay').addEventListener('pointerdown', () => { if (!playing) playRound(); });
    renderProgress();
    setTimeout(() => { if (alive()) playRound(); }, 600);
  };

  /* —— 关卡：乐理小测（聚类形成性评估 · 乐理小达人式选择题） —— */
  runners.quiz = function (lv, body) {
    const quiz = MV.quizzes && MV.quizzes[lv.quiz];
    if (!quiz) { body.innerHTML = '<p class="stage-intro">题目还在路上，先去别的山谷玩吧！</p>'; return; }
    let round = 0, correct = 0, wrong = 0, answered = false;
    const sess = MV._session;
    const alive = () => sess === MV._session;

    body.innerHTML =
      '<div class="stage-panel stage-scene">' +
        '<img src="assets/quiz_badge.webp" alt="" loading="lazy" onerror="this.style.display=\'none\'" style="width:72px;height:72px;object-fit:contain;margin:0 auto 6px;display:block;border-radius:50%">' +
        '<div class="stage-intro" id="qz-intro">' + quiz.name + '</div>' +
        '<div id="qz-progress"></div>' +
        '<p class="qz-question" id="qz-question" style="font-size:18px;line-height:1.6;margin:10px 0 16px;text-align:center;min-height:56px"></p>' +
        '<div class="qz-options" id="qz-options" style="display:flex;flex-direction:column;gap:12px;max-width:360px;margin:0 auto"></div>' +
      '</div>';

    const intro = $('#qz-intro');
    const qBox = $('#qz-question');
    const optBox = $('#qz-options');
    const progBox = $('#qz-progress');

    function renderProgress() { progBox.replaceChildren(stepDots(quiz.questions.length, correct)); }

    function renderRound() {
      if (!alive()) return;
      answered = false;
      const item = quiz.questions[round];
      intro.textContent = '第 ' + (round + 1) + ' 题 · ' + quiz.name;
      qBox.textContent = item.q;
      optBox.innerHTML = '';
      item.options.forEach((opt, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'answer-btn';
        b.textContent = opt;
        b.style.minHeight = '52px';
        b.addEventListener('pointerdown', () => answer(i));
        optBox.appendChild(b);
      });
    }

    function answer(i) {
      if (!alive() || answered) return;
      answered = true;
      const item = quiz.questions[round];
      const ok = i === item.ans;
      [...optBox.children].forEach(bt => bt.disabled = true);
      if (ok) {
        MV.MusicCore.sfx('correct');
        MV.VoiceCore.setPose('happy');
        addPoints(C.pointsPerCorrect);
        correct++; wrong = 0;
        renderProgress();
        MV.VoiceCore.say(pick(MV.lines.quiz.correct), { done: () => {
          if (!alive()) return;
          if (correct >= quiz.questions.length) {
            MV.VoiceCore.say(MV.lines.quiz.done, { done: () => { if (!alive()) return; setTimeout(() => celebrate(lv), 400); } });
          } else { round++; setTimeout(() => { if (alive()) renderRound(); }, 450); }
        }});
      } else {
        MV.MusicCore.sfx('wrong');
        MV.VoiceCore.setPose('comfort');
        wrong++;
        const ansText = item.options[item.ans];
        MV.VoiceCore.say(MV.lines.quiz.wrong.replace('{ans}', ansText), { done: () => {
          if (!alive()) return;
          wrong = 0;
          setTimeout(() => { if (alive()) renderRound(); }, 400); // 不判死：看答案后重来本题
        }});
      }
    }

    renderProgress();
    renderRound();
  };

  /* —— 关卡：旋律填空（听旋律→补缺音 · 测音高序列记忆 · 蓝图 07） —— */
  runners.fillgap = function (lv, body) {
    const solfa = MV.solfa;                       // do re mi fa sol la si
    const pool = [                                 // 旋律池（solfa 索引）
      [0, 1, 2, 4],                                // do re mi sol
      [0, 2, 4, 5],                                // do mi sol la
      [4, 2, 0, 1],                                // sol mi do re
      [0, 1, 2, 3, 4]                              // do re mi fa sol（5 音）
    ];
    const gapAt = [999, 1, 2];                     // 挖空位置：首轮末尾，之后中间
    let round = 0, correct = 0, wrong = 0, playing = false, answered = false;
    let seq, gapIdx, target, cards;
    const sess = MV._session;
    const alive = () => sess === MV._session;

    body.innerHTML =
      '<div class="stage-panel stage-scene">' +
        '<div class="stage-intro" id="fg-intro">第 1 题 · 听旋律，找缺口</div>' +
        '<div id="fg-progress"></div>' +
        '<div class="fg-melody" id="fg-melody" style="display:flex;justify-content:center;gap:10px;margin:16px auto;flex-wrap:wrap;max-width:420px"></div>' +
        '<div class="fg-options" id="fg-options" style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap;max-width:420px;margin:0 auto"></div>' +
        '<div class="compose-actions" style="justify-content:center">' +
          '<button class="btn btn-ghost" id="fg-replay" type="button">再听一次</button>' +
        '</div>' +
      '</div>';

    const intro = $('#fg-intro');
    const progBox = $('#fg-progress');
    const melBox = $('#fg-melody');
    const optBox = $('#fg-options');

    function renderProgress() { progBox.replaceChildren(stepDots(3, correct)); }

    function buildRound() {
      if (!alive()) return;
      answered = false;
      playing = true;
      seq = pool[Math.min(round, pool.length - 1)];
      const gp = gapAt[Math.min(round, gapAt.length - 1)];
      gapIdx = (gp === 999) ? seq.length - 1 : gp;
      target = seq[gapIdx];
      // 旋律小格（缺口显示 ？）
      melBox.innerHTML = '';
      seq.forEach((sIdx, i) => {
        const d = document.createElement('span');
        d.className = 'fg-note' + (i === gapIdx ? ' gap' : '');
        d.textContent = (i === gapIdx) ? '？' : solfa[sIdx].sol;
        d.style.cssText = 'width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:12px;font-size:20px;' +
          (i === gapIdx ? 'background:#f3e7d3;color:#9a5718;font-weight:bold' : 'background:#ffffff;color:#3d2f1f');
        melBox.appendChild(d);
      });
      // 选项：正确答案 + 3 干扰（do re mi fa sol 中取）
      const choices = [target];
      [0, 1, 2, 3, 4].filter(i => i !== target).sort(() => Math.random() - .5).slice(0, 3).forEach(i => choices.push(i));
      choices.sort(() => Math.random() - .5);
      optBox.innerHTML = '';
      cards = [];
      choices.forEach((sIdx) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'answer-btn';
        b.innerHTML = '<b style="font-size:22px">' + solfa[sIdx].sol + '</b><small style="display:block;opacity:.85">' + solfa[sIdx].num + '</small>';
        b.style.minWidth = '80px';
        b.style.minHeight = '60px';
        b.addEventListener('pointerdown', () => answer(sIdx));
        optBox.appendChild(b);
        cards.push(b);
      });
      // 播放旋律（缺口处静音）
      intro.textContent = '第 ' + (round + 1) + ' 题 · 听旋律，补上缺的音';
      const notes = seq.map((sIdx, i) => ({ midi: solfa[sIdx].midi, start: i, dur: i === gapIdx ? 0 : 0.9 })).filter(n => n.dur > 0);
      MV.MusicCore.playSequence(notes, { bpm: 90, inst: 'piano', onEnd: () => {
        if (!alive()) return;
        playing = false;
        cards.forEach(bt => bt.disabled = false);
      }});
    }

    function answer(sIdx) {
      if (!alive() || playing || answered) return;
      answered = true;
      cards.forEach(bt => bt.disabled = true);
      if (sIdx === target) {
        MV.MusicCore.sfx('correct');
        MV.VoiceCore.setPose('happy');
        correct++; wrong = 0;
        renderProgress();
        MV.VoiceCore.say(pick(MV.lines.fillgap.correct), { done: () => {
          if (!alive()) return;
          if (correct >= C.correctToPass) {
            MV.VoiceCore.say(MV.lines.fillgap.done, { done: () => { if (!alive()) return; setTimeout(() => celebrate(lv), 400); } });
          } else { round++; setTimeout(() => { if (alive()) buildRound(); }, 450); }
        }});
      } else {
        MV.MusicCore.sfx('wrong');
        MV.VoiceCore.setPose('comfort');
        wrong++;
        const stumble = wrong >= 2;
        if (stumble) wrong = 0;
        if (stumble) MV.VoiceCore.setPose('curious');
        MV.VoiceCore.say((stumble ? pick(MV.lines.stumble.fillgap) + ' ' : '') + pick(MV.lines.fillgap.wrong), { done: () => {
          if (!alive()) return;
          setTimeout(() => { if (alive()) buildRound(); }, 400);
        }});
      }
    }

    $('#fg-replay').addEventListener('pointerdown', () => { if (!playing) buildRound(); });
    renderProgress();
    setTimeout(() => { if (alive()) buildRound(); }, 600);
  };

  /* —— 关卡：音色捉迷藏（听音色辨乐器 · 教学点=音色性格） —— */
  runners.timbre = function (lv, body) {
    const insts = C.instruments;                   // 小鸟/风铃/溪水/木琴
    const order = [0, 1, 2, 3];                    // 四种音色各一轮
    let round = 0, correct = 0, wrong = 0, playing = false, answered = false;
    let target = 0, cards = [];
    const sess = MV._session;
    const alive = () => sess === MV._session;

    body.innerHTML =
      '<div class="stage-panel stage-scene">' +
        '<div class="stage-intro" id="tb-intro">第 1 题 · 听声音，找乐器</div>' +
        '<div id="tb-progress"></div>' +
        '<div class="tb-options" id="tb-options" style="display:flex;flex-wrap:wrap;justify-content:center;gap:12px;max-width:440px;margin:16px auto"></div>' +
        '<div class="compose-actions" style="justify-content:center">' +
          '<button class="btn btn-ghost" id="tb-replay" type="button">再听一次</button>' +
        '</div>' +
      '</div>';

    const intro = $('#tb-intro');
    const progBox = $('#tb-progress');
    const optBox = $('#tb-options');

    function renderProgress() { progBox.replaceChildren(stepDots(3, correct)); }

    function playRound() {
      const idx = target;
      const n = (round === 0) ? 2 : 1;             // 首轮播两遍（先宽后严）
      const midi = 72;
      MV.MusicCore.playMidi(midi, { dur: .55, inst: insts[idx].id });
      if (n > 1) setTimeout(() => { if (alive()) MV.MusicCore.playMidi(midi, { dur: .55, inst: insts[idx].id }); }, 420);
      setTimeout(() => { if (alive()) { playing = false; cards.forEach(bt => bt.disabled = false); } }, n * 470);
    }

    function buildRound() {
      if (!alive()) return;
      answered = false;
      playing = true;
      target = order[Math.min(round, order.length - 1)];
      intro.textContent = '第 ' + (round + 1) + ' 题 · 听声音，它是哪种乐器？';
      optBox.innerHTML = '';
      cards = [];
      insts.forEach((ins, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'answer-btn';
        b.innerHTML = '<img src="assets/inst_' + ins.id + '.webp" alt="" loading="lazy" onerror="this.style.display=\'none\'" style="width:56px;height:56px;object-fit:contain;display:block;margin:0 auto 4px;border-radius:50%">' +
          '<b style="font-size:18px">' + ins.label + '</b><small style="display:block;opacity:.85">' + ins.desc + '</small>';
        b.style.minWidth = '150px';
        b.style.minHeight = '64px';
        b.addEventListener('pointerdown', () => answer(i));
        optBox.appendChild(b);
        cards.push(b);
      });
      playRound();
    }

    function answer(i) {
      if (!alive() || playing || answered) return;
      answered = true;
      cards.forEach(bt => bt.disabled = true);
      if (i === target) {
        MV.MusicCore.sfx('correct');
        MV.VoiceCore.setPose('happy');
        correct++; wrong = 0;
        renderProgress();
        MV.VoiceCore.say(pick(MV.lines.timbre.correct), { done: () => {
          if (!alive()) return;
          if (correct >= C.correctToPass) {
            MV.VoiceCore.say(MV.lines.timbre.done, { done: () => { if (!alive()) return; setTimeout(() => celebrate(lv), 400); } });
          } else { round++; setTimeout(() => { if (alive()) buildRound(); }, 450); }
        }});
      } else {
        MV.MusicCore.sfx('wrong');
        MV.VoiceCore.setPose('comfort');
        wrong++;
        const stumble = wrong >= 2;
        if (stumble) wrong = 0;
        if (stumble) MV.VoiceCore.setPose('curious');
        MV.VoiceCore.say((stumble ? pick(MV.lines.stumble.timbre) + ' ' : '') + pick(MV.lines.timbre.wrong), { done: () => {
          if (!alive()) return;
          setTimeout(() => { if (alive()) buildRound(); }, 400);
        }});
      }
    }

    $('#tb-replay').addEventListener('pointerdown', () => { if (!playing) buildRound(); });
    renderProgress();
    setTimeout(() => { if (alive()) buildRound(); }, 600);
  };

  /* —— 关卡：看谱弹奏（视谱启蒙 · 叔叔大纲第 3 阶：VexFlow 真实五线谱 → 按序点唱名） —— */
  runners.sightread = function (lv, body) {
    const solfa = MV.solfa;
    const pool = [
      [0, 1, 2],          // do re mi
      [0, 2, 4],          // do mi sol
      [4, 2, 0],          // sol mi do
      [0, 1, 2, 3]        // do re mi fa
    ];
    let round = 0, correct = 0, wrong = 0, pos = 0, seq = [];
    const sess = MV._session;
    const alive = () => sess === MV._session;

    body.innerHTML =
      '<div class="stage-panel stage-scene">' +
        '<div class="stage-intro" id="sr-intro">第 1 题 · 看谱弹奏</div>' +
        '<div id="sr-progress"></div>' +
        '<div class="sr-staff" id="sr-staff" style="background:#fffdf7;border-radius:14px;padding:10px;margin:10px auto;max-width:440px;min-height:130px"></div>' +
        '<p class="sr-hint" id="sr-hint" style="text-align:center;font-size:15px;color:#8a7a63;margin:6px 0 10px">谱上越高，音越高——按顺序点出它们！</p>' +
        '<div class="sr-keys" id="sr-keys" style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;max-width:440px;margin:0 auto"></div>' +
      '</div>';

    const intro = $('#sr-intro');
    const progBox = $('#sr-progress');
    const staffBox = $('#sr-staff');
    const hint = $('#sr-hint');
    const keyBox = $('#sr-keys');

    function renderProgress() { progBox.replaceChildren(stepDots(3, correct)); }

    function renderStaff(seqArr) {
      const notes = seqArr.map((sIdx, i) => ({ midi: solfa[sIdx].midi, start: i, dur: 1 }));
      staffBox.innerHTML = '';
      try { MV.Staff.render(notes, staffBox, { compact: true }); } catch (e) { staffBox.textContent = '（谱面渲染中…）'; }
    }

    function buildRound() {
      if (!alive()) return;
      seq = pool[Math.min(round, pool.length - 1)];
      pos = 0;
      intro.textContent = '第 ' + (round + 1) + ' 题 · 看谱弹奏（' + seq.length + ' 个音）';
      renderStaff(seq);
      keyBox.innerHTML = '';
      const used = [...new Set(seq)].sort((a, b) => a - b);
      used.forEach(sIdx => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'answer-btn';
        b.innerHTML = '<b style="font-size:20px">' + solfa[sIdx].sol + '</b><small style="display:block;opacity:.85">' + solfa[sIdx].num + '</small>';
        b.style.minWidth = '64px';
        b.style.minHeight = '56px';
        b.addEventListener('pointerdown', () => tap(sIdx));
        keyBox.appendChild(b);
      });
      hint.textContent = '第 1 个音：看看谱上第一个音符在哪个位置？';
    }

    function tap(sIdx) {
      if (!alive() || pos >= seq.length) return;
      if (sIdx === seq[pos]) {
        MV.MusicCore.sfx('correct');
        MV.VoiceCore.setPose('happy');
        MV.MusicCore.playMidi(solfa[sIdx].midi, { dur: .4, inst: 'piano' });
        pos++;
        if (pos >= seq.length) {
          correct++; wrong = 0;
          renderProgress();
          hint.textContent = '弹对啦！听——你弹的旋律！';
          const notes = seq.map((s, i) => ({ midi: solfa[s].midi, start: i, dur: .8 }));
          MV.MusicCore.playSequence(notes, { bpm: 80, inst: 'piano' });
          MV.VoiceCore.say(pick(MV.lines.sightread.correct), { done: () => {
            if (!alive()) return;
            if (correct >= C.correctToPass) {
              MV.VoiceCore.say(MV.lines.sightread.done, { done: () => { if (!alive()) return; setTimeout(() => celebrate(lv), 400); } });
            } else { round++; setTimeout(() => { if (alive()) buildRound(); }, 500); }
          }});
        } else {
          hint.textContent = '第 ' + (pos + 1) + ' 个音：谱上第 ' + (pos + 1) + ' 个音符在哪儿？';
        }
      } else {
        MV.MusicCore.sfx('wrong');
        MV.VoiceCore.setPose('comfort');
        wrong++;
        const stumble = wrong >= 2;
        if (stumble) wrong = 0;
        if (stumble) MV.VoiceCore.setPose('curious');
        MV.VoiceCore.say((stumble ? pick(MV.lines.stumble.sightread) + ' ' : '') + pick(MV.lines.sightread.wrong), {});
      }
    }

    renderProgress();
    buildRound();
  };

  /* —— 关卡：节奏接龙（走=四分/跑=八分 · 叔叔大纲第 4 阶） —— */
  runners.rhythmchain = function (lv, body) {
    const patterns = [
      { id: 'walk',    label: '走 · 走 · 走',      notes: [{ midi: 60, start: 0, dur: 1 }, { midi: 60, start: 1, dur: 1 }, { midi: 60, start: 2, dur: 1 }] },
      { id: 'runwalk', label: '跑 · 跑 · 走',      notes: [{ midi: 60, start: 0, dur: .5 }, { midi: 60, start: .5, dur: .5 }, { midi: 60, start: 1, dur: 1 }] },
      { id: 'run',     label: '跑 · 跑 · 跑 · 跑', notes: [{ midi: 60, start: 0, dur: .5 }, { midi: 60, start: .5, dur: .5 }, { midi: 60, start: 1, dur: .5 }, { midi: 60, start: 1.5, dur: .5 }] }
    ];
    const order = [0, 1, 2];
    let round = 0, correct = 0, wrong = 0, playing = false, answered = false;
    let target = 0, cards = [];
    const sess = MV._session;
    const alive = () => sess === MV._session;

    body.innerHTML =
      '<div class="stage-panel stage-scene">' +
        '<div class="stage-intro" id="rc-intro">第 1 题 · 听节奏，是走还是跑？</div>' +
        '<div id="rc-progress"></div>' +
        '<p class="rc-legend" style="text-align:center;font-size:14px;color:#8a7a63;margin:6px 0 12px">走 = 一拍一步 ｜ 跑 = 半拍一步（快一倍）</p>' +
        '<div class="rc-options" id="rc-options" style="display:flex;flex-direction:column;gap:12px;max-width:360px;margin:0 auto"></div>' +
        '<div class="compose-actions" style="justify-content:center">' +
          '<button class="btn btn-ghost" id="rc-replay" type="button">再听一次</button>' +
        '</div>' +
      '</div>';

    const intro = $('#rc-intro');
    const progBox = $('#rc-progress');
    const optBox = $('#rc-options');

    function renderProgress() { progBox.replaceChildren(stepDots(3, correct)); }

    function playPattern(idx) {
      MV.MusicCore.playSequence(patterns[idx].notes.map(n => ({ ...n })), {
        bpm: 80, inst: 'piano',
        onEnd: () => { if (!alive()) return; playing = false; cards.forEach(bt => bt.disabled = false); }
      });
    }

    function buildRound() {
      if (!alive()) return;
      answered = false;
      playing = true;
      target = order[Math.min(round, order.length - 1)];
      intro.textContent = '第 ' + (round + 1) + ' 题 · 听节奏，它像走还是跑？';
      optBox.innerHTML = '';
      cards = [];
      patterns.forEach((p, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'answer-btn';
        b.innerHTML = '<b style="font-size:19px">' + p.label + '</b><small style="display:block;opacity:.85">' + (i === 0 ? '稳稳地走' : i === 1 ? '快一步慢一步' : '快快地跑') + '</small>';
        b.style.minHeight = '58px';
        b.addEventListener('pointerdown', () => answer(i));
        optBox.appendChild(b);
        cards.push(b);
      });
      playPattern(target);
    }

    function answer(i) {
      if (!alive() || playing || answered) return;
      answered = true;
      cards.forEach(bt => bt.disabled = true);
      if (i === target) {
        MV.MusicCore.sfx('correct');
        MV.VoiceCore.setPose('happy');
        correct++; wrong = 0;
        renderProgress();
        MV.VoiceCore.say(pick(MV.lines.rhythmchain.correct), { done: () => {
          if (!alive()) return;
          if (correct >= C.correctToPass) {
            MV.VoiceCore.say(MV.lines.rhythmchain.done, { done: () => { if (!alive()) return; setTimeout(() => celebrate(lv), 400); } });
          } else { round++; setTimeout(() => { if (alive()) buildRound(); }, 450); }
        }});
      } else {
        MV.MusicCore.sfx('wrong');
        MV.VoiceCore.setPose('comfort');
        wrong++;
        const stumble = wrong >= 2;
        if (stumble) wrong = 0;
        if (stumble) MV.VoiceCore.setPose('curious');
        MV.VoiceCore.say((stumble ? pick(MV.lines.stumble.rhythmchain) + ' ' : '') + pick(MV.lines.rhythmchain.wrong), { done: () => {
          if (!alive()) return;
          setTimeout(() => { if (alive()) buildRound(); }, 400);
        }});
      }
    }

    $('#rc-replay').addEventListener('pointerdown', () => { if (!playing) buildRound(); });
    renderProgress();
    setTimeout(() => { if (alive()) buildRound(); }, 600);
  };

  /* —— 关卡：音程梯子（两音距离=台阶 · 叔叔大纲第 5 阶） —— */
  runners.interval = function (lv, body) {
    const pairs = [
      { a: 60, b: 67, gap: 5 },   // do→sol 5 级
      { a: 60, b: 64, gap: 3 },   // do→mi 3 级
      { a: 60, b: 62, gap: 2 },   // do→re 2 级
      { a: 67, b: 60, gap: 5 }    // sol→do 5 级（下行）
    ];
    const order = [0, 2, 1];      // 5→2→3 先宽后严
    let round = 0, correct = 0, wrong = 0, playing = false, answered = false;
    let target = 0, cards;
    const sess = MV._session;
    const alive = () => sess === MV._session;

    body.innerHTML =
      '<div class="stage-panel stage-scene">' +
        '<div class="stage-intro" id="iv-intro">第 1 题 · 数音程台阶</div>' +
        '<div id="iv-progress"></div>' +
        '<p class="iv-legend" style="text-align:center;font-size:15px;color:#8a7a63;margin:6px 0 12px">两个音之间隔了几级台阶？用耳朵数一数</p>' +
        '<div class="iv-options" id="iv-options" style="display:flex;flex-wrap:wrap;justify-content:center;gap:12px;max-width:380px;margin:0 auto"></div>' +
        '<div class="compose-actions" style="justify-content:center">' +
          '<button class="btn btn-ghost" id="iv-replay" type="button">再听一次</button>' +
        '</div>' +
      '</div>';

    const intro = $('#iv-intro');
    const progBox = $('#iv-progress');
    const optBox = $('#iv-options');

    function renderProgress() { progBox.replaceChildren(stepDots(3, correct)); }

    function playPair() {
      const p = pairs[target];
      MV.MusicCore.playPair(p.a, p.b, { gap: .95, onDone: () => {
        if (!alive()) return;
        playing = false;
        cards.forEach(bt => bt.disabled = false);
      }});
    }

    function buildRound() {
      if (!alive()) return;
      answered = false;
      playing = true;
      target = order[Math.min(round, order.length - 1)];
      intro.textContent = '第 ' + (round + 1) + ' 题 · 数数它们隔了几级台阶';
      optBox.innerHTML = '';
      cards = [];
      [2, 3, 4, 5].forEach(g => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'answer-btn';
        b.innerHTML = '<b style="font-size:22px">' + g + '</b><small style="display:block;opacity:.85">级台阶</small>';
        b.style.minWidth = '72px';
        b.style.minHeight = '60px';
        b.addEventListener('pointerdown', () => answer(g));
        optBox.appendChild(b);
        cards.push(b);
      });
      playPair();
    }

    function answer(g) {
      if (!alive() || playing || answered) return;
      answered = true;
      cards.forEach(bt => bt.disabled = true);
      if (g === pairs[target].gap) {
        MV.MusicCore.sfx('correct');
        MV.VoiceCore.setPose('happy');
        correct++; wrong = 0;
        renderProgress();
        MV.VoiceCore.say(pick(MV.lines.interval.correct), { done: () => {
          if (!alive()) return;
          if (correct >= C.correctToPass) {
            MV.VoiceCore.say(MV.lines.interval.done, { done: () => { if (!alive()) return; setTimeout(() => celebrate(lv), 400); } });
          } else { round++; setTimeout(() => { if (alive()) buildRound(); }, 450); }
        }});
      } else {
        MV.MusicCore.sfx('wrong');
        MV.VoiceCore.setPose('comfort');
        wrong++;
        const stumble = wrong >= 2;
        if (stumble) wrong = 0;
        if (stumble) MV.VoiceCore.setPose('curious');
        MV.VoiceCore.say((stumble ? pick(MV.lines.stumble.interval) + ' ' : '') + pick(MV.lines.interval.wrong), { done: () => {
          if (!alive()) return;
          setTimeout(() => { if (alive()) buildRound(); }, 400);
        }});
      }
    }

    $('#iv-replay').addEventListener('pointerdown', () => { if (!playing) buildRound(); });
    renderProgress();
    setTimeout(() => { if (alive()) buildRound(); }, 600);
  };

  /* —— 关卡：回声谷（节奏回声 · 奥尔夫身体回应 · 判拍） —— */
  runners.echo = function (lv, body) {
    const pattern = 'x-x-x-x-';                    // 走停走停 × 4
    const bpm = 88;
    const win = C.drumWindowMs / 1000;
    let count = 0, correct = 0, wrong = 0, hitCount = 0, soundBeats = 0, centers = [], hitIdx, active = false;
    const sess = MV._session;
    const alive = () => sess === MV._session;

    body.innerHTML =
      '<div class="stage-panel">' +
        '<div class="stage-intro">回声谷 · 听节奏，拍回来</div>' +
        '<div id="ec-progress"></div>' +
        '<p class="ec-status" id="ec-status" style="text-align:center;font-size:15px;color:#8a7a63;margin:8px 0">先听，鼓点落下时拍鼓面</p>' +
        '<div class="drum-pad" id="ec-pad" role="button" tabindex="0" aria-label="大鼓，拍这里">' +
          '<span class="drum-label" id="ec-label">听</span>' +
        '</div>' +
        '<div class="compose-actions" style="justify-content:center">' +
          '<button class="btn btn-gold" id="ec-start" type="button">开始</button>' +
        '</div>' +
        '<p class="staff-note">每轮命中六成，就算跟上啦！</p>' +
      '</div>';

    const progBox = $('#ec-progress');
    const pad = $('#ec-pad');
    const label = $('#ec-label');
    const statusEl = $('#ec-status');
    soundBeats = [...pattern].filter(v => v === 'x').length;

    function renderProgress() { progBox.replaceChildren(stepDots(3, correct)); }

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
      if (best >= 0) { hitIdx.add(best); hitCount++; MV.MusicCore.sfx('tap'); }
    }

    function run() {
      if (!alive()) return;
      count++;
      hitCount = 0; hitIdx = new Set(); centers = []; active = false;
      $('#ec-start').disabled = true;
      statusEl.textContent = '第 ' + count + ' 轮 · 跟着拍';
      label.textContent = '走';
      MV.MusicCore.countIn({ bpm, onDone: () => {
        if (!alive()) return;
        active = true;
        MV.MusicCore.playRhythm(pattern, {
          bpm,
          onBeat: (i, v) => {
            if (!alive()) return;
            if (v === 'x') { label.textContent = '走'; centers.push(MV.MusicCore.contextNow()); pad.classList.add('beat'); setTimeout(() => pad.classList.remove('beat'), 200); }
            else label.textContent = '停';
          },
          onDone: finish
        });
      }});
    }

    function finish() {
      if (!alive()) return;
      active = false;
      const rate = hitCount / soundBeats;
      if (rate >= C.drumHitRate) {
        correct++; wrong = 0;
        renderProgress();
        MV.VoiceCore.say(pick(MV.lines.echo.correct), { done: () => {
          if (!alive()) return;
          if (correct >= C.correctToPass) {
            MV.VoiceCore.say(MV.lines.echo.done, { done: () => { if (!alive()) return; setTimeout(() => celebrate(lv), 400); } });
          } else { $('#ec-start').disabled = false; statusEl.textContent = '跟上了！再来一轮'; }
        }});
      } else {
        MV.MusicCore.sfx('wrong');
        MV.VoiceCore.setPose('comfort');
        wrong++;
        const stumble = wrong >= 2;
        if (stumble) wrong = 0;
        if (stumble) MV.VoiceCore.setPose('curious');
        MV.VoiceCore.say((stumble ? pick(MV.lines.stumble.echo) + ' ' : '') + pick(MV.lines.echo.wrong), { done: () => {
          if (!alive()) return;
          $('#ec-start').disabled = false;
          statusEl.textContent = '再试一轮，跟着鼓点拍';
        }});
      }
    }

    pad.addEventListener('pointerdown', () => tap(MV.MusicCore.contextNow()));
    $('#ec-start').addEventListener('pointerdown', run);
    renderProgress();
    setTimeout(() => { if (alive()) run(); }, 600);
  };

  /* —— 关卡：十六分赛跑（四分/八分/十六分 选辨） —— */
  runners.sixteenth = function (lv, body) {
    const patterns = [
      { label: '走 · 走 · 走',          desc: '稳稳地走',   notes: [{ midi: 60, start: 0, dur: 1 }, { midi: 60, start: 1, dur: 1 }, { midi: 60, start: 2, dur: 1 }] },
      { label: '跑 · 跑 · 跑 · 跑',      desc: '小跑',       notes: [{ midi: 60, start: 0, dur: .5 }, { midi: 60, start: .5, dur: .5 }, { midi: 60, start: 1, dur: .5 }, { midi: 60, start: 1.5, dur: .5 }] },
      { label: '快快跑 × 8',            desc: '飞快地跑',    notes: Array.from({ length: 8 }, (_, i) => ({ midi: 60, start: i * .25, dur: .25 })) }
    ];
    const order = [0, 1, 2];
    let round = 0, correct = 0, wrong = 0, playing = false, answered = false;
    let target = 0, cards = [];
    const sess = MV._session;
    const alive = () => sess === MV._session;

    body.innerHTML =
      '<div class="stage-panel stage-scene">' +
        '<div class="stage-intro" id="st-intro">第 1 题 · 走、跑，还是快快跑？</div>' +
        '<div id="st-progress"></div>' +
        '<p class="st-legend" style="text-align:center;font-size:14px;color:#8a7a63;margin:6px 0 12px">走=四分 ｜ 跑=八分 ｜ 快快跑=十六分</p>' +
        '<div class="st-options" id="st-options" style="display:flex;flex-direction:column;gap:12px;max-width:360px;margin:0 auto"></div>' +
        '<div class="compose-actions" style="justify-content:center">' +
          '<button class="btn btn-ghost" id="st-replay" type="button">再听一次</button>' +
        '</div>' +
      '</div>';

    const intro = $('#st-intro');
    const progBox = $('#st-progress');
    const optBox = $('#st-options');

    function renderProgress() { progBox.replaceChildren(stepDots(3, correct)); }

    function playPattern(idx) {
      MV.MusicCore.playSequence(patterns[idx].notes.map(n => ({ ...n })), {
        bpm: 80, inst: 'piano',
        onEnd: () => { if (!alive()) return; playing = false; cards.forEach(bt => bt.disabled = false); }
      });
    }

    function buildRound() {
      if (!alive()) return;
      answered = false;
      playing = true;
      target = order[Math.min(round, order.length - 1)];
      intro.textContent = '第 ' + (round + 1) + ' 题 · 它走、跑，还是快快跑？';
      optBox.innerHTML = '';
      cards = [];
      patterns.forEach((p, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'answer-btn';
        b.innerHTML = '<b style="font-size:19px">' + p.label + '</b><small style="display:block;opacity:.85">' + p.desc + '</small>';
        b.style.minHeight = '58px';
        b.addEventListener('pointerdown', () => answer(i));
        optBox.appendChild(b);
        cards.push(b);
      });
      playPattern(target);
    }

    function answer(i) {
      if (!alive() || playing || answered) return;
      answered = true;
      cards.forEach(bt => bt.disabled = true);
      if (i === target) {
        MV.MusicCore.sfx('correct');
        MV.VoiceCore.setPose('happy');
        correct++; wrong = 0;
        renderProgress();
        MV.VoiceCore.say(pick(MV.lines.sixteenth.correct), { done: () => {
          if (!alive()) return;
          if (correct >= C.correctToPass) {
            MV.VoiceCore.say(MV.lines.sixteenth.done, { done: () => { if (!alive()) return; setTimeout(() => celebrate(lv), 400); } });
          } else { round++; setTimeout(() => { if (alive()) buildRound(); }, 450); }
        }});
      } else {
        MV.MusicCore.sfx('wrong');
        MV.VoiceCore.setPose('comfort');
        wrong++;
        const stumble = wrong >= 2;
        if (stumble) wrong = 0;
        if (stumble) MV.VoiceCore.setPose('curious');
        MV.VoiceCore.say((stumble ? pick(MV.lines.stumble.sixteenth) + ' ' : '') + pick(MV.lines.sixteenth.wrong), { done: () => {
          if (!alive()) return;
          setTimeout(() => { if (alive()) buildRound(); }, 400);
        }});
      }
    }

    $('#st-replay').addEventListener('pointerdown', () => { if (!playing) buildRound(); });
    renderProgress();
    setTimeout(() => { if (alive()) buildRound(); }, 600);
  };

  /* —— 关卡：彩虹和声（单音 vs 和弦 · 手拉手心智模型） —— */
  runners.rainbow = function (lv, body) {
    const order = [1, 0, 1, 0];                    // 0=单音 1=和弦（先宽后严）
    let round = 0, correct = 0, wrong = 0, playing = false, answered = false;
    let target = 0, cards;
    const sess = MV._session;
    const alive = () => sess === MV._session;

    body.innerHTML =
      '<div class="stage-panel stage-scene">' +
        '<div class="stage-intro" id="rb-intro">第 1 题 · 一个人，还是手拉手？</div>' +
        '<div id="rb-progress"></div>' +
        '<p class="rb-legend" style="text-align:center;font-size:15px;color:#8a7a63;margin:6px 0 12px">一个音像一个人唱歌；几个音手拉手，声音就变厚啦</p>' +
        '<div class="rb-options" id="rb-options" style="display:flex;justify-content:center;gap:14px;max-width:360px;margin:0 auto"></div>' +
        '<div class="compose-actions" style="justify-content:center">' +
          '<button class="btn btn-ghost" id="rb-replay" type="button">再听一次</button>' +
        '</div>' +
      '</div>';

    const intro = $('#rb-intro');
    const progBox = $('#rb-progress');
    const optBox = $('#rb-options');

    function renderProgress() { progBox.replaceChildren(stepDots(3, correct)); }

    function play() {
      const notes = target === 1
        ? [{ midi: 60, start: 0, dur: 1.2 }, { midi: 64, start: 0, dur: 1.2 }, { midi: 67, start: 0, dur: 1.2 }]
        : [{ midi: 60, start: 0, dur: 1.2 }];
      MV.MusicCore.playSequence(notes, { bpm: 70, inst: 'piano', onEnd: () => {
        if (!alive()) return;
        playing = false;
        cards.forEach(bt => bt.disabled = false);
      }});
    }

    function buildRound() {
      if (!alive()) return;
      answered = false;
      playing = true;
      target = order[Math.min(round, order.length - 1)];
      intro.textContent = '第 ' + (round + 1) + ' 题 · 一个音，还是手拉手？';
      optBox.innerHTML = '';
      cards = [];
      [['1', '一个人', '清清地唱'], ['3', '手拉手', '声音变厚了']].forEach((o, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'answer-btn';
        b.innerHTML = '<b style="font-size:22px">' + o[0] + '</b><small style="display:block;opacity:.85">' + o[1] + '</small>';
        b.style.minWidth = '110px'; b.style.minHeight = '64px';
        b.addEventListener('pointerdown', () => answer(i === 0 ? 0 : 1));
        optBox.appendChild(b);
        cards.push(b);
      });
      play();
    }

    function answer(v) {
      if (!alive() || playing || answered) return;
      answered = true;
      cards.forEach(bt => bt.disabled = true);
      if (v === target) {
        MV.MusicCore.sfx('correct');
        MV.VoiceCore.setPose('happy');
        correct++; wrong = 0;
        renderProgress();
        MV.VoiceCore.say(pick(MV.lines.rainbow.correct), { done: () => {
          if (!alive()) return;
          if (correct >= C.correctToPass) {
            MV.VoiceCore.say(MV.lines.rainbow.done, { done: () => { if (!alive()) return; setTimeout(() => celebrate(lv), 400); } });
          } else { round++; setTimeout(() => { if (alive()) buildRound(); }, 450); }
        }});
      } else {
        MV.MusicCore.sfx('wrong');
        MV.VoiceCore.setPose('comfort');
        wrong++;
        const stumble = wrong >= 2;
        if (stumble) wrong = 0;
        if (stumble) MV.VoiceCore.setPose('curious');
        MV.VoiceCore.say((stumble ? pick(MV.lines.stumble.rainbow) + ' ' : '') + pick(MV.lines.rainbow.wrong), { done: () => {
          if (!alive()) return;
          setTimeout(() => { if (alive()) buildRound(); }, 400);
        }});
      }
    }

    $('#rb-replay').addEventListener('pointerdown', () => { if (!playing) buildRound(); });
    renderProgress();
    setTimeout(() => { if (alive()) buildRound(); }, 600);
  };

  /* —— 关卡：和声找朋友（三和弦听辨） —— */
  runners.chordbud = function (lv, body) {
    const chords = [
      { name: '明亮彩虹', notes: [{ midi: 60, start: 0, dur: 1.1 }, { midi: 64, start: 0, dur: 1.1 }, { midi: 67, start: 0, dur: 1.1 }] },
      { name: '温柔月光', notes: [{ midi: 60, start: 0, dur: 1.1 }, { midi: 65, start: 0, dur: 1.1 }, { midi: 69, start: 0, dur: 1.1 }] },
      { name: '星光闪耀', notes: [{ midi: 67, start: 0, dur: 1.1 }, { midi: 71, start: 0, dur: 1.1 }, { midi: 74, start: 0, dur: 1.1 }] }
    ];
    const order = [0, 1, 2];
    let round = 0, correct = 0, wrong = 0, playing = false, answered = false;
    let target = 0, cards;
    const sess = MV._session;
    const alive = () => sess === MV._session;

    body.innerHTML =
      '<div class="stage-panel stage-scene">' +
        '<div class="stage-intro" id="cb-intro">第 1 题 · 哪个音群手拉手？</div>' +
        '<div id="cb-progress"></div>' +
        '<p class="cb-legend" style="text-align:center;font-size:15px;color:#8a7a63;margin:6px 0 12px">三个音手拉手，它像彩虹、月光，还是星光？</p>' +
        '<div class="cb-options" id="cb-options" style="display:flex;flex-direction:column;gap:12px;max-width:340px;margin:0 auto"></div>' +
        '<div class="compose-actions" style="justify-content:center">' +
          '<button class="btn btn-ghost" id="cb-replay" type="button">再听一次</button>' +
        '</div>' +
      '</div>';

    const intro = $('#cb-intro');
    const progBox = $('#cb-progress');
    const optBox = $('#cb-options');

    function renderProgress() { progBox.replaceChildren(stepDots(3, correct)); }

    function play() {
      MV.MusicCore.playSequence(chords[target].notes.map(n => ({ ...n })), { bpm: 70, inst: 'piano', onEnd: () => {
        if (!alive()) return;
        playing = false;
        cards.forEach(bt => bt.disabled = false);
      }});
    }

    function buildRound() {
      if (!alive()) return;
      answered = false;
      playing = true;
      target = order[Math.min(round, order.length - 1)];
      intro.textContent = '第 ' + (round + 1) + ' 题 · 哪个音群手拉手？';
      optBox.innerHTML = '';
      cards = [];
      chords.forEach((c, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'answer-btn';
        b.innerHTML = '<b style="font-size:19px">' + c.name + '</b><small style="display:block;opacity:.85">' + (i === 0 ? 'do mi sol' : i === 1 ? 'do fa la' : 'sol si re') + '</small>';
        b.style.minHeight = '58px';
        b.addEventListener('pointerdown', () => answer(i));
        optBox.appendChild(b);
        cards.push(b);
      });
      play();
    }

    function answer(i) {
      if (!alive() || playing || answered) return;
      answered = true;
      cards.forEach(bt => bt.disabled = true);
      if (i === target) {
        MV.MusicCore.sfx('correct');
        MV.VoiceCore.setPose('happy');
        correct++; wrong = 0;
        renderProgress();
        MV.VoiceCore.say(pick(MV.lines.chordbud.correct), { done: () => {
          if (!alive()) return;
          if (correct >= C.correctToPass) {
            MV.VoiceCore.say(MV.lines.chordbud.done, { done: () => { if (!alive()) return; setTimeout(() => celebrate(lv), 400); } });
          } else { round++; setTimeout(() => { if (alive()) buildRound(); }, 450); }
        }});
      } else {
        MV.MusicCore.sfx('wrong');
        MV.VoiceCore.setPose('comfort');
        wrong++;
        const stumble = wrong >= 2;
        if (stumble) wrong = 0;
        if (stumble) MV.VoiceCore.setPose('curious');
        MV.VoiceCore.say((stumble ? pick(MV.lines.stumble.chordbud) + ' ' : '') + pick(MV.lines.chordbud.wrong), { done: () => {
          if (!alive()) return;
          setTimeout(() => { if (alive()) buildRound(); }, 400);
        }});
      }
    }

    $('#cb-replay').addEventListener('pointerdown', () => { if (!playing) buildRound(); });
    renderProgress();
    setTimeout(() => { if (alive()) buildRound(); }, 600);
  };

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
        MV.VoiceCore.setPose('happy'); // F-07：旋律田首通开心
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
        gridBox.dataset.inst = inst; // 网格颜色随音色变化（绿=小鸟/金=风铃/蓝=溪水/红=木琴）
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
      const beforeStage = stageNum(); // 通关前形态档（聚类进度）
      App.state.completed[lv.id] = true;
      addPoints(C.pointsPerClear);
      MV.VoiceCore.applyGrowth(stageNum());
      // 主动引导下一站：本聚类全亮后回地图晓声带路
      if (lv.loc) {
        const loc = MV.locations.find(x => x.id === lv.loc);
        if (loc && loc.levels.every(id => App.state.completed[id])) App._pendingNext = lv.loc;
      }
      // 小鹿乱撞故事线：跨过形态阈值时挂起标记，回地图由晓声说出（仅通关瞬间触发一次，刷新不重放）
      const afterStage = stageNum();
      if (beforeStage < 4 && afterStage >= 4) App._pendingStory = 'fawn';
      else if (beforeStage < 5 && afterStage >= 5) App._pendingStory = 'deer';
    }
    mountXs('celebrate-xs', { exp: 'happy', float: true, breathe: true, pose: 'celebrate', poseOpts: { sticky: true } });
    $('#celebrate-title').textContent = lv.title + ' · 通关啦！';
    const line = firstClear ? pick(MV.lines.grow.lit)
      : (extra && extra.line ? extra.line : pick(MV.lines.celebrate.clear));
    $('#celebrate-line').textContent = line;
    $('#celebrate-points').textContent = firstClear ? ('积分 +' + C.pointsPerClear) : '再玩一次也真棒！';
    spawnConfetti(26);
    MV.VoiceCore.say(line);
    // 主题曲：全部关卡点亮后自动响起（旋律/歌词由你谱好填进 config.themeSong）
    const song = MV.config.themeSong;
    const songBox = $('#celebrate-song');
    if (songBox) {
      if (stageNum() >= 5 && song) { // 全部 5 聚类点亮后才响主题曲
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
  /* 作品播放完 → 晓声鼓励语（给山里小朋友） */
  function showEncourage() {
    const ov = $('#encourage-overlay');
    if (!ov) return;
    mountXs('encourage-xs', { exp: 'happy', breathe: true, pose: 'happy' });
    const encText = pick(MV.lines.encourage);
    $('#encourage-text').textContent = encText;
    MV.VoiceCore.sayVoice('enc' + (1 + Math.floor(Math.random() * 3)), encText);
    ov.hidden = false;
    $('#encourage-close').onclick = () => { ov.hidden = true; };
  }

  /* ---------------- 问问晓声（本地规则问答 · 乐理与陪伴） ---------------- */
  function openQa() {
    const ov = $('#qa-overlay');
    if (!ov) return;
    if (!ov.dataset.booted) {
      ov.dataset.booted = '1';
      mountXs('qa-xs', { exp: 'happy', breathe: true });
      $('#qa-close').onclick = () => { ov.hidden = true; };
      $('#qa-send').addEventListener('pointerdown', sendQa);
      $('#qa-mic').addEventListener('pointerdown', toggleMic);
      $('#qa-input').addEventListener('keydown', e => { if (e.key === 'Enter') sendQa(); });
      addQa('晓声', '你好呀！问我音高、节奏、五线谱，或者下一步去哪，都可以～');
    }
    ov.hidden = false;
    setTimeout(() => { const inp = $('#qa-input'); if (inp) inp.focus(); }, 60);
  }
  function addQa(who, text) {
    const chat = $('#qa-chat');
    if (!chat) return;
    const b = document.createElement('div');
    b.className = 'qa-bubble ' + (who === '晓声' ? 'xs' : 'me');
    b.textContent = text;
    chat.appendChild(b);
    chat.scrollTop = chat.scrollHeight;
  }
  let qaHistory = [];
  let recog = null;
  /* 语音播报（浏览器内置中文语音 · 白小纯同款） */
  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.slice(0, 120));
      u.lang = 'zh-CN'; u.rate = 1.02; u.pitch = 1.15;
      const vs = window.speechSynthesis.getVoices();
      const zh = vs.find(v => /zh[-_]CN/i.test(v.lang));
      if (zh) u.voice = zh;
      window.speechSynthesis.speak(u);
    } catch (e) { /* noop */ }
  }
  /* 语音提问（webkitSpeechRecognition，Chrome/Edge） */
  function toggleMic() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { addQa('晓声', '这个浏览器还不支持语音输入，用 Chrome 或 Edge 就可以啦。'); return; }
    if (recog && recog.listening) { recog.stop(); return; }
    recog = new SR();
    recog.lang = 'zh-CN';
    recog.interimResults = false;
    recog.onresult = e => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('');
      $('#qa-input').value = t;
      sendQa();
    };
    recog.onerror = () => {};
    try { recog.start(); } catch (e) { /* noop */ }
  }
  async function sendQa() {
    const inp = $('#qa-input');
    const q = (inp.value || '').trim();
    if (!q) return;
    addQa('me', q);
    inp.value = '';
    // ① 真实 AI（Cloudflare 函数代理；未配 key 返回 null → 回落本地规则）
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, history: qaHistory.slice(-6) })
      });
      if (r.ok) {
        const j = await r.json();
        if (j.reply) {
          const ans = j.reply;
          qaHistory.push({ role: 'user', content: q });
          qaHistory.push({ role: 'assistant', content: ans });
          addQa('晓声', ans);
          speak(ans);
          return;
        }
      }
    } catch (e) { /* 回落本地 */ }
    // ② 本地规则回落（离线可用）
    let ans = null;
    for (const item of (MV.lines.qa || [])) {
      if (item.keys.some(k => q.indexOf(k) >= 0)) { ans = item.a; break; }
    }
    if (!ans) ans = '这个问题我还不会呢。试试问我：音高、节奏、五线谱，或者“下一关去哪”。';
    addQa('晓声', ans);
    speak(ans);
  }

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
        MV.MusicCore.playSequence(w.notes, { bpm: w.bpm, inst: w.inst, onEnd: () => {
          setTimeout(() => showEncourage(), 350); // 播完晓声说鼓励话
        } });
      });
      $('[data-staff="' + i + '"]', card).addEventListener('pointerdown', () => openStaff(w));
      $('[data-save="' + i + '"]', card).addEventListener('pointerdown', () => MV.Staff.exportPNG($('[data-work="' + i + '"]', card), w.name || '我的小曲'));
    });
  }

  /* ---------------- 五线谱出口面板 ---------------- */
  function openStaff(piece) {
    const overlay = $('#staff-overlay');
    overlay.hidden = false;
    mountXs('staff-xs', { exp: 'happy', breathe: true, pose: 'happy' });
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
