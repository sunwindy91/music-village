# 🤖 A2A 协作协议 · 大山里的音乐课（多 Agent 角色脚本 + 轮询机制）

> 版本 v1 · 2026-08-12
> 目的：让 VS Code Copilot（主窗口）与 Cursor（编排多个子 agent）在**同一 git 仓库**里并行干活、对齐颗粒度、可轮询、可审查，**不需要实时聊天**。
> 配套：`MUSIC_VILLAGE_CURSOR_TASKS.md`（任务包）、`tasks/TASK_STATUS.json`（状态文件）。

---

## 1. 参与方与角色（谁干什么）

| 角色 | 载体 | 职责 | 产出 |
|---|---|---|---|
| **导演** | VS Code Copilot（我） | 主开发、部署、最终审查、对用户负责 | `src/` 活跃文件、部署、审查结论 |
| **主游戏开发** | Cursor 主 agent（你的 Cursor 窗口） | 游戏逻辑/关卡/功能开发（乐理小达人就是它开发的，能力已验证） | `src/`（经我审查后合入） |
| **文案/设计/调研** | Cursor 子 agent（可并行多个） | 台词、UI 审查、代码审查、调研、演示材料 | `docs/`、`tasks/` 报告 |
| **素材** | openai-next（GPT/dall-e-3） | 生图（已集成 `tools/gen_assets.py`） | `src/assets/*.webp` |
| **质量官** | 我 + 冒烟测试 + Impeccable | 审查全部改动 | `git diff` 结论、测试结果 |

> 分工原则：**Cursor 适合做"主开发"**（它能编排多子 agent 各自扮演角色）；**我做导演+审查+集成**，保证不冲突、质量红线不破。

## 2. 通信机制（无需实时聊天，靠文件对齐）

- **唯一事实源**：git 仓库（`music-village/`）
- **状态文件**：`tasks/TASK_STATUS.json` —— 双方 agent 读写，任务状态机如下：

```json
{
  "tasks": [
    {
      "id": "A-01",
      "title": "3分钟演示脚本+答辩材料",
      "owner": "cursor",
      "status": "pending",          // pending | in_progress | review | done | rejected
      "files": ["docs/演示视频脚本_3分钟.md", "docs/答辩材料.md"],
      "defOfDone": "含开场/玩法/陪伴/升华四段+5亮点+10Q&A",
      "review": null                 // 导演审查结论：ok / 修改意见
    }
  ]
}
```

- **轮询规则**：
  1. Cursor 开工：把任务 `pending → in_progress`，`git commit`
  2. Cursor 完成：写产出文件，任务 `in_progress → review`，`git commit -m "cursor: A-01 完成"`
  3. 我轮询：`git pull` → 读 `TASK_STATUS.json` → 对 `review` 状态任务做 `git diff` 审查 → 写 `review: "ok"` 或修改意见 → 状态 `done` 或 `rejected`（附原因），`git commit`
  4. Cursor 收到 `rejected`：按意见改 → 重新 `in_progress → review`
- **冲突规避**：同一时间一个任务只允许一个 owner 改 `src/`；文案类任务只碰 `docs/`；我改 `src/` 时会先 `git pull` 且 Cursor 该任务不在 `in_progress`

## 2.5 步骤报告（每次都有信息回复 · 快速对齐颗粒度）★ 必读

**为什么**：导演（我）需要知道 Cursor 每一步做到哪了，而不必等全部完成。Kimi 等模型在长任务里容易"闷头干完才发现方向偏"，步骤留痕能提前纠偏。

**规则（Cursor 必须遵守）**：
1. 每个任务至少 **3 次留痕**：① 开工 ② 中途 checkpoint（产出大纲/首稿/关键决策）③ 完成
2. 每次留痕 = 三件套：
   - `git commit -m "cursor: 任务X · 第N步：做了啥"`（提交信息写清楚"第几步+做了什么"）
   - 更新 `tasks/TASK_STATUS.json`：`status` + `note` 字段（做了哪步 / 下一步 / 有无阻塞）
   - 把**关键中间产物/决策/疑问**追加到 `tasks/REPORT.md`（每次 append，不覆盖）
