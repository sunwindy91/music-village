# 🎵 Music Village · 接口契约（Interface Contract）

> **性质**：双 Agent 协作的"宪法"——双方开工前必读、各自实现、PR 合并。
> **版本**：v1.0 · 2026-08-05
> **契约原则**：接口先行、互不依赖、各模块独立可测、合并点只有 index.html

---

## 1. 角色与领地

| 分支 | 负责人 | 领地 | 职责 |
|------|--------|------|------|
| `main` | 双方 | 全仓库 | 稳定版 · 只接受 PR 合并 |
| `module-audio` | 邹翔 | `src/modules/audio/` | 听觉 / 乐理 / 引导 / 积分 |
| `module-voice` | 队友 | `src/modules/voice/` | 语音 / 旋律 / 视觉 / 动画 |

**铁律**：
- 双方**只写自己领地的文件**，不碰对方目录
- `src/index.html` 是**唯一合并点**（双方各自引入自己的入口）
- 各自模块**可独立打开测试**（不依赖对方）

---

## 2. 全局命名空间（合并点约定）

两个模块都挂到 `window` 上，互不覆盖：

```js
// 音频模块（module-audio）挂载
window.MusicCore = {
  // ...见 §3
};

// 语音/视觉模块（module-voice）挂载
window.VoiceCore = {
  // ...见 §4
};
```

**加载顺序**（index.html 里）：
```html
<!-- 音频模块（先） -->
<script src="src/modules/audio/music-core.js"></script>
<!-- 语音模块（后） -->
<script src="src/modules/voice/voice-core.js"></script>
<!-- 应用入口（最后，合并点） -->
<script src="src/app.js"></script>
```

---

## 3. MusicCore 接口（邹翔实现 · module-audio）

### 3.1 核心音频

```js
MusicCore.playNote(midiNote: number, duration?: number): void
// 播放单个音（midiNote: 60=C4, 62=D4, 64=E4...）
// duration: 秒，默认 0.5

MusicCore.playChord(rootMidi: number, type: 'major'|'minor'|'dim'): void
// 播放和弦（大三/小三/减三）

MusicCore.playMelody(melody: Array<{midi:number, dur:number}>): void
// 播放一段旋律（用于关卡通关/奖励）

MusicCore.stopAll(): void
// 停止所有声音（关卡切换/退出时调用）
```

### 3.2 关卡与引导

```js
MusicCore.startLevel(levelId: string, opts?: {
  onCorrect?: () => void,      // 答对回调
  onWrong?: () => void,        // 答错回调
  onComplete?: (score: number) => void  // 通关回调（带积分）
}): void
// 启动关卡

MusicCore.playGuidance(script: Array<{type:'speak'|'anim'|'note', value:string}>): void
// 播放引导序列（语音/动画/音符）——引导脚本由关卡配置驱动

MusicCore.getScore(): number
MusicCore.resetScore(): void
// 积分系统
```

### 3.3 事件（发给 VoiceCore 的信号）

```js
// 关卡状态变化时，MusicCore 调用（如果 VoiceCore 存在）：
if (window.VoiceCore) {
  VoiceCore.onLevelEvent({
    type: 'correct' | 'wrong' | 'complete' | 'guidance',
    payload: { /* 关卡数据 */ }
  });
}
```

---

## 4. VoiceCore 接口（队友实现 · module-voice）

### 4.1 语音

```js
VoiceCore.speak(text: string, opts?: { rate?: number, pitch?: number }): void
// 用语音朗读文本（引导/鼓励："太棒了！""再试一次"）

VoiceCore.listen(callback: (text: string, confidence: number) => void): void
// 开始语音识别（孩子说话 → 回调文字+置信度）
// 注意：浏览器需权限；识别失败/无权限时回调 null

VoiceCore.stopListening(): void
```

### 4.2 视觉 / 动画

