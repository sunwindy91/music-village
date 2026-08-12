# UI 修复方案 · P1/P2 可执行清单（F-03）

> 来源：`docs/UI审查报告.md`（C-01，审查基准 `main_c20260812b.css`）
> 执行：导演（本方案只出改法，不动 src/）
> 落点规则：**样式一律改当前线上引用文件 `src/styles/main_c20260812h.css`**（`index.html` L14 唯一引用；`main.css` 及其余带后缀旧版均不被引用，不改）。若导演再改名（i/j…），按本方案的「选择器」迁移，行号必然漂移。
> P0 状态复核：`.grid-cell min-height: 44px`（h 版 L1016）与 `.splash-skip min-height: 44px`（h 版 L277）**均已落地**，本方案从 P1 开始。
> 行号基准：当前工作区 `main_c20260812h.css` / `index.html` / `app.js`（2026-08-12 晚）。以选择器为准，行号仅供快速跳转。
> 冒烟基线：`node tools/smoke.js` = 27 PASS。每条标注「冒烟影响」。

---

## 总览

| # | 严重度 | 问题 | 落点文件 | 冒烟影响 |
|---|--------|------|----------|----------|
| P1-1 | P1 | 地图云朵纯白 `#ffffff` | `src/index.html` | 不影响 |
| P1-2 | P1 | `transition: all` / background 过渡 | `main_c20260812h.css` | 不影响 |
| P1-3 | P1 | 弹层缺 dialog 语义与焦点管理 | `index.html` + `app.js` | 不影响（建议跑一遍复核） |
| P1-4 | P1 | 320px 旋律田强制横滑无提示 | `app.js` + CSS | 不影响（提示为网格的兄弟节点） |
| P1-5 | P1 | `.splash-tag`/`.splash-skip` 灰字对比度不达标 | CSS | 不影响 |
| P2-1 | P2 | inset 阴影用纯黑 alpha | CSS | 不影响 |
| P2-2 | P2 | `.loc-level-go` 视觉 34×34 像小按钮 | CSS（可选） | 不影响 |
| P2-3 | P2 | 重置用浏览器 `confirm()` | `app.js` | 不影响（冒烟不点重置；需人工验证一次） |
| P2-4 | P2 | reduced-motion 未对装饰动画 `animation: none` | CSS | 不影响 |

---

## P1 · 应当修

### P1-1 地图云朵使用纯白 `#ffffff`（审查 #3）

- **问题**：宪法 Banned「纯白 #fff 大面积」；低端屏发飘刺眼。
- **文件+位置**：`src/index.html` L100–L102，选择器/特征：`<g class="map-clouds">` 内 3 个 `<ellipse fill="#ffffff">`。
- **具体改法**：3 处 `fill="#ffffff"` → `fill="#fff8ec"`（奶油白，token 已有 `--cream: #fff8ec`），`opacity` 保持不变：

```html
<g class="map-clouds">
  <ellipse cx="90"  cy="80" rx="46" ry="16" fill="#fff8ec" opacity="0.85"/>
  <ellipse cx="118" cy="72" rx="30" ry="13" fill="#fff8ec" opacity="0.85"/>
  <ellipse cx="250" cy="140" rx="40" ry="13" fill="#fff8ec" opacity="0.7"/>
</g>
```

- **冒烟影响**：不影响（仅 SVG 填充属性，无选择器/结构变化）。
- **风险**：无。
- **同源顺带（可选，同一审美问题）**：Splash 云朵 CSS `main_c20260812h.css` L234 `.cloud { background: rgba(255, 255, 255, .85); }` 也是纯白 alpha，可一并改 `rgba(255, 248, 236, .85)`。审查未单列此条，导演可裁量。

### P1-2 `.chip` / `.step-dot` 使用 `transition: all`（审查 #4）

- **问题**：宪法硬规则「动效只 transform / opacity」；`all` 会插值 background/border-color，易重绘卡顿。
- **文件+位置**：`main_c20260812h.css`
  - L983 `.chip`（审查基准 b 版 L976，已漂移）
  - L762 `.step-dot`（审查中「约 L755」的同类控件）
- **具体改法**：两处 `transition: all var(--t-fast) var(--ease);` 统一改成与 `.btn`（L166）一致的枚举式：

```css
transition: transform var(--t-fast) var(--ease), box-shadow var(--t-fast) var(--ease), opacity var(--t-fast);
```

  `.chip.on` / `.step-dot.done` 的背景与边框色切换变为瞬时——宪法允许（审查原文：「背景切换可瞬时」），视觉差异几乎不可感知。
