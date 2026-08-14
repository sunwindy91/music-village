/* ============================================================
 * 全流程验收走查（用户旅程版）· jsdom 模拟真人从首屏玩到底
 * 运行：node tools/review_walkthrough.js
 * ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const SRC_ORDER = [
  'vendor/tonal.min.js', 'vendor/vexflow.js', 'config.js',
  'shared/lines.js', 'shared/levels.js',
  'modules/audio/music-core.js', 'modules/voice/voice-core.js',
  'modules/notation/staff.js', 'app.js'
];
let html = read('index.html').replace(/<script[\s\S]*?<\/script>/g, '');
let inline = '';
SRC_ORDER.forEach(f => { if (f.startsWith('vendor/tone')) return; inline += '<script>' + read(f).replace(/<\/script>/g, '<\\/script>') + '</script>\n'; });
html = html.replace('</body>', () => inline + '</body>');

const dom = new JSDOM(html, {
  url: 'http://localhost/', runScripts: 'dangerously', pretendToBeVisual: true,
  beforeParse(window) { if (!window.PointerEvent) window.PointerEvent = class PointerEvent {}; }
});
const { window } = dom;
const { document } = window;
const notes = [];
window.addEventListener('error', e => { const m = 'onerror: ' + (e.error ? (e.error.stack || e.error.message) : e.message); notes.push('FAIL  [运行错误] ' + m); console.error('  ✗ ' + m); });
window.addEventListener('unhandledrejection', e => { const m = 'unhandledrejection: ' + String(e.reason); notes.push('FAIL  [运行错误] ' + m); console.error('  ✗ ' + m); });

const sleep = ms => new Promise(r => setTimeout(r, ms));
const click = el => el && el.dispatchEvent(new window.MouseEvent('pointerdown', { bubbles: true, cancelable: true }));
const tap = el => { // 轻点：down+up（enableDrag 的 tap 判定在 pointerup）
  if (!el) return;
  el.dispatchEvent(new window.MouseEvent('pointerdown', { bubbles: true, cancelable: true }));
  el.dispatchEvent(new window.MouseEvent('pointerup', { bubbles: true, cancelable: true }));
};
const ok = (cond, msg) => { notes.push((cond ? 'PASS' : 'FAIL') + '  ' + msg); if (!cond) process.exitCode = 1; };

(async () => {
  window.MV.config.typeSpeed = 1;
  window.MV.config.levelLoadMs = 50; // 避免极短 setTimeout 调度疑云
  window.localStorage.setItem('mv-unlock-all', '1'); // 演示模式全开
  await sleep(100);

  console.log('═══ ① 首屏 Splash ═══');
  ok(window.MV.App.state.view === 'splash', '停在开场');
  ok(!!document.querySelector('#splash-notes') && document.querySelectorAll('#splash-notes .nf').length >= 4, '漂浮音符 ≥4 个');
  ok(!!document.querySelector('.splash-title'), '大标题存在');
  ok(!!document.querySelector('.splash-tag'), '副标题存在');
  ok(!!document.querySelector('.splash-go'), '「开始寻宝」按钮');
  ok(!!document.querySelector('#splash-xs .xs-png-wrap'), '晓声已挂载');

  console.log('═══ ② 进入山谷地图 ═══');
  click(document.querySelector('.splash-go'));
  await sleep(160);
  ok(window.MV.App.state.view === 'map', '点击开始进入地图');
  const nodes = document.querySelectorAll('.map-node');
  ok(nodes.length === 5, '5 个聚类节点');
  ok(document.querySelectorAll('.map-node .step-num').length === 5, '序号徽章 1-5');
  ok(document.querySelectorAll('#map-links path').length === 4, '4 段连线');
  ok(!!document.querySelector('.xs-form-tag'), '晓声形态标签');
  ok(!!document.querySelector('.map-concert-btn'), '我的音乐会按钮');
  ok(!!document.querySelector('.map-qa-btn'), '问问晓声按钮');
  ok(!!document.querySelector('#map-xs .xs-png-wrap'), '地图晓声挂载');

  console.log('═══ ③④ 问答盘/换形态 ═══');
  const SKIP_QA_SKIN = false;
  if (!SKIP_QA_SKIN) {
    tap(document.querySelector('#map-xs'));
    await sleep(140);
    const qaOv = document.querySelector('#qa-overlay');
    ok(!!qaOv && !qaOv.hidden, '轻点晓声→对话盘弹出');
    ok(document.querySelectorAll('#qa-chat .qa-bubble').length >= 1, '晓声欢迎气泡');
    ok(!!document.querySelector('#qa-mic'), '🎤 语音按钮');
    ok(!!document.querySelector('#qa-skin'), '🎭 换形态按钮');

    console.log('═══ ④ 换形态面板（演示模式全开） ═══');
    click(document.querySelector('#qa-skin'));
    await sleep(120);
    const skinOpts = document.querySelectorAll('#skin-options .skin-opt');
    ok(skinOpts.length === 6, '6 个形态选项');
    ok(document.querySelectorAll('#skin-options .skin-opt.locked').length === 0, '演示模式全部可选（无锁）');
    // 选小芽（选项2）→ 地图晓声应同步
    const opt2 = document.querySelectorAll('#skin-options .skin-opt')[1];
    click(opt2);
    await sleep(200);
    const mapImg = document.querySelector('#map-xs .xs-png');
    ok(!!mapImg && mapImg.getAttribute('src') && mapImg.getAttribute('src').indexOf('sprout') >= 0, '切形态后地图晓声同步为小芽');
    click(document.querySelector('#skin-close'));
    click(document.querySelector('#qa-close'));
    await sleep(80);
  }

  console.log('═══ ⑤ 声音山谷：理论卡 + 关卡列表 ═══');
  click(document.querySelectorAll('.map-node')[0]);
  await sleep(100);
  const tGo = document.querySelector('#theory-go');
  ok(!!tGo, '理论导入卡先出现（教学闭环①）');
  click(tGo);
  await sleep(90);
  const chips = document.querySelectorAll('.loc-level');
  ok(chips.length === 4, '声音山谷 4 入口（3 关+小测）');

  console.log('═══ ⑥ 谁更高：答题姿态 ═══');
  click(chips[0]);
  // 轮询等待关卡渲染（loading→intro→startLevel）
  let bodyLen = 0;
  for (let i = 0; i < 50; i++) { bodyLen = (document.querySelector('#stage-body') || {}).innerHTML.length || 0; if (bodyLen > 20) break; await sleep(100); }
  await sleep(200);
  ok(window.MV.App.state.view === 'stage', '进入关卡舞台');
  // 诊断：关卡是否渲染
  const dbg = 'view=' + window.MV.App.state.view +
    ' | stage-title=' + (document.querySelector('#stage-title') || {}).textContent +
    ' | body-len=' + (document.querySelector('#stage-body') || {}).innerHTML.length +
    ' | body-head=' + ((document.querySelector('#stage-body') || {}).innerHTML || '').slice(0, 80) +
    ' | hl-visual=' + !!document.querySelector('#hl-visual');
  try { fs.appendFileSync(path.join(ROOT, 'walkthrough-debug.txt'), dbg + '\n', 'utf8'); } catch (e) {}
  ok(bodyLen > 20, '关卡舞台已渲染（body 非空，head=' + ((document.querySelector('#stage-body') || {}).innerHTML || '').slice(0, 60) + '）');
  ok(!!document.querySelector('#hl-visual'), '听辨区渲染');
  await sleep(2400);
  const ansBtns = document.querySelectorAll('[data-ans]');
  ok(ansBtns.length === 2, '高/低两按钮就绪');
  click(ansBtns[0]);
  await sleep(450);
  const xsWrap = document.querySelector('#stage-xs .xs-png-wrap');
  ok(!!xsWrap && (xsWrap.classList.contains('pose-happy') || xsWrap.classList.contains('pose-comfort')), '答完触发情绪姿态（开心/安抚）');
  // 再点一次错 → 第二次后卡关（stumble）→ curious
  click(ansBtns[1]);
  await sleep(300);
  click(ansBtns[1]);
  await sleep(900);
  const xsWrap2 = document.querySelector('#stage-xs .xs-png-wrap');
  ok(!!xsWrap2 && xsWrap2.classList.contains('pose-curious'), '连续答错→好奇探头（卡关陪伴）');
  click(document.querySelector('#stage-back'));
  await sleep(130);
  ok(window.MV.App.state.view === 'map', '返回地图');

  console.log('═══ ⑦ 通关庆祝 + 继续闯关 ═══');
  // 状态驱动：完成 drum+same 两关，再通关 highlow（此时第 3 关→跨形态进化）
  window.MV.App.state.completed['drum'] = true;
  window.MV.App.state.completed['same'] = true;
  const hlLv = window.MV.levels.find(x => x.id === 'highlow');
  window.MV.App.celebrate(hlLv);
  await sleep(500);
  ok(window.MV.App.state.view === 'celebrate', '庆祝页出现');
  ok(!!document.querySelector('#celebrate-xs .xs-png-wrap'), '庆祝页晓声渲染');
  ok(!!document.querySelector('.xs-evolve-flash'), '进化金光爆元素出现');
  await sleep(600); // 等气泡打字（typeSpeed=1）
  const xst = (document.querySelector('#celebrate-xs .xs-text') || {}).textContent || '';
  const cline = (document.querySelector('#celebrate-line') || {}).textContent || '';
  ok(xst.length > 4, '庆祝页晓声气泡文字完整（' + xst.slice(0, 20) + '）');
  ok(cline.length > 4, '庆祝页标题行文字完整（' + cline.slice(0, 20) + '）');
  ok(document.querySelector('#celebrate-next').textContent.indexOf('继续闯关') >= 0, '按钮文案=继续闯关');
  click(document.querySelector('#celebrate-next'));
  await sleep(250);
  const locOv = document.querySelector('#loc-overlay');
  ok(!!locOv && !locOv.hidden, '继续闯关→直接回到聚类关卡列表（少点一步）');
  ok(document.querySelectorAll('#loc-overlay .loc-level').length === 4, '聚类关卡列表就绪');

  console.log('═══ ⑧ 乐理小测（含新题） ═══');
  // 进音阶山谷小测
  click(document.querySelector('#stage-back')); await sleep(120);
  const scaleNode = document.querySelectorAll('.map-node')[1];
  click(scaleNode); await sleep(100);
  const sg = document.querySelector('#theory-go'); if (sg) { click(sg); await sleep(80); }
  const sChips = document.querySelectorAll('.loc-level');
  ok(sChips.length === 8, '音阶山谷 8 入口（乐理课 7+复习）');
  click(sChips[sChips.length - 1]);
  await sleep(600);
  ok(window.MV.App.state.view === 'stage', '进入小测舞台');
  let quizBtns = [];
  for (let i = 0; i < 30; i++) { quizBtns = document.querySelectorAll('.answer-btn'); if (quizBtns.length >= 3) break; await sleep(100); }
  ok(quizBtns.length >= 3, '小测选项渲染 ≥3');

  console.log('═══ ⑨ 旋律田：多音色混排 ═══');
  click(document.querySelector('#stage-back')); await sleep(120);
  click(document.querySelectorAll('.map-node')[2]); await sleep(100); // meadow 旋律草原（数组序：valley/scale/meadow/rhythm/chord）
  const mg = document.querySelector('#theory-go'); if (mg) { click(mg); await sleep(80); }
  const mChips = document.querySelectorAll('.loc-level');
  const compChip = Array.from(mChips).find(c => c.textContent.indexOf('旋律田') >= 0 || c.textContent.indexOf('作曲') >= 0 || c.textContent.indexOf('种') >= 0) || mChips[0];
  click(compChip);
  await sleep(700);
  let cells = [];
  for (let i = 0; i < 30; i++) { cells = document.querySelectorAll('.grid-cell'); if (cells.length >= 56) break; await sleep(100); }
  ok(cells.length === 56, '旋律田 7 行×8=56 格（七音阶）');
  ok(document.querySelectorAll('.grid-row').length === 7, '7 行音高');
  // 多音色：小鸟填两格 → 切风铃 → 填一格 → 检查颜色/inst 记忆
  const birdChip = Array.from(document.querySelectorAll('[data-inst]')).find(c => c.textContent.indexOf('小鸟') >= 0);
  click(birdChip);
  click(cells[0]); await sleep(120);
  click(cells[1]); await sleep(120);
  const bellChip = Array.from(document.querySelectorAll('[data-inst]')).find(c => c.textContent.indexOf('风铃') >= 0);
  click(bellChip);
  click(cells[8]); await sleep(120);
  ok(cells[0].classList.contains('on') && cells[0].dataset.inst === 'bird', '格子0=小鸟(绿)');
  ok(cells[8].classList.contains('on') && cells[8].dataset.inst === 'bell', '格子8=风铃(金，已记忆)');
  ok(cells[0].dataset.inst === 'bird', '换音色后已填格音色不被改');
  ok(!!document.querySelector('#cz-staff'), '变成五线谱按钮');
  // 听一听按钮存在（多音色播放不崩）
  ok(!!document.querySelector('#cz-play'), '听一听按钮');
  click(document.querySelector('#cz-play'));
  await sleep(200);

  console.log('═══ ⑩ 五线谱 + 音乐会 + 鼓励语 ═══');
  click(document.querySelector('#cz-staff'));
  await sleep(300);
  ok(!document.querySelector('#staff-overlay').hidden, '五线谱面板弹出');
  click(document.querySelector('#staff-close')); await sleep(100);
  click(document.querySelector('#stage-back')); await sleep(130);
  click(document.querySelector('.map-concert-btn'));
  await sleep(150);
  ok(window.MV.App.state.view === 'concert', '进入我的音乐会');
  ok(document.querySelectorAll('.work-card').length >= 1, '作品墙有作品');
  click(document.querySelector('[data-play]'));
  await sleep(1200);
  ok(!document.querySelector('#encourage-overlay').hidden, '作品播完弹出鼓励语卡片');
  ok(document.querySelector('#encourage-text').textContent.length > 10, '鼓励语文字（给山里孩子）');
  click(document.querySelector('#encourage-close'));

  console.log('═══ ⑪ 皮肤锁定逻辑（关闭演示模式） ═══');
  window.localStorage.setItem('mv-unlock-all', '0');
  click(document.querySelector('#concert-back')); await sleep(130);
  // 完成 3 关 → 基础进度 base=3（种子/小芽/开花可选）
  window.MV.App.state.completed['highlow'] = true;
  window.MV.App.state.completed['drum'] = true;
  window.MV.App.state.completed['same'] = true;
  click(document.querySelector('#map-xs'));
  await sleep(100);
  click(document.querySelector('#qa-skin'));
  await sleep(100);
  const locked = document.querySelectorAll('#skin-options .skin-opt.locked').length;
  ok(locked >= 3, '未解锁形态显示 🔒 锁定（' + locked + ' 个锁）');
  click(document.querySelector('#skin-close')); click(document.querySelector('#qa-close'));

  console.log('');
  console.log('═══════════ 验收汇总 ═══════════');
  const pass = notes.filter(n => n.startsWith('PASS')).length;
  const fail = notes.filter(n => n.startsWith('FAIL')).length;
  console.log('PASS: ' + pass + ' | FAIL: ' + fail + ' | 总: ' + notes.length);
  try { fs.writeFileSync(path.join(ROOT, 'walkthrough-result.txt'), notes.join('\n'), 'utf8'); } catch (e) { /* noop */ }
  process.exit(fail ? 1 : 0);
})();
