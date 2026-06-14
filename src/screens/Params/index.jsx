import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../../store/useStore.js';
import { checkInputs } from '../../physics/simulator.js';
import RocketModel from '../../components/RocketModel/index.jsx';
import PageLabel from '../../components/PageLabel/index.jsx';

const FIELDS_LEFT = [
  { id: 'pressure', label: 'Давление', min: 1, max: 15, step: 0.1, unit: 'бар', widget: 'gauge' },
  { id: 'waterVol', label: 'Объём воды', min: 0.1, max: 3, step: 0.1, unit: 'л', widget: 'flask' },
  { id: 'tankVol', label: 'Объём бака', min: 0.5, max: 5, step: 0.1, unit: 'л', widget: 'cylinder' },
  { id: 'cd', label: 'Коэф. Cd', min: 0.1, max: 1.5, step: 0.05, unit: '', widget: 'drag' },
];
const FIELDS_RIGHT = [
  { id: 'dryMass', label: 'Сухая масса', min: 50, max: 2000, step: 10, unit: 'г', widget: 'scale' },
  { id: 'diameter', label: 'Диаметр', min: 40, max: 200, step: 1, unit: 'мм', widget: 'circle' },
  { id: 'nozzle', label: 'Сопло', min: 5, max: 30, step: 1, unit: 'мм', widget: 'flame' },
];

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const decimals = (step) => (step < 0.1 ? 2 : step < 1 ? 1 : 0);

function useIsMobile() {
  const [m, setM] = useState(typeof window !== 'undefined' && window.innerWidth <= 768);
  useEffect(() => {
    const f = () => setM(window.innerWidth <= 768);
    window.addEventListener('resize', f, { passive: true });
    return () => window.removeEventListener('resize', f);
  }, []);
  return m;
}

