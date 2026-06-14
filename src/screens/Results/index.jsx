import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../store/useStore.js';
import { simulate } from '../../physics/simulator.js';
import ResultsChart from '../../components/ResultsChart/index.jsx';
import EnergyPie from '../../components/EnergyPie/index.jsx';
import PageLabel from '../../components/PageLabel/index.jsx';

const STRIPE = { 1: '#90a4ae', 2: '#29b6f6', 3: '#ffc107', 4: '#ffb300', 5: '#9e9e9e' };

function useCountUp(target, dur = 1000) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf, t0;
    const step = now => { if (!t0) t0 = now; const p = Math.min((now - t0) / dur, 1); setV(target * (1 - Math.pow(1 - p, 4))); if (p < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, dur]);
  return v;
}

export default function Results() {
  const { lastResult, params, history, saveToHistory, setScreen } = useStore();
  const [savedAt, setSavedAt] = useState(0);
  const [highlightPhase, setHighlightPhase] = useState(null);
  // chart tools
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareId, setCompareId] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [playTick, setPlayTick] = useState(null);
  // flags
  const [flagMode, setFlagMode] = useState(false);
  const [flagIdx, setFlagIdx] = useState([]);
  // what-if
  const [wif, setWif] = useState(null);

  useEffect(() => { if (params) setWif({ pressure: params.pressure, waterVol: params.waterVol }); }, [params]);

  const vmaxC = useCountUp(lastResult ? lastResult.vmax : 0);
  const burnC = useCountUp(lastResult ? lastResult.burnTime : 0);
  const totC = useCountUp(lastResult ? lastResult.totalTime : 0);

  const wifResult = useMemo(() => {
    if (!lastResult || !wif) return lastResult;
    try { return simulate({ ...params, pressure: wif.pressure, waterVol: wif.waterVol }); } catch { return lastResult; }
  }, [params, wif, lastResult]);

  const compareResult = useMemo(() => {
    if (compareId == null) return null;
    const item = history.find(h => h.id === compareId);
    if (!item) return null;
    try { return simulate(item.params); } catch { return null; }
  }, [compareId, history]);

  if (!lastResult) {
    return (
      <div className="screen screen-light" style={{ ...rootStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={bgStyle} />
        <PageLabel icon="chart" text="Результаты" />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 2, padding: '2rem' }}>
          <div style={{ fontFamily: F, fontSize: '4rem', color: '#bbb', fontWeight: 700 }}>—</div>
          <p style={{ marginTop: 14, marginBottom: 28, color: '#2e2e2e', fontFamily: F, fontSize: '1.2rem', fontWeight: 500, maxWidth: 360 }}>
            Запустите симуляцию для получения результатов
          </p>
          <button className="empty-cta" style={emptyCta} onClick={() => setScreen('params')}>К параметрам</button>
        </div>
        <style>{`
          .empty-cta { animation: emptyPulse 2.6s ease-in-out infinite; }
          .empty-cta:hover { transform: scale(1.03); background: #4caf50; }
          @keyframes emptyPulse {
            0%, 100% { box-shadow: 0 10px 30px rgba(74,158,47,0.4), inset 0 1px 0 rgba(255,255,255,0.18), 0 0 0 0 rgba(76,175,80,0.5); }
            50% { box-shadow: 0 13px 36px rgba(74,158,47,0.52), inset 0 1px 0 rgba(255,255,255,0.18), 0 0 0 14px rgba(76,175,80,0); }
          }
        `}</style>
      </div>
    );
  }

  const onSave = () => { saveToHistory(); setSavedAt(Date.now()); setTimeout(() => setSavedAt(0), 2200); };
  const apogeeDelta = wifResult.maxHeight - lastResult.maxHeight;
  const wifChanged = Math.abs(apogeeDelta) > 0.05;

  // energy balance
  const g = 9.81;
  const up = g * lastResult.maxHeight;
  const vImp = Math.abs(lastResult.points[lastResult.points.length - 1]?.vel || 0);
  const fallKE = 0.5 * vImp * vImp;
  const drag = Math.max(0.0001, up - fallKE);
  const eTot = up + drag + fallKE;
  const ePct = [up, drag, fallKE].map(x => Math.round((x / eTot) * 100));
  const energySegs = [{ value: up, color: '#4caf50' }, { value: drag, color: '#ff9800' }, { value: fallKE, color: '#9e9e9e' }];

  // flags
  const FLAG_COLORS = ['#4caf50', '#1565c0', '#e65100', '#6a1b9a'];
  const fpts = lastResult.points;
  const sortedFlags = [...new Set(flagIdx)].sort((a, b) => fpts[a].t - fpts[b].t).slice(0, 4)
    .map((idx, i) => ({ idx, color: FLAG_COLORS[i], letter: 'ABCD'[i] }));
  const addFlag = idx => setFlagIdx(f => f.includes(idx) ? f : (f.length >= 4 ? f : [...f, idx]));
  const removeFlag = idx => setFlagIdx(f => f.filter(x => x !== idx));
  const intervals = sortedFlags.slice(0, -1).map((a, i) => {
    const b = sortedFlags[i + 1], pa = fpts[a.idx], pb = fpts[b.idx];
    return { a, b, dt: pb.t - pa.t, dh: pb.y - pa.y, dv: Math.abs(pb.vel) - Math.abs(pa.vel) };
  });

  return (
    <div className="screen screen-light results-scroll" style={rootStyle}>
      <div style={bgStyle} />
      <PageLabel icon="chart" text="Результаты" />

      <div style={contentStyle}>
        {/* MAIN NUMBER */}
        <div style={{ textAlign: 'center', padding: '24px 24px 12px' }}>
          <div style={eyebrow}>Максимальная высота</div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 14 }}>
            <Odometer value={lastResult.maxHeight} />
            <span style={{ fontFamily: F, fontSize: 28, color: '#555', fontWeight: 400 }}>метров</span>
          </div>
        </div>
        <div style={{ width: '100%', height: 2, background: '#4caf50', borderRadius: 2, marginBottom: 22 }} />

        {/* METRICS */}
        <div style={metricRow}>
          <Metric icon={<DropIcon />} label="Горение воды" value={burnC.toFixed(3)} unit="с" />
          <Metric icon={<BoltIcon />} label="Макс. скорость" value={vmaxC.toFixed(1)} unit="м/с" />
          <Metric icon={<TimerIcon />} label="Время полёта" value={totC.toFixed(2)} unit="с" />
        </div>

        {/* CHART CARD */}
        <div style={chartCard}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            {flagIdx.length > 0 && (
              <button title="Очистить флажки" onClick={() => setFlagIdx([])} style={clearBtn}><CloseIcon /></button>
            )}
            <ToolBtn active={flagMode} title="Измерить участок" onClick={() => setFlagMode(m => !m)}><FlagIcon /></ToolBtn>
            <ToolBtn active={compareOpen} title="Сравнить запуски" onClick={() => {
              if (history.length === 0) { alert('Сохрани хотя бы один запуск для сравнения'); return; }
              if (compareOpen) { setCompareOpen(false); setCompareId(null); } else setCompareOpen(true);
            }}><CompareIcon /></ToolBtn>
            <ToolBtn active={playing} title="Воспроизвести" onClick={() => { setPlayTick(null); setPlaying(p => !p); }}>
              {playing ? <StopIcon /> : <PlayIcon />}
            </ToolBtn>
          </div>

          {compareOpen && history.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <CompareDropdown history={history} value={compareId} onChange={setCompareId} />
            </div>
          )}

          <ResultsChart result={lastResult} whatIfResult={wifChanged ? wifResult : null} compareResult={compareResult} highlightPhase={highlightPhase}
            playing={playing} onPlayTick={setPlayTick} onPlayEnd={() => setPlaying(false)}
            flagMode={flagMode} flags={sortedFlags} onAddFlag={addFlag} onRemoveFlag={removeFlag} />

          {compareResult && (
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8, fontSize: 12, fontFamily: F, color: '#555' }}>
              <Legend color="#2e7d32" label="Текущий" />
              <Legend color="#1565c0" label={(history.find(h => h.id === compareId)?.date) || 'Сравнение'} />
            </div>
          )}

          {playing && (
            <div style={instrument}>
              <span>t <b>{(playTick?.t ?? 0).toFixed(2)}</b> с</span>
              <span>h <b>{(playTick?.h ?? 0).toFixed(1)}</b> м</span>
              <span>v <b>{(playTick?.v ?? 0).toFixed(1)}</b> м/с</span>
            </div>
          )}
        </div>

        {/* FLAG INTERVAL CARDS */}
        {intervals.length > 0 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 22, paddingBottom: 4 }}>
            {intervals.map((iv, i) => (
              <div key={i} style={intervalCard}>
                <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                  <span style={{ color: iv.a.color }}>{iv.a.letter}</span>
                  <span style={{ color: '#aaa', margin: '0 5px' }}>→</span>
                  <span style={{ color: iv.b.color }}>{iv.b.letter}</span>
                </div>
                <IvRow label="Δt" value={`+${iv.dt.toFixed(2)} с`} />
                <IvRow label="Δh" value={`${iv.dh >= 0 ? '+' : ''}${iv.dh.toFixed(1)} м`} arrow={iv.dh >= 0 ? 'up' : 'down'} />
                <IvRow label="Δv" value={`${iv.dv >= 0 ? '+' : ''}${iv.dv.toFixed(1)} м/с`} />
              </div>
            ))}
          </div>
        )}

        {/* WHAT-IF + ENERGY */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 26 }}>
          <div style={{ ...glassCard, flex: '2 1 360px', padding: '14px 16px' }}>
            <div style={{ ...miniTitle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Sparkle /> Что если?</span>
              {wifChanged && <button style={resetBtn} onClick={() => setWif({ pressure: params.pressure, waterVol: params.waterVol })}>Сбросить</button>}
            </div>
            {wif && <>
              <WifSlider label="Давление" value={wif.pressure} min={1} max={15} step={0.1} unit="бар" onChange={v => setWif(s => ({ ...s, pressure: v }))} />
              <WifSlider label="Вода" value={wif.waterVol} min={0.1} max={Math.min(3, params.tankVol)} step={0.1} unit="л" onChange={v => setWif(s => ({ ...s, waterVol: v }))} />
            </>}
            <div style={{ marginTop: 8, fontFamily: MONO, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#888' }}>{lastResult.maxHeight.toFixed(1)}м</span>
              <span style={{ color: '#aaa' }}>→</span>
              <span style={{ color: '#1b5e20', fontWeight: 700 }}>{wifResult.maxHeight.toFixed(1)}м</span>
              {wifChanged && (
                <span style={{ color: apogeeDelta > 0 ? '#2e7d32' : '#c0392b', fontWeight: 700 }}>
                  {apogeeDelta > 0 ? '↑ +' : '↓ '}{apogeeDelta.toFixed(1)}м
                </span>
              )}
            </div>
          </div>

          <div style={{ ...glassCard, flex: '1 1 240px', padding: '14px 16px' }}>
            <div style={miniTitle}><span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><BoltIcon small /> Энергия</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6 }}>
              <EnergyPie segments={energySegs} />
              <div style={{ fontFamily: F, fontSize: 12, lineHeight: 1.9 }}>
                <ELeg color="#4caf50" label="Подъём" pct={ePct[0]} />
                <ELeg color="#ff9800" label="Сопротивление" pct={ePct[1]} />
                <ELeg color="#9e9e9e" label="Остаток" pct={ePct[2]} />
              </div>
            </div>
          </div>
        </div>

        {/* PHASES TABLE */}
        <div style={{ marginBottom: 26 }}>
          <div style={sectionTitle}>Фазы полёта</div>
          <div style={{ ...glassCard, overflow: 'hidden' }}>
            <div style={{ ...tRow, ...tHead }}>
              <span style={tcNum}>#</span>
              <span style={{ ...tc, flex: 1.6, textAlign: 'left' }}>Фаза</span>
              <span style={tc}>Высота</span><span style={tc}>Скорость</span><span style={tc}>Время</span>
            </div>
            {lastResult.phases.map((ph, i) => {
              const active = highlightPhase === i + 1;
              return (
                <div key={i} onMouseEnter={() => setHighlightPhase(i + 1)} onMouseLeave={() => setHighlightPhase(null)}
                  style={{ ...tRow, borderLeft: `3px solid ${STRIPE[i + 1] || '#ccc'}`, background: active ? 'rgba(76,175,80,0.12)' : (i % 2 ? 'rgba(0,0,0,0.025)' : 'transparent'), transition: 'background 0.15s' }}>
                  <span style={tcNum}><span style={{ ...numCircle, background: STRIPE[i + 1] || '#ccc' }}>{i + 1}</span></span>
                  <span style={{ ...tcName, flex: 1.6 }}>{ph.name}</span>
                  <span style={tcBody}>{ph.h} м</span><span style={tcBody}>{ph.v} м/с</span><span style={tcBody}>{ph.t} с</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* BUTTONS */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', paddingBottom: 8 }}>
          <button className="rbtn-pri" style={{ ...btnPrimary, flex: 1, maxWidth: 320 }} onClick={onSave}>
            <span style={{ position: 'relative', zIndex: 2 }}>{savedAt ? 'Сохранено ✓' : 'Сохранить запуск'}</span>
            <span aria-hidden style={{ position: 'absolute', top: 0, left: '-100%', width: '100%', height: '100%', background: 'linear-gradient(120deg, transparent, rgba(255,255,255,0.35), transparent)', animation: 'btnSheen 4s ease-in-out infinite', zIndex: 1 }} />
          </button>
          <button className="rbtn-out" style={{ ...btnOutline, flex: 1, maxWidth: 320 }} onClick={() => setScreen('params')}>Новый запуск</button>
        </div>
      </div>

      <style>{`
        .results-scroll { overflow-y: auto; overflow-x: hidden; scroll-behavior: smooth; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .results-scroll::-webkit-scrollbar { display: none; }
        .wif-range { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; border-radius: 4px; outline: none; cursor: pointer; }
        .wif-range::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.3); cursor: pointer; }
        .wif-range::-moz-range-thumb { width: 16px; height: 16px; border: none; border-radius: 50%; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.3); }
        .wval { font-family: var(--font-mono, monospace); font-size: 12.5px; color: #2e7d32; font-weight: 700; cursor: text; border: 1.5px solid rgba(0,0,0,0.18); border-radius: 8px; padding: 1px 7px; background: rgba(255,255,255,0.5); transition: border-color 0.15s; }
        .wval:hover { border-color: #4caf50; }
        .wvalinput { width: 64px; -moz-appearance: textfield; font-family: var(--font-mono, monospace); font-size: 12.5px; color: #2e7d32; font-weight: 700; border: 1.5px solid #4caf50; border-radius: 8px; padding: 1px 7px; text-align: right; outline: none; background: #fff; box-shadow: 0 0 0 3px rgba(76,175,80,0.18); }
        .wvalinput::-webkit-outer-spin-button, .wvalinput::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .rbtn-pri { animation: btnPulse 2.6s ease-in-out infinite; }
        .rbtn-pri:hover { transform: translateY(-2px); background: #4caf50; }
        .rbtn-out:hover { transform: translateY(-2px); background: rgba(255,255,255,0.95); }
        @keyframes btnPulse {
          0%, 100% { box-shadow: 0 10px 30px rgba(74,158,47,0.4), inset 0 1px 0 rgba(255,255,255,0.18), 0 0 0 0 rgba(76,175,80,0.5); }
          50% { box-shadow: 0 13px 36px rgba(74,158,47,0.52), inset 0 1px 0 rgba(255,255,255,0.18), 0 0 0 12px rgba(76,175,80,0); }
        }
        @keyframes btnSheen { 0% { left: -100%; } 60% { left: 100%; } 100% { left: 100%; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .ddopt { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 10px; border-radius: 8px; font-family: var(--font-body); font-size: 13px; color: #333; cursor: pointer; }
        .ddopt:hover { background: rgba(76,175,80,0.12); color: #2e7d32; }
        .ddopt.active { background: rgba(76,175,80,0.20); color: #1b5e20; }
      `}</style>
    </div>
  );
}

/* ---------- subcomponents ---------- */
function ToolBtn({ active, title, onClick, children }) {
  return (
    <button title={title} onClick={onClick} style={{
      width: 36, height: 36, borderRadius: 10, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: active ? '#4caf50' : 'rgba(255,255,255,0.9)',
      color: active ? '#fff' : '#4a6a4c',
      border: '1px solid rgba(0,0,0,0.08)', transition: 'background 0.18s, color 0.18s',
    }}>{children}</button>
  );
}
function WifSlider({ label, value, min, max, step, unit, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const pct = ((Math.min(Math.max(value, min), max) - min) / (max - min)) * 100;
  const commit = () => {
    const n = parseFloat(draft.replace(',', '.'));
    if (!isNaN(n)) onChange(n); // no clamp — any number
    setEditing(false);
  };
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
        <span style={{ fontFamily: F, fontSize: 12, color: '#3a5a3e', fontWeight: 500 }}>{label}</span>
        {editing ? (
          <input type="number" autoFocus value={draft} step={step}
            onChange={e => setDraft(e.target.value)} onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
            className="wvalinput" />
        ) : (
          <span className="wval" onClick={() => { setDraft(String(value.toFixed(1))); setEditing(true); }}>
            {value.toFixed(1)}<span style={{ fontSize: 10, marginLeft: 2, color: '#7a9a7e', fontWeight: 500 }}>{unit}</span>
          </span>
        )}
      </div>
      <input type="range" className="wif-range" min={min} max={max} step={step} value={Math.min(Math.max(value, min), max)}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ background: `linear-gradient(to right, #4caf50 ${pct}%, rgba(0,0,0,0.12) ${pct}%)` }} />
    </div>
  );
}
function Odometer({ value }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => setMounted(true)); return () => cancelAnimationFrame(id); }, []);
  let dp = 0;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'baseline', fontFamily: F, fontWeight: 800, fontSize: 96, color: '#1a3a1a', lineHeight: 1 }}>
      {value.toFixed(1).split('').map((c, i) => {
        if (c < '0' || c > '9') return <span key={i} style={{ padding: '0 2px' }}>{c}</span>;
        const d = Number(c); const delay = dp * 0.08; dp++;
        return <Reel key={i} digit={d} mounted={mounted} delay={delay} />;
      })}
    </div>
  );
}
function Reel({ digit, mounted, delay }) {
  return (
    <span style={{ display: 'inline-block', height: '1.12em', overflow: 'hidden', verticalAlign: 'bottom' }}>
      <span style={{ display: 'flex', flexDirection: 'column', transform: `translateY(${mounted ? -digit * 1.12 : 0}em)`, transition: 'transform 1.2s cubic-bezier(0.25,0.46,0.45,0.94)', transitionDelay: `${delay}s` }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <span key={n} style={{ height: '1.12em', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</span>)}
      </span>
    </span>
  );
}
function CompareDropdown({ history, value, onChange }) {
  const [open, setOpen] = useState(false);
  const sel = history.find(h => h.id === value);
  const txt = sel ? `${sel.date} · ${sel.result.maxHeight.toFixed(1)}м` : '— выбрать запуск —';
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={ddBtn}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txt}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" {...sw} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && (
        <div style={ddList}>
          {history.map(h => {
            const active = value === h.id;
            return (
              <div key={h.id} className={`ddopt${active ? ' active' : ''}`} onClick={() => { onChange(active ? null : h.id); setOpen(false); }}>
                <span>{h.date} · {h.result.maxHeight.toFixed(1)}м</span>
                {active && <svg width="15" height="15" viewBox="0 0 24 24" {...sw}><path d="M5 12l5 5 9-11" /></svg>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Metric({ icon, label, value, unit }) {
  return (
    <div style={{ ...glassCard, ...metricCard }}>
      <div style={{ marginBottom: 7, color: '#4caf50' }}>{icon}</div>
      <div style={{ fontFamily: F, fontSize: 10.5, color: '#7a857c', fontWeight: 500, marginBottom: 5, textAlign: 'center', lineHeight: 1.2 }}>{label}</div>
      <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: '#2e7d32' }}>{value}<span style={{ fontSize: 10, color: '#7a857c', marginLeft: 3, fontWeight: 400 }}>{unit}</span></div>
    </div>
  );
}
const Legend = ({ color, label }) => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: color }} />{label}</span>;
const ELeg = ({ color, label, pct }) => <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: color }} /><span style={{ color: '#555', flex: 1 }}>{label}</span><b style={{ color: '#333', fontFamily: MONO }}>{pct}%</b></div>;
const IvRow = ({ label, value, arrow }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '2px 0' }}>
    <span style={{ fontFamily: F, fontSize: 11, color: '#999' }}>{label}</span>
    <span style={{ fontFamily: MONO, fontSize: 13, color: '#333', fontWeight: 600 }}>
      {value}{arrow === 'up' && <span style={{ color: '#2e7d32', marginLeft: 4 }}>↑</span>}{arrow === 'down' && <span style={{ color: '#c0392b', marginLeft: 4 }}>↓</span>}
    </span>
  </div>
);

