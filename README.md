# 🏔️ 大山里的音乐课 · Music Village

**给山区音乐零基础的孩子，一个 AI 陪伴的「乐理寻宝」游戏。**

> 🎮 **在线试玩：https://music-village-app.pages.dev**
> 📖 **文档导航：docs/文档导航.md**

---

## 项目简介

把抽象的音高、节奏、和声与创作，变成大山世界里**看得见、摸得着、玩得懂的规则**。孩子牵着 AI 山灵「晓声」的手，爬过五座山谷，在寻宝中学会真乐理。

**核心理念**：音乐是权利，不是天赋的恩赐。

## 产品特色

- 🗺️ **5 大聚类 · 21 关** 课程体系：声音山谷 → 音阶山谷 → 节奏小路 → 和弦花园 → 旋律草原，严格按知识依赖排布（先听觉、再认谱与时值、后十六分与和声、最后创作）
- 📚 **教学闭环**：每个聚类 =「理论导入 → 关卡练习 → 乐理小测」，形成性评估
- 🤖 **晓声 AI 山灵**：3D 手办、6 阶成长进化（种子→小芽→开花→星光→初鹿→鹿）、情绪姿态、真实语音、AI 问答
- 🎼 **真实乐理引擎**：tonal 判题（音高零误差）+ Tone.js 发声（多音色混排）+ VexFlow 真五线谱（PNG / MIDI 导出）
- 🧒 **卡关不判死**：连续答错自动降难度陪伴，没有"答错"只有"再试一次"
- 🛡️ **隐私与可及性**：零账号、零收集、离线可玩、低配可跑

## 技术栈

- 纯前端 Vanilla JS + SVG，零构建链、零安装
- tonal / Tone.js / VexFlow 全部本地 vendor，无业务 CDN
- 素材全量 webp（整站 18MB → 1.2MB），离线可用
- 部署：Cloudflare Pages（国内可访问）

## 目录结构

```
src/            产品源码
  app.js        应用核心（状态机 / 路由 / 关卡分派）
  config.js     全局配置
  shared/       关卡与台词数据（levels.js / lines.js）
  modules/      音频引擎 / 语音与形态 / 记谱（music-core / voice-core / staff）
  assets/       素材（webp）
  functions/    可选 Worker（AI 对话 / TTS，可部署到 Cloudflare Workers）
tools/          开发工具（冒烟测试、素材生成等）
docs/           产品文档（架构、设计规范、接口契约、课程体系）
```

## 本地运行 / 部署

```bash
# 本地预览
python -m http.server 8080 -d src

# 部署到 Cloudflare Pages
npx wrangler pages deploy src --project-name music-village-app
```

## 质量保障

`node tools/smoke.js` —— **54 项断言全 PASS**（覆盖全部关卡 startLevel、乐理判题、五线谱渲染、语音与姿态层、兼容层）。

## 开源协议

本项目为公益教育用途开源。**欢迎贡献关卡与内容**——关卡以模板配置维护（`src/shared/levels.js`），新关卡 = 乐理概念 + 心智模型 + 游戏动作，填写配置即可接入。

---

_让每一个山里的孩子，都像晓声一样，从一粒种子长成会唱歌的鹿。_

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
