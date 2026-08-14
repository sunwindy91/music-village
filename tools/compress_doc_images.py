# -*- coding: utf-8 -*-
# 临时脚本：压缩 docs/images 下 PNG（resize + optimize），用于说明文档插图与 PDF
import os
from PIL import Image

d = r"C:\Users\23017\Desktop\AI比赛\music-village\docs\images"
MAX_W = 900  # 最大宽度

for f in sorted(os.listdir(d)):
    if not f.lower().endswith(".png"):
        continue
    p = os.path.join(d, f)
    im = Image.open(p).convert("RGBA")
    w, h = im.size
    if w > MAX_W:
        im = im.resize((MAX_W, int(h * MAX_W / w)), Image.LANCZOS)
    im.save(p, "PNG", optimize=True)
    print(f"OK {f} {w}x{h} -> {im.size} {round(os.path.getsize(p)/1024)}KB")
print("DONE")
