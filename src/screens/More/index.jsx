import React, { useState } from 'react';
import { useStore } from '../../store/useStore.js';
import PageLabel from '../../components/PageLabel/index.jsx';
import PhysicsDoc from '../../components/PhysicsDoc/index.jsx';

const ITEMS = [
  { id: 'compare', label: 'Сравнение запусков', icon: '⇆' },
  { id: 'docs', label: 'Документация физики', icon: '∫' },
  { id: 'about', label: 'О приложении', icon: 'ⓘ' },
  { id: 'support', label: 'Поддержка', icon: '✉' },
];

export default function More() {
  const [view, setView] = useState('list');
  const clearHistory = useStore(s => s.clearHistory);
  const history = useStore(s => s.history);

  if (view === 'docs') {
    return <PhysicsDoc onBack={() => setView('list')} />;
  }
  if (view !== 'list') {
    return <Detail view={view} onBack={() => setView('list')} />;
  }

  return (
    <div className="screen screen-light">
      <PageLabel icon="more" text="Ещё" />
      <div style={{ padding: '3.2rem 1.25rem 2rem', maxWidth: 600, margin: '0 auto' }}>

        <div className="card" style={{ background: 'white', padding: 0, margin: 0 }}>
          {ITEMS.map((item, i) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                padding: '1rem 1.25rem',
                borderBottom: i < ITEMS.length - 1 ? '1px solid #f0ece4' : 'none',
                textAlign: 'left',
              }}
            >
              <div style={{ width: 36, height: 36, background: '#EAF3DE', borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#4a9e2f' }}>
                {item.icon}
              </div>
              <span style={{ flex: 1, fontSize: 15 }}>{item.label}</span>
              <span className="muted">›</span>
            </button>
          ))}
        </div>

        {history.length > 0 && (
          <button
            onClick={() => { if (confirm('Очистить всю историю?')) clearHistory(); }}
            style={{ marginTop: 24, width: '100%', padding: '0.9rem',
              background: 'rgba(229,57,53,0.08)', color: '#c62828', borderRadius: 12, fontWeight: 500 }}>
            Очистить историю
          </button>
        )}

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <img src="/images/logopol.png" height="48"
            style={{ display: 'inline-block', objectFit: 'contain' }} alt="Политех" />
          <div className="muted" style={{ marginTop: 12, fontSize: 12 }}>
            RocketSim v1.0 · СПбПУ
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ view, onBack }) {
  return (
    <div className="screen screen-light">
      <div style={{ padding: '1.5rem 1.25rem', maxWidth: 700, margin: '0 auto' }}>
        <button onClick={onBack} style={{ color: '#4a9e2f', fontSize: 14, marginBottom: 20 }}>
          ‹ Назад
        </button>
        {view === 'about' && <About />}
        {view === 'support' && <Support />}
        {view === 'compare' && <Compare />}
      </div>
    </div>
  );
}

function About() {
  return (
    <div>
      <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.6rem', fontWeight: 400, marginBottom: 14 }}>
        О приложении
      </h2>
      <div className="card" style={{ background: 'white' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <img src="/images/logopol.png" height="56"
            style={{ display: 'inline-block', objectFit: 'contain' }} alt="Политех" />
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          <strong>RocketSim</strong> - симулятор водяной ракеты с физикой 5 фаз.
          Разработано для СПбПУ (Санкт-Петербургский Политехнический Университет).
        </p>
        <div className="muted" style={{ fontSize: 12, marginTop: 12 }}>
          Версия 1.0 · 2026
        </div>
      </div>
    </div>
  );
}

function Support() {
  return (
    <div>
      <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.6rem', fontWeight: 400, marginBottom: 14 }}>
        Поддержка
      </h2>
      <div className="card" style={{ background: 'white' }}>
        <p style={{ fontSize: 14, marginBottom: 12 }}>Связь с разработчиком:</p>
        <a href="mailto:rocketsim@spbpu.ru" style={{ color: '#4a9e2f', fontSize: 14, fontWeight: 600 }}>
          rocketsim@spbpu.ru
        </a>
      </div>
    </div>
  );
}

function Compare() {
  const history = useStore(s => s.history);
  const [a, setA] = useState(null);
  const [b, setB] = useState(null);
  return (
    <div>
      <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.6rem', fontWeight: 400, marginBottom: 14 }}>
        Сравнение
      </h2>
      {history.length < 2 ? (
        <div className="card" style={{ background: 'white' }}>
          <p className="muted" style={{ fontSize: 14 }}>Нужно минимум 2 сохранённых запуска.</p>
        </div>
      ) : (
        <div className="card" style={{ background: 'white' }}>
          <Select label="Запуск A" history={history} value={a} onChange={setA} />
          <Select label="Запуск B" history={history} value={b} onChange={setB} />
          {a && b && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
              <Box title="A" h={a.result.maxHeight} />
              <Box title="B" h={b.result.maxHeight} />
              <div style={{ gridColumn: 'span 2', textAlign: 'center', marginTop: 8 }}>
                Δ = <strong style={{ color: b.result.maxHeight > a.result.maxHeight ? '#4a9e2f' : '#c62828' }}>
                  {(b.result.maxHeight - a.result.maxHeight).toFixed(1)} м
                </strong>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Select({ label, history, value, onChange }) {
  const [open, setOpen] = useState(false);
  const txt = value ? `${value.date} · ${value.result.maxHeight.toFixed(1)} м` : '— выбрать —';
  return (
    <div style={{ marginBottom: 12, position: 'relative' }}>
      <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>{label}</div>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          padding: '0.6rem 0.75rem', borderRadius: 10, border: '1px solid #ddd', background: 'white',
          fontSize: 14, color: value ? '#333' : '#999', cursor: 'pointer', textAlign: 'left',
          fontFamily: 'var(--font-body)' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txt}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff',
          borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.14)', padding: 4, zIndex: 20, maxHeight: 220, overflowY: 'auto' }}>
          <Opt active={!value} label="— выбрать —" onClick={() => { onChange(null); setOpen(false); }} />
          {history.map(h => (
            <Opt key={h.id} active={value?.id === h.id} label={`${h.date} · ${h.result.maxHeight.toFixed(1)} м`}
              onClick={() => { onChange(h); setOpen(false); }} />
          ))}
        </div>
      )}
    </div>
  );
}

function Opt({ active, label, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        padding: '8px 10px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)',
        background: active ? 'rgba(76,175,80,0.20)' : (hover ? 'rgba(76,175,80,0.12)' : 'transparent'),
        color: active ? '#1b5e20' : (hover ? '#2e7d32' : '#333'),
        transition: 'background 0.12s, color 0.12s' }}>
      <span>{label}</span>
      {active && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-11" /></svg>}
    </div>
  );
}

function Box({ title, h }) {
  return (
    <div style={{ background: '#EAF3DE', borderRadius: 12, padding: '0.9rem', textAlign: 'center' }}>
      <div className="muted" style={{ fontSize: 12 }}>{title}</div>
      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1.8rem', color: '#4a9e2f' }}>{h.toFixed(1)} м</div>
    </div>
  );
}
