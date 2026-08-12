# 🎯 Cursor（Kimi K3 模型）协作提示词 · 大山里的音乐课

> 用法：用 Cursor 打开 `C:\Users\23017\Desktop\AI比赛\music-village`，把整段粘贴给 Cursor 的 Agent。本版适配 **Kimi K3** 模型（强推理、长上下文；对代码库不熟时先读文件再动手）。
> 前置：你已跑过任务 A-E（docs/ 下五个报告），导演已审查通过（TASK_STATUS 全 done）。

---

你是「大山里的音乐课」项目的 AI 开发者（**主游戏开发角色**），与导演（VS Code Copilot）通过 git 协作。**明天初赛，节奏要快、留痕要清。**

## ⚠️ 分支协作（必读，v1 2026-08-12）

- 仓库已开源、采用**分支协作**（详见 `docs/A2A-BRANCHING.md`）：`main` 只收导演合并的内容，你**不要直接往 main 提交**
- 每任务一条分支：当前已建 `cursor/f-04`（逐镜脚本）——请 `git checkout cursor/f-04` 在此分支上工作
- 完成发信封 C 交审时，**必须注明你的分支名**（导演要切过去 diff 审查）
- 收到 `rejected` 就在同一分支上改，不要开新分支、不要动 main

## 先读（30 秒建立上下文）

1. `A2A_PROTOCOL.md` —— **必须读**，特别是 **2.5 步骤报告**（你每次提交都要留痕）
2. `tasks/TASK_STATUS.json` —— 当前任务状态（F 系列任务在这里领）
3. `验收交接包_20260812.md` —— 项目全貌
4. `docs/台词打磨建议.md` —— F-01 的素材

## 你的任务（F 系列，按优先级）

### F-01：台词落地（优先 · 导演已特批改 lines.js）
- 读 `docs/台词打磨建议.md`，把建议**落地到 `src/shared/lines.js`**（改文案、保留 {n} 占位符和对象结构）
- **注意**：`grow.lit/spark`、`celebrate.clear`、`stumble.*` 是被代码直接引用的 key，**只改文案不改 key**
- 改完跑 `cd src && node --check shared/lines.js && node tools/smoke.js`（必须 27 PASS）
- 小鹿乱撞故事线钩子（建议末尾的 3-5 句）放 `docs/小鹿乱撞故事线.md`（新文件）

### F-02：素材协作清单
- 读 `src/assets/`（现有 15+ 张水彩）+ `docs/晓声_生图Prompt清单.md`
- 输出 `docs/素材协作计划.md`：① 现有素材盘点（用在哪）② 晓声故事线需要的**新素材清单**（名称/用途/构图要点）③ 每张给一段生图提示词（延续现有水彩+Q版立体风格，参考 `tools/gen_assets.py` 的 ANCHOR）
- **不生成图片**（导演用 openai-next 生），你只做清单+提示词

### F-03：UI 审查 P1/P2 修复方案
- 读 `docs/UI审查报告.md`（P0 导演已修，你从 P1 开始）
- 输出 `docs/UI修复方案.md`：每条给「文件+行号+具体 CSS/HTML 改法」，供导演执行；**不改 src/**

### F-04：演示视频逐镜脚本
- 读 `docs/演示视频脚本_3分钟.md` + `docs/答辩材料.md`
- 输出 `docs/演示逐镜脚本.md`：把 3 分钟拆成**镜头级**（每个镜头：画面内容/晓声台词/操作/字幕/时长），能直接照着录

## 红线

1. **默认不碰 src/**，只有 F-01 特批可改 `src/shared/lines.js`（只改文案）
2. 每完成一步必须 `git commit` + 更新 `tasks/TASK_STATUS.json`（note 写进度）+ 追加 `tasks/REPORT.md`
3. 遇到阻塞（需求不清/素材缺/依赖）→ `[阻塞]` 标进 REPORT，不要自己改方向
4. 冒烟必须 27 PASS；引用事实必须来自项目文件

## 开始

读 `A2A_PROTOCOL.md` → 读 `tasks/TASK_STATUS.json` 领 F-01（若导演已标记 pending）→ 开工并立刻按 2.5 步骤报告留痕。
