/**
 * ============================================================
 *  app.js · 应用入口（合并点）
 * ============================================================
 *  职责：地图总览渲染 / 关卡加载 / 看小鸟飞动画 / 山灵引导
 *  依赖：window.MAPS, window.NOTE_Y, window.NOTE_NAME, window.MusicCore, window.VoiceCore
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
  let guidanceIdx = 0;

  // —— 积分 / 勋章（localStorage 本地存储，无账号零收集）——
  const SAVE_KEY = 'mv_progress_v1';
  let save = { score: 0, medals: [], doneLevels: {} };
  try { save = Object.assign(save, JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')); } catch (e) {}

  function persist() { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }
  function addScore(n) {
    save.score += n;
    $('scoreVal').textContent = save.score;
    persist();
  }
  function awardMedal(name) {
    if (save.medals.indexOf(name) === -1) save.medals.push(name);
    persist();
    $('medalPill').textContent = '🏅 ' + save.medals.join(' ');
    $('medalPill').classList.remove('empty');
  }
  function renderProgressUI() {
    $('scoreVal').textContent = save.score;
    if (save.medals.length) {
      $('medalPill').textContent = '🏅 ' + save.medals.join(' ');
      $('medalPill').classList.remove('empty');
    }
  }
  function markLevelDone(id) { save.doneLevels[id] = true; persist(); }
  function isLevelDone(id) { return !!save.doneLevels[id]; }

  // ---------------- 地图总览 ----------------
  function renderMaps() {
    const grid = $('mapGrid');
    grid.innerHTML = '';
    window.MAPS.forEach(function (m) {
      const card = document.createElement('div');
      card.className = 'map-card ' + (m.status === 'open' ? 'open' : 'locked');

      const levelInfo = m.levels.length
        ? '<div class="mlevels">🎮 ' + m.levels.map(function (l) { return l.title; }).join(' · ') + '</div>'
        : '';

      card.innerHTML =
        '<div class="row"><span class="micon">' + m.icon + '</span>' +
        '<span class="mname">' + m.name + '</span>' +
        '<span class="mstage">' + m.stage + '</span></div>' +
        '<div class="mdesc">' + m.desc + '</div>' +
        levelInfo +
        '<div class="mstatus ' + (m.status === 'open' ? 'open-t' : 'lock-t') + '">' +
        (m.status === 'open' ? '▶ 可探索' : '🔒 ' + (m.lockedHint || '即将开启')) + '</div>';

      if (m.status === 'open') {
        card.addEventListener('click', function () { enterMap(m); });
      } else {
        card.addEventListener('click', function () { toast(m.lockedHint || '这一片还在封印中…'); });
      }
      grid.appendChild(card);
    });
  }

  // ---------------- 进入地图 / 关卡 ----------------
  function enterMap(m) {
    if (!m.levels.length) { toast('这张地图的关卡还在设计中…'); return; }
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
    $('backBtn').classList.remove('hidden');
    $('crumb').textContent = currentMap.name + ' · ' + lv.title;

    $('levelTitle').textContent = lv.icon + ' ' + lv.title;
    $('levelSub').textContent = currentMap.name + ' · ' + (lv.type === 'observe' ? '观察' : lv.type === 'point' ? '配对' : lv.type) + ' 关卡';
    $('levelConcept').textContent = '🎼 ' + lv.concept;

    // 三件套
    $('kitConcept').textContent = lv.concept;
    $('kitModel').textContent = lv.model;
    $('kitAction').textContent = lv.action;
    $('kitJudge').textContent = lv.judge;
    $('kitFeedback').textContent = lv.feedback;
    $('kitGoal').textContent = lv.goal;

    guidanceIdx = 0;
    spiritSay(lv.guidance[0]);

    renderLevelNav();

    // 按类型渲染舞台
    $('listenRow').classList.add('hidden');
    $('roundHud').classList.add('hidden');
    if (lv.type === 'point') {
      $('observeControls').classList.add('hidden');
      $('pointControls').classList.remove('hidden');
      drawPointLevel(lv);
    } else {
      $('observeControls').classList.remove('hidden');
      $('pointControls').classList.add('hidden');
      drawStaff(lv);
      renderNotes(lv);
    }
  }

  function goHome() {
    if (window.MusicCore) window.MusicCore.stopAll();
    playing = false;
    currentMap = null;
    currentLevel = null;
    $('levelView').classList.add('hidden');
    $('mapView').classList.remove('hidden');
    $('backBtn').classList.add('hidden');
    $('crumb').textContent = '地图总览';
    spiritSay('你好呀，我是山灵！选一张地图开始冒险吧～');
  }

  // ---------------- 五线谱 ----------------
  function drawStaff(lv) {
    const svg = $('staffSvg');
    const lineY = [150, 120, 90, 60, 30]; // E4 G4 B4 D5 F5
    let s = '';
    // 小节线
    s += '<line class="staff-line" x1="100" y1="30" x2="100" y2="150" style="stroke:rgba(147,160,200,.18)"/>';
    s += '<line class="staff-line" x1="740" y1="30" x2="740" y2="150" style="stroke:rgba(147,160,200,.18)"/>';
    lineY.forEach(function (y) {
      s += '<line class="staff-line" x1="40" y1="' + y + '" x2="760" y2="' + y + '"/>';
    });
    // 高音谱号
    s += '<text x="52" y="100" font-size="52" fill="rgba(238,242,255,.75)" text-anchor="middle" font-family="serif">𝄞</text>';
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

    // 彩色轨迹（每段用目标音符颜色）
    for (let i = 0; i < pts.length - 1; i++) {
      trail += '<line x1="' + pts[i].x + '" y1="' + pts[i].y + '" x2="' + pts[i + 1].x +
        '" y2="' + pts[i + 1].y + '" stroke="' + window.noteColor(pts[i + 1].midi) +
        '" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="6 5" opacity=".5"/>';
    }

    pts.forEach(function (p) {
      const c = window.noteColor(p.midi);
      dots += '<circle class="note-dot" id="dot' + p.i + '" cx="' + p.x + '" cy="' + p.y +
        '" r="11" fill="' + c + '" style="opacity:0"/>';
      names += '<text class="note-name" id="nm' + p.i + '" x="' + p.x + '" y="' + (p.y + 34) + '">' +
        (window.NOTE_NAME[p.midi] || p.midi) + '</text>';
    });

    // 小鸟
    const b0 = pts[0];
    const bird = '<text class="bird" id="birdEl" x="' + b0.x + '" y="' + (b0.y - 14) + '">🐤</text>';

    svg.insertAdjacentHTML('beforeend', trail + dots + names + bird);
    svg.__pts = pts;
  }

  // ---------------- 播放（看小鸟飞 · 平滑动画） ----------------
  function setSpeed(i) {
    speedIdx = i;
    const btns = document.querySelectorAll('#observeControls .btn.small');
    btns.forEach(function (b, idx) { b.classList.toggle('active', idx === i); });
  }

  function animateBird(fromX, fromY, toX, toY, dur) {
    return new Promise(function (resolve) {
      const bird = $('birdEl');
      const t0 = performance.now();
      function step(now) {
        const p = Math.min(1, (now - t0) / (dur * 1000));
        const ease = 1 - Math.pow(1 - p, 3);
        bird.setAttribute('x', fromX + (toX - fromX) * ease);
        // 小幅上下浮动（飞翔感）
        bird.setAttribute('y', fromY + (toY - fromY) * ease - 14 + Math.sin(p * Math.PI * 3) * 3);
        if (p < 1) requestAnimationFrame(step);
        else resolve();
      }
      requestAnimationFrame(step);
    });
  }

  async function playLevel() {
    if (playing) return;
    const lv = currentLevel;
    if (!lv || lv.type !== 'observe') return;
    playing = true;
    $('playBtn').textContent = '⏳ 播放中…';

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

    spiritSay('仔细看哦～');

    // 小鸟回到起点
    birdEl.setAttribute('x', pts[0].x);
    birdEl.setAttribute('y', pts[0].y - 14);

    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const prev = i > 0 ? pts[i - 1] : pts[0];

      // 飞向落点
      await animateBird(prev.x, prev.y - 14, p.x, p.y - 14, base * 0.55);

      // 落点亮起（彩虹色）+ 唱音 + 音符名
      const d = $('dot' + p.i);
      if (d) { d.style.opacity = 1; d.style.filter = 'drop-shadow(0 0 10px ' + window.noteColor(p.midi) + ')'; }
      const n = $('nm' + p.i); if (n) n.classList.add('lit');

      // 弹出小音符
      popNote(p.x, p.y - 30);

      window.MusicCore.playNote(p.midi, base * 0.8);
      if (window.VoiceCore) window.VoiceCore.showCharacter('sing');
      await sleep(base * 500);
    }

    // 庆祝：全部点亮 + 山灵庆祝
    pts.forEach(function (p) {
      const d = $('dot' + p.i);
      if (d) { d.style.opacity = 1; d.style.filter = 'drop-shadow(0 0 12px ' + window.noteColor(p.midi) + ')'; }
    });
    if (window.VoiceCore) {
      window.VoiceCore.showCharacter('celebrate');
      window.VoiceCore.playAnimation('celebrate');
    }
    spiritSay('看见了吗？落点越高，音就越高！这就是"音高"～');
    toast('🎉 观察完成！记住：高 = 上面，低 = 下面');
    if (!isLevelDone(lv.id)) {
      markLevelDone(lv.id);
      addScore(20);
      awardMedal('👀 观察员');
    }
    playing = false;
    $('playBtn').textContent = '▶ 再看一遍';
  }

  function popNote(x, y) {
    const svg = $('staffSvg');
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    el.textContent = '🎵';
    el.setAttribute('x', x);
    el.setAttribute('y', y);
    el.setAttribute('font-size', '18');
    el.setAttribute('text-anchor', 'middle');
    el.classList.add('pop-note');
    svg.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('show'); });
    setTimeout(function () { el.remove(); }, 900);
  }

  // ---------------- point 玩法（点小鸟回家） ----------------
  let pt = { round: 0, ok: 0, combo: 0, target: null, locked: false, birds: [] };

  function drawPointLevel(lv) {
    const svg = $('staffSvg');
    svg.innerHTML = '';
    // 五线谱底
    const lineY = [150, 120, 90, 60, 30];
    let s = '';
    lineY.forEach(function (y) {
      s += '<line class="staff-line" x1="40" y1="' + y + '" x2="760" y2="' + y + '"/>';
    });
    s += '<text x="52" y="100" font-size="52" fill="rgba(238,242,255,.75)" text-anchor="middle" font-family="serif">𝄞</text>';

    // 5 只候选小鸟：随机打乱音高，均匀分布 x
    const notes = lv.notes.slice();
    for (let i = notes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [notes[i], notes[j]] = [notes[j], notes[i]];
    }
    const n = notes.length;
    const x0 = 140, gap = (760 - 280) / (n - 1);
    pt.birds = notes.map(function (midi, i) {
      const x = x0 + i * gap;
      const y = window.NOTE_Y[midi];
      s += '<text class="choice-bird" id="cb' + i + '" x="' + x + '" y="' + (y - 16) +
        '" data-note="' + midi + '" data-idx="' + i + '">🐦</text>';
      // 显示音名小标签
      s += '<text class="note-name" id="cbn' + i + '" x="' + x + '" y="' + (y + 30) +
        '" style="opacity:.5">' + (window.NOTE_NAME[midi] || midi) + '</text>';
      return { x: x, y: y, midi: midi, idx: i };
    });
    svg.innerHTML += s;

    // 点击委托（SVG 上）
    svg.onclick = function (ev) {
      const t = ev.target;
      if (t && t.classList && t.classList.contains('choice-bird')) {
        handleBirdClick(parseInt(t.dataset.note, 10), t);
      }
    };
  }

  function resetPointUI() {
    pt.round = 0; pt.ok = 0; pt.combo = 0; pt.locked = false;
    $('roundNow').textContent = '1';
    $('roundOk').textContent = '0';
    $('roundCombo').textContent = '0';
  }

  function startPoint() {
    const lv = currentLevel;
    if (!lv || lv.type !== 'point') return;
    if (window.MusicCore) window.MusicCore._ensureCtx();
    resetPointUI();
    $('roundHud').classList.remove('hidden');
    $('listenRow').classList.remove('hidden');
    // 重置小鸟样式
    pt.birds.forEach(function (b) {
      const el = $('cb' + b.idx);
      if (el) { el.classList.remove('wrong', 'correct'); el.style.opacity = ''; }
    });
    spiritSay('我来唱第一个音，认真听哦～');
    playRound();
  }

  function pickTarget() {
    const lv = currentLevel;
    // 避免连续重复目标
    let t;
    do {
      t = lv.notes[Math.floor(Math.random() * lv.notes.length)];
    } while (t === pt.target && lv.notes.length > 1);
    return t;
  }

  function playRound() {
    const lv = currentLevel;
    pt.locked = false;
    pt.target = pickTarget();
    $('roundNow').textContent = Math.min(pt.round + 1, lv.rounds);
    $('listenBadge').innerHTML = '🎵 听音…';

    // 播放目标音（先全音符提示，再播）
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
      // 答对
      el.classList.add('correct');
      pt.combo += 1;
      pt.ok += 1;
      const pts = 10 + Math.min(pt.combo - 1, 3) * 5;   // 连击加成
      addScore(pts);
      window.MusicCore.playNote(note, 0.8);
      if (window.VoiceCore) window.VoiceCore.showCharacter('happy');
      spiritSay('答对啦！积分 +' + pts + (pt.combo >= 2 ? '（连击 x' + pt.combo + '）' : ''));
      toast('🎉 回家成功！+' + pts);
    } else {
      // 答错：再试一次 + 重播示范（无惩罚）
      el.classList.add('wrong');
      pt.combo = 0;
      window.MusicCore.playNote(pt.target, 0.9);
      if (window.VoiceCore) window.VoiceCore.showCharacter('sad');
      spiritSay('没关系，再听一次～ 注意它站得多高？');
      $('listenBadge').innerHTML = '🎵 再听一次（点上方按钮）';
      setTimeout(function () { el.classList.remove('wrong'); }, 600);
      setTimeout(function () {
        pt.locked = false;
        $('listenBadge').innerHTML = '🎵 点唱得一样高的小鸟！';
      }, 1400);
      return;
    }

    // 更新 HUD
    $('roundOk').textContent = pt.ok;
    $('roundCombo').textContent = pt.combo;

    // 下一题 / 通关
    pt.round += 1;
    if (pt.round >= lv.rounds || pt.ok >= lv.passCount) {
      finishPoint();
    } else {
      setTimeout(function () { playRound(); }, 1200);
    }
  }

  function finishPoint() {
    const lv = currentLevel;
    $('listenBadge').innerHTML = '🎉 全部小鸟都回家啦！';
    if (window.VoiceCore) {
      window.VoiceCore.showCharacter('celebrate');
      window.VoiceCore.playAnimation('celebrate');
    }
    spiritSay('太棒了！你听出了 ' + pt.ok + ' 个音高，小鸟们都回家啦！');
    toast('🏅 获得徽章：听音小帮手');
    if (!isLevelDone(lv.id)) {
      markLevelDone(lv.id);
      addScore(30);
      awardMedal('👂 听音小帮手');
    }
    $('pointStartBtn').textContent = '🎵 再来一轮';
  }

  function replayNote() {
    if (pt.target != null) {
      if (window.MusicCore) window.MusicCore._ensureCtx();
      window.MusicCore.playNote(pt.target, 1.0);
    }
  }

  // ---------------- 山灵 ----------------
  function spiritSay(text) {
    $('spiritText').textContent = text;
  }

  function nextGuidance() {
    if (!currentLevel) return;
    const g = currentLevel.guidance;
    guidanceIdx = (guidanceIdx + 1) % g.length;
    spiritSay(g[guidanceIdx]);
  }

  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  // ---------------- 初始化 ----------------
  window.App = {
    goHome: goHome,
    playLevel: playLevel,
    setSpeed: setSpeed,
    nextGuidance: nextGuidance,
    startPoint: startPoint,
    replayNote: replayNote,
  };

  renderProgressUI();
  renderMaps();
})();
