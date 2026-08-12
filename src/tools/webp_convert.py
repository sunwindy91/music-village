# -*- coding: utf-8 -*-
"""把 music-village/assets 下的水彩 PNG 批量转 WebP，大幅减小体积解决加载转圈。"""
import os
from PIL import Image

SRC = r"C:\Users\23017\Desktop\AI比赛\music-village\src\assets"

def conv(fname):
    path = os.path.join(SRC, fname)
    im = Image.open(path)
    # 大场景图适度缩宽，其余保持原尺寸
    max_w = 1600 if fname in ("valley.png", "scroll.png", "level_pitch.png") else None
    if max_w and im.width > max_w:
        r = max_w / im.width
        im = im.resize((max_w, round(im.height * r)), Image.LANCZOS)
    out = os.path.join(SRC, fname[:-4] + ".webp")
    im.save(out, "WEBP", quality=84, method=6)
    return fname, round(os.path.getsize(path) / 1024), round(os.path.getsize(out) / 1024)

if __name__ == "__main__":
    print("name | pngKB | webpKB | 压缩比")
    for f in sorted(os.listdir(SRC)):
        if f.endswith(".png"):
            n, p, w = conv(f)
            print(f"{n} | {p} | {w} | {round(w/p*100)}%")
    print("done")
