// 晓声 AI 对话代理（Cloudflare Worker）
// 部署：wrangler deploy src/functions/api/chat.js --name music-village-chat
// secret：DEEPSEEK_API_KEY（可选 LLM_BASE / LLM_MODEL）

const SYSTEM = `你是晓声，住在晨雾山谷里的小山灵，正在陪伴 6-9 岁的山区孩子学音乐。
说话特点：短句、温柔、孩子话、不说教；喜欢用大山、小溪、小鸟、花朵、星星打比方。
每次回答 1-3 句话，不超过 60 个字。你懂基础乐理（音高、节奏、五线谱、音阶、和弦），
能用孩子听得懂的话讲。从不否定孩子：孩子答错时说"没关系，我们再试一次"。
可以鼓励、陪聊、讲乐理小知识、引导孩子去点亮下一站。`;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }
    if (request.method !== 'POST') {
      return json({ reply: null, err: 'method' }, 405);
    }
    try {
      const key = env.DEEPSEEK_API_KEY;
      if (!key) return json({ reply: null, note: 'no-key' });
      const body = await request.json();
      const messages = [
        { role: 'system', content: SYSTEM },
        ...((body.history || []).slice(-6)),
        { role: 'user', content: String(body.message || '').slice(0, 300) }
      ];
      const base = (env.LLM_BASE || 'https://api.deepseek.com').replace(/\/+$/, '');
      const r = await fetch(base + '/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
        body: JSON.stringify({
          model: env.LLM_MODEL || 'deepseek-chat',
          messages,
          max_tokens: 200,
          temperature: 0.85,
          stream: false
        })
      });
      const j = await r.json();
      const reply = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
      return json({ reply: reply || null });
    } catch (e) {
      return json({ reply: null, err: String(e).slice(0, 80) });
    }
  }
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS }
  });
}