export default function Params() {
  const { params, setParam, setScreen } = useStore();
  const [shake, setShake] = useState(false);
  const mobile = useIsMobile();
  const chk = useMemo(() => checkInputs(params), [params]);

  const onLaunch = () => {
    if (!chk.ok) return;
    setShake(true);
    setTimeout(() => { setShake(false); setScreen('launch'); }, 380);
  };

  return (
    <div style={rootStyle}>
      <div style={bgStyle} />
      <PageLabel icon="gear" text="Параметры" />

      {mobile ? (
        <div style={contentMobile}>
          <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: shake ? 'rocketShake 0.4s ease-out' : 'none', flexShrink: 0 }}>
            <RocketModel animate />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {FIELDS_LEFT.map(f => (
              <ParamSlider key={f.id} field={f} value={params[f.id]} onChange={v => setParam(f.id, v)} mobile />
            ))}
            {FIELDS_RIGHT.map(f => (
              <ParamSlider key={f.id} field={f} value={params[f.id]} onChange={v => setParam(f.id, v)} mobile />
            ))}
            <MassCard value={params.dryMass + params.waterVol * 1000} mobile />
          </div>
        </div>
      ) : (
        <div style={contentStyle}>
          <div style={midRow}>
            <div style={colStyle}>
              {FIELDS_LEFT.map(f => (
                <ParamSlider key={f.id} field={f} value={params[f.id]} onChange={v => setParam(f.id, v)} />
              ))}
            </div>

            <div style={{ flex: '1 1 30%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
              <div style={{ width: '100%', height: '100%', maxWidth: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: shake ? 'rocketShake 0.4s ease-out' : 'none' }}>
                <RocketModel animate />
              </div>
            </div>

            <div style={colStyle}>
              {FIELDS_RIGHT.map(f => (
                <ParamSlider key={f.id} field={f} value={params[f.id]} onChange={v => setParam(f.id, v)} />
              ))}
              <MassCard value={params.dryMass + params.waterVol * 1000} />
            </div>
          </div>
        </div>
      )}

      <div style={launchWrap}>
        {!chk.ok && <div style={msgErr}>{chk.hard}</div>}
        <button
          className="launchBtn"
          onClick={onLaunch}
          disabled={!chk.ok}
          style={{ ...launchBtn, opacity: chk.ok ? 1 : 0.5, cursor: chk.ok ? 'pointer' : 'not-allowed' }}
        >
          <span style={{ position: 'relative', zIndex: 2 }}>Запустить симуляцию</span>
          <span aria-hidden style={{
            position: 'absolute',
            top: 0, left: '-100%',
            width: '100%', height: '100%',
            background: 'linear-gradient(120deg, transparent, rgba(255,255,255,0.35), transparent)',
            animation: 'btnSheen 4s ease-in-out infinite',
            zIndex: 1,
          }} />
        </button>
      </div>

      <style>{`
        .pslider { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; border-radius: 4px; outline: none; cursor: pointer; }
        .pslider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.05); cursor: pointer; transition: transform 0.12s; }
        .pslider::-webkit-slider-thumb:active { transform: scale(1.18); }
        .pslider::-moz-range-thumb { width: 18px; height: 18px; border: none; border-radius: 50%; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.3); cursor: pointer; }
        .pval { font-family: var(--font-mono, monospace); font-size: 14px; color: #2e7d32; font-weight: 700; cursor: text; border: 1.5px solid rgba(0,0,0,0.18); border-radius: 8px; padding: 2px 8px; background: rgba(255,255,255,0.45); transition: border-color 0.15s, box-shadow 0.15s; }
        .pval:hover { border-color: #4caf50; }
        .pvalinput { width: 72px; -moz-appearance: textfield; font-family: var(--font-mono, monospace); font-size: 14px; color: #2e7d32; font-weight: 700; border: 1.5px solid #4caf50; border-radius: 8px; padding: 2px 8px; text-align: right; outline: none; background: #fff; box-shadow: 0 0 0 3px rgba(76,175,80,0.18); }
        .pvalinput::-webkit-outer-spin-button, .pvalinput::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .launchBtn { animation: btnPulse 2.6s ease-in-out infinite; }
        .launchBtn:disabled { animation: none; }
        .launchBtn:hover:not(:disabled) { transform: translateY(-2px); background: #4caf50; }
        @keyframes btnPulse {
          0%, 100% { box-shadow: 0 10px 30px rgba(74,158,47,0.4), inset 0 1px 0 rgba(255,255,255,0.18), 0 0 0 0 rgba(76,175,80,0.5); }
          50% { box-shadow: 0 13px 36px rgba(74,158,47,0.52), inset 0 1px 0 rgba(255,255,255,0.18), 0 0 0 12px rgba(76,175,80,0); }
        }
        @keyframes btnSheen { 0% { left: -100%; } 60% { left: 100%; } 100% { left: 100%; } }
        @keyframes rocketShake { 0%,100%{transform:translateX(0);} 25%{transform:translateX(-5px);} 75%{transform:translateX(5px);} }
        @media (max-width: 768px) {
          .pslider { height: 6px; }
          .pslider::-webkit-slider-thumb { width: 22px; height: 22px; }
          .pslider::-moz-range-thumb { width: 22px; height: 22px; }
        }
      `}</style>
    </div>
  );
}

