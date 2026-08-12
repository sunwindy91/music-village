# UI / 无障碍审查报告 · 大山里的音乐课

> 审查对象：当前线上样式入口 `src/styles/main_c20260812b.css`（`index.html` L14）+ `src/index.html` + 关卡注入 DOM（`app.js` 只读）  
> 对照：`docs/DESIGN.md` 设计宪法（无纯黑纯白、饱和度≤70%、触控≥44px、对比度≥4.5:1、动效 transform/opacity、`prefers-reduced-motion`）  
> 方法：静态对照源码行号（本轮未做浏览器像素级测色仪；对比度按 token 估算，标为「待实测」）  
> 排序：严重度 P0 → P2

---

## 总览

| 严重度 | 数量 | 摘要 |
|--------|------|------|
| P0 | 2 | 触控目标不足；网格格点 min-height 40px |
| P1 | 5 | 跳过链触控/对比；纯白装饰；动效 `transition:all`；弹层无 dialog 语义；320 宽横向滚动 |
| P2 | 4 | inset 阴影用纯黑 alpha；焦点/aria 缺口；还原动效未禁 transform 以外属性动画等 |

整体：主按钮、顶栏 icon、答题钮、chip 多数 ≥44px，且已有 `:focus-visible` 与多处 `aria-label`/`aria-live`——基础不错。下列为相对宪法的缺口。

---

## P0 · 必须修（触控红线）

### 1. 旋律田格子 `min-height: 40px` < 44px
- **文件+行号**：`src/styles/main_c20260812b.css` L1007–L1009（`.grid-cell`）
- **现象**：`min-height: 40px`，且依赖 `aspect-ratio` / 父级 `min-width` 撑开；注释写「保证 ≥44px」（约 L997 `.grid-inner`），与数值矛盾。
- **原因**：设计宪法与 CSS 头注释均要求触控 ≥44px；作曲是核心玩法，误触/点空成本高。
- **建议**：`min-height: 44px`（或 `min-width/min-height` 双 44）；手机 `@media`（L1271+）同步检查 `.grid-inner { min-width: 500px }` 是否仍能保证每格 ≥44。
- **截图建议**：iPhone SE / 320px 宽下点格子，叠 44×44 示意框。

### 2. 「跳过」可点区域偏矮
- **文件+行号**：`src/index.html` L41（`.splash-skip`）；`main_c20260812b.css` L272–L278（`padding: 8px 14px; font-size: 14px`）
- **现象**：估算可视高度约 14+16≈30px，**<44px**；虽是 `<p role="button">`，触控热区仍偏小。
- **原因**：次要操作也需满足儿童触控最小值。
- **建议**：`min-height: 44px; display:inline-flex; align-items:center;`；或改成真正的 `<button class="btn btn-ghost">`。
- **截图建议**：Splash 底「点这里跳过」叠热区框。

---

## P1 · 应当修

### 3. 地图云朵使用纯白 `#ffffff`
- **文件+行号**：`src/index.html` L100–L102（`fill="#ffffff"`）
- **现象**：宪法 Banned「纯白 `#fff` 大面积」；此处为装饰云，半透明，但仍是纯白填色。
- **原因**：与「无纯白」字面冲突；低端屏上可能显得发飘/刺眼。
- **建议**：改为奶油白系如 `#fff8ec` / `#f3e8d1`，保留 opacity。
- **截图建议**：地图天空局部。

### 4. `.chip` / 同类使用 `transition: all`
- **文件+行号**：`main_c20260812b.css` L976（`.chip`）；另见约 L755（若同类控件也有 `transition: all`）
- **现象**：宪法要求动效只用 **transform / opacity**；`all` 会插值 `background`/`border-color`/`box-shadow`。
- **原因**：易引起重绘卡顿，且违反已声明红线。
- **建议**：改成与 `.btn` 一致：`transition: transform …, box-shadow …, opacity …`（背景切换可瞬时或只用 opacity 层）。

### 5. 地点/五线谱弹层缺少 dialog 语义与焦点管理
- **文件+行号**：
  - 地点面板：`src/app.js` L211–L224（动态 `.overlay#loc-overlay`，无 `role="dialog"`）
  - 五线谱：`src/index.html` 五线谱 overlay 区（约 L210+ `staff-overlay`）；样式 `main_c20260812b.css` L1122–L1132
- **现象**：遮罩弹出后无 `aria-modal="true"`、无标题 `aria-labelledby`、无焦点陷阱；Tab 可逃到背后地图。
- **原因**：键盘/读屏用户会迷失；儿童向也影响「关闭」可发现性（虽有关闭钮）。
- **建议**：overlay 加 `role="dialog" aria-modal="true"`；打开时 focus 关闭钮；Esc 关闭；可选简单 focus trap。
- **截图建议**：打开地点面板后 Tab 一圈的焦点环路径。