- **同源顺带（建议一并，审查逐页表已点名「旋律田 transition/background P1」）**：
  - L1020 `.grid-cell`：`transition: background var(--t-fast), transform var(--t-fast) var(--ease), box-shadow var(--t-fast);` → 删掉 `background var(--t-fast),`，保留 transform/box-shadow。
  - L931 `.fruit`：同上删掉 `, background var(--t-fast)`。
- **冒烟影响**：不影响（纯动效声明，无选择器/属性名变化）。
- **风险**：极低；格子点亮/果实选中的颜色从 0.15s 淡入变瞬时，可接受。

### P1-3 地点/五线谱弹层缺 dialog 语义与焦点管理（审查 #5）

- **问题**：遮罩弹出后无 `role="dialog"` / `aria-modal` / 命名，无焦点进入与 Esc 关闭，Tab 可逃到背后地图。
- **文件+位置**：
  - 五线谱（静态）：`src/index.html` L213 `<div id="staff-overlay" class="overlay" hidden>`；标题在 L216 `<h2 class="staff-panel-title">`
  - 地点面板（动态）：`src/app.js` L233–L246（`openLocation` 创建 `.overlay#loc-overlay`），关闭钮监听在 L247
  - 五线谱开合逻辑：`src/app.js` L1477 `openStaff` / L1490 `closeStaff`
- **具体改法**：
  1. `index.html` L213 整行改为：

```html
<div id="staff-overlay" class="overlay" role="dialog" aria-modal="true" aria-labelledby="staff-title" hidden>
```

  2. `index.html` L216 h2 加 id：`<h2 class="staff-panel-title" id="staff-title">你的第一首谱</h2>`
  3. `app.js` `openLocation`（L233 之后）动态 overlay 补三行属性 + 标题 id + 焦点进入：

```js
overlay.className = 'overlay';
overlay.id = 'loc-overlay';
overlay.setAttribute('role', 'dialog');
overlay.setAttribute('aria-modal', 'true');
overlay.setAttribute('aria-labelledby', 'loc-panel-title');
// innerHTML 中 h2 改为：
// '<h2 class="loc-panel-title" id="loc-panel-title">' + loc.name + '</h2>'
// appendChild 之后补：
$('.loc-panel-close', overlay).addEventListener('pointerdown', () => overlay.remove());
$('.loc-panel-close', overlay).focus();
```

  4. `app.js` `openStaff`（L1479 `overlay.hidden = false;` 之后）补一行：`$('#staff-close').focus();`
  5. `app.js` `bindGlobal`（L1508 附近）补全局 Esc：

```js
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!$('#staff-overlay').hidden) closeStaff();
  const loc = $('#loc-overlay'); if (loc) loc.remove();
});
```

  （焦点陷阱 focus trap 列为可选增强，本期不做；Esc + 焦点进关闭钮已覆盖主要路径。）
- **冒烟影响**：不影响。只加 attribute/id/监听，未删改任何 class 与结构；冒烟 L218 断言 `$('#staff-overlay').hidden === false` 不受影响。改完建议仍跑一遍 `node tools/smoke.js` 复核 27 PASS。
- **风险**：低。`focus()` 在弹层刚 unhide 时调用即可，浏览器均支持；`.loc-panel-title` 加 id 不影响样式（样式走的是 class）。

### P1-4 320px 宽度旋律田强制横滑无提示（审查 #6）

- **问题**：`.grid-inner { min-width: 520px }`（h L1004，手机媒体查询 L1300 仍 500px）+ `.grid { overflow-x: auto }`（L1002）是有意保触控，但 320px 首屏只见半块田，易被误认为坏了。
- **文件+位置**：`src/app.js` L1248–L1250（compose HTML 注入）；`main_c20260812h.css` `.grid` 区块（L988 后）。
- **具体改法**（选低风险的「微文案提示」方案，不动网格结构）：
  1. `app.js` L1250 `'</div>' +`（grid 闭合）之后、`.compose-actions` 之前，加一行**兄弟节点**提示（切勿放进 `.grid` 内部——那是 `display: grid` 的 5 行网格，多加子节点会挤乱布局）：

```js
'<div class="grid" aria-label="旋律田，八拍五音">' +
  '<div class="grid-inner" id="cz-grid"></div>' +
'</div>' +
'<p class="grid-hint">田有点宽，左右滑滑看 →</p>' +
```

  2. CSS 追加（放 `.grid` 区块后，约 L1050 之后）：

```css
.grid-hint { display: none; text-align: center; color: var(--gray); font-size: 13px; margin: 6px 0 0; }
@media (max-width: 640px) {
  .grid-hint { display: block; }
}
```

  （可选增强：`.grid` 加右缘渐隐 `mask-image: linear-gradient(90deg, #000 92%, transparent)` 仅 ≤640px——老 WebView 对 mask 支持参差，非必须，导演裁量。）
