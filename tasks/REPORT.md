# F-01 执行留痕 · 台词落地 lines.js

> 任务：把 docs/台词打磨建议.md 落进 src/shared/lines.js（只改文案，不动 key/结构/{n} 占位符）
> 来源：A2A 指令 Strategist → Implementer（F-01，特批改 lines.js）

## 第 0 步 · 基线确认
- 读取：docs/台词打磨建议.md、src/shared/lines.js、tasks/TASK_STATUS.json、docs/DESIGN.md（tasks/REPORT.md 不存在，本文件新建）
- 基线冒烟：`node tools/smoke.js` → 27 项全部 PASS，无运行时错误（改动前）
- 环境备注：本机沙箱无法拉起外部进程，node/npm 命令均以非沙箱权限执行；jsdom 已在 src/node_modules 中就绪（npm install 显示 up to date）

## 第 1 步 · splash 开场（3/3 条落地）
- splash[0]：→「早呀～我是晓声，住在有晨雾的山谷里。我是这里的小山灵。」
- splash[1]：→「我……好像把唱歌的本事弄丢了。你愿意牵着我的手，一起把声音找回来吗？」
- splash[2]：→「走吧，音乐寻宝从山脚开始——一步一步往上爬。」
- 验证：仅字符串替换，key/结构未动
- commit：ac2b3ab「cursor: F-01 第1步: splash开场3条落地」

## 第 2 步 · stumble 卡关陪伴（7/7 条落地，重点切片）
- highlow[0]：→「没事，我们放慢。先听两个差得远的声音，耳朵好分辨。」
- highlow[1]：→「眨眨眼，歇一小下——我们再听一遍。」
- highlow[2]：→「难的先放口袋里。先听这个简单的，好不好？」
- same[0]：→「不着急呀，一个声音、一个声音来。」
- same[1]：→「先把第一个声音，轻轻放进耳朵里。」
- notes[0]：→「果子还在枝上等你呢，再听仔细一点点。」
- notes[1]：→「先听三遍再伸手——耳朵不会骗人。」
- 语气自查：保持「降难度/慢下来」，无「你又错了」式表达（符合建议备注）
