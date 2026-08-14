# -*- coding: utf-8 -*-
# 临时脚本：用 gh api PUT contents 上传文档（git push 443 被干扰时的备选通道）
import base64, json, os, subprocess, tempfile

repo = "sunwindy91/music-village"
os.chdir(r"C:\Users\23017\Desktop\AI比赛\music-village")

files = [
    ("docs/视频录制脚本_最终版v2_照读版.md", "导演：最终录制脚本v2照读版(融入温度版口播+理念原话收尾)"),
    ("docs/项目说明文档_完整版.md", "导演：说明文档去评委视角表述+加入真实产品画面插图"),
    ("docs/项目说明文档_完整版.html", "导演：说明文档html同步去评委表述+产品画面插图"),
    ("docs/项目说明文档_完整版.pdf", "导演：重新生成含插图PDF版项目说明文档"),
    ("docs/images/01_首页_真实运行.png", "导演：产品说明插图-线上首页真实运行截图"),
    ("docs/images/hero.png", "导演：产品说明插图-hero主视觉"),
    ("docs/images/cluster_valley.png", "导演：产品说明插图-声音山谷封面"),
    ("docs/images/cluster_scale.png", "导演：产品说明插图-音阶山谷封面"),
    ("docs/images/cluster_rhythm.png", "导演：产品说明插图-节奏小路封面"),
    ("docs/images/cluster_chord.png", "导演：产品说明插图-和弦花园封面"),
    ("docs/images/cluster_meadow.png", "导演：产品说明插图-旋律草原封面"),
    ("docs/images/xiaosheng.png", "导演：产品说明插图-晓声种子形态"),
    ("docs/images/xiaosheng_sprout.png", "导演：产品说明插图-晓声小芽形态"),
    ("docs/images/xiaosheng_bloom.png", "导演：产品说明插图-晓声开花形态"),
    ("docs/images/xiaosheng_spark.png", "导演：产品说明插图-晓声星光形态"),
    ("docs/images/xiaosheng_fawn.png", "导演：产品说明插图-晓声初鹿形态"),
    ("docs/images/xiaosheng_deer.png", "导演：产品说明插图-晓声鹿形态"),
]

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    return (r.stdout or "").strip(), (r.stderr or "").strip()

for path, msg in files:
    local = path.replace("/", os.sep)
    if not os.path.exists(local):
        print("MISSING", local); continue
    content = base64.b64encode(open(local, "rb").read()).decode()
    out, err = run(["gh", "api", f"repos/{repo}/contents/{path}", "--jq", ".sha"])
    sha = out if (out and "Not Found" not in err) else None
    body = {"message": msg, "content": content}
    if sha:
        body["sha"] = sha
    tmp = os.path.join(tempfile.gettempdir(), "gh_body.json")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(body, f)
    cmd = ["gh", "api", "-X", "PUT", f"repos/{repo}/contents/{path}",
           "--input", tmp, "--jq", ".commit.sha"]
    out, err = run(cmd)
    print("UPLOADED", path, "->", out or err)
print("ALL_DONE")
