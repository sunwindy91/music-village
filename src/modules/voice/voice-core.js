/**
 * ============================================================
 *  VoiceCore · 语音/视觉/动画（module-voice 领地 · 队友）
 * ============================================================
 *  接口契约 v1.0 预留（本文件为占位实现，队友可整体替换）：
 *   - speak(text, opts?)             语音朗读
 *   - listen(cb) / stopListening()   语音识别
 *   - showCharacter(state)           山灵状态
 *   - playAnimation(name)            动画
 *   - renderVision(opts)             视觉元素
 *   - onLevelEvent(evt)              接收 MusicCore 事件
 *   - askSpirit(prompt, opts)        山灵 AI 对话（决赛接入大模型）
 * ============================================================
 */
(function () {
  'use strict';

  const VoiceCore = {
    // —— 语音 ——
    speak: function (text, opts) {
      opts = opts || {};
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'zh-CN';
        if (opts.rate) u.rate = opts.rate;
        if (opts.pitch) u.pitch = opts.pitch;
        window.speechSynthesis.speak(u);
      }
    },

    listen: function (callback) {
      // 占位：真实语音识别由队友实现（Web Speech / 自研）
      if (callback) callback(null, 0);
    },
    stopListening: function () {},

    // —— 视觉 / 动画 ——
    showCharacter: function (state) {
      const el = document.getElementById('spirit');
      if (!el) return;
      el.dataset.state = state;
    },

    playAnimation: function (animName) {
      const el = document.getElementById('spirit');
      if (!el) return;
      el.classList.remove('talk', 'celebrate');
      el.classList.add('anim-' + animName);
    },

    renderVision: function (opts) {
      // 占位：由队友实现音符/小鸟/彩虹等视觉
      console.log('[VoiceCore] renderVision', opts);
    },

    // —— 接收 MusicCore 事件 ——
    onLevelEvent: function (evt) {
      console.log('[VoiceCore] onLevelEvent', evt);
    },

    // —— 山灵 AI 对话（API 预留）——
    // 初赛：返回 null → 应用层用本地规则引导语
    // 决赛：配置 config.js 的 SPIRIT_AI 后走大模型（通义/DeepSeek via proxy）
    askSpirit: function (prompt, opts) {
      opts = opts || {};
      const cfg = window.SPIRIT_AI || {};
      if (!cfg.endpoint || !cfg.token) {
        if (opts.onError) opts.onError('no_ai_configured');
        return;
      }
      fetch(cfg.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.token },
        body: JSON.stringify({
          messages: [{ role: 'system', content: cfg.system || '你是山灵，陪小朋友学音乐的温柔伙伴。说话简短、鼓励、用儿童能懂的话。' },
                      { role: 'user', content: prompt }],
          max_tokens: cfg.maxTokens || 80,
        }),
      }).then(function (r) { return r.json(); })
        .then(function (data) {
          const text = data && (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) ||
            (data.output && data.output.text) || null;
          if (text && opts.onText) opts.onText(text.trim());
          else if (opts.onError) opts.onError('empty_response');
        })
        .catch(function (e) { if (opts.onError) opts.onError(e); });
    },

    // —— 通知 MusicCore ——
    _emitToMusic: function (type, payload) {
      if (window.MusicCore && window.MusicCore.onVoiceEvent) {
        window.MusicCore.onVoiceEvent({ type: type, payload: payload });
      }
    },
  };

  window.VoiceCore = VoiceCore;
})();
