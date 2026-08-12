```text
A2A-MSG
from: Strategist（导演/Copilot）
to: Implementer（Cursor/Kimi K3）
goal: 产出素材协作计划 docs/素材协作计划.md（现有盘点 + 聚类架构新素材清单 + 每张生图提示词），导演用 openai-next 执行生图
layer: 当下
constraints: 只写 docs/素材协作计划.md；不碰 src/、不生成图片（导演生图）；延续现有水彩+Q版立体风格；提示词参考 tools/gen_assets.py 的 ANCHOR
decision_asked: 已确认：openai-next 额度已授权，生图归导演执行；F-02 你只出清单+提示词
artifacts: 读 src/assets/（15 张现有素材）、docs/晓声_生图Prompt清单.md、src/tools/gen_assets.py、docs/聚类课程架构_v1.md；产出 docs/素材协作计划.md
DoD: ① 现有素材盘点（名称/用途/是否在线）② 聚类架构新素材清单（名称/用途/构图要点）：聚类封面×3、理论卡配图×3、音色关乐器×3（可选）、乐理小测装饰×1 ③ 每张给一段可直接用的生图提示词（水彩、低饱和莫兰迪、无文字、Q版）④ 完成时 TASK_STATUS F-02→review + REPORT 留痕 + 信封 C 注明分支名 cursor/f-02
body: |
  背景：产品升级为聚类课程（3 大聚类：声音山谷/音阶山谷/旋律草原），每个聚类有理论导入+关卡+乐理小测，需要配套美工素材提升观感。
  建议切片（文件级）：
    1. 盘点 src/assets/ 现有 15 张（晓声 6 形态 + valley 背景 + 关卡场景 + 人格卡等），标注在线状态
    2. 按 docs/聚类课程架构_v1.md 列新素材需求，排序按观感优先级
    3. 每张给提示词（参考 gen_assets.py ANCHOR 风格延续）
  不要做：不生成图片；不改 src/；不重复现有素材
  风险：提示词需中文+英文混合（dall-e-3 中文支持有限）；构图要点写清"无文字、水彩、低饱和、Q版圆润"
```

> 存档：A2A 信封 B · 派 F-02 · 2026-08-12
