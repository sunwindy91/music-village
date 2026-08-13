# 晓声 3D 素材批量抠图（rembg 透明底 + 压缩 + 主体映射）
# 输入：素材工作台\06_待生成图放这里\*.jpg（用户生成的 21 张 3D 手办）
# 输出：src\assets\3d\（全量透明 PNG）+ 6 张主体映射为 xiaosheng*.png（覆盖成长形态）
import os, glob
from rembg import remove
from PIL import Image

SRC_DIR = r"C:\Users\23017\Desktop\AI比赛\music-village\素材工作台\06_待生成图放这里"
OUT_3D = r"C:\Users\23017\Desktop\AI比赛\music-village\src\assets\3d"
OUT_MAIN = r"C:\Users\23017\Desktop\AI比赛\music-village\src\assets"
os.makedirs(OUT_3D, exist_ok=True)

# 主体映射：源文件名（不含扩展）→ 目标英文名（FORMS 引用）
MAIN_MAP = {
    "迷你单叶山灵招手踮脚": "xiaosheng",            # 种子（单叶）
    "3D山灵手办治愈微笑": "xiaosheng_sprout",        # 小芽
    "3D山灵手办花开心举手": "xiaosheng_bloom",       # 开花
    "3D山灵手办花环微笑": "xiaosheng_spark",         # 星光
    "3D鹿宝宝手办温柔歪头": "xiaosheng_fawn",        # 初鹿
    "3D小鹿手办治愈歪头": "xiaosheng_deer",          # 鹿
}

def cut_to_png(path, out_path, w=480):
    im = Image.open(path).convert("RGBA")
    cut = remove(im)
    bbox = cut.getbbox()
    if bbox:
        cut = cut.crop(bbox)
    r = w / cut.width
    cut = cut.resize((w, int(cut.height * r)), Image.LANCZOS)
    cut.save(out_path, "PNG", optimize=True)
    return cut.size

files = glob.glob(os.path.join(SRC_DIR, "*.jpg"))
print("共", len(files), "张")
for f in files:
    name = os.path.splitext(os.path.basename(f))[0]
    png3d = os.path.join(OUT_3D, name + ".png")
    size = cut_to_png(f, png3d)
    print("抠图 OK", name, size)
    if name in MAIN_MAP:
        main_png = os.path.join(OUT_MAIN, MAIN_MAP[name] + ".png")
        cut_to_png(f, main_png)
        print("  主体映射 →", MAIN_MAP[name] + ".png")
print("完成")
