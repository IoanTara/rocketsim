import React, { useEffect, useRef, useState } from 'react';

const PHASE_COLORS = {
  1: 'rgba(120,120,120,0.18)',
  2: 'rgba(74,158,47,0.18)',
  3: 'rgba(123,31,162,0.18)',
  4: 'rgba(255,138,0,0.18)',
  5: 'rgba(13,17,23,0.15)',
};

export default function Chart({ result, mode = 'height' }) {
  const canvasRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
    let raf, t0;
    function step(now) {
      if (!t0) t0 = now;
      const p = Math.min((now - t0) / 1500, 1);
      setProgress(p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
      if (p < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [result, mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !result) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth, H = canvas.offsetHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const pts = result.points;
    if (!pts.length) return;
    const maxT = pts[pts.length - 1].t;
    const vals = pts.map(p => mode === 'height' ? p.y : Math.abs(p.vel));
    const maxV = Math.max(...vals) * 1.05;
    const pad = { l: 44, r: 16, t: 16, b: 32 };
    const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;
    const xOf = t => pad.l + (t / maxT) * cw;
    const yOf = v => pad.t + ch - (v / maxV) * ch;

    // phase fills
    let curPhase = pts[0].phase, sx = xOf(pts[0].t);
    for (let i = 1; i < pts.length; i++) {
      if (pts[i].phase !== curPhase || i === pts.length - 1) {
        const ex = xOf(pts[i].t);
        ctx.fillStyle = PHASE_COLORS[curPhase] || 'transparent';
        ctx.fillRect(sx, pad.t, ex - sx, ch);
        curPhase = pts[i].phase;
        sx = ex;
      }
    }

    // grid
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    ctx.font = '11px monospace';
    ctx.fillStyle = '#9a9a9a';
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (ch / 4) * i;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + cw, y); ctx.stroke();
      const val = maxV - (maxV / 4) * i;
      ctx.fillText(val.toFixed(0), 6, y + 4);
    }
    for (let i = 0; i <= 4; i++) {
      const x = pad.l + (cw / 4) * i;
      ctx.fillText((maxT / 4 * i).toFixed(1) + 'с', x - 10, H - 8);
    }

    // line
    const lim = Math.floor(pts.length * progress);
    ctx.strokeStyle = mode === 'height' ? '#4a9e2f' : '#e8431a';
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < lim; i++) {
      const x = xOf(pts[i].t), y = yOf(vals[i]);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // apogee marker
    if (progress > 0.95 && mode === 'height') {
      const ap = pts[result.apogeeIdx] || pts[pts.length - 1];
      const ax = xOf(ap.t), ay = yOf(ap.y);
      ctx.fillStyle = '#4a9e2f';
      ctx.beginPath(); ctx.arc(ax, ay, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'white'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(ax, ay, 5, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 12px Georgia, serif';
      ctx.fillText('апогей ' + ap.y.toFixed(1) + 'м', ax + 10, ay - 6);
    }
  }, [result, mode, progress]);

  if (!result) return null;
  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: 240, display: 'block' }}
    />
  );
}
