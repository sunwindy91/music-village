```text
A2A-MSG
from: Strategist（导演/Copilot）
to: Implementer（Cursor/Kimi K3）
goal: 产出晓声 3D 素材「接入与交互姿态映射」方案（docs/晓声3D素材接入方案.md），导演按方案执行代码
layer: 当下
constraints: 只写 docs/晓声3D素材接入方案.md；不碰 src/、不生成图片；所有事实来自 `素材工作台\06_待生成图放这里\` 的 21 张素材文件名与 `voice-core.js` 现状
decision_asked: 已确认：用户已生成 21 张 3D 手办（山灵×12/鹿宝宝×4/小鹿×4/迷你单叶×1）；导演已定 6 张主体（见下方主体表）；你补全交互姿态映射与接入点设计
artifacts: 读 src/modules/voice/voice-core.js（FORMS/applyGrowth/.xs-png）、src/app.js（关卡情绪触发点：celebrate/卡关/答题）、素材工作台\06_待生成图放这里\（21 张文件名）；产出 docs/晓声3D素材接入方案.md
DoD: ① 21 张素材姿态盘点表（名称→形态/情绪分类：待机/开心/思考/好奇/安抚/庆祝）② 每形态主体图（导演已定 6 张）确认 + 备用候选 ③ **交互变体→关卡事件映射**：每张变体图对应哪个情绪事件（通关开心/答对/答错安抚/卡关陪伴/欢迎/成长蜕变/小测）④ 比例与裁切规范（竖版手办 480px、object-fit:contain、透明底、视觉重心对齐）⑤ **voice-core 姿态层接入设计**：如何让不同情绪显示不同 3D 图（如 data-pose → img.src 切换，与 applyGrowth 形态共存、与 SVG 表情共存策略）⑥ 完成时 TASK_STATUS F-07→review + REPORT + 信封 C 注明分支 cursor/f-07
body: |
  背景：晓声从 2D SVG 升级 3D 手办（用户即梦生成 21 张多姿态），需要：主体 6 张替换成长形态（点亮驱动），变体图做关卡内情绪交互。
  导演已定主体：种子=迷你单叶山灵招手踮脚 / 小芽=3D山灵手办治愈微笑 / 开花=3D山灵手办花开心举手 / 星光=3D山灵手办花环微笑 / 初鹿=3D鹿宝宝手办温柔歪头 / 鹿=3D小鹿手办治愈歪头。
  建议切片（文件级）：
    1. 姿态盘点（12 张山灵 + 4 鹿宝 + 4 小鹿 + 1 单叶）
    2. 情绪→图片映射表（含具体关卡触发点建议：celebrate→开心拥抱/花环跳跃；卡关 stumble→好奇探头/歪头捧脸；答对→开心托腮；欢迎→迷你单叶招手）
    3. voice-core 姿态层设计（data-pose 属性 + 图片映射，与 applyGrowth 的形态图共存——形态决定 base 图，姿态决定覆盖？给出最简可靠方案）
  不要做：不碰 src/；不生成图片
  风险：3D 图 object-fit 与现有 .xs-png 样式（cover）冲突——给出 contain 方案与视觉重心对齐建议
```

> 存档：A2A 信封 B · 派 F-07 · 2026-08-13
