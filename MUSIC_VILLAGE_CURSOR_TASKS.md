# 🎯 Cursor 并行任务包 · 大山里的音乐课（给 Cursor 窗口的 agent）

> 用途：主窗口（VS Code Copilot）与 Cursor 并行协作。**你在本仓库独立做下面任务，改完告诉我，主窗口用 git diff 审查后合入。**
> 项目根目录：`C:\Users\23017\Desktop\AI比赛\music-village`

---

## 🚨 铁律（违反会冲突/翻车）

1. **不要修改这些文件**（主窗口正在活跃开发，改了必冲突）：
   - `src/app.js`、`src/config.js`、`src/index.html`
   - `src/modules/voice/voice-core.js`、`src/modules/audio/music-core.js`、`src/modules/notation/staff.js`
   - `src/styles/main.css`、`src/shared/levels.js`
2. **新增内容一律写到 `docs/` 或新建独立文件**，不要动 `src/` 里的东西。
3. 涉及 UI 建议时，附**具体行号 + 原因**（不要只给主观感想）。
4. 跑验证的命令（只读/只写 docs，安全）：`cd src && node --check app.js && node tools/smoke.js`

## 📋 项目一句话

给山区 6-9 岁儿童的 AI 陪伴式乐理寻宝游戏（纯前端、无账号、离线可用）。真实乐理内核（tonal 判题 + Tone.js 合成 + VexFlow 五线谱）+ 三大教学法（柯达伊/奥尔夫/达尔克罗兹）。主界面 = 水彩山谷地图，晓声（山灵，6 阶段成长最终变鹿🦌）陪伴通关。

设计宪法：无纯黑纯白、饱和度≤70%、触控≥44px、对比度≥4.5:1、动效只 transform/opacity、大圆角手绘水彩风。

---

## ✅ 任务 A（推荐先做）：3 分钟演示脚本 + 答辩材料

- 文件：细化 `docs/演示视频脚本_3分钟.md`（若不存在则新建）
- 要求：按"开场 30s 讲痛点 → 60s 走核心玩法（三关+作曲+五线谱）→ 60s 讲晓声陪伴/成长/课堂理念 → 30s 升华（小鹿乱撞的故事线钩子）"的结构
- 另建 `docs/答辩材料.md`：项目亮点 5 条 + 常见 Q&A 10 个（技术/教育理念/数据隐私/可扩展性）
- 亮点素材：真实乐理判题零误差、本地离线零收集、晓声 6 阶成长+蜕变动画、通关主题曲、卡关不判死陪伴

## ✅ 任务 B：台词与文案润色建议

- 读 `src/shared/lines.js`（只读，不改）
- 输出 `docs/台词打磨建议.md`：逐条给出"现在 → 建议"（更口语、更像 6-9 岁孩子听得懂的陪伴者、保留晓声山灵人设）
- 重点：splash 开场、卡关陪伴（stumble）、成长仪式（grow）、人格卡 vision 文案
- 结尾给一句可选的「小鹿乱撞」故事线钩子文案（3-5 句，儿童向）

## ✅ 任务 C：UI/无障碍审查报告

- 打开本地 `music-village/src/index.html`（可用浏览器本地打开），或线上 https://music-village-app.pages.dev
- 对照设计宪法逐页检查，输出 `docs/UI审查报告.md`：问题清单（文件+行号+截图建议+修复建议），按严重度排序
- 检查点：对比度 4.5:1 / 触控 44px / 动效 transform+opacity / 焦点可见 / aria 标签 / 手机 320px 宽度不溢出

## ✅ 任务 D：代码审查（只读）

- 通读 `src/app.js`（重点：状态机/关卡分派/会话令牌 invalidateSession/庆祝 celebrate）、`src/modules/voice/voice-core.js`（mount/applyGrowth 形态切换/burstParticles）
- 输出 `docs/代码审查报告.md`：找 bug 风险、内存泄漏（定时器/监听器）、边界情况（快速双击、音频未授权、localStorage 不可用）
- 每条给：位置（文件:行）+ 问题 + 建议修法（**只写建议，别改代码**）

## ✅ 任务 E（有余力）：竞品与教学法调研

- 输出 `docs/调研.md`：3 个对标产品（Chrome Music Lab / Yousician / 国内儿童音乐启蒙 App）各 3 条可借鉴点 + 柯达伊/奥尔夫/达尔克罗兹在本游戏里的落地点验证

---

## 📦 完成后

1. 在仓库根目录运行 `git add -A && git commit -m "cursor: 任务X完成"`（若已 git init）或直接告诉我改了什么
2. 主窗口会 `git diff` 审查，冲突的合入，有问题的退回
3. **验收标准**：新文件都在 `docs/` 下；`src/` 零改动
