/* ============================================================
 * 冒烟测试 · jsdom 运行时（内联 <script> 执行，贴近真实浏览器）
 * 驱动 Splash→地图→各关卡→作曲 主流程，捕获 window error，
 * 断言关键 UI 出现。
 * 运行：node tools/smoke.js（需先 npm i jsdom）
 * ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const SRC_ORDER = [
  'vendor/tonal.min.js',
  'vendor/vexflow.js',
  'config.js',
  'shared/lines.js',
  'shared/levels.js',
  'modules/audio/music-core.js',
  'modules/voice/voice-core.js',
  'modules/notation/staff.js',
  'app.js'
];

// 把 index.html 里所有 <script> 替换为内联内容，让 jsdom 以真实脚本语义执行
// （顶层 var 才会计入 window，如 Tonal/Vex）。Tone.js 需要 AudioContext，跳过加载。
// 注意：必须用「函数替换」——字符串替换会把 $ 当转义符（$$→$），损坏 app.js 的 $$ 声明。
let html = read('index.html').replace(/<script[\s\S]*?<\/script>/g, '');
let inline = '';
SRC_ORDER.forEach(f => {
  if (f.startsWith('vendor/tone')) return;
  inline += '<script>' + read(f).replace(/<\/script>/g, '<\\/script>') + '</script>\n';
});
html = html.replace('</body>', () => inline + '</body>');

const dom = new JSDOM(html, {
  url: 'http://localhost/',
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  // jsdom 无 PointerEvent，注入桩以模拟现代浏览器（否则 config.js 的兼容层
  // 会把 pointerdown 降级为 click，与真实现代浏览器行为不一致）
  beforeParse(window) {
    if (!window.PointerEvent) window.PointerEvent = class PointerEvent {};
  }
});
const { window } = dom;
const { document } = window;

const errors = [];
const notes = [];
const t0 = Date.now();
window.addEventListener('error', e => {
  const msg = 'window.onerror: ' + (e.error ? (e.error.stack || e.error.message) : e.message);
  errors.push(msg);
  console.error('  ✗ ' + msg);
});
window.addEventListener('unhandledrejection', e => {
  const msg = 'unhandledrejection: ' + ((e.reason && (e.reason.stack || e.reason)) || String(e.reason));
  errors.push(msg);
  console.error('  ✗ ' + msg);
});

const sleep = ms => new Promise(r => setTimeout(r, ms));
const click = el => el.dispatchEvent(new window.MouseEvent('pointerdown', { bubbles: true, cancelable: true }));
const ok = (cond, msg) => { notes.push((cond ? 'PASS' : 'FAIL') + '  ' + msg); if (!cond) process.exitCode = 1; };

(async () => {
  console.log('== 启动（内联脚本执行） ==');
  window.MV.config.typeSpeed = 1;

  // 追踪：startLevel 分派
  const _runners = window.MV.runners;
  for (const k of Object.keys(_runners)) {
    const orig = _runners[k];
    _runners[k] = function (lv, body) {
      console.log('  [trace] t=' + (Date.now() - t0) + 'ms startLevel -> ' + lv.id + ' session=' + window.MV._session);
      return orig.call(this, lv, body);
    };
  }
  await sleep(80);

  console.log('== 1. Splash → 山谷地图 ==');
  ok(window.MV.App.state.view === 'splash', '启动后停在 splash');
  ok(!!document.querySelector('#view-splash') && document.querySelector('#view-splash').classList.contains('active'), '开场视图已激活（可见）');
  ok(typeof window.Tonal !== 'undefined', 'Tonal 全局可用（真实脚本语义）');
  ok(typeof window.Vex !== 'undefined', 'Vex 全局可用');
  click(document.querySelector('.splash-go'));
  await sleep(150);
  ok(window.MV.App.state.view === 'map', '点击开始后进入地图');
  ok(document.querySelectorAll('.loc-node').length === 3, '地图上有 3 个地点节点');

  console.log('== 2. 声音山谷 · 谁更高 ==');
  click(document.querySelector('.loc-node'));
  await sleep(80);
  const chips = document.querySelectorAll('.loc-level');
  ok(chips.length === 3, '声音山谷有 3 个关卡入口');
  click(chips[0]);
  await sleep(500);
  ok(window.MV.App.state.view === 'stage', '进入关卡舞台');
  ok(!!document.querySelector('#hl-visual'), '谁更高：听辨区渲染');
  await sleep(2600);
  const ansBtns = document.querySelectorAll('[data-ans]');
  ok(ansBtns.length === 2, '谁更高：两个答案按钮就绪');
  ok(!ansBtns[0].disabled, '谁更高：按钮已可用（可作答）');
  click(ansBtns[0]);
  await sleep(600);
  click(document.querySelector('#stage-back'));
  await sleep(150);
  ok(window.MV.App.state.view === 'map', '返回地图');

  console.log('== 3. 小鼓手（渲染不崩溃） ==');
  click(document.querySelector('.loc-node'));
  await sleep(80);
  click(document.querySelectorAll('.loc-level')[1]);
  await sleep(650);
  ok(!!document.querySelector('#drum-pad'), '小鼓手：鼓面渲染');
  click(document.querySelector('#stage-back'));
  await sleep(120);

  console.log('== 4. 听音找家 ==');
  click(document.querySelector('.loc-node'));
  await sleep(80);
  click(document.querySelectorAll('.loc-level')[2]);
  await sleep(500);
  ok(!!document.querySelector('#sm-visual'), '听音找家：渲染');
  click(document.querySelector('#stage-back'));
  await sleep(120);

  console.log('== 5. 音阶山谷 · 认识音符 ==');
  click(document.querySelectorAll('.loc-node')[1]);
  await sleep(80);
  const ntChip = document.querySelector('.loc-level');
  if (!ntChip) { console.error('  ✗ FAIL 打开音阶山谷失败'); process.exit(1); }
  click(ntChip);
  await sleep(500);
  const fruits = document.querySelectorAll('.fruit');
  ok(fruits.length === 3, '认识音符：首轮 3 个果子（do re mi）');
  await sleep(1300); // 等第一个音播完
  if (fruits[0]) click(fruits[0]);
  await sleep(500);
  click(document.querySelector('#stage-back'));
  await sleep(120);

  console.log('== 5b. 音阶山谷 · 走走停停（时值听辨） ==');
  click(document.querySelectorAll('.loc-node')[1]);
  await sleep(80);
  const wsChips = document.querySelectorAll('.loc-level');
  ok(wsChips.length === 2, '音阶山谷有 2 个关卡入口（认识音符 + 走走停停）');
  click(wsChips[1]);
  await sleep(500);
  ok(window.MV.App.state.view === 'stage', '走走停停：进入关卡舞台');
  const wsCards = document.querySelectorAll('.ws-card');
  ok(wsCards.length === 3, '走走停停：三张时值卡渲染（走/走——/走————）');
  await sleep(600);
  ok(!wsCards[0].disabled, '走走停停：播放结束后可作答');
  click(document.querySelector('#stage-back'));
  await sleep(120);

  console.log('== 6. 旋律草原 · 网格作曲 + 五线谱出口 ==');
  click(document.querySelectorAll('.loc-node')[2]);
  await sleep(80);
  click(document.querySelector('.loc-level'));
  await sleep(500);
  const cells = document.querySelectorAll('.grid-cell');
  ok(cells.length === 40, '作曲网格：5 行 × 8 拍 = 40 格');
  [0, 9, 18, 27].forEach(i => click(cells[i]));
  ok(document.querySelectorAll('.grid-cell.on').length === 4, '种下 4 个音符');
  click(document.querySelector('#cz-play'));
  await sleep(150);
  const ptsBefore = window.MV.App.state.points;
  click(document.querySelector('#cz-clear'));
  await sleep(60);
  ok(document.querySelectorAll('.grid-cell.on').length === 0, '清空后网格为空');
  [1, 10, 19, 28, 37].forEach(i => click(cells[i]));
  click(document.querySelector('#cz-staff'));
  await sleep(700);
  ok(window.MV.App.state.works.length === 1, '作品已保存到音乐会');
  ok(window.MV.App.state.points === ptsBefore + window.MV.config.pointsPerCompose, '作曲积分 +30');
  ok(window.MV.App.state.completed['compose'] === true, '旋律草原已点亮');
  const staffBox = document.querySelector('#staff-canvas');
  ok(!!staffBox.querySelector('svg'), '五线谱 SVG 已真实渲染（VexFlow）');
  ok(!!document.querySelector('.personality-card'), '音乐人格卡已显示');
  ok(document.querySelector('#staff-overlay').hidden === false, '五线谱出口覆盖层可见');

  console.log('== 7. 事件兼容层（无 PointerEvent → click 兜底） ==');
  {
    const dom2 = new JSDOM('<html><head></head><body><button id="b">x</button></body></html>',
      { url: 'http://localhost/', runScripts: 'dangerously',
        beforeParse(w2) { try { delete w2.PointerEvent; } catch (e) { /* 不可删则跳过 */ } } });
    const w2 = dom2.window;
    ok(!w2.PointerEvent, '构造后无 PointerEvent（兼容层生效的前提）');
    const sc = w2.document.createElement('script');
    sc.textContent = read('config.js');
    w2.document.head.appendChild(sc);
    let fired = 0;
    const btn = w2.document.getElementById('b');
    btn.addEventListener('pointerdown', () => fired++);
    btn.dispatchEvent(new w2.MouseEvent('click', { bubbles: true, cancelable: true }));
    ok(fired === 1, '兼容层：pointerdown 监听在无 PointerEvent 环境由 click 触发');

    // 有 PointerEvent 时保持 pointerdown 绑定
    const dom3 = new JSDOM('<html><head></head><body><button id="b">x</button></body></html>',
      { url: 'http://localhost/', runScripts: 'dangerously',
        beforeParse(w3) { w3.PointerEvent = class {}; } });
    const w3 = dom3.window;
    const sc3 = w3.document.createElement('script');
    sc3.textContent = read('config.js');
    w3.document.head.appendChild(sc3);
    let fired3 = 0;
    const btn3 = w3.document.getElementById('b');
    btn3.addEventListener('pointerdown', () => fired3++);
    btn3.dispatchEvent(new w3.MouseEvent('pointerdown', { bubbles: true, cancelable: true }));
    btn3.dispatchEvent(new w3.MouseEvent('click', { bubbles: true, cancelable: true }));
    ok(fired3 === 1, '兼容层：有 PointerEvent 时仅 pointerdown 触发（不双触发）');
  }

  console.log('');
  console.log('== 结果汇总 ==');
  notes.forEach(n => console.log(' ' + n));
  if (errors.length) {
    console.log('\n== 运行时错误 ==');
    errors.forEach(e => console.log(' ✗ ' + e));
    process.exitCode = 1;
  } else {
    console.log('\n✔ 无运行时错误');
  }
  process.exit(process.exitCode || 0);
})().catch(e => { console.error('SMOKE FATAL:', e); process.exit(1); });
