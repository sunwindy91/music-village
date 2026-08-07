# 🏔️ 大山里的音乐课 · Music Village

**给山区音乐零基础的孩子，一个 AI 陪伴的「乐理寻宝」游戏。**

> 2026「小有可为」AI 向善创新挑战赛 · 乡村教育赛道 · 初赛截止 8/13
> 🎮 **可玩原型：https://music-village-app.pages.dev**

---

## 一句话

把抽象的音高、节奏、和弦，变成大山世界里**看得见、摸得着、玩得懂的规则**——乐理就是世界的物理规则。

| 乐理 | 世界化身 |
|------|---------|
| 音高 | 上下位置（五线谱=天空）|
| 音阶 | 从低到高排队 |
| 时值/节奏 | 走走停停（距离=音长）|
| 和弦 | 三种颜色合体=彩虹 |

## 三层结构

- **L0 听觉启蒙**（先听先唱先动）：谁更高 · 小鼓手 · 听音找朋友
- **L1 乐理进阶**（叔叔专业大纲）：看小鸟飞 · 点小鸟回家 · 排排队 …
- **L2 创造表达**（愿景激励）：哼唱 / 音乐人格

## 🎮 当前可玩（v0.2 · 5 关卡）

| 地图 | 关卡 | 类型 | 乐理点 |
|------|------|------|--------|
| 声音山谷 (L0) | 谁更高 | 对比 | 音高感知 |
| 声音山谷 (L0) | 小鼓手 | 跟拍 | 节奏/休止 |
| 音阶山谷 | 看小鸟飞 | 观察 | 音高=位置 |
| 音阶山谷 | 点小鸟回家 | 配对 | 音高辨识 |
| 音阶山谷 | 排排队 | 排序 | 音阶心智 |

- ✨ 山灵 SVG 角色：打字机对话 + 表情切换 + 逼近式引导（高一点/低一点）
- 🎵 Web Audio 温柔音效（答对/答错/通关/鼓点）
- 🧒 无"答错"只有"再试一次" · 3 错进示范模式 · 积分勋章 localStorage
- ⚙️ 开发者模式（乐理三件套规格，默认隐藏）

## 📚 文档

| 文档 | 链接 |
|------|------|
| **产品架构图（ProcessOn 风）** | [product-map.html](https://music-village.pages.dev/product-map.html) |
| **乐理机制设计脑暴图** | [index.html](https://music-village.pages.dev) |
| 三方思路对比图 | [alignment-map.html](https://music-village.pages.dev/alignment-map.html) |
| PM 版产品设计（画面流程/交互规范）| [docs/产品设计文档_PM版.md](docs/产品设计文档_PM版.md) |
| 初赛方向材料 v2 | [docs/初赛方向材料_v2.md](docs/初赛方向材料_v2.md) |
| 演示视频脚本 | [docs/演示视频脚本_3分钟.md](docs/演示视频脚本_3分钟.md) |
| 接口契约 | [docs/接口契约-INTERFACE-CONTRACT.md](docs/接口契约-INTERFACE-CONTRACT.md) |
| 协作进度 | [docs/PROGRESS.md](docs/PROGRESS.md) |

## 🛠️ 技术架构

```
src/
├── index.html       合并点（大山主题 UI）
├── app.js           渲染/关卡分派/积分/山灵
├── config.js        AI 开关（初赛关·决赛开）
├── shared/levels.js ★ 关卡模板（队友照填加关卡）
└── modules/
    ├── audio/music-core.js   Web Audio + 音效
    └── voice/voice-core.js   山灵 + AI 对话预留
```

- 纯前端 · 零构建 · 低配可跑 · 无账号零收集（儿童隐私）
- 开发手册：`.agents/skills/music-village-dev/SKILL.md`（可复刻）

## 双 Agent 协作（A2A）

- `module-audio`（邹翔）：音频/关卡/积分 · 已实现 5 关卡
- `module-voice`（队友）：山灵视觉/语音/动画 · 接口已预留

**接口契约先行**：`MusicCore` / `VoiceCore` 先定接口，各自实现，`index.html` 唯一合并点。