/* ---------- icons ---------- */
const sw = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
function DropIcon({ small }) { const s = small ? 16 : 22; return <svg width={s} height={s} viewBox="0 0 24 24" {...sw}><path d="M12 3c3 4 5.5 7 5.5 10.2A5.5 5.5 0 0 1 12 19a5.5 5.5 0 0 1-5.5-5.8C6.5 10 9 7 12 3z" /></svg>; }
function BoltIcon({ small }) { const s = small ? 16 : 22; return <svg width={s} height={s} viewBox="0 0 24 24" {...sw}><path d="M5 14h6l-2 7L19 9h-6l2-6L5 14z" /></svg>; }
function TimerIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" {...sw}><circle cx="12" cy="13" r="8" /><path d="M12 13V8.5M12 13l3 2M9 2h6" /></svg>; }
function CompareIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" {...sw}><path d="M3 17c5-1 7-9 9-9s4 3 9 1" /><path d="M3 21c5-2 7-6 9-6s4 2 9 0" opacity="0.5" /></svg>; }
function PlayIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8z" /></svg>; }
function FlagIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" {...sw}><path d="M6 21V4M6 4h11l-2.5 3.5L17 11H6" /></svg>; }
function CloseIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" {...sw}><path d="M6 6l12 12M18 6L6 18" /></svg>; }
function StopIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="2" /></svg>; }
function Sparkle() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="#4caf50"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" /></svg>; }

