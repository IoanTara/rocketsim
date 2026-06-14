import React, { useEffect, useRef } from 'react';

// 3-segment energy balance donut, animated reveal.
export default function EnergyPie({ segments }) {
  // segments: [{ value, color }]
  const ref = useRef(null);
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const S = 100;
    canvas.width = S * dpr; canvas.height = S * dpr;
    ctx.scale(dpr, dpr);
    const cx = S / 2, cy = S / 2, r = 38, rin = 22;
    const start = performance.now();
    let raf;
    const draw = now => {
      const p = Math.min((now - start) / 900, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      ctx.clearRect(0, 0, S, S);
      let a0 = -Math.PI / 2;
      const sweepTotal = Math.PI * 2 * eased;
      let drawn = 0;
      for (const seg of segments) {
        const frac = seg.value / total;
        const a1 = a0 + Math.PI * 2 * frac;
        // clip by overall sweep
        const segStart = a0, segEnd = Math.min(a1, -Math.PI / 2 + sweepTotal);
        if (segEnd > segStart) {
          ctx.beginPath();
          ctx.arc(cx, cy, r, segStart, segEnd);
          ctx.arc(cx, cy, rin, segEnd, segStart, true);
          ctx.closePath();
          ctx.fillStyle = seg.color;
          ctx.fill();
        }
        a0 = a1; drawn += frac;
      }
      if (p < 1) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [segments.map(s => s.value).join(',')]);

  return <canvas ref={ref} style={{ width: 100, height: 100, display: 'block' }} />;
}
