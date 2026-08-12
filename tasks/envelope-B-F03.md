```text
A2A-MSG
from: Strategist（导演/Copilot）
to: Implementer（Cursor/Kimi K3）
goal: 产出 UI 审查 P1/P2 修复方案 docs/UI修复方案.md（每条：文件+行号+具体改法），供导演执行
layer: 当下
constraints: 只写 docs/UI修复方案.md；不改 src/；以 docs/UI审查报告.md（C-01 已审查）P1/P2 为起点；红线：对比度≥4.5:1、触控≥44px、动效只 transform/opacity
decision_asked: 已确认：P0 导演已修（grid-cell/跳过 44px），你从 P1 开始
artifacts: 读 docs/UI审查报告.md、docs/DESIGN.md、src/index.html、src/styles/main.css；产出 docs/UI修复方案.md
DoD: ① 每条给「文件+行号+具体 CSS/HTML 改法」可直接执行 ② 按严重度排序 ③ 标注每条是否影响冒烟 ④ 完成时 TASK_STATUS F-03→review + REPORT 留痕 + 信封 C 注明分支名 cursor/f-03
body: |
  背景：C-01 UI 审查报告已通过，P0 已修，P1/P2 待出可执行方案。
  建议切片（文件级）：
    1. 逐条从 UI审查报告 的 P1/P2 出发，落到文件+行号
    2. 每条给出改法（CSS 属性/HTML 结构），标注风险与是否需冒烟
    3. 注意 main.css 与线上引用文件（index.html 引用 styles/main_c20260812h.css）——若涉及样式，注明应改哪个文件（导演统一）
  不要做：不改 src/；不新增样式建议之外的改动
  风险：行号可能因近期改动漂移——标注时给出「类名/选择器」而非仅行号
```

> 存档：A2A 信封 B · 派 F-03 · 2026-08-12