- **冒烟影响**：不影响。提示是 `.grid` 的兄弟元素，冒烟对 `.grid-cell` / `#cz-grid` 的选择与点击全部不受影响。
- **风险**：低。媒体查询 L1294 已有 `max-width: 640px` 块，也可并进去；注意别误写成 `.grid` 的子选择器。
- **备注**：审查给的另一方案「改 4 列 + 分页拍」涉及玩法结构，工作量大，本期不采纳，仅留提示方案。

### P1-5 `.splash-tag` / `.splash-skip` 灰字对比度不达标（审查 #7）

- **问题**：`--gray: #6d7a70` 在 Splash 天空渐变底（`#bfe3ff`~`#dceffb`）实测估算 **≈3.3–4.2:1**，低于 4.5:1 红线；在奶油底也仅 ≈4.3:1 边缘。
- **文件+位置**：`main_c20260812h.css` L270 `.splash-tag { color: var(--gray); ... }`；L274 `.splash-skip` 的 `color: var(--gray);`。
- **具体改法**：两处 `var(--gray)` → `#4f5a54`（柔墨灰绿，贴晨雾色系；天空底 ≈5.4:1、奶油底 ≈6.8:1，达标）：

```css
.splash-tag { color: #4f5a54; font-size: 16px; margin-bottom: 14px; }
```

```css
.splash-skip {
  margin-top: 10px;
  color: #4f5a54;
  /* 其余保持不变 */
}
```

  若想最大安全余量可用 `var(--ink)`（#37423b，≈7.8–10:1），但正文感偏重；推荐 `#4f5a54`。
- **冒烟影响**：不影响（纯颜色值）。
- **风险**：无。导演改完建议用 Chrome DevTools 对比度工具实测一次（审查原文标「待实测」，本方案数值为 WCAG 公式估算）。
- **注意**：不要全局改 `--gray` token——它在 `.staff-note`、`.loc-level-txt small` 等奶油底场景用且大片达标（≈4.3–4.5 边缘属可接受范围），只局部改 Splash 两处即可，避免连锁偏色。

---

## P2 · 建议修

### P2-1 inset 阴影使用 `rgba(0,0,0,…)`（审查 #8）

- **问题**：宪法倾向「阴影染背景色、非纯黑」；当前 alpha 低、视觉影响小，故 P2。
- **文件+位置**：`main_c20260812h.css`
  - L946 `.fruit .fruit-dot`：`box-shadow: inset 0 -3px 0 rgba(0, 0, 0, .08);`
  - L1026 `.grid-cell.on`：`... inset 0 -3px 0 rgba(0, 0, 0, .1);`
  - L1032 / L1037 / L1042 三个乐器变体（bell/water/piano）同句式 `inset 0 -3px 0 rgba(0, 0, 0, .1)`
- **具体改法**：按各自底色染色替换（alpha 略升补偿变浅）：

```css
.fruit .fruit-dot { box-shadow: inset 0 -3px 0 rgba(45, 99, 73, .12); }
.grid-cell.on { box-shadow: 0 4px 10px rgba(45, 99, 73, .35), inset 0 -3px 0 rgba(45, 99, 73, .18); }
#cz-grid[data-inst="bell"] .grid-cell.on { box-shadow: 0 4px 10px rgba(154, 87, 24, .35), inset 0 -3px 0 rgba(154, 87, 24, .18); }
#cz-grid[data-inst="water"] .grid-cell.on { box-shadow: 0 4px 10px rgba(31, 99, 133, .35), inset 0 -3px 0 rgba(31, 99, 133, .18); }
#cz-grid[data-inst="piano"] .grid-cell.on { box-shadow: 0 4px 10px rgba(151, 64, 87, .35), inset 0 -3px 0 rgba(151, 64, 87, .18); }
```

- **冒烟影响**：不影响。
- **风险**：无；仅色相微调。

### P2-2 `.loc-level-go` 视觉 34×34 像小按钮（审查 #9）

- **问题**：箭头圆片 34×34 看似独立小按钮；真实热区是整行 `.loc-level`（`min-height: 68px`，h L616），**不算违规**。
- **文件+位置**：`main_c20260812h.css` L653–L664 `.loc-level-go`；DOM 在 `app.js` L284（已 `aria-hidden="true"`，无需动）。
- **具体改法（二选一，均为可选）**：
  - 方案 A（推荐，零风险）：**保持现状不改**。aria-hidden 已到位，语义无误导。
  - 方案 B：视觉放大到 44px 与热区一致感：L655–L656 `width/height: 34px` → `44px`，`font-size: 17px` → `19px`。
- **冒烟影响**：不影响（冒烟点的是整行 `.loc-level`）。
- **风险**：方案 B 会让面板右缘占位变宽，320px 下核对一眼不挤字即可。

### P2-3 重置使用浏览器 `confirm()`（审查 #10）