```js
VoiceCore.showCharacter(state: 'idle'|'happy'|'sad'|'celebrate'|'listen'): void
// 控制"小山灵"角色表情/状态（Canvas 或 CSS 动画）

VoiceCore.playAnimation(animName: string): void
// 播放指定动画（如 'bounce', 'sing', 'rainbow'）

VoiceCore.renderVision(opts: {
  kind: 'note' | 'bird' | 'rainbow' | 'melody',
  value: any
}): void
// 渲染视觉元素（音符飞起/小鸟选择/彩虹出现）
```

### 4.3 事件（发给 MusicCore 的信号）

```js
// 语音/视觉状态变化时，VoiceCore 调用（如果 MusicCore 存在）：
if (window.MusicCore) {
  MusicCore.onVoiceEvent({
    type: 'speech' | 'anim_done' | 'choice',
    payload: { /* 语音/视觉数据 */ }
  });
}
```

---

## 5. 共享数据结构（两边都要遵守）

### 5.1 关卡配置（audio 侧定义，voice 侧只读）

```js
// src/shared/levels.js（双方只读）
const LEVEL_CONFIGS = {
  'listen-friends': {        // L0 听音找朋友
    title: '听音找朋友',
    notes: [60, 62, 64],     // C D E
    birds: ['bird-c', 'bird-d', 'bird-e'],
    guidance: ['听一听，这是什么音？', '点一下你听到的小鸟！'],
    reward: '🎉 你听对了！'
  },
  'rhythm-tap': {            // L0 节奏拍打
    title: '节奏拍打',
    bpm: 80,
    patterns: [['tap','tap','rest','tap']]
  },
  'pitch-highlow': {         // L0 高低音对比
    title: '高低音对比',
    pairs: [[60, 72]]        // 低音 vs 高音
  }
  // ...更多
};
```

### 5.2 数据流（一图流）

```
┌─────────────────┐         ┌─────────────────┐
│   MusicCore      │  事件    │   VoiceCore      │
│  (音频/关卡/积分) │ ───────► │  (语音/视觉/动画) │
│                  │ ◄─────── │                  │
└─────────────────┘  事件    └─────────────────┘
        │                              │
        └──────────┬───────────────────┘
                   ▼
            src/app.js (合并点)
```

---

## 6. 端口 / 资源约定

| 项 | 约定 |
|----|------|
| 本地开发 | 双方各自 `python -m http.server 8080` 独立预览自己的模块 |
| 测试页 | `src/modules/audio/test-audio.html` / `src/modules/voice/test-voice.html`（独立可开） |
| 合并验证 | 本地 8080 打开 `src/index.html`，两边功能都在 |
| 无后端 | 纯前端，无端口依赖（localStorage 存储） |
| AI API | 若接入（通义/DeepSeek），key 走 `src/server/proxy`（决赛再做，初赛不接） |

---

## 7. PR 合并规则

1. 各自分支完成 → 提 PR 到 `main`
2. **PR 描述必须写**：改了哪些文件 / 是否动了共享文件（`levels.js`）/ 自测结果
3. 合并前检查：
   - 没碰对方领地文件 ✅
   - `window.MusicCore` / `window.VoiceCore` 都正常挂载 ✅
   - `src/index.html` 加载顺序正确 ✅
4. 冲突处理：**共享文件（levels.js）冲突** → 双方先对齐再合并；**各自领地冲突** → 各自解决

---

## 8. 验收清单（双方开工前逐条确认）

- [ ] 我已读接口契约 v1.0
- [ ] 我确认自己的领地（audio / voice）
- [ ] 我确认 `window.MusicCore` / `window.VoiceCore` 命名
- [ ] 我确认事件双向通知格式（onLevelEvent / onVoiceEvent）
- [ ] 我确认共享文件 `src/shared/levels.js` 只读约定
- [ ] 我知道本地测试方式（独立 8080 + test 页）
- [ ] 我知道 PR 合并规则

---

## 9. 变更流程

- 任何接口变更 → 更新本文档 → **version bump**（v1.0 → v1.1）→ 双方确认后再改代码
- 未更新契约就改接口 = 违约（对方可拒绝合并）

---

_接口契约 v1.0 · 2026-08-05 · 双 Agent 协作 · 先契约后代码_
