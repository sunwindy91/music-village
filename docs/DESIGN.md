---
name: 大山里的音乐课 (Music Village)
description: 给山区零基础儿童的 AI 陪伴式乐理寻宝游戏
north-star: "晨雾山谷里的水彩治愈感"
audience: 6-9 岁儿童 + 引导陪伴者
lane: 儿童教育游戏 · 治愈 · 空灵
taste-dials:
  design_variance: 7
  motion_intensity: 6
  visual_density: 3
---

# Design System: 大山里的音乐课

## Overview

**Creative North Star: "晨雾山谷里的水彩治愈感"**

一个把乐理变成"晓声的记忆"的寻宝世界。界面要有：清晨山谷的空气感（大量留白）、水彩般的柔和（低饱和、渐变克制）、生命感（晓声的成长可视化）、以及小朋友伸手就想点的温度（大圆角、大目标、发光=可点）。参考情绪：Spiritfarer（水彩治愈）· Bloom（想法=生命）· 晨雾中的第一缕阳光。

**Key Characteristics:** 柔和自然 · 留白呼吸 · 发光引导 · 儿童可点 · 克制动效

## Colors

晨光自然系，**无纯黑无纯白**，饱和度 ≤70% 为主。

### Primary
- **森林绿** `#3e7d5e`：主色 / 主按钮 / 晓声身体
- **深林绿** `#2d6349`：标题 / 重点文字
- **晨光金** `#e8b04b`：可点引导 / 发光（不用纯黄，降饱和）
- **晨雾蓝** `#bfe3ff`：天空渐变顶端
- **奶油白** `#fff8ec`：卡片底（不用纯白）

### Secondary
- **草莓粉** `#d97a8e`：听音/重点操作（降饱和）
- **溪水蓝** `#6fb7e8`：溪流/点缀
- **泥土棕** `#c98a5e`：木头/小路
- **墨绿灰** `#37423b`：正文文字（非纯黑）
- **雾灰** `#6d7a70`：次要文字

### Banned
- ❌ 纯黑 `#000` / 纯白 `#fff` 大面积
- ❌ 霓虹光晕（发光只用柔和的 drop-shadow，alpha ≤ .9）
- ❌ 饱和度 > 80% 的大面积配色
- ❌ AI 紫蓝渐变

## Typography

- 字体栈：`"Baloo 2", "Microsoft YaHei", system-ui`（圆体优先，中文回退雅黑）
- 标题：圆体粗，`letter-spacing: .02em`，不用大写压迫
- 正文：行高 1.7+（儿童阅读）
- **不用** Inter / Times / Georgia

## Shape & Components

- **圆角规则（统一）**：大容器 24px · 卡片 16-20px · 交互控件全圆角(pill) 999px
- **按钮**：pill 全圆角 + 3D 下沉（:active translateY(3px)）· 大目标 ≥44px
- **卡片**：仅表达层级时用；柔和阴影（`0 10px 28px rgba(56,94,74,.14)` 染背景色，非纯黑）
- **hover 反馈**：只发光不位移（SVG 禁用 transform 缩放/旋转——防抖硬规则）
- **图标**：优先真实角色/图形（晓声 SVG），emoji 仅用于内容点缀，不做装饰

## Layout

- 容器 `max-width: 1020px` 居中；移动端 `@media ≤640px` 严格单列
- CSS Grid 优先，禁 flex 百分比数学
- 全高用 `min-height: 100dvh`（禁 `h-screen`，防 iOS 跳动）
- 卡片不套卡片（地图面板内不再叠白卡片）

## Motion

- 温和：MOTION_INTENSITY 6 → 悬浮发光 / 晓声呼吸 / 光点飘散
- 所有动画可用一句话解释（反馈/引导/庆祝），无炫技
- `prefers-reduced-motion` 时降级为静态（硬规则）
- 弹簧感：`transition` 0.15-0.3s ease

## Anti-Patterns（Banned）

- ❌ emoji 当界面装饰元素（可用作关卡图标，禁用于按钮/标题装饰）
- ❌ 3 等分卡片布局（feature 区）——我们地图天然是"寻宝路线"，不用卡片网格
- ❌ 居中 Hero + 大字压迫——用左右/上下叙事流
- ❌ 卡片套卡片、灰字彩底、圆角方图标
- ❌ 无意义微动画循环（每处动效都要有教学/情绪理由）
- ❌ 过度饱和点缀色、纯黑阴影

## Audit Checklist（每次改 UI 前跑）

- [ ] 圆角规则统一（24/16-20/pill）？
- [ ] 无纯黑纯白大面积？饱和度可控？
- [ ] hover 只发光不位移？
- [ ] 卡片仅在层级需要时出现？
- [ ] 间距数学精确（8 的倍数体系）？
- [ ] emoji 未做装饰？
- [ ] 移动端单列 + 大目标？
- [ ] 动效可解释 + reduced-motion 降级？
