import React, { useEffect, useRef, useState } from 'react';

const ZONE = { 1: 'rgba(158,158,158,0.07)', 2: 'rgba(41,182,246,0.07)', 3: 'rgba(255,193,7,0.07)', 4: 'rgba(255,193,7,0.07)', 5: 'rgba(158,158,158,0.07)' };
const ZONE_HI = { 1: 'rgba(158,158,158,0.18)', 2: 'rgba(41,182,246,0.20)', 3: 'rgba(255,193,7,0.22)', 4: 'rgba(255,193,7,0.22)', 5: 'rgba(158,158,158,0.18)' };
const ZLABEL = { 1: 'Труба', 2: 'Вода', 3: 'Воздух', 4: 'Полёт', 5: 'Падение' };

export default function ResultsChart({ result, whatIfResult = null, compareResult = null, highlightPhase = null, playing = false, onPlayTick, onPlayEnd, flagMode = false, flags = [], onAddFlag, onRemoveFlag }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const geomRef = useRef(null);
  const hoverRef = useRef(null);
  const hoverFlagRef = useRef(null);
  const [hover, setHover] = useState(null);
  const [pending, setPending] = useState(null); // { px, py, defT }
  const [draft, setDraft] = useState('');
  const [chartH, setChartH] = useState(typeof window !== 'undefined' && window.innerWidth <= 768 ? 220 : 300);
  useEffect(() => {
    const f = () => setChartH(window.innerWidth <= 768 ? 220 : 300);
    window.addEventListener('resize', f, { passive: true });
    return () => window.removeEventListener('resize', f);
  }, []);

  const FLAG_COLORS = ['#2e7d32', '#1565c0', '#e65100', '#6a1b9a'];
  const maxTime = result && result.points.length ? result.points[result.points.length - 1].t : 0;
  const pendingT = pending ? Math.min(Math.max(parseFloat(draft.replace(',', '.')) || pending.defT, 0), maxTime) : null;
  const nextColor = FLAG_COLORS[Math.min(flags.length, 3)];
  const nextLetter = 'ABCD'[Math.min(flags.length, 3)];

  const R = useRef({});
  R.current = { result, whatIfResult, compareResult, highlightPhase, playing, onPlayTick, onPlayEnd, flagMode, flags, pendingT, pendingColor: nextColor, pendingLetter: nextLetter };

  const playStart = useRef(0);
  useEffect(() => { if (playing) playStart.current = performance.now(); }, [playing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !result || !result.points.length) return;
    const ctx = canvas.getContext('2d');
    const pts = result.points;
    const apIdx = result.apogeeIdx ?? pts.length - 1;
    let boIdx = 0, bd = Infinity;
    pts.forEach((p, i) => { const d = Math.abs(p.t - result.burnTime); if (d < bd) { bd = d; boIdx = i; } });

    const start = performance.now();
    let raf;
    const draw = (now) => {
      const st = R.current;
      const W = canvas.offsetWidth, H = canvas.offsetHeight;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== W * dpr) { canvas.width = W * dpr; canvas.height = H * dpr; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // dynamic scale across all active series
      let maxT = pts[pts.length - 1].t;
      let maxVv = Math.max(...pts.map(p => p.y));
      if (st.whatIfResult && st.whatIfResult.points.length) {
        const wp = st.whatIfResult.points;
        maxT = Math.max(maxT, wp[wp.length - 1].t);
        for (const p of wp) if (p.y > maxVv) maxVv = p.y;
      }
      if (st.compareResult && st.compareResult.points.length) {
        const cp = st.compareResult.points;
        maxT = Math.max(maxT, cp[cp.length - 1].t);
        for (const p of cp) if (p.y > maxVv) maxVv = p.y;
      }
      const maxV = maxVv * 1.1 || 1;

      const pad = { l: 42, r: 18, t: 28, b: 30 };
      const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;
      const win = maxT, t0 = 0;
      const xOf = t => pad.l + ((t - t0) / win) * cw;
      const yOf = v => pad.t + ch - (v / maxV) * ch;
      geomRef.current = { pts, maxT, maxV, pad, cw, ch, win, t0, xOf, yOf, boIdx, apIdx };
      const hl = st.highlightPhase;

      const rawP = Math.min((now - start) / 1200, 1);
      const progress = rawP < 0.5 ? 2 * rawP * rawP : 1 - Math.pow(-2 * rawP + 2, 2) / 2;

      // zones
      ctx.save();
      ctx.beginPath(); ctx.rect(pad.l, pad.t, cw, ch); ctx.clip();
      let cur = pts[0].phase, sx = xOf(pts[0].t);
      for (let i = 1; i <= pts.length; i++) {
        const last = i === pts.length;
        if (last || pts[i].phase !== cur) {
          const ex = last ? xOf(pts[i - 1].t) : xOf(pts[i].t);
          ctx.fillStyle = (hl === cur ? ZONE_HI : ZONE)[cur] || 'transparent';
          ctx.fillRect(sx, pad.t, ex - sx, ch);
          if (ex - sx > 24 && ZLABEL[cur]) {
            ctx.fillStyle = hl === cur ? 'rgba(40,60,40,0.9)' : 'rgba(0,0,0,0.3)';
            ctx.font = `${hl === cur ? 700 : 500} 9px var(--font-body, sans-serif)`;
            ctx.textAlign = 'center';
            ctx.fillText(ZLABEL[cur], Math.min(Math.max((sx + ex) / 2, pad.l + 14), pad.l + cw - 14), pad.t - 9);
          }
          if (!last) { cur = pts[i].phase; sx = ex; }
        }
      }
      ctx.restore();

      // grid
      const mob = W < 500;
      ctx.textAlign = 'left'; ctx.font = `${mob ? 9 : 11}px var(--font-body, sans-serif)`; ctx.setLineDash([3, 4]);
      for (let i = 0; i <= 4; i++) {
        const y = pad.t + (ch / 4) * i;
        ctx.strokeStyle = 'rgba(0,0,0,0.05)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + cw, y); ctx.stroke();
        ctx.fillStyle = '#9a9a9a'; ctx.fillText((maxV - (maxV / 4) * i).toFixed(0), 6, y + 3.5);
      }
      ctx.setLineDash([]); ctx.textAlign = 'center';
      for (let i = 0; i <= 4; i++) {
        ctx.fillStyle = '#9a9a9a';
        ctx.fillText((t0 + (win / 4) * i).toFixed(1) + 'с', pad.l + (cw / 4) * i, H - 8);
      }

      // line + fill
      ctx.save();
      ctx.beginPath(); ctx.rect(pad.l, pad.t, cw, ch); ctx.clip();
      const lim = Math.max(2, Math.floor(pts.length * progress));
      ctx.beginPath(); ctx.moveTo(xOf(pts[0].t), yOf(0));
      for (let i = 0; i < lim; i++) ctx.lineTo(xOf(pts[i].t), yOf(pts[i].y));
      ctx.lineTo(xOf(pts[lim - 1].t), yOf(0)); ctx.closePath();
      const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + ch);
      grad.addColorStop(0, 'rgba(76,175,80,0.18)'); grad.addColorStop(1, 'rgba(76,175,80,0)');
      ctx.fillStyle = grad; ctx.fill();
      ctx.strokeStyle = '#2e7d32'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i < lim; i++) { const x = xOf(pts[i].t), y = yOf(pts[i].y); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke();

      // what-if overlay (thin dashed)
      if (st.whatIfResult && st.whatIfResult.points.length) {
        const wp = st.whatIfResult.points;
        ctx.strokeStyle = '#1b5e20'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
        ctx.beginPath();
        wp.forEach((p, i) => { const x = xOf(p.t), y = yOf(p.y); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
        ctx.stroke(); ctx.setLineDash([]);
      }

      // compare line
      if (st.compareResult && st.compareResult.points.length) {
        const cp = st.compareResult.points;
        ctx.strokeStyle = '#1565c0'; ctx.lineWidth = 2; ctx.setLineDash([8, 4]);
        ctx.beginPath();
        cp.forEach((p, i) => { const x = xOf(p.t), y = yOf(p.y); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
        ctx.stroke(); ctx.setLineDash([]);
      }

      if (progress > 0.98) {
        const fs = mob ? 10 : 10.5;
        const sx = xOf(pts[0].t), sy = yOf(0);
        const bx = xOf(pts[boIdx].t), by = yOf(pts[boIdx].y);
        const ax = xOf(pts[apIdx].t), ay = yOf(pts[apIdx].y);
        const close = Math.abs(bx - sx) < 60; // labels would collide

        // Старт — if cramped, drop below the point instead of above
        marker(ctx, sx, sy, 3.5, '#9e9e9e');
        clab(ctx, 'Старт', sx + 6, close ? sy + 13 : sy - 8, 'left', false, fs, pad, cw);

        // Конец тяги — dashed guide + label (shorten on narrow, nudge right when cramped)
        ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, pad.t + ch); ctx.stroke(); ctx.setLineDash([]);
        marker(ctx, bx, by, 4, '#f57c00');
        const boTxt = `${mob ? 'Кон. тяги' : 'Конец тяги'} ${pts[boIdx].y.toFixed(1)}м`;
        clab(ctx, boTxt, bx + (close ? 12 : 6), by - 8, 'left', false, fs, pad, cw);

        // Апогей
        const pulse = 6 + Math.sin(now / 350) * 2.2;
        ctx.fillStyle = 'rgba(76,175,80,0.25)'; ctx.beginPath(); ctx.arc(ax, ay, pulse + 4, 0, Math.PI * 2); ctx.fill();
        marker(ctx, ax, ay, 6, '#2e7d32');
        clab(ctx, `Апогей ${pts[apIdx].y.toFixed(1)}м`, ax, ay - 14, 'center', true, fs, pad, cw);
      }

      // play rocket
      if (st.playing) {
        const pe = (now - playStart.current) / 1000;
        const ptt = Math.min(pe, maxT);
        let lo = 0, hi = pts.length - 1;
        while (lo < hi) { const mid = (lo + hi) >> 1; pts[mid].t < ptt ? (lo = mid + 1) : (hi = mid); }
        const p = pts[lo], pPrev = pts[Math.max(0, lo - 1)];
        const ang = Math.atan2(yOf(p.y) - yOf(pPrev.y), xOf(p.t) - xOf(pPrev.t) || 0.001);
        drawRocket(ctx, xOf(p.t), yOf(p.y), ang);
        st.onPlayTick && st.onPlayTick({ t: p.t, h: p.y, v: Math.abs(p.vel) });
        if (pe >= maxT) { st.onPlayEnd && st.onPlayEnd(); }
      }

      // hover
      const hv = hoverRef.current;
      if (hv != null && progress > 0.98 && !st.playing) {
        const p = pts[hv.i]; const hx = xOf(p.t), hy = yOf(p.y);
        if (hx >= pad.l && hx <= pad.l + cw) {
          ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
          ctx.beginPath(); ctx.moveTo(hx, pad.t); ctx.lineTo(hx, pad.t + ch); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = '#fff'; ctx.strokeStyle = '#2e7d32'; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.arc(hx, hy, hv.snap ? 7 : 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
      }

      // flags (kept inside plot area)
      const topY = pad.t + 1;
      const FW = 18, FH = 12;
      const drawFlag = (fx, fy, color, letter, preview, showX) => {
        ctx.globalAlpha = preview ? 0.5 : 1;
        // pole
        ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, topY + FH); ctx.stroke(); ctx.setLineDash([]);
        // pennant (rounded rect)
        ctx.globalAlpha = preview ? 0.5 : 0.9;
        ctx.fillStyle = color;
        roundRect(ctx, fx, topY, FW, FH, 2); ctx.fill();
        ctx.globalAlpha = preview ? 0.6 : 1;
        if (letter) { ctx.fillStyle = '#fff'; ctx.font = '700 9px var(--font-body, sans-serif)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(letter, fx + FW / 2, topY + FH / 2 + 0.5); ctx.textBaseline = 'alphabetic'; }
        // curve point
        ctx.fillStyle = '#fff'; ctx.strokeStyle = color; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(fx, fy, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        // delete X on hover
        if (showX) {
          const cxx = fx + FW, cyy = topY;
          ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(cxx, cyy, 6, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(cxx - 2.5, cyy - 2.5); ctx.lineTo(cxx + 2.5, cyy + 2.5);
          ctx.moveTo(cxx + 2.5, cyy - 2.5); ctx.lineTo(cxx - 2.5, cyy + 2.5); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      };
      if (st.flags) for (const f of st.flags) drawFlag(xOf(pts[f.idx].t), yOf(pts[f.idx].y), f.color, f.letter, false, hoverFlagRef.current === f.idx);
      // preview flag while popup open
      if (st.pendingT != null) {
        let lo = 0, hi = pts.length - 1;
        while (lo < hi) { const mid = (lo + hi) >> 1; pts[mid].t < st.pendingT ? (lo = mid + 1) : (hi = mid); }
        drawFlag(xOf(st.pendingT), yOf(pts[lo].y), st.pendingColor || '#888', st.pendingLetter, true, false);
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [result]);

  const onMove = e => {
    const g = geomRef.current; if (!g || playing) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    // flag hover (for delete X)
    let hf = null;
    for (const f of (R.current.flags || [])) {
      if (Math.abs(g.xOf(g.pts[f.idx].t) - mx) < 15) { hf = f.idx; break; }
    }
    hoverFlagRef.current = hf;
    // measurement hover with magnet to key points
    const t = ((mx - g.pad.l) / g.cw) * g.maxT;
    if (t < 0 || t > g.maxT) { hoverRef.current = null; setHover(null); return; }
    let lo = 0, hi = g.pts.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; g.pts[mid].t < t ? (lo = mid + 1) : (hi = mid); }
    let idx = lo, snap = false;
    for (const k of [0, g.boIdx, g.apIdx]) {
      const dx = g.xOf(g.pts[k].t) - mx, dy = g.yOf(g.pts[k].y) - my;
      if (dx * dx + dy * dy < 900) { idx = k; snap = true; break; }
    }
    hoverRef.current = { i: idx, snap };
    const p = g.pts[idx];
    setHover({ i: idx, px: g.xOf(p.t), py: g.yOf(p.y) });
  };
  const onLeave = () => { hoverRef.current = null; hoverFlagRef.current = null; setHover(null); };
  const onClick = e => {
    if (!flagMode) return;
    const g = geomRef.current; if (!g) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left, py = e.clientY - rect.top;
    // remove if near existing flag
    for (const f of R.current.flags) {
      if (Math.abs(g.xOf(g.pts[f.idx].t) - px) < 15) { onRemoveFlag && onRemoveFlag(f.idx); setPending(null); return; }
    }
    if (R.current.flags.length >= 4) return;
    const t = Math.min(Math.max(((px - g.pad.l) / g.cw) * g.maxT, 0), g.maxT);
    setDraft(t.toFixed(2));
    setPending({ px, py, defT: t });
  };
  const confirmFlag = () => {
    const g = geomRef.current; if (!g || pendingT == null) { setPending(null); return; }
    let lo = 0, hi = g.pts.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; g.pts[mid].t < pendingT ? (lo = mid + 1) : (hi = mid); }
    onAddFlag && onAddFlag(lo);
    setPending(null);
  };

  if (!result) return null;
  const hp = hover && result.points[hover.i];
  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', height: chartH, cursor: flagMode ? 'crosshair' : 'default' }}
      onMouseMove={onMove} onMouseLeave={onLeave} onClick={onClick}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      {hp && !playing && !flagMode && (
        <div style={{
          position: 'absolute',
          left: Math.min(Math.max(hover.px + 12, 8), (wrapRef.current?.offsetWidth || 300) - 96),
          top: Math.max(hover.py - 52, 6), pointerEvents: 'none', background: '#fff', borderRadius: 10,
          boxShadow: '0 6px 20px rgba(0,0,0,0.18)', padding: '8px 11px',
          fontFamily: 'var(--font-mono, monospace)', fontSize: 11.5, lineHeight: 1.55, color: '#333', whiteSpace: 'nowrap', zIndex: 3,
        }}>
          <div style={{ color: '#888' }}>t = {hp.t.toFixed(2)} с</div>
          <div>h = <b style={{ color: '#2e7d32' }}>{hp.y.toFixed(1)}</b> м</div>
        </div>
      )}
      {pending && (
        <div onClick={e => e.stopPropagation()} style={{
          position: 'absolute',
          left: Math.min(Math.max(pending.px - 90, 6), (wrapRef.current?.offsetWidth || 300) - 186),
          top: Math.min(Math.max(pending.py - 20, 6), 120),
          width: 180, background: '#fff', borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
          padding: 14, zIndex: 5, fontFamily: 'var(--font-body, sans-serif)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1f3a22', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: nextColor }} /> Поставить флаг {nextLetter}
          </div>
          <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>Время, с</label>
          <input type="number" step="0.01" autoFocus value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') confirmFlag(); if (e.key === 'Escape') setPending(null); }}
            style={{ width: '100%', boxSizing: 'border-box', padding: '6px 9px', borderRadius: 8, border: '1.5px solid #4caf50', outline: 'none', fontFamily: 'var(--font-mono, monospace)', fontSize: 13, color: '#2e7d32', fontWeight: 700, marginBottom: 12 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={e => { e.stopPropagation(); setPending(null); }} style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', color: '#666', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Отмена</button>
            <button onClick={confirmFlag} style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', background: '#4caf50', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>✓ OK</button>
          </div>
        </div>
      )}
    </div>
  );
}

function roundRect(ctx, x, y, w, h, r) {
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); return; }
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function drawRocket(ctx, x, y, ang) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.fillStyle = '#2e7d32';
  ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-4, -4); ctx.lineTo(-2, 0); ctx.lineTo(-4, 4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ff7a1a';
  ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(-8, -2); ctx.lineTo(-8, 2); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function marker(ctx, x, y, r, color) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
}
function clab(ctx, text, x, y, align, bold, fs, pad, cw) {
  ctx.fillStyle = '#1a2e1c';
  ctx.font = `${bold ? 700 : 600} ${fs}px var(--font-body, sans-serif)`;
  ctx.textAlign = align;
  const w = ctx.measureText(text).width;
  const left = pad.l + 2, right = pad.l + cw - 2;
  if (align === 'left') x = Math.min(Math.max(x, left), Math.max(left, right - w));
  else if (align === 'center') x = Math.min(Math.max(x, left + w / 2), Math.max(left + w / 2, right - w / 2));
  else x = Math.min(Math.max(x, left + w), right);
  ctx.fillText(text, x, y);
}
