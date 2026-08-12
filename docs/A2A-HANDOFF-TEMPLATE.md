# A2A 交接模板（复制即用 · 适配音乐村）

> 复用自你的开源 `a2a-starter-kit`（github.com/sunwindy91/a2a-starter-kit）。
> 配合 [`A2A-PROTOCOL.md`](../A2A_PROTOCOL.md)。四选一复制，填空后粘贴。
> 角色映射（本项目）：**Orchestrator=用户** · **Strategist/导演=Copilot（审阅/战略/部署）** · **Implementer=Cursor(Kimi K3，主开发)**。

---

## A · User → Strategist（战略问 / 导演审）

```text
A2A-MSG
from: Orchestrator
to: Strategist
goal: <一句话：要对齐的优先级或审阅目标>
layer: 当下 | 中期 | 长远
constraints: 勿重复已交付里程碑；勿建议重写整盘；方案标当下|中期|长远
decision_asked: <关键决策题；末附「若只做一件事」一句>
artifacts: docs/验收交接包_20260812.md, A2A_PROTOCOL.md, tasks/TASK_STATUS.json
DoD: 各题 2–4 行可执行立场 + 一层标签；无空话重做清单
body: |
  <正文>
```

## B · Strategist → Implementer（实现简报 · 导演派活给 Cursor）

```text
A2A-MSG
from: Strategist
to: Implementer
goal: <一句话：要落地的切片>
layer: 当下 | 中期 | 长远
constraints: <硬约束，分号分隔>
decision_asked: <需用户拍板则写清；已拍板写「已确认：…」>
artifacts: <要改/要读的路径，如 src/shared/lines.js>
DoD: <可勾选验收，如：27 PASS>
body: |
  背景：…
  建议切片（文件级）：…
  不要做：…
  风险：…
```

## C · Implementer → Strategist（审阅请求 · Cursor 交活）

```text
A2A-MSG
from: Implementer
to: Strategist
goal: 审阅本切片是否符合护栏与中期方向
layer: 当下
constraints: 对照交接断点与 TASK_STATUS 硬现状；指出重复交付或越层
decision_asked: 通过 / 需改（列改点）/ 升级为中期议题
artifacts: <diff 摘要或文件路径>, docs/A2A-DECISION-LOG.md
DoD: 明确 verdict + ≤5 条可执行改点（若有）
body: |
  本轮改动摘要：…
  版本：commit hash / 里程碑标签
  自评 DoD：…
```

## D · 联合决策日志条目（写入 A2A-DECISION-LOG.md）

```text
### YYYY-MM-DD · <短标题>
- **layer**: 当下 | 中期 | 长远
- **问**: …
- **Strategist**: …
- **Implementer**: …
- **用户拍板**: …
- **后续动作**: …
- **状态**: 开放 | 已拍板 | 已执行
```
