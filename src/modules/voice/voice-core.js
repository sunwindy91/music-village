/**
 * ============================================================
 *  VoiceCore · 语音/视觉/动画（module-voice 领地 · 队友）
 * ============================================================
 *  接口契约 v1.0 预留（本文件为占位实现，队友可整体替换）：
 *   - speak(text, opts?)             语音朗读
 *   - listen(cb) / stopListening()   语音识别
 *   - showCharacter(state)           小山灵状态
 *   - playAnimation(name)            动画
 *   - renderVision(opts)             视觉元素
 *   - onLevelEvent(evt)              接收 MusicCore 事件
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
      el.classList.remove('anim-bounce', 'anim-sing', 'anim-celebrate');
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

    // —— 通知 MusicCore ——
    _emitToMusic: function (type, payload) {
      if (window.MusicCore && window.MusicCore.onVoiceEvent) {
        window.MusicCore.onVoiceEvent({ type: type, payload: payload });
      }
    },
  };

  window.VoiceCore = VoiceCore;
})();
