# -*- coding: utf-8 -*-
"""在对话记录中查找用户说过的理念原话"""
import json, io, sys, glob, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

d = r'c:\Users\23017\AppData\Roaming\Code\User\workspaceStorage\5d96e1cdf8de5338a5d16f00f85a6351\GitHub.copilot-chat\transcripts'
kws = ['音乐', '孩子', '山', '启蒙', '学会', '希望', '觉得', '想要', '应该', '不要', '一定']
only_file = r'23a6e5a7-07fa-4206-9c18-181cd08bd358.jsonl'

files = [os.path.join(d, only_file)]
out = []
out.append('FILES=' + str(len(files)))
for fp in files:
    hits = []
    sample = []
    for line in open(fp, encoding='utf-8', errors='ignore'):
        if '"type":"user.message"' not in line and '"type": "user.message"' not in line:
            continue
        try:
            obj = json.loads(line)
        except Exception:
            continue
        data = obj.get('data', {}) if isinstance(obj.get('data'), dict) else {}
        content = data.get('content', '')
        if isinstance(content, list):
            txt = ' '.join(c.get('text', '') for c in content if isinstance(c, dict))
        else:
            txt = content
        if not txt or len(txt) < 8:
            continue
        if len(sample) < 2:
            sample.append(txt[:120])
        if any(k in txt for k in kws):
            t = txt.replace('\n', ' ').replace('\r', ' ').strip()
            hits.append(t[:500])
    out.append('---- ' + os.path.basename(fp) + ' user_samples: ' + str(sample))
    if hits:
        out.append('=' * 20 + ' ' + os.path.basename(fp) + ' hits=' + str(len(hits)))
        for h in hits[-12:]:
            out.append('  - ' + h)

with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'idea_quotes_result.txt'),
          'w', encoding='utf-8') as f:
    f.write('\n'.join(out))
print('DONE', len(out), 'lines')
