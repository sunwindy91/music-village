# 🤝 分支协作规范（A2A-BRANCHING · v1 2026-08-12）

> 起因：仓库已在 GitHub 开源（sunwindy91/music-village），不再有"队友"概念；
> 导演（Copilot）与 Implementer（Cursor）在**同一仓库分支**上协作，main 只收审查通过的内容。
> 配合：A2A_PROTOCOL.md、docs/A2A-HANDOFF-TEMPLATE.md（信封 A-D）。

---

## 1. 分支模型（三轨）

| 分支 | 归属 | 用途 | 谁可以合并进来 |
|---|---|---|---|
| `main` | 导演 | **稳定主干**：只放审查通过、冒烟 27 PASS 的内容 | 仅导演 |
| `director/dev` | 导演 | 导演的功能开发（B 系列切片：新关卡/体验增强） | 仅导演（自审） |
| `cursor/<task>` | Cursor | Cursor 每任务一条分支（如 `cursor/f-04`） | 导演审查后合入 main |

> 规则：同一时间一个分支只有一个 owner；`main` 是"只读真源"，两边都从 `main` 切分支，改完各自交导演合入。

## 2. 工作流（双方都遵守）

### 导演（Copilot）
1. 功能开发：`git checkout director/dev`（从最新 main 拉）→ 开发 → 冒烟 27 PASS → 合回 main
2. 审查 Cursor：`git fetch`/切到 `cursor/<task>` → diff 审查 → REVIEW_FEEDBACK 结论 → 合入 main
3. main 提交信息前缀：`导演：`；合并信息注明来源分支

### Cursor（Kimi）
1. 领任务：从 `main`（或导演通知的最新点）切 `cursor/<task>` 分支
2. 开发：每步 commit + 2.5 步骤报告留痕（TASK_STATUS/REPORT）
3. 完成：TASK_STATUS → `review`，信封 C 交审时**必须注明分支名**（导演要切过去看）
4. 不要合入 main；等导演合并；收到 `rejected` 在**同一分支**上改

## 3. 分工（现状）

| 方向 | 谁 | 分支 | 内容 |
|---|---|---|---|
| 功能切片 B1（节奏派对·时值走停） | 导演 | director/dev | 叔叔大纲第 2 阶，L1 音阶山谷补第 2 关 |
| 功能切片 B2（旋律填空） | 导演（或派 Cursor） | director/dev 或 cursor/b2 | 蓝图 07 关，听→补全 |
| F-04 演示逐镜脚本 | Cursor | cursor/f-04 | docs/演示逐镜脚本.md（已建分支） |
| F-02 素材协作计划 | Cursor | cursor/f-02 | docs/素材协作计划.md |
| F-03 UI P1/P2 修复方案 | Cursor | cursor/f-03 | docs/UI修复方案.md |
| 主题曲（config.themeSong） | 用户谱曲 → 导演接入 | main | 用户完成后导演填 config |

## 4. 冲突仲裁

- 文件域隔离优先：Cursor 的 F 系列（docs/）与导演功能（src/）基本无重叠
- 若同文件冲突：导演仲裁，`rejected` + 原因写进 REVIEW_FEEDBACK；以 git 记录为准不扯皮

## 5. 网络与 push（红线）

- **红线**：push/部署必须用户说「我授权你…」
- **现状**：git 通道到 GitHub 443 被干扰（2026-08-12 实测 fetch 超时）→ push 暂不可用
- 对策：① 用户开梯子后恢复 git push ② 或走 `gh api`（HTTPS API 通道，历史已验证可行，base64 传文件）
- 本地分支协作不受网络影响（同机仓库）；GitHub 同步待网络恢复后一次性推送

## 6. 分支清单（随时更新）

- [x] `director/dev`（= 56a87c2，导演开发）
- [x] `cursor/f-04`（= 56a87c2，Cursor F-04 逐镜脚本）
- [ ] `cursor/f-02`（待 Cursor 领）
- [ ] `cursor/f-03`（待 Cursor 领）
