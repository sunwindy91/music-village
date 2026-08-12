# 小有可为 · 水彩素材批量生成（openai-next / dall-e-3）
# 用法: python tools/gen_assets.py [名称...]  (不带参数=全部)
import json, os, base64, requests, sys

AUTH = json.load(open(os.path.expanduser('~/.codex/auth.json')))
KEY = AUTH.get('OPENAI_API_KEY', '')
API = 'https://api.openai-next.com/v1/images/generations'
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets')
os.makedirs(OUT, exist_ok=True)

ANCHOR = ('水彩插画，晨雾山谷氛围，低饱和莫兰迪色系（雾蓝#bfe3ff/晨金#e8b04b/森林绿#3e7d5e），'
          '大留白，治愈感，高级感插画风格，无文字，无水印')

PROMPTS = [
    ('xiaosheng', ANCHOR + '，圆润可爱的小山灵精灵，青绿色圆润身体，头顶一片嫩芽叶，'
     '眼睛亮晶晶，双手背在身后微微歪头，像在邀请小朋友，水彩质感，单一角色全身，纯色底'),
    ('valley', ANCHOR + '，清晨山谷全景，五线谱化作起伏的山脊线延伸向远方，'
     '彩色音符像萤火虫飘浮在山谷间，一条发光的小路通向山上的木屋学校，太阳在晨雾中升起'),
    ('note_full', ANCHOR + '，一个圆形发光的全音符（空心符头），柔和光晕，简洁'),
    ('note_quarter', ANCHOR + '，一个圆形发光的四分音符（实心符头带符干），柔和光晕，简洁'),
    ('note_eighth', ANCHOR + '，一个圆形发光的八分音符（实心符头带符干符尾），柔和光晕，简洁'),
    ('level_pitch', ANCHOR + '，山谷中两只不同高度的小鸟，站得高的那只在更高的山岩上，表现音的高低'),
    ('scroll', ANCHOR + '，一张泛黄卷轴，上面用水彩画的五线谱，音符正在发光'),
    ('person_bird', ANCHOR + '，一只水彩小鸟的小图标，圆形徽章'),
    ('person_stream', ANCHOR + '，一条水彩小溪的小图标，圆形徽章'),
    ('person_star', ANCHOR + '，一颗水彩星星的小图标，圆形徽章'),
    # —— 晓声 6 阶段成长形态（同一角色的立体水彩 · 前后连贯，最后蜕变成小鹿） ——
    ('xiaosheng_sprout', ANCHOR + '，圆润可爱的小山灵精灵立体形象，Q版3D质感软萌，青绿色圆润身体，'
     '头顶嫩芽长成两片小叶子，眼睛亮晶晶，微微歪头，柔光体积感，单一角色全身，纯色底'),
    ('xiaosheng_bloom', ANCHOR + '，圆润可爱的小山灵精灵立体形象，Q版3D质感软萌，青绿色圆润身体，'
     '头顶开出一朵小小的淡金色花，身上有淡淡星光，开心笑着，柔光体积感，单一角色全身，纯色底'),
    ('xiaosheng_spark', ANCHOR + '，圆润可爱的小山灵精灵立体形象，Q版3D质感软萌，青绿色圆润身体，'
     '头顶金色花环，身体周围漂浮闪闪的金色星点，像会发光的精灵，柔光体积感，单一角色全身，纯色底'),
    ('xiaosheng_fawn', ANCHOR + '，小山灵正在变成小鹿的可爱过渡形态，Q版3D立体质感软萌，'
     '身体从青绿渐变成晨金色，头上长出两只小小的圆润鹿角，脸颊有淡淡金色花纹，眼睛亮晶晶，'
     '像初生的鹿宝宝，柔光体积感，单一角色全身，纯色底'),
    ('xiaosheng_deer', ANCHOR + '，一只温柔发光的小鹿立体形象，Q版3D质感软萌，毛色是晨金与雾绿渐变，'
     '头顶有小巧的角，身上有金色星点和一朵小花，眼神清澈治愈，像会陪伴孩子的精灵，柔光体积感，'
     '单一角色全身，纯色底，高级感'),
    # —— 聚类课程架构：聚类封面（水彩全景 · 观感提升最大） ——
    ('cluster_valley', ANCHOR + '，声音山谷全景，音的高低化作起伏山丘与飞翔的小鸟（高鸟在高岩、低鸟在溪边），'
     '一条发光的寻宝小路通向远方，晨雾与溪水，圆润治愈'),
    ('cluster_scale', ANCHOR + '，山谷中一座彩虹色音阶楼梯（七个彩色台阶向上延伸），'
     '音符像萤火虫沿台阶飘浮，小山灵站在楼梯下抬头仰望，圆润治愈'),
    ('cluster_meadow', ANCHOR + '，金色麦田草原，音符种子长成发光的花朵，五线谱化作田垄延伸远方，'
     '小山灵在田里种音符，圆润治愈'),
    # —— 理论导入卡配图（晓声小课堂） ——
    ('theory_pitch', ANCHOR + '，两只水彩小鸟，一只飞在高高的山岩上、一只停在低处溪边，'
     '音符连线表现音的高低差，圆润可爱'),
    ('theory_scale', ANCHOR + '，七个圆润音符小人排成彩虹楼梯（do re mi fa sol la si），'
     '像小朋友排队上楼梯，圆润可爱'),
    ('theory_create', ANCHOR + '，小山灵把发光音符种子种进田里，田里长出五线谱形状的麦穗与花朵，温馨治愈'),
    # —— 新聚类节奏小路：封面 + 理论卡配图 ——
    ('cluster_rhythm', ANCHOR + '，山谷中的一条节奏小路，脚印与鼓点化作发光圆点排成小路，'
     '大小不同的脚步表现节奏快慢，小山灵踩在小路上回头笑，圆润治愈'),
    ('theory_rhythm', ANCHOR + '，三个圆润音符小人排在小路上：一个稳稳走（四分）、一个轻轻跑（八分）、'
     '一个飞快跑（十六分），脚下有发光脚步，圆润可爱'),
    # —— 第5聚类和弦花园：封面 + 理论卡配图 ——
    ('cluster_chord', ANCHOR + '，山谷中的一座花园，三朵发光的花手拉手（代表三和弦），'
     '花朵颜色像彩虹（晨金/雾蓝/森林绿），小山灵在花园里轻轻浇水，圆润治愈'),
    ('theory_chord', ANCHOR + '，三个圆润音符小人手拉手站成一圈，脚下有彩虹色光晕，'
     '像好朋友一起唱歌，圆润可爱'),
]

def gen(name, prompt):
    try:
        r = requests.post(API, headers={'Authorization': 'Bearer ' + KEY},
                          json={'model': 'dall-e-3', 'prompt': prompt, 'n': 1,
                                'size': '1024x1024', 'response_format': 'b64_json'},
                          timeout=600)
        j = r.json()
        b64 = (j.get('data') or [{}])[0].get('b64_json')
        if b64:
            data = base64.b64decode(b64)
            with open(os.path.join(OUT, name + '.png'), 'wb') as f:
                f.write(data)
            print('OK', name, len(data) // 1024, 'KB')
            return True
        print('FAIL', name, j.get('error') or j)
    except Exception as e:
        print('ERR', name, e)
    return False

if __name__ == '__main__':
    wanted = sys.argv[1:] if len(sys.argv) > 1 else [n for n, _ in PROMPTS]
    for name, prompt in PROMPTS:
        if name in wanted:
            gen(name, prompt)
    print('完成 →', OUT)