/* ---------- styles ---------- */
const rootStyle = { position: 'relative', height: '100vh', width: '100%', overflow: 'hidden', background: '#ede8e0' };
const bgStyle = { position: 'absolute', inset: 0, backgroundImage: 'url(/images/param_phone.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', opacity: 0.62, filter: 'blur(1px)', zIndex: 0 };
const contentStyle = { position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', padding: '52px clamp(10px, 3vw, 32px) 150px', maxWidth: 1280, margin: '0 auto', boxSizing: 'border-box' };
const contentMobile = { position: 'relative', zIndex: 2, height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch', display: 'flex', flexDirection: 'column', gap: 12, padding: '52px 12px 184px', maxWidth: 540, margin: '0 auto', boxSizing: 'border-box' };
const midRow = { flex: '1 1 auto', display: 'flex', gap: 'clamp(8px, 1.5vw, 18px)', minHeight: 0, alignItems: 'stretch' };
const colStyle = { flex: '1 1 35%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 'clamp(6px, 1.2vh, 12px)', minWidth: 0 };
const launchWrap = { position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 'calc(90px + env(safe-area-inset-bottom))', zIndex: 50, width: 312, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 };
const launchBtn = { position: 'relative', overflow: 'hidden', width: 312, height: 56, color: '#fff', border: 'none', borderRadius: 100, fontSize: 14, fontWeight: 600, letterSpacing: 0.4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)', background: '#4a9e2f', boxShadow: '0 10px 30px rgba(74,158,47,0.4), inset 0 1px 0 rgba(255,255,255,0.18)', transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1), background 0.25s, box-shadow 0.25s' };
const msgErr = { color: '#c62828', background: 'rgba(255,255,255,0.88)', padding: '5px 12px', borderRadius: 10, fontSize: 12, textAlign: 'center', fontWeight: 500, boxShadow: '0 2px 10px rgba(0,0,0,0.12)' };

/* ---------- ParamSlider ---------- */
function ParamSlider({ field, value, onChange, mobile }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const pct = ((value - field.min) / (field.max - field.min)) * 100;
  const dec = decimals(field.step);

  const commit = () => {
    const n = parseFloat(draft.replace(',', '.'));
    if (!isNaN(n)) onChange(n); // no clamp — allow any number from keyboard
    setEditing(false);
  };

  return (
    <div style={mobile ? cardStyleMob : cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: mobile ? 6 : 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontSize: mobile ? 11 : 12.5, fontWeight: 600, color: '#1f3a22', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{field.label}</span>
            {editing ? (
              <input
                type="number"
                autoFocus
                value={draft}
                step={field.step}
                onChange={e => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
                className="pvalinput"
              />
            ) : (
              <span
                className="pval"
                onClick={() => { setDraft(String(Number(value).toFixed(dec))); setEditing(true); }}
              >
                {Number(value).toFixed(dec)}{field.unit && <span style={{ fontSize: 10, marginLeft: 2, color: '#7a9a7e', fontWeight: 500 }}>{field.unit}</span>}
              </span>
            )}
          </div>
          <input
            type="range"
            className="pslider"
            min={field.min} max={field.max} step={field.step}
            value={value}
            onChange={e => onChange(parseFloat(e.target.value))}
            style={{ background: `linear-gradient(to right, #4caf50 0%, #4caf50 ${pct}%, rgba(0,0,0,0.12) ${pct}%, rgba(0,0,0,0.12) 100%)` }}
          />
        </div>
        <Widget type={field.widget} value={value} min={field.min} max={field.max} size={mobile ? 36 : 56} />
      </div>
    </div>
  );
}

const cardStyle = { background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: 16, padding: '10px 12px', boxShadow: '0 2px 16px rgba(0,0,0,0.08)' };
const cardStyleMob = { ...cardStyle, borderRadius: 12, padding: '10px 12px', minWidth: 0 };

/* ---------- MassCard (auto-computed, no slider) ---------- */
function MassCard({ value, mobile }) {
  return (
    <div style={mobile ? { ...cardStyleMob, background: 'rgba(245,247,243,0.82)' } : cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: mobile ? 6 : 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, gap: 6 }}>
            <span style={{ fontSize: mobile ? 11 : 12.5, fontWeight: 600, color: '#1f3a22' }}>Общая масса</span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 14, color: '#4caf50', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {Math.round(value)}<span style={{ fontSize: 10, marginLeft: 2, color: '#7a9a7e', fontWeight: 500 }}>г</span>
            </span>
          </div>
          <div style={{ fontSize: 10.5, color: '#7a9a7e' }}>{mobile ? 'авто' : 'рассчитывается автоматически'}</div>
        </div>
        <Widget type="weight" value={value} min={50} max={5000} size={mobile ? 36 : 56} />
      </div>
    </div>
  );
}

/* ---------- Animated canvas widgets ---------- */
function Widget({ type, value, min, max, size = 56 }) {
  const ref = useRef(null);
  const valRef = useRef({ value, min, max });
  valRef.current = { value, min, max };

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const SIZE = size;
    canvas.width = SIZE * dpr; canvas.height = SIZE * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    let raf;
    const draw = () => {
      const { value: v, min: lo, max: hi } = valRef.current;
      const f = clamp((v - lo) / (hi - lo), 0, 1);
      const t = Date.now() / 1000;
      ctx.clearRect(0, 0, SIZE, SIZE);
      DRAW[type] && DRAW[type](ctx, SIZE, f, t, v);
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [type, size]);

  return <canvas ref={ref} style={{ width: size, height: size, flex: `0 0 ${size}px` }} />;
}

const lerpColor = (f) => {
  // green -> yellow -> red
  const stops = f < 0.5
    ? [[76, 175, 80], [255, 200, 40], f * 2]
    : [[255, 200, 40], [229, 57, 53], (f - 0.5) * 2];
  const [a, b, k] = stops;
  const c = a.map((x, i) => Math.round(x + (b[i] - x) * k));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

const DRAW = {
  // МАНОМЕТР
  gauge(ctx, S, f, t) {
    const cx = S / 2, cy = S * 0.6, r = S * 0.36;
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, 0); ctx.stroke();
    // ticks
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
    for (let i = 0; i <= 6; i++) {
      const a = Math.PI + (i / 6) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (r - 2), cy + Math.sin(a) * (r - 2));
      ctx.lineTo(cx + Math.cos(a) * (r - 6), cy + Math.sin(a) * (r - 6));
      ctx.stroke();
    }
    const targ = Math.PI + f * Math.PI;
    const wob = targ + Math.sin(t * 6) * 0.02;
    ctx.strokeStyle = lerpColor(f); ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(wob) * (r - 4), cy + Math.sin(wob) * (r - 4));
    ctx.stroke();
    ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, Math.PI * 2); ctx.fill();
  },
  // КОЛБА С ВОДОЙ
  flask(ctx, S, f, t) {
    const topW = S * 0.30, botW = S * 0.44, h = S * 0.62, cx = S / 2, top = S * 0.16, bot = top + h;
    ctx.strokeStyle = 'rgba(40,80,120,0.55)'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx - topW / 2, top); ctx.lineTo(cx - botW / 2, bot);
    ctx.lineTo(cx + botW / 2, bot); ctx.lineTo(cx + topW / 2, top);
    ctx.stroke();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - topW / 2, top); ctx.lineTo(cx - botW / 2, bot);
    ctx.lineTo(cx + botW / 2, bot); ctx.lineTo(cx + topW / 2, top); ctx.closePath();
    ctx.clip();
    const wl = bot - f * h;
    ctx.fillStyle = '#29b6f6';
    ctx.beginPath();
    ctx.moveTo(cx - botW, bot + 2);
    for (let x = -botW; x <= botW; x += 2) {
      const y = wl + Math.sin((x / 6) + t * 3) * 1.6;
      ctx.lineTo(cx + x, y);
    }
    ctx.lineTo(cx + botW, bot + 2); ctx.closePath(); ctx.fill();
    ctx.restore();
    // overflow drips at max
    if (f > 0.93) {
      ctx.fillStyle = '#29b6f6';
      const dy = ((t * 30) % 20);
      ctx.beginPath(); ctx.arc(cx - botW / 2 + 2, bot + dy * 0.5, 1.4, 0, Math.PI * 2); ctx.fill();
    }
  },
  // ЦИЛИНДР
  cylinder(ctx, S, f) {
    const w = S * 0.42, cx = S / 2, maxH = S * 0.62, h = Math.max(S * 0.1, f * maxH);
    const bot = S * 0.82, top = bot - h, ry = w * 0.18;
    const grad = ctx.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
    grad.addColorStop(0, '#9aa0a6'); grad.addColorStop(0.5, '#e4e7ea'); grad.addColorStop(1, '#8c9196');
    ctx.fillStyle = grad;
    ctx.fillRect(cx - w / 2, top, w, h);
    ctx.beginPath(); ctx.ellipse(cx, bot, w / 2, ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, top, w / 2, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#f0f2f4'; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1; ctx.stroke();
  },
  // ВЕСЫ
  scale(ctx, S, f) {
    const cx = S / 2, pivot = S * 0.32, beam = S * 0.34;
    const tilt = (f - 0.5) * 0.5;
    ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, pivot); ctx.lineTo(cx, S * 0.82); ctx.stroke();
    ctx.save(); ctx.translate(cx, pivot); ctx.rotate(tilt);
    ctx.strokeStyle = '#4b5563'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(-beam, 0); ctx.lineTo(beam, 0); ctx.stroke();
    [[-beam, '#4caf50'], [beam, '#9ca3af']].forEach(([x]) => {
      ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 8); ctx.stroke();
      ctx.fillStyle = 'rgba(120,130,140,0.55)';
      ctx.beginPath(); ctx.arc(x, 11, 5, 0, Math.PI); ctx.fill();
    });
    ctx.restore();
    ctx.fillStyle = '#374151'; ctx.beginPath(); ctx.arc(cx, pivot, 2.5, 0, Math.PI * 2); ctx.fill();
  },
  // КРУГ
  circle(ctx, S, f, t, v) {
    const cx = S / 2, cy = S / 2, r = S * (0.18 + f * 0.26);
    ctx.strokeStyle = '#4caf50'; ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]); ctx.lineDashOffset = -t * 6;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(76,175,80,0.12)';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2e7d32'; ctx.font = '600 9px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(Math.round(v), cx, cy);
  },
  // ОГОНЁК
  flame(ctx, S, f, t) {
    const cx = S / 2, baseY = S * 0.74;
    // nozzle
    ctx.fillStyle = '#607d8b';
    ctx.beginPath(); ctx.moveTo(cx - 5, baseY); ctx.lineTo(cx + 5, baseY); ctx.lineTo(cx + 7, baseY + 6); ctx.lineTo(cx - 7, baseY + 6); ctx.closePath(); ctx.fill();
    const flick = 1 + Math.sin(t * 14) * 0.12;
    const w = (4 + f * 9) * flick, hgt = (10 + f * 22) * flick;
    const layers = [['rgba(33,150,243,0.9)', 1], ['rgba(255,152,0,0.92)', 0.62], ['rgba(255,235,120,0.95)', 0.32]];
    layers.forEach(([col, sc]) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(cx, baseY - hgt * sc);
      ctx.quadraticCurveTo(cx + w * sc, baseY - hgt * sc * 0.4, cx, baseY + 2);
      ctx.quadraticCurveTo(cx - w * sc, baseY - hgt * sc * 0.4, cx, baseY - hgt * sc);
      ctx.fill();
    });
  },
  // ГИРЯ — round dark weight, grows with mass
  weight(ctx, S, f, t) {
    const cx = S / 2;
    const r = S * 0.16 + f * S * 0.18;
    const cy = S * 0.66 + Math.sin(t * 2) * 0.6;
    // handle ring on top
    ctx.strokeStyle = '#3a4049'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy - r - 1, Math.max(3, r * 0.42), Math.PI * 1.12, Math.PI * -0.12);
    ctx.stroke();
    // body
    const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    g.addColorStop(0, '#5b6470'); g.addColorStop(0.5, '#3a4049'); g.addColorStop(1, '#23272d');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.stroke();
    // specular highlight
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath(); ctx.ellipse(cx - r * 0.32, cy - r * 0.4, r * 0.4, r * 0.22, -0.5, 0, Math.PI * 2); ctx.fill();
  },
  // СТРЕЛКА СОПРОТИВЛЕНИЯ
  drag(ctx, S, f, t) {
    const cy = S / 2;
    ctx.strokeStyle = 'rgba(76,175,80,0.5)'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const y = cy + (i - 1) * 11;
      const off = (t * 18 + i * 12) % (S + 14) - 7;
      const bend = f * 9 * (i - 1);
      ctx.beginPath();
      ctx.moveTo(off, y);
      ctx.quadraticCurveTo(off + 8, y + bend, off + 16, y);
      ctx.stroke();
    }
    // arrowhead (resistance grows -> arrow pushed left)
    const ax = S * (0.62 - f * 0.16);
    ctx.fillStyle = lerpColor(f);
    ctx.beginPath();
    ctx.moveTo(ax + 8, cy); ctx.lineTo(ax - 4, cy - 6); ctx.lineTo(ax - 1, cy); ctx.lineTo(ax - 4, cy + 6);
    ctx.closePath(); ctx.fill();
  },
};

