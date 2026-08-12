# A2A 联合决策日志（音乐村 · 断点真源）

> 复用自你的开源 `a2a-starter-kit`。流水账：用户(Orchestrator) ↔ 导演(Strategist) ↔ Cursor(Implementer)。
> **写法**：新条目置顶；状态三选一：开放 / 已拍板 / 已执行。
> **通讯测试约定**：空栏、占位、「待确认」且无用户再确认、或明显为探测通道的条目 → 视为通讯测试，不当 backlog 执行。
> 本文件为决策流水**唯一真源**（不要另建副本当主文件）。

---

## 条目骨架（复制）

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

可选字段：`依据` / `verdict` / `禁区` / `争议` / `通讯测试: 是`

---

## 已拍板（真实条目，新条目插在本注释上方）

### 2026-08-12 · 初赛方向材料 v3 审查
- **layer**: 当下
- **问**: v3 是否符合护栏与线上原型？
- **Strategist**: verdict=需改（2 条）：① 鼓关 250ms→400ms + 删"先宽后严"改"失败降速" ② 逐镜脚本未产出勿声称。其余全对（5 关/3 地点/晓声 6 阶/卡关陪伴/认全/主题曲/乐理引擎/人格闭环/webp）。
- **Implementer**: 待改。
- **用户拍板**: 待。
- **状态**: 开放

### 2026-08-12 · A2A 模板复用（a2a-starter-kit 落地）
- **layer**: 当下
- **问**: 音乐村协作是否复用用户已开源的 a2a-starter-kit 模板？
- **Strategist**: 复用。角色映射：用户=Orchestrator / Copilot=Strategist+导演 / Cursor(Kimi)=Implementer；信封 A-D + DECISION-LOG + ONBOARDING + 授权门禁（commit 本地可、push/部署需"我授权你…"）。
- **Implementer**: 已确认（将按信封 B/C 交活、写决策日志）。
- **用户拍板**: 同意复用。
- **后续动作**: docs/A2A-HANDOFF-TEMPLATE.md + docs/A2A-DECISION-LOG.md 已落地；A2A_PROTOCOL 已加 0.5 节引用。
- **状态**: 已执行

### 2026-08-12 · F 系列任务（Cursor/Kimi 主开发）
- **layer**: 当下
- **问**: F-01 台词落地 / F-02 素材计划 / F-03 UI P1P2 方案 / F-04 逐镜脚本 由谁做？
- **Strategist**: Cursor(Kimi) 执行（F-01 特批改 lines.js 只改文案），导演轮询审查（REVIEW_FEEDBACK 标准格式）。
- **Implementer**: 待开工。
- **用户拍板**: 同意。
- **状态**: 已拍板

### 2026-08-12 · 素材状态澄清
- **layer**: 当下
- **问**: 5 张形态素材是否待生成？
- **Strategist**: 否，已生成完毕并转 webp 上线（96779d58），15 张素材全在线，勿重做。
- **用户拍板**: 同意。
- **状态**: 已执行
