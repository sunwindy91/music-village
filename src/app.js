/**
 * ============================================================
 *  app.js v0.2 · 大山主题版（合并点）
 * ============================================================
 *  山路寻宝地图 / 3 关卡（观察·配对·排序）/ 山灵表情 / 音效 /
 *  逼近式引导 / 开发者模式 / 孩子化反馈
 * ============================================================
 */
(function () {
  'use strict';

  const $ = function (id) { return document.getElementById(id); };
  const sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  let currentMap = null;
  let currentLevel = null;
  let levelIdx = 0;
  let speedIdx = 1;
  let playing = false;
  let spiritTimer = null;

  // —— 进度（localStorage 本地存储，无账号零收集）——
  const SAVE_KEY = 'mv_progress_v1';
  let save = { score: 0, medals: [], doneLevels: {} };
  try { save = Object.assign(save, JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')); } catch (e) {}
  function persist() { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }
  function addScore(n) { save.score += n; persist(); refreshCrumb(); }
  function awardMedal(name) {
    if (save.medals.indexOf(name) === -1) save.medals.push(name);
    persist(); refreshCrumb();
  }
  function markLevelDone(id) { save.doneLevels[id] = true; persist(); }
  function isLevelDone(id) { return !!save.doneLevels[id]; }
  function refreshCrumb() {
    const m = currentMap ? currentMap.name : '大山地图';
    const s = '⭐' + save.score + (save.medals.length ? ' · 🏅' + save.medals.length : '');
    $('crumb').textContent = m + ' · ' + s;
  }

  // 鼓励语池（孩子化·随机积极反馈）
  const PRAISE = ['太棒了！', '你好厉害！', '对啦！', '真聪明！', '哇，答对啦！', '好样的！'];
  const CHEER = ['加油！再来一个～', '你越来越棒啦！', '马上就好啦！', '坚持住，快成功啦！'];

  // ================= 山路寻宝地图 =================
  function renderTrailMap() {
    const svg = $('trailSvg');
    const places = [
      { id: 'sound-valley', name: '声音山谷', stage: '听·唱·动', emoji: '🏞️', x: 170, y: 470 },
      { id: 'scale-valley', name: '音阶山谷', stage: '音高·音阶', emoji: '⛰️', x: 340, y: 372 },
      { id: 'rhythm-path', name: '节奏小路', stage: '时值·节拍', emoji: '🛤️', x: 510, y: 300 },
      { id: 'chord-garden', name: '和弦花园', stage: '三和弦', emoji: '🌸', x: 665, y: 208 },
      { id: 'melody-meadow', name: '旋律草原', stage: '小旋律', emoji: '🌾', x: 800, y: 120 },
    ];

    let s = '';
    const roadD = 'M 170 500 C 240 470 280 430 340 372 C 420 320 450 330 510 300 C 580 265 610 245 665 208 C 720 170 760 145 800 120';
    s += '<path class="road-shadow" d="' + roadD + '"/>';
    s += '<path class="road" d="' + roadD + '"/>';
    // 起点小屋
    s += '<g><circle cx="150" cy="515" r="16" fill="#c98a5e" stroke="#fff" stroke-width="3"/><text x="150" y="520" font-size="16" text-anchor="middle">🏡</text></g>';

    // 自然装饰：树 / 溪流 / 花 / 山顶云
    s += '<g opacity=".9">' +
      '<circle cx="80" cy="430" r="24" fill="#5e9c7c"/><circle cx="70" cy="425" r="14" fill="#7fc48d"/>' +
      '<rect x="76" y="448" width="8" height="20" rx="3" fill="#c98a5e"/>' +
      '<circle cx="60" cy="462" r="16" fill="#5e9c7c"/><rect x="57" y="474" width="7" height="16" rx="3" fill="#c98a5e"/>' +
      '<circle cx="820" cy="350" r="20" fill="#5e9c7c"/><rect x="817" y="366" width="7" height="16" rx="3" fill="#c98a5e"/>' +
      '</g>';
    s += '<path d="M 60 500 Q 100 512 170 496 Q 230 486 300 498" stroke="#6fb7e8" stroke-width="7" fill="none" stroke-linecap="round" opacity=".45"/>';
    s += '<g fill="#ffd166" opacity=".85">' +
      '<circle cx="260" cy="452" r="4"/><circle cx="270" cy="458" r="3"/>' +
      '<circle cx="620" cy="470" r="4"/><circle cx="750" cy="430" r="3.4"/>' +
      '<circle cx="700" cy="470" r="3"/></g>' +
      '<g fill="#e76f8a" opacity=".8">' +
      '<circle cx="290" cy="466" r="3.2"/><circle cx="660" cy="452" r="3.4"/>' +
      '<circle cx="780" cy="415" r="3"/></g>';
    s += '<g opacity=".85"><ellipse cx="800" cy="88" rx="34" ry="12" fill="#fff"/>' +
      '<ellipse cx="788" cy="82" rx="18" ry="11" fill="#fff"/>' +
      '<ellipse cx="814" cy="84" rx="16" ry="9" fill="#fff"/></g>';

    // 地点
    places.forEach(function (p) {
      const m = window.MAPS.find(function (mm) { return mm.id === p.id; });
      if (!m) return;
      const cls = m.status === 'open' ? 'open' : (m.levels.length && isLevelDone(m.levels[0].id) ? 'done' : 'locked');
      s += '<g id="place-' + p.id + '" data-place="' + p.id + '" class="place ' + cls + '">' +
        '<circle class="p-base" cx="' + p.x + '" cy="' + p.y + '" r="34"/>' +
        '<text class="p-emoji" x="' + p.x + '" y="' + (p.y - 2) + '">' + p.emoji + '</text>' +
        '<text class="p-name" x="' + p.x + '" y="' + (p.y + 52) + '">' + p.name + '</text>' +
        '<text class="p-stage" x="' + p.x + '" y="' + (p.y + 68) + '">' + p.stage + '</text>' +
        (m.status === 'open' ? '<text x="' + (p.x + 26) + '" y="' + (p.y - 26) + '" font-size="15">▶</text>' : '') +
        '</g>';
    });
    svg.innerHTML = s;

    svg.querySelectorAll('.place.open').forEach(function (g) {
      g.addEventListener('click', function () {
        const m = window.MAPS.find(function (mm) { return mm.id === g.dataset.place; });
        if (m) enterMap(m);
      });
    });
    svg.querySelectorAll('.place.locked').forEach(function (g) {
      g.addEventListener('click', function () {
        const m = window.MAPS.find(function (mm) { return mm.id === g.dataset.place; });
        spiritSay(m && m.lockedHint ? '🔒 ' + m.lockedHint : '🔒 这片地方还没开启哦');
      });
    });
  }

  // ================= 关卡导航 =================
  function enterMap(m) {
    if (!m.levels.length) { spiritSay('🔧 这里的关卡还在设计呢，先去别的山看看吧～'); return; }
    currentMap = m;
    levelIdx = 0;
    loadLevel();
  }

  function switchLevel(i) {
    if (!currentMap) return;
    if (i < 0 || i >= currentMap.levels.length) return;
    levelIdx = i;
    loadLevel();
  }

  function renderLevelNav() {
    const nav = $('levelNav');
    nav.innerHTML = '';
    currentMap.levels.forEach(function (lv, i) {
      const chip = document.createElement('span');
      chip.className = 'nav-chip' + (i === levelIdx ? ' active' : '') +
        (isLevelDone(lv.id) ? ' done' : '');
      chip.textContent = lv.icon + ' ' + lv.title;
      chip.addEventListener('click', function () { switchLevel(i); });
      nav.appendChild(chip);
    });
  }

  function loadLevel() {
    const lv = currentMap.levels[levelIdx];
    currentLevel = lv;
    $('mapView').classList.add('hidden');
    $('levelView').classList.remove('hidden');
    // 舞台按地图差异化（森林风 / 五线谱风）
    $('stage').className = 'stage ' + (currentMap.id === 'sound-valley' ? 'stage-forest' : 'stage-scale');
    $('levelTitle').textContent = lv.icon + ' ' + lv.title;
    $('levelSub').textContent = currentMap.name + ' · ' +
      (lv.type === 'observe' ? '👀 先看看' : lv.type === 'point' ? '🎯 帮小鸟回家' : lv.type === 'sort' ? '📶 排排队' : lv.type);

    $('kitConcept').textContent = lv.concept;
    $('kitModel').textContent = lv.model;
    $('kitAction').textContent = lv.action;
    $('kitJudge').textContent = lv.judge;
    $('kitFeedback').textContent = lv.feedback;
    $('kitGoal').textContent = lv.goal;

    renderLevelNav();
    refreshCrumb();

    $('listenRow').classList.add('hidden');
    $('roundHud').classList.add('hidden');
    $('devPanel').classList.add('hidden');
    $('devToggle').classList.remove('active');

    if (lv.type === 'point' || lv.type === 'sort' || lv.type === 'highlow' || lv.type === 'tap') {
      $('observeControls').classList.add('hidden');
      $('pointControls').classList.remove('hidden');
      $('pointStartBtn').textContent = lv.type === 'sort' ? '🐦 开始排队' : '🥁 开始';
      if (lv.type === 'sort') drawSortLevel(lv);
      else if (lv.type === 'highlow') drawHighLowLevel(lv);
      else if (lv.type === 'tap') drawTapLevel(lv);
      else drawPointLevel(lv);
      spiritSay(lv.guidance[0]);
    } else {
      $('observeControls').classList.remove('hidden');
      $('pointControls').classList.add('hidden');
      drawStaff(lv);
      renderNotes(lv);
      spiritSay(lv.guidance[0]);
    }
  }

  function goHome() {
    if (window.MusicCore) window.MusicCore.stopAll();
    playing = false;
    currentMap = null;
    currentLevel = null;
    $('levelView').classList.add('hidden');
    $('mapView').classList.remove('hidden');
    spiritSay('回来啦！想去哪座山看看呀？');
    refreshCrumb();
  }

  // ================= 五线谱（观察） =================
  function drawStaff(lv) {
    const svg = $('staffSvg');
    const lineY = [150, 120, 90, 60, 30];
    let s = '';
    lineY.forEach(function (y) {
      s += '<line class="staff-line" x1="40" y1="' + y + '" x2="760" y2="' + y + '"/>';
    });
    s += '<text x="52" y="100" font-size="52" fill="rgba(55,66,59,.5)" text-anchor="middle" font-family="serif">𝄞</text>';
    svg.innerHTML = s;
  }

  function renderNotes(lv) {
    const svg = $('staffSvg');
    const notes = lv.notes;
    const total = notes.length;
    const x0 = 110, gap = (760 - 140) / (total - 1);

    let dots = '', names = '', trail = '';
    const pts = notes.map(function (n, i) {
      return { x: x0 + i * gap, y: window.NOTE_Y[n], midi: n, i: i };
    });

    for (let i = 0; i < pts.length - 1; i++) {
      trail += '<line x1="' + pts[i].x + '" y1="' + pts[i].y + '" x2="' + pts[i + 1].x +
        '" y2="' + pts[i + 1].y + '" stroke="' + window.noteColor(pts[i + 1].midi) +
        '" stroke-width="3" stroke-linecap="round" stroke-dasharray="7 5" opacity=".55"/>';
    }

    pts.forEach(function (p) {
      dots += '<circle class="note-dot" id="dot' + p.i + '" cx="' + p.x + '" cy="' + p.y +
        '" r="11" fill="' + window.noteColor(p.midi) + '" style="opacity:0"/>';
      names += '<text class="note-name" id="nm' + p.i + '" x="' + p.x + '" y="' + (p.y + 34) + '">' +
        (window.NOTE_NAME[p.midi] || p.midi) + '</text>';
    });

    const b0 = pts[0];
    const bird = '<text class="bird" id="birdEl" x="' + b0.x + '" y="' + (b0.y - 14) + '">🐦</text>';
    svg.insertAdjacentHTML('beforeend', trail + dots + names + bird);
    svg.__pts = pts;
  }

  function animateBird(fromX, fromY, toX, toY, dur) {
    return new Promise(function (resolve) {
      const bird = $('birdEl');
      const t0 = performance.now();
      function step(now) {
        const p = Math.min(1, (now - t0) / (dur * 1000));
        const ease = 1 - Math.pow(1 - p, 3);
        bird.setAttribute('x', fromX + (toX - fromX) * ease);
        bird.setAttribute('y', fromY + (toY - fromY) * ease - 14 + Math.sin(p * Math.PI * 3) * 3);
        if (p < 1) requestAnimationFrame(step); else resolve();
      }
      requestAnimationFrame(step);
    });
  }

  function setSpeed(i) {
    speedIdx = i;
    document.querySelectorAll('#observeControls .btn.soft').forEach(function (b, idx) {
      b.style.borderColor = idx === i ? 'var(--forest)' : '';
      b.style.color = idx === i ? 'var(--forest-deep)' : '';
    });
  }

  async function playLevel() {
    if (playing) return;
    const lv = currentLevel;
    if (!lv || lv.type !== 'observe') return;
    playing = true;
    $('playBtn').textContent = '⏳ 播放中…';
    $('playBtn').classList.add('disabled');

    if (window.MusicCore) window.MusicCore._ensureCtx();
    window.MusicCore.startLevel(lv.id, {});

    const svg = $('staffSvg');
    const pts = svg.__pts || [];
    const base = lv.speed[speedIdx] || 1.2;
    const birdEl = $('birdEl');

    pts.forEach(function (p) {
      const d = $('dot' + p.i); if (d) d.style.opacity = 0;
      const n = $('nm' + p.i); if (n) n.classList.remove('lit');
    });
    birdEl.classList.add('show');
    birdEl.setAttribute('x', pts[0].x);
    birdEl.setAttribute('y', pts[0].y - 14);

    spiritSay('仔细看哦～');

    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const prev = i > 0 ? pts[i - 1] : pts[0];
      await animateBird(prev.x, prev.y - 14, p.x, p.y - 14, base * 0.55);

      const d = $('dot' + p.i);
      if (d) {
        d.style.opacity = 1;
        d.style.filter = 'drop-shadow(0 0 8px ' + window.noteColor(p.midi) + ')';
      }
      const n = $('nm' + p.i); if (n) n.classList.add('lit');
      popNote(p.x, p.y - 30);
      window.MusicCore.playNote(p.midi, base * 0.8);
      spiritAvatar('talk');
      await sleep(base * 500);
    }

    pts.forEach(function (p) {
      const d = $('dot' + p.i);
      if (d) { d.style.opacity = 1; d.style.filter = 'drop-shadow(0 0 9px ' + window.noteColor(p.midi) + ')'; }
    });
    spiritAvatar('celebrate');
    if (window.MusicCore && window.MusicCore.sfx) window.MusicCore.sfx.stone();
    spiritSay('看见了吗？落点越高，音就越高！这就是"音高"～');
    toast('🎉 观察完成！记住：高 = 上面，低 = 下面');

    if (!isLevelDone(lv.id)) {
      markLevelDone(lv.id);
      addScore(20);
      awardMedal('👀 观察员');
      toast('⭐ +20 · 🏅 观察员');
    }

    playing = false;
    $('playBtn').textContent = '▶ 再看一遍';
    $('playBtn').classList.remove('disabled');
  }

  function popNote(x, y) {
    const svg = $('staffSvg');
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    el.textContent = '🎵';
    el.setAttribute('x', x); el.setAttribute('y', y);
    el.setAttribute('font-size', '19'); el.setAttribute('text-anchor', 'middle');
    el.classList.add('pop-note');
    svg.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('show'); });
    setTimeout(function () { el.remove(); }, 900);
  }

  // ================= point 玩法（点小鸟回家）=================
  let pt = { round: 0, ok: 0, combo: 0, target: null, locked: false, misses: 0, birds: [] };

  function drawPointLevel(lv) {
    const svg = $('staffSvg');
    svg.innerHTML = '';
    const lineY = [150, 120, 90, 60, 30];
    let s = '';
    lineY.forEach(function (y) {
      s += '<line class="staff-line" x1="40" y1="' + y + '" x2="760" y2="' + y + '"/>';
    });
    s += '<text x="52" y="100" font-size="52" fill="rgba(55,66,59,.5)" text-anchor="middle" font-family="serif">𝄞</text>';

    const notes = lv.notes.slice();
    for (let i = notes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [notes[i], notes[j]] = [notes[j], notes[i]];
    }
    const n = notes.length;
    const x0 = 150, gap = (760 - 300) / (n - 1);

    pt.birds = notes.map(function (midi, i) {
      const x = x0 + i * gap;
      const y = window.NOTE_Y[midi];
      const emoji = (lv.friends && lv.friends[i]) || '🐦';
      s += '<g class="choice-bird hoverable" id="cb' + i + '" data-note="' + midi + '">' +
        '<circle cx="' + x + '" cy="' + (y - 12) + '" r="22" fill="transparent" style="cursor:pointer"/>' +
        '<text x="' + x + '" y="' + (y - 12) + '" font-size="32" text-anchor="middle">' + emoji + '</text>' +
        '<text x="' + x + '" y="' + (y + 30) + '" font-size="12" text-anchor="middle" fill="var(--ink-soft)" style="opacity:.6">' +
        (window.NOTE_NAME[midi] || midi) + '</text></g>';
      return { x: x, y: y, midi: midi, idx: i };
    });
    svg.innerHTML += s;

    svg.onclick = function (ev) {
      const t = ev.target;
      if (t && t.parentNode && t.parentNode.classList && t.parentNode.classList.contains('choice-bird')) {
        const g = t.parentNode;
        handleBirdClick(parseInt(g.dataset.note, 10), g);
      }
    };
  }

  function resetPointUI() {
    pt.round = 0; pt.ok = 0; pt.combo = 0; pt.locked = false; pt.misses = 0;
    $('roundNow').textContent = '1'; $('roundOk').textContent = '0'; $('roundCombo').textContent = '0';
  }

  function startPoint() {
    const lv = currentLevel;
    if (!lv) return;
    if (lv.type === 'sort') { startSort(); return; }
    if (lv.type === 'highlow') { startHighLow(); return; }
    if (lv.type === 'tap') { startTap(); return; }
    if (lv.type !== 'point') return;
    if (window.MusicCore) window.MusicCore._ensureCtx();
    if (window.MusicCore && window.MusicCore.sfx) window.MusicCore.sfx.click();
    resetPointUI();
    $('roundHud').classList.remove('hidden');
    $('listenRow').classList.remove('hidden');
    $('segQ').style.display = '';
    $('okLabel').textContent = '答对';
    $('segCombo').style.display = '';
    pt.birds.forEach(function (b) {
      const g = $('cb' + b.idx);
      if (g) { g.classList.remove('correct', 'wrong'); g.querySelector('text').style.opacity = ''; }
    });
    spiritSay('我来唱第一个音，认真听哦～');
    playRound();
  }

  function pickTarget() {
    const lv = currentLevel;
    let t;
    do { t = lv.notes[Math.floor(Math.random() * lv.notes.length)]; }
    while (t === pt.target && lv.notes.length > 1);
    return t;
  }

  function playRound() {
    const lv = currentLevel;
    pt.locked = false;
    pt.target = pickTarget();
    $('roundNow').textContent = Math.min(pt.round + 1, lv.rounds);
    $('listenBadge').innerHTML = '🎵 听音…';
    setTimeout(function () {
      window.MusicCore.playNote(pt.target, 1.0);
      $('listenBadge').innerHTML = '🎵 点唱得一样高的小鸟！';
    }, 600);
  }

  function handleBirdClick(note, el) {
    if (pt.locked) return;
    const lv = currentLevel;
    pt.locked = true;
    $('listenBadge').innerHTML = '…';

    if (note === pt.target) {
      el.classList.add('correct');
      pt.combo += 1; pt.ok += 1;
      const pts = 10 + Math.min(pt.combo - 1, 3) * 5;
      addScore(pts);
      window.MusicCore.playNote(note, 0.8);
      if (window.MusicCore.sfx) window.MusicCore.sfx.correct();
      spiritAvatar('happy');
      const msg = PRAISE[Math.floor(Math.random() * PRAISE.length)] +
        (pt.combo >= 2 ? '（连击 x' + pt.combo + '）' : '');
      spiritSay(msg + ' 积了 ' + pts + ' 分！');
      toast('🎉 回家成功！+' + pts);
    } else {
      el.classList.add('wrong');
      pt.combo = 0;
      window.MusicCore.playNote(pt.target, 0.9);
      if (window.MusicCore.sfx) window.MusicCore.sfx.wrong();
      spiritAvatar('think');
      // 逼近式引导：提示"高一点/低一点"（不剧透答案）
      let hint = '再听一次～ 想想它站得高不高？';
      if (note < pt.target) hint = '再往上一点～ 它站在更高的地方哦';
      else if (note > pt.target) hint = '再往下一点～ 它站在更低的地方哦';
      pt.misses = (pt.misses || 0) + 1;
      if (pt.misses >= 3) {
        hint = '我来帮你～ 听好了，就是这个音！';
        spiritAvatar('happy');
      }
      spiritSay(hint);
      $('listenBadge').innerHTML = '🎵 再听一次（点下方按钮）';
      setTimeout(function () { el.classList.remove('wrong'); }, 500);
      setTimeout(function () {
        pt.locked = false;
        $('listenBadge').innerHTML = '🎵 点唱得一样高的小鸟！';
      }, 1400);
      return;
    }

    $('roundOk').textContent = pt.ok;
    $('roundCombo').textContent = pt.combo;
    pt.round += 1;
    if (pt.round >= lv.rounds || pt.ok >= lv.passCount) {
      finishPoint();
    } else {
      setTimeout(function () { playRound(); }, 1200);
    }
  }

  function finishPoint() {
    const lv = currentLevel;
    $('listenBadge').innerHTML = '🎉 小鸟们都回家啦！';
    spiritAvatar('celebrate');
    if (window.MusicCore && window.MusicCore.sfx) window.MusicCore.sfx.win();
    spiritSay('太棒了！你听出了 ' + pt.ok + ' 个音高，' + CHEER[Math.floor(Math.random() * CHEER.length)]);
    if (!isLevelDone(lv.id)) {
      markLevelDone(lv.id);
      addScore(30);
      awardMedal('👂 听音小帮手');
      toast('⭐ +30 · 🏅 听音小帮手');
    }
    $('pointStartBtn').textContent = '🎵 再来一轮';
  }

  function replayNote() {
    if (pt.target != null) {
      if (window.MusicCore) window.MusicCore._ensureCtx();
      window.MusicCore.playNote(pt.target, 1.0);
    }
  }

  // ================= sort 玩法（排排队 · 音阶心智）=================
  let st = { order: [], next: 0, active: false, birds: [] };

  function drawSortLevel(lv) {
    const svg = $('staffSvg');
    svg.innerHTML = '';
    const lineY = [150, 120, 90, 60, 30];
    let s = '';
    lineY.forEach(function (y) {
      s += '<line class="staff-line" x1="40" y1="' + y + '" x2="760" y2="' + y + '"/>';
    });
    s += '<text x="52" y="100" font-size="52" fill="rgba(55,66,59,.5)" text-anchor="middle" font-family="serif">𝄞</text>';

    const notes = lv.notes.slice().sort(function (a, b) { return a - b; });
    st.order = notes;
    st.next = 0;
    st.active = false;

    const xs = [180, 310, 440, 570, 700];
    for (let i = xs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [xs[i], xs[j]] = [xs[j], xs[i]];
    }

    st.birds = notes.map(function (midi, i) {
      const x = xs[i];
      const y = window.NOTE_Y[midi];
      s += '<g class="choice-bird hoverable" id="sb' + i + '" data-note="' + midi + '">' +
        '<circle cx="' + x + '" cy="' + (y - 12) + '" r="22" fill="transparent" style="cursor:pointer"/>' +
        '<text x="' + x + '" y="' + (y - 12) + '" font-size="32" text-anchor="middle">🐦</text>' +
        '<text x="' + x + '" y="' + (y + 30) + '" font-size="12" text-anchor="middle" fill="var(--ink-soft)" style="opacity:.6">' +
        (window.NOTE_NAME[midi] || midi) + '</text></g>';
      return { x: x, y: y, midi: midi, idx: i };
    });
    svg.innerHTML += s;

    svg.onclick = function (ev) {
      const t = ev.target;
      if (t && t.parentNode && t.parentNode.classList && t.parentNode.classList.contains('choice-bird')) {
        const g = t.parentNode;
        handleSortClick(parseInt(g.dataset.note, 10), g);
      }
    };
  }

  function startSort() {
    const lv = currentLevel;
    if (!lv || lv.type !== 'sort') return;
    if (window.MusicCore) window.MusicCore._ensureCtx();
    if (window.MusicCore && window.MusicCore.sfx) window.MusicCore.sfx.click();
    st.active = true;
    st.next = 0;
    $('roundHud').classList.remove('hidden');
    $('listenRow').classList.remove('hidden');
    $('segQ').style.display = 'none';
    $('okLabel').textContent = '已排';
    $('segCombo').style.display = 'none';
    $('roundOk').textContent = '0';
    $('roundTotal').textContent = st.order.length;
    $('listenBadge').innerHTML = '🐦 从最低的小鸟开始点！';
    document.querySelectorAll('#staffSvg .choice-bird').forEach(function (g) {
      g.classList.remove('correct', 'wrong');
      const texts = g.querySelectorAll('text');
      texts[0].textContent = '🐦';
      g.style.opacity = '';
    });
    spiritSay('先找唱得最低的那只，点它！');
  }

  function handleSortClick(note, g) {
    if (!st.active || st.next >= st.order.length) return;
    if (note === st.order[st.next]) {
      g.classList.add('correct');
      const texts = g.querySelectorAll('text');
      texts[0].textContent = (st.next + 1) + '️⃣';
      window.MusicCore.playNote(note, 0.55);
      st.next++;
      $('roundOk').textContent = st.next;

      if (st.next >= st.order.length) {
        finishSort();
      } else {
        spiritAvatar('happy');
        spiritSay(PRAISE[Math.floor(Math.random() * PRAISE.length)] + ' 下一个，再高一点的～');
      }
    } else {
      g.classList.add('wrong');
      window.MusicCore.playNote(note, 0.3);
      if (window.MusicCore.sfx) window.MusicCore.sfx.wrong();
      spiritAvatar('think');
      spiritSay('这只还不是哦，先点更低的～');
      setTimeout(function () { g.classList.remove('wrong'); }, 500);
    }
  }

  function finishSort() {
    $('listenBadge').innerHTML = '🎉 排队完成！';
    spiritAvatar('celebrate');
    if (window.MusicCore && window.MusicCore.sfx) window.MusicCore.sfx.win();
    st.order.forEach(function (n, i) {
      setTimeout(function () { window.MusicCore.playNote(n, 0.5); }, i * 260);
    });
    spiritSay('太棒了！这就是音阶——从低到高，一个一个往上走！');
    const lv = currentLevel;
    if (!isLevelDone(lv.id)) {
      markLevelDone(lv.id);
      addScore(30);
      awardMedal('📶 排队小达人');
      toast('⭐ +30 · 🏅 排队小达人');
    }
    $('pointStartBtn').textContent = '🐦 再排一次';
  }

  // ================= highlow 玩法（谁更高 · L0 听觉启蒙）=================
  let hl = { round: 0, ok: 0, low: null, high: null, locked: false };

  function drawHighLowLevel(lv) {
    const svg = $('staffSvg');
    const lineY = [150, 120, 90, 60, 30];
    let s = '';
    lineY.forEach(function (y) {
      s += '<line class="staff-line" x1="40" y1="' + y + '" x2="760" y2="' + y + '"/>';
    });
    s += '<text x="52" y="100" font-size="52" fill="rgba(55,66,59,.5)" text-anchor="middle" font-family="serif">𝄞</text>';
    // 两只小鸟：低处（左）+ 高处（右），位置=音高可视化
    s += '<g class="choice-bird hoverable" id="hlLow" data-side="low">' +
      '<circle cx="240" cy="150" r="26" fill="transparent" style="cursor:pointer"/>' +
      '<text x="240" y="138" font-size="34" text-anchor="middle">🐦</text>' +
      '<text x="240" y="182" font-size="13" text-anchor="middle" fill="var(--ink-soft)">低的</text></g>' +
      '<g class="choice-bird hoverable" id="hlHigh" data-side="high">' +
      '<circle cx="540" cy="60" r="26" fill="transparent" style="cursor:pointer"/>' +
      '<text x="540" y="48" font-size="34" text-anchor="middle">🐦</text>' +
      '<text x="540" y="92" font-size="13" text-anchor="middle" fill="var(--ink-soft)">高的</text></g>';
    s += '<text x="390" y="215" font-size="14" text-anchor="middle" fill="var(--ink-soft)" font-weight="bold">🐦 谁唱得更高？</text>';
    svg.innerHTML = s;
    svg.onclick = function (ev) {
      const t = ev.target;
      if (t && t.parentNode && t.parentNode.classList && t.parentNode.classList.contains('choice-bird')) {
        handleHighLowClick(t.parentNode.dataset.side, t.parentNode);
      }
    };
  }

  function startHighLow() {
    const lv = currentLevel;
    if (!lv || lv.type !== 'highlow') return;
    if (window.MusicCore) window.MusicCore._ensureCtx();
    if (window.MusicCore && window.MusicCore.sfx) window.MusicCore.sfx.click();
    hl.round = 0; hl.ok = 0; hl.locked = false;
    $('roundHud').classList.remove('hidden');
    $('listenRow').classList.remove('hidden');
    $('segQ').style.display = '';
    $('okLabel').textContent = '猜对';
    $('segCombo').style.display = '';
    $('roundNow').textContent = '1'; $('roundOk').textContent = '0'; $('roundCombo').textContent = '0';
    document.querySelectorAll('#staffSvg .choice-bird').forEach(function (g) {
      g.classList.remove('correct', 'wrong');
    });
    spiritSay('听好啦，我要唱两个音～');
    playHighLowRound();
  }

  function playHighLowRound() {
    const lv = currentLevel;
    hl.locked = false;
    hl.low = lv.lowNotes[Math.floor(Math.random() * lv.lowNotes.length)];
    hl.high = lv.highNotes[Math.floor(Math.random() * lv.highNotes.length)];
    $('roundNow').textContent = Math.min(hl.round + 1, lv.rounds);
    $('listenBadge').innerHTML = '🎵 听音…';
    // 随机顺序播放两个音（低↔高）
    const order = Math.random() < 0.5 ? [hl.low, hl.high] : [hl.high, hl.low];
    setTimeout(function () { window.MusicCore.playNote(order[0], 0.8); }, 400);
    setTimeout(function () { window.MusicCore.playNote(order[1], 1.0); }, 1250);
    setTimeout(function () {
      $('listenBadge').innerHTML = '🐦 点唱得更高的小鸟！';
    }, 2100);
  }

  function handleHighLowClick(side, g) {
    if (hl.locked) return;
    const lv = currentLevel;
    hl.locked = true;
    $('listenBadge').innerHTML = '…';

    if (side === 'high') {
      g.classList.add('correct');
      hl.ok += 1;
      addScore(10);
      window.MusicCore.playNote(hl.high, 0.8);
      if (window.MusicCore.sfx) window.MusicCore.sfx.correct();
      spiritAvatar('happy');
      spiritSay(PRAISE[Math.floor(Math.random() * PRAISE.length)] + ' 高音像小鸟飞高高！');
      toast('🎉 答对！+10');
    } else {
      g.classList.add('wrong');
      if (window.MusicCore.sfx) window.MusicCore.sfx.wrong();
      spiritAvatar('think');
      spiritSay('再听一次～ 高的那个是不是更尖、更像小鸟？');
      setTimeout(function () { g.classList.remove('wrong'); }, 500);
      setTimeout(function () {
        hl.locked = false;
        window.MusicCore.playNote(hl.low, 0.7);
        setTimeout(function () { window.MusicCore.playNote(hl.high, 0.9); }, 700);
        $('listenBadge').innerHTML = '🐦 点唱得更高的小鸟！';
      }, 1500);
      return;
    }

    $('roundOk').textContent = hl.ok;
    hl.round += 1;
    if (hl.round >= lv.rounds || hl.ok >= lv.passCount) {
      finishHighLow();
    } else {
      setTimeout(function () { playHighLowRound(); }, 1300);
    }
  }

  function finishHighLow() {
    const lv = currentLevel;
    $('listenBadge').innerHTML = '🎉 你真厉害！';
    spiritAvatar('celebrate');
    if (window.MusicCore && window.MusicCore.sfx) window.MusicCore.sfx.win();
    spiritSay('太棒了！你听出了 ' + hl.ok + ' 次谁更高，耳朵真灵！');
    if (!isLevelDone(lv.id)) {
      markLevelDone(lv.id);
      addScore(30);
      awardMedal('🎧 听音小能手');
      toast('⭐ +30 · 🏅 听音小能手');
    }
    $('pointStartBtn').textContent = '🎵 再来一轮';
  }

  // ================= tap 玩法（小鼓手 · 节奏/休止）=================
  let tap = { times: [], hits: [], ok: 0, started: false, pattern: [] };

  function drawTapLevel(lv) {
    const svg = $('staffSvg');
    let s = '';
    // 节拍进度点（8 个，一排）
    const n = lv.pattern.length;
    const gap = 560 / (n - 1);
    const x0 = 120;
    for (let i = 0; i < n; i++) {
      s += '<circle id="tp' + i + '" cx="' + (x0 + i * gap) + '" cy="60" r="13" ' +
        'fill="' + (lv.pattern[i] ? 'var(--sun-soft)" stroke="var(--sun)"' : 'rgba(200,190,170,.35)"') +
        ' stroke-width="2" style="opacity:.35"/>';
    }
    // 大鼓（中央大按钮）
    s += '<g id="tapDrum" style="cursor:pointer">' +
      '<circle cx="390" cy="160" r="52" fill="#c98a5e" stroke="#fff" stroke-width="4"/>' +
      '<circle cx="390" cy="158" r="40" fill="#e0b48a"/>' +
      '<text x="390" y="172" font-size="34" text-anchor="middle">🥁</text></g>';
    s += '<text x="390" y="232" font-size="14" text-anchor="middle" fill="var(--ink-soft)" font-weight="bold">跟着鼓声拍它！</text>';
    svg.innerHTML = s;

    // 鼓点击
    const drum = document.getElementById('tapDrum');
    svg.onclick = function (ev) {
      const t = ev.target;
      if (t && t.id === 'tapDrum') { tapHit(); return; }
      if (t && t.parentNode && t.parentNode.id === 'tapDrum') { tapHit(); }
    };
  }

  function startTap() {
    const lv = currentLevel;
    if (!lv || lv.type !== 'tap') return;
    if (window.MusicCore) window.MusicCore._ensureCtx();
    if (window.MusicCore && window.MusicCore.sfx) window.MusicCore.sfx.click();
    const interval = 60000 / lv.bpm;
    tap.times = []; tap.hits = []; tap.ok = 0; tap.started = false; tap.pattern = lv.pattern;

    $('roundHud').classList.remove('hidden');
    $('listenRow').classList.remove('hidden');
    $('segQ').style.display = 'none';
    $('okLabel').textContent = '跟上';
    $('segCombo').style.display = 'none';
    $('roundOk').textContent = '0';
    $('roundTotal').textContent = lv.pattern.filter(function (p) { return p; }).length;

    // 重置进度点
    for (let i = 0; i < lv.pattern.length; i++) {
      const d = document.getElementById('tp' + i);
      if (d) d.style.opacity = 0.35;
    }

    // 预计算有音拍时间
    const t0 = performance.now() + 800;
    lv.pattern.forEach(function (p, i) { if (p) tap.times.push(t0 + i * interval); });

    spiritSay('准备好！听到"咚"就拍大鼓～');
    $('listenBadge').innerHTML = '🥁 准备…';

    setTimeout(function () {
      tap.started = true;
      // 播放节奏
      lv.pattern.forEach(function (p, i) {
        setTimeout(function () {
          const d = document.getElementById('tp' + i);
          if (d) d.style.opacity = 1;
          if (p && window.MusicCore.sfx) window.MusicCore.sfx.drum();
        }, i * interval);
      });
      // 结束
      setTimeout(function () {
        tap.started = false;
        finishTap();
      }, lv.pattern.length * interval + 300);
    }, 800);
  }

  function tapHit() {
    if (!tap.started) return;
    const now = performance.now();
    let best = -1, bestD = 99999;
    tap.times.forEach(function (t, i) {
      if (tap.hits.indexOf(i) === -1) {
        const d = Math.abs(now - t);
        if (d < bestD) { bestD = d; best = i; }
      }
    });
    if (best >= 0 && bestD < 300) {
      // 命中
      tap.hits.push(best); tap.ok++;
      if (window.MusicCore.sfx) window.MusicCore.sfx.drum();
      const d = document.getElementById('tp' + best);
      if (d) d.style.filter = 'drop-shadow(0 0 6px var(--sun))';
      $('roundOk').textContent = tap.ok;
      spiritAvatar('happy');
      if (tap.ok >= tap.pattern.filter(function (p) { return p; }).length) {
        spiritSay('全拍对啦！你真是小鼓手！');
      }
    } else {
      // 误拍（休止时）
      spiritAvatar('think');
      spiritSay('嘘～这里没有鼓声，要停一停哦');
    }
  }

  function finishTap() {
    const lv = currentLevel;
    const total = lv.pattern.filter(function (p) { return p; }).length;
    $('listenBadge').innerHTML = tap.ok >= 3 ? '🎉 节奏小鼓手！' : '🎵 再试一次会更棒！';
    spiritAvatar('celebrate');
    if (tap.ok >= 3 && window.MusicCore.sfx) window.MusicCore.sfx.win();
    spiritSay(tap.ok >= 3 ? '你跟上 ' + tap.ok + ' 个鼓点，节奏感真棒！' : '跟上了 ' + tap.ok + ' 个，休息一下再来～');
    if (tap.ok >= 3 && !isLevelDone(lv.id)) {
      markLevelDone(lv.id);
      addScore(30);
      awardMedal('🥁 小鼓手');
      toast('⭐ +30 · 🏅 小鼓手');
    }
    $('pointStartBtn').textContent = '🥁 再来一次';
  }

  // ================= 山灵对话（打字机 + SVG 表情）=================
  function spiritSay(text) {
    clearInterval(spiritTimer);
    const el = $('spiritText');
    el.textContent = '';
    spiritAvatar('talk');
    let i = 0;
    spiritTimer = setInterval(function () {
      if (i <= text.length) {
        el.textContent = text.slice(0, i);
        i++;
      } else {
        clearInterval(spiritTimer);
      }
    }, 28);
  }

  function spiritAvatar(state) {
    const a = $('spirit');
    a.classList.remove('talk', 'celebrate');
    void a.offsetWidth;
    if (state === 'talk') a.classList.add('talk');
    if (state === 'celebrate') a.classList.add('celebrate');

    const normal = $('sEyesNormal'), happy = $('sEyesHappy');
    const mouth = $('sMouth'), mouthOpen = $('sMouthOpen');
    const on = function (el, v) { if (el) el.style.display = v ? '' : 'none'; };
    on(normal, true); on(happy, false); on(mouth, true); on(mouthOpen, false);
    if (state === 'happy' || state === 'celebrate') {
      on(normal, false); on(happy, true); on(mouth, false); on(mouthOpen, true);
    } else if (state === 'think') {
      on(mouth, false);
    }
  }

  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  // ================= 开发者模式 =================
  function toggleDev() {
    const p = $('devPanel');
    p.classList.toggle('hidden');
    $('devToggle').classList.toggle('active', !p.classList.contains('hidden'));
  }

  // ================= 初始化 =================
  window.App = {
    goHome: goHome,
    playLevel: playLevel,
    setSpeed: setSpeed,
    startPoint: startPoint,
    replayNote: replayNote,
    toggleDev: toggleDev,
  };

  renderTrailMap();
  refreshCrumb();
  spiritSay('你好呀，我是山灵！大山的音乐被封印了，和我一起去寻宝吧！');
})();
