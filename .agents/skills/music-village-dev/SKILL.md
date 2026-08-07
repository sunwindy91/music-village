---
name: music-village-dev
description: 大山里的音乐课 · 儿童乐理寻宝游戏的完整开发手册。用于创建新关卡、新地图、优化 UI/UX、接入山灵 AI、部署发布。任何 agent 按此手册可复刻和扩展整个产品。
---

# 🏔️ Music Village Dev · 开发手册

> 项目：**大山里的音乐课**——给山区零基础儿童的 AI 陪伴式「乐理寻宝」游戏
> 初赛：2026「小有可为」乡村教育赛道 · 8/13

---

## 1. 核心哲学（先读这个）

**乐理 = 世界的物理规则**，不是"教乐理的工具"，是让孩子愿意打开、愿意坚持、感到美好的游戏。

| 乐理概念 | 世界化身 | 孩子心智模型 |
|---------|---------|-------------|
| 音高 | 上下位置（五线谱=天空）| 高=上，低=下 |
| 音阶 | 楼梯/排队 | 音一个接一个往上 |
| 时值 | 距离 | 越长的路=越长的音 |
| 和弦 | 颜色合成 | 三色合体=彩虹 |
| 音准 | 同心圆 | 唱得准=对准圆心 |

**五条铁律**：①没有"答错"只有"再试一次" ②判定先宽后严 ③3 错进示范模式 ④过程有反馈 ⑤目标小而可见（"帮 N 只鸟回家"而非"考 100 分"）。

---

## 2. 产品方法论（PM 流程，每次改动前走一遍）

1. **定位**：改什么？服务于哪个学习目标？
2. **画面流程**：新增内容放进哪个画面？衔接条件是什么（为什么跳转）？
3. **三件套**：每个关卡必须有 ①乐理概念（孩子话）②心智模型 ③游戏动作
4. **反馈协议**：对→庆祝+音效；错→"再听一次"+逼近引导（高一点/低一点）；3错→示范
5. **防挫败检查**：会不会让孩子卡死？是否有路可走？

---

## 3. 技术架构

```
src/
├── index.html        合并点（大山主题 UI，设计系统 token 在 :root）
├── app.js            渲染/路由/关卡类型分派/积分/山灵
├── config.js         全局配置（SPIRIT_AI 开关）
├── shared/levels.js  ★ 内容层：地图+关卡配置（队友照填）
└── modules/
    ├── audio/music-core.js   Web Audio 核心 + sfx 音效系统
    └── voice/voice-core.js   山灵视觉/语音 + askSpirit(AI 预留)
```

- **无构建链**：普通 `<script>` 标签，file:// 直接可跑，低配设备友好
- **无账号**：localStorage 存进度（`mv_progress_v1`），零个人信息
- **加载顺序**（契约）：config → music-core → voice-core → levels → app

---

## 4. 新增一个关卡（3 步，队友友好）

### 第 1 步：在 `src/shared/levels.js` 的某地图 `levels` 数组加配置
```js
{
  id: 'my-level',
  type: 'observe',        // observe观察 / point配对 / sort排序 / sing跟唱 / boss石碑
  title: '我的关卡',
  icon: '🎯',
  concept: '乐理概念（孩子话）',
  model: '心智模型',
  action: '玩家动作',
  judge: '判定规则',
  feedback: '反馈协议',
  goal: '完成目标',
  notes: [60, 64, 67],    // midi 音符
  guidance: ['山灵台词1', '台词2'],
}
```

### 第 2 步：在 `src/app.js` 的 `loadLevel()` 加类型分派
```js
if (lv.type === 'point' || lv.type === 'sort') { ... }   // 已有
else if (lv.type === 'mytype') { drawMyLevel(lv); }      // 新增
```

### 第 3 步：实现 `drawMyLevel`（渲染舞台）+ 判定逻辑
- 舞台 = `$('staffSvg')`（SVG，viewBox 800x240）
- 音高→y：`window.NOTE_Y[midi]`；颜色：`window.noteColor(midi)`
- 发声：`window.MusicCore.playNote(midi, dur)`
- 音效：`window.MusicCore.sfx.correct()/wrong()/win()/stone()/click()`
- 完成奖励：`addScore(n)` + `awardMedal('名字')` + `markLevelDone(id)`

---

## 5. UI/UX 规范（taste 应用 · 儿童心理）

### 设计系统（:root token）
| Token | 值 | 用途 |
|-------|-----|------|
| 天空渐变 | `#aee1ff→#fff3dc` | 清晨天空 |
| 森林绿 | `#3e7d5e` | 主色/按钮 |
| 阳光金 | `#ffd166` | 可点/奖励 |
| 草莓粉 | `#e76f8a` | 听音/重点 |
| 卡片 | 白 · 圆角24 · 柔和阴影 | 容器 |

签名元素：山峦剪影 + 草地 + 云 + 太阳（`.sky` 层）+ 山路虚线（寻宝感）+ 发光音符。

### 交互硬规则（踩坑记录）
- **SVG 悬停禁止 transform 位移**（scale/translate 会抖+点不到）。悬停反馈 = `filter: drop-shadow` 光晕 + 轻摇动画（`birdWiggle`），**不改变位置**
- 点击热区 > 视觉：透明 `<circle r="22">` 做热区，事件委托到父 `<g>`
- 目标按钮 ≥44px，大圆角立体（`:active` 下沉 3px）
- 专业术语（三件套）藏进**开发者模式**（⚙️ 开关），孩子界面干净
- 文案：孩子话、动作统一、鼓励随机池（`PRAISE`/`CHEER`）

---

## 6. 山灵（AI 陪伴）

- 角色：SVG 森林精灵（`#spirit`），表情切换（正常眼/弯眼/张嘴）通过 `spiritAvatar(state)`
- 对话：打字机效果 `spiritSay(text)`
- 引导：`guidance` 数组 + 逼近式提示（答错时"高一点/低一点"）
- **AI 接入（决赛）**：`config.js` 的 `SPIRIT_AI` 配 endpoint/token 后 `enabled:true`，`VoiceCore.askSpirit()` 自动生效。初赛保持 false（本地规则，稳定）

---

## 7. 部署（两条路）

### Cloudflare Pages（主力，国内快）
```bash
wrangler pages project create music-village-app --production-branch=main  # 首次
wrangler pages deploy "src" --project-name=music-village-app --branch=main
# 链接：https://music-village-app.pages.dev
```

### GitHub Pages（备用）
- 用 git 正常推送（443 被墙时用 `gh api PUT` 上传 base64 文件）
- Pages 源：main 分支根目录，需 `.nojekyll` + 英文文件名

---

## 8. 常见坑

| 坑 | 解法 |
|----|------|
| git push 443 超时 | 开代理，或 `gh api --method PUT repos/{owner}/{repo}/contents/{path}` |
| 中文字符在 PowerShell 乱码 | `$env:PYTHONIOENCODING="utf-8"`；curl 验证用 `Get-Content -Encoding UTF8` |
| SVG 撑破容器 | `max-width:100%` |
| 音符名显示数字 | `NOTE_NAME` 缺该 midi，补表 |
| CF 首次部署 522 | 等 10-30 秒传播 |

---

## 9. 当前状态（2026-08-07 v0.2）

- ✅ 山路寻宝地图 + 3 关卡（观察/配对/排序）+ 山灵角色 + 音效
- ⬜ L0 声音山谷三关（初赛）· sing 跟唱（决赛）· boss 石碑 · AI 对话
- 文档：`docs/产品设计文档_PM版.md`（完整 PM 流程）、`docs/PROGRESS.md`（进度）