### 6. 320px 宽度下旋律田强制横滑
- **文件+行号**：`main_c20260812b.css` L997 附近 `.grid-inner { min-width: 520px }`；L1277 `@media` 仍 `min-width: 500px`；`.grid { overflow-x: auto }`（约 L988）
- **现象**：为保触控故意横滑——可接受，但 320px 设备首屏会「只看见半块田」，易误以为坏了。
- **原因**：宪法要求「手机 320px 不溢出」——页面级 `body` 有 `overflow-x: hidden`，但组件内滚动需有可视提示。
- **建议**：增加「左右滑查看」微文案或渐隐边缘提示；或改为 4 列 + 分页拍，避免 500px 硬宽。
- **截图建议**：320px 宽旋律田首屏。

### 7. `.splash-tag` / `.splash-skip` 灰色字对比度待实测
- **文件+行号**：CSS L270（`.splash-tag { color: var(--gray) }`）；L274（skip 同色）
- **token**：`--gray: #6d7a70` on 晨雾/奶油底（`--cream #fff8ec` / 天空渐变）
- **估算**：约 4.3–5:1 边缘带，**待用对比度工具实测**；若 <4.5 则不达标。
- **建议**：正文灰改用 `--ink #37423b` 或加深到 `#5a6560`；skip 不要用过浅灰。

---

## P2 · 建议修

### 8. 内阴影使用 `rgba(0,0,0,…)`
- **文件+行号**：`main_c20260812b.css` L939（`.fruit .fruit-dot`）；L1019（`.grid-cell.on`）
- **现象**：宪法倾向「阴影染背景色、非纯黑」；此处 alpha 很低，视觉影响小。
- **建议**：改为 `rgba(45,99,73,.12)` 一类染色。

### 9. `.loc-level-go` 视觉 34×34（父按钮已够大）
- **文件+行号**：`main_c20260812b.css` L646–L650
- **说明**：整行 `.loc-level` `min-height: 68px`（约 L597+）是真实热区，**不算违规**；但箭头本身像小按钮，可能误导。
- **建议**：保持父级热区；箭头改为装饰 `aria-hidden`（已有）即可，或放大到 44 视觉一致。

### 10. 重置使用浏览器 `confirm()`
- **文件+行号**：`src/app.js` L1078–L1083
- **现象**：系统对话框无障碍尚可，但脱离水彩 UI，且部分 WebView 对 `confirm` 支持差。
- **建议**：自制确认面板（大按钮「清空 / 再想想」≥44px）。

### 11. `prefers-reduced-motion` 已覆盖，但未关掉无限位移动画的「意义」
- **文件+行号**：`main_c20260812b.css` L1263–L1268
- **现象**：已把 animation/transition 压到 0.01ms——合规。云朵 `drift` 等会停住，OK。
- **建议**：可选对装饰动画直接 `animation: none`，避免某些浏览器仍合成一层。

---

## 已合规亮点（避免误报）

| 项 | 位置 | 说明 |
|----|------|------|
| `:focus-visible` | CSS L77–L80 | 金色描边焦点可见 |
| 主按钮触控 | `.btn` / `.icon-btn` L121+ | 48px icon、按钮 min-height 48+ |
| 答题钮 | `.answer-btn` ~L760 | min-height 76px |
| 积分 live | `index.html` L53/L160 `aria-live="polite"` | 读屏可感知 |
| 关卡区 aria | 多 section `aria-label` | Splash/地图/舞台/庆祝/音乐会 |
| 鼓垫键盘 | `app.js` drum pad `role="button"` + keydown | 可键操 |
| 跳过键 | `app.js` bootSplash keydown Enter/Space | 已接线 |
| 动效降级 | CSS L1263 | reduced-motion 存在 |

---

## 逐页检查清单（简表）

| 页 | 触控 | 对比度 | 动效 | 焦点/ARIA | 320 宽 |
|----|------|--------|------|-----------|--------|
| Splash | 主钮 OK；跳过 P0 | tag/skip 待测 | OK | section label OK | OK |
| 地图 | 节点/音乐会 OK | 云纯白 P1 | 萤火 OK | 节点有 aria-label | 基本 OK |
| 地点面板 | 行 OK | OK | viewIn OK | 缺 dialog P1 | OK |
| 听辨关 | 答题钮 OK | OK | transform OK | 按钮语义 OK | OK |
| 小鼓手 | 鼓面大 OK | OK | scale OK | role=button OK | OK |
| 认识音符 | fruit≥44 OK | OK | pop/shake OK | 需确认每果 aria | OK |
| 旋律田 | **格子 P0** | OK | transition/all、background P1 | 格有 aria-label | 横滑 P1 |
| 庆祝/音乐会 | 钮 OK | OK | confetti 已 aria-hidden | OK | OK |
| 五线谱层 | 钮 OK | OK | fadeIn opacity OK | 缺 modal P1 | OK |

---

## 备注

1. 行号以仓库当前 `main_c20260812b.css` / `index.html` / `app.js` 为准；导演若再改名 CSS，请按选择器重定位。  
2. 对比度未用仪器实测——标「待实测」者请导演用 Chrome DevTools 或 contrast checker 复核后再改色。  
3. 本报告**不修改**任何 `src/` 文件。  
4. 导演提交 `80f01ed` 称去除 `inset/aspect-ratio/min()`；审查时 `.overlay` 仍见 `inset:0`、`.grid-cell` 仍见 `aspect-ratio`——若目标是老 WebView，建议再扫一遍残留（不确定是否有后处理未覆盖全文件）。