/* ---------- styles ---------- */
const F = 'var(--font-body)';
const MONO = 'var(--font-mono, monospace)';
const rootStyle = { position: 'relative', height: '100vh', background: '#ede8e0' };
const bgStyle = { position: 'fixed', inset: 0, backgroundImage: 'url(/images/phon_res.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', opacity: 0.62, filter: 'blur(1px)', zIndex: 0 };
const contentStyle = { position: 'relative', zIndex: 2, maxWidth: 920, margin: '0 auto', padding: '60px clamp(16px, 4vw, 28px) 120px' };
const eyebrow = { fontFamily: F, fontSize: 13, letterSpacing: 4, textTransform: 'uppercase', color: '#888', fontWeight: 600, marginBottom: 8 };
const glassCard = { background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.08)' };
const metricRow = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 26 };
const metricCard = { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 8px' };
const chartCard = { background: 'rgba(255,255,255,0.9)', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.10)', padding: '14px 14px 10px', marginBottom: 26 };
const miniTitle = { fontFamily: F, fontSize: 13, fontWeight: 700, color: '#1f3a22', marginBottom: 4 };
const sectionTitle = { fontFamily: F, fontSize: 15, fontWeight: 700, color: '#1f3a22', marginBottom: 12, paddingLeft: 10, borderLeft: '3px solid #4caf50', lineHeight: 1.1 };
const tRow = { display: 'flex', alignItems: 'center', padding: '10px 12px' };
const tHead = { background: 'rgba(0,0,0,0.04)', borderTopLeftRadius: 16, borderTopRightRadius: 16 };
const tc = { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#999', fontFamily: F };
const tcNum = { width: 34, flex: '0 0 34px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#999', fontFamily: F };
const tcName = { flex: 1, textAlign: 'left', fontFamily: F, fontSize: 13, fontWeight: 600, color: '#1f3a22' };
const tcBody = { flex: 1, textAlign: 'center', fontFamily: MONO, fontSize: 12, color: '#333' };
const numCircle = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: '50%', color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: F };
const instrument = { display: 'flex', justifyContent: 'center', gap: 26, marginTop: 10, padding: '8px 0', background: 'rgba(0,0,0,0.03)', borderRadius: 10, fontFamily: MONO, fontSize: 13, color: '#2e7d32' };
const intervalCard = { flex: '0 0 auto', minWidth: 180, background: 'rgba(255,255,255,0.88)', borderRadius: 12, padding: '12px 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', animation: 'fadeInUp 0.2s cubic-bezier(0.25,0.46,0.45,0.94)' };
const clearBtn = { width: 30, height: 30, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.9)', color: '#c0392b', border: '1px solid rgba(0,0,0,0.08)' };
const hint = { fontFamily: F, fontSize: 12.5, color: '#8a6d3b', background: 'rgba(255,235,180,0.5)', padding: '7px 12px', borderRadius: 8, textAlign: 'center' };
const ddBtn = { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '9px 12px', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.12)', background: '#fff', fontFamily: F, fontSize: 13, color: '#333', cursor: 'pointer' };
const ddList = { position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', padding: 4, zIndex: 10, maxHeight: 220, overflowY: 'auto' };
const resetBtn = { fontFamily: F, fontSize: 11.5, color: '#4a7a2c', background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.4)', borderRadius: 8, padding: '3px 10px', cursor: 'pointer', fontWeight: 600 };
const emptyCta = { height: 54, padding: '0 40px', background: '#4a9e2f', color: '#fff', border: 'none', borderRadius: 100, fontSize: 15, fontWeight: 600, letterSpacing: 0.4, cursor: 'pointer', fontFamily: F, transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1), background 0.25s' };
const btnPrimary = { position: 'relative', overflow: 'hidden', height: 50, background: '#4a9e2f', color: '#fff', border: 'none', borderRadius: 100, fontSize: 14, fontWeight: 600, letterSpacing: 0.4, cursor: 'pointer', fontFamily: F, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(74,158,47,0.4), inset 0 1px 0 rgba(255,255,255,0.18)', transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1), background 0.25s, box-shadow 0.25s' };
const btnOutline = { height: 50, background: 'rgba(255,255,255,0.85)', color: '#3a7a28', border: '1.5px solid #4caf50', borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: F, backdropFilter: 'blur(8px)', transition: 'background 0.2s, transform 0.22s cubic-bezier(0.34,1.56,0.64,1)' };