- **问题**：系统对话框脱离水彩 UI，部分 WebView 对 `confirm` 支持差。
- **文件+位置**：`src/app.js` L1510–L1516（`bindGlobal` 内 `#btn-reset` 监听）。审查基准 L1078–1083 已漂移至现 L1511。
- **具体改法**：用站内 overlay 确认面板整体替换该监听体（复用 `.overlay` / `.staff-panel` / `.btn` 现成样式，按钮 ≥48px 天然达标）：

```js
$('#btn-reset').addEventListener('pointerdown', () => {
  if ($('#reset-overlay')) return;
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.id = 'reset-overlay';
  ov.setAttribute('role', 'dialog');
  ov.setAttribute('aria-modal', 'true');
  ov.setAttribute('aria-labelledby', 'reset-title');
  ov.innerHTML =
    '<div class="staff-panel" style="max-width:380px;text-align:center">' +
      '<h2 class="staff-panel-title" id="reset-title">重新开始？</h2>' +
      '<p class="staff-note">积分和作品都会清空哦。</p>' +
      '<div class="staff-actions">' +
        '<button class="btn btn-ghost" id="reset-cancel" type="button">再想想</button>' +
        '<button class="btn btn-berry" id="reset-ok" type="button">清空重来</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(ov);
  $('#reset-cancel', ov).focus();
  $('#reset-cancel', ov).addEventListener('pointerdown', () => ov.remove());
  $('#reset-ok', ov).addEventListener('pointerdown', () => {
    localStorage.removeItem(C.storageKey);
    sessionStorage.removeItem('mv-greeted');
    location.reload();
  });
  ov.addEventListener('pointerdown', e => { if (e.target === ov) ov.remove(); });
});
```

  （`.btn-berry` 已存在于 h L193，草莓粉正合「 destructive 操作」语义；若 P1-3 的全局 Esc 已加，`#loc-overlay` 分支可顺带覆盖本面板：选择器改为 `$('#loc-overlay, #reset-overlay')`。）
- **冒烟影响**：不影响——冒烟脚本全程不点 `#btn-reset`（已核 `tools/smoke.js` 无 confirm 路径）。
- **风险**：中低。属行为改动，需人工点一次「重新开始」验证清空+刷新；确认钮用 `btn-berry` 与既有色板一致，无新样式引入。

### P2-4 reduced-motion 未对装饰动画直接 `animation: none`（审查 #11）

- **问题**：现 `.01ms + iteration 1`（h L1286–L1292）已合规，但无限装饰动画仍会起合成层，个别浏览器有残影。
- **文件+位置**：`main_c20260812h.css` L1286–L1292 `@media (prefers-reduced-motion: reduce)` 块。
- **具体改法**：块内追加装饰动画显式关闭清单（保留通用压时规则兜底）：

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
  /* 装饰性无限动画直接关停，避免合成层残留 */
  .cloud, .map-clouds, .firefly, .note-fireflies img,
  .xs-png-wrap.breathe .xs-png, .xs-holder.xs-breathe .xs,
  .xs-holder.xs-float .xs, .xs .xs-mark.spin-soft {
    animation: none !important;
  }
}
```

- **冒烟影响**：不影响（冒烟非 reduced-motion 环境）。
- **风险**：无。`.view.active` 的 `viewIn` 入场不在清单内，保留首帧即时呈现。

---

## 附：审查备注复核（备注 4 的残留扫描）

- `.overlay` 的 `inset: 0`：**已清除**——h 版 L1147 已改为 `top/left/right/bottom: 0`。
- `.grid-cell` 的 `aspect-ratio: 1.15`：**仍在**（h L1015）。老 WebView（旧安卓）不支持会整条忽略、仅靠 `min-height: 44px` 兜底，功能不坏但格子变扁。**建议**：L1015 补一行兜底高度或改为 `height: 100%` 类方案，或直接删除该行让 `min-height: 44px` 接管（视觉从方格变矮格，导演二选一）。此项未列入 P1/P2 正条，作为 P2 级附带项随本轮一起改亦可。
- Splash `.cloud` 纯白 alpha（h L234）：见 P1-1 同源顺带。

## 执行顺序建议（导演）

1. P1-5 / P1-1 / P1-2 / P2-1 / P2-4：纯 CSS+SVG 填充，一把改完 → 跑 `node tools/smoke.js`（预期 27 PASS 不变）。
2. P1-3 / P1-4 / P2-3：动 `index.html` / `app.js`，改完再跑一遍冒烟 + 人工过一遍「地点面板→关卡→五线谱→重置」主路径。
3. 若走「改名破缓存」流程（如 `main_c20260812i.css`）：同步改 `index.html` L14 引用名；`_headers` no-cache 已在，通常不必改名。
