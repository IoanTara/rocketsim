import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store/useStore.js';
import { simulate } from '../../physics/simulator.js';
import PageLabel from '../../components/PageLabel/index.jsx';

const GOLD = '#ffd700';
const GREEN = '#4caf50';
const EASE = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
const F = 'var(--font-body)';
const MONO = 'var(--font-mono, monospace)';
const BG = '#050810';

const dateTime = (ts) => {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
};
function plural(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}

function useIsMobile() {
  const [m, setM] = useState(typeof window !== 'undefined' && window.innerWidth <= 768);
  useEffect(() => {
    const f = () => setM(window.innerWidth <= 768);
    window.addEventListener('resize', f, { passive: true });
    return () => window.removeEventListener('resize', f);
  }, []);
  return m;
}

export default function History() {
  const { history, deleteFromHistory, setScreen, setResult, setParams } = useStore();
  const mobile = useIsMobile();

  const runs = [...history].sort((a, b) => a.id - b.id);
  const baseMaxY = runs.reduce((m, r) => Math.max(m, r.result.maxHeight), 0) || 1;
  const maxT = runs.reduce((m, r) => Math.max(m, r.result.totalTime || (r.result.points.at(-1)?.t ?? 0)), 0) || 1;
  const recordId = runs.reduce((b, r) => (r.result.maxHeight > (b?.result.maxHeight ?? -1) ? r : b), null)?.id ?? null;

  const ZOOM_STEPS = [0.5, 0.75, 1, 1.5, 2, 3, 4];
  const [selectedId, setSelectedId] = useState(null);
  const [zoomIdx, setZoomIdx] = useState(2); // 1×
  const [flashUntil, setFlashUntil] = useState(0);
  const cardRefs = useRef({});
  const scrollerRef = useRef(null);

  const yZoom = ZOOM_STEPS[zoomIdx];
  const atMax = zoomIdx === ZOOM_STEPS.length - 1;
  const atMin = zoomIdx === 0;
  const changeZoom = (dir) => {
    setZoomIdx(i => Math.max(0, Math.min(ZOOM_STEPS.length - 1, i + dir)));
    setFlashUntil(performance.now() + 300);
  };
  const fmtZoom = (z) => (Number.isInteger(z) ? z : z).toString() + '×';

  useEffect(() => {
    if (selectedId == null) return;
    const el = cardRefs.current[selectedId];
    if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [selectedId]);

  const openRun = (item) => {
    try {
      const res = simulate(item.params);
      setParams(item.params);
      setResult(res);
    } catch {
      setResult({
        maxHeight: item.result.maxHeight, vmax: item.result.vmax, burnTime: item.result.burnTime,
        totalTime: item.result.totalTime, points: item.result.points, phases: [],
        apogeeIdx: item.result.points.length - 1, burnEndIdx: 0, airEndIdx: 0, dryMass: item.params.dryMass / 1000,
      });
    }
    setScreen('results');
  };

  return (
    <div style={root}>
      <StarField />
      <div style={{ ...horizonFog, height: mobile ? '55vh' : '58vh' }} />
      <PageLabel icon="history" text="История" dark />

      {/* ───── TOP: CHART ───── */}
      <div style={{ ...topBlock, height: mobile ? '55vh' : '58vh' }}>
        {runs.length > 0 && (
          <>
            <Chart runs={runs} baseMaxY={baseMaxY} maxT={maxT} yZoom={yZoom} flashUntil={flashUntil} recordId={recordId}
              selectedId={selectedId} onSelect={setSelectedId} />
            <ZoomControls label={fmtZoom(yZoom)} atMin={atMin} atMax={atMax}
              onPlus={() => changeZoom(1)} onMinus={() => changeZoom(-1)} />
          </>
        )}
      </div>

      {/* ───── BOTTOM: CARDS ───── */}
      <div style={{ ...bottomBlock, height: mobile ? '45vh' : '42vh' }}>
        <div style={headerLine}>
          история полётов{runs.length > 0 ? ` · ${runs.length} ${plural(runs.length, 'запуск', 'запуска', 'запусков')}` : ''}
        </div>

        {runs.length === 0 ? (
          <Empty onParams={() => setScreen('params')} />
        ) : (
          <Scroller ref={scrollerRef}>
            {runs.map((r, i) => (
              <div key={r.id} ref={el => (cardRefs.current[r.id] = el)}
                style={{ animation: `cardIn 0.5s ${EASE} both`, animationDelay: `${i * 60}ms`, flexShrink: 0 }}>
                <div className="gc-float" style={{ animationDuration: `${4.5 + (i % 4) * 0.7}s`, animationDelay: `${(i % 5) * 0.4}s` }}>
                  <GlassCard
                    run={r} num={i + 1} width={mobile ? 140 : 160}
                    record={r.id === recordId}
                    active={r.id === selectedId}
                    onOpen={() => { setSelectedId(r.id); openRun(r); }}
                    onDelete={() => { if (confirm('Удалить этот запуск?')) { deleteFromHistory(r.id); if (selectedId === r.id) setSelectedId(null); } }}
                  />
                </div>
              </div>
            ))}
          </Scroller>
        )}
      </div>

      <style>{`
        .hist-scroller::-webkit-scrollbar { display: none; }
        .hist-scroller { scrollbar-width: none; -ms-overflow-style: none; }
        @keyframes cardIn { from { opacity: 0; transform: translateY(16px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes floatBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes sheen { 0% { left: -60%; } 60%,100% { left: 130%; } }

        .gc-float { animation: floatBob 5s ease-in-out infinite; }

        .glass-card {
          position: relative; overflow: hidden;
          transition: transform 0.32s ${EASE}, background 0.3s ${EASE}, border-color 0.3s ${EASE}, box-shadow 0.3s ${EASE};
        }
        .glass-card:hover { transform: translateY(-6px) scale(1.025); }
        .glass-card::before {
          content: ''; position: absolute; top: 0; bottom: 0; left: -60%; width: 45%;
          background: linear-gradient(100deg, transparent, rgba(255,255,255,0.10), transparent);
          transform: skewX(-18deg); pointer-events: none; opacity: 0;
        }
        .glass-card:hover::before { opacity: 1; animation: sheen 0.9s ${EASE}; }

        .glass-card .gc-del { opacity: 0; transition: opacity 0.18s; }
        .glass-card:hover .gc-del { opacity: 1; }

        .gc-open { display: inline-flex; align-items: center; gap: 5px; color: rgba(255,255,255,0.25); font-size: 10px; letter-spacing: 1px; transition: color 0.25s ${EASE}, transform 0.25s ${EASE}; }
        .glass-card:hover .gc-open { color: rgba(255,255,255,0.6); transform: translateX(3px); }
        .gc-open .gc-arrow { transition: transform 0.25s ${EASE}; }
        .glass-card:hover .gc-open .gc-arrow { transform: translateX(2px); }

        .gc-num { transition: text-shadow 0.3s ${EASE}; }
        .glass-card:hover .gc-num { text-shadow: 0 0 18px rgba(255,255,255,0.25); }

        /* ---- zoom controls ---- */
        .zoom-ctrl { position: absolute; display: flex; flex-direction: column; align-items: center; gap: 4px; z-index: 4; }
        .zoom-btn {
          width: 36px; height: 36px; background: rgba(255,255,255,0.07);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.12); border-radius: 10px;
          color: rgba(255,255,255,0.6); font-size: 20px; font-weight: 200; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s ${EASE}; user-select: none; position: relative; overflow: hidden;
        }
        .zoom-btn:hover { background: rgba(255,255,255,0.14); border-color: rgba(255,255,255,0.22); color: rgba(255,255,255,0.95); transform: scale(1.05); box-shadow: 0 0 12px rgba(255,255,255,0.08); }
        .zoom-btn:active { transform: scale(0.92); background: rgba(255,255,255,0.18); border-color: rgba(255,255,255,0.3); transition-duration: 0.1s; }
        .zoom-btn.zb-dis { opacity: 0.35; cursor: not-allowed; }
        .zoom-btn.zb-dis:hover { transform: none; background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.12); color: rgba(255,255,255,0.6); box-shadow: none; }
        .zoom-btn.zb-shake { animation: zbShake 0.3s ${EASE}; }
        @keyframes zbShake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-3px); } 75% { transform: translateX(3px); } }

        .zb-ripple { position: absolute; width: 16px; height: 16px; margin: -8px 0 0 -8px; border-radius: 50%; background: rgba(255,255,255,0.2); pointer-events: none; animation: zbRipple 0.4s ${EASE} forwards; }
        @keyframes zbRipple { from { transform: scale(0); opacity: 0.6; } to { transform: scale(4); opacity: 0; } }

        .zb-tip { position: absolute; right: calc(100% + 8px); top: 50%; transform: translateY(-50%) translateX(4px);
          background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: rgba(255,255,255,0.8);
          font-size: 10px; padding: 4px 8px; white-space: nowrap; pointer-events: none;
          opacity: 0; transition: opacity 0.2s, transform 0.2s; transition-delay: 0s; }
        .zoom-btn:hover .zb-tip { opacity: 1; transform: translateY(-50%) translateX(0); transition-delay: 0.5s; }

        .zoom-label { color: rgba(255,255,255,0.25); font-size: 9px; letter-spacing: 1px; text-align: center; padding: 2px 0; font-family: ${MONO}; overflow: hidden; }
        .zoom-label > span { display: inline-block; animation: zlFlip 0.22s ${EASE}; }
        @keyframes zlFlip { 0% { transform: translateY(-8px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        @media (max-width: 768px) { .zoom-btn { width: 40px; height: 40px; font-size: 22px; } }

        /* ---- empty-state button (transparent, with effects) ---- */
        .hist-empty-btn { position: relative; overflow: hidden; transition: transform 0.22s ${EASE}, background 0.25s ${EASE}, border-color 0.25s ${EASE}, box-shadow 0.25s ${EASE}, letter-spacing 0.25s ${EASE}; }
        .hist-empty-btn:hover { transform: translateY(-2px); background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.85); box-shadow: 0 8px 24px rgba(0,0,0,0.35), 0 0 16px rgba(255,255,255,0.08); letter-spacing: 0.5px; }
        .hist-empty-btn:active { transform: translateY(0) scale(0.97); transition-duration: 0.1s; }
        .hist-empty-btn::before { content: ''; position: absolute; top: 0; bottom: 0; left: -60%; width: 45%; background: linear-gradient(100deg, transparent, rgba(255,255,255,0.18), transparent); transform: skewX(-18deg); opacity: 0; pointer-events: none; }
        .hist-empty-btn:hover::before { opacity: 1; animation: sheen 0.9s ${EASE}; }
      `}</style>
    </div>
  );
}

/* ───────────────────────── STARFIELD (full-screen, z0) ───────────────────────── */
function StarField() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    let raf;
    let W = 0, H = 0;

    const rng = (n) => ((Math.sin(n * 99.13) * 43758.5453) % 1 + 1) % 1;
    const makeStars = () => {
      const arr = [];
      const push = (count, rMin, rMax, aMin, aMax, spdMin, spdMax, off) => {
        for (let i = 0; i < count; i++) {
          const j = off + i;
          arr.push({
            x: rng(j + 1), y: rng(j + 7),
            r: rMin + rng(j + 13) * (rMax - rMin),
            a: aMin + rng(j + 17) * (aMax - aMin),
            spd: spdMin + rng(j + 23) * (spdMax - spdMin),
            ph: rng(j + 29) * 6.28, flare: 0,
          });
        }
      };
      push(300, 0.2, 0.8, 0.2, 0.5, 0.3, 0.8, 0);     // small slow
      push(150, 0.8, 1.5, 0.4, 0.8, 0.8, 1.6, 1000);  // medium
      push(50, 1.5, 2.5, 0.6, 1.0, 1.6, 3.0, 2000);   // bright fast
      return arr;
    };
    let stars = makeStars();

    const shooting = [];
    let nextShoot = performance.now() + 3000 + Math.random() * 5000;

    const resize = () => {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = (now) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);

      for (const s of stars) {
        if (s.flare > 0) s.flare = Math.max(0, s.flare - 0.05);
        else if (Math.random() < 0.001) s.flare = 1;
        const tw = 0.5 + 0.5 * Math.sin(now / 1000 * s.spd + s.ph);
        const a = Math.min(1, s.a * (0.4 + 0.6 * tw) + s.flare * 0.6);
        ctx.globalAlpha = a;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r + s.flare * 0.8, 0, 6.28); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // shooting stars
      if (now >= nextShoot) {
        const spawn = () => {
          const ang = (20 + Math.random() * 20) * Math.PI / 180; // 20-40°
          shooting.push({
            x: 0.4 * W + Math.random() * 0.6 * W, y: Math.random() * H * 0.4,
            len: 80 + Math.random() * 70, dur: 500 + Math.random() * 300,
            dx: -Math.cos(ang), dy: Math.sin(ang), born: now,
          });
        };
        spawn();
        if (Math.random() < 0.2) spawn();
        nextShoot = now + 8000 + Math.random() * 12000; // 8-20s
      }
      for (let i = shooting.length - 1; i >= 0; i--) {
        const s = shooting[i];
        const p = (now - s.born) / s.dur;
        if (p >= 1) { shooting.splice(i, 1); continue; }
        const fade = Math.sin(p * Math.PI);
        const hx = s.x + s.dx * s.len * 1.4 * p, hy = s.y + s.dy * s.len * 1.4 * p;
        const tx = hx - s.dx * s.len, ty = hy - s.dy * s.len;
        const g = ctx.createLinearGradient(tx, ty, hx, hy);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(255,255,255,${0.9 * fade})`);
        ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0 }} />;
}

/* ───────────────────────── CHART (launch curves) ───────────────────────── */
function Chart({ runs, baseMaxY, maxT, yZoom, flashUntil, recordId, selectedId, onSelect }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const mouseRef = useRef({ x: -1, y: -1 });
  const linesRef = useRef([]);
  const alphaRef = useRef({});
  const startRef = useRef(performance.now());
  const stateRef = useRef({});
  stateRef.current = { runs, baseMaxY, maxT, yZoom, flashUntil, recordId, selectedId };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    let raf;
    const pad = { t: 40, r: 26, b: 30, l: 52 };

    const resize = () => {
      const w = wrapRef.current.clientWidth, h = wrapRef.current.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = (now) => {
      const W = canvas.width / dpr, H = canvas.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const { runs, baseMaxY, maxT, yZoom, flashUntil, recordId, selectedId } = stateRef.current;
      const axisCol = now < flashUntil ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)';
      const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;
      const yMax = baseMaxY / yZoom * 1.1;
      const xOf = (t) => pad.l + (t / maxT) * cw;
      const yOf = (y) => pad.t + ch - (y / yMax) * ch;
      const elapsed = now - startRef.current;
      const prog = Math.min(elapsed / 1000, 1);

      // grid Y
      ctx.font = `10px ${MONO}`; ctx.textBaseline = 'middle';
      for (let i = 0; i <= 4; i++) {
        const yv = (yMax / 1.1) * (i / 4);
        const py = yOf(yv);
        ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.moveTo(pad.l, py); ctx.lineTo(pad.l + cw, py); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.textAlign = 'right';
        ctx.fillText(yv.toFixed(0), pad.l - 8, py);
      }
      // axes
      ctx.strokeStyle = axisCol; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + ch); ctx.lineTo(pad.l + cw, pad.t + ch); ctx.stroke();
      // x labels
      ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = 'rgba(255,255,255,0.25)';
      for (let i = 0; i <= 4; i++) {
        const tv = maxT * (i / 4);
        ctx.fillText(tv.toFixed(1) + 'с', xOf(tv), pad.t + ch + 8);
      }
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('м', pad.l - 36, pad.t - 14);

      // build line geometry + hover detection
      const mouse = mouseRef.current;
      const lines = [];
      let hoverIdx = -1, hoverDist = 8;
      for (let i = 0; i < runs.length; i++) {
        const pts = runs[i].result.points;
        const apIdx = pts.reduce((bi, p, k) => (p.y > pts[bi].y ? k : bi), 0);
        const screen = pts.map(p => ({ x: xOf(p.t), y: yOf(p.y) }));
        lines.push({ run: runs[i], i, screen, apex: screen[apIdx], apY: pts[apIdx].y });
        if (mouse.x >= 0) {
          for (let k = 0; k < screen.length - 1; k++) {
            const d = distToSeg(mouse, screen[k], screen[k + 1]);
            if (d < hoverDist) { hoverDist = d; hoverIdx = i; }
          }
        }
      }
      linesRef.current = lines;
      wrapRef.current.style.cursor = hoverIdx >= 0 ? 'pointer' : 'default';

      ctx.save();
      ctx.beginPath(); ctx.rect(pad.l, pad.t, cw, ch); ctx.clip();
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      for (const ln of lines) {
        const isRec = ln.run.id === recordId;
        const isSel = ln.run.id === selectedId;
        const isHover = ln.i === hoverIdx;
        let target = 1;
        if (selectedId != null && !isSel) target = 0.2;
        const cur = alphaRef.current[ln.run.id] ?? target;
        const eased = cur + (target - cur) * 0.18;
        alphaRef.current[ln.run.id] = eased;

        let col, lw, glow, glowC;
        if (isSel) { col = 'rgba(76,175,80,0.9)'; lw = 2.5; glow = 12; glowC = 'rgba(76,175,80,0.5)'; }
        else if (isRec) { col = 'rgba(255,215,0,0.8)'; lw = 2; glow = 10; glowC = 'rgba(255,215,0,0.4)'; }
        else { col = 'rgba(200,210,225,0.5)'; lw = 1.5; glow = 4; glowC = 'rgba(200,210,225,0.3)'; }
        if (isHover && !isSel) { lw += 0.8; glow += 4; col = col.replace(/0\.\d+\)$/, '0.95)'); }

        ctx.globalAlpha = eased;
        ctx.shadowBlur = glow; ctx.shadowColor = glowC;
        ctx.strokeStyle = col; ctx.lineWidth = lw;
        const lim = Math.max(2, Math.floor(ln.screen.length * prog));
        ctx.beginPath();
        for (let k = 0; k < lim; k++) {
          const s = ln.screen[k];
          k === 0 ? ctx.moveTo(s.x, s.y) : ctx.lineTo(s.x, s.y);
        }
        ctx.stroke();

        // apogee marker
        if (prog >= 0.99) {
          const r = isHover ? 6 : 3;
          ctx.shadowBlur = glow; ctx.fillStyle = col;
          ctx.beginPath(); ctx.arc(ln.apex.x, ln.apex.y, r, 0, 6.28); ctx.fill();
          if (isHover) {
            ctx.shadowBlur = 0; ctx.globalAlpha = 1;
            ctx.fillStyle = '#fff'; ctx.font = `600 11px ${F}`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
            ctx.fillText(`${ln.apY.toFixed(1)} м`, ln.apex.x, ln.apex.y - 9);
          }
        }
      }
      ctx.restore();
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  const onMove = (e) => { const r = wrapRef.current.getBoundingClientRect(); mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const onLeave = () => { mouseRef.current = { x: -1, y: -1 }; };
  const onClick = () => {
    const mouse = mouseRef.current;
    for (const ln of linesRef.current) {
      for (let k = 0; k < ln.screen.length - 1; k++) {
        if (distToSeg(mouse, ln.screen[k], ln.screen[k + 1]) < 8) {
          onSelect(ln.run.id === stateRef.current.selectedId ? null : ln.run.id);
          return;
        }
      }
    }
    onSelect(null); // empty click clears
  };

  return (
    <div ref={wrapRef} style={{ position: 'absolute', inset: 0 }} onMouseMove={onMove} onMouseLeave={onLeave} onClick={onClick}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
}

function distToSeg(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/* ───────────────────────── SCROLLER (drag + wheel) ───────────────────────── */
const Scroller = React.forwardRef(function Scroller({ children }, ref) {
  const localRef = useRef(null);
  const el = ref || localRef;
  const drag = useRef({ active: false, x: 0, left: 0, moved: false });

  useEffect(() => {
    const node = el.current;
    if (!node) return;
    const onWheel = (e) => { if (e.deltaY !== 0) { node.scrollLeft += e.deltaY; e.preventDefault(); } };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, [el]);

  const onDown = (e) => { drag.current = { active: true, x: e.clientX, left: el.current.scrollLeft, moved: false }; };
  const onMove = (e) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.x;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    el.current.scrollLeft = drag.current.left - dx;
  };
  const onUp = () => { drag.current.active = false; };
  // expose moved flag via dataset so cards can suppress click after drag
  const onClickCapture = (e) => { if (drag.current.moved) { e.stopPropagation(); e.preventDefault(); drag.current.moved = false; } };

  return (
    <div ref={el} className="hist-scroller" style={scrollerStyle}
      onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp} onClickCapture={onClickCapture}>
      {children}
    </div>
  );
});

/* ───────────────────────── GLASS CARD ───────────────────────── */
function GlassCard({ run, num, width = 160, record, active, onOpen, onDelete }) {
  const { result } = run;
  const heightColor = active ? 'rgba(76,175,80,0.95)' : (record ? 'rgba(255,215,0,0.9)' : 'rgba(255,255,255,0.92)');
  const glow = active ? '0 0 14px rgba(76,175,80,0.5)' : (record ? '0 0 14px rgba(255,215,0,0.4)' : 'none');
  const border = active ? '1px solid rgba(76,175,80,0.45)' : (record ? '1px solid rgba(255,215,0,0.3)' : '1px solid rgba(255,255,255,0.1)');
  const shadow = active
    ? '0 0 24px rgba(76,175,80,0.12), inset 0 1px 0 rgba(255,255,255,0.08)'
    : (record ? '0 0 20px rgba(255,215,0,0.08), inset 0 1px 0 rgba(255,255,255,0.08)' : 'inset 0 1px 0 rgba(255,255,255,0.06)');
  return (
    <div className="glass-card" onClick={onOpen} style={{
      width, boxSizing: 'border-box', cursor: 'pointer',
      background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px) saturate(140%)', WebkitBackdropFilter: 'blur(20px) saturate(140%)',
      border, borderRadius: 16, padding: '14px 16px 12px', fontFamily: F, boxShadow: shadow,
    }}>
      <button className="gc-del" onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Удалить" style={{
        position: 'absolute', top: 9, right: 10, background: 'none', border: 'none',
        color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: 11, lineHeight: 1, padding: 2, zIndex: 2,
      }}>×</button>

      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', fontWeight: 400, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
        #{num}  ·  {dateTime(run.id)}
      </div>

      {record && (
        <div style={{ fontSize: 8, color: 'rgba(255,215,0,0.45)', letterSpacing: 3, textTransform: 'uppercase', marginTop: 12 }}>
          рекорд
        </div>
      )}

      <div style={{ marginTop: record ? 2 : 12, display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span className="gc-num" style={{ fontSize: 36, fontWeight: 200, color: heightColor, lineHeight: 1, letterSpacing: '-0.5px', textShadow: glow }}>
          {result.maxHeight.toFixed(1)}
        </span>
        <span style={{ fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.35)' }}>м</span>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '10px 0 9px' }} />

      <div style={{ fontSize: 11, fontWeight: 300, color: 'rgba(255,255,255,0.35)' }}>
        {result.totalTime.toFixed(1)} с
      </div>

      <div className="gc-open" style={{ marginTop: 12 }}>
        <span className="gc-arrow">→</span> открыть
      </div>
    </div>
  );
}

/* ───────────────────────── ZOOM CONTROLS ───────────────────────── */
function ZoomControls({ label, atMin, atMax, onPlus, onMinus }) {
  return (
    <div className="zoom-ctrl" style={{ top: 52, right: 40 }}>
      <ZoomBtn sym="+" disabled={atMax} onAct={onPlus} tip="Увеличить масштаб" />
      <div className="zoom-label"><span key={label}>{label}</span></div>
      <ZoomBtn sym="−" disabled={atMin} onAct={onMinus} tip="Уменьшить масштаб" />
    </div>
  );
}
function ZoomBtn({ sym, disabled, onAct, tip }) {
  const [ripples, setRipples] = useState([]);
  const [shake, setShake] = useState(false);
  const ref = useRef(null);
  const onDown = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const id = Date.now() + Math.random();
    setRipples(r => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples(r => r.filter(p => p.id !== id)), 420);
  };
  const onClick = () => {
    if (disabled) { setShake(true); setTimeout(() => setShake(false), 320); return; }
    onAct();
  };
  return (
    <button ref={ref} className={`zoom-btn${disabled ? ' zb-dis' : ''}${shake ? ' zb-shake' : ''}`}
      onMouseDown={onDown} onClick={onClick}>
      {sym}
      {ripples.map(r => <span key={r.id} className="zb-ripple" style={{ left: r.x, top: r.y }} />)}
      <span className="zb-tip">{tip}</span>
    </button>
  );
}

/* ───────────────────────── EMPTY ───────────────────────── */
function Empty({ onParams }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px' }}>
      <p style={{ fontFamily: F, color: '#fff', fontSize: 15, fontWeight: 500, margin: 0 }}>Нет сохранённых запусков</p>
      <p style={{ fontFamily: F, color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 8 }}>Запусти симуляцию и сохрани результат</p>
      <button className="hist-empty-btn" onClick={onParams} style={{
        marginTop: 20, height: 42, padding: '0 28px', background: 'transparent', color: '#fff',
        border: '1px solid rgba(255,255,255,0.5)', borderRadius: 100, fontFamily: F, fontSize: 13, fontWeight: 500, cursor: 'pointer',
      }}>К параметрам</button>
    </div>
  );
}

/* ───────────────────────── styles ───────────────────────── */
const root = { position: 'relative', height: '100vh', width: '100%', overflow: 'hidden', background: BG, display: 'flex', flexDirection: 'column' };
const horizonFog = { position: 'absolute', left: 0, right: 0, top: 0, height: '58vh', zIndex: 2, pointerEvents: 'none', background: 'linear-gradient(to bottom, transparent 70%, #050810 100%)' };
const topBlock = { position: 'relative', zIndex: 1, height: '58vh' };
const bottomBlock = { position: 'relative', zIndex: 1, height: '42vh', background: 'transparent', display: 'flex', flexDirection: 'column', paddingBottom: 'calc(78px + env(safe-area-inset-bottom))', boxSizing: 'border-box' };
const headerLine = { fontFamily: F, fontSize: 10, letterSpacing: 3, color: 'rgba(255,255,255,0.18)', padding: '10px 24px 6px' };
const scrollerStyle = { display: 'flex', overflowX: 'auto', gap: 10, padding: '18px 24px 16px', scrollBehavior: 'smooth', cursor: 'grab', alignItems: 'flex-start' };
