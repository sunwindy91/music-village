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
