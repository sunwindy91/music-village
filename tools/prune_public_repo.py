# -*- coding: utf-8 -*-
# 临时脚本：从 music-village 公开仓版本控制移除内部材料（本地文件保留）
import subprocess, os
os.chdir(r"C:\Users\23017\Desktop\AI比赛\music-village")

paths = [
    "A2A_PROTOCOL.md", "CURSOR_PROMPT.md", "KIMI_PROMPT.md", "MUSIC_VILLAGE_CURSOR_TASKS.md",
    "开发资产包.md", "新窗口开工包.md", "验收交接包_20260812.md", "tasks", "素材工作台",
    "_debug_map10.png", "_debug_map7.png", "_debug_map8.png", "_debug_map9.png", "_debug_zoom.png",
    "docs/A2A-BRANCHING.md", "docs/A2A-DECISION-LOG.md", "docs/A2A-HANDOFF-TEMPLATE.md", "docs/PROGRESS.md",
    "docs/UI修复方案.md", "docs/UI审查报告.md", "docs/产品系统化升级方案.md", "docs/代码审查报告.md",
    "docs/作品介绍_温度版.md", "docs/初赛提交冲刺包.md", "docs/初赛方向材料.md", "docs/初赛方向材料_v2.md",
    "docs/初赛方向材料_v3.md", "docs/台词打磨建议.md", "docs/审查报告_20260813.md", "docs/待生成素材清单.md",
    "docs/晓声3D素材接入方案.md", "docs/晓声6阶段_3D立体化Prompt.md", "docs/晓声_生图Prompt清单.md",
    "docs/晓声智能升级方案.md", "docs/晓声灵魂化设计方案.md", "docs/演示视频脚本_3分钟.md",
    "docs/演示逐镜脚本.md", "docs/答辩材料.md", "docs/答辩材料_v4.md", "docs/素材协作计划.md",
    "docs/视频分镜素材脚本_最终版.md", "docs/视频录制脚本_最终版v2_照读版.md", "docs/课程体系脑暴_补课清单.md",
    "docs/调研.md", "docs/项目说明文档_完整版.md", "docs/项目说明文档_完整版.html",
    "docs/项目说明文档_完整版.pdf", "docs/images", "docs/社媒发布文案_分平台定制.md",
]

ok = fail = 0
for p in paths:
    r = subprocess.run(["git", "rm", "-r", "--cached", p], capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode == 0:
        ok += 1
        print("OK  ", p)
    else:
        err = (r.stderr or "").strip().splitlines()
        msg = err[0] if err else "?"
        if "did not match" in msg or "pathspec" in msg:
            print("SKIP(已移除)", p)
        else:
            fail += 1
            print("FAIL", p, "::", msg[:80])
print(f"DONE ok={ok} fail={fail}")
