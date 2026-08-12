/* ============================================================
 * Staff · 五线谱出口（VexFlow）
 * 把孩子的网格作品渲染成真实五线谱 + 导出 PNG / MIDI
 * piece.notes = [{ midi, start, dur }]（单位：拍）
 *   dur 1→四分(q)  2→二分(h)  0.5→八分(8)  4→全(w)
 * ============================================================ */
window.MV = window.MV || {};

MV.Staff = (() => {

  /* —— 拍值 → VexFlow 时值 —— */
  function durKey(dur) {
    if (dur >= 3.5) return 'w';
    if (dur >= 1.5) return 'h';
    if (dur >= 0.75) return 'q';
    if (dur >= 0.4) return '8';
    return '16';
  }
  function beatsOf(durKeyStr) {
    const k = durKeyStr.replace(/[^whq8]/g, '');
    return { w: 4, h: 2, q: 1, 8: 0.5, 16: 0.25 }[k] || 1;
  }

  /* —— 音序 → StaveNote（含休止填补） —— */
  function buildStaveNotes(pieceNotes) {
    const sorted = pieceNotes.slice().sort((a, b) => a.start - b.start);
    const atStart = {};
    sorted.forEach(n => { if (!(n.start in atStart)) atStart[n.start] = n; });
    const end = Math.max(8, Math.ceil(sorted.reduce((m, n) => Math.max(m, n.start + n.dur), 0)));
    const nextStarts = sorted.map(n => n.start).filter(s => s > 0).sort((a, b) => a - b);
    const out = [];
    let t = 0;
    while (t < end) {
      const n = atStart[t];
      if (n) {
        const key = Tonal.Midi.midiToNoteName(n.midi); // "C4"
        const vkey = key[0].toLowerCase() + '/' + key.slice(1);
        out.push(new Vex.Flow.StaveNote({ keys: [vkey], duration: durKey(n.dur) }));
        t += Math.max(1, Math.round(n.dur));
      } else {
        const nxt = nextStarts.find(s => s > t);
        const gap = nxt != null ? Math.min(4, Math.max(1, nxt - t)) : Math.min(4, end - t);
        out.push(new Vex.Flow.StaveNote({ keys: ['b/4'], duration: durKey(gap) + 'r' }));
        t += gap;
      }
    }
    return out;
  }

  /* —— 按 4/4 小节分组 —— */
  function chunkIntoMeasures(staveNotes, beatsPerBar) {
    const groups = [];
    let cur = [], acc = 0;
    staveNotes.forEach(sn => {
      const b = beatsOf(sn.duration);
      if (acc + b > beatsPerBar && cur.length) {
        groups.push(cur); cur = []; acc = 0;
      }
      cur.push(sn); acc += b;
    });
    if (cur.length) groups.push(cur);
    return groups;
  }

  /* —— 渲染 —— */
  function render(pieceNotes, el, opts = {}) {
    el.innerHTML = '';
    if (typeof Vex === 'undefined' || typeof Tonal === 'undefined') {
      el.innerHTML = '<p class="staff-empty">记谱引擎未加载，请检查网络。</p>';
      return;
    }
    if (!pieceNotes || !pieceNotes.length) {
      el.innerHTML = '<p class="staff-empty">还没有音符，先种几颗种子吧。</p>';
      return;
    }
    const F = Vex.Flow;
    const notes = buildStaveNotes(pieceNotes);
    const groups = chunkIntoMeasures(notes, 4);
    const barW = opts.compact ? 320 : 360;
    const H = opts.compact ? 120 : 138;
    const renderer = new F.Renderer(el, F.Renderer.Backends.SVG);
    renderer.resize(groups.length * barW + 10, H);
    const ctx = renderer.getContext();

    groups.forEach((g, i) => {
      const stave = new F.Stave(i * barW + 10, 24, barW - 30);
      if (i === 0) stave.addClef('treble').addTimeSignature('4/4');
      stave.setContext(ctx).draw();
      const voice = new F.Voice({ num_beats: 4, beat_value: 4 });
      voice.setMode(F.Voice.Mode.SOFT);
      voice.addTickables(g);
      new F.Formatter().joinVoices([voice]).formatToStave([voice], stave, { align_rests: true });
      voice.draw(ctx, stave);
    });
    // 让 SVG 内容可下载（VexFlow SVG 默认透明底）
    const svg = el.querySelector('svg');
    if (svg) svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    return svg;
  }

  /* —— 导出 PNG —— */
  function exportPNG(el, name) {
    const svg = el && el.querySelector('svg');
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scale = 2;
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, rect.width * scale);
      canvas.height = Math.max(1, rect.height * scale);
      const c = canvas.getContext('2d');
      c.fillStyle = '#fffdf4';
      c.fillRect(0, 0, canvas.width, canvas.height);
      c.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const a = document.createElement('a');
      a.download = (name || '我的小曲') + '.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = url;
  }

  /* —— 导出 MIDI（Format 0，简易但规范） —— */
  function exportMIDI(pieceNotes, bpm, name) {
    const PPQ = 480;
    const notes = pieceNotes.slice().sort((a, b) => a.start - b.start);
    const evts = [];
    notes.forEach(n => {
      const on = Math.max(0, Math.round(n.start * PPQ));
      const off = Math.round((n.start + n.dur) * PPQ);
      evts.push({ t: on,  s: 0x90, d: [n.midi, 92] });
      evts.push({ t: off, s: 0x80, d: [n.midi, 0] });
    });
    evts.sort((a, b) => a.t - b.t);

    const bytes = [];
    let prev = 0;
    const push = v => bytes.push(v & 0xff);
    const pushVlq = (v) => {
      let buf = [v & 0x7f];
      v >>= 7;
      while (v > 0) { buf.unshift((v & 0x7f) | 0x80); v >>= 7; }
      buf.forEach(push);
    };
    const pushStr = (s) => {
      const enc = new TextEncoder().encode(s);
      pushVlq(enc.length);
      enc.forEach(push);
    };

    // 头部
    'MThd'.split('').forEach(c => push(c.charCodeAt(0)));
    push(0); push(0); push(0); push(6);   // header length
    push(0); push(0);                     // format 0
    push(0); push(1);                     // 1 track
    push(PPQ >> 8); push(PPQ & 0xff);     // division

    // 音轨
    'MTrk'.split('').forEach(c => push(c.charCodeAt(0)));
    const trackStart = bytes.length;
    push(0); push(0); push(0); push(0);   // 占位 track length
    const usPerQ = Math.round(60000000 / bpm);
    pushVlq(0); push(0xff); push(0x51); push(3); push(usPerQ >> 16); push((usPerQ >> 8) & 0xff); push(usPerQ & 0xff);
    pushVlq(0); push(0xff); push(0x58); push(4); push(4); push(2); push(24); push(8); // 4/4
    if (name) { pushVlq(0); push(0xff); push(0x03); pushStr(name); }

    evts.forEach(e => {
      pushVlq(Math.max(0, e.t - prev));
      prev = e.t;
      push(e.s);
      e.d.forEach(push);
    });
    pushVlq(0); push(0xff); push(0x2f); push(0); // end of track

    const trackLen = bytes.length - trackStart - 4;
    bytes[trackStart + 3] = trackLen & 0xff;
    bytes[trackStart + 2] = (trackLen >> 8) & 0xff;
    bytes[trackStart + 1] = (trackLen >> 16) & 0xff;
    bytes[trackStart] = (trackLen >> 24) & 0xff;

    const blob = new Blob([new Uint8Array(bytes)], { type: 'audio/midi' });
    const a = document.createElement('a');
    a.download = (name || '我的小曲') + '.mid';
    a.href = URL.createObjectURL(blob);
    a.click();
  }

  return { render, exportPNG, exportMIDI, buildStaveNotes };
})();