3. **导演轮询节奏**：我每次看 `git log`（cursor 提交）+ `tasks/REPORT.md` 末尾 → 快速对齐 → 必要时回复意见（写进 `tasks/REVIEW_FEEDBACK.md` 或直接在 REPORT 追加 `[导演]` 行）
4. **阻塞立即上报**：任何卡点（依赖、素材缺失、需求不清）→ commit + REPORT 标注 `[阻塞]`，不要自己闷着改方向

**颗粒度示例**（台词落地任务 F-01）：
- 第 1 步：读 lines.js + 打磨建议 → commit "F-01 第1步：已对照完成映射清单"
- 第 2 步：改 splash/stumble 两段 → commit "F-01 第2步：splash+stumble 已落地，其余待续"
- 第 3 步：全部落地 + 冒烟 → commit "F-01 第3步：完成，27 PASS"

---

## 3. 任务卡片模板（对齐颗粒度）

每个任务必须写清：
```
目标：一句话
涉及文件：绝对路径（只允许这些）
验收标准（defOfDone）：可检查的具体项
禁止项：哪些不能碰
验证：如何自证（命令/截图）
```

## 4. 当前任务包（已在 MUSIC_VILLAGE_CURSOR_TASKS.md）

- **A 演示脚本 + 答辩材料**（docs/，优先）
- **B 台词润色建议**（docs/台词打磨建议.md）
- **C UI/无障碍审查**（docs/UI审查报告.md）
- **D 代码审查**（docs/代码审查报告.md，只读不改）
- **E 竞品/教学法调研**（docs/调研.md）

> 如果你想更进一步：**让 Cursor 做"主游戏开发"**（比如实现 L1 第 2 阶时值、难度曲线、新关卡），把任务加进 `TASK_STATUS.json`（owner: cursor），我审查后合入。这样你的 Cursor 额度被最大化利用，我专注导演+审查+部署。

---

## 6. 导演（Copilot）侧 A2A 标准范式（导演同样遵守，双向对齐）

**导演的所有沟通也留痕、用标准格式，不搞口头约定。**

### 6.1 任务下发 = 标准任务卡片（写进 `tasks/TASK_STATUS.json`）
```json
{ "id": "F-01", "title": "台词落地", "owner": "cursor", "status": "pending",
  "files": ["src/shared/lines.js", "docs/小鹿乱撞故事线.md"],
  "defOfDone": "可检查的验收项", "deadline": "2026-08-13 08:00" }
```

### 6.2 审查反馈 = 标准格式（追加到 `tasks/REVIEW_FEEDBACK.md`）
```
[导演] 任务 F-01 · 08-12 22:10
- 结论：ok / 需修改 / 打回
- 意见：① 可执行项 ② 可执行项（不许空泛）
- 验收：27 PASS / 0 FAIL（附冒烟结果）
```

### 6.3 导演轮询承诺
- 每次对话优先：`git log`（cursor 提交）→ `tasks/REPORT.md` 末尾 → `TASK_STATUS.json`
- 对 `review` 状态任务 **24h 内给结论**（赛前 48h 即时响应）
- 导演改 `src/` 前 `git pull`，提交信息注明「导演：xxx」

### 6.4 冲突仲裁
- 同一文件同一时间只有一个 owner；冲突由导演裁决（`rejected` + 原因）
- 仲裁结论写进 REVIEW_FEEDBACK，双方以 git 记录为准，不扯皮

## 5. 红线（双方都必须遵守）

1. 同一时间 `src/` 只有一个 owner 在改
2. 改 UI 前跑 Impeccable audit；动效只用 transform/opacity
3. 对比度 ≥4.5:1、触控 ≥44px、无纯黑纯白、饱和度 ≤70%
4. 改完必须 `node --check` + `node tools/smoke.js`（27 项 PASS）
5. 素材一律 webp（`tools/webp_convert.py`），不直接提交大 PNG
6. 谁破坏红线谁负责修，状态置 `rejected` 附原因
