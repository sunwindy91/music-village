# 晓声 TTS 语音包生成（edge-tts 免费 · 温柔女声 · 稚嫩感）
# 用法: python tools/gen_tts.py   输出 src/assets/voices/*.mp3
import asyncio, edge_tts, pathlib

VOICE = 'zh-CN-XiaoxiaoNeural'   # 温柔治愈女声
RATE = '+6%'                     # 稍缓，像慢慢说话
PITCH = '+8Hz'                   # 略高，显稚嫩
OUT = pathlib.Path(__file__).resolve().parents[1] / 'assets' / 'voices'
OUT.mkdir(parents=True, exist_ok=True)

LINES = {
    # 欢迎
    'welcome1': '早呀，我是晓声，住在有晨雾的山谷里。',
    'welcome2': '你愿意牵着我的手，一起把声音找回来吗？',
    'welcome3': '走吧，音乐寻宝，从山脚开始，一步一步往上爬。',
    'back1': '你回来啦！小路上又有新的声音，在冲我们招手呢。',
    # 下一站引导（nextStop）
    'next_valley': '声音山谷点亮啦！我们去节奏小路，踩一踩鼓点吧。',
    'next_rhythm': '节奏小路点亮啦！音阶山谷在等你，去爬彩虹楼梯吧。',
    'next_scale': '音阶山谷点亮啦！和弦花园开了花，去浇浇水吧。',
    'next_chord': '和弦花园点亮啦！最后一片旋律草原，去种音符种子吧。',
    'next_meadow': '五片山谷全点亮啦！你让整个山谷，都唱起了歌。',
    # 鼓励语（给山里小朋友）
    'enc1': '你们就像晓声一样，有无限的潜力。外面的精彩，在等着你们。',
    'enc2': '每一颗音符的种子，都会长成一首歌。你们也是。',
    'enc3': '好好学习，总有一天，你们也能用自己的本事，让家乡变得更美。',
    # 卡关陪伴
    'stumble1': '没事，我们放慢。先听两个差得远的声音，耳朵好分辨。',
    'stumble2': '不着急呀，一个声音，一个声音来。',
    # 通关
    'clear1': '太棒了！你把这里点亮啦！',
    'clear2': '再玩一次，也真棒！'
}

async def gen(key, text):
    out = OUT / f'{key}.mp3'
    if out.exists():
        print('skip', key); return
    c = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH)
    await c.save(str(out))
    print('OK', key, round(out.stat().st_size / 1024, 1), 'KB')

async def main():
    for k, t in LINES.items():
        try:
            await gen(k, t)
        except Exception as e:
            print('ERR', k, repr(e)[:120])

asyncio.run(main())
print('done ->', OUT)
