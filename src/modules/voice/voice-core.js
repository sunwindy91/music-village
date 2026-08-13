/* ============================================================
 * 晓声 · 山灵精灵（VoiceCore）
 * SVG 水彩质感 · 打字机对话气泡 · 表情系统 · 萤火粒子
 * 成长可视化：随点亮关卡数，身体出现金色印记（成长阶段）
 * ============================================================ */
window.MV = window.MV || {};

MV.VoiceCore = (() => {
  const C = () => MV.config;

  /* ---------- 晓声 SVG 模板 ---------- */
  function svgTpl(exp) {
    return `
    <svg class="xs" viewBox="0 0 220 240" data-exp="${exp}" role="img" aria-label="晓声，住在山谷里的小山灵">
      <defs>
        <linearGradient id="xsBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#5ba384"/>
          <stop offset="1" stop-color="#386850"/>
        </linearGradient>
        <linearGradient id="xsBelly" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#eaf7ec"/>
          <stop offset="1" stop-color="#cfe9d6"/>
        </linearGradient>
        <linearGradient id="xsLeaf" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stop-color="#4d8f6f"/>
          <stop offset="1" stop-color="#7cbb8f"/>
        </linearGradient>
        <radialGradient id="xsGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#f3e2a4" stop-opacity="0.5"/>
          <stop offset="1" stop-color="#f3e2a4" stop-opacity="0"/>
        </radialGradient>
      </defs>

      <!-- 暖色光晕（治愈感核心） -->
      <circle class="xs-halo" cx="110" cy="128" r="96" fill="url(#xsGlow)"/>

      <!-- 头顶嫩芽 -->
      <g class="xs-sprout">
        <path class="xs-stem" d="M110 46 C 110 54 110 60 110 66" fill="none" stroke="#4d8f6f" stroke-width="4" stroke-linecap="round"/>
        <path class="xs-leaf-l" d="M110 58 C 92 46 84 28 94 20 C 106 20 112 42 110 58 Z" fill="url(#xsLeaf)"/>
        <path class="xs-leaf-r" d="M110 64 C 130 54 142 38 132 30 C 120 30 112 50 110 64 Z" fill="url(#xsLeaf)"/>
      </g>

      <!-- 背在身后的小手 -->
      <path class="xs-hand xs-hand-l" d="M52 150 C 44 158 46 168 54 172 C 64 172 68 162 62 154 Z" fill="#4b8768"/>
      <path class="xs-hand xs-hand-r" d="M168 150 C 176 158 174 168 166 172 C 156 172 152 162 158 154 Z" fill="#4b8768"/>

      <!-- 圆润身体 -->
      <path class="xs-body" d="M110 40 C 158 40 182 74 182 120 C 182 158 168 198 110 198 C 52 198 38 158 38 120 C 38 74 62 40 110 40 Z" fill="url(#xsBody)"/>
      <!-- 肚皮 -->
      <ellipse class="xs-belly" cx="110" cy="146" rx="46" ry="36" fill="url(#xsBelly)" opacity="0.85"/>
      <!-- 成长印记：金色音符（点亮关卡后出现） -->
      <g class="xs-mark">
        <ellipse class="xs-mark-glow" cx="110" cy="128" rx="30" ry="26" fill="#f3e2a4" opacity="0.28"/>
        <g transform="translate(110 128) scale(1.35)">
          <ellipse cx="0" cy="0" rx="6.5" ry="4.6" fill="#e8b04b"/>
          <rect x="4.4" y="-10" width="2.2" height="11" rx="1.1" fill="#d99b34"/>
          <path d="M6.6 -8 C 9.6 -9 10.6 -7.5 10 -5.5" stroke="#d99b34" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        </g>
      </g>

      <!-- 腮红 -->
      <ellipse class="xs-blush xs-blush-l" cx="72" cy="142" rx="11" ry="7" fill="#e9a8a4" opacity="0.55"/>
      <ellipse class="xs-blush xs-blush-r" cx="148" cy="142" rx="11" ry="7" fill="#e9a8a4" opacity="0.55"/>

      <!-- 眼睛（亮晶晶） -->
      <g class="xs-eye xs-eye-l">
        <ellipse class="xs-eye-ball" cx="86" cy="124" rx="10" ry="11.5" fill="#23342a"/>
        <circle class="xs-eye-hi" cx="89.5" cy="120.5" r="3.6" fill="#fffdf2"/>
      </g>
      <g class="xs-eye xs-eye-r">
        <ellipse class="xs-eye-ball" cx="134" cy="124" rx="10" ry="11.5" fill="#23342a"/>
        <circle class="xs-eye-hi" cx="137.5" cy="120.5" r="3.6" fill="#fffdf2"/>
      </g>

      <!-- 开心眯眯眼 -->
      <path class="xs-arc xs-arc-l" d="M78 128 Q86 118 94 128" stroke="#23342a" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path class="xs-arc xs-arc-r" d="M126 128 Q134 118 142 128" stroke="#23342a" stroke-width="5" fill="none" stroke-linecap="round"/>

      <!-- 眉毛（思考 / 惊喜） -->
      <path class="xs-brow xs-brow-l" d="M76 104 Q86 100 96 105" stroke="#2d5240" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path class="xs-brow xs-brow-r" d="M124 106 Q134 98 144 103" stroke="#2d5240" stroke-width="4" fill="none" stroke-linecap="round"/>

      <!-- 嘴 -->
      <path class="xs-mouth-smile" d="M98 158 Q110 168 122 158" stroke="#2d5240" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      <path class="xs-mouth-open"  d="M99 156 Q110 172 121 156 Z" fill="#2d5240"/>
      <path class="xs-mouth-o"     d="M106 156 a6 6 0 1 0 0.01 0" stroke="#2d5240" stroke-width="4.5" fill="#fffdf2" stroke-linecap="round"/>
      <path class="xs-mouth-flat"  d="M102 158 L118 158" stroke="#2d5240" stroke-width="4.5" stroke-linecap="round"/>

      <!-- 思考省略号 -->
      <g class="xs-dots">
        <circle cx="164" cy="108" r="3.2" fill="#6d7a70"/>
        <circle cx="174" cy="100" r="3.2" fill="#6d7a70"/>
        <circle cx="183" cy="90"  r="3.2" fill="#6d7a70"/>
      </g>
    </svg>
    <div class="xs-bubble" role="status" aria-live="polite">
      <span class="xs-text"></span>
      <i class="xs-caret" aria-hidden="true"></i>
    </div>`;
  }

  /* ---------- 晓声 PNG 素材模式（水彩质感 · assets/xiaosheng.png） ---------- */
  function pngTpl(exp) {
    return `
    <div class="xs-png-wrap" data-exp="${exp}" role="img" aria-label="晓声，住在山谷里的小山灵">
      <div class="xs-png-halo"></div>
      <img class="xs-png" src="assets/xiaosheng.webp" alt="晓声" draggable="false">
      <div class="xs-png-mark" aria-hidden="true">♪</div>
    </div>
    <div class="xs-bubble" role="status" aria-live="polite">
      <span class="xs-text"></span>
      <i class="xs-caret" aria-hidden="true"></i>
    </div>`;
  }

  /* ---------- 状态 ---------- */
  let root = null;      // <svg>
  let bubble = null;    // .xs-bubble
  let textEl = null;    // .xs-text
  let timer = null;
  let onDone = null;
  let currentText = '';
  let pos = 0;

  /* ---------- API ---------- */
  function mount(el, opts = {}) {
    const usePng = !(MV.config && MV.config.xsPng === false);
    el.innerHTML = usePng ? pngTpl(opts.exp || 'calm') : svgTpl(opts.exp || 'calm');
    root = el.querySelector('.xs') || el.querySelector('.xs-png-wrap');
    bubble = el.querySelector('.xs-bubble');
    textEl = bubble.querySelector('.xs-text');
    bubble.style.display = 'none';
    bubble.addEventListener('pointerdown', finish);
    el.classList.add('xs-mounted');
    if (usePng) {
      const img = el.querySelector('.xs-png');
      img.addEventListener('error', () => { // PNG 加载失败 → 回退 SVG
        el.innerHTML = svgTpl(opts.exp || 'calm');
        root = el.querySelector('.xs');
        bubble = el.querySelector('.xs-bubble');
        textEl = bubble.querySelector('.xs-text');
        bubble.style.display = 'none';
        bubble.addEventListener('pointerdown', finish);
      });
    }
    if (opts.breathe) { root.classList.add('breathe'); }
  }

  function setExpression(exp) {
    if (root) root.setAttribute('data-exp', exp);
  }

  function say(text, opts = {}) {
    if (!textEl) return;
    stopTyping();
    if (bubble) bubble.classList.remove('done');
    currentText = String(text || '');
    pos = 0;
    onDone = opts.done || null;
    bubble.style.display = 'flex';
    textEl.textContent = '';
    requestAnimationFrame(() => bubble.classList.add('show'));
    timer = setInterval(() => {
      pos += 1;
      if (pos < currentText.length) {
        textEl.textContent = currentText.slice(0, pos);
      } else {
        textEl.textContent = currentText;
        stopTyping();
        if (bubble) bubble.classList.add('done'); // 打完隐藏光标，避免一直闪烁
        if (onDone) { const cb = onDone; onDone = null; cb(); }
      }
    }, C().typeSpeed);
  }

  function finish() {
    if (!textEl) return;
    stopTyping();
    textEl.textContent = currentText;
    if (onDone) { const cb = onDone; onDone = null; cb(); }
  }

  function stopTyping() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  function hideBubble() {
    if (!bubble) return;
    bubble.classList.remove('show');
    bubble.style.display = 'none';
    stopTyping();
  }

  function clear() { if (textEl) textEl.textContent = ''; }

  function isSpeaking() { return !!timer; }

  /* ---------- 萤火粒子（装饰层，低配友好 CSS 动画） ---------- */
  function fireflies(container, count) {
    if (!container) return;
    container.querySelectorAll('.firefly').forEach(n => n.remove());
    for (let i = 0; i < count; i++) {
      const f = document.createElement('span');
      f.className = 'firefly';
      f.style.left = (8 + Math.random() * 84) + '%';
      f.style.top = (10 + Math.random() * 78) + '%';
      const dur = 4 + Math.random() * 6;
      f.style.setProperty('--ff-dur', dur + 's');
      f.style.setProperty('--ff-delay', (-Math.random() * dur) + 's');
      f.style.setProperty('--ff-drift', (Math.random() * 40 - 20) + 'px');
      container.appendChild(f);
    }
  }

  /* ---------- 成长形态（已点亮关卡数 → 形态） ----------
   * 素材图还没生成时自动保持当前形态（不报错、不 404）。
   * 阶段对应点亮关卡数：0 种子 → 1 小芽 → 2 开花 → 3 星光 → 4 初鹿 → 5 鹿（全部点亮）
   * 鹿 = 终极形态（故事线与“小鹿乱撞”呼应）。
   */
  const FORMS = [
    { min: 0, key: 'seed',   name: '种子', src: 'assets/xiaosheng.webp' },
    { min: 1, key: 'sprout', name: '小芽', src: 'assets/xiaosheng_sprout.webp' },
    { min: 2, key: 'bloom',  name: '开花', src: 'assets/xiaosheng_bloom.webp' },
    { min: 3, key: 'spark',  name: '星光', src: 'assets/xiaosheng_spark.webp' },
    { min: 4, key: 'fawn',   name: '初鹿', src: 'assets/xiaosheng_fawn.webp' },
    { min: 5, key: 'deer',   name: '鹿',   src: 'assets/xiaosheng_deer.webp' }
  ];
  /* ---------- 交互姿态变体（F-07：形态定 base，姿态在族内换图，绝不跨族） ----------
   * 键：happy 答对 / comfort 答错安抚 / curious 卡关陪伴 / celebrate 通关庆祝
   * 缺姿态 → 回落本形态主体（form.src）；seed 族仅 1 张，全部回落主体。 */
  const POSES = {
    sprout: { happy: 'assets/3d/3D山灵手办开心托腮.webp',
              comfort: 'assets/3d/3D山灵手办歪头捧脸.webp',
              curious: 'assets/3d/3D山灵手办好奇探头.webp',
              celebrate: 'assets/3d/3D山灵手办开心拥抱.webp' },
    bloom:  { happy: 'assets/3d/3D山灵手办花间起舞.webp',
              comfort: 'assets/3d/3D山灵手办花朵拥抱.webp',
              curious: 'assets/3d/3D山灵手办花朵拥抱.webp',
              celebrate: 'assets/3d/3D山灵手办花朵拥抱.webp' },
    spark:  { happy: 'assets/3d/3D山灵手办花环起舞.webp',
              comfort: 'assets/3d/3D山灵手办花环捧脸.webp',
              curious: 'assets/3d/3D山灵手办花环捧脸.webp',
              celebrate: 'assets/3d/3D山灵手办花环跳跃.webp' },
    fawn:   { happy: 'assets/3d/3D鹿宝宝手办开心抬蹄.webp',
              comfort: 'assets/3d/3D鹿宝宝手办低头害羞.webp',
              curious: 'assets/3d/3D鹿宝宝手办好奇张望.webp',
              celebrate: 'assets/3d/3D鹿宝宝手办开心抬蹄.webp' },
    deer:   { happy: 'assets/3d/3D小鹿手办欢快小跳.webp',
              comfort: 'assets/3d/3D小鹿手办低头闻花.webp',
              curious: 'assets/3d/3D小鹿手办仰望星空.webp',
              celebrate: 'assets/3d/3D小鹿手办欢快小跳.webp' }
  };
  function resolveSrc(formKey, poseKey) {
    const form = FORMS.find(f => f.key === formKey) || FORMS[0];
    const pose = poseKey || 'idle';
    if (pose === 'idle') return form.src;                 // idle/welcome → 主体（seed 招手即主体）
    const table = POSES[form.key];
    return (table && table[pose]) || form.src;            // 缺姿态回落本族主体
  }
  let poseTimer = null;
  let stickyPose = false;
  /* 姿态切换（F-07）：短暂覆盖 img.src，holdMs 后回 idle；sticky 不自动回 */
  function setPose(pose, opts = {}) {
    if (!root || !root.querySelector('.xs-png')) return;  // SVG 回退 no-op
    stickyPose = !!opts.sticky;
    if (poseTimer) { clearTimeout(poseTimer); poseTimer = null; }
    root.dataset.pose = pose || 'idle';
    const img = root.querySelector('.xs-png');
    const want = resolveSrc(root.dataset.form || 'seed', root.dataset.pose);
    const probe = new Image();
    probe.onload = () => { if (img && img.src !== want) img.src = want; };
    probe.onerror = () => {};  // 变体未上线：保持当前图
    probe.src = want;
    if (!opts.sticky) {
      poseTimer = setTimeout(() => { poseTimer = null; setPose('idle'); }, opts.holdMs || 1400);
    }
  }
  /* 进化粒子爆发：形态切换到初鹿/鹿时触发（金色星光向外飞散） */
  function burstParticles() {
    if (!root) return;
    for (let i = 0; i < 12; i++) {
      const p = document.createElement('span');
      p.className = 'xs-burst';
      p.style.setProperty('--bx', (Math.random() * 140 - 70) + 'px');
      p.style.setProperty('--by', (Math.random() * -100 - 20) + 'px');
      p.style.setProperty('--bd', (Math.random() * .6).toFixed(2) + 's');
      root.appendChild(p);
      setTimeout(() => p.remove(), 1300);
    }
  }
  function applyGrowth(stage) {
    if (!root) return;
    const img = root.querySelector('.xs-png');
    if (img) {
      let want = null;
      for (const f of FORMS) if (stage >= f.min) want = f;
      if (want && img.dataset.form !== want.key) {
        const probe = new Image();
        probe.onload = () => {
          if (img.dataset.form !== want.key) {
            img.src = resolveSrc(want.key, root.dataset.pose || 'idle'); // F-07：切形态时保持当前姿态族
            img.dataset.form = want.key;
            root.dataset.form = want.key;
            root.classList.remove('form-in');
            void root.offsetWidth;  // 重新触发形变动画
            root.classList.add('form-in');
            if (want.key === 'fawn' || want.key === 'deer') burstParticles(); // 蜕变小鹿的星光爆发
          }
        };
        probe.onerror = () => {};   // 素材未生成：保持当前形态
        probe.src = want.src;
      }
    }
    const mark = root.querySelector('.xs-mark') || root.querySelector('.xs-png-mark');
    const halo = root.querySelector('.xs-halo') || root.querySelector('.xs-png-halo');
    if (mark) {
      mark.style.opacity = stage >= 1 ? '1' : '0';
      if (stage >= 2) mark.classList.add('spin-soft');
      if (stage >= 3) { root.style.filter = 'drop-shadow(0 0 14px rgba(232,176,75,.55))'; }
    }
    if (halo) {
      halo.style.opacity = 0.5 + Math.min(stage, 5) * 0.12;
    }
  }
  /* 当前形态（用于地图脚下的小标签） */
  function currentForm() {
    const key = root && root.dataset.form;
    return FORMS.find(f => f.key === key) || FORMS[0];
  }

  /* 语音包播放（晓声真说话）：mp3 + 气泡文字，语音失败不阻塞 */
  function sayVoice(key, text, opts = {}) {
    say(text, opts);
    try {
      const a = new Audio('assets/voices/' + key + '.mp3');
      a.volume = 0.9;
      a.play().catch(function () { /* noop */ });
    } catch (e) { /* 语音失败不阻塞 */ }
  }

  return {
    mount, say, sayVoice, finish, stopTyping, hideBubble, clear,
    setExpression, fireflies, applyGrowth, setPose, currentForm, isSpeaking
  };
})();
