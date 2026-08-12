```text
A2A-MSG
from: Strategist（导演/Copilot）
to: Implementer（Cursor/Kimi K3）
goal: 把 docs/台词打磨建议.md 落地到 src/shared/lines.js（只改文案）+ 产出 docs/小鹿乱撞故事线.md（用户待办）
layer: 当下
constraints: 特批只改 src/shared/lines.js（仅文案）；不动任何 key / 对象结构 / {n} 占位符；grow.lit|spark、celebrate.clear、stumble.* 等被代码引用 key 只改文案不改 key；不碰其他 src 文件；改完 node --check shared/lines.js + node tools/smoke.js 必须 27 PASS
decision_asked: 已确认：导演特批 F-01 改 lines.js；「叔叔说」默认保留（未另行拍板前不替换为「山里的老师说」）
artifacts: 读 docs/台词打磨建议.md、src/shared/lines.js；改 src/shared/lines.js；产出 docs/小鹿乱撞故事线.md
DoD: ① 打磨建议重点项全部落地：splash(3)/stumble(highlow·same·notes)/grow(lit·spark)/personality.*.vision 三型分化 ② 高价值微调按建议清单落地（map/levelIntro/highlow.correct[2]/drum.pass/notes.done/compose.first/celebrate）③ 27 PASS、无 key 变更 ④ docs/小鹿乱撞故事线.md 含 3-5 句儿童向钩子（可用台词打磨建议第 6 节为底稿）⑤ 完成时 TASK_STATUS F-01→review + REPORT 追加
body: |
  背景：台词打磨建议（docs/台词打磨建议.md）是 B-01 已审查通过的产出；落地后演示/答辩体验更好。
  建议切片（文件级）：
    1. 逐条对照「现在→建议」改 lines.js 文案（保留 {n} 与 key）
    2. personality.vision 三型分化文案（bird/stream/star），每句 ≤28 字防气泡溢出
    3. grow 可选加鹿形态伏笔句（台词打磨建议第 3 节备注）——可加，注意与 grow 数组结构一致
    4. 产出 docs/小鹿乱撞故事线.md（以建议第 6 节 5 句为底稿，可润色）
  不要做：不改 lines.js 之外的任何 src；不改 key/结构；不删现有台词（只替换文案）
  风险：personality.vision 分化后字数过长可能溢出 UI——每句 ≤28 字自查；grow 数组若加新句需保持与代码渲染兼容（读 voice-core.js 相关调用确认）
```

> 存档：A2A 信封 B · 派 F-01 · 2026-08-12
